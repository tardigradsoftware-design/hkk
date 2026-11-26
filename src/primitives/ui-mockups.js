/**
 * @file src/primitives/ui-mockups.js
 * @description Realistic Product / Terminal / Code / Cursor Choreography Primitives.
 *
 * Designed for SaaS Launch Videos, Developer Tutorials, and Tech YouTube Explainers:
 *  - Believable macOS/Linux terminal simulator with command execution & output
 *  - Lit elevated UI window with depth shadow & border highlight
 *  - Smooth human-like Bezier cursor travel + tactile click ripple
 *  - Cinematic whip/wipe/iris scene transitions
 */

import { interpolate, spring } from '../core/easing.js';
import { roundRect, hexToRgba } from './charts-bridge.js';

/**
 * Believable Developer Terminal Window (great for AI / coding / product demos).
 */
export function drawTerminalWindow(ctx, frame, {
  x,
  y,
  width = 1040,
  height = 520,
  title = 'claude-agent — zsh',
  lines = [
    { type: 'cmd', text: 'npx agent-motion render launch-promo --fps 60', startFrame: 12 },
    { type: 'out', text: '✓ Storyboard verified (4 acts, 128 BPM beat-locked)', startFrame: 48, color: '#10B981' },
    { type: 'out', text: '✓ Synthesized 9 frame-accurate audio cues (-14 LUFS)', startFrame: 66, color: '#38BDF8' },
    { type: 'out', text: '✓ QA Gates G0–G5 PASSED · Rendered 1080p60 MP4', startFrame: 86, color: '#F59E0B' },
  ],
} = {}) {
  const enterScale = spring(frame, { fps: 60, stiffness: 240, damping: 24, from: 0.92, to: 1 });
  const enterY = interpolate(frame, [0, 22], [36, 0], { easing: 'softLand' });
  const enterAlpha = interpolate(frame, [0, 12], [0, 1], { easing: 'easeOutCubic' });

  ctx.save();
  ctx.globalAlpha = enterAlpha;
  ctx.translate(x + width / 2, y + height / 2 + enterY);
  ctx.scale(enterScale, enterScale);
  ctx.translate(-(x + width / 2), -(y + height / 2));

  // Deep ambient elevation shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.58)';
  ctx.shadowBlur = 54;
  ctx.shadowOffsetY = 26;
  ctx.fillStyle = '#0D1117';
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();

  // Reset shadow for crisp interior
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtle top-lit rim border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, width, height, 18);
  ctx.stroke();

  // Window header bar
  ctx.fillStyle = '#161B22';
  ctx.beginPath();
  ctx.roundRect
    ? ctx.roundRect(x, y, width, 48, [18, 18, 0, 0])
    : roundRect(ctx, x, y, width, 48, 18);
  ctx.fill();

  // Traffic lights
  const dots = ['#FF5F56', '#FFBD2E', '#27C93F'];
  dots.forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 26 + idx * 22, y + 24, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.font = `500 16px 'Inter', sans-serif`;
  ctx.fillStyle = '#8B949E';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + width / 2, y + 24);

  // Terminal lines
  let lineY = y + 92;
  ctx.textAlign = 'left';
  ctx.font = `500 22px 'JetBrains Mono', monospace`;

  lines.forEach((ln) => {
    if (frame < ln.startFrame) return;
    const elapsed = frame - ln.startFrame;

    if (ln.type === 'cmd') {
      // Commands type smoothly at realistic human/agent burst speed
      const chars = Math.min(ln.text.length, Math.floor(elapsed * 1.6));
      const slice = ln.text.slice(0, chars);
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('❯', x + 32, lineY);
      ctx.fillStyle = '#F0F6FC';
      ctx.fillText(slice, x + 60, lineY);

      if (chars < ln.text.length) {
        const w = ctx.measureText(slice).width;
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(x + 64 + w, lineY - 12, 11, 24);
      }
    } else {
      const outAlpha = interpolate(elapsed, [0, 10], [0, 1], { easing: 'easeOutCubic' });
      const outShift = interpolate(elapsed, [0, 12], [8, 0], { easing: 'softLand' });
      ctx.save();
      ctx.globalAlpha = outAlpha;
      ctx.fillStyle = ln.color || '#C9D1D9';
      ctx.fillText(ln.text, x + 32, lineY + outShift);
      ctx.restore();
    }
    lineY += 46;
  });

  ctx.restore();
}

/**
 * Simulated Cursor with Natural Curved Path & Click Ripple.
 */
export function drawSimulatedCursor(ctx, frame, {
  fromPos = [1200, 820],
  toPos = [960, 540],
  moveStart = 10,
  moveDuration = 32,
  clickFrame = 46,
  accentColor = '#38BDF8',
} = {}) {
  const t = interpolate(frame, [moveStart, moveStart + moveDuration], [0, 1], { easing: 'silkInOut' });
  // Slight natural arc
  const arcOffset = Math.sin(t * Math.PI) * -42;
  const cx = fromPos[0] + (toPos[0] - fromPos[0]) * t + arcOffset * 0.4;
  const cy = fromPos[1] + (toPos[1] - fromPos[1]) * t + arcOffset;

  const isClicking = clickFrame !== null && frame >= clickFrame && frame <= clickFrame + 18;
  const pressScale = isClicking
    ? interpolate(frame - clickFrame, [0, 4, 14], [1, 0.82, 1], { easing: 'easeOutCubic' })
    : 1;

  ctx.save();

  // Click shockwave ring
  if (clickFrame !== null && frame >= clickFrame && frame <= clickFrame + 26) {
    const ringT = (frame - clickFrame) / 26;
    ctx.strokeStyle = hexToRgba(accentColor, (1 - ringT) * 0.85);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 + ringT * 48, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Pointer arrow vector
  ctx.translate(cx, cy);
  ctx.scale(pressScale, pressScale);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 28);
  ctx.lineTo(7.5, 21.5);
  ctx.lineTo(13.5, 33);
  ctx.lineTo(18.5, 30.5);
  ctx.lineTo(12.5, 19);
  ctx.lineTo(22, 19);
  ctx.closePath();

  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#090B10';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Geometric Whip / Diagonal Shutter Wipe Transition (cuts on motion!).
 */
export function drawGeometricWipe(ctx, localFrame, {
  width,
  height,
  duration = 20,
  color = '#38BDF8',
  secondaryColor = '#0F172A',
} = {}) {
  const enter = interpolate(localFrame, [0, duration * 0.5], [-0.25, 1.15], { easing: 'snapSettle' });
  const exit = interpolate(localFrame, [duration * 0.45, duration], [-0.25, 1.25], { easing: 'accelExit' });

  const slant = width * 0.14;
  ctx.save();

  // Accent leading blade
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(width * exit - slant, 0);
  ctx.lineTo(width * enter, 0);
  ctx.lineTo(width * enter - slant, height);
  ctx.lineTo(width * exit - slant * 2, height);
  ctx.closePath();
  ctx.fill();

  // Secondary trailing blade
  const trailEnter = interpolate(localFrame, [2, duration * 0.58], [-0.25, 1.15], { easing: 'snapSettle' });
  const trailExit = interpolate(localFrame, [duration * 0.52, duration], [-0.25, 1.25], { easing: 'accelExit' });
  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.moveTo(width * trailExit - slant, 0);
  ctx.lineTo(width * trailEnter, 0);
  ctx.lineTo(width * trailEnter - slant, height);
  ctx.lineTo(width * trailExit - slant * 2, height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
