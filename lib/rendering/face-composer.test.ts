import { describe, it, expect } from 'vitest'
import { composeFace, type FaceComposerInput } from './face-composer'

describe('composeFace', () => {
  it('returns an 8×8 RGBA buffer (256 bytes)', () => {
    const input: FaceComposerInput = {
      skin_tone: '#C4956A',
      eye_shape: 'round',
      eye_color: '#1E3A7A',
      eye_white: '#F0EFEB',
      brows: 'flat',
      mouth: 'smile',
      mouth_color: '#8B5040',
      nose: 'dot',
      nose_shadow: '#A07050',
      hair_color: '#3B2507',
      hair_accent_color: '#5A3D14',
      hair_style: 'classic',
    }
    const buf = composeFace(input)
    expect(buf.length).toBe(8 * 8 * 4)
  })

  it('round eyes paint eye_white on row 3 cols 1-2 and pupils on row 4', () => {
    const input: FaceComposerInput = {
      skin_tone: '#C4956A',
      eye_shape: 'round',
      eye_color: '#1E3A7A',
      eye_white: '#F0EFEB',
      brows: 'none', mouth: 'none', nose: 'none',
      mouth_color: '#000000', nose_shadow: '#000000',
      hair_color: '#3B2507', hair_accent_color: '#5A3D14',
      hair_style: 'bald', // bald has no head_front_overlay so face is unobstructed
    }
    const buf = composeFace(input)
    // Row 3 col 1: eye white (#F0EFEB)
    const whiteIdx = (3 * 8 + 1) * 4
    expect(buf[whiteIdx]).toBe(0xF0)
    expect(buf[whiteIdx + 1]).toBe(0xEF)
    expect(buf[whiteIdx + 2]).toBe(0xEB)
    // Row 4 col 1: pupil (eye_color #1E3A7A)
    const pupilIdx = (4 * 8 + 1) * 4
    expect(buf[pupilIdx]).toBe(0x1E)
    expect(buf[pupilIdx + 1]).toBe(0x3A)
    expect(buf[pupilIdx + 2]).toBe(0x7A)
  })
})
