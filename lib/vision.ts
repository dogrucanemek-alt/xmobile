import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const TURLER = ['Üst', 'Alt', 'Dış Giyim', 'Ayakkabı', 'Aksesuar'];

export async function kiyafetTani(
  imageUri: string,
  claudeKey: string,
): Promise<{ ad: string; tur: string }> {
  // Büyük görseller Claude limitini (5MB) aşar — 800px'e küçült
  const kucuk = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );

  const base64 = await FileSystem.readAsStringAsync(kucuk.uri, { encoding: 'base64' });

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
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

  const data = await res.json();
  const metin: string = data.content?.[0]?.text ?? '';
  const bas = metin.indexOf('{');
  const son = metin.lastIndexOf('}') + 1;
  if (bas === -1 || son === 0) return { ad: 'Yeni Kıyafet', tur: 'Üst' };

  const parsed = JSON.parse(metin.slice(bas, son));
  const tur = TURLER.includes(parsed.tur) ? parsed.tur : 'Üst';
  return { ad: parsed.ad?.trim() || 'Yeni Kıyafet', tur };
}
