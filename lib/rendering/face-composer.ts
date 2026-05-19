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

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
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
  } else {
    paintLayer(buf, brows.get(input.brows), input)
    paintLayer(buf, eyes.get(input.eye_shape), input)
    paintLayer(buf, noses.get(input.nose), input)
    paintLayer(buf, mouths.get(input.mouth), input)
    paintLayer(buf, hairStyles.get(input.hair_style).head_front_overlay, input)
  }

  // Skin shading layer (applies to BOTH paths): paint highlight + shadow pixels
  // ONLY where the buffer is still exposed skin_tone (i.e., the template/parametric
  // didn't draw a feature there). Gives the face dimensional depth without ever
  // overdrawing eyes, hair, or mouth.
  applySkinShading(buf, input)

  return buf
}

/**
 * Paint skin highlights (forehead, cheek tops) and shadows (jaw, outer cheeks)
 * onto pixels that are still pure skin_tone. Preserves any template/parametric feature.
 */
function applySkinShading(buf: Buffer, input: FaceComposerInput) {
  const skin = parseHex(input.skin_tone)
  const highlight = lerp(skin, [255, 255, 255], 0.15)
  const shadow = parseHex(input.nose_shadow)

  // Highlight pixels: forehead top-center catches light, upper cheek bones.
  const highlightPositions: Array<[number, number]> = [
    [3, 3], [3, 4],   // forehead between eyes
    [4, 1], [4, 6],   // cheekbones outer
  ]
  // Shadow pixels: jaw line corners, sides of chin, neck shadow.
  const shadowPositions: Array<[number, number]> = [
    [5, 0], [5, 7],   // outer cheek shadow
    [6, 0], [6, 7],   // jaw outer
    [7, 0], [7, 7],   // chin corners (neck shadow)
  ]

  for (const [row, col] of highlightPositions) {
    paintIfSkin(buf, row, col, skin, highlight)
  }
  for (const [row, col] of shadowPositions) {
    paintIfSkin(buf, row, col, skin, shadow)
  }
}

/** Write `replacement` to (row,col) only if that pixel is currently pure skin_tone. */
function paintIfSkin(
  buf: Buffer,
  row: number,
  col: number,
  skin: [number, number, number],
  replacement: [number, number, number],
) {
  const idx = (row * 8 + col) * 4
  if (buf[idx] === skin[0] && buf[idx + 1] === skin[1] && buf[idx + 2] === skin[2]) {
    buf[idx] = replacement[0]
    buf[idx + 1] = replacement[1]
    buf[idx + 2] = replacement[2]
    buf[idx + 3] = 255
  }
}
