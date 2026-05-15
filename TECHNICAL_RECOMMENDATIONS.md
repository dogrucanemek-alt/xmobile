# xmobile — Teknik Öneriler (İmplementasyon Kılavuzu)

**Hedef:** Kalite standartlarını iyileştir, App Store'a hazır hale getir.

---

## 1. VERİ DOĞRULAMA (KRITIK)

### Neden Gerekli?

Şu anda:
```typescript
// lib/vision.ts — kiyafetTani()
const parsed = JSON.parse(metin.slice(bas, son));  // Can crash if malformed
const tur = TURLER.includes(parsed.tur) ? parsed.tur : 'Üst';  // Unsafe
```

**Risk:** User fotoğraf çektiğinde, Claude API weird response dönerse → app crash

### Çözüm: Zod Integration

**Step 1:** Install
```bash
npm install zod
```

**Step 2:** `lib/validators.ts` (new file)
```typescript
import { z } from 'zod';

// Type definitions
const TURLER = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'] as const;

export const KiyafetSchema = z.object({
  ad: z.string().min(1, 'Ad boş olamaz'),
  tur: z.enum(TURLER, { errorMap: () => ({ message: 'Geçersiz tür' }) }),
});

export const KombinSchema = z.object({
  baslik: z.string(),
  tur: z.string(),
  parcalar: z.array(z.string()),
  neden: z.string(),
});

export const HavaDurumuSchema = z.object({
  derece: z.number(),
  durum: z.string(),
  nem: z.number(),
});

// Helper: Safe parse with fallback
export function parseKiyafet(data: unknown): z.infer<typeof KiyafetSchema> | null {
  const result = KiyafetSchema.safeParse(data);
  if (!result.success) {
    console.warn('Validation error:', result.error);
    return null;
  }
  return result.data;
}

export function parseKombinler(data: unknown): Array<z.infer<typeof KombinSchema>> | null {
  if (!Array.isArray(data)) return null;
  const result = z.array(KombinSchema).safeParse(data);
  if (!result.success) {
    console.warn('Kombinler validation:', result.error);
    return null;
  }
  return result.data;
}
```

**Step 3:** Integrate into `lib/vision.ts`
```typescript
import { parseKiyafet, KiyafetSchema } from './validators';

export async function kiyafetTani(imageUri: string): Promise<{ ad: string; tur: string }> {
  try {
    // ... API call ...
    const parsed = parseKiyafet(JSON.parse(metin.slice(bas, son)));
    
    if (!parsed) {
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };  // Safe fallback
    }
    
    return parsed;
  } catch (e) {
    console.error('kiyafetTani error:', e);
    return { ad: 'Yeni Kıyafet', tur: 'Üst' };
  }
}
```

**Step 4:** Apply to other services
```typescript
// lib/aiService.ts
export async function chatJarvis(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(CHAT_URL, { ... });
  const raw = await res.json();
  
  // Instead of: return raw as ChatResponse
  const validated = ChatResponseSchema.safeParse(raw);
  if (!validated.success) throw new Error('Invalid chat response');
  return validated.data;
}

// lib/fashnService.ts
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    const raw = JSON.parse(text);
    return TryOnStatusSchema.safeParse(raw);  // Add validation
  } catch {
    throw new Error(`Invalid response: ${text.slice(0, 120)}`);
  }
}
```

---

## 2. HATA İŞLEME STANDARDIZASYONU (KRITIK)

### Neden?

User'a "Bilinmeyen hata" veya boş mesaj göstermek kötü UX. Ne yapacağını bilmiyor.

### Çözüm: Error Categories + i18n

**`lib/errorHandler.ts` (new file):**
```typescript
import { hataRaporla } from './sentry';

export type ErrorCategory = 
  | 'network'      // No internet
  | 'timeout'      // Request took too long
  | 'validation'   // Bad data format
  | 'server'       // 5xx error
  | 'unauthorized' // 401/403
  | 'not-found'    // 404
  | 'unknown';

export interface AppError extends Error {
  category: ErrorCategory;
  context?: Record<string, unknown>;
}

export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'unknown';
  
  // Network errors
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) return 'network';
  }
  
  // Timeout
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  
  // JSON parsing
  if (error instanceof SyntaxError) return 'validation';
  
  // API errors (with status codes)
  if (error instanceof FetchError) {
    if (error.status >= 500) return 'server';
    if (error.status === 401 || error.status === 403) return 'unauthorized';
    if (error.status === 404) return 'not-found';
    if (error.status >= 400) return 'validation';
  }
  
  return 'unknown';
}

export function getUserMessage(category: ErrorCategory, lang: 'tr' | 'en'): string {
  const messages: Record<ErrorCategory, Record<string, string>> = {
    network: {
      tr: 'İnternet bağlantınız yok. Lütfen WiFi veya mobil veriye bağlanın.',
      en: 'No internet. Please check WiFi or mobile data.',
    },
    timeout: {
      tr: 'İşlem çok uzun sürdü. Lütfen ağınızı kontrol edip tekrar deneyin.',
      en: 'Operation timed out. Check your network and retry.',
    },
    validation: {
      tr: 'Veriler geçersiz. Lütfen tekrar deneyin.',
      en: 'Invalid data. Please try again.',
    },
    server: {
      tr: 'Sunucumuzda sorun var. Lütfen biraz sonra deneyin.',
      en: 'Server error. Please try again later.',
    },
    unauthorized: {
      tr: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
      en: 'Session expired. Please sign in again.',
    },
    not-found: {
      tr: 'Aradığınız şey bulunamadı.',
      en: 'Not found.',
    },
    unknown: {
      tr: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      en: 'An error occurred. Please try again.',
    },
  };
  
  return messages[category][lang] || messages.unknown[lang];
}

export function createAppError(
  error: unknown,
  category: ErrorCategory,
  context?: Record<string, unknown>
): AppError {
  const err = new Error(error instanceof Error ? error.message : String(error)) as AppError;
  err.category = category;
  err.context = context;
  return err;
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const category = categorizeError(error);
  const appError = error instanceof AppError ? error : createAppError(error, category, context);
  
  // Log to console in dev
  if (__DEV__) {
    console.error(`[${appError.category}]`, appError.message, appError.context);
  }
  
  // Report to Sentry in production
  hataRaporla(appError, appError.context);
}

export function handleAsyncError(
  error: unknown,
  context?: Record<string, unknown>,
  fallback: () => void = () => {}
): void {
  logError(error, context);
  fallback();
}
```

### Usage in Components

```typescript
// app/(tabs)/outfits.tsx
async function kombinYukle() {
  try {
    setYukleniyor(true);
    const data = await fetch(`${API_URL}/api/outfit`).then(r => r.json());
    
    // Validate
    const kombinler = parseKombinler(data.kombinler);
    if (!kombinler) {
      const err = createAppError(
        'Invalid outfit data',
        'validation',
        { received: data }
      );
      throw err;
    }
    
    setKombinler(kombinler);
  } catch (error) {
    const category = categorizeError(error);
    const msg = getUserMessage(category, dil);
    
    setError(msg);
    logError(error, { action: 'kombinYukle' });
  } finally {
    setYukleniyor(false);
  }
}
```

---

## 3. SUPABASE ROW-LEVEL SECURITY (KRITIK)

### Neden?

**Security Risk:**
```typescript
// Without RLS, SELECT * FROM wardrobe_items returns ALL users' items
const { data } = await supabase.from('wardrobe_items').select('*');
// User can see another user's wardrobe! KVKK violation.
```

### Çözüm: SQL Migrations

**`supabase/migrations/002_rls_policies.sql` (new file):**
```sql
-- Enable RLS on all user-related tables
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_conversations ENABLE ROW LEVEL SECURITY;

-- ============ WARDROBE_ITEMS ============
CREATE POLICY "Users can see own items"
  ON wardrobe_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON wardrobe_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON wardrobe_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON wardrobe_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============ PROFILES ============
CREATE POLICY "Users can see own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============ POSTS (Public Read, Authenticated Write) ============
CREATE POLICY "Posts are readable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============ LIKES ============
CREATE POLICY "Users can see all likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============ JARVIS_CONVERSATIONS ============
CREATE POLICY "Users can see own conversations"
  ON jarvis_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON jarvis_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Run migration:**
```bash
supabase migration up
# Or via Supabase dashboard: SQL Editor → paste → Run
```

**Test in app:**
```typescript
// After RLS enabled, this will ONLY return authenticated user's items
const { data } = await supabase.from('wardrobe_items').select('*');
// ✓ Safe now
```

---

## 4. TEST FRAMEWORK SETUP

### Jest Configuration

**`jest.config.js` (new file):**
```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/**/*.{tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
```

**`jest.setup.js` (new file):**
```javascript
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  debug: jest.fn(),
};
```

### Example Unit Tests

**`lib/outfitColor.test.ts` (new file):**
```typescript
import { renkBul, parcaEsle, kiyafetRenkBul } from './outfitColor';
import type { Kombin, Kiyafet } from './types';

describe('outfitColor', () => {
  describe('renkBul', () => {
    it('should identify "Siyah" in "Siyah Jean"', () => {
      expect(renkBul('Siyah Jean')).toBe('Siyah');
    });

    it('should identify "Beyaz" in "Beyaz Gömlek"', () => {
      expect(renkBul('Beyaz Gömlek')).toBe('Beyaz');
    });

    it('should return first color in multi-color name', () => {
      expect(renkBul('Siyah ve Beyaz Çizgili Tişört')).toBe('Siyah');
    });

    it('should return null if no color found', () => {
      expect(renkBul('Tişört')).toBeNull();
    });
  });

  describe('parcaEsle', () => {
    const kombin: Kombin = {
      baslik: 'Günlük',
      tur: 'casual',
      parcalar: ['Gri Jean', 'Beyaz Gömlek', 'Siyah Bot'],
      neden: 'Rahat ve şık',
    };

    it('should match "jean" to "Gri Jean"', () => {
      expect(parcaEsle(kombin, ['jean', 'pantolon'])).toBe('Gri Jean');
    });

    it('should match "bot" to "Siyah Bot"', () => {
      expect(parcaEsle(kombin, ['bot', 'ayakkabı'])).toBe('Siyah Bot');
    });

    it('should return null if no match', () => {
      expect(parcaEsle(kombin, ['elbise'])).toBeNull();
    });
  });
});
```

**`lib/freemium.test.ts` (new file):**
```typescript
import { kombinHakkiVar, kombinKullan, kalanHakAl } from './freemium';

describe('freemium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Pro users should have unlimited combos', async () => {
    const allowed = await kombinHakkiVar(true);
    expect(allowed).toBe(true);
  });

  it('Free users should have 5 combos per month', async () => {
    const allowed = await kombinHakkiVar(false);
    expect(allowed).toBe(true);
  });

  it('should track remaining combos', async () => {
    const stats = await kalanHakAl(false);
    expect(stats.limit).toBe(5);
    expect(stats.isPro).toBe(false);
  });
});
```

### CI/CD Integration

**`.github/workflows/test.yml` (new file):**
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

**`package.json` (add scripts):**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "expo lint"
  }
}
```

---

## 5. CONTEXT REFACTORING (Lower Priority)

### Current Issue
`lib/context.tsx` is 285 lines, mixing themes + translations + UI state.

### Solution: Split into modules

**`lib/themeContext.tsx` (new file):**
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';

interface ThemeContextValue {
  karanlik: boolean;
  temaGecisAnimValue: Animated.Value;
  temaDegistir: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [karanlik, setKaranlik] = useState(false);
  const temaGecisAnimValue = new Animated.Value(0);

  useEffect(() => {
    AsyncStorage.getItem('xmobile_karanlik').then(v => {
      setKaranlik(v === 'true');
    });
  }, []);

  const temaDegistir = async () => {
    setKaranlik(k => !k);
    Animated.timing(temaGecisAnimValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      Animated.timing(temaGecisAnimValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <ThemeContext.Provider value={{ karanlik, temaGecisAnimValue, temaDegistir }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be within ThemeProvider');
  return ctx;
}
```

**`lib/translationContext.tsx` (new file):**
```typescript
// Similar structure, isolate çeviriler
```

**`app/_layout.tsx` (updated):**
```typescript
import { ThemeProvider } from '../lib/themeContext';
import { TranslationProvider } from '../lib/translationContext';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TranslationProvider>
          <AuthProvider>
            <SubscriptionProvider>
              {/* ... */}
            </SubscriptionProvider>
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

---

## 6. OFFLINE-FIRST DATA SYNC (Nice-to-have)

### Problem
If network dies while saving wardrobe, user loses data.

### Solution: Sync Queue
```typescript
// lib/syncQueue.ts (new file)
interface QueueItem {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table: 'wardrobe_items' | 'profiles';
  data: any;
  timestamp: number;
}

export class SyncQueue {
  private queue: QueueItem[] = [];

  async add(item: QueueItem) {
    this.queue.push(item);
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.queue));
  }

  async process() {
    for (const item of this.queue) {
      try {
        await this.execute(item);
        // Remove from queue
        this.queue = this.queue.filter(q => q.id !== item.id);
      } catch (e) {
        console.error(`Sync failed for ${item.id}:`, e);
        // Retry later
      }
    }
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.queue));
  }

  private async execute(item: QueueItem) {
    // Execute Supabase operation
  }
}
```

---

## TIMELINE

- **Week 1:** Validators + Error handler + RLS (3 days)
- **Week 2:** Jest setup + 10 unit tests (3 days)
- **Week 3:** Context split + bundle optimization (2 days)
- **Week 4:** E2E tests + TestFlight (3 days)

---

**İmplementasyondan önce:** Memory dosyalarını, spec'i ve feedback'leri dikkate al.
**Her değişiklikten sonra:** `npm run test && npm run lint` çalıştır.
