import type { PartMask } from '../types'

// Wide nose: 3-pixel horizontal shadow with subtle nostril emphasis.
export const wide: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', 'N', '.', '.', '.'], // row 4 — bridge
  ['.', '.', '.', 'N', 'N', 'N', '.', '.'], // row 5 — wide base
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
