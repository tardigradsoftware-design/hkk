/**
 * @file examples/showcase-compositions.js
 * @description 4 Production-Ready Reference Compositions demonstrating All-In-One YouTube Capabilities:
 *  1. `launch-film-16x9`    : Cinematic Product / AI Launch Film (Kinetic Type + Terminal UI + Whip Cuts)
 *  2. `vox-explainer-16x9`  : Editorial Data Visualization Explainer (Paper Ground + Spline Chart + Callouts)
 *  3. `shorts-reel-9x16`    : Vertical 9:16 YouTube Shorts / Reels with Word-Synced Captions & Benchmark Bars
 *  4. `math-3d-16x9`        : 3Blue1Brown Wave Morph + 3D Spatial Geodesic Core
 */

import { Timeline } from '../src/core/timeline.js';
import {
  drawStudioSurface,
  drawAmbientParticles,
  drawEditorialPaper,
  drawFilmGrain,
} from '../src/primitives/backgrounds.js';
import {
  drawKineticHeadline,
  drawOversizeSlam,
  drawAnimatedCounter,
  drawSyncedCaptions,
} from '../src/primitives/typography.js';
import {
  drawAnimatedLineChart,
  drawAnimatedBars,
  drawMathFunctionMorph,
} from '../src/primitives/charts.js';
import {
  drawTerminalWindow,
  drawSimulatedCursor,
  drawGeometricWipe,
} from '../src/primitives/ui-mockups.js';
import { drawSpatial3DCore } from '../src/primitives/spatial3d.js';

/**
 * 1. Cinematic Product / AI Launch Film (1920x1080 @ 60fps, 12s = 720 frames)
 */
export function createLaunchFilm() {
  const tl = new Timeline({
    id: 'launch-film-16x9',
    title: 'Sinematik Ürün & Ajan Tanıtım Filmi (16:9)',
    width: 1920,
    height: 1080,
    fps: 60,
    bpm: 128,
    durationSeconds: 12,
    theme: {
      bgPrimary: '#07090F',
      bgSecondary: '#0E1525',
      ink: '#F8FAFC',
      accent: '#38BDF8',
    },
  });

  // Camera breathes continuously across all 4 acts (passes Gate G2: 0 dead flat frames)
  tl.addCameraMove({ from: 0, duration: 180, zoom: [1.06, 1.0], easing: 'softLand' });
  tl.addCameraMove({ from: 180, duration: 220, zoom: [1.0, 1.05], x: [0, 18], easing: 'silkInOut' });
  tl.addCameraMove({ from: 400, duration: 180, zoom: [1.04, 1.0], x: [-16, 0], easing: 'softLand' });
  tl.addCameraMove({ from: 580, duration: 140, zoom: [1.0, 1.03], easing: 'crispDecel' });

  // Frame-accurate procedural audio cues
  tl.addSoundCue({ frame: 2, type: 'subHit', gain: 0.9, note: 'Act 1 Hero Slam' });
  tl.addSoundCue({ frame: 28, type: 'whoosh', gain: 0.65, note: 'Subtitle reveal' });
  tl.addSoundCue({ frame: 172, type: 'shutter', gain: 0.75, note: 'Whip transition to Terminal' });
  tl.addSoundCue({ frame: 235, type: 'uiClick', gain: 0.7, note: 'Cursor executes CLI' });
  tl.addSoundCue({ frame: 392, type: 'whoosh', gain: 0.75, note: 'Transition to Metrics' });
  tl.addSoundCue({ frame: 410, type: 'riser', gain: 0.6, note: 'Counter climb' });
  tl.addSoundCue({ frame: 575, type: 'subHit', gain: 0.95, note: 'Final Lockup Hit' });

  // ACT 1 (0..180f / 0..3s): Clear promise in <3 seconds
  tl.addSequence({
    name: 'act1-promise',
    from: 0,
    duration: 185,
    layer: 10,
    render: (f, { ctx, width, height, globalFrame }) => {
      drawStudioSurface(ctx, globalFrame, {
        width,
        height,
        keyColor: 'rgba(56, 189, 248, 0.20)',
        rimColor: 'rgba(99, 102, 241, 0.12)',
      });
      drawAmbientParticles(ctx, globalFrame, { width, height, count: 42, color: '#38BDF8' });

      drawKineticHeadline(ctx, f, {
        text: ['Kod yazan ajanın', 'sinematik film stüdyosu.'],
        x: width / 2,
        y: height / 2,
        fontSize: 92,
        accentWord: 'sinematik',
        accentColor: '#38BDF8',
        exitStart: 152,
      });

      if (f >= 166) {
        drawGeometricWipe(ctx, f - 166, { width, height, duration: 19, color: '#38BDF8' });
      }
    },
  });

  // ACT 2 (180..400f / 3..6.6s): Real product proof (Terminal + Cursor action)
  tl.addSequence({
    name: 'act2-terminal-proof',
    from: 180,
    duration: 225,
    layer: 20,
    render: (f, { ctx, width, height, globalFrame }) => {
      drawStudioSurface(ctx, globalFrame, {
        width,
        height,
        keyPosition: [0.35, 0.3],
        keyColor: 'rgba(16, 185, 129, 0.15)',
      });

      drawKineticHeadline(ctx, f, {
        text: 'Tek komutla deterministik 60 FPS',
        x: width / 2,
        y: 138,
        fontSize: 52,
        accentWord: 'deterministik',
        accentColor: '#10B981',
      });

      drawTerminalWindow(ctx, f, {
        x: (width - 1120) / 2,
        y: 235,
        width: 1120,
        height: 540,
        title: 'claude-code — agent-motion-studio',
      });

      drawSimulatedCursor(ctx, f, {
        fromPos: [1480, 860],
        toPos: [620, 340],
        moveStart: 12,
        moveDuration: 36,
        clickFrame: 52,
        accentColor: '#10B981',
      });

      if (f >= 206) {
        drawGeometricWipe(ctx, f - 206, { width, height, duration: 19, color: '#38BDF8' });
      }
    },
  });

  // ACT 3 (400..580f / 6.6..9.6s): Measured Impact Metric
  tl.addSequence({
    name: 'act3-speed-metric',
    from: 400,
    duration: 185,
    layer: 30,
    render: (f, { ctx, width, height, globalFrame }) => {
      drawStudioSurface(ctx, globalFrame, {
        width,
        height,
        keyPosition: [0.5, 0.45],
        keyColor: 'rgba(56, 189, 248, 0.22)',
      });
      drawSpatial3DCore(ctx, f, {
        cx: width * 0.27,
        cy: height * 0.52,
        radius: 1.25,
        accentColor: '#38BDF8',
      });

      drawAnimatedCounter(ctx, f, {
        from: 0,
        to: 100,
        suffix: '%',
        x: width * 0.65,
        y: height * 0.50,
        fontSize: 156,
        durationFrames: 52,
        color: '#38BDF8',
        label: 'AÇIK KAYNAK · SIFIR LİSANS ÜCRETİ',
      });
    },
  });

  // ACT 4 (580..720f / 9.6..12s): Resolved Short End Hold (passes Gate G3 <= 1.4s hold)
  tl.addSequence({
    name: 'act4-end-lockup',
    from: 580,
    duration: 140,
    layer: 40,
    render: (f, { ctx, width, height, globalFrame }) => {
      drawStudioSurface(ctx, globalFrame, {
        width,
        height,
        keyPosition: [0.5, 0.5],
        keyColor: 'rgba(56, 189, 248, 0.24)',
        gridOpacity: 0.03,
      });
      drawOversizeSlam(ctx, f, {
        text: 'AGENT MOTION',
        x: width / 2,
        y: height * 0.46,
        fontSize: 124,
        color: '#F8FAFC',
        fromScale: 1.9,
        durationFrames: 18,
      });
      drawKineticHeadline(ctx, Math.max(0, f - 14), {
        text: 'YouTube Otomasyonu İçin Hazır.',
        x: width / 2,
        y: height * 0.62,
        fontSize: 44,
        accentWord: 'Hazır.',
        accentColor: '#38BDF8',
      });
    },
  });

  // Subtle top-level grain
  tl.addSequence({
    name: 'grain',
    from: 0,
    duration: tl.durationInFrames,
    layer: 999,
    render: (_f, { ctx, width, height, globalFrame }) => {
      drawFilmGrain(ctx, globalFrame, { width, height, intensity: 0.024 });
    },
  });

  return tl;
}

/**
 * 2. Vox / Editorial Documentary Data Explainer (1920x1080 @ 60fps, 8s = 480 frames)
 */
export function createVoxExplainer() {
  const tl = new Timeline({
    id: 'vox-explainer-16x9',
    title: 'Vox & Kurzgesagt Tarzı Veri Anlatımı (16:9)',
    width: 1920,
    height: 1080,
    fps: 60,
    bpm: 112,
    durationSeconds: 8,
    theme: {
      bgPrimary: '#F4F1EA',
      ink: '#111827',
      accent: '#E11D48',
    },
  });

  tl.addCameraMove({ from: 0, duration: 480, zoom: [1.0, 1.045], x: [0, 14], easing: 'silkInOut' });
  tl.addSoundCue({ frame: 6, type: 'pop', gain: 0.7, note: 'Editorial title' });
  tl.addSoundCue({ frame: 72, type: 'chime', gain: 0.85, note: 'Peak data callout' });

  tl.addSequence({
    name: 'vox-chart-scene',
    from: 0,
    duration: 480,
    layer: 10,
    render: (f, { ctx, width, height, globalFrame }) => {
      drawEditorialPaper(ctx, globalFrame, { width, height });

      drawKineticHeadline(ctx, f, {
        text: 'Kod Tabanlı Video Üretiminin Yükselişi',
        x: width / 2,
        y: 120,
        fontSize: 60,
        color: '#0F172A',
        accentWord: 'Yükselişi',
        accentColor: '#E11D48',
      });

      drawAnimatedLineChart(ctx, Math.max(0, f - 10), {
        x: 310,
        y: 220,
        width: 1300,
        height: 680,
        data: [12, 19, 28, 46, 82, 145, 240],
        labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
        title: 'Ajan Destekli Render Endeksi (Baz = 2020)',
        unit: 'x',
        lineColor: '#E11D48',
        inkColor: '#0F172A',
        mutedColor: '#475569',
        gridColor: 'rgba(15, 23, 42, 0.12)',
        highlightIndex: 6,
        highlightNote: '2026: +240x Büyüme',
      });
    },
  });

  return tl;
}

/**
 * 3. Vertical YouTube Shorts / Reels (1080x1920 @ 60fps, 8s = 480 frames)
 * Includes Whisper/Edge-TTS style word-level synced captions!
 */
export function createShortsReel() {
  const tl = new Timeline({
    id: 'shorts-reel-9x16',
    title: 'YouTube Shorts / Reels Kelime Senkronlu Altyazı (9:16)',
    width: 1080,
    height: 1920,
    fps: 60,
    bpm: 130,
    durationSeconds: 8,
    theme: {
      bgPrimary: '#080B14',
      ink: '#FFFFFF',
      accent: '#F59E0B',
    },
  });

  tl.addCameraMove({ from: 0, duration: 480, zoom: [1.0, 1.05], handheld: 0.35, easing: 'linear' });

  const sampleWordTimestamps = [
    { word: 'Yapay', start: 0.15, end: 0.50 },
    { word: 'zeka', start: 0.50, end: 0.85 },
    { word: 'ajanları', start: 0.85, end: 1.40 },
    { word: 'artık', start: 1.40, end: 1.80 },
    { word: 'saniyeler', start: 1.90, end: 2.45 },
    { word: 'içinde', start: 2.45, end: 2.85 },
    { word: 'sinematik', start: 2.85, end: 3.50 },
    { word: 'YouTube', start: 3.50, end: 4.05 },
    { word: 'videolarını', start: 4.10, end: 4.75 },
    { word: 'kodlayıp', start: 4.75, end: 5.35 },
    { word: 'render', start: 5.35, end: 5.85 },
    { word: 'edebiliyor!', start: 5.85, end: 6.80 },
  ];

  tl.addSequence({
    name: 'shorts-main',
    from: 0,
    duration: 480,
    layer: 10,
    render: (f, { ctx, width, height, globalFrame, fps }) => {
      drawStudioSurface(ctx, globalFrame, {
        width,
        height,
        keyPosition: [0.5, 0.25],
        keyColor: 'rgba(245, 158, 11, 0.22)',
        rimColor: 'rgba(56, 189, 248, 0.14)',
      });
      drawAmbientParticles(ctx, globalFrame, { width, height, count: 32, color: '#F59E0B' });

      drawKineticHeadline(ctx, f, {
        text: ['9:16 DİKEY', 'OTOMASYON'],
        x: width / 2,
        y: 340,
        fontSize: 94,
        accentWord: 'OTOMASYON',
        accentColor: '#F59E0B',
      });

      drawAnimatedBars(ctx, Math.max(0, f - 18), {
        x: 90,
        y: 660,
        width: 900,
        rowHeight: 82,
        gap: 32,
        accentColor: '#F59E0B',
        items: [
          { label: 'Kod + Ajan', value: 96, accent: true },
          { label: 'Hazır Şablon', value: 51, accent: false },
          { label: 'Manuel Kurgu', value: 22, accent: false },
        ],
      });

      drawSyncedCaptions(ctx, globalFrame / fps, {
        words: sampleWordTimestamps,
        x: width / 2,
        y: 1480,
        wordsPerGroup: 4,
        fontSize: 54,
        activeColor: '#F59E0B',
      });
    },
  });

  return tl;
}

/**
 * 4. 3Blue1Brown Math & 3D Spatial Visualization (1920x1080 @ 60fps, 8s = 480 frames)
 */
export function createMath3DScene() {
  const tl = new Timeline({
    id: 'math-3d-16x9',
    title: '3Blue1Brown Matematiksel Dalga & 3D Uzay (16:9)',
    width: 1920,
    height: 1080,
    fps: 60,
    bpm: 120,
    durationSeconds: 8,
    theme: {
      bgPrimary: '#06080F',
      ink: '#F8FAFC',
      accent: '#38BDF8',
    },
  });

  tl.addCameraMove({ from: 0, duration: 480, zoom: [1.0, 1.035], easing: 'silkInOut' });

  tl.addSequence({
    name: 'math-and-3d',
    from: 0,
    duration: 480,
    layer: 10,
    render: (f, { ctx, width, height, globalFrame }) => {
      drawStudioSurface(ctx, globalFrame, {
        width,
        height,
        keyPosition: [0.7, 0.4],
        keyColor: 'rgba(56, 189, 248, 0.16)',
        gridSize: 48,
        gridOpacity: 0.06,
      });

      drawKineticHeadline(ctx, f, {
        text: 'Fourier Harmonik Dönüşümü & 3D Geometri',
        x: width / 2,
        y: 118,
        fontSize: 56,
        accentWord: 'Harmonik',
        accentColor: '#38BDF8',
      });

      drawMathFunctionMorph(ctx, Math.max(0, f - 12), {
        x: 110,
        y: 260,
        width: 1020,
        height: 580,
        morphStart: 90,
        morphDuration: 90,
        fnA: (x) => Math.sin(x),
        fnB: (x) => Math.sin(x) + (1 / 3) * Math.sin(3 * x) + (1 / 5) * Math.sin(5 * x),
        formulaLabel: 'f(x) = sin(x) + sin(3x)/3 + sin(5x)/5',
      });

      drawSpatial3DCore(ctx, f, {
        cx: 1510,
        cy: 550,
        radius: 1.55,
        accentColor: '#38BDF8',
        secondaryColor: '#F59E0B',
      });
    },
  });

  return tl;
}

export const SHOWCASE_COMPOSITIONS = {
  'launch-film-16x9': createLaunchFilm,
  'vox-explainer-16x9': createVoxExplainer,
  'shorts-reel-9x16': createShortsReel,
  'math-3d-16x9': createMath3DScene,
};
