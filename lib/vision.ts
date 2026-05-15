import * as ImageManipulator from 'expo-image-manipulator';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { handleError, logError } from './errorHandler';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';
const TURLER = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

export async function kiyafetTani(
  imageUri: string,
): Promise<{ ad: string; tur: string }> {
  try {
    let kucuk: Awaited<ReturnType<typeof ImageManipulator.manipulateAsync>>;
    try {
      kucuk = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
    } catch (e) {
      const error = handleError(e);
      logError(error, 'vision.manipulate');
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    let base64: string;
    try {
      base64 = await readAsStringAsync(kucuk.uri, { encoding: EncodingType.Base64 });
    } catch (e) {
      const error = handleError(e);
      logError(error, 'vision.base64');
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    if (!base64) {
      console.warn('Base64 boş geldi');
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: 'You are a clothing identifier. Respond with ONLY valid JSON.',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: `Bu kıyafetin rengini ve türünü Türkçe olarak belirle. Sadece JSON döndür:\n{"ad":"[Renk] [Tür] (örn: Gri Jean, Siyah Gömlek, Bej Trençkot, Beyaz Spor Ayakkabı)","tur":"${TURLER.join(' veya ')}"}`,
            },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      const error = handleError(new Error(`Claude API hatası (${res.status})`));
      logError(error, 'vision.api');
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    const data = await res.json();
    if (data.error) {
      const error = handleError(new Error(`Claude cevap hatası: ${data.error}`));
      logError(error, 'vision.response');
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    const metin: string = data.content?.[0]?.text ?? '';
    if (!metin) {
      const error = handleError(new Error('Claude boş cevap verdi'));
      logError(error, 'vision.empty');
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    const bas = metin.indexOf('{');
    const son = metin.lastIndexOf('}') + 1;
    if (bas === -1 || son === 0) {
      console.warn('JSON bulunamadı:', metin.slice(0, 100));
      return { ad: 'Yeni Kıyafet', tur: 'Üst' };
    }

    const parsed = JSON.parse(metin.slice(bas, son));
    const tur = TURLER.includes(parsed.tur) ? parsed.tur : 'Üst';
    return { ad: parsed.ad?.trim() || 'Yeni Kıyafet', tur };
  } catch (e) {
    console.error('Kıyafet tanıma beklenmeyen hatası:', e);
    return { ad: 'Yeni Kıyafet', tur: 'Üst' };
  }
}
