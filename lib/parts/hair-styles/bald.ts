import type { HairStyleBundle } from './types'
import type { PartMask } from '../types'

const EMPTY: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]

export const bald: HairStyleBundle = {
  head_front_overlay: EMPTY,
  head_top: EMPTY,
  head_right: EMPTY,
  head_left: EMPTY,
  head_back: EMPTY,
  head_bottom: EMPTY,
  hat_front: EMPTY,
  hat_top: EMPTY,
  hat_right: EMPTY,
  hat_left: EMPTY,
  hat_back: EMPTY,
}
