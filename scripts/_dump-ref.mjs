import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const REGIONS = {
  hat_front:   { x: 40, y: 8,  w: 8, h: 8 },
  hat_back:    { x: 56, y: 8,  w: 8, h: 8 },
  hat_right:   { x: 32, y: 8,  w: 8, h: 8 },
  hat_left:    { x: 48, y: 8,  w: 8, h: 8 },
  hat_top:     { x: 40, y: 0,  w: 8, h: 8 },
}

const file = process.argv[2]
const buf = await readFile(file)
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })

for (const [name, region] of Object.entries(REGIONS)) {
  console.log(`\n=== ${name} ===`)
  for (let r = 0; r < region.h; r++) {
    let line = ''
    for (let c = 0; c < region.w; c++) {
      const i = ((region.y + r) * info.width + (region.x + c)) * info.channels
      const a = info.channels === 4 ? data[i + 3] : 255
      if (a === 0) line += ' . '
      else {
        const hex = `${data[i].toString(16).padStart(2,'0')}${data[i+1].toString(16).padStart(2,'0')}${data[i+2].toString(16).padStart(2,'0')}`
        line += `${hex} `
      }
    }
    console.log(line)
  }
}
