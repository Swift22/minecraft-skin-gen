import { ears, type EarTemplate } from '@/lib/parts/ears/index'
import type { Px, PartMask } from '@/lib/parts/types'

export interface EarComposerInput {
  ear_template: EarTemplate
  ear_color: string
  inner_ear_color: string
  skin_tone: string
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) throw new Error(`Bad hex: ${hex}`)
  return [parseInt(m[1]!.slice(0, 2), 16), parseInt(m[1]!.slice(2, 4), 16), parseInt(m[1]!.slice(4, 6), 16)]
}

function pxColor(px: Px, input: EarComposerInput): [number, number, number] | null {
  switch (px) {
    case 'R': return parseHex(input.ear_color)
    case 'I': return parseHex(input.inner_ear_color)
    case 'S': return parseHex(input.skin_tone)
    default: return null
  }
}

function maskToBuffer(mask: PartMask | undefined, input: EarComposerInput): Buffer {
  const buf = Buffer.alloc(8 * 8 * 4, 0)
  if (!mask) return buf
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rgb = pxColor(mask[row]![col]!, input)
      if (!rgb) continue
      const idx = (row * 8 + col) * 4
      buf[idx] = rgb[0]; buf[idx + 1] = rgb[1]; buf[idx + 2] = rgb[2]; buf[idx + 3] = 255
    }
  }
  return buf
}

export interface EarOutput {
  hat_top: Buffer
  hat_right: Buffer
  hat_left: Buffer
  head_right_cutout?: Buffer
  head_left_cutout?: Buffer
}

export function composeEars(input: EarComposerInput): EarOutput {
  const bundle = ears.get(input.ear_template)
  return {
    hat_top: maskToBuffer(bundle.hat_top, input),
    hat_right: maskToBuffer(bundle.hat_right, input),
    hat_left: maskToBuffer(bundle.hat_left, input),
    head_right_cutout: bundle.head_right_cutout ? maskToBuffer(bundle.head_right_cutout, input) : undefined,
    head_left_cutout: bundle.head_left_cutout ? maskToBuffer(bundle.head_left_cutout, input) : undefined,
  }
}
