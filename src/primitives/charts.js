/**
 * @file src/primitives/charts.js
 * @description Vox / Financial Times / 3Blue1Brown Style Data Visualization & Vector Math Primitives.
 *
 * Follows Editorial Chart Grammar ("First axes, then data, annotate ONE insight"):
 *  1. Axes establish scale first (0..18f)
 *  2. Data series draw progressively with staggered smooth curves
 *  3. Callout spotlight highlights the single takeaway point
 */

import { interpolate, spring } from '../core/easing.js';
import { roundRect } from './typography.js';

/**
 * Progressive Smooth Spline Line Chart with Callout Pin & Area Fill.
 */
export function drawAnimatedLineChart(ctx, frame, {
  x,
  y,
  width = 1100,
  height = 520,
  data = [18, 26, 24, 39, 54, 72, 96],
  labels = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
  title = '',
  unit = '',
  lineColor = '#38BDF8',
  highlightIndex = null,
  highlightNote = '',
  inkColor = '#F8FAFC',
  mutedColor = '#94A3B8',
  gridColor = 'rgba(148, 163, 184, 0.16)',
} = {}) {
  const padLeft = 84;
  const padRight = 48;
  const padTop = title ? 76 : 36;
  const padBottom = 64;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const plotX = x + padLeft;
  const plotY = y + padTop;

  const maxVal = Math.max(...data) * 1.15;
  const minVal = Math.min(0, ...data);

  // Beat 1: Axes & Grid (frames 0..20)
  const axisProgress = interpolate(frame, [0, 20], [0, 1], { easing: 'softLand' });

  ctx.save();

  if (title) {
    ctx.globalAlpha = axisProgress;
    ctx.font = `700 32px 'Space Grotesk', 'Inter', sans-serif`;
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'left';
    ctx.fillText(title, plotX, y + 40);
  }

  // Horizontal reference lines (4 ticks)
  const ticks = 4;
  ctx.font = `500 18px 'JetBrains Mono', monospace`;
  for (let i = 0; i <= ticks; i++) {
    const ratio = i / ticks;
    const ty = plotY + plotH - ratio * plotH;
    const val = Math.round(minVal + ratio * (maxVal - minVal));

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(plotX, ty);
    ctx.lineTo(plotX + plotW * axisProgress, ty);
    ctx.stroke();

    ctx.globalAlpha = axisProgress;
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${val}${unit}`, plotX - 16, ty);
  }

  // Compute point coordinates
  const pts = data.map((v, idx) => {
    const px = plotX + (idx / Math.max(1, data.length - 1)) * plotW;
    const py = plotY + plotH - ((v - minVal) / (maxVal - minVal || 1)) * plotH;
    return { x: px, y: py, val: v, label: labels[idx] || '' };
  });

  // X-axis labels
  pts.forEach((pt, idx) => {
    const lblAlpha = interpolate(frame - idx * 2, [6, 22], [0, 1], { easing: 'easeOutCubic' });
    ctx.globalAlpha = lblAlpha;
    ctx.fillStyle = mutedColor;
    ctx.font = `500 18px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(pt.label, pt.x, plotY + plotH + 18);
  });

  // Beat 2: Progressive Line Draw (frames 14..68)
  const lineDraw = interpolate(frame, [14, 68], [0, 1], { easing: 'editorialGlide' });
  if (lineDraw > 0 && pts.length >= 2) {
    const clipW = plotW * lineDraw + 8;

    ctx.save();
    ctx.beginPath();
    ctx.rect(plotX - 8, plotY - 30, clipW, plotH + 40);
    ctx.clip();

    // Area gradient under curve
    ctx.beginPath();
    ctx.moveTo(pts[0].x, plotY + plotH);
    ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[pts.length - 1].x, plotY + plotH);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
    areaGrad.addColorStop(0, hexToRgba(lineColor, 0.32));
    areaGrad.addColorStop(1, hexToRgba(lineColor, 0.0));
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Smooth curve stroke
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();

    // Data nodes
    pts.forEach((pt, idx) => {
      const nodeAppearAt = 14 + (idx / Math.max(1, pts.length - 1)) * 50;
      if (frame >= nodeAppearAt) {
        const r = spring(frame - nodeAppearAt, { fps: 60, stiffness: 320, damping: 18, from: 0, to: 7 });
        ctx.fillStyle = '#090B10';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r + 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // Beat 3: Single Focal Insight Callout (frames 72+)
  const targetIdx = highlightIndex ?? pts.length - 1;
  if (pts[targetIdx] && frame >= 70) {
    const pt = pts[targetIdx];
    const calloutT = spring(frame - 70, { fps: 60, stiffness: 260, damping: 20, from: 0, to: 1 });
    const pulseR = 14 + Math.sin((frame - 70) * 0.12) * 5;

    ctx.save();
    ctx.strokeStyle = hexToRgba(lineColor, 0.55 * calloutT);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    const badgeText = highlightNote || `${pt.val}${unit}`;
    ctx.font = `700 22px 'Inter', sans-serif`;
    const bw = ctx.measureText(badgeText).width + 32;
    const bh = 44;
    const bx = Math.min(x + width - bw - 12, Math.max(x + 12, pt.x - bw / 2));
    const by = pt.y - bh - 24;

    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(calloutT, calloutT);
    ctx.translate(-(bx + bw / 2), -(by + bh / 2));

    ctx.fillStyle = lineColor;
    roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fill();

    ctx.fillStyle = '#07090E';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx + bw / 2, by + bh / 2 + 1);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Staggered Horizontal / Vertical Bar Race or Benchmark Comparison.
 */
export function drawAnimatedBars(ctx, frame, {
  x,
  y,
  width = 960,
  rowHeight = 68,
  gap = 22,
  items = [
    { label: 'Agent Motion Engine', value: 98, accent: true },
    { label: 'Manual Timeline Edit', value: 42, accent: false },
    { label: 'Generic Slide Tool', value: 19, accent: false },
  ],
  maxValue = 100,
  unit = '%',
  accentColor = '#38BDF8',
  barColor = '#334155',
  inkColor = '#F8FAFC',
} = {}) {
  const labelW = 290;
  const trackW = width - labelW - 100;

  ctx.save();
  items.forEach((item, idx) => {
    const startF = idx * 8;
    const localF = frame - startF;
    if (localF < 0) return;

    const enterAlpha = interpolate(localF, [0, 14], [0, 1], { easing: 'easeOutCubic' });
    const fillRatio = interpolate(localF, [4, 42], [0, item.value / maxValue], { easing: 'softLand' });
    const rowY = y + idx * (rowHeight + gap);

    ctx.save();
    ctx.globalAlpha = enterAlpha;

    // Label
    ctx.font = `${item.accent ? 700 : 500} 24px 'Inter', sans-serif`;
    ctx.fillStyle = item.accent ? inkColor : '#CBD5E1';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, x, rowY + rowHeight / 2);

    // Track background
    const trackX = x + labelW;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, trackX, rowY, trackW, rowHeight, 14);
    ctx.fill();

    // Active bar
    const fillW = Math.max(16, trackW * fillRatio);
    ctx.fillStyle = item.accent ? accentColor : barColor;
    roundRect(ctx, trackX, rowY, fillW, rowHeight, 14);
    ctx.fill();

    // Value readout
    const shownVal = Math.round(item.value * (fillRatio / (item.value / maxValue || 1)));
    ctx.font = `700 24px 'JetBrains Mono', monospace`;
    ctx.fillStyle = item.accent ? accentColor : '#94A3B8';
    ctx.fillText(`${shownVal}${unit}`, trackX + fillW + 18, rowY + rowHeight / 2);

    ctx.restore();
  });
  ctx.restore();
}

/**
 * 3Blue1Brown-Inspired Mathematical Function Plotter & Morphing Wave.
 * Smoothly morphs between `fnA(x)` and `fnB(x)` over frames.
 */
export function drawMathFunctionMorph(ctx, frame, {
  x,
  y,
  width = 1000,
  height = 440,
  domain = [-Math.PI * 2, Math.PI * 2],
  range = [-1.5, 1.5],
  fnA = (v) => Math.sin(v),
  fnB = (v) => Math.sin(v) + 0.5 * Math.sin(3 * v),
  morphStart = 35,
  morphDuration = 45,
  strokeA = '#38BDF8',
  strokeB = '#F59E0B',
  formulaLabel = '',
} = {}) {
  const drawIn = interpolate(frame, [0, 28], [0, 1], { easing: 'softLand' });
  const morphT = interpolate(frame, [morphStart, morphStart + morphDuration], [0, 1], { easing: 'dramaticS' });

  const cx = x + width / 2;
  const cy = y + height / 2;

  ctx.save();
  // Coordinate axes
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, cy);
  ctx.lineTo(x + width * drawIn, cy);
  ctx.moveTo(cx, y + height / 2 - (height / 2) * drawIn);
  ctx.lineTo(cx, y + height / 2 + (height / 2) * drawIn);
  ctx.stroke();

  // Sample curve
  const samples = 240;
  const visibleSamples = Math.floor(samples * drawIn);
  if (visibleSamples > 1) {
    ctx.beginPath();
    for (let i = 0; i <= visibleSamples; i++) {
      const u = i / samples;
      const vx = domain[0] + u * (domain[1] - domain[0]);
      const vyA = fnA(vx);
      const vyB = fnB(vx);
      const vy = vyA + (vyB - vyA) * morphT;

      const px = x + u * width;
      const py = y + height - ((vy - range[0]) / (range[1] - range[0])) * height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = blendHex(strokeA, strokeB, morphT);
    ctx.lineWidth = 4.5;
    ctx.stroke();
  }

  if (formulaLabel) {
    ctx.font = `600 26px 'JetBrains Mono', monospace`;
    ctx.fillStyle = blendHex(strokeA, strokeB, morphT);
    ctx.textAlign = 'right';
    ctx.fillText(formulaLabel, x + width - 16, y + 36);
  }
  ctx.restore();
}

export function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function blendHex(hexA, hexB, t) {
  const parse = (h) => {
    const clean = h.replace('#', '');
    const n = parseInt(clean, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
