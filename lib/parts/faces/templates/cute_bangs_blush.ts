import type { FaceTemplate } from '../types'

// Cute character with bangs + visible cheek blush. The 'N' nose pixels are
// repurposed for blush dots at cheek positions.
export const cute_bangs_blush: FaceTemplate = [
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ['H', 'h', 'h', 'h', 'h', 'h', 'h', 'H'],
  ['H', 'h', 'S', 'S', 'S', 'S', 'h', 'H'],
  ['H', 'S', 'W', 'E', 'E', 'W', 'S', 'H'],
  ['N', 'S', 'W', 'S', 'S', 'W', 'S', 'N'],
  ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'],
  ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
]
