# Seslendirme Teslim Raporu — VID_001–VID_100

**Durum: TAMAMLANDI (100/100 video, 200/200 dosya)**

## Drive konumları

| Klasör | ID | Dosya sayısı |
|---|---|---|
| uzun sesler | `1H0EP3Zj_L4FS-L0NjVSSLYDUTdUxHljT` | 100 (`VID_001_uzun.mp3` … `VID_100_uzun.mp3`) |
| kısa sesler | `1SqKtMzE8HLRerZysOWjkswDYlw6UfnQ3` | 100 (`VID_001_short.mp3` … `VID_100_short.mp3`) |

Doğrulama: `list_files` ile her iki klasörde tam 100 dosya teyit edildi.

## Üretim parametreleri (sabit)

- Ses: **voice-06**, dil **tr-TR**
- Hız: `atempo=1.3` (perde değişmez)
- Format: 48 kHz mono, 192 kbps mp3
- Birleştirme: trim (−50 dBFS, 20 ms pay) → 20 ms fade → parçalar arası 0,25 sn saf sıfır
- Kazanç / EQ / limiter / loudnorm uygulanmadı
- Parça seviyeleri −18,6 … −19,6 dBFS aralığında, işlem gerekmedi

## Kalite kontrolleri

- **Ek yeri (süreksizlik) kontrolü: 100/100 videoda sorun yok** (±3 örnek, tolerans 0,010)
- Her uzun dosya 2 TTS parçasından birleştirildi, kısa dosya tek parça
- Metin bütünlüğü: uzun metinler kaynak JSON ile birebir (100/100), kesilme/atlama yok

## Süre özeti

- Uzun dosyalar: ~76 – 103 sn
- Kısa dosyalar: ~13 – 19 sn

Son tur (VID_098–100):

| VID | Uzun | Kısa | Ek yeri |
|---|---|---|---|
| 098 | 94,3 sn | 14,4 sn | yok |
| 099 | 94,2 sn | 14,7 sn | yok |
| 100 | 96,1 sn | 14,8 sn | yok |

## Yeniden üretim

```bash
python3 merge.py out6/VID_XXX_uzun.mp3 work6/VID_XXX_uzun_p1.mp3 work6/VID_XXX_uzun_p2.mp3
python3 merge.py out6/VID_XXX_short.mp3 work6/VID_XXX_short.mp3
```

Kaynak metinler: `tts_v3_parts.json` (alanlar: `uzun_parts[0..1]`, `short`).
