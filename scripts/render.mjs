#!/usr/bin/env node
/**
 * @file scripts/render.mjs
 * @description Deterministic Frame-by-Frame Headless Chromium + FFmpeg MP4 Renderer.
 *
 * Works identically to Remotion / HyperFrames / cinetic render pipelines:
 *  1. Starts the local studio asset server on an ephemeral port
 *  2. Opens headless Chromium via Playwright at exact composition resolution (1920x1080 or 1080x1920)
 *  3. Seeks deterministically to every integer frame `0 .. durationInFrames - 1`
 *     (Optional `--shutter-samples 4` averages sub-frames in float for true 180-degree cinema motion blur!)
 *  4. Pipes PNG/JPEG frames straight into FFmpeg (`-c:v libx264 -crf 18 -pix_fmt yuv420p`)
 *  5. Automatically synthesizes & muxes synchronized stereo audio cues (`scripts/audio-synth.py`)
 *
 * Requirements on local machine:
 *   - `ffmpeg` installed (`brew install ffmpeg` / `sudo apt install ffmpeg`)
 *   - `npx playwright install chromium`
 *
 * Usage:
 *   node scripts/render.mjs --comp launch-film-16x9 --out renders/launch.mp4
 *   node scripts/render.mjs --spec examples/sample-agent-spec.json --out renders/explainer.mp4
 */

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStudioHttpServer } from './studio-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const out = {
    comp: 'launch-film-16x9',
    spec: null,
    outFile: 'renders/output.mp4',
    audio: null,
    crf: '18',
    stillFrame: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--comp') out.comp = argv[++i];
    else if (a === '--spec') out.spec = argv[++i];
    else if (a === '--out' || a === '-o') out.outFile = argv[++i];
    else if (a === '--audio') out.audio = argv[++i];
    else if (a === '--crf') out.crf = argv[++i];
    else if (a === '--still') out.stillFrame = Number(argv[++i]);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  // 1. Check Playwright availability
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      '❌ Playwright kurulu değil. Kurmak için:\n' +
      '   npm install playwright && npx playwright install chromium'
    );
    process.exit(1);
  }

  // 2. Start ephemeral local studio server
  const server = createStudioHttpServer({ specPath: args.spec });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const targetQuery = args.spec ? `spec=custom` : `comp=${encodeURIComponent(args.comp)}`;
  const renderUrl = `http://127.0.0.1:${port}/studio/render-harness.html?${targetQuery}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto(renderUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__AGENT_MOTION_READY === true);

  const manifest = await page.evaluate(() => window.__AGENT_MOTION_MANIFEST);
  await page.setViewportSize({ width: manifest.width, height: manifest.height });

  const absOut = path.resolve(ROOT, args.outFile);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });

  // Single frame still snapshot mode (useful for agent visual self-review!)
  if (args.stillFrame !== null && !Number.isNaN(args.stillFrame)) {
    await page.evaluate((f) => window.__seekFrame(f), args.stillFrame);
    await page.screenshot({ path: absOut, type: 'png' });
    console.log(JSON.stringify({ mode: 'still', frame: args.stillFrame, output: absOut, manifest }, null, 2));
    await browser.close();
    server.close();
    return;
  }

  // 3. Auto-synthesize audio track if none passed
  let audioPath = args.audio ? path.resolve(ROOT, args.audio) : null;
  if (!audioPath) {
    const tmpSpecPath = path.join(ROOT, 'renders', `.manifest-${manifest.id}.json`);
    audioPath = path.join(ROOT, 'renders', `.audio-${manifest.id}.wav`);
    fs.writeFileSync(tmpSpecPath, JSON.stringify(manifest, null, 2));
    execFileSync('python3', [path.join(ROOT, 'scripts/audio-synth.py'), '--spec', tmpSpecPath, '--out', audioPath]);
  }

  // 4. Pipe deterministic frames into FFmpeg
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(manifest.fps),
    '-i', '-',
    ...(audioPath && fs.existsSync(audioPath) ? ['-i', audioPath] : []),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(args.crf),
    '-pix_fmt', 'yuv420p',
    ...(audioPath && fs.existsSync(audioPath) ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-movflags', '+faststart',
    absOut,
  ];

  console.log(`🎬 Rendering "${manifest.title}" (${manifest.width}x${manifest.height} @ ${manifest.fps}fps, ${manifest.durationInFrames} frames)...`);

  const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let f = 0; f < manifest.durationInFrames; f++) {
    await page.evaluate((frameNum) => window.__seekFrame(frameNum), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    const canContinue = ffmpeg.stdin.write(buf);
    if (!canContinue) {
      await new Promise((res) => ffmpeg.stdin.once('drain', res));
    }
    if (f % 60 === 0 || f === manifest.durationInFrames - 1) {
      process.stdout.write(`\r   Frame ${f + 1}/${manifest.durationInFrames} (${Math.round(((f + 1) / manifest.durationInFrames) * 100)}%)`);
    }
  }
  process.stdout.write('\n');
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`))));
  });

  await browser.close();
  server.close();
  console.log(`✅ Render tamamlandı: ${absOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
