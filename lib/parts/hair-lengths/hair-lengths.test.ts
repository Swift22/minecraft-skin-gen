import { describe, it, expect } from 'vitest'
import { hairLengths } from './index'
import type { HairStyleBundle } from '../hair-styles/types'
import type { PartMask } from '../types'

const NAMES = ['short', 'medium', 'long', 'very_long'] as const

function makeBundle(overrides: Partial<HairStyleBundle> = {}): HairStyleBundle {
  const empty: PartMask = Array(8)
    .fill(null)
    .map(() => Array(8).fill('.') as PartMask[number])
  return {
    head_front_overlay: empty,
    head_top: empty,
    head_right: empty,
    head_left: empty,
    head_back: empty,
    head_bottom: empty,
    hat_front: empty,
    hat_top: empty,
    hat_right: empty,
    hat_left: empty,
    hat_back: empty,
    ...overrides,
  }
}

describe('hair length modifiers', () => {
  it('registers 4 length modifiers', () => {
    expect(hairLengths.names().sort()).toEqual([...NAMES].sort())
  })

  it('short trims the back/length rows', () => {
    const bundle = makeBundle({
      hat_back: Array(8).fill(null).map(() => Array(8).fill('H') as PartMask[number]),
    })
    const mod = hairLengths.get('short')
    const out = mod(bundle)
    expect(out.hat_back[7]!.every((c) => c === '.')).toBe(true)
  })

  it('very_long extends seed hair columns all the way down', () => {
    // Seed row 0 with 'H' in cols 0,2,4,6 (every-other-column flowing pattern).
    // Expect very_long to extend those columns through row 7 while leaving cols
    // 1,3,5,7 empty — that preserves the corpus flowing-hair gaps.
    const seed: PartMask = Array(8).fill(null).map(() => Array(8).fill('.') as PartMask[number])
    seed[0] = ['H', '.', 'H', '.', 'H', '.', 'H', '.']
    const bundle = makeBundle({ hat_back: seed })
    const mod = hairLengths.get('very_long')
    const out = mod(bundle)
    // All 8 rows should have hair in seeded columns
    for (let r = 0; r < 8; r++) {
      expect(out.hat_back[r]![0]).toBe('H')
      expect(out.hat_back[r]![2]).toBe('H')
      expect(out.hat_back[r]![4]).toBe('H')
      expect(out.hat_back[r]![6]).toBe('H')
    }
    // Empty columns stay empty (flowing gap preserved)
    for (let r = 0; r < 8; r++) {
      expect(out.hat_back[r]![1]).toBe('.')
      expect(out.hat_back[r]![3]).toBe('.')
      expect(out.hat_back[r]![5]).toBe('.')
      expect(out.hat_back[r]![7]).toBe('.')
    }
  })

  it('long extends seed hair columns through row 5 but no further', () => {
    const seed: PartMask = Array(8).fill(null).map(() => Array(8).fill('.') as PartMask[number])
    seed[0] = ['H', '.', 'H', '.', 'H', '.', 'H', '.']
    const bundle = makeBundle({ hat_back: seed })
    const mod = hairLengths.get('long')
    const out = mod(bundle)
    for (let r = 0; r <= 5; r++) {
      expect(out.hat_back[r]![0]).toBe('H')
    }
    expect(out.hat_back[6]![0]).toBe('.')
    expect(out.hat_back[7]![0]).toBe('.')
  })
})
