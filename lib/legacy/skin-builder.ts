import sharp from 'sharp'
import { SKIN_REGIONS, type SkinRegion } from './skin-regions'
import type { RegionColorMap, RegionColorEntry, FaceFeatures } from './region-color-map'
import { type Px, selectFaceTemplate } from './face-templates'
import { selectEarTemplate } from './ear-templates'

const SKIN_WIDTH = 64
const SKIN_HEIGHT = 64
const CHANNELS = 4 // RGBA

// ─── Color utilities ──────────────────────────────────────────────────────────

function parseHex(hex: string | undefined): [number, number, number] | null {
  if (!hex) return null
  const match = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!match || !match[1]) return null
  const hex6 = match[1]
  return [
    parseInt(hex6.slice(0, 2), 16),
    parseInt(hex6.slice(2, 4), 16),
    parseInt(hex6.slice(4, 6), 16),
  ]
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const c = Math.max(0, Math.min(1, t))
  return [
    Math.round(a[0] + (b[0] - a[0]) * c),
    Math.round(a[1] + (b[1] - a[1]) * c),
    Math.round(a[2] + (b[2] - a[2]) * c),
  ]
}

function pixelNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 58.3) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

function jitterColor(
  color: [number, number, number],
  x: number,
  y: number,
  jitter: number
): [number, number, number] {
  return [
    Math.max(0, Math.min(255, color[0] + Math.round(pixelNoise(x, y, 0) * jitter))),
    Math.max(0, Math.min(255, color[1] + Math.round(pixelNoise(x, y, 1) * jitter))),
    Math.max(0, Math.min(255, color[2] + Math.round(pixelNoise(x, y, 2) * jitter))),
  ]
}

function writePixel(
  buffer: Buffer,
  px: number,
  py: number,
  r: number,
  g: number,
  b: number,
  alpha: number = 255
): void {
  const offset = (py * SKIN_WIDTH + px) * CHANNELS
  buffer[offset] = r
  buffer[offset + 1] = g
  buffer[offset + 2] = b
  buffer[offset + 3] = alpha
}

// ─── Region fill methods ──────────────────────────────────────────────────────

function hasPixelGrid(entry: RegionColorEntry): boolean {
  return !!(entry.pixels && entry.pixels.length > 0 && entry.pixels[0] && entry.pixels[0].length > 0)
}

function fillRegionPixels(buffer: Buffer, region: SkinRegion, pixels: string[][]): void {
  for (let row = 0; row < Math.min(region.height, pixels.length); row++) {
    const pixelRow = pixels[row]
    if (!pixelRow) continue
    for (let col = 0; col < Math.min(region.width, pixelRow.length); col++) {
      const hex = pixelRow[col]
      if (!hex || hex === '') continue
      const rgb = parseHex(hex)
      if (!rgb) continue
      writePixel(buffer, region.x + col, region.y + row, rgb[0], rgb[1], rgb[2])
    }
  }
}

export function fillRegion(
  buffer: Buffer,
  region: SkinRegion,
  base: string,
  highlight?: string,
  shadow?: string
): void {
  const baseRgb = parseHex(base)
  if (!baseRgb) return
  const highlightRgb = parseHex(highlight) ?? baseRgb
  const shadowRgb = parseHex(shadow) ?? baseRgb

  for (let row = 0; row < region.height; row++) {
    let rowColor: [number, number, number]
    if (region.height <= 1) {
      rowColor = baseRgb
    } else {
      const t = row / (region.height - 1)
      rowColor = t <= 0.5
        ? lerpColor(highlightRgb, baseRgb, t * 2)
        : lerpColor(baseRgb, shadowRgb, (t - 0.5) * 2)
    }
    for (let col = 0; col < region.width; col++) {
      const rgb = jitterColor(rowColor, region.x + col, region.y + row, 3)
      writePixel(buffer, region.x + col, region.y + row, rgb[0], rgb[1], rgb[2])
    }
  }
}

function smartFillRegion(buffer: Buffer, region: SkinRegion, entry: RegionColorEntry): void {
  if (hasPixelGrid(entry)) {
    fillRegionPixels(buffer, region, entry.pixels!)
  } else {
    fillRegion(buffer, region, entry.base, entry.highlight, entry.shadow)
  }
}

// ─── FIXED HEAD TEMPLATES ─────────────────────────────────────────────────────
// Side/back/hat templates remain here. head_front uses the face-template system.
// H=hair, h=hair_light, S=skin, W=eye_white, E=eye_color, M=mouth, N=nose, .=transparent

/**
 * hat_front: Hair volume overlay with transparent holes for face/eyes.
 * Renders on top of head_front — makes hair look fuller and longer.
 */
const HAT_FRONT_TEMPLATE: Px[][] = [
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 0: transparent
  ['.', '.', 'H', 'H', 'H', 'H', '.', '.'], // row 1: hair top
  ['.', 'H', 'H', 'h', 'h', 'H', 'H', '.'], // row 2: hair
  ['.', 'h', 'H', 'h', 'h', 'H', 'h', '.'], // row 3: hair
  ['H', 'h', '.', 'h', 'h', '.', 'h', 'H'], // row 4: hair sides, transparent eye cols
  ['H', '.', '.', '.', '.', '.', '.', 'H'], // row 5: transparent face window
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 6: transparent
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 7: transparent
]

/**
 * head_right: Hair covers rows 0-4, skin at bottom-right corner (rows 5-7).
 */
const HEAD_RIGHT_TEMPLATE: Px[][] = [
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'],
  ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
  ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'S', 'S', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'S', 'S', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'S', 'S'],
]

/**
 * head_left: Mirror of head_right — skin at bottom-left corner.
 */
const HEAD_LEFT_TEMPLATE: Px[][] = [
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'],
  ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
  ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
  ['H', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
  ['S', 'S', 'H', 'H', 'H', 'H', 'H', 'H'],
]

/**
 * hat_right: Sparse hair volume on right side.
 */
const HAT_RIGHT_TEMPLATE: Px[][] = [
  ['H', 'H', '.', '.', '.', '.', '.', '.'],
  ['H', 'H', '.', '.', '.', '.', '.', '.'],
  ['H', '.', '.', '.', '.', '.', '.', '.'],
  ['H', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]

/**
 * hat_left: Sparse hair volume on left side (mirror).
 */
const HAT_LEFT_TEMPLATE: Px[][] = [
  ['.', '.', '.', '.', '.', '.', 'H', 'H'],
  ['.', '.', '.', '.', '.', '.', 'H', 'H'],
  ['.', '.', '.', '.', '.', '.', '.', 'H'],
  ['.', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', '.'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['.', '.', '.', '.', '.', '.', '.', 'H'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]

/**
 * hat_top: Sparse hair-ring overlay on the outer head top.
 * Renders as a border frame — center transparent so the inner concentric gradient shows through.
 * Adds perceived hair volume and depth when viewed from above.
 */
const HAT_TOP_TEMPLATE: Px[][] = [
  ['.', 'H', 'H', 'H', 'H', 'H', 'H', '.'], // top edge hair border
  ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
  ['.', 'H', 'H', 'H', 'H', 'H', 'H', '.'], // bottom edge hair border
]

/**
 * hat_back: Hair edge volume on back.
 */
const HAT_BACK_TEMPLATE: Px[][] = [
  ['H', 'H', '.', '.', '.', '.', 'H', 'H'],
  ['H', 'H', '.', '.', '.', '.', 'H', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['H', '.', '.', '.', '.', '.', '.', 'H'],
  ['.', 'H', '.', '.', '.', '.', 'H', '.'],
]

// ─── Template painting ────────────────────────────────────────────────────────

interface HeadColors {
  hair: [number, number, number]
  hairLight: [number, number, number]
  skin: [number, number, number]
  eyeWhite: [number, number, number]
  eyeColor: [number, number, number]
  mouthColor: [number, number, number]
  noseShadow: [number, number, number]
  innerEar: [number, number, number]
  earColor: [number, number, number]
  hairShades: [number, number, number][]  // 5 levels: lightest [0] → darkest [4]
  hasHairAccent: boolean                  // true when hair_accent_color was set
}

function resolveHeadColors(
  hairBase: string,
  hairHighlight: string | undefined,
  hairShadow: string | undefined,
  skinBase: string,
  face: FaceFeatures
): HeadColors {
  const hair = parseHex(hairBase) ?? [59, 37, 7]
  const hairLight = parseHex(face.hair_accent_color)
    ?? parseHex(hairHighlight)
    ?? lerpColor(hair, [255, 255, 255], 0.2)
  const skin = parseHex(skinBase) ?? [196, 149, 106]
  const eyeWhite = parseHex(face.eye_white) ?? [255, 255, 255]
  const eyeColor = parseHex(face.eye_color) ?? [60, 40, 20]
  const mouthColor = parseHex(face.mouth_color) ?? lerpColor(skin, [0, 0, 0], 0.25)
  const noseShadow = parseHex(face.nose_shadow) ?? lerpColor(skin, [0, 0, 0], 0.15)
  const innerEar = parseHex(face.inner_ear_color) ?? lerpColor(skin, [255, 200, 210], 0.35)
  const earColor = parseHex(face.ear_color) ?? hair
  const hasHairAccent = !!face.hair_accent_color

  // 5-level hair shade palette (always from base hair, independent of accent)
  const hl = parseHex(hairHighlight) ?? lerpColor(hair, [255, 255, 255], 0.15)
  const sh = parseHex(hairShadow) ?? lerpColor(hair, [0, 0, 0], 0.2)
  const hairShades: [number, number, number][] = [
    hl,                           // 0: center/lightest
    lerpColor(hl, hair, 0.6),     // 1: light-mid
    hair,                         // 2: base/mid
    lerpColor(hair, sh, 0.6),     // 3: dark-mid
    sh,                           // 4: edge/darkest
  ]

  return { hair, hairLight, skin, eyeWhite, eyeColor, mouthColor, noseShadow, innerEar, earColor, hairShades, hasHairAccent }
}

function computeShadesFromBase(base: [number, number, number]): [number, number, number][] {
  return [
    lerpColor(base, [255, 255, 255], 0.15),
    lerpColor(base, [255, 255, 255], 0.05),
    base,
    lerpColor(base, [0, 0, 0], 0.15),
    lerpColor(base, [0, 0, 0], 0.25),
  ]
}

function concentricShade(
  col: number, row: number,
  width: number, height: number,
  shades: [number, number, number][],
  shiftLighter: number = 0
): [number, number, number] {
  const cx = Math.abs(col - (width - 1) / 2) / ((width - 1) / 2)
  const cy = Math.abs(row - (height - 1) / 2) / ((height - 1) / 2)
  const dist = Math.max(cx, cy)

  const levels = shades.length
  const rawIdx = dist * (levels - 1)
  let idx = Math.floor(rawIdx) + shiftLighter
  idx = Math.max(0, Math.min(levels - 1, idx))
  const frac = rawIdx - Math.floor(rawIdx)

  // Checkerboard dithering at shade boundaries
  const checker = (col + row) % 2 === 0
  const fallback = shades[0]!
  if (frac > 0.3 && idx < levels - 1 && checker) {
    return shades[idx + 1] ?? fallback
  }
  return shades[idx] ?? fallback
}

function fillConcentricGradient(
  buffer: Buffer,
  region: SkinRegion,
  shades: [number, number, number][],
  jitter: number = 2
): void {
  for (let row = 0; row < region.height; row++) {
    for (let col = 0; col < region.width; col++) {
      const shade = concentricShade(col, row, region.width, region.height, shades)
      const rgb = jitterColor(shade, region.x + col, region.y + row, jitter)
      writePixel(buffer, region.x + col, region.y + row, rgb[0], rgb[1], rgb[2])
    }
  }
}

function paintTemplate(
  buffer: Buffer,
  region: SkinRegion,
  template: Px[][],
  colors: HeadColors,
  jitter: number = 2,
  shadeHair: boolean = false
): void {
  for (let row = 0; row < Math.min(region.height, template.length); row++) {
    const templateRow = template[row]
    if (!templateRow) continue
    for (let col = 0; col < Math.min(region.width, templateRow.length); col++) {
      const px = templateRow[col]
      if (!px || px === '.') continue // transparent — skip

      let rgb: [number, number, number]

      if (shadeHair && px === 'H' && colors.hairShades.length > 0) {
        rgb = concentricShade(col, row, region.width, region.height, colors.hairShades, 0)
      } else if (shadeHair && px === 'h' && !colors.hasHairAccent && colors.hairShades.length > 0) {
        rgb = concentricShade(col, row, region.width, region.height, colors.hairShades, -1)
      } else {
        switch (px) {
          case 'H': rgb = colors.hair; break
          case 'h': rgb = colors.hairLight; break
          case 'S': rgb = colors.skin; break
          case 'W': rgb = colors.eyeWhite; break
          case 'E': rgb = colors.eyeColor; break
          case 'M': rgb = colors.mouthColor; break
          case 'N': rgb = colors.noseShadow; break
          case 'I': rgb = colors.innerEar; break
          default: continue
        }
      }

      rgb = jitterColor(rgb, region.x + col, region.y + row, jitter)
      writePixel(buffer, region.x + col, region.y + row, rgb[0], rgb[1], rgb[2])
    }
  }
}

// ─── Regions handled by fixed templates (never AI-generated) ──────────────────
// Inner head regions: ALWAYS fixed templates (face structure is constant).
// Hat regions: use AI pixel grids if provided (for ears, stars, accessories),
// otherwise fall back to default hair volume templates.

const FIXED_TEMPLATE_REGIONS = new Set([
  'head_front', 'head_right', 'head_left', 'head_back',
  'head_top', 'head_bottom',
])

const HAT_REGIONS = new Set([
  'hat_front', 'hat_right', 'hat_left', 'hat_back', 'hat_top', 'hat_bottom',
])

// ─── Main builder ─────────────────────────────────────────────────────────────

export async function buildSkinPng(colorMap: RegionColorMap): Promise<Buffer> {
  const rawBuffer = Buffer.alloc(SKIN_WIDTH * SKIN_HEIGHT * CHANNELS, 0)

  const { face: faceFeatures, ...regions } = colorMap
  const regionEntries = regions as Record<string, RegionColorEntry | undefined>

  // Resolve head/hair colors
  const hairBase = regionEntries['head_top']?.base ?? '#3B2507'
  const hairHighlight = regionEntries['head_top']?.highlight
  const hairShadow = regionEntries['head_top']?.shadow
  const skinBase = regionEntries['head_front']?.base ?? '#C4956A'
  const headColors = resolveHeadColors(hairBase, hairHighlight, hairShadow, skinBase, faceFeatures)

  // Phase 1: Fill all BODY regions (skip head and hat — handled separately)
  for (const region of SKIN_REGIONS) {
    if (FIXED_TEMPLATE_REGIONS.has(region.name)) continue
    if (HAT_REGIONS.has(region.name)) continue

    const entry = regionEntries[region.name]
    if (!entry) continue

    smartFillRegion(rawBuffer, region, entry)
  }

  // Phase 2: Paint fixed head templates (inner layer)
  const findRegion = (name: string) => SKIN_REGIONS.find((r) => r.name === name)!

  // head_top: concentric gradient (bright center, dark edges)
  fillConcentricGradient(rawBuffer, findRegion('head_top'), headColors.hairShades)

  // head_bottom: concentric gradient
  fillConcentricGradient(rawBuffer, findRegion('head_bottom'), headColors.hairShades)

  // head_front: select face template from faceFeatures.face_template (0–15)
  const chosenTemplate = selectFaceTemplate(faceFeatures.face_template)
  paintTemplate(rawBuffer, findRegion('head_front'), chosenTemplate.front, headColors, 2, true)

  // head_right: fixed side template with shade-modulated hair
  paintTemplate(rawBuffer, findRegion('head_right'), HEAD_RIGHT_TEMPLATE, headColors, 2, true)

  // head_left: fixed side template (mirrored) with shade-modulated hair
  paintTemplate(rawBuffer, findRegion('head_left'), HEAD_LEFT_TEMPLATE, headColors, 2, true)

  // head_back: concentric gradient (bright center, dark edges)
  fillConcentricGradient(rawBuffer, findRegion('head_back'), headColors.hairShades)

  // Phase 3: Hat overlay — use AI pixel grids for accessories (ears, stars, etc.)
  // If AI didn't provide pixel grids, fall back to default hair volume templates.
  const defaultHatTemplates: Record<string, Px[][]> = {
    hat_top: HAT_TOP_TEMPLATE,
    hat_front: HAT_FRONT_TEMPLATE,
    hat_right: HAT_RIGHT_TEMPLATE,
    hat_left: HAT_LEFT_TEMPLATE,
    hat_back: HAT_BACK_TEMPLATE,
  }

  const earTemplate = selectEarTemplate(faceFeatures.ear_template)
  // Ear templates use earColor for H pixels (allows dark ears on light hair)
  const earShades = computeShadesFromBase(headColors.earColor)
  const earColors: HeadColors = earTemplate
    ? { ...headColors, hair: headColors.earColor, hairShades: earShades }
    : headColors

  for (const hatName of HAT_REGIONS) {
    const hatRegion = findRegion(hatName)
    const hatEntry = regionEntries[hatName]

    const earLayer = earTemplate?.regions[hatName as keyof typeof earTemplate.regions]
    if (earLayer) {
      // Render ear geometry using earColor for H pixels with shade modulation
      paintTemplate(rawBuffer, hatRegion, earLayer, earColors, 2, true)
      // Composite: overlay AI pixels on top (for stars, decorations alongside ears)
      if (hatEntry && hasPixelGrid(hatEntry)) {
        fillRegionPixels(rawBuffer, hatRegion, hatEntry.pixels!)
      }
    } else if (hatEntry && hasPixelGrid(hatEntry)) {
      // AI provided detailed pixel art — use it (for stars, decorations, etc.)
      fillRegionPixels(rawBuffer, hatRegion, hatEntry.pixels!)
    } else if (defaultHatTemplates[hatName]) {
      // Fall back to default hair volume template with shade modulation
      paintTemplate(rawBuffer, hatRegion, defaultHatTemplates[hatName], headColors, 2, true)
    }
    // hat_top / hat_bottom: left transparent if no pixels or template provided
  }

  const pngBuffer = await sharp(rawBuffer, {
    raw: { width: SKIN_WIDTH, height: SKIN_HEIGHT, channels: CHANNELS },
  })
    .png()
    .toBuffer()

  return pngBuffer
}

export async function validateSkin(buffer: Buffer): Promise<boolean> {
  const metadata = await sharp(buffer).metadata()
  return metadata.width === SKIN_WIDTH && metadata.height === SKIN_HEIGHT
}
