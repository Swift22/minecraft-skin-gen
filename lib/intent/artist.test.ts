import { describe, it, expect, vi } from 'vitest'

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}))

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}))

import { runArtist } from './artist'
import type { SkinIntent } from './schema'

const VALID_PIXELS: Record<string, string[][]> = {
  torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
  torso_back: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
  torso_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
  arm_front: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
  arm_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
  arm_back: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
  leg_front: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
  leg_side: Array(12).fill(null).map(() => Array(4).fill('#141020')),
  leg_back: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
}

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

describe('runArtist', () => {
  it('returns SkinPixels for all required body regions', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify(VALID_PIXELS) })
    const pixels = await runArtist({
      intent: INTENT,
      regions: ['torso_front','torso_back','torso_side','arm_front','arm_side','arm_back','leg_front','leg_side','leg_back'],
    })
    expect(pixels.torso_front?.length).toBe(12)
    expect(pixels.torso_front?.[0]?.length).toBe(8)
    expect(pixels.arm_front?.length).toBe(12)
  })

  it('accepts optional context for region re-roll', async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ torso_front: VALID_PIXELS.torso_front }) })
    const partial = await runArtist({
      intent: INTENT,
      regions: ['torso_front'],
      context: { torso_back: Array(12).fill(null).map(() => Array(8).fill('#000000')) } as Partial<import('./schema').SkinPixels>,
    })
    expect(partial.torso_front).toBeDefined()
  })
})
