# xmobile — Gelir Modeli (Hacim Önce)

_Güncelleme: 2026-05-14_

> **Temel ilke:** Az kişiden çok para değil, çok kişiden az para.
> Kullanıcı ödemeyi fark etmemeli — ya da fark etse de "zaten olsun" demeli.

---

## FELSEFESİ

| Yanlış yaklaşım | Doğru yaklaşım |
|-----------------|----------------|
| ₺149/ay Pro aboneliği zorla | ₺4.90/gün → "bir kahve" |
| Freemium'u kırp, zorunlu geçiş | Free gerçekten çalışsın, Pro ekstra mutluluk olsun |
| Büyük paket, büyük karar | Küçük paket, küçük karar → içgüdüsel satın alma |
| Marka: ₺10.000/ay anlaşma | Marka: ₺0 başla, sonuç olunca öde |
| Tek fiyat herkese | Farklı yaşam durumuna göre farklı kapı |

---

## 1. KULLANICI GELİRİ

### 1.1 Serbest Katman (Free) — Gerçekten Ücretsiz

Free plan cimri olmamalı. Kullanıcı değeri hissetmeden ödemeye geçmez.

- Günde **5** kombin önerisi (3 değil)
- 30 kıyafet
- Hava durumu entegrasyonu
- Kombin geçmişi (son 7 gün)

_Mantık: 5 öneri yeterli — ama haftalık rapor, Story export, 3D avatar gibi "ödül" özellikleri Pro'da. Kullanıcı kısıtlı hissetmez; Pro'yu ister._

---

### 1.2 Pro — "Bir Kahve" Çerçevesi

Fiyat değil algı önemli. Aynı ürünü farklı çerçevelerle sun:

| Seçenek | Fiyat | Kulağa ne gibi geliyor |
|---------|-------|------------------------|
| Haftalık | **₺19.90/hafta** | "Bir kahveden az" |
| Aylık | **₺59/ay** | "Ayda 2 simit" |
| Yıllık | **₺390/yıl** | "Günde 1 lira" |

- App'te bu çerçevelemeyi göster: _"Pro: Günde sadece ₺1.07"_
- Yıllık varsayılan seçili gelsin (%35 tasarruf badge'i ile)
- 7 günlük ücretsiz deneme (zaten var ✓)

_Neden ₺59, ₺149 değil:_ %8 conversion yerine %18–22 conversion hedefi. 1.000 kullanıcıda 80 → 200 Pro = aynı gelir, daha az churn, daha fazla kelime-of-mouth.

---

### 1.3 Tek Seferlik Kombin Token — İçgüdüsel Alım

Abonelik istemeyenler için, günlük limit dolduğunda çıkan küçük ödeme.

| Paket | Fiyat | Hissettirdiği |
|-------|-------|---------------|
| 3 Kombin | **₺4.90** | "Neredeyse bedava" |
| 10 Kombin | **₺12.90** | "Makul" |
| 30 Kombin | **₺29.90** | "İyi fırsat" |

- Limit dolunca _"3 daha al, ₺4.90"_ prompt'u — büyük karar değil, küçük tıklama.
- Bu alımların %30'u ilerleyen 30 günde Pro'ya dönüşür (köprü etkisi).

---

### 1.4 Lifetime — Erken Destekçi Fiyatı

- Launch döneminde: **₺490** (sonra ₺990)
- _"Uygulama büyürken erken destek fiyatı — sonsuza dek Pro"_
- Miktar sınırı: "İlk 200 kişiye özel" → aciliyet hissi
- RevenueCat one-time purchase, 1 gün iş.

---

### 1.5 Hediye Et Özelliği

- _"Arkadaşına 1 aylık Pro hediye et — ₺59"_
- Büyük teknoloji şirketlerinin uzun süredir kullandığı viral büyüme mekanizması.
- Hediye alan kişi uygulamayı indirir → yeni kullanıcı.
- Uygulama: App Store gift link + Supabase'de `gift_code` tablosu.

---

## 2. MARKA GELİRİ (B2B) — Önce Değer, Sonra Para

### 2.1 Affiliate — Performans Bazlı (Markaya Sıfır Risk)

Marka hiç ödeme yapmaz, sadece satış olunca komisyon gider.

- Trendyol, H&M TR, Zara TR affiliate programları — mevcut altyapı var ✓
- Eklenmesi gereken: Mango, LC Waikiki, DeFacto affiliate linkleri
- xmobile kazancı: satış başına %3–8
- Markanın riski: **₺0** → imzalamak için hiçbir engel yok

---

### 2.2 Sponsored Kombin — Küçük Bütçe, Ölçülü Giriş

Marka direkt ₺10.000 teklif görünce kaçar. Küçük başlangıç noktası sun:

| Paket | Fiyat | Kapsam |
|-------|-------|--------|
| Deneme | **₺490** | 3 gün, 1 sponsored kombin kartı |
| Başlangıç | **₺990/hafta** | 1 hafta, hedefli gösterim |
| Büyüme | **₺2.500/ay** | 1 ay, analitik raporu dahil |

- "Deneme" paketi markayı içeri çeker — çalışırsa büyütür.
- Sponsored kart organik kombinle aynı görünür, sadece küçük "Sponsored" etiketi.
- Self-serve: marka panelden kendi görselini yükler, kampanyayı başlatır.

---

### 2.3 Marka Vitrin — Ücretsiz Temel, Ücretli Boost

- **Temel Vitrin:** Ücretsiz — marka sayfası, logo, 10 ürün
- **Öne Çıkan:** ₺490/ay — Discover sekmesinde üstte görünme
- **Bildirim Paketi:** ₺990/ay — "Koton'da yeni koleksiyon" push bildirimi (haftada 1)

_Serbest katman markaları platforma çeker. Değer görünce ücretli geçer._

---

### 2.4 Kullanıcı İçgörü Raporu

- **Hedef:** Küçük yerel markalar, butikler
- **Fiyat:** ₺990/rapor (büyük marka için ₺4.900)
- **İçerik:** "Bu sezon İstanbul'da 25-34 yaş grubu ne giyiyor?" — anonim, toplu veri
- Önce 2–3 markaya ücretsiz ver → referans olarak kullan → ücretli sat

---

## 3. PLATFORM GELİRİ — Organik Büyüyen Kanallar

### 3.1 Referral — Kullanıcı Kullanıcıyı Getirir (zaten var ✓)

Mevcut referral sistemi var. Optimize edilmesi gereken teşvik:

- Davet eden: **1 ay ücretsiz Pro** (₺59 değer)
- Davet edilen: **14 gün ücretsiz Pro** (standart 7 günün 2 katı)
- Sonuç: CAC (müşteri edinme maliyeti) neredeyse sıfır

---

### 3.2 Creator Programı — Influencer Kaldıraç

- Moda influencer'ları kombin linkini paylaşır
- Takipçi Pro'ya geçince creator **%20 komisyon** alır (1 ay)
- Creator için ek maliyet: sıfır — sadece link paylaşımı
- xmobile kazancı: yeni Pro kullanıcı, influencer kendi reklam verir

---

### 3.3 API — Yan Gelir (6+ ay sonra)

- Küçük e-ticaret siteleri için _"Bu ürünle ne giyilir?"_ API'si
- **₺0 / ay** — 500 req (deneme)
- **₺299 / ay** — 10.000 req
- **₺990 / ay** — 50.000 req
- Büyük operasyon gerektirmez; mevcut AI motoru wrap edilir.

---

## 4. GELİR PROJEKSİYONU

### Kullanıcı Sayısı Varsayımı

| Ay | Aktif Kullanıcı | Pro % | Pro Sayı |
|----|-----------------|-------|----------|
| 3 | 1.000 | %18 | 180 |
| 6 | 4.000 | %20 | 800 |
| 12 | 15.000 | %22 | 3.300 |

### Aylık Gelir

| Kaynak | 3. Ay | 6. Ay | 12. Ay |
|--------|-------|-------|--------|
| Pro Abonelik (ort. ₺55) | ₺9.900 | ₺44.000 | ₺181.500 |
| Token Satışı | ₺1.500 | ₺7.000 | ₺25.000 |
| Lifetime (ilk 3 ay) | ₺9.800 | — | — |
| Affiliate Komisyon | ₺1.000 | ₺6.000 | ₺28.000 |
| Sponsored Kombin | — | ₺5.000 | ₺22.000 |
| Marka Vitrin Boost | — | ₺2.500 | ₺12.000 |
| Creator Komisyonu (net) | — | ₺2.000 | ₺9.000 |
| **TOPLAM** | **~₺22K** | **~₺66K** | **~₺277K** |

---

## 5. UYGULAMA SÜRECİ — En Az İşle En Çok Etki

### Bu Hafta (1–2 saat):
1. Pro fiyatını ₺149 → **₺59/ay** olarak güncelle (subscription.tsx)
2. Yıllık pakete "Günde ₺1.07" çerçevelemesini ekle
3. Token paketini RevenueCat'e ekle (₺4.90 / ₺12.90 / ₺29.90)

### Bu Ay:
4. Lifetime ₺490 "ilk 200 kişi" lansmanı
5. H&M, Zara affiliate linkleri Trendyol'a ekle
6. Sponsored kombin flag'i discover.tsx'e ekle (₺490 deneme paketi)

### 1–3 Ay:
7. Creator referral komisyon sistemi
8. Marka ücretsiz vitrin onboarding formu
9. API beta (mevcut motoru sarmalayıp yayınla)
