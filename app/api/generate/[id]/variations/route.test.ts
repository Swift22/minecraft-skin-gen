import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))
vi.mock('@/lib/skin-builder-v2', () => ({
  buildSkinPngV2: vi.fn().mockResolvedValue(Buffer.from('fakepng')),
}))
vi.mock('@/lib/intent/artist', () => ({
  runArtist: vi.fn().mockResolvedValue({
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_back: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_front: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    arm_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_back: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    leg_front: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
    leg_side: Array(12).fill(null).map(() => Array(4).fill('#141020')),
    leg_back: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
  }),
}))

const { mockWhere } = vi.hoisted(() => {
  const STORED_INTENT = {
    version: 1, seed: 1, style: 'retro',
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
  const mockWhere = vi.fn().mockResolvedValue([{
    id: 'abc',
    intent: STORED_INTENT,
    pixels: {},
    userId: 'u1',
  }])
  return { mockWhere }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: mockWhere,
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

describe('POST /api/generate/:id/variations', () => {
  it('returns N variations for N <= 5', async () => {
    const req = new Request('http://test/api/generate/abc/variations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count: 3 }),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.variations.length).toBe(3)
    for (const v of json.variations) {
      expect(v.generationId).toBeTruthy()
    }
  })

  it('rejects count > 5', async () => {
    const req = new Request('http://test/api/generate/abc/variations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count: 10 }),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    expect(res.status).toBe(400)
  })
})
