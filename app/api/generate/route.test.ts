import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { SkinIntent, SkinPixels } from '@/lib/intent/schema'
import { POST } from './route'

const VALID_INTENT = {
  version: 1, seed: 42, style: 'retro',
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

const VALID_PIXELS = {
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

vi.mock('@/lib/intent/director', () => ({
  runDirector: vi.fn(),
}))

vi.mock('@/lib/intent/artist', () => ({
  runArtist: vi.fn(),
}))

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))

// Prevent env validation from blowing up (supabase/server → lib/env)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

describe('POST /api/generate (v2 local mode)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { runDirector } = await import('@/lib/intent/director')
    const { runArtist } = await import('@/lib/intent/artist')
    vi.mocked(runDirector).mockResolvedValue(VALID_INTENT as SkinIntent)
    vi.mocked(runArtist).mockResolvedValue(VALID_PIXELS as SkinPixels)
  })

  it('returns a skin URL for a valid prompt', async () => {
    const req = new Request('http://test/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'a blue tunic knight' }),
    })
    const res = await POST(req as unknown as NextRequest)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.status).toBe('completed')
    expect(json.skinUrl).toMatch(/\.png$/)
    expect(json.intent).toBeDefined()
  })

  it('rejects empty input with 400', async () => {
    const req = new Request('http://test/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req as unknown as NextRequest)
    expect(res.status).toBe(400)
  })
})
