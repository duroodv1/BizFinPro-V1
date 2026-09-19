/* ============================================================
   BizFinPro V1 — Main application
   ============================================================ */
(function (global) {
  'use strict';

  // ---------- shorthands ----------
  const t = (k) => I18N.t(k);
  const es = UI.esc;
  const M = Model;
  const F$ = FMT;
  const money = (v, d) => FMT.money(v, (S.proj ? S.proj.currency : 'RM / MYR'), { decimals: d == null ? 0 : d });
  const pct = (v, d) => FMT.pct(v, d == null ? 1 : d);
  const num = (v) => FMT.num(v);

  // ---------- state ----------
  const S = {
    settings: Object.assign({}, M.defaultSettings()),
    proj: null,        // current project (data)
    F: null,           // computed finance
    projectId: null,
    page: 'home',
    dirty: true,
    _t: null
  };

  function cur() { return S.proj ? S.proj.currency : 'RM / MYR'; }
  function finance() { if (S.dirty && S.proj) { S.F = M.computeFinance(S.proj); S.dirty = false; } return S.F; }
  function markDirty() { S.dirty = true; }

  // ---------- persistence ----------
  async function loadSettings() {
    const s = await Store.getSettings().catch(() => ({}));
    S.settings = Object.assign({}, M.defaultSettings(), s);
    I18N.setLang(S.settings.lang || 'ms');
    applyTheme();
  }
  async function saveSettings() {
    S.settings.updatedAt = Date.now();
    await Store.putSettings(S.settings).catch(() => {});
  }
  function applyTheme() {
    document.body.classList.toggle('dark', S.settings.theme === 'dark');
  }
  async function saveProjectNow() {
    if (!S.proj) return;
    S.proj.updatedAt = Date.now();
    await Store.putProject(S.proj).catch(() => {});
  }
  function scheduleSave() {
    clearTimeout(S._saveT);
    S._saveT = setTimeout(saveProjectNow, 500);
  }
  async function setProject(p) { S.proj = M.ensure(p); S.projectId = p.id; markDirty(); await saveProjectNow(); }

  // ---------- generic path set ----------
  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
  }
  function getPath(obj, path) {
    const parts = path.split('.');
    let o = obj;
    for (const p of parts) { if (o == null) return ''; o = o[p]; }
    return o == null ? '' : o;
  }

  // ---------- refresh handling (keeps focus while typing) ----------
  function rememberFocusPath() {
    const el = document.activeElement;
    if (el && el.getAttribute && el.getAttribute('data-bind')) return el.getAttribute('data-bind');
    return null;
  }
  function restoreFocus(path) {
    if (!path) return;
    const el = document.querySelector('[data-bind="' + path.replace(/"/g, '') + '"]');
    if (el) { el.focus(); try { if (typeof el.setSelectionRange === 'function') el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }
  }

  const BizSet = {
    set(path, value, instant) {
      if (!S.proj) return;
      setPath(S.proj, path, value === '' ? '' : value);
      markDirty();
      scheduleSave();
      (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    setA(key, field, value, instant) {
      if (!S.proj) return;
      const a = S.proj.assumptions[key];
      a[field] = value;
      if (field === 'manual') { a.mode = 'manual'; a.source = 'manual'; a.active = (value === '' || value == null) ? a.auto : Number(value); a.updatedAt = Date.now(); }
      if (field === 'auto') { a.auto = Number(value) || 0; if (a.mode !== 'manual') { a.active = a.auto; } }
      markDirty(); scheduleSave();
      (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    resetA(key) { M.resetToAuto(S.proj, key); markDirty(); scheduleSave(); refreshNow(); },
    setBusiness(field, value) { BizSet.set('business.' + field, value); },
    setSpecial(field, value) { BizSet.set('specialAssumptions.' + field, value); },
    setIslamic(path, value, instant) { BizSet.set('financing.islamic.' + path, value, instant); },
    setFinStruct(s) { setPath(S.proj, 'financing.islamic.structure', s); markDirty(); scheduleSave(); refreshNow(); },
    // array item editors
    addCapex() {
      S.proj.capex.items.push({ id: M.uid(), name: '', category: 'equipment', qty: 1, unitCost: '', totalCost: '', purchaseDate: S.proj.startDate, usefulLife: S.settings.defaultPeriod ? 5 : 5, residualValue: '', depMethod: 'sl' });
      markDirty(); scheduleSave(); refreshNow();
    },
    delCapex(id) { S.proj.capex.items = S.proj.capex.items.filter((i) => i.id !== id); markDirty(); scheduleSave(); refreshNow(); },
    setCapex(id, field, value, instant) {
      const it = S.proj.capex.items.find((i) => i.id === id); if (!it) return;
      it[field] = value;
      if (field === 'qty' || field === 'unitCost') { it.totalCost = (Number(it.qty) || 0) * (Number(it.unitCost) || 0); }
      markDirty(); scheduleSave();
      (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    addStartup() { S.proj.startup.items.push({ id: M.uid(), name: '', amount: '' }); markDirty(); scheduleSave(); refreshNow(); },
    delStartup(id) { S.proj.startup.items = S.proj.startup.items.filter((i) => i.id !== id); markDirty(); scheduleSave(); refreshNow(); },
    setStartup(id, field, value, instant) {
      const it = S.proj.startup.items.find((i) => i.id === id); if (!it) return;
      it[field] = value; markDirty(); scheduleSave();
      (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    addStream() { S.proj.revenue.streams.push({ id: M.uid(), name: '', type: 'product', monthlyVolume: '', unitPrice: '', monthlyRevenue: '', useRevenue: false, growth: '' }); markDirty(); scheduleSave(); refreshNow(); },
    delStream(id) { S.proj.revenue.streams = S.proj.revenue.streams.filter((i) => i.id !== id); markDirty(); scheduleSave(); refreshNow(); },
    setStream(id, field, value, instant) {
      const it = S.proj.revenue.streams.find((i) => i.id === id); if (!it) return;
      if (field === 'type') { it.type = value; it.useRevenue = value === 'service' ? true : it.useRevenue; }
      else if (field === 'mode') { it.useRevenue = value === 'revenue'; }
      else it[field] = value;
      markDirty(); scheduleSave();
      (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    setOpex(key, field, value, instant) {
      const c = S.proj.opex.categories[key] || (S.proj.opex.categories[key] = { monthly: true, base: '', growth: '' });
      c[field] = value; markDirty(); scheduleSave();
      (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    addLoan() {
      S.proj.financing.conventional.loans.push({ id: M.uid(), name: '', structure: 'term_loan', amount: '', rateMode: 'auto', manualRate: '', tenureYears: 5, freq: 'monthly', graceMonths: 0, fees: '', startDate: S.proj.startDate });
      markDirty(); scheduleSave(); refreshNow();
    },
    delLoan(id) { S.proj.financing.conventional.loans = S.proj.financing.conventional.loans.filter((i) => i.id !== id); markDirty(); scheduleSave(); refreshNow(); },
    setLoan(id, field, value, instant) {
      const it = S.proj.financing.conventional.loans.find((i) => i.id === id); if (!it) return;
      it[field] = value; markDirty(); scheduleSave();
      if (field === 'rateMode') refreshNow();
      else (instant ? refreshNow : refreshSoon)(rememberFocusPath());
    },
    setScreening(field, value) { setPath(S.proj, 'shariah.screening.' + field, value); setPath(S.proj, 'shariah.screening.lastScreenedAt', Date.now()); markDirty(); scheduleSave(); refreshNow(); },
    setReview(field, value) { setPath(S.proj, 'shariah.review.' + field, value); markDirty(); scheduleSave(); refreshNow(); },
    setStandard(field, value) { setPath(S.proj, 'shariah.standards.' + field, value); markDirty(); scheduleSave(); refreshNow(); },
    setScenario(caseId, field, value) { setPath(S.proj, 'scenarios.' + caseId + '.' + field, value === '' ? '' : value); markDirty(); scheduleSave(); refreshSoon(); },
    setActual(field, value) { setPath(S.proj, 'budget.actual.' + field, value); markDirty(); scheduleSave(); refreshSoon(); },
    setReportSection(id, included) {
      if (!S.proj.reportSections) S.proj.reportSections = BizReports.defaultSections(S.proj);
      S.proj.reportSections[id] = { included: !!included };
      markDirty(); scheduleSave(); refreshSoon();
    }
  };

  function refreshSoon(focusPath) {
    clearTimeout(S._t);
    S._t = setTimeout(() => refreshNow(focusPath), 380);
  }
  function refreshNow(focusPath) {
    if (!S.proj) { renderPage(); return; }
    markDirty();
    computeAndGo(S.page, focusPath);
  }

  // ---------- navigation ----------
  function navItems() {
    const mode = S.proj ? S.proj.financialMode : 'KONVENSIONAL';
    const fin = mode === 'SYARIAH'
      ? { id: 'financing', icon: 'financing', label: t('nav.islamic'), group: t('nav.financing'), mode, modeCls: 'mode-syariah' }
      : { id: 'financing', icon: 'financing', label: t('nav.conventional'), group: t('nav.financing'), mode, modeCls: 'mode-konvensional' };
    return [
      { id: 'home', icon: 'home', label: t('nav.home'), group: t('nav.home') },
      { id: 'projects', icon: 'projects', label: t('nav.projects'), group: t('nav.projects') },
      { id: 'business', icon: 'business', label: t('nav.business'), group: t('nav.business') },
      { id: 'budget', icon: 'budget', label: t('nav.budget'), group: t('nav.budget') },
      { id: 'capex', icon: 'financials', label: t('nav.capex'), group: t('nav.financials') },
      { id: 'revenue', icon: 'chart', label: t('nav.revenue'), group: t('nav.financials') },
      { id: 'cogs', icon: 'financials', label: t('nav.cogs'), group: t('nav.financials') },
      { id: 'opex', icon: 'financials', label: t('nav.expenses'), group: t('nav.financials') },
      { id: 'pl', icon: 'financials', label: t('nav.pl'), group: t('nav.financials') },
      { id: 'cashflow', icon: 'cash', label: t('nav.cashflow'), group: t('nav.financials') },
      { id: 'wc', icon: 'financials', label: t('nav.working_capital'), group: t('nav.financials') },
      { id: 'breakeven', icon: 'analysis', label: t('nav.breakeven'), group: t('nav.analysis') },
      { id: 'roi', icon: 'analysis', label: t('nav.roi'), group: t('nav.analysis') },
      { id: 'npv', icon: 'analysis', label: t('nav.npv'), group: t('nav.analysis') },
      { id: 'irr', icon: 'analysis', label: t('nav.irr'), group: t('nav.analysis') },
      { id: 'payback', icon: 'analysis', label: t('nav.payback'), group: t('nav.analysis') },
      { id: 'ratios', icon: 'analysis', label: t('nav.ratios'), group: t('nav.analysis') },
      { id: 'scenarios', icon: 'analysis', label: t('nav.scenarios'), group: t('nav.analysis') },
      { id: 'sensitivity', icon: 'analysis', label: t('nav.sensitivity'), group: t('nav.analysis') },
      fin,
      { id: 'screening', icon: 'syariah', label: t('nav.screening'), group: t('nav.syariah'), mode: 'SYARIAH' },
      { id: 'review', icon: 'syariah', label: t('nav.review'), group: t('nav.syariah'), mode: 'SYARIAH' },
      { id: 'reports', icon: 'reports', label: t('nav.reports'), group: t('nav.reports') },
      { id: 'settings', icon: 'settings', label: t('nav.settings'), group: t('nav.settings') }
    ];
  }

  function renderShell() {
    const s = UI.shell({});
    S.$sidebar = s.sidebar; S.$content = s.content; S.$topbar = s.topbar;
    const scrim = document.getElementById('scrim');
    scrim.addEventListener('click', () => { S.$sidebar.classList.remove('open'); scrim.classList.remove('open'); });
  }

  function renderNav(active) {
    const mode = S.proj ? S.proj.financialMode : 'KONVENSIONAL';
    S.$sidebar.innerHTML = UI.NAV({ active, mode, items: navItems() });
    S.$sidebar.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => { go(el.getAttribute('data-nav')); closeSidebar(); });
    });
  }
  function closeSidebar() { S.$sidebar.classList.remove('open'); document.getElementById('scrim').classList.remove('open'); }

  function renderTopbar(pageTitle) {
    const mode = S.proj ? S.proj.financialMode : null;
    const modeCls = mode === 'SYARIAH' ? 'mode-syariah' : 'mode-konvensional';
    const modeTxt = mode === 'SYARIAH' ? t('mode.syariah') : (mode ? t('mode.konvensional') : null);
    S.$topbar.innerHTML =
      '<button class="burger" id="burger">☰</button>' +
      '<div class="tb-title"><span class="crumb">BizFinPro</span> / ' + es(pageTitle) + '</div>' +
      '<div class="tb-spacer"></div>' +
      (S.proj ? '<span class="tb-pill tb-bizname">' + es(truncate(S.proj.name, 26)) + '</span>' : '') +
      '<span class="tb-pill tb-bizname">' + es(cur()) + '</span>' +
      (modeTxt ? '<span class="tb-pill mode ' + modeCls + '"><span class="dot"></span>' + es(t('mode.indicator')) + ': ' + es(modeTxt) + '</span>' : '');
    document.getElementById('burger').addEventListener('click', () => { S.$sidebar.classList.toggle('open'); document.getElementById('scrim').classList.toggle('open'); });
  }
  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  // ---------- router ----------
  function go(page) {
    if (!S.proj && page !== 'projects' && page !== 'settings' && page !== 'home') {
      UI.toast(t('common.select_project'), 'info');
      page = 'projects';
    }
    S.page = page;
    computeAndGo(page);
  }
  function computeAndGo(page, focusPath) {
    if (S.proj) { if (S.dirty) S.F = M.computeFinance(S.proj); }
    S.page = page;
    renderNav(page);
    renderTopbar(pageTitle(page));
    renderPage();
    if (focusPath) restoreFocus(focusPath);
    // re-bind nav clicks (nav rebuilt)
  }
  function pageTitle(page) {
    const titles = {
      home: t('nav.home'), projects: t('nav.projects'), business: t('nav.business'), budget: t('nav.budget'),
      capex: t('nav.capex'), revenue: t('nav.revenue'), cogs: t('nav.cogs'), opex: t('nav.expenses'),
      pl: t('nav.pl'), cashflow: t('nav.cashflow'), wc: t('nav.working_capital'),
      breakeven: t('nav.breakeven'), roi: t('nav.roi'), npv: t('nav.npv'), irr: t('nav.irr'), payback: t('nav.payback'),
      ratios: t('nav.ratios'), scenarios: t('nav.scenarios'), sensitivity: t('nav.sensitivity'),
      financing: S.proj && S.proj.financialMode === 'SYARIAH' ? t('nav.islamic') : t('nav.conventional'),
      screening: t('nav.screening'), review: t('nav.review'), reports: t('nav.reports'), settings: t('nav.settings')
    };
    return titles[page] || '';
  }

  function renderPage() {
    const el = S.$content;
    if (S.page === 'home') renderHome(el);
    else if (S.page === 'projects') renderProjects(el);
    else if (S.page === 'business') renderBusiness(el);
    else if (S.page === 'budget') renderAssumptions(el);
    else if (S.page === 'capex') renderCapex(el);
    else if (S.page === 'revenue') renderRevenue(el);
    else if (S.page === 'cogs') renderCogs(el);
    else if (S.page === 'opex') renderOpex(el);
    else if (S.page === 'pl') renderPl(el);
    else if (S.page === 'cashflow') renderCashflow(el);
    else if (S.page === 'wc') renderWc(el);
    else if (S.page === 'breakeven') renderBreakEven(el);
    else if (S.page === 'roi') renderRoi(el);
    else if (S.page === 'npv') renderNpv(el);
    else if (S.page === 'irr') renderIrr(el);
    else if (S.page === 'payback') renderPayback(el);
    else if (S.page === 'ratios') renderRatios(el);
    else if (S.page === 'scenarios') renderScenarios(el);
    else if (S.page === 'sensitivity') renderSensitivity(el);
    else if (S.page === 'financing') renderFinancing(el);
    else if (S.page === 'screening') renderScreening(el);
    else if (S.page === 'review') renderReview(el);
    else if (S.page === 'reports') renderReports(el);
    else if (S.page === 'settings') renderSettings(el);
    else el.innerHTML = '';
  }

  // ---------- helpers ----------
  function moneySpan(v, d) { return '<span class="num">' + es(money(v, d)) + '</span>'; }
  function cardGrid(cols, itemsHtml) { return '<div class="grid ' + cols + '">' + itemsHtml + '</div>'; }
  function kpiGrid(items) { return '<div class="kpi-grid">' + items.map((i) => UI.kpi(i)).join('') + '</div>'; }
  function sectionHead(title, sub) { return '<div class="card-title"><h3>' + es(title) + '</h3></div>'; }

  /* ============================================================
     HOME — Dashboard
     ============================================================ */
  function renderHome(el) {
    if (!S.proj) {
      el.innerHTML = emptyNoProject();
      return;
    }
    const F = finance();
    const p = S.proj;
    const mode = p.financialMode;
    const modeCls = mode === 'SYARIAH' ? 'mode-syariah' : 'mode-konvensional';
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);

    // shariah status
    let shariahBlock = '';
    if (mode === 'SYARIAH') {
      const sum = Shariah.shariahStatusSummary(p);
      const chipTone = sum.overBadge.tone;
      shariahBlock =
        '<div class="card"><div class="card-title"><h3>🕌 ' + es(t('dashboard.shariah_status')) + '</h3></div>' +
        '<div class="kpi-grid">' +
        UI.kpi({ tone: 'teal', label: t('dashboard.shariah_status'), value: '<span class="chip ' + (chipTone || 'teal') + '">' + es(sum.overBadge.label) + '</span>' }) +
        UI.kpi({ tone: 'violet', label: t('dashboard.financing_structure'), value: es(t('financing.structures.' + (p.financing.islamic.structure || 'murabahah'))) }) +
        UI.kpi({ tone: 'gold', label: t('dashboard.potential_issues'), value: String(sum.screening.flags.length) }) +
        UI.kpi({ tone: 'indigo', label: t('dashboard.review_status'), value: es(t('review.' + sum.review.statusLabel)) }) +
        '</div></div>';
    }

    const FCF = F.invest;
    const alarms = F.alerts.map((a) => {
      const sevTxt = { bad: 'bad', warn: 'warn', info: 'info' }[a.sev] || '';
      const tone = a.sev === 'bad' ? 'rose' : a.sev === 'warn' ? 'gold' : 'gray';
      return '<span class="chip ' + tone + '">' + es(t('alerts.' + a.txt)) + (a.y ? ' · Y' + a.y : '') + '</span>';
    }).join(' ') || '<span class="chip teal">✓ ' + es(t('alerts.none')) + '</span>';

    const roiM = p.roiMethod === 'annualized' ? ' (annualized)' : '';

    el.innerHTML =
      '<div class="mode-hero"><div class="mode-chip-line">' +
      '<span class="mode-chip">' + es(t('mode.indicator')) + ': ' + es(mode) + '</span>' +
      '<span class="chip ' + (mode === 'SYARIAH' ? 'teal' : 'primary') + '">' + es(p.projectionPeriod) + ' ' + es(t('year')) + ' · ' + es(cur()) + '</span>' +
      '</div></div>' +
      '<div class="section-bump"></div>' +
      kpiGrid([
        { tone: 'primary', big: true, label: t('dashboard.total_investment'), value: moneySpan(F.invest.totalInvestment), sub: t('investment.capex') + ' ' + moneySpan(F.initial.capex) },
        { tone: 'teal', label: t('dashboard.revenue'), value: moneySpan(F.revenue.annual[1]), sub: 'Y1' },
        { tone: 'teal', label: t('dashboard.gross_profit'), value: moneySpan(F.grossProfit[1]), sub: 'Y1 · ' + pct(F.grossMargin[1]) + ' margin' },
        { tone: 'teal', label: t('dashboard.net_profit'), value: moneySpan(F.pl.netProfit[F.N]), sub: 'Y' + F.N + ' · ' + pct(F.pl.netMargin[F.N]) },
        { tone: 'indigo', label: t('dashboard.ebitda'), value: moneySpan(F.pl.ebitda[F.N]), sub: 'Y' + F.N },
        { tone: 'violet', label: t('dashboard.closing_cash'), value: moneySpan(F.cf.closing[F.N]), sub: 'Y' + F.N }
      ]) +
      '<div class="section-bump kpi-grid">' +
      UI.kpi({ tone: 'gold', label: t('dashboard.roi'), value: pct(F.invest.roiTotal) + roiM, sub: t('dashboard.irr') + ' ' + (F.invest.irr == null ? t('not_calculable') : pct(F.invest.irr * 100, 2)) }) +
      UI.kpi({ tone: 'primary', label: t('dashboard.npv'), value: moneySpan(F.invest.npv), sub: t('analysis.discount_rate_used') + ' ' + pct(F.invest.discount * 100, 2) }) +
      UI.kpi({ tone: 'indigo', label: t('dashboard.irr'), value: F.invest.irr == null ? t('not_calculable') : pct(F.invest.irr * 100, 2), sub: t('analysis.discount_note') }) +
      UI.kpi({ tone: 'violet', label: t('dashboard.payback'), value: F.invest.payback.paybackYear == null ? t('not_recovered') : F.invest.payback.paybackPeriod.toFixed(2) + ' ' + t('year'), sub: t('analysis.payback_year') + (F.invest.payback.paybackYear ? ' ' + F.invest.payback.paybackYear : '') }) +
      UI.kpi({ tone: 'rose', label: t('dashboard.breakeven'), value: F.invest.breakeven.beRevenue == null ? t('not_calculable') : moneySpan(F.invest.breakeven.beRevenue), sub: t('analysis.be_revenue') + ' Y1' }) +
      UI.kpi({ tone: 'gold', label: t('dashboard.debt'), value: moneySpan(F.financing.injected0 + (mode === 'SYARIAH' ? F.financing.finDeposit0 : 0)), sub: mode === 'SYARIAH' ? t('financing.structures.' + (p.financing.islamic.structure || 'murabahah')) : t('financing.conv_title') }) +
      '</div>' +
      shariahBlock +
      '<div class="section-bump card"><div class="card-title"><h3>📈 ' + es(t('pl.revenue')) + ' / ' + es(t('pl.net_profit')) + '</h3></div><div class="chart-box" id="ch-rev"></div><div class="legend" id="lg-rev"></div></div>' +
      '<div class="two-col section-bump">' +
        '<div class="card"><div class="card-title"><h3>' + es(t('cashflow.title')) + '</h3></div><div class="chart-box short" id="ch-cf"></div></div>' +
        '<div class="card"><div class="card-title"><h3>⚠️ ' + es(t('dashboard.alerts')) + '</h3></div><div style="display:flex;flex-wrap:wrap;gap:6px">' + alarms + '</div><hr><div class="card-title"><h3>' + es(t('dashboard.key_ratios')) + '</h3></div>' + ratiosSummary(F) + '</div>' +
      '</div>';

    // charts
    Charts.lineChart(document.getElementById('ch-rev'), [
      { name: t('pl.revenue'), data: F.revenue.annual.slice(1), color: '#0ea5e9' },
      { name: t('pl.net_profit'), data: F.pl.netProfit.slice(1), color: '#10b981' }
    ], { labels: years, legend: document.getElementById('lg-rev') });
    Charts.barChart(document.getElementById('ch-cf'), years, F.cf.net.slice(1).map((v) => Math.round(v)), { labels: years, tickFmt: (v) => money(v) });
    // color bars by sign
    colorBars(document.getElementById('ch-cf'));
  }

  function colorBars(svgContainer) {
    if (!svgContainer) return;
    svgContainer.querySelectorAll('rect').forEach((r) => {
      r.setAttribute('fill', '#0ea5e9');
    });
  }

  function ratiosSummary(F) {
    const R = F.ratios;
    const rows = [
      [t('ratios.gross_margin'), pct(R.grossMargin)],
      [t('ratios.net_margin'), pct(R.netMargin)],
      [t('ratios.current_ratio'), FMT.num(R.currentRatio, 2) + '×'],
      [t('ratios.debt_ratio'), pct(R.debtRatio)],
      [t('ratios.roa'), pct(R.roa)]
    ];
    return '<div style="display:flex;flex-direction:column">' + rows.map((r) => '<div class="row2"><div class="lbl">' + es(r[0]) + '</div><div class="num" style="font-weight:700">' + es(r[1]) + '</div></div>').join('') + '</div>';
  }

  function emptyNoProject() {
    const empty = document.createElement('div');
    empty.className = 'card';
    empty.innerHTML = '<div class="empty"><div class="big">💼</div><h2 style="margin-bottom:6px">' + es(t('common.no_project')) + '</h2><p>' + es(t('common.select_project')) + '</p>' +
      '<div style="margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap"></div></div></div>';
    const btnWrap = empty.querySelector('.empty > div:last-child');
    const b1 = document.createElement('button'); b1.className = 'btn primary'; b1.textContent = '＋ ' + t('common.new_project'); b1.addEventListener('click', () => newProjectModal());
    const b2 = document.createElement('button'); b2.className = 'btn ghost'; b2.textContent = t('nav.projects'); b2.addEventListener('click', () => go('projects'));
    btnWrap.appendChild(b1); btnWrap.appendChild(b2);
    return empty.outerHTML;
  }

  /* ============================================================
     PROJECTS
     ============================================================ */
  function renderProjects(el) {
    el.innerHTML = '<div id="pj-list">…</div>';
    Store.listProjects().then((list) => {
      const wrap = el.querySelector('#pj-list');
      if (!list.length) {
        wrap.innerHTML = '<div class="card"><div class="empty"><div class="big">📁</div><h2 style="margin-bottom:6px">' + es(t('common.no_project')) + '</h2><p>' + es(t('common.select_project')) + '</p></div></div>';
      } else {
        wrap.innerHTML = '<div class="pj-grid">' + list.map((p) => {
          const F2 = M.computeFinance(M.ensure(p));
          const modeCls = p.financialMode === 'SYARIAH' ? 'teal' : 'primary';
          const modeTxt = p.financialMode === 'SYARIAH' ? t('mode.syariah') : t('mode.konvensional');
          return '<div class="pj-card" data-open="' + p.id + '">' +
            '<div class="pj-top"><div class="pj-ico" style="background:' + (p.financialMode === 'SYARIAH' ? 'var(--teal-soft)' : 'var(--primary-soft)') + '">' + (p.financialMode === 'SYARIAH' ? '🕌' : '🏢') + '</div>' +
            '<div style="flex:1;min-width:0"><div class="pj-name">' + es(p.name || '') + '</div><div class="pj-biz">' + es(p.business.businessName || '—') + '</div></div></div>' +
            '<div class="pj-meta">' +
              '<span class="chip ' + modeCls + '">' + es(modeTxt) + '</span>' +
              '<span class="chip gray">' + es(p.projectionPeriod) + ' ' + es(t('year')) + '</span>' +
              '<span class="chip gray">' + es(p.currency) + '</span>' +
            '</div>' +
            '<div class="kv"><span>' + es(t('dashboard.npv')) + '</span><b class="num">' + es(FMT.money(F2.invest.npv, p.currency, { decimals: 0 })) + '</b></div>' +
            '<div class="kv"><span>' + es(t('dashboard.irr')) + '</span><b class="num">' + (F2.invest.irr == null ? t('not_calculable') : pct(F2.invest.irr * 100, 2)) + '</b></div>' +
            '<div class="kv"><span>' + es(t('dashboard.roi')) + '</span><b class="num">' + pct(F2.invest.roiTotal, 1) + '</b></div>' +
            '<div style="display:flex;gap:6px;margin-top:4px">' +
              '<button class="btn ghost sm" data-edit="' + p.id + '">✎</button>' +
              '<button class="btn ghost sm" data-save="' + p.id + '">💾</button>' +
              '<button class="btn ghost sm danger" data-del="' + p.id + '">🗑</button>' +
            '</div></div>';
        }).join('') + '</div>';
        // open on card click
        wrap.querySelectorAll('.pj-card').forEach((c) => {
          c.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            openProject(c.getAttribute('data-open'));
          });
        });
        wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); renameProjectModal(b.getAttribute('data-edit')); }));
        wrap.querySelectorAll('[data-save]').forEach((b) => b.addEventListener('click', async (e) => { e.stopPropagation(); await backupOne(b.getAttribute('data-save')); }));
        wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); confirmDelete(b.getAttribute('data-del')); }));
      }
    });
  }
  async function openProject(id) {
    const p = await Store.getProject(id);
    if (!p) { UI.toast('Project not found', 'err'); return; }
    await setProject(p);
    go('home');
    UI.toast(p.name + ' — ' + t('common.open'), 'ok');
  }
  function confirmDelete(id) {
    Store.getProject(id).then((p) => {
      UI.modal(t('common.delete'), '<p>' + es((p && p.name) || '') + '</p><p class="muted">' + es(t('common.delete')) + '?</p>',
        '<button class="btn ghost" data-close>' + es(t('cancel')) + '</button><button class="btn danger" id="confirm-del">' + es(t('common.delete')) + '</button>');
      document.getElementById('confirm-del').addEventListener('click', async () => {
        await Store.deleteProject(id);
        UI.closeAllModals();
        if (S.projectId === id) { S.proj = null; S.projectId = null; S.F = null; }
        renderProjects(S.$content); UI.toast(t('common.delete') + ' ✓', 'ok');
      });
    });
  }
  function renameProjectModal(id) {
    Store.getProject(id).then((p) => {
      UI.modal(t('common.rename'), UI.field(t('common.name'), UI.textInput(p.name, { id: 'rn-name' })),
        '<button class="btn ghost" data-close>' + es(t('cancel')) + '</button><button class="btn primary" id="rn-ok">' + es(t('save')) + '</button>');
      document.getElementById('rn-ok').addEventListener('click', async () => {
        p.name = document.getElementById('rn-name').value || p.name;
        await Store.putProject(p);
        UI.closeAllModals();
        if (S.projectId === id) S.proj.name = p.name;
        renderProjects(S.$content); UI.toast(t('common.rename') + ' ✓', 'ok');
      });
    });
  }
  async function backupOne(id) {
    const p = await Store.getProject(id);
    if (!p) return;
    downloadJson(JSON.stringify({ app: 'BizFinPro', schema: 1, modelVersion: 'V1', projects: [M.ensure(p)] }, null, 2), 'BizFinPro_' + ExportXlsx.fileBase(p, 'json') + '.json');
    UI.toast(t('settings.backup_project') + ' ✓', 'ok');
  }
  function downloadJson(text, filename) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ============================================================
     NEW PROJECT modal (mode selection mandatory)
     ============================================================ */
  function newProjectModal(prefill) {
    prefill = prefill || {};
    const p = M.makeProject(prefill.name || '');
    p.projectionPeriod = S.settings.defaultPeriod || 5;
    p.currency = S.settings.currency || 'RM / MYR';
    if (S.settings.defaultDiscountRate != null) p.assumptions.discountRate.auto = Number(S.settings.defaultDiscountRate) || 10, p.assumptions.discountRate.active = Number(S.settings.defaultDiscountRate) || 10;
    if (S.settings.defaultTaxRate != null) p.assumptions.taxRate.auto = Number(S.settings.defaultTaxRate) || 24, p.assumptions.taxRate.active = Number(S.settings.defaultTaxRate) || 24;
    Object.assign(p, prefill);
    UI.modal(t('common.new_project'),
      '<div class="fld"><label>' + es(t('common.name')) + ' <span class="req">*</span></label>' + UI.textInput(p.name, { id: 'np-name', placeholder: 'Cth: Projek Cawangan 2' }) + '</div>' +
      '<div class="fld-row">' +
        '<div class="fld"><label>' + es(t('common.currency')) + '</label>' + UI.selectInput(FMT.CUR_KEYS.map((c) => ({ value: c, label: c })), p.currency, { id: 'np-cur' }) + '</div>' +
        '<div class="fld"><label>' + es(t('common.period')) + '</label>' + UI.selectInput([1, 3, 5, 10, 15, 20].map((n) => ({ value: String(n), label: n + ' ' + t('year') })), String(p.projectionPeriod), { id: 'np-period' }) + '</div>' +
      '</div>' +
      '<div class="section-label" style="margin-top:6px">' + es(t('mode.label')) + ' <span class="req">*</span></div>' +
      '<div class="radio-cards">' +
        '<div class="radio-card mode-konvensional" data-mode="KONVENSIONAL"><span class="rc-check"></span><div class="rc-ico">🏦</div><div class="rc-title">' + es(t('mode.konvensional')) + '</div><div class="rc-sub">' + es(t('mode.konv_sub')) + '</div></div>' +
        '<div class="radio-card mode-syariah" data-mode="SYARIAH"><span class="rc-check"></span><div class="rc-ico">🕌</div><div class="rc-title">' + es(t('mode.syariah')) + '</div><div class="rc-sub">' + es(t('mode.syr_sub')) + '</div></div>' +
      '</div>' +
      '<div id="np-mode-err" style="color:var(--rose);font-size:12px;margin-top:8px;display:none">⚠ ' + es(t('mode.choose')) + '</div>',
      '<button class="btn ghost" data-close>' + es(t('cancel')) + '</button><button class="btn primary" id="np-create" disabled>' + es(t('proceed')) + '</button>',
      { cls: 'wide' });

    let modeSel = null;
    const createBtn = document.getElementById('np-create');
    document.querySelectorAll('.radio-card').forEach((rc) => {
      rc.addEventListener('click', () => {
        document.querySelectorAll('.radio-card').forEach((r) => r.classList.remove('selected'));
        rc.classList.add('selected');
        modeSel = rc.getAttribute('data-mode');
        document.getElementById('np-mode-err').style.display = 'none';
        createBtn.disabled = false;
      });
    });
    createBtn.addEventListener('click', async () => {
      const name = document.getElementById('np-name').value.trim();
      if (!name) { document.getElementById('np-name').classList.add('invalid'); return; }
      if (!modeSel) { document.getElementById('np-mode-err').style.display = 'block'; return; }
      p.name = name;
      p.currency = document.getElementById('np-cur').value;
      p.projectionPeriod = Number(document.getElementById('np-period').value);
      p.financialMode = modeSel;
      M.ensure(p);
      await Store.putProject(p);
      UI.closeAllModals();
      await setProject(p);
      go('home');
      UI.toast(t('common.new_project') + ' ✓', 'ok');
    });
  }

  /* ============================================================
     BUSINESS PROFILE
     ============================================================ */
  function renderBusiness(el) {
    const p = S.proj;
    const b = p.business;
    const f = (key, label, req) => UI.field(label, '<input type="text" data-bind="business.' + key + '" value="' + es(b[key] || '') + '">', { req });
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>️🏢 ' + es(t('profile.title')) + '</h3><span class="hint">' + es(t('common.edit')) + ' ✓ ' + es(t('auto')) + '-save</span></div>' +
      '<div class="grid g2">' +
        f('businessName', t('profile.business_name'), true) +
        f('regNo', t('profile.reg_no')) +
        f('businessType', t('profile.business_type')) +
        f('industry', t('profile.industry')) +
        f('owner', t('profile.owner')) +
        f('employees', t('profile.employees')) +
        f('contact', t('profile.contact')) +
        f('projectType', t('profile.project_type_label')) +
      '</div>' +
      '<div class="fld"><label>' + es(t('profile.address')) + '</label><input type="text" data-bind="business.address" value="' + es(b.address || '') + '"></div>' +
      '<div class="grid g2">' +
        '<div class="fld"><label>' + es(t('profile.description')) + '</label><textarea data-bind="business.description">' + es(b.description || '') + '</textarea></div>' +
        '<div class="fld"><label>' + es(t('profile.objective')) + '</label><textarea data-bind="business.objective">' + es(b.objective || '') + '</textarea></div>' +
      '</div>' +
      '<div class="grid g2">' +
        '<div class="fld"><label>' + es(t('profile.project_objective')) + '</label><textarea data-bind="business.projectObjective">' + es(b.projectObjective || '') + '</textarea></div>' +
        '<div class="fld"><label>' + es(t('profile.projection_period')) + ' (' + es(t('year')) + ')</label><input type="number" min="1" max="30" data-bind="projectionPeriod" value="' + es(p.projectionPeriod) + '"></div>' +
      '</div>' +
      '<hr><div class="row2"><div class="lbl">' + es(t('common.mode')) + '<small></small></div><div>' + modeChipTag(p.financialMode) + '</div></div>' +
      '</div>';
    bindInputs(el);
  }

  function modeChipTag(mode, big) {
    const cls = mode === 'SYARIAH' ? 'teal' : 'primary';
    return '<span class="chip ' + cls + '">' + es(t('mode.indicator')) + ': ' + es(mode === 'SYARIAH' ? t('mode.syariah') : t('mode.konvensional')) + '</span>';
  }

  /* ============================================================
     BUDGET & ASSUMPTIONS
     ============================================================ */
  function renderAssumptions(el) {
    const p = S.proj;
    const cards = M.ASSUMPTION_DEFS.map((d) => {
      const a = p.assumptions[d.key];
      const manual = a.mode === 'manual';
      return '<div class="card tight">' +
        '<div class="row2" style="border:none;padding-top:2px"><div class="lbl">' + es(t('assumptions.' + d.key)) + '<small>' + es(t('active')) + ': ' + num(a.active) + ' ' + d.unit + (manual ? ' · manual' : '') + '</small></div>' +
        '<div class="toggle"><input type="checkbox" data-toggle="' + d.key + '" ' + (manual ? 'checked' : '') + '><span class="tk"></span></div></div>' +
        '<div class="row2" style="border:none;padding:4px 0"><div class="lbl">' + es(t('automatic_value')) + '</div><input type="number" step="any" data-auto="' + d.key + '" value="' + a.auto + '" style="max-width:120px;text-align:right"></div>' +
        '<div class="row2" style="border:none;padding:4px 0"><div class="lbl">' + es(t('manual_override')) + '</div><input type="number" step="any" data-manual="' + d.key + '" value="' + (a.manual == null ? '' : a.manual) + '" ' + (manual ? '' : 'disabled') + ' style="max-width:120px;text-align:right"></div>' +
        '<div class="row2" style="border:none;padding:4px 0"><div class="lbl">' + es(t('active_value')) + '</div><b class="num">' + num(a.active) + ' ' + d.unit + '</b></div>' +
        (manual ? '<button class="btn xs ghost" data-reset="' + d.key + '" style="margin-top:4px">↺ ' + es(t('reset_to_auto')) + '</button>' : '') +
        '</div>';
    }).join('');

    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>⚙️ ' + es(t('assumptions.title')) + '</h3><span class="hint">' + es(t('dashboard.dynamic')) + '</span></div>' +
      '<div class="alert info"><span class="ico">ℹ️</span><div>' + es(t('budget.central_note')) + '</div></div></div>' +
      '<div class="grid g3 section-bump">' + cards + '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>💡 ' + es(t('assumptions.title')) + ' — ' + es(t('revenue.year1_base')) + '</h3></div>' +
      '<div class="grid g3">' +
        '<div class="fld"><label>' + es(t('assumptions.sales_volume')) + ' (' + es(t('revenue.monthly_volume')) + ' ×12)</label><div class="num" style="padding:8px 0;font-weight:700">' + num(F2().revenue.totalUnitsY1) + '</div></div>' +
        '<div class="fld"><label>' + es(t('assumptions.selling_price')) + ' (avg)</label><div class="num" style="padding:8px 0;font-weight:700">' + (F2().revenue.totalUnitsY1 > 0 ? money(F2().revenue.annual[1] / F2().revenue.totalUnitsY1, 2) : '—') + '</div></div>' +
        '<div class="fld"><label>' + es(t('revenue.year1_annual')) + '</label><div class="num" style="padding:8px 0;font-weight:700">' + moneySpan(F2().revenue.annual[1]) + '</div></div>' +
      '</div></div>';

    bindAssumptions(el);
    bindInputs(el);
  }
  function F2() { return finance(); }

  function bindAssumptions(el) {
    el.querySelectorAll('[data-toggle]').forEach((tg) => {
      tg.addEventListener('change', () => {
        const key = tg.getAttribute('data-toggle');
        if (tg.checked) { const man = el.querySelector('[data-manual="' + key + '"]'); BizSet.setA(key, 'manual', man.value); }
        else { BizSet.resetA(key); }
      });
    });
    el.querySelectorAll('[data-auto]').forEach((inp) => {
      inp.addEventListener('input', () => BizSet.setA(inp.getAttribute('data-auto'), 'auto', inp.value, true));
    });
    el.querySelectorAll('[data-manual]').forEach((inp) => {
      inp.addEventListener('input', () => BizSet.setA(inp.getAttribute('data-manual'), 'manual', inp.value, true));
      inp.addEventListener('blur', () => { if (inp.value === '') { BizSet.resetA(inp.getAttribute('data-manual')); } });
    });
    el.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', () => BizSet.resetA(b.getAttribute('data-reset'))));
  }

  /* ============================================================
     CAPEX
     ============================================================ */
  function renderCapex(el) {
    const p = S.proj;
    const F = finance();
    const rows = p.capex.items.map((it) =>
      '<tr>' +
      '<td><input type="text" data-capex-name="' + it.id + '" value="' + es(it.name) + '" style="min-width:150px"></td>' +
      '<td><select data-capex-cat="' + it.id + '">' + catOptions(it.category) + '</select></td>' +
      '<td><input type="number" min="0" data-capex-qty="' + it.id + '" value="' + es(it.qty) + '" style="max-width:80px"></td>' +
      '<td><input type="number" step="any" min="0" data-capex-uc="' + it.id + '" value="' + es(it.unitCost) + '" style="max-width:120px"></td>' +
      '<td class="r"><b class="num">' + money(Number(it.totalCost) || (Number(it.unitCost) || 0) * (Number(it.qty) || 0)) + '</b></td>' +
      '<td><input type="number" min="1" data-capex-life="' + it.id + '" value="' + es(it.usefulLife) + '" style="max-width:70px"></td>' +
      '<td><input type="number" step="any" min="0" data-capex-rv="' + it.id + '" value="' + es(it.residualValue) + '" style="max-width:100px"></td>' +
      '<td><select data-capex-md="' + it.id + '">' +
        '<option value="sl"' + (it.depMethod !== 'rb' ? ' selected' : '') + '>' + t('capex.dep.sl') + '</option>' +
        '<option value="rb"' + (it.depMethod === 'rb' ? ' selected' : '') + '>' + t('capex.dep.rb') + '</option></select></td>' +
      '<td><button class="icon-btn" data-capex-del="' + it.id + '" style="color:var(--rose)">🗑</button></td>' +
      '</tr>').join('');

    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('capex.title')) + '</h3>' +
      '<button class="btn sm primary" id="add-capex">＋ ' + es(t('add')) + '</button></div>' +
      '<div class="tbl-wrap"><table class="data"><thead><tr>' +
      '<th>' + t('capex.asset_name') + '</th><th>' + t('capex.category') + '</th><th>' + t('capex.qty') + '</th><th>' + t('capex.unit_cost') + '</th><th class="r">' + t('capex.total_cost') + '</th><th>' + t('capex.useful_life') + '</th><th>' + t('capex.residual') + '</th><th>' + t('capex.dep_method') + '</th><th></th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="9" class="muted">— ' + t('capex.add_asset') + '</td></tr>') + '</tbody></table></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:24px;margin-top:14px">' +
        '<div style="text-align:right"><div class="tiny">' + es(t('capex.total_capex')) + '</div><div style="font-size:24px;font-weight:800" class="num">' + money(F.capex.total) + '</div></div>' +
      '</div></div>' +
      depSummaryCard(F);

    bindCapex(el);
  }
  function catOptions(sel) {
    const cats = M.CAPEX_CATS;
    return cats.map((c) => '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + t('capex.categories.' + c) + '</option>').join('');
  }
  function bindCapex(el) {
    document.getElementById('add-capex').addEventListener('click', () => BizSet.addCapex());
    el.querySelectorAll('[data-capex-name]').forEach((i) => i.addEventListener('input', () => BizSet.setCapex(i.getAttribute('data-capex-name'), 'name', i.value)));
    el.querySelectorAll('[data-capex-cat]').forEach((i) => i.addEventListener('change', () => BizSet.setCapex(i.getAttribute('data-capex-cat'), 'category', i.value, true)));
    el.querySelectorAll('[data-capex-qty]').forEach((i) => i.addEventListener('input', () => BizSet.setCapex(i.getAttribute('data-capex-qty'), 'qty', i.value, true)));
    el.querySelectorAll('[data-capex-uc]').forEach((i) => i.addEventListener('input', () => BizSet.setCapex(i.getAttribute('data-capex-uc'), 'unitCost', i.value, true)));
    el.querySelectorAll('[data-capex-life]').forEach((i) => i.addEventListener('input', () => BizSet.setCapex(i.getAttribute('data-capex-life'), 'usefulLife', i.value)));
    el.querySelectorAll('[data-capex-rv]').forEach((i) => i.addEventListener('input', () => BizSet.setCapex(i.getAttribute('data-capex-rv'), 'residualValue', i.value)));
    el.querySelectorAll('[data-capex-md]').forEach((i) => i.addEventListener('change', () => BizSet.setCapex(i.getAttribute('data-capex-md'), 'depMethod', i.value, true)));
    el.querySelectorAll('[data-capex-del]').forEach((b) => b.addEventListener('click', () => BizSet.delCapex(b.getAttribute('data-capex-del'))));
  }
  function depSummaryCard(F) {
    const det = F.capex.depSchedule.det;
    if (!det.length) return '';
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    const rows = det.map((d) => {
      const cells = [{ html: UI.esc(d.item.name) }];
      for (let y = 1; y <= F.N; y++) { const s = d.schedule.find((x) => x.y === y); cells.push({ r: true, html: money(s ? s.dep : 0) }); }
      return { cells };
    });
    return '<div class="card section-bump"><div class="card-title"><h3>' + es(t('pl.depreciation')) + '</h3></div>' +
      UI.table([{ label: t('capex.asset_name') }].concat(years.map((y) => ({ label: y, r: true }))), rows, { footnote: t('cashflow.dep_addback') }) + '</div>';
  }

  /* ============================================================
     REVENUE
     ============================================================ */
  function renderRevenue(el) {
    const p = S.proj;
    const F = finance();
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    const streams = p.revenue.streams.map((s, idx) => {
      const amt = s.useRevenue ? Number(s.monthlyRevenue) * 12 : Number(s.monthlyVolume) * Number(s.unitPrice) * 12;
      return '<tr>' +
        '<td><input type="text" data-sr-name="' + s.id + '" value="' + es(s.name) + '" style="min-width:130px"></td>' +
        '<td><select data-sr-type="' + s.id + '"><option value="product"' + (s.type !== 'service' ? ' selected' : '') + '>' + t('revenue.product') + '</option><option value="service"' + (s.type === 'service' ? ' selected' : '') + '>' + t('revenue.service') + '</option></select></td>' +
        '<td><div class="seg"><button data-sr-mode="volume" class="' + (!s.useRevenue ? 'on' : '') + '">' + (s.type === 'service' ? t('revenue.unit_price') : t('revenue.qty')) + ' × ' + t('revenue.unit_price') + '</button><button data-sr-mode="revenue" class="' + (s.useRevenue ? 'on' : '') + '">' + t('revenue.monthly_sales') + '</button></div></td>' +
        (s.useRevenue
          ? '<td><input type="number" step="any" data-sr-mr="' + s.id + '" value="' + es(s.monthlyRevenue) + '" placeholder="' + t('revenue.monthly_sales') + '" style="min-width:110px"></td><td></td>'
          : '<td><input type="number" step="any" data-sr-mv="' + s.id + '" value="' + es(s.monthlyVolume) + '" placeholder="' + (s.type === 'service' ? t('revenue.qty') : t('revenue.monthly_volume')) + '" style="min-width:110px"></td><td><input type="number" step="any" data-sr-up="' + s.id + '" value="' + es(s.unitPrice) + '" placeholder="' + t('revenue.unit_price') + '" style="min-width:110px"></td>') +
        '<td class="r"><b class="num">' + money(amt) + '</b></td>' +
        '<td><input type="number" step="any" data-sr-g="' + s.id + '" value="' + es(s.growth) + '" placeholder="%" style="max-width:70px"></td>' +
        '<td><button class="icon-btn" data-sr-del="' + s.id + '" style="color:var(--rose)">🗑</button></td>' +
        '</tr>';
    }).join('');

    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('revenue.title')) + '</h3><button class="btn sm primary" id="add-sr">＋ ' + es(t('revenue.add_stream')) + '</button></div>' +
      '<div class="tbl-wrap"><table class="data"><thead><tr><th>' + t('revenue.stream_name') + '</th><th>' + t('revenue.type') + '</th><th>' + t('revenue.mode_select') + '</th><th>' + t('revenue.qty') + ' / ' + t('revenue.monthly_sales') + '</th><th>' + t('revenue.unit_price') + '</th><th class="r">' + t('revenue.annual_sales') + '</th><th>' + t('revenue.growth') + ' %</th><th></th></tr></thead><tbody>' + (streams || '') + '</tbody></table></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:24px;margin-top:14px"><div style="text-align:right"><div class="tiny">' + es(t('revenue.year1_annual')) + '</div><div style="font-size:22px;font-weight:800" class="num">' + money(F.revenue.year1) + '</div></div></div>' +
      '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>📈 ' + es(t('revenue.yearly_title')) + '</h3></div><div class="chart-box" id="ch-rev-page"></div><div class="legend" id="lg-rev-page"></div>' +
      UI.table([{ label: t('year') }].concat(years.map((y) => ({ label: y, r: true }))), [{ cells: [{ html: t('pl.revenue') }].concat(F.revenue.annual.slice(1).map((v) => ({ r: true, html: money(v) }))) }], { footnote: t('revenue.growth') + ': ' + pct(F.assumptions.growth * 100) }) +
      '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('revenue.seasonal')) + '</h3></div>' +
      '<div class="grid g2">' +
        '<div class="fld"><label>' + es(t('revenue.season_adj')) + '</label><input type="number" step="0.05" min="1" data-bind="specialAssumptions.seasonAdj" value="' + es(p.specialAssumptions.seasonAdj) + '"></div>' +
        '<div class="fld"><label>' + es(t('revenue.peak_month')) + '</label>' + UI.selectInput([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({ value: String(m), label: MONTH_NAMES[m - 1] })), String(p.specialAssumptions.peakMonth || 5)) + '</div>' +
      '</div>' +
      '<div class="chart-box tall" id="ch-monthly"></div></div>';

    bindRevenue(el);
    Charts.lineChart(document.getElementById('ch-rev-page'), [{ name: t('pl.revenue'), data: F.revenue.annual.slice(1), color: '#0ea5e9' }], { labels: years, legend: document.getElementById('lg-rev-page') });
    // monthly chart: year 1 pattern
    const m1 = F.revenue.monthly[0].map((v) => Math.round(v));
    Charts.barChart(document.getElementById('ch-monthly'), M.MONTHS, m1, { labels: M.MONTHS, tickFmt: (v) => money(v) });
  }
  const MONTH_NAMES = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

  function bindRevenue(el) {
    document.getElementById('add-sr').addEventListener('click', () => BizSet.addStream());
    el.querySelectorAll('[data-sr-name]').forEach((i) => i.addEventListener('input', () => BizSet.setStream(i.getAttribute('data-sr-name'), 'name', i.value)));
    el.querySelectorAll('[data-sr-type]').forEach((i) => i.addEventListener('change', () => BizSet.setStream(i.getAttribute('data-sr-type'), 'type', i.value, true)));
    el.querySelectorAll('[data-sr-mode]').forEach((b) => b.addEventListener('click', () => BizSet.setStream(b.closest('tr').querySelector('[data-sr-name]').getAttribute('data-sr-name'), 'mode', b.classList.contains('on') ? b.getAttribute('data-sr-mode') : b.getAttribute('data-sr-mode'), true)));
    el.querySelectorAll('[data-sr-mv]').forEach((i) => i.addEventListener('input', () => BizSet.setStream(i.getAttribute('data-sr-mv'), 'monthlyVolume', i.value, true)));
    el.querySelectorAll('[data-sr-up]').forEach((i) => i.addEventListener('input', () => BizSet.setStream(i.getAttribute('data-sr-up'), 'unitPrice', i.value, true)));
    el.querySelectorAll('[data-sr-mr]').forEach((i) => i.addEventListener('input', () => BizSet.setStream(i.getAttribute('data-sr-mr'), 'monthlyRevenue', i.value, true)));
    el.querySelectorAll('[data-sr-g]').forEach((i) => i.addEventListener('input', () => BizSet.setStream(i.getAttribute('data-sr-g'), 'growth', i.value)));
    el.querySelectorAll('[data-sr-del]').forEach((b) => b.addEventListener('click', () => BizSet.delStream(b.getAttribute('data-sr-del'))));
    bindInputs(el);
  }

  /* ============================================================
     COGS
     ============================================================ */
  function renderCogs(el) {
    const p = S.proj;
    const F = finance();
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('cogs.title')) + '</h3></div>' +
      '<div class="grid g3">' +
        '<div class="fld"><label>' + es(t('cogs.material')) + ' — % ' + es(t('pl.revenue')) + '</label><input type="number" step="any" min="0" data-bind="specialAssumptions.materialPct" value="' + es(p.specialAssumptions.materialPct == null ? '' : p.specialAssumptions.materialPct) + '" placeholder="' + es(t('cogs.auto_from_assumption') + ' ' + F.cogs.materialPct + '%') + '"></div>' +
        '<div class="fld"><label>' + es(t('cogs.direct_labour')) + ' (' + es(t('budget.yearly')) + ')</label><input type="number" step="any" min="0" data-bind="specialAssumptions.directLabourAnnual" value="' + es(p.specialAssumptions.directLabourAnnual || '') + '"></div>' +
        '<div class="fld"><label>' + es(t('cogs.direct_production')) + ' (' + es(t('budget.yearly')) + ')</label><input type="number" step="any" min="0" data-bind="specialAssumptions.directProductionAnnual" value="' + es(p.specialAssumptions.directProductionAnnual || '') + '"></div>' +
        '<div class="fld"><label>' + es(t('cogs.other_direct')) + ' (' + es(t('budget.yearly')) + ')</label><input type="number" step="any" min="0" data-bind="specialAssumptions.otherDirectAnnual" value="' + es(p.specialAssumptions.otherDirectAnnual || '') + '"></div>' +
      '</div>' +
      '<div class="tiny" style="margin-top:6px">' + es(t('cogs.as_pct_of_revenue')) + ': ' + FMT.num(F.cogs.materialPct, 1) + '% · units Y1: ' + FMT.num(F.revenue.totalUnitsY1) + '</div></div>' +
      '<div class="two-col section-bump">' +
        '<div class="card"><div class="card-title"><h3>💰 ' + es(t('cogs.gross_profit')) + '</h3></div>' +
        '<div class="row2"><div class="lbl">' + es(t('pl.gross_profit')) + ' Y1</div><b class="num">' + money(F.grossProfit[1]) + '</b></div>' +
        '<div class="row2"><div class="lbl">' + es(t('cogs.gross_margin')) + ' Y1</div><b class="num">' + pct(F.grossMargin[1]) + '</b></div></div>' +
        '<div class="card"><div class="card-title"><h3>📊 ' + es(t('cogs.title')) + ' vs ' + es(t('pl.gross_profit')) + '</h3></div><div class="chart-box short" id="ch-cogs"></div><div class="legend" id="lg-cogs"></div></div>' +
      '</div>' +
      UI.card(null,
        UI.table([{ label: t('year') }, { label: t('pl.revenue'), r: true }, { label: t('pl.cogs'), r: true }, { label: t('pl.gross_profit'), r: true }, { label: t('cogs.gross_margin') + ' %', r: true }],
          years.map((y, i) => ({ cells: [
            { html: y },
            { r: true, html: money(F.revenue.annual[i + 1]) },
            { r: true, html: money(F.cogs.annual[i + 1]) },
            { r: true, html: money(F.grossProfit[i + 1]) },
            { r: true, html: pct(F.grossMargin[i + 1]) }
          ] }))), { cls: 'section-bump' });
    bindInputs(el);
    Charts.lineChart(document.getElementById('ch-cogs'), [
      { name: t('pl.revenue'), data: F.revenue.annual.slice(1), color: '#0ea5e9' },
      { name: t('pl.cogs'), data: F.cogs.annual.slice(1), color: '#f59e0b' },
      { name: t('pl.gross_profit'), data: F.grossProfit.slice(1), color: '#10b981' }
    ], { labels: years, legend: document.getElementById('lg-cogs') });
  }

  /* ============================================================
     OPEX
     ============================================================ */
  function renderOpex(el) {
    const p = S.proj;
    const F = finance();
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    const catRows = M.OPEX_CATS.map(([key, label]) => {
      const c = p.opex.categories[key] || { monthly: true, base: '', growth: '' };
      const y1 = c.monthly !== false ? Number(c.base || 0) * 12 : Number(c.base || 0);
      return '<tr>' +
        '<td><b>' + t('expenses.' + key) + '</b></td>' +
        '<td><div class="seg"><button data-okm-month="' + key + '" class="' + (c.monthly !== false ? 'on' : '') + '">' + t('expenses.monthly') + '</button><button data-okm-annual="' + key + '" class="' + (c.monthly === false ? 'on' : '') + '">' + t('expenses.annual') + '</button></div></td>' +
        '<td><input type="number" step="any" min="0" data-okb="' + key + '" value="' + es(c.base) + '" style="max-width:120px"></td>' +
        '<td><input type="number" step="any" data-okg="' + key + '" value="' + es(c.growth) + '" placeholder="' + pct(F.assumptions.opexGrowth * 100, 0) + '" style="max-width:80px"></td>' +
        '<td class="r"><b class="num">' + money(y1) + '</b></td>' +
        '<td class="r num">' + money(F.opex.categories.find((x) => x.key === key).annual[F.N]) + '</td>' +
        '</tr>';
    }).join('');

    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('expenses.title')) + '</h3></div>' +
      '<div class="tbl-wrap"><table class="data"><thead><tr><th>' + t('expenses.title') + '</th><th>' + t('expenses.periodic') + '</th><th>' + (t('expenses.monthly') + ' / ' + t('expenses.annual') + ' RM') + '</th><th>' + t('expenses.growth') + ' %</th><th class="r">Y1</th><th class="r">Y' + F.N + '</th></tr></thead><tbody>' + catRows + '</tbody></table></div>' +
      '<div class="tiny" style="margin-top:6px">' + es(t('expenses.growth_blank_note')) + ': ' + pct(F.assumptions.opexGrowth * 100, 0) + ' (andaian pusat)</div></div>';
    bindOpex(el);
    el.querySelectorAll('[data-okm-month]').forEach((b) => b.addEventListener('click', () => BizSet.setOpex(b.getAttribute('data-okm-month'), 'monthly', true, true)));
    el.querySelectorAll('[data-okm-annual]').forEach((b) => b.addEventListener('click', () => BizSet.setOpex(b.getAttribute('data-okm-annual'), 'monthly', false, true)));
    el.querySelectorAll('[data-okb]').forEach((i) => i.addEventListener('input', () => BizSet.setOpex(i.getAttribute('data-okb'), 'base', i.value, true)));
    el.querySelectorAll('[data-okg]').forEach((i) => i.addEventListener('input', () => BizSet.setOpex(i.getAttribute('data-okg'), 'growth', i.value)));
  }
  function bindOpex(el) { /* bound inline above */ }

  /* ============================================================
     PROFIT & LOSS
     ============================================================ */
  function renderPl(el) {
    const F = finance();
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    const head = [{ label: '' }].concat(years.map((y) => ({ label: y, r: true })));
    const L = (lbl, arr, bold, isMoney) => ({
      cls: bold ? 'total' : '',
      cells: [{ html: (bold ? '' : '') + lbl }].concat(Array.from({ length: F.N }, (_, i) => ({ r: true, html: isMoney === false ? FMT.num(arr[i + 1], 1) : money(arr[i + 1]) })))
    });
    const plRows = [
      L(t('pl.revenue'), F.pl.revenue), L(t('pl.cogs'), F.pl.cogs), L(t('pl.gross_profit'), F.pl.grossProfit),
      L(t('pl.opex'), F.pl.opex), L(t('pl.ebitda'), F.pl.ebitda), L(t('pl.depreciation'), F.pl.dep),
      L(t('pl.ebit'), F.pl.ebit), L(t('pl.financing_cost'), F.pl.financingCost), L(t('pl.pbt'), F.pl.pbt),
      L(t('pl.tax'), F.pl.tax), L(t('pl.net_profit'), F.pl.netProfit, true)
    ];
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('pl.title')) + '</h3></div>' + UI.table(head, plRows) + '</div>' +
      '<div class="two-col section-bump">' +
        '<div class="card"><div class="card-title"><h3>📈 ' + es(t('pl.ebitda')) + ' / ' + es(t('pl.net_profit')) + '</h3></div><div class="chart-box" id="ch-pl"></div><div class="legend" id="lg-pl"></div></div>' +
        '<div class="card"><div class="card-title"><h3>' + es(t('pl.nm')) + ' % · ' + es(t('pl.em')) + ' %</h3></div>' +
          '<div class="row2"><div class="lbl">' + es(t('pl.gm')) + ' (Y' + F.N + ')</div><b>' + pct(F.pl.grossMargin[F.N]) + '</b></div>' +
          '<div class="row2"><div class="lbl">' + es(t('pl.em')) + ' (Y' + F.N + ')</div><b>' + pct(F.pl.ebitdaMargin[F.N]) + '</b></div>' +
          '<div class="row2"><div class="lbl">' + es(t('pl.nm')) + ' (Y' + F.N + ')</div><b>' + pct(F.pl.netMargin[F.N]) + '</b></div>' +
          '<div class="tiny" style="margin-top:8px">' + es(t('pl.profit_margin_note')) + '</div>' +
        '</div>' +
      '</div>';
    Charts.groupBar(document.getElementById('ch-pl'), years, [
      { name: t('pl.ebitda'), data: F.pl.ebitda.slice(1), color: '#0ea5e9' },
      { name: t('pl.net_profit'), data: F.pl.netProfit.slice(1), color: '#10b981' }
    ], { labels: years, legend: document.getElementById('lg-pl') });
  }

  /* ============================================================
     CASH FLOW
     ============================================================ */
  function renderCashflow(el) {
    const F = finance();
    const p = S.proj;
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    const head = [{ label: '' }].concat(years.map((y) => ({ label: y, r: true })));
    const L = (lbl, arr, bold) => ({ cls: bold ? 'total' : '', cells: [{ html: lbl }].concat(Array.from({ length: F.N }, (_, i) => ({ r: true, html: money(arr[i + 1]) }))) });
    const rows = [
      L(t('cashflow.operating'), F.cf.operating), L(t('cashflow.investing'), F.cf.investing), L(t('cashflow.financing'), F.cf.financing),
      L(t('cashflow.net'), F.cf.net), L(t('cashflow.opening'), F.cf.opening), L(t('cashflow.closing'), F.cf.closing, true)
    ];
    const y0rows = UI.table([{ label: t('year') + ' 0' }, { label: t('cashflow.investing'), r: true }, { label: t('cashflow.financing'), r: true }, { label: t('cashflow.net'), r: true }], [{
      cells: [{ html: t('dashboard.total_investment') + ' (Y0)' }, { r: true, html: money(F.cf.investing[0]) }, { r: true, html: money(F.cf.financing[0]) }, { r: true, html: money(F.cf.investing[0] + F.cf.financing[0]) }]
    }]);
    el.innerHTML =
      '<div class="alert info"><span class="ico">ℹ️</span><div>' + es(t('cashflow.note')) + '</div></div>' +
      UI.card(null, y0rows + '<div class="section-bump">' + UI.table(head, rows) + '</div>') +
      '<div class="card section-bump"><div class="card-title"><h3>📊 ' + es(t('cashflow.closing')) + '</h3></div><div class="chart-box" id="ch-cf2"></div></div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('cashflow.title')) + ' vs ' + es(t('pl.net_profit')) + '</h3></div><div class="chart-box" id="ch-cf3"></div><div class="legend" id="lg-cf3"></div></div>';
    Charts.barChart(document.getElementById('ch-cf2'), years, F.cf.closing.slice(1).map((v) => Math.round(v)), { labels: years, tickFmt: (v) => money(v), color: v => v < 0 ? '#e11d48' : '#10b981' });
    Charts.lineChart(document.getElementById('ch-cf3'), [
      { name: t('cashflow.closing'), data: F.cf.closing.slice(1), color: '#0ea5e9' },
      { name: t('pl.net_profit'), data: F.pl.netProfit.slice(1), color: '#10b981' }
    ], { labels: years, legend: document.getElementById('lg-cf3') });
  }

  /* ============================================================
     WORKING CAPITAL
     ============================================================ */
  function renderWc(el) {
    const F = finance();
    const p = S.proj;
    const years = []; for (let y = 1; y <= F.N; y++) years.push('Y' + y);
    const head = [{ label: '' }].concat(years.map((y) => ({ label: y, r: true })));
    const L = (lbl, arr, bold) => ({ cls: bold ? 'total' : '', cells: [{ html: lbl }].concat(Array.from({ length: F.N }, (_, i) => ({ r: true, html: money(arr[i + 1]) }))) });
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('wc.title')) + '</h3></div>' +
      '<div class="grid g3">' +
        '<div class="fld"><label>' + es(t('wc.collection_days')) + '</label><input type="number" min="0" data-bind-assumptions="collectionDays"></div>' +
        '<div class="fld"><label>' + es(t('wc.inventory_days')) + '</label><input type="number" min="0" data-bind-assumptions="inventoryDays"></div>' +
        '<div class="fld"><label>' + es(t('wc.payment_days')) + '</label><input type="number" min="0" data-bind-assumptions="paymentDays"></div>' +
      '</div>' +
      '<div class="tiny">' + es(t('wc.days_hint')) + '</div></div>' +
      UI.card(null, UI.table(head, [
        L(t('wc.ar'), F.wc.ar), L(t('wc.inventory'), F.wc.inv), L(t('wc.ap'), F.wc.ap), L(t('wc.wc_req'), F.wc.end, true)
      ]), { cls: 'section-bump' }) +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('wc.cash_req')) + '</h3></div>' +
      '<div class="kpi-grid">' +
        UI.kpi({ tone: 'primary', label: t('wc.wc_req') + ' Y1', value: moneySpan(F.wc.initialWC) }) +
        UI.kpi({ tone: 'indigo', label: t('wc.ar') + ' Y1', value: moneySpan(F.wc.ar[1]) }) +
        UI.kpi({ tone: 'gold', label: t('wc.ap') + ' Y1', value: moneySpan(F.wc.ap[1]) }) +
      '</div></div>';
    bindInputs(el);
  }

  /* ============================================================
     BREAK-EVEN
     ============================================================ */
  function renderBreakEven(el) {
    const F = finance();
    const be = F.invest.breakeven;
    const maxUnits = be.beUnits != null ? Math.max(be.beUnits * 2, 1000) : (be.pricePerUnit > 0 ? (be.fixedCost / be.pricePerUnit) * 3 + 1000 : 1000);
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.breakeven_title')) + '</h3><span class="hint">Y1</span></div>' +
      '<div class="kpi-grid">' +
        UI.kpi({ tone: 'primary', big: true, label: t('analysis.be_units'), value: be.beUnits == null ? t('not_calculable') : FMT.num(Math.round(be.beUnits)) }) +
        UI.kpi({ tone: 'teal', label: t('analysis.be_revenue'), value: be.beRevenue == null ? t('not_calculable') : moneySpan(be.beRevenue) }) +
        UI.kpi({ tone: 'indigo', label: t('analysis.contribution_margin'), value: moneySpan(be.contributionPerUnit), sub: 'per unit' }) +
        UI.kpi({ tone: 'gold', label: t('analysis.contribution_pct'), value: pct(be.contributionPct) }) +
        UI.kpi({ tone: 'rose', label: t('analysis.fixed_cost'), value: moneySpan(be.fixedCost) }) +
        UI.kpi({ tone: 'violet', label: t('analysis.variable_cost'), value: moneySpan(be.variableCost) }) +
      '</div>' +
      '<div class="formula-box" style="margin-top:14px">' + es(t('analysis.contribution_margin')) + ' = ' + es(t('analysis.selling_price')) + ' − ' + es(t('analysis.variable_cost')) + ' &nbsp;·&nbsp; ' + es(t('analysis.be_units')) + ' = ' + es(t('analysis.fixed_cost')) + ' ÷ ' + es(t('analysis.contribution_margin')) + '</div>' +
      '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>📉 ' + es(t('analysis.breakeven_title')) + ' — ' + es(t('details')) + '</h3></div>' +
      '<div class="chart-box" id="ch-be"></div></div>';
    Charts.breakEvenChart(document.getElementById('ch-be'), { fixedCost: be.fixedCost, pricePerUnit: be.pricePerUnit, varCostPerUnit: be.varCostPerUnit, maxUnits, beUnits: be.beUnits, tickFmt: (v) => money(v) });
  }

  /* ============================================================
     ROI
     ============================================================ */
  function renderRoi(el) {
    const p = S.proj;
    const F = finance();
    const I = F.invest;
    const roi = p.roiMethod === 'annualized' ? I.roiAnnual : I.roiTotal;
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.roi_title')) + '</h3></div>' +
      '<div class="grid g2">' +
        '<div class="fld"><label>' + es(t('analysis.roi_method')) + '</label>' + UI.selectInput([
          { value: 'total', label: t('analysis.method_total') },
          { value: 'annualized', label: t('analysis.method_annual') }
        ], p.roiMethod || 'total', { id: 'roi-method' }) + '</div>' +
        '<div class="fld"><label>&nbsp;</label><div class="num" style="padding:8px 0;font-weight:700">' + (p.roiMethod === 'annualized' ? '÷ ' + F.N + ' ' + t('year') : '') + '</div></div>' +
      '</div>' +
      '<div class="formula-box" style="margin-top:8px">ROI = (' + es(t('analysis.net_return')) + ' ÷ ' + es(t('analysis.investment')) + ') × 100' + (p.roiMethod === 'annualized' ? ' ÷ ' + F.N : '') + '</div>' +
      '<div class="kpi-grid" style="margin-top:14px">' +
        UI.kpi({ tone: 'primary', big: true, label: t('analysis.investment'), value: moneySpan(I.totalInvestment) }) +
        UI.kpi({ tone: 'teal', label: t('analysis.return'), value: moneySpan(I.sumFCF) }) +
        UI.kpi({ tone: (I.netReturn >= 0 ? 'teal' : 'rose'), label: t('analysis.net_return'), value: moneySpan(I.netReturn) }) +
        UI.kpi({ tone: 'gold', label: 'ROI %', value: pct(roi) }) +
      '</div></div>';
    document.getElementById('roi-method') && document.getElementById('roi-method').addEventListener('change', function () {
      S.proj.roiMethod = this.value; markDirty(); scheduleSave(); refreshNow();
    });
  }

  /* ============================================================
     NPV
     ============================================================ */
  function renderNpv(el) {
    const p = S.proj;
    const F = finance();
    const I = F.invest;
    const a = p.assumptions.discountRate;
    const manual = a.mode === 'manual';
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.npv_title')) + '</h3><span class="hint">' + es(t('assumptions.discount_rate')) + ' ' + pct(I.discount * 100, 2) + '</span></div>' +
      '<div class="alert ' + (I.npv >= 0 ? 'ok' : 'bad') + '"><span class="ico">' + (I.npv >= 0 ? '✓' : '✕') + '</span><div>' + es(t('dashboard.npv')) + ' = <b class="num">' + money(I.npv) + '</b>' + (I.npv < 0 ? ' — ' + es(t('alerts.neg_npv')) : '') + '</div></div>' +
      '<div class="formula-box">NPV = Σ [CF<sub>t</sub> ÷ (1+r)<sup>t</sup>] − ' + es(t('analysis.initial_investment')) + '</div>' +
      '<div class="grid g2" style="margin-top:12px">' +
        '<div class="fld"><label>' + es(t('assumptions.discount_rate')) + ' — ' + es(t('auto')) + ' %</label><input type="number" step="any" data-discount-auto value="' + a.auto + '"></div>' +
        '<div class="fld"><label>' + es(t('assumptions.discount_rate')) + ' — ' + es(t('manual')) + ' %</label><input type="number" step="any" data-discount-manual value="' + (a.manual == null ? '' : a.manual) + '" ' + (manual ? '' : 'disabled') + '></div>' +
      '</div>' +
      '<div class="row2"><div class="lbl">' + es(t('assumptions.active_rate')) + '</div><b>' + pct(I.discount * 100, 2) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + es(t('assumptions.rate_source')) + '</div><span class="muted">' + (manual ? es(t('assumptions.manual_note')) : es(t('assumptions.auto_default'))) + '</span></div>' +
      (manual ? '<button class="btn xs ghost" id="discount-reset">↺ ' + es(t('reset_to_auto')) + '</button>' : '') +
      '</div>' +
      UI.card(null, UI.table(
        [{ label: t('year') }, { label: t('analysis.investment'), r: true }, { label: 'PV', r: true }],
        [{ cells: [{ html: 'Y0' }, { r: true, html: money(-I.totalInvestment) }, { r: true, html: money(-I.totalInvestment) }] }]
          .concat(F.pvSeries.map((s) => ({ cells: [{ html: 'Y' + s.y }, { r: true, html: money(s.fcf) }, { r: true, html: money(s.pv) }] })))
          .concat([{ cls: 'total', cells: [{ html: t('total') }, { r: true, html: money(I.sumFCF) }, { r: true, html: money(I.pvSum) }] }]),
        { footnote: t('dashboard.npv') + ' = ' + money(I.pvSum) + ' − ' + money(I.totalInvestment) + ' = ' + money(I.npv) }
      ), { cls: 'section-bump' });

    el.querySelector('[data-discount-auto]').addEventListener('input', function () { BizSet.setA('discountRate', 'auto', this.value, true); });
    el.querySelector('[data-discount-manual]').addEventListener('input', function () { BizSet.setA('discountRate', 'manual', this.value, true); });
    const r = el.querySelector('#discount-reset');
    if (r) r.addEventListener('click', () => BizSet.resetA('discountRate'));
  }

  /* ============================================================
     IRR
     ============================================================ */
  function renderIrr(el) {
    const F = finance();
    const I = F.invest;
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.irr_title')) + '</h3></div>' +
      '<div class="alert info"><span class="ico">ℹ️</span><div>' + es(t('analysis.discount_note')) + '</div></div>' +
      '<div class="kpi-grid">' +
        UI.kpi({ tone: 'indigo', big: true, label: t('dashboard.irr'), value: I.irr == null ? t('not_calculable') : pct(I.irr * 100, 2), sub: I.irr == null ? es(t('alerts.irr_nc')) : '' }) +
        UI.kpi({ tone: 'primary', label: t('analysis.initial_investment'), value: moneySpan(I.totalInvestment) }) +
        UI.kpi({ tone: 'teal', label: t('analysis.discount_rate_used'), value: pct(I.discount * 100, 2) }) +
      '</div>' +
      '<div class="formula-box" style="margin-top:14px">' + es(t('formula')) + ': 0 = Σ CF<sub>t</sub> ÷ (1+IRR)<sup>t</sup></div></div>' +
      UI.card(null, UI.table(
        [{ label: t('year') }, { label: t('analysis.investment') + ' (' + t('year') + ' 0)', r: true }, { label: 'IRR', r: true }],
        [{ cells: [{ html: '0' }, { r: true, html: money(I.irrSeries[0]) }, { r: true, html: '—' }] }]
          .concat(I.irrSeries.slice(1).map((v, i) => ({ cells: [{ html: (i + 1) }, { r: true, html: money(v) }, { r: true, html: I.irr == null ? '—' : '÷(1+IRR)' }] }))),
        { footnote: I.irr == null ? es(t('not_calculable')) : ('IRR = ' + pct(I.irr * 100, 3)) }
      ), { cls: 'section-bump' });
  }

  /* ============================================================
     PAYBACK
     ============================================================ */
  function renderPayback(el) {
    const F = finance();
    const pb = F.invest.payback;
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.payback_title')) + '</h3></div>' +
      '<div class="kpi-grid">' +
        UI.kpi({ tone: 'primary', label: t('analysis.initial_investment'), value: moneySpan(pb.totalInvestment) }) +
        UI.kpi({ tone: pb.recovered ? 'teal' : 'rose', big: true, label: t('analysis.payback_period'), value: pb.recovered ? (pb.paybackPeriod.toFixed(2) + ' ' + t('year')) : t('not_recovered') }) +
        UI.kpi({ tone: 'indigo', label: t('analysis.payback_year'), value: pb.paybackYear == null ? '—' : 'Y' + pb.paybackYear }) +
      '</div></div>' +
      UI.card(null, UI.table(
        [{ label: t('year') }, { label: t('analysis.annual_cf'), r: true }, { label: t('analysis.cumulative_cf'), r: true }],
        pb.cumulative.map((c) => ({
          cls: pb.paybackYear === c.y ? 'total' : '',
          cells: [{ html: 'Y' + c.y }, { r: true, html: money(c.fcf) }, { r: true, html: money(c.cumulative) }]
        })),
        { footnote: pb.recovered ? es(t('analysis.payback_period')) + ' = ' + pb.paybackPeriod.toFixed(2) + ' ' + t('year') : es(t('not_recovered')) }
      ), { cls: 'section-bump' }) +
      '<div class="card section-bump"><div class="card-title"><h3>📈 ' + es(t('analysis.cumulative_cf')) + '</h3></div><div class="chart-box" id="ch-pb"></div><div class="legend" id="lg-pb"></div></div>';
    Charts.lineChart(document.getElementById('ch-pb'), [
      { name: t('analysis.cumulative_cf'), data: pb.cumulative.map((c) => c.cumulative), color: '#0ea5e9' }
    ], { labels: pb.cumulative.map((c) => 'Y' + c.y), legend: document.getElementById('lg-pb') });
  }

  /* ============================================================
     FINANCIAL RATIOS
     ============================================================ */
  function renderRatios(el) {
    const F = finance();
    const R = F.ratios;
    const group = (title, rows) => '<div class="card"><div class="card-title"><h3>' + es(title) + '</h3></div>' +
      '<div>' + rows.map((r) => '<div class="row2"><div class="lbl">' + es(r[0]) + '<small>' + es(r[2] || '') + '</small></div><b class="num">' + r[1] + '</b></div>').join('') + '</div></div>';
    el.innerHTML =
      '<div class="grid g2">' +
      group(t('analysis.profitability') + ' (Y' + F.N + ')', [
        [t('ratios.gross_margin'), pct(R.grossMargin), t('formula') + ': ' + es(t('pl.gross_profit')) + ' ÷ ' + es(t('pl.revenue'))],
        [t('ratios.ebitda_margin'), pct(R.ebitdaMargin), 'EBITDA ÷ ' + es(t('pl.revenue'))],
        [t('ratios.net_margin'), pct(R.netMargin), es(t('pl.net_profit')) + ' ÷ ' + es(t('pl.revenue'))],
        [t('ratios.roa'), pct(R.roa), es(t('pl.net_profit')) + ' ÷ ' + es(t('ratios.total_assets'))],
        [t('ratios.roe'), R.roe == null ? t('not_calculable') : pct(R.roe), es(t('pl.net_profit')) + ' ÷ ' + es(t('ratios.equity'))]
      ]) +
      group(t('analysis.liquidity'), [
        [t('ratios.current_ratio'), FMT.num(R.currentRatio, 2) + '×', es(t('ratios.current_assets')) + ' ÷ ' + es(t('ratios.current_liab'))],
        [t('ratios.quick_ratio'), FMT.num(R.quickRatio, 2) + '×', '(' + es(t('ratios.current_assets')) + ' − ' + es(t('wc.inventory')) + ') ÷ ' + es(t('ratios.current_liab'))]
      ]) +
      group(t('analysis.leverage'), [
        [t('ratios.debt_ratio'), pct(R.debtRatio), es(t('financing.title')) + ' ÷ ' + es(t('ratios.total_assets'))],
        [t('ratios.dte'), R.debtToEquity == null ? t('not_calculable') : FMT.num(R.debtToEquity, 2) + '×', es(t('financing.title')) + ' ÷ ' + es(t('ratios.equity'))]
      ]) +
      group(t('analysis.efficiency'), [
        [t('ratios.asset_turnover'), FMT.num(R.assetTurnover, 2) + '×', es(t('pl.revenue')) + ' ÷ ' + es(t('ratios.total_assets'))],
        [t('ratios.recv_days'), R.receivableDays + ' d', es(t('wc.collection_days'))],
        [t('ratios.inv_days'), R.inventoryDays + ' d', es(t('wc.inventory_days'))],
        [t('ratios.pay_days'), R.payableDays + ' d', es(t('wc.payment_days'))]
      ]) +
      '</div>';
  }

  /* ============================================================
     SCENARIOS
     ============================================================ */
  function renderScenarios(el) {
    const p = S.proj;
    const SC = M.scenarioTable(p);
    const def = M.defaultScenarioConfig();
    const LBL = { base: t('analysis.base'), optimistic: t('analysis.optimistic'), pessimistic: t('analysis.pessimistic') };
    const tone = { base: 'primary', optimistic: 'teal', pessimistic: 'rose' };
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.scenario_title')) + '</h3></div>' +
      '<div class="grid g3">' + ['base', 'optimistic', 'pessimistic'].map((id) => {
        const c = p.scenarios[id] || {};
        const val = (k) => (c[k] == null || c[k] === '' ? '' : c[k]);
        return '<div class="card tight"><div class="card-title"><h3><span class="chip ' + tone[id] + '">' + es(LBL[id]) + '</span></h3></div>' +
          '<div class="fld"><label>' + es(t('scenarios.growth_pct')) + ' (' + es(t('scenarios.revenue')) + ')</label><input type="number" step="any" data-scn="' + id + ':revenueGrowth" value="' + val('revenueGrowth') + '" placeholder="' + (id === 'base' ? num(p.assumptions.revenueGrowth.active) : '') + '"></div>' +
          '<div class="fld"><label>' + es(t('scenarios.cogs_pct')) + ' (' + es(t('cogs.title')) + ' %)</label><input type="number" step="any" data-scn="' + id + ':cogsPct" value="' + val('cogsPct') + '" placeholder="0"></div>' +
          '<div class="fld"><label>' + es(t('scenarios.opex_pct')) + ' (' + es(t('expenses.title')) + ' %)</label><input type="number" step="any" data-scn="' + id + ':opexPct" value="' + val('opexPct') + '" placeholder="0"></div>' +
          '</div>';
      }).join('') + '</div></div>' +
      UI.card(null, UI.table(
        [{ label: t('reports.scenarios') }, { label: t('dashboard.npv'), r: true }, { label: 'IRR %', r: true }, { label: t('dashboard.roi') + ' %', r: true }, { label: t('scenarios.net_profit'), r: true }, { label: t('scenarios.be_units'), r: true }],
        SC.map((s) => ({ cls: '', cells: [
          { html: '<span class="chip ' + tone[s.id] + '">' + es(LBL[s.id]) + '</span>' },
          { r: true, html: money(s.metric.npv) },
          { r: true, html: s.metric.irr == null ? t('not_calculable') : pct(s.metric.irr * 100, 1) },
          { r: true, html: pct(s.metric.roi, 1) },
          { r: true, html: money(s.metric.netProfitY5) },
          { r: true, html: s.metric.beUnits == null ? t('not_calculable') : FMT.num(Math.round(s.metric.beUnits)) }
        ] }))
      ), { cls: 'section-bump' });
    el.querySelectorAll('[data-scn]').forEach((i) => {
      i.addEventListener('input', () => {
        const pk = i.getAttribute('data-scn').split(':');
        BizSet.setScenario(pk[0], pk[1], i.value);
      });
    });
  }

  /* ============================================================
     SENSITIVITY
     ============================================================ */
  function renderSensitivity(el) {
    const p = S.proj;
    const mults = p.sensitivity.mults || { touch: 1.2 };
    const ST = M.sensitivityTable(p, mults);
    const labels = { revenue: t('dashboard.revenue'), price: t('assumptions.selling_price'), volume: t('assumptions.sales_volume'), cogs: t('cogs.title'), opex: t('expenses.title'), capex: t('reports.capex'), discount: t('assumptions.discount_rate'), financeRate: t('assumptions.financing_rate') };
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('analysis.sensitivity_title')) + '</h3></div>' +
      '<div class="row2"><div class="lbl">' + es(t('scenarios.multipler')) + ' (+%)</div>' +
      '<input type="number" step="1" min="1" max="100" id="sens-mult" value="' + Math.round((mults.touch - 1) * 100) + '" style="max-width:120px;text-align:right">' +
      '</div></div>' +
      UI.card(null, UI.table(
        [{ label: t('scenarios.param') }, { label: t('dashboard.npv'), r: true }, { label: 'IRR %', r: true }, { label: t('dashboard.roi') + ' %', r: true }, { label: t('scenarios.net_profit'), r: true }],
        [{ cls: 'total', cells: [{ html: t('analysis.base') }, { r: true, html: money(ST.base.npv) }, { r: true, html: ST.base.irr == null ? t('not_calculable') : pct(ST.base.irr * 100, 1) }, { r: true, html: pct(ST.base.roi, 1) }, { r: true, html: money(ST.base.netProfitY5) }] }]
          .concat(ST.up.map((u) => ({ cells: [
            { html: '+ ' + Math.round((mults.touch - 1) * 100) + '% ' + (labels[u.key] || u.key) },
            { r: true, html: money(u.metric.npv) + (() => { const d = u.metric.npv - ST.base.npv; return ' <span class="tiny ' + (d >= 0 ? 'pos' : 'neg') + '" style="display:inline-block;font-size:10px">(' + (d >= 0 ? '+' : '') + money(d) + ')</span>'; })() },
            { r: true, html: u.metric.irr == null ? t('not_calculable') : pct(u.metric.irr * 100, 1) },
            { r: true, html: pct(u.metric.roi, 1) },
            { r: true, html: money(u.metric.netProfitY5) }
          ] })))
      ), { cls: 'section-bump' }) +
      '<div class="card section-bump"><div class="card-title"><h3>📊 ' + es(t('dashboard.npv')) + ' — ' + es(t('scenarios.impact')) + '</h3></div><div class="chart-box" id="ch-sens"></div></div>';
    const b = document.getElementById('sens-mult');
    b.addEventListener('change', () => {
      S.proj.sensitivity.mults = { touch: 1 + Number(b.value || 20) / 100 };
      markDirty(); scheduleSave(); refreshNow();
    });
    const labelsArr = ['base'].concat(ST.up.map((u) => labels[u.key] || u.key));
    Charts.barChart(document.getElementById('ch-sens'), labelsArr, [ST.base.npv].concat(ST.up.map((u) => u.metric.npv)).map((v) => Math.round(v)), { labels: labelsArr, tickFmt: (v) => money(v) });
  }

  /* ============================================================
     FINANCING — Conventional / Islamic
     ============================================================ */
  function renderFinancing(el) {
    if (S.proj.financialMode === 'SYARIAH') renderIslamicFinancing(el);
    else renderConventionalFinancing(el);
  }

  function renderConventionalFinancing(el) {
    const p = S.proj;
    const F = finance();
    const loans = p.financing.conventional.loans || [];
    const LBL_STRUCT = { bank_loan: t('financing.bank_loan'), business_loan: t('financing.business_loan'), term_loan: t('financing.term_loan'), revolving: t('financing.revolving'), other_fin: t('financing.other_fin') };
    const rows = loans.map((l, idx) => {
      const sch = F.financing.conventional.schedules[idx];
      return '<tr>' +
        '<td><input type="text" data-loan-name="' + l.id + '" value="' + es(l.name) + '" style="min-width:130px"></td>' +
        '<td><select data-loan-struct="' + l.id + '">' + Object.keys(LBL_STRUCT).map((k) => '<option value="' + k + '"' + (l.structure === k ? ' selected' : '') + '>' + LBL_STRUCT[k] + '</option>').join('') + '</select></td>' +
        '<td><input type="number" step="any" min="0" data-loan-amt="' + l.id + '" value="' + es(l.amount) + '" style="max-width:110px"></td>' +
        '<td><div class="seg" style="max-width:150px"><button data-loan-rateauto="' + l.id + '" class="' + (l.rateMode !== 'manual' ? 'on' : '') + '">' + t('auto') + ' ' + pct(F.assumptions.financeRate * 100, 1) + '</button><button data-loan-ratemanual="' + l.id + '" class="' + (l.rateMode === 'manual' ? 'on' : '') + '">' + t('manual') + '</button></div></td>' +
        '<td><input type="number" step="any" min="0" data-loan-rate="' + l.id + '" value="' + es(l.manualRate) + '" ' + (l.rateMode === 'manual' ? '' : 'disabled') + ' placeholder="' + pct(F.assumptions.financeRate * 100, 1) + '" style="max-width:90px"></td>' +
        '<td><input type="number" step="any" min="0.25" data-loan-tenure="' + l.id + '" value="' + es(l.tenureYears) + '" style="max-width:80px"></td>' +
        '<td><select data-loan-freq="' + l.id + '"><option value="monthly"' + (l.freq === 'monthly' ? ' selected' : '') + '>' + t('financing.freq.monthly') + '</option><option value="quarterly"' + (l.freq === 'quarterly' ? ' selected' : '') + '>' + t('financing.freq.quarterly') + '</option><option value="annually"' + (l.freq === 'annually' ? ' selected' : '') + '>' + t('financing.freq.annually') + '</option></select></td>' +
        '<td><input type="number" step="any" min="0" data-loan-fees="' + l.id + '" value="' + es(l.fees) + '" style="max-width:80px"></td>' +
        '<td class="r"><b class="num">' + money(sch ? sch.pmt : 0) + '</b></td>' +
        '<td class="r num">' + money(sch ? sch.totalInterest : 0) + '</td>' +
        '<td><button class="icon-btn" data-loan-del="' + l.id + '" style="color:var(--rose)">🗑</button></td>' +
        '</tr>';
    }).join('');

    el.innerHTML =
      '<div class="mode-banner k">💳 ' + es(t('mode.indicator')) + ': <b>' + es(t('mode.konvensional')) + '</b> — ' + es(t('financing.conv_title')) + '</div>' +
      '<div class="alert info"><span class="ico">ℹ️</span><div>' + es(t('financing.separator_note')) + '</div></div>' +
      '<div class="card"><div class="card-title"><h3>' + es(t('financing.conv_title')) + '</h3><button class="btn sm primary" id="add-loan">＋ ' + es(t('add')) + '</button></div>' +
      '<div class="tbl-wrap"><table class="data"><thead><tr>' +
      '<th>' + t('common.name') + '</th><th>' + t('financing.structure') + '</th><th>' + t('financing.loan_amount') + '</th><th>' + t('financing.interest_rate') + '</th><th>' + t('financing.interest_rate') + ' %</th><th>' + t('financing.tenure') + '</th><th>' + t('financing.payment_freq') + '</th><th>' + t('financing.fees') + '</th><th class="r">' + t('financing.installment') + '</th><th class="r">' + t('total') + ' ' + t('financing.interest') + '</th><th></th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="11" class="muted">— ' + t('add') + ' ' + t('financing.conv_title') + '</td></tr>') + '</tbody></table></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:24px;margin-top:14px">' +
        '<div style="text-align:right"><div class="tiny">' + es(t('total') + ' ' + t('financing.loan_amount')) + '</div><b class="num">' + money(F.financing.conventional.totalDrawn) + '</b></div>' +
        '<div style="text-align:right"><div class="tiny">' + es(t('total') + ' ' + t('financing.interest')) + '</div><b class="num">' + money(F.financing.conventional.schedules.reduce((a, s) => a + s.totalInterest, 0)) + '</b></div>' +
      '</div></div>';

    // amortization schedules
    let schedHtml = '';
    F.financing.conventional.schedules.forEach((s, idx) => {
      const l = F.financing.conventional.loans[idx];
      schedHtml += '<div class="card section-bump"><div class="card-title"><h3>' + es(t('financing.amortization')) + ' — ' + es(l.name || ('#' + (idx + 1))) + '</h3></div>' +
      UI.table(
        [{ label: t('period') }, { label: t('financing.principal'), r: true }, { label: t('financing.interest'), r: true }, { label: t('financing.installment'), r: true }, { label: t('financing.outstanding'), r: true }],
        s.rows.slice(0, 40).map((r) => ({ cells: [{ html: r.period + ' (' + t('year') + ' ' + r.year + ')' }, { r: true, html: money(r.principal) }, { r: true, html: money(r.interest) }, { r: true, html: money(r.payment) }, { r: true, html: money(r.balance) }] })),
        { footnote: (s.rows.length > 40 ? '… (' + s.rows.length + ' ' + t('period') + ' total) ' : '') + t('financing.separator_note') }
      ) + '</div>';
    });
    el.innerHTML += schedHtml;

    bindConventional(el);
  }

  function bindConventional(el) {
    document.getElementById('add-loan').addEventListener('click', () => BizSet.addLoan());
    el.querySelectorAll('[data-loan-name]').forEach((i) => i.addEventListener('input', () => BizSet.setLoan(i.getAttribute('data-loan-name'), 'name', i.value)));
    el.querySelectorAll('[data-loan-struct]').forEach((i) => i.addEventListener('change', () => BizSet.setLoan(i.getAttribute('data-loan-struct'), 'structure', i.value, true)));
    el.querySelectorAll('[data-loan-amt]').forEach((i) => i.addEventListener('input', () => BizSet.setLoan(i.getAttribute('data-loan-amt'), 'amount', i.value, true)));
    el.querySelectorAll('[data-loan-rate]').forEach((i) => i.addEventListener('input', () => BizSet.setLoan(i.getAttribute('data-loan-rate'), 'manualRate', i.value, true)));
    el.querySelectorAll('[data-loan-rateauto]').forEach((b) => b.addEventListener('click', () => BizSet.setLoan(b.getAttribute('data-loan-rateauto'), 'rateMode', 'auto', true)));
    el.querySelectorAll('[data-loan-ratemanual]').forEach((b) => b.addEventListener('click', () => BizSet.setLoan(b.getAttribute('data-loan-ratemanual'), 'rateMode', 'manual', true)));
    el.querySelectorAll('[data-loan-tenure]').forEach((i) => i.addEventListener('input', () => BizSet.setLoan(i.getAttribute('data-loan-tenure'), 'tenureYears', i.value, true)));
    el.querySelectorAll('[data-loan-freq]').forEach((i) => i.addEventListener('change', () => BizSet.setLoan(i.getAttribute('data-loan-freq'), 'freq', i.value, true)));
    el.querySelectorAll('[data-loan-fees]').forEach((i) => i.addEventListener('input', () => BizSet.setLoan(i.getAttribute('data-loan-fees'), 'fees', i.value, true)));
    el.querySelectorAll('[data-loan-del]').forEach((b) => b.addEventListener('click', () => BizSet.delLoan(b.getAttribute('data-loan-del'))));
  }

  function renderIslamicFinancing(el) {
    const p = S.proj;
    const F = finance();
    const isl = p.financing.islamic || {};
    const struct = isl.structure || 'murabahah';
    const d = F.financing.islamic.detail || {};
    const structs = ['murabahah', 'ijarah', 'musharakah', 'mudarabah', 'istisna', 'salam'];

    let forms = '';
    if (struct === 'murabahah') {
      const m = isl.murabahah || {};
      forms =
        '<div class="grid g3">' +
        fld(t('murabahah.asset_cost'), inp('financing.islamic.murabahah.assetCost', m.assetCost)) +
        fld(t('murabahah.margin'), inp('financing.islamic.murabahah.marginPct', m.marginPct, 'number')) +
        fld(t('murabahah.term_months'), inp('financing.islamic.murabahah.termMonths', m.termMonths, 'number')) +
        fld(t('murabahah.deposit'), inp('financing.islamic.murabahah.deposit', m.deposit, 'number')) +
        '</div>' +
        '<div class="grid g3" style="margin-top:14px">' +
          UI.kpi({ tone: 'primary', label: t('murabahah.financed_amount'), value: moneySpan(d.financed || 0) }) +
          UI.kpi({ tone: 'gold', label: t('murabahah.profit_paid'), value: moneySpan(d.profitTotal || 0) }) +
          UI.kpi({ tone: 'teal', label: t('murabahah.installment_pm'), value: moneySpan(d.inst || 0) }) +
        '</div>' +
        '<div class="formula-box" style="margin-top:12px">' + es(t('murabahah.transparency')) + ' · ' + es(t('financing.disclaimer_intro')) + '</div>';
    } else if (struct === 'ijarah') {
      const m = isl.ijarah || {};
      forms =
        '<div class="grid g3">' +
        fld(t('ijarah.asset_value'), inp('financing.islamic.ijarah.assetValue', m.assetValue, 'number')) +
        fld(t('ijarah.lease_years'), inp('financing.islamic.ijarah.leaseYears', m.leaseYears, 'number')) +
        fld(t('ijarah.rental_pm'), inp('financing.islamic.ijarah.rentalPm', m.rentalPm, 'number')) +
        fld(t('ijarah.maintenance'), inp('financing.islamic.ijarah.maintenancePm', m.maintenancePm, 'number')) +
        fld(t('ijarah.deposit'), inp('financing.islamic.ijarah.deposit', m.deposit, 'number')) +
        '</div>' +
        '<div class="grid g3" style="margin-top:14px">' +
          UI.kpi({ tone: 'teal', label: t('ijarah.total_rental'), value: moneySpan(d.totalRental || 0) }) +
          UI.kpi({ tone: 'indigo', label: t('ijarah.lease_years'), value: es(m.leaseYears || '—') }) +
        '</div>';
    } else if (struct === 'musharakah') {
      const m = isl.musharakah || {};
      forms =
        '<div class="grid g3">' +
        fld(t('musharakah.capital'), inp('financing.islamic.musharakah.capital', m.capital, 'number')) +
        fld(t('musharakah.partner'), inp('financing.islamic.musharakah.partnerCapital', m.partnerCapital, 'number')) +
        fld(t('musharakah.ownership'), inp('financing.islamic.musharakah.ownershipPct', m.ownershipPct, 'number')) +
        fld(t('musharakah.profit_sharing'), inp('financing.islamic.musharakah.profitSharingPct', m.profitSharingPct, 'number')) +
        fld(t('musharakah.loss_allocation'), inp('financing.islamic.musharakah.lossAllocation', m.lossAllocation)) +
        '</div>' +
        '<div class="alert warn" style="margin-top:12px"><span class="ico">⚠️</span><div>' + es(t('musharakah.no_guarantee')) + '</div></div>';
    } else if (struct === 'mudarabah') {
      const m = isl.mudarabah || {};
      forms =
        '<div class="grid g3">' +
        fld(t('mudarabah.capital_provider'), inp('financing.islamic.mudarabah.capitalProvider', m.capitalProvider)) +
        fld(t('mudarabah.manager'), inp('financing.islamic.mudarabah.manager', m.manager)) +
        fld(t('mudarabah.capital_amount'), inp('financing.islamic.mudarabah.capitalAmount', m.capitalAmount, 'number')) +
        fld(t('mudarabah.psr'), inp('financing.islamic.mudarabah.profitSharingPct', m.profitSharingPct, 'number')) +
        '</div>' +
        '<div class="alert warn" style="margin-top:12px"><span class="ico">⚠️</span><div>' + es(t('mudarabah.no_guarantee')) + '</div></div>';
    } else if (struct === 'istisna') {
      const m = isl.istisna || {};
      forms =
        '<div class="grid g3">' +
        fld(t('istisna.contract_value'), inp('financing.islamic.istisna.contractValue', m.contractValue, 'number')) +
        fld(t('istisna.prod_cost'), inp('financing.islamic.istisna.productionCost', m.productionCost, 'number')) +
        fld(t('istisna.exp_rev'), inp('financing.islamic.istisna.expectedRevenue', m.expectedRevenue, 'number')) +
        '</div>';
    } else if (struct === 'salam') {
      forms = '<div class="alert info"><span class="ico">ℹ️</span><div>Salam — ' + es(t('financing.structures.salam')) + '</div></div>';
    } else {
      forms = '<div class="alert info"><span class="ico">ℹ️</span><div>' + es(t('financing.structures.other')) + '</div></div>';
    }

    el.innerHTML =
      '<div class="mode-banner s">🕌 ' + es(t('mode.indicator')) + ': <b>' + es(t('mode.syariah')) + '</b> — ' + es(t('financing.islamic_title')) + '</div>' +
      '<div class="alert warn"><span class="ico">⚠️</span><div>' + es(t('financing.disclaimer_intro')) + '</div></div>' +
      '<div class="card"><div class="card-title"><h3>' + es(t('financing.structure')) + '</h3></div>' +
      '<div class="fld"><label>' + es(t('financing.islamic_title')) + ' — ' + es(t('financing.structure')) + '</label>' +
      '<select id="isl-struct">' + structs.map((s) => '<option value="' + s + '"' + (struct === s ? ' selected' : '') + '>' + t('financing.structures.' + s) + '</option>').join('') + '<option value="other"' + (struct === 'other' ? ' selected' : '') + '>' + t('financing.structures.other') + '</option></select></div>' +
      forms +
      '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('reports.financing') + ' — ' + t('cashflow.title')) + '</h3></div>' +
      UI.table(
        [{ label: t('year') }, { label: t('financing.principal'), r: true }, { label: t('financing.interest'), r: true }, { label: t('reports.financing') + ' ' + t('budget.variance') + '', r: true }],
        Array.from({ length: F.N }, (_, i) => ({ cells: [{ html: 'Y' + (i + 1) }, { r: true, html: money(F.financing.principalAnnual[i + 1]) }, { r: true, html: money(F.financing.costAnnual[i + 1]) }, { r: true, html: money(F.financing.distributionAnnual[i + 1]) }] })),
        { footnote: t('musharakah.no_guarantee') }
      ) + '</div>';

    document.getElementById('isl-struct').addEventListener('change', function () { BizSet.setFinStruct(this.value); });
    bindInputs(el);
  }

  function fld(label, html) { return '<div class="fld"><label>' + es(label) + '</label>' + html + '</div>'; }
  function inp(path, value, type) {
    return '<input type="' + (type || 'text') + '" ' + (type === 'number' ? 'step="any"' : '') + ' data-bind="' + path + '" value="' + es(value == null ? '' : value) + '">';
  }

  /* ============================================================
     SHARIAH SCREENING
     ============================================================ */
  function renderScreening(el) {
    const p = S.proj;
    const sc = p.shariah.screening || {};
    const sum = Shariah.shariahStatusSummary(p);
    const q = (key, label) => '<div class="row2"><div class="lbl">' + label + '</div><div class="seg">' +
      ['no', 'yes', 'unsure'].map((v) => '<button data-scq="' + key + ':' + v + '" class="' + (sc[key] === v ? 'on' : '') + '">' + t('screening.' + v) + '</button>').join('') + '</div></div>';

    const partChips = sum.screening.parts.map((pt) => {
      const tone = pt.status === 'SCREENED' ? 'teal' : pt.status === 'REQUIRES_REVIEW' ? 'gold' : pt.status === 'POTENTIAL_ISSUE' ? 'rose' : 'gray';
      return '<div class="row2"><div class="lbl">' + es(t('screening.' + pt.label)) + '</div>' + '<span class="chip ' + tone + '">' + es(t('screening.' + pt.status.toLowerCase())) + '</span></div>';
    }).join('');

    el.innerHTML =
      '<div class="mode-banner s">🕌 ' + es(t('mode.indicator')) + ': <b>' + es(t('mode.syariah')) + '</b></div>' +
      '<div class="card"><div class="card-title"><h3>' + es(t('screening.dashboard')) + '</h3><span class="hint" style="max-width:200px"><span class="chip ' + (sum.overBadge.tone || 'teal') + '">' + es(sum.overBadge.label) + '</span></span></div>' +
      '<div class="kpi-grid">' +
        UI.kpi({ tone: 'teal', label: t('screening.screened'), value: String(sum.screening.parts.filter((x) => x.status === 'SCREENED').length) + ' / ' + sum.screening.parts.length }) +
        UI.kpi({ tone: 'gold', label: t('screening.requires_review'), value: String(sum.screening.parts.filter((x) => x.status === 'REQUIRES_REVIEW').length) }) +
        UI.kpi({ tone: 'rose', label: t('screening.potential_issue'), value: String(sum.screening.parts.filter((x) => x.status === 'POTENTIAL_ISSUE').length) }) +
      '</div>' +
      '<div style="margin-top:14px">' + partChips + '</div></div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('screening.title')) + ' — ' + es(t('screening.status')) + '</h3></div>' +
        q('activity', t('screening.q_activity')) +
        q('riba', t('screening.q_riba')) +
        q('gharar', t('screening.q_gharar')) +
        q('maysir', t('screening.q_maysir')) +
        '<div class="row2"><div class="lbl">' + es(t('screening.halal')) + '</div>' +
          '<select id="halal-sector" style="max-width:220px">' + ['manufacturing', 'services', 'food', 'agriculture', 'retail', 'education', 'tech', 'other'].map((s) => '<option value="' + s + '"' + (sc.halalSector === s ? ' selected' : '') + '>' + t('screening.' + s) + '</option>').join('') + '</select></div>' +
      '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('review.standards')) + ' (' + es(t('optional')) + ')</h3></div>' +
      '<div class="grid g3">' +
        fld(t('review.std_name'), inp('shariah.standards.name', (p.shariah.standards || {}).name)) +
        fld(t('review.issuing_body'), inp('shariah.standards.body', (p.shariah.standards || {}).body)) +
        fld(t('review.version'), inp('shariah.standards.version', (p.shariah.standards || {}).version)) +
        fld(t('review.std_date'), inp('shariah.standards.date', (p.shariah.standards || {}).date, 'date')) +
        fld(t('review.std_ref'), inp('shariah.standards.ref', (p.shariah.standards || {}).ref)) +
      '</div></div>' +
      '<div class="disclaimer section-bump">' + es(t('screening.disclaimer')) + '</div>';

    el.querySelectorAll('[data-scq]').forEach((b) => b.addEventListener('click', () => {
      const kv = b.getAttribute('data-scq').split(':');
      BizSet.setScreening(kv[0], kv[1]);
    }));
    document.getElementById('halal-sector').addEventListener('change', function () { BizSet.setScreening('halalSector', this.value); });
    bindInputs(el);
  }

  /* ============================================================
     SHARIAH REVIEW
     ============================================================ */
  function renderReview(el) {
    const p = S.proj;
    const rv = p.shariah.review || {};
    const sum = Shariah.screenReview(rv);
    el.innerHTML =
      '<div class="mode-banner s">🕌 ' + es(t('mode.indicator')) + ': <b>' + es(t('mode.syariah')) + '</b></div>' +
      '<div class="card"><div class="card-title"><h3>' + es(t('review.title')) + '</h3><span class="hint"><span class="chip ' + (sum.tone || 'gray') + '">' + es(t('review.' + sum.statusLabel)) + '</span></span></div>' +
      '<div class="grid g2">' +
        fld(t('review.adviser'), inp('shariah.review.adviser', rv.adviser)) +
        fld(t('review.review_date'), inp('shariah.review.date', rv.date, 'date')) +
        fld(t('review.status'), '<select data-bind="shariah.review.status">' + ['', 'pending', 'in_progress', 'approved', 'referred'].map((s) => '<option value="' + s + '"' + (rv.status === s ? ' selected' : '') + '>' + (s === '' ? '—' : t('review.' + s)) + '</option>').join('') + '</select>') +
      '</div>' +
      '<div class="grid g2">' +
        fld(t('review.notes'), '<textarea data-bind="shariah.review.notes">' + es(rv.notes || '') + '</textarea>') +
        fld(t('review.ref_docs'), '<textarea data-bind="shariah.review.refDocs">' + es(rv.refDocs || '') + '</textarea>') +
        fld(t('review.contract_docs'), '<textarea data-bind="shariah.review.contractDocs">' + es(rv.contractDocs || '') + '</textarea>') +
        fld(t('review.evidence'), '<textarea data-bind="shariah.review.evidence">' + es(rv.evidence || '') + '</textarea>') +
        fld(t('review.approval'), '<textarea data-bind="shariah.review.approval">' + es(rv.approval || '') + '</textarea>') +
      '</div>' +
      '<div class="tiny" style="margin-top:8px">' + es(t('review.attachments')) + '</div></div>' +
      '<div class="disclaimer section-bump">' + es(t('screening.disclaimer')) + '</div>';
    bindInputs(el);
  }

  /* ============================================================
     REPORTS
     ============================================================ */
  function renderReports(el) {
    const p = S.proj;
    const F = finance();
    const isSyariah = p.financialMode === 'SYARIAH';
    const mustShow = ['cover', 'exec_summary', 'profile', 'mode', 'assumptions', 'investment', 'capex', 'revenue', 'cogs', 'expenses', 'pl', 'cashflow', 'wc', 'financing', 'depreciation', 'breakeven', 'roi', 'npv', 'irr', 'payback', 'scenarios', 'sensitivity', 'ratios', 'budget', 'summary'];
    if (isSyariah) mustShow.push('islamic', 'screening', 'review', 'disclaimer');
    const sections = S.proj.reportSections || BizReports.defaultSections(p);

    const secToggles = mustShow.map((id) => {
      const inc = sections[id] ? sections[id].included !== false : true;
      return '<label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;padding:4px 8px;border:1px solid var(--line);border-radius:8px;cursor:pointer"><input type="checkbox" data-sec="' + id + '" ' + (inc ? 'checked' : '') + '> ' + es(t('reports.' + id)) + '</label>';
    }).join('');

    const summary = metaSummary(p, F);
    el.innerHTML =
      '<div class="card"><div class="card-title"><h3>' + es(t('reports.preview')) + '</h3></div>' +
      '<div class="actions-row" style="margin-bottom:12px">' +
        '<button class="btn primary" id="btn-pdf">📄 ' + es(t('reports.generate_pdf')) + '</button>' +
        '<button class="btn ghost" id="btn-word">📝 ' + es(t('reports.generate_word')) + '</button>' +
        '<button class="btn ghost" id="btn-xlsx">📊 ' + es(t('reports.generate_excel')) + '</button>' +
        '<button class="btn ghost" id="btn-all">📦 ' + es(t('reports.export_all')) + '</button>' +
        '<button class="btn ghost" id="btn-print">🖨</button>' +
      '</div>' +
      '<div class="tiny">' + es(t('reports.filename_note')) + ' → <b>' + es(ExportXlsx.fileBase(p, 'xlsx')) + '.(xlsx|pdf|docx)</b></div>' +
      '</div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('reports.include_exclude')) + '</h3></div><div style="display:flex;flex-wrap:wrap;gap:6px">' + secToggles + '</div></div>' +
      '<div class="card section-bump"><div class="card-title"><h3>' + es(t('reports.preview')) + '</h3><span class="hint">' + es(t('common.mode')) + ': <b>' + es(p.financialMode) + '</b></span></div>' + summary + '</div>';

    document.getElementById('btn-pdf').addEventListener('click', () => ExportPdf.exportPdf(p, finance()));
    document.getElementById('btn-word').addEventListener('click', () => ExportDocx.exportDocx(p, finance()));
    document.getElementById('btn-xlsx').addEventListener('click', () => ExportXlsx.exportXlsx(p, finance()));
    document.getElementById('btn-all').addEventListener('click', () => {
      ExportXlsx.exportXlsx(p, finance());
      setTimeout(() => ExportPdf.exportPdf(p, finance()), 400);
      setTimeout(() => ExportDocx.exportDocx(p, finance()), 800);
      UI.toast(t('reports.export_all') + ' ✓', 'ok');
    });
    document.getElementById('btn-print').addEventListener('click', () => window.print());
    el.querySelectorAll('[data-sec]').forEach((cb) => cb.addEventListener('change', () => {
      BizSet.setReportSection(cb.getAttribute('data-sec'), cb.checked);
    }));
  }

  function metaSummary(p, F) {
    const isSyariah = p.financialMode === 'SYARIAH';
    const R = F.ratios;
    return '<div class="grid g3">' +
      '<div>' + UI.card(t('dashboard.quick'), metadataTable(p, F)) + '</div>' +
      '<div>' + UI.card(t('nav.analysis'), tablesMini(F)) + '</div>' +
      '<div>' + UI.card(t('reports.financing'), finMini(p, F)) + '</div>' +
      '</div>';
  }
  function metadataTable(p, F) {
    return '<div>' +
      '<div class="row2"><div class="lbl">' + t('profile.business_name') + '</div><b>' + es(p.business.businessName || '—') + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('common.mode') + '</div>' + modeChipTag(p.financialMode) + '</div>' +
      '<div class="row2"><div class="lbl">' + t('common.period') + '</div><b>' + es(p.projectionPeriod) + ' ' + es(t('year')) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('common.currency') + '</div><b>' + es(p.currency) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('reports.date_label') + '</div><b class="num">' + es(FMT.fmtDate(new Date().toISOString())) + '</b></div>' +
      '</div>';
  }
  function tablesMini(F) {
    return '<div>' +
      '<div class="row2"><div class="lbl">' + t('dashboard.npv') + '</div><b class="num">' + money(F.invest.npv) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('dashboard.irr') + '</div><b class="num">' + (F.invest.irr == null ? t('not_calculable') : pct(F.invest.irr * 100, 2)) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('dashboard.roi') + '</div><b class="num">' + pct(F.invest.roiTotal, 1) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('dashboard.payback') + '</div><b class="num">' + (F.invest.payback.paybackYear == null ? t('not_recovered') : F.invest.payback.paybackPeriod.toFixed(2) + ' ' + t('year')) + '</b></div>' +
      '<div class="row2"><div class="lbl">' + t('analysis.be_revenue') + '</div><b class="num">' + (F.invest.breakeven.beRevenue == null ? t('not_calculable') : money(F.invest.breakeven.beRevenue)) + '</b></div>' +
      '</div>';
  }
  function finMini(p, F) {
    if (p.financialMode === 'SYARIAH') {
      const d = F.financing.islamic.detail || {};
      return '<div>' +
        '<div class="row2"><div class="lbl">' + t('financing.structure') + '</div><b>' + es(t('financing.structures.' + (p.financing.islamic.structure || 'murabahah'))) + '</b></div>' +
        '<div class="row2"><div class="lbl">' + t('murabahah.financed_amount') + '</div><b class="num">' + money(d.financed || 0 || F.financing.injected0) + '</b></div>' +
        '<div class="row2"><div class="lbl">' + t('murabahah.profit_paid') + '</div><b class="num">' + money(d.profitTotal || 0) + '</b></div>' +
        '</div>';
    }
    return '<div>' +
      F.financing.conventional.loans.map((l) => '<div class="row2"><div class="lbl">' + es(l.name || t('financing.' + l.structure)) + '</div><b class="num">' + money(l.amount) + '</b></div>').join('') +
      '</div>';
  }

  /* ============================================================
     SETTINGS
     ============================================================ */
  function renderSettings(el) {
    const s = S.settings;
    const p = S.proj;
    const rateMode = p ? (p.assumptions.discountRate.mode === 'manual' ? 'manual' : 'auto') : 'auto';
    el.innerHTML =
      '<div class="grid g2">' +
      '<div class="card"><div class="card-title"><h3>' + es(t('settings.title')) + '</h3></div>' +
        '<div class="fld"><label>' + es(t('settings.language_label')) + '</label><select id="set-lang">' +
          '<option value="ms"' + (s.lang === 'ms' ? ' selected' : '') + '>Bahasa Melayu</option>' +
          '<option value="en"' + (s.lang === 'en' ? ' selected' : '') + '>English</option></select></div>' +
        '<div class="fld"><label>' + es(t('settings.theme')) + '</label><select id="set-theme">' +
          '<option value="light"' + (s.theme === 'light' ? ' selected' : '') + '>Light</option>' +
          '<option value="dark"' + (s.theme === 'dark' ? ' selected' : '') + '>Dark</option></select></div>' +
        '<div class="fld"><label>' + es(t('settings.default_period')) + ' (' + es(t('year')) + ')</label><select id="set-period">' +
          [1,3,5,10,15,20].map((n)=>'<option value="'+n+'"'+(Number(s.defaultPeriod)===n?' selected':'')+'>'+n+' '+t('year')+'</option>').join('') + '</select></div>' +
        '<div class="fld"><label>' + es(t('settings.default_discount')) + ' %</label><input type="number" step="any" id="set-disc" value="' + es(s.defaultDiscountRate == null ? 10 : s.defaultDiscountRate) + '"></div>' +
        '<div class="fld"><label>' + es(t('settings.tax_assumption')) + ' %</label><input type="number" step="any" id="set-tax" value="' + es(s.defaultTaxRate == null ? 24 : s.defaultTaxRate) + '"></div>' +
      '</div>' +
      '<div class="card"><div class="card-title"><h3>' + es(t('settings.data_management')) + '</h3></div>' +
        '<div class="actions-row" style="margin-bottom:10px;flex-direction:column;align-items:stretch">' +
          '<button class="btn ghost" id="btn-exp-json">💾 ' + es(t('settings.export_json')) + '</button>' +
          '<button class="btn ghost" id="btn-imp-json">📥 ' + es(t('settings.import_json')) + '</button>' +
          '<button class="btn ghost" id="btn-demo-k">🏢 ' + es(t('common.demo_k')) + '</button>' +
          '<button class="btn ghost" id="btn-demo-s">🕌 ' + es(t('common.demo_s')) + '</button>' +
          '<button class="btn danger" id="btn-clear">🗑 ' + es(t('settings.clear_all')) + '</button>' +
        '</div>' +
      '</div></div>' +
      (p ? '<div class="card section-bump"><div class="card-title"><h3>' + es(t('settings.fin_mode')) + ' — ' + es(t('common.per_project_note')) + '</h3></div>' +
        '<div class="row2"><div class="lbl">' + es(t('mode.label')) + '<small>' + es(t('settings.mode_switch_warn')) + '</small></div>'+ modeChipTag(p.financialMode) + '</div>' +
        '<div class="actions-row" style="margin-top:6px">' +
          (p.financialMode !== 'KONVENSIONAL' ? '<button class="btn ghost" id="btn-mode-k">⇄ ' + es(t('mode.konvensional')) + '</button>' : '') +
          (p.financialMode !== 'SYARIAH' ? '<button class="btn ghost" id="btn-mode-s">⇄ ' + es(t('mode.syariah')) + '</button>' : '') +
        '</div></div>' : '');

    document.getElementById('set-lang').addEventListener('change', async function () { S.settings.lang = this.value; I18N.setLang(this.value); await saveSettings(); refreshNow(); });
    document.getElementById('set-theme').addEventListener('change', async function () { S.settings.theme = this.value; applyTheme(); await saveSettings(); });
    document.getElementById('set-period').addEventListener('change', async function () { S.settings.defaultPeriod = Number(this.value); await saveSettings(); UI.toast(t('settings.default_period') + ' ✓', 'ok'); });
    document.getElementById('set-disc').addEventListener('change', async function () { S.settings.defaultDiscountRate = Number(this.value) || 10; await saveSettings(); UI.toast(t('settings.default_discount') + ' ✓', 'ok'); });
    document.getElementById('set-tax').addEventListener('change', async function () { S.settings.defaultTaxRate = Number(this.value) || 24; await saveSettings(); UI.toast(t('settings.tax_assumption') + ' ✓', 'ok'); });
    document.getElementById('btn-exp-json').addEventListener('click', async () => { const all = await Store.exportAll(); downloadJson(JSON.stringify(all, null, 2), 'BizFinPro_backup_' + FMT.todayISO() + '.json'); UI.toast(t('settings.export_json') + ' ✓', 'ok'); });
    document.getElementById('btn-imp-json').addEventListener('click', () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json'; i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = async () => { try { const j = JSON.parse(r.result); const ok = await Store.importAll(j); UI.toast(ok ? t('settings.restore_project') + ' ✓' : '✕ JSON tidak sah', ok ? 'ok' : 'err'); if (ok) { await loadSettings(); S.proj = null; go('projects'); } } catch (e) { UI.toast('✕ ' + e.message, 'err'); } }; r.readAsText(f); }; i.click(); });
    document.getElementById('btn-demo-k').addEventListener('click', async () => { const d = M.demoProject('KONVENSIONAL'); await Store.putProject(d); await setProject(d); go('home'); UI.toast(t('common.demo_k') + ' ✓', 'ok'); });
    document.getElementById('btn-demo-s').addEventListener('click', async () => { const d = M.demoProject('SYARIAH'); await Store.putProject(d); await setProject(d); go('home'); UI.toast(t('common.demo_s') + ' ✓', 'ok'); });
    document.getElementById('btn-clear').addEventListener('click', () => {
      UI.modal(t('settings.clear_all'), '<p>' + es(t('settings.clear_all') + '?') + '</p>',
        '<button class="btn ghost" data-close>' + es(t('cancel')) + '</button><button class="btn danger" id="confirm-clear">' + es(t('common.delete')) + '</button>');
      document.getElementById('confirm-clear').addEventListener('click', async () => { await Store.clearAll(); S.proj = null; S.projectId = null; S.F = null; UI.closeAllModals(); go('projects'); UI.toast(t('settings.clear_all') + ' ✓', 'ok'); });
    });
    const bmk = document.getElementById('btn-mode-k');
    const bms = document.getElementById('btn-mode-s');
    if (bmk) bmk.addEventListener('click', () => modeSwitchConfirm('KONVENSIONAL'));
    if (bms) bms.addEventListener('click', () => modeSwitchConfirm('SYARIAH'));
  }

  /* ---------- Mode switching (settings → financial mode) ---------- */
  function modeSwitchConfirm(newMode) {
    UI.modal(t('settings.fin_mode'),
      '<div class="alert warn"><span class="ico">⚠️</span><div>' + es(t('settings.mode_switch_warn')) + '</div></div>' +
      '<p>Mod semasa: <b>' + es(S.proj.financialMode) + '</b> → <b>' + es(newMode) + '</b></p>',
      '<button class="btn ghost" data-close>' + es(t('cancel')) + '</button><button class="btn primary" id="mode-switch-ok">' + es(t('confirm')) + '</button>');
    document.getElementById('mode-switch-ok').addEventListener('click', async () => {
      const oldMode = S.proj.financialMode;
      S.proj.financialMode = newMode;
      // preserve financing data of both modes (never delete)
      UI.closeAllModals();
      markDirty(); await saveProjectNow(); await setProject(S.proj);
      go(S.page === 'screening' || S.page === 'review' ? 'home' : S.page);
      UI.toast(oldMode + ' → ' + newMode + ' ✓', 'ok');
    });
  }

  /* ============================================================
     INPUT BINDING (bindInputs / data-bind)
     ============================================================ */
  function bindInputs(root) {
    root.querySelectorAll('[data-bind]').forEach((inp) => {
      const path = inp.getAttribute('data-bind');
      const type = inp.tagName === 'SELECT' ? 'change' : 'input';
      inp.addEventListener(type, () => {
        BizSet.set(path, inp.value, type === 'change');
      });
    });
    // assumptions quick-bind (working capital days)
    root.querySelectorAll('[data-bind-assumptions]').forEach((inp) => {
      const key = inp.getAttribute('data-bind-assumptions');
      inp.value = inp.value === '' ? getActiveAssumption(key) : inp.value;
      inp.addEventListener('input', () => BizSet.setA(key, 'manual', inp.value, true));
    });
  }
  function getActiveAssumption(key) { return S.proj ? S.proj.assumptions[key].active : ''; }

  /* ============================================================
     BOOTSTRAP
     ============================================================ */
  async function bootstrap() {
    await loadSettings();
    if (S.settings.lang) I18N.setLang(S.settings.lang);
    renderShell();
    // SW registration (offline-first); works on http(s), ignored on file://
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
    }
    // pick project: last opened or first
    const list = await Store.listProjects().catch(() => []);
    if (S.projectId) {
      const p = await Store.getProject(S.projectId);
      if (p) { S.proj = p; markDirty(); S.page = 'home'; computeAndGo('home'); return; }
    }
    if (list.length) {
      S.proj = list[0]; S.projectId = list[0].id; markDirty();
      computeAndGo('home');
      S.$sidebar.querySelectorAll('[data-nav]').forEach((el) => el.addEventListener('click', () => go(el.getAttribute('data-nav'))));
      return;
    }
    go('projects');
  }

  // expose for inline handlers
  global.Biz = { go, newProjectModal, openProject, setProject };
  global.App = { S, bootstrap, refreshNow };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
  window.addEventListener('beforeunload', () => { if (S.proj) saveProjectNow(); });
})(typeof window !== 'undefined' ? window : globalThis);
