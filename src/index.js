/**
 * @file src/index.js
 * @description Public SDK Entry Point for Agent Motion Studio.
 */

export {
  cubicBezier,
  EASES,
  resolveEase,
  spring,
  SPRING_PRESETS,
  interpolate,
  createSeededRandom,
  noise1D,
} from './core/easing.js';

export { Timeline } from './core/timeline.js';

export {
  drawStudioSurface,
  drawAmbientParticles,
  drawFilmGrain,
  drawEditorialPaper,
} from './primitives/backgrounds.js';

export {
  drawKineticHeadline,
  drawOversizeSlam,
  drawAnimatedCounter,
  drawSyncedCaptions,
  roundRect,
} from './primitives/typography.js';

export {
  drawAnimatedLineChart,
  drawAnimatedBars,
  drawMathFunctionMorph,
  hexToRgba,
  blendHex,
} from './primitives/charts.js';

export {
  drawTerminalWindow,
  drawSimulatedCursor,
  drawGeometricWipe,
} from './primitives/ui-mockups.js';

export {
  project3D,
  drawSpatial3DCore,
} from './primitives/spatial3d.js';

export { compileSceneSpec } from './grammars/scene-compiler.js';
