import { hairStyles, type HairStyle } from '@/lib/parts/hair-styles/index'
import { hairLengths, type HairLength } from '@/lib/parts/hair-lengths/index'
import type { Px, PartMask } from '@/lib/parts/types'

export interface HairComposerInput {
  hair_style: HairStyle
  hair_length: HairLength
  hair_color: string
  hair_accent_color: string
  skin_tone: string
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) throw new Error(`Bad hex: ${hex}`)
  return [parseInt(m[1]!.slice(0, 2), 16), parseInt(m[1]!.slice(2, 4), 16), parseInt(m[1]!.slice(4, 6), 16)]
}

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function pxColor(px: Px, input: HairComposerInput): [number, number, number] | null {
  switch (px) {
    case 'S': return parseHex(input.skin_tone)
    case 'H': return parseHex(input.hair_color)
    case 'h': return parseHex(input.hair_accent_color)
    default: return null
  }
}

function maskToBuffer(mask: PartMask, input: HairComposerInput): Buffer {
  const buf = Buffer.alloc(8 * 8 * 4, 0)
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

export interface HairOutput {
  head_top: Buffer
  head_right: Buffer
  head_left: Buffer
  head_back: Buffer
  head_bottom: Buffer
  head_front_overlay: Buffer
  hat_front: Buffer
  hat_top: Buffer
  hat_right: Buffer
  hat_left: Buffer
  hat_back: Buffer
}

export function composeHair(input: HairComposerInput): HairOutput {
  const baseBundle = hairStyles.get(input.hair_style)
  const bundle = hairLengths.get(input.hair_length)(baseBundle)
  const out: HairOutput = {
    head_top:           maskToBuffer(bundle.head_top, input),
    head_right:         maskToBuffer(bundle.head_right, input),
    head_left:          maskToBuffer(bundle.head_left, input),
    head_back:          maskToBuffer(bundle.head_back, input),
    head_bottom:        maskToBuffer(bundle.head_bottom, input),
    head_front_overlay: maskToBuffer(bundle.head_front_overlay, input),
    hat_front:          maskToBuffer(bundle.hat_front, input),
    hat_top:            maskToBuffer(bundle.hat_top, input),
    hat_right:          maskToBuffer(bundle.hat_right, input),
    hat_left:           maskToBuffer(bundle.hat_left, input),
    hat_back:           maskToBuffer(bundle.hat_back, input),
  }

  // Hair highlight strip on head_top: paint a lighter shade onto hair-color pixels
  // along the crown (top center) for dimensional depth. Skip skin-toned pixels (bald).
  const hairBase = parseHex(input.hair_color)
  const hairLight = lerp(hairBase, [255, 255, 255], 0.22)
  // Crown highlight: rows 2-3, cols 3-4 of head_top (top-back of skull catches light).
  const highlightPositions: Array<[number, number]> = [[2, 3], [2, 4]]
  for (const [row, col] of highlightPositions) {
    const idx = (row * 8 + col) * 4
    // Only highlight if pixel is actual hair_color (not skin S, not transparent).
    if (
      out.head_top[idx] === hairBase[0] &&
      out.head_top[idx + 1] === hairBase[1] &&
      out.head_top[idx + 2] === hairBase[2]
    ) {
      out.head_top[idx] = hairLight[0]
      out.head_top[idx + 1] = hairLight[1]
      out.head_top[idx + 2] = hairLight[2]
    }
  }

  return out
}
