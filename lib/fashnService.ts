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

async function gorselParam(uri: string): Promise<string> {
  // Fashn.ai CDN URL'lerini tekrar encode etme, doğrudan geç
  if (uri.startsWith('http')) return uri;
  const b64 = await uriToBase64(uri);
  return `data:${mimeType(uri)};base64,${b64}`;
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
      model_image:   modelParam,
      garment_image: garmentParam,
      category,
    }),
  });

  const data = await safeJson(res);
  if (!res.ok || data.error) throw new Error(errMsg(data.error) || `Fashn API hatası: ${res.status}`);
  if (!data.id) throw new Error(`Fashn API: id gelmedi. Yanıt: ${JSON.stringify(data).slice(0, 120)}`);
  return data.id as string;
}

export async function kiyafetGorseliUret(garmentName: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/dalle/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ garmentName }),
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
  const res = await fetch(`${API_URL}/api/fashn?id=${encodeURIComponent(id)}`);
  return safeJson(res);
}

export async function tryOnBekle(id: string, onProgress?: () => void): Promise<string> {
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const durum = await tryOnDurumuKontrol(id);
    if (durum.status === 'completed') {
      if (!durum.output?.[0]) throw new Error('Sonuç görseli gelmedi');
      // Fashn CDN URL'ini kendi proxy'mizden serve et — Android Image bileşeni CDN'i direkt yükleyemiyor
      return `${API_URL}/api/fashn?url=${encodeURIComponent(durum.output[0])}`;
    }
    if (durum.status === 'failed') throw new Error(errMsg(durum.error) || 'Try-on başarısız');
    onProgress?.();
  }
  throw new Error('Zaman aşımı: 150 saniyede sonuç gelmedi');
}
