/**
 * @file src/grammars/scene-compiler.js
 * @description Declarative JSON-to-Timeline Compiler for AI Agents.
 *
 * Allows an AI agent (Claude, GPT, Gemini, Local Ollama) to output either:
 *   Mode A: Full JavaScript/TypeScript code using `Timeline` & primitives (unlimited custom art)
 *   Mode B: A structured JSON `SceneSpec` compiled deterministically into a 60fps film!
 */

import { Timeline } from '../core/timeline.js';
import {
  drawStudioSurface,
  drawAmbientParticles,
  drawEditorialPaper,
  drawFilmGrain,
} from '../primitives/backgrounds.js';
import {
  drawKineticHeadline,
  drawOversizeSlam,
  drawAnimatedCounter,
  drawSyncedCaptions,
} from '../primitives/typography.js';
import {
  drawAnimatedLineChart,
  drawAnimatedBars,
  drawMathFunctionMorph,
} from '../primitives/charts.js';
import {
  drawTerminalWindow,
  drawSimulatedCursor,
  drawGeometricWipe,
} from '../primitives/ui-mockups.js';
import { drawSpatial3DCore } from '../primitives/spatial3d.js';

/**
 * Compile a declarative JSON spec into an executable `Timeline` instance.
 */
export function compileSceneSpec(spec) {
  const tl = new Timeline({
    id: spec.id || 'compiled-video',
    title: spec.title || spec.id || 'Agent Video',
    width: spec.width || 1920,
    height: spec.height || 1080,
    fps: spec.fps || 60,
    bpm: spec.bpm || 124,
    durationInFrames: spec.durationInFrames,
    durationSeconds: spec.durationSeconds || 12,
    theme: spec.theme || {},
  });

  // Register global virtual camera moves if provided
  if (Array.isArray(spec.cameraMoves)) {
    for (const cm of spec.cameraMoves) {
      tl.addCameraMove(cm);
    }
  }

  // Register sound cues if provided
  if (Array.isArray(spec.audioCues)) {
    for (const cue of spec.audioCues) {
      tl.addSoundCue(cue);
    }
  }

  // Compile acts / sequences
  const scenes = spec.scenes || [];
  scenes.forEach((scene, idx) => {
    const from = scene.from ?? 0;
    const duration = scene.duration ?? 180;

    // Auto-add subtle camera push if none specified so no frame is ever dead-flat (Gate G2)
    if (!spec.cameraMoves && scene.autoCamera !== false) {
      tl.addCameraMove({
        from,
        duration,
        zoom: idx % 2 === 0 ? [1.0, 1.045] : [1.045, 1.0],
        easing: 'linear',
      });
    }

    tl.addSequence({
      name: scene.name || `act-${idx + 1}`,
      from,
      duration,
      layer: scene.layer ?? idx * 10,
      render: (localFrame, info) => {
        const { ctx, width, height, theme } = info;

        // 1. Background grammar
        const bgType = scene.background?.type || 'studio';
        if (bgType === 'editorialPaper') {
          drawEditorialPaper(ctx, localFrame, { width, height, ...scene.background });
        } else if (bgType !== 'none') {
          drawStudioSurface(ctx, info.globalFrame, {
            width,
            height,
            baseColor: theme.bgPrimary,
            ...scene.background,
          });
          if (scene.background?.particles !== false) {
            drawAmbientParticles(ctx, info.globalFrame, {
              width,
              height,
              color: theme.accent,
              ...(scene.background?.particles || {}),
            });
          }
        }

        // 2. Render elements inside scene
        for (const el of scene.elements || []) {
          const elStart = el.delay || 0;
          const elFrame = localFrame - elStart;
          if (elFrame < 0) continue;
          if (el.duration && elFrame > el.duration) continue;

          switch (el.type) {
            case 'kineticHeadline':
              drawKineticHeadline(ctx, elFrame, {
                x: el.x ?? width / 2,
                y: el.y ?? height / 2,
                color: theme.ink,
                accentColor: theme.accent,
                ...el,
              });
              break;
            case 'oversizeSlam':
              drawOversizeSlam(ctx, elFrame, {
                x: el.x ?? width / 2,
                y: el.y ?? height / 2,
                color: theme.ink,
                ...el,
              });
              break;
            case 'counter':
              drawAnimatedCounter(ctx, elFrame, {
                x: el.x ?? width / 2,
                y: el.y ?? height / 2,
                color: theme.accent,
                ...el,
              });
              break;
            case 'lineChart':
              drawAnimatedLineChart(ctx, elFrame, {
                x: el.x ?? (width - (el.width || 1100)) / 2,
                y: el.y ?? (height - (el.height || 520)) / 2,
                lineColor: theme.accent,
                inkColor: theme.ink,
                ...el,
              });
              break;
            case 'barChart':
              drawAnimatedBars(ctx, elFrame, {
                x: el.x ?? (width - (el.width || 960)) / 2,
                y: el.y ?? height * 0.32,
                accentColor: theme.accent,
                inkColor: theme.ink,
                ...el,
              });
              break;
            case 'mathMorph':
              drawMathFunctionMorph(ctx, elFrame, {
                x: el.x ?? (width - (el.width || 1000)) / 2,
                y: el.y ?? (height - (el.height || 440)) / 2,
                strokeA: theme.accent,
                ...el,
              });
              break;
            case 'terminal':
              drawTerminalWindow(ctx, elFrame, {
                x: el.x ?? (width - (el.width || 1040)) / 2,
                y: el.y ?? (height - (el.height || 520)) / 2,
                ...el,
              });
              break;
            case 'cursor':
              drawSimulatedCursor(ctx, elFrame, {
                accentColor: theme.accent,
                ...el,
              });
              break;
            case 'spatial3D':
              drawSpatial3DCore(ctx, elFrame, {
                cx: el.cx ?? width / 2,
                cy: el.cy ?? height / 2,
                accentColor: theme.accent,
                ...el,
              });
              break;
            default:
              break;
          }
        }

        // 3. Transition out wipe
        if (scene.transitionOut === 'whipWipe') {
          const wipeDur = 18;
          const wipeStart = duration - wipeDur;
          if (localFrame >= wipeStart) {
            drawGeometricWipe(ctx, localFrame - wipeStart, {
              width,
              height,
              duration: wipeDur,
              color: theme.accent,
              secondaryColor: theme.bgSecondary,
            });
          }
        }
      },
    });
  });

  // Global synced captions track (top layer)
  if (Array.isArray(spec.captions) && spec.captions.length > 0) {
    tl.addSequence({
      name: 'synced-captions',
      from: 0,
      duration: tl.durationInFrames,
      layer: 900,
      render: (_local, { ctx, globalFrame, width, height, fps, theme }) => {
        drawSyncedCaptions(ctx, globalFrame / fps, {
          words: spec.captions,
          x: width / 2,
          y: height * 0.86,
          activeColor: theme.accent,
        });
      },
    });
  }

  // Global subtle anti-banding film grain (topmost layer)
  tl.addSequence({
    name: 'film-grain',
    from: 0,
    duration: tl.durationInFrames,
    layer: 999,
    render: (_local, { ctx, globalFrame, width, height }) => {
      drawFilmGrain(ctx, globalFrame, { width, height, intensity: 0.022 });
    },
  });

  return tl;
}
