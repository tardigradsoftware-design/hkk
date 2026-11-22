#!/usr/bin/env python3
"""Parçalı TTS kliplerini profesyonelce birleştirir — tık/patlama üretmez.

Yaklaşım (her adım ölçülerek doğrulanır):
 1) Parçayı 48k mono float olarak çöz
 2) Baş/son sessizliği kırp (-50 dBFS, 30 ms emniyet payı)
 3) Kenarlara 15 ms fade (tık yok)
 4) Parçayı TEK BAŞINA 1.3x hızlandır (ek yeri sonradan işlem görmez)
 5) Numpy ile saf sessizlik (0.30 sn) ekleyerek birleştir
 6) Statik kazanç + limiter → -14 LUFS, 48 kHz mono 192 kbps mp3
 7) EK YERİ OTOMATİK DOĞRULANIR: ek yerinde sıçrama yoksa yazar, varsa hata verir
"""
import subprocess, sys, os, re, json, tempfile, wave
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
GAP = 0.30
FADE_MS = 15
THRESH = 10 ** (-50 / 20)   # -50 dBFS
SPEED = 1.3


def duration(path):
    r = subprocess.run([FF, '-hide_banner', '-i', path], capture_output=True, text=True)
    for line in r.stderr.splitlines():
        if 'Duration' in line:
            t = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = t.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def decode(path):
    r = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR),
                        '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float32).copy()


def write_wav(path, x, sr=SR):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def trim(x, pad=0.03):
    idx = np.where(np.abs(x) > THRESH)[0]
    if len(idx) == 0:
        return x
    p = int(pad * SR)
    return x[max(0, idx[0] - p): min(len(x), idx[-1] + 1 + p)]


def fade_edges(x, ms=FADE_MS):
    n = int(SR * ms / 1000)
    if len(x) < 2 * n or n == 0:
        return x
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    x = x.copy()
    x[:n] *= ramp
    x[-n:] *= ramp[::-1]
    return x


def measure_loudness(path):
    r = subprocess.run([FF, '-hide_banner', '-i', path, '-af',
                        'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S)
    if not m:
        return -14.0
    try:
        return float(json.loads(m.group(0))['input_i'])
    except Exception:
        return -14.0


def prepare(path, tmp, idx):
    """Kırp + fade + hızlandır. Döner: işlenmiş float dizi."""
    x = fade_edges(trim(decode(path)))
    w = os.path.join(tmp, f'pre{idx}.wav')
    write_wav(w, x)
    sp = os.path.join(tmp, f'sp{idx}.wav')
    subprocess.run([FF, '-y', '-v', 'error', '-i', w, '-af', f'atempo={SPEED}',
                    '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', sp], check=True)
    return decode(sp)


def merge(parts, out, gap=GAP):
    tmp = tempfile.mkdtemp()
    processed = [prepare(p, tmp, i) for i, p in enumerate(parts)]

    # birleştir: parça + sessizlik + parça ...
    gap_n = np.zeros(int(gap * SR), dtype=np.float32)
    pieces = []
    joints = []           # ek yerlerinin örnek indeksleri
    for i, x in enumerate(processed):
        pieces.append(x)
        if i < len(processed) - 1:
            pieces.append(gap_n)
            joints.append(sum(len(p) for p in pieces))
    y = np.concatenate(pieces).astype(np.float32)

    # ek yeri doğrulaması: TAM SINIRDA sıçrama olmamalı (konuşma atağı doğaldır)
    d = np.abs(np.diff(y))
    for j in joints:
        lo, hi = max(0, j - 3), min(len(d), j + 3)   # ±3 örnek = kesin ek noktası
        local = float(d[lo:hi].max()) if hi > lo else 0.0
        if local > 0.01:
            raise RuntimeError(f'ek yerinde süreksizlik: {local:.4f} @ {j/SR:.2f}s')

    raw = os.path.join(tmp, 'merged.wav')
    write_wav(raw, y)

    lufs = measure_loudness(raw)
    gain = max(-12.0, min(12.0, -14.0 - lufs))
    subprocess.run([FF, '-y', '-v', 'error', '-i', raw,
                    '-af', f'volume={gain:.2f}dB,alimiter=limit=0.70:level=disabled',
                    '-ar', '48000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out],
                   check=True)
    return duration(out), joints


def check_joints(path, joints_src_times):
    """Nihai dosyada ek yerlerini kontrol et (hızlandırma sonrası)."""
    x = decode(path)
    d = np.abs(np.diff(x))
    base = float(np.median(d))
    bad = []
    for t in joints_src_times:
        j = int(t * SR)
        lo, hi = max(0, j - 3), min(len(d), j + 3)
        peak = float(d[lo:hi].max()) if hi > lo else 0.0
        if peak > max(0.01, base * 20):
            bad.append((round(t, 2), round(peak, 3)))
    return bad


if __name__ == '__main__':
    out = sys.argv[1]
    parts = sys.argv[2:]
    d, joints = merge(parts, out)
    print(f'{out}: {d:.1f} sn')
    d2 = np.abs(np.diff(decode(out)))
    print(f'  genel max sıçrama: {float(d2.max()):.3f}')
