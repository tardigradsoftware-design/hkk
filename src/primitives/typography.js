/**
 * @file src/primitives/typography.js
 * @description Studio Kinetic Typography, Masked Line Reveals, Oversized Hero Slams,
 * Accent Word Highlighters, and TikTok/Shorts Word-by-Word Synced Captions.
 *
 * Follows Anti-Slop Craft Rules:
 *  - NO character-by-character typewriter with blinking caret on headlines
 *  - NO gradient-filled rainbow text; highlight ONE meaningful word with weight or accent pill
 *  - Nothing grows from scale(0): arrive by masked Y-translation or decelerating from oversize (1.25x -> 1.0x)
 */

import { interpolate, spring, resolveEase } from '../core/easing.js';

/**
 * Masked Architectural Line Reveal (Apple / Linear launch film style).
 * Each word or line rises cleanly from behind an invisible baseline clip mask.
 */
export function drawKineticHeadline(ctx, frame, {
  text,
  x,
  y,
  fontSize = 84,
  fontFamily = "'Space Grotesk', 'Inter', sans-serif",
  fontWeight = 700,
  color = '#F8FAFC',
  accentWord = null,
  accentColor = '#38BDF8',
  align = 'center',
  staggerFrames = 4,
  durationFrames = 22,
  lineHeight = 1.12,
  letterSpacing = -0.03,
  exitStart = null,
  exitDuration = 14,
} = {}) {
  const lines = Array.isArray(text) ? text : String(text).split('\n');
  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${letterSpacing}em`;
  }

  const totalHeight = lines.length * fontSize * lineHeight;
  const startY = y - totalHeight / 2 + fontSize * 0.82;

  lines.forEach((line, lineIdx) => {
    const words = line.trim().split(/\s+/);
    // Measure line width with spacing
    const spaceWidth = ctx.measureText(' ').width * 1.05;
    const wordWidths = words.map((w) => ctx.measureText(w).width);
    const lineWidth = wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * Math.max(0, words.length - 1);

    let cursorX = x;
    if (align === 'center') cursorX = x - lineWidth / 2;
    else if (align === 'right') cursorX = x - lineWidth;

    const baselineY = startY + lineIdx * fontSize * lineHeight;

    // Clip mask per line so rising words emerge from clean architectural horizon
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, baselineY - fontSize * 1.15, ctx.canvas.width, fontSize * 1.45);
    ctx.clip();

    words.forEach((word, wordIdx) => {
      const globalWordIndex = lineIdx * 4 + wordIdx;
      const enterFrame = frame - globalWordIndex * staggerFrames;
      const enterT = interpolate(enterFrame, [0, durationFrames], [0, 1], { easing: 'softLand' });

      let offsetY = (1 - enterT) * fontSize * 1.15;
      let alpha = interpolate(enterFrame, [0, durationFrames * 0.45], [0, 1], { easing: 'easeOutCubic' });

      if (exitStart !== null && frame >= exitStart) {
        const exitT = interpolate(frame - exitStart - globalWordIndex * 2, [0, exitDuration], [0, 1], {
          easing: 'accelExit',
        });
        offsetY -= exitT * fontSize * 1.1;
        alpha *= (1 - exitT);
      }

      const cleanWord = word.replace(/[.,!?:;]/g, '').toLowerCase();
      const isAccent = accentWord && cleanWord === accentWord.toLowerCase();

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      if (isAccent && enterT > 0.25) {
        // Subtle editorial marker pill behind the single hero word
        const pillProgress = interpolate(enterFrame - 4, [0, 16], [0, 1], { easing: 'snapSettle' });
        const padX = fontSize * 0.14;
        const padY = fontSize * 0.08;
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.18;
        roundRect(
          ctx,
          cursorX - padX,
          baselineY - fontSize * 0.84 + offsetY - padY,
          (wordWidths[wordIdx] + padX * 2) * pillProgress,
          fontSize * 1.02 + padY * 2,
          fontSize * 0.16
        );
        ctx.fill();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      }

      ctx.fillStyle = isAccent ? accentColor : color;
      ctx.fillText(word, cursorX, baselineY + offsetY);
      ctx.restore();

      cursorX += wordWidths[wordIdx] + spaceWidth;
    });

    ctx.restore();
  });

  ctx.restore();
}

/**
 * Oversize Deceleration Impact Stamp ("Nothing grows from zero" — motionmaxxing law).
 * Arrives from 2.2x scale with subtle motion blur feel into crisp lockup.
 */
export function drawOversizeSlam(ctx, frame, {
  text,
  x,
  y,
  fontSize = 128,
  fontFamily = "'Space Grotesk', 'Inter', sans-serif",
  fontWeight = 800,
  color = '#F8FAFC',
  fromScale = 2.1,
  durationFrames = 16,
} = {}) {
  if (frame < 0) return;
  const scale = interpolate(frame, [0, durationFrames], [fromScale, 1], { easing: 'heavyDrop' });
  const alpha = interpolate(frame, [0, Math.min(7, durationFrames * 0.5)], [0, 1], { easing: 'easeOutCubic' });

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.04em';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Animated Metric Counter (for finance / SaaS / benchmark stats).
 */
export function drawAnimatedCounter(ctx, frame, {
  from = 0,
  to = 100,
  x,
  y,
  durationFrames = 45,
  prefix = '',
  suffix = '',
  decimals = 0,
  fontSize = 96,
  fontFamily = "'Space Grotesk', 'Inter', sans-serif",
  color = '#38BDF8',
  label = '',
  labelColor = '#94A3B8',
} = {}) {
  const val = interpolate(frame, [0, durationFrames], [from, to], { easing: 'crispDecel' });
  const formatted = `${prefix}${val.toFixed(decimals)}${suffix}`;
  const alpha = interpolate(frame, [0, 12], [0, 1], { easing: 'easeOutCubic' });

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.fillText(formatted, x, y);

  if (label) {
    ctx.font = `500 ${Math.round(fontSize * 0.26)}px 'Inter', sans-serif`;
    ctx.fillStyle = labelColor;
    ctx.fillText(label, x, y + fontSize * 0.42);
  }
  ctx.restore();
}

/**
 * Word-Level Synced Captions (Whisper / Edge-TTS compatible) for YouTube Shorts & Explainers.
 * Groups words into readable 4-5 word chunks and highlights the active spoken word with tactile pop.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} currentTimeSec - Current video time in seconds (`globalFrame / fps`)
 * @param {object} opts
 * @param {Array<{word: string, start: number, end: number}>} opts.words - Word timestamps in seconds
 */
export function drawSyncedCaptions(ctx, currentTimeSec, {
  words = [],
  x,
  y,
  wordsPerGroup = 4,
  fontSize = 46,
  fontFamily = "'Inter', sans-serif",
  textColor = '#FFFFFF',
  activeColor = '#38BDF8',
  pillBg = 'rgba(9, 11, 16, 0.78)',
} = {}) {
  if (!words.length) return;

  // Group words into phrases
  const groups = [];
  for (let i = 0; i < words.length; i += wordsPerGroup) {
    const slice = words.slice(i, i + wordsPerGroup);
    groups.push({
      start: slice[0].start,
      end: slice[slice.length - 1].end + 0.18,
      words: slice,
    });
  }

  const activeGroup = groups.find((g) => currentTimeSec >= g.start && currentTimeSec <= g.end);
  if (!activeGroup) return;

  ctx.save();
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';

  const spaceW = ctx.measureText(' ').width * 1.18;
  const widths = activeGroup.words.map((w) => ctx.measureText(w.word).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + spaceW * (activeGroup.words.length - 1);

  // Subtle dark frosted backdrop
  const padX = fontSize * 0.55;
  const padY = fontSize * 0.38;
  ctx.fillStyle = pillBg;
  roundRect(ctx, x - totalW / 2 - padX, y - fontSize / 2 - padY, totalW + padX * 2, fontSize + padY * 2, fontSize * 0.35);
  ctx.fill();

  let cursorX = x - totalW / 2;
  activeGroup.words.forEach((wObj, idx) => {
    const isSpeaking = currentTimeSec >= wObj.start && currentTimeSec <= wObj.end + 0.05;
    const sinceWordStart = Math.max(0, currentTimeSec - wObj.start);
    const popScale = isSpeaking
      ? spring(sinceWordStart * 60, { fps: 60, stiffness: 360, damping: 18, from: 0.92, to: 1.08 })
      : 1.0;

    ctx.save();
    const wordCenter = cursorX + widths[idx] / 2;
    ctx.translate(wordCenter, y);
    ctx.scale(popScale, popScale);
    ctx.fillStyle = isSpeaking ? activeColor : textColor;
    ctx.textAlign = 'center';
    ctx.fillText(wObj.word, 0, 0);
    ctx.restore();

    cursorX += widths[idx] + spaceW;
  });

  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
