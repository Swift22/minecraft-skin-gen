import { describe, it, expect } from 'vitest'
import { buildSkinPngV2 } from '../skin-builder-v2'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const FIX = path.join(__dirname, 'fixtures')

describe('skin-builder-v2 golden', () => {
  it('basic-skin matches golden PNG byte-for-byte', async () => {
    const intent = JSON.parse(readFileSync(path.join(FIX, 'basic-skin.intent.json'), 'utf8'))
    const pixels = JSON.parse(readFileSync(path.join(FIX, 'basic-skin.pixels.json'), 'utf8'))
    const out = await buildSkinPngV2(intent, pixels)

    const goldenPath = path.join(FIX, 'basic-skin.png')
    if (!existsSync(goldenPath)) {
      throw new Error(`Golden missing — seed it by running: npx tsx scripts/seed-golden.ts`)
    }
    const golden = readFileSync(goldenPath)
    expect(out.equals(golden)).toBe(true)
  })
})
