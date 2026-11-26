# CLAUDE.md — Agent Motion Studio Yönetmenlik & Mühendislik Kuralları

Bu depo, yapay zeka ajanlarının (Claude Code, Codex, Cursor vb.) **YouTube (16:9)** ve **YouTube Shorts / Reels (9:16)** için yayın kalitesinde, deterministik 60 FPS video animasyonları üretmesi amacıyla tasarlanmıştır.

Bir kullanıcı senden bir video, animasyon, intro, ürün tanıtımı veya sesli anlatım (explainer) istediğinde aşağıdaki iş akışını ve **Anti-Slop (Sıradan AI Videosu Önleme) Yasalarını** harfiyen uygula.

---

## 1. Üretim İş Akışı (Her Zaman Bu Sırayla)

1. **Plan & Vaat (Storyboard):**
   - İlk 3 saniyede (0–180 kare) videonun konusu veya vaadi izleyiciye net olarak geçmeli.
   - Her sahnede **TEK BİR odak kahraman (Single Hero)** olmalı (ör. ya büyük kinetik başlık, ya veri grafiği, ya terminal/UI, ya da 3D model). Aynı kareye iki ağır grafik sığdırma!
2. **Seslendirme & Kelime Zaman Damgaları (Eğer Sesli Video İstenirse):**
   - `.venv/bin/python scripts/tts-captions.py --text "..." --voice tr-TR-AhmetNeural --audio renders/voice.mp3 --captions renders/captions.json` komutunu çalıştır.
   - Çıkan `captions.json` süresine göre toplam kare sayısını (`durationSeconds`) ve sahne geçişlerini konuşma vuruşlarına kilitle.
3. **Sahne Kodlama (İki Moddan Birini Seç):**
   - **Mod A — Özel Kod (`src/` SDK):** Benzersiz görseller, özel çizimler, matematiksel eğriler ve karmaşık koreografiler için `Timeline` sınıfını ve `src/primitives/*` fonksiyonlarını kullanarak `examples/` altında yeni bir ES modülü yaz.
   - **Mod B — Hızlı JSON Derleyici:** Standart anlatım, grafik ve başlık dizileri için `examples/sample-agent-spec.json` formatında bir JSON dosyası üret (`src/grammars/scene-compiler.js` otomatik derler).
4. **Ön Denetim (Pre-Render Gate Check):**
   - Render almadan önce **MUTLAKA** `node scripts/lint-video.mjs <dosya>` çalıştır. Herhangi bir `G0–G4` hatası çıkarsa render'a geçmeden düzelt.
5. **Render & Ses Sentezi:**
   - MP4 üretmek için: `node scripts/render.mjs --spec <spec.json> --out renders/final.mp4` (veya `--comp <isim>`).
   - Belirli bir kareyi gözle kontrol etmek için: `node scripts/render.mjs --comp <isim> --still 90 --out renders/check-f90.png` alıp görseli oku (kesilmiş yazı veya düşük kontrast var mı kontrol et).
6. **Son Kalite Denetimi (Post-Render QA):**
   - `python3 scripts/qa-audit.py renders/final.mp4 --expect-fps 60` çalıştırıp `yuv420p`, FPS ve ses/görüntü senkronunu doğrula.

---

## 2. Sinematik Hareket Yasaları (Craft & Motionmaxxing Kuralları)

- **YASA 1 — Deterministik Saat (`G0`):** Animasyon kodunda **ASLA** `Math.random()`, `Date.now()` veya `performance.now()` kullanma! Rastgelelik gerektiğinde sadece `createSeededRandom(seed)` ve `noise1D(frame, seed)` kullan. `renderFrame(ctx, 250)` her çağrıldığında piksel piksel aynı kareyi üretmelidir.
- **YASA 2 — Giriş Yavaşlar, Çıkış Hızlanır:**
  - Sahneye giren öğelerde `softLand`, `snapSettle`, `crispDecel` veya `spring(..., 'crispUI')` kullan.
  - Sahneden çıkan öğelerde `accelExit` veya `whipCut` kullan.
- **YASA 3 — Hiçbir Şey Sıfırdan (`scale(0)`) Büyümez:**
  - Başlıkları ve logoları `0` boyutundan balon gibi şişirme! Ya maske arkasından Y ekseninde yukarı çıkar (`drawKineticHeadline`), ya da büyükten (`1.9x -> 1.0x`) yavaşlayarak oturt (`drawOversizeSlam`).
- **YASA 4 — Sıfır Ölü Kare (`G2`):**
  - Arka plan düz bir renk bloğu olamaz; `drawStudioSurface` + `drawAmbientParticles` + `drawFilmGrain` ve `tl.addCameraMove(...)` ile her karede hafif ışık/kamera nefes alışı sağla.
- **YASA 5 — Tek Vurgu Rengi & Temiz Tipografi (`G1` & `G5`):**
  - Gökkuşağı gradyanlı metin kullanma. Bir cümlede yalnızca **en önemli 1 kelimeyi** `accentWord` ile vurgula.
  - Köşelere gereksiz `"01 / INTRO"`, sahte zaman kodu veya slayt çerçevesi (page chrome) koyma.
  - Başlıklarda satır başına **2–7 kelime** kullan; paragraf duvarı yazma.
- **YASA 6 — Hareket Üzerinde Kesme (Cut on Motion):**
  - Her sahneyi yavaş bir `opacity` solmasıyla bitirme; sert kesme (hard cut) veya `drawGeometricWipe` ile hareketin enerjisi sürerken bir sonraki sahneye geç ve geçiş karesine `tl.addSoundCue({ frame, type: 'shutter' | 'whoosh' })` ekle.

---

## 3. SDK Hızlı Referans (`src/index.js`)

- **Çekirdek:** `Timeline`, `interpolate`, `spring`, `SPRING_PRESETS`, `EASES`, `cubicBezier`, `createSeededRandom`, `noise1D`
- **Zemin & Atmosfer:** `drawStudioSurface`, `drawEditorialPaper`, `drawAmbientParticles`, `drawFilmGrain`
- **Tipografi & Altyazı:** `drawKineticHeadline`, `drawOversizeSlam`, `drawAnimatedCounter`, `drawSyncedCaptions`
- **Veri & Matematik:** `drawAnimatedLineChart`, `drawAnimatedBars`, `drawMathFunctionMorph`
- **Ürün / UI / Geçiş:** `drawTerminalWindow`, `drawSimulatedCursor`, `drawGeometricWipe`
- **3D Uzaysal Geometri:** `project3D`, `drawSpatial3DCore`
