import * as FileSystem from 'expo-file-system/legacy';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

function mimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  return 'image/jpeg';
}

export type TryOnCategory = 'auto' | 'tops' | 'bottoms' | 'one-pieces';

export async function tryOnBaslat(
  modelImageUri: string,
  garmentImageUri: string,
  category: TryOnCategory = 'auto',
): Promise<string> {
  const [modelB64, garmentB64] = await Promise.all([
    uriToBase64(modelImageUri),
    uriToBase64(garmentImageUri),
  ]);

  const modelMime  = mimeType(modelImageUri);
  const garmentMime = mimeType(garmentImageUri);

  const res = await fetch(`${API_URL}/api/fashn/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_image:   `data:${modelMime};base64,${modelB64}`,
      garment_image: `data:${garmentMime};base64,${garmentB64}`,
      category,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? `Fashn API hatası: ${res.status}`);
  if (!data.id) throw new Error('Fashn API: id gelmedi');
  return data.id as string;
}

export async function tryOnDurumuKontrol(id: string): Promise<{
  status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error?: string;
}> {
  const res = await fetch(`${API_URL}/api/fashn/status?id=${encodeURIComponent(id)}`);
  const data = await res.json();
  return data;
}

export async function tryOnBekle(id: string, onProgress?: () => void): Promise<string> {
  const MAKS_DENEME = 30;
  const ARALIK_MS = 2000;

  for (let i = 0; i < MAKS_DENEME; i++) {
    await new Promise(r => setTimeout(r, ARALIK_MS));
    const durum = await tryOnDurumuKontrol(id);

    if (durum.status === 'completed') {
      if (!durum.output?.[0]) throw new Error('Sonuç görseli gelmedi');
      return durum.output[0];
    }

    if (durum.status === 'failed') {
      throw new Error(durum.error ?? 'Try-on başarısız');
    }

    onProgress?.();
  }

  throw new Error('Zaman aşımı: 60 saniyede sonuç gelmedi');
}
