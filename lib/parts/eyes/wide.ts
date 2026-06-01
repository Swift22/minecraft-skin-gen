import type { PartMask } from '../types'

// Wide-spaced eyes: outer-set, 2 rows. Pupils on outer side.
export const wide: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['W', 'W', '.', '.', '.', '.', 'W', 'W'], // row 3 — whites at outer edges
  ['E', 'W', '.', '.', '.', '.', 'W', 'E'], // row 4 — pupils far outer
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
