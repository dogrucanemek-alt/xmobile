import type { Kiyafet, Kombin } from './types';

export const renkBul = (parcaAdi: string | null): string => {
  const ad = (parcaAdi ?? '').toLowerCase();
  if (ad.includes('beyaz') || ad.includes('ekru') || ad.includes('kırık') || ad.includes('white') || ad.includes('cream') || ad.includes('ivory') || ad.includes('off-white')) return '#F0F0F0';
  if (ad.includes('siyah') || ad.includes('black'))                         return '#1A1A1A';
  if (ad.includes('antrasit') || ad.includes('füme') || ad.includes('charcoal') || ad.includes('anthracite')) return '#3B3B3B';
  if (ad.includes('lacivert') || ad.includes('indigo') || ad.includes('navy')) return '#1B2A4A';
  if (ad.includes('saks') || ad.includes('steel blue'))                     return '#4A7FA5';
  if (ad.includes('mavi') || ad.includes('blue') || ad.includes('cobalt'))  return '#2E6DA4';
  if (ad.includes('kirmizi') || ad.includes('kırmızı') || ad.includes('red') || ad.includes('crimson')) return '#C0392B';
  if (ad.includes('yesil') || ad.includes('yeşil') || ad.includes('haki') || ad.includes('green') || ad.includes('khaki') || ad.includes('olive')) return '#27AE60';
  if (ad.includes('sari') || ad.includes('sarı') || ad.includes('hardal') || ad.includes('yellow') || ad.includes('mustard')) return '#F1C40F';
  if (ad.includes('gri') || ad.includes('grimelanj') || ad.includes('grey') || ad.includes('gray')) return '#7F8C8D';
  if (ad.includes('bej') || ad.includes('krem') || ad.includes('kum') || ad.includes('beige') || ad.includes('tan') || ad.includes('camel')) return '#D4B896';
  if (ad.includes('kahve') || ad.includes('taba') || ad.includes('vizon') || ad.includes('brown') || ad.includes('chocolate')) return '#8B6347';
  if (ad.includes('bordo') || ad.includes('mürdüm') || ad.includes('burgundy') || ad.includes('maroon') || ad.includes('wine')) return '#6B1A1A';
  if (ad.includes('pembe') || ad.includes('pudra') || ad.includes('pink') || ad.includes('blush') || ad.includes('rose')) return '#E91E8C';
  if (ad.includes('turuncu') || ad.includes('kiremit') || ad.includes('orange') || ad.includes('coral') || ad.includes('rust')) return '#E67E22';
  if (ad.includes('mor') || ad.includes('lila') || ad.includes('leylak') || ad.includes('purple') || ad.includes('lilac') || ad.includes('violet')) return '#8E44AD';
  return '#6B6B6B';
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
