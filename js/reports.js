/* BizFinPro — report sections config (shared by preview + exporters) */
(function (global) {
  'use strict';
  // Section ids in report order (mode-filtered)
  const ORDER = [
    'cover','exec_summary','profile','mode','assumptions','investment','capex','revenue','cogs','expenses',
    'pl','cashflow','wc','financing','depreciation','breakeven','roi','npv','irr','payback',
    'scenarios','sensitivity','ratios','budget','summary'
  ];
  const SYARIAH_EXTRA = ['islamic','screening','review','status','disclaimer'];

  function defaultSections(p) {
    const s = {};
    (ORDER.concat(SYARIAH_EXTRA)).forEach((id) => { s[id] = { included: true }; });
    if (p.financialMode !== 'SYARIAH') SYARIAH_EXTRA.forEach((id) => { s[id].included = false; });
    else s.islamic.included = true;
    return s;
  }

  function sectionsFor(p) {
    return p.reportSections || defaultSections(p);
  }

  function visibleSections(p) {
    const s = sectionsFor(p);
    const ids = ORDER.slice();
    if (p.financialMode === 'SYARIAH') {
      // insert islamic financing after financing, screening/review/status/disclaimer at end
      const fi = ids.indexOf('financing') + 1;
      ids.splice(fi, 0, 'islamic');
      ids.push('screening', 'review', 'status', 'disclaimer');
    }
    return ids.filter((id) => s[id] && s[id].included);
  }

  global.BizReports = { ORDER, SYARIAH_EXTRA, defaultSections, sectionsFor, visibleSections };
})(typeof window !== 'undefined' ? window : globalThis);
