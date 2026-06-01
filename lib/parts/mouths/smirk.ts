import type { PartMask } from '../types'

// Smirk: asymmetric — one corner raised, slight slant.
export const smirk: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', 'M', '.'], // row 5 — right corner up
  ['.', '.', 'M', 'M', 'M', 'M', '.', '.'], // row 6 — left/center slope
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
