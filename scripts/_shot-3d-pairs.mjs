import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d-pairs'
await mkdir(OUT_DIR, { recursive: true })

const PAIRS = [
  { label: 'pink_pastel',  ref: 'ref-e31356d8346b58c0.png', gen: 'gen-pink_pastel.png' },
  { label: 'green_pastel', ref: 'ref-201b57b4da0bd9d1.png', gen: 'gen-green_pastel.png' },
  { label: 'twin_tail',    ref: 'ref-94ad2a0e52cfc4d1.png', gen: 'gen-twin_tail.png' },
  { label: 'long_blonde',  ref: 'ref-bb2adcac96e12d93.png', gen: 'gen-long_blonde.png' },
  { label: 'frog_hood',    ref: 'ref-f2b8ea9653543e19.png', gen: 'gen-frog_hood.png' },
]

const browser = await chromium.launch()
try {
  for (const pair of PAIRS) {
    for (const [kind, file] of [['ref', pair.ref], ['gen', pair.gen]]) {
      const ctx = await browser.newContext({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      const skinUrl = `/local-skins/${file}`
      const url = `http://localhost:3000/3d-shot?url=${encodeURIComponent(skinUrl)}&yaw=0.45`
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.waitForFunction(() => document.title === 'READY', null, { timeout: 30000 })
      await page.waitForTimeout(500)
      const canvas = await page.locator('canvas')
      const out = path.join(OUT_DIR, `${pair.label}-${kind}.png`)
      await canvas.screenshot({ path: out, omitBackground: false })
      console.log(`  saved ${out}`)
      await ctx.close()
    }
  }
} finally { await browser.close() }
console.log('done')
