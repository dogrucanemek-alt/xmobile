const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://xmobile-proxy.vercel.app';

function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

export interface ScrapedProduct {
  image: string;
  title?: string;
  price?: string;
  brand?: string;
  source_url: string;
}

/**
 * Trendyol/ZARA/H&M vb. ürün URL'sinden og:image + meta bilgileri çekiyor.
 * URL'den Try-On feature'ının veri kaynağı.
 */
export async function urldenUrunCek(url: string): Promise<ScrapedProduct> {
  const res = await fetch(`${API_URL}/api/fashn?action=scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal: timeoutSignal(15000),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as ScrapedProduct;
}
