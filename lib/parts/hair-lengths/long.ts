import type { LengthModifier } from './types'

export const long: LengthModifier = (b) => ({
  ...b,
  hat_back: b.hat_back.map((row) => row.map((c) => c === '.' ? 'H' : c)),
})
