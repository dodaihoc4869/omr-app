#!/usr/bin/env node
// ĐO MOL SỐNG ĐỘNG TRONG APP THẬT (02/11 — thầy «đảm bảo máy siêu yếu cũng hoạt động được»): bản build (dist/) trên Chromium, máy chủ app GIẢ
// (scripts/do-app-hs/may-chu-gia.ts, như scripts/do-muot-hs.mjs — không một byte tới máy chủ thật), khổ 390 × 844, CPU ×N (CDP setCPUThrottlingRate).
//   Lộ trình: đứng yên 3 s · chạm Mol 3 lần (3 s) · tay / chuột lướt trên trang 2,5 s (mắt dõi theo — máy thường) · 4 s sau tương tác (vòng phải TẮT) ·
//             vuốt ngón tay 3 s (Lộ trình 390 × 844 vừa một màn ⇒ không cuộn: đo mắt dõi ngón tay; --vet-cuon=1 in sự kiện). Màn làm câu: đứng yên 3 s ·
//             chạm phương án (1,5 s).
//   Mỗi khung đo: khung p50 / p95 / > 50 ms, thời gian JS mỗi khung (CDP Performance ScriptDuration ÷ số khung), rAF / giây, hoạt ảnh vô hạn đang chạy.
//   node docs/mol-song-dong-0211/do-mol.mjs --dist=dist --cpu=6 --yeu=1 [--ra=kq.json] [--chup=<thư mục ảnh>]
//   --yeu=1: giả RAM 2 GB / 4 luồng (app tự bật chế độ máy yếu như máy em) · --chup: ảnh Lộ trình 390 sáng / tối, màn làm câu, avatar (CPU ×1).
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(arg('dist', 'dist')), CPU = Number(arg('cpu', '6')), YEU = arg('yeu', '1') === '1', RA = arg('ra', ''), CHUP = arg('chup', '')
const MAN = { width: 390, height: 844 }
const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' }
let GIA = null
function chungChi() {
  const k = join(tmpdir(), 'do-muot-khoa.pem'), c = join(tmpdir(), 'do-muot-cert.pem')
  if (!existsSync(k) || !existsSync(c)) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${k} -out ${c} -days 30 -subj /CN=127.0.0.1`, { stdio: 'ignore' })
  return { key: readFileSync(k), cert: readFileSync(c) }
}
const may = createSecureServer({ ...chungChi(), allowHTTP1: true }, async (req, res) => {
  const u = new URL(req.url, 'http://x'), host = String(req.headers.host || req.headers[':authority'] || '')
  if (host && !host.startsWith('127.0.0.1') && !/workers\.dev/.test(host)) { res.writeHead(404); return res.end() }
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end() }
  if (u.pathname.startsWith('/api/')) u.pathname = u.pathname.slice(4)
  let raw = ''
  for await (const c of req) raw += c
  let body = {}
  try { body = JSON.parse(raw || '{}') } catch { /* rỗng */ }
  const tl = await GIA.traLoi(u.pathname, body)
  const than = Array.isArray(tl.__ndjson) ? tl.__ndjson.map((x) => JSON.stringify(x)).join('\n') + '\n' : JSON.stringify(tl)
  await new Promise((ok) => setTimeout(ok, 60))
  res.writeHead(200, { ...cors, 'content-type': Array.isArray(tl.__ndjson) ? 'application/x-ndjson' : 'application/json' })
  res.end(than)
}).listen(0, '127.0.0.1')
const dem = new Map()
const mayTinh = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let p = join(DIST, decodeURIComponent(u.pathname))
  if (!p.startsWith(DIST) || !existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html')
  const ext = extname(p)
  let b = dem.get(p)
  if (!b) dem.set(p, (b = { tho: readFileSync(p), gz: ['.js', '.css', '.html', '.json', '.svg'].includes(ext) ? gzipSync(readFileSync(p)) : null }))
  const h = { 'content-type': LOAI[ext] || 'application/octet-stream', 'cache-control': u.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' }
  if (b.gz && /gzip/.test(req.headers['accept-encoding'] || '')) { res.writeHead(200, { ...h, 'content-encoding': 'gzip' }); res.end(b.gz) } else { res.writeHead(200, h); res.end(b.tho) }
}).listen(0, '127.0.0.1')
await new Promise((ok) => may.once('listening', ok))
if (!mayTinh.listening) await new Promise((ok) => mayTinh.once('listening', ok))
const goc = `http://127.0.0.1:${mayTinh.address().port}`
const vite = await (await import('vite')).createServer({ configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')

const TIM = (chon) => {
  const hien = (e) => !!e && (e.offsetWidth || e.offsetHeight || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden'
  if (chon.startsWith('re=')) { const re = new RegExp(chon.slice(3)); return [...document.querySelectorAll('button,[role=button],a')].filter(hien).find((e) => re.test((e.getAttribute('aria-label') || e.textContent).trim())) || null }
  return [...document.querySelectorAll(chon)].find(hien) || null
}
const TIM_CHU = TIM.toString()
const toaDo = (p, chon, cuon = true) => p.evaluate(({ chon, TIM_CHU, cuon }) => {
  const e = new Function('return ' + TIM_CHU)()(chon)
  if (!e) return null
  if (cuon) { const r0 = e.getBoundingClientRect(); if (r0.top < 70 || r0.bottom > innerHeight - 80) e.scrollIntoView({ block: 'center' }) }
  const r = e.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, top: r.top, left: r.left }
}, { chon, TIM_CHU, cuon })
async function cham(p, chon, han = 60000) {
  const t = Date.now()
  let r
  while (!(r = await toaDo(p, chon))) { if (Date.now() - t > han) throw new Error('Không thấy: ' + chon); await p.waitForTimeout(80) }
  await p.touchscreen.tap(r.x, r.y)
}
const choThay = (p, chon, han = 120000) => p.waitForFunction(({ chon, TIM_CHU }) => !!new Function('return ' + TIM_CHU)()(chon), { chon, TIM_CHU }, { polling: 50, timeout: han })
const DO_TRONG_TRANG = () => {
  const d = (window.__do = { raf: 0, dai: [] })
  const g = window.requestAnimationFrame.bind(window)
  window.__rafGoc = g
  window.requestAnimationFrame = (f) => { d.raf++; return g(f) }
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => d.dai.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }) } catch { /* không có */ }
}
/** Một cửa đo `ms`: khung (rAF gốc), JS (CDP ScriptDuration), rAF của app, tác vụ dài; `lam` chạy song song. */
async function cua(p, cdp, ms, lam) {
  const so = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
  const m0 = await so(), r0 = await p.evaluate(() => [window.__do.raf, performance.now()])
  const [k] = await Promise.all([p.evaluate((ms) => new Promise((xong) => {
    const ds = []; let truoc = performance.now(); const dau = truoc, raf = window.__rafGoc
    const b = (t) => { ds.push(t - truoc); truoc = t; if (t - dau < ms) raf(b); else { const s = ds.slice(1).sort((a, c) => a - c); const q = (x) => Math.round(s[Math.min(s.length - 1, Math.floor(s.length * x))] || 0); xong({ khung: s.length, p50: q(0.5), p95: q(0.95), tren50: s.filter((x) => x > 50).length, max: Math.round(s[s.length - 1] || 0) }) } }
    raf(b)
  }), ms), lam ? lam() : null])
  const m1 = await so(), r1 = await p.evaluate(() => [window.__do.raf, performance.now(), window.__do.dai.slice()])
  const js = (m1.ScriptDuration - m0.ScriptDuration) * 1000, giay = (r1[1] - r0[1]) / 1000
  const tinh = await p.evaluate(() => {
    const a = document.getAnimations().filter((x) => x.playState === 'running')
    return { voHan: a.filter((x) => x.effect?.getComputedTiming?.().iterations === Infinity).length, molChay: document.querySelectorAll('.mol-svg[data-song]').length, cheDo: [...new Set([...document.querySelectorAll('.mol-svg')].map((s) => s.getAttribute('data-che-do') || 'cu'))].join(',') }
  })
  return { ...k, jsMs: Math.round(js), jsMoiKhung: +(js / Math.max(1, k.khung)).toFixed(2), rafGiay: Math.round((r1[0] - r0[0] - 0) / giay), daiTren50: r1[2].filter(([t, d]) => t >= r0[1] && d > 50).length, ...tinh }
}

const trinh = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors', '--no-proxy-server', `--host-resolver-rules=MAP * 127.0.0.1:${may.address().port}, EXCLUDE 127.0.0.1`] })
async function moTrang(sc = 'light', cpu = CPU) {
  const ctx = await trinh.newContext({ viewport: MAN, screen: MAN, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', ignoreHTTPSErrors: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', colorScheme: sc,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' })
  await ctx.addInitScript(DO_TRONG_TRANG)
  await ctx.addInitScript((yeu) => {
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => (yeu ? 2 : 8), configurable: true })
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => (yeu ? 4 : 8), configurable: true })
  }, YEU)
  const p = await ctx.newPage(), cdp = await ctx.newCDPSession(p)
  const loi = []
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  await cdp.send('Performance.enable')
  GIA.datLai()
  await p.goto(goc + '/hs', { waitUntil: 'commit' })
  await choThay(p, 'input[type="password"]')
  await p.locator('input').first().fill('99001')
  await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
  await cham(p, 're=^Đăng nhập$')
  await choThay(p, 're=^Học tiếp')
  await p.waitForTimeout(5000)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  return { ctx, p, cdp, loi }
}
const MOL = '.da-linh-vat[data-lv="bi"] svg.lua-svg'
const kq = { dist: DIST, cpu: CPU, mayYeu: YEU, luc: new Date().toISOString() }
try {
  if (CHUP) {
    mkdirSync(CHUP, { recursive: true })
    for (const sc of ['light', 'dark']) {
      const { ctx, p } = await moTrang(sc, 1)
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500)
      await p.screenshot({ path: join(CHUP, `lo-trinh-390-${sc === 'light' ? 'sang' : 'toi'}.jpg`), type: 'jpeg', quality: 72 })
      if (sc === 'light') {
        const v = await toaDo(p, '.bi.lua[data-khung="tron"]', false)
        if (v) await p.screenshot({ path: join(CHUP, 'avatar.jpg'), type: 'jpeg', quality: 85, clip: { x: Math.max(0, v.left - 60), y: Math.max(0, v.top - 14), width: v.w + 76, height: v.h + 28 } })
        const r = await toaDo(p, MOL)
        if (r) { await p.waitForTimeout(500); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(260); await p.screenshot({ path: join(CHUP, 'lo-trinh-cham-mol.jpg'), type: 'jpeg', quality: 72 }) }
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800)
        await cham(p, 're=^Học tiếp')
        await choThay(p, '[role="radio"], .da-pop-nut')
        if (!(await p.evaluate(() => !!document.querySelector('[role="radio"]')))) { await p.waitForTimeout(400); await cham(p, 're=^(Bắt đầu|Tiếp tục|BẮT ĐẦU|TIẾP TỤC)$') }
        await choThay(p, '[role="radio"]'); await p.waitForTimeout(1500)
        await p.screenshot({ path: join(CHUP, 'man-lam-cau.jpg'), type: 'jpeg', quality: 72 })
      }
      await ctx.close()
    }
  }
  const { ctx, p, cdp, loi } = await moTrang('light')
  // Lộ trình
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1200)
  const r = await toaDo(p, MOL); await p.waitForTimeout(1500)
  kq.loTrinh = { yen: await cua(p, cdp, 3000) }
  kq.loTrinh.chamMol = await cua(p, cdp, 3000, async () => { if (!r) return; for (let i = 0; i < 3; i++) { await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(800) } })
  await p.waitForTimeout(4000)
  kq.loTrinh.tay = await cua(p, cdp, 2500, async () => { for (let i = 0; i < 40; i++) { await p.mouse.move(60 + (i * 37) % 280, 200 + (i * 53) % 420); await p.waitForTimeout(50) } })
  await p.waitForTimeout(4500)
  kq.loTrinh.sauTuongTac = await cua(p, cdp, 2000)
  if (arg('vet-cuon', '')) await p.evaluate(() => { const d = (window.__vc = { cuon: 0, su: {}, mol: [] }); for (const t of ['pointerdown', 'pointermove', 'pointercancel', 'pointerup']) addEventListener(t, (e) => { const k = t + ':' + e.pointerType + ':' + (e.target.closest?.('.mol-svg') ? 'mol' : 'khac'); d.su[k] = (d.su[k] || 0) + 1 }, true); addEventListener('scroll', () => d.cuon++, true); const id = setInterval(() => d.mol.push(document.querySelectorAll('.mol-svg[data-song]').length), 250); setTimeout(() => clearInterval(id), 3500) })
  kq.loTrinh.cuon = await cua(p, cdp, 3000, async () => { const het = Date.now() + 2700; let len = false
    while (Date.now() < het) { await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 420, yDistance: len ? 400 : -400, speed: 800, gestureSourceType: 'touch', repeatCount: 0 }).catch(() => {}); len = !len } })
  if (arg('vet-cuon', '')) kq.vetCuon = await p.evaluate(() => window.__vc)
  // Màn làm câu
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800)
  await cham(p, 're=^Học tiếp')
  await choThay(p, '[role="radio"], .da-pop-nut')
  if (!(await p.evaluate(() => !!document.querySelector('[role="radio"]')))) { await p.waitForTimeout(500); await cham(p, 're=^(Bắt đầu|Tiếp tục|BẮT ĐẦU|TIẾP TỤC)$') }
  await choThay(p, '[role="radio"]'); await p.waitForTimeout(2500)
  kq.lamCau = { yen: await cua(p, cdp, 3000) }
  kq.lamCau.bamPa = await cua(p, cdp, 1500, () => cham(p, '[role="radio"]'))
  kq.loi = loi
  await ctx.close()
} catch (e) { kq.loiChay = String(e?.message || e).slice(0, 300) }
await trinh.close(); await vite.close(); may.close(); mayTinh.close()
const s = JSON.stringify(kq)
if (RA) writeFileSync(RA, JSON.stringify(kq, null, 1))
console.log(s)
process.exit(0)
