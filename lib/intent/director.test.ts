import { describe, it, expect, vi } from 'vitest'

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}))

import { runDirector } from './director'

const VALID_RESPONSE = {
  version: 1, seed: 42, style: 'retro',
  palette: ['#1C3D73', '#2A5099', '#6B4A20'], palette_mode: 'soft',
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

describe('runDirector', () => {
  it('returns a valid SkinIntent for a text prompt', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_RESPONSE) })
    const intent = await runDirector({ prompt: 'a knight in blue tunic' })
    expect(intent.style).toBe('retro')
    expect(intent.palette.length).toBeGreaterThanOrEqual(3)
    expect(intent.character.hair_style).toBe('classic')
  })

  it('throws on invalid Gemini output after retry', async () => {
    mockGenerateContent.mockResolvedValue({ text: '{ "invalid": true }' })
    await expect(runDirector({ prompt: 'x' })).rejects.toThrow()
  })
})
