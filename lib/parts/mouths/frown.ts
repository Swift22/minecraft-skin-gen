import type { PartMask } from '../types'

// Frown: corners down, center up — inverse of smile.
export const frown: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', 'M', 'M', 'M', '.', '.'], // row 5 — center top of frown
  ['.', '.', 'M', '.', '.', '.', 'M', '.'], // row 6 — corners drop down
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
