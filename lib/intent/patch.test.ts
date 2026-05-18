import { describe, it, expect, vi } from 'vitest'

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}))

import { runPatch } from './patch'
import type { SkinIntent } from './schema'

const INTENT: SkinIntent = {
  version: 1, seed: 1, style: 'retro',
  palette: ['#1C3D73','#2A5099','#6B4A20'], palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
    brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
    nose: 'dot', nose_shadow: '#A07050',
    hair_style: 'classic', hair_length: 'medium',
    hair_color: '#3B2507', hair_accent_color: '#5A3D14',
    ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

describe('runPatch', () => {
  it('returns a SkinIntentPatch for "make the shirt redder"', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        palette_changes: [{ index: 0, new_hex: '#E63946' }],
        affected_regions: ['torso_front','torso_back','torso_side'],
        affects_character: false,
      }),
    })
    const patch = await runPatch({ intent: INTENT, instruction: 'make the shirt redder' })
    expect(patch.palette_changes?.[0]?.new_hex).toBe('#E63946')
    expect(patch.affected_regions).toContain('torso_front')
    expect(patch.affects_character).toBe(false)
  })
})
