import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = '/tmp/skin-3d'
await mkdir(OUT_DIR, { recursive: true })

const SKINS = [
  { file: 'v10-1-pink-girl.png',    url: '/local-skins/f1afc331-dc81-42f4-ac10-099fd51579ef.png' },
  { file: 'v10-2-frog.png',         url: '/local-skins/b4dd3ee7-b8d9-4cbf-9a3c-915dd2dc4e36.png' },
  { file: 'v10-3-twin-tails.png',   url: '/local-skins/d3f087ea-793e-444d-b95b-5132dc870ae3.png' },
  { file: 'v10-4-goth.png',         url: '/local-skins/eba0a3b1-d62b-4225-83ce-24a3979239a7.png' },
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
