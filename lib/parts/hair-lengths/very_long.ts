import type { LengthModifier } from './types'

// "very_long" extends hair columns ALL the way to row 7 (full height of hat_back).
// Like `long`, empty columns are preserved so flowing-hair gaps remain visible.
// Also adds side tufts at the bottom of hat_right and hat_left for the cheek-side
// hair fall.
export const very_long: LengthModifier = (b) => {
  const rows = b.hat_back.length
  const cols = b.hat_back[0]?.length ?? 0
  const back = b.hat_back.map((row) => [...row])
  for (let c = 0; c < cols; c++) {
    let topShade: 'H' | 'h' | null = null
    for (let r = 0; r < rows; r++) {
      const cell = back[r]![c]
      if (cell === 'H' || cell === 'h') { topShade = cell; break }
    }
    if (!topShade) continue
    for (let r = 0; r < rows; r++) {
      if (back[r]![c] === '.') back[r]![c] = topShade
    }
  }

  const result = { ...b, hat_back: back }

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
