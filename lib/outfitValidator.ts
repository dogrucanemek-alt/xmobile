import type { Kiyafet } from './types';
import { renkUyumSkoru } from './outfitColor';

/**
 * Kıyafet adından "katmanlı/üst-katman" mı diye anlar.
 * Sweatshirt, hoodie, ceket, kazak gibi parçalar layering item.
 * Gömlek, tişört, bluz vs base layer.
 */
export function isLayering(name: string): boolean {
  const keywords = [
    'sweatshirt', 'hoodie', 'cardigan', 'ceket', 'blazer',
    'trench', 'trençkot', 'trenkot', 'mont', 'kazak',
    'hırka', 'hirka', 'sweater', 'jacket', 'coat',
    'parka', 'kaban', 'yelek', 'vest', 'puffer',
  ];
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

/**
 * Bottom alt parça mı diye kontrol — elbise/jumpsuit one-piece de "Alt + Üst" sayılır.
 */
export function isOnePiece(name: string): boolean {
  const keywords = ['elbise', 'tulum', 'dress', 'jumpsuit', 'romper', 'gown'];
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

export interface OutfitValidation {
  valid: boolean;
  reason?: string;
  details?: {
    ustBase: number;
    ustLayer: number;
    alt: number;
    ayakkabi: number;
    disGiyim: number;
    onePiece: number;
  };
  colorScore?: number;
}

/**
 * AI'dan gelen kombini kategori kurallarına göre doğrula.
 *
 * Geçerli kurallar:
 *  - Tam 1 Üst (base) VEYA tam 1 elbise/tulum
 *  - Tam 1 Alt (one-piece değilse)
 *  - Tam 1 Ayakkabı
 *  - 0-1 Layer (sweatshirt/ceket/dış giyim — toplam max 1)
 *  - Hiçbir kategoride 2'den fazla parça olmamalı
 */
export function validateOutfit(
  parcalar: string[],
  kiyafetler: Kiyafet[],
): OutfitValidation {
  if (!parcalar || parcalar.length === 0) {
    return { valid: false, reason: 'no items' };
  }
  if (parcalar.length < 2 || parcalar.length > 5) {
    return { valid: false, reason: `unusual item count: ${parcalar.length}` };
  }

  const items: Kiyafet[] = [];
  for (const ad of parcalar) {
    const adLower = String(ad).toLowerCase();
    const found = kiyafetler.find(k => k.ad?.toLowerCase() === adLower);
    if (found) items.push(found);
  }
  if (items.length < parcalar.length) {
    return { valid: false, reason: 'unknown item names returned' };
  }

  let ustBase = 0, ustLayer = 0, alt = 0, ayakkabi = 0, disGiyim = 0, onePiece = 0;

  for (const item of items) {
    if (isOnePiece(item.ad)) { onePiece++; continue; }
    if (item.tur === 'Üst') {
      if (isLayering(item.ad)) ustLayer++;
      else ustBase++;
    } else if (item.tur === 'Alt') alt++;
    else if (item.tur === 'Ayakkabı') ayakkabi++;
    else if (item.tur === 'Dış Giyim') disGiyim++;
  }

  const details = { ustBase, ustLayer, alt, ayakkabi, disGiyim, onePiece };

  // Tam 1 Üst (base) gerek, ya da elbise/tulum varsa Üst+Alt yerine geçer
  if (onePiece > 1) return { valid: false, reason: 'multiple dresses', details };
  if (onePiece === 0 && ustBase !== 1) {
    return { valid: false, reason: `expected 1 base top, got ${ustBase}`, details };
  }
  if (onePiece === 1 && (ustBase > 0 || alt > 0)) {
    return { valid: false, reason: 'dress + top/bottom mix', details };
  }
  if (onePiece === 0 && alt !== 1) {
    return { valid: false, reason: `expected 1 bottom, got ${alt}`, details };
  }
  if (ayakkabi !== 1) {
    return { valid: false, reason: `expected 1 shoes, got ${ayakkabi}`, details };
  }
  // Layer + Outerwear toplamı max 1
  if (ustLayer + disGiyim > 1) {
    return { valid: false, reason: `too many layers: ${ustLayer + disGiyim}`, details };
  }

  // Renk uyumu — düşük skor reject (büyük çakışmalar için)
  let colorScore: number | undefined;
  try {
    colorScore = renkUyumSkoru(items.map(i => i.ad));
    if (colorScore < 50) {
      return { valid: false, reason: `color clash (score ${colorScore})`, details, colorScore };
    }
  } catch {}

  return { valid: true, details, colorScore };
}
