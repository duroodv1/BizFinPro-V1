/* BizFinPro — PDF export via jsPDF (A4, page numbers, cover) */
(function (global) {
  'use strict';

  function exportPdf(p, F, opts) {
    opts = opts || {};
    const t = I18N.t;
    const sec = (global.BizReports && BizReports.sectionsFor(p)) || null;
    const include = (key) => !sec || !sec[key] || sec[key].included !== false;
    const { jsPDF } = global.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297, M = 16;
    const cur = p.currency;
    const RM = (v) => FMT.money(v, cur, { decimals: 0 });
    const N = F.N;
    let y = 0, page = 1;

    function newPage() { doc.addPage(); y = M; pageFooter(); }
    function pageFooter() {
      const pn = doc.internal.getNumberOfPages();
      doc.setFontSize(8); doc.setTextColor(150); doc.setFont('helvetica', 'normal');
      doc.text((bizName(p) + ' — ' + p.name).slice(0, 90), M, H - 8);
      doc.text('Page ' + pn + ' of ' + pn, W - M, H - 8, { align: 'right' });
    }
    function ensure(h) { if (y + h > H - 22) newPage(); }
    function title(text, sub) {
      ensure(24);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 40, 70);
      doc.text(text, M, y + 4); y += 9;
      if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120); doc.text(sub, M, y); y += 6; }
      doc.setDrawColor(220); doc.line(M, y, W - M, y); y += 4;
    }
    function para(text, opts2) {
      opts2 = opts2 || {};
      doc.setFont('helvetica', opts2.bold ? 'bold' : 'normal');
      doc.setFontSize(opts2.size || 9.5);
      if (opts2.color === 'syariah') doc.setTextColor(5, 130, 90);
      else if (opts2.color === 'konv') doc.setTextColor(0, 90, 160);
      else doc.setTextColor(opts2.color || 60);
      const lines = doc.splitTextToSize(text || '', W - M * 2);
      lines.forEach((ln) => { ensure(5.2); doc.text(ln, M, y + 4); y += 4.8; });
      y += 1.5;
    }
    function kvTable(pairs) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
      pairs.forEach((pr) => {
        ensure(6);
        doc.setTextColor(120); doc.text(String(pr[0]), M, y + 4);
        doc.setTextColor(30); doc.text(String(pr[1]), W - M, y + 4, { align: 'right' });
        y += 5.6;
      });
    }
    function moneyTable(headers, rows, fmt) {
      ensure(12);
      const colW = (W - 2 * M) / headers.length;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(120);
      doc.setFillColor(245, 248, 250); doc.rect(M, y, W - 2 * M, 6, 'F');
      headers.forEach((h, i) => doc.text(h, M + colW * i + 2, y + 4));
      y += 7;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      rows.forEach((r) => {
        ensure(5.5);
        r.forEach((c, i) => {
          doc.setTextColor(i === 0 ? 55 : 25);
          const val = typeof c === 'number' ? (fmt ? fmt(c) : String(c)) : String(c == null ? '—' : c);
          if (i === 0) doc.text(val, M + colW * i + 2, y + 4);
          else doc.text(val, M + colW * i + colW - 2, y + 4, { align: 'right' });
        });
        y += 5;
        if (r.__line) { doc.setDrawColor(230); doc.line(M, y, W - M, y); }
      });
      y += 3;
    }

    /* -- COVER -- */
    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(14, 165, 233); doc.rect(0, 0, W, 6, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
    doc.text('BizFinPro', M, 90);
    doc.setTextColor(125, 211, 252); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.text(t('app.tagline'), M, 104);
    doc.setDrawColor(60); doc.line(M, 116, W - M, 116);
    doc.setTextColor(230); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text(p.name || '', M, 136);
    doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(190);
    doc.text(bizName(p) || '', M, 146);
    doc.setFontSize(9.5); doc.setTextColor(150);
    doc.text(t('common.mode') + ': ' + p.financialMode, M, 158);
    doc.text(t('common.period') + ': ' + N + ' ' + t('year') + '  ·  ' + p.currency, M, 164);
    doc.text(t('reports.title') + ': ' + FMT.fmtDate(new Date().toISOString()), M, 170);
    const badge = p.financialMode === 'SYARIAH' ? { c: [16, 185, 129], s: 'green' } : { c: [14, 165, 233], s: 'blue' };
    doc.setFillColor.apply(doc, badge.c.map(Math.round)); doc.roundedRect(M, 182, 53, 9, 4.5, 4.5, 'F');
    doc.setTextColor(255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(t('mode.indicator') + ': ' + p.financialMode, M + 5, 188);
    y = M; doc.addPage(); pageFooter();

    /* -- Executive summary -- */
    title(t('reports.exec_summary'));
    kvTable([
      [t('dashboard.total_investment'), RM(F.invest.totalInvestment)],
      [t('reports.revenue') + ' Y1 → Y' + N, RM(F.revenue.annual[1]) + ' → ' + RM(F.revenue.annual[N])],
      [t('dashboard.net_profit') + ' (Y' + N + ')', RM(F.pl.netProfit[N])],
      [t('dashboard.roi'), FMT.pct(F.invest.roiTotal, 1)],
      [t('dashboard.npv'), RM(F.invest.npv)],
      [t('dashboard.irr'), F.invest.irr == null ? t('not_calculable') : FMT.pct(F.invest.irr * 100, 2)],
      [t('dashboard.payback'), F.invest.payback.paybackYear == null ? t('not_recovered') : F.invest.payback.paybackPeriod.toFixed(2) + ' ' + t('year')]
    ]);

    if (include('profile')) {
      title(t('reports.profile'));
      kvTable([
        [t('profile.business_name'), bizName(p)],
        [t('profile.reg_no'), p.business.regNo || '—'],
        [t('profile.industry'), p.business.industry || '—'],
        [t('profile.owner'), p.business.owner || '—']
      ]);
    }

    if (include('mode')) {
      title(t('reports.mode'));
      para(p.financialMode, { bold: true, size: 11, color: p.financialMode === 'SYARIAH' ? 'syariah' : 'konv' });
    }

    const yearHeads = ['']; for (let e = 1; e <= N; e++) yearHeads.push('Y' + e);

    if (include('capex')) {
      title(t('reports.capex'));
      const cRows = p.capex.items.filter((it) => Number(it.totalCost) > 0)
        .map((it) => [it.name, t('capex.categories.' + it.category), Math.round(Number(it.totalCost))]);
      const totalRow = [t('capex.total_capex'), '', Math.round(F.capex.total)];
      totalRow.__line = true;
      cRows.push(totalRow);
      moneyTable([t('capex.asset_name'), t('capex.category'), t('capex.total_cost')], cRows);
    }

    if (include('pl') || include('revenue') || include('cogs') || include('expenses')) {
      // combine into income statement summary
      const rows = [
        buildRow(t('pl.revenue'), F.pl.revenue), buildRow('COGS', F.pl.cogs), buildRow(t('pl.gross_profit'), F.pl.grossProfit),
        buildRow(t('pl.opex'), F.pl.opex), buildRow(t('pl.ebitda'), F.pl.ebitda), buildRow(t('pl.depreciation'), F.pl.dep),
        buildRow(t('pl.ebit'), F.pl.ebit), buildRow(t('pl.financing_cost'), F.pl.financingCost), buildRow(t('pl.pbt'), F.pl.pbt),
        buildRow(t('pl.tax'), F.pl.tax), buildRow(t('pl.net_profit'), F.pl.netProfit)
      ];
      rows[rows.length - 1].bold = true;
      title(t('reports.pl'), t('reports.pl'));
      moneyTable(yearHeads, rows);
    }

    if (include('cashflow')) {
      title(t('reports.cashflow'));
      const rows = [
        buildRow(t('cashflow.operating'), F.cf.operating), buildRow(t('cashflow.investing'), F.cf.investing), buildRow(t('cashflow.financing'), F.cf.financing),
        buildRow(t('cashflow.net'), F.cf.net), buildRow(t('cashflow.opening'), F.cf.opening), buildRow(t('cashflow.closing'), F.cf.closing)
      ];
      rows[rows.length - 1].bold = true;
      moneyTable(yearHeads, rows);
    }

    if (include('acc')) {
      const A = F.acc, Is = A.is, Bs = A.bs, Cf = A.cf;
      // Income Statement
      title(t('reports.acc') + ' — ' + t('acc.tab_is'));
      const isRows = [
        buildRow(t('acc.is_revenue'), Is.revenue),
        buildRow('(−) ' + t('acc.is_var_cogs'), Is.variy),
        buildRow('(−) ' + t('acc.is_fixed_cogs'), Is.fixedCogs),
        buildRow(t('acc.is_gross_profit'), Is.grossProfit),
        buildRow('(−) ' + t('acc.is_var_overhead'), Is.variableOpex),
        buildRow('(−) ' + t('acc.is_fixed_overhead'), Is.fixedOpex),
        buildRow(t('acc.is_ebitda'), Is.ebitda),
        buildRow('(−) ' + t('acc.is_da'), Is.dep),
        buildRow(t('acc.is_ebit'), Is.ebit),
        buildRow('(−) ' + t('pl.financing_cost'), Is.interest),
        buildRow(t('pl.pbt'), F.pl.pbt),
        buildRow('(−) ' + t('acc.is_tax'), Is.tax),
        buildRow(t('acc.is_net_income'), Is.netIncome)
      ];
      isRows[isRows.length - 1].__line = true;
      moneyTable(yearHeads, isRows);

      // Balance Sheet (snapshot at final year)
      title(t('acc.tab_bs'), t('year') + ' ' + N);
      const yN = N;
      const totalCur = Bs.cash[yN] + Bs.ar[yN] + Bs.inv[yN] + (Bs.prepaid[yN] || 0);
      const fixedNet = Bs.fixedNet[yN] || 0;
      const totalAssets = totalCur + fixedNet;
      const totCurLiab = Bs.ap[yN] + (Bs.taxPayable[yN] || 0);
      const totLiab = totCurLiab + (Bs.debt[yN] || 0);
      const totEq = Bs.contributedCapital + Bs.retainedEarnings[yN];
      const bsRows = [
        ([t('acc.bs_cash'), Bs.cash[yN]]),
        ([t('acc.bs_ar'), Bs.ar[yN]]),
        ([t('acc.bs_inventory'), Bs.inv[yN]]),
        ([t('acc.bs_prepaid'), Bs.prepaid[yN] || 0]),
        ([t('acc.bs_total_current'), totalCur]),
        ([t('acc.bs_fixed_assets'), fixedNet]),
        ([t('acc.bs_total_assets'), totalAssets]),
        ([t('acc.bs_ap'), Bs.ap[yN]]),
        ([t('acc.bs_tax_payable'), Bs.taxPayable[yN] || 0]),
        ([t('acc.bs_total_current_liab'), totCurLiab]),
        ([t('acc.bs_lt_debt'), Bs.debt[yN] || 0]),
        ([t('acc.bs_total_liab'), totLiab]),
        ([t('acc.bs_contributed'), Bs.contributedCapital]),
        ([t('acc.bs_re'), Bs.retainedEarnings[yN]]),
        ([t('acc.bs_total_equity'), totEq]),
        ([t('acc.bs_tlse'), totLiab + totEq])
      ];
      moneyTable(['', t('year') + ' ' + N], bsRows.map((r) => [r[0], Math.round(r[1])]));
      para(t('acc.bs_balance_ok') + (Math.abs(totalAssets - (totLiab + totEq)) < 1 ? ' ✓' : ' ✗'), { bold: true, size: 8.5 });

      // Cash Flow Statement (indirect)
      title(t('acc.tab_cf'));
      const cfRows = [
        buildRow(t('acc.cf_net_income'), Cf.netIncome),
        buildRow(t('acc.cf_da'), Cf.dep),
        buildRow(t('acc.cf_d_ar'), Cf.dAr),
        buildRow(t('acc.cf_d_inv'), Cf.dInv),
        buildRow(t('acc.cf_d_ap'), Cf.dAp),
        buildRow(t('acc.cf_d_tax'), Cf.dTax),
        buildRow(t('acc.cf_net_operating'), Cf.operating),
        buildRow(t('acc.cf_capex'), Cf.capexOut),
        buildRow(t('acc.cf_net_investing'), Cf.investing),
        buildRow(t('acc.cf_debt_pay'), Cf.debtRepay),
        buildRow(t('acc.cf_net_financing'), Cf.financing),
        buildRow(t('acc.cf_end_cash'), Cf.closing)
      ];
      cfRows[cfRows.length - 1].__line = true;
      moneyTable(yearHeads, cfRows);
    }

    if (include('analytics') && F.revenue.detail && F.revenue.detail.length) {
      title(t('reports.analytics'));
      const contribRatio = 1 - ((F.cogs.materialPct || 0) / 100);
      const bandLabels = ['0%', '1–10%', '11–25%', '26%+'];
      const bandOf = (d) => (d == null || d <= 0) ? 0 : (d <= 10 ? 1 : (d <= 25 ? 2 : 3));
      const aRows = F.revenue.detail.map((s) => [s.name, bandLabels[bandOf(s.discountPct)], RM(s.annual[1]), RM(s.annual[N])]);
      moneyTable([t('analytics.product'), t('analytics.band'), t('analytics.revenue') + ' Y1', t('analytics.revenue') + ' Y' + N], aRows);
    }

    if (include('financing')) {
      title(t('reports.financing'));
      if (p.financialMode === 'SYARIAH') {
        const d = F.financing.islamic.detail || {};
        para(t('financing.structure') + ': ' + t('financing.structures.' + F.financing.islamic.structure), { bold: true });
        kvTable([
          [t('dashboard.total_investment'), RM(F.financing.injected0)],
          [t('murabahah.profit_paid'), RM(d.profitTotal || 0)]
        ]);
      } else {
        F.financing.conventional.loans.forEach((l, i) => {
          const sch = F.financing.conventional.schedules[i];
          kvTable([
            [l.name || t('financing.' + l.structure), RM(l.amount)],
            [t('financing.interest_rate'), FMT.pct(l.rate, 2)],
            [t('financing.tenure'), l.tenureYears + ' ' + t('year')],
            [t('financing.interest') + ' (' + t('total') + ')', RM(sch ? sch.totalInterest : 0)]
          ]);
        });
      }
    }

    if (include('breakeven') || include('roi') || include('npv') || include('irr') || include('payback') || include('ratios')) {
      title(t('nav.analysis'));
      const kvs = [];
      if (include('breakeven')) kvs.push([t('analysis.be_units'), F.invest.breakeven.beUnits == null ? t('not_calculable') : Math.round(F.invest.breakeven.beUnits)]);
      if (include('breakeven')) kvs.push([t('analysis.be_revenue'), F.invest.breakeven.beRevenue == null ? t('not_calculable') : RM(F.invest.breakeven.beRevenue)]);
      if (include('roi')) kvs.push([t('dashboard.roi'), FMT.pct(F.invest.roiTotal, 1)]);
      if (include('npv')) kvs.push([t('dashboard.npv'), RM(F.invest.npv)]);
      if (include('irr')) kvs.push([t('dashboard.irr'), F.invest.irr == null ? t('not_calculable') : FMT.pct(F.invest.irr * 100, 2)]);
      if (include('payback')) kvs.push([t('dashboard.payback'), F.invest.payback.paybackYear == null ? t('not_recovered') : F.invest.payback.paybackPeriod.toFixed(2) + ' ' + t('year')]);
      kvTable(kvs);
    }

    if (include('syariah-disclaimer') || (p.financialMode === 'SYARIAH' && include('disclaimer'))) {
      title(t('reports.disclaimer'));
      para(t('screening.disclaimer'), { color: 120 });
    }

    if (p.financialMode === 'SYARIAH' && include('screening')) {
      title(t('reports.screening'));
      const sc = p.shariah.screening || {};
      kvTable([
        [t('screening.business_activity'), sc.activity || '—'],
        [t('screening.riba'), sc.riba || '—'],
        [t('screening.gharar'), sc.gharar || '—'],
        [t('screening.maysir'), sc.maysir || '—']
      ]);
    }

    function buildRow(label, arr) {
      return [label].concat(Array.from({ length: N }, (_, i) => Math.round(arr[i + 1])));
    }

    const out = doc.output('arraybuffer');
    if (!FMT.saveFile(out, ExportXlsx.fileBase(p, 'pdf') + '.pdf', 'application/pdf')) {
      ExportXlsx.downloadBlob(out, ExportXlsx.fileBase(p, 'pdf'), 'application/pdf');
    }
    return doc;
  }

  function bizName(p) { return (p.business && p.business.businessName) || p.name || 'Project'; }

  global.ExportPdf = { exportPdf, bizName };
})(typeof window !== 'undefined' ? window : globalThis);
