// ĐO MÀN KIỂM TRA (giám thị cầm đèn) — bản build bộ chụp chup-v2, CPU giả lập: node docs/ban-ve-giam-thi-moi-0211/do-thi.mjs <dist-chup> <cpu 4|6> <máy yếu 0|1>  (RM=1: giảm chuyển động).
// In: rAF/giây khi đứng yên 6 s, khung p95, INP chạm 4 ô (ba phần: chờ · xử lý · vẽ), thời gian «Câu tiếp». Đo 02/11 so main xen kẽ — số ở DIEU-PHOI / PR #749.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
const DIST = resolve(process.argv[2]), CPU = Number(process.argv[3] ?? 4), YEU = process.argv[4] === '1'
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' }
const PUB = resolve('public')
const may = createServer((req, res) => { const d = decodeURIComponent(new URL(req.url, 'http://x').pathname); const p = join(DIST, d), pub = join(PUB, d); const t = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html'); res.writeHead(200, { 'content-type': LOAI[extname(t)] ?? 'application/octet-stream' }); res.end(readFileSync(t)) }).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const tr = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await tr.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, reducedMotion: process.env.RM === '1' ? 'reduce' : 'no-preference' })
const t = await ctx.newPage()
if (YEU) await t.addInitScript(() => { document.documentElement.classList.add('may-yeu'); new MutationObserver(() => { if (!document.documentElement.classList.contains('may-yeu')) document.documentElement.classList.add('may-yeu') }).observe(document.documentElement, { attributes: true }) })
await t.addInitScript(() => { window.__inp = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'pointerup' || e.name === 'click' || e.name === 'pointerdown') window.__inp.push(e.duration), e.name === 'pointerup' && (window.__ba = window.__ba || []).push([Math.round(e.processingStart - e.startTime), Math.round(e.processingEnd - e.processingStart), Math.round(e.startTime + e.duration - e.processingEnd)]) }).observe({ type: 'event', durationThreshold: 16, buffered: true }) })
await t.goto(`${goc}/scripts/chup-v2/trang.html?man=duo-kt&v=thi&vai=hocsinh`)
await t.waitForTimeout(3000)
const cdp = await ctx.newCDPSession(t); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
await t.waitForTimeout(1000)
// 6 s đứng yên: đếm rAF + khung
const yen = await t.evaluate(() => new Promise((ok) => { let n = 0, truoc = performance.now(); const kh = []; const dau = truoc; const f = (now) => { n++; kh.push(now - truoc); truoc = now; if (now - dau < 6000) requestAnimationFrame(f); else { kh.sort((a, b) => a - b); ok({ rafGiay: Math.round(n / 6), p95: Math.round(kh[Math.floor(kh.length * 0.95)]), tren50: kh.filter((x) => x > 50).length }) } }; requestAnimationFrame(f) }))
// rAF của TRANG (không tính bộ đếm của mình): đếm lời gọi requestAnimationFrame trong 6 s
const rafTrang = await t.evaluate(() => new Promise((ok) => { const g = window.requestAnimationFrame; let n = 0; window.requestAnimationFrame = (cb) => { n++; return g(cb) }; setTimeout(() => { window.requestAnimationFrame = g; ok(Math.round(n / 6)) }, 6000) }))
// chạm 4 phương án lần lượt rồi «Câu tiếp»
const tg = []
for (const nhan of ['A.', 'B.', 'C.', 'D.']) { const b = t.getByRole('button', { name: new RegExp('^' + nhan.replace('.', '\\.')) }).first(); if (await b.count()) { await b.tap().catch(() => b.click()); await t.waitForTimeout(1600) } }
const t0 = Date.now(); const nut = t.getByRole('button', { name: /Câu tiếp/ }).first(); await nut.click(); await t.getByText(/Câu 2\/8|CÂU 2\/8/).first().waitFor({ timeout: 10000 }).catch(() => {}); tg.push(Date.now() - t0)
const inp = await t.evaluate(() => window.__inp); const ba = await t.evaluate(() => window.__ba ?? [])
inp.sort((a, b) => a - b)
console.log(JSON.stringify({ cpu: CPU, yeu: YEU, ...yen, rafTrang, inpTrungVi: inp[Math.floor(inp.length / 2)], inpMax: inp[inp.length - 1], soInp: inp.length, cauTiepMs: tg[0], ba }))
await tr.close(); may.close()
