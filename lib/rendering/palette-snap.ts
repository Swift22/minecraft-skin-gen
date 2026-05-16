export type RGB = [number, number, number]
export type Lab = [number, number, number]

const D65 = { X: 95.047, Y: 100.0, Z: 108.883 }

function srgbToLinear(c: number): number {
  const n = c / 255
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
}

function rgbToXyz(rgb: RGB): [number, number, number] {
  const r = srgbToLinear(rgb[0])
  const g = srgbToLinear(rgb[1])
  const b = srgbToLinear(rgb[2])
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
    (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100,
  ]
}

function f(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116
}

export function rgbToLab(rgb: RGB): Lab {
  const [x, y, z] = rgbToXyz(rgb)
  const fx = f(x / D65.X)
  const fy = f(y / D65.Y)
  const fz = f(z / D65.Z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function deltaE76(a: Lab, b: Lab): number {
  const dL = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dL * dL + da * da + db * db)
}

export function nearestPaletteColor(rgb: RGB, palette: RGB[]): [RGB, number] {
  if (palette.length === 0) throw new Error('nearestPaletteColor: palette must be non-empty')
  const labIn = rgbToLab(rgb)
  let best: RGB = palette[0] as RGB
  let bestDist = Infinity
  for (const p of palette) {
    const dist = deltaE76(labIn, rgbToLab(p))
    if (dist < bestDist) {
      best = p
      bestDist = dist
    }
  }
  return [best, bestDist]
}

export function softSnap(rgb: RGB, palette: RGB[], threshold: number): RGB {
  const [nearest, dist] = nearestPaletteColor(rgb, palette)
  return dist < threshold ? rgb : nearest
}

export interface PaletteEntry {
  rgb: RGB
  lab: Lab
}

export function precomputePalette(palette: RGB[]): PaletteEntry[] {
  return palette.map((rgb) => ({ rgb, lab: rgbToLab(rgb) }))
}

export function nearestPaletteColorPrecomputed(rgb: RGB, palette: PaletteEntry[]): [RGB, number] {
  if (palette.length === 0) throw new Error('nearestPaletteColorPrecomputed: palette must be non-empty')
  const labIn = rgbToLab(rgb)
  let best: RGB = (palette[0] as PaletteEntry).rgb
  let bestDist = Infinity
  for (const p of palette) {
    const dist = deltaE76(labIn, p.lab)
    if (dist < bestDist) {
      best = p.rgb
      bestDist = dist
    }
  }
  return [best, bestDist]
}

export function softSnapPrecomputed(rgb: RGB, palette: PaletteEntry[], threshold: number): RGB {
  const [nearest, dist] = nearestPaletteColorPrecomputed(rgb, palette)
  return dist < threshold ? rgb : nearest
}

export const DEFAULT_SNAP_THRESHOLD = 24
