import type { PartMask } from '../types'

// Flat brows: row 2, 3-wide horizontal blocks aligned over each eye.
export const flat: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', 'H', 'H', 'H', '.', 'H', 'H', 'H'], // row 2 — over eyes (which sit at cols 1-3 and 5-7)
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
