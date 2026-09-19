/* BizFinPro — Shariah screening engine, statuses & disclaimer */
(function (global) {
  'use strict';
  const ICON = {
    ok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.6 2.6L16 9.5"/></svg>',
    warn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  };

  /* Statuses: SCREENED | REQUIRES REVIEW | POTENTIAL ISSUE | NOT SCREENED */
  function screenScreening(sc) {
    sc = sc || {};
    const activity = sc.activity, riba = sc.riba, gharar = sc.gharar, maysir = sc.maysir;
    const anyAnswered = [activity, riba, gharar, maysir].some((v) => v === 'yes' || v === 'no' || v === 'unsure');
    const parts = [];
    const flags = [];

    if (!anyAnswered) return { status:'NOT_SCREENED', statusLabel:'not_screened', tone:'gray', parts:[], flags:[], notScreened:true };

    // business activity
    parts.push({ key:'business_activity', q:sc.activity, status: activity === 'no' ? 'SCREENED' : activity === 'unsure' ? 'REQUIRES_REVIEW' : 'POTENTIAL_ISSUE', label:'business_activity' });
    if (activity === 'yes') flags.push({ k:'unscreened', sev:'bad', txt:'unscreened' });
    if (activity === 'unsure') flags.push({ k:'unscreened', sev:'warn', txt:'unscreened' });

    parts.push({ key:'riba', q:sc.riba, status: riba === 'no' ? 'SCREENED' : riba === 'unsure' ? 'REQUIRES_REVIEW' : (riba === 'yes' ? 'POTENTIAL_ISSUE' : 'NOT_SCREENED'), label:'riba' });
    if (riba === 'yes') flags.push({ k:'riba', sev:'bad', txt:'riba' });
    if (riba === 'unsure') flags.push({ k:'riba', sev:'warn', txt:'riba' });

    parts.push({ key:'gharar', q:sc.gharar, status: gharar === 'no' ? 'SCREENED' : gharar === 'unsure' ? 'REQUIRES_REVIEW' : (gharar === 'yes' ? 'POTENTIAL_ISSUE' : 'NOT_SCREENED'), label:'gharar' });
    if (gharar === 'yes') flags.push({ k:'gharar', sev:'bad', txt:'gharar' });
    if (gharar === 'unsure') flags.push({ k:'gharar', sev:'warn', txt:'gharar' });

    parts.push({ key:'maysir', q:sc.maysir, status: maysir === 'no' ? 'SCREENED' : maysir === 'unsure' ? 'REQUIRES_REVIEW' : (maysir === 'yes' ? 'POTENTIAL_ISSUE' : 'NOT_SCREENED'), label:'maysir' });
    if (maysir === 'yes') flags.push({ k:'maysir', sev:'bad', txt:'maysir' });
    if (maysir === 'unsure') flags.push({ k:'maysir', sev:'warn', txt:'maysir' });

    // overall
    const hasIssue = parts.some((x) => x.status === 'POTENTIAL_ISSUE');
    const hasReview = parts.some((x) => x.status === 'REQUIRES_REVIEW');
    let overall;
    if (hasIssue) overall = { status:'POTENTIAL_ISSUE', statusLabel:'potential_issue', tone:'rose' };
    else if (hasReview) overall = { status:'REQUIRES_REVIEW', statusLabel:'requires_review', tone:'gold' };
    else overall = { status:'SCREENED', statusLabel:'screened', tone:'teal' };

    // financial structure check
    let finStr = null;
    const structure = (sc.contractDocs || sc.structure || '').toString();
    if (structure.trim()) {
      finStr = { label:'fin_structure', note: structure };
    }

    return Object.assign(overall, { parts, flags, notScreened:false, finStr });
  }

  function screenReview(rev) {
    rev = rev || {};
    if (!rev.adviser && !rev.date && !rev.status && !rev.notes) {
      return { status:'PENDING', statusLabel:'pending', tone:'gray' };
    }
    const s = rev.status || '';
    if (s === 'approved') return { status:'APPROVED', statusLabel:'approved', tone:'teal' };
    if (s === 'referred') return { status:'REFERRED', statusLabel:'referred', tone:'rose' };
    if (s === 'in_progress') return { status:'IN_PROGRESS', statusLabel:'in_progress', tone:'gold' };
    return { status:'PENDING', statusLabel:'pending', tone:'gray' };
  }

  function statusChip(status, statusLabel, t) {
    const label = t ? t('screening.' + statusLabel) : statusLabel;
    const tone = { SCREENED:'teal', REQUIRES_REVIEW:'gold', POTENTIAL_ISSUE:'rose', NOT_SCREENED:'gray', APPROVED:'teal', REFERRED:'rose', IN_PROGRESS:'gold', PENDING:'gray' }[status] || 'gray';
    return { label, tone, status };
  }

  function shariahStatusSummary(p) {
    const t = (global.I18N ? I18N.t : (x) => x);
    const screening = screenScreening(p.shariah && p.shariah.screening);
    const review = screenReview(p.shariah && p.shariah.review);
    const parts = [];

    const toneMap = { teal:'chip teal', gold:'chip gold', rose:'chip rose', gray:'chip gray' };
    const screenings = statusChip(screening.status, screening.statusLabel, t);

    let overBadge;
    if (screening.notScreened && review.status === 'PENDING') overBadge = { tone:'gray', label:t('screening.not_screened') };
    else if (review.status === 'APPROVED' && screening.status === 'SCREENED') overBadge = { tone:'teal', label:t('review.approved') };
    else if (screening.status === 'POTENTIAL_ISSUE' || review.status === 'REFERRED') overBadge = { tone:'rose', label:t('screening.requires_review') };
    else if (screening.status === 'REQUIRES_REVIEW' || review.status === 'IN_PROGRESS') overBadge = { tone:'gold', label:t('screening.requires_review') };
    else overBadge = { tone:'teal', label:t('screening.screened') };

    return { screening, review, overBadge, parts };
  }

  global.Shariah = { ICON, screenScreening, screenReview, statusChip, shariahStatusSummary };
})(typeof window !== 'undefined' ? window : globalThis);
