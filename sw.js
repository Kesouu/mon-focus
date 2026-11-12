// Mon Focus : fonctionnement hors connexion
const V = "monfocus-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const url = new URL(r.url);
  // Page : réseau d'abord (pour recevoir les mises à jour), sinon la copie gardée
  if (r.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith(".html"))){
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(k => k.put("index.html", c)); return res; }).catch(() => caches.match("index.html").then(x => x || caches.match("./"))));
    return;
  }
  // Le reste (icônes, polices) : copie gardée d'abord
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque"){ const c = res.clone(); caches.open(V).then(k => k.put(r, c)); } return res; })));
  }
});
