# 🎬 Agent Motion Studio (`hkk`)

**Yapay Zeka Ajanları (Claude Code, Codex, Cursor) İçin İleri Düzey Kod Tabanlı Video Animasyon Kütüphanesi & Stüdyosu**

Bireysel YouTube (16:9) ve YouTube Shorts / Reels (9:16) içerik üretimi için **%100 açık kaynak (MIT)**, ticari kullanıma ve YouTube para kazanmaya tamamen açık, sıfır API anahtarı gerektiren deterministik **60 FPS** video animasyon motoru + açık kaynak ajan cephaneliği.

---

## ✨ Neler İçerir?

1. **Deterministik 60 FPS Çekirdek Motor (`src/core/`):**
   - `Timeline`: Saniye, kare ve **müzik BPM / Bar vuruş ızgarasına** kilitli sahne ve katman yöneticisi + 2.5D sanal kamera (zoom, pan, handheld nefes alışı).
   - `EASES` & `spring`: 53 profesyonel motion tasarım sahnesinden ölçülmüş **12 stüdyo hız eğrisi** (`softLand`, `snapSettle`, `heavyDrop`, `accelExit`, `whipCut` vb.), analitik sönümlü yay fiziği (`spring`) ve `Math.random()` gerektirmeyen tohumlu rastgelelik (`createSeededRandom`).
2. **Zengin Görsel Primitifler (`src/primitives/`):**
   - **Kinetik Tipografi & Altyazı:** Maskeli satır çıkışları (`drawKineticHeadline`), büyükten oturan başlıklar (`drawOversizeSlam`), animasyonlu sayaçlar (`drawAnimatedCounter`) ve Whisper/Edge-TTS uyumlu **kelime bazlı zıplayan altyazılar** (`drawSyncedCaptions`).
   - **Vox / Kurzgesagt / 3Blue1Brown Veri & Matematik:** Kademeli çizilen spline çizgi grafikler (`drawAnimatedLineChart`), yarışan bar grafikleri (`drawAnimatedBars`) ve matematiksel dalga dönüşümleri (`drawMathFunctionMorph`).
   - **Ürün / Kod Simülasyonu & Geçişler:** macOS/Linux terminal simülatörü (`drawTerminalWindow`), doğal eğrili imleç + tıklama halkası (`drawSimulatedCursor`) ve diyagonal jilet geçişler (`drawGeometricWipe`).
   - **GPU Gerektirmeyen 3D Uzaysal Geometri:** Her ortamda 60 FPS çalışan derinlik sıralamalı 3D jeodezik küre ve yörünge halkaları (`drawSpatial3DCore`).
3. **Çift Modlu Ajan Üretimi (`JS SDK` + `JSON Derleyici`):**
   - Ajanınız ister `src/index.js` primitifleriyle sınırsız özel kod yazar, ister `examples/sample-agent-spec.json` gibi yapılandırılmış bir JSON şeması üretip anında filme derler (`src/grammars/scene-compiler.js`).
4. **Sıfır API Anahtarlı Ses & Türkçe Seslendirme Araçları (`scripts/`):**
   - `scripts/audio-synth.py`: Saf Python standart kütüphanesiyle sahne vuruşlarına kilitli 48kHz stereo ses efektleri (`subHit`, `whoosh`, `shutter`, `uiClick`, `pop`, `riser`, `chime`) ve BPM ambiyans yatağı sentezler.
   - `scripts/tts-captions.py`: Ücretsiz Microsoft Neural sesleriyle (`tr-TR-AhmetNeural`, `tr-TR-EmelNeural` vb.) seslendirme + milisaniyelik kelime altyazı JSON'u üretir.
5. **Anti-Slop Kalite Kapıları (`G0–G5`) & Claude Code Kurulumu:**
   - `scripts/lint-video.mjs` & `scripts/qa-audit.py`: Render öncesi ve sonrası deterministik saat, okunabilirlik, sıfır ölü kare ve `yuv420p` YouTube uyumluluk denetimi.
   - `CLAUDE.md` + `.claude/skills/agent-motion-director/SKILL.md`: Claude Code'un projeyi açtığı anda otomatik okuduğu sinematik yönetmen kuralları.
   - `docs/OPEN_SOURCE_RESEARCH_TR.md` & `scripts/setup-claude-arsenal.sh`: Dünyadaki en güçlü açık kaynak video repolarının derinlemesine karşılaştırması ve tek komutla kurulum script'i.

---

## 🚀 Hızlı Başlangıç (Claude Code'a Kurdurma)

Bilgisayarınızda Claude Code'u açıp tek cümleyle şunu söyleyebilirsiniz:

```text
Bu repoyu klonla ve `bash scripts/setup-claude-arsenal.sh --full` komutunu çalıştırıp kurulumu tamamla.
```

Veya terminalden manuel:

```bash
# 1. Tek komutla tüm açık kaynak ajan video yeteneklerini + Chromium + TTS kur
bash scripts/setup-claude-arsenal.sh

# 2. Canlı Önizleme & JSON Sahne Stüdyosunu başlat (Tarayıcıda 60fps izle + WebM indir)
npm run studio

# 3. Sahneyi kalite kapılarından (G0-G4) geçir
npm run lint:video examples/sample-agent-spec.json

# 4. Headless Chromium + FFmpeg + Otomatik Ses Sentezi ile 1080p60 MP4 Render al
npm run render -- --comp launch-film-16x9 --out renders/launch.mp4
npm run render -- --spec examples/sample-agent-spec.json --out renders/explainer.mp4
```

---

## 📚 Derinlemesine Açık Kaynak Repo Rehberi

Tüm açık kaynak ekosistemin (HyperFrames, Remotion + Remocn, Manim, Revideo, Canvas Commons, raea, cinetic, motionmaxxing, huashu-art-motion, earshot, rea-video) lisans ve mimari analizi için:
👉 **[`docs/OPEN_SOURCE_RESEARCH_TR.md`](docs/OPEN_SOURCE_RESEARCH_TR.md)** dosyasına göz atın.
