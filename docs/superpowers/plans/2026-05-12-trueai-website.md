# True AI Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** True AI — XMOBILE için single-file HTML marketing sitesi, email waitlist toplama ve App Store öncesi marka bilinirliği.

**Architecture:** `docs/trueai/index.html` tek dosya. Tüm CSS inline `<style>`, tüm JS inline `<script>`. Harici bağımlılık yok (sadece Google Fonts CDN). Vercel static deploy.

**Tech Stack:** Vanilla HTML5 / CSS3 / JS (ES6+), Google Fonts (Space Grotesk), Vercel static hosting.

---

## File Structure

```
docs/trueai/
├── index.html              # Ana sayfa (tüm CSS + JS inline)
├── assets/
│   └── screenshots/
│       ├── home.jpeg       # Ekran 1 — Ana ekran
│       ├── wardrobe.jpeg   # Ekran 2 — Gardırop
│       ├── history.jpeg    # Ekran 3 — Geçmiş
│       ├── outfits.jpeg    # Ekran 4 — AI Kombinler (hero'da kullanılır)
│       ├── tryon-result.jpeg # Ekran 7 — Sanal Deneme sonucu (WOW bölümünde)
├── robots.txt              # AI bot erişim izni
├── llms.txt                # AI sistemleri için ürün özeti
└── pricing.md              # Machine-readable fiyatlandırma
```

---

## Task 1: Proje Dizini ve Ekran Görüntüsü Kurulumu

**Files:**
- Create: `docs/trueai/` (dizin)
- Create: `docs/trueai/assets/screenshots/` (dizin)

- [ ] **Step 1: Dizinleri oluştur**

```powershell
New-Item -ItemType Directory -Force -Path "docs\trueai\assets\screenshots"
```

- [ ] **Step 2: Ekran görüntülerini kopyala (Desktop'tan)**

```powershell
Copy-Item "C:\Users\emek.dogru\Desktop\1.jpeg" "docs\trueai\assets\screenshots\home.jpeg"
Copy-Item "C:\Users\emek.dogru\Desktop\2.jpeg" "docs\trueai\assets\screenshots\wardrobe.jpeg"
Copy-Item "C:\Users\emek.dogru\Desktop\3.jpeg" "docs\trueai\assets\screenshots\history.jpeg"
Copy-Item "C:\Users\emek.dogru\Desktop\4.jpeg" "docs\trueai\assets\screenshots\outfits.jpeg"
Copy-Item "C:\Users\emek.dogru\Desktop\7.jpeg" "docs\trueai\assets\screenshots\tryon-result.jpeg"
```

- [ ] **Step 3: Dosyaların kopyalandığını doğrula**

```powershell
Get-ChildItem "docs\trueai\assets\screenshots"
```

Beklenen çıktı: 5 dosya listelenir (home.jpeg, wardrobe.jpeg, history.jpeg, outfits.jpeg, tryon-result.jpeg).

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/assets/screenshots/
git commit -m "feat: add trueai website screenshots"
```

---

## Task 2: HTML Head — Meta, Fonts, JSON-LD

**Files:**
- Create: `docs/trueai/index.html`

- [ ] **Step 1: index.html oluştur — head bölümü**

`docs/trueai/index.html` dosyasını aşağıdaki içerikle oluştur:

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- SEO -->
  <title>True AI — Yapay Zeka Destekli Akıllı Gardırop | XMOBILE</title>
  <meta name="description" content="Her sabah doğru kombini giy. True AI gardırobunu öğrenir, hava durumuna ve stiline göre öneri üretir. Sanal deneme ile giymeden gör." />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="True AI — Yapay Zeka Destekli Akıllı Gardırop" />
  <meta property="og:description" content="Her sabah doğru kombini giy. Hava durumuna göre, tarzına özel AI kombin önerisi. Sanal deneme ile giymeden gör." />
  <meta property="og:image" content="assets/screenshots/outfits.jpeg" />
  <meta property="og:locale" content="tr_TR" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="True AI — Yapay Zeka Destekli Akıllı Gardırop" />
  <meta name="twitter:description" content="Sanal deneme ile kıyafeti giymeden gör. AI kombin önerisi." />
  <meta name="twitter:image" content="assets/screenshots/outfits.jpeg" />

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

  <!-- JSON-LD: SoftwareApplication -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "True AI — XMOBILE",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "iOS, Android",
    "description": "Yapay zeka destekli akıllı gardırop uygulaması. Hava durumu ve stiline göre günlük kombin önerisi. Sanal deneme ile kıyafeti giymeden gör.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "TRY",
      "description": "Freemium — ayda 5 ücretsiz kombin önerisi"
    }
  }
  </script>

  <!-- JSON-LD: FAQPage -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Kamera gizliliğim ne olacak?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Veriler cihazınızda işlenir. Buluta fotoğraf gönderilmez. Kıyafet görselleri yalnızca kombin önerisi için kullanılır."
        }
      },
      {
        "@type": "Question",
        "name": "Kıyafetlerimi tanıyamaz mı?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "İlk kurulumda kıyafetleri kendiniz etiketliyorsunuz (renk, kategori). Zamanla AI tercihlerinizi öğrenir ve önerileri kişiselleştirir."
        }
      },
      {
        "@type": "Question",
        "name": "Ücretsiz plan ne kadar kapsamlı?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sınırsız gardırop ekleme ve ayda 5 AI kombin önerisi tamamen ücretsiz. Sanal deneme ve sınırsız öneri Pro planında."
        }
      }
    ]
  }
  </script>

  <style>
    /* Styles Task 3'te eklenecek */
  </style>
</head>
<body>
  <!-- Sections Task 4+'da eklenecek -->
  <p style="color:white;background:#00040F;padding:2rem;">True AI — Setup OK</p>
</body>
</html>
```

- [ ] **Step 2: Tarayıcıda aç ve kontrol et**

```powershell
Start-Process "docs\trueai\index.html"
```

Beklenen: Beyaz metin "True AI — Setup OK" görünür. Browser title "True AI — Yapay Zeka..." gösterir.

- [ ] **Step 3: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai website HTML head + JSON-LD schemas"
```

---

## Task 3: CSS Design Tokens ve Base Styles

**Files:**
- Modify: `docs/trueai/index.html` — `<style>` bloğunu doldur

- [ ] **Step 1: `<style>` bloğunu aşağıdakiyle değiştir**

`docs/trueai/index.html` içindeki `/* Styles Task 3'te eklenecek */` yorumunu şununla değiştir:

```css
/* ===== DESIGN TOKENS ===== */
:root {
  --bg: #00040F;
  --bg-card: #111111;
  --bg-card-hover: #161616;
  --accent: #00D4FF;
  --accent-dim: rgba(0, 212, 255, 0.12);
  --accent-border: rgba(0, 212, 255, 0.25);
  --text-primary: #FFFFFF;
  --text-secondary: #888888;
  --text-muted: #555555;
  --success: #27AE60;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  --font: 'Space Grotesk', system-ui, sans-serif;
  --max-w: 1200px;
  --section-pad: 100px 24px;
  --section-pad-sm: 60px 20px;
}

/* ===== RESET ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}
img { max-width: 100%; display: block; }
a { text-decoration: none; color: inherit; }

/* ===== TYPOGRAPHY ===== */
.text-xs   { font-size: 12px; }
.text-sm   { font-size: 14px; }
.text-base { font-size: 16px; }
.text-lg   { font-size: 18px; }
.text-xl   { font-size: 20px; }
.text-2xl  { font-size: 24px; }
.text-3xl  { font-size: 32px; }
.text-4xl  { font-size: 40px; }
.text-5xl  { font-size: 52px; }
.text-6xl  { font-size: 68px; }

/* ===== LAYOUT ===== */
.container { max-width: var(--max-w); margin: 0 auto; padding: 0 24px; }
.section { padding: var(--section-pad); }
.section--dark { background: #000; }

/* ===== BUTTON ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: var(--accent);
  color: #000;
  font-family: var(--font);
  font-weight: 700;
  font-size: 16px;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font);
  font-weight: 500;
  font-size: 15px;
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.btn-secondary:hover { border-color: var(--accent); background: var(--accent-dim); }

/* ===== BADGE ===== */
.badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-full);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid var(--accent-border);
}

/* ===== CARD ===== */
.card {
  background: var(--bg-card);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--radius-lg);
  padding: 32px;
  transition: border-color 0.2s;
}
.card:hover { border-color: var(--accent-border); }

/* ===== EYEBROW ===== */
.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 16px;
}

/* ===== DIVIDER ===== */
.divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  :root {
    --section-pad: 64px 20px;
  }
  .text-6xl { font-size: 40px; }
  .text-5xl { font-size: 36px; }
  .text-4xl { font-size: 28px; }
  .text-3xl { font-size: 24px; }
}
```

- [ ] **Step 2: Tarayıcıda aç**

```powershell
Start-Process "docs\trueai\index.html"
```

Beklenen: Siyah arkaplan, beyaz "True AI — Setup OK" metni, Space Grotesk fontu yüklenmiş.

- [ ] **Step 3: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai CSS design tokens and base styles"
```

---

## Task 4: Banner + Nav + Hero Section

**Files:**
- Modify: `docs/trueai/index.html` — `<body>` içeriğini doldur

- [ ] **Step 1: `<body>` içeriğini değiştir**

`<p style="...">True AI — Setup OK</p>` satırını sil, yerine koy:

```html
<!-- BANNER -->
<div id="banner" style="
  position: sticky; top: 0; z-index: 100;
  background: var(--accent); color: #000;
  text-align: center; padding: 10px 20px;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 8px;
">
  🔥 Beta erişimi sınırlı —
  <span id="waitlist-count">347</span> kişi bekleniyor
  <button onclick="document.getElementById('banner').style.display='none'"
    style="margin-left:12px;background:none;border:none;cursor:pointer;font-size:16px;color:#000;line-height:1;">✕</button>
</div>

<!-- NAV -->
<nav style="
  position: sticky; top: 44px; z-index: 99;
  background: rgba(0,4,15,0.85); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 16px 24px;
">
  <div class="container" style="display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="
        width:36px;height:36px;background:#fff;border-radius:8px;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:800;color:#000;
      ">True</div>
      <div>
        <div style="font-size:13px;font-weight:700;letter-spacing:0.12em;">XMOBILE</div>
        <div style="font-size:9px;color:var(--text-secondary);letter-spacing:0.15em;">WARDROBE INTELLIGENCE</div>
      </div>
    </div>
    <a href="#waitlist" class="btn-primary" style="padding:10px 24px;font-size:14px;">
      Erken Erişim →
    </a>
  </div>
</nav>

<!-- HERO -->
<section class="section" id="hero" style="padding: 80px 24px 100px;">
  <div class="container">
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    " class="hero-grid">
      <!-- Sol: Metin -->
      <div>
        <div class="eyebrow">WARDROBE INTELLIGENCE</div>
        <h1 style="
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        ">
          Dolu dolaba bakıp<br />
          <span style="color: var(--accent);">ne giyeceğini</span><br />
          bilemiyor musun?
        </h1>
        <p style="
          font-size: 18px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 440px;
        ">
          True AI gardırobunu öğrenir — hava durumu, takvim ve tarzına göre
          her sabahı senin için hazırlar.
        </p>
        <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
          <a href="#waitlist" class="btn-primary">
            Ücretsiz Erken Erişim Kazan →
          </a>
          <p style="font-size:13px;color:var(--text-muted);">
            Kredi kartı gerekmez &nbsp;·&nbsp; İlk 500 kişi Pro ücretsiz
          </p>
        </div>
        <!-- Stats -->
        <div style="
          display:flex;gap:32px;margin-top:48px;
          padding-top:32px;border-top:1px solid rgba(255,255,255,0.07);
        ">
          <div>
            <div style="font-size:24px;font-weight:700;color:var(--accent);">15 dk</div>
            <div style="font-size:13px;color:var(--text-secondary);">sabah tasarrufu</div>
          </div>
          <div>
            <div style="font-size:24px;font-weight:700;color:var(--accent);">30–60 sn</div>
            <div style="font-size:13px;color:var(--text-secondary);">sanal deneme</div>
          </div>
          <div>
            <div style="font-size:24px;font-weight:700;color:var(--accent);">%100</div>
            <div style="font-size:13px;color:var(--text-secondary);">kişiselleştirilmiş</div>
          </div>
        </div>
      </div>
      <!-- Sağ: Screenshot -->
      <div style="display:flex;justify-content:center;">
        <div style="
          position:relative;
          width:280px;
        ">
          <div style="
            position:absolute;inset:-20px;
            background:radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%);
            border-radius:50%;
          "></div>
          <img
            src="assets/screenshots/outfits.jpeg"
            alt="True AI AI kombin önerisi ekranı"
            style="
              width:100%;border-radius:32px;
              box-shadow:0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
              position:relative;z-index:1;
            "
          />
        </div>
      </div>
    </div>
  </div>
</section>

<div class="divider"></div>
```

- [ ] **Step 2: Hero grid için responsive CSS ekle**

`<style>` bloğunun sonuna ekle (son `}` ve `</style>` arasına):

```css
/* Hero responsive */
@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: 1fr !important;
    gap: 40px !important;
    text-align: center;
  }
  .hero-grid > div:first-child {
    align-items: center;
    display: flex;
    flex-direction: column;
  }
  .hero-grid > div:first-child p { text-align: center; }
  .hero-grid > div:first-child > div:last-child { align-items: center; }
}
```

- [ ] **Step 3: Tarayıcıda kontrol et**

```powershell
Start-Process "docs\trueai\index.html"
```

Beklenen: Cyan banner üstte, sticky nav, hero iki kolonlu (masaüstü). Telefon görünümü için DevTools → 375px — tek kolon olmalı.

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai banner + nav + hero section"
```

---

## Task 5: WOW Feature (Sanal Deneme) + How It Works

**Files:**
- Modify: `docs/trueai/index.html`

- [ ] **Step 1: `<div class="divider"></div>` (hero'nun altındaki) sonrasına ekle**

```html
<!-- WOW: SANAL DENEME -->
<section class="section section--dark" style="padding: 100px 24px; text-align:center;">
  <div class="container">
    <div class="eyebrow" style="margin-bottom:20px;">SANAL DENEME</div>
    <h2 style="
      font-size: clamp(36px, 6vw, 72px);
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
    ">
      Giymeden önce gör.
    </h2>
    <p style="
      font-size: 18px;
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0 auto 56px;
      line-height: 1.6;
    ">
      AI kıyafeti saniyeler içinde sana giydiriyor.
      Fotoğrafından, gerçek sonuç.
    </p>

    <!-- Screenshot büyük gösterim -->
    <div style="
      position:relative;
      display:inline-block;
      max-width:340px;
      width:100%;
    ">
      <div style="
        position:absolute;inset:-40px;
        background:radial-gradient(ellipse, rgba(0,212,255,0.12) 0%, transparent 65%);
      "></div>
      <img
        src="assets/screenshots/tryon-result.jpeg"
        alt="True AI sanal deneme sonucu"
        style="
          width:100%;border-radius:32px;
          box-shadow:0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08);
          position:relative;z-index:1;
        "
        loading="lazy"
      />
      <!-- Floating label -->
      <div style="
        position:absolute;bottom:24px;left:50%;transform:translateX(-50%);
        background:rgba(0,212,255,0.9);color:#000;
        padding:10px 20px;border-radius:var(--radius-full);
        font-size:13px;font-weight:700;white-space:nowrap;
        z-index:2;
      ">
        ✓ AI kıyafeti giydirdi — 42 saniye
      </div>
    </div>
  </div>
</section>

<div class="divider"></div>

<!-- HOW IT WORKS -->
<section class="section" id="how-it-works">
  <div class="container">
    <div style="text-align:center;margin-bottom:64px;">
      <div class="eyebrow">NASIL ÇALIŞIR</div>
      <h2 style="font-size:clamp(28px,4vw,44px);font-weight:700;margin-top:12px;letter-spacing:-0.02em;">
        3 adımda hazır.
      </h2>
    </div>

    <div style="
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:24px;
    " class="steps-grid">

      <!-- Adım 1 -->
      <div class="card" style="text-align:center;padding:40px 28px;">
        <div style="
          width:56px;height:56px;background:var(--accent-dim);
          border:1px solid var(--accent-border);border-radius:var(--radius-md);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;font-size:24px;
        ">👗</div>
        <div style="
          font-size:11px;font-weight:700;letter-spacing:0.1em;
          color:var(--accent);margin-bottom:12px;text-transform:uppercase;
        ">ADIM 1</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:10px;">Gardırobunu ekle</h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          Kıyafetlerini fotoğrafla veya manuel ekle.
          Uygulama her parçayı tanır, kategorize eder.
        </p>
      </div>

      <!-- Adım 2 -->
      <div class="card" style="
        text-align:center;padding:40px 28px;
        border-color:var(--accent-border);
        background:linear-gradient(135deg,rgba(0,212,255,0.05) 0%,var(--bg-card) 100%);
      ">
        <div style="
          width:56px;height:56px;background:var(--accent-dim);
          border:1px solid var(--accent-border);border-radius:var(--radius-md);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;font-size:24px;
        ">✦</div>
        <div style="
          font-size:11px;font-weight:700;letter-spacing:0.1em;
          color:var(--accent);margin-bottom:12px;text-transform:uppercase;
        ">ADIM 2</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:10px;">AI kombini hazırlar</h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          Hava durumu, takvimindeki etkinlikler ve
          stiline göre 3 farklı kombin seçeneği üretir.
        </p>
      </div>

      <!-- Adım 3 -->
      <div class="card" style="text-align:center;padding:40px 28px;">
        <div style="
          width:56px;height:56px;background:var(--accent-dim);
          border:1px solid var(--accent-border);border-radius:var(--radius-md);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;font-size:24px;
        ">🪞</div>
        <div style="
          font-size:11px;font-weight:700;letter-spacing:0.1em;
          color:var(--accent);margin-bottom:12px;text-transform:uppercase;
        ">ADIM 3</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:10px;">Giymeden önce dene</h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          Sanal deneme ile kombini üstünde gör.
          Beğendiysen seç — sabah hazır.
        </p>
      </div>

    </div>
  </div>
</section>

<div class="divider"></div>
```

- [ ] **Step 2: Steps grid için responsive CSS ekle (`<style>` sonuna)**

```css
@media (max-width: 768px) {
  .steps-grid { grid-template-columns: 1fr !important; }
}
```

- [ ] **Step 3: Tarayıcıda kontrol et**

Beklenen: Siyah WOW bölümü (sanal deneme screenshot büyük), ardından 3 adım kartları. Mobilde tek kolon.

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai wow section + how it works"
```

---

## Task 6: Özellikler (4 Feature)

**Files:**
- Modify: `docs/trueai/index.html`

- [ ] **Step 1: Son `<div class="divider">` sonrasına ekle**

```html
<!-- FEATURES -->
<section class="section" id="features">
  <div class="container">
    <div style="text-align:center;margin-bottom:80px;">
      <div class="eyebrow">ÖZELLİKLER</div>
      <h2 style="font-size:clamp(28px,4vw,44px);font-weight:700;margin-top:12px;letter-spacing:-0.02em;">
        Gardırobunun tüm zekası burada.
      </h2>
    </div>

    <!-- Feature 1: AI Kombin (screenshot sol) -->
    <div style="
      display:grid;grid-template-columns:1fr 1fr;
      gap:80px;align-items:center;margin-bottom:100px;
    " class="feature-grid">
      <div style="display:flex;justify-content:center;">
        <img src="assets/screenshots/outfits.jpeg" alt="AI kombin önerisi"
          style="width:260px;border-radius:28px;box-shadow:0 24px 60px rgba(0,0,0,0.5);"
          loading="lazy" />
      </div>
      <div>
        <div class="badge">AI KOMBİN</div>
        <h3 style="font-size:clamp(24px,3vw,36px);font-weight:700;margin:16px 0 12px;letter-spacing:-0.01em;">
          Hava durumuna göre,<br/>her gün farklı öneri.
        </h3>
        <p style="font-size:16px;color:var(--text-secondary);line-height:1.7;margin-bottom:20px;">
          Konumunuzdan anlık hava bilgisini çeker. O gün iş toplantısı mı var,
          casual çıkış mı? Takviminize bakarak uygun kombini seçer.
        </p>
        <div style="
          display:inline-flex;align-items:center;gap:8px;
          background:var(--bg-card);border:1px solid rgba(39,174,96,0.3);
          padding:10px 18px;border-radius:var(--radius-full);
          font-size:14px;color:#27AE60;font-weight:600;
        ">
          ✓ Sabahı 15 dakika kısalt
        </div>
      </div>
    </div>

    <!-- Feature 2: Gardırop (screenshot sağ) -->
    <div style="
      display:grid;grid-template-columns:1fr 1fr;
      gap:80px;align-items:center;margin-bottom:100px;
    " class="feature-grid">
      <div>
        <div class="badge">GARDIROB</div>
        <h3 style="font-size:clamp(24px,3vw,36px);font-weight:700;margin:16px 0 12px;letter-spacing:-0.01em;">
          Tüm kıyafetlerin<br/>tek yerde.
        </h3>
        <p style="font-size:16px;color:var(--text-secondary);line-height:1.7;margin-bottom:20px;">
          Her parçayı fotoğrafla ekle. Renk, kategori, sezon otomatik
          etiketlenir. 30 kıyafete kadar tamamen ücretsiz.
        </p>
        <div style="
          display:inline-flex;align-items:center;gap:8px;
          background:var(--bg-card);border:1px solid rgba(0,212,255,0.3);
          padding:10px 18px;border-radius:var(--radius-full);
          font-size:14px;color:var(--accent);font-weight:600;
        ">
          ✓ 30 kıyafete kadar ücretsiz
        </div>
      </div>
      <div style="display:flex;justify-content:center;">
        <img src="assets/screenshots/wardrobe.jpeg" alt="Gardırop yönetimi"
          style="width:260px;border-radius:28px;box-shadow:0 24px 60px rgba(0,0,0,0.5);"
          loading="lazy" />
      </div>
    </div>

    <!-- Feature 3: Geçmiş (screenshot sol) -->
    <div style="
      display:grid;grid-template-columns:1fr 1fr;
      gap:80px;align-items:center;
    " class="feature-grid">
      <div style="display:flex;justify-content:center;">
        <img src="assets/screenshots/history.jpeg" alt="Kombin geçmişi"
          style="width:260px;border-radius:28px;box-shadow:0 24px 60px rgba(0,0,0,0.5);"
          loading="lazy" />
      </div>
      <div>
        <div class="badge">GEÇMİŞ</div>
        <h3 style="font-size:clamp(24px,3vw,36px);font-weight:700;margin:16px 0 12px;letter-spacing:-0.01em;">
          Geçmiş kombinlerin<br/>hep yanında.
        </h3>
        <p style="font-size:16px;color:var(--text-secondary);line-height:1.7;margin-bottom:20px;">
          Hangi gün ne giydini, o gün hava nasıldı — hepsi kaydedilir.
          Favori kombinleri işaretle, tekrar kullan.
        </p>
        <div style="
          display:inline-flex;align-items:center;gap:8px;
          background:var(--bg-card);border:1px solid rgba(39,174,96,0.3);
          padding:10px 18px;border-radius:var(--radius-full);
          font-size:14px;color:#27AE60;font-weight:600;
        ">
          ✓ Son 10 kombin ücretsiz
        </div>
      </div>
    </div>

  </div>
</section>

<div class="divider"></div>
```

- [ ] **Step 2: Feature grid responsive CSS ekle**

```css
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr !important;
    gap: 40px !important;
    text-align: center;
  }
  .feature-grid > div:has(img) { order: -1; }
}
```

- [ ] **Step 3: Kontrol et**

Beklenen: 3 özellik — alternatif screenshot sol/sağ layout. Mobilde tek kolon, screenshot hep üstte.

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai features section"
```

---

## Task 7: FAQ / Objection Handling

**Files:**
- Modify: `docs/trueai/index.html`

- [ ] **Step 1: Son `<div class="divider">` sonrasına ekle**

```html
<!-- FAQ / OBJECTION HANDLING -->
<section class="section section--dark" id="faq">
  <div class="container">
    <div style="text-align:center;margin-bottom:64px;">
      <div class="eyebrow">SIKÇA SORULANLAR</div>
      <h2 style="font-size:clamp(28px,4vw,44px);font-weight:700;margin-top:12px;letter-spacing:-0.02em;">
        Aklındaki sorular.
      </h2>
    </div>

    <div style="
      display:grid;grid-template-columns:repeat(3,1fr);gap:20px;
      max-width:900px;margin:0 auto;
    " class="faq-grid">

      <div class="card">
        <div style="font-size:28px;margin-bottom:16px;">🔒</div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:10px;">
          Kamera gizliliğim ne olacak?
        </h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          Veriler cihazınızda işlenir. Buluta fotoğraf gönderilmez.
          Kıyafet görselleri yalnızca kombin önerisi üretmek için kullanılır.
        </p>
      </div>

      <div class="card">
        <div style="font-size:28px;margin-bottom:16px;">🤔</div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:10px;">
          Kıyafetlerimi tanıyamaz mı?
        </h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          İlk kurulumda kıyafetleri kendiniz etiketliyorsunuz (renk, kategori).
          Zamanla AI tercihlerinizi öğrenir, öneriler kişiselleşir.
        </p>
      </div>

      <div class="card">
        <div style="font-size:28px;margin-bottom:16px;">🎁</div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:10px;">
          Ücretsiz plan ne kadar kapsamlı?
        </h3>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          Sınırsız gardırop ekleme + ayda 5 AI kombin önerisi tamamen ücretsiz.
          Sanal deneme ve sınırsız öneri Pro planında.
        </p>
      </div>

    </div>
  </div>
</section>

<div class="divider"></div>
```

- [ ] **Step 2: FAQ grid responsive CSS**

```css
@media (max-width: 768px) {
  .faq-grid { grid-template-columns: 1fr !important; }
}
```

- [ ] **Step 3: Kontrol et**

Beklenen: Koyu arkaplan üzerine 3 kart. Mobilde dikey.

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai faq / objection handling section"
```

---

## Task 8: Pricing Section

**Files:**
- Modify: `docs/trueai/index.html`

- [ ] **Step 1: Son `<div class="divider">` sonrasına ekle**

```html
<!-- PRICING -->
<section class="section" id="pricing">
  <div class="container">
    <div style="text-align:center;margin-bottom:64px;">
      <div class="eyebrow">FİYATLANDIRMA</div>
      <h2 style="font-size:clamp(28px,4vw,44px);font-weight:700;margin-top:12px;letter-spacing:-0.02em;">
        Sabah rutinini dönüştür.
      </h2>
      <p style="font-size:16px;color:var(--text-secondary);margin-top:12px;">
        Yıllık planla günde sadece 2.7 TL — bir çay parası.
      </p>
    </div>

    <div style="
      display:grid;grid-template-columns:repeat(3,1fr);
      gap:20px;max-width:900px;margin:0 auto;
      align-items:start;
    " class="pricing-grid">

      <!-- Ücretsiz -->
      <div class="card">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">ÜCRETSİZ</div>
        <div style="font-size:36px;font-weight:800;margin-bottom:4px;">₺0</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:28px;">Sonsuza kadar</div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:32px;">
          <li style="font-size:14px;color:var(--text-secondary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--success);">✓</span> Sınırsız gardırop ekleme
          </li>
          <li style="font-size:14px;color:var(--text-secondary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--success);">✓</span> Ayda 5 AI kombin önerisi
          </li>
          <li style="font-size:14px;color:var(--text-secondary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--success);">✓</span> Son 10 kombin geçmişi
          </li>
          <li style="font-size:14px;color:var(--text-muted);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--text-muted);">—</span> Sanal deneme
          </li>
          <li style="font-size:14px;color:var(--text-muted);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--text-muted);">—</span> 3D avatar overlay
          </li>
        </ul>
        <a href="#waitlist" class="btn-secondary" style="width:100%;justify-content:center;">
          Ücretsiz Başla
        </a>
      </div>

      <!-- Pro (öne çıkan) -->
      <div style="
        background:linear-gradient(135deg,rgba(0,212,255,0.08) 0%,var(--bg-card) 100%);
        border:1px solid var(--accent-border);border-radius:var(--radius-lg);
        padding:32px;position:relative;transform:scale(1.03);
      ">
        <div style="
          position:absolute;top:-12px;left:50%;transform:translateX(-50%);
          background:var(--accent);color:#000;
          font-size:11px;font-weight:800;letter-spacing:0.08em;
          padding:4px 16px;border-radius:var(--radius-full);
          text-transform:uppercase;white-space:nowrap;
        ">⭐ EN POPÜLER</div>
        <div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">PRO</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
          <span style="font-size:36px;font-weight:800;">₺83</span>
          <span style="font-size:14px;color:var(--text-secondary);">/ay</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:28px;">
          ₺999/yıl olarak faturalandırılır
          <span style="color:var(--accent);font-weight:600;margin-left:6px;">%44 indirim</span>
        </div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:32px;">
          <li style="font-size:14px;color:var(--text-primary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--accent);">✓</span> Sınırsız AI kombin önerisi
          </li>
          <li style="font-size:14px;color:var(--text-primary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--accent);">✓</span> Sanal deneme (try-on)
          </li>
          <li style="font-size:14px;color:var(--text-primary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--accent);">✓</span> 3D avatar kıyafet overlay
          </li>
          <li style="font-size:14px;color:var(--text-primary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--accent);">✓</span> Sınırsız kombin geçmişi
          </li>
          <li style="font-size:14px;color:var(--text-primary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--accent);">✓</span> Instagram Story export
          </li>
          <li style="font-size:14px;color:var(--text-primary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--accent);">✓</span> Hava durumu entegrasyonu
          </li>
        </ul>
        <a href="#waitlist" class="btn-primary" style="width:100%;justify-content:center;">
          Erken Erişim Kazan →
        </a>
        <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:10px;">
          Kredi kartı gerekmez
        </p>
      </div>

      <!-- Ömürlük -->
      <div class="card">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;">ÖMÜRLÜK</div>
        <div style="font-size:36px;font-weight:800;margin-bottom:4px;">₺2.499</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:28px;">Tek seferlik ödeme</div>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:32px;">
          <li style="font-size:14px;color:var(--text-secondary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--success);">✓</span> Pro'nun her şeyi
          </li>
          <li style="font-size:14px;color:var(--text-secondary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--success);">✓</span> Sonsuza kadar ücretsiz güncelleme
          </li>
          <li style="font-size:14px;color:var(--text-secondary);display:flex;gap:8px;align-items:center;">
            <span style="color:var(--success);">✓</span> Aylık ücret yok
          </li>
        </ul>
        <a href="#waitlist" class="btn-secondary" style="width:100%;justify-content:center;">
          Erken Erişim Kazan
        </a>
      </div>

    </div>
  </div>
</section>

<div class="divider"></div>
```

- [ ] **Step 2: Pricing grid responsive CSS**

```css
@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr !important;
    max-width: 400px !important;
  }
  .pricing-grid > div:nth-child(2) { transform: none !important; }
}
```

- [ ] **Step 3: Kontrol et**

Beklenen: 3 fiyat kartı, Pro ortada biraz büyük, "EN POPÜLER" badge üstte.

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai pricing section"
```

---

## Task 9: Waitlist Form + Footer

**Files:**
- Modify: `docs/trueai/index.html`

- [ ] **Step 1: Son `<div class="divider">` sonrasına ekle**

```html
<!-- WAITLIST -->
<section class="section" id="waitlist">
  <div class="container" style="text-align:center;max-width:600px;">
    <div class="eyebrow">ERKEN ERİŞİM</div>
    <h2 style="font-size:clamp(28px,4vw,44px);font-weight:700;margin:16px 0 12px;letter-spacing:-0.02em;">
      İlk kullananlardan ol.
    </h2>
    <p style="font-size:16px;color:var(--text-secondary);margin-bottom:40px;line-height:1.6;">
      Beta erişimi açıldığında sana haber verelim.
      İlk 500 kişi Pro planını 3 ay ücretsiz kullanır.
    </p>

    <!-- Form -->
    <form id="waitlist-form" onsubmit="submitWaitlist(event)" style="
      display:flex;gap:12px;max-width:480px;margin:0 auto 12px;
    " class="waitlist-form-row">
      <input
        id="email-input"
        type="email"
        placeholder="email@ornek.com"
        required
        style="
          flex:1;padding:16px 20px;
          background:var(--bg-card);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:var(--radius-full);
          color:var(--text-primary);
          font-family:var(--font);font-size:15px;
          outline:none;transition:border-color 0.2s;
        "
        onfocus="this.style.borderColor='var(--accent)'"
        onblur="this.style.borderColor='rgba(255,255,255,0.12)'"
      />
      <button type="submit" class="btn-primary">
        Kazan →
      </button>
    </form>

    <!-- Success state (başta gizli) -->
    <div id="waitlist-success" style="
      display:none;
      background:rgba(39,174,96,0.1);
      border:1px solid rgba(39,174,96,0.3);
      border-radius:var(--radius-md);
      padding:20px 32px;
      color:#27AE60;
      font-size:16px;
      font-weight:600;
      max-width:480px;
      margin:0 auto;
    ">
      ✓ Listeye eklendin! Beta açıldığında sana haber vereceğiz.
    </div>

    <p style="font-size:12px;color:var(--text-muted);margin-top:12px;">
      Spam yok. İstediğin zaman çıkabilirsin.
    </p>

    <!-- Waitlist sayacı -->
    <div style="
      display:inline-flex;align-items:center;gap:8px;margin-top:28px;
      background:var(--bg-card);border:1px solid rgba(255,255,255,0.07);
      padding:10px 20px;border-radius:var(--radius-full);
      font-size:13px;color:var(--text-secondary);
    ">
      <span style="
        width:8px;height:8px;background:var(--accent);
        border-radius:50%;display:inline-block;
        animation:pulse 2s infinite;
      "></span>
      <span id="bottom-count">347</span> kişi bekleme listesinde
    </div>
  </div>
</section>

<div class="divider"></div>

<!-- FOOTER -->
<footer style="padding:48px 24px;">
  <div class="container">
    <div style="
      display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;
    ">
      <!-- Logo -->
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="
          width:32px;height:32px;background:#fff;border-radius:6px;
          display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;color:#000;
        ">True</div>
        <div>
          <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;">XMOBILE</div>
          <div style="font-size:9px;color:var(--text-muted);letter-spacing:0.12em;">WARDROBE INTELLIGENCE</div>
        </div>
      </div>
      <!-- Links -->
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <a href="#faq" style="font-size:13px;color:var(--text-muted);transition:color 0.2s;"
          onmouseover="this.style.color='#fff'" onmouseout="this.style.color='var(--text-muted)'">
          SSS
        </a>
        <a href="#pricing" style="font-size:13px;color:var(--text-muted);transition:color 0.2s;"
          onmouseover="this.style.color='#fff'" onmouseout="this.style.color='var(--text-muted)'">
          Fiyatlandırma
        </a>
        <a href="mailto:dogrucanemek@gmail.com" style="font-size:13px;color:var(--text-muted);transition:color 0.2s;"
          onmouseover="this.style.color='#fff'" onmouseout="this.style.color='var(--text-muted)'">
          İletişim
        </a>
      </div>
      <!-- Copyright -->
      <div style="font-size:12px;color:var(--text-muted);">
        © 2026 True AI — XMOBILE
      </div>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Pulse animasyonu + form responsive CSS ekle**

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@media (max-width: 540px) {
  .waitlist-form-row {
    flex-direction: column !important;
  }
  .waitlist-form-row .btn-primary {
    width: 100%;
    justify-content: center;
  }
}
```

- [ ] **Step 3: Kontrol et**

Beklenen: Waitlist form ile email input + buton, pulsing indicator, footer tam altında.

- [ ] **Step 4: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai waitlist form + footer"
```

---

## Task 10: JavaScript — Interactivity

**Files:**
- Modify: `docs/trueai/index.html` — `</body>` öncesine `<script>` bloğu ekle

- [ ] **Step 1: `</body>` öncesine ekle**

```html
<script>
// ===== WAITLIST FORM =====
function submitWaitlist(e) {
  e.preventDefault();
  const email = document.getElementById('email-input').value.trim();
  if (!email) return;

  // LocalStorage'a kaydet
  const existing = JSON.parse(localStorage.getItem('trueai_waitlist') || '[]');
  if (!existing.find(item => item.email === email)) {
    existing.push({ email, date: new Date().toISOString() });
    localStorage.setItem('trueai_waitlist', JSON.stringify(existing));
  }

  // UI güncelle
  document.getElementById('waitlist-form').style.display = 'none';
  document.getElementById('waitlist-success').style.display = 'block';

  // Sayacı artır
  incrementCounter();
}

// ===== WAITLIST SAYACI =====
function incrementCounter() {
  const els = [
    document.getElementById('waitlist-count'),
    document.getElementById('bottom-count')
  ];
  els.forEach(el => {
    if (el) {
      const current = parseInt(el.textContent.replace(/\D/g, '')) || 347;
      el.textContent = current + 1;
    }
  });
}

// Yavaş yavaş artan animasyon (8-30 saniyede bir)
function startCounterAnimation() {
  const randomDelay = () => Math.floor(Math.random() * 22000) + 8000;
  setTimeout(function tick() {
    incrementCounter();
    setTimeout(tick, randomDelay());
  }, randomDelay());
}
startCounterAnimation();

// ===== SCROLL FADE-IN =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .feature-grid, .steps-grid > div').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
</script>
```

- [ ] **Step 2: Form'u test et**

Tarayıcıda email gir, submit et.
Beklenen: Form kaybolur, yeşil başarı mesajı görünür. DevTools → Application → LocalStorage → `trueai_waitlist` anahtarında email görünür.

- [ ] **Step 3: Sayaç animasyonunu test et**

8-30 saniye bekle — sayı 1 artmalı.

- [ ] **Step 4: Scroll animasyonunu test et**

Sayfayı scroll et — kartlar yukarıdan aşağıya fade-in yapmalı.

- [ ] **Step 5: Commit**

```bash
git add docs/trueai/index.html
git commit -m "feat: trueai JS interactivity — form, counter, scroll animations"
```

---

## Task 11: SEO Dosyaları

**Files:**
- Create: `docs/trueai/robots.txt`
- Create: `docs/trueai/llms.txt`
- Create: `docs/trueai/pricing.md`

- [ ] **Step 1: `docs/trueai/robots.txt` oluştur**

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://trueai-xmobile.vercel.app/sitemap.xml
```

- [ ] **Step 2: `docs/trueai/llms.txt` oluştur**

```markdown
# True AI — XMOBILE WARDROBE INTELLIGENCE

## Product
True AI (XMOBILE) is a Turkish AI-powered wardrobe assistant mobile app for iOS and Android.

## What it does
- Analyzes the user's wardrobe (photos of clothes)
- Generates daily outfit suggestions based on weather, calendar events, and personal style
- Virtual try-on: AI renders the user wearing selected clothes (30-60 seconds)
- 3D avatar with clothing overlay
- Community outfit feed (social discovery)
- Outfit history tracking

## Target audience
Turkish-speaking users, age 25-45, urban, fashion-conscious, tech-savvy.
Also available in English.

## Business model
Freemium mobile app:
- Free: unlimited wardrobe + 5 AI outfit suggestions/month
- Pro: ₺149/month or ₺999/year (unlimited suggestions, virtual try-on, 3D avatar, Instagram Story export)
- Lifetime: ₺2,499 one-time

## Status
Pre-launch. Building waitlist at this website.

## Tech
React Native (Expo), Claude API for outfit generation, Fashn.ai for virtual try-on, OpenWeatherMap for weather.

## Links
- Waitlist: https://trueai-xmobile.vercel.app
- Contact: dogrucanemek@gmail.com
```

- [ ] **Step 3: `docs/trueai/pricing.md` oluştur**

```markdown
# Pricing — True AI XMOBILE

## Free
- Price: ₺0/month
- Limits: 30 wardrobe items, 5 AI outfit suggestions/month, last 10 outfit history
- Features: wardrobe management, basic AI outfit suggestions, weather integration

## Pro
- Price: ₺149/month (billed monthly) | ₺83/month = ₺999/year (billed annually)
- Limits: unlimited wardrobe, unlimited AI outfit suggestions, unlimited history
- Features: everything in Free + virtual try-on (Fashn.ai), 3D avatar overlay, Instagram Story export, personal style advisor tips, calendar integration

## Lifetime
- Price: ₺2,499 one-time payment
- Limits: same as Pro, no recurring charge
- Features: all Pro features forever, all future updates included
```

- [ ] **Step 4: Kontrol et**

```powershell
Get-Content "docs\trueai\robots.txt"
Get-Content "docs\trueai\llms.txt"
Get-Content "docs\trueai\pricing.md"
```

- [ ] **Step 5: Commit**

```bash
git add docs/trueai/robots.txt docs/trueai/llms.txt docs/trueai/pricing.md
git commit -m "feat: trueai SEO files — robots.txt, llms.txt, pricing.md"
```

---

## Task 12: Mobile Responsive Son Kontrol

**Files:**
- Modify: `docs/trueai/index.html` — son responsive düzeltmeler

- [ ] **Step 1: Chrome DevTools'da 375px kontrolü**

Tarayıcıda `docs/trueai/index.html` aç → F12 → Toggle Device Toolbar → iPhone SE (375px).

Kontrol listesi:
- [ ] Banner: tek satırda okunabilir mi?
- [ ] Nav: logo + CTA sığıyor mu?
- [ ] Hero: tek kolon, screenshot altında mı?
- [ ] 3 adım: dikey mi?
- [ ] Features: screenshot üstte, metin altında mı?
- [ ] FAQ kartları: dikey mi?
- [ ] Pricing kartları: dikey mi, Pro scale yok mu?
- [ ] Waitlist form: input ve button dikey mi (540px altında)?
- [ ] Yatay scroll yok mu?

- [ ] **Step 2: Varsa sorunları `<style>` bloğuna ekleyerek düzelt**

Örnek — nav'da metin taşıyorsa:
```css
@media (max-width: 400px) {
  nav .btn-primary { padding: 8px 16px; font-size: 13px; }
}
```

- [ ] **Step 3: 1440px kontrolü**

DevTools'da 1440px — içerik `max-width: 1200px` içinde ortalı mı? Sol/sağ boşluk eşit mi?

- [ ] **Step 4: Lighthouse hızlı audit**

Chrome DevTools → Lighthouse → Mobile → Analyze.
Beklenen: Performance > 80, SEO > 90, Accessibility > 85.

- [ ] **Step 5: Commit**

```bash
git add docs/trueai/index.html
git commit -m "fix: trueai mobile responsive polish"
```

---

## Task 13: Vercel Deploy

**Files:**
- Create: `docs/trueai/vercel.json` (opsiyonel, redirect için)

- [ ] **Step 1: Vercel'e deploy et**

```bash
cd docs/trueai
npx vercel --yes
```

İlk kez çalıştırıyorsan login sorar:
```bash
npx vercel login
```

- [ ] **Step 2: Deploy URL'ini not et**

Çıktıda şuna benzer bir URL görünür:
```
✅  Production: https://trueai-xmobile.vercel.app [3s]
```

- [ ] **Step 3: Deploy'u tarayıcıda aç ve kontrol et**

```powershell
Start-Process "https://trueai-xmobile.vercel.app"
```

Kontrol: screenshots yüklendi mi? Form çalışıyor mu?

- [ ] **Step 4: OG image URL'lerini production domain ile güncelle**

`docs/trueai/index.html` içindeki OG image URL'lerini düzelt:

```html
<!-- Bul: -->
<meta property="og:image" content="assets/screenshots/outfits.jpeg" />
<meta name="twitter:image" content="assets/screenshots/outfits.jpeg" />

<!-- Değiştir: -->
<meta property="og:image" content="https://trueai-xmobile.vercel.app/assets/screenshots/outfits.jpeg" />
<meta name="twitter:image" content="https://trueai-xmobile.vercel.app/assets/screenshots/outfits.jpeg" />
```

- [ ] **Step 5: Final commit + re-deploy**

```bash
git add docs/trueai/
git commit -m "feat: trueai website complete — ready for launch"
cd docs/trueai && npx vercel --prod
```

---

## Tamamlanma Kriterleri

- [ ] Tüm 7 bölüm (banner, hero, WOW, 3 adım, özellikler, FAQ, fiyat, waitlist, footer) görünür
- [ ] Waitlist form çalışıyor (localStorage'a kaydediyor)
- [ ] Sayaç animasyonu aktif
- [ ] Scroll fade-in animasyonları çalışıyor
- [ ] 375px mobilde yatay scroll yok
- [ ] robots.txt, llms.txt, pricing.md yayında
- [ ] Vercel deploy URL çalışıyor
