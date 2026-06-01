// Pixel codes for face templates:
// H = hair (dark), h = hair light, S = skin, W = eye white, E = eye color
// M = mouth color, N = nose shadow, . = transparent
export type Px = 'H' | 'h' | 'S' | 'W' | 'E' | 'M' | 'N' | 'I' | '.'

export interface FaceTemplate {
  id: number
  description: string
  front: Px[][]
}

/**
 * 16 diverse face template patterns for the 8×8 head_front region.
 * Selected via face.face_template in the RegionColorMap.
 */
export const FACE_TEMPLATES: FaceTemplate[] = [
  {
    id: 0,
    description: 'classic_hero',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair lighter center
      ['H', 'h', 'h', 'S', 'S', 'S', 'h', 'H'], // row 3: forehead showing
      ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H'], // row 4: narrow face window
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 5: eyes
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 6: eyes (2 rows tall)
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 1,
    description: 'bangs_smile',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 2: full drooping bangs
      ['H', 'H', 'h', 'S', 'S', 'h', 'H', 'H'], // row 3: bangs edge, some skin
      ['H', 'h', 'S', 'S', 'S', 'S', 'h', 'H'], // row 4: forehead
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 5: eyes
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 6: eyes 2nd row
      ['S', 'M', 'S', 'S', 'S', 'S', 'M', 'S'], // row 7: smile corners
    ],
  },
  {
    id: 2,
    description: 'side_part',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['h', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 2: part on far left
      ['S', 'h', 'H', 'h', 'h', 'H', 'H', 'H'], // row 3: face left, hair right
      ['S', 'S', 'h', 'S', 'S', 'H', 'H', 'H'], // row 4: asymmetric face window
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 5: eyes
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 6: eyes 2nd row
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 3,
    description: 'wide_face_nose',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'], // row 2: hair lighter center
      ['H', 'h', 'S', 'S', 'S', 'S', 'h', 'H'], // row 3: wide forehead
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 4: thin 1-row eyes, wide face
      ['S', 'S', 'S', 'N', 'N', 'S', 'S', 'S'], // row 5: nose bridge shadow
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 6: mid face
      ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'], // row 7: center mouth
    ],
  },
  {
    id: 4,
    description: 'dot_eyes',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 3: full forehead
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 4: wide open face
      ['S', 'S', 'E', 'S', 'S', 'E', 'S', 'S'], // row 5: single dot eyes
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 6: face
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 5,
    description: 'mohawk',
    front: [
      ['S', 'S', 'H', 'H', 'H', 'H', 'S', 'S'], // row 0: mohawk center cols only
      ['S', 'S', 'H', 'H', 'H', 'H', 'S', 'S'], // row 1: mohawk
      ['S', 'S', 'H', 'h', 'h', 'H', 'S', 'S'], // row 2: mohawk lighter center
      ['S', 'S', 'h', 'S', 'S', 'h', 'S', 'S'], // row 3: mohawk base meeting skin
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 4: full-width open face
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 5: eyes
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 6: eyes 2nd row
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 6,
    description: 'fluffy_hair',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair top
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'h', 'H', 'H', 'h', 'H', 'H'], // row 2: fluffy texture
      ['h', 'H', 'h', 'S', 'S', 'h', 'H', 'h'], // row 3: wispy edges with face
      ['H', 'h', 'S', 'S', 'S', 'S', 'h', 'H'], // row 4: more face visible
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 5: eyes
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 6: eyes 2nd row
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 7,
    description: 'long_front_hair',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair lighter
      ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H'], // row 3: curtain hair, tiny face
      ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H'], // row 4: curtain continues
      ['H', 'H', 'E', 'S', 'S', 'E', 'H', 'H'], // row 5: eyes peek through curtain
      ['H', 'H', 'E', 'S', 'S', 'E', 'H', 'H'], // row 6: eyes 2nd row, curtain sides
      ['h', 'H', 'S', 'S', 'S', 'S', 'H', 'h'], // row 7: curtain at sides, face center
    ],
  },
  {
    id: 8,
    description: 'round_face_smile',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'h', 'h', 'h', 'h', 'h', 'h', 'H'], // row 2: hair lighter wide
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 3: wide open forehead
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 4: wide open face
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 5: eyes
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 6: eyes 2nd row
      ['M', 'S', 'S', 'S', 'S', 'S', 'S', 'M'], // row 7: wide smile corners
    ],
  },
  {
    id: 9,
    description: 'frown_serious',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair lighter
      ['H', 'H', 'h', 'S', 'S', 'h', 'H', 'H'], // row 3: narrow forehead
      ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H'], // row 4: narrow face window
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 5: eyes
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 6: eyes 2nd row
      ['S', 'S', 'M', 'M', 'M', 'M', 'S', 'S'], // row 7: center frown/neutral mouth
    ],
  },
  {
    id: 10,
    description: 'no_hair_bald',
    front: [
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 0: all skin (bald)
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 1: bald head
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 2: bald head
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 3: forehead
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 4: eyes
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 5: eyes 2nd row
      ['S', 'S', 'S', 'N', 'N', 'S', 'S', 'S'], // row 6: nose shadow
      ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'], // row 7: mouth
    ],
  },
  {
    id: 11,
    description: 'close_set_eyes',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair lighter
      ['H', 'h', 'h', 'S', 'S', 'h', 'h', 'H'], // row 3: forehead
      ['H', 'S', 'W', 'E', 'E', 'W', 'S', 'H'], // row 4: close-set inner-col eyes
      ['H', 'S', 'S', 'N', 'N', 'S', 'S', 'H'], // row 5: nose bridge shadow
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 6: mid face
      ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'], // row 7: center mouth
    ],
  },
  {
    id: 12,
    description: 'wide_spaced_eyes',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair lighter
      ['h', 'H', 'h', 'S', 'S', 'h', 'H', 'h'], // row 3: forehead
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 4: wide open face
      ['W', 'E', 'S', 'S', 'S', 'S', 'E', 'W'], // row 5: wide-spaced outer-col eyes
      ['W', 'E', 'S', 'S', 'S', 'S', 'E', 'W'], // row 6: eyes 2nd row
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 13,
    description: 'nose_and_mouth',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 2: hair lighter
      ['H', 'h', 'h', 'S', 'S', 'h', 'h', 'H'], // row 3: forehead
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 4: thin 1-row eyes
      ['H', 'S', 'S', 'N', 'N', 'S', 'S', 'H'], // row 5: nose shadow center
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 6: mid face
      ['S', 'M', 'S', 'S', 'S', 'S', 'M', 'S'], // row 7: smile corner M pixels
    ],
  },
  {
    id: 14,
    description: 'sleepy_halfopen',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 2: heavy brow hair
      ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'], // row 3: heavy brow lighter
      ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H'], // row 4: small face window
      ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H'], // row 5: still heavy brow sides
      ['H', 'W', 'E', 'S', 'S', 'E', 'W', 'H'], // row 6: only bottom eye row visible
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 7: lower face
    ],
  },
  {
    id: 15,
    description: 'feminine_round',
    front: [
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 0: hair
      ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // row 1: hair
      ['H', 'h', 'h', 'h', 'h', 'h', 'h', 'H'], // row 2: hair lighter wide
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 3: wide open forehead
      ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // row 4: wide open face
      ['S', 'W', 'W', 'E', 'E', 'W', 'W', 'S'], // row 5: extra-wide eye whites
      ['S', 'W', 'E', 'S', 'S', 'E', 'W', 'S'], // row 6: eyes 2nd row (smaller iris)
      ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'], // row 7: small center mouth
    ],
  },
]

/**
 * Returns the face template for the given index.
 * Falls back to template 0 (classic_hero) if index is undefined or out of range.
 */
export function selectFaceTemplate(index: number | undefined): FaceTemplate {
  const fallback = FACE_TEMPLATES[0]!
  if (index === undefined || !Number.isInteger(index) || index < 0 || index > 15) {
    return fallback
  }
  return FACE_TEMPLATES[index] ?? fallback
}
