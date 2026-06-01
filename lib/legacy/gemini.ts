import { GoogleGenAI, type Part } from '@google/genai'
import { regionColorMapSchema, type RegionColorMap } from './region-color-map'
import { env } from '../env'
import { SYSTEM_INSTRUCTION } from '../gemini-system-prompt'

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

const DEFAULT_PROMPT =
  'Generate a classic adventurer Minecraft skin with a tunic, dark trousers, and leather boots. Use saturated, readable colors.'

/**
 * Generate a RegionColorMap from a text prompt and optional reference image using Gemini.
 * Retries once on transient parse/network failure.
 */
export async function generateRegionColorMap(
  prompt: string,
  referenceImageBase64?: string,
  referenceImageMimeType?: 'image/jpeg' | 'image/png'
): Promise<RegionColorMap> {
  const parts: Part[] = []

  if (referenceImageBase64 && referenceImageMimeType) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: referenceImageMimeType,
      },
    })
  }

  parts.push({ text: prompt || DEFAULT_PROMPT })

  async function attempt(): Promise<RegionColorMap> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })

    const text = response.text
    if (!text) throw new Error('Empty response from Gemini')

    const parsed = JSON.parse(text)
    return regionColorMapSchema.parse(parsed)
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}
