import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const REFS = [
  { hash: 'e31356d8346b58c0', label: 'white-dress-pink-hair' },
  { hash: '201b57b4da0bd9d1', label: 'green-hair-overalls' },
  { hash: '94ad2a0e52cfc4d1', label: 'pink-nurse-emblem' },
  { hash: 'bb2adcac96e12d93', label: 'goth-pink-striped-tights' },
  { hash: 'f2b8ea9653543e19', label: 'green-frog-antennae' },
]

const REGIONS = {
  hat_front:           { x: 40, y: 8,  w: 8, h: 8 },
  hat_top:             { x: 40, y: 0,  w: 8, h: 8 },
  hat_right:           { x: 32, y: 8,  w: 8, h: 8 },
  hat_left:            { x: 48, y: 8,  w: 8, h: 8 },
  hat_back:            { x: 56, y: 8,  w: 8, h: 8 },
  jacket_front:        { x: 20, y: 36, w: 8, h: 12 },
  right_sleeve_front:  { x: 44, y: 36, w: 4, h: 12 },
  right_pants_front:   { x: 4,  y: 36, w: 4, h: 12 },
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

function countNonTransparent(grid) {
  let n = 0
  for (const row of grid) for (const c of row) if (c !== '') n++
  return n
}

for (const ref of REFS) {
  const file = path.join(import.meta.dirname, 'namemc-skins', `${ref.hash}.png`)
  const buf = await readFile(file)
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  console.log(`\n========== ${ref.label} (${ref.hash}) ==========`)
  for (const [name, region] of Object.entries(REGIONS)) {
    const grid = extractGrid(data, info, region)
    const filled = countNonTransparent(grid)
    if (filled === 0) {
      console.log(`  ${name}: empty (0 filled)`)
      continue
    }
    console.log(`\n  ${name} (${filled} filled px):`)
    console.log('  ' + JSON.stringify(grid))
  }
}
