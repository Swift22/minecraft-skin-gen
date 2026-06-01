import { describe, it, expect } from 'vitest'
import { composeEars, type EarComposerInput } from './ear-composer'

describe('composeEars', () => {
  it('returns buffers for hat_top, hat_right, hat_left', () => {
    const input: EarComposerInput = {
      ear_template: 'cat',
      ear_color: '#3B2507',
      inner_ear_color: '#FFB8CC',
      skin_tone: '#C4956A',
    }
    const out = composeEars(input)
    expect(out.hat_top.length).toBe(8 * 8 * 4)
    expect(out.hat_right.length).toBe(8 * 8 * 4)
    expect(out.hat_left.length).toBe(8 * 8 * 4)
  })

  it('none template returns transparent buffers', () => {
    const out = composeEars({
      ear_template: 'none',
      ear_color: '#3B2507',
      inner_ear_color: '#FFB8CC',
      skin_tone: '#C4956A',
    })
    for (let i = 3; i < out.hat_top.length; i += 4) {
      expect(out.hat_top[i]).toBe(0)
    }
  })
})
