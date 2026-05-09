import type { Kiyafet, Kombin } from './types';

const RENK_TABLOSU: [string[], string][] = [
  [['beyaz', 'ekru', 'kırık', 'white', 'cream', 'ivory', 'off-white'], '#F0F0F0'],
  [['siyah', 'black'],                                                   '#1A1A1A'],
  [['antrasit', 'füme', 'charcoal', 'anthracite'],                       '#3B3B3B'],
  [['lacivert', 'indigo', 'navy'],                                       '#1B2A4A'],
  [['saks', 'steel blue'],                                               '#4A7FA5'],
  [['mavi', 'blue', 'cobalt'],                                           '#2E6DA4'],
  [['kirmizi', 'kırmızı', 'red', 'crimson'],                            '#C0392B'],
  [['yesil', 'yeşil', 'haki', 'green', 'khaki', 'olive'],              '#27AE60'],
  [['sari', 'sarı', 'hardal', 'yellow', 'mustard'],                     '#F1C40F'],
  [['gri', 'grimelanj', 'grey', 'gray'],                                 '#7F8C8D'],
  [['bej', 'krem', 'kum', 'beige', 'tan', 'camel'],                    '#D4B896'],
  [['kahve', 'taba', 'vizon', 'brown', 'chocolate'],                    '#8B6347'],
  [['bordo', 'mürdüm', 'burgundy', 'maroon', 'wine'],                  '#6B1A1A'],
  [['pembe', 'pudra', 'pink', 'blush', 'rose'],                         '#E91E8C'],
  [['turuncu', 'kiremit', 'orange', 'coral', 'rust'],                   '#E67E22'],
  [['mor', 'lila', 'leylak', 'purple', 'lilac', 'violet'],             '#8E44AD'],
];

export const renkBul = (parcaAdi: string | null): string => {
  const ad = (parcaAdi ?? '').toLowerCase();
  let enYakin = Infinity;
  let secilen = '#6B6B6B';
  for (const [anahtarlar, renk] of RENK_TABLOSU) {
    for (const kw of anahtarlar) {
      const idx = ad.indexOf(kw);
      if (idx !== -1 && idx < enYakin) { enYakin = idx; secilen = renk; }
    }
  }
  return secilen;
};

export const parcaEsle = (kombin: Kombin, anahtarlar: string[]): string | null =>
  kombin.parcalar.find(p => anahtarlar.some(k => p.toLowerCase().includes(k))) ?? null;

export const kiyafetRenkBul = (parcaAdi: string | null, kiyafetler: Kiyafet[]): string => {
  if (!parcaAdi) return renkBul(null);
  const aranan = parcaAdi.toLowerCase();
  const eslesen = kiyafetler.find(k => {
    const kAd = (k.ad ?? '').toLowerCase();
    return kAd === aranan || aranan.includes(kAd) || kAd.includes(aranan);
  });
  return renkBul(eslesen?.ad ?? parcaAdi);
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const hexToHsl = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
};

const hueDist = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const pairScore = (d: number): number => {
  if (d <=  30)             return 95;
  if (d <=  60)             return 82;
  if (d >= 150 && d <= 210) return 88;
  if (d >= 100 && d <= 140) return 78;
  if (d >= 220 && d <= 260) return 78;
  if (d >=  61 && d <=  99) return 52;
  return 45;
};

export const renkUyumSkoru = (parcalar: string[]): number => {
  const hslList = parcalar.map(p => hexToHsl(renkBul(p)));
  const aktif   = hslList.filter(([, s]) => s > 0.12);
  if (aktif.length < 2) return 88;
  let total = 0, count = 0;
  for (let i = 0; i < aktif.length; i++)
    for (let j = i + 1; j < aktif.length; j++) {
      total += pairScore(hueDist(aktif[i][0], aktif[j][0]));
      count++;
    }
  return Math.round(total / count);
};
