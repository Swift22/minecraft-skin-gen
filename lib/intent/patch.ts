import { z } from 'zod'
import { GoogleGenAI } from '@google/genai'
import { skinIntentSchema, type SkinIntent } from './schema'
import { PATCH_SYSTEM_INSTRUCTION, buildPatchPrompt } from './patch-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const skinIntentPatchSchema = z.object({
  palette_changes: z.array(z.object({
    index: z.number().int().min(0).max(4),
    new_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })).optional(),
  character_changes: skinIntentSchema.shape.character.partial().optional(),
  outfit_changes: skinIntentSchema.shape.outfit.partial().optional(),
  affected_regions: z.array(z.string()),
  affects_character: z.boolean(),
})
export type SkinIntentPatch = z.infer<typeof skinIntentPatchSchema>

export interface PatchInput {
  intent: SkinIntent
  instruction: string
}

export async function runPatch(input: PatchInput): Promise<SkinIntentPatch> {
  const prompt = buildPatchPrompt(input.intent, input.instruction)

  async function attempt(): Promise<SkinIntentPatch> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: PATCH_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
    const text = response.text
    if (!text) throw new Error('Empty Patch response')
    return skinIntentPatchSchema.parse(JSON.parse(text))
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}

export function applyPatch(intent: SkinIntent, patch: SkinIntentPatch): SkinIntent {
  const next: SkinIntent = JSON.parse(JSON.stringify(intent))
  if (patch.palette_changes) {
    for (const c of patch.palette_changes) {
      if (c.index < next.palette.length) next.palette[c.index] = c.new_hex
    }
  }
  if (patch.character_changes) {
    Object.assign(next.character, patch.character_changes)
  }
  if (patch.outfit_changes) {
    Object.assign(next.outfit, patch.outfit_changes)
  }
  return next
}
