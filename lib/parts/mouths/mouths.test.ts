import { describe, it, expect } from 'vitest'
import { mouths } from './index'

const NAMES = ['none', 'smile', 'wide_smile', 'frown', 'open', 'smirk'] as const

describe('mouth parts', () => {
  it('registers all 6 shapes', () => {
    expect(mouths.names().sort()).toEqual([...NAMES].sort())
  })

  for (const name of NAMES) {
    it(`${name} mask is 8 rows × 8 cols`, () => {
      const mask = mouths.get(name)
      expect(mask.length).toBe(8)
      for (const row of mask) expect(row.length).toBe(8)
    })

    it(`${name} mask uses only Px symbols`, () => {
      const allowed = new Set(['S','W','E','M','N','H','h','I','R','.'])
      for (const row of mouths.get(name)) for (const c of row) expect(allowed.has(c)).toBe(true)
    })
  }
})
