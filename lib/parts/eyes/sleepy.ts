import type { PartMask } from '../types'

// Sleepy / half-open: only bottom row visible. Heavy upper lid implied.
export const sleepy: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 3 — empty (lid down)
  ['.', 'E', 'E', '.', '.', 'E', 'E', '.'], // row 4 — narrow slit
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
