import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))
vi.mock('@/lib/skin-builder-v2', () => ({
  buildSkinPngV2: vi.fn().mockResolvedValue(Buffer.from('fakepng')),
}))
vi.mock('@/lib/intent/patch', () => ({
  runPatch: vi.fn().mockResolvedValue({
    palette_changes: [{ index: 0, new_hex: '#E63946' }],
    outfit_changes: { torso: 'red tunic' },
    affected_regions: ['torso_front', 'torso_back', 'torso_side'],
    affects_character: false,
  }),
  applyPatch: vi.fn().mockImplementation((intent: Record<string, unknown>, patch: { outfit_changes?: Record<string, unknown> }) => ({
    ...intent,
    palette: ['#E63946', ...(intent.palette as string[]).slice(1)],
    outfit: { ...(intent.outfit as Record<string, unknown>), torso: patch.outfit_changes?.torso ?? (intent.outfit as Record<string, unknown>).torso },
  })),
}))
vi.mock('@/lib/intent/artist', () => ({
  runArtist: vi.fn().mockResolvedValue({
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#E63946')),
    torso_back: Array(12).fill(null).map(() => Array(8).fill('#E63946')),
    torso_side: Array(12).fill(null).map(() => Array(4).fill('#B82A38')),
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
  const FULL_PIXELS = {
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
  const mockWhere = vi.fn().mockResolvedValue([{
    id: 'abc',
    intent: STORED_INTENT,
    pixels: FULL_PIXELS,
    manualOverrides: [],
  }])
  return { STORED_INTENT, FULL_PIXELS, mockWhere }
})

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: mockWhere,
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

describe('POST /api/generate/:id/patch', () => {
  it('applies a patch and returns updated intent + pixels', async () => {
    const req = new Request('http://test/api/generate/abc/patch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instruction: 'make the shirt redder' }),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.intent.palette[0]).toBe('#E63946')
    expect(json.intent.outfit.torso).toBe('red tunic')
    expect(json.pixels.torso_front[0][0]).toBe('#E63946')
  })

  it('returns 422 on empty patch with explanatory message', async () => {
    const mod = await import('@/lib/intent/patch')
    vi.mocked(mod.runPatch).mockResolvedValueOnce({
      affected_regions: [], affects_character: false,
    })
    const req = new Request('http://test/api/generate/abc/patch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instruction: 'do something cool' }),
    })
    const res = await POST(req as unknown as import('next/server').NextRequest, { params: Promise.resolve({ id: 'abc' }) } as { params: Promise<{ id: string }> })
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.message).toMatch(/not sure what to change/i)
  })
})
