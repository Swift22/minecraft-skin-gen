// lib/parts/brows/brows.test.ts
import { describe, it, expect } from 'vitest'
import { brows } from './index'

const NAMES = ['none', 'flat', 'angled_up', 'angled_down', 'bushy'] as const

describe('brow parts', () => {
  it('registers all 5 shapes', () => {
    expect(brows.names().sort()).toEqual([...NAMES].sort())
  })
  for (const name of NAMES) {
    it(`${name} is 8×8 of valid Px`, () => {
      const m = brows.get(name)
      expect(m.length).toBe(8)
      for (const row of m) expect(row.length).toBe(8)
      const allowed = new Set(['S','W','E','M','N','H','h','I','R','.'])
      for (const row of m) for (const c of row) expect(allowed.has(c)).toBe(true)
    })
  }
})
