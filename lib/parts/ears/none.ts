// Plan A — none: no ears, all regions fully transparent
import type { EarBundle } from './types'
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

export const none: EarBundle = {
  hat_top: EMPTY,
  hat_right: EMPTY,
  hat_left: EMPTY,
}
