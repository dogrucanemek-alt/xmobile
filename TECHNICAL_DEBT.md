# xmobile — Technical Debt & Refactoring Roadmap

## 📋 Teknik Borç Envanteri

### Tier 1: Ödenmesi Gerekli (This Month)

#### 1. Context Splitting 🔴
**File:** `lib/context.tsx` (285 satır)  
**Problem:** Too many responsibilities in one context  
**Impact:** Hard to test, rerender performance

**Current structure:**
```typescript
// lib/context.tsx — MONOLITHIC
export const AppContext = createContext<{
  t: (key: string) => string;
  renkler: { ... };
  dil: 'tr' | 'en';
  temaDegistir: () => void;
  aksanRenk: string;
  // ... 15+ more properties
}>(null);
```

**Solution:**
```typescript
// lib/themeContext.tsx
export const ThemeContext = createContext<{
  dil: 'tr' | 'en';
  temaDegistir: () => void;
  aksanRenk: string;
  renkler: ColorScheme;
}>(null);

// lib/i18nContext.tsx
export const I18nContext = createContext<{
  t: (key: string, params?: Record<string, any>) => string;
}>(null);

// lib/appContext.tsx (combines all)
export function AppProvider({ children }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
```

**Refactor steps:**
1. Extract theme logic → themeContext.tsx
2. Extract i18n logic → i18nContext.tsx
3. Keep only provider combination in context.tsx
4. Update all imports: `useApp()` → `useTheme()` + `useI18n()`

**Time estimate:** 3-4 hours  
**Test coverage needed:** 85%+ (critical path)

---

#### 2. Monolithic Screen Components 🔴

**Files:** 
- `app/(tabs)/outfits.tsx` (900+ lines)
- `app/(tabs)/wardrobe.tsx` (450+ lines)

**Problem:** All logic + UI in one file

**outfits.tsx split plan:**
```
OLD: app/(tabs)/outfits.tsx (900 lines)

NEW:
├─ app/(tabs)/outfits.tsx (150 lines — shell only)
├─ components/AvatarSVG.tsx (240 lines)
├─ components/CombinCard.tsx (180 lines)
├─ components/LoadingScreen.tsx (80 lines)
├─ hooks/useCombinRecommendation.ts (150 lines)
├─ hooks/useTryOn.ts (100 lines)
└─ hooks/useComparison.ts (60 lines)
```

**wardrobe.tsx split plan:**
```
OLD: app/(tabs)/wardrobe.tsx (450 lines)

NEW:
├─ app/(tabs)/wardrobe.tsx (120 lines — shell)
├─ components/KiyafetCard.tsx (100 lines)
├─ components/KiyafetModal.tsx (150 lines)
├─ hooks/useWardrobeData.ts (80 lines)
└─ hooks/useMultiSelect.ts (60 lines)
```

**Time estimate:** 2-3 days  
**Benefit:** Testability ↑ 50%, Maintainability ↑ 60%

---

#### 3. API Endpoint Documentation 🟡

**Problem:** xmobile-proxy endpoints not documented  
**Solution:** Create API spec

**File:** `docs/PROXY_API.md`

```markdown
# xmobile-proxy API Reference

## /api/chat
**Purpose:** Claude Haiku inference with system prompt  
**Method:** POST  
**Auth:** None (rate limited by IP)  

**Request:**
```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 300,
  "system": "You are a fashion assistant...",
  "messages": [
    { "role": "user", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "content": [
    { "type": "text", "text": "..." }
  ],
  "stop_reason": "end_turn"
}
```

**Error handling:**
- 429: Rate limited (wait 60s)
- 503: Service unavailable

---

## /api/weather
**Purpose:** Get weather by coordinates  
**Method:** GET  
**Query params:** lat, lon  

```
GET /api/weather?lat=41.0&lon=29.0
→ { derece: 18, durum: "Bulutlu", ... }
```

---

## /api/fashn/run
**Purpose:** Start virtual try-on  
**Method:** POST  

**Request:**
```json
{
  "person_image": "base64 or URL",
  "garment_images": ["url1", "url2"],
  "category": "tops"  // Fashn.ai category
}
```

**Response:** { "task_id": "unique-id" }

---

## /api/fashn/status
**Purpose:** Poll try-on results  
**Method:** GET  
**Query params:** task_id  

```
GET /api/fashn/status?task_id=xxx
→ { status: "completed", output_image: "url", output_url: "url" }
```
```

**Time estimate:** 4 hours  
**Impact:** Onboarding new devs → 80% faster

---

### Tier 2: Should Do (Next 2-3 months)

#### 4. Type System Hardening

**Current:**
```typescript
// ❌ Using any
type ErrorResponse = any;

// ❌ Non-null assertion
return data!.profile;

// ❌ Poor typing
const result = await callApi(...);
```

**Target:**
```typescript
// ✅ Proper types
type ErrorResponse = {
  error: { message: string; code: string };
};

// ✅ Safe access
return data?.profile ?? fallback;

// ✅ Discriminated unions
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Audit command:**
```bash
grep -r " as any" app lib --include="*.ts" --include="*.tsx" | wc -l
# Goal: < 5 (currently: ~15)
```

---

#### 5. Error Boundary Implementation

**Missing:** No error boundaries  
**Impact:** One component error = app crash

**Add:**
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { contexts: { react: info } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text>Bir hata oluştu</Text>
          <Button onPress={() => this.setState({ hasError: false })}>
            Tekrar Dene
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

// app/_layout.tsx
<ErrorBoundary>
  <RootNavigator />
</ErrorBoundary>
```

**Time estimate:** 1-2 hours

---

#### 6. Performance Monitoring

**Add:**
```typescript
// lib/performanceMonitoring.ts
import * as Sentry from 'sentry-react-native';

export function initPerformanceMonitoring() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,  // 20% of transactions
    integrations: [
      new Sentry.ReactNavigationInstrumentation({
        enableTimeToFirstInteraction: true,
      }),
    ],
  });
}

// Track slow operations
export async function trackAsyncOperation<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({ name });
  const span = transaction.startChild({ op: 'operation' });
  
  try {
    const result = await fn();
    span.setStatus('ok');
    return result;
  } catch (e) {
    span.setStatus('error');
    Sentry.captureException(e);
    throw e;
  } finally {
    span.finish();
    transaction.finish();
  }
}

// Usage in wardrobe.tsx:
const yukle = async () => {
  return trackAsyncOperation('wardrobe.load', async () => {
    // ... existing code
  });
};
```

---

### Tier 3: Nice to Have (4+ months)

#### 7. Storybook Component Library
```bash
npx storybook init --type react_native
```

**Benefits:**
- Visual component testing
- Design system documentation
- QA friendly

---

#### 8. Code Generation (GraphQL Codegen)
**If future:** Backend GraphQL API

```bash
npx graphql-code-generator init
```

---

## Refactoring Priority Matrix

| Task | Effort | Impact | Priority |
|------|--------|--------|----------|
| Context splitting | 4h | High | CRITICAL |
| Screen component split | 16h | High | CRITICAL |
| API documentation | 4h | Medium | HIGH |
| Type hardening | 8h | Medium | HIGH |
| Error boundary | 2h | High | HIGH |
| Performance monitoring | 6h | Medium | MEDIUM |
| Storybook | 20h | Low | MEDIUM |
| GraphQL Codegen | 12h | Low | LOW |

---

## Refactoring Timeline

### Week 1-2: Context & Components
```
Day 1-2: themeContext.tsx + i18nContext.tsx
Day 3: Update all imports
Day 4-5: Split outfits.tsx
Day 6-8: Split wardrobe.tsx
Day 9-10: Tests for new components
```

### Week 3: Documentation & Types
```
Day 11-12: API documentation
Day 13-15: Type hardening audit + fixes
Day 16: Error boundaries
```

### Week 4+: Performance & Polish
```
Day 17-18: Performance monitoring
Week 5+: Storybook, GraphQL, etc.
```

---

## Checklist

- [ ] Review AUDIT_REPORT.md (2000+ lines)
- [ ] Create issues for each tech debt item
- [ ] Assign priorities to team
- [ ] Schedule refactoring sprints
- [ ] Setup code review checklist
- [ ] Monitor: Test coverage, bundle size, performance metrics

---

**Last updated:** 15 Mayıs 2026  
**Owner:** Claude Opus 4.7
