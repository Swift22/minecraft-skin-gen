import { describe, it, expect } from 'vitest'
import { getRegionAt } from './region-lookup'

describe('getRegionAt', () => {
  it('returns head_front inner for pixel (8, 8)', () => {
    const region = getRegionAt(8, 8)
    expect(region).not.toBeNull()
    expect(region!.name).toBe('head_front')
    expect(region!.layer).toBe('inner')
  })

  it('returns hat_front outer for pixel (40, 8)', () => {
    const region = getRegionAt(40, 8)
    expect(region).not.toBeNull()
    expect(region!.name).toBe('hat_front')
    expect(region!.layer).toBe('outer')
  })

  it('returns torso_front inner for pixel (20, 20)', () => {
    const region = getRegionAt(20, 20)
    expect(region).not.toBeNull()
    expect(region!.name).toBe('torso_front')
    expect(region!.layer).toBe('inner')
  })

  it('returns null for out-of-bounds coordinates', () => {
    expect(getRegionAt(-1, 0)).toBeNull()
    expect(getRegionAt(0, -1)).toBeNull()
    expect(getRegionAt(64, 0)).toBeNull()
    expect(getRegionAt(0, 64)).toBeNull()
  })

  it('returns a region for every head area pixel', () => {
    // Head inner: x=8..15, y=8..15 should all be head_front
    for (let y = 8; y < 16; y++) {
      for (let x = 8; x < 16; x++) {
        const region = getRegionAt(x, y)
        expect(region).not.toBeNull()
        expect(region!.name).toBe('head_front')
      }
    }
  })

  it('returns left_leg_front for pixel (20, 52)', () => {
    const region = getRegionAt(20, 52)
    expect(region).not.toBeNull()
    expect(region!.name).toBe('left_leg_front')
    expect(region!.layer).toBe('inner')
  })

  it('outer regions overwrite inner where they overlap in the lookup grid', () => {
    // The outer regions are defined after inner ones in SKIN_REGIONS,
    // so they should be the last match. For example, jacket_front starts at (20, 36)
    const region = getRegionAt(20, 36)
    expect(region).not.toBeNull()
    expect(region!.name).toBe('jacket_front')
    expect(region!.layer).toBe('outer')
  })
})
