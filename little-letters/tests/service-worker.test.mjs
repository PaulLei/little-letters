import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const code = await readFile(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
function worker() {
  const listeners = {},
    shown = [],
    opened = [];
  const self = {
    location: { origin: "https://letters.example" },
    navigator: {},
    registration: {
      showNotification: async (title, options) =>
        shown.push({ title, options }),
    },
    clients: {
      matchAll: async () => [],
      openWindow: async (url) => opened.push(url),
    },
    addEventListener: (name, callback) => (listeners[name] = callback),
  };
  vm.runInNewContext(code, { self, URL, Promise });
  return { listeners, shown, opened };
}
test("push always displays generic content and rejects external deep links", async () => {
  const { listeners, shown } = worker();
  let done;
  listeners.push({
    data: {
      json: () => ({
        title: "Private letter content",
        url: "https://evil.example",
      }),
    },
    waitUntil: (p) => (done = p),
  });
  await done;
  assert.equal(shown[0].title, "You got mail!");
  assert.equal(shown[0].options.data.url, "/");
  assert.equal(shown[0].options.body, undefined);
});
test("notification tap opens only a same-origin letter URL", async () => {
  const { listeners, opened } = worker();
  let done;
  const path = "/letters/10000000-0000-4000-8000-000000000001";
  listeners.notificationclick({
    notification: { close() {}, data: { url: path } },
    waitUntil: (p) => (done = p),
  });
  await done;
  assert.equal(opened[0], `https://letters.example${path}`);
});
test("service worker does not intercept private API requests", () => {
  const { listeners } = worker();
  let intercepted = false;
  listeners.fetch({
    request: { mode: "cors", url: "https://letters.example/api/letters" },
    respondWith: () => (intercepted = true),
  });
  assert.equal(intercepted, false);
});
