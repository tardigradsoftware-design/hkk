/**
 * @file src/core/easing.js
 * @description Measured Motion Design Easing Curves, Deterministic Spring Solver,
 * Interpolation, and Seeded PRNG for AI Agents.
 *
 * Designed from empirical motion studies (motionmaxxing, LottieFiles Motion Design Skill,
 * Apple HIG, Material Design 3):
 *  - Entrances decelerate (fast launch, gentle landing)
 *  - Exits accelerate (gentle start, fast departure)
 *  - Overshoot stays subtle (< 9% of moves) and physical
 *  - ZERO Math.random() allowed: every frame is a pure function of `frame`
 */

/**
 * Newton-Raphson + Bisection cubic-bezier(x1, y1, x2, y2) solver.
 * Deterministic across browsers and Node.js.
 */
export function cubicBezier(x1, y1, x2, y2) {
  if (x1 === y1 && x2 === y2) return (t) => t;

  const sampleCurveX = (t) => ((1 - 3 * x2 + 3 * x1) * t * t * t) + ((3 * x2 - 6 * x1) * t * t) + (3 * x1 * t);
  const sampleCurveY = (t) => ((1 - 3 * y2 + 3 * y1) * t * t * t) + ((3 * y2 - 6 * y1) * t * t) + (3 * y1 * t);
  const sampleCurveDerivativeX = (t) => (3 * (1 - 3 * x2 + 3 * x1) * t * t) + (2 * (3 * x2 - 6 * x1) * t) + (3 * x1);

  const solveCurveX = (x) => {
    let t2 = x;
    for (let i = 0; i < 8; i++) {
      const x2Est = sampleCurveX(t2) - x;
      if (Math.abs(x2Est) < 1e-6) return t2;
      const d2 = sampleCurveDerivativeX(t2);
      if (Math.abs(d2) < 1e-6) break;
      t2 -= x2Est / d2;
    }
    let t0 = 0;
    let t1 = 1;
    t2 = x;
    while (t0 < t1) {
      const x2Est = sampleCurveX(t2);
      if (Math.abs(x2Est - x) < 1e-6) return t2;
      if (x > x2Est) t0 = t2;
      else t1 = t2;
      t2 = (t1 - t0) * 0.5 + t0;
      if (t1 - t0 < 1e-6) break;
    }
    return t2;
  };

  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return sampleCurveY(solveCurveX(t));
  };
}

/**
 * 12 Measured Professional Motion Eases + Standard Curves.
 * Agents can pass either a function or a string key from `EASES`.
 */
export const EASES = {
  // 1. Measured Studio Eases (for cinematic motion graphics)
  softLand: cubicBezier(0.16, 1, 0.3, 1),          // Default hero arrival (Expo-like smooth settle)
  snapSettle: cubicBezier(0.05, 0.7, 0.1, 1),      // Snappy UI / text slam (MD3 Emphasized)
  crispDecel: cubicBezier(0.22, 1, 0.36, 1),       // Quintic-style clean entrance
  heavyDrop: cubicBezier(0.12, 0.92, 0.18, 1),     // Oversized logo / headline impact
  accelExit: cubicBezier(0.4, 0, 1, 1),            // Clean exit (leaves frame accelerating)
  whipCut: cubicBezier(0.7, 0, 0.84, 0),           // Fast whip into a hard cut
  silkInOut: cubicBezier(0.65, 0, 0.35, 1),        // Camera pan / layout shift
  dramaticS: cubicBezier(0.85, 0, 0.15, 1),        // High-contrast camera push / morph
  subtleOvershoot: cubicBezier(0.175, 0.885, 0.32, 1.08), // Controlled 8% lean past mark
  playfulPop: cubicBezier(0.34, 1.45, 0.64, 1),    // Badge / sticker pop
  editorialGlide: cubicBezier(0.25, 1, 0.5, 1),    // Vox / documentary chart draw
  ambientSine: (t) => (1 - Math.cos(Math.PI * t)) / 2, // Continuous breathing / floating

  // 2. Classic Mathematical Curves
  linear: (t) => t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInCubic: (t) => t * t * t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
};

export function resolveEase(ease = 'softLand') {
  if (typeof ease === 'function') return ease;
  if (typeof ease === 'string' && EASES[ease]) return EASES[ease];
  return EASES.softLand;
}

/**
 * Closed-form Damped Harmonic Oscillator (Exact analytical spring).
 * Unlike step-accumulated physics, this is 100% seek-safe at ANY frame `f`.
 *
 * @param {number} frame - Current frame relative to spring start (can be fractional for motion blur)
 * @param {object} options
 * @param {number} [options.fps=60]
 * @param {number} [options.stiffness=180] - Spring tension (higher = faster)
 * @param {number} [options.damping=22]    - Friction (critical damping = 2*sqrt(stiffness*mass))
 * @param {number} [options.mass=1]        - Object mass
 * @param {number} [options.velocity=0]    - Initial velocity (units/sec)
 * @param {number} [options.from=0]        - Start value
 * @param {number} [options.to=1]          - End value
 */
export function spring(frame, {
  fps = 60,
  stiffness = 180,
  damping = 22,
  mass = 1,
  velocity = 0,
  from = 0,
  to = 1,
} = {}) {
  if (frame <= 0) return from;
  const t = frame / fps;
  const delta = to - from;
  if (delta === 0 && velocity === 0) return to;

  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const x0 = -delta; // Initial displacement from equilibrium `to`
  const v0 = velocity;

  let displacement;
  if (zeta < 1) {
    // Underdamped (smooth bounce / overshoot)
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const A = x0;
    const B = (zeta * w0 * x0 + v0) / wd;
    displacement = Math.exp(-zeta * w0 * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  } else if (Math.abs(zeta - 1) < 1e-5) {
    // Critically damped (fastest settle without overshoot)
    const A = x0;
    const B = v0 + w0 * x0;
    displacement = (A + B * t) * Math.exp(-w0 * t);
  } else {
    // Overdamped
    const s1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
    const s2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
    const c2 = (v0 - s1 * x0) / (s2 - s1);
    const c1 = x0 - c2;
    displacement = c1 * Math.exp(s1 * t) + c2 * Math.exp(s2 * t);
  }

  const value = to + displacement;
  if (Math.abs(to - value) < 1e-4 && t > 0.05) return to;
  return value;
}

/**
 * Named Spring Presets for Agents
 */
export const SPRING_PRESETS = {
  crispUI: { stiffness: 260, damping: 28, mass: 1 },       // Zero-bounce clean UI card
  heavySlam: { stiffness: 340, damping: 30, mass: 1.4 },   // Kinetic headline impact
  gentleSettle: { stiffness: 130, damping: 20, mass: 1 },  // Smooth camera / float
  tactilePop: { stiffness: 300, damping: 18, mass: 0.9 },  // Subtle ~8% physical overshoot
  elasticBadge: { stiffness: 240, damping: 13, mass: 0.8 },// Playful sticker / icon
};

/**
 * Multi-point Remotion-style deterministic interpolation.
 *
 * @param {number} input - Current frame or progress value
 * @param {number[]} inputRange - Monotonically increasing breakpoints, e.g. [0, 20, 80, 100]
 * @param {number[]} outputRange - Target values, e.g. [0, 1, 1, 0]
 * @param {object} [options]
 * @param {string|Function} [options.easing='linear']
 * @param {'clamp'|'extend'} [options.extrapolateLeft='clamp']
 * @param {'clamp'|'extend'} [options.extrapolateRight='clamp']
 */
export function interpolate(input, inputRange, outputRange, {
  easing = 'linear',
  extrapolateLeft = 'clamp',
  extrapolateRight = 'clamp',
} = {}) {
  if (inputRange.length < 2 || inputRange.length !== outputRange.length) {
    throw new Error('interpolate: inputRange and outputRange must have matching length >= 2');
  }

  const easeFn = resolveEase(easing);

  if (input <= inputRange[0]) {
    if (extrapolateLeft === 'clamp') return outputRange[0];
    const slope = (outputRange[1] - outputRange[0]) / (inputRange[1] - inputRange[0] || 1);
    return outputRange[0] + (input - inputRange[0]) * slope;
  }

  const last = inputRange.length - 1;
  if (input >= inputRange[last]) {
    if (extrapolateRight === 'clamp') return outputRange[last];
    const slope = (outputRange[last] - outputRange[last - 1]) / (inputRange[last] - inputRange[last - 1] || 1);
    return outputRange[last] + (input - inputRange[last]) * slope;
  }

  let seg = 0;
  for (let i = 0; i < last; i++) {
    if (input >= inputRange[i] && input <= inputRange[i + 1]) {
      seg = i;
      break;
    }
  }

  const span = inputRange[seg + 1] - inputRange[seg];
  const rawT = span === 0 ? 1 : (input - inputRange[seg]) / span;
  const easedT = easeFn(Math.max(0, Math.min(1, rawT)));
  return outputRange[seg] + easedT * (outputRange[seg + 1] - outputRange[seg]);
}

/**
 * Mulberry32 Deterministic Seeded PRNG.
 * Guarantees frame-identical particles, jitter, grain, and handwriting wobble across renders.
 *
 * @param {number|string} seed
 * @returns {() => number} Function returning [0, 1)
 */
export function createSeededRandom(seed = 42) {
  let a = typeof seed === 'string'
    ? Array.from(seed).reduce((acc, ch) => Math.imul(acc ^ ch.charCodeAt(0), 2654435761), 2166136261) >>> 0
    : (seed >>> 0);

  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Smooth deterministic 1D value noise for organic camera handheld shake & line boil.
 */
export function noise1D(x, seed = 1337) {
  const xi = Math.floor(x);
  const xf = x - xi;
  const hash = (n) => {
    let h = Math.imul(n ^ seed, 0x27d4eb2d);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  };
  const u = xf * xf * (3 - 2 * xf);
  return (hash(xi) * (1 - u) + hash(xi + 1) * u) * 2 - 1;
}
