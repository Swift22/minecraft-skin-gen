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

// Classic short hair: full top/sides/back coverage, sideburn fade on lower rows
export const classic: HairStyleBundle = {
  // Forehead bangs: thin row 1 strip (face occupies rows 2-7 so row 1 is the hairline)
  head_front_overlay: [
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', 'H', 'H', 'H', 'H', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],

  // Top of head: full hair coverage with slight highlight in center
  head_top: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ],

  // Right side: hair rows 0-4, sideburn fade rows 5-7
  head_right: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'S', 'S', 'S', 'S', 'S'],
    ['H', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],

  // Left side: mirror of right
  head_left: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'H', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],

  // Back of head: full hair
  head_back: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ],

  // Bottom: all skin (under jaw)
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

  // Hat layer: no extra volume for classic
  hat_front: EMPTY,
  hat_top: EMPTY,
  hat_right: EMPTY,
  hat_left: EMPTY,
  hat_back: EMPTY,
}
