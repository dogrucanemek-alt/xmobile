import AsyncStorage from '@react-native-async-storage/async-storage';

const SAYAC_KEY   = 'xmobile_kombin_sayac';
const UCRETSIZ_LIMIT = 5;

interface Sayac {
  adet: number;
  ay: number;
  yil: number;
}

async function sayacAl(): Promise<Sayac> {
  const simdi = new Date();
  const kayitli = await AsyncStorage.getItem(SAYAC_KEY);
  if (kayitli) {
    const s: Sayac = JSON.parse(kayitli);
    if (s.ay === simdi.getMonth() && s.yil === simdi.getFullYear()) return s;
  }
  // Yeni ay — sıfırla
  const yeni: Sayac = { adet: 0, ay: simdi.getMonth(), yil: simdi.getFullYear() };
  await AsyncStorage.setItem(SAYAC_KEY, JSON.stringify(yeni));
  return yeni;
}

export async function kombinHakkiVar(isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const s = await sayacAl();
  return s.adet < UCRETSIZ_LIMIT;
}

export async function kombinKullan(): Promise<void> {
  const s = await sayacAl();
  s.adet += 1;
  await AsyncStorage.setItem(SAYAC_KEY, JSON.stringify(s));
}

export async function kalanHakAl(isPro: boolean): Promise<{ kalan: number; limit: number; isPro: boolean }> {
  if (isPro) return { kalan: Infinity, limit: Infinity, isPro: true };
  const s = await sayacAl();
  return { kalan: Math.max(0, UCRETSIZ_LIMIT - s.adet), limit: UCRETSIZ_LIMIT, isPro: false };
}
