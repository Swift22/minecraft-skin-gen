import { z } from 'zod'

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex color required')

export const eyeShapeEnum = z.enum(['round','almond','wide','close_set','sleepy','dot','square','mono'])
export const browShapeEnum = z.enum(['none','flat','angled_up','angled_down','bushy'])
export const mouthShapeEnum = z.enum(['none','smile','wide_smile','frown','open','smirk'])
export const noseShapeEnum = z.enum(['none','bridge','dot','wide'])
export const hairStyleEnum = z.enum(['classic','bangs','side_part','mohawk','fluffy','curtain','bald','bun','ponytail','spiky','undercut','dreads','long_flowing','twin_tails','horned','antennae','frog_hood'])
export const hairLengthEnum = z.enum(['short','medium','long','very_long'])
export const earTemplateEnum = z.enum(['none','round','pointy','cat','fox','bunny','wolf','elf'])
export const styleEnum = z.enum(['retro','cyberpunk','fantasy','modern','arcade','medieval','futuristic','horror'])
export const faceTemplateEnum = z.enum([
  'classic_hero','bangs_smile','side_part','wide_face_nose','dot_eyes','mohawk',
  'fluffy_hair','long_front_hair','round_face_smile','frown_serious','no_hair_bald',
  'close_set_eyes','wide_spaced_eyes','nose_and_mouth','sleepy_halfopen','feminine_round',
  'anime_big_eyes','bearded_old','hooded_face','robot_visor','skull_skeleton',
  'mask_ninja','chubby_kid','scarred_warrior','glasses_nerd','smug_evil',
  'cute_bangs_smile','cute_bangs_dot','cute_bangs_blush','frog_face',
])

export const characterSchema = z.object({
  skin_tone: hex,
  // face_template: when set, used as a cohesive full-face design.
  // When null/omitted, falls back to parametric composition.
  face_template: faceTemplateEnum.nullish(),
  eye_shape: eyeShapeEnum,
  eye_color: hex,
  eye_white: hex.default('#F0EFEB'),
  brows: browShapeEnum.default('flat'),
  mouth: mouthShapeEnum.default('smile'),
  mouth_color: hex.nullish(),
  nose: noseShapeEnum.default('dot'),
  nose_shadow: hex.nullish(),
  hair_style: hairStyleEnum,
  hair_length: hairLengthEnum.default('medium'),
  hair_color: hex,
  hair_accent_color: hex.nullish(),
  ear_template: earTemplateEnum.default('none'),
  ear_color: hex.nullish(),
  inner_ear_color: hex.nullish(),
})

export const outfitSchema = z.object({
  torso: z.string().min(1),
  arms: z.string().min(1),
  legs: z.string().min(1),
  jacket: z.string().nullish(),
  sleeves: z.string().nullish(),
  pants_outer: z.string().nullish(),
  accessories: z.string().nullish(),
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
