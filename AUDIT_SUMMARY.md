# xmobile Denetim Özeti — 30 Günlük Eylem Planı

**Tarih:** 15 Mayıs 2026 | **Durum:** App Store'a hazır mı? **Henüz değil**

---

## En Kritik 5 Sorun

### 1. TEST ALTYAPıSI YOK (0 test satırı)
- **Risk:** Refactoring çıldırtıcı, regression bugs gözden kaçıyor
- **Çözüm:** Jest + React Native Testing Library setup (8 saat)
- **Quick win:** 10 unit test yazıp CI/CD'de çalıştır
- **Deadline:** 22 Mayıs

### 2. VERİ DOĞRULAMA EKSİK
- **Risk:** API hatalarında app crash (JSON.parse hatası)
- **Dosyalar:** `lib/vision.ts`, `lib/fashnService.ts`, `lib/aiService.ts`
- **Çözüm:** Zod schema validation ekle (4-6 saat)
- **Deadline:** 20 Mayıs

### 3. HATA İŞLEME STANDARDSIZ
- **Risk:** User'ın ne yapması gerektiğini bilemiyor (boş error message)
- **Dosyalar:** App genelinde error catch blocks
- **Çözüm:** `lib/errorHandler.ts` + kategorize + translate (3-4 saat)
- **Deadline:** 21 Mayıs

### 4. SUPABASE RLS POLİCİES YOK
- **Risk:** Diğer user'ın gardıropunu görebilir, KVKK ihlali
- **Çözüm:** SQL migration ile RLS enable et (2 saat)
- **Deadline:** 19 Mayıs (URGENTLY)

### 5. LEGAL SCREENS EKSİK
- **Risk:** App Store reddedebilir (privacy policy + KVKK metni)
- **Dosyalar:** `app/privacy.tsx` var ama KVKK modal yok
- **Çözüm:** Legal modal component ekle (2-3 saat)
- **Deadline:** 20 Mayıs

---

## 30 GÜNLÜK HAZIRLIK PLANI

### HAFTA 1 (15-21 Mayıs) — CRITICAL FIXES

**Pazartesi (15 Mayıs)**
- [ ] RLS policies deploy (Supabase SQL migration)
- [ ] Sentry production config test
- [ ] Privacy policy modal review & deploy

**Salı (16 Mayıs)**
- [ ] Jest + testing library setup (package.json)
- [ ] GitHub Actions CI config
- [ ] Test file structure creation

**Çarşamba (17 Mayıs)**
- [ ] 5 unit test yazıp CI'da çalıştırma (outfitColor, freemium, validators)
- [ ] Veri doğrulama layer (`lib/validators.ts`) skeleton

**Perşembe (18 Mayıs)**
- [ ] Error handler standardization başlangıç
- [ ] Network error categorization

**Cuma (19 Mayıs)**
- [ ] Error handler complete
- [ ] 3 integration test yazılsın
- [ ] Internal testing (Expo Go)

**Cumartesi-Pazar (20-21 Mayıs)**
- [ ] Bug fixes from testing
- [ ] Performance baseline measurement
- [ ] Code review & refactoring

---

### HAFTA 2 (22-28 Mayıs) — ROBUSTNESS

**Pazartesi (22 Mayıs)**
- [ ] Test coverage 10% → 30% (20 critical paths)
- [ ] Zod schema integration complete
- [ ] API validation errors caught

**Salı-Çarşamba (23-24 Mayıs)**
- [ ] Context splitting (context.tsx modularization)
- [ ] Unused code cleanup
- [ ] Bundle size audit

**Perşembe (25 Mayıs)**
- [ ] Accessibility audit (a11y)
- [ ] Screen reader testing
- [ ] WCAG 2.1 AA fixes (top 10)

**Cuma (26 Mayıs)**
- [ ] E2E test framework decision (Detox vs Maestro)
- [ ] 3 critical user flows E2E tested
- [ ] Android specific fixes (presentation style, WebView)

**Cumartesi-Pazar (27-28 Mayıs)**
- [ ] Load testing (concurrent API calls)
- [ ] Memory leak hunt (React DevTools profiler)
- [ ] Staging build via EAS

---

### HAFTA 3 (29 Mayıs - 4 Haziran) — APP STORE PREP

**Pazartesi (29 Mayıs)**
- [ ] App Store screenshot capture (6.7" iPhone)
- [ ] Android screenshot capture (Pixel 6/7)
- [ ] Metadata finalization (description, keywords)

**Salı (30 Mayıs)**
- [ ] TestFlight build upload
- [ ] Internal + beta tester group test (50 people)
- [ ] Crash report monitoring

**Çarşamba-Perşembe (31 Mayıs - 1 Haziran)**
- [ ] TestFlight feedback collection & fixes
- [ ] Google Play Console setup
- [ ] Privacy policy legal review

**Cuma-Cumartesi (2-3 Haziran)**
- [ ] Final QA pass (all features on real device)
- [ ] Sentry monitoring setup
- [ ] OTA update channels test

**Pazar (4 Haziran)**
- [ ] App Store submit (metadata complete, screenshots)
- [ ] Google Play submit (parallel)
- [ ] Monitoring dashboard setup (Sentry + App Analytics)

---

### HAFTA 4 (5-11 Haziran) — MONITORING & SUPPORT

**Pazartesi (5 Haziran)**
- [ ] App Store review başlanmış (waiting state)
- [ ] Crash report monitoring (daily check)
- [ ] Community beta feedback handling

**Salı-Perşembe (6-9 Haziran)**
- [ ] Review response management (if rejected, fix & resubmit)
- [ ] Post-launch bug fixes queue
- [ ] Analytics dashboard review

**Cuma (10 Haziran)**
- [ ] App Store approval confirmation (hopefully!)
- [ ] Release notes preparation
- [ ] Influencer notification

**Cumartesi-Pazar (11-12 Haziran)**
- [ ] Official launch communication
- [ ] Post-launch monitoring (24/7)
- [ ] User support queue management

---

## DOSYA-DOSYA BOZULMA RİSK SAYıSı

| Dosya | Sorun | Çözüm | Deadline |
|-------|-------|-------|----------|
| `lib/vision.ts` | JSON.parse crash | Zod validation | 20 Mayıs |
| `lib/fashnService.ts` | Timeout handling inconsistent | timeoutSignal wrapper | 20 Mayıs |
| `app/(tabs)/outfits.tsx` | Generic error messages | Error handler integration | 21 Mayıs |
| `lib/context.tsx` | 285 satır, over-abstraction | Modularize (4 files) | 24 Mayıs |
| `lib/authContext.tsx` | Memory leak risk (notifications) | Cleanup audit | 25 Mayıs |
| `app/(tabs)/ai.tsx` | API response parsing | Validation layer | 22 Mayıs |
| `lib/wardrobeSync.ts` | Silent failures | Error logging | 21 Mayıs |
| `lib/subscriptionContext.tsx` | No RevenueCat real testing | TestFlight integration | 30 Mayıs |

---

## BAŞLANGIÇ KODLARI

### 1. Test Setup (hemen başla)
```bash
npm install --save-dev jest @testing-library/react-native babel-jest @babel/preset-env
# jest.config.js oluştur
# .github/workflows/test.yml oluştur (CI)
```

### 2. Veri Doğrulama (20 Mayıs)
```typescript
// lib/validators.ts — yeni dosya
import { z } from 'zod';

export const KiyafetSchema = z.object({
  id: z.number(),
  ad: z.string().min(1),
  tur: z.enum(['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar']),
  sezon: z.string(),
  foto: z.string().nullable(),
  renk: z.string().optional(),
  fiyat: z.number().optional(),
});

export type ValidatedKiyafet = z.infer<typeof KiyafetSchema>;
```

### 3. Error Handler (21 Mayıs)
```typescript
// lib/errorHandler.ts — yeni dosya
export type ErrorCategory = 'network' | 'validation' | 'timeout' | 'server' | 'unknown';

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof TypeError && error.message.includes('fetch')) return 'network';
  if (error instanceof SyntaxError) return 'validation';
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  // ...
  return 'unknown';
}

export function getUserMessage(category: ErrorCategory, lang: 'tr' | 'en'): string {
  const messages: Record<ErrorCategory, Record<string, string>> = {
    network: { tr: 'İnternet bağlantınızı kontrol edin', en: 'Check your internet connection' },
    validation: { tr: 'Veriler geçersiz, lütfen tekrar deneyin', en: 'Invalid data, please try again' },
    timeout: { tr: 'İşlem çok uzun sürdü, lütfen tekrar deneyin', en: 'Operation timed out, please retry' },
    server: { tr: 'Sunucuda hata oluştu, lütfen daha sonra deneyin', en: 'Server error, please try later' },
    unknown: { tr: 'Bir hata oluştu, lütfen yeniden deneyin', en: 'An error occurred, please try again' },
  };
  return messages[category][lang];
}
```

### 4. RLS Migration (19 Mayıs - URGENTLY)
```sql
-- supabase/migrations/002_rls_policies.sql
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own wardrobe" ON wardrobe_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own wardrobe" ON wardrobe_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Posts are public read" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## REFERANS DOSYALARI

| Dosya | Satırlar | Durum |
|-------|----------|-------|
| `ARCHITECTURE_AUDIT.md` | 700+ | ✓ Detaylı inceleme |
| `lib/vision.ts` | 93 | ⚠ Validation eksik |
| `lib/aiService.ts` | 75 | ⚠ Error handling eksik |
| `lib/fashnService.ts` | 180+ | ⚠ Partial validation |
| `lib/context.tsx` | 285 | ⚠ Too large (refactor) |
| `app/(tabs)/outfits.tsx` | 1000+ | ⚠ Complex component |
| `lib/errorHandler.ts` | — | ✗ EKSIK (CREATE) |
| `lib/validators.ts` | — | ✗ EKSIK (CREATE) |

---

## APP STORE CHECKLIST

### Metadata
- [ ] App name: "xmobile — AI Moda Asistanı"
- [ ] Tagline: "Yapay zeka destekli gardırobunuzla her gün doğru kombinasyonu giyin."
- [ ] Keywords: moda, kıyafet, kombinleme, AI, gardırob
- [ ] Support email: dogrucanemek@gmail.com
- [ ] Privacy policy URL: (linked in app modal)

### Technical
- [ ] iOS bundle ID: `com.xmobile.app` ✓
- [ ] Android package: `com.xmobile.app` ✓
- [ ] Minimum iOS: 13.0
- [ ] Minimum Android: API 24 (7.0+)
- [ ] Permissions disclosed: Camera, Photos, Location, Microphone ✓

### Screenshots (2x sets)
- [ ] iPhone 6.7" screenshots (5 screens)
- [ ] Android Pixel 6 screenshots (5 screens)
- [ ] Captions in Turkish + English

### Legal
- [ ] Privacy Policy screen (in-app) ✓
- [ ] KVKK compliance text (modal) — PENDING
- [ ] Terms of service (link) — PENDING
- [ ] Copyright notice: © 2026 Emekcan Doğru

### Testing
- [ ] TestFlight: Beta tester group (50) — PENDING
- [ ] Google Play internal testing — PENDING
- [ ] Real device QA (iPhone + Android) — PENDING

---

## İLETİŞİM & MONITORING

**Daily standup (Pazartesi-Cuma 10:00):**
- Blocking issues report
- Test coverage % tracking
- App Store readiness %

**Sentry monitoring (production launch sonrası):**
- Crash rate < 0.5%
- API error rate < 2%
- OTA update success rate > 95%

**User feedback (TestFlight + beta):**
- NPS score target: >40
- Critical bug fix SLA: 4 hours
- Non-critical SLA: 24 hours

---

**Hazırlanması:** Claude Haiku 4.5
**Gözden geçirme:** Kullanıcı (Emekcan Doğru)
**Başlangıç:** 15 Mayıs 2026 (Bugün)
**Hedef:** 11 Haziran 2026 (Launch)
