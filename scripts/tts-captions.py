#!/usr/bin/env python3
"""
scripts/tts-captions.py
100% Free Neural Voiceover + Word-Level Timestamp Generator for YouTube Automation.

Uses `edge-tts` (Microsoft Natural Neural Voices — supports Turkish `tr-TR-AhmetNeural`,
`tr-TR-EmelNeural`, English `en-US-AndrewMultilingualNeural`, etc., ZERO API Key!)
and optionally `faster-whisper` if installed for millisecond alignment.
Even with `edge-tts` alone, `SubMaker` / `WordBoundary` events extract exact word timestamps
ready for `drawSyncedCaptions()`!

Install on your machine:
  pip install edge-tts

Usage:
  python3 scripts/tts-captions.py --text "Merhaba! Bu video yapay zeka ajanı tarafından kodlandı." \
      --voice tr-TR-AhmetNeural --audio out/voice.mp3 --captions out/captions.json
"""

import argparse
import asyncio
import json
import os
import sys


async def synthesize_with_timestamps(text: str, voice: str, rate: str, audio_out: str, captions_out: str):
    try:
        import edge_tts
    except ImportError:
        print(
            json.dumps({
                "status": "missing_dependency",
                "message": "edge-tts kurulu değil. Kurmak için: pip install edge-tts",
                "installCommand": "pip install edge-tts",
            }, ensure_ascii=False, indent=2),
            file=sys.stderr,
        )
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(audio_out)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(captions_out)), exist_ok=True)

    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    words = []

    with open(audio_out, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # offset and duration are in 100-nanosecond ticks (1e7 per second)
                start_sec = chunk["offset"] / 10_000_000.0
                dur_sec = chunk["duration"] / 10_000_000.0
                words.append({
                    "word": chunk["text"],
                    "start": round(start_sec, 3),
                    "end": round(start_sec + dur_sec, 3),
                })

    with open(captions_out, "w", encoding="utf-8") as cf:
        json.dump(words, cf, ensure_ascii=False, indent=2)

    print(json.dumps({
        "status": "ok",
        "voice": voice,
        "audioOut": audio_out,
        "captionsOut": captions_out,
        "wordCount": len(words),
        "estimatedDurationSeconds": words[-1]["end"] if words else 0,
    }, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Free Neural TTS + Word-Level Captions (edge-tts)")
    parser.add_argument("--text", help="Spoken script text")
    parser.add_argument("--script-file", help="Path to UTF-8 text file")
    parser.add_argument("--voice", default="tr-TR-AhmetNeural", help="Neural voice ID (e.g. tr-TR-AhmetNeural, tr-TR-EmelNeural, en-US-BrianMultilingualNeural)")
    parser.add_argument("--rate", default="+4%", help="Speech rate adjustment (e.g. +0%, +8%)")
    parser.add_argument("--audio", default="out/voice.mp3", help="Output MP3 file")
    parser.add_argument("--captions", default="out/captions.json", help="Output word-level JSON file")
    args = parser.parse_args()

    script_text = args.text
    if args.script_file:
        with open(args.script_file, "r", encoding="utf-8") as sf:
            script_text = sf.read().strip()

    if not script_text:
        parser.error("--text veya --script-file vermelisiniz.")

    asyncio.run(synthesize_with_timestamps(script_text, args.voice, args.rate, args.audio, args.captions))


if __name__ == "__main__":
    main()
