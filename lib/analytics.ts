const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';
const TRACK  = 'https://api.mixpanel.com/track';
const ENGAGE = 'https://api.mixpanel.com/engage';

let distinctId = 'anonymous';

function toBase64(str: string): string {
  try {
    // Unicode-safe base64
    return btoa(unescape(encodeURIComponent(str)));
  } catch (_) {
    return btoa(str.replace(/[^\x00-\x7F]/g, '?'));
  }
}

function gonder(olay: string, ozellikler: Record<string, unknown> = {}) {
  if (!TOKEN) return;
  try {
    const payload = [{
      event: olay,
      properties: {
        token: TOKEN,
        distinct_id: distinctId,
        time: Math.floor(Date.now() / 1000),
        ...ozellikler,
      },
    }];
    const encoded = toBase64(JSON.stringify(payload));
    fetch(`${TRACK}?data=${encoded}&verbose=1`).catch(() => {});
  } catch (_) {}
}

export function analyticsBaslat() {}

export function kullaniciBelirle(userId: string, email?: string) {
  distinctId = userId;
  if (!TOKEN || !email) return;
  try {
    const payload = [{ $token: TOKEN, $distinct_id: userId, $set: { $email: email } }];
    const encoded = toBase64(JSON.stringify(payload));
    fetch(`${ENGAGE}?data=${encoded}&verbose=1`).catch(() => {});
  } catch (_) {}
}

export function oturumKapat() {
  distinctId = 'anonymous';
}

export function takipEt(olay: string, ozellikler?: Record<string, unknown>) {
  gonder(olay, ozellikler);
}

export const Olaylar = {
  EKRAN_GORUNTULENDI:   'ekran_goruntulendi',
  KOMBIN_OLUSTURULDU:   'kombin_olusturuldu',
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
