#!/usr/bin/env node
// ĐO MÁY YẾU (thầy 29/09: "tối ưu tất cả mọi thứ cho máy cấu hình yếu … không có ngoại lệ").
//
// Mô phỏng điện thoại yếu trên Chromium của Playwright: khổ 360×800, CPU chậm 6 lần (CDP
// Emulation.setCPUThrottlingRate), mạng Fast 3G (hoặc Slow 3G). CHỈ dữ liệu GIẢ: mọi yêu cầu ra
// ngoài máy chủ tĩnh cục bộ đều bị chặn, riêng máy chủ app được TRẢ LỜI GIẢ ngay trong script —
// không một byte nào tới máy chủ thật, không có dữ liệu học sinh thật.
//
// Đo từng màn: thời gian tới lúc dùng được (FCP / LCP / "sẵn sàng" = phần tử chính hiện), tổng tác
// vụ dài > 50 ms (TBT xấp xỉ), khung > 33 ms khi cuộn / chơi, bộ nhớ JS heap, số lượt React commit và
// số component vẽ lại mỗi thao tác, dung lượng JS nạp cho màn.
//
//   node scripts/do-may-yeu.mjs --dist=dist [--mang=fast3g|slow3g] [--cpu=6] [--chi=thi,hs] [--ra=kq.json]
//   node scripts/do-may-yeu.mjs --game=<thư mục build trang xem thử game> (xem scripts/do-may-yeu/)
//
// Chromium: PW_CHROMIUM hoặc /opt/pw-browsers/chromium-*/chrome-linux/chrome (KHÔNG `playwright install`).
import { execSync } from 'node:child_process'
import { createSecureServer } from 'node:http2'
import { tmpdir } from 'node:os'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(arg('dist', 'dist'))
const MANG = arg('mang', 'fast3g')
const CPU = Number(arg('cpu', '6'))
const CHI = arg('chi', '')
const RA = arg('ra', '')
const GAME = arg('game', '')
const LAN = Number(arg('lan', '1'))
// --may-chieu=1: đo TỜ CHIẾU lên bảng (html-may-chieu.ts, trang độc lập của máy chiếu) — khổ 1280×720, dữ liệu mẫu.
const MAY_CHIEU = arg('may-chieu', '') === '1'
// --goc=<URL> đo một máy chủ đang chạy sẵn (vd `npm run dev` để chẩn đoán có tên component) thay cho thư mục --dist.
const GOC = arg('goc', '')
const CHAN_DOAN = !!GOC
const MAY_YEU = arg('may-yeu', '1') !== '0'
const CHO_YEN = Number(arg('cho-yen', '8000'))
// --thac=1: in thác nước tải (tệp · bắt đầu → xong, KB) tại lúc màn "sẵn sàng" — tìm đường găng.
const THAC = arg('thac', '') === '1'
// --hoso=vao|chon: ghi hồ sơ CPU (CDP Profiler) lúc vào đề / lúc chọn đáp án, in 25 hàm tốn thời gian tự thân nhất (dùng với bản build --minify false).
const HOSO = arg('hoso', '')
// --vet=vao: ghi vết Chrome (devtools.timeline) lúc vào đề, cộng thời gian theo loại việc (Layout, Paint, Style, script…).
const VET = arg('vet', '')
async function batVet(cdp, ten) {
  if (VET !== ten) return
  VET_SK.length = 0
  cdp.on('Tracing.dataCollected', (e) => VET_SK.push(...e.value))
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute', transferMode: 'ReportEvents' })
}
const VET_SK = []
async function inVet(cdp, ten) {
  if (VET !== ten) return
  const xong = new Promise((ok) => cdp.once('Tracing.tracingComplete', ok))
  await cdp.send('Tracing.end')
  await xong
  // Chỉ luồng chính của trang: luồng có nhiều sự kiện 'FunctionCall' nhất.
  const theoLuong = new Map()
  for (const e of VET_SK) if (e.name === 'FunctionCall' || e.name === 'Layout') theoLuong.set(e.tid, (theoLuong.get(e.tid) || 0) + 1)
  const chinh = [...theoLuong].sort((a, b) => b[1] - a[1])[0]?.[0]
  const tong = new Map()
  for (const e of VET_SK) if (e.tid === chinh && e.ph === 'X' && e.dur && e.name !== 'RunTask') tong.set(e.name, (tong.get(e.name) || 0) + e.dur / 1000)
  console.error(`(${VET_SK.length} sự kiện)`)
  console.error(`VẾT ${ten} (luồng chính, ms, có lồng nhau):\n` + [...tong].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `  ${String(Math.round(v)).padStart(6)}  ${k}`).join('\n'))
}
async function batHoSo(cdp, ten) {
  if (HOSO !== ten) return
  await cdp.send('Profiler.enable')
  if (process.env.DO_NGUON) await cdp.send('Debugger.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
  await cdp.send('Profiler.start')
}
async function inHoSo(cdp, ten) {
  if (HOSO !== ten) return
  const { profile } = await cdp.send('Profiler.stop')
  const tu = new Map()
  const dt = profile.timeDeltas
  const theoId = new Map(profile.nodes.map((n) => [n.id, n]))
  profile.samples.forEach((id, i) => {
    const n = theoId.get(id)
    const cf = n.callFrame
    const k = `${cf.functionName || '(vô danh)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`
    tu.set(k, (tu.get(k) || 0) + (dt[i] || 0) / 1000)
  })
  const tong = [...tu.values()].reduce((a, b) => a + b, 0)
  if (process.env.DO_NGUON) {
    // In đoạn mã quanh hàm vô danh tốn nhất (trang dựng bằng setContent không có URL).
    const tuTheoNut = new Map()
    profile.samples.forEach((id, i) => tuTheoNut.set(id, (tuTheoNut.get(id) || 0) + (dt[i] || 0)))
    const nut = [...tuTheoNut].sort((a, b) => b[1] - a[1]).map(([id]) => theoId.get(id)).find((n) => n.callFrame.scriptId !== '0' && n.callFrame.url === '' && !n.callFrame.functionName)
    if (nut) {
      const { scriptSource } = await cdp.send('Debugger.getScriptSource', { scriptId: nut.callFrame.scriptId })
      const dong = scriptSource.split('\n')[nut.callFrame.lineNumber] || ''
      console.error('NGUỒN nóng nhất:', nut.callFrame.functionName || '(vô danh)', 'dòng', nut.callFrame.lineNumber + 1, ':', dong.slice(Math.max(0, nut.callFrame.columnNumber - 100), nut.callFrame.columnNumber + 400))
    }
  }
  console.error(`HỒ SƠ ${ten} (tổng ${Math.round(tong)} ms):\n` + [...tu].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `  ${String(Math.round(v)).padStart(6)} ms  ${k}`).join('\n'))
}
const inThac = async (p, nhan) => {
  if (!THAC) return
  const ds = await p.evaluate(() => performance.getEntriesByType('resource').map((e) => [e.name.split('/').pop().slice(0, 40), Math.round(e.startTime), Math.round(e.responseEnd), Math.round(e.transferSize / 1024)]))
  console.error(`THÁC ${nhan}:\n` + ds.sort((a, b) => a[2] - b[2]).map((x) => `  ${x[0].padEnd(42)} ${String(x[1]).padStart(6)} → ${String(x[2]).padStart(6)}  ${x[3]} KB`).join('\n'))
}

function timChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM
  const goc = '/opt/pw-browsers'
  if (!existsSync(goc)) return undefined
  for (const d of readdirSync(goc).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const p = join(goc, d, 'chrome-linux', 'chrome')
    if (existsSync(p)) return p
  }
  return undefined
}

// ── máy chủ tĩnh cục bộ: HTTP/2 + gzip như Pages (HTTP/1.1 chỉ 6 kết nối/máy ⇒ 40 mảnh JS xếp hàng, sai lệch
// hẳn so với Cloudflare), trả index.html cho đường SPA. Chứng chỉ tự ký sinh một lần bằng openssl vào thư mục tạm.
function chungChi() {
  const k = join(tmpdir(), 'do-may-yeu-khoa.pem'), c = join(tmpdir(), 'do-may-yeu-cert.pem')
  if (!existsSync(k) || !existsSync(c)) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${k} -out ${c} -days 30 -subj /CN=127.0.0.1`, { stdio: 'ignore' })
  return { key: readFileSync(k), cert: readFileSync(c) }
}
const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }
const NEN = new Set(['.js', '.css', '.html', '.json', '.svg'])
const boNho = new Map()
function mayChuTinh(thuMuc, trangMacDinh = 'index.html') {
  return new Promise((ok) => {
    const s = createSecureServer({ ...chungChi(), allowHTTP1: true }, (req, res) => {
      const u = new URL(req.url, 'http://x')
      let p = join(thuMuc, decodeURIComponent(u.pathname))
      if (!p.startsWith(thuMuc) || !existsSync(p) || statSync(p).isDirectory()) p = join(thuMuc, trangMacDinh)
      const ext = extname(p)
      let body = boNho.get(p)
      if (!body) {
        const tho = readFileSync(p)
        body = { tho, gz: NEN.has(ext) ? gzipSync(tho, { level: 9 }) : null }
        boNho.set(p, body)
      }
      const h = { 'content-type': LOAI[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
      if (body.gz && /gzip/.test(req.headers['accept-encoding'] || '')) {
        res.writeHead(200, { ...h, 'content-encoding': 'gzip' })
        res.end(body.gz)
      } else {
        res.writeHead(200, h)
        res.end(body.tho)
      }
    })
    s.listen(0, '127.0.0.1', () => ok({ s, goc: `https://127.0.0.1:${s.address().port}` }))
  })
}

// ── mạng giả lập (số của DevTools / Lighthouse) ──────────────────────────────────────────────────
const MANG_GIA = {
  fast3g: { offline: false, latency: 562.5, downloadThroughput: (1474.56 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 },
  slow3g: { offline: false, latency: 2000, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 },
  khong: null,
}

// ── đo trong trang: tác vụ dài, sơn, LCP, event timing, đếm commit React ─────────────────────────
const DO_TRONG_TRANG = () => {
  const d = (window.__do = { dai: [], lcp: 0, fcp: 0, sk: [], commit: 0, veLai: 0, ghiVe: false, ghiTen: false, ten: [], tatCa: [] })
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => d.dai.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (d.lcp = Math.round(e.startTime)))).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => e.name === 'first-contentful-paint' && (d.fcp = Math.round(e.startTime)))).observe({ type: 'paint', buffered: true })
  } catch {}
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => d.sk.push([e.name, Math.round(e.startTime), Math.round(e.duration), Math.round(e.processingEnd - e.processingStart)]))).observe({ type: 'event', buffered: true, durationThreshold: 16 })
  } catch {}
  // Móc DevTools giả: React bản build vẫn gọi onCommitFiberRoot ⇒ đếm commit. Khi `ghiVe` bật, duyệt cây đếm component
  // hàm/lớp THẬT SỰ chạy lại trong commit đó: cờ PerformedWork (= 1, cờ React để riêng cho DevTools) được React đặt khi
  // component chạy; nhánh bỏ qua giữ cờ cũ ⇒ sau mỗi lượt đếm tự XOÁ cờ này để lượt sau chỉ thấy component vừa chạy.
  const laHam = (x) => x.tag === 0 || x.tag === 1 || x.tag === 11 || x.tag === 14 || x.tag === 15
  const tenCua = (x) => (x.type && (x.type.displayName || x.type.name)) || (x.elementType && (x.elementType.displayName || x.elementType.name)) || '?'
  const dem = (f, xoa) => {
    let n = 0
    // Mỗi phần tử ngăn xếp: [fiber, component hàm gần nhất phía trên có vẽ lại trong commit này không].
    const ngan = [[f, false]]
    while (ngan.length) {
      const [x, chaVe] = ngan.pop()
      if (!x) continue
      let veDay = chaVe
      if (laHam(x)) {
        const ve = !!(x.flags & 1)
        if (ve && !xoa) {
          n++
          // Chẩn đoán (chạy trên `npm run dev` để có tên component): gốc lượt vẽ = component vẽ lại mà cha hàm KHÔNG vẽ lại.
          if (d.ghiTen) {
            d.tatCa.push(tenCua(x))
            if (!chaVe) d.ten.push(tenCua(x))
          }
        }
        veDay = ve
        x.flags &= ~1
      }
      if (x.child) ngan.push([x.child, veDay])
      if (x.sibling) ngan.push([x.sibling, chaVe])
    }
    return n
  }
  let gocHienTai = null
  window.__batDem = (ghiTen = false) => {
    d.ghiTen = ghiTen
    d.ten = []
    d.tatCa = []
    if (gocHienTai) dem(gocHienTai.current, true)
    d.veLai = 0
    d.ghiVe = true
  }
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject() {
      return 1
    },
    onCommitFiberRoot(_id, root) {
      d.commit++
      gocHienTai = root
      if (d.ghiVe) d.veLai += dem(root.current, false)
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    checkDCE() {},
  }
}

/** Ghi khung trong `ms` mili giây (rAF). `viec` (chuỗi JS) chạy mỗi khung — vd cuộn. */
async function doKhung(p, ms, viec = '') {
  return p.evaluate(
    ({ ms, viec }) =>
      new Promise((xong) => {
        const f = viec ? new Function('t', viec) : null
        const ds = []
        let truoc = performance.now()
        const dau = truoc
        const buoc = (t) => {
          ds.push(t - truoc)
          truoc = t
          if (f) f(t - dau)
          if (t - dau < ms) requestAnimationFrame(buoc)
          else {
            const s = ds.slice(1).sort((a, b) => a - b)
            const p95 = s[Math.floor(s.length * 0.95)] || 0
            xong({ khung: s.length, cham33: s.filter((x) => x > 33.4).length, p95: Math.round(p95), max: Math.round(s[s.length - 1] || 0), fps: Math.round((s.length * 1000) / ms) })
          }
        }
        requestAnimationFrame(buoc)
      }),
    { ms, viec },
  )
}

async function heapMb(cdp) {
  try {
    await cdp.send('HeapProfiler.collectGarbage')
  } catch {}
  const h = await cdp.send('Runtime.getHeapUsage')
  return Math.round((h.usedSize / 1048576) * 10) / 10
}

async function dungLuongTai(p) {
  return p.evaluate(() => {
    let js = 0, jsTho = 0, css = 0, soJs = 0
    const ds = []
    for (const e of performance.getEntriesByType('resource')) {
      if (/\.js(\?|$)/.test(e.name)) (js += e.transferSize), (jsTho += e.decodedBodySize), soJs++, ds.push(e.name.split('/').pop().replace(/-[\w-]{8}\.js$/, '') + ':' + Math.round(e.transferSize / 1024))
      else if (/\.css(\?|$)/.test(e.name)) css += e.transferSize
    }
    return { jsKB: Math.round(js / 1024), jsThoKB: Math.round(jsTho / 1024), soJs, cssKB: Math.round(css / 1024), tepJs: ds.join(' ') }
  })
}

const demTen = (ds) => JSON.stringify(Object.entries(ds.reduce((o, t) => ((o[t] = (o[t] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1]).slice(0, 15))
const tbt = (dai, tu = 0, den = Infinity) => dai.filter(([t]) => t >= tu && t <= den).reduce((s, [, d]) => s + Math.max(0, d - 50), 0)

// ── máy chủ app GIẢ (chỉ trong trang, không chạm máy chủ thật) ──────────────────────────────────
const MAU_CHU = Object.keys(JSON.parse(readFileSync(new URL('../tests/fixtures/chem-html-truoc-2809.json', import.meta.url), 'utf8'))).filter((s) => s.length > 6)
const chu = (i, n = 3) => Array.from({ length: n }, (_, k) => MAU_CHU[(i * 7 + k * 13) % MAU_CHU.length]).join('. ')
function deGia(soI = 24, soII = 8, soIII = 8) {
  const phanI = Array.from({ length: soI }, (_, i) => ({
    id: `I${i}`,
    text: `Câu ${i + 1}: ${chu(i, 3)} Tính $\\frac{m_{${i}}}{M} = \\dfrac{12,${i}}{${100 + i}}$ rồi chọn đáp án đúng.`,
    choices: [chu(i + 1, 1), chu(i + 2, 1), `$${i}\\,\\text{mol}$ ${chu(i + 3, 1)}`, chu(i + 4, 1)],
  }))
  const phanII = Array.from({ length: soII }, (_, i) => ({ id: `II${i}`, text: `Câu: ${chu(i + 50, 3)}`, ideas: [chu(i + 51, 1), chu(i + 52, 1), chu(i + 53, 1), `$\\Delta H = -${i + 10}\\,kJ$`] }))
  const phanIII = Array.from({ length: soIII }, (_, i) => ({ id: `III${i}`, text: `Câu: ${chu(i + 90, 4)} Tính $x = \\sqrt{${i + 2}}$.` }))
  return { phanI, phanII, phanIII, soCau: { I: soI, II: soII, III: soIII } }
}
const NHAT_KY_GOI = []
// Trả lời giả theo đường (cổng học sinh sau đăng nhập): Sảnh 2.0 (cùng dữ liệu mẫu phép kiểm tests/hoa2-sanh-2709), danh sách rỗng còn lại.
const SANH_GIA = { ok: true, cheDo2: true, ngay: '2026-09-30', chienDich: { id: 'cd1', ten: 'Ester – Lipid', hanNop: '2026-10-04', D: 5, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: '2026-10-02' }, theLuc: { con: 32, tong: 40 }, huyetChien: false, doan: { con: 4 }, dao: { con: 28 }, khoaDao: false, loiKhoaDao: '', ruong: { daLam: 8, tong: 40, moDuoc: false, daMo: false } }
const TRA_LOI_GIA = { '/hs/game#hoa2-sanh': SANH_GIA, '/game#hoa2-sanh': SANH_GIA }
let CACH_VAO = 'moi' // 'cho' ⇒ máy chủ giả trả phòng chờ (thầy chưa bấm Bắt đầu)
async function mayChuGia(ctx, goc) {
  const DE = deGia()
  await ctx.route(
    (u) => u.origin !== goc,
    async (r) => {
      const u = new URL(r.request().url())
      if (u.hostname !== 'omr.ttadodaihoc.workers.dev') return r.abort()
      const json = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) })
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
      let body = {}
      try {
        body = JSON.parse(r.request().postData() || '{}')
      } catch {}
      if (u.pathname === '/goi' && body.action === 'tenTheoSbd') return json({ ok: true, sbd: body.sbd, hoTen: 'Học Sinh Thử', lop: '12A0', tenCa: 'Ca đo máy yếu' })
      if (u.pathname === '/vao-thi' && CACH_VAO === 'cho') return json({ ok: true, cach: 'cho', lop: '12A0', thoiGianPhut: 50, congBo: 'khong', tenCa: 'Ca đo máy yếu' })
      if (u.pathname === '/goi' && body.action === 'trangThaiPhongCho') return json({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'mo' })
      if (u.pathname === '/vao-thi') {
        const bay = new Date()
        return json({ ok: true, cach: 'moi', lop: '12A0', thoiGianPhut: 50, congBo: 'khong', lanThu: 1, vaoLuc: bay.toISOString(), hetGioLuc: new Date(bay.getTime() + 50 * 60000).toISOString(), nguongLan: 99, nguongGiay: 999, loai: 'thi', tenCa: 'Ca đo máy yếu', giuDeDoc: false, deUrl: '/de-gia.json', soCau: DE.soCau })
      }
      if (u.pathname === '/de-gia.json') return json(DE)
      NHAT_KY_GOI.push(u.pathname + (body.action ? '#' + body.action : ''))
      if (u.pathname === '/hs/dang-nhap') return json({ ok: true, token: 'tk-gia', sbd: body.sbd, hoTen: 'Học Sinh Thử', lop: '12A0', namSinh: '2008' })
      const tl = TRA_LOI_GIA[u.pathname + (body.action ? '#' + body.action : '')] ?? TRA_LOI_GIA[u.pathname]
      if (tl) return json(typeof tl === 'function' ? tl(body) : tl)
      return json({ ok: true })
    },
  )
}

// ── các màn ───────────────────────────────────────────────────────────────────────────────────────
async function moMay(trinh, goc, { mang = MANG, cpu = CPU, truocKhiMo = null } = {}) {
  const ctx = await trinh.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', ignoreHTTPSErrors: true, locale: 'vi-VN', userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' })
  await ctx.addInitScript(DO_TRONG_TRANG)
  // Máy Android yếu thật: RAM 2 GB, 4 luồng ⇒ app tự bật chế độ `may-yeu` (src/lib/may-yeu.ts) như trên máy em.
  if (MAY_YEU) await ctx.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 2, configurable: true })
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 4, configurable: true })
  })
  await mayChuGia(ctx, goc)
  if (truocKhiMo) await truocKhiMo(ctx)
  const p = await ctx.newPage()
  const loi = []
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Network.enable')
  if (MANG_GIA[mang]) await cdp.send('Network.emulateNetworkConditions', MANG_GIA[mang])
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  return { ctx, p, cdp, loi }
}

async function choThay(p, sel, han = 90000) {
  const t0 = Date.now()
  await p.waitForSelector(sel, { state: 'visible', timeout: han })
  return Date.now() - t0
}

async function doTai(trinh, goc, duong, sel) {
  const { ctx, p, cdp, loi } = await moMay(trinh, goc)
  const t0 = Date.now()
  await p.goto(goc + duong, { waitUntil: 'commit' })
  await choThay(p, sel)
  const sanSang = Date.now() - t0
  await inThac(p, duong)
  await p.waitForTimeout(2500)
  const d = await p.evaluate(() => window.__do)
  const kq = { sanSangMs: sanSang, fcp: d.fcp, lcp: d.lcp, tbt: tbt(d.dai), taiDai: d.dai.length, taiDaiMax: Math.max(0, ...d.dai.map((x) => x[1])), commit: d.commit, heapMB: await heapMb(cdp), ...(await dungLuongTai(p)), loi: loi.length }
  await ctx.close()
  return kq
}

async function doThi(trinh, goc) {
  const { ctx, p, cdp, loi } = await moMay(trinh, goc)
  const t0 = Date.now()
  await p.goto(goc + '/t/123456', { waitUntil: 'commit' })
  await choThay(p, 'input[placeholder="Số báo danh"]')
  const sanSang = Date.now() - t0
  await inThac(p, 'thi')
  await p.fill('input[placeholder="Số báo danh"]', '99001')
  await p.getByRole('button', { name: 'Vào thi', exact: true }).click()
  // Bước xác nhận tên (thầy chốt 07/09) ⇒ bấm nút bắt đầu trong hộp xác nhận.
  await p.waitForTimeout(300)
  const tVao = Date.now()
  const tVaoTrang = await p.evaluate(() => performance.now())
  await batHoSo(cdp, 'vao')
  await batVet(cdp, 'vao')
  for (let i = 0; i < 40; i++) {
    if (await p.locator('#cau-1').count()) break
    const nut = p.getByRole('button', { name: /Đúng là em|Bắt đầu|Vào thi/ }).last()
    if (await nut.count()) await nut.click({ timeout: 2000 }).catch(() => {})
    await p.waitForTimeout(500)
  }
  await choThay(p, '#cau-1')
  const vaoDe = Date.now() - tVao
  await p.waitForTimeout(3000)
  await inHoSo(cdp, 'vao')
  await inVet(cdp, 'vao')
  const d0 = await p.evaluate(() => window.__do)
  // Tác vụ dài từ lúc bấm vào thi tới khi đề hiện (+3 s) — không tính lượt tải trang.
  const tbtVao = tbt(d0.dai, tVaoTrang)
  // CHỌN ĐÁP ÁN: 8 câu phần I — lượt 1 đo THỜI GIAN (không duyệt cây), lượt 2 đếm component vẽ lại (duyệt cây tốn thời gian riêng).
  const bamCau = (i) =>
    p.evaluate(
      (i) =>
        new Promise((xong) => {
          document.getElementById(`cau-${i}`)?.scrollIntoView({ block: 'center' })
          setTimeout(() => {
            const nut = document.querySelectorAll(`#cau-${i} .pa-hang`)[i % 4]
            const t = performance.now()
            nut.click()
            requestAnimationFrame(() => setTimeout(() => xong(Math.round(performance.now() - t)), 0))
          }, 300)
        }),
      i,
    )
  await p.evaluate(() => ((window.__do.commit = 0), (window.__do.dai = [])))
  await batHoSo(cdp, 'chon')
  const chon = []
  for (let i = 1; i <= 8; i++) chon.push(await bamCau(i))
  await inHoSo(cdp, 'chon')
  const dChon = await p.evaluate(() => window.__do)
  await p.evaluate((c) => (window.__batDem(c), (window.__do.commit = 0)), CHAN_DOAN)
  for (let i = 9; i <= 12; i++) await bamCau(i)
  const d1 = await p.evaluate(() => ((window.__do.ghiVe = false), window.__do))
  const veMoiLanChon = Math.round(d1.veLai / 4)
  const commitChon = dChon.commit
  // CUỘN cả đề 6 giây (bước 14 px/khung như vuốt đều).
  await p.evaluate(() => window.scrollTo(0, 0))
  await p.waitForTimeout(500)
  await p.evaluate((c) => ((window.__do.dai = []), (window.__do.commit = 0), c && window.__batDem(true)), CHAN_DOAN)
  const cuon = await doKhung(p, 6000, 'window.scrollBy(0, 14)')
  const d2 = await p.evaluate(() => ((window.__do.ghiVe = false), window.__do))
  if (CHAN_DOAN) console.error('CUỘN — gốc vẽ lại:', demTen(d2.ten))
  // NGỒI YÊN 12 giây (đồng hồ mỗi giây + lưu tạm 10 giây): lượt 1 đo khung/tác vụ dài, lượt 2 đếm component vẽ lại.
  await p.waitForTimeout(500)
  await p.evaluate(() => ((window.__do.commit = 0), (window.__do.dai = [])))
  const ngoi = await doKhung(p, 12000)
  const d3 = await p.evaluate(() => window.__do)
  if (CHAN_DOAN) console.error('CHỌN — gốc vẽ lại:', demTen(d1.ten))
  await p.evaluate((c) => window.__batDem(c), CHAN_DOAN)
  await p.waitForTimeout(12000)
  const d4 = await p.evaluate(() => ((window.__do.ghiVe = false), window.__do))
  if (CHAN_DOAN) console.error('NGỒI YÊN — gốc vẽ lại:', demTen(d4.ten), '\nTẤT CẢ:', demTen(d4.tatCa))
  const kq = {
    sanSangMs: sanSang,
    fcp: d0.fcp,
    lcp: d0.lcp,
    vaoDeMs: vaoDe,
    tbtKhiVaoDe: tbtVao,
    taiDaiNhatKhiVaoDe: Math.max(0, ...d0.dai.filter(([t]) => t >= tVaoTrang).map((x) => x[1])),
    tbtTaiTrang: tbt(d0.dai, 0, tVaoTrang),
    chonMsTB: Math.round(chon.reduce((a, b) => a + b, 0) / chon.length),
    chonMsMax: Math.max(...chon),
    veLaiMoiLanChon: veMoiLanChon,
    commitKhiChon8: commitChon,
    tbtKhiChon8: tbt(dChon.dai),
    cuon: { ...cuon, tbt: tbt(d2.dai), commit: d2.commit },
    ngoi12s: { commit: d3.commit, taiDai: d3.dai.length, tbt: tbt(d3.dai), cham33: ngoi.cham33, veLai12s: d4.veLai },
    heapMB: await heapMb(cdp),
    ...(await dungLuongTai(p)),
    loi: loi.length,
  }
  if (loi.length) kq.loiDau = loi[0]
  await ctx.close()
  return kq
}

// PHÒNG CHỜ (cả lớp đứng chờ thầy bấm Bắt đầu, có trò chơi nhặt nguyên tử): đo khung + commit khi ngồi chờ.
async function doPhongCho(trinh, goc) {
  CACH_VAO = 'cho'
  const { ctx, p, cdp, loi } = await moMay(trinh, goc)
  try {
    await p.goto(goc + '/t/123456', { waitUntil: 'commit' })
    await choThay(p, 'input[placeholder="Số báo danh"]')
    await p.fill('input[placeholder="Số báo danh"]', '99001')
    await p.getByRole('button', { name: 'Vào thi', exact: true }).click()
    await p.waitForTimeout(300)
    for (let i = 0; i < 20; i++) {
      if (await p.locator('canvas').count()) break
      const nut = p.getByRole('button', { name: /Đúng là em|Bắt đầu|Vào thi/ }).last()
      if (await nut.count()) await nut.click({ timeout: 2000 }).catch(() => {})
      await p.waitForTimeout(500)
    }
    await choThay(p, 'canvas')
    await p.waitForTimeout(3000)
    await p.evaluate(() => ((window.__do.dai = []), (window.__do.commit = 0), window.__batDem()))
    const k = await doKhung(p, 6000)
    const d = await p.evaluate(() => ((window.__do.ghiVe = false), window.__do))
    return { ...k, tbt: tbt(d.dai), commit: d.commit, veLai: d.veLai, heapMB: await heapMb(cdp), loi: loi.length }
  } finally {
    CACH_VAO = 'moi'
    await ctx.close()
  }
}

// CỔNG HỌC SINH SAU ĐĂNG NHẬP (máy chủ giả): thời gian tới màn chính + ngồi yên 10 giây (khung, commit, vẽ lại).
async function doCongHs(trinh, goc) {
  const { ctx, p, cdp, loi } = await moMay(trinh, goc)
  try {
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    await choThay(p, 'text=Đăng nhập')
    await p.locator('input').first().fill('99001')
    await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
    const t0 = Date.now()
    await p.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await p.waitForFunction(() => !document.body.innerText.includes('Quên mật khẩu'), null, { timeout: 60000 })
    await p.waitForTimeout(6000)
    const vao = Date.now() - t0
    if (process.env.DO_CHUP) await p.screenshot({ path: process.env.DO_CHUP, type: 'jpeg', quality: 45 })
    const d0 = await p.evaluate(() => window.__do)
    await p.evaluate((c) => ((window.__do.dai = []), (window.__do.commit = 0), window.__batDem(c)), CHAN_DOAN)
    const k = await doKhung(p, 10000)
    const d = await p.evaluate(() => ((window.__do.ghiVe = false), window.__do))
    if (CHAN_DOAN) console.error('CỔNG HS NGỒI YÊN — gốc vẽ lại:', demTen(d.ten), '\nGỌI:', [...new Set(NHAT_KY_GOI)].join(' '))
    return { vaoMs: vao, tbtVao: tbt(d0.dai), yen10s: { ...k, tbt: tbt(d.dai), commit: d.commit, veLai: d.veLai }, heapMB: await heapMb(cdp), loi: loi.length, loiDau: loi[0] }
  } finally {
    await ctx.close()
  }
}

// ── trang xem thử game (bản build riêng, xem scripts/do-may-yeu/) ─────────────────────────────────
async function doGame(trinh, goc, duong, cho, thaoTac, truocKhiMo) {
  const { ctx, p, cdp, loi } = await moMay(trinh, goc, { mang: 'khong', truocKhiMo })
  const t0 = Date.now()
  await p.goto(goc + duong, { waitUntil: 'commit' })
  await choThay(p, cho)
  const sanSang = Date.now() - t0
  // Chờ 8 giây cho hoạt ảnh mở màn (một lượt) chạy xong — đo trạng thái em thật sự ngồi nhìn.
  await p.waitForTimeout(CHO_YEN)
  await p.evaluate(() => ((window.__do.dai = []), (window.__do.commit = 0), window.__batDem()))
  const yen = await doKhung(p, 5000)
  const dYen = await p.evaluate(() => window.__do)
  let thao = null
  if (thaoTac) {
    await p.evaluate(() => ((window.__do.dai = []), (window.__do.commit = 0), window.__batDem()))
    const [k] = await Promise.all([doKhung(p, 5000), thaoTac(p)])
    const dT = await p.evaluate(() => window.__do)
    thao = { ...k, tbt: tbt(dT.dai), commit: dT.commit, veLai: dT.veLai }
  }
  const kq = { sanSangMs: sanSang, yen5s: { ...yen, tbt: tbt(dYen.dai), commit: dYen.commit, veLai: dYen.veLai }, thaoTac: thao, heapMB: await heapMb(cdp), loi: loi.length, loiDau: loi[0] }
  await ctx.close()
  return kq
}

// ── chạy ─────────────────────────────────────────────────────────────────────────────────────────
const trinh = await chromium.launch({ headless: true, executablePath: timChromium() })
const ket = { dist: DIST, mang: MANG, cpu: CPU, mayYeu: MAY_YEU, luc: new Date().toISOString(), man: {} }
const nen = (a) => {
  // Trung vị theo từng số khi chạy nhiều lượt.
  if (a.length === 1) return a[0]
  const o = {}
  for (const k of Object.keys(a[0])) {
    const v = a.map((x) => x[k])
    o[k] = typeof v[0] === 'number' ? v.sort((x, y) => x - y)[Math.floor(v.length / 2)] : v[0]
  }
  return o
}
const lap = async (f) => {
  const r = []
  for (let i = 0; i < LAN; i++) r.push(await f())
  return nen(r)
}
const muon = (ten) => !CHI || CHI.split(',').includes(ten)

if (MAY_CHIEU) {
  const { createServer } = await import('vite')
  const vite = await createServer({ configFile: false, server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true }, appType: 'custom' })
  try {
    const { taoHtmlMayChieu } = await vite.ssrLoadModule('/src/lib/html-may-chieu.ts')
    const pet = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><circle cx="80" cy="80" r="65" fill="rgb(59,130,110)"/></svg>')
    const ds = Array.from({ length: Number(process.env.SO_EM || 12) }, (_, i) => ({ sbd: `MAU-${i}`, hoTen: `Học sinh mẫu ${i + 1}`, soCau: i + 1,
      thanThu: { anh: pet, ten: 'Thạch Quy', danhHieu: '', he: 'Đất', capDo: 3, hinhThai: '', tangThapCaoNhat: 1, soCauDaThanhTay: 0 },
      cau: { id: `DE-I-${i + 1}`, maDe: 'DE', phan: 'I', text: `Câu ${i + 1}: ${chu(i, 3)}`, luaChon: [chu(i + 1, 1), chu(i + 2, 1), chu(i + 3, 1), chu(i + 4, 1)], dapAn: 'A', sao: 0, mucDo: 'biet', chuyenDe: 'Ester', dang: 'bai_tap', chot: chu(i + 5, 1), lyDo: null, buoc: [], ketQua: 'A' } }))
    for (const dayHoc of [true, false]) {
      const html = taoHtmlMayChieu(ds, { dayHoc, tenBuoi: 'Đo máy yếu' })
      const ten = dayHoc ? 'mayChieuDayHoc' : 'mayChieuChuaBai'
      ket.man[ten] = await lap(async () => {
        const ctx = await trinh.newContext({ viewport: { width: 1280, height: 720 } })
        await ctx.addInitScript(DO_TRONG_TRANG)
        await ctx.route('**/*', (r) => (r.request().url().startsWith('data:') ? r.continue() : r.abort()))
        const p = await ctx.newPage()
        const cdp = await ctx.newCDPSession(p)
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
        const t0 = Date.now()
        await batVet(cdp, 'mo')
        await batHoSo(cdp, 'mo')
        await p.setContent(html)
        await p.waitForFunction(() => document.body.classList.contains('mc-san-sang'), null, { timeout: 60000 })
        const sanSang = Date.now() - t0
        await inHoSo(cdp, 'mo')
        await inVet(cdp, 'mo')
        await p.waitForTimeout(3000)
        await p.evaluate(() => (window.__do.dai = []))
        const yen = await doKhung(p, 5000)
        const dY = await p.evaluate(() => window.__do)
        await p.evaluate(() => (window.__do.dai = []))
        await batHoSo(cdp, 'lenbang')
        await batVet(cdp, 'lenbang')
        // Bấm bằng DOM, KHÔNG dùng p.getByRole(...).click(): Playwright dò cây trợ năng NGAY TRONG TRANG (đang bị hãm CPU ×6)
        // ⇒ chính phép đo tạo ra một khung ~600 ms (đo nhầm "khung giật 633 ms" ở PR #79).
        const nutLenBang = await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Lên bảng') || null)
        const [goi] = await Promise.all([doKhung(p, 4000), p.evaluate((b) => b && b.click(), nutLenBang)])
        await inHoSo(cdp, 'lenbang')
        await inVet(cdp, 'lenbang')
        const dG = await p.evaluate(() => window.__do)
        // Đóng màn gọi tên rồi sang ĐỢT TIẾP (trang kế của dải trượt ngang).
        await p.evaluate(() => document.querySelector('.mc-goi')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
        await p.waitForTimeout(1500)
        await p.evaluate(() => (window.__do.dai = []))
        const nutTiep = await p.evaluateHandle(() => document.getElementById('mc-sau'))
        const [tiep] = await Promise.all([doKhung(p, 2500), p.evaluate((b) => b && b.click(), nutTiep)])
        const dT = await p.evaluate(() => window.__do)
        const kq = { sanSangMs: sanSang, yen5s: { ...yen, tbt: tbt(dY.dai) }, lenBang4s: { ...goi, tbt: tbt(dG.dai) }, dotTiep: { ...tiep, tbt: tbt(dT.dai) }, heapMB: await heapMb(cdp) }
        await ctx.close()
        return kq
      })
    }
  } finally {
    await vite.close()
  }
} else if (GAME) {
  const { s, goc } = await mayChuTinh(resolve(GAME), 'index.html')
  // Trang xem thử game không chạy main.tsx ⇒ tự gắn chế độ máy yếu + tờ CSS máy yếu như app thật trên máy yếu.
  const cssMayYeu = readFileSync(new URL('../src/styles/may-yeu.css', import.meta.url), 'utf8')
  const ganMayYeu = async (ctx) => {
    if (!MAY_YEU) return
    await ctx.addInitScript((css) => {
      // <html> chưa có lúc chạy script đầu trang ⇒ gắn ngay khi phần tử gốc xuất hiện (trước mã của trang).
      const gan = () => {
        const g = document.documentElement
        if (!g || g.classList.contains('may-yeu')) return !!g
        g.classList.add('may-yeu')
        const st = document.createElement('style')
        st.textContent = css
        g.append(st)
        return true
      }
      if (!gan()) {
        const mo = new MutationObserver(() => gan() && mo.disconnect())
        mo.observe(document, { childList: true, subtree: true })
      }
    }, cssMayYeu)
  }
  const cham = (sel) => async (p) => {
    for (let i = 0; i < 4; i++) {
      await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {})
      await p.waitForTimeout(900)
    }
  }
  const cuon = async (p) => p.evaluate(() => new Promise((ok) => { let n = 0; const f = () => { window.scrollBy(0, 12); document.querySelectorAll('*').length; if (++n < 250) requestAnimationFrame(f); else ok() }; requestAnimationFrame(f) }))
  const g = (duong, cho, thao) => doGame(trinh, goc, duong, cho, thao, ganMayYeu)
  if (muon('dao')) ket.man.dao = await lap(() => g('/src/game/than-thu-v2/dao/xem-thu.html?man=vo', 'button', cuon))
  if (muon('dao2')) ket.man.dao2 = await lap(() => g('/src/game/than-thu-v2/dao2/xem-thu.html', 'button', cham('button')))
  if (muon('doan2')) ket.man.doan2 = await lap(() => g('/src/game/than-thu-v2/doan2/xem-thu-2.html', 'button', cham('button')))
  for (const m of ['sanh', 'hs', 'ph', 'phbang']) if (muon(m)) ket.man[m] = await lap(() => g(`/scripts/do-may-yeu/trang-do.html?man=${m}`, '#xong', cuon))
  s.close()
} else {
  const { s, goc } = GOC ? { s: { close() {} }, goc: GOC } : await mayChuTinh(DIST)
  if (muon('thi')) ket.man.thi = await lap(() => doThi(trinh, goc))
  if (muon('phongcho')) ket.man.phongCho = await lap(() => doPhongCho(trinh, goc))
  if (muon('conghs')) ket.man.congHs = await lap(() => doCongHs(trinh, goc))
  if (muon('hs')) ket.man.hs = await lap(() => doTai(trinh, goc, '/hs', 'text=Đăng nhập'))
  if (muon('ph')) ket.man.ph = await lap(() => doTai(trinh, goc, '/ph', 'text=Vào xem kết quả của con'))
  if (muon('gv')) ket.man.gv = await lap(() => doTai(trinh, goc, '/gv', 'text=Mở app'))
  s.close()
}
await trinh.close()
const chuoi = JSON.stringify(ket, null, 1)
if (RA) writeFileSync(RA, chuoi)
console.log(chuoi)
