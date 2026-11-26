/**
 * @file src/core/timeline.js
 * @description Frame-Addressable Deterministic Scene, Sequence, Beat Grid & Camera Rig.
 *
 * Every composition is a pure function `render(frame, ctx)` where:
 *   - `frame` can be integer (e.g. 120) or fractional (e.g. 120.25 for sub-frame motion blur)
 *   - Music BPM grid (`beatToFrame`, `barToFrame`) locks cuts and kinetic hits to rhythm
 *   - Audio cues are declared alongside visuals so `scripts/audio-synth.py` generates frame-exact SFX
 */

import { interpolate, spring, resolveEase, noise1D, SPRING_PRESETS } from './easing.js';

export class Timeline {
  /**
   * @param {object} config
   * @param {string} config.id - Unique composition slug
   * @param {string} [config.title] - Human readable title
   * @param {number} [config.width=1920] - Canvas width (1920 for 16:9 YouTube, 1080 for 9:16 Shorts)
   * @param {number} [config.height=1080] - Canvas height
   * @param {number} [config.fps=60] - Frames per second
   * @param {number} [config.durationInFrames] - Total frames (or derived from `durationSeconds`)
   * @param {number} [config.durationSeconds=10] - Duration in seconds if `durationInFrames` omitted
   * @param {number} [config.bpm=120] - Tempo for rhythmic cuts and beat-locked animations
   * @param {object} [config.theme] - Color palette and typography tokens
   */
  constructor(config = {}) {
    this.id = config.id || 'untitled-composition';
    this.title = config.title || this.id;
    this.width = config.width || 1920;
    this.height = config.height || 1080;
    this.fps = config.fps || 60;
    this.bpm = config.bpm || 120;
    this.durationInFrames = config.durationInFrames
      || Math.round((config.durationSeconds || 10) * this.fps);

    this.theme = {
      bgPrimary: '#090B10',
      bgSecondary: '#111622',
      surface: '#161D2E',
      ink: '#F8FAFC',
      inkMuted: '#94A3B8',
      accent: '#38BDF8',      // Single intentional hero accent (Craft rule)
      accentWarm: '#F59E0B',  // Optional semantic support hue
      success: '#10B981',
      danger: '#EF4444',
      fontDisplay: "'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif",
      fontSans: "'Inter', system-ui, -apple-system, sans-serif",
      fontMono: "'JetBrains Mono', 'Fira Code', monospace",
      ...(config.theme || {}),
    };

    this.sequences = [];
    this.audioCues = [];
    this.cameraKeyframes = [];
  }

  /** Convert seconds to exact frames */
  sec(s) {
    return s * this.fps;
  }

  /** Convert musical beat (0-indexed) to exact frame */
  beat(beatIndex) {
    const secondsPerBeat = 60 / this.bpm;
    return beatIndex * secondsPerBeat * this.fps;
  }

  /** Convert musical bar (1-indexed, 4/4 default) + beat to exact frame */
  bar(barNumber, beatInBar = 0, beatsPerBar = 4) {
    return this.beat((barNumber - 1) * beatsPerBar + beatInBar);
  }

  /**
   * Add a timed scene/layer sequence (similar to Remotion <Sequence> or HyperFrames data-start).
   *
   * @param {object} opts
   * @param {string} [opts.name]
   * @param {number} opts.from - Start frame
   * @param {number} opts.duration - Duration in frames
   * @param {number} [opts.layer=0] - Z-order (higher paints on top)
   * @param {(localFrame: number, info: object) => void} opts.render - Render callback
   */
  addSequence({ name = 'layer', from = 0, duration, layer = 0, render }) {
    const dur = duration ?? (this.durationInFrames - from);
    this.sequences.push({ name, from, duration: dur, layer, render });
    this.sequences.sort((a, b) => a.layer - b.layer);
    return this;
  }

  /**
   * Register a frame-exact sound cue so `scripts/audio-synth.py` or `earshot`
   * generates a synchronized soundtrack automatically from code.
   *
   * @param {object} cue
   * @param {number} cue.frame - Exact frame when sound hits
   * @param {'subHit'|'whoosh'|'uiClick'|'pop'|'riser'|'tick'|'chime'|'shutter'} cue.type
   * @param {number} [cue.gain=0.8] - 0..1 volume
   * @param {number} [cue.pitch=1.0] - Frequency multiplier
   * @param {string} [cue.note] - Description for QA sheet
   */
  addSoundCue({ frame, type, gain = 0.8, pitch = 1.0, note = '' }) {
    this.audioCues.push({
      frame: Math.round(frame),
      timeSeconds: Number((frame / this.fps).toFixed(4)),
      type,
      gain,
      pitch,
      note,
    });
    return this;
  }

  /**
   * Add 2.5D virtual camera motion (zoom, pan, tilt, subtle handheld drift).
   * Prevents "dead flat slide" syndrome (Gate G2).
   */
  addCameraMove({
    from,
    duration,
    x = [0, 0],
    y = [0, 0],
    zoom = [1, 1],
    rotateDeg = [0, 0],
    easing = 'silkInOut',
    handheld = 0,
  }) {
    this.cameraKeyframes.push({ from, duration, x, y, zoom, rotateDeg, easing, handheld });
    return this;
  }

  /**
   * Compute virtual camera state at `frame`.
   */
  getCameraState(frame) {
    let camX = 0;
    let camY = 0;
    let camZoom = 1;
    let camRot = 0;

    for (const kf of this.cameraKeyframes) {
      if (frame >= kf.from && frame <= kf.from + kf.duration) {
        const local = frame - kf.from;
        const range = [0, kf.duration];
        camX += interpolate(local, range, kf.x, { easing: kf.easing });
        camY += interpolate(local, range, kf.y, { easing: kf.easing });
        camZoom *= interpolate(local, range, kf.zoom, { easing: kf.easing });
        camRot += interpolate(local, range, kf.rotateDeg, { easing: kf.easing });
        if (kf.handheld > 0) {
          camX += noise1D(frame * 0.035, 101) * kf.handheld * 8;
          camY += noise1D(frame * 0.035, 202) * kf.handheld * 6;
          camRot += noise1D(frame * 0.025, 303) * kf.handheld * 0.35;
        }
      }
    }

    return { x: camX, y: camY, zoom: camZoom, rotateDeg: camRot };
  }

  /**
   * Render a single exact frame onto a 2D Canvas (and optional overlay DOM/WebGL hooks).
   * Pure & deterministic: seeking to frame 240 produces the exact same pixels every time.
   */
  renderFrame(ctx, frame) {
    const clampedFrame = Math.max(0, Math.min(this.durationInFrames - 0.0001, frame));
    const { width, height, fps, theme } = this;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply 2.5D virtual camera around canvas center
    const cam = this.getCameraState(clampedFrame);
    ctx.translate(width / 2 - cam.x, height / 2 - cam.y);
    ctx.scale(cam.zoom, cam.zoom);
    if (cam.rotateDeg !== 0) {
      ctx.rotate((cam.rotateDeg * Math.PI) / 180);
    }
    ctx.translate(-width / 2, -height / 2);

    for (const seq of this.sequences) {
      if (clampedFrame >= seq.from && clampedFrame < seq.from + seq.duration) {
        const localFrame = clampedFrame - seq.from;
        const progress = seq.duration > 0 ? localFrame / seq.duration : 0;
        ctx.save();
        seq.render(localFrame, {
          ctx,
          globalFrame: clampedFrame,
          duration: seq.duration,
          progress,
          width,
          height,
          fps,
          theme,
          timeline: this,
          interpolate,
          spring: (f, presetOrOpts) => {
            const opts = typeof presetOrOpts === 'string'
              ? { ...SPRING_PRESETS[presetOrOpts], fps }
              : { fps, ...presetOrOpts };
            return spring(f, opts);
          },
          ease: resolveEase,
        });
        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * Export manifest metadata (used by headless renderer, audio synthesizer, and QA gates).
   */
  toManifest() {
    return {
      id: this.id,
      title: this.title,
      width: this.width,
      height: this.height,
      fps: this.fps,
      bpm: this.bpm,
      durationInFrames: this.durationInFrames,
      durationSeconds: Number((this.durationInFrames / this.fps).toFixed(3)),
      sequences: this.sequences.map((s) => ({
        name: s.name,
        from: s.from,
        duration: s.duration,
        layer: s.layer,
      })),
      audioCues: this.audioCues,
    };
  }
}
