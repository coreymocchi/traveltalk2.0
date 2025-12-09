export async function translateText(text: string): Promise<string> {
  try {
    // Call server-side translate endpoint which keeps the API key secret
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) return text;
    const data = await res.json();
    if (data && data.data && data.data.translations && data.data.translations[0] && data.data.translations[0].translatedText) {
      return data.data.translations[0].translatedText;
    }
  } catch (e) {
    // ignore and return original text
  }
  return text;
}
