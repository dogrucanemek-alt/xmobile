export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://trueai-inky.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir email adresi gir.' });
  }

  const apiKey  = process.env.BREVO_API_KEY;
  const listId  = parseInt(process.env.BREVO_LIST_ID || '2', 10);

  if (!apiKey) {
    // Brevo not configured yet — silently succeed so UX is unaffected
    return res.status(200).json({ ok: true, note: 'brevo_not_configured' });
  }

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: false,
        attributes: {
          SOURCE: 'waitlist',
          SIGNUP_DATE: new Date().toISOString().slice(0, 10),
        },
      }),
    });

    // 201 = created, 204 = updated, 400 w/ duplicate_parameter = already exists (OK)
    if (r.status === 201 || r.status === 204) {
      return res.status(200).json({ ok: true });
    }

    const body = await r.json().catch(() => ({}));
    if (r.status === 400 && body.code === 'duplicate_parameter') {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    console.error('Brevo error', r.status, body);
    return res.status(500).json({ error: 'Brevo hatası' });

  } catch (err) {
    console.error('waitlist handler error', err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}