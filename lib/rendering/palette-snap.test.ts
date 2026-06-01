import { describe, it, expect } from 'vitest'
import { rgbToLab, deltaE76, nearestPaletteColor, softSnap, precomputePalette, nearestPaletteColorPrecomputed, softSnapPrecomputed } from './palette-snap'

describe('rgbToLab', () => {
  it('converts pure red correctly (approx Lab 53.24, 80.09, 67.20)', () => {
    const lab = rgbToLab([255, 0, 0])
    expect(lab[0]).toBeCloseTo(53.24, 1)
    expect(lab[1]).toBeCloseTo(80.09, 1)
    expect(lab[2]).toBeCloseTo(67.20, 1)
  })
})

describe('deltaE76', () => {
  it('returns 0 for identical colors', () => {
    expect(deltaE76([50, 0, 0], [50, 0, 0])).toBe(0)
  })
  it('returns positive distance for different colors', () => {
    expect(deltaE76([50, 0, 0], [60, 0, 0])).toBeGreaterThan(0)
  })
})

describe('nearestPaletteColor', () => {
  it('returns the closest palette color and its distance', () => {
    const palette: [number, number, number][] = [[255, 0, 0], [0, 255, 0], [0, 0, 255]]
    const [color, dist] = nearestPaletteColor([250, 5, 5], palette)
    expect(color).toEqual([255, 0, 0])
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThan(5)
  })
  it('throws when palette is empty', () => {
    expect(() => nearestPaletteColor([100, 100, 100], [])).toThrow(/non-empty/)
  })
})

describe('softSnap', () => {
  it('keeps the input when within threshold', () => {
    const palette: [number, number, number][] = [[255, 0, 0]]
    expect(softSnap([250, 5, 5], palette, 24)).toEqual([250, 5, 5])
  })
  it('snaps to palette when outside threshold', () => {
    const palette: [number, number, number][] = [[255, 0, 0]]
    expect(softSnap([0, 255, 0], palette, 24)).toEqual([255, 0, 0])
  })
  it('hard-snaps when threshold is 0', () => {
    const palette: [number, number, number][] = [[255, 0, 0]]
    expect(softSnap([250, 5, 5], palette, 0)).toEqual([255, 0, 0])
  })
})

describe('precomputePalette', () => {
  it('returns one entry per palette color with rgb and lab', () => {
    const out = precomputePalette([[255, 0, 0], [0, 255, 0]])
    expect(out).toHaveLength(2)
    const first = out[0]!
    expect(first.rgb).toEqual([255, 0, 0])
    expect(first.lab[0]).toBeCloseTo(53.24, 1)
  })
})

describe('nearestPaletteColorPrecomputed', () => {
  it('returns the closest precomputed color', () => {
    const pre = precomputePalette([[255, 0, 0], [0, 255, 0], [0, 0, 255]])
    const [color, dist] = nearestPaletteColorPrecomputed([250, 5, 5], pre)
    expect(color).toEqual([255, 0, 0])
    expect(dist).toBeLessThan(5)
  })
  it('throws when palette is empty', () => {
    expect(() => nearestPaletteColorPrecomputed([100, 100, 100], [])).toThrow(/non-empty/)
  })
})

describe('softSnapPrecomputed', () => {
  it('matches softSnap behavior with precomputed palette', () => {
    const pre = precomputePalette([[255, 0, 0]])
    expect(softSnapPrecomputed([250, 5, 5], pre, 24)).toEqual([250, 5, 5])
    expect(softSnapPrecomputed([0, 255, 0], pre, 24)).toEqual([255, 0, 0])
    expect(softSnapPrecomputed([250, 5, 5], pre, 0)).toEqual([255, 0, 0])
  })
})
