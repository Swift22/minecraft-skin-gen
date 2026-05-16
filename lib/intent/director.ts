import { GoogleGenAI, type Part } from '@google/genai'
import { skinIntentSchema, type SkinIntent } from './schema'
import { DIRECTOR_SYSTEM_INSTRUCTION } from './director-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface DirectorInput {
  prompt: string
  referenceImageBase64?: string
  referenceImageMimeType?: 'image/jpeg' | 'image/png'
}

export async function runDirector(input: DirectorInput): Promise<SkinIntent> {
  const parts: Part[] = []
  if (input.referenceImageBase64 && input.referenceImageMimeType) {
    parts.push({
      inlineData: { data: input.referenceImageBase64, mimeType: input.referenceImageMimeType },
    })
  }
  parts.push({ text: input.prompt || 'A classic adventurer Minecraft skin.' })

  async function attempt(): Promise<SkinIntent> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: DIRECTOR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
    const text = response.text
    if (!text) throw new Error('Empty Director response')
    return skinIntentSchema.parse(JSON.parse(text))
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}
