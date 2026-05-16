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

  it('very_long fills hat_back fully', () => {
    const bundle = makeBundle({
      hat_back: Array(8).fill(null).map(() => Array(8).fill('.') as PartMask[number]),
    })
    const mod = hairLengths.get('very_long')
    const out = mod(bundle)
    const filledRows = out.hat_back.filter((row) => row.some((c) => c === 'H')).length
    expect(filledRows).toBeGreaterThanOrEqual(6)
  })
})
