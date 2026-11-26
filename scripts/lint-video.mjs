#!/usr/bin/env node
/**
 * @file scripts/lint-video.mjs
 * @description Automated Anti-Slop & Motion Quality Gate (Gates G0–G5).
 *
 * Inspired by `motionmaxxing` (G0–G5), `Remocn` Craft Bans, and `cinetic` `lint-film`:
 * Inspects a JSON SceneSpec or composition source file BEFORE spending render compute,
 * catching common AI-video mistakes automatically so the agent fixes them immediately.
 *
 * Usage:
 *   node scripts/lint-video.mjs examples/sample-agent-spec.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { compileSceneSpec } from '../src/grammars/scene-compiler.js';

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Usage: node scripts/lint-video.mjs <path-to-spec.json-or-source.js>');
  process.exit(1);
}

const fullPath = path.resolve(targetPath);
const raw = fs.readFileSync(fullPath, 'utf-8');
const issues = [];
const warnings = [];

// Gate G5 (Source Determinism Check): Ban Math.random() & Date.now() in animation files
if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
  if (/\bMath\.random\s*\(/.test(raw)) {
    issues.push('[G0-DETERMINISM] `Math.random()` bulundu! Her render aynı kareyi üretmeli. `createSeededRandom(seed)` kullanın.');
  }
  if (/\bDate\.now\s*\(|\bperformance\.now\s*\(/.test(raw)) {
    issues.push('[G0-DETERMINISM] Gerçek zaman saati (`Date.now` / `performance.now`) bulundu! Sadece `frame` parametresini kullanın.');
  }
}

if (fullPath.endsWith('.json')) {
  let spec;
  try {
    spec = JSON.parse(raw);
  } catch (err) {
    console.error(JSON.stringify({ passed: false, error: `Geçersiz JSON: ${err.message}` }, null, 2));
    process.exit(1);
  }

  const tl = compileSceneSpec(spec);
  const fps = tl.fps;
  const scenes = spec.scenes || [];

  // Gate G0: Valid duration & non-empty scenes
  if (scenes.length === 0) {
    issues.push('[G0-EMPTY] Hiç sahne (`scenes`) tanımlanmamış.');
  }

  // Gate G1: Readable Proof & Copy Length (cinetic 2-7 words / line rule)
  scenes.forEach((sc, idx) => {
    for (const el of sc.elements || []) {
      if (el.type === 'kineticHeadline' && el.text) {
        const lines = Array.isArray(el.text) ? el.text : String(el.text).split('\n');
        if (lines.length > 3) {
          issues.push(`[G1-COPY] Sahne "${sc.name || idx}" içinde ${lines.length} satır başlık var (maksimum 3 satır olmalı, slayt duvarı yapmayın).`);
        }
        lines.forEach((ln) => {
          const wc = ln.trim().split(/\s+/).filter(Boolean).length;
          if (wc > 8) {
            warnings.push(`[G1-COPY] "${ln}" satırı ${wc} kelime içeriyor. Sinematik etki için satır başına 2–7 kelime önerilir.`);
          }
        });
        if (el.fontSize && el.fontSize < tl.height * 0.036) {
          issues.push(`[G1-READABILITY] Başlık fontSize (${el.fontSize}px) ekran yüksekliğinin %3.6'sından küçük — mobilde okunamaz.`);
        }
      }
    }
  });

  // Gate G2: No Uncovered Timeline Gaps (black/dead frame detector)
  for (let f = 0; f < tl.durationInFrames; f += 5) {
    const active = scenes.some((sc) => f >= (sc.from ?? 0) && f < (sc.from ?? 0) + (sc.duration ?? 0));
    if (!active) {
      issues.push(`[G2-DEAD-FRAMES] Kare ${f} (${(f / fps).toFixed(2)}s) hiçbir sahne tarafından kapsanmıyor (siyah boşluk oluşur)!`);
      break;
    }
  }

  // Gate G3: End Card Duration Check
  if (scenes.length > 1) {
    const lastScene = scenes[scenes.length - 1];
    const ratio = (lastScene.duration || 0) / tl.durationInFrames;
    if (ratio > 0.40) {
      warnings.push(`[G3-END-HOLD] Son sahne videonun %${Math.round(ratio * 100)}'ini kaplıyor (%25-35 arası tutmak izleyici tutma oranını artırır).`);
    }
  }

  // Gate G4: Single Hero Per Frame (prevent crowded multi-widget slide slop)
  scenes.forEach((sc, idx) => {
    const heavyTypes = ['lineChart', 'barChart', 'terminal', 'mathMorph'];
    const heavyCount = (sc.elements || []).filter((e) => heavyTypes.includes(e.type)).length;
    if (heavyCount > 1) {
      issues.push(`[G4-SINGLE-HERO] Sahne "${sc.name || idx}" aynı anda ${heavyCount} ağır bileşen gösteriyor. Her sahnede TEK bir odak kahraman (Single Hero) olmalı.`);
    }
  });
}

const passed = issues.length === 0;
const result = {
  file: path.basename(fullPath),
  passed,
  gatesChecked: ['G0-Determinism', 'G1-Readability-Copy', 'G2-Zero-Dead-Frames', 'G3-Pacing', 'G4-Single-Hero'],
  issues,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
process.exit(passed ? 0 : 1);
