const CACHE = "little-letters-public-v1";
// Only public assets are cached. Never cache letters, API responses, or credentials.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/offline.html",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("little-letters-public-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html")),
    );
  } else if (
    new URL(event.request.url).origin === self.location.origin &&
    ["/icons/icon-192.png", "/icons/icon-512.png"].includes(
      new URL(event.request.url).pathname,
    )
  ) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request)),
    );
  }
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    /* A generic notification is still shown. */
  }
  const path = /^\/letters\/[a-f0-9-]{36}$/i.test(data.url) ? data.url : "/";
  event.waitUntil(
    Promise.all([
      self.registration.showNotification("You got mail!", {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: path === "/" ? "little-letters" : path,
        data: { url: path },
      }),
      self.navigator.setAppBadge
        ? self.navigator.setAppBadge().catch(() => {})
        : Promise.resolve(),
    ]),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = /^\/letters\/[a-f0-9-]{36}$/i.test(event.notification.data?.url)
    ? event.notification.data.url
    : "/";
  const url = new URL(path, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          try {
            const navigated = await client.navigate(url);
            return await (navigated || client).focus();
          } catch {}
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
