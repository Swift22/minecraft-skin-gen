import { describe, it, expect } from 'vitest'
import { noses } from './index'

const NAMES = ['none', 'bridge', 'dot', 'wide'] as const

describe('nose parts', () => {
  it('registers all 4 shapes', () => {
    expect(noses.names().sort()).toEqual([...NAMES].sort())
  })
  for (const name of NAMES) {
    it(`${name} is 8×8 of valid Px`, () => {
      const m = noses.get(name)
      expect(m.length).toBe(8)
      for (const row of m) expect(row.length).toBe(8)
      const allowed = new Set(['S', 'W', 'E', 'M', 'N', 'H', 'h', 'I', 'R', '.'])
      for (const row of m) for (const c of row) expect(allowed.has(c)).toBe(true)
    })
  }
})
