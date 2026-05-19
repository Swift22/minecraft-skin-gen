import type { SkinIntent, BodyRegion, SkinPixels } from './schema'

export function buildArtistPrompt(intent: SkinIntent, regions: BodyRegion[], context?: Partial<SkinPixels>): string {
  const regionList = regions.join(', ')
  const ctx = context && Object.keys(context).length > 0
    ? `\nExisting context pixels (match this style):\n${JSON.stringify(context, null, 2)}`
    : ''
  return `Paint Minecraft skin BODY pixel grids for the regions: ${regionList}

Character intent:
  Style: ${intent.style}
  Palette: [${intent.palette.join(', ')}]
  Outfit:
    torso:  "${intent.outfit.torso}"
    arms:   "${intent.outfit.arms}"
    legs:   "${intent.outfit.legs}"
    ${intent.outfit.jacket ? `jacket: "${intent.outfit.jacket}"` : ''}
    ${intent.outfit.sleeves ? `sleeves: "${intent.outfit.sleeves}"` : ''}
    ${intent.outfit.pants_outer ? `pants_outer: "${intent.outfit.pants_outer}"` : ''}
    ${intent.outfit.accessories ? `accessories: "${intent.outfit.accessories}"` : ''}

Region dimensions (rows × cols):
  torso_front: 12×8       torso_back: 12×8       torso_side: 12×4
  arm_front: 12×4         arm_side: 12×4         arm_back: 12×4
  leg_front: 12×4         leg_side: 12×4         leg_back: 12×4
  jacket_front/back: 12×8  jacket_side: 12×4
  sleeve_front: 12×4      pants_outer_front: 12×4

Layout (rows are 0-indexed top-to-bottom):
  Torso: rows 0-1 collar/shoulder, 2-7 body, 8-9 belt, 10-11 lower garment
  Arm:   row 0 shoulder cap, 1-9 main, 10-11 cuff
  Leg:   rows 0-7 pants, 8-11 boots

## STYLE — CRITICAL

Draw like a good Minecraft skin: BOLD FLAT COLOR BLOCKS with CLEAN TRIM LINES
and SUBTLE EDGE SHADING for 3D depth.

Do NOT:
- Scatter random single-pixel variations across a region (no "stippling" /
  "speckling" / "noise"). That makes the skin look like dithered static.
- Dither between two close palette colors pixel-by-pixel to fake gradients.
- Place single off-color pixels in the middle of a solid block "for texture".

DO:
- Use the same color across full rows or full columns. Group color changes into
  CLEAN HORIZONTAL OR VERTICAL BANDS, not jagged patterns.
- Build trim lines as straight full-width strips: a belt stripe across row 8,
  a vertical zipper down the center, a collar at rows 0-1.
- Pick ONE base color per region + 1-2 clean accents (trim, belt, logo).

## EDGE SHADING — IMPORTANT for 3D depth

Each region looks much better with subtle shading at top + bottom edges:
- Row 0 (top of region): use a LIGHTER shade of the base color (full row).
  Picks up implied light from above. ~15% lighter than base.
- Row 1 (second row): base color.
- Body rows (middle): base color + clean accent stripes/trim.
- Last row (bottom of region): use a DARKER shade of the base color (full row).
  Implied shadow underneath. ~15% darker than base.

This is STILL flat-color (each row is uniform), just with light/mid/dark variation
between rows. NOT stippling — never scatter individual lighter/darker pixels mid-row.

## Example: torso_front for a knight in blue with gold central trim + dark belt

[
  ["#2A5099","#2A5099","#2A5099","#2A5099","#2A5099","#2A5099","#2A5099","#2A5099"],  // row 0: LIGHTER top edge
  ["#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73"],  // row 1: base
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],  // row 2: gold trim center
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73"],
  ["#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428"],  // row 8: dark belt
  ["#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428"],  // row 9: belt
  ["#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73"],  // row 10: lower base
  ["#102852","#102852","#102852","#102852","#102852","#102852","#102852","#102852"]   // row 11: DARKER bottom edge
]
Notice the LIGHTER row 0 + DARKER row 11 framing the region. Every row is uniform —
no scattered off-color pixels. Trim runs straight down the center as a clean band.

## SYMMETRY

ONLY paint torso_side, arm_front, arm_side, arm_back, leg_front, leg_side, leg_back.
The system mirrors them to the left side automatically — do NOT include left_* keys.

## OUTPUT

ONE JSON object with one key per region listed above. Each value is a 2D array of hex
color strings (row major). Use "" for transparent pixels (only in outer/optional layers).

${ctx}`
}

export const ARTIST_SYSTEM_INSTRUCTION = `You are a Minecraft skin pixel artist. You draw pixel grids for body regions of a 64×64 player skin.

Style rules (these matter more than the prompt — break them and the output looks bad):
- BOLD FLAT COLOR BLOCKS, not pixel noise.
- CLEAN HORIZONTAL OR VERTICAL TRIM LINES (full rows / full columns of one color).
- SUBTLE EDGE SHADING: lighter shade on the top row, darker shade on the bottom row,
  base color in the middle. This is per-row uniform — NOT mid-row scatter.
- Each region uses 1 base color + 1 lighter + 1 darker + 1-2 trim accents.
  No random pixel scatter.
- Never use #000000 or #FFFFFF — use #1A1A1A and #F0F0F0.

Output ONLY valid JSON. No prose, no markdown fences.`
