import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function translateText(text: string): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Translate the following text to English if it is not in English. If it is in English, translate it to Spanish. Only return the translated text, no explanations. Text: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text || "Translation unavailable.";
  } catch (error) {
    console.error("Gemini translation error:", error);
    return "Translation failed.";
  }
}

export async function generateAIResponse(message: string, context: string = ''): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a helpful travel assistant named TravelBot. 
    User said: "${message}".
    Context: ${context}.
    Provide a helpful, concise response about travel, directions, or local tips.`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I'm thinking...";
  } catch (error) {
    console.error("Gemini response error:", error);
    return "I'm having trouble connecting to the travel network right now.";
  }
}