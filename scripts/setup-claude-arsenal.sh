#!/usr/bin/env bash
# ==============================================================================
# scripts/setup-claude-arsenal.sh
# Claude Code / Codex / Cursor İçin Açık Kaynak Video Animasyon Cephaneliği Kurucu
#
# Kendi bilgisayarında (macOS / Linux / WSL2) çalıştırdığında:
#  1. Bu repodaki yerel bağımlılıkları + Playwright Headless Chromium'u kurar
#  2. Ücretsiz Türkçe/İngilizce Neural TTS (`edge-tts`) paketini kurar
#  3. Dünyanın en iyi açık kaynak Ajan Video Yeteneklerini (HyperFrames, Remocn,
#     Remotion Skills, Motion Design Skill, GSAP Skills, Motionmaxxing, Cinetic,
#     Huashu Art Motion, Earshot) tek seferde Claude Code'a öğretir!
# ==============================================================================

set -euo pipefail

MODE="${1:---core}"

echo "🎬 [1/4] Sistem gereksinimleri kontrol ediliyor..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js (v20/v22+) gerekli: https://nodejs.org"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3.10+ gerekli."; exit 1; }
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "⚠️  FFmpeg bulunamadı! MP4 birleştirme için kurmanız önerilir:"
  echo "    macOS : brew install ffmpeg"
  echo "    Ubuntu: sudo apt update && sudo apt install -y ffmpeg"
fi

echo "📦 [2/4] Agent Motion Studio paketleri ve Headless Chromium kuruluyor..."
npm install
npx playwright install chromium

echo "🎙️ [3/4] Ücretsiz Neural Seslendirme (edge-tts) için Python sanal ortamı hazırlanıyor..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install --upgrade pip
.venv/bin/pip install edge-tts

echo "🧠 [4/4] Açık Kaynak AI Video Agent Skills yükleniyor..."
# Core agent skills (hızlı ve her projede çalışan temel set)
npx --yes skills add heygen-com/hyperframes --skill hyperframes --skill hyperframes-cli --skill hyperframes-registry --skill media-use || true
npx --yes skills add LottieFiles/motion-design-skill || true
npx --yes skills add greensock/gsap-skills || true
npx --yes skills add Tejashmakwana/motionmaxxing || true

if [ "$MODE" = "--full" ]; then
  echo "🚀 [--full] Genişletilmiş Sinematik Yönetmen & Remotion/Sanat Paketleri yükleniyor..."
  npx --yes skills add remotion-dev/skills || true
  npx --yes skills add Remocn/remocn || true
  npx --yes skills add Leonxlnx/cinetic || true
  npx --yes skills add alchaincyf/huashu-art-motion || true
  npx --yes skills add Leonxlnx/earshot || true
  .venv/bin/pip install "earshot @ git+https://github.com/Leonxlnx/earshot" faster-whisper || true
fi

echo ""
echo "✅ Kurulum tamamlandı!"
echo "   • Canlı Stüdyoyu açmak için : npm run studio"
echo "   • Örnek MP4 render almak için: npm run render -- --comp launch-film-16x9 --out renders/launch.mp4"
echo "   • Tam cephanelik için       : bash scripts/setup-claude-arsenal.sh --full"
