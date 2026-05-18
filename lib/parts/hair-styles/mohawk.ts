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

// Mohawk: center strip only, shaved sides, spike extends into hat layer
export const mohawk: HairStyleBundle = {
  // Strip peeking down the front forehead at row 0
  head_front_overlay: [
    ['.', '.', '.', 'H', 'H', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],

  // Top of head: cols 3-4 are hair, all others are skin (shaved)
  head_top: [
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
  ],

  // Right side: strip visible from the right at cols 6-7 (inner edge of strip), rows 0-2
  head_right: [
    ['S', 'S', 'S', 'S', 'S', 'S', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],

  // Left side: mirror of right
  head_left: [
    ['H', 'H', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['H', 'H', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['H', 'H', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],

  // Back: strip cols 3-4, rows 0-5
  head_back: [
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'H', 'H', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],

  // Bottom: all skin
  head_bottom: [
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],

  // Hat top: the spike — cols 3-4 extended upward with accent highlights
  hat_top: [
    ['.', '.', '.', 'H', 'H', '.', '.', '.'],
    ['.', '.', '.', 'H', 'H', '.', '.', '.'],
    ['.', '.', '.', 'h', 'h', '.', '.', '.'],
    ['.', '.', '.', 'h', 'h', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],

  hat_front: EMPTY,
  hat_right: EMPTY,
  hat_left: EMPTY,
  hat_back: EMPTY,
}
