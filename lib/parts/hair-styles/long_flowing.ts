import type { HairStyleBundle } from './types'

// Long flowing hair past shoulders — heavy hat_back vertical stripes.
// hat_back has every-other-column filled all 8 rows for the "flowing" effect.
export const long_flowing: HairStyleBundle = {
  // Bangs use 3 interleaved shades (H base / h lighter / H base) so each
  // row has hair-strand variation instead of solid blocks — corpus pattern.
  head_front_overlay: [
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'h', 'H', 'H', 'h', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  head_top: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'h', 'h', 'h', 'h', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
  ],
  head_right: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'h', 'H', 'H', 'H', 'H', 'h', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'S', 'S', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'S', 'S', 'S'],
    ['H', 'H', 'H', 'H', 'S', 'S', 'S', 'S'],
  ],
  head_left: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'h', 'h', 'H', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'h', 'H', 'H', 'H', 'H', 'h', 'H'],
    ['H', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'H', 'H', 'H', 'H'],
  ],
  head_back: [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
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
  // Hat_front beefed up to match corpus refs (45-50% fill).
  // Dense bangs rows 1-3 with multi-shade interleave + side tufts down.
  hat_front: [
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'H', 'h', 'H', 'H', 'h', 'H', 'H'],
    ['H', 'h', 'H', 'h', 'h', 'H', 'h', 'H'],
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', 'H', '.', '.', '.', '.', 'H', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  // Hat_top: hair crown visible from top-down view. Corpus refs show 16-33%
  // fill — edge tufts/wisps poking above the head silhouette. Multi-shade.
  hat_top: [
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
    ['h', 'H', '.', '.', '.', '.', 'H', 'h'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['h', 'H', '.', '.', '.', '.', 'H', 'h'],
    ['H', 'h', '.', '.', '.', '.', 'h', 'H'],
  ],
  hat_right: [
    ['H', 'H', '.', '.', '.', '.', '.', '.'],
    ['H', 'H', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['H', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  hat_left: [
    ['.', '.', '.', '.', '.', '.', 'H', 'H'],
    ['.', '.', '.', '.', '.', '.', 'H', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
  // Flowing-hair signature: outer columns + center columns filled, with
  // intentional gaps between strands. Length modifier extends columns down.
  // Reference cute skins hover at 30-45% hat_back fill — not solid blocks.
  // Cols 0, 2, 5, 7 have hair; cols 1, 3, 4, 6 stay empty for the wispy gaps.
  hat_back: [
    ['H', '.', 'H', '.', '.', 'H', '.', 'H'],
    ['H', '.', 'H', '.', '.', 'H', '.', 'H'],
    ['H', '.', 'H', '.', '.', 'H', '.', 'H'],
    ['H', '.', 'H', '.', '.', 'H', '.', 'H'],
    ['H', '.', 'H', '.', '.', 'H', '.', 'H'],
    ['H', '.', 'H', '.', '.', 'H', '.', 'H'],
    ['H', '.', '.', '.', '.', '.', '.', 'H'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
  ],
}
