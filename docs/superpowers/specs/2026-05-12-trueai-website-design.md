# True AI — XMOBILE Website Design Spec
*Date: 2026-05-12*

## Overview

Standalone marketing website for the **True AI — XMOBILE WARDROBE INTELLIGENCE** mobile app. Separate from aifurniture.com.tr (furniture e-commerce). Primary goal: build pre-launch waitlist email list.

**Tech:** Single HTML file (HTML/CSS/JS), Vercel static deploy.  
**Domain:** Belirlenmedi — deploy sonrası bağlanır. İlk aşamada Vercel subdomain kullanılır (`trueai-xmobile.vercel.app`).  
**Language:** Turkish (primary).

---

## Brand & Design Tokens

| Token | Value |
|-------|-------|
| Background | `#00040F` |
| Primary accent | `#00D4FF` (cyan) |
| Text primary | `#FFFFFF` |
| Text secondary | `#888888` |
| Card background | `#111111` |
| Border | `rgba(0,212,255,0.15)` |
| Font | Space Grotesk or Inter (Google Fonts) |
| Style | Dark premium / Apple minimal |

Exact color system mirrors the mobile app for brand consistency.

---

## Conversion Goal

**Primary:** Email waitlist signup ("Erken Erişim Kazan").  
**Secondary:** Brand awareness / credibility building before App Store launch.  
**Anti-goal:** Not selling furniture — zero overlap with aifurniture.com.tr.

---

## Page Sections (Top → Bottom)

### 1. Scarcity Banner
- Full-width sticky bar at top
- Copy: `🔥 Beta erişimi sınırlı — [N] kişi bekleniyor`
- N = static starting number (347), increments visually via JS animation
- Background: `#00D4FF`, text: `#000`
- **Psychology:** Mimetic Desire, Scarcity heuristic

### 2. Hero Section
- **Left:** Logo ("True" white box + "XMOBILE" + "WARDROBE INTELLIGENCE")
- **Right:** App screenshot (screen 4 — AI outfit + weather card)
- **Headline:** `Dolu dolaba bakıp ne giyeceğini bilemiyor musun?`
- **Sub:** `True AI gardırobunu öğrenir — hava, takvim ve tarzına göre her sabahı hazırlar.`
- **Primary CTA button:** `Ücretsiz Erken Erişim Kazan →` (cyan, full-radius)
- **Micro-copy below CTA:** `Kredi kartı gerekmez · İlk 500 kişi Pro ücretsiz`
- **Psychology:** Loss Aversion (headline), Zero-Price Effect (micro-copy), Present Bias

### 3. WOW Feature — Sanal Deneme
- Full-width dark section
- Large: screenshot 7 (virtual try-on result — person wearing outfit)
- **Headline:** `Giymeden önce gör.`
- **Sub:** `AI kıyafeti saniyeler içinde sana giydiriyor. Fotoğrafından, gerçek sonuç.`
- **CTA:** `Nasıl Çalışır →` (scroll-to section)
- **Psychology:** Availability Heuristic (vivid visual = "this works")

### 4. How It Works — 3 Adım
- 3 column, icon + number + text
- Step 1: `Gardırobunu ekle` — Kıyafetlerini fotoğrafla, uygulama tanır
- Step 2: `AI kombini hazırlar` — Hava, takvim ve stiline göre öneri üretir
- Step 3: `Giymeden önce dene` — Sanal deneme ile kombini üstünde gör
- **Psychology:** Activation Energy reduction (looks easy = low barrier)

### 5. Features — 4 Özellik
- Alternating layout (text left/image right, then flip)
- Each feature has: app screenshot + headline + 1-line benefit + **concrete metric**

| Feature | Screenshot | Headline | Metric |
|---------|-----------|---------|--------|
| AI Kombin | Screen 4 | Hava durumuna göre, her gün farklı | Sabahı 15 dk kısalt |
| Sanal Deneme | Screen 7 | Kıyafeti giymeden üstünde gör | 30-60 sn sonuç |
| Gardırop | Screen 2 | Tüm kıyafetlerin tek yerde | 30 kıyafete kadar ücretsiz |
| Geçmiş | Screen 3 | Geçmiş kombinlerin hep yanında | Favorile, tekrar kullan |

### 6. Objection Handling — FAQ
- 3 soru-cevap kartı (accordion veya static)
- **Q1:** `Kamera gizliliğim ne olacak?` → Veri cihazında işlenir, buluta fotoğraf gitmez
- **Q2:** `Kıyafetlerimi tanıyamaz mı?` → İlk kurulumda kendin etiketliyorsun, AI öğreniyor
- **Q3:** `Ücretsiz plan ne kadar kapsamlı?` → Sınırsız gardırop + ayda 5 AI kombin öneri
- **SEO:** FAQPage JSON-LD schema ile işaretlenir
- **Psychology:** Regret Aversion reduction

### 7. Pricing
- 3 kart: Ücretsiz | Pro | Ömürlük
- **Pro öne çıkar** (decoy + recommended badge)
- Anchoring: Aylık ₺149 → Yıllık `₺83/ay` (₺999/yıl olarak faturalandırılır)
- Mental accounting: "Günde 2.7 TL — bir çay parası"
- **Decoy:** Ömürlük ₺2.499 → yıllık daha "makul" görünür
- **Psychology:** Anchoring, Decoy Effect, Mental Accounting, Rule of 100

| Plan | Fiyat | İçerik |
|------|-------|--------|
| Ücretsiz | ₺0 | Gardırop (sınırsız), 5 kombin/ay |
| Pro ⭐ | ₺83/ay* | Sınırsız kombin, sanal deneme, 3D avatar, Story export |
| Ömürlük | ₺2.499 tek seferlik | Pro'nun her şeyi, sonsuza kadar |

*Yıllık ₺999 olarak faturalandırılır

### 8. Waitlist Form
- Email input + CTA button
- **Headline:** `İlk kullananlardan ol.`
- **Sub:** `Beta erişimi açıldığında sana haber verelim.`
- **Button:** `Erken Erişim Kazan →`
- Form: sadece email (tek alan = minimum friction)
- Submit → success state: "✓ Listeye eklendin! Yakında haber vereceğiz."
- Email localStorage'a kaydedilir (şimdilik), ileride servis bağlanır
- **Psychology:** Commitment & Consistency (small first step), Foot-in-the-door

### 9. Footer
- Logo + "WARDROBE INTELLIGENCE"
- Links: Gizlilik Politikası · İletişim
- Social: Instagram icon (placeholder)
- Copyright: `© 2026 True AI`

---

## SEO & AI Visibility Layer

### Files to generate alongside HTML:
- `robots.txt` — GPTBot, ClaudeBot, PerplexityBot, Google-Extended allow
- `llms.txt` — AI sistemleri için ürün özeti (türkçe + ingilizce)
- `pricing.md` — Machine-readable pricing for AI agents

### JSON-LD Schemas (inline in HTML):
- `SoftwareApplication` — app adı, platform, fiyat, açıklama
- `FAQPage` — objection handling section soruları
- `Organization` — marka bilgisi

### Meta tags:
- Title: `True AI — Yapay Zeka Destekli Akıllı Gardırop | XMOBILE`
- Description: `Her sabah doğru kombini giy. True AI gardırobunu öğrenir, hava durumuna ve stiline göre öneri üretir. Sanal deneme ile giymeden gör.`
- OG image: App screenshot (screen 4 veya 7)
- canonical, robots, hreflang (tr)

---

## Technical Requirements

- **Single file:** `docs/trueai/index.html` (veya ayrı repo)
- **Assets:** App screenshots `/assets/screenshots/` klasöründe, `<img loading="lazy">` ile yüklenir
- **No dependencies:** Vanilla JS only, zero npm packages
- **Fonts:** Google Fonts CDN (Space Grotesk veya Inter)
- **Mobile-first breakpoints:** 375px → 768px → 1024px → 1440px
- **Performance:** WebP screenshots, lazy load below-fold images
- **Accessibility:** ARIA labels, contrast 4.5:1+, keyboard nav
- **Deploy:** Vercel static (drag-drop veya GitHub push)

---

## Success Metrics

- Waitlist email toplamı (primary)
- Bounce rate < 60%
- Time on page > 90 saniye
- Scroll depth > 70% (3. bölüme kadar)
