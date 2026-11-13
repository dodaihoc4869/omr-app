#!/usr/bin/env node
// ĐO ĐỘ MƯỢT NÉT BÚT của trình phát «Xem lại Live» trên Chromium thật (13/11, thầy: «nét bút xem lại vẫn bị giật, chưa mượt như trong live»).
//   npx vite build --config scripts/chup-live-xem-lai-hs-1111/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-live-xem-lai-hs-1111/do-net.mjs <thư mục tạm> [kịch bản,kịch bản…] [--json=<tệp>]
// Thành phần THẬT + tiếng thật qua <audio>; máy chủ GIẢ trả buổi giả một đoạn (tests/_live-xem-lai-net-gia.ts: nét viết tay có giờ từng điểm như bút thật).
// CÁCH ĐO: ở MỖI khung requestAnimationFrame ghi chỗ NGÒI cây bút vừa được vẽ lên lớp «đang viết» (bắt lệnh `drawImage` dán cây bút — đúng điểm ảnh trên
// màn, không sửa mã trình phát) rồi so với chỗ đầu nét LÝ TƯỞNG theo giờ (nội suy thẳng giữa hai điểm của nét, giờ = đồng hồ máy × tốc độ phát, khớp pha
// với tiếng). Với mỗi khung nằm TRONG một nét:
//   · «đứng»  = lẽ ra đầu nét đi ≥ 2 px mà trên màn đi chưa tới 1/4 quãng ấy;
//   · «nhảy»  = trên màn đi hơn 2 lần quãng lẽ ra + 3 px;
//   · «lệch»  = khoảng cách ngòi bút ↔ chỗ lý tưởng (px), lấy p95 / lớn nhất.
// LÚC NHẤC BÚT giữa hai nét cách nhau ≤ 0,7 giây (viết chữ): «đứng nhấc» = khung cây bút không nhúc nhích; «vụt» = cây bút dời > 8 px trong MỘT khung
// mà khung trước và khung sau gần như đứng (bút đứng ở cuối nét rồi vụt sang đầu nét sau). Kèm khoảng giữa hai khung hình.
// NHIỄU (mô phỏng điều kiện máy thật mà Chromium không đầu không có): `bac=<ms>` giờ tiếng chỉ đổi theo bậc (điện thoại, tai nghe Bluetooth);
// `rs=<ms>` cứ ngần ấy ms `readyState` tụt xuống 2 trong một khung (tiếng tải theo khúc); `cpu=<n>` bóp CPU.
import { createServer } from 'node:http'
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-chup-xl')
const CHON = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '').split(',').filter(Boolean)
const TEP_JSON = (process.argv.find((x) => x.startsWith('--json=')) ?? '').slice(7)

const tam = mkdtempSync(join(tmpdir(), 'xl-net-'))
await build({ entryPoints: [join(GOC, 'tests/_live-xem-lai-net-gia.ts')], bundle: true, platform: 'node', format: 'esm', outfile: join(tam, 'net.mjs'), logLevel: 'warning' })
await build({ entryPoints: [join(GOC, 'tests/_live-xem-lai-hs-gia.ts')], bundle: true, platform: 'node', format: 'esm', outfile: join(tam, 'gia.mjs'), logLevel: 'warning' })
const N = await import(pathToFileURL(join(tam, 'net.mjs')).href), G = await import(pathToFileURL(join(tam, 'gia.mjs')).href)

const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = join(GOC, 'public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-live-xem-lai-hs-1111/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'content-range, accept-ranges, content-length' }

/** Mã chạy TRONG trang trước mọi mô-đun: bắt lệnh dán cây bút + ghi từng khung hình + (tuỳ chọn) gây nhiễu giờ tiếng. */
function moc(nhieu) {
  const D = (window.__do = { but: [], kh: [], ghi: false })
  let ts = 0
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (cb) => raf((t) => { ts = t; cb(t) })
  const ve = CanvasRenderingContext2D.prototype.drawImage
  CanvasRenderingContext2D.prototype.drawImage = function (anh, ...r) {
    if (D.ghi && anh instanceof HTMLCanvasElement && this.canvas.classList && this.canvas.classList.contains('song')) {
      const m = this.getTransform(), tr = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(this.canvas.style.transform)
      const dd = this.canvas.width / (parseFloat(this.canvas.style.width) || this.canvas.width)
      D.but.push([ts, m.e + Math.round((tr ? +tr[1] : 0) * dd), m.f + Math.round((tr ? +tr[2] : 0) * dd), dd])
    }
    return ve.call(this, anh, ...r)
  }
  const gt = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime'), grs = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState')
  // giờ tiếng đổi theo bậc: chỉ cập nhật con số mỗi `bac` ms (± 30 %), giữa hai lần giữ nguyên
  let soCu = 0, lucKe = 0
  if (nhieu.bac > 0) Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
    configurable: true, set(v) { soCu = v; lucKe = 0; gt.set.call(this, v) },
    get() { const nay = performance.now(); if (this.paused || nay >= lucKe) { soCu = gt.get.call(this); lucKe = nay + nhieu.bac * (0.7 + 0.6 * Math.random()) } return soCu },
  })
  // `readyState` tụt xuống 2 trong ~một khung hình, cứ `rs` ms một lần (chỉ khi đang phát)
  if (nhieu.rs > 0) Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
    configurable: true, get() { const that = grs.get.call(this); return that > 2 && !this.paused && performance.now() % nhieu.rs < 17 ? 2 : that },
  })
  const vong = (t) => { raf(vong); if (!D.ghi) return; const a = document.querySelector('.xp audio'); D.kh.push([t, a ? gt.get.call(a) * 1000 : -1, a ? grs.get.call(a) : -1, a && a.paused ? 1 : 0]) }
  raf(vong)
}

/** Một lượt đo. Trả các con số. */
async function doMot(c) {
  const d = N.taoBuoiNet(c.kich, { nen: c.nen ?? 0, coTieng: c.tieng !== 0 })
  const tieng = c.tieng !== 0 ? Buffer.from(G.taoTiengGia(d.buoi.msLive, d.coTieng)) : null, net = Buffer.from(d.net)
  const ctx = await trinh.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.dpr ?? 1, isMobile: !c.mayTinh, hasTouch: !c.mayTinh })
  await ctx.route('https://may-chu-gia.test/**', async (route) => {
    const req = route.request(), u = new URL(req.url())
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const json = (o, status = 200) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(o) })
    if (u.pathname === '/hs/live-buoi') return json(G.taoRiengGia(d.buoi))
    const m = /^\/live-tep\/([^/]+)\/([^/]+)$/.exec(u.pathname)
    if (!m) return json({ ok: false }, 404)
    if (m[2] === 'buoi.json') return json(d.buoi)
    const than = m[2] === 'net.bin' ? net : m[2] === 'tieng.mp3' ? tieng : null
    if (!than) return json({ ok: false }, 404)
    const loai = m[2] === 'net.bin' ? 'application/octet-stream' : 'audio/wav'
    const r = /bytes=(\d+)-(\d*)/.exec(req.headers().range ?? '')
    if (!r) return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': loai, 'accept-ranges': 'bytes' }, body: than })
    const a = +r[1], b = Math.min(than.length - 1, r[2] ? +r[2] : than.length - 1)
    return route.fulfill({ status: 206, headers: { ...CORS, 'content-type': loai, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${than.length}` }, body: than.subarray(a, b + 1) })
  })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.addInitScript(moc, { bac: c.bac ?? 0, rs: c.rs ?? 0 })
  await t.goto(`${goc}/?man=buoi&id=${d.buoi.id}${c.yeu ? '&yeu=1' : ''}`)
  await t.evaluate(() => document.fonts.ready)
  await t.locator('.xl-bia-buoi').waitFor()
  await t.waitForTimeout(400)
  const cdp = await ctx.newCDPSession(t)
  if (c.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.cpu })
  await t.evaluate(() => { window.__do.ghi = true })
  if (c.mayTinh) await t.locator('.xl-doan').first().click(); else await t.locator('#xl-cau-1 .xl-bia-nut').first().click()
  await t.locator('.xp').waitFor()
  const td = c.td ?? 1
  if (td !== 1) await t.getByRole('button', { name: `Tốc độ ${String(td).replace('.', ',')} lần` }).click()
  await t.waitForTimeout((N.hetViet(d.viet) - 500) / td + 2500)
  const ra = await t.evaluate(() => ({ but: window.__do.but, kh: window.__do.kh }))
  if (c.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await ctx.close()
  return { ...tinh(d.viet, ra, td), loi: loi.length, loiDau: loi[0] ?? '' }
}

const pt = (ds, p) => { if (!ds.length) return 0; const s = ds.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))] }
/** Khớp tuyến tính y = a·x + b (bình phương nhỏ nhất). */
function khop(xs, ys) {
  const n = xs.length; let sx = 0, sy = 0, sxx = 0, sxy = 0
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i] }
  const a = (n * sxy - sx * sy) / Math.max(1e-12, n * sxx - sx * sx)
  return { a, b: (sy - a * sx) / n }
}
function tinh(viet, ra, td) {
  // các khung đang phát (tiếng chạy), kèm chỗ bút vừa vẽ trong khung đó (không vẽ lại ⇒ bút y như khung trước)
  const veTheo = new Map(ra.but.map((b) => [b[0], b]))
  const kh = []
  let cu = null
  for (const k of ra.kh) {
    const b = veTheo.get(k[0]) ?? null
    if (b) cu = b
    if (k[3] === 0 && k[1] >= 0) kh.push({ ts: k[0], am: k[1], rs: k[2], bx: cu ? cu[1] : NaN, by: cu ? cu[2] : NaN, ve: !!b })
  }
  if (kh.length < 30) return { khung: kh.length, hong: 'không đủ khung đang phát' }
  // giờ lý tưởng của từng khung = đồng hồ máy × tốc độ, khớp pha với tiếng (trung vị độ lệch)
  const lech = pt(kh.map((k) => k.am - k.ts * td), 0.5)
  for (const k of kh) { k.T = k.ts * td + lech; k.lt = N.dauLyTuong(viet, k.T) }
  // phép đổi toạ độ bảng ⇒ điểm ảnh: khớp hai lượt (lượt hai bỏ khung lệch xa)
  let trong = kh.filter((k) => k.lt && Number.isFinite(k.bx)), fx = null, fy = null
  for (let luot = 0; luot < 3; luot++) {
    fx = khop(trong.map((k) => k.lt.x), trong.map((k) => k.bx)); fy = khop(trong.map((k) => k.lt.y), trong.map((k) => k.by))
    const e = trong.map((k) => Math.hypot(fx.a * k.lt.x + fx.b - k.bx, fy.a * k.lt.y + fy.b - k.by)), nguong = Math.max(2, pt(e, 0.7) * 2)
    trong = trong.filter((_, i) => e[i] <= nguong)
  }
  const dd = ra.but.length ? ra.but[0][3] : 1
  let dung = 0, nhay = 0, coc = 0, soTrong = 0, veLap = 0, nhac = 0, dungNhac = 0
  const lechPx = [], kc = [], buocMs = []
  // quãng nhấc bút ngắn: từ lúc xong nét này tới lúc bắt đầu nét sau, không quá 0,7 giây
  const het = viet.map((n) => n.t + (n.net.diem.length ? n.net.diem[n.net.diem.length - 1][3] : 0))
  const nhacNgan = (T) => { let e = -1e12, s = 1e12; for (let i = 0; i < viet.length; i++) { if (het[i] <= T && het[i] > e) e = het[i]; if (viet[i].t > T && viet[i].t < s) s = viet[i].t } return s - e <= 700 }
  const buoc = (i) => (i < 1 || i >= kh.length || !Number.isFinite(kh[i].bx) || !Number.isFinite(kh[i - 1].bx) ? 0 : Math.hypot(kh[i].bx - kh[i - 1].bx, kh[i].by - kh[i - 1].by) / dd)
  for (let i = 1; i < kh.length; i++) {
    const a = kh[i - 1], b = kh[i]
    kc.push(b.ts - a.ts)
    if (!Number.isFinite(a.bx) || !Number.isFinite(b.bx)) continue
    const dm = buoc(i)
    if (!a.lt && !b.lt && nhacNgan(a.T) && nhacNgan(b.T)) { nhac += 1; if (dm < 0.25) dungNhac += 1 }
    if (!(a.lt && b.lt && a.lt.net === b.lt.net) && dm > 8 && dm > 3 * Math.max(buoc(i - 1), buoc(i + 1)) + 4) coc += 1
    if (a.lt && b.lt && a.lt.net === b.lt.net) {
      soTrong += 1
      const di = Math.hypot(fx.a * (b.lt.x - a.lt.x), fy.a * (b.lt.y - a.lt.y)) / dd
      if (di >= 2 && dm <= di * 0.25) dung += 1
      if (dm > di * 2 + 3) nhay += 1
      lechPx.push(Math.hypot(fx.a * b.lt.x + fx.b - b.bx, fy.a * b.lt.y + fy.b - b.by) / dd)
      if (di > 0.5) buocMs.push(dm / di)
      if (!b.ve) veLap += 1
    }
  }
  const giay = (kh[kh.length - 1].ts - kh[0].ts) / 1000
  return {
    khung: kh.length, giay: +giay.toFixed(1), trongNet: soTrong, dung, nhay, coc, khongVe: veLap, nhac, dungNhac,
    lechP50: +pt(lechPx, 0.5).toFixed(2), lechP95: +pt(lechPx, 0.95).toFixed(2), lechMax: +pt(lechPx, 1).toFixed(2),
    tiLeP05: +pt(buocMs, 0.05).toFixed(2), tiLeP95: +pt(buocMs, 0.95).toFixed(2),
    khP50: +pt(kc, 0.5).toFixed(1), khP95: +pt(kc, 0.95).toFixed(1), khMax: +pt(kc, 1).toFixed(0), khTren25: kc.filter((x) => x > 25).length,
    rsThap: kh.filter((k) => k.rs <= 2).length,
  }
}

const DT = { w: 844, h: 390, dpr: 2 }, MT = { w: 1366, h: 820, dpr: 1, mayTinh: true }
const CANH = [
  { ten: 'lien · điện thoại', kich: 'lien', ...DT },
  { ten: 'lien · máy tính', kich: 'lien', ...MT },
  { ten: 'thua · máy tính', kich: 'thua', ...MT },
  { ten: 'chu · máy tính', kich: 'chu', ...MT },
  { ten: 'chu · điện thoại CPU×4', kich: 'chu', ...DT, cpu: 4 },
  { ten: 'chong · máy tính', kich: 'chong', ...MT },
  { ten: 'cung-gio · máy tính', kich: 'cung-gio', ...MT },
  { ten: 'lien · tốc độ 2×', kich: 'lien', ...MT, td: 2 },
  { ten: 'lien · giờ tiếng bậc 120 ms', kich: 'lien', ...MT, bac: 120 },
  { ten: 'chu · giờ tiếng bậc 250 ms', kich: 'chu', ...MT, bac: 250 },
  { ten: 'lien · readyState tụt mỗi 300 ms', kich: 'lien', ...MT, rs: 300 },
  { ten: 'chu · readyState tụt mỗi 300 ms', kich: 'chu', ...MT, rs: 300 },
  { ten: 'chu · bậc 120 ms + readyState tụt', kich: 'chu', ...MT, bac: 120, rs: 300 },
  { ten: 'lien · bảng 2000 nét', kich: 'lien', ...MT, nen: 2000 },
  { ten: 'chu · bảng 3000 nét CPU×4', kich: 'chu', ...DT, nen: 3000, cpu: 4 },
  { ten: 'chu · máy yếu CPU×4', kich: 'chu', ...DT, yeu: true, cpu: 4 },
]
const tatCa = []
console.log('ĐỘ MƯỢT NÉT BÚT «XEM LẠI» (Chromium thật) — đứng / nhảy tính trong nét; đứng nhấc / vụt tính lúc nhấc bút ≤ 0,7 giây; lệch = ngòi bút ↔ chỗ lý tưởng (px CSS)')
for (const c of CANH) {
  if (CHON.length && !CHON.some((x) => c.ten.includes(x))) continue
  let r
  try { r = await doMot(c) } catch (e) { r = { hong: String(e.message).split('\n')[0] } }
  tatCa.push({ ten: c.ten, ...r })
  if (r.hong) { console.log(`✗ ${c.ten.padEnd(34)} ${r.hong}`); continue }
  console.log(`${c.ten.padEnd(34)} khung ${String(r.khung).padStart(4)} (trong nét ${String(r.trongNet).padStart(4)}) · ĐỨNG ${String(r.dung).padStart(3)} · NHẢY ${String(r.nhay).padStart(3)} · nhấc bút: đứng ${String(r.dungNhac).padStart(4)}/${String(r.nhac).padStart(4)} khung, VỤT ${String(r.coc).padStart(3)} · lệch p50 ${r.lechP50} p95 ${r.lechP95} lớn nhất ${r.lechMax} px · bước/lý tưởng p05 ${r.tiLeP05} p95 ${r.tiLeP95} · khung p50 ${r.khP50} p95 ${r.khP95} dài nhất ${r.khMax} ms (> 25 ms: ${r.khTren25}) · rs≤2: ${r.rsThap} · lỗi ${r.loi}${r.loi ? ` → ${r.loiDau}` : ''}`)
}
if (TEP_JSON) writeFileSync(TEP_JSON, JSON.stringify(tatCa, null, 1))
await trinh.close()
may.close()
