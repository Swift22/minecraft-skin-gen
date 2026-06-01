import type { FaceTemplate } from '../types'

// Frog/animal hood face. Modeled on the f2b8ea9653543e19 reference: the hood
// color (H/h) fills rows 0-4 of head_front INSIDE the inner head layer
// (not just hat). Face is tiny — only eyes at row 5-6 and mouth row 7.
// Pair with hair_style=frog_hood for full hood coverage on hat layer too.
//
// Symbols:
//   H = hair_color (hood base)
//   h = hair_accent_color (hood highlight)
//   S = skin_tone (skin showing on face)
//   E = eye_color (frog eye)
//   W = eye_white
//   M = mouth_color
export const frog_face: FaceTemplate = [
  ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
  ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
  ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
  ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
  ['H', 'h', 'S', 'S', 'S', 'S', 'h', 'H'],
  ['W', 'E', 'S', 'S', 'S', 'S', 'E', 'W'],
  ['W', 'E', 'S', 'S', 'S', 'S', 'E', 'W'],
  ['S', 'S', 'S', 'M', 'M', 'S', 'S', 'S'],
]
