import type { PartMask } from '../types'

// head_front rows 1-2, outer pixels raised (angry look):
// row 1 (idx 0) cols 1 and 6 (1-indexed = idx 0 and 5)
// row 2 (idx 1) cols 2 and 5 (1-indexed = idx 1 and 4)
export const angled_down: PartMask = [
  ['H', '.', '.', '.', '.', 'H', '.', '.'], // row 0 — cols 1 and 6 (outer pixels higher)
  ['.', 'H', '.', '.', 'H', '.', '.', '.'], // row 1 — cols 2 and 5 (inner pixels lower)
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 2
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 3
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 4
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 5
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 6
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 7
]
