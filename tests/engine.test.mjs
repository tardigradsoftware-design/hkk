import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  cubicBezier,
  EASES,
  spring,
  interpolate,
  createSeededRandom,
  Timeline,
  compileSceneSpec,
} from '../src/index.js';

test('cubicBezier and EASES stay strictly bounded and deterministic', () => {
  for (const [name, fn] of Object.entries(EASES)) {
    assert.equal(fn(0), 0, `${name}(0) must be 0`);
    assert.ok(Math.abs(fn(1) - 1) < 1e-4, `${name}(1) must be ~1`);
    const midA = fn(0.42);
    const midB = fn(0.42);
    assert.equal(midA, midB, `${name} must be deterministic`);
  }
  const linear = cubicBezier(0.25, 0.25, 0.75, 0.75);
  assert.ok(Math.abs(linear(0.5) - 0.5) < 1e-4);
});

test('analytical spring is seek-safe and settles on target', () => {
  assert.equal(spring(0, { from: 10, to: 100 }), 10);
  const f18 = spring(18, { fps: 60, stiffness: 220, damping: 20, from: 0, to: 1 });
  const f18Repeat = spring(18, { fps: 60, stiffness: 220, damping: 20, from: 0, to: 1 });
  assert.equal(f18, f18Repeat);
  const settled = spring(240, { fps: 60, stiffness: 220, damping: 20, from: 0, to: 1 });
  assert.equal(settled, 1);
});

test('interpolate clamps and applies custom eases accurately', () => {
  assert.equal(interpolate(-10, [0, 100], [50, 150]), 50);
  assert.equal(interpolate(150, [0, 100], [50, 150]), 150);
  assert.equal(interpolate(50, [0, 100], [0, 200], { easing: 'linear' }), 100);
});

test('createSeededRandom produces identical sequences across runs', () => {
  const rng1 = createSeededRandom('youtube-seed-2026');
  const rng2 = createSeededRandom('youtube-seed-2026');
  const seq1 = Array.from({ length: 10 }, () => rng1());
  const seq2 = Array.from({ length: 10 }, () => rng2());
  assert.deepEqual(seq1, seq2);
});

test('Timeline BPM grid and JSON SceneSpec compiler build valid manifests', () => {
  const raw = fs.readFileSync(new URL('../examples/sample-agent-spec.json', import.meta.url), 'utf-8');
  const spec = JSON.parse(raw);
  const tl = compileSceneSpec(spec);
  const manifest = tl.toManifest();

  assert.equal(manifest.width, 1920);
  assert.equal(manifest.height, 1080);
  assert.equal(manifest.fps, 60);
  assert.equal(manifest.durationInFrames, 540);
  assert.equal(manifest.audioCues.length, 3);
  assert.ok(tl.bar(2, 0) > tl.bar(1, 0));
});
