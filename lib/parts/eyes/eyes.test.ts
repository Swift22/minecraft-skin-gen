import { describe, it, expect } from 'vitest'
import { eyes } from './index'

const NAMES = ['round', 'almond', 'wide', 'close_set', 'sleepy', 'dot', 'square', 'mono'] as const

describe('eye parts', () => {
  it('registers all 8 shapes', () => {
    expect(eyes.names().sort()).toEqual([...NAMES].sort())
  })

  for (const name of NAMES) {
    it(`${name} mask is 8 rows × 8 cols`, () => {
      const mask = eyes.get(name)
      expect(mask.length).toBe(8)
      for (const row of mask) {
        expect(row.length).toBe(8)
      }
    })

    it(`${name} mask uses only Px symbols (S|W|E|M|N|H|h|I|R|.)`, () => {
      const mask = eyes.get(name)
      const allowed = new Set(['S', 'W', 'E', 'M', 'N', 'H', 'h', 'I', 'R', '.'])
      for (const row of mask) {
        for (const cell of row) {
          expect(allowed.has(cell)).toBe(true)
        }
      }
    })
  }
})
