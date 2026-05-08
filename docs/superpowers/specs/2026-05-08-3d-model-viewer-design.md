# 3D Kıyafet Görüntüleyici — Tasarım Dokümanı

**Tarih:** 2026-05-08  
**Durum:** Onaylandı  
**Kapsam:** xmobile app içinde Meshy API ile 3D kıyafet modeli üretimi ve görüntüleme

---

## 1. Genel Bakış

Kombin önerisi ekranına 3D görüntüleme özelliği eklenir. Kullanıcı bir kıyafet kartındaki "3D" butonuna bastığında, Meshy API aracılığıyla o kıyafetin 3D modeli oluşturulur ve WebView içinde döndürülebilir şekilde gösterilir.

**fal.ai ile ilişki:** fal.ai 2D fotorealistik render özelliğini tamamlar. Aynı ekranda `2D Görsel ↔ 3D Model` toggle ile geçiş yapılır.

---

## 2. Freemium Yapısı

| Tier | 2D (fal.ai) | 3D (Meshy) |
|------|-------------|------------|
| Ücretsiz | Sınırsız | Kilitli (🔒) |
| Temel | Sınırsız | 10 model/ay |
| Pro | Sınırsız | Sınırsız |

- Ücretsiz kullanıcılar "3D" butonuna bastığında upsell modal açılır
- Modal: örnek statik 3D render görseli + "Pro'da Dene" CTA butonu
- Sayaç şimdilik AsyncStorage'da tutulur, ilerleyen versiyonda backend'e taşınır

---

## 3. Bileşenler

| Dosya | Görev |
|-------|-------|
| `app/services/meshyService.ts` | Meshy API çağrıları, polling, cache |
| `app/components/ThreeDViewer.tsx` | WebView + inline Three.js HTML |
| `app/components/ThreeDButton.tsx` | Kıyafet kartındaki 3D/2D toggle butonu |
| `app/components/UpsellModal.tsx` | Ücretsiz kullanıcıya gösterilecek yükseltme ekranı |
| `app/context/SubscriptionContext.tsx` | Tier kontrolü + aylık 3D sayacı |
| `app/screens/KombinScreen.tsx` | Mevcut ekran — 3D toggle entegre edilir |
| `app/screens/ImportModelScreen.tsx` | Web'den GLB dosyası içe aktarma (V1 web entegrasyonu) |

---

## 4. Veri Akışı

```
Kullanıcı "3D" butonuna basar
  → SubscriptionContext tier kontrolü
    ├─ Ücretsiz → UpsellModal göster
    └─ Ücretli → meshyService.getModel(clothingDescription)
        ├─ Cache'de var mı? (AsyncStorage key: meshy_<hash(description)>)
        │   ├─ Evet → GLB URL direkt döner
        │   └─ Hayır →
        │       POST /v2/openapi/3d-model/text-to-3d
        │       { mode: "preview", prompt, target_polycount: 50000, topology: "quad" }
        │       → task_id alınır
        │       → Her 5sn poll: GET /task/{task_id}
        │       → status: SUCCEEDED → model_urls.glb
        │       → AsyncStorage'a yaz
        └─ ThreeDViewer'a GLB URL ilet → WebView yükler
```

---

## 5. Meshy API Parametreleri

```json
{
  "mode": "preview",
  "prompt": "<kıyafet açıklaması>",
  "art_style": "realistic",
  "topology": "quad",
  "target_polycount": 50000
}
```

- `mode: "preview"` → daha hızlı, daha ucuz (~$0.2-0.3)
- `target_polycount: 50000` → mobil için optimize (referans GLB'de 269K vardı, biz 50K istiyoruz)
- Prompt Claude API'den alınan kıyafet açıklaması olacak

---

## 6. ThreeDViewer Bileşeni

WebView içinde inline HTML olarak çalışır:

```
- Three.js CDN
- GLTFLoader + OrbitControls
- Otomatik döndürme (autoRotate)
- Dokunma/sürükleme ile manuel kontrol
- Siyah arka plan, ortalanmış model
- Loading spinner WebView içinde
```

WebView yaklaşımının nedeni: expo-gl + three.js React Native paketi karmaşık ve kırılgan; WebView daha kararlı ve GLB desteği olgun.

---

## 7. Web → App Entegrasyon Katmanı

### V1 (Şimdi — Manuel Transfer)
- Web'de (aifurniture.com.tr veya xmobile web) Meshy ile GLB üretilir
- Kullanıcı GLB dosyasını telefona indirir
- App'te "3D Model İçe Aktar" butonu → `expo-document-picker` ile GLB seçilir
- ThreeDViewer aynı bileşeni kullanır, yerel dosya yolu ile çalışır

### V2 (Sonraki Sürüm — QR Transfer)
- Web'de "App'e Gönder" butonu → GLB URL'sini içeren QR kod gösterir
- App'te QR tarayıcı → URL alınır → ThreeDViewer direkt yükler

### V3 (Gelecek — Hesap Senkronu)
- Kullanıcı hesabı → web'de üretilen modeller app'te otomatik görünür
- Backend: Meshy GLB URL'leri kullanıcıya bağlı veritabanında tutulur

---

## 8. Hata Yönetimi

| Durum | Davranış |
|-------|----------|
| Meshy 120sn'de tamamlamaz | "Şu an yoğun, tekrar dene" toast + retry butonu |
| Network kopuk | Retry butonu, önce cache kontrol |
| Meshy API hatası | fal.ai 2D görsel kalır, kullanıcı bilgilendirilir |
| GLB yüklenemiyor | WebView hata mesajı + tekrar dene |

---

## 9. Cache Stratejisi

- Key: `meshy_<MD5(clothingDescription)>`
- Value: `{ glbUrl, createdAt }`
- TTL: 7 gün (Meshy CDN link süresi uzun ama garantisiz)
- AsyncStorage'da tutulur

---

## 10. Kapsam Dışı (V1)

- Full 3D avatar (giydirilmiş insan figürü) — V2
- AR (Artırılmış Gerçeklik) görüntüleme — V3
- 3D model düzenleme/boyama — Meshy platform özelliği, app'e gelmez
- Backend sayaç senkronu — V2
