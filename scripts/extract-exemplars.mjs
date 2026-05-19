// Extract specific region pixel grids from the top exemplary skins.
// Outputs JSON-formatted 2D color arrays ready to paste into the Artist prompt.
//
// Selection: from the corpus, pick skins that:
//   - Use the jacket_front layer richly (>= 50 non-transparent pixels)
//   - Have 5-12 unique colors on jacket_front (rich but not chaotic)
//   - Have low artificial noise (intentional design, not random)
// Then dump the actual hex grids for jacket_front + sleeve_front + pants_outer_front.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const CORPUS = path.join(import.meta.dirname, 'namemc-skins')

const REGIONS = {
  torso_front:        { x: 20, y: 20, w: 8, h: 12 },
  jacket_front:       { x: 20, y: 36, w: 8, h: 12 },
  right_sleeve_front: { x: 44, y: 36, w: 4, h: 12 },
  right_pants_front:  { x: 4,  y: 36, w: 4, h: 12 },
}

function toHex(r, g, b, a) {
  if (a === 0) return ''
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function extractGrid(data, info, region) {
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

function uniqueColors(grid) {
  const set = new Set()
  for (const row of grid) for (const c of row) if (c !== '') set.add(c)
  return set
}

function nonTransparentCount(grid) {
  let n = 0
  for (const row of grid) for (const c of row) if (c !== '') n++
  return n
}

function noiseScore(grid) {
  let differs = 0, total = 0
  for (let row = 0; row < grid.length; row++) {
    for (let col = 1; col < grid[row].length - 1; col++) {
      const c = grid[row][col]
      if (c === '') continue
      const L = grid[row][col - 1]
      const R = grid[row][col + 1]
      if (L !== c && R !== c) differs++
      total++
    }
  }
  return total === 0 ? 0 : differs / total
}

const files = (await readdir(CORPUS)).filter((f) => f.endsWith('.png')).map((f) => path.join(CORPUS, f))
console.log(`scanning ${files.length} skins...\n`)

const candidates = []
for (const f of files) {
  try {
    const buf = await readFile(f)
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
    if (info.width !== 64 || info.height !== 64) continue
    const jacket = extractGrid(data, info, REGIONS.jacket_front)
    const sleeve = extractGrid(data, info, REGIONS.right_sleeve_front)
    const pants = extractGrid(data, info, REGIONS.right_pants_front)
    const torso = extractGrid(data, info, REGIONS.torso_front)
    candidates.push({
      file: path.basename(f),
      jacket, sleeve, pants, torso,
      jacket_filled: nonTransparentCount(jacket),
      jacket_colors: uniqueColors(jacket).size,
      jacket_noise: noiseScore(jacket),
      sleeve_filled: nonTransparentCount(sleeve),
      sleeve_colors: uniqueColors(sleeve).size,
      pants_filled: nonTransparentCount(pants),
      pants_colors: uniqueColors(pants).size,
    })
  } catch {}
}

// JACKET EXEMPLARS: rich enough to learn from (>=20 filled, 4-15 colors)
const jacketRanked = candidates
  .filter((c) => c.jacket_filled >= 20 && c.jacket_colors >= 4 && c.jacket_colors <= 15)
  .sort((a, b) => b.jacket_colors - a.jacket_colors)

console.log(`=== JACKET_FRONT exemplars (rich layer, structured design) ===`)
for (const c of jacketRanked.slice(0, 3)) {
  console.log(`\n--- ${c.file} (${c.jacket_colors} colors, ${c.jacket_filled} filled px, noise=${c.jacket_noise.toFixed(2)}) ---`)
  console.log(JSON.stringify(c.jacket, null, 0))
}

// SLEEVE EXEMPLARS
const sleeveRanked = candidates
  .filter((c) => c.sleeve_filled >= 15 && c.sleeve_colors >= 2 && c.sleeve_colors <= 8)
  .sort((a, b) => b.sleeve_colors - a.sleeve_colors)

console.log(`\n\n=== SLEEVE_FRONT exemplars ===`)
for (const c of sleeveRanked.slice(0, 3)) {
  console.log(`\n--- ${c.file} (${c.sleeve_colors} colors, ${c.sleeve_filled} filled px) ---`)
  console.log(JSON.stringify(c.sleeve, null, 0))
}

// PANTS_OUTER EXEMPLARS
const pantsRanked = candidates
  .filter((c) => c.pants_filled >= 15 && c.pants_colors >= 2 && c.pants_colors <= 8)
  .sort((a, b) => b.pants_colors - a.pants_colors)

console.log(`\n\n=== PANTS_OUTER_FRONT exemplars ===`)
for (const c of pantsRanked.slice(0, 3)) {
  console.log(`\n--- ${c.file} (${c.pants_colors} colors, ${c.pants_filled} filled px) ---`)
  console.log(JSON.stringify(c.pants, null, 0))
}

// TORSO_FRONT exemplars (for skins that use the inner layer as their primary surface)
const torsoRanked = candidates
  .filter((c) => uniqueColors(c.torso).size >= 5 && uniqueColors(c.torso).size <= 12)
  .sort((a, b) => noiseScore(a.torso) - noiseScore(b.torso))

console.log(`\n\n=== TORSO_FRONT exemplars (when jacket isn't used) ===`)
for (const c of torsoRanked.slice(0, 3)) {
  console.log(`\n--- ${c.file} (${uniqueColors(c.torso).size} colors) ---`)
  console.log(JSON.stringify(c.torso, null, 0))
}
