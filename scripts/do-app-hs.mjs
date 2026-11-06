#!/usr/bin/env node
// ĐO APP HỌC SINH TRÊN MÁY YẾU (30/09 — "app học sinh KHÔNG được lag/chậm ở bất kỳ phần nào").
//
// Chạy BẢN BUILD THẬT (dist/) trên Chromium của Playwright, mô phỏng điện thoại yếu: CPU chậm 6× (CDP), mạng Slow 4G
// (= "Fast 3G" cũ của DevTools: 562,5 ms RTT, 1,44 Mb/s xuống), màn 360×740 (dọc) và 740×360 (ngang). DỮ LIỆU GIẢ: máy
// chủ app được trả lời giả ngay trong script (mayChuGia) — không một byte nào tới máy chủ thật, không tài khoản thật.
//
//   node scripts/do-app-hs.mjs --dist=dist [--kich=mo-dau,mo-lai,man,heap] [--khung=doc|ngang] [--ra=kq.json]
//   node scripts/do-app-hs.mjs --kham=1   (in mọi lượt gọi máy chủ + chụp màn — dò đường khi viết kịch bản)
//   node scripts/do-app-hs.mjs --dist=<dist> --kich=anh --anh=<thư mục> [--omni=1] [--gio=ISO] [--cpu=1]
//        (ẢNH GIAO DIỆN màn học tập hiện tại, trạng thái tất định — so điểm ảnh hai bản: node scripts/do-app-hs/so-anh.mjs <trước> <sau>)
//        Thiếu ảnh / bước hỏng / lỗi trang ⇒ mã thoát 1.
//   Cờ chung: --toi=1 (giao diện tối) · --khong-yeu=1 (tắt chế độ máy yếu để chụp đúng kính mờ)
//
// Chromium: PW_CHROMIUM hoặc /opt/pw-browsers/chromium-*/chrome-linux/chrome (KHÔNG `playwright install`).
// Kết quả + cách đọc: docs/do-toi-uu-app-hs-3009.md.
import { execSync } from 'node:child_process'
import { createSecureServer } from 'node:http2'
import { tmpdir } from 'node:os'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { gzipSync, brotliCompressSync, constants as zc } from 'node:zlib'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(arg('dist', 'dist'))
const CPU = Number(arg('cpu', '6'))
const KICH = arg('kich', '')
const KHUNG = arg('khung', 'doc')
const RA = arg('ra', '')
const KHAM = arg('kham', '') === '1'
const CHUP = arg('chup', '')
const THU_MUC_ANH = arg('anh', '')
const OMNI_GIA = arg('omni', '') === '1'
const GIO = arg('gio', '2026-09-30T03:00:00Z')
const LAN = Number(arg('lan', '1'))
const PHUT_HEAP = Number(arg('phut-heap', '5'))
// --toi=1: giả máy đặt giao diện tối (prefers-color-scheme: dark). --khong-yeu=1: localStorage ddh.mayYeu='0' ⇒ app KHÔNG bật chế độ máy yếu
// (Chromium headless + RAM giả 2 GB bị nhận là máy yếu ⇒ tắt kính mờ, ảnh không giống máy thật tốt).
const TOI = arg('toi', '') === '1'
const KHONG_YEU = arg('khong-yeu', '') === '1'
const muon = (ten) => !KICH || KICH.split(',').includes(ten)
const MAN = KHUNG === 'ngang' ? { width: 740, height: 360 } : { width: 360, height: 740 }

function timChromium() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM
  if (existsSync('/usr/bin/chromium')) return '/usr/bin/chromium'
  const goc = '/opt/pw-browsers'
  if (!existsSync(goc)) return undefined
  for (const d of readdirSync(goc).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    for (const s of ['chrome-linux', 'chrome-linux64']) { const p = join(goc, d, s, 'chrome'); if (existsSync(p)) return p } // Playwright ≥ 1.5x đổi tên thư mục thành chrome-linux64
  }
  return undefined
}

// ── máy chủ tĩnh cục bộ: HTTP/2 + nén như Pages, trả index.html cho đường SPA. Chứng chỉ tự ký (Chromium chạy với
// --ignore-certificate-errors để service worker đăng ký được như trên máy thật).
function chungChi() {
  const k = join(tmpdir(), 'do-may-yeu-khoa.pem'), c = join(tmpdir(), 'do-may-yeu-cert.pem')
  if (!existsSync(k) || !existsSync(c)) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${k} -out ${c} -days 30 -subj /CN=127.0.0.1`, { stdio: 'ignore' })
  return { key: readFileSync(k), cert: readFileSync(c) }
}
const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' }
const NEN = new Set(['.js', '.css', '.html', '.json', '.svg', '.mjs'])
const boNho = new Map()
function mayChuTinh(thuMuc) {
  return new Promise((ok) => {
    const s = createSecureServer({ ...chungChi(), allowHTTP1: true }, (req, res) => {
      const u = new URL(req.url, 'http://x')
      let p = join(thuMuc, decodeURIComponent(u.pathname))
      if (!p.startsWith(thuMuc) || !existsSync(p) || statSync(p).isDirectory()) p = join(thuMuc, 'index.html')
      const ext = extname(p)
      let body = boNho.get(p)
      if (!body) {
        const tho = readFileSync(p)
        body = { tho, br: NEN.has(ext) ? brotliCompressSync(tho, { params: { [zc.BROTLI_PARAM_QUALITY]: 11 } }) : null, gz: NEN.has(ext) ? gzipSync(tho, { level: 9 }) : null }
        boNho.set(p, body)
      }
      // Pages: /assets/* có mã băm ⇒ cache lâu; trang + tệp public ⇒ hỏi lại.
      const h = { 'content-type': LOAI[ext] || 'application/octet-stream', 'cache-control': u.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' }
      const ae = req.headers['accept-encoding'] || ''
      if (body.br && /\bbr\b/.test(ae)) {
        res.writeHead(200, { ...h, 'content-encoding': 'br' })
        res.end(body.br)
      } else if (body.gz && /gzip/.test(ae)) {
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

// Slow 4G của DevTools (Lighthouse "mobile slow 4G"): 150 ms × 3,75 RTT, 1,6 Mb/s × 0,9 xuống, 750 kb/s × 0,9 lên.
const SLOW4G = { offline: false, latency: 562.5, downloadThroughput: (1.6 * 1024 * 1024 * 0.9) / 8, uploadThroughput: (750 * 1024 * 0.9) / 8 }

// ── đo trong trang: tác vụ dài, sơn, LCP, event timing (INP), đếm commit React ─────────────────────
const DO_TRONG_TRANG = () => {
  const d = (window.__do = { dai: [], lcp: 0, fcp: 0, sk: [], commit: 0, veLai: 0, ghiVe: false })
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
    new PerformanceObserver((l) => l.getEntries().forEach((e) => e.interactionId && d.sk.push([e.name, Math.round(e.startTime), Math.round(e.duration), e.interactionId]))).observe({ type: 'event', buffered: true, durationThreshold: 16 })
  } catch {}
  const laHam = (x) => x.tag === 0 || x.tag === 1 || x.tag === 11 || x.tag === 14 || x.tag === 15
  const dem = (f, xoa) => {
    let n = 0
    const ngan = [f]
    while (ngan.length) {
      const x = ngan.pop()
      if (!x) continue
      if (laHam(x)) {
        if (x.flags & 1 && !xoa) n++
        x.flags &= ~1
      }
      if (x.child) ngan.push(x.child)
      if (x.sibling) ngan.push(x.sibling)
    }
    return n
  }
  let goc = null
  window.__batDem = () => {
    if (goc) dem(goc.current, true)
    d.veLai = 0
    d.commit = 0
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
      goc = root
      if (d.ghiVe) d.veLai += dem(root.current, false)
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    checkDCE() {},
  }
}

/** Ghi khung trong `ms` (rAF): p95 thời gian khung, số khung > 33 ms, FPS trung bình và FPS p95 (= 1000 / khung p95). */
async function doKhung(p, ms) {
  return p.evaluate(
    (ms) =>
      new Promise((xong) => {
        const ds = []
        let truoc = performance.now()
        const dau = truoc
        const buoc = (t) => {
          ds.push(t - truoc)
          truoc = t
          if (t - dau < ms) requestAnimationFrame(buoc)
          else {
            const s = ds.slice(1).sort((a, b) => a - b)
            const p95 = s[Math.floor(s.length * 0.95)] || 0
            xong({ khung: s.length, cham33: s.filter((x) => x > 34).length, p95Ms: Math.round(p95), maxMs: Math.round(s[s.length - 1] || 0), fpsTb: Math.round((s.length * 1000) / ms), fpsP95: p95 ? Math.round(1000 / p95) : 0 })
          }
        }
        requestAnimationFrame(buoc)
      }),
    ms,
  )
}

async function heapMb(cdp) {
  try {
    await cdp.send('HeapProfiler.collectGarbage')
  } catch {}
  const h = await cdp.send('Runtime.getHeapUsage')
  return Math.round((h.usedSize / 1048576) * 10) / 10
}

/** Tổng tải theo loại (byte QUA DÂY) tới thời điểm gọi — tính từ Resource Timing của trang. */
async function dungLuongTai(p, den = Infinity) {
  return p.evaluate((den) => {
    const o = { jsKB: 0, jsThoKB: 0, soJs: 0, cssKB: 0, anhKB: 0, soAnh: 0, phongKB: 0, soPhong: 0, khacKB: 0 }
    for (const e of performance.getEntriesByType('resource')) {
      if (e.responseEnd > den) continue
      const n = e.name.split('?')[0]
      const kb = e.transferSize / 1024
      if (/\.m?js$/.test(n)) (o.jsKB += kb), (o.jsThoKB += e.decodedBodySize / 1024), o.soJs++
      else if (/\.css$/.test(n)) o.cssKB += kb
      else if (/\.(png|webp|avif|jpe?g|svg|gif)$/.test(n)) (o.anhKB += kb), o.soAnh++
      else if (/\.(woff2?|ttf)$/.test(n)) (o.phongKB += kb), o.soPhong++
      else o.khacKB += kb
    }
    for (const k of Object.keys(o)) o[k] = Math.round(o[k])
    return o
  }, den)
}

const tbt = (dai, tu = 0, den = Infinity) => dai.filter(([t]) => t >= tu && t <= den).reduce((s, [, d]) => s + Math.max(0, d - 50), 0)
const daiNhat = (dai, tu = 0, den = Infinity) => dai.filter(([t]) => t >= tu && t <= den).reduce((m, [, d]) => Math.max(m, d), 0)
/** TTI xấp xỉ (kiểu Lighthouse): sau mốc `tu`, lúc kết thúc tác vụ dài cuối cùng trước một cửa sổ yên 3 giây. */
function tti(dai, tu) {
  let moc = tu
  for (const [t, d] of dai.filter(([t, d]) => t + d >= tu).sort((a, b) => a[0] - b[0])) {
    if (t > moc + 3000) break
    moc = Math.max(moc, t + d)
  }
  return Math.round(moc)
}

// ── máy chủ app GIẢ (scripts/do-app-hs/may-chu-gia.ts, nạp bằng Vite SSR để dùng lại dữ liệu mẫu TS của app) ──────
const NHAT_KY = []
// Thời gian xử lý giả của Worker cho mỗi lệnh (p50 đo ở docs/do-tai-d1 ~ 40–80 ms) — cộng vào trễ mạng.
const MAY_CHU_MS = Number(arg('may-chu-ms', '60'))
let TRE_API = true
const vite = await (await import('vite')).createServer({ configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
const GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')
async function mayChuGia(ctx, goc) {
  await ctx.route(
    (u) => !u.href.startsWith(goc) && !u.href.startsWith('data:') && !u.href.startsWith('blob:'),
    async (r) => {
      const u = new URL(r.request().url())
      if (u.hostname !== 'omr.ttadodaihoc.workers.dev') return r.abort()
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors })
      let body = {}
      try {
        body = JSON.parse(r.request().postData() || '{}')
      } catch {}
      const tl = await GIA.traLoi(u.pathname, body)
      // Thân theo luồng (NDJSON) — máy chủ mới trả khi đăng nhập xin kèm Sảnh (may-chu-gia.ts `__ndjson`); còn lại JSON một khối.
      const laLuong = Array.isArray(tl.__ndjson)
      const than = laLuong ? tl.__ndjson.map((x) => JSON.stringify(x)).join('\n') + '\n' : JSON.stringify(tl)
      NHAT_KY.push([Date.now(), u.pathname + (body.action ? '#' + body.action : ''), than.length])
      // Yêu cầu trả lời giả KHÔNG chịu mạng giả lập của CDP (đo: 13 ms) ⇒ tự trễ đúng Slow 4G: 1 RTT + thời gian máy chủ + thân / băng thông.
      if (TRE_API) await new Promise((ok) => setTimeout(ok, SLOW4G.latency + MAY_CHU_MS + (than.length / 5 / SLOW4G.downloadThroughput) * 1000))
      return r.fulfill({ status: 200, contentType: laLuong ? 'application/x-ndjson' : 'application/json', headers: cors, body: than })
    },
  )
}

async function moMay(trinh, goc, { sw = false, mang = true } = {}) {
  const ctx = await trinh.newContext({ colorScheme: TOI ? 'dark' : 'light', viewport: MAN, screen: MAN, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: sw ? 'allow' : 'block', ignoreHTTPSErrors: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' })
  await ctx.addInitScript(DO_TRONG_TRANG)
  // Máy Android yếu thật: RAM 2 GB, 4 luồng ⇒ app tự bật chế độ `may-yeu` như trên máy em.
  await ctx.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 2, configurable: true })
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 4, configurable: true })
  })
  // '0' = không bao giờ bật máy yếu (src/lib/may-yeu.ts, do-nhip-khung.ts cũng tôn trọng). try: trang about:blank không có localStorage.
  if (KHONG_YEU) await ctx.addInitScript(() => { try { localStorage.setItem('ddh.mayYeu', '0') } catch {} })
  await mayChuGia(ctx, goc)
  const p = await ctx.newPage()
  const loi = []
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Network.enable')
  if (mang) await cdp.send('Network.emulateNetworkConditions', SLOW4G)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  return { ctx, p, cdp, loi }
}

async function dangNhap(p) {
  await p.waitForSelector('input[type="password"]', { timeout: 90000 })
  await p.locator('input').first().fill('99001')
  await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
  await cham(p, 'text=Đăng nhập')
}

// ── thao tác + đo trong trang ──────────────────────────────────────────────────────────────────────
// Giữ tên mốc SANH trong JSON để công cụ so sánh số đo cũ đọc được; màn thật nay là Hôm nay (hệ kính 02/11).
// 06/11: `.ht2-hn` không còn ⇒ chờ SỐ trên thẻ «Tổng câu hôm nay» (`.kb-hero`, TrongHs.tsx) — số chỉ hiện khi Sảnh đã về (aria-busy chỉ "true" lúc đang
// tải, trước lúc bắt đầu tải là "false" mà thẻ còn rỗng ⇒ không chờ riêng aria-busy). Vế sau giữ cho bản cũ trước 02/11 (mốc «app cũ» 26/10) đo được.
const SANH = '.kb-hero:not([aria-busy="true"]) .kb-so, .ht-app .ht2-hn[aria-busy="false"]'
// Thanh nổi (hệ kính): Hôm nay · Kiểm tra · Thành tích · Thêm. Luyện tập (Tự sửa lỗi, Câu đã làm, Tu luyện…) nằm trong tấm «Thêm».
const NUT_THEM = '.kb-thanh .tr-menu-cham'
const TAM_THEM_MO = '#tr-menu[data-mo]'
const MUC_LUYEN_TAP = '#tr-menu[data-mo] .tr-menu-muc[data-hien]'
const VE_HOM_NAY = '[aria-label="Về Hôm nay"], [aria-label="Về Lộ trình"]'
/** Nút chính trên Hôm nay (nhãn đổi theo việc: Bắt đầu / Học tiếp / Làm tiếp…) và phương án ở màn làm câu. */
const NUT_BAT_DAU = '.kb-cta'
const MAN_LAM_CAU = '.ht2-lam-pa'
const LUU_VE_HOM_NAY = '[aria-label="Lưu và về Hôm nay"]'
/** Màn làm câu đang phủ lên Hôm nay? (Hôm nay vẫn gắn bên dưới ⇒ SANH vẫn khớp; mở lại /hs thì app KHÔI PHỤC màn làm câu dở.) */
const dangLamCau = (p) => p.evaluate(({ chon, TIM_CHU }) => !!new Function('return ' + TIM_CHU)()(chon), { chon: MAN_LAM_CAU, TIM_CHU })
/** Rời màn làm câu bằng «Lưu và về Hôm nay», chờ phương án biến mất. */
async function roiLamCau(p) {
  await cham(p, LUU_VE_HOM_NAY)
  await p.waitForFunction(({ chon, TIM_CHU }) => !new Function('return ' + TIM_CHU)()(chon), { chon: MAN_LAM_CAU, TIM_CHU }, { polling: 100, timeout: 30000 })
}
/** Tìm phần tử trong trang: `text=…` (nút/nhãn chứa chữ, ưu tiên khớp đúng) hoặc bộ chọn CSS. Chạy TRONG trang (rẻ, không dò cây trợ năng). */
const TIM = (chon) => {
  const hien = (e) => !!e && (e.offsetWidth || e.offsetHeight || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden'
  if (chon.startsWith('text=')) {
    const chu = chon.slice(5)
    const ds = [...document.querySelectorAll('button,[role=button],[role=tab],a,label,summary')].filter(hien)
    return ds.find((e) => e.textContent.trim() === chu) || ds.find((e) => e.textContent.includes(chu)) || null
  }
  return [...document.querySelectorAll(chon)].find(hien) || null
}
const TIM_CHU = TIM.toString()
async function toaDo(p, chon) {
  return p.evaluate(
    ({ chon, TIM_CHU }) => {
      const e = new Function('return ' + TIM_CHU)()(chon)
      if (!e) return null
      e.scrollIntoView({ block: 'center', inline: 'center' })
      const r = e.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    },
    { chon, TIM_CHU },
  )
}
/** Chạm THẬT (sự kiện tin cậy qua CDP ⇒ có Event Timing / INP), không dùng .click() của Playwright (dò trợ năng trong trang đang bị hãm CPU). */
async function cham(p, chon, han = 30000) {
  const t = Date.now()
  let r = null
  while (!(r = await toaDo(p, chon))) {
    if (Date.now() - t > han) throw new Error('Không thấy để chạm: ' + chon)
    await p.waitForTimeout(100)
  }
  // Chạm bằng NGÓN (touch): không để lại con trỏ chuột ⇒ không có vòng dò hover mỗi khung (điện thoại không có chuột).
  await p.touchscreen.tap(r.x, r.y)
}
/** Chờ phần tử hiện; trả mốc performance.now() CỦA TRANG lúc thấy (hỏi 50 ms một lần). */
async function choThay(p, chon, han = 90000) {
  const h = await p.waitForFunction(({ chon, TIM_CHU }) => (new Function('return ' + TIM_CHU)()(chon) ? performance.now() : 0), { chon, TIM_CHU }, { polling: 50, timeout: han })
  return h.jsonValue()
}
const bayGio = (p) => p.evaluate(() => performance.now())
const batDo = (p) => p.evaluate(() => ((window.__do.dai = []), (window.__do.sk = []), window.__batDem()))
const layDo = (p) => p.evaluate(() => ({ dai: window.__do.dai, sk: window.__do.sk, commit: window.__do.commit, veLai: window.__do.veLai, fcp: window.__do.fcp, lcp: window.__do.lcp }))
/** INP của các lượt chạm sau `tu`: với mỗi interactionId lấy thời lượng lớn nhất (≈ trễ tới khung vẽ kế tiếp). */
const inpTu = (sk, tu) => {
  const m = new Map()
  for (const [, t, d, id] of sk) if (t >= tu - 5) m.set(id, Math.max(m.get(id) || 0, d))
  return Math.max(0, ...m.values())
}
/** Một bước: chạm `chon` → chờ `cho` hiện → nghỉ `nghi` ms. Trả thời gian chuyển màn, tác vụ dài, INP, số commit/component vẽ lại. */
async function buoc(p, chon, cho, nghi = 1500) {
  await batDo(p)
  const t0 = await bayGio(p)
  await cham(p, chon)
  const t1 = cho ? await choThay(p, cho) : t0
  await p.waitForTimeout(nghi)
  const d = await layDo(p)
  return { chuyenMs: cho ? Math.round(t1 - t0) : null, taskMax: daiNhat(d.dai, t0), tbt: tbt(d.dai, t0), inp: inpTu(d.sk, t0), commit: d.commit, veLai: d.veLai }
}
/** Như `buoc` nhưng không ném lỗi — màn thiếu nút thì ghi `loi`. */
const buocAn = (p, ...a) => buoc(p, ...a).catch((e) => ({ loi: String(e.message).slice(0, 80) }))
/** Đo khung khi đứng yên (hoạt ảnh tự chạy) — kèm tác vụ dài và số commit trong lúc đó. */
async function khung(p, ms = 5000) {
  await batDo(p)
  const t0 = await bayGio(p)
  const k = await doKhung(p, ms)
  const d = await layDo(p)
  return { ...k, taskMax: daiNhat(d.dai, t0), tbt: tbt(d.dai, t0), commit: d.commit, veLai: d.veLai }
}
/** Vuốt cuộn bằng ngón (CDP synthesizeScrollGesture, nguồn touch) trong `ms`, đo khung. */
async function khungCuon(p, ms = 4000, cdp) {
  await batDo(p)
  const t0 = await bayGio(p)
  const [k] = await Promise.all([
    doKhung(p, ms),
    (async () => {
      const het = Date.now() + ms - 400
      let len = false
      while (Date.now() < het) {
        await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(MAN.width / 2), y: Math.round(MAN.height / 2), yDistance: len ? 500 : -500, speed: 900, gestureSourceType: 'touch', repeatCount: 0 }).catch(() => {})
        len = !len
      }
    })(),
  ])
  const d = await layDo(p)
  return { ...k, taskMax: daiNhat(d.dai, t0), tbt: tbt(d.dai, t0), commit: d.commit, veLai: d.veLai }
}
async function domCounters(cdp) {
  try {
    const c = await cdp.send('Memory.getDOMCounters')
    return { nut: c.nodes, ngheSk: c.jsEventListeners }
  } catch {
    return {}
  }
}
// --vet=<tên>: ghi vết Chrome (luồng chính) lúc `tên` rồi in thời gian theo loại việc + theo tệp mã + hàm tốn nhất (CPU profile).
const VET = arg('vet', '')
async function batVet(cdp, ten) {
  if (VET !== ten) return
  const sk = []
  cdp.on('Tracing.dataCollected', (e) => sk.push(...e.value))
  cdp.__sk = sk
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 250 })
  await cdp.send('Profiler.start')
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute,v8,blink', transferMode: 'ReportEvents' })
}
async function inVet(cdp, ten) {
  if (VET !== ten) return
  const xong = new Promise((ok) => cdp.once('Tracing.tracingComplete', ok))
  await cdp.send('Tracing.end')
  await xong
  const { profile } = await cdp.send('Profiler.stop')
  const sk = cdp.__sk
  const dem = new Map()
  for (const e of sk) if (e.name === 'FunctionCall' || e.name === 'Layout' || e.name === 'UpdateLayoutTree') dem.set(e.tid, (dem.get(e.tid) || 0) + 1)
  const chinh = [...dem].sort((a, b) => b[1] - a[1])[0]?.[0]
  const theoTen = new Map(), theoTep = new Map()
  const tep = (u) => String(u || '').split('/').pop().replace(/-[\w-]{8}\.(js|css)$/, '.$1') || '(nội tuyến)'
  for (const e of sk) {
    if (e.tid !== chinh || e.ph !== 'X' || !e.dur || e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') continue
    theoTen.set(e.name, (theoTen.get(e.name) || 0) + e.dur / 1000)
    const u = e.args?.data?.url || e.args?.fileName || e.args?.data?.fileName || e.args?.data?.styleSheetUrl
    if (u && /EvaluateScript|v8.compile|v8.compileModule|ParseAuthorStyleSheet|v8.parseOnBackground|CompileScript|FunctionCall/.test(e.name)) {
      const k = `${e.name} ${tep(u)}`
      theoTep.set(k, (theoTep.get(k) || 0) + e.dur / 1000)
    }
  }
  const tu = new Map()
  const theoId = new Map(profile.nodes.map((n) => [n.id, n]))
  profile.samples.forEach((id, i) => {
    const cf = theoId.get(id).callFrame
    const k = `${cf.functionName || '(vô danh)'} ${tep(cf.url)}:${cf.lineNumber + 1}`
    tu.set(k, (tu.get(k) || 0) + (profile.timeDeltas[i] || 0) / 1000)
  })
  const inBang = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `  ${String(Math.round(v)).padStart(6)}  ${k}`).join('\n')
  console.error(`VẾT ${ten} — theo loại việc (ms, có lồng):\n${inBang(theoTen, 22)}\nTHEO TỆP:\n${inBang(theoTep, 30)}\nHÀM TỐN NHẤT (tự thân):\n${inBang(tu, 30)}`)
}

/** Hôm nay → Thêm → Luyện tập (chờ tấm Thêm mở hẳn: `cham` đo toạ độ một lần, CPU ×6 tấm còn đang trượt thì chạm trượt). */
async function vaoLuyenTap(p) {
  await cham(p, NUT_THEM)
  await choThay(p, TAM_THEM_MO, 20000)
  await p.waitForTimeout(500)
  await cham(p, MUC_LUYEN_TAP)
  await choThay(p, 'text=Câu đã làm', 20000)
}

/** Nút «Về Hôm nay» của Câu đã làm / Tu luyện nay quay về mục vừa mở (Luyện tập) ⇒ bấm tiếp «Hôm nay» trên thanh nổi. */
async function veHomNayTuLuyenTap(p) {
  if (await p.evaluate(({ chon, TIM_CHU }) => !!new Function('return ' + TIM_CHU)()(chon), { chon: SANH, TIM_CHU })) return
  await cham(p, NUT_THANH('Hôm nay'))
  await choThay(p, SANH, 20000)
}

async function veSanh(p) {
  await p.goto(goc + '/hs', { waitUntil: 'commit' })
  await choThay(p, SANH)
  await p.waitForTimeout(3000)
  if (await dangLamCau(p)) (await roiLamCau(p), await p.waitForTimeout(1500))
}

// ── kịch bản ────────────────────────────────────────────────────────────────────────────────────────
/** Lần mở ĐẦU (máy mới: không cache, chưa có service worker, chưa đăng nhập) → màn đăng nhập → Sảnh; rồi MỞ LẠI (có SW + đã đăng nhập). */
async function moDauVaMoLai() {
  const { ctx, p, loi } = await moMay(trinh, goc, { sw: true })
  const kq = {}
  try {
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    const tDn = await choThay(p, 'input[type="password"]')
    await p.waitForTimeout(300)
    const d0 = await layDo(p)
    const tapDn = await dungLuongTai(p, tDn)
    const tChamDn = await bayGio(p)
    await dangNhap(p)
    const tSanh = await choThay(p, SANH)
    await p.waitForTimeout(6000)
    const d1 = await layDo(p)
    kq.moDau = {
      fcp: d0.fcp, lcpDangNhap: d0.lcp, dangNhapSanSang: Math.round(tDn), taiToiDangNhap: tapDn,
      bamDangNhapToiSanh: Math.round(tSanh - tChamDn), sanhSanSang: Math.round(tSanh), tti: tti(d1.dai, tSanh), taskMax: daiNhat(d1.dai), tbt: tbt(d1.dai),
      taiToiSanh: await dungLuongTai(p, tSanh), taiSau6s: await dungLuongTai(p),
    }
    // Chờ service worker cài xong (precache đủ) — như em mở app lần đầu rồi để đó.
    const tSw = Date.now()
    await p.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready.then(() => true))
    kq.moDau.swCaiXongSauMs = Date.now() - tSw
    const p2 = await ctx.newPage()
    p2.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
    const cdp2 = await ctx.newCDPSession(p2)
    await cdp2.send('Network.enable')
    await cdp2.send('Network.emulateNetworkConditions', SLOW4G)
    await cdp2.send('Emulation.setCPUThrottlingRate', { rate: CPU })
    await p.close()
    for (let lan = 0; lan < 2; lan++) {
      if (lan === 1) await batVet(cdp2, 'mo-lai')
      await p2.goto(goc + '/hs', { waitUntil: 'commit' })
      const tS = await choThay(p2, SANH)
      await p2.waitForTimeout(5000)
      if (lan === 1) await inVet(cdp2, 'mo-lai')
      const d = await layDo(p2)
      kq[lan ? 'moLai2' : 'moLai'] = {
        fcp: d.fcp, lcp: d.lcp, sanhSanSang: Math.round(tS), tti: tti(d.dai, tS), taskMax: daiNhat(d.dai), tbt: tbt(d.dai),
        quaMang: await p2.evaluate(() => { let n = 0, kb = 0; for (const e of performance.getEntriesByType('resource')) if (e.transferSize > 0) (n++, (kb += e.transferSize / 1024)); return { soTep: n, kb: Math.round(kb) } }),
        swDieuKhien: await p2.evaluate(() => !!navigator.serviceWorker.controller),
      }
    }
    kq.loi = loi.slice(0, 5)
  } finally {
    await ctx.close()
  }
  return kq
}

/** Máy đã dùng app (SW + đăng nhập sẵn): đi qua từng màn. Lượt 0 = lần đầu mở màn (mảnh lười tải qua Slow 4G), lượt 1 = mở lại. */
async function cacMan() {
  const { ctx, p, cdp, loi } = await moMay(trinh, goc, { sw: true })
  const kq = { lan: [] }
  try {
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    await dangNhap(p)
    await choThay(p, SANH)
    await p.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready)
    for (let lan = 0; lan < 2; lan++) {
      GIA.datLai()
      const m = {}
      // Bọc đo: --vet=<tên bước> ghi vết đúng bước đó ở lượt 2 (mảnh đã nạp ⇒ chỉ còn việc CPU).
      const vet = async (ten, f) => {
        if (lan === 1) await batVet(cdp, ten)
        const r = await f()
        if (lan === 1) await inVet(cdp, ten)
        return r
      }
      const k = (ten, ms) => vet(ten, () => khung(p, ms))
      const kc = (ten, ms) => vet(ten, () => khungCuon(p, ms, cdp))
      const b = (ten, ...a) => vet(ten, () => buocAn(p, ...a))
      await veSanh(p)
      m.sanhYen = await k('sanhYen', 5000)
      // Câu đã làm (Thêm → Luyện tập → Câu đã làm): mở (tải chi tiết + công thức), lọc, cuộn.
      await veSanh(p)
      await vaoLuyenTap(p)
      m.vaoCauDaLam = await b('vaoCauDaLam', 'text=Câu đã làm', '.h2-cdl-loc', 4000)
      m.cdlLoc = await b('cdlLoc', 'text=Sai lần gần nhất', null, 2000)
      m.cdlLocTatCa = await b('cdlLocTatCa', 'text=Tất cả', null, 2000)
      m.cdlCuon = await kc('cdlCuon', 4000)
      // (khoá cũ giữ tên cho so-sanh.mjs) nay đo «Về» → Luyện tập hiện lại; rồi thanh nổi → Hôm nay.
      m.veSanhTuCdl = await b('veSanhTuCdl', VE_HOM_NAY, '.da-o', 1500)
      await veHomNayTuLuyenTap(p)
      // Tu luyện (Thêm → Luyện tập → Tu luyện): mở, từng thẻ chế độ, thẻ Tổng hợp.
      await vaoLuyenTap(p)
      m.vaoTuLuyen = await b('vaoTuLuyen', 'text=Tu luyện', 'text=Sửa câu sai', 2500)
      for (const [k, t] of [['tlSuaCauSai', 'Sửa câu sai'], ['tlDangCauSai', 'Dạng câu sai'], ['tlDangBai', 'Dạng bài'], ['tlTuDo', 'Tự do'], ['tlTongHop', 'Tổng hợp'], ['tlLuyenDe', 'Luyện đề cấu trúc'], ['tlLuyen', 'Luyện']]) m[k] = await b(k, 'text=' + t, null, 1500)
      m.veSanhTuTl = await b('veSanhTuTl', VE_HOM_NAY, '.da-o', 1500)
      // Màn làm câu: nút chính Hôm nay («Bắt đầu» / «Học tiếp»…) → phương án hiện.
      await veSanh(p)
      m.vaoLamCau = await b('vaoLamCau', NUT_BAT_DAU, MAN_LAM_CAU, 2500)
      await roiLamCau(p).catch(() => {})
      kq.lan.push(m)
    }
    kq.heapMB = await heapMb(cdp)
    kq.dom = await domCounters(cdp)
    kq.loi = loi.slice(0, 5)
  } finally {
    await ctx.close()
  }
  return kq
}

/** Kịch bản NGẮN (máy đang tải nặng): mở đầu + mở lại, rồi khung/tác vụ dài khi đứng yên ở Học tập,
 *  Câu đã làm (vuốt cuộn) — đúng những chỗ có hoạt ảnh chạy liên tục. Ghi từng phần vào `ra` ngay khi có (chạy dở vẫn còn số). */
async function nhanh(ghiDo) {
  const kq = await moDauVaMoLai()
  ghiDo(kq)
  const { ctx, p, cdp, loi } = await moMay(trinh, goc, { sw: true })
  try {
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    await dangNhap(p)
    await choThay(p, SANH)
    await p.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready)
    const m = (kq.man = {})
    const lam = async (ten, f) => {
      m[ten] = await f().catch((e) => ({ loi: String(e.message).slice(0, 80) }))
      ghiDo(kq)
    }
    GIA.datLai()
    await veSanh(p)
    await lam('sanhYen', () => khung(p, 5000))
    await lam('vaoCauDaLam', async () => (await vaoLuyenTap(p), buoc(p, 'text=Câu đã làm', '.h2-cdl-loc', 4000)))
    await lam('cdlCuon', () => khungCuon(p, 4000, cdp))
    await lam('cdlLocTatCa', () => buoc(p, 'text=Tất cả', null, 2500))
    kq.heapMB = await heapMb(cdp)
    kq.dom = await domCounters(cdp)
    kq.loiMan = loi.slice(0, 5)
    ghiDo(kq)
  } finally {
    await ctx.close()
  }
  return kq
}

/** Dùng liên tục `phut` phút KHÔNG tải lại trang (Học tập → Câu đã làm → Học tập → Tu luyện → Học tập): heap + nút DOM theo thời gian. */
async function heapDai(phut) {
  const { ctx, p, cdp, loi } = await moMay(trinh, goc, { sw: true })
  const kq = { mau: [] }
  try {
    TRE_API = false
    await p.goto(goc + '/hs', { waitUntil: 'commit' })
    await dangNhap(p)
    await choThay(p, SANH)
    await p.waitForTimeout(3000)
    const dau = Date.now()
    let vong = 0
    const ghi = async () => kq.mau.push({ vong, giay: Math.round((Date.now() - dau) / 1000), heapMB: await heapMb(cdp), ...(await domCounters(cdp)) })
    const ve = async () => {
      await cham(p, VE_HOM_NAY)
      await choThay(p, '.da-o', 20000)
      await veHomNayTuLuyenTap(p)
    }
    await ghi()
    while (Date.now() - dau < phut * 60000) {
      vong++
      GIA.datLai()
      await vaoLuyenTap(p); await cham(p, 'text=Câu đã làm'); await choThay(p, '.h2-cdl-loc', 20000).catch(() => {}); await p.waitForTimeout(2500)
      await ve(); await choThay(p, SANH, 20000).catch(() => {}); await p.waitForTimeout(800)
      await vaoLuyenTap(p); await cham(p, 'text=Tu luyện'); await choThay(p, 'text=Sửa câu sai', 20000).catch(() => {}); await p.waitForTimeout(1500)
      await ve(); await choThay(p, SANH, 20000).catch(() => {}); await p.waitForTimeout(800)
      if (vong % 2 === 0) await ghi()
    }
    await ghi()
    kq.loi = loi.slice(0, 5)
  } finally {
    TRE_API = true
    await ctx.close()
  }
  return kq
}

// ── ẢNH GIAO DIỆN để SO ĐIỂM ẢNH (thầy 05/10: "app của học sinh giữ nguyên mọi thứ giao diện, hình nền màu nhé") ──────────────────────
/** Một bước kịch bản: `chờ:<bộ chọn>` · `ngu:<ms>` · `kb:<json>` (đổi kịch bản máy chủ giả) · `css:<bộ chọn>` (bấm) · `cuon:<bộ chọn>` (cuộn tới)
 *  · `anh:<tên>` (chụp vào --anh, tắt hoạt ảnh/chuyển cảnh CHỈ lúc chụp) · `js:<biểu thức>` (in kết quả — dò lỗi) · còn lại = bấm theo chữ. */
/** Bước hỏng (không thấy / không bấm / không cuộn được) — gom lại để `--kich=anh` / `--kham` thoát mã 1 thay vì «chạy xong» mà thiếu ảnh. */
const BUOC_HONG = []
const hong = (loai, b) => () => (console.log(loai, b), BUOC_HONG.push(`${loai}: ${b}`))
async function chayBuoc(p, b) {
  // Chỉ phần tử ĐANG HIỆN: màn Hôm nay vẫn gắn trong DOM dưới các màn khác, cột bên (`.dm-ben`) có «Câu đã làm» ẩn trên điện thoại.
  if (b.startsWith('chờ:')) await p.waitForSelector(b.slice(4), { timeout: 30000 }).catch(hong('KHÔNG THẤY', b))
  else if (b.startsWith('ngu:')) await p.waitForTimeout(Number(b.slice(4)))
  else if (b.startsWith('kb:')) Object.assign(GIA.kichBan, JSON.parse(b.slice(3)))
  else if (b.startsWith('css:')) await p.locator(b.slice(4)).filter({ visible: true }).first().click({ timeout: 15000 }).catch(hong('KHÔNG BẤM ĐƯỢC', b))
  else if (b.startsWith('cuon:')) await p.locator(b.slice(5)).filter({ visible: true }).first().scrollIntoViewIfNeeded({ timeout: 15000 }).catch(hong('KHÔNG CUỘN ĐƯỢC', b))
  else if (b.startsWith('anh:')) await chupMan(p, b.slice(4))
  else if (b.startsWith('js:')) console.log('JS:', JSON.stringify(await p.evaluate(b.slice(3)).catch((e) => String(e.message).slice(0, 120))))
  else await p.getByText(b, { exact: false }).filter({ visible: true }).first().click({ timeout: 15000 }).catch(hong('KHÔNG BẤM ĐƯỢC', b))
}
/** Chờ mọi vùng cuộn (trang + phần tử cuộn được) ĐỨNG YÊN 3 lần đo liền (app tự cuộn mượt tới nút chốt… ⇒ chụp giữa chừng là lệch dọc). */
async function choCuonDung(p) {
  let truoc = ''
  for (let i = 0, yen = 0; i < 60 && yen < 3; i++) {
    const nay = await p.evaluate(() => [document.scrollingElement, ...document.querySelectorAll('*')].filter((e) => e && e.scrollHeight > e.clientHeight + 1).map((e) => e.scrollTop).join(','))
    yen = nay === truoc ? yen + 1 : 0
    truoc = nay
    await p.waitForTimeout(150)
  }
}
/** Chụp bằng chế độ tắt hoạt ảnh CÓ SẴN của Playwright (hoạt ảnh hữu hạn tua tới cuối, vô hạn về đầu rồi chạy tiếp) — KHÔNG chèn/gỡ CSS vào app:
 *  gỡ một luật `animation:none` làm mọi hoạt ảnh CHẠY LẠI từ đầu ⇒ khung co giãn giữa chừng, vùng cuộn nhảy về đầu (đã gặp 05/10, chụp lệch). */
async function chupMan(p, ten) {
  await choCuonDung(p)
  await p.screenshot({ path: join(THU_MUC_ANH, `${ten}.png`), animations: 'disabled', caret: 'hide' })
}
/** màn học tập hiện tại ở trạng thái TẤT ĐỊNH: giờ đóng băng (`--gio`, page.clock.setFixedTime), không giả mạng, mỗi kịch bản một phiên mới
 *  (đăng nhập lại). `--omni=1`: máy chủ giả trả thêm `omni` cho Sảnh như khi lớp bật OMNI. */
// 06/11: theo thanh nổi hệ kính (Hôm nay · Kiểm tra · Thành tích · Thêm); Luyện tập → Câu đã làm / Tu luyện đi qua tấm «Thêm»; thêm màn làm câu.
const NUT_THANH = (ten) => `.kb-thanh .kb-thanh-muc[aria-label="${ten}"]`
const O_TO = (ten) => `.da-o:has-text("${ten}")` // ô to của mục Luyện tập / Thành tích (TrongHs.tsx OTo)
const VAO_LUYEN_TAP = ['css:' + NUT_THEM, 'chờ:' + TAM_THEM_MO, 'ngu:800', 'css:' + MUC_LUYEN_TAP, `chờ:${O_TO('Câu đã làm')}:visible`, 'ngu:1500']
const KICH_ANH = [
  ['Hôm nay', true, ['ngu:2000', 'anh:1-hom-nay']],
  ['Kiểm tra', false, ['ngu:1000', 'css:' + NUT_THANH('Kiểm tra'), 'chờ:button:has-text("Vào ca kiểm tra"):visible', 'ngu:1500', 'anh:2-kiem-tra']],
  ['Thành tích', false, ['ngu:1000', 'css:' + NUT_THANH('Thành tích'), `chờ:${O_TO('Huy hiệu')}:visible`, 'ngu:2000', 'anh:3-thanh-tich']],
  ['Thêm → Luyện tập → Câu đã làm', false, ['ngu:1000', 'css:' + NUT_THEM, 'chờ:' + TAM_THEM_MO, 'ngu:800', 'anh:4-them', 'css:' + MUC_LUYEN_TAP, `chờ:${O_TO('Câu đã làm')}:visible`, 'ngu:1500', 'anh:5-luyen-tap',
    'css:' + O_TO('Câu đã làm'), 'chờ:.h2-cdl-loc', 'ngu:3000', 'anh:6-cau-da-lam']],
  ['Tu luyện', false, ['ngu:1000', ...VAO_LUYEN_TAP, 'css:' + O_TO('Tu luyện'), 'chờ:button:has-text("Sửa câu sai"):visible', 'ngu:2500', 'anh:7-tu-luyen']],
  ['Làm câu', false, ['ngu:1500', 'css:' + NUT_BAT_DAU, `chờ:${MAN_LAM_CAU}:visible`, 'ngu:2000', 'anh:8-lam-cau']],
]
async function chupAnhGiaoDien() {
  mkdirSync(THU_MUC_ANH, { recursive: true })
  const canCo = ['0-dang-nhap', ...KICH_ANH.flatMap(([, , b]) => b.filter((x) => x.startsWith('anh:')).map((x) => x.slice(4)))]
  for (const t of canCo) rmSync(join(THU_MUC_ANH, `${t}.png`), { force: true }) // ảnh cũ cùng tên không được tính là «đủ ảnh»
  TRE_API = false
  const ket = []
  for (const [ten, anhDangNhap, buoc] of KICH_ANH) {
    const hongTruoc = BUOC_HONG.length
    GIA.datLai()
    GIA.kichBan.omni = OMNI_GIA
    GIA.kichBan.gio = Date.parse(GIO) // dữ liệu mẫu cùng giờ đóng băng với trang
    const { ctx, p, loi } = await moMay(trinh, goc, { mang: false })
    try {
      await p.clock.setFixedTime(new Date(GIO))
      await p.goto(goc + '/hs')
      if (anhDangNhap) {
        await p.waitForSelector('input[type="password"]', { timeout: 90000 })
        await p.waitForTimeout(1500)
        await chupMan(p, '0-dang-nhap')
      }
      await dangNhap(p)
      await p.waitForSelector(SANH, { timeout: 90000 })
      for (const b of buoc) {
        await chayBuoc(p, b)
        await p.waitForTimeout(300)
      }
      ket.push({ kich: ten, loi: loi.slice(0, 3), hong: BUOC_HONG.slice(hongTruoc) })
    } catch (e) {
      ket.push({ kich: ten, loi: [...loi.slice(0, 3), String(e.message).slice(0, 160)], hong: BUOC_HONG.slice(hongTruoc) })
    } finally {
      await ctx.close()
    }
  }
  // Nghiệm thu: đủ ảnh + không bước hỏng + không lỗi trang ⇒ mã thoát 0.
  const thieu = canCo.filter((t) => !existsSync(join(THU_MUC_ANH, `${t}.png`)))
  if (thieu.length || ket.some((k) => k.loi.length || k.hong.length)) {
    process.exitCode = 1
    console.error(`ẢNH CHƯA ĐẠT — thiếu: ${thieu.join(', ') || 'không'} · kịch bản lỗi: ${ket.filter((k) => k.loi.length || k.hong.length).map((k) => k.kich).join(', ') || 'không'}`)
  }
  return { anh: canCo.length - thieu.length, thieu, kich: ket }
}

// ── chạy ─────────────────────────────────────────────────────────────────────────────────────────
const trinh = await chromium.launch({ headless: true, executablePath: timChromium(), args: ['--ignore-certificate-errors'] })
const { s, goc } = await mayChuTinh(DIST)
const ket = { dist: DIST, cpu: CPU, mang: 'slow4g', khung: MAN, luc: new Date().toISOString(), man: {} }
try {
  if (!KHAM && KICH === 'nhanh') ket.man.nhanh = await nhanh((kq) => RA && writeFileSync(RA, JSON.stringify({ ...ket, man: { nhanh: kq } }, null, 1)))
  else if (!KHAM && muon('mo-dau')) ket.man.moDau = await moDauVaMoLai()
  if (!KHAM && muon('man')) ket.man.cacMan = await cacMan()
  if (!KHAM && muon('heap')) ket.man.heap = await heapDai(PHUT_HEAP)
  if (!KHAM && KICH === 'anh') ket.man.anh = await chupAnhGiaoDien()
  if (KHAM) {
    // --buoc="Ôn & sửa|Tu luyện|…": bấm lần lượt theo chữ (hoặc `css:` bộ chọn), `chờ:` đợi bộ chọn, `ngu:ms`.
    TRE_API = false
    const { ctx, p, loi } = await moMay(trinh, goc, { mang: false })
    if (process.argv.some((a) => a.startsWith('--gio='))) await p.clock.setFixedTime(new Date(GIO))
    await p.goto(goc + '/hs')
    await dangNhap(p)
    await p.waitForSelector(SANH, { timeout: 60000 })
    for (const b of arg('buoc', '').split('|').filter(Boolean)) {
      await chayBuoc(p, b)
      await p.waitForTimeout(1500)
    }
    await p.waitForTimeout(3000)
    if (CHUP) await p.screenshot({ path: CHUP, type: 'jpeg', quality: 40 })
    const nut = await p.evaluate(() => [...document.querySelectorAll('button,[role=button],a,[role=tab]')].filter((b) => b.offsetParent).map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40)).filter(Boolean))
    console.log('NÚT:', JSON.stringify(nut))
    console.log('LỚP GỐC:', await p.evaluate(() => [...document.querySelectorAll('body > div > div > *, [class*="dao"], [class*="dh-"], [class*="tl-"], [class*="cdl"]')].slice(0, 12).map((e) => e.tagName + '.' + String(e.className).split(' ').slice(0, 3).join('.')).join(' ')))
    console.log('GỌI:', NHAT_KY.map((x) => x[1]).join(' '))
    console.log('LỖI:', loi.join(' | '))
    if (BUOC_HONG.length) (process.exitCode = 1), console.log('BƯỚC HỎNG:', BUOC_HONG.join(' | '))
    // Hoạt ảnh đang chạy: tên + thuộc tính bị đổi + phần tử; và ai đang gọi requestAnimationFrame liên tục.
    console.log('HOẠT ẢNH:', JSON.stringify(await p.evaluate(() => {
      const m = new Map()
      for (const a of document.getAnimations()) {
        const t = a.effect && a.effect.target
        const kf = a.effect && a.effect.getKeyframes ? a.effect.getKeyframes() : []
        const tt = [...new Set(kf.flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))].join('+')
        const k = `${a.animationName || a.constructor.name}|${tt}|${t ? t.tagName + '.' + String(t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className).split(' ')[0] : ''}|${a.playState}`
        m.set(k, (m.get(k) || 0) + 1)
      }
      return [...m].sort((a, b) => b[1] - a[1]).slice(0, 40)
    })))
    console.log('RAF/5s:', JSON.stringify(await p.evaluate(() => new Promise((ok) => {
      const goc = window.requestAnimationFrame
      const dem = new Map()
      window.requestAnimationFrame = function (f) {
        const st = (new Error().stack || '').split('\n')[2] || ''
        const k = st.trim().replace(/\?[^:]*/, '').split('/').pop().slice(0, 80)
        dem.set(k, (dem.get(k) || 0) + 1)
        return goc.call(window, f)
      }
      setTimeout(() => { window.requestAnimationFrame = goc; ok([...dem].sort((a, b) => b[1] - a[1]).slice(0, 10)) }, 5000)
    }))))
    await ctx.close()
  }
} finally {
  s.close()
  await trinh.close()
  await vite.close()
}
if (RA) writeFileSync(RA, JSON.stringify(ket, null, 1))
if (!KHAM) console.log(JSON.stringify(ket, null, 1))
