import type { Px } from './face-templates'

/** Optional Px grids for each of the 5 hat regions */
export interface EarTemplateRegions {
  hat_top?: Px[][]
  hat_front?: Px[][]
  hat_right?: Px[][]
  hat_left?: Px[][]
  hat_back?: Px[][]
}

export interface EarTemplate {
  id: number
  description: string
  regions: EarTemplateRegions
}

/**
 * Ear templates for hat regions.
 * H = hair color, I = inner-ear accent, . = transparent
 *
 * Template 0: none — no ear geometry (falls through to default hair volume / AI pixels)
 * Template 1: cat_ears — symmetric raised cat ear spikes at outer corners of the head
 *   Derived from pixel analysis of learn-faces/catears1.png and catears2.png
 */
export const EAR_TEMPLATES: EarTemplate[] = [
  {
    id: 0,
    description: 'none',
    regions: {},
  },
  {
    id: 1,
    description: 'cat_ears',
    regions: {
      hat_top: [
        ['H', 'H', '.', '.', '.', '.', 'H', 'H'],
        ['H', 'H', '.', '.', '.', '.', 'H', 'H'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
        ['.', 'I', '.', '.', '.', '.', 'I', '.'],
      ],
      hat_front: [
        ['.', 'I', '.', '.', '.', '.', 'I', '.'],
        ['I', '.', 'H', 'H', 'H', 'H', '.', 'I'],
        ['.', 'H', 'H', 'H', 'H', 'H', 'H', '.'],
        ['.', 'H', 'H', 'H', 'H', 'H', 'H', '.'],
        ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        ['H', '.', '.', '.', '.', '.', '.', 'H'],
        ['H', '.', '.', '.', '.', '.', '.', 'H'],
        ['.', 'H', '.', '.', '.', '.', 'H', '.'],
      ],
      hat_right: [
        ['H', 'H', '.', '.', '.', '.', '.', '.'],
        ['I', 'H', '.', 'H', 'H', '.', '.', 'I'],
        ['.', '.', '.', 'H', 'H', '.', '.', '.'],
        ['.', '.', '.', 'H', 'H', '.', '.', '.'],
        ['.', '.', '.', 'H', 'H', '.', '.', 'H'],
        ['H', '.', '.', 'H', 'H', '.', '.', 'H'],
        ['H', '.', '.', 'H', 'H', '.', '.', 'H'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
      ],
      hat_left: [
        ['.', '.', '.', '.', '.', '.', 'H', 'H'],
        ['I', '.', '.', 'H', 'H', '.', 'H', 'I'],
        ['.', '.', '.', 'H', 'H', '.', '.', '.'],
        ['.', '.', '.', 'H', 'H', '.', '.', '.'],
        ['H', '.', '.', 'H', 'H', '.', '.', '.'],
        ['H', '.', '.', 'H', 'H', '.', '.', 'H'],
        ['H', '.', '.', 'H', 'H', '.', '.', 'H'],
        ['.', '.', '.', '.', '.', '.', '.', '.'],
      ],
      hat_back: [
        ['H', 'H', '.', '.', '.', '.', 'H', 'H'],
        ['I', '.', 'I', '.', '.', 'I', '.', 'I'],
        ['.', 'H', '.', '.', '.', '.', 'H', '.'],
        ['.', 'H', '.', '.', '.', '.', 'H', '.'],
        ['.', 'H', '.', '.', '.', '.', 'H', '.'],
        ['H', 'H', '.', '.', '.', '.', 'H', 'H'],
        ['H', '.', '.', '.', '.', '.', '.', 'H'],
        ['.', 'H', '.', '.', '.', '.', 'H', '.'],
      ],
    },
  },
]

/**
 * Returns the EarTemplate for the given index, or null if index is 0 / undefined.
 * null means "use default hair volume / AI pixels" (no ear geometry).
 */
export function selectEarTemplate(index: number | undefined): EarTemplate | null {
  if (index === undefined || !Number.isInteger(index) || index <= 0) return null
  return EAR_TEMPLATES[index] ?? null
}
