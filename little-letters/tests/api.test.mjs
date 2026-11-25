import { test } from "node:test";
import assert from "node:assert/strict";
import endpoint, { handleLetters } from "../api/letters.js";
import { validateEndpoint } from "../server/notifications.js";
const id = "10000000-0000-4000-8000-000000000001";
test("anonymous API requests are rejected before database access", async () => {
  const res = {
    setHeader() {},
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };
  await endpoint({ method: "GET", headers: {}, url: "/api/letters" }, res);
  assert.equal(res.code, 401);
  assert.equal(res.body.error, "Please sign in.");
});
for (const action of ["save", "publish", "edit_sent", "retry"])
  test(`reader cannot ${action}`, async () => {
    await assert.rejects(
      handleLetters(
        { method: "POST", url: "/api/letters", body: { action, id } },
        { db: null, member: { role: "reader" } },
      ),
      (e) => e.status === 403,
    );
  });
test("reader cannot list drafts or delete letters", async () => {
  await assert.rejects(
    handleLetters(
      { method: "GET", url: "/api/letters?status=draft" },
      { db: null, member: { role: "reader" } },
    ),
    (e) => e.status === 403,
  );
  await assert.rejects(
    handleLetters(
      { method: "DELETE", url: `/api/letters?id=${id}` },
      { db: null, member: { role: "reader" } },
    ),
    (e) => e.status === 403,
  );
});
test("administrator previews never change read state", async () => {
  assert.deepEqual(
    await handleLetters(
      { method: "POST", url: "/api/letters", body: { action: "read", id } },
      { db: null, member: { role: "admin" } },
    ),
    { skipped: true },
  );
});
test("push subscriptions cannot turn the server into an arbitrary URL fetcher", () => {
  for (const url of [
    "https://localhost/test",
    "http://web.push.apple.com/test",
    "https://web.push.apple.com.evil.test/x",
    "https://127.0.0.1/x",
    "https://web.push.apple.com:444/x",
    "https://user@fcm.googleapis.com/test",
  ])
    assert.throws(() => validateEndpoint(url));
  assert.equal(
    validateEndpoint("https://web.push.apple.com/test"),
    "https://web.push.apple.com/test",
  );
  assert.equal(
    validateEndpoint("https://fcm.googleapis.com/test"),
    "https://fcm.googleapis.com/test",
  );
});
