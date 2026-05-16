/**
 * xmobile-proxy: virtual try-on router
 *
 * Provider seçimi env var ile yapılır:
 *   TRYON_PROVIDER=replicate  → Replicate idm-vton
 *   TRYON_PROVIDER=fashn      → Fashn.ai (default)
 *
 * Frontend (lib/fashnService.ts) kodunu DEĞİŞTİRMEZ.
 * Aynı endpoint /api/fashn — sadece bu dosyanın içeriği provider'a göre route eder.
 *
 * ENV gerekli:
 *   FASHN_KEY              (Fashn için)
 *   REPLICATE_API_TOKEN    (Replicate için)
 *   TRYON_PROVIDER         (opsiyonel — fashn varsayılan)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const PROVIDER = (process.env.TRYON_PROVIDER || 'fashn').toLowerCase();

const FASHN_RUN    = 'https://api.fashn.ai/v1/run';
const FASHN_STATUS = (id: string) => `https://api.fashn.ai/v1/status/${id}`;

// Replicate idm-vton — public model
const REPLICATE_RUN    = 'https://api.replicate.com/v1/models/cuuupid/idm-vton/predictions';
const REPLICATE_STATUS = (id: string) => `https://api.replicate.com/v1/predictions/${id}`;

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      return PROVIDER === 'replicate' ? replicateRun(req, res) : fashnRun(req, res);
    }
    if (req.method === 'GET') {
      return PROVIDER === 'replicate' ? replicateStatus(req, res) : fashnStatus(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message ?? e) });
  }
}

// ─── FASHN ────────────────────────────────────────────────
async function fashnRun(req: VercelRequest, res: VercelResponse) {
  const key = process.env.FASHN_KEY;
  if (!key) return res.status(500).json({ error: 'FASHN_KEY missing' });
  const r = await fetch(FASHN_RUN, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });
  const data = await r.json().catch(() => ({}));
  return res.status(r.status).json(data);
}

async function fashnStatus(req: VercelRequest, res: VercelResponse) {
  const key = process.env.FASHN_KEY;
  if (!key) return res.status(500).json({ error: 'FASHN_KEY missing' });
  const id = String(req.query.id ?? '');
  if (!id) return res.status(400).json({ error: 'id required' });
  const r = await fetch(FASHN_STATUS(id), {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  const data = await r.json().catch(() => ({}));
  return res.status(r.status).json(data);
}

// ─── REPLICATE ────────────────────────────────────────────
function kategoriEsle(c: unknown): string {
  const s = String(c ?? '').toLowerCase();
  if (s === 'bottoms') return 'lower_body';
  if (s === 'one-pieces' || s === 'dresses') return 'dresses';
  return 'upper_body'; // tops, auto, anything else
}

async function replicateRun(req: VercelRequest, res: VercelResponse) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN missing' });

  const { model_image, garment_image, category } = (req.body ?? {}) as any;
  if (!model_image || !garment_image) {
    return res.status(400).json({ error: 'model_image and garment_image required' });
  }

  const r = await fetch(REPLICATE_RUN, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        human_img: model_image,
        garm_img: garment_image,
        category: kategoriEsle(category),
      },
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail: any = (data as any)?.detail;
    const errStr = typeof detail === 'string'
      ? detail
      : (data as any)?.error || `Replicate error: ${r.status}`;
    // Map kredi/quota hatalarını Fashn formatına benzet
    const lower = String(errStr).toLowerCase();
    if (lower.includes('credit') || lower.includes('quota') || lower.includes('insufficient') || r.status === 402) {
      return res.status(429).json({ error: 'OutOfCredits', message: errStr });
    }
    return res.status(r.status).json({ error: errStr });
  }

  // Fashn formatına normalize et: { id: "..." }
  return res.status(200).json({ id: (data as any).id });
}

async function replicateStatus(req: VercelRequest, res: VercelResponse) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN missing' });
  const id = String(req.query.id ?? '');
  if (!id) return res.status(400).json({ error: 'id required' });

  const r = await fetch(REPLICATE_STATUS(id), {
    headers: { 'Authorization': `Token ${token}` },
  });
  const data = await r.json().catch(() => ({})) as any;

  // Replicate status: starting | processing | succeeded | failed | canceled
  // Fashn format:     starting | in_queue | processing | completed | failed
  let status = data.status as string | undefined;
  if (status === 'succeeded') status = 'completed';
  else if (status === 'canceled') status = 'failed';

  // Output array veya string olabilir, normalize et
  let output = data.output;
  if (output && !Array.isArray(output)) output = [output];

  return res.status(r.ok ? 200 : r.status).json({
    status: status ?? 'processing',
    output: output ?? null,
    error: data.error ?? null,
  });
}
