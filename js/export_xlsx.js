/* BizFinPro — Excel (.xlsx) export via SheetJS */
(function (global) {
  'use strict';

  function escC(s) { return String(s == null ? '' : s); }

  function exportXlsx(p, F, opts) {
    opts = opts || {};
    const t = I18N.t;
    const sec = (global.BizReports && BizReports.sectionsFor(p)) || null;
    const include = (key) => !sec || !sec[key] || sec[key].included !== false;
    const wb = XLSX.utils.book_new();
    const cur = p.currency;
    const N = F.N;
    const years = []; for (let y = 1; y <= N; y++) years.push(t('year') + ' ' + y);
    const RM = (v, d) => FMT.money(v, cur, { decimals: d == null ? 0 : d });

    function sheet(name, rows) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = rows[0].map((c, i) => {
        const w = Math.max(10, Math.min(34, Math.max(...rows.map((r) => String(r[i] == null ? '' : r[i]).length)) + 2));
        return { wch: w };
      });
      if (opts.formulas !== false) {
        // money format for numeric cells
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r + 1; R <= range.e.r; R++) {
          for (let C = 0; C <= range.e.c; C++) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[addr];
            if (cell && typeof cell.v === 'number') {
              cell.z = '#,##0';
            } else if (cell && typeof cell.v === 'string' && cell.v.startsWith('=')) {
              cell.f = cell.v.slice(1);
              delete cell.v;
              cell.z = '#,##0';
            }
          }
        }
      }
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    const sheetReport = true;
    const SHEET = (name, rows) => { if (sheetReport) sheet(name, rows); return rows; };
    const P = (v) => (v == null || v === '' ? { t: 's', v: '' } : ({ t: 'n', v: Number(v) || 0 }));

    /* 1 Executive summary */
    if (include('exec_summary')) {
      SHEET(t('reports.exec_summary'), [
        ['BizFinPro', t('reports.exec_summary')],
        [t('profile.business_name'), p.business.businessName || ''],
        [t('common.mode'), p.financialMode],
        [t('common.period'), N + ' ' + t('year')],
        [],
        [t('dashboard.total_investment'), P(F.invest.totalInvestment)],
        [t('reports.revenue') + ' (Y1)', P(F.revenue.annual[1])],
        [t('dashboard.net_profit') + ' (Y5)', P(F.pl.netProfit[F.N])],
        [t('dashboard.roi'), P(F.invest.roiTotal)],
        [t('dashboard.npv'), P(F.invest.npv)],
        [t('dashboard.irr'), P(F.invest.irr == null ? null : F.invest.irr * 100)],
        [t('dashboard.payback'), F.invest.payback.paybackYear == null ? t('not_recovered') : F.invest.payback.paybackPeriod != null ? F.invest.payback.paybackPeriod.toFixed(2) + ' ' + t('year') : F.invest.payback.paybackYear]
      ]);
    }

    /* 2 Business profile */
    if (include('profile')) {
      SHEET(t('reports.profile'), [
        [t('profile.business_name'), p.business.businessName || ''],
        [t('profile.reg_no'), p.business.regNo || ''],
        [t('profile.business_type'), p.business.businessType || ''],
        [t('profile.industry'), p.business.industry || ''],
        [t('profile.address'), p.business.address || ''],
        [t('profile.owner'), p.business.owner || ''],
        [t('profile.owner'), p.business.owner || ''],
        [t('profile.contact'), p.business.contact || ''],
        [t('profile.employees'), p.business.employees || '']]);
    }

    /* Assumptions */
    if (include('assumptions')) {
      const aiRows = [[t('reports.assumptions'), t('auto'), t('manual'), t('active')]];
      Model.ASSUMPTION_DEFS.forEach((d) => {
        const a = p.assumptions[d.key];
        aiRows.push([t('assumptions.' + d.key), P(a.auto), (a.mode === 'manual' ? P(Number(a.manual)) : ''), P(a.active)]);
      });
      SHEET(t('reports.assumptions'), aiRows);
    }

    const build = (label, arr, moneyRow) => {
      const r = [label];
      for (let y = 1; y <= N; y++) r.push(moneyRow ? P(arr[y]) : arr[y]);
      return r;
    };

    /* CAPEX */
    if (include('capex')) {
      const rc = [[t('capex.asset_name'), t('capex.category'), t('capex.qty'), t('capex.unit_cost'), t('capex.total_cost'), t('capex.useful_life')]];
      p.capex.items.forEach((it) => rc.push([escC(it.name), t('capex.categories.' + it.category), P(it.qty), P(it.unitCost), P(it.totalCost), P(it.usefulLife)]));
      rc.push(['', '', '', t('capex.total_capex'), P(F.capex.total)]);
      SHEET(t('reports.capex'), rc);
    }

    /* Revenue / COGS / Expenses */
    if (include('revenue')) {
      SHEET(t('reports.revenue'), [
        [t('pl.revenue')].concat(years),
        build(t('pl.revenue'), F.revenue.annual, true)
      ]);
    }

    if (include('cogs')) SHEET(t('reports.cogs'), [
      [t('pl.cogs')].concat(years),
      build(t('pl.cogs'), F.cogs.annual, true),
      build(t('pl.gross_profit'), F.grossProfit, true),
      build(t('pl.gm') + ' %', F.grossMargin, false)
    ]);

    if (include('expenses')) {
      const rows = [[t('reports.expenses')].concat(years)];
      F.opex.categories.forEach((c) => rows.push(build(c.label, c.annual, true)));
      rows.push(build(t('pl.opex') + ' (' + t('total') + ')', F.opex.annual, true));
      SHEET(t('reports.expenses'), rows);
    }

    /* P&L */
    if (include('pl')) {
      const rows = [[''].concat(years)];
      const add = (lbl, arr, money) => rows.push(build(lbl, arr, money));
      add(t('pl.revenue'), F.pl.revenue, true);
      add('(−) ' + t('pl.cogs'), F.pl.cogs, true);
      add(t('pl.gross_profit'), F.pl.grossProfit, true);
      add('(−) ' + t('pl.opex'), F.pl.opex, true);
      add(t('pl.ebitda'), F.pl.ebitda, true);
      add('(−) ' + t('pl.depreciation'), F.pl.dep, true);
      add(t('pl.ebit'), F.pl.ebit, true);
      add('(−) ' + t('pl.financing_cost'), F.pl.financingCost, true);
      add(t('pl.pbt'), F.pl.pbt, true);
      add('(−) ' + t('pl.tax'), F.pl.tax, true);
      add('= ' + t('pl.net_profit'), F.pl.netProfit, true);
      SHEET(t('reports.pl'), rows);
    }

    /* Cash flow */
    if (include('cashflow')) {
      const rows = [[''].concat(years)];
      rows.push(build(t('cashflow.operating'), F.cf.operating, true));
      rows.push(build(t('cashflow.investing'), F.cf.investing, true));
      rows.push(build(t('cashflow.financing'), F.cf.financing, true));
      rows.push(build(t('cashflow.net'), F.cf.net, true));
      rows.push(build(t('cashflow.opening'), F.cf.opening, true));
      rows.push(build(t('cashflow.closing'), F.cf.closing, true));
      SHEET(t('reports.cashflow'), rows);
    }

    /* Working capital */
    if (include('wc')) {
      const rows = [[''].concat(years)];
      rows.push(build(t('wc.ar'), F.wc.ar, true));
      rows.push(build(t('wc.inventory'), F.wc.inv, true));
      rows.push(build(t('wc.ap'), F.wc.ap, true));
      rows.push(build(t('wc.wc_req'), F.wc.end, true));
      SHEET(t('reports.wc'), rows);
    }

    /* Financing */
    if (include('financing')) {
      if (p.financialMode === 'KONVENSIONAL') {
        const rows = [[t('financing.structure'), t('financing.loan_amount'), t('financing.interest_rate') + ' %', t('financing.tenure'), t('financing.total') + ' ' + t('financing.interest'), t('financing.outstanding') + ' (Y' + N + ')']];
        F.financing.conventional.loans.forEach((l, i) => {
          const sch = F.financing.conventional.schedules[i];
          rows.push([(l.name || t('financing.' + l.structure)), P(l.amount), P(l.rate), P(l.tenureYears), P(sch ? sch.totalInterest : 0), P(sch ? sch.annual[N] ? sch.annual[N].balance : sch.balance : 0)]);
        });
        SHEET(t('reports.financing'), rows);
      } else {
        // Syariah financing is emitted in the mode-specific block below.
      }
    }

    /* Depreciation */
    if (include('depreciation')) {
      const rows = [[''].concat(years)];
      rows.push(build(t('pl.depreciation'), F.capex.depSchedule.annualByYear, true));
      F.capex.depSchedule.det.forEach((d) => rows.push([d.item.name].concat(d.schedule.slice(0, N).map((s) => P(s.dep)))));
      SHEET(t('reports.depreciation'), rows);
    }

    /* Break-even */
    if (include('breakeven')) SHEET(t('reports.breakeven'), [
      [t('analysis.fixed_cost'), P(F.invest.breakeven.fixedCost)],
      [t('analysis.variable_cost'), P(F.invest.breakeven.variableCost)],
      [t('analysis.selling_price'), P(F.invest.breakeven.pricePerUnit)],
      [t('analysis.be_units'), F.invest.breakeven.beUnits == null ? t('not_calculable') : P(F.invest.breakeven.beUnits)],
      [t('analysis.be_revenue'), F.invest.breakeven.beRevenue == null ? t('not_calculable') : P(F.invest.breakeven.beRevenue)]
    ]);

    /* ROI NPV IRR Payback */
    if (include('roi')) SHEET(t('reports.roi'), [
      [t('analysis.investment'), P(F.invest.totalInvestment)],
      [t('analysis.return'), P(F.invest.sumFCF)],
      [t('analysis.net_return'), P(F.invest.netReturn)],
      ['ROI %', P(F.invest.roiTotal)]
    ]);
    if (include('npv')) {
      const rows = [[t('year'), t('analysis.investment'), 'PV']];
      rows.push([t('year') + ' 0', P(-F.invest.totalInvestment)]);
      F.pvSeries.forEach((s) => rows.push([t('year') + ' ' + s.y, P(s.fcf), P(s.pv)]));
      rows.push(['', t('dashboard.npv'), P(F.invest.npv)]);
      SHEET(t('reports.npv'), rows);
    }
    if (include('irr')) SHEET(t('reports.irr'), [
      [t('dashboard.irr'), F.invest.irr == null ? t('not_calculable') : P(F.invest.irr * 100)]
    ]);
    if (include('payback')) {
      const rows = [[t('year'), t('analysis.annual_cf'), t('analysis.cumulative_cf')]];
      F.invest.payback.cumulative.forEach((c) => rows.push([t('year') + ' ' + c.y, P(c.fcf), P(c.cumulative)]));
      SHEET(t('reports.payback'), rows);
    }

    /* Scenarios */
    if (include('scenarios')) {
      const rows = [[t('reports.scenarios'), t('dashboard.npv'), 'IRR %', t('dashboard.roi') + ' %', t('scenarios.net_profit'), t('scenarios.be_units')]];
      Model.scenarioTable(p).forEach((s) => rows.push([
        t('analysis.' + s.id), P(s.metric.npv), s.metric.irr == null ? t('not_calculable') : P(s.metric.irr * 100), P(s.metric.roi), P(s.metric.netProfitY5), s.metric.beUnits == null ? t('not_calculable') : P(s.metric.beUnits)
      ]));
      SHEET(t('reports.scenarios'), rows);
    }

    /* Sensitivity */
    if (include('sensitivity')) {
      const rows = [[t('reports.sensitivity'), t('dashboard.npv'), 'IRR %', t('dashboard.roi') + ' %']];
      const ST = Model.sensitivityTable(p, p.sensitivity.mults || { touch: 1.2 });
      rows.push([t('analysis.base'), P(ST.base.npv), ST.base.irr == null ? t('not_calculable') : P(ST.base.irr * 100), P(ST.base.roi)]);
      ST.up.forEach((u) => rows.push(['+' + ((p.sensitivity.mults.touch - 1) * 100) + '% ' + u.key, P(u.metric.npv), u.metric.irr == null ? t('not_calculable') : P(u.metric.irr * 100), P(u.metric.roi)]));
      SHEET(t('reports.sensitivity'), rows);
    }

    /* Ratios */
    if (include('ratios')) {
      const R = F.ratios;
      SHEET(t('reports.ratios'), [
        [t('ratios.gross_margin'), P(R.grossMargin)],
        [t('ratios.ebitda_margin'), P(R.ebitdaMargin)],
        [t('ratios.net_margin'), P(R.netMargin)],
        [t('ratios.roa'), P(R.roa)],
        [t('ratios.roe'), R.roe == null ? t('not_calculable') : P(R.roe)],
        [t('ratios.current_ratio'), P(R.currentRatio)],
        [t('ratios.quick_ratio'), P(R.quickRatio)],
        [t('ratios.dte'), R.debtToEquity == null ? t('not_calculable') : P(R.debtToEquity)],
        [t('ratios.debt_ratio'), P(R.debtRatio)],
        [t('ratios.asset_turnover'), P(R.assetTurnover)],
        [t('ratios.recv_days'), P(R.receivableDays)],
        [t('ratios.inv_days'), P(R.inventoryDays)],
        [t('ratios.pay_days'), P(R.payableDays)]
      ]);
    }

    /* Budget vs actual */
    if (include('budget')) {
      const b = p.budget || {}, a = b.actual || {};
      const rows = [[t('budget.title'), t('budget.budget'), t('budget.actual'), t('budget.variance')]];
      const line = (lbl, budV, actV) => {
        const vb = Number(budV) || 0, va = Number(actV) || 0;
        rows.push([lbl, P(budV), P(actV), P(va - vb)]);
      };
      line(t('pl.revenue'), F.revenue.annual[1], a.revenue);
      line(t('pl.cogs'), F.cogs.annual[1], a.cogs);
      line(t('pl.opex'), F.opex.annual[1], a.opex);
      line(t('reports.capex'), F.capex.total, a.capex);
      SHEET(t('reports.budget'), rows);
    }

    /* Financial summary */
    if (include('summary')) SHEET(t('reports.summary'), [
      [t('dashboard.total_investment'), P(F.invest.totalInvestment)],
      [t('dashboard.revenue') + ' (Y5)', P(F.revenue.annual[F.N])],
      [t('dashboard.net_profit') + ' (Y5)', P(F.pl.netProfit[F.N])],
      [t('dashboard.npv'), P(F.invest.npv)],
      [t('dashboard.irr'), F.invest.irr == null ? t('not_calculable') : P(F.invest.irr * 100)],
      [t('dashboard.roi'), P(F.invest.roiTotal)],
      [t('dashboard.payback'), F.invest.payback.paybackYear == null ? t('not_recovered') : F.invest.payback.paybackYear]
    ]);

    /* Syariah sheets */
    if (p.financialMode === 'SYARIAH') {
      if (include('islamic')) {
        const d = F.financing.islamic.detail || {};
        let rows = [[t('financing.islamic_title')]];
        rows.push([t('financing.structure'), t('financing.structures.' + F.financing.islamic.structure)]);
        if (F.financing.islamic.structure === 'murabahah') {
          rows.push([t('murabahah.financed_amount'), P(d.financed)]);
          rows.push([t('murabahah.profit_paid'), P(d.profitTotal)]);
          rows.push([t('murabahah.installment_pm'), P(d.inst)]);
        } else if (F.financing.islamic.structure === 'ijarah') {
          rows.push([t('ijarah.total_rental'), P(d.totalRental)]);
        }
        SHEET(t('reports.islamic'), rows);
      }
      if (include('screening')) {
        const sum = global.Shariah ? Shariah.shariahStatusSummary(p) : null;
        const sc = p.shariah.screening || {};
        SHEET(t('reports.screening'), [
          [t('screening.business_activity'), sc.activity || '—'],
          [t('screening.riba'), sc.riba || '—'],
          [t('screening.gharar'), sc.gharar || '—'],
          [t('screening.maysir'), sc.maysir || '—'],
          ['Status', sum ? t('screening.' + sum.screening.statusLabel) : '—']
        ]);
      }
      if (include('review')) {
        const rv = p.shariah.review || {};
        SHEET(t('reports.review'), [
          [t('review.adviser'), rv.adviser || ''],
          [t('review.review_date'), rv.date || ''],
          [t('review.status'), rv.status ? t('review.' + rv.status) : ''],
          [t('review.notes'), rv.notes || ''],
          [t('review.ref_docs'), rv.refDocs || ''],
          [t('review.contract_docs'), rv.contractDocs || '']
        ]);
      }
    }

    wb.Props = { Title: 'BizFinPro Report', Author: bizName(p) };
    if (opts.save !== false) {
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      if (!FMT.saveFile(out, fileBase(p, 'xlsx') + '.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        downloadBlob(out, fileBase(p, 'xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    }
    return wb;
  }

  function bizName(p) { return (p.business && p.business.businessName) || p.name || 'Project'; }
  function fileBase(p, ext) {
    const name = (bizName(p) || 'Project').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');
    return 'BizFinPro_' + name + '_' + (p.startDate || '').slice(0, 4);
  }

  function downloadBlob(arr, base, mime) {
    const blob = new Blob([arr], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = base + '.' + (mime.includes('pdf') ? 'pdf' : mime.includes('word') ? 'docx' : 'xlsx');
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2500);
  }

  global.ExportXlsx = { exportXlsx, fileBase, bizName, downloadBlob };
})(typeof window !== 'undefined' ? window : globalThis);
