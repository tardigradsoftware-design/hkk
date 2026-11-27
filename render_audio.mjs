// Generates a 30.0s, 44.1kHz stereo 16-bit PCM WAV soundtrack at 100 BPM
// with light percussive music + synchronized cocktail foley.
import fs from 'fs';

const SR = 44100;
const DURATION = 30.0;
const SAMPLES = Math.floor(SR * DURATION);
const BPM = 100;
const BEAT = 60 / BPM; // 0.6s

const left = new Float32Array(SAMPLES);
const right = new Float32Array(SAMPLES);

function addSample(idx, l, r) {
  if (idx >= 0 && idx < SAMPLES) {
    left[idx] += l;
    right[idx] += r;
  }
}

// 1. Light percussive music: marimba/plucked notes on 8th-notes + soft kick on beats + brushed hat on half-beats
const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C major pentatonic
for (let beat = 0; beat < 50; beat++) {
  const t0 = beat * BEAT;
  const s0 = Math.floor(t0 * SR);

  // Soft kick on every beat
  for (let i = 0; i < SR * 0.18; i++) {
    const t = i / SR;
    const freq = 110 * Math.exp(-28 * t) + 45;
    const env = Math.exp(-16 * t) * 0.28;
    const v = Math.sin(2 * Math.PI * freq * t) * env;
    addSample(s0 + i, v, v);
  }

  // Brushed hi-hat on half-beats
  const sHalf = Math.floor((t0 + BEAT * 0.5) * SR);
  for (let i = 0; i < SR * 0.06; i++) {
    const t = i / SR;
    const env = Math.exp(-65 * t) * 0.08;
    const n = (Math.random() * 2 - 1) * env;
    addSample(sHalf + i, n * 0.9, n * 1.1);
  }

  // Marimba pluck on beats
  const note = scale[(beat * 2 + (beat % 3)) % scale.length];
  const pan = (beat % 2 === 0) ? 0.35 : 0.65;
  for (let i = 0; i < SR * 0.35; i++) {
    const t = i / SR;
    const env = Math.exp(-12 * t) * 0.14;
    const v = (Math.sin(2 * Math.PI * note * t) + 0.3 * Math.sin(4 * Math.PI * note * t)) * env;
    addSample(s0 + i, v * (1 - pan), v * pan);
  }
}

// 2. Foley: Ice Clink at t = 0.9s
{
  const s0 = Math.floor(0.9 * SR);
  const freqs = [1420, 2180, 3310];
  for (let i = 0; i < SR * 0.4; i++) {
    const t = i / SR;
    const env = Math.exp(-18 * t) * 0.22;
    let v = 0;
    for (const f of freqs) v += Math.sin(2 * Math.PI * f * t);
    addSample(s0 + i, v * env * 0.5, v * env * 0.5);
  }
}

// 3. Foley: Liquid Pours (2.4-4.3s, 4.8-6.7s, 7.2-9.1s)
function addPour(tStart, tEnd) {
  const s0 = Math.floor(tStart * SR);
  const len = Math.floor((tEnd - tStart) * SR);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const p = i / len;
    const env = Math.sin(Math.PI * p) * 0.14;
    const white = Math.random() * 2 - 1;
    // Rising resonant filter feel
    const alpha = 0.08 + 0.12 * p;
    lp = lp + alpha * (white - lp);
    const bubble = Math.sin(2 * Math.PI * (320 + 280 * p) * t) * 0.03 * env;
    addSample(s0 + i, lp * env + bubble, lp * env - bubble);
  }
}
addPour(2.4, 4.3);
addPour(4.8, 6.7);
addPour(7.2, 9.1);

// 4. Foley: Stirring glass chimes (9.6s - 16.2s)
for (let tStir = 9.8; tStir < 16.0; tStir += 0.3) {
  const s0 = Math.floor(tStir * SR);
  const f = 2600 + (Math.random() * 400);
  for (let i = 0; i < SR * 0.15; i++) {
    const t = i / SR;
    const env = Math.exp(-32 * t) * 0.07;
    const v = Math.sin(2 * Math.PI * f * t) * env;
    addSample(s0 + i, v, v);
  }
}

// 5. Foley: Citrus snap / mist at t = 17.1s
{
  const s0 = Math.floor(17.1 * SR);
  for (let i = 0; i < SR * 0.25; i++) {
    const t = i / SR;
    const env = Math.exp(-24 * t) * 0.18;
    const n = (Math.random() * 2 - 1) * env;
    addSample(s0 + i, n, n);
  }
}

// Write 16-bit PCM WAV
const buffer = Buffer.alloc(44 + SAMPLES * 4);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + SAMPLES * 4, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(2, 22); // Stereo
buffer.writeUInt32LE(SR, 24);
buffer.writeUInt32LE(SR * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(SAMPLES * 4, 40);

for (let i = 0; i < SAMPLES; i++) {
  const l = Math.max(-1, Math.min(1, left[i]));
  const r = Math.max(-1, Math.min(1, right[i]));
  buffer.writeInt16LE(Math.floor(l * 32767), 44 + i * 4);
  buffer.writeInt16LE(Math.floor(r * 32767), 44 + i * 4 + 2);
}

fs.writeFileSync('soundtrack.wav', buffer);
console.log('Generated soundtrack.wav (' + (buffer.length / 1024 / 1024).toFixed(2) + ' MB)');
