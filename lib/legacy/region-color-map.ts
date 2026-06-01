import { z } from 'zod'
import { INNER_REGION_NAMES, OUTER_REGION_NAMES } from './skin-regions'

/** Hex color string validation (e.g. "#8B6914") */
const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color, e.g. "#8B6914"')

/** A pixel value: hex color or empty string for transparent */
const pixelValue = z.string()

/**
 * Color entry for a single skin region.
 * Has a base color for gradient fill, plus an optional per-pixel grid
 * that overrides the gradient when present (for detailed artwork).
 */
const regionColorEntry = z.object({
  /** Base fill color for the region */
  base: hexColor,
  /** Lighter highlight color applied to the top row(s) of the region (optional) */
  highlight: hexColor.optional(),
  /** Darker shadow color applied to the bottom row(s) of the region (optional) */
  shadow: hexColor.optional(),
  /**
   * Optional per-pixel grid: 2D array [row][col] of hex colors.
   * Use "" (empty string) for transparent pixels.
   * When present, overrides gradient fill for this region.
   */
  pixels: z.array(z.array(pixelValue)).optional(),
})

/** Face feature colors for painting eyes, nose, and mouth on head_front */
const faceFeatures = z.object({
  /** Iris / pupil color */
  eye_color: hexColor,
  /** Eye white color (defaults to #FFFFFF if omitted) */
  eye_white: hexColor.optional(),
  /** Mouth / lip color (defaults to a darker skin tone if omitted) */
  mouth_color: hexColor.optional(),
  /** Nose shadow color (defaults to a slightly darker skin tone if omitted) */
  nose_shadow: hexColor.optional(),
  /**
   * Face template index (0–15). Selects the symbolic pixel layout for
   * the 8×8 head_front region. Omit to default to template 0 (classic).
   */
  face_template: z.number().int().min(0).max(15).optional(),
  /** Inner ear accent color (I pixels in ear templates — light pink or near-white) */
  inner_ear_color: hexColor.optional(),
  /** Outer ear color — defaults to hair color. Use for contrasting ears (e.g. black ears on white hair) */
  ear_color: hexColor.optional(),
  /** Secondary hair color for streaks/tips — overrides 'h' (hair light) pixels in all templates */
  hair_accent_color: hexColor.optional(),
  /**
   * Ear template: 0 (or omit) = no ears, use default hair volume
   *               1            = cat_ears
   */
  ear_template: z.number().int().min(0).max(1).optional(),
})

/**
 * Build a Zod object schema from a list of region names.
 * Inner regions are required; outer regions are optional (defaults to transparent).
 */
function buildRegionShape(
  innerNames: string[],
  outerNames: string[]
): z.ZodRawShape {
  const shape: z.ZodRawShape = {}
  for (const name of innerNames) {
    shape[name] = regionColorEntry
  }
  for (const name of outerNames) {
    shape[name] = regionColorEntry.optional()
  }
  return shape
}

/** Zod schema for the full Region Color Map returned by Gemini */
export const regionColorMapSchema = z.object({
  ...buildRegionShape(INNER_REGION_NAMES, OUTER_REGION_NAMES),
  /** Face feature colors for drawing eyes/nose/mouth on head_front */
  face: faceFeatures,
})

/** TypeScript type inferred from the RegionColorMap schema */
export type RegionColorMap = z.infer<typeof regionColorMapSchema>

/** TypeScript type for a single region's color entry */
export type RegionColorEntry = z.infer<typeof regionColorEntry>

/** TypeScript type for face features */
export type FaceFeatures = z.infer<typeof faceFeatures>
