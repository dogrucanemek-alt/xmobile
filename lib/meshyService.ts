import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MeshyGorev, MeshyCacheGirdisi } from './types';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app'}/api/meshy`;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
  const res = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${BASE_URL}/status?taskId=${taskId}`);

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
