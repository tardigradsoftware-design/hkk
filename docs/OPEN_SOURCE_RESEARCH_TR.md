# 🎬 Açık Kaynak Kod Tabanlı Video & Ajan Animasyon Ekosistemi: Derinlemesine Araştırma Raporu (2026)

Bu rehber, **bireysel bir YouTube içerik üreticisinin (para kazanma / ticari gelir açık dahil)** yapay zeka kodlama ajanlarına (Claude Code, Codex, Cursor vb.) ileri düzey motion graphics, veri görselleştirme, ürün demosu, 3D ve seslendirmeli (explainer) videolar ürettirmesi için tüm açık kaynak dünyasının derinlemesine teknik ve lisans incelemesini içerir.

---

## 📊 1. Ana Render Motorları Karşılaştırma Matrisi

| Motor / Repo | Dil & Mimari | Lisans | Bireysel YouTube Para Kazanma | Ajan Uyumu (Claude/Codex) | En Güçlü Olduğu Alan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[HyperFrames](https://github.com/heygen-com/hyperframes)** (`heygen-com/hyperframes`) | HTML + CSS + GSAP / Three.js / Lottie + FFmpeg | **Apache-2.0** | **%100 Ücretsiz & Sınırsız** (Render ücreti ve çalışan sınırı yok) | ⭐⭐⭐⭐⭐ (Doğrudan ajanlar için yapıldı, 21 resmi skill + ~450 blok) | Web/HTML mantığıyla hızlı, sıfır bundler kurulumlu ajan videoları |
| **[Remotion](https://github.com/remotion-dev/remotion)** + **[Remocn](https://github.com/Remocn/remocn)** | React + TypeScript + Headless Chrome | Remotion License (Remocn: **MIT**) | **%100 Ücretsiz** (Bireysel ve 3 kişiye kadar olan ekipler için ticari kullanım dahil ücretsiz) | ⭐⭐⭐⭐⭐ (`remotion-dev/skills` + Remocn'un **935 hazır MIT bileşeni** ve MCP sunucusu) | SaaS UI simülasyonu, zengin hazır bileşen kütüphanesi, React ekosistemi |
| **[Manim Community](https://github.com/ManimCommunity/manim)** | Python + Cairo / OpenGL + LaTeX | **MIT** | **%100 Ücretsiz & Sınırsız** | ⭐⭐⭐⭐ (LLM'ler Python/Manim kodunu çok iyi yazar) | 3Blue1Brown tarzı matematik, fizik, algoritma ve teknik diyagramlar |
| **[Revideo](https://github.com/midrender/revideo)** / **[Canvas Commons](https://github.com/canvas-commons/canvas-commons)** | TypeScript Generator (`yield*`) + HTML5 Canvas | **MIT** | **%100 Ücretsiz & Sınırsız** | ⭐⭐⭐⭐ (Prosedürel yukarıdan aşağıya okunan akış, ses senkronuna çok uygun) | Seslendirme senkronlu vektörel explainer videoları ve headless API render |
| **[raea](https://github.com/shinyobjectz/raea)** | React/TS + Rust & Bevy (Yerel GPU Render) | FSL-1.1-ALv2 | **Ücretsiz** (Rakip motor satmadığın sürece tüm içerik üretimi ücretsiz) | ⭐⭐⭐⭐⭐ (`raea check` ile otomatik kalite denetimi + gerçek zamanlıdan hızlı GPU render) | Ağır 3D sahneler (Bevy/R3F), oyun motoru kalitesinde hızlı yerel GPU render |
| **Bu Repo (`Agent Motion Studio`)** | Saf ES Modules + HTML5 Canvas + 3D + Python SFX | **MIT** | **%100 Ücretsiz & Sınırsız** | ⭐⭐⭐⭐⭐ (`CLAUDE.md` + JSON Derleyici + G0-G5 Kalite Kapıları + Sıfır API Anahtarı) | Sıfır dış kilitlenme ile hem JSON şeması hem özel JS koduyla hibrit üretim |

---

## 🧠 2. Ajanı "Motion Designer" Yapan En Güçlü Açık Kaynak Skill Repoları

Bir kodlama ajanına doğrudan *"Bana video yap"* dediğinizde genellikle köşelere küçük etiketler koyan, her şeyi yavaşça `opacity` ile görünür yapan, sıkıcı bir **PowerPoint slaytı ("AI slop")** üretir. Açık kaynak topluluğu bu sorunu çözmek için ajanlara **sinematografi, hız eğrileri ve görsel denetim** öğreten özel *Agent Skills* repoları geliştirdi:

### A. Yönetmenlik, Estetik & Hareket Yasaları
1. **`Leonxlnx/cinetic`** (MIT) — *Sinematik Film Yönetmeni*
   - Repo: `https://github.com/Leonxlnx/cinetic`
   - Kurulum: `npx skills add Leonxlnx/cinetic`
   - **Ne yapar?** Remotion veya HyperFrames üzerinde çalışır. Önce metni denetler (`copy-check.py`: ilk 3 saniyede net vaat, satır başına 2–7 kelime), müziğin bar/vuruş ızgarasını çıkarır (`track.py`), 23 test edilmiş metin animasyonu ve 466 görsel cihaz kitabından seçim yapar, optik akış tabanlı gerçek **motion blur** ve ses senkron denetimi (`av-audit.py`) uygular.

2. **`Tejashmakwana/motionmaxxing`** (Apache-2.0) — *"AI Slop" Engelleyici & 12 Ölçülmüş Eğri*
   - Repo: `https://github.com/Tejashmakwana/motionmaxxing`
   - Kurulum: `npx skills add Tejashmakwana/motionmaxxing`
   - **Ne yapar?** 53 profesyonel motion tasarım sahnesinin kare kare ölçümünden çıkarılmış **12 hız eğrisi (ease)** ve **G0–G5 kalite kapıları** içerir:
     - Girişler yavaşlayarak iner (*decelerate*), çıkışlar hızlanarak terk eder (*accelerate*).
     - Hiçbir nesne `scale(0)`'dan büyümez; büyükten (`1.8x–3.5x`) yerine oturur veya maske arkasından çıkar.
     - Üst üste 3'ten fazla hareketsiz "ölü kare" (G2) veya köşe etiketleri/slayt çerçeveleri (G5) varsa script otomatik **FAIL** verir ve ajana düzelttirir.

3. **`LottieFiles/motion-design-skill`** (MIT) — *Disney'in 12 Prensibi & Koreografi*
   - Repo: `https://github.com/LottieFiles/motion-design-skill`
   - Kurulum: `npx skills add LottieFiles/motion-design-skill`
   - **Ne yapar?** Herhangi bir animasyon motorunda (GSAP, CSS, Canvas, Remotion) ajana birincil/ikincil/ortam hareket katmanlarını (3-Layer Motion), materyal fiziğini ve zamanlama tablolarını öğretir.

4. **`greensock/gsap-skills`** — *Resmi GSAP Ajan Yetenekleri*
   - Repo: `https://github.com/greensock/gsap-skills`
   - Kurulum: `npx skills add greensock/gsap-skills`
   - **Ne yapar?** HyperFrames veya HTML tabanlı videolarda ajanların GSAP Timeline, ScrollTrigger, SplitText, MorphSVG ve Flip eklentilerini hatasız kullanmasını sağlar.

### B. Sanat Stilleri, YouTube Explainer Gramerleri & Tersine Mühendislik
5. **`alchaincyf/huashu-art-motion`** (MIT) — *53 Sanat Stili & 9 YouTube Anlatım Grameri*
   - Repo: `https://github.com/alchaincyf/huashu-art-motion`
   - Kurulum: `npx skills add alchaincyf/huashu-art-motion`
   - **Ne yapar?** **Kurzgesagt, Vox, 3Blue1Brown, Beyaz Tahta (Whiteboard), Storytime, Keynote UI, Finans Grafiği** dahil 9 kanıtlanmış YouTube anlatım gramerini ve Van Gogh'tan Bauhaus'a 53 sanat stilini kodla çizer. İçindeki `film_gate.py` videonun "PPT slaytı gibi" olup olmadığını piksel hareketinden ölçer!

6. **`Vincentwei1021/mg-styles-15`** (MIT) — *15 Motion Graphics Stili + Kodla Müzik Sentezi*
   - Repo: `https://github.com/Vincentwei1021/mg-styles-15`
   - **Ne yapar?** Flat Vector, Line Art, 3D C4D/Blender görünümü, Shape Morph, Sticker Explainer, Cyberpunk HUD dahil 15 tam referans film, promptları ve `mgaudio` ses sentezleyicisini içerir.

7. **`JuneYaooo/rea-video`** — *Beğendiğin Herhangi Bir Videoyu Kare Kare Koda Çevirme*
   - Repo: `https://github.com/JuneYaooo/rea-video`
   - Kurulum (Claude Code): `claude plugin marketplace add JuneYaooo/rea-video && claude plugin install rea-video@rea-video`
   - **Ne yapar?** YouTube veya TikTok'ta beğendiğin bir videoyu verirsin; kamera kesmelerini, hızını, altyazı stilini, ses efektlerini analiz edip ajanların okuyabileceği `VIDEO.md` formatında yeniden üretim planı çıkarır.

### C. Ücretsiz Ses Efektleri, Seslendirme (TTS), Altyazı ve 3D Ekosistemi
8. **`Leonxlnx/earshot`** — *Sağır Ajanlar İçin 922 Kod Tabanlı Ses Efekti & CLAP Dinleme Modeli*
   - Repo: `https://github.com/Leonxlnx/earshot`
   - Kurulum: `npx skills add Leonxlnx/earshot` + `pip install "earshot @ git+https://github.com/Leonxlnx/earshot"`
   - **Ne yapar?** Kodlama ajanları sesi duyamaz; `earshot` metinle istenen sesi ("çakıl taşında ayak sesi", "yumuşak arayüz tıklaması", "sinematik geçiş") kodla sentezler ve yapay zeka dinleme modeliyle (CLAP/AST) sesin sahneye uyup uymadığını ölçer!

9. **Seslendirme & Milisaniyelik Altyazı İkilisi (`edge-tts` + `whisperX` / `faster-whisper`)**
   - **`rany2/edge-tts`** (LGPL-3.0): Sıfır API anahtarıyla doğal Türkçe (`tr-TR-AhmetNeural`, `tr-TR-EmelNeural`) ve çok dilli seslendirme + kelime zaman damgaları.
   - **`m-bain/whisperX`** (BSD-4) / **`SYSTRAN/faster-whisper`** (MIT): Kendi kaydettiğin veya üretilen ses dosyalarından kelime bazlı milisaniye hassasiyetinde altyazı senkronu.

10. **Uçtan Uca Ajan Stüdyo Örnekleri (Referans Mimari)**
    - **`n3owise/agent-video-studio`** (MIT): Sıfır API anahtarlı Python + Edge-TTS + Faster-Whisper + 1080p B-Roll + Remotion boru hattı.
    - **`AnayDhawan/openvidstudio`**: Playwright ile gerçek tarayıcı/uygulama kaydı alıp MCP üzerinden 41 araçla ajana kurgulatan stüdyo.
    - **`ahujasid/mcp-for-blender`** (MIT): Claude Code'un doğrudan Blender'ı yöneterek gerçek 3D sahne ve kamera animasyonu üretmesini sağlayan MCP sunucusu.

---

## 🏆 3. Bireysel YouTube Kanalın İçin Benim Net Mimari Önerim

Tek kişilik bir içerik üreticisi olarak **hem lisans derdin yok hem de hız/kalite en kritik önceliğin**:

1. **Çekirdek Kurgulayıcı & Özel Motor (Bu Repo — `Agent Motion Studio`)**:
   - Sıfır dış bağımlılık kırılmasıyla 60fps 16:9 (YouTube) ve 9:16 (Shorts) sahneleri hem doğrudan JS koduyla hem de JSON şemasıyla üretir, prosedürel ses efektlerini (`scripts/audio-synth.py`) ve Türkçe TTS + kelime altyazısını (`scripts/tts-captions.py`) tek akışta birleştirir.
2. **HTML/GSAP + Hazır Blok Gücü (`heygen-com/hyperframes`)**:
   - Apache-2.0 lisanslı; kanalın büyüyüp şirketleşsen bile sonsuza dek ücretsiz. Claude Code'a kurduğunda ~450 hazır grafik bloğuna erişir.
3. **935 Hazır UI/Efekt Bileşeni (`Remotion` + `Remocn`)**:
   - Bireysel olduğun için Remotion lisansı da tamamen ücretsiz; `Remocn` sayesinde Claude Code sıfırdan uğraşmadan 935 hazır geçiş/metin/UI bileşenini indirip kullanır.
4. **Matematik / Algoritma Sahneleri İçin (`Manim Community`)**:
   - Teknik veya bilimsel bir bölüm geldiğinde ajan 10 saniyelik Manim klibi render edip ana videoya gömer.

Tüm bu araçları Claude Code'a **tek bir script ile** kurdurman için `scripts/setup-claude-arsenal.sh` dosyasını hazırladım!
