import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const admin = "10000000-0000-4000-8000-000000000001",
  reader = "10000000-0000-4000-8000-000000000002",
  stranger = "10000000-0000-4000-8000-000000000003";
const letter = "20000000-0000-4000-8000-000000000001",
  draft = "20000000-0000-4000-8000-000000000002";
const content = {
  title: "A little letter",
  greeting: "Hello",
  body: "Private words",
  signature: "Me",
  stationeryStyle: "cream",
};
const mutate = async (id, version, action, body = content) =>
  (
    await db.query("select public.save_letter($1,$2::jsonb,$3,$4) as letter", [
      id,
      JSON.stringify(body),
      version,
      action,
    ])
  ).rows[0].letter;
before(async () => {
  await db.exec(
    `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  await db.exec(
    await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
  );
  await db.query(
    "insert into auth.users(id,email) values ($1,$2),($3,$4),($5,$6)",
    [
      admin,
      "writer@example.com",
      reader,
      "reader@example.com",
      stranger,
      "stranger@example.com",
    ],
  );
  await db.query(
    "insert into public.members(user_id,role) values ($1,'admin'),($2,'reader')",
    [admin, reader],
  );
});
after(() => db.close());
test("database protects publication, privacy, and retries", async (t) => {
  await t.test(
    "save and publish keep one row and a stable sent time",
    async () => {
      const saved = await mutate(letter, 0, "save");
      assert.equal(saved.version, 1);
      const sent = await mutate(letter, 1, "publish");
      assert.equal(sent.status, "sent");
      const replay = await mutate(letter, 1, "publish", {
        ...content,
        body: "This replay must not replace the letter",
      });
      assert.equal(replay.sent_at, sent.sent_at);
      assert.equal(replay.body, "Private words");
      assert.equal(replay.version, 2);
      assert.equal(
        (await db.query("select count(*)::int as n from letters")).rows[0].n,
        1,
      );
    },
  );
  await t.test(
    "late autosaves cannot overwrite sent letters; stale edits conflict",
    async () => {
      await assert.rejects(
        mutate(letter, 2, "save", { ...content, body: "Late autosave" }),
        /sent/,
      );
      await assert.rejects(mutate(letter, 1, "edit_sent"), /changed elsewhere/);
      const original = (
        await db.query("select sent_at from letters where id=$1", [letter])
      ).rows[0].sent_at;
      const edited = await mutate(letter, 2, "edit_sent", {
        ...content,
        body: "An intentional correction",
      });
      assert.equal(
        new Date(edited.sent_at).getTime(),
        new Date(original).getTime(),
      );
      assert.equal(edited.notification_status, "pending");
      await mutate(draft, 0, "save");
    },
  );
  await t.test("notification lease prevents concurrent retries", async () => {
    assert.equal(
      (await db.query("select claim_notification($1,false) as ok", [letter]))
        .rows[0].ok,
      true,
    );
    assert.equal(
      (await db.query("select claim_notification($1,true) as ok", [letter]))
        .rows[0].ok,
      false,
    );
    await db.query(
      "update letters set notification_status='accepted' where id=$1",
      [letter],
    );
    assert.equal(
      (await db.query("select claim_notification($1,true) as ok", [letter]))
        .rows[0].ok,
      false,
    );
  });
  await t.test(
    "reader sees sent mail only and cannot change content or role",
    async () => {
      await db.exec("set role authenticated");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        reader,
      ]);
      const rows = (await db.query("select id from letters")).rows;
      assert.deepEqual(
        rows.map((r) => r.id),
        [letter],
      );
      await assert.rejects(
        db.query("update letters set body='Hacked' where id=$1", [letter]),
        /permission denied/,
      );
      await assert.rejects(
        db.query("update members set role='admin'"),
        /permission denied/,
      );
      await assert.rejects(mutate(draft, 1, "publish"), /permission denied/);
      await assert.rejects(
        db.query("select * from push_subscriptions"),
        /permission denied/,
      );
      await db.exec("reset role");
    },
  );
  await t.test("uninvited authenticated user sees zero letters", async () => {
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      stranger,
    ]);
    assert.equal((await db.query("select * from letters")).rows.length, 0);
    await db.exec("reset role");
  });
  await t.test(
    "anonymous cannot read letters; admin can see drafts",
    async () => {
      await db.exec("set role anon");
      await assert.rejects(
        db.query("select * from letters"),
        /permission denied/,
      );
      await db.exec("reset role");
      await db.exec("set role authenticated");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        admin,
      ]);
      assert.equal((await db.query("select * from letters")).rows.length, 2);
      await db.exec("reset role");
    },
  );
});
