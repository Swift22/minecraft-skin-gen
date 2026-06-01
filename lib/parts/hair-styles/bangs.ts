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

// Bangs: classic base + heavy drooping forehead overlay
export const bangs: HairStyleBundle = {
  // Heavy bangs drooping down the forehead — rows 1-3 with tapering width
  head_front_overlay: [
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', 'H', 'H', 'H', 'H', 'H', 'H', '.'],
    ['.', '.', 'H', 'H', 'H', 'H', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],

  // Top of head: full coverage with highlight
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

  // Back: full hair
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

  // Hat layer: no extra volume
  hat_front: EMPTY,
  hat_top: EMPTY,
  hat_right: EMPTY,
  hat_left: EMPTY,
  hat_back: EMPTY,
}
