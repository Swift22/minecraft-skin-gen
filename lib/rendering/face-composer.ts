import { eyes, type EyeShape } from '@/lib/parts/eyes/index'
import { mouths, type MouthShape } from '@/lib/parts/mouths/index'
import { brows, type BrowShape } from '@/lib/parts/brows/index'
import { noses, type NoseShape } from '@/lib/parts/noses/index'
import { hairStyles, type HairStyle } from '@/lib/parts/hair-styles/index'
import { faceTemplates, type FaceTemplateName } from '@/lib/parts/faces/index'
import type { Px, PartMask } from '@/lib/parts/types'

export interface FaceComposerInput {
  skin_tone: string
  // When set, use this full-face template (eyes/brows/mouth/nose/jaw all designed together).
  // When null/undefined, fall back to parametric composition.
  face_template?: FaceTemplateName | null
  eye_shape: EyeShape
  eye_color: string
  eye_white: string
  brows: BrowShape
  mouth: MouthShape
  mouth_color: string
  nose: NoseShape
  nose_shadow: string
  hair_color: string
  hair_accent_color: string
  hair_style: HairStyle
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) throw new Error(`Bad hex: ${hex}`)
  return [
    parseInt(m[1]!.slice(0, 2), 16),
    parseInt(m[1]!.slice(2, 4), 16),
    parseInt(m[1]!.slice(4, 6), 16),
  ]
}

function pxColor(px: Px, ctx: FaceComposerInput): [number, number, number] | null {
  switch (px) {
    case 'S': return parseHex(ctx.skin_tone)
    case 'W': return parseHex(ctx.eye_white)
    case 'E': return parseHex(ctx.eye_color)
    case 'M': return parseHex(ctx.mouth_color)
    case 'N': return parseHex(ctx.nose_shadow)
    case 'H': return parseHex(ctx.hair_color)
    case 'h': return parseHex(ctx.hair_accent_color)
    case 'I': return null
    case 'R': return null
    case '.': return null
  }
}

function paintLayer(buf: Buffer, mask: PartMask, ctx: FaceComposerInput) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rgb = pxColor(mask[row]![col]!, ctx)
      if (!rgb) continue
      const idx = (row * 8 + col) * 4
      buf[idx] = rgb[0]
      buf[idx + 1] = rgb[1]
      buf[idx + 2] = rgb[2]
      buf[idx + 3] = 255
    }
  }
}

/**
 * Render the head_front face. Two modes:
 *   - face_template set → paint the full cohesive template (owns all 8 rows × 8 cols).
 *   - face_template null → parametric stack: skin base + brows + eyes + nose + mouth +
 *     hair_style.head_front_overlay on top.
 *
 * Template mode skips hair_style.head_front_overlay because the template's own hair
 * pattern at the top rows IS the front-of-hair design. (Side / top / back hair regions
 * still come from hair_style elsewhere in the pipeline.)
 */
export function composeFace(input: FaceComposerInput): Buffer {
  const buf = Buffer.alloc(8 * 8 * 4, 0)
  const skin = parseHex(input.skin_tone)
  for (let i = 0; i < 8 * 8; i++) {
    buf[i * 4] = skin[0]
    buf[i * 4 + 1] = skin[1]
    buf[i * 4 + 2] = skin[2]
    buf[i * 4 + 3] = 255
  }

  if (input.face_template) {
    paintLayer(buf, faceTemplates.get(input.face_template), input)
    return buf
  }

  // Parametric fallback with holistic shading layers:
  //   1. Cheek shading (faint darker skin at cols 0,7 rows 4-6)
  //   2. Jaw line (1 row of darker skin at row 7 inner cols)
  //   3. Features: brows, eyes, nose, mouth
  //   4. Hair front overlay from hair_style
  paintHolisticShading(buf, input)
  paintLayer(buf, brows.get(input.brows), input)
  paintLayer(buf, eyes.get(input.eye_shape), input)
  paintLayer(buf, noses.get(input.nose), input)
  paintLayer(buf, mouths.get(input.mouth), input)
  paintLayer(buf, hairStyles.get(input.hair_style).head_front_overlay, input)
  return buf
}

/**
 * Add subtle cheek/jaw shading to give the parametric face dimensional definition.
 * Uses nose_shadow color (slightly darker than skin) at outer cheek pixels and
 * along the jawline. Painted BEFORE features so they stack on top cleanly.
 */
function paintHolisticShading(buf: Buffer, input: FaceComposerInput) {
  const shadow = parseHex(input.nose_shadow)
  // Outer cheek shading: cols 0 and 7, rows 5-6 (sides of lower face).
  const cheekPixels: Array<[number, number]> = [
    [5, 0], [6, 0],
    [5, 7], [6, 7],
  ]
  for (const [row, col] of cheekPixels) {
    const idx = (row * 8 + col) * 4
    buf[idx] = shadow[0]
    buf[idx + 1] = shadow[1]
    buf[idx + 2] = shadow[2]
    buf[idx + 3] = 255
  }
}
