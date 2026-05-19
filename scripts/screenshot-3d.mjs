import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v9-1-knight.png',     url: '/local-skins/de7c9190-eb69-44f0-8e66-77135f9c66ba.png' },
  { file: 'v9-2-cyberpunk.png',  url: '/local-skins/ed2a9292-d640-453b-b725-f912e6f407cc.png' },
  { file: 'v9-3-wizard.png',     url: '/local-skins/efee9949-afbc-4d0b-b46f-b66956a9b085.png' },
  { file: 'v9-4-skater.png',     url: '/local-skins/73445994-3d04-4cd1-9b36-51c79f4b9a64.png' },
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
