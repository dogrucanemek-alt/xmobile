import Mixpanel from 'mixpanel-react-native';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

let mp: Mixpanel | null = null;

export async function analyticsBaslat() {
  if (!TOKEN) return;
  try {
    mp = new Mixpanel(TOKEN, true);
    await mp.init();
  } catch (_) {}
}

export function kullaniciBelirle(userId: string, email?: string) {
  if (!mp) return;
  mp.identify(userId);
  if (email) mp.getPeople().set({ $email: email });
}

export function oturumKapat() {
  if (!mp) return;
  mp.reset();
}

export function takipEt(olay: string, ozellikler?: Record<string, unknown>) {
  if (!mp) return;
  mp.track(olay, ozellikler ?? {});
}

// Hazır olay sabitleri
export const Olaylar = {
  EKRAN_GORUNTULENDI:    'ekran_goruntulendi',
  KOMBİN_OLUSTURULDU:   'kombin_olusturuldu',
  TRYON_BASLADI:        'tryon_basladi',
  TRYON_TAMAMLANDI:     'tryon_tamamlandi',
  DOLAP_EKLENDI:        'dolap_item_eklendi',
  SOSYAL_PAYLASILDI:    'sosyal_paylasildi',
  AVATAR_3D_ACILDI:     'avatar_3d_acildi',
  ABONELIK_BASLADI:     'abonelik_sayfasi_acildi',
  ABONELIK_TAMAMLANDI:  'abonelik_tamamlandi',
  JARVIS_SORULDU:       'jarvis_soruldu',
  KESFET_ACILDI:        'kesfet_acildi',
  BEGENI_YAPILDI:       'begeni_yapildi',
} as const;
