// Dựng ảnh hướng dẫn học sinh vào lớp Live: PLAYWRIGHT_DUONG=<đường playwright> node docs/huong-dan-live-1211/chup.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url))
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 1 })
await p.goto('file://' + join(thuMuc, 'huong-dan.html')); await p.evaluate(() => document.fonts.ready)
await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
const tep = join(thuMuc, 'huong-dan-vao-live.jpg')
await p.screenshot({ path: tep, type: 'jpeg', quality: 84, fullPage: true })
const cao = await p.evaluate(() => document.documentElement.scrollHeight)
console.log(`${Math.round(statSync(tep).size / 1024)} KB · 1080 × ${cao}`)
await b.close()
