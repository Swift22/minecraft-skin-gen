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

Draw like a good Minecraft skin: BOLD FLAT COLOR BLOCKS with CLEAN TRIM LINES.

Do NOT:
- Scatter random single-pixel variations across a region (no "stippling" / "speckling" /
  "noise"). That makes the skin look like dithered static.
- Dither between two close palette colors pixel-by-pixel to fake gradients.
- Place single off-color pixels in the middle of a solid block "for texture".

DO:
- Use the same color across a whole row or whole region where possible.
- Group color changes into clean lines: a 1-pixel-tall belt stripe across row 8,
  a 2-pixel-wide vertical zipper down the chest, a horizontal collar at rows 0-1.
- Make trim lines run STRAIGHT (full row or full column of the same color, not jagged).
- Pick ONE base color for each region and decorate with 1-2 clean accents.

Example good torso_front (knight in blue with gold trim and dark belt):
[
  ["#2A5099","#2A5099","#2A5099","#2A5099","#2A5099","#2A5099","#2A5099","#2A5099"],
  ["#2A5099","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#2A5099"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#D4AA55","#D4AA55","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73"],
  ["#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428"],
  ["#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428","#1A1428"],
  ["#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73"],
  ["#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73","#1C3D73"]
]
Notice: shoulder cap row (lighter), main body (mid blue), straight vertical gold trim in
the middle, full dark belt rows, lower garment back to mid blue. Zero noise pixels.

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
- Each region uses 1 base color + 1-2 clean accents. NOT a random scatter of palette colors.
- No stippling, no dithering, no single-pixel "texture" variations.
- Never use #000000 or #FFFFFF — use #1A1A1A and #F0F0F0.

Output ONLY valid JSON. No prose, no markdown fences.`
