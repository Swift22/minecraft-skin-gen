import type { PartMask } from '../types'

// Close-set eyes: pulled toward center. 2 rows. Pupils on inner side.
export const close_set: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', 'W', 'W', 'W', 'W', '.', '.'], // row 3 — whites center-set
  ['.', '.', 'W', 'E', 'E', 'W', '.', '.'], // row 4 — pupils inner
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
