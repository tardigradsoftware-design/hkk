import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FPS = 60;
const SUBFRAMES = 3;
const DURATION = 30.0;
const TOTAL_FRAMES = FPS * DURATION; // 1800
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

async function main() {
  const mode = process.argv.includes('--beats') ? 'beats' : 'full';
  const outDir = mode === 'beats' ? 'frames_beats' : 'frames_sub';
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  await page.goto('file://' + path.resolve('index.html'));

  if (mode === 'beats') {
    // 1 frame per beat (50 beats at 100 BPM)
    for (let b = 0; b < 50; b++) {
      const t = b * 0.6;
      await page.evaluate((time) => window.seek(time), t);
      await page.screenshot({ path: `${outDir}/beat_${String(b).padStart(2, '0')}.png` });
    }
    console.log('Rendered 50 beat frames to', outDir);
  } else {
    let idx = 0;
    for (let f = 0; f < TOTAL_FRAMES; f++) {
      for (let s = 0; s < SUBFRAMES; s++) {
        const t = (f + s / SUBFRAMES) / FPS;
        await page.evaluate((time) => window.seek(time), t);
        await page.screenshot({ path: `${outDir}/sub_${String(idx).padStart(5, '0')}.png` });
        idx++;
      }
    }
    console.log('Rendered', idx, 'subframes. Blending with ffmpeg tmix and muxing soundtrack.wav...');
    execSync(
      `${FFMPEG} -y -framerate ${FPS * SUBFRAMES} -i ${outDir}/sub_%05d.png -i soundtrack.wav ` +
      `-vf "tmix=frames=3:weights='1 1 1',fps=${FPS}" -c:v libx264 -pix_fmt yuv420p -crf 16 ` +
      `-c:a aac -b:a 192k -shortest negroni_1080x1080.mp4`,
      { stdio: 'inherit' }
    );
    console.log('Done: negroni_1080x1080.mp4');
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
