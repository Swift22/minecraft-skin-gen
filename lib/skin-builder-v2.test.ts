// lib/skin-builder-v2.test.ts
import { describe, it, expect } from 'vitest'
import { buildSkinPngV2 } from './skin-builder-v2'
import sharp from 'sharp'

const TEST_INTENT = {
  version: 1 as const,
  seed: 1,
  style: 'retro' as const,
  palette: ['#1C3D73', '#2A5099', '#6B4A20'] as [string, string, string],
  palette_mode: 'soft' as const,
  character: {
    skin_tone: '#C4956A',
    eye_shape: 'round' as const,
    eye_color: '#1E3A7A',
    eye_white: '#F0EFEB',
    brows: 'flat' as const,
    mouth: 'smile' as const,
    mouth_color: '#8B5040',
    nose: 'dot' as const,
    nose_shadow: '#A07050',
    hair_style: 'classic' as const,
    hair_length: 'medium' as const,
    hair_color: '#3B2507',
    hair_accent_color: '#5A3D14',
    ear_template: 'none' as const,
    ear_color: '#3B2507',
    inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

const TEST_PIXELS = {
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

describe('buildSkinPngV2', () => {
  it('produces a 64×64 PNG', async () => {
    const buf = await buildSkinPngV2(TEST_INTENT, TEST_PIXELS)
    const meta = await sharp(buf).metadata()
    expect(meta.width).toBe(64)
    expect(meta.height).toBe(64)
    expect(meta.format).toBe('png')
  })

  it('mirrors arm_front identically to right and left arm regions', async () => {
    const buf = await buildSkinPngV2(TEST_INTENT, TEST_PIXELS)
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
    // right_arm_front UV starts at (44, 20). left_arm_front UV starts at (36, 52).
    // After horizontal mirror of arm_front, the LEFT side renders at the left_arm_front region.
    // To check mirror correctness: pixel at right_arm_front (44,20) (leftmost col of right arm)
    // should equal pixel at left_arm_front (36+3, 52) = (39, 52) (rightmost col of left arm after mirror).
    const idxR = (20 * info.width + 44) * info.channels
    const idxL = (52 * info.width + 39) * info.channels
    expect(data[idxR]).toBe(data[idxL])
    expect(data[idxR + 1]).toBe(data[idxL + 1])
    expect(data[idxR + 2]).toBe(data[idxL + 2])
  })
})
