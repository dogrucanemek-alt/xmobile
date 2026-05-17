const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

export type Tier = 'free' | 'pro';

/**
 * Kullanıcının server-side tier'ını günceller.
 * Pro purchase başarılı olunca veya manual subscription event'inde çağrılır.
 *
 * NOT (production): Şu an client trusted — RevenueCat webhook eklenmeli.
 */
export async function tierGuncelle(userId: string, tier: Tier): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/fashn?action=set-tier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, tier }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
