import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'cutegen-1-pink-girl.png',    url: '/local-skins/755d029e-e7ed-4544-8b2d-99af5cafaf20.png' },
  { file: 'cutegen-2-frog.png',         url: '/local-skins/b077052f-b927-4c70-836b-03f1edfc322a.png' },
  { file: 'cutegen-3-twin-tails.png',   url: '/local-skins/eedb4b72-5fe4-4aab-ad6a-fc334208667c.png' },
  { file: 'cutegen-4-goth-horn.png',    url: '/local-skins/cfbef1d7-b8a2-45c2-be53-fc172b6a6ae5.png' },
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
