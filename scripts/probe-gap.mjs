// Print per-metric gap so we know what to fix next
import { readFile } from 'node:fs/promises'
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

async function analyze(file) {
  const buf = await readFile(file)
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const g = {}
  for (const [name, region] of Object.entries(REGIONS)) g[name] = extract(data, info, region)

  return {
    file: file.split('/').pop(),
    hat_top_fill: fillPct(g.hat_top),
    hat_front_fill: fillPct(g.hat_front),
    hat_right_fill: fillPct(g.hat_right),
    hat_left_fill: fillPct(g.hat_left),
    hat_back_fill: fillPct(g.hat_back),
    jacket_fill: fillPct(g.jacket_front),
    sleeve_fill: fillPct(g.r_sleeve_front),
    pants_outer_fill: fillPct(g.r_pants_front),
    head_front_unique: uniqColors(g.head_front).size,
    jacket_unique: uniqColors(g.jacket_front).size,
    hat_front_unique: uniqColors(g.hat_front).size,
  }
}

const refs = ['e31356d8346b58c0', '201b57b4da0bd9d1', '94ad2a0e52cfc4d1', 'bb2adcac96e12d93', 'f2b8ea9653543e19']
for (const ref of refs) {
  const m = await analyze(`scripts/namemc-skins/${ref}.png`)
  console.log(JSON.stringify(m))
}
