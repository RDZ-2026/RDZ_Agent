// RDZ · rdz-sync · v5 · 2026-09-24
// Brique commune de synchronisation hors-ligne, partagée par tous les modules agents.
// À coller telle quelle dans chaque module agent qui écrit dans Supabase (sauf exception
// « collision en direct »). Variante réduite : SANS le badge flottant auto-rendu — chaque
// module a déjà son propre indicateur ; garder tout le reste identique.
//
// ── Nouveautés v5 (vs v4) ────────────────────────────────────────────────────────────────
// 1. PHOTOS EN « GRANDE MÉMOIRE » (IndexedDB) au lieu de localStorage.
//    Bug corrigé : localStorage est plafonné à ~5 Mo. Au-delà de 7-8 photos en attente,
//    l'écriture échouait (QuotaExceededError) et la photo était PERDUE. Désormais seuls les
//    OCTETS (dataURL) des photos vont en IndexedDB (centaines de Mo) ; la petite fiche de
//    suivi (module/table/rowId/champ/tentatives) reste en localStorage sous
//    'rdz_sync_photo_queue'. Conséquence importante : les compteurs et le détail affichés par
//    fin-de-service.html et admin/reset-sync.html continuent de fonctionner SANS changement,
//    car ils lisent ces fiches légères. La photo est copiée en grande mémoire DÈS la prise de
//    vue (dans save()), avant toute tentative d'envoi → plus aucune perte possible ensuite.
// 2. PROGRESSION + INTERRUPTION/REPRISE. getStatus() expose désormais : photoSending,
//    photoDone, photoTotal, photoStopped. stopPhotos() interrompt proprement APRÈS la photo
//    en cours (jamais au milieu d'un fichier). Reprendre = rappeler flushPhotos(true).
// 3. EFFACEMENT APRÈS CONFIRMATION SERVEUR (principe inchangé, désormais explicite) : une
//    photo n'est retirée de la file ET supprimée de la grande mémoire QU'APRÈS confirmation
//    du serveur (upload + mise à jour de la ligne réussis). Rien n'est effacé « en aveugle ».
// 4. REPLI SÛR : si IndexedDB est indisponible (navigateur exotique / mode privé), on retombe
//    automatiquement sur l'ancien comportement (octets en localStorage) — jamais de perte.
//
// Transport (inchangé — option B, coût mini) : le TEXTE part sur TOUT réseau (4G/5G/WiFi).
// Les PHOTOS partent automatiquement sur WiFi ; sur réseau mobile elles ne partent QUE sur
// action forcée — bouton manuel ou envoi de fin de service — via flushPhotos(true).
//
// API : RDZSync.init({client,onChange}), save({module,table,row,op?,onConflict?,photoField?,
//   bucket?,photos:[{name,dataUrl,field?}]}), flushText(), flushPhotos(force), stopPhotos(),
//   getStatus() -> {textPending, photoPending, photoSending, photoStopped, photoDone,
//   photoTotal, log, isWifi}.
(function (global) {
  'use strict';
  var Q_TEXT = 'rdz_sync_queue', Q_PHOTO = 'rdz_sync_photo_queue', Q_LOG = 'rdz_sync_log', LOG_MAX = 30;
  var _client = null, _onChange = null, _flushingText = false, _flushingPhotos = false;
  var _photoStop = false, _run = { done: 0 };

  // ── Grande mémoire (IndexedDB) : ne stocke QUE les octets des photos, clé = id de la photo ──
  var IDB_NAME = 'rdz_sync_idb', IDB_STORE = 'photo_blobs', _idb = null, _idbFail = false;
  function idbOpen(cb) {
    if (_idb) return cb(_idb);
    if (_idbFail || typeof indexedDB === 'undefined') return cb(null);
    try {
      var rq = indexedDB.open(IDB_NAME, 1);
      rq.onupgradeneeded = function () { var d = rq.result; if (!d.objectStoreNames.contains(IDB_STORE)) d.createObjectStore(IDB_STORE); };
      rq.onsuccess = function () { _idb = rq.result; cb(_idb); };
      rq.onerror = function () { _idbFail = true; console.warn('RDZSync: IndexedDB indisponible, repli localStorage', rq.error); cb(null); };
    } catch (e) { _idbFail = true; cb(null); }
  }
  function idbPut(key, val, done) { idbOpen(function (d) { if (!d) return done(false); try { var tx = d.transaction(IDB_STORE, 'readwrite'); tx.objectStore(IDB_STORE).put(val, key); tx.oncomplete = function () { done(true); }; tx.onerror = function () { done(false); }; } catch (e) { done(false); } }); }
  function idbGet(key, done) { idbOpen(function (d) { if (!d) return done(null); try { var tx = d.transaction(IDB_STORE, 'readonly'); var r = tx.objectStore(IDB_STORE).get(key); r.onsuccess = function () { done(r.result != null ? r.result : null); }; r.onerror = function () { done(null); }; } catch (e) { done(null); } }); }
  function idbDel(key, done) { idbOpen(function (d) { if (!d) return done && done(false); try { var tx = d.transaction(IDB_STORE, 'readwrite'); tx.objectStore(IDB_STORE).delete(key); tx.oncomplete = function () { done && done(true); }; tx.onerror = function () { done && done(false); }; } catch (e) { done && done(false); } }); }
  function idbAllKeys(done) { idbOpen(function (d) { if (!d) return done([]); try { var tx = d.transaction(IDB_STORE, 'readonly'); var r = tx.objectStore(IDB_STORE).getAllKeys(); r.onsuccess = function () { done(r.result || []); }; r.onerror = function () { done([]); }; } catch (e) { done([]); } }); }

  function readLS(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; } }
  function writeLS(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); notify(); return true; }
    catch (e) { console.warn('RDZSync: échec écriture locale (mémoire pleine ?)', key, e && (e.message || e)); notify(); return false; }
  }
  function notify() { var st = getStatus(); if (typeof _onChange === 'function') { try { _onChange(st); } catch (e) {} } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(','); var mime = (parts[0].match(/:(.*?);/) || [, 'application/octet-stream'])[1];
    var bin = atob(parts[1]); var n = bin.length; var u8 = new Uint8Array(n);
    while (n--) u8[n] = bin.charCodeAt(n);
    return new Blob([u8], { type: mime });
  }
  function pushLog(entry) { var log = readLS(Q_LOG); log.unshift(entry); if (log.length > LOG_MAX) log = log.slice(0, LOG_MAX); writeLS(Q_LOG, log); }
  function isWifi() {
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!c) return null;
      if (typeof c.type === 'string') return c.type === 'wifi';
      return null;
    } catch (e) { return null; }
  }

  // Nettoyage défensif des octets orphelins en grande mémoire (photos dont plus aucune fiche
  // n'existe — ex. file vidée via reset-sync). Exécuté à l'init.
  function gcOrphans() {
    idbAllKeys(function (keys) {
      if (!keys || !keys.length) return;
      var live = {};
      readLS(Q_PHOTO).forEach(function (p) { if (p && p.id) live[p.id] = 1; });
      readLS(Q_TEXT).forEach(function (t) { (t.pendingPhotos || []).forEach(function (p) { if (p && p.id) live[p.id] = 1; }); });
      keys.forEach(function (k) { if (!live[k]) idbDel(k); });
    });
  }

  function init(opts) {
    opts = opts || {};
    _client = opts.client || _client;
    if (typeof opts.onChange === 'function') _onChange = opts.onChange;
    if (typeof global.addEventListener === 'function') global.addEventListener('online', function () { flushText(); tryAutoPhotos(); });
    try {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (c && typeof c.addEventListener === 'function') c.addEventListener('change', tryAutoPhotos);
    } catch (e) {}
    gcOrphans();
    flushText(); tryAutoPhotos(); notify();
    return API;
  }
  function tryAutoPhotos() { if (isWifi() === true) flushPhotos(false); }

  function save(item) {
    var bucket = item.bucket || null;
    var photoField = item.photoField || null;
    var incoming = item.photos || [];
    // Fiches légères (SANS octets) attachées au texte : {id, field, name}. Les octets (dataURL)
    // sont copiés TOUT DE SUITE en grande mémoire (IndexedDB), clé = id de la photo. En repli
    // (IndexedDB indisponible), on garde les octets inline dans la fiche (ancien comportement).
    var pending = incoming.map(function (p) {
      var pid = uid();
      var meta = { id: pid, field: p.field || photoField, name: p.name || 'photo.jpg' };
      idbPut(pid, p.dataUrl, function (ok) { if (!ok) { meta.dataUrl = p.dataUrl; } });
      return meta;
    });
    var textEntry = {
      id: uid(),
      module: item.module || 'inconnu', table: item.table, op: item.op || 'insert',
      onConflict: item.onConflict || null, row: Object.assign({}, item.row || {}),
      photoField: photoField, bucket: bucket,
      pendingPhotos: pending, ts: new Date().toISOString(), tries: 0
    };
    var q = readLS(Q_TEXT); q.push(textEntry);
    var ok = writeLS(Q_TEXT, q);
    if (!ok) {
      // Même le texte (léger) ne passe pas : la petite mémoire est vraiment saturée. Les photos
      // étant désormais en grande mémoire, retenter sans elles n'aide plus — on prévient l'agent.
      console.warn('RDZSync: échec d\'enregistrement local du texte (petite mémoire pleine) pour', item.table);
      if (global.toast) { try { global.toast('❌ Mémoire locale pleine — ce rapport n\'a PAS pu être enregistré, contactez le centraliste', 5000); } catch (e) {} }
      return null;
    }
    setTimeout(flushText, 0);
    return textEntry.id;
  }

  function flushText() {
    if (_flushingText || !_client) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    _flushingText = true; var q = readLS(Q_TEXT); var i = 0;
    function next() {
      if (i >= q.length) {
        _flushingText = false;
        if (readLS(Q_TEXT).length) setTimeout(flushText, 0);
        return;
      }
      var it = q[i]; var qb = _client.from(it.table);
      // Pas de .select() après écriture : ne dépend que du droit d'ÉCRITURE (voir piège n°6).
      var req = (it.op === 'upsert')
        ? qb.upsert(it.row, it.onConflict ? { onConflict: it.onConflict } : undefined)
        : qb.insert(it.row);
      req.then(function (res) {
        if (res && res.error) throw res.error;
        var cur = readLS(Q_TEXT); var idx = cur.findIndex(function (x) { return x.id === it.id; });
        if (idx > -1) cur.splice(idx, 1);
        writeLS(Q_TEXT, cur);
        pushLog({ ts: new Date().toISOString(), module: it.module, table: it.table, kind: 'texte', ok: true });
        var rowId = it.row && it.row.id != null ? it.row.id : null;
        if (it.pendingPhotos && it.pendingPhotos.length) {
          if (rowId == null) {
            console.warn('RDZSync: photos ignorées — aucun id fourni dans row.id pour', it.table);
          } else {
            // Le texte est confirmé côté serveur : les photos peuvent maintenant partir. On
            // déplace les fiches légères vers la file photo (les octets sont déjà en grande mémoire).
            var pq = readLS(Q_PHOTO);
            it.pendingPhotos.forEach(function (p) {
              pq.push({ id: p.id, module: it.module, table: it.table, rowId: rowId, bucket: it.bucket,
                        field: p.field || it.photoField, name: p.name || 'photo.jpg',
                        dataUrl: p.dataUrl || null, // non-null seulement en repli localStorage
                        ts: new Date().toISOString(), tries: 0 });
            });
            writeLS(Q_PHOTO, pq); tryAutoPhotos();
          }
        }
        i++; next();
      }).catch(function (err) {
        console.warn('RDZSync: échec écriture', it.module, it.table, err && (err.message || err));
        var cur = readLS(Q_TEXT); var idx = cur.findIndex(function (x) { return x.id === it.id; });
        if (idx > -1) { cur[idx].tries = (cur[idx].tries || 0) + 1; cur[idx].lastError = err && (err.message || String(err)) || null; writeLS(Q_TEXT, cur); }
        i++; next();
      });
    }
    next();
  }

  // Récupère les octets d'une photo : d'abord la grande mémoire (IndexedDB), sinon le repli
  // localStorage (champ dataUrl inline, présent uniquement si IndexedDB était indisponible).
  function getPhotoBytes(p, cb) {
    if (p.dataUrl) return cb(p.dataUrl);
    idbGet(p.id, function (v) {
      if (v) return cb(v);
      // Filet anti-course : dans un cas de timing extrême, la photo vient peut-être tout juste
      // d'être écrite en grande mémoire et n'est pas encore relisible. On retente une fois avant
      // de conclure qu'elle est introuvable (jamais de perte : la fiche reste en file).
      setTimeout(function () { idbGet(p.id, function (v2) { cb(v2 || null); }); }, 250);
    });
  }

  function flushPhotos(force) {
    if (_flushingPhotos || !_client) return;
    if (!force && isWifi() !== true) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (force) _photoStop = false;
    _flushingPhotos = true; _run = { done: 0 }; notify();
    var q = readLS(Q_PHOTO); var i = 0; var passSuccess = false;
    function next() {
      if (_photoStop) { _flushingPhotos = false; notify(); return; }
      if (i >= q.length) {
        _flushingPhotos = false;
        // On ne reboucle QUE si ce passage a fait progresser au moins une photo (sinon on
        // laisserait tourner en boucle sur des photos définitivement rejetées par le serveur —
        // on attend alors le prochain événement réseau ou un envoi forcé).
        if (!_photoStop && passSuccess && readLS(Q_PHOTO).length) { setTimeout(function () { flushPhotos(force); }, 0); }
        else notify();
        return;
      }
      var p = q[i];
      getPhotoBytes(p, function (dataUrl) {
        if (!dataUrl) {
          console.warn('RDZSync: octets photo introuvables en mémoire pour', p.id, p.table);
          var cur0 = readLS(Q_PHOTO); var idx0 = cur0.findIndex(function (x) { return x.id === p.id; });
          if (idx0 > -1) { cur0[idx0].tries = (cur0[idx0].tries || 0) + 1; cur0[idx0].lastError = 'octets introuvables en mémoire'; writeLS(Q_PHOTO, cur0); }
          i++; next(); return;
        }
        var path = p.module + '/' + Date.now() + '_' + p.name; var blob = dataUrlToBlob(dataUrl);
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
            // Confirmation serveur OK → on retire la fiche ET on efface les octets de la grande mémoire.
            var cur = readLS(Q_PHOTO); var idx = cur.findIndex(function (x) { return x.id === p.id; });
            if (idx > -1) cur.splice(idx, 1);
            writeLS(Q_PHOTO, cur);
            idbDel(p.id);
            passSuccess = true; _run.done++;
            pushLog({ ts: new Date().toISOString(), module: p.module, table: p.table, kind: 'photo', ok: true });
            i++; next();
          })
          .catch(function (err) {
            console.warn('RDZSync: échec upload photo', p.module, p.table, err && (err.message || err));
            var cur = readLS(Q_PHOTO); var idx = cur.findIndex(function (x) { return x.id === p.id; });
            if (idx > -1) { cur[idx].tries = (cur[idx].tries || 0) + 1; cur[idx].lastError = err && (err.message || String(err)) || null; writeLS(Q_PHOTO, cur); }
            i++; next();
          });
      });
    }
    next();
  }

  function stopPhotos() { _photoStop = true; notify(); }

  function getStatus() {
    var photoPending = readLS(Q_PHOTO).length;
    return {
      textPending: readLS(Q_TEXT).length,
      photoPending: photoPending,
      photoSending: _flushingPhotos && !_photoStop,
      photoStopped: _photoStop,
      photoDone: _run.done,
      photoTotal: _run.done + photoPending,
      log: readLS(Q_LOG),
      isWifi: isWifi()
    };
  }

  var API = { init: init, save: save, flushText: flushText, flushPhotos: flushPhotos, stopPhotos: stopPhotos, getStatus: getStatus };
  (typeof window !== 'undefined' ? window : global).RDZSync = API;
})(typeof window !== 'undefined' ? window : this);
