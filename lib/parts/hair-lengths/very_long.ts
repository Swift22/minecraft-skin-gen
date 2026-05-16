import type { LengthModifier } from './types'

export const very_long: LengthModifier = (b) => {
  const result = {
    ...b,
    hat_back: b.hat_back.map((row) => row.map((c) => c === '.' ? 'H' : c)),
  }

  if (b.hat_right) {
    result.hat_right = b.hat_right.map((row, i) =>
      i >= 4 ? row.map((c, j) => (j === 0 ? 'H' : c)) : row
    )
  }

  if (b.hat_left) {
    result.hat_left = b.hat_left.map((row, i) =>
      i >= 4 ? row.map((c, j) => (j === 7 ? 'H' : c)) : row
    )
  }

  return result
}
