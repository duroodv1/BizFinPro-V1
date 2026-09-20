/* ============================================================
   BizFinPro — Centralized Financial Calculation Engine
   One source of truth: every module reads from computeFinance().
   ============================================================ */
(function (global) {
  'use strict';
  const MONTHS = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function uid() {
    if (global.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }
  function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }
  function blank(v) { return v === undefined || v === null || v === ''; }

  /* ---------------- Defaults ---------------- */
  const ASSUMPTION_DEFS = [
    { key:'revenueGrowth',   unit:'%',  auto:5,   decimals:1 },
    { key:'inflation',       unit:'%',  auto:3,   decimals:1 },
    { key:'cogsPct',         unit:'%',  auto:55,  decimals:1 },
    { key:'opexGrowth',      unit:'%',  auto:4,   decimals:1 },
    { key:'contingencyPct',  unit:'%',  auto:0,   decimals:1 },
    { key:'taxRate',         unit:'%',  auto:24,  decimals:1 },
    { key:'discountRate',    unit:'%',  auto:10,  decimals:2 },
    { key:'financingRate',   unit:'%',  auto:6,   decimals:2 },
    { key:'collectionDays',  unit:'d',  auto:30,  decimals:0 },
    { key:'paymentDays',     unit:'d',  auto:30,  decimals:0 },
    { key:'inventoryDays',   unit:'d',  auto:45,  decimals:0 },
    { key:'usefulLife',      unit:'y',  auto:5,   decimals:0 },
    { key:'residualPct',     unit:'%',  auto:10,  decimals:0 }
  ];

  const OPEX_CATS = [
    ['salaries','Gaji'], ['rent','Sewa'], ['utilities','Utiliti'], ['marketing','Pemasaran'],
    ['transport','Pengangkutan'], ['insurance','Insurans'], ['maintenance','Penyelenggaraan'], ['software','Perisian'],
    ['admin','Pentadbiran'], ['professional','Yuran Profesional'], ['telco','Telefon / Internet'], ['other','Perbelanjaan Lain'],
    ['contingency','Kontingensi']
  ];
  const CAPEX_CATS = ['property','renovation','machinery','equipment','vehicle','furniture','it','software','other'];

  function defaultSettings() {
    return {
      lang:'ms', theme:'light', currency:'RM / MYR', customCurrencySymbol:'',
      defaultPeriod:5, defaultDiscountRate:10, defaultTaxRate:24, reportBizName:''
    };
  }

  function defaultAssumptions() {
    const a = {};
    ASSUMPTION_DEFS.forEach((d) => { a[d.key] = { mode:'auto', auto:d.auto, manual:'', active:d.auto, source:'', updatedAt:null }; });
    return a;
  }

  function makeProject(name) {
    return {
      id: uid(), type:'project', name: name || 'Projek Baharu',
      business:{
        businessName:'', regNo:'', businessType:'', industry:'', address:'', contact:'',
        owner:'', employees:'', description:'', objective:'', projectObjective:'',
        projectType:'' , bizPlanGoal:''
      },
      financialMode:'KONVENSIONAL', // or SYARIAH
      startDate: new Date().toISOString().slice(0,10),
      projectionPeriod: 5,
      currency:'RM / MYR',
      assumptions: defaultAssumptions(),
      financingRateAutoMode: true,
      specialAssumptions:{ materialPct:null, directLabourAnnual:'', directProductionAnnual:'', otherDirectAnnual:'', epfPct: 0 , seasonAdj: 1.2, peakMonth: 5},
      capex:{ items:[] },
      startup:{ items:[] },
      revenue:{ streams:[] },
      cogs:{  },
      opex:{ categories:{}, salary:{ headcount:'', avgMonthly:'' } },
      payroll:{ useDetailed: false, headcount:'', avgMonthly:'',
        statutory:{ epfTier1Pct:13, epfTier2Pct:11, epfCeiling:5000, socsoPct:1.75, socsoCeiling:4000 },
        escalationSet:null, scenarios:{ s5:5, s75:7.5, s10:10 } },
      financing:{
        conventional:{ loans:[] },
        islamic:{ structure:'murabahah',
          murabahah:{ assetCost:'', acquisitionCost:'', marginPct:'', termMonths:'', deposit:'' },
          ijarah:{ assetValue:'', leaseYears:'', rentalPm:'', maintenancePm:'', deposit:'', ownership:'', endTerm:'' },
          musharakah:{ capital:'', partnerCapital:'', ownershipPct:'', profitSharingPct:'', lossAllocation:'' },
          mudarabah:{ capitalProvider:'', manager:'', capitalAmount:'', profitSharingPct:'' },
          istisna:{ contractValue:'', delivery:'', payment:'', productionCost:'', expectedRevenue:'' }
        }
      },
      scenarios:{ base:{}, optimistic:{}, pessimistic:{} },
      sensitivity:{ mults:{} },
      budget:{ actual:{ revenue:'', cogs:'', opex:'', capex:'' } },
      shariah:{
        screening:{ activity:'', riba:'', gharar:'', maysir:'', halalSector:'manufacturing', halalStatus:'', notes:'', lastScreenedAt:null },
        review:{ adviser:'', date:'', status:'', notes:'', refDocs:'', contractDocs:'', evidence:'', approval:'' },
        standards:{ name:'', body:'', version:'', date:'', ref:'' }
      },
      reportSections: null, // null = all included (mode-filtered)
      roiMethod:'total', // 'total' | 'annualized'
      createdAt: Date.now(), updatedAt: Date.now()
    };
  }

  function ensure(p) {
    if (!p) return null;
    if (!p.assumptions) p.assumptions = defaultAssumptions();
    ASSUMPTION_DEFS.forEach((d) => {
      const cur = p.assumptions[d.key];
      if (!cur) { p.assumptions[d.key] = { mode:'auto', auto:d.auto, manual:'', active:d.auto, source:'', updatedAt:null }; return; }
      if (cur.auto === undefined) cur.auto = d.auto;
      if (cur.mode === undefined) cur.mode = 'auto';
      if (cur.mode === 'auto') cur.active = (blank(cur.manual) ? cur.auto : cur.manual);
      else cur.active = (blank(cur.manual) ? cur.auto : cur.manual);
    });
    if (!p.capex.items) p.capex.items = [];
    if (!p.startup.items) p.startup.items = [];
    if (!p.revenue.streams) p.revenue.streams = [];
    if (!p.opex.categories) p.opex.categories = {};
    if (!p.payroll) p.payroll = { useDetailed:false, headcount:'', avgMonthly:'', statutory:{ epfTier1Pct:13, epfTier2Pct:11, epfCeiling:5000, socsoPct:1.75, socsoCeiling:4000 }, escalationSet:null, scenarios:{ s5:5, s75:7.5, s10:10 } };
    if (!p.payroll.statutory) p.payroll.statutory = {};
    if (!p.payroll.scenarios) p.payroll.scenarios = { s5:5, s75:7.5, s10:10 };
    if (!p.financing) p.financing = { conventional:{ loans:[] }, islamic:{} };
    if (!p.financing.conventional) p.financing.conventional = { loans:[] };
    if (!p.financing.islamic) p.financing.islamic = { structure:'murabahah' };
    if (!p.shariah) p.shariah = {};
    if (!p.shariah.screening) p.shariah.screening = {};
    if (!p.shariah.review) p.shariah.review = {};
    if (!p.shariah.standards) p.shariah.standards = {};
    if (!p.budget) p.budget = { actual:{} };
    if (!p.scenarios) p.scenarios = { base:{}, optimistic:{}, pessimistic:{} };
    if (!p.sensitivity) p.sensitivity = { mults:{} };
    if (!p.specialAssumptions) p.specialAssumptions = {};
    if (p.projectionPeriod === undefined) p.projectionPeriod = 5;
    return p;
  }

  /* ---------------- Assumption auto/manual helpers ---------------- */
  function setAuto(p, key, autoVal) {
    const a = p.assumptions[key];
    a.mode = 'auto';
    if (autoVal !== undefined) a.auto = autoVal;
    a.active = a.auto;
    a.updatedAt = Date.now();
  }
  function setManual(p, key, val) {
    const a = p.assumptions[key];
    a.mode = 'manual';
    a.manual = val;
    a.active = blank(val) ? a.auto : num(val);
    a.source = 'manual';
    a.updatedAt = Date.now();
  }
  function resetToAuto(p, key) { setAuto(p, key); }

  /* ---------------- Loan amortization (Conventional, bank-rate method) ---------------- */
  function amortSchedule(principal, annualRatePct, freq, years, graceMonths) {
    const ppy = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : 1;
    const ratePer = num(annualRatePct) / 100 / ppy;
    const n = Math.max(1, Math.round(num(years) * ppy));
    const gracePer = Math.max(0, Math.min(Math.round(num(graceMonths)), n - 1));
    let balance = num(principal);
    let pmt = 0;
    if (ratePer > 0 && (n - gracePer) > 0) {
      pmt = balance * Math.pow(1 + ratePer, gracePer) * ratePer / (1 - Math.pow(1 + ratePer, -(n - gracePer)));
    } else if (ratePer === 0) {
      pmt = balance / Math.max(1, n - gracePer);
    }
    balance = balance * Math.pow(1 + ratePer, gracePer);
    let principalAt = balance;
    const rows = [];
    let totalInterest = 0, totalPrincipal = 0, totalPayment = 0;
    for (let i = 1; i <= n; i++) {
      let payment = 0, interest = 0, prince = 0;
      if (i <= gracePer) {
        interest = balance * ratePer;
        balance += interest;
        payment = 0; prince = 0;
      } else {
        interest = balance * ratePer;
        prince = Math.min(balance, pmt - interest);
        if (i === n && balance + interest > 0) { prince = balance; }
        payment = (i === n) ? (prince + interest) : pmt;
        balance = Math.max(0, balance - prince);
      }
      totalInterest += interest; totalPrincipal += prince; totalPayment += payment;
      rows.push({ period:i, year:Math.ceil(i / ppy), payment, interest, principal:prince, balance });
    }
    const annual = {};
    rows.forEach((r) => {
      if (!annual[r.year]) annual[r.year] = { interest:0, principal:0, payment:0, balance:0 };
      annual[r.year].interest += r.interest;
      annual[r.year].principal += r.principal;
      annual[r.year].payment += r.payment;
      annual[r.year].balance = r.balance;
    });
    return { rows, annual, pmt, totalInterest, totalPrincipal, totalPayment, ppy, ratePer, n };
  }

  /* ---------------- IRR (Newton + bisection fallback) ---------------- */
  function irr(series, guess) {
    if (!series || series.length < 2) return null;
    const hasPos = series.some((v) => v > 0);
    const hasNeg = series.some((v) => v < 0);
    if (!hasPos || !hasNeg) return null;
    function npvAt(r) {
      let s = 0;
      for (let i = 0; i < series.length; i++) s += series[i] / Math.pow(1 + r, i);
      return s;
    }
    let r = guess === undefined ? 0.1 : guess;
    if (npvAt(r) < 0) r = 0.001;
    for (let k = 0; k < 200; k++) {
      const f = npvAt(r);
      if (Math.abs(f) < 1e-7) return r;
      const df = (npvAt(r + 1e-5) - f) / 1e-5;
      if (Math.abs(df) < 1e-12) break;
      const rn = r - f / df;
      if (!isFinite(rn)) break;
      if (rn <= -0.999) { r = -0.5; break; }
      if (Math.abs(rn - r) < 1e-9) return rn;
      r = rn;
    }
    // bisection fallback
    let lo = -0.9999, hi = 10, fl = npvAt(lo);
    if (fl < 0) return null;
    for (let k = 0; k < 200; k++) {
      const mid = (lo + hi) / 2, fm = npvAt(mid);
      if (Math.abs(fm) < 1e-9) return mid;
      if (fm > 0) lo = mid; else hi = mid;
      if (Math.abs(hi - lo) < 1e-10) return mid;
    }
    return null;
  }

  /* ---------------- Payroll model ---------------- */
  // Payroll projection with EPF (KWSP) + SOCSO (PERKESO) statutory on-cost and
  // base-case escalation (central assumption or override).
  function payrollProjection(p, N) {
    const pl = p.payroll || { useDetailed:false };
    const st = pl.statutory || {};
    const epfLow = num(st.epfTier1Pct) || 0;   // wage <= ceiling
    const epfHigh = num(st.epfTier2Pct) || 0;  // wage  > ceiling
    const epfCeil = num(st.epfCeiling) || 0;
    const socsoPct = num(st.socsoPct) || 0;
    const socsoCeil = num(st.socsoCeiling) || 0;

    const g = (k) => { const a = p.assumptions[k]; return a ? (a.manual !== '' && a.manual != null ? num(a.manual) : num(a.active !== undefined ? a.active : a.auto)) : 0; };
    const headcount = num(pl.headcount);
    const avgMonthly = num(pl.avgMonthly);

    const empty = () => Array(N + 1).fill(0);
    const annual = { gross:empty(), epf:empty(), socso:empty(), onCost:empty(), total:empty() };
    const perHead = { annualSalary:Array(N + 1).fill(0), epf:Array(N + 1).fill(0), socso:Array(N + 1).fill(0), total:Array(N + 1).fill(0) };

    const escBase = num(pl.escalationSet) / 100;                 // explicit override (nullable)
    const baseEsc = pl.escalationSet == null ? g('opexGrowth') / 100 : escBase;  // base-case escalation

    for (let y = 1; y <= N; y++) {
      const salaryY = avgMonthly * 12 * Math.pow(1 + baseEsc, y - 1);
      const epfPer = Math.min(salaryY, epfCeil) * epfLow / 100 + Math.max(0, salaryY - epfCeil) * epfHigh / 100;
      const socsoPer = Math.min(salaryY, socsoCeil) * socsoPct / 100;
      annual.gross[y] = salaryY * headcount;
      annual.epf[y] = epfPer * headcount;
      annual.socso[y] = socsoPer * headcount;
      annual.onCost[y] = (epfPer + socsoPer) * headcount;
      annual.total[y] = annual.gross[y] + annual.onCost[y];
      perHead.annualSalary[y] = salaryY;
      perHead.epf[y] = epfPer;
      perHead.socso[y] = socsoPer;
      perHead.total[y] = salaryY + epfPer + socsoPer;
    }
    return {
      enabled: pl.useDetailed && headcount > 0 && avgMonthly > 0,
      headcount, avgMonthly, baseEscalationPct: baseEsc * 100,
      escalationUsedPct: (pl.escalationSet == null ? g('opexGrowth') : num(pl.escalationSet)),
      epfLow, epfHigh, epfCeil, socsoPct, socsoCeil,
      annual, perHead
    };
  }

  // Sensitivity: total employer payroll cost under 3 escalation scenarios.
  function payrollScenarios(p, N) {
    const base = payrollProjection(p, N);
    const st = (p.payroll && p.payroll.statutory) || {};
    const epfLow = num(st.epfTier1Pct) || 0;
    const epfHigh = num(st.epfTier2Pct) || 0;
    const epfCeil = num(st.epfCeiling) || 0;
    const socsoPct = num(st.socsoPct) || 0;
    const socsoCeil = num(st.socsoCeiling) || 0;
    const head = base.headcount, avg = base.avgMonthly;
    const enabled = base.enabled;
    const sc = {};
    ['s5', 's75', 's10'].forEach((k) => {
      const rate = num(p.payroll.scenarios[k]) / 100;
      const gross = Array(N + 1).fill(0), total = Array(N + 1).fill(0);
      for (let y = 1; y <= N; y++) {
        const salaryY = avg * 12 * Math.pow(1 + rate, y - 1);
        const epfPer = Math.min(salaryY, epfCeil) * epfLow / 100 + Math.max(0, salaryY - epfCeil) * epfHigh / 100;
        const socsoPer = Math.min(salaryY, socsoCeil) * socsoPct / 100;
        gross[y] = salaryY * head;
        total[y] = (salaryY + epfPer + socsoPer) * head;
      }
      sc[k] = { ratePct: rate * 100, enabled, gross, total };
    });
    return { base, scenarios: sc };
  }

  /* ---------------- Seasonal weights ---------------- */
  function seasonalWeights(seasonAdj, peakMonth) {
    const adj = num(seasonAdj) || 1;
    const peak = Math.round(num(peakMonth)) % 12;
    const w = [];
    let sum = 0;
    for (let m = 0; m < 12; m++) {
      const amp = adj - 1;
      const v = 1 + amp * (0.5 + 0.5 * Math.cos(2 * Math.PI * (m - peak) / 12));
      w.push(v); sum += v;
    }
    return { w, sum };
  }

  /* ---------------- Depreciation ---------------- */
  function depreciationSchedule(p) {
    const items = p.capex.items.filter((it) => num(it.totalCost) > 0);
    const N = p.projectionPeriod;
    const annualByYear = Array(N + 1).fill(0);
    let residualTotal = 0, depreciableTotal = 0;
    const det = [];
    items.forEach((it) => {
      const cost = num(it.totalCost);
      const life = Math.max(1, num(it.usefulLife));
      const residual = num(it.residualValue);
      const method = it.depMethod === 'rb' ? 'rb' : 'sl';
      const schedule = [];
      let book = cost;
      if (method === 'sl') {
        const perYear = (cost - residual) / life;
        for (let y = 1; y <= life; y++) { const d = Math.min(perYear, book - residual); book -= d; schedule.push({ y, dep: d, book }); }
      } else {
        const rate = residual > 0 && cost > 0 ? 1 - Math.pow(residual / cost, 1 / life) : 2 / Math.max(1, life);
        for (let y = 1; y <= life; y++) {
          const d = Math.min(book * rate, book - residual);
          book = Math.max(residual, book - d);
          schedule.push({ y, dep: d, book });
        }
      }
      residualTotal += residual;
      depreciableTotal += cost - residual;
      schedule.forEach((s) => { if (s.y <= N) annualByYear[s.y] += s.dep; });
      det.push({ item: it, cost, life, residual, method, schedule });
    });
    return { annualByYear, residualTotal, depreciableTotal, det, total: items.reduce((a, it) => a + num(it.totalCost), 0) };
  }

  /* ---------------- CORE COMPUTATION ---------------- */
  function computeFinance(p) {
    p = ensure(p);
    const N = Math.max(1, Math.min(30, Math.round(num(p.projectionPeriod))));
    const cur = p.currency || 'RM / MYR';
    const A = p.assumptions;
    const g = (k) => num(A[k] && A[k].active);
    const growth = g('revenueGrowth') / 100;
    const inflation = g('inflation') / 100;
    const opexGrowth = g('opexGrowth') / 100;
    const taxRate = g('taxRate') / 100;
    const discount = g('discountRate') / 100;
    const financeRate = g('financingRate') / 100;

    // --- depreciation & capex ---
    const dep = depreciationSchedule(p);
    const capexTotal = dep.total;
    const capexAnnual = Array(N + 1).fill(0); capexAnnual[0] = capexTotal; // assume all capex in year 0

    // --- startup costs ---
    const startupItems = (p.startup.items || []).map((s) => ({ id:s.id, name:s.name, amount:num(s.amount), note:s.note }));
    const startupTotal = startupItems.reduce((a, b) => a + b.amount, 0);

    // --- revenue ---
    const streams = (p.revenue.streams || []).map((s) => ({
      id:s.id, name:s.name || '', type:s.type || 'product',
      monthlyVolume:num(s.monthlyVolume), unitPrice:num(s.unitPrice), monthlyRevenue:num(s.monthlyRevenue),
      discountPct:num(s.discountPct), growth: num(s.growth), useRevenue:s.useRevenue === true
    }));
    const effMonthlyOf = (s) => s.useRevenue
      ? s.monthlyRevenue * (1 - s.discountPct / 100)
      : s.monthlyVolume * s.unitPrice * (1 - s.discountPct / 100);
    const year1RevBase = streams.reduce((acc, s) => acc + effMonthlyOf(s) * 12, 0);
    const seasonAdj = num(p.specialAssumptions.seasonAdj) || 1;
    const peakMonth = num(p.specialAssumptions.peakMonth) || 5;
    const seasonal = seasonalWeights(seasonAdj, peakMonth);

    const revenueAnnual = Array(N + 1).fill(0);
    revenueAnnual[1] = year1RevBase;
    for (let y = 2; y <= N; y++) revenueAnnual[y] = revenueAnnual[y - 1] * (1 + growth);

    // monthly revenue (year 1 pattern, then scaled by growth)
    const monthlyRevenue = [];
    for (let y = 1; y <= N; y++) {
      const row = [];
      const scale = revenueAnnual[1] > 0 ? revenueAnnual[y] / revenueAnnual[1] : 0;
      for (let m = 0; m < 12; m++) row.push(revenueAnnual[1] * (seasonal.w[m] / seasonal.sum) * scale);
      monthlyRevenue.push(row);
    }
    const totalUnitsY1 = streams.reduce((a, s) => a + (s.useRevenue ? 0 : s.monthlyVolume * 12), 0);

    // per-stream series for analytics (product / discount-band analysis)
    const streamDetail = streams.map((s) => {
      const base = effMonthlyOf(s) * 12;
      const annual = Array(N + 1).fill(0);
      annual[1] = base;
      for (let y = 2; y <= N; y++) annual[y] = annual[y - 1] * (1 + growth);
      const monthly = [];
      for (let y = 1; y <= N; y++) {
        const row = [];
        const scale = base > 0 ? annual[y] / base : 0;
        for (let m = 0; m < 12; m++) row.push(base * (seasonal.w[m] / seasonal.sum) * scale);
        monthly.push(row);
      }
      return { id:s.id, name:s.name, type:s.type, discountPct:s.discountPct, annual, monthly };
    });

    // --- COGS ---
    const matPct = num(p.specialAssumptions.materialPct) / 100 || (g('cogsPct') / 100);
    const directLabour1 = num(p.specialAssumptions.directLabourAnnual);
    const directProd1 = num(p.specialAssumptions.directProductionAnnual);
    const otherDirect1 = num(p.specialAssumptions.otherDirectAnnual);
    // Fixed COGS = direct labour + direct production + other direct (inflation-adjusted);
    // Variable COGS = material % of revenue. Together reconcile to total COGS.
    const fixedCogsAnnual = Array(N + 1).fill(0);
    const variableCogsAnnual = Array(N + 1).fill(0);
    const cogsAnnual = Array(N + 1).fill(0);
    const grossProfit = Array(N + 1).fill(0);
    const grossMargin = Array(N + 1).fill(0);
    for (let y = 1; y <= N; y++) {
      fixedCogsAnnual[y] = (directLabour1 + directProd1 + otherDirect1) * Math.pow(1 + inflation, y - 1);
      variableCogsAnnual[y] = revenueAnnual[y] * matPct;
      cogsAnnual[y] = fixedCogsAnnual[y] + variableCogsAnnual[y];
      grossProfit[y] = revenueAnnual[y] - cogsAnnual[y];
      grossMargin[y] = revenueAnnual[y] > 0 ? grossProfit[y] / revenueAnnual[y] * 100 : 0;
    }
    const variableCogsY1 = variableCogsAnnual[1];

    // --- OPEX ---
    const payroll = payrollProjection(p, N);
    const opexAnnual = Array(N + 1).fill(0);
    const variableOpexAnnual = Array(N + 1).fill(0);
    const perCatAnnual = []; // {key,label,monthly,monthlyBase,annualBase,variable,annual:[],fromPayroll?}
    const OPEX_LABELS = Object.fromEntries(OPEX_CATS.map((k) => [k[0], k[1]]));
    const baseOf = (c) => (c.base !== undefined && c.base !== '' ? num(c.base) : 0);
    const monthlyOf = (c) => (c.monthlyBase !== undefined && c.monthlyBase !== '' ? num(c.monthlyBase) : baseOf(c));
    const annualOf = (c) => (c.annualBase !== undefined && c.annualBase !== '' ? num(c.annualBase) : baseOf(c));
    Object.entries(p.opex.categories || {}).forEach(([key, raw]) => {
      const c = raw || {};
      if (c.hidden) return;                                    // deleted (hidden) row → excluded from computation
      const monthly = c.monthly !== false;
      const variable = c.variable === true;
      const label = (c.label && String(c.label).trim()) ? String(c.label).trim() : (OPEX_LABELS[key] || key);
      const growthSet = c.growth === undefined || c.growth === '' ? null : num(c.growth);
      // Derived contingency is computed separately below.
      if (key === 'contingency') return;
      // Detailed payroll replaces the flat "salaries" category. The salaries row becomes
      // display-only here; the authoritative payroll cost is added exactly once below.
      if (key === 'salaries' && payroll.enabled) {
        const arr = Array(N + 1).fill(0);
        for (let y = 1; y <= N; y++) arr[y] = payroll.annual.total[y];
        perCatAnnual.push({ key, label, monthly: true, variable, monthlyBase: null, annualBase: null, annual: arr, fromPayroll: true, displayOnly: true });
        return;
      }
      const effGrowth = growthSet === null ? opexGrowth : growthSet / 100;
      let y1 = monthly ? monthlyOf(c) * 12 : annualOf(c);
      // Legacy: flat salaries get employer statutory % bump when the detailed payroll model is off.
      if (key === 'salaries') { const e = num(p.specialAssumptions.epfPct) / 100; if (e > 0) y1 = y1 * (1 + e); }
      const arr = Array(N + 1).fill(0);
      arr[1] = y1;
      for (let y = 2; y <= N; y++) arr[y] = arr[y - 1] * (1 + effGrowth);
      for (let y = 1; y <= N; y++) { opexAnnual[y] += arr[y]; if (variable) variableOpexAnnual[y] += arr[y]; }
      perCatAnnual.push({ key, label, monthly, variable, monthlyBase: monthly ? monthlyOf(c) : null, annualBase: monthly ? null : annualOf(c), annual: arr });
    });
    // Authoritative payroll cost — counted exactly once (the salaries row above is display-only when enabled).
    if (payroll.enabled) {
      for (let y = 1; y <= N; y++) opexAnnual[y] += payroll.annual.total[y];
      if (!perCatAnnual.some((c) => c.key === 'salaries')) {
        const arr = Array(N + 1).fill(0);
        for (let y = 1; y <= N; y++) arr[y] = payroll.annual.total[y];
        perCatAnnual.push({ key: 'salaries', label: OPEX_LABELS.salaries || 'Gaji', monthly: true, variable:false, monthlyBase: null, annualBase: null, annual: arr, fromPayroll: true, displayOnly: true });
      }
    }
    // Contingency / miscellaneous — derived as % of all other OPEX (auto: central contingencyPct assumption).
    const contingencyPct = num(p.specialAssumptions.contingencyPct) > 0
      ? num(p.specialAssumptions.contingencyPct) / 100
      : (g('contingencyPct') / 100);
    const contingencyAnnual = Array(N + 1).fill(0);
    for (let y = 1; y <= N; y++) contingencyAnnual[y] = opexAnnual[y] * contingencyPct;
    for (let y = 1; y <= N; y++) opexAnnual[y] += contingencyAnnual[y];
    perCatAnnual.push({ key:'contingency', label: OPEX_LABELS.contingency || 'Kontingensi', monthly:false, derivedPct: contingencyPct * 100, annual: contingencyAnnual });
    const employeeOnCost = payroll.enabled ? payroll.annual.onCost.reduce((a, b) => a + b, 0) : 0;
    const opexY1 = opexAnnual[1];

    // --- financing ---
    const conv = p.financing.conventional || { loans:[] };
    const loans = (conv.loans || []).map((l) => ({
      id:l.id, name:l.name || '', structure:l.structure || 'bank_loan',
      amount:num(l.amount), rateMode:(l.rateMode === 'manual') ? 'manual' : 'auto',
      manualRate:num(l.manualRate), rate:(l.rateMode === 'manual') ? num(l.manualRate) : g('financingRate'),
      tenureYears:Math.max(0.25, num(l.tenureYears)), freq:l.freq || 'monthly',
      graceMonths:num(l.graceMonths), fees:num(l.fees), startDate:l.startDate
    }));
    const convAnnualInterest = Array(N + 1).fill(0);
    const convAnnualPrincipal = Array(N + 1).fill(0);
    const convAnnualPayment = Array(N + 1).fill(0);
    const convBalance = Array(N + 1).fill(0);
    const schedules = [];
    let convTotalDrawn = 0, convTotalFees = 0;
    loans.forEach((l) => {
      const sch = amortSchedule(l.amount, l.rate, l.freq, l.tenureYears, l.graceMonths);
      schedules.push(Object.assign({ loan: l }, sch));
      let yr = 1;
      for (; yr <= N; yr++) {
        const a = sch.annual[yr];
        if (a) {
          convAnnualInterest[yr] += a.interest;
          convAnnualPrincipal[yr] += a.principal;
          convAnnualPayment[yr] += a.payment;
          convBalance[yr] += a.balance;
        }
      }
      convTotalDrawn += l.amount;
      convTotalFees += l.fees;
    });

    // --- islamic financing ---
    const islamic = p.financing.islamic || {};
    const isl = computeIslamic(p, N, revenueAnnual);
    // islamic: { injected, principalAnnual[], profitAnnual[] (financing cost), distributionAnnual[], rentals, notes }

    const finCostAnnual = Array(N + 1).fill(0);
    const principalAnnual = Array(N + 1).fill(0);
    const distributionAnnual = Array(N + 1).fill(0);
    let injected0 = 0, finFees0 = 0, finDeposit0 = 0;
    if (p.financialMode === 'SYARIAH') {
      injected0 = isl.injected;
      finDeposit0 = isl.deposit;
      for (let y = 1; y <= N; y++) {
        finCostAnnual[y] += isl.profitAnnual[y] || 0;
        principalAnnual[y] += isl.principalAnnual[y] || 0;
        distributionAnnual[y] += isl.distributionAnnual[y] || 0;
      }
    } else {
      injected0 = convTotalDrawn;
      finFees0 = convTotalFees;
      for (let y = 1; y <= N; y++) {
        finCostAnnual[y] += convAnnualInterest[y];
        if (finFees0 > 0) finCostAnnual[y] += finFees0 / N;
        principalAnnual[y] += convAnnualPrincipal[y];
      }
    }

    // --- working capital ---
    const collDays = g('collectionDays');
    const payDays = g('paymentDays');
    const invDays = g('inventoryDays');
    const wcEnd = Array(N + 1).fill(0);
    const ar = Array(N + 1).fill(0), inv = Array(N + 1).fill(0), ap = Array(N + 1).fill(0);
    for (let y = 1; y <= N; y++) {
      ar[y] = revenueAnnual[y] * collDays / 365;
      inv[y] = cogsAnnual[y] * invDays / 365;
      ap[y] = (cogsAnnual[y] + opexAnnual[y]) * payDays / 365;
      wcEnd[y] = ar[y] + inv[y] - ap[y];
    }
    const initialWC = wcEnd[1];

    // --- initial investment ---
    const initial = {
      capex: capexTotal, startup: startupTotal, workingCapital: initialWC,
      total: capexTotal + startupTotal + initialWC
    };
    const equityRequired = Math.max(0, initial.total - injected0);

    // --- P&L ---
    const pl = { revenue:Array(N+1).fill(0), cogs:Array(N+1).fill(0), grossProfit:Array(N+1).fill(0),
      opex:opexAnnual, ebitda:Array(N+1).fill(0), dep:Array(N+1).fill(0), ebit:Array(N+1).fill(0),
      financingCost:Array(N+1).fill(0), pbt:Array(N+1).fill(0), tax:Array(N+1).fill(0), netProfit:Array(N+1).fill(0),
      grossMargin:Array(N+1).fill(0), ebitdaMargin:Array(N+1).fill(0), netMargin:Array(N+1).fill(0) };
    for (let y = 1; y <= N; y++) {
      pl.revenue[y] = revenueAnnual[y];
      pl.cogs[y] = cogsAnnual[y];
      pl.grossProfit[y] = grossProfit[y];
      pl.ebitda[y] = revenueAnnual[y] - cogsAnnual[y] - opexAnnual[y];
      pl.dep[y] = dep.annualByYear[y] || 0;
      pl.ebit[y] = pl.ebitda[y] - pl.dep[y];
      pl.financingCost[y] = finCostAnnual[y];
      pl.pbt[y] = pl.ebit[y] - pl.financingCost[y];
      pl.tax[y] = pl.pbt[y] > 0 ? pl.pbt[y] * taxRate : 0;
      pl.netProfit[y] = pl.pbt[y] - pl.tax[y];
      pl.grossMargin[y] = revenueAnnual[y] > 0 ? grossProfit[y] / revenueAnnual[y] * 100 : 0;
      pl.ebitdaMargin[y] = revenueAnnual[y] > 0 ? pl.ebitda[y] / revenueAnnual[y] * 100 : 0;
      pl.netMargin[y] = revenueAnnual[y] > 0 ? pl.netProfit[y] / revenueAnnual[y] * 100 : 0;
    }

    // Musharakah/Mudarabah: distributions depend on profit, computed above
    if (p.financialMode === 'SYARIAH' && isl._psr) {
      for (let y = 1; y <= N; y++) {
        const base = isl._type === 'musharakah' ? (pl.ebitda[y] - pl.tax[y]) : pl.netProfit[y];
        distributionAnnual[y] = base > 0 ? base * isl._psr : 0;
        isl.distributionAnnual[y] = distributionAnnual[y];
      }
    }

    // --- Cash flow (indirect method — interlocked with the balance sheet) ---
    // Note: financing cost (interest / islamic profit) is NOT repeated here — it is already
    // inside Net Income. Financing cash flows carry principal repayments + profit distributions only.
    const cf = {
      netIncome:Array(N+1).fill(0), dep:Array(N+1).fill(0),
      dAr:Array(N+1).fill(0), dInv:Array(N+1).fill(0), dPrepaid:Array(N+1).fill(0),
      dAp:Array(N+1).fill(0), dTax:Array(N+1).fill(0),
      operating:Array(N+1).fill(0), investing:Array(N+1).fill(0), financing:Array(N+1).fill(0),
      net:Array(N+1).fill(0), opening:Array(N+1).fill(0), closing:Array(N+1).fill(0),
      capexOut:Array(N+1).fill(0), debtRepay:Array(N+1).fill(0), distributions:Array(N+1).fill(0),
      cash0:0
    };
    const cash0 = equityRequired + injected0 - capexTotal - startupTotal - finFees0 - finDeposit0;
    cf.cash0 = cash0;
    cf.investing[0] = -capexTotal;
    cf.financing[0] = injected0 - finFees0 - finDeposit0;
    // Year-0 financing detail: debt issued + equity contributed (equityRequired covers any shortfall after debt)
    cf.debtIssue0 = injected0;
    cf.stockIssue0 = equityRequired;
    // Fully reconciled Year-0 column for the statement presentation:
    //   raising (debt + equity − fees/deposit) − investing (capex + startup costs) = cash0
    cf.y0 = {
      operating: 0, capex: -capexTotal, startup: -startupTotal,
      debtIssue: injected0, stockIssue: equityRequired, fees: -(finFees0 + finDeposit0),
      investing: -(capexTotal + startupTotal),
      financing: injected0 + equityRequired - finFees0 - finDeposit0,
      net: cash0, begin: 0, end: cash0
    };
    let opening = cash0;
    let prevTax = 0;
    for (let y = 1; y <= N; y++) {
      cf.netIncome[y] = pl.netProfit[y];
      cf.dep[y] = pl.dep[y];
      cf.dAr[y] = -(ar[y] - (y === 1 ? 0 : ar[y - 1]));
      cf.dInv[y] = -(inv[y] - (y === 1 ? 0 : inv[y - 1]));
      cf.dPrepaid[y] = 0;
      cf.dAp[y] = ap[y] - (y === 1 ? 0 : ap[y - 1]);
      cf.dTax[y] = pl.tax[y] - prevTax;
      cf.capexOut[y] = -capexAnnual[y];
      cf.debtRepay[y] = -principalAnnual[y];
      cf.distributions[y] = -distributionAnnual[y];
      cf.operating[y] = pl.netProfit[y] + pl.dep[y] + cf.dAr[y] + cf.dInv[y] + cf.dPrepaid[y] + cf.dAp[y] + cf.dTax[y];
      cf.investing[y] = cf.capexOut[y];          // +0 proceeds from disposals/investments (none modelled)
      cf.financing[y] = cf.debtRepay[y] + cf.distributions[y]; // +0 new debt/equity, dividends, treasury stock
      cf.net[y] = cf.operating[y] + cf.investing[y] + cf.financing[y];
      cf.opening[y] = opening;
      cf.closing[y] = opening + cf.net[y];
      opening = cf.closing[y];
      prevTax = pl.tax[y];
    }

    // --- Accounting statements (ACC): Income Statement, Balance Sheet, Cash Flow — interlocked ---
    const cumDep = Array(N + 1).fill(0);
    for (let y = 1; y <= N; y++) cumDep[y] = cumDep[y - 1] + (pl.dep[y] || 0);
    const fixedOpexAnnual = Array(N + 1).fill(0);
    for (let y = 1; y <= N; y++) fixedOpexAnnual[y] = opexAnnual[y] - variableOpexAnnual[y];
    const bsCash = Array(N + 1).fill(0), bsDebt = Array(N + 1).fill(0), bsFixedGross = Array(N + 1).fill(0),
      bsFixedNet = Array(N + 1).fill(0), bsRE = Array(N + 1).fill(0), bsAR = Array(N + 1).fill(0),
      bsInv = Array(N + 1).fill(0), bsAP = Array(N + 1).fill(0), bsTax = Array(N + 1).fill(0),
      bsPrepaid = Array(N + 1).fill(0);
    bsCash[0] = cash0;
    bsDebt[0] = injected0;
    bsFixedGross[0] = capexTotal; bsFixedNet[0] = capexTotal;
    bsRE[0] = -(startupTotal + finFees0 + finDeposit0);   // startup costs + loan fees/deposit expensed at start
    // Year-end debt = drawn borrowing less cumulative principal repaid, so that the year-over-year
    // change in the balance sheet matches the financing cash flows exactly (ΔDebt = −principal repaid).
    let cumPrincipal = 0;
    for (let y = 1; y <= N; y++) {
      bsCash[y] = cf.closing[y];
      cumPrincipal += principalAnnual[y] || 0;
      bsDebt[y] = Math.max(0, injected0 - cumPrincipal);
      bsFixedGross[y] = capexTotal;
      bsFixedNet[y] = capexTotal - cumDep[y];
      bsRE[y] = bsRE[y - 1] + pl.netProfit[y] - distributionAnnual[y];
      bsAR[y] = ar[y]; bsInv[y] = inv[y]; bsAP[y] = ap[y]; bsTax[y] = pl.tax[y]; bsPrepaid[y] = 0;
    }
    const bs = {
      cash:bsCash, ar:bsAR, inv:bsInv, prepaid:bsPrepaid, fixedGross:bsFixedGross, fixedNet:bsFixedNet,
      debt:bsDebt, ap:bsAP, taxPayable:bsTax,
      contributedCapital: equityRequired,
      retainedEarnings: bsRE
    };
    const accIs = {
      revenue: pl.revenue, variy: variableCogsAnnual, fixedCogs: fixedCogsAnnual, grossProfit,
      variableOpex: variableOpexAnnual, fixedOpex: fixedOpexAnnual,
      ebitda: pl.ebitda, dep: pl.dep, ebit: pl.ebit, interest: pl.financingCost, tax: pl.tax, netIncome: pl.netProfit
    };
    const acc = { is: accIs, bs, cf };

    // --- FCF (unlevered, for investment metrics) ---
    const fcf = Array(N + 1).fill(0);
    for (let y = 1; y <= N; y++) {
      const deltaWC = wcEnd[y] - (y === 1 ? initialWC : wcEnd[y - 1]);
      fcf[y] = pl.ebitda[y] - pl.tax[y] - capexAnnual[y] - deltaWC;
    }
    fcf[N] += wcEnd[N]; // recover working capital at end of projection

    // --- NPV ---
    const totalInvestment = initial.total;
    const pvSeries = [];
    let pvSum = 0;
    for (let y = 1; y <= N; y++) {
      const pv = fcf[y] / Math.pow(1 + discount, y);
      pvSum += pv; pvSeries.push({ y, fcf:fcf[y], factor:Math.pow(1 + discount, y), pv });
    }
    const npv = pvSum - totalInvestment;

    // --- IRR ---
    const irrSeries = [-totalInvestment].concat(fcf.slice(1));
    const irrVal = irr(irrSeries);

    // --- ROI ---
    const sumFCF = fcf.slice(1).reduce((a, b) => a + b, 0);
    const netReturn = sumFCF - totalInvestment;
    const roiTotal = totalInvestment > 0 ? netReturn / totalInvestment * 100 : 0;
    const roiAnnual = totalInvestment > 0 ? roiTotal / N : 0;

    // --- Payback ---
    let cumulative = 0, paybackYear = null, paybackPeriod = null, recoveredIn = null;
    const cumArr = [];
    for (let y = 1; y <= N; y++) {
      cumulative += fcf[y];
      cumArr.push({ y, fcf:fcf[y], cumulative });
      if (paybackYear === null && cumulative >= totalInvestment && totalInvestment > 0) {
        paybackYear = y;
        const prev = y === 1 ? 0 : cumArr[y - 2].cumulative;
        const frac = (totalInvestment - prev) / (fcf[y] || 1);
        paybackPeriod = (y - 1) + Math.min(frac, 1);
        recoveredIn = y;
      }
    }
    const payback = { totalInvestment, cumulative:cumArr, paybackYear, paybackPeriod, recoveredIn, recovered: paybackYear !== null };

    // --- Break-even (year 1) ---
    const fixedCost = opexAnnual[1] + dep.annualByYear[1] + finCostAnnual[1];
    const pricePerUnit = totalUnitsY1 > 0 ? revenueAnnual[1] / totalUnitsY1 : 0;
    const varCostPerUnit = totalUnitsY1 > 0 ? variableCogsY1 / totalUnitsY1 : 0;
    const contributionPerUnit = pricePerUnit - varCostPerUnit;
    const cMRatio = revenueAnnual[1] > 0 ? (revenueAnnual[1] - variableCogsY1) / revenueAnnual[1] : 0;
    const beUnits = contributionPerUnit > 0 ? fixedCost / contributionPerUnit : null;
    const beRevenue = cMRatio > 0 ? fixedCost / cMRatio : null;
    const breakeven = { fixedCost, variableCost: variableCogsY1, pricePerUnit, varCostPerUnit, contributionPerUnit,
      contributionPct: cMRatio * 100, beUnits, beRevenue };

    // --- Ratios (year N, simplified balance sheet) ---
    const yN = N;
    const debtOutstanding = p.financialMode === 'SYARIAH' ? isl.outstanding[yN] : (convBalance[yN]);
    const cashN = cf.closing[N];
    const equity = Math.max(0, equityRequired) + pl.netProfit.slice(1, N + 1).reduce((a, b) => a + Math.max(0, b), 0);
    const totalAssets = Math.max(1, equity + debtOutstanding);
    const currentAssets = cashN + ar[yN] + inv[yN];
    const currentLiabilities = Math.max(1, ap[yN]);
    const ratios = {
      grossMargin: pl.grossMargin[yN], ebitdaMargin: pl.ebitdaMargin[yN], netMargin: pl.netMargin[yN],
      roa: pl.netProfit[yN] / totalAssets * 100,
      roe: equity > 0 ? pl.netProfit[yN] / equity * 100 : null,
      currentRatio: currentAssets / currentLiabilities,
      quickRatio: (currentAssets - inv[yN]) / currentLiabilities,
      debtToEquity: equity > 0 ? debtOutstanding / equity : null,
      debtRatio: totalAssets > 0 ? debtOutstanding / totalAssets * 100 : 0,
      assetTurnover: revenueAnnual[yN] / totalAssets,
      receivableDays: collDays, inventoryDays: invDays, payableDays: payDays,
      equity, totalAssets, debtOutstanding
    };

    // --- Alerts ---
    const alerts = [];
    for (let y = 1; y <= N; y++) {
      if (cf.closing[y] < 0) alerts.push({ k:'cash_shortfall', y, sev:'bad', txt: 'cash_shortfall' });
      else if (cf.net[y] < 0) alerts.push({ k:'neg_cashflow', y, sev:'warn', txt: 'neg_cashflow' });
    }
    if (ratios.debtRatio > 70) alerts.push({ k:'high_debt', sev:'warn', txt:'high_debt' });
    if (pl.netMargin[N] < 5) alerts.push({ k:'low_margin', sev:'warn', txt:'low_margin' });
    if (totalInvestment > 0 && npv < 0) alerts.push({ k:'neg_npv', sev:'warn', txt:'neg_npv' });
    if (irrVal === null && totalInvestment > 0) alerts.push({ k:'irr_nc', sev:'warn', txt:'irr_nc' });
    if (!payback.recovered && totalInvestment > 0) alerts.push({ k:'long_payback', sev:'warn', txt:'long_payback' });
    for (let y = 2; y <= N; y++) if (revenueAnnual[y] < revenueAnnual[y - 1] - 1e-9) { alerts.push({ k:'revenue_decline', y, sev:'info', txt:'revenue_decline' }); break; }
    if (revenueAnnual[1] > 0 && opexAnnual[N] > revenueAnnual[N] * 0.9) alerts.push({ k:'excessive_expenses', sev:'warn', txt:'excessive_expenses' });
    if (initialWC > cf.closing[1]) alerts.push({ k:'wc_shortage', sev:'info', txt:'wc_shortage' });
    let missing = [];
    ASSUMPTION_DEFS.forEach((d) => { const a = A[d.key]; if (a && a.mode === 'manual' && blank(a.manual)) missing.push(d.key); });
    if (revenueAnnual[1] <= 0) missing.push('revenue');
    if (missing.length) alerts.push({ k:'missing_assumptions', sev:'info', txt:'missing_assumptions', detail: missing.join(', ') });

    return {
      N, currency:cur, mode:p.financialMode, startDate:p.startDate, projectionPeriod:N,
      assumptions:{ growth, inflation, opexGrowth, taxRate, discount, financeRate, collDays, payDays, invDays,
        residualPct:g('residualPct'), usefulLife:g('usefulLife'), raw:A },
      capex:{ items:p.capex.items, total:capexTotal, depSchedule:dep, annualByYear:dep.annualByYear },
      startup:{ items:startupItems, total:startupTotal },
      initial,
      equityRequired,
      revenue:{ streams, detail:streamDetail, annual:revenueAnnual, monthly:monthlyRevenue, year1:year1RevBase, totalUnitsY1, monthLabels:MONTHS },
      seasonal,
      cogs:{ annual:cogsAnnual, variable:variableCogsAnnual, fixed:fixedCogsAnnual, variableY1:variableCogsY1, materialPct:matPct * 100 },
      opex:{ categories:perCatAnnual, annual:opexAnnual, y1:opexY1, contingencyAnnual, contingencyPct: contingencyPct * 100, employeeOnCost },
      payroll,
      payrollScenarios: payrollScenarios(p, N),
      grossProfit, grossMargin,
      financing:{
        conventional:{ loans, schedules, annualInterest:convAnnualInterest, annualPrincipal:convAnnualPrincipal, annualPayment:convAnnualPayment, balance:convBalance, totalDrawn:convTotalDrawn, fees:convTotalFees },
        islamic: isl,
        injected0, finFees0, finDeposit0,
        costAnnual:finCostAnnual, principalAnnual, distributionAnnual
      },
      wc:{ ar, inv, ap, end:wcEnd, initialWC },
      pl, cf,
      acc,
      fcf, pvSeries, pvSum,
      invest:{ totalInvestment, netReturn, sumFCF, discount, npv, irr:irrVal, irrSeries, roiTotal, roiAnnual, payback, breakeven, roiMethod:p.roiMethod || 'total' },
      ratios, alerts,
      monthlyRevenue
    };
  }

  /* ---------------- Islamic financing computation ---------------- */
  function computeIslamic(p, N, revenueAnnual) {
    const isl = p.financing.islamic || {};
    const struct = isl.structure || 'murabahah';
    const out = {
      structure: struct, injected:0, deposit:0, outstanding:Array(N + 1).fill(0),
      profitAnnual:Array(N + 1).fill(0), principalAnnual:Array(N + 1).fill(0),
      distributionAnnual:Array(N + 1).fill(0), detail:{}
    };
    if (struct === 'murabahah') {
      const cost = num((isl.murabahah || {}).assetCost);
      const marginPct = num((isl.murabahah || {}).marginPct);
      const termMonths = Math.max(1, Math.round(num((isl.murabahah || {}).termMonths)));
      const deposit = num((isl.murabahah || {}).deposit);
      const financed = Math.max(0, cost - deposit);
      const selling = financed * (1 + marginPct / 100);
      const profitTotal = selling - financed;
      const inst = termMonths > 0 ? selling / termMonths : 0;
      const years = Math.max(1, Math.ceil(termMonths / 12));
      // spread evenly over months -> aggregate by year
      const annualProfit = Array(N + 1).fill(0), annualPrincipal = Array(N + 1).fill(0), annualPayment = Array(N + 1).fill(0);
      for (let m = 0; m < termMonths; m++) {
        const y = Math.floor(m / 12) + 1;
        if (y <= N) {
          annualProfit[y] += profitTotal / termMonths;
          annualPrincipal[y] += financed / termMonths;
          annualPayment[y] += inst;
          out.outstanding[y] += selling - inst * (m + 1);
        }
      }
      out.injected = financed; out.deposit = deposit;
      out.profitAnnual = annualProfit; out.principalAnnual = annualPrincipal;
      out.detail = { financed, selling, profitTotal, termMonths, inst, annualProfit, annualPrincipal };
    } else if (struct === 'ijarah') {
      const d = isl.ijarah || {};
      const rentalPm = num(d.rentalPm), maintenancePm = num(d.maintenancePm), leaseYears = Math.max(1, num(d.leaseYears)), dep = num(d.deposit);
      for (let y = 1; y <= Math.min(N, leaseYears); y++) {
        out.profitAnnual[y] = rentalPm * 12 + maintenancePm * 12;
      }
      out.deposit = dep;
      out.detail = { totalRental: rentalPm * 12 * leaseYears, leaseYears, rentalPm, maintenancePm };
    } else if (struct === 'musharakah') {
      const d = isl.musharakah || {};
      const partnerCapital = num(d.partnerCapital);
      const psr = num(d.profitSharingPct) / 100;
      out.injected = partnerCapital;
      // compute profit share later using EBITDA (approximation) — filled by computeFinance
      out._psr = psr; out._type = 'musharakah';
      out.detail = { partnerCapital, psr: num(d.profitSharingPct), lossAllocation: d.lossAllocation || '' };
    } else if (struct === 'mudarabah') {
      const d = isl.mudarabah || {};
      const capitalAmount = num(d.capitalAmount);
      const psr = num(d.profitSharingPct) / 100;
      out.injected = capitalAmount;
      out._psr = psr; out._type = 'mudarabah';
      out.detail = { capitalAmount, psr: num(d.profitSharingPct), provider: d.capitalProvider || '', manager: d.manager || '' };
    }
    return out;
  }

  function finalizeIslamicDistribution(F, p) {
    // apply profit-sharing distribution for musharakah/mudarabah after net profit is known
    const isl = F.financing.islamic;
    if (F.mode !== 'SYARIAH' || !isl || !isl._psr) return;
    const N = F.N;
    for (let y = 1; y <= N; y++) {
      const base = isl._type === 'musharakah' ? F.pl.ebitda[y] - F.pl.tax[y] : F.pl.netProfit[y];
      if (base > 0) isl.distributionAnnual[y] = base * isl._psr;
    }
  }

  /* ---------------- Scenarios & Sensitivity ---------------- */
  function scenarioClone(p, over) {
    const c = JSON.parse(JSON.stringify(p));
    if (over.assumptions) Object.keys(over.assumptions).forEach((k) => { setManual(c, k, over.assumptions[k]); });
    if (over.revenue) { const first = c.revenue.streams[0]; if (first) first.monthlyVolume = over.revenue; }
    if (over.cogsPct) setManual(c, 'cogsPct', over.cogsPct);
    if (over.opexPct) { /* scale base categories */ }
    return c;
  }

  function scenarioDefaults(projectionPeriod) {
    return {
      base:{ assumptions:{ revenueGrowth:5 }, revenue:null },
      optimistic:{ assumptions:{ revenueGrowth:10 } },
      pessimistic:{ assumptions:{ revenueGrowth:0 } }
    };
  }
  function defaultScenarioConfig() {
    return {
      base:{ revenueGrowth:'', cogsPct:'', opexPct:'', capexPct:'' },
      optimistic:{ revenueGrowth:10, cogsPct:-5, opexPct:-5, capexPct:'' },
      pessimistic:{ revenueGrowth:0, cogsPct:5, opexPct:5, capexPct:'' }
    };
  }
  function applyFactors(p, revenueMult, growthPct, cogsPct, opexPct, capexPct) {
    const c = JSON.parse(JSON.stringify(p));
    if (revenueMult != null) { (c.revenue.streams || []).forEach((s) => { s.monthlyVolume = num(s.monthlyVolume) * revenueMult; if (s.monthlyRevenue) s.monthlyRevenue = num(s.monthlyRevenue) * revenueMult; }); }
    if (growthPct != null) setManual(c, 'revenueGrowth', growthPct);
    if (cogsPct != null) { setManual(c, 'cogsPct', cogsPct); if (!blank(c.specialAssumptions.materialPct)) c.specialAssumptions.materialPct = cogsPct; }
    if (opexPct != null) { Object.keys(c.opex.categories || {}).forEach((k) => { const cat = c.opex.categories[k]; if (!cat) return; const f = 1 + opexPct / 100; ['base','monthlyBase','annualBase'].forEach((field) => { if (cat[field] !== undefined && cat[field] !== '') cat[field] = num(cat[field]) * f; }); }); }
    if (capexPct != null) { (c.capex.items || []).forEach((it) => { it.unitCost = num(it.unitCost) * (1 + capexPct / 100); }); }
    return c;
  }

  function metricOf(F) {
    return { npv:F.invest.npv, irr:F.invest.irr, roi:F.invest.roiTotal, netProfitY5:(F.pl.netProfit[F.N] || 0), beUnits:F.invest.breakeven.beUnits, totalInvestment:F.invest.totalInvestment };
  }

  function scenarioTable(p) {
    p = ensure(p);
    const cfg = p.scenarios || {};
    const def = defaultScenarioConfig();
    const cases = [ { id:'base', label:'base' }, { id:'optimistic', label:'optimistic' }, { id:'pessimistic', label:'pessimistic' } ];
    const rows = cases.map((cs) => {
      const user = cfg[cs.id] || {};
      const c = Object.assign({}, def[cs.id] || {}, user);
      const effGrowth = blank(c.revenueGrowth) ? num(p.assumptions.revenueGrowth.active) : num(c.revenueGrowth);
      const clone = applyFactors(p, null, effGrowth, blank(c.cogsPct) ? null : num(c.cogsPct), blank(c.opexPct) ? null : num(c.opexPct), blank(c.capexPct) ? null : num(c.capexPct));
      return { id:cs.id, metric: metricOf(computeFinance(clone)) };
    });
    return rows;
  }

  const SENS_PARAMS = [
    { key:'revenue', apply:(p, m) => applyFactors(p, m, null, null, null, null) },
    { key:'price', apply:(p, m) => { const c = JSON.parse(JSON.stringify(p)); (c.revenue.streams || []).forEach((s) => s.unitPrice = num(s.unitPrice) * m); return c; } },
    { key:'volume', apply:(p, m) => applyFactors(p, m, null, null, null, null) },
    { key:'cogs', apply:(p, m) => { const c = JSON.parse(JSON.stringify(p)); const base = blank(c.specialAssumptions.materialPct) ? num(c.assumptions.cogsPct.active) : num(c.specialAssumptions.materialPct); c.specialAssumptions.materialPct = base * m; setManual(c, 'cogsPct', base * m); return c; } },
    { key:'opex', apply:(p, m) => applyFactors(p, null, null, null, ((m - 1) * 100), null) },
    { key:'capex', apply:(p, m) => { const c = JSON.parse(JSON.stringify(p)); (c.capex.items || []).forEach((it) => { it.unitCost = num(it.unitCost) * m; it.totalCost = num(it.totalCost) * m; }); return c; } },
    { key:'discount', apply:(p, m) => { const c = JSON.parse(JSON.stringify(p)); setManual(c, 'discountRate', Math.max(0.5, num(p.assumptions.discountRate.active) * m)); return c; } },
    { key:'financeRate', apply:(p, m) => { const c = JSON.parse(JSON.stringify(p)); setManual(c, 'financingRate', Math.max(0.5, num(p.assumptions.financingRate.active) * m)); return c; } }
  ];

  function sensitivityTable(p, mults) {
    p = ensure(p);
    mults = mults || { touch:1.5, touch2:0.5 };
    const up = [];
    SENS_PARAMS.forEach((prm) => {
      const cloneUp = prm.apply(p, mults.touch);
      up.push({ key:prm.key, metric: metricOf(computeFinance(cloneUp)) });
    });
    return { params: SENS_PARAMS.map((x) => x.key), base: metricOf(computeFinance(p)), up, mults };
  }

  /* ---------------- Demo projects ---------------- */
  function demoProject(mode) {
    const p = makeProject(mode === 'SYARIAH' ? 'Demo — Syariah' : 'Demo — Konvensional');
    p.financialMode = mode;
    p.business = {
      businessName:'Demo Business Sdn. Bhd.', regNo:'202501012345', businessType:'Syarikat Sendirian', industry:'F&B',
      address:'12, Jalan Contoh, Kuala Terengganu', contact:'+60 12-345 6789', owner:'Ahmad Khalid', employees:'8',
      description:'Kafe & perkhidmatan katering komuniti.', objective:'Mengembangkan operasi ke cawangan kedua.',
      projectObjective:'Membuka cawangan kedua dalam tempoh 12 bulan.', projectType:'Servis / Makanan'
    };
    p.startDate = new Date().toISOString().slice(0, 10);
    p.projectionPeriod = 5;
    p.currency = 'RM / MYR';
    p.assumptions.revenueGrowth.active = 6; p.assumptions.inflation.active = 3;
    p.assumptions.cogsPct.active = 52; p.assumptions.opexGrowth.active = 3; p.assumptions.taxRate.active = 24;
    p.assumptions.discountRate.active = 10; p.assumptions.financingRate.active = 6;
    p.assumptions.collectionDays.active = 20; p.assumptions.inventoryDays.active = 30; p.assumptions.paymentDays.active = 30;
    p.specialAssumptions.materialPct = 47; p.specialAssumptions.directLabourAnnual = 54000;
    p.specialAssumptions.directProductionAnnual = 6000; p.specialAssumptions.otherDirectAnnual = 2400;
    p.specialAssumptions.epfPct = 13; p.specialAssumptions.seasonAdj = 1.25; p.specialAssumptions.peakMonth = 5;
    p.capex.items = [
      { id:uid(), name:'Renovasi kedai', category:'renovation', qty:1, unitCost:65000, totalCost:65000, purchaseDate:p.startDate, usefulLife:10, residualValue:5000, depMethod:'sl' },
      { id:uid(), name:'Peralatan dapur', category:'equipment', qty:1, unitCost:50000, totalCost:50000, purchaseDate:p.startDate, usefulLife:5, residualValue:4000, depMethod:'sl' },
      { id:uid(), name:'Mesin kopi & bar', category:'machinery', qty:2, unitCost:10000, totalCost:20000, purchaseDate:p.startDate, usefulLife:5, residualValue:2000, depMethod:'sl' },
      { id:uid(), name:'Perabot & hiasan', category:'furniture', qty:1, unitCost:15000, totalCost:15000, purchaseDate:p.startDate, usefulLife:5, residualValue:1000, depMethod:'sl' },
      { id:uid(), name:'Sistem POS & IT', category:'it', qty:1, unitCost:15000, totalCost:15000, purchaseDate:p.startDate, usefulLife:3, residualValue:500, depMethod:'sl' }
    ];
    p.startup.items = [
      { id:uid(), name:'Pendaftaran & lesen', amount:5000 },
      { id:uid(), name:'Deposit sewa (3 bulan)', amount:12000 },
      { id:uid(), name:'Kempen pembukaan', amount:8000 },
      { id:uid(), name:'Latihan staf', amount:5000 }
    ];
    p.revenue.streams = [
      { id:uid(), name:'Makanan & minuman', type:'product', monthlyVolume:4600, unitPrice:10, monthlyRevenue:'', useRevenue:false, growth:'' },
      { id:uid(), name:'Katering acara', type:'service', monthlyVolume:'', unitPrice:'', monthlyRevenue:9500, useRevenue:true, growth:'' }
    ];
    OPEX_CATS.forEach(([key]) => { p.opex.categories[key] = { monthly:true, base:'', growth:'' }; });
    p.opex.categories.salaries = { monthly:true, base:6000, growth:3 };
    p.opex.categories.rent = { monthly:true, base:3000, growth:3 };
    p.opex.categories.utilities = { monthly:true, base:900, growth:3 };
    p.opex.categories.marketing = { monthly:true, base:800, growth:0, variable:true };
    p.opex.categories.transport = { monthly:true, base:400, growth:3 };
    p.opex.categories.insurance = { monthly:false, base:2400, growth:3 };
    p.opex.categories.maintenance = { monthly:true, base:300, growth:3 };
    p.opex.categories.telco = { monthly:true, base:180, growth:0 };
    p.opex.categories.software = { monthly:true, base:150, growth:0 };
    p.opex.categories.admin = { monthly:true, base:400, growth:3 };
    p.opex.categories.professional = { monthly:false, base:3600, growth:3 };
    p.opex.categories.other = { monthly:true, base:200, growth:3 };
    if (mode === 'SYARIAH') {
      p.financing.islamic = { structure:'murabahah', murabahah:{ assetCost:110000, acquisitionCost:'', marginPct:18, termMonths:60, deposit:20000 },
        ijarah:{ assetValue:'', leaseYears:'', rentalPm:'', maintenancePm:'', deposit:'', ownership:'', endTerm:'' },
        musharakah:{ capital:'', partnerCapital:'', ownershipPct:'', profitSharingPct:'', lossAllocation:'' },
        mudarabah:{ capitalProvider:'', manager:'', capitalAmount:'', profitSharingPct:'' },
        istisna:{ contractValue:'', delivery:'', payment:'', productionCost:'', expectedRevenue:'' } };
      p.shariah.screening = { activity:'no', riba:'no', gharar:'no', maysir:'no', halalSector:'food', halalStatus:'', notes:'', lastScreenedAt:Date.now() };
    } else {
      p.financing.conventional = { loans:[ { id:uid(), name:'Pinjaman Perniagaan SME', structure:'term_loan', amount:90000, rateMode:'auto', manualRate:'', tenureYears:5, freq:'monthly', graceMonths:0, fees:1800, startDate:p.startDate } ] };
    }
    p.budget.actual = { revenue:'', cogs:'', opex:'', capex:'' };
    p.updatedAt = Date.now();
    return p;
  }

  /* ---------------- Exports ---------------- */
  global.Model = {
    MONTHS, MONTHS_EN, ASSUMPTION_DEFS, OPEX_CATS, CAPEX_CATS,
    uid, num, blank, makeProject, ensure, defaultSettings, defaultAssumptions,
    setAuto, setManual, resetToAuto,
    amortSchedule, irr, depreciationSchedule, seasonalWeights,
    computeFinance, computeIslamic, scenarioTable, sensitivityTable, SENS_PARAMS,
    demoProject, defaultScenarioConfig
  };
})(typeof window !== 'undefined' ? window : globalThis);
