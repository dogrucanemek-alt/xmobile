import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

async function uriToBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return uri.split(',')[1];
  const res = await fetch(uri, { signal: timeoutSignal(15000) });
  if (!res.ok) throw new Error(`Fotoğraf okunamadı (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (ev) => reject(new Error('FileReader: ' + String((ev.target as any)?.error ?? ev)));
    reader.readAsDataURL(blob);
  });
}

// Yükleme hızı + Replicate quota için 1024px'e küçült, JPEG q0.85
async function kucult(uri: string): Promise<string> {
  try {
    const r = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    return r.uri;
  } catch { return uri; }
}

/**
 * Verilen yerel fotoğrafın arka planını siler ve PNG (şeffaf) olarak yerele indirir.
 * Başarısız olursa orijinal URI'yi geri döner (fallback).
 */
export async function arkaPlaniTemizle(uri: string, userId?: string): Promise<string> {
  try {
    const kucukUri = await kucult(uri);
    const b64 = await uriToBase64(kucukUri);
    const dataUri = `data:image/jpeg;base64,${b64}`;

    const res = await fetch(`${API_URL}/api/fashn?action=rembg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUri, user_id: userId }),
      signal: timeoutSignal(60000),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Rembg API ${res.status}: ${errText.slice(0, 120)}`);
    }
    const data = await res.json();
    if (!data?.url) throw new Error('Rembg API: url gelmedi');

    // CDN URL'i yerele indir (Android Image bazı remote URL'leri render etmiyor — memory'deki kural)
    const localPath = `${FileSystem.cacheDirectory}rembg_${Date.now()}.png`;
    const { status } = await FileSystem.downloadAsync(data.url, localPath);
    if (status !== 200) throw new Error(`İndirme başarısız (${status})`);
    return localPath;
  } catch (e) {
    console.warn('rembg fallback:', e);
    return uri; // Orijinali kullan — kullanıcı akışı bloklanmasın
  }
}
