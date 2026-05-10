const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';
const API   = 'https://api.mixpanel.com/track';

let distinctId = 'anonymous';

function gonder(olay: string, ozellikler: Record<string, unknown> = {}) {
  if (!TOKEN) return;
  const payload = [{
    event: olay,
    properties: {
      token: TOKEN,
      distinct_id: distinctId,
      time: Math.floor(Date.now() / 1000),
      ...ozellikler,
    },
  }];
  const encoded = btoa(JSON.stringify(payload));
  fetch(`${API}?data=${encoded}&verbose=1`).catch(() => {});
}

export function analyticsBaslat() {}

export function kullaniciBelirle(userId: string, email?: string) {
  distinctId = userId;
  if (!TOKEN || !email) return;
  const payload = [{ $token: TOKEN, $distinct_id: userId, $set: { $email: email } }];
  const encoded = btoa(JSON.stringify(payload));
  fetch(`https://api.mixpanel.com/engage?data=${encoded}&verbose=1`).catch(() => {});
}

export function oturumKapat() {
  distinctId = 'anonymous';
}

export function takipEt(olay: string, ozellikler?: Record<string, unknown>) {
  gonder(olay, ozellikler);
}

export const Olaylar = {
  EKRAN_GORUNTULENDI:   'ekran_goruntulendi',
  KOMBİN_OLUSTURULDU:  'kombin_olusturuldu',
  TRYON_BASLADI:       'tryon_basladi',
  TRYON_TAMAMLANDI:    'tryon_tamamlandi',
  DOLAP_EKLENDI:       'dolap_item_eklendi',
  SOSYAL_PAYLASILDI:   'sosyal_paylasildi',
  AVATAR_3D_ACILDI:    'avatar_3d_acildi',
  ABONELIK_BASLADI:    'abonelik_sayfasi_acildi',
  ABONELIK_TAMAMLANDI: 'abonelik_tamamlandi',
  JARVIS_SORULDU:      'jarvis_soruldu',
  KESFET_ACILDI:       'kesfet_acildi',
  BEGENI_YAPILDI:      'begeni_yapildi',
} as const;
