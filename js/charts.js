/* BizFinPro — dependency-free SVG charts */
(function (global) {
  'use strict';
  const PALETTE = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#e11d48', '#06b6d4', '#84cc16', '#f97316'];
  const GRID = '#e8eef6', INK = '#64748b', INK_DARK = '#0f172a';

  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) { el.setAttribute(k, attrs[k]); }
    return el;
  }

  function valFormat(v, cur) {
    // compact currency
    const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    return Math.round(v).toString();
  }

  function axisY(parent, x, top, height, ymin, ymax, fmt) {
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = ymin + (ymax - ymin) * (i / ticks);
      const y = top + height - (height * (i / ticks));
      const line = svgEl('line', { x1: x, y1: y, x2: x + 9999, y2: y, stroke: GRID, 'stroke-width': 1, 'pointer-events': 'none' });
      parent.appendChild(line);
      const lbl = svgEl('text', { x: x - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 10.5, fill: INK, 'font-family': 'inherit' });
      lbl.textContent = fmt ? fmt(val) : valFormat(val);
      parent.appendChild(lbl);
    }
  }

  function axisX(parent, x, top, height, labels, isDark) {
    const n = labels.length;
    const each = 972 / Math.max(1, n);
    labels.forEach((lb, i) => {
      const cx = x + each * (i + 0.5);
      const lbl = svgEl('text', { x: cx, y: top + height + 18, 'text-anchor': 'middle', 'font-size': 10.5, fill: INK, 'font-family': 'inherit' });
      lbl.textContent = lb;
      parent.appendChild(lbl);
    });
  }

  function tooltip(parent, box) {
    const t = svgEl('g', { style: 'opacity:0;pointer-events:none' });
    const r = svgEl('rect', { rx: 7, ry: 7, fill: '#0b1220', opacity: 0.95, width: 10, height: 40, x: 0, y: 0 });
    const txt = svgEl('text', { fill: '#fff', 'font-size': 11.5, x: 9, y: 17, 'font-family': 'inherit' });
    const txt2 = svgEl('text', { fill: '#7dd3fc', 'font-size': 11.5, 'font-weight': 700, x: 9, y: 33, 'font-family': 'inherit' });
    t.appendChild(r); t.appendChild(txt); t.appendChild(txt2);
    parent.appendChild(t);
    return { g: t, r, txt, txt2, show(x, y, a, b) {
      txt.textContent = a; txt2.textContent = b;
      const w = Math.max(txt.getComputedTextLength(), txt2.getComputedTextLength()) + 20;
      r.setAttribute('width', w);
      let px = x + 14, py = y - 34;
      if (px + w > box.w) px = x - w - 14;
      if (py < 0) py = y + 14;
      t.setAttribute('transform', 'translate(' + px + ',' + py + ')');
      t.setAttribute('style', 'opacity:1');
    }, hide() { t.setAttribute('style', 'opacity:0'); } };
  }

  function frame(container, title, height) {
    const W = 1000, H = height;
    const box = { x: 64, y: 16, w: 972 - 64, h: H - 60 };
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%', 'font-family': 'inherit', preserveAspectRatio: 'xMidYMid meet' });
    if (title) {
      const t = svgEl('text', { x: box.x, y: 14, 'font-size': 12, 'font-weight': 700, fill: INK });
      t.textContent = title;
      svg.appendChild(t);
    }
    container.appendChild(svg);
    return { svg, box, W, H };
  }

  function lineChart(container, seriesArr, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const { svg, box, W, H } = frame(container, opts.title, opts.height || 280);
    const labels = opts.labels || [];
    const x = box.x, top = box.y + 8, h = box.h - 20;
    let ymin = Infinity, ymax = -Infinity;
    seriesArr.forEach((s) => s.data.forEach((v) => { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); }));
    if (opts.minZero !== false) ymin = Math.min(ymin, 0);
    if (ymax === ymin) ymax = ymin + 1;
    const range = ymax - ymin;
    let tickFmt = opts.tickFmt || ((v) => valFormat(v));
    axisY(svg, x, top, h, ymin, ymax, tickFmt);
    axisX(svg, x, top, h, labels);
    const n = labels.length || seriesArr[0].data.length;
    const each = (box.w - 60) / Math.max(1, n - 1);
    const sx = (i) => x + 30 + (n === 1 ? (box.w - 60) / 2 : each * i);
    const sy = (v) => top + h - (h * (v - ymin) / range);
    const tip = tooltip(svg, box);
    seriesArr.forEach((s, si) => {
      const color = s.color || PALETTE[si % PALETTE.length];
      let d = '';
      s.data.forEach((v, i) => { d += (i ? 'L' : 'M') + sx(i).toFixed(1) + ',' + sy(v).toFixed(1); });
      const path = svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
      svg.appendChild(path);
      if (opts.area !== false) {
        const area = svgEl('path', { d: d + 'L' + sx(n - 1).toFixed(1) + ',' + (top + h) + 'L' + sx(0).toFixed(1) + ',' + (top + h) + 'Z', fill: color, opacity: 0.09, 'pointer-events': 'none' });
        svg.appendChild(area);
      }
      s.data.forEach((v, i) => {
        const c = svgEl('circle', { cx: sx(i), cy: sy(v), r: 3.4, fill: '#fff', stroke: color, 'stroke-width': 2 });
        c.addEventListener('mousemove', () => tip.show(sx(i), sy(v), labels[i] || '', (s.name ? s.name + ': ' : '') + tickFmt(v)));
        c.addEventListener('mouseleave', () => tip.hide());
        svg.appendChild(c);
      });
    });
    if (opts.legend) {
      seriesArr.forEach((s, si) => {
        const color = s.color || PALETTE[si % PALETTE.length];
        const li = document.createElement('div');
        li.className = 'li';
        li.innerHTML = '<span class="sw" style="background:' + color + '"></span>' + (s.name || '');
        opts.legend.appendChild(li);
      });
    }
  }

  function barChart(container, cats, values, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const { svg, box, W, H } = frame(container, opts.title, opts.height || 260);
    const labels = opts.labels || [];
    const x = box.x, top = box.y + 8, h = box.h - 16;
    let ymin = 0, ymax = values.reduce((a, b) => Math.max(a, b), 0) * 1.1 || 1;
    const range = ymax - ymin;
    axisY(svg, x, top, h, ymin, ymax, opts.tickFmt);
    axisX(svg, x, top, h, labels);
    const n = values.length;
    const slot = (box.w - 60) / Math.max(1, n);
    const bw = Math.min(52, slot * 0.55);
    const tip = tooltip(svg, box);
    values.forEach((v, i) => {
      const cx = x + 30 + slot * (i + 0.5);
      const bh = h * (v / range);
      const y = top + h - bh;
      const color = v < 0 ? '#e11d48' : (opts.color || '#0ea5e9');
      const r = svgEl('rect', { x: cx - bw / 2, y, width: bw, height: Math.max(0, bh), rx: 4, fill: color, opacity: 0.92 });
      r.addEventListener('mousemove', () => tip.show(cx, y, labels[i] || '', opts.tickFmt ? opts.tickFmt(v) : valFormat(v)));
      r.addEventListener('mouseleave', () => tip.hide());
      svg.appendChild(r);
      const vl = svgEl('text', { x: cx, y: y - 6, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: INK });
      vl.textContent = opts.tickFmt ? opts.tickFmt(v) : valFormat(v);
      svg.appendChild(vl);
    });
  }

  function groupBar(container, groups, seriesArr, opts) {
    opts = opts || {};
    container.innerHTML = '';
    const { svg, box, W, H } = frame(container, opts.title, opts.height || 280);
    const x = box.x, top = box.y + 8, h = box.h - 16;
    let ymin = 0, ymax = 0;
    seriesArr.forEach((s) => s.data.forEach((v) => { if (v > ymax) ymax = v; }));
    ymax = ymax * 1.12 || 1;
    const range = ymax - ymin;
    axisY(svg, x, top, h, ymin, ymax, opts.tickFmt);
    axisX(svg, x, top, h, groups);
    const g = groups.length, k = seriesArr.length;
    const slot = (box.w - 60) / g;
    const bw = Math.min(44, (slot * 0.7) / k);
    const tip = tooltip(svg, box);
    seriesArr.forEach((s, ki) => {
      s.data.forEach((v, gi) => {
        const cx = x + 30 + slot * (gi + 0.5) - (k - 1) * bw / 2 + ki * bw;
        const bh = h * (v / range), y = top + h - bh;
        const color = s.color || PALETTE[ki % PALETTE.length];
        const r = svgEl('rect', { x: cx - bw / 2, y, width: bw, height: Math.max(0, bh), rx: 3, fill: color, opacity: 0.92 });
        r.addEventListener('mousemove', () => tip.show(cx, y, groups[gi], (s.name ? s.name + ': ' : '') + (opts.tickFmt ? opts.tickFmt(v) : valFormat(v))));
        r.addEventListener('mouseleave', () => tip.hide());
        svg.appendChild(r);
      });
    });
    if (opts.legend) {
      seriesArr.forEach((s, ki) => {
        const li = document.createElement('div');
        li.className = 'li';
        li.innerHTML = '<span class="sw" style="background:' + (s.color || PALETTE[ki % PALETTE.length]) + '"></span>' + (s.name || '');
        opts.legend.appendChild(li);
      });
    }
  }

  function breakEvenChart(container, opts) {
    // opts: { fixedCost, pricePerUnit, varCostPerUnit, maxUnits, labels:true }
    container.innerHTML = '';
    const { svg, box, W, H } = frame(container, null, 280);
    const x = box.x, top = box.y + 6, h = box.h - 10;
    const maxU = Math.max(1, opts.maxUnits);
    const maxY = Math.max(opts.fixedCost, (opts.pricePerUnit * maxU)) * 1.1 || 1;
    const sx = (u) => x + (box.w - 60) * (u / maxU) + 30;
    const sy = (v) => top + h - (h * v / maxY);
    axisY(svg, x, top, h, 0, maxY, opts.tickFmt);
    // x axis labels
    for (let i = 0; i <= 4; i++) {
      const u = maxU * i / 4;
      const lbl = svgEl('text', { x: sx(u), y: top + h + 18, 'text-anchor': 'middle', 'font-size': 10.5, fill: INK });
      lbl.textContent = valFormat(u);
      svg.appendChild(lbl);
    }
    // total cost line
    let d = '', dRev = '';
    for (let i = 0; i <= 100; i++) {
      const u = maxU * i / 100;
      const vc = opts.fixedCost + opts.varCostPerUnit * u;
      const rv = opts.pricePerUnit * u;
      d += (i ? 'L' : 'M') + sx(u).toFixed(1) + ',' + sy(vc).toFixed(1);
      dRev += (i ? 'L' : 'M') + sx(u).toFixed(1) + ',' + sy(rv).toFixed(1);
    }
    svg.appendChild(svgEl('path', { d, fill: 'none', stroke: '#f59e0b', 'stroke-width': 2.4 }));
    svg.appendChild(svgEl('path', { d: dRev, fill: 'none', stroke: '#10b981', 'stroke-width': 2.4 }));
    // fixed cost line
    svg.appendChild(svgEl('line', { x1: sx(0), y1: sy(opts.fixedCost), x2: sx(maxU), y2: sy(opts.fixedCost), stroke: '#94a3b8', 'stroke-width': 1.4, 'stroke-dasharray': '5 4' }));
    // BE point
    const beU = opts.beUnits;
    if (beU != null && beU >= 0 && beU <= maxU) {
      const beY = sy(opts.pricePerUnit * beU);
      svg.appendChild(svgEl('circle', { cx: sx(beU), cy: beY, r: 5, fill: '#e11d48', stroke: '#fff', 'stroke-width': 2 }));
      svg.appendChild(svgEl('line', { x1: sx(beU), y1: beY, x2: sx(beU), y2: top + h, stroke: '#e11d48', 'stroke-width': 1.3, 'stroke-dasharray': '4 3' }));
      const lbl = svgEl('text', { x: sx(beU), y: beY - 12, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: '#e11d48' });
      lbl.textContent = 'BE ' + valFormat(beU);
      svg.appendChild(lbl);
    }
    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = '<span class="li"><span class="sw" style="background:#10b981"></span>Revenue</span><span class="li"><span class="sw" style="background:#f59e0b"></span>Total Cost</span><span class="li"><span class="sw" style="background:#94a3b8"></span>Fixed Cost</span><span class="li"><span class="sw" style="background:#e11d48"></span>Break-Even</span>';
    container.parentElement.appendChild(legend);
  }

  global.Charts = { lineChart, barChart, groupBar, breakEvenChart, PALETTE };
})(typeof window !== 'undefined' ? window : globalThis);
