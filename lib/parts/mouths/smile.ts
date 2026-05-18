import type { PartMask } from '../types'

// Smile: a curved mouth — 3-wide center row with corners turned up.
export const smile: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', 'M', '.', '.', '.', 'M', '.'], // row 5 — corner highlights
  ['.', '.', '.', 'M', 'M', 'M', '.', '.'], // row 6 — center of smile
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
