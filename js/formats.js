/* BizFinPro — number / currency / date formatting */
(function (global) {
  'use strict';

  const CUR = {
    'RM / MYR': { code: 'MYR', symbol: 'RM', locale: 'ms-MY', decimals: 2 },
    'USD': { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
    'SGD': { code: 'SGD', symbol: 'S$', locale: 'en-SG', decimals: 2 },
    'EUR': { code: 'EUR', symbol: '€', locale: 'en-IE', decimals: 2 },
    'GBP': { code: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2 },
    'AED': { code: 'AED', symbol: 'AED', locale: 'en-AE', decimals: 2 },
    'SAR': { code: 'SAR', symbol: 'SAR', locale: 'ar-SA', decimals: 2 },
    'IDR': { code: 'IDR', symbol: 'Rp', locale: 'id-ID', decimals: 0 },
    'CNY': { code: 'CNY', symbol: 'CN¥', locale: 'zh-CN', decimals: 2 },
    'JPY': { code: 'JPY', symbol: '¥', locale: 'ja-JP', decimals: 0 },
    'AUD': { code: 'AUD', symbol: 'A$', locale: 'en-AU', decimals: 2 },
    'Custom': { code: 'CUSTOM', symbol: '', locale: 'en-US', decimals: 2 }
  };
  const CUR_KEYS = Object.keys(CUR);

  const nfCache = {};
  function numFmt(currencyKey, decimalsOverride) {
    const spec = CUR[currencyKey] || CUR['Custom'];
    const key = spec.code + ':' + (decimalsOverride == null ? spec.decimals : decimalsOverride);
    if (!nfCache[key]) {
      try {
        nfCache[key] = new Intl.NumberFormat('en-US', { minimumFractionDigits: spec.decimals, maximumFractionDigits: spec.decimals });
      } catch (e) {
        nfCache[key] = { format: (n) => String(n) };
      }
    }
    return nfCache[key];
  }

  function money(v, currencyKey, opts) {
    opts = opts || {};
    const spec = CUR[currencyKey] || CUR['Custom'];
    const n = Number(v) || 0;
    const neg = n < 0;
    const abs = Math.abs(n);
    const d = opts.decimals != null ? opts.decimals : spec.decimals;
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const sym = opts.symbol || spec.symbol || '';
    let out = sym ? (sym + formatted) : formatted;
    if (opts.codeOnly) out = spec.code + ' ' + formatted;
    if (neg) out = '(' + out + ')';
    return out;
  }

  function num(v, d) {
    const n = Number(v) || 0;
    if (d == null) return n.toLocaleString('en-US');
    return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function pct(v, d) {
    d = d == null ? 1 : d;
    const n = Number(v) || 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
  }

  function varPct(v, d) {
    d = d == null ? 1 : d;
    const n = Number(v) || 0;
    const s = (n > 0 ? '+' : '') + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
    return s;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const loc = (global.I18N && I18N.lang() === 'ms') ? 'ms-MY' : 'en-GB';
    try { return d.toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }

  function todayISO() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    return new Date(d - off * 60000).toISOString().slice(0, 10);
  }

  function periodMonths(n) {
    const start = document.getElementById ? null : null; // no-op to keep parity
    return n;
  }

  /* Save a file: via native Android bridge when available (APK), else anchor download */
  function saveFile(bytes, filename, mime) {
    try {
      let u8;
      if (bytes instanceof Uint8Array) u8 = bytes;
      else if (bytes instanceof ArrayBuffer) u8 = new Uint8Array(bytes);
      else u8 = new Uint8Array(bytes);
      if (typeof window !== 'undefined' && window.BizFinProNative && typeof window.BizFinProNative.saveFile === 'function') {
        let bin = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < u8.length; i += CHUNK) {
          bin += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + CHUNK, u8.length)));
        }
        window.BizFinProNative.saveFile(filename, mime, btoa(bin));
        return true;
      }
      return false;
    } catch (e) { return false; }
  }

  global.FMT = { CUR, CUR_KEYS, money, num, pct, varPct, fmtDate, todayISO, saveFile };
})(typeof window !== 'undefined' ? window : globalThis);
