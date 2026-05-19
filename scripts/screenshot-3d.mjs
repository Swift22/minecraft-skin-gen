import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v6-1-knight.png',     url: '/local-skins/47c02995-56a7-4cf0-9e15-bbcce8ec54f6.png' },
  { file: 'v6-2-cyberpunk.png',  url: '/local-skins/9e8445e6-8638-462d-83dd-378fc8a1382a.png' },
  { file: 'v6-3-wizard.png',     url: '/local-skins/4307e154-9da8-40c3-9efb-b6c9c618840b.png' },
  { file: 'v6-4-skater.png',     url: '/local-skins/0e6a4a4e-9630-408b-92e3-1528fb689146.png' },
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
