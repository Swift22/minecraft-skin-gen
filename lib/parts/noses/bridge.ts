import type { PartMask } from '../types'

// Bridge nose: vertical line down center face — defined bridge.
export const bridge: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', 'N', '.', '.', '.'], // row 4 — top of bridge
  ['.', '.', '.', '.', 'N', '.', '.', '.'], // row 5 — bottom of bridge / nostril
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
]
