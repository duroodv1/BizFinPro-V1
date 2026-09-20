# BizFinPro V1

**Business Budget • ROI • NPV • IRR • Financial Projection**

An **offline-first PWA** for business financial planning, budgeting and investment analysis — with two global financial modes the user must choose: **KONVENSIONAL** or **SYARIAH**. Only the selected framework's modules are shown.

## What is implemented (real, working)

| Area | Status |
|---|---|
| Project creation with **mandatory financial-mode choice** | ✅ |
| Central assumptions engine (auto/manual, per-assumption override, reset) | ✅ |
| CAPEX (+ depreciation SL/RB schedules) | ✅ |
| Startup costs & initial investment (CAPEX + startup + initial WC) | ✅ |
| Revenue projection (products/services, volume×price or cash, growth, seasonal) | ✅ |
| COGS (% + direct labour/production/other) | ✅ |
| OPEX (12 categories, monthly/annual, growth) | ✅ |
| P&L (EBITDA, EBIT, financing cost, tax, net) | ✅ |
| **Accounting statements (ACC)** — Income Statement with Variable/Fixed COGS & overhead, **Balance Sheet** (balanced: Assets = Liabilities + Equity), full indirect **Cash Flow Statement** (changes in AR/INV/prepaid/AP/taxes payable; operating/investing/financing) — **interlocked** (Net Income → Retained Earnings & operating cash flow; closing cash ties out) | ✅ |
| Cash flow (operating/investing/financing, depreciation NOT a cash outflow) | ✅ |
| **Analytics dashboard** — monthly sales trend, sales & profit by product, sales vs COGS, discount-band analysis, product-wise profit contribution, interactive year/product/band/month slicers, KPI cards with trend indicators | ✅ |
| Revenue discounts (%) per product stream | ✅ |
| Working capital (AR/INV/AP from days) | ✅ |
| Conventional financing (loan amortization, principal vs interest separated) | ✅ |
| Islamic financing: Murabahah, Ijarah, Musharakah, Mudarabah, Istisna', Salam | ✅ |
| Shariah screening (activity/riba/gharar/maysir) + REVIEW/NOT-SCREENED statuses | ✅ |
| Shariah review records + disclaimer | ✅ |
| Break-even, ROI (transparent formula), NPV, IRR (Newton/bisection), payback | ✅ |
| Scenario + sensitivity analysis (tables & charts) | ✅ |
| Financial ratios (profitability, liquidity, leverage, efficiency) | ✅ |
| Dashboard with live charts & financial alerts | ✅ |
| Budget vs actual (variance) | ✅ |
| Reports: **Excel (.xlsx)**, **PDF**, **Word (.docx)** | ✅ |
| IndexedDB storage + JSON backup/restore + Service Worker PWA | ✅ |
| Offline-first (no network needed; all 3 export libraries vendored locally) | ✅ |
| Bahasa Melayu (default) / English | ✅ |
| Mode switching (Settings) with confirmation, no data loss | ✅ |
| Demo projects: Demo — Konvensional & Demo — Syariah | ✅ |

## Honest scope notes

The request opened as "build a *real* **Android Parental Control** app" then specified a **financial planning** application (BizFinPro) as the deliverable, with a PWA/HTML5/IndexedDB/Service-Worker architecture. I built **BizFinPro** exactly to that spec. A native Android APK with system-level Device Management APIs (Device Owner / `DevicePolicyManager`) is a separate platform build that requires an Android toolchain and cannot be produced or meaningfully run from this web workspace — I did not fake it. If you want, I can next scaffold the Kotlin Android wrapper that loads this app in a WebView with a real DPC template.

## Run it

Open `index.html` over any static server (or double-click; storage falls back to in-memory when IndexedDB is unavailable, e.g. inside a sandboxed `<iframe>` preview):

```
cd bizfinpro && python3 -m http.server 8080
```

Then open `http://localhost:8080`. Create **Demo — Konvensional** and **Demo — Syariah** from Settings to see both modes.

## Stack

Pure HTML5 + CSS3 + vanilla JS. Local vendored libraries: SheetJS (xlsx), jsPDF (pdf), and a dependency-free STORE-mode ZIP writer (docx/OOXML). No build step, no CDN, no network.
