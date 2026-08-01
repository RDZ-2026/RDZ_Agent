/* ============================================================================
   RDZ · rdz-sync · v3 · file d'attente hors-ligne PARTAGÉE entre tous les modules
   ----------------------------------------------------------------------------
   v3 : chaque photo peut désormais cibler SON PROPRE champ de destination
   (photos:[{name,dataUrl,field}]) — nécessaire pour les modules à plusieurs
   photos visant des colonnes différentes (ex. photo_vehicule_url,
   photo_denonciation_url... dans ParkGuard). `photoField` au niveau de save()
   reste utilisable comme valeur par défaut si une photo ne précise pas `field`.
   ----------------------------------------------------------------------------
   v2 : séparation TEXTE / PHOTOS.
     - Le TEXTE (la ligne de données) part automatiquement dès qu'il y a
       n'importe quel réseau (4G/5G/WiFi) — c'est la remontée à la direction,
       elle doit arriver vite et elle coûte quasi rien en data.
     - Les PHOTOS sont mises de côté et ne partent PAS automatiquement en
       réseau mobile : elles attendent soit le WiFi (best-effort, selon
       navigateur), soit un appui manuel de l'agent sur "Envoyer les photos".
       Tant qu'elles n'ont pas été envoyées, l'agent peut voir "n photo(s)
       en attente de WiFi" sans que ça bloque quoi que ce soit d'autre.
   Deux files persistées dans localStorage, partagées entre TOUS les modules :
     rdz_sync_queue        -> lignes de texte en attente d'envoi
     rdz_sync_photo_queue  -> photos en attente d'upload (liées à une ligne déjà envoyée)
     rdz_sync_log          -> historique des 30 derniers éléments envoyés (visibilité agent)
   ----------------------------------------------------------------------------
   Usage :
     RDZSync.init({ client: supabase });
     RDZSync.save({
       module: 'parkguard', table: 'vehicles', row: {...},
       bucket: 'parkguard-photos', photoField: 'photo_vehicule_url', // valeur par défaut
       photos: [
         { name:'p1.jpg', dataUrl:'data:image/...', field:'photo_vehicule_url' },
         { name:'p2.jpg', dataUrl:'data:image/...', field:'photo_denonciation_url' }
       ]
     });
     RDZSync.flushPhotos(true);   // forcer l'envoi des photos (bouton manuel)
     RDZSync.getStatus();         // { textPending, photoPending, log, isWifi }
   ============================================================================ */
(function (global) {
  'use strict';

  var Q_TEXT = 'rdz_sync_queue';
  var Q_PHOTO = 'rdz_sync_photo_queue';
  var Q_LOG = 'rdz_sync_log';
  var LOG_MAX = 30;

  var _client = null;
  var _onChange = null;
  var _flushingText = false;
  var _flushingPhotos = false;

  function readLS(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; } }
  function writeLS(key, arr) { try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {} notify(); }

  function notify() {
    var st = getStatus();
    if (typeof _onChange === 'function') { try { _onChange(st); } catch (e) {} }
    renderBadge(st);
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(',');
    var mime = (parts[0].match(/:(.*?);/) || [, 'application/octet-stream'])[1];
    var bin = atob(parts[1]); var n = bin.length; var u8 = new Uint8Array(n);
    while (n--) u8[n] = bin.charCodeAt(n);
    return new Blob([u8], { type: mime });
  }

  function pushLog(entry) {
    var log = readLS(Q_LOG);
    log.unshift(entry);
    if (log.length > LOG_MAX) log = log.slice(0, LOG_MAX);
    writeLS(Q_LOG, log);
  }

  /* ---------- détection WiFi (best-effort, jamais garantie) ---------- */
  function isWifi() {
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!c) return null;               // inconnu (iPhone/Safari notamment)
      if (typeof c.type === 'string') return c.type === 'wifi';
      if (typeof c.effectiveType === 'string') return null; // effectiveType = vitesse, pas le support
      return null;
    } catch (e) { return null; }
  }

  /* ---------- badge visuel ---------- */
  function ensureBadge() {
    var b = document.getElementById('rdz-sync-badge');
    if (b) return b;
    b = document.createElement('div');
    b.id = 'rdz-sync-badge';
    b.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:99999;' +
      'font:600 12.5px Arial,Helvetica,sans-serif;color:#fff;' +
      'background:#b8860b;padding:8px 12px;border-radius:2px;line-height:1.5;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.3);display:none;cursor:pointer;max-width:260px;';
    b.title = 'Cliquer pour forcer la synchronisation';
    b.onclick = function () { flushText(); flushPhotos(true); };
    document.body.appendChild(b);
    return b;
  }
  function renderBadge(st) {
    if (typeof document === 'undefined' || !document.body) return;
    var b = ensureBadge();
    var parts = [];
    if (st.textPending > 0) parts.push('⏳ ' + st.textPending + ' donnée(s) en attente de réseau');
    if (st.photoPending > 0) parts.push('📷 ' + st.photoPending + ' photo(s) en attente de WiFi');
    if (parts.length === 0) { b.style.display = 'none'; return; }
    b.innerHTML = parts.join('<br>');
    b.style.display = 'block';
  }

  /* ---------- API publique ---------- */
  function init(opts) {
    opts = opts || {};
    _client = opts.client || _client;
    if (typeof opts.onChange === 'function') _onChange = opts.onChange;
    if (typeof global.addEventListener === 'function') {
      global.addEventListener('online', function () { flushText(); tryAutoPhotos(); });
    }
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c && typeof c.addEventListener === 'function') {
        c.addEventListener('change', tryAutoPhotos);
      }
    } catch (e) {}
    if (typeof document !== 'undefined') {
      var start = function () { notify(); flushText(); tryAutoPhotos(); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
      else start();
    }
    return API;
  }

  function tryAutoPhotos() { if (isWifi() === true) flushPhotos(false); }

  /* save() : NON bloquant. Le texte est mis en file et une tentative
     d'envoi part immédiatement (auto, sur n'importe quel réseau).
     Les photos sont mises de côté et attendent le WiFi ou un geste manuel. */
  function save(item) {
    var textEntry = {
      id: uid(),
      module: item.module || 'inconnu',
      table: item.table,
      op: item.op || 'insert',
      onConflict: item.onConflict || null,
      row: Object.assign({}, item.row || {}),
      photoField: item.photoField || null,
      bucket: item.bucket || null,
      pendingPhotos: item.photos || [],   // gardées ici jusqu'à ce que le texte soit parti
      ts: new Date().toISOString(),
      tries: 0
    };
    var q = readLS(Q_TEXT); q.push(textEntry); writeLS(Q_TEXT, q);
    setTimeout(flushText, 0);
    return textEntry.id;
  }

  /* ---------- file TEXTE : envoi auto, tout réseau ---------- */
  function flushText() {
    if (_flushingText || !_client) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    _flushingText = true;
    var q = readLS(Q_TEXT); var i = 0;

    function next() {
      if (i >= q.length) { _flushingText = false; return; }
      var it = q[i];
      var qb = _client.from(it.table);
      var req = (it.op === 'upsert')
        ? qb.upsert(it.row, it.onConflict ? { onConflict: it.onConflict } : undefined).select()
        : qb.insert(it.row).select();

      req.then(function (res) {
        if (res && res.error) throw res.error;
        var savedRow = (res.data && res.data[0]) || null;
        // succès texte : retirer de la file texte + logguer
        var cur = readLS(Q_TEXT);
        var idx = cur.findIndex(function (x) { return x.id === it.id; });
        if (idx > -1) cur.splice(idx, 1);
        writeLS(Q_TEXT, cur);
        pushLog({ ts: new Date().toISOString(), module: it.module, table: it.table, kind: 'texte', ok: true });

        // s'il y avait des photos en attente, les basculer dans la file photo
        // maintenant qu'on connaît l'id de la ligne créée
        if (it.pendingPhotos && it.pendingPhotos.length && savedRow && savedRow.id != null) {
          var pq = readLS(Q_PHOTO);
          it.pendingPhotos.forEach(function (p) {
            pq.push({
              id: uid(), module: it.module, table: it.table, rowId: savedRow.id,
              bucket: it.bucket, field: p.field || it.photoField, name: p.name || 'photo.jpg',
              dataUrl: p.dataUrl, ts: new Date().toISOString(), tries: 0
            });
          });
          writeLS(Q_PHOTO, pq);
          tryAutoPhotos();
        }
        i++; next();
      }).catch(function () {
        var cur = readLS(Q_TEXT);
        var idx = cur.findIndex(function (x) { return x.id === it.id; });
        if (idx > -1) { cur[idx].tries = (cur[idx].tries || 0) + 1; writeLS(Q_TEXT, cur); }
        _flushingText = false; // réseau probablement absent : on retentera au prochain online/ouverture
      });
    }
    next();
  }

  /* ---------- file PHOTOS : envoi WiFi (best-effort) ou manuel (force=true) ---------- */
  function flushPhotos(force) {
    if (_flushingPhotos || !_client) return;
    if (!force && isWifi() !== true) return; // pas de WiFi détecté et pas d'appui manuel -> on attend
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    _flushingPhotos = true;
    var q = readLS(Q_PHOTO); var i = 0;

    function next() {
      if (i >= q.length) { _flushingPhotos = false; return; }
      var p = q[i];
      var path = p.module + '/' + Date.now() + '_' + p.name;
      var blob = dataUrlToBlob(p.dataUrl);
      _client.storage.from(p.bucket).upload(path, blob, { upsert: true })
        .then(function (res) {
          if (res && res.error) throw res.error;
          var pub = _client.storage.from(p.bucket).getPublicUrl(path);
          var url = pub && pub.data ? pub.data.publicUrl : null;
          var patch = {}; patch[p.field] = url;
          return _client.from(p.table).update(patch).eq('id', p.rowId);
        })
        .then(function (res) {
          if (res && res.error) throw res.error;
          var cur = readLS(Q_PHOTO);
          var idx = cur.findIndex(function (x) { return x.id === p.id; });
          if (idx > -1) cur.splice(idx, 1);
          writeLS(Q_PHOTO, cur);
          pushLog({ ts: new Date().toISOString(), module: p.module, table: p.table, kind: 'photo', ok: true });
          i++; next();
        })
        .catch(function () {
          var cur = readLS(Q_PHOTO);
          var idx = cur.findIndex(function (x) { return x.id === p.id; });
          if (idx > -1) { cur[idx].tries = (cur[idx].tries || 0) + 1; writeLS(Q_PHOTO, cur); }
          _flushingPhotos = false;
        });
    }
    next();
  }

  function getStatus() {
    return {
      textPending: readLS(Q_TEXT).length,
      photoPending: readLS(Q_PHOTO).length,
      log: readLS(Q_LOG),
      isWifi: isWifi()
    };
  }

  var API = {
    init: init, save: save, flushText: flushText, flushPhotos: flushPhotos,
    getStatus: getStatus, QUEUE_KEYS: { text: Q_TEXT, photo: Q_PHOTO, log: Q_LOG }
  };
  (typeof window !== 'undefined' ? window : global).RDZSync = API;
})(typeof window !== 'undefined' ? window : this);
