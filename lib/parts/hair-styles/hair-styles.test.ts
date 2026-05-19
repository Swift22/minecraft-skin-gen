import { describe, it, expect } from 'vitest'
import { hairStyles } from './index'

const NAMES = [
  'classic',
  'bangs',
  'side_part',
  'mohawk',
  'fluffy',
  'curtain',
  'bald',
  'bun',
  'ponytail',
  'spiky',
  'undercut',
  'dreads',
  'long_flowing',
  'twin_tails',
  'horned',
  'antennae',
  'frog_hood',
] as const

describe('hair-style bundles', () => {
  it('registers all 17 styles', () => {
    expect(hairStyles.names().sort()).toEqual([...NAMES].sort())
  })

  for (const name of NAMES) {
    it(`${name} bundle has all required regions`, () => {
      const b = hairStyles.get(name)
      expect(b.head_front_overlay.length).toBe(8)
      expect(b.head_top.length).toBe(8)
      expect(b.head_right.length).toBe(8)
      expect(b.head_left.length).toBe(8)
      expect(b.head_back.length).toBe(8)
      expect(b.head_bottom.length).toBe(8)
      expect(b.hat_front.length).toBe(8)
      expect(b.hat_top.length).toBe(8)
      expect(b.hat_right.length).toBe(8)
      expect(b.hat_left.length).toBe(8)
      expect(b.hat_back.length).toBe(8)
    })
  }
})
