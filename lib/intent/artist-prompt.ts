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

## STYLE — analyzed from 88 popular real namemc skins

### How real Minecraft skin artists structure layers

EVERY region should have RICH SHADING (4-6 shades of the base color +
accent details). The corpus average is 14 unique colors on torso_front,
not 1-3. Flat single-color regions look unfinished.

INNER LAYER (torso, arms, legs): the body itself.
  - Fully opaque (NEVER use "" — these are the underlying skin)
  - Rich shading with 4-8 colors: base + lighter row 0 + darker row 11 +
    structural details (collar, waistband, shoe top)
  - If a jacket will cover most of this, still paint it richly — when
    the jacket has transparent V-neck/sleeves the inner shows through

OUTER LAYER (jacket, sleeves, pants_outer): the visible over-garment.
  - Renders on TOP of the inner layer in 3D
  - Use 8-15 unique colors with multi-shade gradients (see exemplars)
  - INTENTIONAL transparency is allowed for natural shaping: V-neck,
    open jacket front, bare arms between sleeve cuff and glove.
  - But where pixels ARE painted, they must be detailed and shaded.
    A fully-painted outer region with only one flat color is wrong —
    that's no better than the inner layer alone.

### Shading patterns from the corpus

Real artists use 4-6 SHADES of the same hue per region for proper 3D
depth — not a single flat color. Examples of shade families in real skins:

  Dark gray (hoodie / tech jacket):
    #0F0F0F (deepest shadow) → #171717 → #1A1A1A → #1F1F1F → #242424
    → #292929 → #2E2E2E → #353535 → #3E3745 (highlight)
  Beige (robe / cloak):
    #B59F8F → #D0B7A4 → #E7CCB6 → #F3D6C0 → #FDE0C8 → #FAFAFB
  Gold / yellow (cuff / armor accent):
    #F1AF20 → #F3C93C → #FCBC53 → #F2B75B → #FFC560 → #FFCA6F → #FFCF7D
  Blue (jacket / armor):
    #496488 → #5989A6 → #6DA0B0

Use the OUTFIT palette colors as your bases and derive 3-5 shades of
each (lerp toward white for highlights, toward #1A1A1A for shadows).

## REAL EXEMPLAR PIXEL GRIDS (extracted from namemc top skins)

### Exemplar A — Hoodie jacket_front (13 colors, drawstring + pocket)
This is a complete jacket_front from a popular grey hoodie skin. Notice:
- Multiple dark gray shades for depth (#27242E, #2E2B36, #35333D, #382E3C, #3E3745, #463B4A, #54525C)
- WHITE drawstring pixels in row 2 + 7 (the strings hanging down)
- Pocket area in rows 7-9 (slightly different shade)
- Transparent "" pixels at the V-neck and shoulder edges
[
  ["","#736A71","#7E6C76","","","#7E6C76","#736A71",""],
  ["","#382E3C","#27242E","","","#27242E","#382E3C",""],
  ["","#382E3C","","#FCF6E6","","","#382E3C",""],
  ["","","#27242E","","","#27242E","",""],
  ["#D6C8C7","","","#35333D","#D6C8C7","","","#D6C8C7"],
  ["","#D6C8C7","","","","","#D6C8C7",""],
  ["","","","","","","",""],
  ["","","#54525C","#DED4D3","#54525C","#54525C","",""],
  ["","","","","#2E2B36","#27232E","",""],
  ["","#35333D","","#35333D","","","#3E3745",""],
  ["","#35333D","#35333D","","#3E3745","#463B4A","#35333D",""],
  ["","#35333D","","#35333D","#35333D","","#35333D",""]
]

### Exemplar B — Golden sleeve_front (6 shades of yellow with gradient)
A tapered golden sleeve, shoulder cap at row 2-3, full sleeve in the middle,
cuff fade at bottom:
[
  ["","","",""],
  ["","","",""],
  ["#FCBC53","","",""],
  ["#FFC560","#FCBC53","#F3BC62","#FFC560"],
  ["#FFCA6F","#FFC560","#FFC560","#FFC560"],
  ["#FFC560","#FFCF7D","#FFC560","#FFC560"],
  ["#FFC560","#FFC560","#FFC560","#FFC560"],
  ["#FFC560","#FFC560","#FFC560","#FFC560"],
  ["#FFC560","#FFC560","#FFC560","#FFC560"],
  ["#FCBC53","#FCBC53","#F3BC62","#F2B75B"],
  ["","","",""],
  ["","","",""]
]

### Exemplar C — Dark armor pants_outer_front (8 shades with metallic highlights)
Dark metallic leg armor that becomes a boot with a light highlight at the toe:
[
  ["","","",""],
  ["","#1F1F1F","",""],
  ["","#242424","#1F1F1F",""],
  ["#242424","#292929","#242424",""],
  ["#292929","#2E2E2E","",""],
  ["","#2E2E2E","",""],
  ["","","#242424",""],
  ["#1F1F1F","#242424","#1F1F1F",""],
  ["#171717","#1F1F1F","",""],
  ["#171717","#1F1F1F","#171717",""],
  ["#0F0F0F","#171717","#0F0F0F",""],
  ["#0F0F0F","#BEBEBE","#BEBEBE","#B1B1B1"]
]

### Exemplar D — Torso base under a jacket (simple black, small chest emblem)
The torso is mostly hidden under the jacket. Just a black base + a small
colored emblem (3-4 pixel sigil/badge centered on the chest, rows 4-6):
[
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0","#F0F0F0","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#CC2829","#CC2829","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#305E39","#305E39","#CC2829","#313F61","#313F61","#313F61","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#305E39","#DBB433","#DBB433","#313F61","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#DBB433","#1A1A1A","#1A1A1A","#DBB433","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"]
]

## SYMMETRY

Paint ONE side of each L/R pair only: torso_side, arm_front, arm_side,
arm_back, leg_front, leg_side, leg_back. Same for jacket_side,
sleeve_front, pants_outer_front. The system mirrors them to the left
side automatically. Do NOT include left_* keys.

## OUTPUT

ONE JSON object with one key per region listed above. Each value is a 2D
array of hex color strings (row major). Use "" for transparent pixels —
in outer layers this is correct (lets inner show through). In inner
layers (torso/arms/legs) DO NOT use "" — those must be fully opaque.

${ctx}`
}

export const ARTIST_SYSTEM_INSTRUCTION = `You are a Minecraft skin pixel artist. You draw pixel grids for body regions of a 64×64 player skin.

Style guidance (analyzed from 88 popular real namemc skins):
- RICH SHADING IN EVERY REGION: 4-6 shades of each base color (lerp toward
  white for highlights, toward #1A1A1A for shadows). The corpus average is
  14 unique colors on torso_front. A flat single-color region looks unfinished.
- STRUCTURED VARIATION: every off-base pixel traces a real garment feature
  (fold, seam, pocket, button, stripe, drawstring, zipper, armor segment,
  emblem, trim, belt). Never scatter pixels randomly.
- INNER vs OUTER: inner torso/arms/legs are fully opaque (NEVER use "").
  Outer jacket/sleeves/pants MAY use "" for natural shaping (V-neck, open
  jacket, exposed arm between cuff and glove). But where the outer layer
  IS painted, it must be richly shaded — not flat.
- Use #1A1A1A and #F0F0F0 instead of #000000 / #FFFFFF.

Output ONLY valid JSON. No prose, no markdown fences.`
