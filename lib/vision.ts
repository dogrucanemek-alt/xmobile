import * as FileSystem from 'expo-file-system';

const ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

const TUR_HARITA: Record<string, string> = {
  shirt: 'Üst', blouse: 'Üst', top: 'Üst', 't-shirt': 'Üst', tshirt: 'Üst',
  sweater: 'Üst', hoodie: 'Üst', vest: 'Üst', jersey: 'Üst', cardigan: 'Üst',
  pants: 'Alt', jeans: 'Alt', trousers: 'Alt', skirt: 'Alt',
  shorts: 'Alt', leggings: 'Alt', denim: 'Alt',
  jacket: 'Dış Giyim', coat: 'Dış Giyim', blazer: 'Dış Giyim',
  raincoat: 'Dış Giyim', trench: 'Dış Giyim', parka: 'Dış Giyim', overcoat: 'Dış Giyim',
  shoe: 'Ayakkabı', boot: 'Ayakkabı', sneaker: 'Ayakkabı',
  sandal: 'Ayakkabı', heel: 'Ayakkabı', loafer: 'Ayakkabı',
  bag: 'Aksesuar', handbag: 'Aksesuar', hat: 'Aksesuar',
  belt: 'Aksesuar', scarf: 'Aksesuar', glasses: 'Aksesuar', watch: 'Aksesuar',
};

const AD_HARITA: Record<string, string> = {
  shirt: 'Gömlek', blouse: 'Bluz', 't-shirt': 'Tişört', tshirt: 'Tişört',
  sweater: 'Kazak', hoodie: 'Kapüşonlu', vest: 'Yelek', top: 'Üst', jersey: 'Forma', cardigan: 'Hırka',
  pants: 'Pantolon', jeans: 'Jean', trousers: 'Pantolon', skirt: 'Etek',
  shorts: 'Şort', leggings: 'Tayt', denim: 'Kot',
  jacket: 'Ceket', coat: 'Kaban', blazer: 'Blazer',
  raincoat: 'Yağmurluk', trench: 'Trençkot', parka: 'Parka', overcoat: 'Palto',
  shoe: 'Ayakkabı', boot: 'Bot', sneaker: 'Spor Ayakkabı',
  sandal: 'Sandalet', heel: 'Topuklu', loafer: 'Loafer',
  bag: 'Çanta', handbag: 'El Çantası', hat: 'Şapka',
  belt: 'Kemer', scarf: 'Atkı', glasses: 'Gözlük', watch: 'Saat',
};

export async function kiyafetTani(
  imageUri: string,
  apiKey: string,
): Promise<{ ad: string; tur: string }> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64 },
        features: [{ type: 'LABEL_DETECTION', maxResults: 20 }],
      }],
    }),
  });

  const data = await res.json();
  const labels: string[] = (data.responses?.[0]?.labelAnnotations ?? [])
    .map((l: { description: string }) => l.description.toLowerCase());

  for (const label of labels) {
    const tur = TUR_HARITA[label];
    if (tur) return { ad: AD_HARITA[label] ?? 'Yeni Kıyafet', tur };
  }

  return { ad: 'Yeni Kıyafet', tur: 'Üst' };
}
