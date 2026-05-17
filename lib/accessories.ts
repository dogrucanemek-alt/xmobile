// Aksesuar alt-tipleri — wardrobe + outfit recommendation + validator için ortak kaynak.
// Her alt-tip için outfit'te max 1 parça (Takı hariç max 2) kuralı validator'da uygulanır.

export const AKSESUAR_ALT_TURLERI = [
  'Şapka',
  'Kravat',
  'Atkı',
  'Saat',
  'Kemer',
  'Gözlük',
  'Çanta',
  'Takı',
  'Eldiven',
  'Diğer',
] as const;

export type AksesuarAltTur = typeof AKSESUAR_ALT_TURLERI[number];

const KEYWORDS: Record<AksesuarAltTur, string[]> = {
  'Şapka':   ['şapka', 'sapka', 'hat', 'cap', 'beanie', 'bere', 'fötr', 'fotr'],
  'Kravat':  ['kravat', 'tie', 'papyon', 'bowtie'],
  'Atkı':    ['atkı', 'atki', 'scarf', 'şal', 'sal'],
  'Saat':    ['saat', 'watch', 'kol saati'],
  'Kemer':   ['kemer', 'belt'],
  'Gözlük':  ['gözlük', 'gozluk', 'glasses', 'sunglasses', 'güneş gözlüğü'],
  'Çanta':   ['çanta', 'canta', 'bag', 'backpack', 'sırt çantası', 'tote', 'clutch'],
  'Takı':    ['kolye', 'küpe', 'kupe', 'yüzük', 'yuzuk', 'bileklik', 'bilezik', 'necklace', 'earring', 'ring', 'bracelet'],
  'Eldiven': ['eldiven', 'glove'],
  'Diğer':   [],
};

/** Aksesuar isminden alt-tipi tahmin et. Bilinmezse 'Diğer'. */
export function aksesuarAltTurTahmin(ad: string): AksesuarAltTur {
  const a = ad.toLowerCase();
  for (const [tur, kelimeler] of Object.entries(KEYWORDS) as [AksesuarAltTur, string[]][]) {
    if (kelimeler.some(k => a.includes(k))) return tur;
  }
  return 'Diğer';
}

export const AKSESUAR_LABELS_EN: Record<AksesuarAltTur, string> = {
  'Şapka':   'Hat',
  'Kravat':  'Tie',
  'Atkı':    'Scarf',
  'Saat':    'Watch',
  'Kemer':   'Belt',
  'Gözlük':  'Glasses',
  'Çanta':   'Bag',
  'Takı':    'Jewelry',
  'Eldiven': 'Gloves',
  'Diğer':   'Other',
};
