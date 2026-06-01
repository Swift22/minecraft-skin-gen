// lib/skin-builder-v2.ts
import sharp from 'sharp'
import { composeFace } from './rendering/face-composer'
import { composeHair } from './rendering/hair-composer'
import { composeEars } from './rendering/ear-composer'
import { softSnapPrecomputed, precomputePalette, DEFAULT_SNAP_THRESHOLD, type RGB } from './rendering/palette-snap'
import { mirrorHorizontal } from './rendering/mirror'
import type { EyeShape } from './parts/eyes/index'
import type { MouthShape } from './parts/mouths/index'
import type { BrowShape } from './parts/brows/index'
import type { NoseShape } from './parts/noses/index'
import type { HairStyle } from './parts/hair-styles/index'
import type { HairLength } from './parts/hair-lengths/index'
import type { EarTemplate } from './parts/ears/index'
import type { FaceTemplateName } from './parts/faces/index'

const W = 64
const H = 64
const C = 4

export interface SkinIntent {
  version: 1
  seed: number
  style: string
  palette: string[]
  palette_mode: 'soft' | 'hard'
  character: {
    skin_tone: string
    face_template?: FaceTemplateName | null
    eye_shape: EyeShape
    eye_color: string
    eye_white: string
    brows: BrowShape
    mouth: MouthShape
    mouth_color?: string | null
    nose: NoseShape
    nose_shadow?: string | null
    hair_style: HairStyle
    hair_length: HairLength
    hair_color: string
    hair_accent_color?: string | null
    ear_template: EarTemplate
    ear_color?: string | null
    inner_ear_color?: string | null
  }
  outfit: { torso: string; arms: string; legs: string; jacket?: string | null; sleeves?: string | null; pants_outer?: string | null; accessories?: string | null }
  refinement_history: unknown[]
}

export interface SkinPixels {
  torso_front: string[][]
  torso_back: string[][]
  torso_side: string[][]
  arm_front: string[][]
  arm_side: string[][]
  arm_back: string[][]
  leg_front: string[][]
  leg_side: string[][]
  leg_back: string[][]
  jacket_front?: string[][]
  jacket_back?: string[][]
  jacket_side?: string[][]
  sleeve_front?: string[][]
  pants_outer_front?: string[][]
}

interface Region { x: number; y: number; w: number; h: number }

const R: Record<string, Region> = {
  head_top:    { x: 8,  y: 0,  w: 8, h: 8 },
  head_bottom: { x: 16, y: 0,  w: 8, h: 8 },
  head_right:  { x: 0,  y: 8,  w: 8, h: 8 },
  head_front:  { x: 8,  y: 8,  w: 8, h: 8 },
  head_left:   { x: 16, y: 8,  w: 8, h: 8 },
  head_back:   { x: 24, y: 8,  w: 8, h: 8 },
  hat_top:     { x: 40, y: 0,  w: 8, h: 8 },
  hat_bottom:  { x: 48, y: 0,  w: 8, h: 8 },
  hat_right:   { x: 32, y: 8,  w: 8, h: 8 },
  hat_front:   { x: 40, y: 8,  w: 8, h: 8 },
  hat_left:    { x: 48, y: 8,  w: 8, h: 8 },
  hat_back:    { x: 56, y: 8,  w: 8, h: 8 },
  torso_front: { x: 20, y: 20, w: 8, h: 12 },
  torso_right: { x: 16, y: 20, w: 4, h: 12 },
  torso_left:  { x: 28, y: 20, w: 4, h: 12 },
  torso_back:  { x: 32, y: 20, w: 8, h: 12 },
  right_arm_front: { x: 44, y: 20, w: 4, h: 12 },
  right_arm_right: { x: 40, y: 20, w: 4, h: 12 },
  right_arm_left:  { x: 48, y: 20, w: 4, h: 12 },
  right_arm_back:  { x: 52, y: 20, w: 4, h: 12 },
  left_arm_front:  { x: 36, y: 52, w: 4, h: 12 },
  left_arm_right:  { x: 32, y: 52, w: 4, h: 12 },
  left_arm_left:   { x: 40, y: 52, w: 4, h: 12 },
  left_arm_back:   { x: 44, y: 52, w: 4, h: 12 },
  right_leg_front: { x: 4,  y: 20, w: 4, h: 12 },
  right_leg_right: { x: 0,  y: 20, w: 4, h: 12 },
  right_leg_left:  { x: 8,  y: 20, w: 4, h: 12 },
  right_leg_back:  { x: 12, y: 20, w: 4, h: 12 },
  left_leg_front:  { x: 20, y: 52, w: 4, h: 12 },
  left_leg_right:  { x: 16, y: 52, w: 4, h: 12 },
  left_leg_left:   { x: 24, y: 52, w: 4, h: 12 },
  left_leg_back:   { x: 28, y: 52, w: 4, h: 12 },

  // OUTER (second) layer UV regions — these sit on top of the inner layer in
  // the 3D model. Per the standard 64×64 Minecraft skin layout:
  //   jacket  = outer torso       (cols 16-39, rows 32-47)
  //   sleeve  = outer arm         (cols 40-63 right, 48-63 left, rows 32-47/48-63)
  //   pants   = outer leg         (cols 0-15 right, 0-15 left, rows 32-47/48-63)
  jacket_front:        { x: 20, y: 36, w: 8, h: 12 },
  jacket_back:         { x: 32, y: 36, w: 8, h: 12 },
  jacket_right:        { x: 16, y: 36, w: 4, h: 12 },
  jacket_left:         { x: 28, y: 36, w: 4, h: 12 },
  right_sleeve_front:  { x: 44, y: 36, w: 4, h: 12 },
  right_sleeve_right:  { x: 40, y: 36, w: 4, h: 12 },
  right_sleeve_left:   { x: 48, y: 36, w: 4, h: 12 },
  right_sleeve_back:   { x: 52, y: 36, w: 4, h: 12 },
  left_sleeve_front:   { x: 52, y: 52, w: 4, h: 12 },
  left_sleeve_right:   { x: 48, y: 52, w: 4, h: 12 },
  left_sleeve_left:    { x: 56, y: 52, w: 4, h: 12 },
  left_sleeve_back:    { x: 60, y: 52, w: 4, h: 12 },
  right_pants_front:   { x: 4,  y: 36, w: 4, h: 12 },
  right_pants_right:   { x: 0,  y: 36, w: 4, h: 12 },
  right_pants_left:    { x: 8,  y: 36, w: 4, h: 12 },
  right_pants_back:    { x: 12, y: 36, w: 4, h: 12 },
  left_pants_front:    { x: 4,  y: 52, w: 4, h: 12 },
  left_pants_right:    { x: 0,  y: 52, w: 4, h: 12 },
  left_pants_left:     { x: 8,  y: 52, w: 4, h: 12 },
  left_pants_back:     { x: 12, y: 52, w: 4, h: 12 },
}

function parseHex(hex: string): RGB | null {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) return null
  return [parseInt(m[1]!.slice(0, 2), 16), parseInt(m[1]!.slice(2, 4), 16), parseInt(m[1]!.slice(4, 6), 16)]
}

function writePixel(buf: Buffer, x: number, y: number, rgb: RGB) {
  const idx = (y * W + x) * C
  buf[idx] = rgb[0]
  buf[idx + 1] = rgb[1]
  buf[idx + 2] = rgb[2]
  buf[idx + 3] = 255
}

function blitRegion(buf: Buffer, region: Region, src: Buffer) {
  for (let row = 0; row < region.h; row++) {
    for (let col = 0; col < region.w; col++) {
      const sIdx = (row * region.w + col) * 4
      if (src[sIdx + 3] === 0) continue
      writePixel(buf, region.x + col, region.y + row, [src[sIdx]!, src[sIdx + 1]!, src[sIdx + 2]!])
    }
  }
}

/** Fill an entire region with a solid color (no transparency). Used as the
 *  inner-layer safety net so the body cuboid is never transparent. */
function fillRegion(buf: Buffer, region: Region, rgb: RGB) {
  for (let row = 0; row < region.h; row++) {
    for (let col = 0; col < region.w; col++) {
      writePixel(buf, region.x + col, region.y + row, rgb)
    }
  }
}

function paintHexGrid(
  buf: Buffer,
  region: Region,
  grid: string[][],
  palette: ReturnType<typeof precomputePalette>,
  threshold: number
) {
  if (palette.length === 0) return
  for (let row = 0; row < region.h && row < grid.length; row++) {
    const gridRow = grid[row]!
    for (let col = 0; col < region.w && col < gridRow.length; col++) {
      const hex = gridRow[col]
      if (!hex || hex === '') continue
      const rgb = parseHex(hex)
      if (!rgb) continue
      const snapped = softSnapPrecomputed(rgb, palette, threshold)
      writePixel(buf, region.x + col, region.y + row, snapped)
    }
  }
}

export async function buildSkinPngV2(intent: SkinIntent, pixels: SkinPixels): Promise<Buffer> {
  const buf = Buffer.alloc(W * H * C, 0)
  const paletteRgb: RGB[] = intent.palette
    .map(parseHex)
    .filter((p): p is RGB => p !== null)
  const palette = precomputePalette(paletteRgb)
  const threshold = intent.palette_mode === 'hard' ? 0 : DEFAULT_SNAP_THRESHOLD

  // Defaults for character colors the Director may omit:
  // - hair_accent_color: same as hair_color (no streak/tip variation)
  // - ear_color: same as hair_color (ears match hair)
  // - inner_ear_color: static pink accent
  // - mouth_color: dark brown (works against most skin tones)
  // - nose_shadow: medium brown (one notch darker than typical skin)
  const hair_accent_color = intent.character.hair_accent_color ?? intent.character.hair_color
  const ear_color = intent.character.ear_color ?? intent.character.hair_color
  const inner_ear_color = intent.character.inner_ear_color ?? '#FFB8CC'
  const mouth_color = intent.character.mouth_color ?? '#5C3A2E'
  const nose_shadow = intent.character.nose_shadow ?? '#A07050'

  // 1. Face → head_front (template if face_template set, else parametric stack)
  const face = composeFace({
    skin_tone: intent.character.skin_tone,
    face_template: intent.character.face_template,
    eye_shape: intent.character.eye_shape,
    eye_color: intent.character.eye_color,
    eye_white: intent.character.eye_white,
    brows: intent.character.brows,
    mouth: intent.character.mouth,
    mouth_color,
    nose: intent.character.nose,
    nose_shadow,
    hair_color: intent.character.hair_color,
    hair_accent_color,
    hair_style: intent.character.hair_style,
  })
  blitRegion(buf, R.head_front!, face)

  // 2. Parametric hair → head + hat regions
  const hair = composeHair({
    hair_style: intent.character.hair_style,
    hair_length: intent.character.hair_length,
    hair_color: intent.character.hair_color,
    hair_accent_color,
    skin_tone: intent.character.skin_tone,
  })
  blitRegion(buf, R.head_top!, hair.head_top)
  blitRegion(buf, R.head_right!, hair.head_right)
  blitRegion(buf, R.head_left!, hair.head_left)
  blitRegion(buf, R.head_back!, hair.head_back)
  blitRegion(buf, R.head_bottom!, hair.head_bottom)
  blitRegion(buf, R.hat_front!, hair.hat_front)
  blitRegion(buf, R.hat_top!, hair.hat_top)
  blitRegion(buf, R.hat_right!, hair.hat_right)
  blitRegion(buf, R.hat_left!, hair.hat_left)
  blitRegion(buf, R.hat_back!, hair.hat_back)

  // 3. Ears overlay
  const earOut = composeEars({
    ear_template: intent.character.ear_template,
    ear_color,
    inner_ear_color,
    skin_tone: intent.character.skin_tone,
  })
  blitRegion(buf, R.hat_top!, earOut.hat_top)
  blitRegion(buf, R.hat_right!, earOut.hat_right)
  blitRegion(buf, R.hat_left!, earOut.hat_left)
  if (earOut.head_right_cutout) blitRegion(buf, R.head_right!, earOut.head_right_cutout)
  if (earOut.head_left_cutout) blitRegion(buf, R.head_left!, earOut.head_left_cutout)

  // 4. Body regions with palette snap + L/R mirror.
  //    Each inner region gets a SAFETY FILL of skin_tone first so it's never
  //    transparent even if the Artist returned empty/missing pixels. The
  //    Artist's pixels then paint over the fill where present.
  const skinRgb = parseHex(intent.character.skin_tone) ?? [196, 149, 106]
  fillRegion(buf, R.torso_front!, skinRgb)
  fillRegion(buf, R.torso_back!, skinRgb)
  fillRegion(buf, R.torso_right!, skinRgb)
  fillRegion(buf, R.torso_left!, skinRgb)
  for (const armRegion of ['right_arm_front', 'right_arm_back', 'right_arm_right', 'right_arm_left', 'left_arm_front', 'left_arm_back', 'left_arm_right', 'left_arm_left'] as const) {
    fillRegion(buf, R[armRegion]!, skinRgb)
  }
  for (const legRegion of ['right_leg_front', 'right_leg_back', 'right_leg_right', 'right_leg_left', 'left_leg_front', 'left_leg_back', 'left_leg_right', 'left_leg_left'] as const) {
    fillRegion(buf, R[legRegion]!, skinRgb)
  }

  paintHexGrid(buf, R.torso_front!, pixels.torso_front, palette, threshold)
  paintHexGrid(buf, R.torso_back!, pixels.torso_back, palette, threshold)
  paintHexGrid(buf, R.torso_right!, pixels.torso_side, palette, threshold)
  paintHexGrid(buf, R.torso_left!, mirrorHorizontal(pixels.torso_side), palette, threshold)

  paintHexGrid(buf, R.right_arm_front!, pixels.arm_front, palette, threshold)
  paintHexGrid(buf, R.left_arm_front!, mirrorHorizontal(pixels.arm_front), palette, threshold)
  paintHexGrid(buf, R.right_arm_right!, pixels.arm_side, palette, threshold)
  paintHexGrid(buf, R.right_arm_left!, mirrorHorizontal(pixels.arm_side), palette, threshold)  // inner face of right arm
  paintHexGrid(buf, R.left_arm_left!, mirrorHorizontal(pixels.arm_side), palette, threshold)
  paintHexGrid(buf, R.left_arm_right!, pixels.arm_side, palette, threshold)                    // inner face of left arm
  paintHexGrid(buf, R.right_arm_back!, pixels.arm_back, palette, threshold)
  paintHexGrid(buf, R.left_arm_back!, mirrorHorizontal(pixels.arm_back), palette, threshold)

  paintHexGrid(buf, R.right_leg_front!, pixels.leg_front, palette, threshold)
  paintHexGrid(buf, R.left_leg_front!, mirrorHorizontal(pixels.leg_front), palette, threshold)
  paintHexGrid(buf, R.right_leg_right!, pixels.leg_side, palette, threshold)
  paintHexGrid(buf, R.right_leg_left!, mirrorHorizontal(pixels.leg_side), palette, threshold)  // inner face of right leg
  paintHexGrid(buf, R.left_leg_left!, mirrorHorizontal(pixels.leg_side), palette, threshold)
  paintHexGrid(buf, R.left_leg_right!, pixels.leg_side, palette, threshold)                    // inner face of left leg
  paintHexGrid(buf, R.right_leg_back!, pixels.leg_back, palette, threshold)
  paintHexGrid(buf, R.left_leg_back!, mirrorHorizontal(pixels.leg_back), palette, threshold)

  // 5. Optional outer layers — paint onto the SECOND-layer UV regions (rows 32-63),
  //    NOT onto the inner torso/arm/leg.
  //    The 3D model renders these as a slightly-larger second skin over the inner body.
  if (pixels.jacket_front) paintHexGrid(buf, R.jacket_front!, pixels.jacket_front, palette, threshold)
  if (pixels.jacket_back) paintHexGrid(buf, R.jacket_back!, pixels.jacket_back, palette, threshold)
  if (pixels.jacket_side) {
    paintHexGrid(buf, R.jacket_right!, pixels.jacket_side, palette, threshold)
    paintHexGrid(buf, R.jacket_left!, mirrorHorizontal(pixels.jacket_side), palette, threshold)
  }
  if (pixels.sleeve_front) {
    paintHexGrid(buf, R.right_sleeve_front!, pixels.sleeve_front, palette, threshold)
    paintHexGrid(buf, R.left_sleeve_front!, mirrorHorizontal(pixels.sleeve_front), palette, threshold)
    // Also paint the OTHER sides of the sleeve cuboid for solid coverage; mirror as needed.
    paintHexGrid(buf, R.right_sleeve_right!, pixels.sleeve_front, palette, threshold)
    paintHexGrid(buf, R.right_sleeve_left!, mirrorHorizontal(pixels.sleeve_front), palette, threshold)
    paintHexGrid(buf, R.right_sleeve_back!, pixels.sleeve_front, palette, threshold)
    paintHexGrid(buf, R.left_sleeve_right!, mirrorHorizontal(pixels.sleeve_front), palette, threshold)
    paintHexGrid(buf, R.left_sleeve_left!, pixels.sleeve_front, palette, threshold)
    paintHexGrid(buf, R.left_sleeve_back!, mirrorHorizontal(pixels.sleeve_front), palette, threshold)
  }
  if (pixels.pants_outer_front) {
    paintHexGrid(buf, R.right_pants_front!, pixels.pants_outer_front, palette, threshold)
    paintHexGrid(buf, R.left_pants_front!, mirrorHorizontal(pixels.pants_outer_front), palette, threshold)
    paintHexGrid(buf, R.right_pants_right!, pixels.pants_outer_front, palette, threshold)
    paintHexGrid(buf, R.right_pants_left!, mirrorHorizontal(pixels.pants_outer_front), palette, threshold)
    paintHexGrid(buf, R.right_pants_back!, pixels.pants_outer_front, palette, threshold)
    paintHexGrid(buf, R.left_pants_right!, mirrorHorizontal(pixels.pants_outer_front), palette, threshold)
    paintHexGrid(buf, R.left_pants_left!, pixels.pants_outer_front, palette, threshold)
    paintHexGrid(buf, R.left_pants_back!, mirrorHorizontal(pixels.pants_outer_front), palette, threshold)
  }

  return await sharp(buf, { raw: { width: W, height: H, channels: C } }).png().toBuffer()
}

export async function validateSkinV2(buffer: Buffer): Promise<boolean> {
  const m = await sharp(buffer).metadata()
  return m.width === W && m.height === H
}
