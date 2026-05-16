import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))
vi.mock('@/lib/skin-builder-v2', () => ({
  buildSkinPngV2: vi.fn().mockResolvedValue(Buffer.from('fakepng')),
}))

const { mockWhere, mockSet } = vi.hoisted(() => {
  const mockSet = vi.fn().mockReturnThis()
  const mockWhere = vi.fn().mockResolvedValue([{ id: 'abc', userId: 'u1' }])
  return { mockWhere, mockSet }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: mockWhere,
    update: vi.fn().mockReturnThis(),
    set: mockSet,
  },
}))

const VALID = {
  intent: {
    version: 1, seed: 1, style: 'retro',
    palette: ['#FFFFFF', '#000000', '#888888'], palette_mode: 'soft',
    character: {
      skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#000000', eye_white: '#FFFFFF',
      brows: 'flat', mouth: 'smile', mouth_color: '#000000', nose: 'dot', nose_shadow: '#000000',
      hair_style: 'classic', hair_length: 'medium', hair_color: '#000000', hair_accent_color: '#000000',
      ear_template: 'none', ear_color: '#000000', inner_ear_color: '#FFB8CC',
    },
    outfit: { torso: 'a', arms: 'b', legs: 'c' },
    refinement_history: [],
  },
  pixels: {
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_back:  Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_side:  Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_front:   Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    arm_side:    Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_back:    Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    leg_front:   Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
    leg_side:    Array(12).fill(null).map(() => Array(4).fill('#141020')),
    leg_back:    Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
  },
  manual_overrides: ['torso_front'],
}

describe('POST /api/generate/:id/save', () => {
  it('persists intent, pixels, and manual_overrides', async () => {
    const req = new Request('http://test/api/generate/abc/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('returns 400 when intent is invalid', async () => {
    const req = new Request('http://test/api/generate/abc/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...VALID, intent: { bad: true } }),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    expect(res.status).toBe(400)
  })

  it('returns 404 when generation is not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const req = new Request('http://test/api/generate/missing/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'missing' }) } as { params: Promise<{ id: string }> })
    expect(res.status).toBe(404)
  })
})
