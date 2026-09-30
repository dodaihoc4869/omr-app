#!/usr/bin/env node
// ĐO BI-A TRÊN MÁY HỌC SINH YẾU (30/09 — "mượt gấp đôi, nhanh gấp đôi, ổn định gấp đôi", phải đo được).
// Chromium của Playwright (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers, KHÔNG `playwright install`), CPU chậm 6× (CDP
// Emulation.setCPUThrottlingRate), điện thoại cảm ứng: 360×740 dọc DPR 3 và 740×360 ngang DPR 2; mỗi khổ đo hai chế độ:
// "thường" và "máy yếu" (lớp `may-yeu` trên <html> như main.tsx gắn cho máy RAM ≤ 3 GB / ≤ 4 luồng).
// Trang đo = bản build riêng của trang xem thử Bi-a (máy chủ GIẢ ngay trong trang — không một byte nào tới máy chủ thật).
// Math.random gieo hạt cố định ⇒ bàn, A.I, cú phá bàn giống hệt nhau giữa hai bản (trước / sau).
//
//   npx vite build --config scripts/do-bia/vite.config.mjs --outDir <thư mục>
//   node scripts/do-bia/do-client.mjs --dist=<thư mục> [--ra=kq.json] [--cpu=6] [--lan=1] [--chi=doc-thuong,ngang-yeu]
//
// Số đo mỗi kịch bản:
//   · vaoBanMs — bấm "Đấu đơn với A.I" → khung đầu tiên của bàn đã vẽ (bàn chơi được).
//   · lăn 10 giây sau cú phá bàn lực tối đa (16 bi): FPS trung bình, p50/p95/p99 thời gian khung, số khung > 33 ms / > 50 ms,
//     tác vụ dài > 50 ms (số + tổng ms), % CPU luồng chính (TaskDuration); tách riêng các khung lúc bi ĐANG LĂN (pha 'moving').
//   · đứng yên 3 giây lúc nhắm (không chạm): FPS + % CPU (máy có nóng / tốn pin khi em đang nghĩ không).
//   · kéo gậy → vẽ: độ trễ từ sự kiện pointermove tới lúc khung hình đã xử lý nó xong (p50/p95), khi cầm gậy xoay 1,5 giây.
//   · bộ nhớ JS heap (sau khi vào bàn, sau 10 giây lăn — đã gom rác).
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST_LIST = arg('dist', 'dist-do-bia').split(',').map((d) => resolve(d))
const RA = arg('ra', '')
const CPU = Number(arg('cpu', '6'))
const LAN = Number(arg('lan', '1'))
const CHI = arg('chi', '')
// --hoso=yen|lan|keo: ghi hồ sơ CPU (CDP Profiler) trong pha đó, in 25 hàm tốn thời gian tự thân nhất (dùng với bản build KHONG_NEN=1).
const HOSO = arg('hoso', '')
// --kiem=1: so ảnh vẽ vùng bẩn với vẽ cả bàn trong 10 giây lăn (không đo khung — việc so làm chậm trang).
const KIEM = arg('kiem', '') === '1'
const TRANG = '/src/game/bi-a/xem-thu.html'
const W = 500, H = 900, T = 26

const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ttf': 'font/ttf' }
function mayChu(goc) {
  const s = createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const f = join(goc, p)
    if (!f.startsWith(goc) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': LOAI[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(readFileSync(f))
  })
  return new Promise((ok) => s.listen(0, '127.0.0.1', () => ok({ s, goc: `http://127.0.0.1:${s.address().port}` })))
}

// Chạy TRƯỚC mọi mã của trang: gieo hạt Math.random, bộ ghi khung (rAF), tác vụ dài, độ trễ pointermove → khung đã vẽ.
const MA_DAU = (mayYeu) => `(() => {
  let s = 0x9e3779b9 >>> 0
  Math.random = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  ${mayYeu ? "const yeu = () => document.documentElement && document.documentElement.classList.add('may-yeu'); try { yeu() } catch {} document.addEventListener('readystatechange', yeu)" : ''}
  const d = window.__do = { ghi: false, khung: [], pha: [], lt: [], cho: null, choDo: null, tre: [], bam: 0, vao: 0 }
  const mc = new MessageChannel()
  mc.port1.onmessage = (e) => {
    const now = performance.now()
    if (e.data === 'tre' && d.choDo != null) { d.tre.push(now - d.choDo); d.choDo = null }
    if (e.data === 'vao' && !d.vao) d.vao = now
  }
  const khung = (t) => {
    if (d.ghi) { d.khung.push(t); const v = window.__biaVan; d.pha.push(v ? v.pha : '') }
    if (d.cho != null) { d.choDo = d.cho; d.cho = null; mc.port2.postMessage('tre') }
    if (d.bam && !d.vao) { const cv = document.querySelector('.bia-ban canvas'); if (cv && cv.width > 0 && window.__biaVan) mc.port2.postMessage('vao') }
    requestAnimationFrame(khung)
  }
  requestAnimationFrame(khung)
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || e.buttons) d.cho = e.timeStamp }, { capture: true, passive: true })
  addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('button'); if (b && /Đấu đơn với A\\.I/.test(b.textContent || '')) d.bam = e.timeStamp }, { capture: true, passive: true })
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) d.lt.push([e.startTime, e.duration]) }).observe({ type: 'longtask', buffered: true }) } catch {}
})()`

const tv = (a, q) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(q * b.length))] }
const tron = (x, n = 1) => Math.round(x * 10 ** n) / 10 ** n
function thongKeKhung(t) {
  const dt = []
  for (let i = 1; i < t.length; i++) dt.push(t[i] - t[i - 1])
  const tong = t.length > 1 ? t[t.length - 1] - t[0] : 0
  return { soKhung: dt.length, fps: tong ? tron((dt.length * 1000) / tong) : 0, p50: tron(tv(dt, 0.5)), p95: tron(tv(dt, 0.95)), p99: tron(tv(dt, 0.99)), max: tron(Math.max(0, ...dt)), tren33: dt.filter((x) => x > 33.4).length, tren50: dt.filter((x) => x > 50).length }
}
/** Thời gian khung CHỈ lúc bi đang lăn (khung i tính khi cả hai mốc đều ở pha 'moving'). */
function khungLan(t, pha) {
  const dt = []
  for (let i = 1; i < t.length; i++) if (pha[i] === 'moving' && pha[i - 1] === 'moving') dt.push(t[i] - t[i - 1])
  const tong = dt.reduce((a, b) => a + b, 0)
  return { soKhung: dt.length, fps: tong ? tron((dt.length * 1000) / tong) : 0, p50: tron(tv(dt, 0.5)), p95: tron(tv(dt, 0.95)), p99: tron(tv(dt, 0.99)), tren33: dt.filter((x) => x > 33.4).length }
}
async function chiSo(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics')
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]))
}
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
async function batHoSo(cdp, ten) { if (HOSO !== ten) return; await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start') }
async function tatHoSo(cdp, ten) {
  if (HOSO !== ten) return
  const { profile } = await cdp.send('Profiler.stop')
  const tu = new Map(), dt = profile.timeDeltas, id = profile.samples
  const nut = new Map(profile.nodes.map((n) => [n.id, n]))
  let tong = 0
  for (let i = 0; i < id.length; i++) { const n = nut.get(id[i]); const f = n.callFrame; const k = `${f.functionName || '(vô danh)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`; tu.set(k, (tu.get(k) ?? 0) + (dt[i] ?? 0)); tong += dt[i] ?? 0 }
  console.log(`— hồ sơ ${ten}: tổng ${(tong / 1000).toFixed(0)} ms`)
  for (const [k, v] of [...tu].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`${(v / 1000).toFixed(1).padStart(8)} ms ${(100 * v / tong).toFixed(1).padStart(5)}%  ${k}`)
}

async function motKichBan(trinh, goc, ks) {
  const ctx = await trinh.newContext({ viewport: { width: ks.w, height: ks.h }, deviceScaleFactor: ks.dpr, isMobile: true, hasTouch: true, locale: 'vi-VN' })
  await ctx.addInitScript(MA_DAU(ks.mayYeu))
  const page = await ctx.newPage()
  const loi = []
  page.on('pageerror', (e) => loi.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Performance.enable')
  await page.goto(goc + TRANG, { waitUntil: 'load' })
  await page.locator('button:has-text("Đấu đơn với A.I")').waitFor({ state: 'visible', timeout: 60000 })
  await page.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /Đấu đơn với A\.I/.test(x.textContent || '')); return b && !b.disabled }, null, { timeout: 60000 })
  await ngu(500)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  await page.locator('button:has-text("Đấu đơn với A.I")').click()
  await page.waitForFunction(() => window.__do.vao > 0, null, { timeout: 60000 })
  const vaoBanMs = await page.evaluate(() => window.__do.vao - window.__do.bam)
  await ngu(2500) // thông báo "phá bàn" hiện rồi tắt
  await cdp.send('HeapProfiler.collectGarbage')
  const heapVao = (await cdp.send('Runtime.getHeapUsage')).usedSize
  // ── đứng yên lúc nhắm: 3 giây không chạm
  const m0 = await chiSo(cdp)
  await batHoSo(cdp, 'yen')
  await page.evaluate(() => { const d = window.__do; d.khung = []; d.pha = []; d.ghi = true })
  await ngu(3000)
  const yen = await page.evaluate(() => { const d = window.__do; d.ghi = false; return d.khung })
  const m1 = await chiSo(cdp)
  await tatHoSo(cdp, 'yen')
  const yenTk = { ...thongKeKhung(yen), cpu: tron(((m1.TaskDuration - m0.TaskDuration) / 3) * 100) }
  // ── kéo gậy → vẽ: cầm gậy (điểm trên thân gậy sau bi cái), xoay ±0,25 rad quanh bi cái trong 1,5 giây, rồi trả về hướng cũ
  const hinh = await page.evaluate(() => {
    const v = window.__biaVan, cv = document.querySelector('.bia-ban canvas'), r = cv.getBoundingClientRect(), c = v.st.balls.find((b) => b.id === 'cue')
    return { l: r.left, t: r.top, w: r.width, h: r.height, cx: c.x, cy: c.y, ax: v.aim.x, ay: v.aim.y }
  })
  const xoay = hinh.w > hinh.h, S = xoay ? hinh.h / (W + 2 * T) : hinh.w / (W + 2 * T)
  const raMan = (x, y) => (xoay ? { x: hinh.l + (H + T - y) * S, y: hinh.t + (x + T) * S } : { x: hinh.l + (x + T) * S, y: hinh.t + (y + T) * S })
  const g0 = Math.atan2(-hinh.ay, -hinh.ax), rr = 95
  const diem = (g) => raMan(hinh.cx + Math.cos(g) * rr, hinh.cy + Math.sin(g) * rr)
  await page.evaluate(() => { window.__do.tre = [] })
  await batHoSo(cdp, 'keo')
  const p0 = diem(g0)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p0.x, y: p0.y, id: 1 }] })
  const N = 90
  for (let i = 1; i <= N; i++) {
    const p = diem(g0 + 0.25 * Math.sin((i / N) * 2 * Math.PI))
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y, id: 1 }] })
    await ngu(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await ngu(400)
  await tatHoSo(cdp, 'keo')
  const tre = await page.evaluate(() => window.__do.tre)
  const keo = { soMau: tre.length, p50: tron(tv(tre, 0.5)), p95: tron(tv(tre, 0.95)), max: tron(Math.max(0, ...tre)) }
  const aimSau = await page.evaluate(() => ({ x: window.__biaVan.aim.x, y: window.__biaVan.aim.y }))
  // Trả đúng hướng ban đầu (kịch bản phá bàn giống hệt giữa hai bản, không phụ thuộc lượng mẫu kéo lọt vào khung nào).
  await page.evaluate(({ ax, ay }) => { window.__biaVan.aim = { x: ax, y: ay } }, { ax: hinh.ax, ay: hinh.ay })
  // ── phá bàn lực tối đa (giữ Space 1,6 giây như máy tính; lực đầy sau 1,4 giây) rồi ghi 10 giây
  await page.evaluate(() => document.querySelector('.bia[tabindex]')?.focus())
  await page.keyboard.down(' ')
  await ngu(1600)
  const m2 = await chiSo(cdp)
  await batHoSo(cdp, 'lan')
  await page.evaluate(() => { const d = window.__do; d.khung = []; d.pha = []; d.lt = []; d.ghi = true })
  await page.keyboard.up(' ')
  const kiem = []
  if (KIEM) {
    // So ảnh: canvas đang hiện (vẽ vùng bẩn) với vẽ lại CẢ bàn cùng trạng thái — khác điểm ảnh nào là vẽ vùng bẩn sót.
    for (let i = 0; i < 14; i++) {
      await ngu(700)
      kiem.push(await page.evaluate(() => {
        const bv = window.__biaBoVe, v = window.__biaVan, cv = document.querySelector('.bia-ban canvas'), x = cv.getContext('2d')
        if (!bv || !bv.dem) return { khac: -1 }
        const a = x.getImageData(0, 0, cv.width, cv.height).data
        bv.kiemAnh = true; bv.ve(x, v, null, true, false); bv.kiemAnh = false
        const b = x.getImageData(0, 0, cv.width, cv.height).data
        let khac = 0, lon = 0
        for (let j = 0; j < a.length; j += 4) { const d = Math.max(Math.abs(a[j] - b[j]), Math.abs(a[j + 1] - b[j + 1]), Math.abs(a[j + 2] - b[j + 2]), Math.abs(a[j + 3] - b[j + 3])); if (d > 2) khac++; if (d > lon) lon = d }
        return { khac, lon, pha: v.pha, dem: { ...bv.dem } }
      }))
    }
  } else await ngu(10000)
  const lan = await page.evaluate(() => { const d = window.__do; d.ghi = false; return { khung: d.khung, pha: d.pha, lt: d.lt.filter((x) => x[0] >= d.khung[0]) } })
  const m3 = await chiSo(cdp)
  await tatHoSo(cdp, 'lan')
  await cdp.send('HeapProfiler.collectGarbage')
  const heapLan = (await cdp.send('Runtime.getHeapUsage')).usedSize
  const soCu = await page.evaluate(() => window.__biaVan.soCu)
  const coLopYeu = await page.evaluate(() => document.documentElement.classList.contains('may-yeu'))
  const cv = await page.evaluate(() => { const c = document.querySelector('.bia-ban canvas'); return c ? `${c.width}×${c.height}` : '' })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await ctx.close()
  return {
    vaoBanMs: tron(vaoBanMs),
    lan10s: { ...thongKeKhung(lan.khung), cpu: tron(((m3.TaskDuration - m2.TaskDuration) / 10) * 100), taskDaiSo: lan.lt.length, taskDaiMs: tron(lan.lt.reduce((a, b) => a + b[1], 0)), taskDaiMax: tron(Math.max(0, ...lan.lt.map((x) => x[1]))) },
    dangLan: khungLan(lan.khung, lan.pha),
    yen3s: yenTk,
    keoGay: { ...keo, doiHuong: tron(Math.atan2(aimSau.y, aimSau.x) - Math.atan2(hinh.ay, hinh.ax), 4) },
    heapVaoMB: tron(heapVao / 1048576, 2), heapSauLanMB: tron(heapLan / 1048576, 2),
    soCu, coLopYeu, canvas: cv, loi, ...(KIEM ? { kiem } : {}),
  }
}

const KICH_BAN = [
  { ten: 'doc-thuong', w: 360, h: 740, dpr: 3, mayYeu: false },
  { ten: 'doc-yeu', w: 360, h: 740, dpr: 3, mayYeu: true },
  { ten: 'ngang-thuong', w: 740, h: 360, dpr: 2, mayYeu: false },
  { ten: 'ngang-yeu', w: 740, h: 360, dpr: 2, mayYeu: true },
].filter((k) => !CHI || CHI.split(',').includes(k.ten))

// --dist=a,b: đo XEN KẼ hai bản (a, b, a, b…) cùng kịch bản ⇒ tải máy lúc đo (máy dùng chung) chia đều cho hai bản; ghi <ra>-0.json, <ra>-1.json.
const DS = DIST_LIST
const mc = []
for (const d of DS) mc.push(await mayChu(d))
const trinh = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] })
const ket = DS.map((d) => ({ dist: d, cpu: CPU, luc: new Date().toISOString(), kichBan: {} }))
try {
  for (const ks of KICH_BAN) {
    const cac = DS.map(() => [])
    for (let i = 0; i < LAN; i++) for (let j = 0; j < DS.length; j++) cac[j].push(await motKichBan(trinh, mc[j].goc, ks))
    for (let j = 0; j < DS.length; j++) {
      ket[j].kichBan[ks.ten] = LAN === 1 ? cac[j][0] : cac[j]
      const k = cac[j][cac[j].length - 1]
      if (KIEM) console.log(ks.ten, 'so ảnh:', JSON.stringify(k.kiem))
      console.log(`[${j}] ${ks.ten}: vào bàn ${k.vaoBanMs} ms · lăn 10 s: ${k.lan10s.fps} FPS p95 ${k.lan10s.p95} p99 ${k.lan10s.p99} ms, >33ms ${k.lan10s.tren33}, CPU ${k.lan10s.cpu}%, task dài ${k.lan10s.taskDaiSo} (${k.lan10s.taskDaiMs} ms) · đang lăn: ${k.dangLan.fps} FPS p95 ${k.dangLan.p95} · yên: ${k.yen3s.fps} FPS CPU ${k.yen3s.cpu}% · kéo gậy p50 ${k.keoGay.p50} p95 ${k.keoGay.p95} ms (${k.keoGay.soMau} mẫu) · heap ${k.heapVaoMB}/${k.heapSauLanMB} MB · lỗi ${k.loi.length}`)
    }
  }
} finally {
  await trinh.close()
  for (const m of mc) m.s.close()
}
if (RA) { if (DS.length === 1) writeFileSync(RA, JSON.stringify(ket[0], null, 2)); else ket.forEach((k, j) => writeFileSync(RA.replace(/\.json$/, '') + `-${j}.json`, JSON.stringify(k, null, 2))) }
