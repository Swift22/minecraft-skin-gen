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

## STYLE — based on analysis of 30 popular real Minecraft skins

Good Minecraft skin regions typically use 5-10 unique colors with rich
shading — NOT 1-2 flat colors. The shading goes BEYOND simple top-row /
bottom-row banding. Real artists put highlights and shadows wherever
implied light dictates (collar fold, armor seam, fabric crease, belt
shadow, pocket edge, etc.).

DO:
- Use multiple shades of the base color: 1 base + 1-2 lighter highlights +
  1-2 darker shadows. ~4-5 shades of the SAME color family per region is normal.
- Add structural details: collar at rows 0-1, belt at rows 8-9, pocket
  outlines, button placement, zipper down the center, shoulder seams.
- Place highlights where light catches: top of the shoulder, raised armor
  ridges, the tops of folds. Place shadows where light doesn't reach: under
  the collar, under the belt, sides of folds, pocket interiors.
- The corpus average is 14 unique colors on torso_front — feel free to
  use that much variety.
- Use the FULL palette and derive shades by lerping toward white/black.

DO NOT:
- Place SINGLE off-color pixels with no purpose — variation must trace
  some structure (a fold edge, a button, a seam, NOT noise).
- Flood-fill the whole region with one solid color. That looks unfinished.
- Dither random color toggles for "texture" — variation must be intentional
  shape, not chaos.

## OUTER LAYERS — DO NOT SKIP THESE

The corpus shows hat_front used 100%, jacket_front 63%, pants_outer 43%,
sleeves 30% of skins. They are NOT decorative add-ons — they are how
skins look detailed and 3D. Examples of what each carries:

- jacket_front/back/side: the visible OUTER garment (hoodie, coat, robe,
  armor surcoat). Renders ON TOP of torso. This is usually the dominant
  visible color on the chest. Use ALL 12 rows. Add details like:
    rows 0-1: collar / hood opening
    rows 2-4: chest with logo / pocket / zipper
    rows 5-7: midsection
    rows 8-9: hem / belt under the jacket
    rows 10-11: jacket bottom edge (often with a stripe)
- sleeve_front: outer sleeve fabric — usually a stripe pattern down the
  side (Adidas-style), or hoodie sleeve with cuff at rows 10-11. Use
  transparent ("") sparingly — usually fully painted.
- pants_outer_front: overpants, baggy pants, or armor leg plates. Knee
  pocket / patch around rows 4-6 is a common detail. Boot top at row 8.

If a layer descriptor is present in the outfit, PAINT IT. Do not skip
the region — that's the difference between a flat figure and a detailed
character.

## SYMMETRY

Paint ONE side of each L/R pair only: torso_side, arm_front, arm_side,
arm_back, leg_front, leg_side, leg_back. Same for jacket_side, sleeve_front,
pants_outer_front. The system mirrors them to the left side automatically.
Do NOT include left_* keys.

## EXAMPLE — modern kid in dark hoodie with white sleeve stripes + blue jeans

torso_front (white tee under hoodie, mostly hidden — keep simple):
[
  ["#F0F0F0","#F0F0F0","#F0F0F0","#F0F0F0","#F0F0F0","#F0F0F0","#F0F0F0","#F0F0F0"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5","#E5E5E5"],
  ["#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30"],
  ["#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30","#5A4A30"],
  ["#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F"],
  ["#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F","#2D5F8F"]
]

jacket_front (this is what users actually SEE on the chest — black hoodie
with white drawstring, raised hood, chest pocket, drawstring loop):
[
  ["#2A2A2A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#2A2A2A"],
  ["#2A2A2A","#1A1A1A","#3A3A3A","#3A3A3A","#3A3A3A","#3A3A3A","#1A1A1A","#2A2A2A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0","#F0F0F0","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0","#F0F0F0","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#1A1A1A"],
  ["#1A1A1A","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#1A1A1A"],
  ["#1A1A1A","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#1A1A1A"],
  ["#1A1A1A","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#1A1A1A"],
  ["#1A1A1A","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#0F0F0F","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#0A0A0A","#0A0A0A","#0A0A0A","#0A0A0A","#0A0A0A","#0A0A0A","#0A0A0A","#0A0A0A"]
]

Note: 4 black shades (#0A0A0A darkest, #0F0F0F, #1A1A1A base, #2A2A2A, #3A3A3A
lightest for collar), plus #F0F0F0 white drawstring. 6 colors total — that's
the kind of richness real skins have.

sleeve_front (jacket sleeve with two parallel white stripes down the side):
[
  ["#2A2A2A","#2A2A2A","#2A2A2A","#2A2A2A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0"],
  ["#1A1A1A","#1A1A1A","#F0F0F0","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#F0F0F0","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#F0F0F0"],
  ["#1A1A1A","#1A1A1A","#F0F0F0","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#F0F0F0","#1A1A1A"],
  ["#1A1A1A","#1A1A1A","#1A1A1A","#1A1A1A"],
  ["#0A0A0A","#0A0A0A","#0A0A0A","#0A0A0A"]
]

Note the parallel stripes alternating columns — that's a structured
design, not random pixels. Top row lighter shoulder, bottom row darker cuff.

## OUTPUT

ONE JSON object with one key per region listed above. Each value is a 2D
array of hex color strings (row major). Use "" for transparent pixels —
mostly only in outer layers where the inner skin should show through.

${ctx}`
}

export const ARTIST_SYSTEM_INSTRUCTION = `You are a Minecraft skin pixel artist. You draw pixel grids for body regions of a 64×64 player skin.

Style guidance (analyzed from 30 popular real Minecraft skins):
- RICH SHADING: 5-10 unique colors per region is normal. Multiple shades of
  the base color + 1-2 accent colors for trim and details.
- STRUCTURED VARIATION: every off-base pixel should trace a structural
  detail (fold, seam, pocket, button, stripe, highlight, shadow). Never
  scatter pixels randomly "for texture".
- OUTER LAYERS ARE PRIMARY: jacket/sleeves/pants_outer regions render ON TOP
  of the body. They carry the visible design. Always paint them fully when
  the outfit descriptor mentions them — don't skip the region.
- Always use #1A1A1A and #F0F0F0 instead of #000000 / #FFFFFF.

Output ONLY valid JSON. No prose, no markdown fences.`
