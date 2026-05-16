import { z } from 'zod'

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex color required')

export const eyeShapeEnum = z.enum(['round','almond','wide','close_set','sleepy','dot','square','mono'])
export const browShapeEnum = z.enum(['none','flat','angled_up','angled_down','bushy'])
export const mouthShapeEnum = z.enum(['none','smile','wide_smile','frown','open','smirk'])
export const noseShapeEnum = z.enum(['none','bridge','dot','wide'])
export const hairStyleEnum = z.enum(['classic','bangs','side_part','mohawk','fluffy','curtain','bald','bun','ponytail','spiky','undercut','dreads'])
export const hairLengthEnum = z.enum(['short','medium','long','very_long'])
export const earTemplateEnum = z.enum(['none','round','pointy','cat','fox','bunny','wolf','elf'])
export const styleEnum = z.enum(['retro','cyberpunk','fantasy','modern','arcade','medieval','futuristic','horror'])

export const characterSchema = z.object({
  skin_tone: hex,
  eye_shape: eyeShapeEnum,
  eye_color: hex,
  eye_white: hex.default('#F0EFEB'),
  brows: browShapeEnum.default('flat'),
  mouth: mouthShapeEnum.default('smile'),
  mouth_color: hex.optional(),
  nose: noseShapeEnum.default('dot'),
  nose_shadow: hex.optional(),
  hair_style: hairStyleEnum,
  hair_length: hairLengthEnum.default('medium'),
  hair_color: hex,
  hair_accent_color: hex.optional(),
  ear_template: earTemplateEnum.default('none'),
  ear_color: hex.optional(),
  inner_ear_color: hex.optional(),
})

export const outfitSchema = z.object({
  torso: z.string().min(1),
  arms: z.string().min(1),
  legs: z.string().min(1),
  jacket: z.string().optional(),
  sleeves: z.string().optional(),
  pants_outer: z.string().optional(),
  accessories: z.string().optional(),
})

export const refinementEventSchema = z.object({
  type: z.enum(['region_reroll','patch','param_edit','manual_paint']),
  at: z.string(),
  description: z.string(),
  affected_regions: z.array(z.string()),
})

export const skinIntentSchema = z.object({
  version: z.literal(1),
  seed: z.number().int().min(0).max(99999),
  style: styleEnum,
  palette: z.array(hex).min(3).max(5),
  palette_mode: z.enum(['soft','hard']).default('soft'),
  character: characterSchema,
  outfit: outfitSchema,
  refinement_history: z.array(refinementEventSchema).default([]),
})
export type SkinIntent = z.infer<typeof skinIntentSchema>

const pixelGrid = z.array(z.array(z.string()))

export const skinPixelsSchema = z.object({
  torso_front: pixelGrid,
  torso_back: pixelGrid,
  torso_side: pixelGrid,
  arm_front: pixelGrid,
  arm_side: pixelGrid,
  arm_back: pixelGrid,
  leg_front: pixelGrid,
  leg_side: pixelGrid,
  leg_back: pixelGrid,
  jacket_front: pixelGrid.optional(),
  jacket_back: pixelGrid.optional(),
  jacket_side: pixelGrid.optional(),
  sleeve_front: pixelGrid.optional(),
  pants_outer_front: pixelGrid.optional(),
})
export type SkinPixels = z.infer<typeof skinPixelsSchema>

export type BodyRegion = keyof SkinPixels
