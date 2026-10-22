/* =====================================================================
   RDZ · sw-memo.js · 2026-10-22
   Rend Mémo sites ouvrable sans réseau (sous-sol, parking, cage d'escalier).

   Ne s'occupe QUE de memo-sites.html et de la bibliothèque Supabase qu'elle
   charge : toutes les autres pages de application/ passent sans être
   touchées. Réseau d'abord, copie locale seulement si le réseau ne répond
   pas : un agent avec du signal a toujours la dernière version.

   Les fiches elles-mêmes ne passent PAS par ici : elles sont gardées par
   la page, liées à l'agent connecté, et effacées à la fin de service.
   ===================================================================== */
const CACHE = 'rdz-memo-v1';
const PAGE = new URL('memo-sites.html', self.registration.scope).href;
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled([c.add(PAGE), c.add(new Request(LIB, { mode: 'no-cors' }))]))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(n => Promise.all(n.filter(k => k.startsWith('rdz-memo-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url.split('#')[0].split('?')[0];
  if (url !== PAGE && url !== LIB) return;          // tout le reste : pas concerné

  e.respondWith(
    fetch(req).then(rep => {
      if (rep && (rep.ok || rep.type === 'opaque')) {
        const copie = rep.clone();
        caches.open(CACHE).then(c => c.put(url, copie));
      }
      return rep;
    }).catch(() => caches.match(url).then(c => c || Response.error()))
  );
});
