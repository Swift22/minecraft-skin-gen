import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
const file = process.argv[2]
const buf = await readFile(file)
const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
const region = { x: 8, y: 8, w: 8, h: 8 }
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
