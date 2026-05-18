/**
 * Symbolic pixel value used in part masks.
 *
 * Letters route to colors in the rendering composers:
 * S = skin_tone, W = eye_white, E = eye_color,
 * M = mouth_color, N = nose_shadow,
 * H = hair_color, h = hair_accent_color,
 * I = inner_ear_color, R = ear_color (outer),
 * . = transparent (do not write)
 */
export type Px = 'S' | 'W' | 'E' | 'M' | 'N' | 'H' | 'h' | 'I' | 'R' | '.'

export type PartMask = Px[][]
