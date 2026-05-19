import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v4-1-knight.png',     url: '/local-skins/37686804-b189-45dc-9b0b-bed47b1550c5.png' },
  { file: 'v4-2-cyberpunk.png',  url: '/local-skins/12fbdfb4-ed1a-4444-8789-345b81d442e6.png' },
  { file: 'v4-3-wizard.png',     url: '/local-skins/d5f8cb84-be4d-4c6c-ad63-6ede5ea193eb.png' },
  { file: 'v4-4-skater.png',     url: '/local-skins/f21680d8-024a-46e7-af9e-d9382832e922.png' },
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
