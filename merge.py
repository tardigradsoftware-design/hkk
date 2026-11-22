#!/usr/bin/env python3
"""Ses birleştirme hattı — v9 "orijinal ses".

Kullanıcı geri bildirimi: v6/v7/v8 hatlarında uygulanan perde kaydırma, EQ,
limiter ve loudness normalizasyonu sesin doğal tınısını bozuyordu.

Bu hat hiçbir ses işlemi uygulamaz:
  * perde kaydırma        YOK
  * EQ / tını dengeleme   YOK
  * limiter               YOK
  * loudness normalizasyonu YOK
  * parça kazanç eşitleme YOK

Yalnızca:
  1) 1.3x hız  (atempo — perde değişmez, onaylanmış sabit parametre)
  2) baş/son sessizlik kırpma + 20 ms fade (tık önleme, ses duyulmaz)
  3) parçalar arası 0.25 sn saf dijital sessizlik
  4) 48 kHz mono 192 kbps mp3

CLI:  python3 merge.py <out.mp3> <p1.mp3> [p2.mp3 ...]
"""
import subprocess, sys, os, tempfile, wave

import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()

SR = 48000            # örnekleme hızı
GAP = 0.25            # parçalar arası sessizlik (sn)
FADE_MS = 20          # kenar fade süresi (ms)
THRESH = 10 ** (-50 / 20)   # -50 dBFS sessizlik eşiği
SPEED = 1.3           # atempo — perde değişmez
JOINT_TOL = 0.010     # ek yeri süreksizlik toleransı


def duration(path):
    """mp3 süresi (sn)."""
    r = subprocess.run([FF, '-hide_banner', '-i', path], capture_output=True, text=True)
    for line in r.stderr.splitlines():
        if 'Duration' in line:
            t = line.split('Duration:')[1].split(',')[0].strip()
            h, m, s = t.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def decode(path):
    """Dosyayı 48k mono float32 diziye çöz."""
    r = subprocess.run([FF, '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR),
                        '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float32).copy()


def write_wav(path, x, sr=SR):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def trim(x, pad=0.02):
    """Baş/son sessizliği kırp, 20 ms pay bırak."""
    idx = np.where(np.abs(x) > THRESH)[0]
    if len(idx) == 0:
        return x
    p = int(pad * SR)
    return x[max(0, idx[0] - p): min(len(x), idx[-1] + 1 + p)]


def fade_edges(x, ms=FADE_MS):
    """Kenarlarda 20 ms fade — tık sesini önler, konuşmayı etkilemez."""
    n = int(SR * ms / 1000)
    if len(x) < 2 * n or n == 0:
        return x
    x = x.copy()
    ramp = np.linspace(0, 1, n, dtype=np.float32)
    x[:n] *= ramp
    x[-n:] *= ramp[::-1]
    return x


def prepare(src, tmp, idx):
    """Kırp + fade + 1.3x hız. Başka hiçbir işlem yok."""
    x = fade_edges(trim(decode(src)))
    w = os.path.join(tmp, f'a{idx}.wav')
    write_wav(w, x)
    sp = os.path.join(tmp, f'b{idx}.wav')
    subprocess.run([FF, '-y', '-v', 'error', '-i', w, '-af', f'atempo={SPEED}',
                    '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', sp], check=True)
    return decode(sp)


def merge(parts, out, gap=GAP, verbose=True):
    """Parçaları birleştir, ek yerlerini doğrula, mp3 yaz."""
    tmp = tempfile.mkdtemp()
    ch = [prepare(p, tmp, i) for i, p in enumerate(parts)]

    gap_n = np.zeros(int(gap * SR), dtype=np.float32)
    pieces, joints = [], []
    for i, x in enumerate(ch):
        pieces.append(x)
        if i < len(ch) - 1:
            pieces.append(gap_n)
            joints.append(sum(len(p) for p in pieces))

    y = np.concatenate(pieces).astype(np.float32)

    # ek yerlerinde ani sıçrama kontrolü
    d = np.abs(np.diff(y))
    for j in joints:
        lo, hi = max(0, j - 3), min(len(d), j + 3)
        local = float(d[lo:hi].max()) if hi > lo else 0.0
        if local > JOINT_TOL:
            raise RuntimeError(f'ek yerinde süreksizlik: {local:.4f} @ {j / SR:.2f}s')

    w = os.path.join(tmp, 'm.wav')
    write_wav(w, y)
    # tek geçiş: yalnızca mp3 kodlama
    subprocess.run([FF, '-y', '-v', 'error', '-i', w,
                    '-ar', '48000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out],
                   check=True)

    if verbose:
        print(f'  parça süreleri: {[round(len(c) / SR, 1) for c in ch]}')
    return duration(out), joints


def speech_rms(x):
    """Konuşma-kapılı RMS (dBFS) — ölçüm amaçlı."""
    n = int(0.04 * SR)
    f = len(x) // n
    if f < 2:
        return -70.0
    fr = x[:f * n].reshape(f, n).astype(np.float64)
    p = (fr ** 2).mean(axis=1)
    db = 10 * np.log10(p + 1e-12)
    keep = db > -45.0
    if keep.sum() < 3:
        return float(db.max())
    return float(10 * np.log10(p[keep].mean() + 1e-12))


def check_joints(path, joint_times):
    """Üretilen dosyadaki ek yerlerini doğrula. Boş liste = sorun yok."""
    x = decode(path)
    d = np.abs(np.diff(x))
    bad = []
    for t in joint_times:
        j = int(t * SR)
        lo, hi = max(0, j - 3), min(len(d), j + 3)
        peak = float(d[lo:hi].max()) if hi > lo else 0.0
        if peak > JOINT_TOL * 2:
            bad.append((round(t, 2), round(peak, 3)))
    return bad


def check_level(path, joint_times):
    """Parça seviyeleri — sadece rapor, işlem yapılmaz."""
    x = decode(path)
    b = [0] + [int(t * SR) for t in joint_times] + [len(x)]
    return [round(speech_rms(x[a:c]), 2) for a, c in zip(b[:-1], b[1:])]


if __name__ == '__main__':
    out = sys.argv[1]
    d, joints = merge(out=out, parts=sys.argv[2:])
    times = [j / SR for j in joints]
    print(f'{out}: {d:.1f} sn  ek yeri sorunu: {check_joints(out, times) or "yok"}')
    print(f'  parça seviyeleri (dBFS, işlem yok): {check_level(out, times)}')
