import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))

const { mockWhere } = vi.hoisted(() => {
  const STORED_INTENT = {
    version: 1, seed: 1, style: 'retro',
    palette: ['#FFF', '#000', '#888'], palette_mode: 'soft',
    character: {
      skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#000', eye_white: '#FFF',
      brows: 'flat', mouth: 'smile', mouth_color: '#000', nose: 'dot', nose_shadow: '#000',
      hair_style: 'classic', hair_length: 'medium', hair_color: '#000', hair_accent_color: '#000',
      ear_template: 'none', ear_color: '#000', inner_ear_color: '#FFB8CC',
    },
    outfit: { torso: 'a', arms: 'b', legs: 'c' },
    refinement_history: [],
  }
  const FULL_PIXELS = {
    torso_front: [] as string[][], torso_back: [] as string[][], torso_side: [] as string[][],
    arm_front: [] as string[][], arm_side: [] as string[][], arm_back: [] as string[][],
    leg_front: [] as string[][], leg_side: [] as string[][], leg_back: [] as string[][],
  }
  const mockWhere = vi.fn().mockResolvedValue([{
    id: 'abc',
    userId: 'u1',
    intent: STORED_INTENT,
    pixels: FULL_PIXELS,
    manualOverrides: [],
    resultPath: 'skins/u1/abc.png',
    schemaVersion: 'v2',
  }])
  return { mockWhere }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: mockWhere,
  },
}))

describe('GET /api/generate/:id', () => {
  it('returns intent, pixels, manual_overrides, skinUrl', async () => {
    const res = await GET({} as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.intent.version).toBe(1)
    expect(Array.isArray(json.pixels.torso_front)).toBe(true)
    expect(Array.isArray(json.manual_overrides)).toBe(true)
  })

  it('returns 404 when generation is not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const res = await GET({} as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'missing' }) } as { params: Promise<{ id: string }> })
    expect(res.status).toBe(404)
  })
})
