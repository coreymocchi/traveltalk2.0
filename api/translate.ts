import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side translation proxy for Vercel (keeps API key secret)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return res.status(500).json({ error: 'Translation API key not configured on server.' });

  const { text, target = 'en' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing `text` in request body' });

  try {
    const r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, format: 'text' })
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Translation request failed' });
  }
}
