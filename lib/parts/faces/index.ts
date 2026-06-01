import { createRegistry } from '../registry'
import { classic_hero } from './templates/classic_hero'
import { bangs_smile } from './templates/bangs_smile'
import { side_part } from './templates/side_part'
import { wide_face_nose } from './templates/wide_face_nose'
import { dot_eyes } from './templates/dot_eyes'
import { mohawk } from './templates/mohawk'
import { fluffy_hair } from './templates/fluffy_hair'
import { long_front_hair } from './templates/long_front_hair'
import { round_face_smile } from './templates/round_face_smile'
import { frown_serious } from './templates/frown_serious'
import { no_hair_bald } from './templates/no_hair_bald'
import { close_set_eyes } from './templates/close_set_eyes'
import { wide_spaced_eyes } from './templates/wide_spaced_eyes'
import { nose_and_mouth } from './templates/nose_and_mouth'
import { sleepy_halfopen } from './templates/sleepy_halfopen'
import { feminine_round } from './templates/feminine_round'
import { anime_big_eyes } from './templates/anime_big_eyes'
import { bearded_old } from './templates/bearded_old'
import { hooded_face } from './templates/hooded_face'
import { robot_visor } from './templates/robot_visor'
import { skull_skeleton } from './templates/skull_skeleton'
import { mask_ninja } from './templates/mask_ninja'
import { chubby_kid } from './templates/chubby_kid'
import { scarred_warrior } from './templates/scarred_warrior'
import { glasses_nerd } from './templates/glasses_nerd'
import { smug_evil } from './templates/smug_evil'
import { cute_bangs_smile } from './templates/cute_bangs_smile'
import { cute_bangs_dot } from './templates/cute_bangs_dot'
import { cute_bangs_blush } from './templates/cute_bangs_blush'
import { frog_face } from './templates/frog_face'

export const faceTemplates = createRegistry({
  classic_hero,
  bangs_smile,
  side_part,
  wide_face_nose,
  dot_eyes,
  mohawk,
  fluffy_hair,
  long_front_hair,
  round_face_smile,
  frown_serious,
  no_hair_bald,
  close_set_eyes,
  wide_spaced_eyes,
  nose_and_mouth,
  sleepy_halfopen,
  feminine_round,
  anime_big_eyes,
  bearded_old,
  hooded_face,
  robot_visor,
  skull_skeleton,
  mask_ninja,
  chubby_kid,
  scarred_warrior,
  glasses_nerd,
  smug_evil,
  cute_bangs_smile,
  cute_bangs_dot,
  cute_bangs_blush,
  frog_face,
})

export type FaceTemplateName = ReturnType<typeof faceTemplates.names>[number]
