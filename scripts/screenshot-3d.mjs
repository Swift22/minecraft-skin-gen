import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v8-1-knight.png',     url: '/local-skins/11fd3e2b-5f14-4407-af1f-372b681aac67.png' },
  { file: 'v8-2-cyberpunk.png',  url: '/local-skins/f9f4228c-d63b-453c-8933-d630186185b8.png' },
  { file: 'v8-3-wizard.png',     url: '/local-skins/51ed9715-5d00-457f-9c59-8fa22c30c65c.png' },
  { file: 'v8-4-skater.png',     url: '/local-skins/13f1ab64-d3dc-465c-8f0a-f77b5987a55b.png' },
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
