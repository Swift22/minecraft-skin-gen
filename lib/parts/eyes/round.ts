import type { PartMask } from '../types'

// Round eyes: 2-row 2-col block per eye. Whites on top, pupils on bottom.
// Both pupils on the viewer's-left of each eye (Steve convention).
export const round: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 0
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 1
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 2
  ['.', 'W', 'W', '.', '.', 'W', 'W', '.'], // row 3 — eye whites
  ['.', 'E', 'W', '.', '.', 'E', 'W', '.'], // row 4 — pupils
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 5
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 6
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 7
]
