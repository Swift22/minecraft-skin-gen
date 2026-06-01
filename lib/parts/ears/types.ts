import type { PartMask } from '../types'

export interface EarBundle {
  hat_top: PartMask
  hat_right: PartMask
  hat_left: PartMask
  head_right_cutout?: PartMask
  head_left_cutout?: PartMask
}
