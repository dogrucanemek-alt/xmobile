const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

export type Tier = 'free' | 'pro';
export type Metric = 'tryon' | 'suggestion' | 'rembg' | 'dalle' | 'meshy';

export interface UsageSnapshot {
  tier: Tier;
  usage: {
    tryon_count: number;
    suggestion_count: number;
    rembg_count: number;
    dalle_count: number;
    meshy_count: number;
    cost_cents: number;
  };
  limits: Record<Metric, number>;
}

export async function kullanimAl(userId: string): Promise<UsageSnapshot | null> {
  try {
    const res = await fetch(`${API_URL}/api/fashn?action=usage&user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    return (await res.json()) as UsageSnapshot;
  } catch {
    return null;
  }
}

/**
 * Verilen metrik için kalan hak. -1 = sınırsız, 0+ = sayı.
 */
export function kalanHak(snap: UsageSnapshot, metric: Metric): number {
  const limit = snap.limits[metric] ?? 0;
  if (limit === -1) return -1;
  const used = snap.usage[`${metric}_count`] ?? 0;
  return Math.max(0, limit - used);
}

/**
 * Renk seçim helper: kalan haktan kırmızı/sarı/yeşil
 */
export function kalanRenk(kalan: number, limit: number): '#27AE60' | '#F39C12' | '#E74C3C' | '#7F8C8D' {
  if (limit === -1) return '#7F8C8D'; // sınırsız → nötr
  const oran = kalan / limit;
  if (oran > 0.5) return '#27AE60';
  if (oran > 0.2) return '#F39C12';
  return '#E74C3C';
}
