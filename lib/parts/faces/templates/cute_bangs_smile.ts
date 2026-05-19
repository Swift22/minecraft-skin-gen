import type { FaceTemplate } from '../types'

// Cute girl with heavy bangs covering rows 0-2 completely. Tiny face visible
// only in rows 3-7. Smile + 2-row eyes with hair-shaded outline.
// Based on namemc reference patterns (rows 0-2 solid hair, face squeezed below).
export const cute_bangs_smile: FaceTemplate = [
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'h', 'h', 'h', 'h', 'h', 'h', 'H'],
  ['H', 'h', 'S', 'S', 'S', 'S', 'h', 'H'],
  ['H', 'S', 'W', 'E', 'E', 'W', 'S', 'H'],
  ['H', 'S', 'W', 'E', 'E', 'W', 'S', 'H'],
  ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'],
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
]
