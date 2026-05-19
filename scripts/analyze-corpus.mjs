// Analyze a corpus of 64x64 (or 64x32) Minecraft skin PNGs and extract
// design patterns useful for the Artist prompt.
//
// Metrics per skin:
//   - dimensions, has-second-layer (64x64) vs legacy (64x32)
//   - palette: unique colors total, unique colors per region (torso_front, etc.)
//   - outer-layer usage: # of non-transparent pixels in hat/jacket/sleeves/pants
//   - shading pattern: is top-row of a region a lighter shade of the middle?
//     is bottom-row darker?
//   - "noise score": ratio of single-pixel color changes (a proxy for stippling)
//
// Aggregate across the corpus and print a summary.

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const CORPUS = path.join(import.meta.dirname, 'namemc-skins')

// UV bounding boxes for the regions we care about
const REGIONS = {
  // inner layer
  head_front:      { x: 8,  y: 8,  w: 8, h: 8 },
  torso_front:     { x: 20, y: 20, w: 8, h: 12 },
  torso_back:      { x: 32, y: 20, w: 8, h: 12 },
  right_arm_front: { x: 44, y: 20, w: 4, h: 12 },
  right_leg_front: { x: 4,  y: 20, w: 4, h: 12 },
  // outer (jacket / pants / hat) — only present on 64x64
  hat_front:           { x: 40, y: 8,  w: 8, h: 8 },
  jacket_front:        { x: 20, y: 36, w: 8, h: 12 },
  right_sleeve_front:  { x: 44, y: 36, w: 4, h: 12 },
  pants_outer_right:   { x: 4,  y: 36, w: 4, h: 12 },
}

function key(r, g, b, a) {
  return a === 0 ? 'transparent' : `${r},${g},${b}`
}

function sampleRegion(data, info, region) {
  const px = []
  for (let row = 0; row < region.h; row++) {
    const rowColors = []
    for (let col = 0; col < region.w; col++) {
      const i = ((region.y + row) * info.width + (region.x + col)) * info.channels
      const a = info.channels === 4 ? data[i + 3] : 255
      rowColors.push({ r: data[i], g: data[i + 1], b: data[i + 2], a, key: key(data[i], data[i + 1], data[i + 2], a) })
    }
    px.push(rowColors)
  }
  return px
}

function uniqueColors(grid) {
  const set = new Set()
  for (const row of grid) for (const c of row) if (c.key !== 'transparent') set.add(c.key)
  return set
}

function nonTransparentCount(grid) {
  let n = 0
  for (const row of grid) for (const c of row) if (c.key !== 'transparent') n++
  return n
}

/** Crude "noise score": fraction of pixels whose color differs from BOTH neighbors. */
function noiseScore(grid) {
  let differs = 0, total = 0
  for (let row = 0; row < grid.length; row++) {
    for (let col = 1; col < grid[row].length - 1; col++) {
      const c = grid[row][col]
      if (c.key === 'transparent') continue
      const left = grid[row][col - 1]
      const right = grid[row][col + 1]
      if (left.key !== c.key && right.key !== c.key) differs++
      total++
    }
  }
  return total === 0 ? 0 : differs / total
}

/** Is the top row of this region lighter than the middle? Returns 'lighter' | 'same' | 'darker' | 'noisy'. */
function shadingPattern(grid) {
  if (grid.length < 4) return 'noisy'
  const luminance = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
  const rowLum = (row) => {
    const visible = row.filter((c) => c.key !== 'transparent')
    if (visible.length === 0) return null
    return visible.reduce((s, c) => s + luminance(c), 0) / visible.length
  }
  const topLum = rowLum(grid[0])
  const midLum = rowLum(grid[Math.floor(grid.length / 2)])
  const botLum = rowLum(grid[grid.length - 1])
  if (topLum === null || midLum === null || botLum === null) return 'noisy'
  const topVsMid = topLum - midLum
  const botVsMid = botLum - midLum
  return {
    top_vs_mid: topVsMid.toFixed(1),
    bot_vs_mid: botVsMid.toFixed(1),
    pattern: topVsMid > 5 && botVsMid < -5 ? 'TOP_HIGHLIGHT_BOTTOM_SHADOW'
      : topVsMid < -5 && botVsMid > 5 ? 'INVERTED'
      : Math.abs(topVsMid) < 3 && Math.abs(botVsMid) < 3 ? 'FLAT'
      : 'MIXED',
  }
}

async function analyzeOne(file) {
  const buf = await readFile(file)
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const is64x64 = info.width === 64 && info.height === 64
  const result = {
    file: path.basename(file),
    size: `${info.width}x${info.height}`,
    is_64x64: is64x64,
    regions: {},
  }
  for (const [name, region] of Object.entries(REGIONS)) {
    if (!is64x64 && region.y >= 32) continue  // skip 2nd-layer regions on legacy skins
    const grid = sampleRegion(data, info, region)
    const colors = uniqueColors(grid)
    const nt = nonTransparentCount(grid)
    result.regions[name] = {
      unique_colors: colors.size,
      non_transparent_pixels: nt,
      pct_filled: ((nt / (region.w * region.h)) * 100).toFixed(0) + '%',
      noise_score: noiseScore(grid).toFixed(2),
      shading: shadingPattern(grid),
    }
  }
  return result
}

const files = (await readdir(CORPUS)).filter((f) => f.endsWith('.png')).map((f) => path.join(CORPUS, f))
console.log(`analyzing ${files.length} skins from ${CORPUS}\n`)

const results = []
for (const f of files) {
  try {
    results.push(await analyzeOne(f))
  } catch (e) {
    console.log(`  skip ${path.basename(f)}: ${e.message}`)
  }
}

// AGGREGATE
const has64 = results.filter((r) => r.is_64x64).length
console.log(`size mix: ${has64}/${results.length} are 64x64, rest are legacy 64x32`)

const regionNames = Object.keys(REGIONS)
console.log(`\nper-region averages (across ${results.length} skins):\n`)
console.log('region                | uniq | filled | noise | shading_pattern')
console.log('-----------------------|------|--------|-------|----------------')

for (const name of regionNames) {
  const samples = results.map((r) => r.regions[name]).filter(Boolean)
  if (samples.length === 0) continue
  const avgUniq = (samples.reduce((s, r) => s + r.unique_colors, 0) / samples.length).toFixed(1)
  const avgFill = (samples.reduce((s, r) => s + parseFloat(r.pct_filled), 0) / samples.length).toFixed(0) + '%'
  const avgNoise = (samples.reduce((s, r) => s + parseFloat(r.noise_score), 0) / samples.length).toFixed(2)
  const patternCount = {}
  for (const s of samples) {
    const p = typeof s.shading === 'string' ? s.shading : s.shading.pattern
    patternCount[p] = (patternCount[p] || 0) + 1
  }
  const topPattern = Object.entries(patternCount).sort((a, b) => b[1] - a[1])[0]
  console.log(`${name.padEnd(22)} | ${avgUniq.padStart(4)} | ${avgFill.padStart(6)} | ${avgNoise.padStart(5)} | ${topPattern[0]} (${topPattern[1]}/${samples.length})`)
}

// outer-layer usage
const outerLayerRegions = ['hat_front', 'jacket_front', 'right_sleeve_front', 'pants_outer_right']
console.log(`\nouter-layer usage (% of 64x64 skins with >5 filled pixels):`)
for (const name of outerLayerRegions) {
  const used = results.filter((r) => r.is_64x64 && r.regions[name] && r.regions[name].non_transparent_pixels > 5).length
  const total = results.filter((r) => r.is_64x64).length
  console.log(`  ${name.padEnd(22)} ${((used / total) * 100).toFixed(0)}% (${used}/${total})`)
}

// pick 8 exemplary skins (low noise, high coverage, multi-color torso)
const ranked = results
  .filter((r) => r.is_64x64 && r.regions.torso_front)
  .map((r) => {
    const tf = r.regions.torso_front
    const tn = parseFloat(tf.noise_score)
    const fill = parseFloat(tf.pct_filled)
    const colors = tf.unique_colors
    // good = low noise, high fill, 3-6 unique colors (variety without chaos)
    const score = (1 - tn) * 0.4 + (fill / 100) * 0.3 + (colors >= 3 && colors <= 6 ? 1 : 0.3) * 0.3
    return { ...r, score }
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 8)

console.log(`\ntop 8 exemplary skins (low noise + good coverage + 3-6 torso colors):`)
for (const r of ranked) {
  const tf = r.regions.torso_front
  console.log(`  ${r.file}  torso: ${tf.unique_colors}c ${tf.pct_filled}f noise=${tf.noise_score} pattern=${typeof tf.shading === 'string' ? tf.shading : tf.shading.pattern}`)
}
