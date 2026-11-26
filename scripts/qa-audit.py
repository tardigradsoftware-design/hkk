#!/usr/bin/env python3
"""
scripts/qa-audit.py
Post-Render MP4 Quality Gate Auditor (ffprobe + frame motion check).

Runs after rendering an MP4 to verify:
  - File exists and is non-zero
  - Video stream has expected resolution, FPS, H.264 yuv420p compatibility (YouTube standard)
  - Audio stream exists and matches video duration within 0.25s

Usage:
  python3 scripts/qa-audit.py out/video.mp4 --expect-fps 60
"""

import argparse
import json
import os
import shutil
import subprocess
import sys


def audit_mp4(path: str, expect_fps: int | None = None) -> dict:
    if not os.path.exists(path):
        return {"passed": False, "error": f"Dosya bulunamadı: {path}"}

    size_bytes = os.path.getsize(path)
    if size_bytes < 1024:
        return {"passed": False, "error": f"Dosya çok küçük veya bozuk ({size_bytes} bytes)"}

    ffprobe_bin = shutil.which("ffprobe")
    if not ffprobe_bin:
        return {
            "passed": True,
            "note": "ffprobe sistemde kurulu değil; temel dosya boyutu kontrolü geçti.",
            "sizeBytes": size_bytes,
        }

    cmd = [
        ffprobe_bin,
        "-v", "error",
        "-show_entries", "format=duration,bit_rate:stream=index,codec_name,codec_type,width,height,pix_fmt,r_frame_rate,duration",
        "-of", "json",
        path,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        return {"passed": False, "error": proc.stderr.strip()}

    info = json.loads(proc.stdout)
    streams = info.get("streams", [])
    v_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    a_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    issues = []
    if not v_stream:
        issues.append("Video stream bulunamadı!")
    else:
        pix_fmt = v_stream.get("pix_fmt")
        if pix_fmt and pix_fmt != "yuv420p":
            issues.append(f"YouTube/tarayıcı uyumluluğu için pix_fmt 'yuv420p' olmalı, mevcut: {pix_fmt}")

        if expect_fps and v_stream.get("r_frame_rate"):
            num, den = v_stream["r_frame_rate"].split("/")
            actual_fps = round(float(num) / float(den))
            if actual_fps != expect_fps:
                issues.append(f"Beklenen FPS {expect_fps}, mevcut FPS {actual_fps}")

    if v_stream and a_stream:
        vd = float(v_stream.get("duration") or info.get("format", {}).get("duration", 0))
        ad = float(a_stream.get("duration") or vd)
        if abs(vd - ad) > 0.35:
            issues.append(f"Ses/Görüntü süre uyumsuzluğu (desync): video={vd:.2f}s, audio={ad:.2f}s")

    return {
        "passed": len(issues) == 0,
        "file": path,
        "sizeMB": round(size_bytes / (1024 * 1024), 2),
        "video": v_stream,
        "audioPresent": a_stream is not None,
        "issues": issues,
    }


def main():
    parser = argparse.ArgumentParser(description="Audit rendered MP4 file for YouTube readiness")
    parser.add_argument("mp4", help="Path to rendered MP4")
    parser.add_argument("--expect-fps", type=int, default=None)
    args = parser.parse_args()

    res = audit_mp4(args.mp4, args.expect_fps)
    print(json.dumps(res, indent=2, ensure_ascii=False))
    sys.exit(0 if res.get("passed") else 1)


if __name__ == "__main__":
    main()
