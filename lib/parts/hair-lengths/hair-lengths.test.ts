import { describe, it, expect } from 'vitest'
import { hairLengths } from './index'

const NAMES = ['short', 'medium', 'long', 'very_long'] as const

describe('hair length modifiers', () => {
  it('registers 4 length modifiers', () => {
    expect(hairLengths.names().sort()).toEqual([...NAMES].sort())
  })

  it('short trims the back/length rows', () => {
    const bundle = {
      hat_back: Array(8).fill(null).map(() => Array(8).fill('H')),
    }
    const mod = hairLengths.get('short')
    const out = mod(bundle as any)
    expect(out.hat_back[7].every((c: string) => c === '.')).toBe(true)
  })

  it('very_long fills hat_back fully', () => {
    const bundle = {
      hat_back: Array(8).fill(null).map(() => Array(8).fill('.')),
    }
    const mod = hairLengths.get('very_long')
    const out = mod(bundle as any)
    const filledRows = out.hat_back.filter((row: string[]) => row.some((c) => c === 'H')).length
    expect(filledRows).toBeGreaterThanOrEqual(6)
  })
})
