import type { LengthModifier } from './types'

export const short: LengthModifier = (b) => ({
  ...b,
  hat_back: b.hat_back.map((row, i) => i >= 4 ? row.map(() => '.' as const) : row),
})
