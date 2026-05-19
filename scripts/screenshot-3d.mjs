import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v5-1-knight.png',     url: '/local-skins/cdbfca92-17fe-45be-beab-5e82da7480f0.png' },
  { file: 'v5-2-cyberpunk.png',  url: '/local-skins/edfdccf9-f756-4c18-9416-bac2752e8227.png' },
  { file: 'v5-3-wizard.png',     url: '/local-skins/79032972-6a64-4cd1-9055-4ed1c9e2082e.png' },
  { file: 'v5-4-skater.png',     url: '/local-skins/e6bf3da3-478e-4dcd-9f27-985f4e9eca94.png' },
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
