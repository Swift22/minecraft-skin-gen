import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: '1-knight-v3.png',     url: '/local-skins/1244062e-a23f-4a4d-a7ff-e3f8630eab41.png' },
  { file: '2-cyberpunk-v3.png',  url: '/local-skins/e018f703-3cc3-4817-8127-d147ad709e60.png' },
  { file: '3-wizard-v3.png',     url: '/local-skins/3cf4081c-d3a0-4ac3-a342-7d44f918ea66.png' },
  { file: '4-skater-v3.png',     url: '/local-skins/b45d32e2-b9d8-4a13-9e1e-0db2524824d5.png' },
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
