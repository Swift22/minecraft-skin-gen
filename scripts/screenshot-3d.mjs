import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: '1-knight.png',     url: '/local-skins/030bf88b-f726-4abe-bbde-2a2ba98abeee.png' },
  { file: '2-cyberpunk.png',  url: '/local-skins/c32e57d8-7b4d-40cf-8b2f-3268f2b8bf21.png' },
  { file: '3-wizard.png',     url: '/local-skins/a3e2dff2-0c11-4b72-8896-3960f7196677.png' },
  { file: '4-skater.png',     url: '/local-skins/deb7abcd-174a-4daf-b8aa-978594aad44c.png' },
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
