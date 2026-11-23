// Bump CACHE_VERSION whenever you change any file, so installed copies update.
// When a new worker takes over, the page shows a "new version" bar with a Reload button.
var CACHE_VERSION = "v20";
var CACHE = "feelings-wheel-" + CACHE_VERSION;
var SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png",
  "icon-maskable-512.png", "apple-touch-icon-180.png", "favicon-32.png"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("feelings-wheel-") === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Network first, so a fresh deploy shows up; the saved copy is used when offline.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || (req.mode === "navigate" ? caches.match("index.html") : undefined); });
  }));
});
