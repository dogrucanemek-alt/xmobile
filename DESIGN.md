# xmobile — Design System

> AI-powered fashion assistant mobile app. This document defines the desired
> look and feel for Google Stitch, AI coding agents, and designers.
> Last updated: 2026-05-17

## Brand

**Product:** xmobile — AI Moda Asistanı / AI Fashion Stylist
**Audience:** 18-35, fashion-conscious smartphone users in Turkey + Europe
**Positioning:** Personal AI stylist that lives in your pocket. Reads your
wardrobe, sees the weather, suggests what to wear, and lets you virtually
try on anything before buying.
**Voice:** Confident, modern, conversational. Not influencer-cringe.
Premium but accessible.

## Aesthetic — The One-Liner

**"Spotify Wrapped meets Notion meets a Tesla touchscreen."**

- **Spotify Wrapped:** bold typography, vibrant accent colors over deep
  backgrounds, generous whitespace, screen-as-a-card layouts
- **Notion:** quiet sophistication, function over flourish, content-first
- **Tesla:** monochrome dark base, single signature accent, no clutter,
  every pixel intentional

## Core Visual Tokens

### Colors

```
Background base:     #060B14   (deep navy-black)
Background elevated: #0A111E   (cards/sheets)
Background glass:    rgba(255,255,255,0.04)  (overlay cards)

Foreground:          #F5F0E8   (warm off-white — never pure #FFF)
Foreground muted:    rgba(245,240,232,0.72)
Foreground hint:     rgba(245,240,232,0.5)

Accent (signature):  #00D4FF   (electric cyan)
Accent deep:         #1a8aa8
Accent line:         rgba(0,212,255,0.18)
Accent glow:         rgba(0,212,255,0.45)

Status — success:    #2ED573   (mint green)
Status — warning:    #F39C12   (amber)
Status — danger:     #E74C3C   (coral red)

Score 90+ outfit:    #27AE60
Score 60-89:         #F39C12
Score <60:           #E74C3C

Pro tier badge:      gold gradient (#FFC107 → #FFA000)
```

**Never use:**
- Default Tailwind palette (indigo-500, blue-600, etc.)
- Pure white (#FFFFFF) — use #F5F0E8
- Pure black (#000000) — use #060B14
- Flat hex shadows — use color-tinted rgba shadows

### Typography

**Display / Headlines:** Cormorant Garamond (serif), weight 600-700
- Used for: app name, screen titles, hero text
- Tight tracking: -0.03em on 30px+
- Italic accents for emphasis

**Body / UI:** Space Grotesk (sans), weights 300/500/700
- Used for: paragraphs, labels, buttons, navigation
- Generous line-height: 1.65 for body, 1.4 for compact
- Weight 300 default, 500 for emphasis, 700 only for CTAs

**Numerals (scores, prices, counters):** Space Grotesk 700 — tabular-nums

### Spacing System

Base unit: **4px**.
Allowed: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120.
Never use random pixel values.

Card padding: 20px (mobile) / 32px (tablet)
Section gap: 32px
Inline gap: 8-12px

### Border Radius

- Pills / CTAs: 50px (full)
- Cards: 14-18px
- Inputs: 10-12px
- Sheet/modal: 18px top-only
- Tiny chips: 6-8px

### Shadows

**No flat shadows.** Always color-tinted with low opacity:

```
shadow-sm: 0 0 20px rgba(0,212,255,0.10), 0 4px 12px rgba(0,0,0,0.40)
shadow-md: 0 0 40px rgba(0,212,255,0.15), 0 12px 28px rgba(0,0,0,0.50)
shadow-glow: 0 0 60px rgba(0,212,255,0.05), 0 12px 40px rgba(0,0,0,0.4)
```

### Gradients

Layered, not flat. Examples:

**Page background:**
```
radial-gradient(ellipse at top, #0c1525 0%, #060B14 60%)
```

**Hero card:**
```
linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)
+ border 1px rgba(0,212,255,0.18)
```

**Atmosphere (night sky with weather):**
- Dynamic gradient based on weather + time
- 42 stars + 3 cloud particles + optional rain/snow

## Layout Patterns

### Card

```
background: rgba(255,255,255,0.04)
border: 1px solid rgba(0,212,255,0.18)
border-radius: 14-18px
padding: 20px
shadow: shadow-glow (above)
```

### Pill Button (primary CTA)

```
background: #00D4FF
color: #000
border-radius: 50px
padding: 18px 24px
font: Space Grotesk 700, 15px
on-press: subtle scale(0.97), no opacity drop
```

### Secondary Button

```
background: transparent
border: 1px solid rgba(0,212,255,0.4)
color: #00D4FF
border-radius: 50px
padding: 14px 20px
```

### Counter Chip (free tier indicator)

```
"👗 2/3 deneme · ✨ 25/30 öneri    [PRO →]"

green color when >50% remaining
amber when 20-50%
red when <20%
```

### Bottom Tab Bar (5 tabs)

Tabs: Kombin · Gardırop · Keşfet · AI · Profil
- Active: cyan glow + white text
- Inactive: muted
- Background: dark blurred glass

## Key Screens to Design

### 1. Today's Outfits ("Bugünkü Kombinler")

The hero screen. Above-fold elements:
- Header: calendar icon (left), title centered, dark mode/lang/refresh/url icons (right)
- Free counter chip (if free tier)
- Weather card: temp, condition, humidity, city — atmospheric icon
- **Outfit card** (the centerpiece):
  - Left: user's photo (transparent BG via rembg) integrated into card
  - Right: outfit title (serif), tag chip ("İş"), description (3 lines), color score with progress bar
  - Bottom-left of photo: 📷/🎮 toggle (photo vs 3D)
  - Page dots (3 outfits, swipeable)
- Outfit selector pills: "1. İş · 2. Günlük · 3. Sosyal"
- "Bu Kombin" section: list of items with reload + 3D buttons each
- "Sanal Dene" CTA at bottom

### 2. Wardrobe ("Gardırop")

- Top: search bar + add button (+)
- Filter pills: All · Tops · Bottoms · Shoes · Outerwear
- Grid 2-col: cards with photo + name + cost-per-wear
- Each card: 👗 Dene + ↑ Paylaş buttons

### 3. Try-On Modal

- Header: title + ✕ close
- Model photo (large, current user's transparent profile photo)
- "Denemek istediğin parçaları seç:" section
- Items list (selectable with checkboxes)
- 👗 Dene CTA pill at bottom

### 4. URL Try-On Sub-Modal

- TextInput: "https://..." with paste button
- Önizle button
- Product preview card: image, title, brand, price
- 👗 Sanal Dene CTA

### 5. Subscription / Pro Upsell

- Big "PRO" badge
- Logo + tagline
- 🎁 7 günlük ücretsiz badge
- Feature list with cyan accent icons
- Plan selector (Monthly / Annual / Lifetime)
- Primary CTA pill

### 6. Discover ("Keşfet" — community feed)

- Pinterest-style 2-col grid
- Outfit cards with photo + user + like count
- Tap → outfit detail

## Iconography

- Style: **stroke icons, 1.5px weight** (Lucide-like)
- Size: 20px (inline), 24px (nav), 32px (feature)
- Color: inherit from text, cyan for active/CTA
- Avoid filled icons except status badges

## Imagery Rules

- **Photos:** Always background-removed (rembg). Figure integrates into
  scene without rectangular white box.
- **Avatars:** SVG silhouette, colored by current outfit
- **3D models:** Three.js GLB via WebView, clothing as colored layers
- **Atmospheric:** MidnightSky component — gradient + stars + clouds +
  precipitation reacting to real weather data

## Animations

- **Allowed:** transform (translate, scale, rotate), opacity
- **Forbidden:** transition-all, layout animations
- **Easing:** cubic-bezier(.22, 1, .36, 1) (spring-like)
- **Duration:** 150-250ms most, 400ms for sheet transitions
- **Loading:** ActivityIndicator cyan #00D4FF, never spinning circle on top of content

## Voice & Microcopy

- Turkish first, English secondary
- Conversational ("Bugünkü kombinin hazır") not formal
- Short button labels ("Dene", "Paylaş") not verbose
- Emoji used sparingly as functional icons (👗, ✨, 🔗, 🎮)

## Pitfalls (AI Slop Detection)

If your design has any of these, **start over**:
- Default Tailwind blue/indigo as primary
- Pure white text
- transition-all on every element
- Flat box-shadow
- "Lorem ipsum" placeholder text — use real Turkish content
- Generic Material Design / shadcn defaults
- Same font for headings and body
- Center-aligned everything
- Icons without consistent stroke weight
- More than 3 colors in one screen

## Reference Stack

Building on:
- React Native + Expo SDK 54
- Skia for color matrix effects
- expo-linear-gradient for fades
- react-native-svg for atmospheric elements
- expo-image for photos with transition
- @shopify/react-native-skia for advanced filters

## Inspirations (not copying)

- Spotify Wrapped 2024 — typography + accent on dark
- Apple Weather iOS 17 — atmospheric animation + content over scene
- Notion mobile — quiet hierarchy
- Threads onboarding — pill buttons + minimal palette
- Stitch Fix — outfit cards
- Linear — keyboard-shortcuts ethos applied to gestures

## Don'ts

- ❌ Do not use shadcn/ui out of the box
- ❌ Do not use Material Design components
- ❌ Do not use default iOS UIKit blue
- ❌ Do not use the App Store icon construction grid template
- ❌ Do not use "AI Furniture" branding (separate product)
- ❌ Do not add a hamburger menu (use bottom tabs)
- ❌ Do not use stock photos of models — generate or use user's own

## Brand Assets

- App icon: 1024×1024, cyan #00D4FF "x" mark over dark gradient,
  NO text other than the x letter mark, no rounded corners (iOS rounds),
  no shadow extending beyond canvas
- Splash: 300×300 mark on #0A0A0A background, transparent PNG
- Adaptive icon (Android): foreground 432×432 with 268×268 safe zone,
  background dark gradient
