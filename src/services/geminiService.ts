const apiKey = import.meta.env.VITE_API_KEY || '';

export async function translateText(text: string): Promise<string> {
  if (!apiKey) return text;
  try {
    // Use Google Cloud Translation v2 REST API (requires API key enabled for Cloud Translation)
    const res = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target: 'en', format: 'text' })
    });
    const data = await res.json();
    if (data && data.data && data.data.translations && data.data.translations[0] && data.data.translations[0].translatedText) {
      return data.data.translations[0].translatedText;
    }
  } catch (e) {
    // ignore and return original text
  }
  return text;
}
