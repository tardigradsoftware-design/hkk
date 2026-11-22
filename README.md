# hkk — Ses üretim hattı

Türkçe hukuk bilgilendirme videoları için TTS ses üretimi (100 uzun + 100 kısa).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `merge.py` | Ses birleştirme hattı ("orijinal ses" — hiçbir ses işlemi yok) |
| `tts_v3.json` | 200 kaydın tam metni |
| `tts_v3_parts.json` | Metinlerin klip parçalarına bölünmüş hâli (≤1500 krkt) |
| `google_drive/` | Drive'daki senaryo CSV/XLSX'leri |

Ses dosyaları (`out*/`, `work*/`) Git'e girmez — Google Drive'da tutulur.

## Hat: neden "orijinal ses"

Önceki sürümlerde perde kaydırma, EQ, limiter ve loudness normalizasyonu uygulanıyordu.
Bunlar sesin doğal tınısını bozuyordu ("ses bozulmuş" geri bildirimi). Bu yüzden hat
sadece **1.3x hız + birleştirme** yapar:

1. 48 kHz mono çözümleme
2. Baş/son sessizlik kırpma (−50 dBFS eşiği, 20 ms pay)
3. 20 ms kenar fade (tık önleme)
4. `atempo=1.3` — **perde değişmez**
5. Parçalar arası 0.25 sn saf dijital sessizlik
6. Ek yeri süreksizlik kontrolü (±3 örnek, tol 0.010)
7. 48 kHz mono 192 kbps mp3

Uygulanmayanlar: perde kaydırma, EQ, limiter, loudness normalizasyonu, kazanç eşitleme.

## Kullanım

```bash
pip3 install --break-system-packages numpy imageio-ffmpeg
python3 merge.py out.mp3 parca1.mp3 parca2.mp3
```

Çıktı: süre, ek yeri sorunları (boş = temiz), parça seviyeleri (bilgi amaçlı).

## Sabit parametreler

- Ses: `voice-02`, tr-TR
- Hız: 1.3x (`atempo`)
- Format: 48 kHz mono, 192 kbps mp3
- Parçalama: ≤1500 krkt/klip

## Doğrulama

Her dosya için `check_joints` ek yeri sıçramasını, `check_level` parça seviyelerini ölçer.
48 dosyalık testte ek yeri sıçraması 0, parça seviyeleri kendiliğinden −18,3…−19,5 dBFS
aralığında (müdahale gerekmedi).
