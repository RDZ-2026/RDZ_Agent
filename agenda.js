/* ============================================================================
   RDZ — Module Agenda partagé (Jour / Semaine / Mois)
   Combine les Événements et les Consignes particulières dans une seule vue.
   À inclure après le script Supabase, sur n'importe quelle page :
     <script src="agenda.js"></script>
   Utilisation :
     <div id="agenda-view" style="display:none"></div>
     <script>RDZAgenda.mount('agenda-view');</script>
   ========================================================================== */
(function (global) {
  const SUPABASE_URL = 'https://pdewmubikmotqzbxmyeq.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZXdtdWJpa21vdHF6YnhteWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMDU3MjgsImV4cCI6MjA5NDg4MTcyOH0.SRuhERPmB5_7a58nJ5oMg4a8mujnoLBv8dxkxvyNWao';

  const START_HOUR = 6;
  const END_HOUR = 23; // dernière heure affichée (bloc 23h-24h inclus)
  const ROW_H = 46; // px par heure

  let sb = null;
  let containerId = null;
  let mode = 'month'; // 'day' | 'week' | 'month'
  let refDate = todayDate();
  let sites = [], evs = [], cons = [];
  let loaded = false;

  // ── UTILS DATE ────────────────────────────────────────────────────────────
  function todayDate() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function iso(d) { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${dd}`; }
  function parseISO(s) { return new Date(s + 'T00:00:00'); }
  function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function sameDay(a, b) { return iso(a) === iso(b); }
  function startOfWeek(d) { const r = new Date(d); const day = (r.getDay() + 6) % 7; r.setDate(r.getDate() - day); return r; } // lundi
  function fmt(s) { if (!s) return ''; const [y, m, dd] = s.split('-'); return `${dd}.${m}.${y}`; }
  function fmtFull(d) { return d.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div'); d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }
  function timeToMinutes(t) { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }

  // ── DONNÉES ───────────────────────────────────────────────────────────────
  async function ensureData(force) {
    if (loaded && !force) return;
    if (!sb) sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    try {
      const [{ data: s }, { data: e, error: ee }, { data: c, error: ce }] = await Promise.all([
        sb.from('sites').select('*').eq('actif', true).order('nom'),
        sb.from('evenements').select('*').order('date').order('heure_debut'),
        sb.from('consignes').select('*').order('date_debut')
      ]);
      sites = s || [];
      evs = ee ? [] : (e || []);
      cons = ce ? [] : (c || []);
      loaded = true;
    } catch (err) {
      console.error('RDZAgenda: erreur de chargement', err);
      sites = []; evs = []; cons = [];
    }
  }

  function siteNom(id) { const s = sites.find(x => x.id === id); return s ? s.nom : ''; }
  function eventsOn(dateStr) { return evs.filter(e => e.date === dateStr).sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || '')); }
  function consignesOn(dateStr) { return cons.filter(c => (!c.date_debut || c.date_debut <= dateStr) && (!c.date_fin || c.date_fin >= dateStr)); }

  // ── STYLES (injectés une seule fois) ────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById('rdz-agenda-styles')) return;
    const css = `
    .ag-wrap{font-family:Arial,Helvetica,sans-serif}
    .ag-toolbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:0 0 14px;border-bottom:2px solid #1a1a1a;margin-bottom:16px}
    .ag-nav{display:flex;align-items:center;gap:6px}
    .ag-navbtn{width:30px;height:30px;border:1px solid #d0ccc5;background:#fff;border-radius:2px;cursor:pointer;font-size:14px;color:#4a4a4a;line-height:1}
    .ag-navbtn:hover{background:#f5f4f2}
    .ag-todaybtn{padding:7px 14px;border:1px solid #d0ccc5;background:#fff;border-radius:2px;cursor:pointer;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#4a4a4a}
    .ag-todaybtn:hover{background:#f5f4f2}
    .ag-title{font-size:15px;font-weight:700;color:#1a1a1a;text-transform:capitalize;flex:1;min-width:160px}
    .ag-modes{display:flex;border:1px solid #d0ccc5;border-radius:2px;overflow:hidden}
    .ag-modebtn{padding:7px 15px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;border:none;background:#fff;color:#4a4a4a;cursor:pointer;border-right:1px solid #d0ccc5}
    .ag-modebtn:last-child{border-right:none}
    .ag-modebtn.on{background:#8B1A1A;color:#fff}
    .ag-legend{display:flex;gap:18px;font-size:11px;color:#4a4a4a;margin-bottom:14px}
    .ag-leg-item{display:flex;align-items:center;gap:6px}
    .ag-dot{width:9px;height:9px;border-radius:50%;display:inline-block;flex-shrink:0}
    .ag-dot-ev{background:#8B1A1A}
    .ag-dot-co{background:#1e5c8e}
    .ag-empty{text-align:center;padding:50px 20px;color:#9a9a9a;font-size:13px}

    /* MOIS */
    .ag-month-hdr-row{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#d0ccc5;border:1px solid #d0ccc5;border-bottom:none}
    .ag-month-hdr{background:#1a1a1a;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-align:center;padding:7px 0}
    .ag-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#d0ccc5;border:1px solid #d0ccc5;border-radius:0 0 2px 2px;overflow:hidden}
    .ag-day-cell{background:#fff;min-height:98px;padding:6px 6px 5px;cursor:pointer;transition:background .15s}
    .ag-day-cell:hover{background:#faf7f5}
    .ag-day-cell.out{background:#faf9f7}
    .ag-day-cell.out .ag-day-num{color:#c8c4bd}
    .ag-day-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700;color:#1a1a1a;margin-bottom:4px}
    .ag-day-cell.today .ag-day-num{background:#8B1A1A;color:#fff}
    .ag-chip{font-size:9.5px;padding:2px 5px;border-radius:2px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
    .ag-chip-ev{background:#fde8e8;color:#7f1d1d}
    .ag-chip-co{background:#e0eefc;color:#0c4a6e}
    .ag-more{font-size:9.5px;color:#9a9a9a;font-weight:700;padding-left:2px}

    /* SEMAINE / JOUR */
    .ag-time-grid{display:flex;border:1px solid #d0ccc5;border-radius:2px;overflow:hidden;background:#fff}
    .ag-time-col{width:50px;flex-shrink:0;border-right:1px solid #d0ccc5;background:#faf9f7}
    .ag-time-col-hdr{height:64px;border-bottom:2px solid #1a1a1a}
    .ag-time-slot{height:${ROW_H}px;font-size:9px;color:#9a9a9a;text-align:right;padding:2px 6px 0 0;box-sizing:border-box;border-bottom:1px solid #e5e2dd}
    .ag-day-col{flex:1;position:relative;border-right:1px solid #e5e2dd;min-width:0}
    .ag-day-col:last-child{border-right:none}
    .ag-day-col-hdr{background:#1a1a1a;color:#fff;font-size:10px;font-weight:700;text-align:center;padding:8px 4px;text-transform:uppercase;letter-spacing:.03em;height:64px;box-sizing:border-box;border-bottom:2px solid #1a1a1a}
    .ag-day-col-hdr.today{background:#8B1A1A}
    .ag-day-col-hdr .n{display:block;font-size:15px;margin-top:2px;letter-spacing:0}
    .ag-allday{min-height:28px;border-bottom:2px solid #1a1a1a;padding:3px;background:#faf9f7}
    .ag-hours{position:relative}
    .ag-hour-line{height:${ROW_H}px;border-bottom:1px solid #e5e2dd;box-sizing:border-box}
    .ag-event-block{position:absolute;left:2px;right:2px;background:#8B1A1A;color:#fff;border-radius:2px;padding:3px 6px;font-size:10px;line-height:1.35;overflow:hidden;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.15);z-index:2}
    .ag-event-block:hover{background:#6B1212}
    .ag-event-block b{display:block;font-size:10px}
    .ag-co-chip-inline{display:block;font-size:9.5px;background:#e0eefc;color:#0c4a6e;border-radius:2px;padding:2px 5px;margin-bottom:2px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* PANNEAU DÉTAIL */
    .ag-detail-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:199}
    .ag-detail-overlay.open{display:block}
    .ag-detail{position:fixed;top:0;right:0;width:360px;max-width:90vw;height:100%;background:#fff;box-shadow:-2px 0 14px rgba(0,0,0,.2);border-left:3px solid #8B1A1A;padding:26px 24px;z-index:200;overflow-y:auto}
    .ag-detail-close{position:absolute;top:16px;right:16px;cursor:pointer;font-size:16px;color:#9a9a9a;width:26px;height:26px;display:flex;align-items:center;justify-content:center}
    .ag-detail-close:hover{color:#1a1a1a}
    .ag-detail h3{font-size:14px;color:#8B1A1A;margin-bottom:16px;padding-right:26px;line-height:1.4}
    .ag-detail .row{margin-bottom:12px;font-size:12.5px;color:#1a1a1a;line-height:1.55}
    .ag-detail .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9a9a9a;margin-bottom:3px}
    `;
    const style = document.createElement('style');
    style.id = 'rdz-agenda-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── SHELL ─────────────────────────────────────────────────────────────────
  function shellHtml() {
    return `
    <div class="ag-wrap">
      <div class="ag-toolbar">
        <div class="ag-nav">
          <button class="ag-navbtn" onclick="RDZAgenda.prev()">‹</button>
          <button class="ag-todaybtn" onclick="RDZAgenda.today()">Aujourd'hui</button>
          <button class="ag-navbtn" onclick="RDZAgenda.next()">›</button>
        </div>
        <div class="ag-title" id="ag-title"></div>
        <div class="ag-modes">
          <button class="ag-modebtn" data-m="day" onclick="RDZAgenda.setMode('day')">Jour</button>
          <button class="ag-modebtn" data-m="week" onclick="RDZAgenda.setMode('week')">Semaine</button>
          <button class="ag-modebtn" data-m="month" onclick="RDZAgenda.setMode('month')">Mois</button>
        </div>
      </div>
      <div class="ag-legend">
        <span class="ag-leg-item"><i class="ag-dot ag-dot-ev"></i>Événement</span>
        <span class="ag-leg-item"><i class="ag-dot ag-dot-co"></i>Consigne particulière</span>
      </div>
      <div id="ag-body"></div>
    </div>
    <div class="ag-detail-overlay" id="ag-overlay" onclick="RDZAgenda.closeDetail()"></div>
    <div class="ag-detail" id="ag-detail" style="display:none"></div>`;
  }

  function markModeButtons() {
    document.querySelectorAll('.ag-modebtn').forEach(b => b.classList.toggle('on', b.getAttribute('data-m') === mode));
  }

  // ── DÉTAIL (panneau latéral) ────────────────────────────────────────────────
  function eventDetailHtml(e) {
    const site = siteNom(e.site_id);
    return `<h3>${escapeHtml(e.titre)}</h3>
      <div class="row"><div class="lbl">Date</div>${fmtFull(parseISO(e.date))}</div>
      <div class="row"><div class="lbl">Horaire</div>${e.heure_debut ? e.heure_debut.slice(0,5) : '?'}${e.heure_fin ? ' – ' + e.heure_fin.slice(0,5) : ''}</div>
      <div class="row"><div class="lbl">Site</div>${escapeHtml(site) || '—'}${e.lieu ? ' · ' + escapeHtml(e.lieu) : ''}</div>
      ${e.nb_agents ? `<div class="row"><div class="lbl">Agents</div>${e.nb_agents} — ${escapeHtml(e.agents) || 'non désigné'}</div>` : ''}
      ${e.tenue ? `<div class="row"><div class="lbl">Tenue</div>${escapeHtml(e.tenue)}</div>` : ''}
      ${e.contact ? `<div class="row"><div class="lbl">Contact</div>${escapeHtml(e.contact)}</div>` : ''}
      ${e.consignes ? `<div class="row"><div class="lbl">Consignes sécurité</div>${escapeHtml(e.consignes).replace(/\n/g,'<br>')}</div>` : ''}
      ${e.remarques ? `<div class="row"><div class="lbl">Remarques</div>${escapeHtml(e.remarques).replace(/\n/g,'<br>')}</div>` : ''}`;
  }
  function consigneDetailHtml(c) {
    const site = siteNom(c.site_id);
    return `<h3>📌 Consigne particulière</h3>
      <div class="row"><div class="lbl">Site</div>${escapeHtml(site) || '—'}</div>
      <div class="row"><div class="lbl">Période</div>${c.date_debut ? fmt(c.date_debut) : '—'} → ${c.date_fin ? fmt(c.date_fin) : 'Permanente'}</div>
      <div class="row"><div class="lbl">Texte</div>${escapeHtml(c.texte).replace(/\n/g,'<br>')}</div>`;
  }
  function showDetail(html) {
    document.getElementById('ag-detail').innerHTML = `<div class="ag-detail-close" onclick="RDZAgenda.closeDetail()">✕</div>${html}`;
    document.getElementById('ag-detail').style.display = 'block';
    document.getElementById('ag-overlay').classList.add('open');
  }
  function closeDetail() {
    document.getElementById('ag-detail').style.display = 'none';
    document.getElementById('ag-overlay').classList.remove('open');
  }
  function openEvent(id) { const e = evs.find(x => x.id === id); if (e) showDetail(eventDetailHtml(e)); }
  function openConsigne(id) { const c = cons.find(x => x.id === id); if (c) showDetail(consigneDetailHtml(c)); }

  // ── VUE MOIS ──────────────────────────────────────────────────────────────
  function renderMonth() {
    const y = refDate.getFullYear(), m = refDate.getMonth();
    document.getElementById('ag-title').textContent = refDate.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
    const lastOfMonth = new Date(y, m + 1, 0);
    const startGrid = startOfWeek(new Date(y, m, 1));
    const cells = [];
    let cur = new Date(startGrid);
    while (true) {
      cells.push(new Date(cur));
      cur = addDays(cur, 1);
      if (cur > lastOfMonth && cur.getDay() === 1) break;
    }
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    let html = `<div class="ag-month-hdr-row">${jours.map(j => `<div class="ag-month-hdr">${j}</div>`).join('')}</div><div class="ag-month-grid">`;
    cells.forEach(cell => {
      const dateStr = iso(cell);
      const out = cell.getMonth() !== m;
      const isToday = sameDay(cell, todayDate());
      const dayEvs = eventsOn(dateStr);
      const dayCons = consignesOn(dateStr);
      const items = [
        ...dayEvs.map(e => ({ type: 'ev', id: e.id, label: `${e.heure_debut ? e.heure_debut.slice(0,5)+' ' : ''}${e.titre}` })),
        ...dayCons.map(c => ({ type: 'co', id: c.id, label: `📌 ${c.texte}` }))
      ];
      const shown = items.slice(0, 3);
      const rest = items.length - shown.length;
      html += `<div class="ag-day-cell${out ? ' out' : ''}${isToday ? ' today' : ''}" onclick="RDZAgenda.gotoDay('${dateStr}')">
        <div class="ag-day-num">${cell.getDate()}</div>
        ${shown.map(it => `<div class="ag-chip ${it.type === 'ev' ? 'ag-chip-ev' : 'ag-chip-co'}" onclick="event.stopPropagation();RDZAgenda.${it.type === 'ev' ? 'openEvent' : 'openConsigne'}('${it.id}')">${escapeHtml(it.label)}</div>`).join('')}
        ${rest > 0 ? `<div class="ag-more">+ ${rest} autre${rest > 1 ? 's' : ''}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
    document.getElementById('ag-body').innerHTML = html;
  }

  // ── VUE SEMAINE / JOUR (grille horaire) ──────────────────────────────────
  function renderTimeGrid(days) {
    const hours = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);
    let html = `<div class="ag-time-grid">
      <div class="ag-time-col">
        <div class="ag-time-col-hdr"></div>
        ${hours.map(h => `<div class="ag-time-slot">${String(h).padStart(2,'0')}h</div>`).join('')}
      </div>`;
    days.forEach(day => {
      const dateStr = iso(day);
      const isToday = sameDay(day, todayDate());
      const dayCons = consignesOn(dateStr);
      const dayEvs = eventsOn(dateStr);
      const gridHeight = hours.length * ROW_H;
      const blocks = dayEvs.map(e => {
        const startMin = timeToMinutes(e.heure_debut ? e.heure_debut.slice(0,5) : null);
        if (startMin == null) return '';
        const endMin = timeToMinutes(e.heure_fin ? e.heure_fin.slice(0,5) : null);
        const top = ((startMin - START_HOUR * 60) / 60) * ROW_H;
        const durMin = endMin != null && endMin > startMin ? (endMin - startMin) : 60;
        const height = Math.max(20, (durMin / 60) * ROW_H);
        const site = siteNom(e.site_id);
        return `<div class="ag-event-block" style="top:${top}px;height:${height}px" onclick="RDZAgenda.openEvent('${e.id}')">
          <b>${e.heure_debut ? e.heure_debut.slice(0,5) : ''} ${escapeHtml(e.titre)}</b>${site ? escapeHtml(site) : ''}
        </div>`;
      }).join('');
      html += `<div class="ag-day-col">
        <div class="ag-day-col-hdr${isToday ? ' today' : ''}">${day.toLocaleDateString('fr-CH',{weekday:'short'})}<span class="n">${day.getDate()}</span></div>
        <div class="ag-allday">${dayCons.map(c => `<div class="ag-co-chip-inline" onclick="RDZAgenda.openConsigne('${c.id}')">📌 ${escapeHtml(c.texte)}</div>`).join('')}</div>
        <div class="ag-hours" style="height:${gridHeight}px">
          ${hours.map(() => `<div class="ag-hour-line"></div>`).join('')}
          ${blocks}
        </div>
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function renderWeek() {
    const start = startOfWeek(refDate);
    const days = [...Array(7)].map((_, i) => addDays(start, i));
    document.getElementById('ag-title').textContent = `Semaine du ${fmt(iso(start))} au ${fmt(iso(days[6]))}`;
    document.getElementById('ag-body').innerHTML = renderTimeGrid(days);
  }

  function renderDay() {
    document.getElementById('ag-title').textContent = fmtFull(refDate);
    document.getElementById('ag-body').innerHTML = renderTimeGrid([refDate]);
  }

  // ── RENDU PRINCIPAL ───────────────────────────────────────────────────────
  function render() {
    const el = document.getElementById(containerId);
    if (!el) return;
    ensureStyles();
    el.innerHTML = shellHtml();
    markModeButtons();
    if (!loaded) {
      document.getElementById('ag-body').innerHTML = `<div class="ag-empty">⏳ Chargement de l'agenda…</div>`;
      ensureData().then(() => { markModeButtons(); dispatchRender(); });
      return;
    }
    dispatchRender();
  }
  function dispatchRender() {
    if (mode === 'month') renderMonth();
    else if (mode === 'week') renderWeek();
    else renderDay();
  }

  // ── API PUBLIQUE ──────────────────────────────────────────────────────────
  function mount(id) {
    containerId = id;
    ensureStyles();
    render();
  }
  async function refresh() { await ensureData(true); dispatchRender(); }
  function setMode(m) { mode = m; markModeButtons(); dispatchRender(); }
  function gotoDay(dateStr) { refDate = parseISO(dateStr); mode = 'day'; markModeButtons(); dispatchRender(); }
  function today() { refDate = todayDate(); dispatchRender(); }
  function prev() { shift(-1); dispatchRender(); }
  function next() { shift(1); dispatchRender(); }
  function shift(dir) {
    if (mode === 'day') refDate = addDays(refDate, dir);
    else if (mode === 'week') refDate = addDays(refDate, dir * 7);
    else refDate = new Date(refDate.getFullYear(), refDate.getMonth() + dir, 1);
  }

  global.RDZAgenda = {
    mount, refresh, setMode, prev, next, today, gotoDay,
    openEvent, openConsigne, closeDetail
  };
})(window);
