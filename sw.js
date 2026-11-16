// Bump CACHE_VERSION whenever you change any cached file so users get the update.
const CACHE_VERSION = "v3";
const CACHE = "feelings-wheel-" + CACHE_VERSION;

// Same-origin app shell.
const LOCAL = ["./", "index.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

// CDN libraries the page needs to render. Keep these URLs identical to the <script> tags in index.html.
const CDN = [
  "https://cdn.tailwindcss.com/3.4.17",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js"
];
const CDN_HOSTS = ["cdn.tailwindcss.com", "cdnjs.cloudflare.com"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(LOCAL);
    // no-cors lets us store the CDN scripts even though they are cross-origin.
    await Promise.all(CDN.map(async (url) => {
      try { await cache.put(url, await fetch(new Request(url, { mode: "no-cors" }))); } catch (e) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("feelings-wheel-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Page loads: network first (fresh when online), cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("index.html", copy)); return res; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // CDN libraries: cache first. Pinned versions never change, so no refresh needed.
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req.url).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req.url, copy));
        return res;
      }))
    );
    return;
  }

  // Other same-origin files: cached copy instantly, refreshed in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const refresh = fetch(req)
          .then((res) => { if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; })
          .catch(() => hit);
        return hit || refresh;
      })
    );
  }
});
