const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1];
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function mimeType(uri: string): string {
  return uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
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

  const res = await fetch(`${API_URL}/api/fashn/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_image:   `data:${mimeType(modelImageUri)};base64,${modelB64}`,
      garment_image: `data:${mimeType(garmentImageUri)};base64,${garmentB64}`,
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
  return res.json();
}

export async function tryOnBekle(id: string, onProgress?: () => void): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const durum = await tryOnDurumuKontrol(id);
    if (durum.status === 'completed') {
      if (!durum.output?.[0]) throw new Error('Sonuç görseli gelmedi');
      return durum.output[0];
    }
    if (durum.status === 'failed') throw new Error(durum.error ?? 'Try-on başarısız');
    onProgress?.();
  }
  throw new Error('Zaman aşımı: 60 saniyede sonuç gelmedi');
}
