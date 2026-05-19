// Deep pixel analysis of a reference skin.
// Dumps every region, counts unique colors, classifies shading patterns,
// detects asymmetry, lists structural detail clusters.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const HASH = process.argv[2]
if (!HASH) { console.error('usage: node deep-analyze.mjs <hash>'); process.exit(1) }
const file = path.join(import.meta.dirname, 'namemc-skins', `${HASH}.png`)

// All standard 64×64 regions
const REGIONS = {
  // head inner
  head_top:    { x: 8,  y: 0,  w: 8, h: 8 },
  head_bottom: { x: 16, y: 0,  w: 8, h: 8 },
  head_right:  { x: 0,  y: 8,  w: 8, h: 8 },
  head_front:  { x: 8,  y: 8,  w: 8, h: 8 },
  head_left:   { x: 16, y: 8,  w: 8, h: 8 },
  head_back:   { x: 24, y: 8,  w: 8, h: 8 },
  // hat outer
  hat_top:     { x: 40, y: 0,  w: 8, h: 8 },
  hat_bottom:  { x: 48, y: 0,  w: 8, h: 8 },
  hat_right:   { x: 32, y: 8,  w: 8, h: 8 },
  hat_front:   { x: 40, y: 8,  w: 8, h: 8 },
  hat_left:    { x: 48, y: 8,  w: 8, h: 8 },
  hat_back:    { x: 56, y: 8,  w: 8, h: 8 },
  // torso inner
  torso_front: { x: 20, y: 20, w: 8, h: 12 },
  torso_right: { x: 16, y: 20, w: 4, h: 12 },
  torso_left:  { x: 28, y: 20, w: 4, h: 12 },
  torso_back:  { x: 32, y: 20, w: 8, h: 12 },
  // right arm inner
  r_arm_front: { x: 44, y: 20, w: 4, h: 12 },
  r_arm_right: { x: 40, y: 20, w: 4, h: 12 },
  r_arm_left:  { x: 48, y: 20, w: 4, h: 12 },
  r_arm_back:  { x: 52, y: 20, w: 4, h: 12 },
  // right leg inner
  r_leg_front: { x: 4,  y: 20, w: 4, h: 12 },
  r_leg_right: { x: 0,  y: 20, w: 4, h: 12 },
  r_leg_left:  { x: 8,  y: 20, w: 4, h: 12 },
  r_leg_back:  { x: 12, y: 20, w: 4, h: 12 },
  // torso outer (jacket)
  jacket_front: { x: 20, y: 36, w: 8, h: 12 },
  jacket_right: { x: 16, y: 36, w: 4, h: 12 },
  jacket_left:  { x: 28, y: 36, w: 4, h: 12 },
  jacket_back:  { x: 32, y: 36, w: 8, h: 12 },
  // right arm outer (sleeve)
  r_sleeve_front: { x: 44, y: 36, w: 4, h: 12 },
  r_sleeve_right: { x: 40, y: 36, w: 4, h: 12 },
  r_sleeve_left:  { x: 48, y: 36, w: 4, h: 12 },
  r_sleeve_back:  { x: 52, y: 36, w: 4, h: 12 },
  // right leg outer (pants)
  r_pants_front:  { x: 4,  y: 36, w: 4, h: 12 },
  r_pants_right:  { x: 0,  y: 36, w: 4, h: 12 },
  r_pants_left:   { x: 8,  y: 36, w: 4, h: 12 },
  r_pants_back:   { x: 12, y: 36, w: 4, h: 12 },
}

function toHex(r, g, b, a) {
  if (a === 0) return ''
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function rgb(hex) {
  if (!hex) return null
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function lum(c) { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] }

function extract(data, info, region) {
  const grid = []
  for (let row = 0; row < region.h; row++) {
    const cells = []
    for (let col = 0; col < region.w; col++) {
      const i = ((region.y + row) * info.width + (region.x + col)) * info.channels
      const a = info.channels === 4 ? data[i + 3] : 255
      cells.push(toHex(data[i], data[i + 1], data[i + 2], a))
    }
    grid.push(cells)
  }
  return grid
}

function statsForGrid(grid) {
  const colors = new Map()  // hex -> count
  let filled = 0
  for (const row of grid) for (const c of row) {
    if (c === '') continue
    filled++
    colors.set(c, (colors.get(c) ?? 0) + 1)
  }
  // Sort by frequency desc
  const sorted = [...colors.entries()].sort((a, b) => b[1] - a[1])
  // Identify color "families" — group by similar luminance
  const family = sorted.map(([hex, n]) => ({ hex, n, lum: lum(rgb(hex)) }))
  family.sort((a, b) => b.lum - a.lum)  // lightest first
  return { filled, total: grid.length * grid[0].length, unique: sorted.length, byFreq: sorted, byLum: family }
}

// Detect symmetry between two grids (e.g. hat_right vs hat_left after horizontal mirror)
function symmetryScore(a, b) {
  if (!a.length || !b.length || a[0].length !== b[0].length || a.length !== b.length) return 0
  let same = 0, total = 0
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      const bc = b[r][a[r].length - 1 - c]  // horizontal mirror
      if (a[r][c] === bc) same++
      total++
    }
  }
  return same / total
}

const buf = await readFile(file)
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })

console.log(`\n========================================`)
console.log(`DEEP ANALYSIS — ${HASH}`)
console.log(`========================================\n`)

const grids = {}
for (const [name, region] of Object.entries(REGIONS)) {
  grids[name] = extract(data, info, region)
}

// Overall palette: union of unique colors
const allColors = new Set()
for (const g of Object.values(grids)) for (const row of g) for (const c of row) if (c) allColors.add(c)
const palette = [...allColors].map((c) => ({ c, l: lum(rgb(c)) })).sort((a, b) => b.l - a.l)

console.log(`OVERALL PALETTE (${palette.length} unique colors, lightest→darkest):`)
for (const p of palette) console.log(`  ${p.c}  L=${p.l.toFixed(0)}`)
console.log()

// Per-region stats
console.log(`PER-REGION:`)
for (const [name, grid] of Object.entries(grids)) {
  const s = statsForGrid(grid)
  if (s.filled === 0) {
    console.log(`  ${name.padEnd(15)} EMPTY`)
    continue
  }
  const top3 = s.byFreq.slice(0, 3).map(([c, n]) => `${c}×${n}`).join(' ')
  console.log(`  ${name.padEnd(15)} ${s.filled}/${s.total}px, ${s.unique} colors, top: ${top3}`)
}
console.log()

// Asymmetry detection
console.log(`SYMMETRY (1.0 = perfectly mirrored, lower = asymmetric):`)
const pairs = [
  ['hat_right', 'hat_left'],
  ['head_right', 'head_left'],
  ['torso_right', 'torso_left'],
  ['r_arm_front', 'r_arm_front'],  // sanity
]
for (const [a, b] of pairs) {
  const score = symmetryScore(grids[a], grids[b]).toFixed(2)
  console.log(`  ${a} vs mirror(${b}): ${score}`)
}
console.log()

// Hair "drama" — how much of hat_back/right/left/top is painted
const hatRegions = ['hat_top', 'hat_back', 'hat_right', 'hat_left', 'hat_front']
console.log(`HAT-LAYER COVERAGE (% of total cells filled):`)
for (const r of hatRegions) {
  const s = statsForGrid(grids[r])
  console.log(`  ${r.padEnd(12)} ${((s.filled / s.total) * 100).toFixed(0)}%`)
}
console.log()

// Print each filled region as a pixel art ascii (just to eyeball)
console.log(`PIXEL ART (each region, '.' = transparent):`)
for (const name of ['hat_front', 'head_front', 'hat_back', 'hat_right', 'hat_left', 'jacket_front', 'r_sleeve_front', 'r_pants_front']) {
  const g = grids[name]
  const s = statsForGrid(g)
  if (s.filled === 0) continue
  // Build a color→letter index
  const ix = new Map()
  let next = 0
  for (const [c] of s.byFreq) ix.set(c, String.fromCharCode(65 + (next++ % 26)))
  console.log(`\n  ${name}:`)
  for (const row of g) {
    process.stdout.write('    ')
    for (const c of row) process.stdout.write(c === '' ? '.' : ix.get(c))
    process.stdout.write('\n')
  }
  console.log(`    legend: ${[...ix.entries()].map(([c, l]) => `${l}=${c}`).join(' ')}`)
}
