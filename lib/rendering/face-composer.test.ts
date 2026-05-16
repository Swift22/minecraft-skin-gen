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

  it('row 4 has eye_white pixels for round eyes', () => {
    const input: FaceComposerInput = {
      skin_tone: '#C4956A',
      eye_shape: 'round',
      eye_color: '#1E3A7A',
      eye_white: '#F0EFEB',
      brows: 'none', mouth: 'none', nose: 'none',
      mouth_color: '#000000', nose_shadow: '#000000',
      hair_color: '#3B2507', hair_accent_color: '#5A3D14',
      hair_style: 'classic',
    }
    const buf = composeFace(input)
    const idx = (4 * 8 + 1) * 4
    expect(buf[idx]).toBe(0xF0)
    expect(buf[idx + 1]).toBe(0xEF)
    expect(buf[idx + 2]).toBe(0xEB)
  })
})
