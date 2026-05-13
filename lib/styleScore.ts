import type { Kombin, Kiyafet } from './types';

export interface StyleScore {
  puan: number;         // 0-100
  seviye: string;       // "Stil Ustası" etc.
  rozetler: string[];   // earned badges
}

export function stilPuaniHesapla(
  kombin: Kombin,
  kiyafetler: Kiyafet[],
  hava?: { derece: number; durum: string } | null,
): StyleScore {
  let puan = 50; // base
  const rozetler: string[] = [];

  // Parça sayısı (3-5 ideal)
  const sayi = kombin.parcalar.length;
  if (sayi >= 3 && sayi <= 5) { puan += 15; rozetler.push('✦ Dengeli Kombin'); }
  else if (sayi < 2) puan -= 10;

  // Fotoğraflı parça var mı?
  const fotoluParca = kiyafetler.filter(k =>
    kombin.parcalar.some(p => p.toLowerCase().includes(k.ad.toLowerCase())) && k.foto
  );
  if (fotoluParca.length >= 2) { puan += 10; rozetler.push('📸 Görsel Zengin'); }

  // Hava uyumu
  if (hava) {
    const alt  = kombin.parcalar.some(p => /(şort|etek|tayt|short|skirt)/i.test(p));
    const uzun = kombin.parcalar.some(p => /(palto|mont|kazak|trençkot|coat|jacket)/i.test(p));
    if (hava.derece < 15 && uzun)  { puan += 10; rozetler.push('🌡️ Hava Uyumlu'); }
    if (hava.derece > 25 && alt)   { puan += 10; rozetler.push('☀️ Sezona Uygun'); }
    if (hava.derece < 10 && alt)    puan -= 10;
  }

  // AI önerisi var mı (neden alanı dolu)?
  if (kombin.neden && kombin.neden.length > 30) { puan += 10; rozetler.push('🤖 AI Onaylı'); }

  // Favori mi?
  if (kombin.favori) { puan += 5; rozetler.push('❤️ Favorin'); }

  puan = Math.min(100, Math.max(0, puan));

  const seviye =
    puan >= 90 ? '👑 Stil Ustası'   :
    puan >= 75 ? '✨ Stil Uzmanı'   :
    puan >= 60 ? '🎯 İyi Gidiyor'   :
    puan >= 45 ? '📈 Gelişiyor'     :
                 '💡 Başlangıç';

  return { puan, seviye, rozetler };
}
