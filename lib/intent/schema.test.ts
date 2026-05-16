import { describe, it, expect } from 'vitest'
import { skinIntentSchema, skinPixelsSchema } from './schema'

const VALID_INTENT = {
  version: 1,
  seed: 1,
  style: 'retro',
  palette: ['#1C3D73', '#2A5099', '#6B4A20'],
  palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A',
    eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
    brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
    nose: 'dot', nose_shadow: '#A07050',
    hair_style: 'classic', hair_length: 'medium',
    hair_color: '#3B2507', hair_accent_color: '#5A3D14',
    ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

describe('skinIntentSchema', () => {
  it('accepts a valid intent', () => {
    expect(() => skinIntentSchema.parse(VALID_INTENT)).not.toThrow()
  })
  it('rejects intent with invalid eye_shape', () => {
    const bad = { ...VALID_INTENT, character: { ...VALID_INTENT.character, eye_shape: 'banana' } }
    expect(() => skinIntentSchema.parse(bad)).toThrow()
  })
  it('rejects palette shorter than 3 colors', () => {
    const bad = { ...VALID_INTENT, palette: ['#FFFFFF', '#000000'] }
    expect(() => skinIntentSchema.parse(bad)).toThrow()
  })
  it('rejects palette longer than 5 colors', () => {
    const bad = { ...VALID_INTENT, palette: ['#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF'] }
    expect(() => skinIntentSchema.parse(bad)).toThrow()
  })
  it('defaults palette_mode to "soft" when omitted', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { palette_mode, ...rest } = VALID_INTENT
    const parsed = skinIntentSchema.parse(rest)
    expect(parsed.palette_mode).toBe('soft')
  })
})

describe('skinPixelsSchema', () => {
  it('accepts a valid pixels object', () => {
    const pixels = {
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
    expect(() => skinPixelsSchema.parse(pixels)).not.toThrow()
  })
})
