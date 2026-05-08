# 3D Kıyafet Görüntüleyici Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** xmobile kombin ekranında her kıyafet parçasına "3D" butonu ekle — Meshy API ile model üret, WebView + Three.js ile döndürülebilir 3D viewer göster, freemium gating uygula.

**Architecture:** Meshy API (text-to-3D) → GLB URL → WebView içinde inline Three.js HTML renderer. Her parça adı prompt olarak Meshy'e gider, sonuç AsyncStorage'da cache'lenir. SubscriptionContext tier kontrolü yapar. expo-document-picker ile web'den GLB dosyası içe aktarılabilir.

**Tech Stack:** react-native-webview (zaten kurulu 13.15.0), Meshy API v2, Three.js 0.128.0 (CDN, script-tag uyumlu), AsyncStorage, expo-document-picker (kurulacak)

---

## Dosya Haritası

| Dosya | Durum | Görev |
|-------|-------|-------|
| `lib/types.ts` | Modify | MeshyGorev tipi ekle |
| `lib/meshyService.ts` | Create | Meshy API çağrıları + AsyncStorage cache |
| `lib/subscriptionContext.tsx` | Create | Tier state + aylık sayaç |
| `components/ThreeDViewer.tsx` | Create | WebView + Three.js GLB renderer |
| `components/UpsellModal.tsx` | Create | Freemium upsell ekranı |
| `app/outfits.tsx` | Modify | Her parcaChip'e 3D butonu + modal entegrasyon |
| `app/import-model.tsx` | Create | Web'den GLB içe aktarma ekranı (V1 web→app) |

---

## Task 1: expo-document-picker Kurulumu

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Paketi kur**

```bash
npx expo install expo-document-picker
```

Beklenen çıktı: `+ expo-document-picker@...`

- [ ] **Step 2: Kurulumu doğrula**

```bash
npx expo install --check
```

Hata yoksa devam et.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: expo-document-picker eklendi"
```

---

## Task 2: Tip Tanımları

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: MeshyGorev ve MeshyCacheGirdisi tiplerini ekle**

`lib/types.ts` dosyasının sonuna ekle:

```typescript
export interface MeshyGorev {
  taskId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';
  glbUrl?: string;
  progress?: number;
}

export interface MeshyCacheGirdisi {
  glbUrl: string;
  olusturuldu: number;
}
```

- [ ] **Step 2: Dosyayı kaydet, TypeScript hatası yok mu kontrol et**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: Meshy tip tanımları eklendi"
```

---

## Task 3: meshyService.ts

**Files:**
- Create: `lib/meshyService.ts`

- [ ] **Step 1: Servisi oluştur**

`lib/meshyService.ts` dosyasını oluştur:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MeshyGorev, MeshyCacheGirdisi } from './types';

const MESHY_KEY = process.env.EXPO_PUBLIC_MESHY_KEY ?? '';
const BASE_URL = 'https://api.meshy.ai';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function cacheAnahtari(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash) + prompt.charCodeAt(i);
    hash |= 0;
  }
  return `meshy_cache_${Math.abs(hash)}`;
}

export async function cachedenAl(prompt: string): Promise<string | null> {
  try {
    const kayitli = await AsyncStorage.getItem(cacheAnahtari(prompt));
    if (!kayitli) return null;
    const girdi: MeshyCacheGirdisi = JSON.parse(kayitli);
    if (Date.now() - girdi.olusturuldu > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(cacheAnahtari(prompt));
      return null;
    }
    return girdi.glbUrl;
  } catch {
    return null;
  }
}

async function cacheyeYaz(prompt: string, glbUrl: string): Promise<void> {
  const girdi: MeshyCacheGirdisi = { glbUrl, olusturuldu: Date.now() };
  await AsyncStorage.setItem(cacheAnahtari(prompt), JSON.stringify(girdi));
}

export async function meshyGorevBaslat(prompt: string): Promise<string> {
  const giysiPrompt = `${prompt}, 3D clothing item, fashion apparel, isolated object, no background`;
  const res = await fetch(`${BASE_URL}/v2/openapi/3d-model/text-to-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MESHY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt: giysiPrompt,
      art_style: 'realistic',
      topology: 'quad',
      target_polycount: 50000,
    }),
  });

  if (!res.ok) {
    const hata = await res.text();
    throw new Error(`Meshy API hatası (${res.status}): ${hata.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.result) throw new Error('Meshy task ID alınamadı');
  return data.result as string;
}

export async function meshyDurumuKontrol(taskId: string): Promise<MeshyGorev> {
  const res = await fetch(`${BASE_URL}/v2/openapi/3d-model/text-to-3d/${taskId}`, {
    headers: { 'Authorization': `Bearer ${MESHY_KEY}` },
  });

  if (!res.ok) throw new Error(`Durum kontrolü başarısız (${res.status})`);

  const data = await res.json();
  return {
    taskId,
    status: data.status,
    glbUrl: data.model_urls?.glb,
    progress: data.progress,
  };
}

export async function meshyModelUret(
  parcaAdi: string,
  onIlerleme?: (yuzde: number) => void
): Promise<string> {
  const cachedUrl = await cachedenAl(parcaAdi);
  if (cachedUrl) return cachedUrl;

  const taskId = await meshyGorevBaslat(parcaAdi);

  const baslangic = Date.now();
  const MAKSIMUM_SURE = 120_000;
  const KONTROL_ARALIGI = 5_000;

  while (Date.now() - baslangic < MAKSIMUM_SURE) {
    await new Promise(r => setTimeout(r, KONTROL_ARALIGI));
    const durum = await meshyDurumuKontrol(taskId);

    if (durum.progress !== undefined) onIlerleme?.(durum.progress);

    if (durum.status === 'SUCCEEDED' && durum.glbUrl) {
      await cacheyeYaz(parcaAdi, durum.glbUrl);
      return durum.glbUrl;
    }

    if (durum.status === 'FAILED' || durum.status === 'EXPIRED') {
      throw new Error(`Model üretilemedi: ${durum.status}`);
    }
  }

  throw new Error('Zaman aşımı: 120 saniyede tamamlanamadı');
}
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

Hata yoksa devam et.

- [ ] **Step 3: Commit**

```bash
git add lib/meshyService.ts
git commit -m "feat: Meshy API servisi oluşturuldu"
```

---

## Task 4: SubscriptionContext

**Files:**
- Create: `lib/subscriptionContext.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Context oluştur**

`lib/subscriptionContext.tsx` dosyasını oluştur:

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tier = 'free' | 'basic' | 'pro';

interface AylikSayac {
  ay: string;
  sayi: number;
}

interface SubscriptionContextType {
  tier: Tier;
  aylikKullanim: number;
  can3D: () => boolean;
  kullanim3DArtir: () => Promise<void>;
  tierDegistir: (yeniTier: Tier) => Promise<void>;
}

const TIER_KEY = 'xmobile_subscription_tier';
const SAYAC_KEY = 'xmobile_3d_monthly_count';
const TIER_LIMITLER: Record<Tier, number> = {
  free: 0,
  basic: 10,
  pro: Infinity,
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  tier: 'pro',
  aylikKullanim: 0,
  can3D: () => true,
  kullanim3DArtir: async () => {},
  tierDegistir: async () => {},
});

function simdikiAy(): string {
  return new Date().toISOString().slice(0, 7);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<Tier>('pro');
  const [aylikKullanim, setAylikKullanim] = useState(0);

  useEffect(() => {
    (async () => {
      const [kayitliTier, kayitliSayac] = await Promise.all([
        AsyncStorage.getItem(TIER_KEY),
        AsyncStorage.getItem(SAYAC_KEY),
      ]);
      if (kayitliTier) setTier(kayitliTier as Tier);
      if (kayitliSayac) {
        const sayac: AylikSayac = JSON.parse(kayitliSayac);
        if (sayac.ay === simdikiAy()) setAylikKullanim(sayac.sayi);
      }
    })();
  }, []);

  const can3D = useCallback(() => {
    const limit = TIER_LIMITLER[tier];
    return aylikKullanim < limit;
  }, [tier, aylikKullanim]);

  const kullanim3DArtir = useCallback(async () => {
    const yeniSayi = aylikKullanim + 1;
    setAylikKullanim(yeniSayi);
    const sayac: AylikSayac = { ay: simdikiAy(), sayi: yeniSayi };
    await AsyncStorage.setItem(SAYAC_KEY, JSON.stringify(sayac));
  }, [aylikKullanim]);

  const tierDegistir = useCallback(async (yeniTier: Tier) => {
    setTier(yeniTier);
    await AsyncStorage.setItem(TIER_KEY, yeniTier);
  }, []);

  return (
    <SubscriptionContext.Provider value={{ tier, aylikKullanim, can3D, kullanim3DArtir, tierDegistir }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
```

- [ ] **Step 2: `_layout.tsx` dosyasını oku**

```bash
cat app/_layout.tsx
```

- [ ] **Step 3: SubscriptionProvider'ı layout'a ekle**

`app/_layout.tsx` dosyasında mevcut provider sarmalayıcısının içine `SubscriptionProvider` ekle. Örnek olarak eğer dosya şu şekildeyse:

```typescript
// app/_layout.tsx içindeki return kısmı — SubscriptionProvider dışarıya ekle:
import { SubscriptionProvider } from '../lib/subscriptionContext';

// ... mevcut AppProvider veya Stack içinde:
return (
  <SubscriptionProvider>
    {/* mevcut içerik */}
  </SubscriptionProvider>
);
```

Önce dosyayı oku, mevcut yapıyı gör, sonra en dıştaki provider'a `SubscriptionProvider` ekle.

- [ ] **Step 4: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/subscriptionContext.tsx app/_layout.tsx
git commit -m "feat: SubscriptionContext oluşturuldu"
```

---

## Task 5: ThreeDViewer Bileşeni

**Files:**
- Create: `components/ThreeDViewer.tsx`

- [ ] **Step 1: Bileşeni oluştur**

`components/ThreeDViewer.tsx` dosyasını oluştur:

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

interface ThreeDViewerProps {
  glbUrl: string;
  baslik: string;
  visible: boolean;
  onKapat: () => void;
}

function threejsHtml(glbUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
  #yukleniyor {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #00D4FF; font-family: -apple-system, system-ui, sans-serif;
    text-align: center; pointer-events: none;
  }
  #ilerleme { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
  #yukleniyorText { font-size: 11px; opacity: 0.5; letter-spacing: 1px; text-transform: uppercase; }
  #hata { display: none; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #ff4444; font-family: system-ui; text-align: center; font-size: 13px; }
</style>
</head>
<body>
<div id="yukleniyor">
  <div id="ilerleme">3D</div>
  <div id="yukleniyorText">Model yükleniyor...</div>
</div>
<div id="hata">Model yüklenemedi</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script>
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 0.5, 3);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.5;
controls.maxDistance = 10;

var ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);
var dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight1.position.set(1, 2, 3);
scene.add(dirLight1);
var dirLight2 = new THREE.DirectionalLight(0x00D4FF, 0.3);
dirLight2.position.set(-2, 1, -1);
scene.add(dirLight2);

var loader = new THREE.GLTFLoader();
loader.load(
  '${glbUrl}',
  function(gltf) {
    document.getElementById('yukleniyor').style.display = 'none';
    var model = gltf.scene;
    var box = new THREE.Box3().setFromObject(model);
    var center = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z);
    var scale = 2.0 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y -= size.y * scale * 0.2;
    scene.add(model);
  },
  undefined,
  function() {
    document.getElementById('yukleniyor').style.display = 'none';
    document.getElementById('hata').style.display = 'block';
  }
);

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;
}

export default function ThreeDViewer({ glbUrl, baslik, visible, onKapat }: ThreeDViewerProps) {
  const html = useMemo(() => threejsHtml(glbUrl), [glbUrl]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.baslik} numberOfLines={1}>{baslik}</Text>
          <TouchableOpacity onPress={onKapat} style={styles.kapatBtn}>
            <Text style={styles.kapatText}>✕</Text>
          </TouchableOpacity>
        </View>
        <WebView
          style={styles.webview}
          originWhitelist={['*']}
          source={{ html }}
          javaScriptEnabled
          allowFileAccess
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
        />
        <View style={styles.ipucu}>
          <Text style={styles.ipucuText}>Döndürmek için sürükle · Zoom için sıkıştır</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,212,255,0.15)',
  },
  baslik:     { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 12 },
  kapatBtn:   { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  kapatText:  { color: 'rgba(255,255,255,0.5)', fontSize: 18 },
  webview:    { flex: 1, backgroundColor: '#000' },
  ipucu: {
    paddingVertical: 10, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ipucuText:  { color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 0.5 },
});
```

- [ ] **Step 2: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/ThreeDViewer.tsx
git commit -m "feat: ThreeDViewer WebView bileşeni oluşturuldu"
```

---

## Task 6: UpsellModal Bileşeni

**Files:**
- Create: `components/UpsellModal.tsx`

- [ ] **Step 1: Bileşeni oluştur**

`components/UpsellModal.tsx` dosyasını oluştur:

```typescript
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';

interface UpsellModalProps {
  visible: boolean;
  onKapat: () => void;
  aylikKullanim?: number;
  limit?: number;
}

export default function UpsellModal({ visible, onKapat, aylikKullanim, limit }: UpsellModalProps) {
  const temel = limit !== undefined && limit > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.kart}>
          <Text style={styles.icon}>🧊</Text>
          <Text style={styles.baslik}>3D Görüntüleme</Text>
          <Text style={styles.baslik2}>Pro Özelliği</Text>

          {temel ? (
            <Text style={styles.aciklama}>
              Bu ay {aylikKullanim}/{limit} 3D modelini kullandın.{'\n'}
              Sınırsız 3D için Pro'ya geç.
            </Text>
          ) : (
            <Text style={styles.aciklama}>
              Kıyafetlerini gerçek zamanlı döndürülebilir 3D modellerle görselleştir.{'\n\n'}
              Ücretsiz planda bu özellik mevcut değil.
            </Text>
          )}

          <View style={styles.ozellikler}>
            {['Sınırsız 3D model', 'Sınırsız fal.ai 2D render', 'Öncelikli kombin önerisi'].map(o => (
              <View key={o} style={styles.ozellikSatir}>
                <Text style={styles.ozellikIkon}>✓</Text>
                <Text style={styles.ozellikText}>{o}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.proBtn}>
            <Text style={styles.proBtnText}>Pro'ya Geç →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onKapat} style={styles.iptalBtn}>
            <Text style={styles.iptalText}>Şimdi değil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  kart: {
    backgroundColor: '#0A0A14', borderRadius: 24,
    padding: 28, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
  },
  icon:       { fontSize: 44, marginBottom: 12 },
  baslik:     { color: '#fff', fontSize: 20, fontWeight: '700' },
  baslik2:    { color: '#00D4FF', fontSize: 13, fontWeight: '600', letterSpacing: 2, marginTop: 4, marginBottom: 16 },
  aciklama:   { color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  ozellikler: { alignSelf: 'stretch', marginBottom: 24, gap: 10 },
  ozellikSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ozellikIkon:  { color: '#00D4FF', fontSize: 14, fontWeight: '700', width: 18 },
  ozellikText:  { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  proBtn: {
    backgroundColor: '#00D4FF', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center',
    marginBottom: 12,
  },
  proBtnText:  { color: '#000', fontSize: 16, fontWeight: '700' },
  iptalBtn:    { paddingVertical: 8 },
  iptalText:   { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/UpsellModal.tsx
git commit -m "feat: UpsellModal freemium bileşeni oluşturuldu"
```

---

## Task 7: outfits.tsx'e 3D Entegrasyon

**Files:**
- Modify: `app/outfits.tsx`

- [ ] **Step 1: Import'ları ekle**

`app/outfits.tsx` dosyasının başındaki import bloğuna ekle:

```typescript
import ThreeDViewer from '../components/ThreeDViewer';
import UpsellModal from '../components/UpsellModal';
import { useSubscription } from '../lib/subscriptionContext';
import { meshyModelUret, cachedenAl } from '../lib/meshyService';
```

- [ ] **Step 2: State değişkenlerini ekle**

`Outfits` fonksiyonunun içinde mevcut `useState` satırlarının yanına ekle:

```typescript
const { can3D, kullanim3DArtir, tier, aylikKullanim } = useSubscription();

const [viewer3D, setViewer3D]       = useState<{ visible: boolean; glbUrl: string; baslik: string }>({
  visible: false, glbUrl: '', baslik: '',
});
const [upsellGoster, setUpsellGoster] = useState(false);
const [yuklenen3D, setYuklenen3D]   = useState<string | null>(null);
const [yukleniyor3D, setYukleniyor3D] = useState(false);
const [hata3D, setHata3D]           = useState<string | null>(null);
```

- [ ] **Step 3: 3D buton handler'ı ekle**

`baslat` fonksiyonundan sonra, `kombinOner` fonksiyonundan önce şu fonksiyonu ekle:

```typescript
const parcayi3DGoster = async (parcaAdi: string) => {
  if (!can3D()) {
    setUpsellGoster(true);
    return;
  }

  setYukleniyor3D(true);
  setHata3D(null);
  setYuklenen3D(parcaAdi);

  try {
    const glbUrl = await meshyModelUret(parcaAdi);
    await kullanim3DArtir();
    setViewer3D({ visible: true, glbUrl, baslik: parcaAdi });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
    setHata3D(msg);
  } finally {
    setYukleniyor3D(false);
    setYuklenen3D(null);
  }
};
```

- [ ] **Step 4: parcaChip'e 3D butonu ekle**

`outfits.tsx` içindeki `parcalar` map bloğunu bul. Şu an böyle görünüyor:

```typescript
{seciliKombin.parcalar.map((p, i) => {
  // ...
  return (
    <View key={i} style={[styles.parcaChip, { backgroundColor: renkler.chip }]}>
      {foto
        ? <Image source={{ uri: foto }} style={styles.parcaChipFoto} />
        : <View style={[styles.parcaChipFotoYok, { backgroundColor: renkler.sinir }]} />
      }
      <Text style={[styles.parcaText, { color: renkler.metin }]}>{p}</Text>
    </View>
  );
})}
```

Bunu şu şekilde değiştir:

```typescript
{seciliKombin.parcalar.map((p, i) => {
  const aranan = p.toLowerCase();
  const eslesme = kiyafetler.find(k => {
    const kAd = k.ad?.toLowerCase() ?? '';
    return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
  });
  const foto = eslesme?.foto ?? null;
  const yukleniyor = yukleniyor3D && yuklenen3D === p;
  return (
    <View key={i} style={[styles.parcaChip, { backgroundColor: renkler.chip }]}>
      {foto
        ? <Image source={{ uri: foto }} style={styles.parcaChipFoto} />
        : <View style={[styles.parcaChipFotoYok, { backgroundColor: renkler.sinir }]} />
      }
      <Text style={[styles.parcaText, { color: renkler.metin }]}>{p}</Text>
      <TouchableOpacity
        style={[styles.ucBoyutBtn, yukleniyor && styles.ucBoyutBtnYukleniyor]}
        onPress={() => parcayi3DGoster(p)}
        disabled={yukleniyor}
      >
        <Text style={styles.ucBoyutBtnText}>
          {yukleniyor ? '⟳' : '3D'}
        </Text>
      </TouchableOpacity>
    </View>
  );
})}
```

- [ ] **Step 5: Hata göstergesi ekle**

`secButon` TouchableOpacity'nin altına ekle:

```typescript
{hata3D && (
  <Text style={[styles.hata3DText, { color: '#E74C3C' }]}>
    3D: {hata3D}
  </Text>
)}
```

- [ ] **Step 6: ThreeDViewer ve UpsellModal ekle**

`</View>` (en dış container'ın kapanmasından) hemen önce ekle:

```typescript
<ThreeDViewer
  visible={viewer3D.visible}
  glbUrl={viewer3D.glbUrl}
  baslik={viewer3D.baslik}
  onKapat={() => setViewer3D(v => ({ ...v, visible: false }))}
/>
<UpsellModal
  visible={upsellGoster}
  onKapat={() => setUpsellGoster(false)}
  aylikKullanim={aylikKullanim}
  limit={tier === 'basic' ? 10 : undefined}
/>
```

- [ ] **Step 7: StyleSheet'e yeni stiller ekle**

`styles` objesi içine ekle:

```typescript
ucBoyutBtn: {
  backgroundColor: 'rgba(0,212,255,0.15)',
  borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)',
  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  marginLeft: 4,
},
ucBoyutBtnYukleniyor: {
  opacity: 0.5,
},
ucBoyutBtnText: {
  color: '#00D4FF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
},
hata3DText: {
  fontSize: 11, marginTop: 8, textAlign: 'center',
},
```

- [ ] **Step 8: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

- [ ] **Step 9: Expo'yu başlat ve test et**

```bash
npx expo start
```

Test adımları:
1. Uygulamayı aç → Kombin önerisi al
2. Bir kıyafet parçasının yanındaki "3D" butonuna bas
3. "3D model oluşturuluyor..." spinner görünmeli (buton soluklaşır, "⟳" olur)
4. 30-90 saniye sonra ThreeDViewer modal açılmalı
5. Modal içinde dönen 3D model görünmeli
6. Sürükleyerek döndürme test et
7. ✕ butonuna bas → modal kapanmalı
8. Aynı parçaya tekrar bas → cache'den anlık yüklenmeli

- [ ] **Step 10: Commit**

```bash
git add app/outfits.tsx
git commit -m "feat: kombin ekranına 3D viewer ve Meshy entegrasyonu"
```

---

## Task 8: V1 Web → App GLB İçe Aktarma

**Files:**
- Create: `app/import-model.tsx`

- [ ] **Step 1: Ekranı oluştur**

`app/import-model.tsx` dosyasını oluştur:

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import ThreeDViewer from '../components/ThreeDViewer';
import { useApp } from '../lib/context';

export default function ImportModel() {
  const router = useRouter();
  const { renkler } = useApp();
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [dosyaAdi, setDosyaAdi] = useState('');
  const [viewer3D, setViewer3D] = useState(false);
  const [hata, setHata] = useState('');

  const dosyaSec = async () => {
    setHata('');
    try {
      const sonuc = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (sonuc.canceled) return;

      const dosya = sonuc.assets[0];
      if (!dosya.name.toLowerCase().endsWith('.glb')) {
        setHata('Sadece .glb dosyaları destekleniyor');
        return;
      }

      setDosyaAdi(dosya.name);
      setGlbUrl(dosya.uri);
    } catch (e) {
      setHata('Dosya seçilemedi');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: renkler.bg }]}>
      <StatusBar barStyle={renkler.statusBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.geri, { color: renkler.metin }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.baslik, { color: renkler.metin }]}>3D Model İçe Aktar</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.icerik}>
        <Text style={styles.aciklamaIcon}>📦</Text>
        <Text style={[styles.aciklamaBaslik, { color: renkler.metin }]}>
          Web'den GLB Aktar
        </Text>
        <Text style={[styles.aciklamaAlt, { color: renkler.metin2 }]}>
          Meshy.ai'dan veya başka bir kaynaktan indirdiğin{'\n'}
          .glb dosyasını seçerek app'te görüntüle.
        </Text>

        <TouchableOpacity
          style={styles.secBtn}
          onPress={dosyaSec}
        >
          <Text style={styles.secBtnText}>📁 Dosya Seç (.glb)</Text>
        </TouchableOpacity>

        {hata ? (
          <Text style={styles.hataText}>{hata}</Text>
        ) : null}

        {glbUrl ? (
          <View style={styles.seciliDosya}>
            <Text style={[styles.dosyaAdi, { color: renkler.metin }]} numberOfLines={1}>
              ✓ {dosyaAdi}
            </Text>
            <TouchableOpacity
              style={styles.gosterBtn}
              onPress={() => setViewer3D(true)}
            >
              <Text style={styles.gosterBtnText}>3D Görüntüle →</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {glbUrl && (
        <ThreeDViewer
          visible={viewer3D}
          glbUrl={glbUrl}
          baslik={dosyaAdi}
          onKapat={() => setViewer3D(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  geri:           { fontSize: 22 },
  baslik:         { fontSize: 16, fontWeight: '600' },
  icerik:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  aciklamaIcon:   { fontSize: 52, marginBottom: 16 },
  aciklamaBaslik: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  aciklamaAlt: {
    fontSize: 14, lineHeight: 22, textAlign: 'center',
    color: 'rgba(255,255,255,0.45)', marginBottom: 32,
  },
  secBtn: {
    backgroundColor: '#00D4FF', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  secBtnText:     { color: '#000', fontSize: 15, fontWeight: '700' },
  hataText:       { color: '#E74C3C', fontSize: 13, marginTop: 16 },
  seciliDosya:    { marginTop: 24, alignItems: 'center', gap: 12 },
  dosyaAdi:       { fontSize: 13, maxWidth: 260, textAlign: 'center' },
  gosterBtn: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)',
    borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28,
  },
  gosterBtnText:  { color: '#00D4FF', fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 2: index.tsx'e import butonu ekle**

`app/index.tsx` dosyasındaki `btnSecondary` ("Profilimi Düzenle") butonunun altına ekle:

```typescript
<TouchableOpacity
  style={[styles.btnSecondary, { borderColor: renkler.sinir2 }]}
  onPress={() => router.push('/import-model')}
>
  <Text style={[styles.btnSecondaryText, { color: renkler.metin2 }]}>
    📦 3D Model İçe Aktar
  </Text>
</TouchableOpacity>
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Test et**

1. Ana ekranda "📦 3D Model İçe Aktar" butonuna bas
2. Ekran açılmalı
3. "Dosya Seç" butonuna bas → dosya seçici açılmalı
4. `Meshy_AI_Paisley_Print_Shirt_C_0508124251_generate.glb` dosyasını seç
5. "3D Görüntüle" butonu çıkmalı
6. Butona bas → ThreeDViewer açılmalı, dönen model görünmeli

- [ ] **Step 5: Commit**

```bash
git add app/import-model.tsx app/index.tsx
git commit -m "feat: web'den GLB içe aktarma ekranı eklendi"
```

---

## Son Kontrol

- [ ] Tüm commitler mevcut mu? `git log --oneline -8`
- [ ] TypeScript temiz mi? `npx tsc --noEmit`
- [ ] Expo çalışıyor mu? `npx expo start`
- [ ] Manuel test: kombin → 3D buton → model yüklenir → döner → kapanır
- [ ] Manuel test: index → GLB aktar → dosya seç → model görünür

---

## Bilinen Kısıtlamalar

- Three.js CDN'den yüklendiği için internet bağlantısı gerekiyor (offline çalışmaz)
- Meshy model üretimi 30-90 saniye sürebilir, bu normal
- iOS'ta WebView'da bazı CORS kısıtlamaları olabilir — Meshy CDN linkleri genellikle açık
- Freemium sayaç şimdilik sadece AsyncStorage'da, uygulama silinirse sıfırlanır
