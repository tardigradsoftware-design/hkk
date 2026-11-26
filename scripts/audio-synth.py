#!/usr/bin/env python3
"""
scripts/audio-synth.py
Procedural Zero-API-Key Sound Effects & Beat-Locked Ambient Bed Synthesizer.

Inspired by `earshot` (Leonxlnx/earshot) & `mg-styles-15` (mgaudio):
Reads a composition manifest or JSON spec's `audioCues` array and synthesizes a
crystal-clear 48kHz stereo WAV soundtrack using pure Python standard library (`math`, `wave`, `struct`)!
Works everywhere with ZERO paid API keys and ZERO external Python packages required.

Usage:
  python3 scripts/audio-synth.py --spec examples/sample-agent-spec.json --out out/soundtrack.wav
"""

import argparse
import json
import math
import os
import random
import struct
import wave

SAMPLE_RATE = 48000


def clamp(val: float, lo: float = -0.98, hi: float = 0.98) -> float:
    return max(lo, min(hi, val))


def synth_cue(cue_type: str, pitch: float = 1.0, seed: int = 42) -> list[tuple[float, float]]:
    """Synthesize stereo (L, R) samples for a single motion design sound effect."""
    rng = random.Random(seed)
    samples: list[tuple[float, float]] = []

    if cue_type == "subHit":
        # Deep cinematic sub-bass impact drop (95Hz -> 34Hz pitch envelope + crisp transient click)
        dur = 0.85
        n = int(SAMPLE_RATE * dur)
        phase = 0.0
        for i in range(n):
            t = i / SAMPLE_RATE
            freq = (34.0 + 68.0 * math.exp(-t * 14.0)) * pitch
            phase += 2.0 * math.pi * freq / SAMPLE_RATE
            sub = math.sin(phase) * math.exp(-t * 4.2)
            click = (rng.uniform(-1, 1) * math.exp(-t * 95.0)) * 0.35
            s = math.tanh((sub * 1.25 + click) * 1.1) * 0.85
            samples.append((s, s))

    elif cue_type == "whoosh":
        # Filtered noise air-whoosh with stereo pan movement (left -> right)
        dur = 0.42
        n = int(SAMPLE_RATE * dur)
        lp = 0.0
        for i in range(n):
            t = i / SAMPLE_RATE
            u = t / dur
            env = math.sin(math.pi * u) ** 1.8
            cutoff = 0.04 + 0.28 * math.sin(math.pi * u) * pitch
            white = rng.uniform(-1.0, 1.0)
            lp = lp + cutoff * (white - lp)
            pan = 0.25 + 0.5 * u
            s = lp * env * 1.6
            samples.append((s * (1.0 - pan * 0.4), s * (0.6 + pan * 0.4)))

    elif cue_type == "shutter":
        # Snappy mechanical camera/whip transition double-transient
        dur = 0.22
        n = int(SAMPLE_RATE * dur)
        for i in range(n):
            t = i / SAMPLE_RATE
            hit1 = math.sin(2 * math.pi * 220 * pitch * t) * math.exp(-t * 55.0)
            hit2 = math.sin(2 * math.pi * 340 * pitch * max(0.0, t - 0.045)) * math.exp(-max(0.0, t - 0.045) * 65.0) if t >= 0.045 else 0.0
            noise = rng.uniform(-1, 1) * math.exp(-t * 70.0) * 0.4
            s = (hit1 + hit2 * 0.8 + noise) * 0.7
            samples.append((s, s * 0.95))

    elif cue_type == "uiClick":
        # Tactile Apple-style subtle UI tap
        dur = 0.09
        n = int(SAMPLE_RATE * dur)
        for i in range(n):
            t = i / SAMPLE_RATE
            body = math.sin(2 * math.pi * 1150 * pitch * t) * math.exp(-t * 85.0)
            top = math.sin(2 * math.pi * 2900 * pitch * t) * math.exp(-t * 140.0) * 0.45
            s = (body + top) * 0.65
            samples.append((s, s))

    elif cue_type == "pop":
        # Upward pitch-bent bubble/badge pop
        dur = 0.14
        n = int(SAMPLE_RATE * dur)
        phase = 0.0
        for i in range(n):
            t = i / SAMPLE_RATE
            freq = (320 + 460 * (1.0 - math.exp(-t * 32.0))) * pitch
            phase += 2 * math.pi * freq / SAMPLE_RATE
            s = math.sin(phase) * math.exp(-t * 26.0) * 0.65
            samples.append((s, s))

    elif cue_type == "riser":
        # Tension shimmer rise before a big metric or reveal
        dur = 0.95
        n = int(SAMPLE_RATE * dur)
        phase = 0.0
        for i in range(n):
            t = i / SAMPLE_RATE
            u = t / dur
            freq = (180 + 540 * (u ** 2.1)) * pitch
            phase += 2 * math.pi * freq / SAMPLE_RATE
            env = (u ** 1.7) * math.sin(math.pi * min(1.0, u * 1.04))
            s = math.sin(phase) * env * 0.45
            samples.append((s * 0.9, s))

    elif cue_type == "chime":
        # Warm harmonic fifth bell chime (C5 + G5 + E6)
        dur = 1.25
        n = int(SAMPLE_RATE * dur)
        freqs = [523.25 * pitch, 783.99 * pitch, 1318.5 * pitch]
        weights = [0.55, 0.30, 0.15]
        for i in range(n):
            t = i / SAMPLE_RATE
            val = sum(w * math.sin(2 * math.pi * f * t) * math.exp(-t * (3.2 + idx * 1.5))
                      for idx, (f, w) in enumerate(zip(freqs, weights)))
            samples.append((val * 0.72, val * 0.76))

    else:
        # Default subtle tick
        dur = 0.05
        n = int(SAMPLE_RATE * dur)
        for i in range(n):
            t = i / SAMPLE_RATE
            s = math.sin(2 * math.pi * 1600 * t) * math.exp(-t * 120.0) * 0.4
            samples.append((s, s))

    return samples


def generate_soundtrack(spec: dict, out_path: str, include_bed: bool = True) -> dict:
    fps = float(spec.get("fps", 60))
    bpm = float(spec.get("bpm", 120))
    duration_sec = float(spec.get("durationSeconds") or (spec.get("durationInFrames", 600) / fps))
    total_samples = int(math.ceil(duration_sec * SAMPLE_RATE))

    mix_l = [0.0] * total_samples
    mix_r = [0.0] * total_samples

    # 1. Subtle warm rhythmic ambient pulse bed locked to BPM (restrained, -22dB under voice/SFX)
    if include_bed:
        beat_sec = 60.0 / bpm
        for i in range(total_samples):
            t = i / SAMPLE_RATE
            fade_in = min(1.0, t / 0.6)
            fade_out = min(1.0, max(0.0, (duration_sec - t) / 0.9))
            beat_phase = (t % beat_sec) / beat_sec
            pulse = math.exp(-beat_phase * 5.5) * 0.075
            drone = (
                math.sin(2 * math.pi * 110.0 * t) * 0.045
                + math.sin(2 * math.pi * 164.81 * t) * 0.032
                + math.sin(2 * math.pi * 220.0 * t + math.sin(t * 0.8) * 0.3) * 0.025
            )
            bed_val = (drone + pulse * math.sin(2 * math.pi * 55.0 * t)) * fade_in * fade_out
            mix_l[i] += bed_val
            mix_r[i] += bed_val * 0.96

    # 2. Place frame-exact SFX cues
    cues = spec.get("audioCues", [])
    placed = 0
    for idx, cue in enumerate(cues):
        frame = float(cue.get("frame", 0))
        start_sec = cue.get("timeSeconds", frame / fps)
        start_idx = max(0, int(start_sec * SAMPLE_RATE))
        gain = float(cue.get("gain", 0.8))
        pitch = float(cue.get("pitch", 1.0))
        cue_samples = synth_cue(cue.get("type", "tick"), pitch=pitch, seed=100 + idx)

        for j, (sl, sr) in enumerate(cue_samples):
            pos = start_idx + j
            if pos >= total_samples:
                break
            mix_l[pos] += sl * gain
            mix_r[pos] += sr * gain
        placed += 1

    # 3. Soft limiter & -1 dBTP peak safety
    peak = max(1e-6, max(max(abs(x) for x in mix_l), max(abs(x) for x in mix_r)))
    target_ceiling = 0.89  # ~ -1.0 dBTP
    scale = min(1.0, target_ceiling / peak)

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with wave.open(out_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        buf = bytearray(total_samples * 4)
        for i in range(total_samples):
            li = int(clamp(mix_l[i] * scale) * 32767)
            ri = int(clamp(mix_r[i] * scale) * 32767)
            struct.pack_into("<hh", buf, i * 4, li, ri)
        wf.writeframes(buf)

    return {
        "output": out_path,
        "durationSeconds": round(duration_sec, 3),
        "sampleRate": SAMPLE_RATE,
        "cuesPlaced": placed,
        "peakBeforeLimiter": round(peak, 4),
    }


def main():
    parser = argparse.ArgumentParser(description="Synthesize frame-accurate WAV soundtrack from video spec")
    parser.add_argument("--spec", required=True, help="Path to JSON scene spec or manifest")
    parser.add_argument("--out", default="out/soundtrack.wav", help="Output WAV path")
    parser.add_argument("--no-bed", action="store_true", help="Disable ambient BPM drone bed")
    args = parser.parse_args()

    with open(args.spec, "r", encoding="utf-8") as f:
        spec = json.load(f)

    report = generate_soundtrack(spec, args.out, include_bed=not args.no_bed)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
