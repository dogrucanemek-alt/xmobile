import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

function errMsg(e: unknown): string {
  if (!e) return 'Bilinmeyen hata';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  if (typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const v = o.message ?? o.detail ?? o.error ?? o.msg;
    if (v) return typeof v === 'string' ? v : JSON.stringify(v);
    return JSON.stringify(e);
  }
  return String(e);
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Geçersiz API yanıtı (${res.status}): ${text.slice(0, 120)}`);
  }
}

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1];
  const res = await fetch(uri, { signal: timeoutSignal(20000) });
  if (!res.ok) throw new Error(`Fotoğraf okunamadı (${res.status}): ${uri.slice(-40)}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (ev) => reject(new Error('FileReader hatası: ' + String((ev.target as any)?.error ?? ev)));
    reader.readAsDataURL(blob);
  });
}

function mimeType(uri: string): string {
  const u = uri.toLowerCase();
  if (u.includes('.png'))  return 'image/png';
  if (u.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export type TryOnCategory = 'auto' | 'tops' | 'bottoms' | 'one-pieces';

// Session cache: aynı fotoğraf birden fazla parça için tekrar tekrar encode edilmesin
const gorselCache = new Map<string, string>();

// Fashn için: 1024px wide, jpeg 0.85 quality
// 0.85 = upload hızı + zincirleme color drift arasında denge
async function gorseliKucult(uri: string): Promise<string> {
  try {
    const sonuc = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    return sonuc.uri;
  } catch {
    return uri;
  }
}

async function gorselParam(uri: string): Promise<string> {
  if (uri.startsWith('http')) return uri;
  const hit = gorselCache.get(uri);
  if (hit) return hit;
  // Küçült, sonra base64'e çevir
  const kucukUri = await gorseliKucult(uri);
  const b64 = await uriToBase64(kucukUri);
  const dataUri = `data:image/jpeg;base64,${b64}`;
  // Cache büyümesin: max 8 entry tut
  if (gorselCache.size >= 8) {
    const firstKey = gorselCache.keys().next().value;
    if (firstKey !== undefined) gorselCache.delete(firstKey);
  }
  gorselCache.set(uri, dataUri);
  return dataUri;
}

export async function tryOnBaslat(
  modelImageUri: string,
  garmentImageUri: string,
  category: TryOnCategory = 'auto',
): Promise<string> {
  const [modelParam, garmentParam] = await Promise.all([
    gorselParam(modelImageUri),
    gorselParam(garmentImageUri),
  ]);

  const res = await fetch(`${API_URL}/api/fashn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_image: modelParam,
      garment_image: garmentParam,
      category,
    }),
    signal: timeoutSignal(40000),
  });

  const data = await safeJson(res);
  if (!res.ok || data.error) {
    const rawErr = errMsg(data.error) || `Fashn API hatası: ${res.status}`;
    const lower = rawErr.toLowerCase();
    if (lower.includes('credit') || lower.includes('quota') || lower.includes('limit') || res.status === 402 || res.status === 429) {
      throw new Error('OUT_OF_CREDITS');
    }
    throw new Error(rawErr);
  }
  if (!data.id) throw new Error(`Fashn API: id gelmedi. Yanıt: ${JSON.stringify(data).slice(0, 120)}`);
  return data.id as string;
}

export async function kiyafetGorseliUret(garmentName: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/dalle/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ garmentName }),
    signal: timeoutSignal(30000),
  });
  const data = await safeJson(res);
  if (!res.ok || data.error) throw new Error(errMsg(data.error) || `DALL-E hatası: ${res.status}`);
  if (!data.url) throw new Error('DALL-E görsel URL gelmedi');
  return data.url as string;
}

export async function tryOnDurumuKontrol(id: string): Promise<{
  status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error?: string;
}> {
  const res = await fetch(`${API_URL}/api/fashn?id=${encodeURIComponent(id)}`, {
    signal: timeoutSignal(10000),
  });
  return safeJson(res);
}

export async function tryOnBekle(
  id: string,
  onProgress?: (adim: number, toplam: number) => void,
): Promise<string> {
  // Önce kısa ilk bekleme (Fashn cold start min ~8s), sonra hızlı polling
  // Toplam max ~200s ama tipik durumda 15-30s'de yakalar
  await new Promise(r => setTimeout(r, 4000));

  const MAKS = 100; // 100 × 2s = 200 saniye max
  for (let i = 0; i < MAKS; i++) {
    onProgress?.(i + 1, MAKS);

    let durum: Awaited<ReturnType<typeof tryOnDurumuKontrol>>;
    try {
      durum = await tryOnDurumuKontrol(id);
    } catch {
      // Tek bir poll hatası kritik değil, devam et
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    if (durum.status === 'completed') {
      if (!durum.output?.[0]) throw new Error('Sonuç görseli gelmedi');
      const localPath = `${FileSystem.cacheDirectory}tryon_${Date.now()}.jpg`;
      const { status } = await FileSystem.downloadAsync(durum.output[0], localPath);
      if (status !== 200) throw new Error(`Görsel indirilemedi (${status})`);
      return localPath;
    }
    if (durum.status === 'failed') throw new Error(errMsg(durum.error) || 'Try-on başarısız');

    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Zaman aşımı: 200 saniyede sonuç gelmedi');
}
