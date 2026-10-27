#!/usr/bin/env node
// ĐO ĐỘ MƯỢT APP HỌC SINH (27/10, thầy: «TỐI ƯU CHUYÊN SÂU TỐC ĐỘ, ĐỘ MƯỢT TỨC THÌ NHƯ APP CŨ … máy cấu hình yếu siêu mượt siêu tức thì»).
//
// Chạy BẢN BUILD THẬT (dist/) trên Chromium của Playwright, máy chủ app GIẢ (scripts/do-app-hs/may-chu-gia.ts — không một byte tới máy chủ thật).
// Một lượt = một mức CPU (CDP setCPUThrottlingRate) × một mạng (Fast 3G / Slow 3G), khổ 360×740:
//   1. Mở ĐẦU (máy mới): tải tới màn đăng nhập (byte JS/CSS/phông/ảnh, FCP) → đăng nhập → Lộ trình (tới nội dung, tới chạm được = TTI).
//   2. Mở LẠI (đã đăng nhập, bộ nhớ đệm HTTP ấm): tới nội dung đầu, tới chạm được, byte qua mạng.
//   3. Lộ trình đứng yên: số nút DOM, rAF chạy nền (lượt/giây), hoạt ảnh CSS vô hạn đang chạy, khung khi đứng yên; vuốt cuộn 4 s: khung p50/p95, khung > 50 ms.
//   4. Bấm «Học tiếp» → câu đầu hiện (chuyển màn).
//   5. Làm 4 câu: bấm phương án (phản hồi = Event Timing: từ chạm tới khung vẽ kế), «Kiểm tra» → dải kết quả, «Tiếp tục» → câu kế (chuyển câu);
//      khung trong 1,5 s hiệu ứng thưởng; tác vụ dài > 100 ms khi bấm.
//   node scripts/do-muot-hs.mjs --dist=dist [--cpu=6] [--mang=fast3g|slow3g] [--may-chu-ms=60] [--yeu=1|0] [--ra=kq.json]
// Chẩn đoán: --ho-so=bamPa|kiem|tiep (CPU profile câu 2: hàm tốn nhất + ai gọi getBoundingClientRect/removeChild/setAttribute) · --vet-tl=1 (vết Chrome:
//   tính kiểu / bố cục lớn + lý do mất hiệu lực kiểu) · --ghi-vet=<tệp.json> · --chon-loc=1 (thống kê bộ chọn CSS) · --thu-css=1 (một lượt tính kiểu
//   cả trang tốn bao nhiêu, bỏ từng tờ CSS / ẩn giám thị / ẩn Lộ trình) · --kham=1 (ai gọi rAF) · --vet=1 (in từng yêu cầu) · --chup-loi=<ảnh.jpg>.
// Trang tĩnh phục vụ qua HTTP thường (bộ nhớ đệm HTTP chạy như máy thật); máy chủ app giả qua HTTPS, Chromium ánh xạ MỌI tên miền về máy này
// (--host-resolver-rules, --no-proxy-server) ⇒ không một yêu cầu nào ra ngoài.
// `--yeu`: giả RAM 2 GB / 4 luồng (app tự bật chế độ máy yếu như máy em) — mặc định bật khi CPU ≥ 6.
// Chromium: PW_CHROMIUM hoặc /opt/pw-browsers/chromium-*/chrome-linux/chrome.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(arg('dist', 'dist'))
const CPU = Number(arg('cpu', '6'))
const MANG = arg('mang', 'fast3g')
const YEU = arg('yeu', CPU >= 6 ? '1' : '0') === '1'
const RA = arg('ra', '')
const MAY_CHU_MS = Number(arg('may-chu-ms', '60'))
const MAN = { width: 360, height: 740 }
const MANG_GIA = {
  // DevTools «Fast 3G» (= «Slow 4G» của Lighthouse): 562,5 ms RTT, 1,44 Mb/s xuống.
  fast3g: { offline: false, latency: 562.5, downloadThroughput: (1.6 * 1024 * 1024 * 0.9) / 8, uploadThroughput: (750 * 1024 * 0.9) / 8 },
  // DevTools «Slow 3G»: 2 000 ms RTT, 400 kb/s xuống.
  slow3g: { offline: false, latency: 2000, downloadThroughput: (500 * 1024 * 0.8) / 8, uploadThroughput: (500 * 1024 * 0.8) / 8 },
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

// Máy chủ tĩnh: gzip như Pages, đường SPA ⇒ index.html.
const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' }
const NEN = new Set(['.js', '.css', '.html', '.json', '.svg', '.mjs', '.webmanifest'])
const dem = new Map()
// Máy chủ app GIẢ: Chromium ánh xạ omr.ttadodaihoc.workers.dev về máy này (--host-resolver-rules) — KHÔNG dùng page.route
// (Playwright tắt bộ nhớ đệm HTTP khi có route ⇒ «mở lại» đo sai). Lệnh giả đi qua mạng giả lập của CDP như yêu cầu thật; + thời gian máy chủ.
let GIA = null
function chungChi() {
  const k = join(tmpdir(), 'do-muot-khoa.pem'), c = join(tmpdir(), 'do-muot-cert.pem')
  if (!existsSync(k) || !existsSync(c)) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${k} -out ${c} -days 30 -subj /CN=127.0.0.1`, { stdio: 'ignore' })
  return { key: readFileSync(k), cert: readFileSync(c) }
}
const may = createSecureServer({ ...chungChi(), allowHTTP1: true }, async (req, res) => {
  const u = new URL(req.url, 'http://x')
  const host = String(req.headers.host || req.headers[':authority'] || '')
  if (arg('vet', '')) console.error('YC', host, u.pathname)
  if (host && !host.startsWith('127.0.0.1') && !/workers\.dev/.test(host)) { res.writeHead(404); return res.end() } // mọi máy chủ ngoài: chặn
  if (/workers\.dev/.test(host) || u.pathname.startsWith('/api/')) {
    if (u.pathname.startsWith('/api/')) u.pathname = u.pathname.slice(4)
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
  }
  res.writeHead(404); res.end()
}).listen(0, '127.0.0.1')
const mayTinh = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let p = join(DIST, decodeURIComponent(u.pathname))
  if (!p.startsWith(DIST) || !existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html')
  const ext = extname(p)
  let b = dem.get(p)
  if (!b) dem.set(p, (b = { tho: readFileSync(p), gz: NEN.has(ext) ? gzipSync(readFileSync(p), { level: 9 }) : null }))
  const h = { 'content-type': LOAI[ext] || 'application/octet-stream', 'cache-control': u.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' }
  if (b.gz && /gzip/.test(req.headers['accept-encoding'] || '')) { res.writeHead(200, { ...h, 'content-encoding': 'gzip' }); res.end(b.gz) } else { res.writeHead(200, h); res.end(b.tho) }
}).listen(0, '127.0.0.1')
await new Promise((ok) => may.once('listening', ok))
if (!mayTinh.listening) await new Promise((ok) => mayTinh.once('listening', ok))
const CONG = may.address().port
// Trang tĩnh qua HTTP thường (127.0.0.1 là ngữ cảnh an toàn) ⇒ bộ nhớ đệm HTTP hoạt động như máy thật (Chrome KHÔNG đệm tệp từ nguồn lỗi chứng chỉ).
const goc = `http://127.0.0.1:${mayTinh.address().port}`

const vite = await (await import('vite')).createServer({ configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')

const DO_TRONG_TRANG = () => {
  const d = (window.__do = { dai: [], fcp: 0, sk: [], raf: 0 })
  const goc = window.requestAnimationFrame.bind(window)
  window.__rafGoc = goc
  window.requestAnimationFrame = (f) => { d.raf++; return goc(f) }
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => d.dai.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }) } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => e.name === 'first-contentful-paint' && (d.fcp = Math.round(e.startTime)))).observe({ type: 'paint', buffered: true }) } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => e.interactionId && d.sk.push([e.name, Math.round(e.startTime), Math.round(e.duration), e.interactionId, Math.round(e.processingEnd - e.startTime)]))).observe({ type: 'event', buffered: true, durationThreshold: 16 }) } catch {}
}

const TIM = (chon) => {
  const hien = (e) => !!e && (e.offsetWidth || e.offsetHeight || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden'
  if (chon.startsWith('re=')) {
    const re = new RegExp(chon.slice(3))
    return [...document.querySelectorAll('button,[role=button],a')].filter(hien).find((e) => re.test((e.getAttribute('aria-label') || e.textContent).trim())) || null
  }
  return [...document.querySelectorAll(chon)].find(hien) || null
}
const TIM_CHU = TIM.toString()
const toaDo = (p, chon) => p.evaluate(({ chon, TIM_CHU }) => {
  const e = new Function('return ' + TIM_CHU)()(chon)
  if (!e) return null
  const r0 = e.getBoundingClientRect()
  if (r0.top < 60 || r0.bottom > innerHeight - 10) e.scrollIntoView({ block: 'center' })
  const r = e.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}, { chon, TIM_CHU })
async function cham(p, chon, han = 60000) {
  const t = Date.now()
  let r
  while (!(r = await toaDo(p, chon))) { if (Date.now() - t > han) throw new Error('Không thấy: ' + chon); await p.waitForTimeout(80) }
  await p.touchscreen.tap(r.x, r.y)
}
const choThay = async (p, chon, han = 120000) => (await p.waitForFunction(({ chon, TIM_CHU }) => (new Function('return ' + TIM_CHU)()(chon) ? performance.now() : 0), { chon, TIM_CHU }, { polling: 16, timeout: han })).jsonValue()
const bayGio = (p) => p.evaluate(() => performance.now())
const layDo = (p) => p.evaluate(() => ({ dai: window.__do.dai.slice(), sk: window.__do.sk.slice(), fcp: window.__do.fcp }))
const daiNhat = (dai, tu = 0, den = Infinity) => dai.filter(([t]) => t >= tu && t <= den).reduce((m, [, d]) => Math.max(m, d), 0)
const soDai = (dai, nguong, tu = 0, den = Infinity) => dai.filter(([t, d]) => t >= tu && t <= den && d > nguong).length
function tti(dai, tu) {
  let moc = tu
  for (const [t, d] of dai.filter(([t, d]) => t + d >= tu).sort((a, b) => a[0] - b[0])) { if (t > moc + 3000) break; moc = Math.max(moc, t + d) }
  return Math.round(moc)
}
const inpTu = (sk, tu) => { const m = new Map(); for (const [, t, d, id] of sk) if (t >= tu - 5) m.set(id, Math.max(m.get(id) || 0, d)); return Math.max(0, ...m.values()) }
/** Phần CPU của lượt chạm (chờ vào + xử lý sự kiện, không gồm vẽ khung): processingEnd − startTime. */
const xuLyTu = (sk, tu) => { let m = 0; for (const [, t, , , x] of sk) if (t >= tu - 5) m = Math.max(m, x || 0); return m }
const taiTheoLoai = (p, den = Infinity) => p.evaluate((den) => {
  const o = { js: 0, css: 0, phong: 0, anh: 0, khac: 0, tep: 0 }
  for (const e of performance.getEntriesByType('resource')) {
    if (e.responseEnd > den || !e.transferSize) continue
    const n = e.name.split('?')[0], b = e.transferSize
    o.tep++
    if (/\.m?js$/.test(n)) o.js += b; else if (/\.css$/.test(n)) o.css += b; else if (/\.(woff2?|ttf)$/.test(n)) o.phong += b; else if (/\.(png|webp|jpe?g|svg|gif|avif)$/.test(n)) o.anh += b; else if (!/workers\.dev/.test(n)) o.khac += b
  }
  for (const k of ['js', 'css', 'phong', 'anh', 'khac']) o[k] = Math.round(o[k] / 1024)
  return o
}, den)

/** Ghi khung (rAF gốc, không đếm vào rAF nền) trong `ms`. */
const doKhung = (p, ms) => p.evaluate((ms) => new Promise((xong) => {
  const ds = []; let truoc = performance.now(); const dau = truoc
  const raf = window.__rafGoc || requestAnimationFrame
  const b = (t) => { ds.push(t - truoc); truoc = t; if (t - dau < ms) raf(b); else { const s = ds.slice(1).sort((a, c) => a - c); const q = (x) => Math.round(s[Math.min(s.length - 1, Math.floor(s.length * x))] || 0)
    xong({ khung: s.length, p50: q(0.5), p95: q(0.95), tren50: s.filter((x) => x > 50).length, max: Math.round(s[s.length - 1] || 0) }) } }
  raf(b)
}), ms)
/** Đứng yên: nút DOM, rAF nền (lượt/giây, không tính bộ đo), hoạt ảnh vô hạn đang chạy, khung 3 s. */
const KHAM = arg('kham', '') === '1'
const HO_SO = arg('ho-so', '')
async function batHoSo(cdp, ten) { if (HO_SO !== ten) return
  if (arg('vet-tl', '') === '1') { const sk = []; cdp.on('Tracing.dataCollected', (e) => sk.push(...e.value)); cdp.__sk = sk; await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,blink' + (arg('chon-loc', '') ? ',disabled-by-default-blink.debug' : ''), transferMode: 'ReportEvents' }) }
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start') }
async function inHoSo(cdp, ten) {
  if (HO_SO !== ten) return
  if (cdp.__sk) {
    const xong = new Promise((ok) => cdp.once('Tracing.tracingComplete', ok)); await cdp.send('Tracing.end'); await xong
    const sk = cdp.__sk, dem = new Map()
    for (const e of sk) if (e.name === 'Layout' || e.name === 'UpdateLayoutTree') dem.set(e.tid, (dem.get(e.tid) || 0) + 1)
    const chinh = [...dem].sort((a, b) => b[1] - a[1])[0]?.[0]
    const theoTen = new Map(), lay = []
    for (const e of sk) {
      if (e.tid !== chinh || e.ph !== 'X' || !e.dur) continue
      theoTen.set(e.name, (theoTen.get(e.name) || 0) + e.dur / 1000)
      if (e.name === 'Layout' || e.name === 'UpdateLayoutTree') { const st = e.args?.beginData?.stackTrace?.[0]; lay.push([Math.round(e.dur / 1000), e.name, st ? `${st.functionName}@${String(st.url).split('/').pop()}:${st.lineNumber}` : '(khung)', e.args?.beginData?.dirtyObjects ?? e.args?.elementCount ?? '']) }
    }
    console.error('VẾT theo loại:\n' + [...theoTen].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `  ${v.toFixed(1).padStart(7)} ${k}`).join('\n'))
    console.error('LAYOUT/STYLE lớn:\n' + lay.sort((a, b) => b[0] - a[0]).slice(0, 14).map((x) => '  ' + x.join(' | ')).join('\n'))
    // lý do làm mất hiệu lực kiểu (invalidation tracking): gom theo (loại, lý do, bộ chọn / thuộc tính, nút)
    const ly = new Map()
    for (const e of sk) {
      if (!/Invalidation/.test(e.name)) continue
      const d = e.args?.data || {}
      const k = `${e.name.replace('InvalidationTracking', '')} | ${d.reason || ''} | ${d.invalidationList ? JSON.stringify(d.invalidationList).slice(0, 140) : d.changedClass || d.changedAttribute || d.changedId || d.changedPseudo || d.extraData || ''} | ${d.nodeName || ''}`
      ly.set(k, (ly.get(k) || 0) + 1)
    }
    if (arg('ghi-vet', '')) writeFileSync(arg('ghi-vet', ''), JSON.stringify(sk.filter((e) => e.tid === chinh || /Invalidation/.test(e.name))))
    console.error('MẤT HIỆU LỰC KIỂU:\n' + [...ly].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => `  ${String(v).padStart(4)} ${k}`).join('\n'))
    cdp.__sk = null
  }
  const { profile } = await cdp.send('Profiler.stop')
  const tu = new Map(), theoId = new Map(profile.nodes.map((n) => [n.id, n]))
  const tong = new Map()
  const tep = (u) => String(u || '').split('/').pop().replace(/-[\w-]{8}\.(js|css)$/, '.$1') || '(native)'
  profile.samples.forEach((id, i) => {
    const cf = theoId.get(id).callFrame, ms = (profile.timeDeltas[i] || 0) / 1000
    const k = `${cf.functionName || '(anon)'} ${tep(cf.url)}:${cf.lineNumber + 1}`
    tu.set(k, (tu.get(k) || 0) + ms)
    tong.set(tep(cf.url), (tong.get(tep(cf.url)) || 0) + ms)
  })
  // ai gọi các hàm gốc tốn nhất (chuỗi 3 khung cha)
  const cha = new Map(); for (const n of profile.nodes) for (const c of n.children || []) cha.set(c, n.id)
  const goiBoi = new Map()
  profile.samples.forEach((id, i) => {
    const n = theoId.get(id); if (!/^(setAttribute|removeChild|getBoundingClientRect|appendChild|insertBefore)$/.test(n.callFrame.functionName)) return
    const ds = []; let x = cha.get(id); for (let k = 0; k < 4 && x; k++) { const cf = theoId.get(x).callFrame; ds.push(`${cf.functionName || '(anon)'}@${tep(cf.url)}:${cf.lineNumber + 1}`); x = cha.get(x) }
    const k = n.callFrame.functionName + ' ← ' + ds.join(' ← ')
    goiBoi.set(k, (goiBoi.get(k) || 0) + (profile.timeDeltas[i] || 0) / 1000)
  })
  console.error('GỌI BỞI:\n' + [...goiBoi].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `  ${v.toFixed(1).padStart(7)}  ${k}`).join('\n'))
  const inBang = (m, n) => [...m].filter(([k]) => !/\(idle\)|\(program\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `  ${v.toFixed(1).padStart(7)}  ${k}`).join('\n')
  console.error(`HỒ SƠ ${ten} — tự thân:\n${inBang(tu, 35)}\nTHEO TỆP:\n${inBang(tong, 15)}`)
}
/** --kham=1: ai gọi requestAnimationFrame liên tục (tệp:dòng của lời gọi) trong 2 s. */
const aiGoiRaf = (p) => p.evaluate(() => new Promise((ok) => {
  const goc = window.requestAnimationFrame, dem = new Map()
  window.requestAnimationFrame = function (f) { const st = (new Error().stack || '').split('\n').slice(2, 4).map((x) => x.trim().split('/').pop()).join(' < '); dem.set(st, (dem.get(st) || 0) + 1); return goc.call(window, f) }
  setTimeout(() => { window.requestAnimationFrame = goc; ok([...dem].sort((a, b) => b[1] - a[1]).slice(0, 8)) }, 2000)
}))
async function dungYen(p) {
  if (KHAM) console.error('RAF', JSON.stringify(await aiGoiRaf(p)))
  const r0 = await p.evaluate(() => window.__do.raf)
  await p.waitForTimeout(2000)
  const raf = Math.round(((await p.evaluate(() => window.__do.raf)) - r0) / 2)
  const tinh = await p.evaluate(() => {
    const a = document.getAnimations().filter((x) => x.playState === 'running')
    const vohan = a.filter((x) => x.effect?.getComputedTiming?.().iterations === Infinity)
    const ten = [...new Set(vohan.map((x) => x.animationName || 'web-anim'))].slice(0, 12)
    return { nutDom: document.getElementsByTagName('*').length, hoatAnhChay: a.length, voHan: vohan.length, tenVoHan: ten }
  })
  const t0 = await bayGio(p)
  const k = await doKhung(p, 3000)
  const d = await layDo(p)
  return { ...tinh, rafGiay: raf, khungYen: k, taskMaxYen: daiNhat(d.dai, t0) }
}
async function cuon(p, cdp, ms = 4000, y = MAN.height / 2) {
  const t0 = await bayGio(p)
  const [k] = await Promise.all([doKhung(p, ms), (async () => {
    const het = Date.now() + ms - 300; let len = false
    while (Date.now() < het) { await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(MAN.width / 2), y: Math.round(y), yDistance: len ? 400 : -400, speed: 800, gestureSourceType: 'touch', repeatCount: 0 }).catch(() => {}); len = !len }
  })()])
  const d = await layDo(p)
  return { ...k, taskMax: daiNhat(d.dai, t0) }
}

async function moMay(trinh, { yeu }) {
  const ctx = await trinh.newContext({ viewport: MAN, screen: MAN, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', ignoreHTTPSErrors: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' })
  await ctx.addInitScript(DO_TRONG_TRANG)
  await ctx.addInitScript((yeu) => {
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => (yeu ? 2 : 8), configurable: true })
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => (yeu ? 4 : 8), configurable: true })
  }, yeu)
  return ctx
}
async function trangMoi(ctx, loi) {
  const p = await ctx.newPage()
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', MANG_GIA)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  return { p, cdp }
}

const LO_TRINH = 're=^Học tiếp'
const PHUONG_AN = '[role="radio"]'
const NUT_KIEM = 're=^(Kiểm tra|Nộp câu)'
const NUT_TIEP = 're=^(Tiếp tục|Câu tiếp theo)$'
const chuPa = (p) => p.evaluate(() => [...document.querySelectorAll('[role="radio"]')].map((e) => e.textContent).join('|'))

const trinh = await chromium.launch({ headless: true, executablePath: timChromium(), args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-certificate-errors', '--no-proxy-server', `--host-resolver-rules=MAP * 127.0.0.1:${CONG}, EXCLUDE 127.0.0.1`] })
const kq = { dist: DIST, cpu: CPU, mang: MANG, mayYeu: YEU, mayChuMs: MAY_CHU_MS, luc: new Date().toISOString() }
const loi = []
let buocDang = ''
const buoc = (t) => { buocDang = t; if (arg('vet', '')) console.error('…', t) }
try {
  GIA.datLai()
  const ctx = await moMay(trinh, { yeu: YEU })
  buoc('mo-dau')
  // 1. Mở đầu
  {
    const { p } = await trangMoi(ctx, loi)
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    const tDn = await choThay(p, 'input[type="password"]')
    await p.waitForTimeout(300)
    const taiDn = await taiTheoLoai(p, tDn)
    await p.locator('input').first().fill('99001')
    await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
    const t0 = await bayGio(p)
    await cham(p, 're=^Đăng nhập$')
    const tLt = await choThay(p, LO_TRINH)
    await p.waitForTimeout(6000)
    const d = await layDo(p)
    kq.moDau = { fcp: d.fcp, dangNhapHien: Math.round(tDn), taiToiDangNhap: taiDn, bamDangNhapToiLoTrinh: Math.round(tLt - t0), ttiSauDangNhap: Math.round(tti(d.dai, tLt) - t0), taiTong: await taiTheoLoai(p) }
    await p.close()
  }
  buoc('mo-lai')
  // 2. Mở lại (đã đăng nhập, đệm HTTP ấm)
  const { p, cdp } = await trangMoi(ctx, loi)
  {
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    const tLt = await choThay(p, LO_TRINH)
    await p.waitForTimeout(5000)
    const d = await layDo(p)
    kq.moLai = { fcp: d.fcp, noiDung: Math.round(tLt), chamDuoc: tti(d.dai, tLt), taskMax: daiNhat(d.dai), quaMang: await taiTheoLoai(p) }
  }
  buoc('lo-trinh')
  // 3. Lộ trình đứng yên + cuộn
  kq.loTrinh = { ...(await dungYen(p)), cuon: await cuon(p, cdp) }
  kq.loTrinh.mayYeuBat = await p.evaluate(() => document.documentElement.classList.contains('may-yeu'))
  buoc('vao-chang')
  // 4. Chuyển màn: Lộ trình → câu đầu
  await p.evaluate(() => (document.scrollingElement.scrollTop = 0))
  await p.waitForTimeout(800)
  {
    // App cũ: «Học tiếp» vào thẳng câu. App mới: chạm nút chặng ⇒ thẻ chặng (phản hồi chạm) ⇒ «Bắt đầu / Tiếp tục» ⇒ câu.
    const t0 = await bayGio(p)
    await cham(p, LO_TRINH)
    const tThe = await choThay(p, '[role="radio"], .da-pop-nut')
    let tBam = t0, theMs = null
    if (!(await p.evaluate(() => !!document.querySelector('[role="radio"]')))) {
      theMs = Math.round(tThe - t0)
      await p.waitForTimeout(500)
      tBam = await bayGio(p)
      await cham(p, 're=^(Bắt đầu|Tiếp tục|BẮT ĐẦU|TIẾP TỤC)$')
    }
    const t1 = await choThay(p, PHUONG_AN)
    await p.waitForTimeout(1500)
    const d = await layDo(p)
    kq.vaoChang = { theChangMs: theMs, chuyenMs: Math.round(t1 - tBam), inp: inpTu(d.sk, t0), taskMax: daiNhat(d.dai, t0) }
  }
  // 5. Làm câu
  kq.lamCau = { ...(await dungYen(p)) }
  if (arg('thu-css', '')) {
    const r = await p.evaluate(() => {
      const doToanBo = () => { const t = performance.now(); document.documentElement.style.setProperty('--zz-do', String(Math.random())); void document.body.offsetHeight; return performance.now() - t }
      const lap = () => { const a = []; for (let i = 0; i < 5; i++) a.push(doToanBo()); a.sort((x, y) => x - y); return Math.round(a[2]) }
      const tr = document.querySelector('[inert]')
      const diem = [[innerWidth / 2, innerHeight / 2], [6, 6], [innerWidth - 6, 6], [6, innerHeight - 6], [innerWidth - 6, innerHeight - 6]].map(([x, y]) => {
        const e = document.elementFromPoint(x, y); const chuoi = []; for (let n = e; n && n !== document.body; n = n.parentElement) chuoi.push(n.tagName + '.' + String(n.className?.baseVal ?? n.className).split(' ')[0] + ':' + getComputedStyle(n).backgroundColor)
        return (tr?.contains(e) ? 'TRONG ' : '') + chuoi.slice(0, 6).join(' < ') })
      const cv = tr ? tr.style.contentVisibility : '-'
      const out = { cv, diem, goc: lap(), soPhanTu: document.getElementsByTagName('*').length, soTo: document.styleSheets.length }
      const to = [...document.styleSheets]
      const ket = []
      for (const sh of to) {
        let ten = (sh.href || 'inline').split('/').pop().replace(/-[\w-]{8}\.css$/, '')
        let n = 0; try { n = sh.cssRules.length } catch {}
        sh.disabled = true
        ket.push([ten, n, lap()])
        sh.disabled = false
      }
      out.boTung = ket.sort((a, b) => a[2] - b[2]).slice(0, 12)
      // gỡ một bản sao khối câu: tốn bao nhiêu (gồm cả kiểu/bố cục sau đó)
      const goBanSao = () => { const g = document.querySelector('.duo-than'); const b = g.cloneNode(true); g.parentElement.appendChild(b); void document.body.offsetHeight; const t = performance.now(); b.remove(); const t1 = performance.now(); void document.body.offsetHeight; return [Math.round(t1 - t), Math.round(performance.now() - t1)] }
      out.goBanSao = [goBanSao(), goBanSao(), goBanSao()]
      for (const sh of to) sh.disabled = true
      out.goBanSaoKhongCss = [goBanSao(), goBanSao()]
      for (const sh of to) sh.disabled = false
      const soPt = document.querySelector('.duo-than').getElementsByTagName('*').length
      out.soPtKhoiCau = soPt
      // bỏ hết trừ một tờ: không cần. Đo riêng: chỉ giám thị (ẩn), chỉ Lộ trình (ẩn)
      const gt = document.querySelector('.gt-o'); if (gt) { gt.style.display = 'none'; out.anGiamThi = lap(); gt.style.display = '' }
      const lt = document.querySelector('[inert]'); if (lt) { lt.style.display = 'none'; out.anLoTrinh = lap(); lt.style.display = '' }
      return out
    })
    console.error('THỬ CSS', JSON.stringify(r))
  }
  const cau = []
  for (let i = 0; i < 4; i++) {
    const m = {}
    if (i === 1) await batHoSo(cdp, 'bamPa')
    let t0 = await bayGio(p)
    await cham(p, PHUONG_AN)
    await p.waitForTimeout(600)
    if (i === 1) await inHoSo(cdp, 'bamPa')
    let d = await layDo(p)
    m.bamPa = { inp: inpTu(d.sk, t0), xuLy: xuLyTu(d.sk, t0), taskMax: daiNhat(d.dai, t0) }
    t0 = await bayGio(p)
    if (i === 1) await batHoSo(cdp, 'kiem')
    await cham(p, NUT_KIEM)
    await p.waitForTimeout(400)
    d = await layDo(p)
    const inpKiem = inpTu(d.sk, t0), xuLyKiem = xuLyTu(d.sk, t0)
    const t1 = await choThay(p, NUT_TIEP)
    const kHieuUng = await doKhung(p, 1500)
    if (i === 1) await inHoSo(cdp, 'kiem')
    d = await layDo(p)
    m.kiemTra = { inp: inpKiem, xuLy: xuLyKiem, toiKetQua: Math.round(t1 - t0), taskMax: daiNhat(d.dai, t0), khungHieuUng: kHieuUng }
    await p.waitForTimeout(300)
    const truoc = await chuPa(p)
    if (i === 1) await batHoSo(cdp, 'tiep')
    t0 = await bayGio(p)
    await cham(p, NUT_TIEP)
    const t2 = await (await p.waitForFunction((truoc) => { const s = [...document.querySelectorAll('[role="radio"]')].map((e) => e.textContent).join('|'); return s && s !== truoc ? performance.now() : 0 }, truoc, { polling: 16, timeout: 60000 })).jsonValue()
    await p.waitForTimeout(800)
    d = await layDo(p)
    if (i === 1) await inHoSo(cdp, 'tiep')
    m.tiep = { inp: inpTu(d.sk, t0), xuLy: xuLyTu(d.sk, t0), chuyenCau: Math.round(t2 - t0), taskMax: daiNhat(d.dai, t0) }
    cau.push(m)
  }
  kq.cau = cau
  kq.lamCau.cuon = await cuon(p, cdp, 3000, MAN.height * 0.4)
  const lon = (f) => Math.max(...cau.map(f))
  const giua = (f) => { const s = cau.map(f).sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
  kq.tom = {
    moLaiChamDuoc: kq.moLai.chamDuoc, moLaiNoiDung: kq.moLai.noiDung, moDauTaiKB: kq.moDau.taiTong,
    loTrinhCuonP95: kq.loTrinh.cuon.p95, loTrinhCuonTren50: kq.loTrinh.cuon.tren50, loTrinhYenP95: kq.loTrinh.khungYen.p95, rafNen: kq.loTrinh.rafGiay, nutDom: kq.loTrinh.nutDom, voHan: kq.loTrinh.voHan,
    lamCauYenP95: kq.lamCau.khungYen.p95, lamCauCuonP95: kq.lamCau.cuon.p95, lamCauRaf: kq.lamCau.rafGiay, lamCauNutDom: kq.lamCau.nutDom,
    bamPaInpMax: lon((m) => m.bamPa.inp), bamPaXuLyMax: lon((m) => m.bamPa.xuLy), tiepXuLyMax: lon((m) => m.tiep.xuLy), kiemXuLyMax: lon((m) => m.kiemTra.xuLy), bamPaInpGiua: giua((m) => m.bamPa.inp), kiemInpMax: lon((m) => m.kiemTra.inp), tiepInpMax: lon((m) => m.tiep.inp),
    chuyenCauGiua: giua((m) => m.tiep.chuyenCau), chuyenMan: kq.vaoChang.chuyenMs, hieuUngP95Max: lon((m) => m.kiemTra.khungHieuUng.p95),
    taskBamMax: Math.max(lon((m) => m.bamPa.taskMax), lon((m) => m.tiep.taskMax), lon((m) => m.kiemTra.taskMax), kq.vaoChang.taskMax),
  }
  await ctx.close()
} catch (e) {
  kq.loiChay = String(e.message).slice(0, 300) + ' @ ' + buocDang
  if (arg('chup-loi', '')) for (const pg of trinh.contexts().flatMap((c) => c.pages())) await pg.screenshot({ path: arg('chup-loi', ''), type: 'jpeg', quality: 50 }).catch(() => {})
} finally {
  kq.loi = loi.slice(0, 5)
  await trinh.close(); may.close(); mayTinh.close(); await vite.close()
}
if (RA) writeFileSync(RA, JSON.stringify(kq, null, 1))
console.log(JSON.stringify(kq.tom ?? kq))
if (kq.loiChay) console.error(kq.loiChay)
