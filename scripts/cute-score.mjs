// Score how "cute-aesthetic" a generated skin is against a reference.
// Returns a similarity score 0-100 based on objective aesthetic metrics.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const REGIONS = {
  head_top:    { x: 8,  y: 0,  w: 8, h: 8 },
  head_front:  { x: 8,  y: 8,  w: 8, h: 8 },
  hat_top:     { x: 40, y: 0,  w: 8, h: 8 },
  hat_right:   { x: 32, y: 8,  w: 8, h: 8 },
  hat_front:   { x: 40, y: 8,  w: 8, h: 8 },
  hat_left:    { x: 48, y: 8,  w: 8, h: 8 },
  hat_back:    { x: 56, y: 8,  w: 8, h: 8 },
  torso_front: { x: 20, y: 20, w: 8, h: 12 },
  jacket_front: { x: 20, y: 36, w: 8, h: 12 },
  r_sleeve_front: { x: 44, y: 36, w: 4, h: 12 },
  r_pants_front:  { x: 4,  y: 36, w: 4, h: 12 },
}

function extract(data, info, region) {
  const grid = []
  for (let row = 0; row < region.h; row++) {
    const cells = []
    for (let col = 0; col < region.w; col++) {
      const i = ((region.y + row) * info.width + (region.x + col)) * info.channels
      const a = info.channels === 4 ? data[i + 3] : 255
      cells.push(a === 0 ? null : [data[i], data[i + 1], data[i + 2]])
    }
    grid.push(cells)
  }
  return grid
}

function fillPct(grid) {
  let n = 0, total = 0
  for (const row of grid) for (const c of row) { total++; if (c) n++ }
  return n / total
}

// Quantize an RGB to a "perceptual bucket" — dedups JPEG noise
function bucket(rgb) {
  if (!rgb) return null
  const Q = 24
  return `${Math.round(rgb[0] / Q) * Q},${Math.round(rgb[1] / Q) * Q},${Math.round(rgb[2] / Q) * Q}`
}

function uniqColors(grid) {
  const set = new Set()
  for (const row of grid) for (const c of row) {
    const b = bucket(c)
    if (b) set.add(b)
  }
  return set
}

// Dominant hue family (which bucket has the most pixels)
function hueFamily(grid) {
  const counts = new Map()
  for (const row of grid) for (const c of row) {
    if (!c) continue
    // Reduce to hue bucket (~6 buckets across the spectrum)
    const max = Math.max(c[0], c[1], c[2])
    const min = Math.min(c[0], c[1], c[2])
    if (max - min < 20) {  // grayscale
      counts.set('gray', (counts.get('gray') ?? 0) + 1)
      continue
    }
    let h
    if (c[0] === max) h = (c[1] - c[2]) / (max - min)
    else if (c[1] === max) h = 2 + (c[2] - c[0]) / (max - min)
    else h = 4 + (c[0] - c[1]) / (max - min)
    h = (h * 60 + 360) % 360
    const family = h < 30 ? 'red' : h < 90 ? 'yellow' : h < 150 ? 'green' : h < 210 ? 'cyan' : h < 270 ? 'blue' : h < 330 ? 'magenta' : 'red'
    counts.set(family, (counts.get(family) ?? 0) + 1)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return sorted[0] ? sorted[0][0] : 'none'
}

// Symmetry: compare hat_right vs horizontal-flip of hat_left, etc.
function symmetry(a, b) {
  if (!a.length || !b.length) return 0
  let same = 0, total = 0
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      const ac = a[r][c]
      const bc = b[r][a[r].length - 1 - c]
      const aB = bucket(ac), bB = bucket(bc)
      if (aB === bB) same++
      total++
    }
  }
  return same / total
}

// Face hair-coverage: rows 0-2 of head_front, how many cells are filled with non-skin?
function faceFraming(grid, skinBucket) {
  let coveredTop = 0
  for (let r = 0; r < 3; r++) for (const c of grid[r]) {
    if (!c) continue
    const b = bucket(c)
    if (b !== skinBucket) coveredTop++
  }
  return coveredTop / 24  // 3 rows × 8 cols
}

async function analyze(file) {
  const buf = await readFile(file)
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const g = {}
  for (const [name, region] of Object.entries(REGIONS)) g[name] = extract(data, info, region)

  // Skin tone bucket — assume head_front middle pixel is skin
  const middlePx = g.head_front[5][3] ?? g.head_front[5][4] ?? [200, 150, 100]
  const skinB = bucket(middlePx)

  return {
    head_front_hue: hueFamily(g.head_front),
    hat_front_hue: hueFamily(g.hat_front),
    jacket_front_hue: hueFamily(g.jacket_front),
    hat_back_fill: fillPct(g.hat_back),
    hat_right_fill: fillPct(g.hat_right),
    hat_left_fill: fillPct(g.hat_left),
    hat_top_fill: fillPct(g.hat_top),
    hat_front_fill: fillPct(g.hat_front),
    jacket_fill: fillPct(g.jacket_front),
    sleeve_fill: fillPct(g.r_sleeve_front),
    pants_outer_fill: fillPct(g.r_pants_front),
    jacket_unique: uniqColors(g.jacket_front).size,
    head_front_unique: uniqColors(g.head_front).size,
    face_framing: faceFraming(g.head_front, skinB),
    hat_symmetry: symmetry(g.hat_right, g.hat_left),
  }
}

function diff(a, b, key, weight = 1) {
  if (typeof a[key] === 'string') return a[key] === b[key] ? 0 : weight
  return Math.abs(a[key] - b[key]) * weight
}

function score(ref, gen) {
  // 0 = identical, higher = farther apart. Convert to 0-100 similarity.
  let totalDiff = 0
  totalDiff += diff(ref, gen, 'head_front_hue', 10)  // hue family match is huge
  totalDiff += diff(ref, gen, 'hat_front_hue', 8)
  totalDiff += diff(ref, gen, 'jacket_front_hue', 8)
  totalDiff += diff(ref, gen, 'hat_back_fill', 30)   // 0-1 scale → 0-30 weight
  totalDiff += diff(ref, gen, 'hat_top_fill', 15)
  totalDiff += diff(ref, gen, 'hat_front_fill', 20)
  totalDiff += diff(ref, gen, 'jacket_fill', 30)
  totalDiff += diff(ref, gen, 'sleeve_fill', 15)
  totalDiff += diff(ref, gen, 'pants_outer_fill', 15)
  totalDiff += Math.max(0, Math.abs(ref.jacket_unique - gen.jacket_unique) - 2) * 2
  totalDiff += diff(ref, gen, 'face_framing', 25)
  totalDiff += diff(ref, gen, 'hat_symmetry', 10)
  // Normalize roughly: max plausible diff ~150 → 0 similarity
  return Math.max(0, 100 - totalDiff)
}

// CLI
const [refFile, genFile] = process.argv.slice(2)
if (!refFile || !genFile) { console.error('usage: cute-score.mjs <ref.png> <gen.png>'); process.exit(1) }
const refMetrics = await analyze(refFile)
const genMetrics = await analyze(genFile)
const sim = score(refMetrics, genMetrics).toFixed(1)
console.log(JSON.stringify({ ref: path.basename(refFile), gen: path.basename(genFile), similarity: parseFloat(sim), refMetrics, genMetrics }, null, 2))
