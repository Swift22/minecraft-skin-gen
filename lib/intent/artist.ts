import { GoogleGenAI } from '@google/genai'
import { skinPixelsSchema, type SkinIntent, type SkinPixels, type BodyRegion } from './schema'
import { ARTIST_SYSTEM_INSTRUCTION, buildArtistPrompt } from './artist-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface ArtistInput {
  intent: SkinIntent
  regions: BodyRegion[]
  context?: Partial<SkinPixels>
}

export async function runArtist(input: ArtistInput): Promise<Partial<SkinPixels>> {
  const prompt = buildArtistPrompt(input.intent, input.regions, input.context)

  async function attempt(): Promise<Partial<SkinPixels>> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: ARTIST_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
    const text = response.text
    if (!text) throw new Error('Empty Artist response')
    const parsed = JSON.parse(text)
    const partialSchema = skinPixelsSchema.partial()
    return partialSchema.parse(parsed)
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}
