// lib/parts/ears/ears.test.ts
import { describe, it, expect } from 'vitest'
import { ears } from './index'

const NAMES = ['none', 'round', 'pointy', 'cat', 'fox', 'bunny', 'wolf', 'elf'] as const

describe('ear templates', () => {
  it('registers all 8 templates', () => {
    expect(ears.names().sort()).toEqual([...NAMES].sort())
  })
  for (const name of NAMES) {
    it(`${name} has 8×8 hat_top, hat_right, hat_left masks`, () => {
      const b = ears.get(name)
      expect(b.hat_right.length).toBe(8)
      expect(b.hat_left.length).toBe(8)
      expect(b.hat_top.length).toBe(8)
    })
  }
})
