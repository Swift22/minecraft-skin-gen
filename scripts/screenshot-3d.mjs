import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v11-1-pink-girl.png',    url: '/local-skins/ab79f043-96d6-4a4b-bc31-6db3ce92913e.png' },
  { file: 'v11-2-frog.png',         url: '/local-skins/c3892ab0-0469-4c2d-bc2a-ddd43867d849.png' },
  { file: 'v11-3-twin-tails.png',   url: '/local-skins/1398e6cc-42aa-4307-8a57-349b26dae0e7.png' },
  { file: 'v11-4-goth.png',         url: '/local-skins/25f8be08-e2cd-4765-93c9-e0e2c40ed8e1.png' },
]

const browser = await chromium.launch()
try {
  for (const s of SKINS) {
    const ctx = await browser.newContext({ viewport: { width: 700, height: 900 }, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    const url = `http://localhost:3000/3d-shot?url=${encodeURIComponent(s.url)}&yaw=0.45`
    console.log(`-> ${url}`)
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => document.title === 'READY', null, { timeout: 30000 })
    // Give skinview3d a moment more to settle
    await page.waitForTimeout(500)
    const canvas = await page.locator('canvas')
    const out = path.join(OUT_DIR, s.file)
    await canvas.screenshot({ path: out, omitBackground: false })
    console.log(`   saved ${out}`)
    await ctx.close()
  }
} finally {
  await browser.close()
}
console.log('done')
