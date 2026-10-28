#!/usr/bin/env node
// ĐO MỞ APP HỌC SINH «TỨC THÌ» (thầy chụp 28/10: mở app thấy màn trắng — «Vẫn chưa tức thì»).
//
// Khác do-muot-hs.mjs: CÓ service worker (như app đã cài trên máy em) và đo TỪNG KHUNG HÌNH lúc mở lại:
//   · fcp           — khung đầu có vẽ (paint)
//   · khungDau      — khung đầu thấy Lộ trình (nút «Học tiếp»): ảnh tĩnh đã lưu (#khung-tinh-hs) HOẶC bản React thật
//   · reactLen      — khung đầu thấy Lộ trình do React vẽ (trong #root)
//   · chamDuoc      — tới chạm được (hết tác vụ dài sau reactLen, cửa sổ yên 3 s — cùng hàm `tti` của do-muot-hs.mjs)
//   · khungTrang    — số khung TRẮNG (không thấy Lộ trình) xen giữa lúc đã thấy Lộ trình (nháy) — phải = 0
// Kịch bản: máy mới mở /hs → đăng nhập → Lộ trình → chờ service worker cài xong + điều khiển trang → mở lại `--lan` lượt (trung vị).
// `--khong-anh=1`: xoá ảnh tĩnh đã lưu trước mỗi lượt mở lại (đo khung xương / bản trước khi có ảnh tĩnh).
// Máy chủ app GIẢ (scripts/do-app-hs/may-chu-gia.ts), mọi tên miền ánh xạ về máy này — không một byte tới máy chủ thật.
//   node scripts/do-mo-tuc-thi-hs.mjs --dist=dist [--cpu=4] [--mang=fast3g|slow3g] [--lan=3] [--khong-anh=1] [--ra=kq.json] [--chup=<thư mục>]
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(arg('dist', 'dist'))
const CPU = Number(arg('cpu', '4'))
const MANG = arg('mang', 'fast3g')
const LAN = Number(arg('lan', '3'))
const KHONG_ANH = arg('khong-anh', '') === '1'
const RA = arg('ra', '')
const CHUP = arg('chup', '')
const MAY_CHU_MS = Number(arg('may-chu-ms', '60'))
const MAN = { width: 360, height: 740 }
const MANG_GIA = {
  fast3g: { offline: false, latency: 562.5, downloadThroughput: (1.6 * 1024 * 1024 * 0.9) / 8, uploadThroughput: (750 * 1024 * 0.9) / 8 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: (500 * 1024 * 0.8) / 8, uploadThroughput: (500 * 1024 * 0.8) / 8 },
  khong: { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
}[MANG]

function timChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM
  const goc = '/opt/pw-browsers'
  if (!existsSync(goc)) return undefined
  for (const d of readdirSync(goc).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const p = join(goc, d, 'chrome-linux', 'chrome')
    if (existsSync(p)) return p
  }
}

const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' }
const NEN = new Set(['.js', '.css', '.html', '.json', '.svg', '.mjs', '.webmanifest'])
const dem = new Map()
let GIA = null
function chungChi() {
  const k = join(tmpdir(), 'do-muot-khoa.pem'), c = join(tmpdir(), 'do-muot-cert.pem')
  if (!existsSync(k) || !existsSync(c)) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${k} -out ${c} -days 30 -subj /CN=127.0.0.1`, { stdio: 'ignore' })
  return { key: readFileSync(k), cert: readFileSync(c) }
}
const may = createSecureServer({ ...chungChi(), allowHTTP1: true }, async (req, res) => {
  const u = new URL(req.url, 'http://x')
  const host = String(req.headers.host || req.headers[':authority'] || '')
  if (host && !host.startsWith('127.0.0.1') && !/workers\.dev/.test(host)) { res.writeHead(404); return res.end() }
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end() }
  let raw = ''
  for await (const c of req) raw += c
  let body = {}
  try { body = JSON.parse(raw || '{}') } catch {}
  const tl = await GIA.traLoi(u.pathname, body)
  const laLuong = Array.isArray(tl.__ndjson)
  const than = laLuong ? tl.__ndjson.map((x) => JSON.stringify(x)).join('\n') + '\n' : JSON.stringify(tl)
  await new Promise((ok) => setTimeout(ok, MAY_CHU_MS))
  res.writeHead(200, { ...cors, 'content-type': laLuong ? 'application/x-ndjson' : 'application/json' })
  return res.end(than)
}).listen(0, '127.0.0.1')
const mayTinh = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let p = join(DIST, decodeURIComponent(u.pathname))
  if (!p.startsWith(DIST) || !existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html')
  const ext = extname(p)
  let b = dem.get(p)
  if (!b) dem.set(p, (b = { tho: readFileSync(p), gz: NEN.has(ext) ? gzipSync(readFileSync(p), { level: 9 }) : null }))
  const noStore = /sw-version\.json$/.test(u.pathname)
  const h = { 'content-type': LOAI[ext] || 'application/octet-stream', 'cache-control': u.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : noStore ? 'no-store' : 'no-cache' }
  if (b.gz && /gzip/.test(req.headers['accept-encoding'] || '')) { res.writeHead(200, { ...h, 'content-encoding': 'gzip' }); res.end(b.gz) } else { res.writeHead(200, h); res.end(b.tho) }
}).listen(0, '127.0.0.1')
await new Promise((ok) => may.once('listening', ok))
if (!mayTinh.listening) await new Promise((ok) => mayTinh.once('listening', ok))
const CONG = may.address().port
const goc = `http://127.0.0.1:${mayTinh.address().port}`
const vite = await (await import('vite')).createServer({ configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')

/** Theo dõi TỪNG KHUNG (rAF) từ lúc trang bắt đầu: thấy Lộ trình ở ảnh tĩnh hay ở React, khung trắng xen giữa. */
const THEO_DOI = () => {
  const d = (window.__mo = { dauDem: 0, fcp: 0, lcp: 0, dai: [], dauTinh: 0, dauThat: 0, khungTrang: 0, khung: 0, trangCuoi: 0 })
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => e.name === 'first-contentful-paint' && (d.fcp = Math.round(e.startTime)))).observe({ type: 'paint', buffered: true }) } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => (d.lcp = Math.round(e.startTime)))).observe({ type: 'largest-contentful-paint', buffered: true }) } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => d.dai.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }) } catch {}
  // CHỈ đọc cây DOM (không đọc bố cục / kiểu — đọc là ép trình duyệt tính kiểu giữa chừng, làm chậm chính lượt mở đang đo).
  const tim = (g) => {
    if (!g || !g.isConnected) return false
    for (const e of g.querySelectorAll('button,[role=button],a')) if (/^Học tiếp/.test((e.getAttribute('aria-label') || e.textContent || '').trim()) && !e.closest('[hidden],[aria-hidden="true"]:not(#khung-tinh-hs)')) return true
    return false
  }
  const b = (t) => {
    d.khung++
    const lop = document.getElementById('khung-tinh-hs')
    const coTinh = !!lop && (d.dauTinh ? true : tim(lop)) // đã thấy một lần ⇒ chỉ xét lớp phủ còn hay không (bớt việc của bộ đo)
    const coThat = tim(document.getElementById('root'))
    if (coTinh && !d.dauTinh) d.dauTinh = Math.round(t)
    if (coThat && !d.dauThat) d.dauThat = Math.round(t)
    // hàng bộ đếm trên cùng (số của em) — có từ lượt vẽ đầu của React hay hiện muộn (xô bố cục)
    if (coThat && !d.dauDem && document.querySelector('#root .da-tren')) d.dauDem = Math.round(t)
    if (!coTinh && !coThat) { if (d.dauTinh || d.dauThat) d.khungTrang++; d.trangCuoi = Math.round(t) }
    if (t < 30000 && !(d.dauThat && t - d.dauThat > 4000)) requestAnimationFrame(b)
  }
  requestAnimationFrame(b)
}
function tti(dai, tu) {
  let moc = tu
  for (const [t, d] of dai.filter(([t, d]) => t + d >= tu).sort((a, b) => a[0] - b[0])) { if (t > moc + 3000) break; moc = Math.max(moc, t + d) }
  return Math.round(moc)
}

const trinh = await chromium.launch({ headless: true, executablePath: timChromium(), args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors', '--no-proxy-server', `--host-resolver-rules=MAP * 127.0.0.1:${CONG}, EXCLUDE 127.0.0.1`] })
const kq = { dist: DIST, cpu: CPU, mang: MANG, khongAnh: KHONG_ANH, luc: new Date().toISOString(), lan: [] }
const loi = []
/**
 * --anh-so=<thư mục>: ẢNH SO KHUNG TĨNH ↔ LỘ TRÌNH THẬT ở 4 khổ × sáng / tối. Mỗi khổ: đăng nhập → Lộ trình → trang ẩn (app chụp ảnh tĩnh) → mở lại
 * KHÔNG chạy mã chính (chỉ còn lớp phủ: «khung-*.jpg») → mở lại bình thường, chờ React (`that-*.jpg`). In % điểm ảnh lệch (> 24 mức) giữa hai ảnh.
 */
async function anhSo(thuMuc) {
  mkdirSync(thuMuc, { recursive: true })
  const KHO = [[390, 844, 'doc'], [360, 640, 'nho'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']]
  const ra = []
  for (const [w, h, ten] of KHO) for (const nen of ['light', 'dark']) {
    GIA.datLai()
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 900, hasTouch: w < 900, colorScheme: nen, serviceWorkers: 'block', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
    const loiTrang = []
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loiTrang.push(e.message.slice(0, 120)))
    await p.goto(goc + '/hs')
    await p.waitForSelector('input[type="password"]', { timeout: 90000 })
    await p.locator('input').first().fill('99001')
    await p.locator('input[type="password"]').fill('matkhau-gia')
    await p.getByRole('button', { name: /^Đăng nhập$/ }).click()
    await p.waitForSelector('.da-vo[aria-busy="false"]', { timeout: 90000 })
    await p.waitForTimeout(5000)
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    const coAnh = await p.evaluate(() => !!localStorage.getItem('ddh.khung-tinh-hs'))
    // Lớp phủ đứng một mình: bỏ thẻ mã chính khỏi trang trả về.
    await p.route(/\/hs$/, async (r) => { const res = await r.fetch(); const body = (await res.text()).replace(/<script type="module"[^>]*><\/script>/g, ''); await r.fulfill({ response: res, body }) })
    await p.goto(goc + '/hs')
    await p.waitForTimeout(1500)
    const tep1 = join(thuMuc, `khung-${ten}${nen === 'dark' ? '-toi' : ''}.jpg`)
    const anh1 = await p.screenshot({ path: tep1, type: 'jpeg', quality: 70 })
    const tranNgang = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
    await p.unroute(/\/hs$/)
    await p.goto(goc + '/hs')
    await p.waitForSelector('#root .da-vo[aria-busy="false"]', { timeout: 90000 })
    await p.waitForTimeout(6000)
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.waitForTimeout(300)
    const tep2 = join(thuMuc, `that-${ten}${nen === 'dark' ? '-toi' : ''}.jpg`)
    const anh2 = await p.screenshot({ path: tep2, type: 'jpeg', quality: 70 })
    const conLop = await p.evaluate(() => !!document.getElementById('khung-tinh-hs'))
    ra.push({ ten, nen, coAnh, tranNgang, conLop, loiTrang: loiTrang.slice(0, 3), kb: [Math.round(anh1.length / 1024), Math.round(anh2.length / 1024)] })
    await ctx.close()
  }
  return ra
}

try {
  if (arg('anh-so', '')) { kq.anhSo = await anhSo(arg('anh-so', '')); throw Object.assign(new Error('xong'), { xong: true }) }
  GIA.datLai()
  const ctx = await trinh.newContext({ viewport: MAN, screen: MAN, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'allow', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' })
  await ctx.addInitScript(THEO_DOI)
  // 1. Máy mới: đăng nhập, tới Lộ trình, chờ service worker cài xong (không giả mạng / CPU — chỉ chuẩn bị máy).
  {
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    await p.waitForSelector('input[type="password"]', { timeout: 90000 })
    await p.locator('input').first().fill('99001')
    await p.locator('input[type="password"]').fill('matkhau-gia')
    await p.getByRole('button', { name: /^Đăng nhập$/ }).click()
    await p.waitForFunction(() => window.__mo.dauThat > 0, null, { timeout: 90000 })
    await p.evaluate(() => window.dispatchEvent(new Event('ddh-sanh-da-ve')))
    await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 120000, polling: 200 }).catch(async () => {
      await p.reload({ waitUntil: 'commit' })
      await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 60000, polling: 200 })
    })
    // Ảnh tĩnh Lộ trình chụp lúc em rời app (trang ẩn) hoặc lúc rảnh sau 20 giây nếu hôm nay chưa có ⇒ chờ 26 giây như em để app mở.
    await p.waitForTimeout(Number(arg('cho-anh', '26000')))
    await p.close()
  }
  // 2. Mở lại `LAN` lượt (cùng máy: service worker + đăng nhập + đệm Sảnh + ảnh tĩnh đã lưu).
  for (let i = 0; i < LAN + 1; i++) {
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
    // --bo-anh-bi=1: bỏ ảnh linh vật khỏi ảnh tĩnh (đo riêng giá của ảnh SVG)
    if (arg('bo-anh-bi', '') === '1') await p.addInitScript(() => { try { const a = JSON.parse(localStorage.getItem('ddh.khung-tinh-hs') || 'null'); if (a) { a.html = a.html.replace(/<img class="lua-svg bi-tinh"[^>]*>/g, ''); localStorage.setItem('ddh.khung-tinh-hs', JSON.stringify(a)) } localStorage.removeItem('ddh.bi-tinh') } catch {} })
    if (KHONG_ANH) await p.addInitScript(() => { try { for (const k of Object.keys(localStorage)) if (/^ddh\.khung-tinh/.test(k)) localStorage.removeItem(k) } catch {} })
    const cdp = await ctx.newCDPSession(p)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', MANG_GIA)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
    let anh = null
    if (CHUP && i === 1) {
      mkdirSync(CHUP, { recursive: true })
      anh = []
      await cdp.send('Page.enable')
      cdp.on('Page.screencastFrame', async (f) => { anh.push([f.metadata.timestamp, f.data]); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}) })
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 40, maxWidth: 360, maxHeight: 740, everyNthFrame: 1 })
    }
    const hoSo = arg('ho-so', '') === '1' && i === 1
    if (hoSo) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start') }
    const vet = arg('vet', '') === '1' && i === 1
    const sk = []
    if (vet) { cdp.on('Tracing.dataCollected', (e) => sk.push(...e.value)); await cdp.send('Tracing.start', { categories: arg('vet-loai', 'devtools.timeline,blink.user_timing,loading'), transferMode: 'ReportEvents' }) }
    const t0 = Date.now() / 1000
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    // KHÔNG hỏi trang trong 3 giây đầu: mỗi lượt hỏi của Playwright chạy mã trên luồng chính (lượt đầu dịch cả bộ mã tiêm ~40 ms ở CPU ×4) — chen
    // vào đúng lượt mở đang đo (đo 28/10: khung đầu lùi ~100 ms vì bộ đo).
    await p.waitForTimeout(3000)
    await p.waitForFunction(() => window.__mo.dauThat > 0, null, { timeout: 90000, polling: 500 })
    if (vet) {
      // Vết luồng chính tới lúc React dựng: các việc ≥ 4 ms (giờ tính từ lúc điều hướng), để biết khung đầu chờ gì.
      const xong = new Promise((ok) => cdp.once('Tracing.tracingComplete', ok)); await cdp.send('Tracing.end'); await xong
      const dauNav = sk.find((e) => e.name === 'navigationStart' && e.args?.data?.isLoadingMainFrame)?.ts ?? sk.find((e) => e.name === 'navigationStart')?.ts ?? sk.find((e) => e.name === 'ResourceSendRequest')?.ts
      const dem = new Map(); for (const e of sk) if (e.name === 'ParseHTML' || e.name === 'UpdateLayoutTree') dem.set(e.tid, (dem.get(e.tid) || 0) + 1)
      const chinh = [...dem].sort((a, b) => b[1] - a[1])[0]?.[0]
      const ds = sk.filter((e) => (arg('vet-moi-luong', '') === '1' || e.tid === chinh) && e.ph === 'X' && e.dur >= Number(arg('vet-ms', '4')) * 1000 && e.ts >= dauNav && (arg('vet-tat', '') === '1' || /^(ParseHTML|ParseAuthorStyleSheet|EvaluateScript|v8\.compile|v8\.evaluateModule|FunctionCall|UpdateLayoutTree|Layout|Paint|PrePaint|Commit|TimerFire|EventDispatch|FireAnimationFrame|RunTask|HTMLDocumentParser::.*|v8\.run|ScheduleStyleRecalculation|Document::.*|PaintImage|Decode.*|CompositeLayers|UpdateLayer|Layerize)$/.test(e.name)))
      for (const e of ds.sort((a, b) => a.ts - b.ts)) if ((e.ts - dauNav) / 1000 < Number(arg('vet-den', '700')) && (e.ts - dauNav) / 1000 >= Number(arg('vet-tu', '0'))) console.error(`  ${String(Math.round((e.ts - dauNav) / 1000)).padStart(5)} +${String(Math.round(e.dur / 1000)).padStart(4)} ${e.tid === chinh ? '' : '[' + e.tid + '] '}${e.name} ${e.args?.data?.url ? String(e.args.data.url).split('/').pop().slice(0, 40) : e.args?.beginData?.url ? String(e.args.beginData.url).split('/').pop().slice(0, 40) + ':' + (e.args.beginData.startLine ?? '') : ''}`)
      { // tổng theo loại việc (chỉ việc ngoài cùng của luồng chính) tới lúc React dựng Lộ trình
        const tong = new Map(), het = Number(arg('vet-den', '700'))
        const ngoai = sk.filter((e) => e.tid === chinh && e.ph === 'X' && e.dur && e.ts >= dauNav && (e.ts - dauNav) / 1000 < het && /^(ParseHTML|ParseAuthorStyleSheet|EvaluateScript|v8\.evaluateModule|v8\.compileModule|FunctionCall|UpdateLayoutTree|Layout|Paint|PrePaint|TimerFire|EventDispatch|FireAnimationFrame|RunMicrotasks|v8\.run|ResourceFetcher::requestResource|IsolatedSVGDocumentHost::IsolatedSVGDocumentHost)$/.test(e.name))
        for (const e of ngoai) tong.set(e.name, (tong.get(e.name) || 0) + e.dur / 1000)
        console.error('TỔNG tới ' + het + ' ms: ' + [...tong].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v)}`).join(' · '))
      }
      for (const e of sk.filter((e) => /firstContentfulPaint|firstPaint|largestContentfulPaint::Candidate/.test(e.name))) console.error(`  ${Math.round((e.ts - dauNav) / 1000)} ${e.name}`)
    }
    if (hoSo) {
      // Hồ sơ CPU tới lúc React dựng Lộ trình: tự thân theo hàm (tệp:dòng) + theo tệp, chỉ phần trước `--ho-so-den` ms (mặc định 700).
      const { profile } = await cdp.send('Profiler.stop')
      const den = Number(arg('ho-so-den', '700')) * 1000
      const theoId = new Map(profile.nodes.map((n) => [n.id, n])), tu = new Map(), tep = new Map()
      let t = 0
      const tuMs = Number(arg('ho-so-tu', '0')) * 1000
      profile.samples.forEach((id, k) => { t += profile.timeDeltas[k] || 0; if (t - (profile.timeDeltas[0] || 0) > den || t - (profile.timeDeltas[0] || 0) < tuMs) return
        const cf = theoId.get(id).callFrame, ms = (profile.timeDeltas[k] || 0) / 1000, f = String(cf.url || '').split('/').pop() || '(native)'
        const key = `${cf.functionName || '(anon)'} ${f}:${cf.lineNumber + 1}:${cf.columnNumber + 1}`
        tu.set(key, (tu.get(key) || 0) + ms); tep.set(f, (tep.get(f) || 0) + ms) })
      const inB = (m, n) => [...m].filter(([k]) => !/\(idle\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `  ${v.toFixed(1).padStart(7)} ${k}`).join('\n')
      const cha = new Map(); for (const n of profile.nodes) for (const c of n.children || []) cha.set(c, n.id)
      const goiBoi = new Map(); t = 0
      profile.samples.forEach((id, k) => { t += profile.timeDeltas[k] || 0; if (t - (profile.timeDeltas[0] || 0) > den) return
        const n = theoId.get(id); if (!/^(appendChild|insertBefore|getBoundingClientRect|setAttribute|write)$/.test(n.callFrame.functionName)) return
        const ds = []; let x = cha.get(id); for (let q = 0; q < 3 && x; q++) { const cf = theoId.get(x).callFrame; ds.push(`${cf.functionName || '(anon)'}@${String(cf.url).split('/').pop()}:${cf.lineNumber + 1}:${cf.columnNumber + 1}`); x = cha.get(x) }
        const key = n.callFrame.functionName + ' ← ' + ds.join(' ← '); goiBoi.set(key, (goiBoi.get(key) || 0) + (profile.timeDeltas[k] || 0) / 1000) })
      console.error('GỌI BỞI:\n' + [...goiBoi].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `  ${v.toFixed(1).padStart(7)} ${k}`).join('\n'))
      console.error(`HỒ SƠ ${den / 1000} ms đầu — tự thân:\n${inB(tu, 25)}\nTHEO TỆP:\n${inB(tep, 12)}`)
    }
    await p.waitForTimeout(4000)
    if (arg('kham', '') === '1' && i === LAN) console.error('KHÁM', JSON.stringify(await p.evaluate(() => {
      const ds = [...document.querySelectorAll('#root *')], H = innerHeight
      const ngoai = ds.filter((e) => { const r = e.getBoundingClientRect(); return r.top > H + 120 })
      return { svgs: [...document.querySelectorAll('#root svg')].map((v) => [String(v.className?.baseVal || v.parentElement?.className || '').slice(0, 25), v.querySelectorAll('*').length]).filter((x) => x[1] > 6), tong: ds.length, duoiMan: ngoai.length, cao: document.documentElement.scrollHeight, H, mau: ngoai.slice(0, 5).map((e) => e.tagName + '.' + String(e.className?.baseVal ?? e.className).slice(0, 30)) }
    })))
    if (anh) {
      await cdp.send('Page.stopScreencast').catch(() => {})
      for (const [ts, data] of anh) writeFileSync(join(CHUP, `k-${String(Math.round((ts - t0) * 1000)).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'))
    }
    const d = await p.evaluate(() => ({ ...window.__mo, anhLuu: (() => { try { const a = JSON.parse(localStorage.getItem('ddh.khung-tinh-hs') || 'null'); if (!a) return null; const t = document.createElement('div'); t.innerHTML = a.html; return { kyTu: a.html.length, css: (a.css || '').length, nut: t.getElementsByTagName('*').length, svg: t.querySelectorAll('svg *').length } } catch { return null } })(), lsKyTu: Object.keys(localStorage).reduce((n, k) => n + (localStorage.getItem(k) || '').length, 0), swDieuKhien: !!navigator.serviceWorker.controller, css: [...document.querySelectorAll('link[rel=stylesheet],style')].map((e) => e.tagName === 'STYLE' ? 'style:' + e.textContent.length : e.getAttribute('href').split('/').pop()),
      moc: [['html', Math.round(performance.getEntriesByType('navigation')[0]?.responseEnd || 0)], ...performance.getEntriesByType('mark').map((m) => [m.name, Math.round(m.startTime)]), ['dcl', Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0)],
        ...performance.getEntriesByType('resource').filter((e) => /\/assets\/(index|AppHocSinh|StudentPortalScreen|TrongHs|react)-[^/]+\.(js|css)$|workers\.dev/.test(e.name)).map((e) => [e.name.split('/').pop().replace(/-[\w-]{8}\./, '.'), Math.round(e.startTime), Math.round(e.responseEnd)])] }))
    const dong = { fcp: d.fcp, lcp: d.lcp, khungDau: Math.min(...[d.dauTinh, d.dauThat].filter(Boolean)), anhTinh: d.dauTinh || null, reactLen: d.dauThat, chamDuoc: tti(d.dai, d.dauThat), khungTrang: d.khungTrang, hangDem: d.dauDem, vetDem: d.vetDem, dai: d.dai.filter(([t, du]) => t + du >= d.dauThat - 300).map(([t, du]) => `${t}+${du}`).join(' '), sw: d.swDieuKhien, moc: d.moc, css: d.css, anhLuu: d.anhLuu, lsKyTu: d.lsKyTu }
    if (i > 0) kq.lan.push(dong) // lượt 0: khởi động nóng (bỏ, như máy thật đã mở app nhiều lần)
    await p.close()
  }
  const giua = (k) => { const s = kq.lan.map((x) => x[k]).filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null }
  kq.tom = Object.fromEntries(['fcp', 'lcp', 'khungDau', 'anhTinh', 'reactLen', 'chamDuoc'].map((k) => [k, giua(k)]))
  kq.tom.khungTrangMax = Math.max(0, ...kq.lan.map((x) => x.khungTrang))
  await ctx.close()
} catch (e) {
  if (!e.xong) kq.loiChay = String(e.message).slice(0, 300)
} finally {
  kq.loi = loi.slice(0, 5)
  await trinh.close(); may.close(); mayTinh.close(); await vite.close()
}
if (kq.lan[0]) console.error('ảnh lưu:', JSON.stringify(kq.lan[0].anhLuu), 'localStorage (ký tự):', kq.lan[0].lsKyTu)
if (RA) writeFileSync(RA, JSON.stringify(kq, null, 1))
console.log(JSON.stringify({ cpu: CPU, mang: MANG, khongAnh: KHONG_ANH, tom: kq.tom, anhSo: kq.anhSo, loiChay: kq.loiChay, loi: kq.loi }))
