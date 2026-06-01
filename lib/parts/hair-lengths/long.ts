import type { LengthModifier } from './types'

// "long" extends each existing hair COLUMN downward in hat_back so the hair
// flows past the head — but preserves empty columns. This matches the corpus
// pattern: flowing hair has visible gaps between hair strands, not a solid
// block. Reference cute skins hover around 30-45% hat_back fill, not 100%.
//
// Algorithm: for each column, find the topmost 'H' or 'h'. Fill rows
// [topmost..5] (3/4 of the way down) with the column's hair color.
export const long: LengthModifier = (b) => {
  const rows = b.hat_back.length
  const cols = b.hat_back[0]?.length ?? 0
  const out = b.hat_back.map((row) => [...row])
  for (let c = 0; c < cols; c++) {
    let topShade: 'H' | 'h' | null = null
    for (let r = 0; r < rows; r++) {
      const cell = out[r]![c]
      if (cell === 'H' || cell === 'h') { topShade = cell; break }
    }
    if (!topShade) continue
    const targetBottom = Math.min(5, rows - 1)
    for (let r = 0; r <= targetBottom; r++) {
      if (out[r]![c] === '.') out[r]![c] = topShade
    }
  }
  return { ...b, hat_back: out }
}
