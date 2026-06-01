import type { HairStyleBundle } from './types'

// Frog/animal hood style — modeled directly on the f2b8ea9653543e19 reference.
// The hat layer wraps around the head like a hood, with two "eye bumps" on
// top (frog's eyes peeking up). Use this for prompts mentioning frog hoodie,
// animal hoodie, alien hood, etc.
//
// Coverage matches corpus: hat_back ~38%, hat_front ~47%, hat_sides ~18%.
export const frog_hood: HairStyleBundle = {
  // Frog hood paints rows 0-4 of head_front with hood color (skipping the
  // face area) — this matches the f2b8ea9653543e19 reference where the hood
  // is built INTO the inner head layer, not just the outer hat layer. The
  // face shows only on rows 5-7. Composer renders head_front_overlay AFTER
  // face_template so 'H' wins over the template's bangs/face pixels here.
  head_front_overlay: [
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['h', 'H', 'h', 'h', 'h', 'h', 'H', 'h'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  // Top of head is also hood color
  head_top: [
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'],
  ],
  // Sides of head: top half is hood, bottom half is skin (showing face)
  head_right: [
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'h', 'h', 'h', 'H', 'h'],
    ['H', 'S', 'S', 'S', 'S', 'S', 'S', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],
  head_left: [
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'h', 'h', 'h', 'H', 'h'],
    ['H', 'S', 'S', 'S', 'S', 'S', 'S', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],
  // Back of head: entirely hood color
  head_back: [
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['h', 'H', 'h', 'H', 'H', 'h', 'H', 'h'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'],
  ],
  head_bottom: [
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
  ],
  // Hood front: hood outline frames the face, with frog-cheek bumps in middle.
  // 47% fill matches frog ref.
  hat_front: [
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'h', '.', 'h', 'h', '.', 'h', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', 'H', '.', '.', '.', '.', 'H', '.'],
    ['.', 'H', '.', '.', '.', '.', 'H', '.'],
  ],
  // Frog eye bumps on top corners — top of head pokes through the hood
  // opening, the rest of the hood top is open (transparent).
  hat_top: [
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['h', 'H', '.', '.', '.', '.', 'H', 'h'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  // Hood right side — only the outer column visible (mostly back-wraps).
  hat_right: [
    ['H', 'h', '.', '.', '.', '.', '.', '.'],
    ['H', 'h', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  hat_left: [
    ['.', '.', '.', '.', '.', '.', 'h', 'H'],
    ['.', '.', '.', '.', '.', '.', 'h', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  // Hood back: full outer-column wrap + horizontal hood seam mid-back. ~38% fill.
  hat_back: [
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['.', 'h', '.', '.', '.', '.', 'h', '.'],
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', 'H', '.', '.', '.', '.', 'H', '.'],
  ],
}
