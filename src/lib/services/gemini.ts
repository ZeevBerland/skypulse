import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3.5-flash';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Returns the GenAI client + model name for callers that need direct access
 * (e.g. the brief route that streams a free-form response).
 */
export function getGeminiModel() {
  const ai = getClient();
  return { ai, model: MODEL_NAME };
}

export async function generateWithMapsGrounding(
  prompt: string,
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const ai = getClient();
    const locationContext = `User location: latitude ${lat}, longitude ${lng}.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `${locationContext}\n\n${prompt}`,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
      },
    });
    return response.text ?? '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gemini Maps grounding failed: ${message}`);
  }
}

export async function generateWithSearchGrounding(
  prompt: string,
): Promise<string> {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text ?? '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Gemini Search grounding failed: ${message}`);
  }
}

export async function generateStructured<T>(
  prompt: string,
): Promise<T> {
  let text = '';
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });
    text = response.text ?? '';
    return JSON.parse(text) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (text) {
      console.error('[Gemini] Raw response that failed to parse:', text.slice(0, 500));
    }
    throw new Error(`Gemini structured generation failed: ${message}`);
  }
}
