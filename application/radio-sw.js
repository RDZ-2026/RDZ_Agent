/* RDZ · radio-sw · v1 · 2026-11-04
   Petit service worker de l'application (dossier application/), utilisé UNIQUEMENT
   pour afficher les notifications système de la radio (nouveau vocal, alerte SOS)
   via registration.showNotification — seul moyen accepté par Chrome Android.
   Il n'intercepte AUCUNE requête réseau (pas de gestionnaire fetch, pas de cache) :
   les pages se chargent exactement comme avant.
   Toucher la notification ouvre (ou ramène au premier plan) la bonne page. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || 'mobile.html', self.registration.scope).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope)) {
        try { if (c.navigate) { const w = await c.navigate(target); if (w) return w.focus(); } } catch (err) {}
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
