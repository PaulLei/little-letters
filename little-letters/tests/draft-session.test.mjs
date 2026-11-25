import { test } from "node:test";
import assert from "node:assert/strict";
import { DraftSession } from "../src/lib/DraftSession.js";

const content = {
  title: "Tuesday",
  body: "Hello",
  greeting: "Dear friend,",
  signature: "Me",
  stationeryStyle: "cream",
};
test("publish waits for an in-flight autosave and uses the resulting version", async () => {
  const calls = [];
  let release;
  const session = new DraftSession(async (input) => {
    calls.push(input);
    if (input.action === "save") await new Promise((r) => (release = r));
    return {
      letter: {
        id: input.id,
        version: input.version + 1,
        status: input.action === "publish" ? "sent" : "draft",
      },
    };
  });
  const saving = session.save(content);
  await new Promise((r) => setImmediate(r));
  const sending = session.publish({ ...content, body: "Final words" });
  const duplicate = session.publish(content);
  assert.equal(sending, duplicate);
  assert.equal(calls.length, 1);
  release();
  await Promise.all([saving, sending]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].version, 1);
  assert.equal(calls[1].body, "Final words");
  assert.equal(session.status, "sent");
});
test("a new editor session gets a new ID, and a closed session rejects autosaves", async () => {
  const send = async (input) => ({
    letter: { id: input.id, version: 1, status: "sent" },
  });
  const first = new DraftSession(send);
  await first.publish(content);
  await assert.rejects(first.save(content), /sent/);
  const second = new DraftSession(send);
  assert.notEqual(first.id, second.id);
  assert.equal(second.version, 0);
});
test("failed sends can retry the same ID without inventing another letter", async () => {
  const calls = [];
  const session = new DraftSession(async (input) => {
    calls.push(input);
    if (calls.length === 1) throw new Error("Network lost");
    return { letter: { id: input.id, version: 1, status: "sent" } };
  });
  await assert.rejects(session.publish(content), /Network/);
  await session.publish(content);
  assert.equal(calls[0].id, calls[1].id);
});
