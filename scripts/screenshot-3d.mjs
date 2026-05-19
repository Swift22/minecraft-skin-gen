import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v7-1-knight.png',     url: '/local-skins/204a03bd-b27d-4fb0-b493-ddda424bd9a0.png' },
  { file: 'v7-2-cyberpunk.png',  url: '/local-skins/deb7faae-98e5-4d19-86f0-49c771f0eb29.png' },
  { file: 'v7-3-wizard.png',     url: '/local-skins/0a926611-05dc-4657-9582-ec07d7480cf6.png' },
  { file: 'v7-4-skater.png',     url: '/local-skins/70b63470-df8f-4dbb-bd5a-e79dba5e856c.png' },
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
