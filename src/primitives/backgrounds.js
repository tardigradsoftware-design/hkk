/**
 * @file src/primitives/backgrounds.js
 * @description Lit Textured Surfaces, Ambient Mesh Light, Isometric/Perspective Grids,
 * Film Grain, and Seeded Atmospheric Particles.
 *
 * Enforces Craft Rule ("Skincare = grain and light"):
 * Never paint a flat hex void. Grounds have directional light, subtle parallax, and dither/grain
 * so H.264 encoding never bands.
 */

import { createSeededRandom, noise1D } from '../core/easing.js';

/**
 * Draw a studio-lit surface with subtle drifting key light, rim glow, and anti-banding dither.
 */
export function drawStudioSurface(ctx, frame, {
  width,
  height,
  baseColor = '#07090E',
  keyColor = 'rgba(56, 189, 248, 0.16)',
  rimColor = 'rgba(99, 102, 241, 0.10)',
  keyPosition = [0.65, 0.28],
  drift = 0.04,
  vignette = 0.55,
  gridOpacity = 0.045,
  gridSize = 64,
} = {}) {
  // 1. Base coat
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Motivated key light with gentle ambient breathing (never frozen!)
  const dx = Math.sin(frame * 0.018) * width * drift;
  const dy = Math.cos(frame * 0.014) * height * drift;
  const kx = width * keyPosition[0] + dx;
  const ky = height * keyPosition[1] + dy;
  const radius = Math.max(width, height) * 0.78;

  const keyGrad = ctx.createRadialGradient(kx, ky, 0, kx, ky, radius);
  keyGrad.addColorStop(0, keyColor);
  keyGrad.addColorStop(0.55, rimColor);
  keyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = keyGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Optional architectural grid with slow parallax
  if (gridOpacity > 0) {
    const offsetX = (frame * 0.35) % gridSize;
    const offsetY = (frame * 0.2) % gridSize;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -gridSize + offsetX; x < width + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 4. Subtle edge vignette to focus viewer eye on the hero subject
  if (vignette > 0) {
    const vig = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.32,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${vignette})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Deterministic ambient dust/bokeh particles (0 Math.random calls).
 */
export function drawAmbientParticles(ctx, frame, {
  width,
  height,
  count = 36,
  color = '#38BDF8',
  maxAlpha = 0.35,
  speed = 0.6,
  seed = 777,
} = {}) {
  const rng = createSeededRandom(seed);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const initX = rng() * width;
    const initY = rng() * height;
    const size = 1.2 + rng() * 3.2;
    const vx = (rng() - 0.5) * speed;
    const vy = -(0.25 + rng() * speed);
    const phase = rng() * Math.PI * 2;

    const x = ((initX + frame * vx) % width + width) % width;
    const y = ((initY + frame * vy) % height + height) % height;
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.04 + phase);

    ctx.globalAlpha = pulse * maxAlpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Fast procedural film grain overlay to eliminate H.264 color banding.
 */
export function drawFilmGrain(ctx, frame, {
  width,
  height,
  intensity = 0.028,
  step = 6,
} = {}) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalAlpha = intensity;
  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);
  // Sample sparse micro-specks deterministically
  const samples = Math.min(900, Math.floor((cols * rows) * 0.03));
  const rng = createSeededRandom(Math.floor(frame) * 9973 + 17);
  for (let i = 0; i < samples; i++) {
    const x = Math.floor(rng() * cols) * step;
    const y = Math.floor(rng() * rows) * step;
    ctx.fillStyle = rng() > 0.5 ? '#FFFFFF' : '#000000';
    ctx.fillRect(x, y, step * 0.5, step * 0.5);
  }
  ctx.restore();
}

/**
 * Warm Editorial Paper Ground (for Vox / Collage / Kurzgesagt explainers).
 */
export function drawEditorialPaper(ctx, frame, {
  width,
  height,
  paperColor = '#F4F1EA',
  dotColor = 'rgba(20, 24, 33, 0.09)',
  dotSpacing = 36,
} = {}) {
  ctx.fillStyle = paperColor;
  ctx.fillRect(0, 0, width, height);

  // Subtle warm radial spotlight
  const cx = width * 0.5 + noise1D(frame * 0.01, 12) * 30;
  const cy = height * 0.45 + noise1D(frame * 0.01, 34) * 20;
  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.75);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  grad.addColorStop(1, 'rgba(214, 207, 194, 0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Drafting dot matrix
  ctx.fillStyle = dotColor;
  for (let x = dotSpacing; x < width; x += dotSpacing) {
    for (let y = dotSpacing; y < height; y += dotSpacing) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
}
