// Iter loop: generate N times per prompt, keep best by similarity, print
// per-metric gaps so we know which lever to pull next.
//
// usage: LOCAL_MODE=true node scripts/iter-loop.mjs [runs-per-prompt]

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

const REF_DIR = 'scripts/namemc-skins'
const OUT_DIR = 'scripts/iter-gens'
const RUNS = parseInt(process.argv[2] ?? '3', 10)

// 5 reference cute skins + prompts that HONESTLY describe each visible ref.
// (Earlier prompts mismatched outfit colors which the scorer flagged as hue
// losses — fixed by inspecting the actual ref images.)
const PROMPTS = [
  { ref: 'e31356d8346b58c0', label: 'pink_pastel', prompt: 'super cute kawaii girl, soft pink long flowing hair past shoulders, pink dress with white trim, pink legs, blushy cheeks, big sparkly anime eyes' },
  { ref: '201b57b4da0bd9d1', label: 'green_pastel', prompt: 'kawaii girl with long pastel green flowing hair past shoulders, cream sleeveless top with green skirt, soft cheeks, sweet smile' },
  { ref: '94ad2a0e52cfc4d1', label: 'twin_tail',    prompt: 'cute kawaii girl with pink twin-tail pigtails, pastel pink hoodie and pink shorts, big innocent eyes, blush, all-pink aesthetic' },
  { ref: 'bb2adcac96e12d93', label: 'long_blonde',  prompt: 'sweet kawaii girl with long blonde flowing hair past shoulders, white tee, black skirt with black leggings, soft pink blush' },
  { ref: 'f2b8ea9653543e19', label: 'frog_hood',    prompt: 'tiny cute character wearing oversized green frog hoodie with hood ears on top, green pants, blush on cheeks, small simple face' },
]

const REGIONS = {
  head_top:    { x: 8,  y: 0,  w: 8, h: 8 },
  head_front:  { x: 8,  y: 8,  w: 8, h: 8 },
  hat_top:     { x: 40, y: 0,  w: 8, h: 8 },
  hat_right:   { x: 32, y: 8,  w: 8, h: 8 },
  hat_front:   { x: 40, y: 8,  w: 8, h: 8 },
  hat_left:    { x: 48, y: 8,  w: 8, h: 8 },
  hat_back:    { x: 56, y: 8,  w: 8, h: 8 },
  torso_front: { x: 20, y: 20, w: 8, h: 12 },
  jacket_front: { x: 20, y: 36, w: 8, h: 12 },
  r_sleeve_front: { x: 44, y: 36, w: 4, h: 12 },
  r_pants_front:  { x: 4,  y: 36, w: 4, h: 12 },
}

function extract(data, info, region) {
  const grid = []
  for (let row = 0; row < region.h; row++) {
    const cells = []
    for (let col = 0; col < region.w; col++) {
      const i = ((region.y + row) * info.width + (region.x + col)) * info.channels
      const a = info.channels === 4 ? data[i + 3] : 255
      cells.push(a === 0 ? null : [data[i], data[i + 1], data[i + 2]])
    }
    grid.push(cells)
  }
  return grid
}
function fillPct(grid) { let n=0,t=0; for(const r of grid)for(const c of r){t++;if(c)n++}; return n/t }
function bucket(rgb) { if(!rgb)return null; const Q=24; return `${Math.round(rgb[0]/Q)*Q},${Math.round(rgb[1]/Q)*Q},${Math.round(rgb[2]/Q)*Q}` }
function uniqColors(grid) { const s=new Set(); for(const r of grid)for(const c of r){const b=bucket(c); if(b)s.add(b)}; return s }
function hueFamily(grid) {
  const counts = new Map()
  for (const row of grid) for (const c of row) {
    if (!c) continue
    const max = Math.max(c[0], c[1], c[2]), min = Math.min(c[0], c[1], c[2])
    if (max - min < 20) { counts.set('gray',(counts.get('gray')??0)+1); continue }
    let h
    if (c[0]===max) h=(c[1]-c[2])/(max-min)
    else if (c[1]===max) h=2+(c[2]-c[0])/(max-min)
    else h=4+(c[0]-c[1])/(max-min)
    h=(h*60+360)%360
    const fam = h<30?'red':h<90?'yellow':h<150?'green':h<210?'cyan':h<270?'blue':h<330?'magenta':'red'
    counts.set(fam,(counts.get(fam)??0)+1)
  }
  const s=[...counts.entries()].sort((a,b)=>b[1]-a[1])
  return s[0]?s[0][0]:'none'
}
function symmetry(a,b) {
  if(!a.length||!b.length) return 0
  let same=0,total=0
  for(let r=0;r<a.length;r++) for(let c=0;c<a[r].length;c++){
    const aB=bucket(a[r][c]), bB=bucket(b[r][a[r].length-1-c])
    if(aB===bB) same++; total++
  }
  return same/total
}
function faceFraming(grid, skinB) {
  let n=0
  for(let r=0;r<3;r++) for(const c of grid[r]) {
    if(!c) continue
    if(bucket(c)!==skinB) n++
  }
  return n/24
}

async function metrics(file) {
  const buf = await readFile(file)
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
  const g = {}
  for (const [name, region] of Object.entries(REGIONS)) g[name] = extract(data, info, region)
  const midPx = g.head_front[5][3] ?? g.head_front[5][4] ?? [200,150,100]
  const skinB = bucket(midPx)
  return {
    head_front_hue: hueFamily(g.head_front),
    hat_front_hue: hueFamily(g.hat_front),
    jacket_front_hue: hueFamily(g.jacket_front),
    hat_top_fill: fillPct(g.hat_top),
    hat_front_fill: fillPct(g.hat_front),
    hat_right_fill: fillPct(g.hat_right),
    hat_left_fill: fillPct(g.hat_left),
    hat_back_fill: fillPct(g.hat_back),
    jacket_fill: fillPct(g.jacket_front),
    sleeve_fill: fillPct(g.r_sleeve_front),
    pants_outer_fill: fillPct(g.r_pants_front),
    head_front_unique: uniqColors(g.head_front).size,
    jacket_unique: uniqColors(g.jacket_front).size,
    hat_front_unique: uniqColors(g.hat_front).size,
    face_framing: faceFraming(g.head_front, skinB),
    hat_symmetry: symmetry(g.hat_right, g.hat_left),
  }
}

function diffOf(refM, genM, key, weight) {
  if (typeof refM[key] === 'string') return { metric: key, refV: refM[key], genV: genM[key], diff: refM[key] === genM[key] ? 0 : weight, weight }
  const d = Math.abs(refM[key] - genM[key]) * weight
  return { metric: key, refV: refM[key], genV: genM[key], diff: d, weight }
}

function scoreAndBreakdown(refM, genM) {
  const items = []
  items.push(diffOf(refM, genM, 'head_front_hue', 10))
  items.push(diffOf(refM, genM, 'hat_front_hue', 8))
  items.push(diffOf(refM, genM, 'jacket_front_hue', 8))
  items.push(diffOf(refM, genM, 'hat_back_fill', 30))
  items.push(diffOf(refM, genM, 'hat_top_fill', 15))
  items.push(diffOf(refM, genM, 'hat_front_fill', 20))
  items.push(diffOf(refM, genM, 'jacket_fill', 30))
  items.push(diffOf(refM, genM, 'sleeve_fill', 15))
  items.push(diffOf(refM, genM, 'pants_outer_fill', 15))
  items.push(diffOf(refM, genM, 'face_framing', 25))
  items.push(diffOf(refM, genM, 'hat_symmetry', 10))
  const uniqDiff = Math.max(0, Math.abs(refM.jacket_unique - genM.jacket_unique) - 2) * 2
  items.push({ metric: 'jacket_unique', refV: refM.jacket_unique, genV: genM.jacket_unique, diff: uniqDiff, weight: 2 })
  const total = items.reduce((a, b) => a + b.diff, 0)
  const sim = Math.max(0, 100 - total)
  return { sim, items: items.sort((a, b) => b.diff - a.diff) }
}

async function generateOnce(prompt) {
  // Call API via curl against dev server (LOCAL_MODE=true)
  const res = spawnSync('curl', [
    '-sS', '-X', 'POST', 'http://localhost:3000/api/generate',
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({ prompt }),
  ], { encoding: 'utf8' })
  if (res.status !== 0) throw new Error(`curl exit ${res.status}: ${res.stderr}`)
  const data = JSON.parse(res.stdout)
  if (!data.skinUrl) throw new Error(`no skinUrl in ${res.stdout.slice(0,200)}`)
  const id = data.generationId
  const local = path.join(process.cwd(), 'public', 'local-skins', `${id}.png`)
  // Make sure file is on disk
  for (let i = 0; i < 30; i++) {
    try { await readFile(local); break } catch { await new Promise(r => setTimeout(r, 100)) }
  }
  return { localPath: local, intent: data.intent }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const results = []
  console.log(`=== ITER LOOP: best-of-${RUNS} per prompt ===\n`)

  for (const p of PROMPTS) {
    const refMetrics = await metrics(path.join(REF_DIR, `${p.ref}.png`))
    let best = null
    for (let r = 0; r < RUNS; r++) {
      try {
        const { localPath, intent } = await generateOnce(p.prompt)
        const genMetrics = await metrics(localPath)
        const { sim, items } = scoreAndBreakdown(refMetrics, genMetrics)
        const cand = { sim, items, intent, localPath, hairStyle: intent?.character?.hair_style ?? '?' }
        if (!best || sim > best.sim) best = cand
        process.stdout.write(`  ${p.label} run${r+1}: ${sim.toFixed(1)} [${cand.hairStyle}]\n`)
      } catch (e) {
        console.error(`  ${p.label} run${r+1} failed:`, e.message)
      }
    }
    if (best) {
      // Save best gen + write breakdown
      const dest = path.join(OUT_DIR, `${p.label}-best.png`)
      await writeFile(dest, await readFile(best.localPath))
      results.push({ ...p, best, refMetrics })
      console.log(`  → ${p.label} BEST: ${best.sim.toFixed(1)} [hair: ${best.hairStyle}]`)
      console.log(`    top gaps:`)
      for (const it of best.items.slice(0, 4)) {
        const r = typeof it.refV === 'number' ? it.refV.toFixed(2) : it.refV
        const g = typeof it.genV === 'number' ? it.genV.toFixed(2) : it.genV
        console.log(`      ${it.metric.padEnd(20)} ref=${String(r).padEnd(8)} gen=${String(g).padEnd(8)} loss=${it.diff.toFixed(1)}`)
      }
    }
  }

  // Aggregate which metrics hurt the most across all prompts
  console.log(`\n=== AGGREGATE TOP-LOSS METRICS (sum of diffs across 5 prompts) ===`)
  const totals = new Map()
  for (const r of results) {
    for (const it of r.best.items) {
      totals.set(it.metric, (totals.get(it.metric) ?? 0) + it.diff)
    }
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1])
  for (const [m, total] of sorted) {
    console.log(`  ${m.padEnd(20)} total loss = ${total.toFixed(1)}`)
  }

  const avg = results.reduce((a, r) => a + r.best.sim, 0) / results.length
  console.log(`\nAVG BEST: ${avg.toFixed(1)}`)
  await writeFile(path.join(OUT_DIR, 'last-run.json'), JSON.stringify({ results: results.map(r => ({ label: r.label, sim: r.best.sim, hair: r.best.hairStyle, intent: r.best.intent, items: r.best.items, ref: r.refMetrics })) }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
