/* BizFinPro — shared UI rendering helpers */
(function (global) {
  'use strict';
  const t = () => I18N.t;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    business: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg>',
    budget: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 3 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3"/></svg>',
    financials: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>',
    analysis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M6 16l4-6 4 3 5-8"/></svg>',
    financing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15.5 9.5c0-1.7-1.5-2.5-3.5-2.5s-3.5.8-3.5 2.5 1.5 2 3.5 2 3.5.8 3.5 2.5-1.5 2.5-3.5 2.5-3.5-.8-3.5-2.5"/></svg>',
    syariah: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M12 6c-2.5-1.5-6-2-8 .5 2 2.5 5.5 2 8 .5zM12 6c2.5-1.5 6-2 8 .5-2 2.5-5.5 2-8 .5z"/><path d="M12 12c-2-.8-5-1-7 1 2 1.5 5 2 7 1zM12 12c2-.8 5-1 7 1-2 1.5-5 2-7 1z"/><path d="M12 18c-1-.4-3-.6-4 .2 1.5 1 3 1.3 4 .5zM12 18c1-.4 3-.6 4 .2-1.5 1-3 1.3-4 .5z"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>',
    wizard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v6l-4 3 4 3v6H5v-6l4-3-4-3z"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10"/><path d="M2 20v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><circle cx="12" cy="10" r="2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx=".5"/><rect x="12" y="8" width="3" height="10" rx=".5"/><rect x="17" y="5" width="3" height="13" rx=".5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 21h16"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.6 2.6L16 9.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
  };

  function icon(name) {
    const svg = ICONS[name] || '';
    return '<span class="ico">' + svg + '</span>';
  }

  /* ---------- shell ---------- */
  function shell(opts) {
    const root = document.getElementById('app');
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'shell';
    el.innerHTML =
      '<aside class="sidebar" id="sidebar"></aside>' +
      '<div class="main">' +
        '<header class="topbar" id="topbar"></header>' +
        '<div class="content" id="content"></div>' +
      '</div>' +
      '<div class="scrim" id="scrim"></div>';
    root.appendChild(el);
    return { sidebar: el.querySelector('#sidebar'), content: el.querySelector('#content'), topbar: el.querySelector('#topbar') };
  }

  function NAV(config) {
    // config: { active, onClick, items: [{id, group, icon, label, mode, badge}] }
    const groups = [];
    config.items.forEach((it) => {
      let g = groups[groups.length - 1];
      if (!g || g.name !== it.group) { g = { name: it.group, items: [] }; groups.push(g); }
      g.items.push(it);
    });
    let html = '<div class="brand"><img class="logo" src="icon.svg" alt=""><div><div class="bname">BizFinPro</div><div class="btag">' + esc(t()('app.tagline')) + '</div></div></div><nav class="nav">';
    groups.forEach((g) => {
      html += '<div class="nav-group">' + esc(g.name) + '</div>';
      g.items.forEach((it) => {
        if (it.mode && it.mode !== config.mode) return;
        const act = it.id === config.active ? ' active' : '';
        const cls = it.modeCls ? ' ' + it.modeCls : '';
        html += '<div class="nav-item' + act + cls + '" data-nav="' + it.id + '">' + icon(it.icon) + '<span>' + esc(it.label) + '</span>' + (it.badge ? '<span class="badge">' + esc(it.badge) + '</span>' : '') + '</div>';
      });
    });
    html += '</nav><div class="sidefoot">BizFinPro V1 · PWA offline · © 2026</div>';
    return html;
  }

  function renderBrand(sidebarEl, html) { sidebarEl.innerHTML = html; }

  /* ---------- small components ---------- */
  function kv(label, value, opts) {
    opts = opts || {};
    return '<div class="row2"><div class="lbl">' + esc(label) + (opts.sub ? '<small>' + esc(opts.sub) + '</small>' : '') + '</div><div style="text-align:right">' + value + '</div></div>';
  }
  function kpi(opts) {
    return '<div class="kpi ' + (opts.tone || 'tone-primary') + (opts.big ? ' big' : '') + '"><span class="k-band"></span>' +
      '<div class="k-label">' + (opts.icon ? '<span class="ico" style="width:14px;height:14px">' + opts.icon + '</span>' : '') + esc(opts.label) + (opts.pill ? opts.pill : '') + '</div>' +
      '<div class="k-val">' + (opts.value != null ? opts.value : '—') + '</div>' +
      (opts.sub ? '<div class="k-sub">' + opts.sub + '</div>' : '') + '</div>';
  }
  function card(title, inner, opts) {
    opts = opts || {};
    const t = title ? '<div class="card-title"><h3>' + esc(title) + '</h3>' + (opts.hint ? '<span class="hint">' + esc(opts.hint) + '</span>' : '') + (opts.actions || '') + '</div>' : '';
    return '<div class="card' + (opts.tight ? ' tight' : '') + (opts.cls ? ' ' + opts.cls : '') + '">' + t + inner + '</div>';
  }
  function table(headers, rows, opts) {
    opts = opts || {};
    let h = '<table class="data"><thead><tr>';
    headers.forEach((hd) => { h += '<th class="' + (hd.r ? 'r' : '') + '">' + esc(hd.label) + '</th>'; });
    h += '</tr></thead><tbody>';
    rows.forEach((r) => {
      const rcls = r.cls || '';
      h += '<tr class="' + rcls + '">';
      r.cells.forEach((c) => { h += '<td class="' + (c.r ? 'r' : '') + '">' + c.html + '</td>'; });
      h += '</tr>';
    });
    h += '</tbody></table>';
    const foot = opts.footnote ? '<div class="tbl-footnote">' + opts.footnote + '</div>' : '';
    return '<div class="tbl-wrap">' + h + '</div>' + foot;
  }
  function chip(text, tone) { return '<span class="chip ' + (tone || 'gray') + '">' + esc(text) + '</span>'; }
  function alert(kind, text, opts) {
    opts = opts || {};
    const ico = { info: ICONS.check, warn: ICONS.warn, bad: ICONS.close, ok: ICONS.check }[kind] || ICONS.warn;
    return '<div class="alert ' + kind + '"><span class="ico">' + ico + '</span><div>' + (opts.strong ? '<strong>' + esc(opts.strong) + '</strong>' : '') + text + '</div></div>';
  }
  function emptyState(big, text, btnHtml) {
    return '<div class="empty"><div class="big">' + (big || '📊') + '</div><p>' + esc(text) + '</p>' + (btnHtml ? '<div style="margin-top:16px">' + btnHtml + '</div>' : '') + '</div>';
  }
  function formatMoneyLabel(line) { return line; }

  /* ---------- form helpers ---------- */
  function field(label, innerHtml, opts) {
    opts = opts || {};
    return '<div class="fld"><label>' + esc(label) + (opts.req ? ' <span class="req">*</span>' : '') + '</label>' + innerHtml + (opts.hint ? '<div class="hint">' + opts.hint + '</div>' : '') + '</div>';
  }
  function textInput(value, opts) {
    opts = opts || {};
    return '<input type="text" ' + (opts.id ? 'id="' + opts.id + '" ' : '') + 'value="' + esc(value) + '" placeholder="' + esc(opts.placeholder || '') + '" ' + (opts.cls ? 'class="' + opts.cls + '"' : '') + '>';
  }
  function numInput(value, opts) {
    opts = opts || {};
    return '<input type="number" step="any" ' + (opts.id ? 'id="' + opts.id + '" ' : '') + 'value="' + esc(value) + '" placeholder="' + esc(opts.placeholder || '') + '">';
  }
  function selectInput(options, selValue, opts) {
    opts = opts || {};
    let h = '<select ' + (opts.id ? 'id="' + opts.id + '" ' : '') + '>';
    options.forEach((o) => {
      const val = (o.value != null ? String(o.value) : o.label);
      const sel = String(selValue) === val ? ' selected' : '';
      h += '<option value="' + esc(val) + '"' + sel + '>' + esc(o.label) + '</option>';
    });
    h += '</select>';
    return h;
  }

  /* ---------- modal & toast ---------- */
  function modal(title, bodyHtml, footHtml, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (opts.cls || '') + '">' +
      '<div class="modal-head"><h3>' + esc(title) + '</h3><button class="x-btn" data-close>×</button></div>' +
      '<div class="modal-body">' + bodyHtml + '</div>' +
      (footHtml ? '<div class="modal-foot">' + footHtml + '</div>' : '') +
      '</div>';
    root.appendChild(back);
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) closeModal(back); });
    return {
      el: back, body: back.querySelector('.modal-body'),
      close: () => closeModal(back)
    };
  }
  function closeModal(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }
  function closeAllModals() { document.querySelectorAll('.modal-back').forEach((e) => e.remove()); }

  function toast(msg, kind) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    const ico = { ok: ICONS.check, err: ICONS.close, warn: ICONS.warn, info: ICONS.check }[kind || 'info'] || ICONS.check;
    el.innerHTML = '<span class="t-ico">' + ico + '</span><div>' + esc(msg) + '</div>';
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 3600);
  }

  function pageHead(title, sub, actionsRight) {
    return '<div class="page-head"><h1>' + esc(title) + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + (actionsRight ? '<div class="actions-row" style="margin-top:12px">' + actionsRight + '</div>' : '') + '</div>';
  }

  function btn(label, cls, opts) {
    opts = opts || {};
    return '<button class="btn ' + (cls || 'ghost') + '" ' + (opts.id ? 'id="' + opts.id + '" ' : '') + (opts.icon ? '' : '') + '>' + (opts.icon ? icon(opts.icon) + ' ' : '') + esc(label) + '</button>';
  }

  global.UI = { esc, icon, ICONS, shell, NAV, kv, kpi, card, table, chip, alert, emptyState, field, textInput, numInput, selectInput, modal, closeModal, closeAllModals, toast, pageHead, btn };
})(typeof window !== 'undefined' ? window : globalThis);
