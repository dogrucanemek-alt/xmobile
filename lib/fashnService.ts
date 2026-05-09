const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

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

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1];
  const res = await fetch(uri);
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
  if (!res.ok || data.error) throw new Error(errMsg(data.error) || `Fashn API hatası: ${res.status}`);
  if (!data.id) throw new Error(`Fashn API: id gelmedi. Yanıt: ${JSON.stringify(data).slice(0, 120)}`);
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
    if (durum.status === 'failed') throw new Error(errMsg(durum.error) || 'Try-on başarısız');
    onProgress?.();
  }
  throw new Error('Zaman aşımı: 60 saniyede sonuç gelmedi');
}
