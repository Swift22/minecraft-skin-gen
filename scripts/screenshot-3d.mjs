import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'new-1-skeleton.png',  url: '/local-skins/8b2c2ac5-21bf-4920-a3d2-16f353117133.png' },
  { file: 'new-2-anime-kid.png', url: '/local-skins/f39b5638-f7a3-4654-a949-7dddb5c86a94.png' },
  { file: 'new-3-wizard.png',    url: '/local-skins/bf53bce2-7fad-49f7-8c1f-f597aa134d19.png' },
  { file: 'new-4-robot.png',     url: '/local-skins/ebddc9d4-f1ff-469b-8898-077c1ac948c9.png' },
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
