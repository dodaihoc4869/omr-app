#!/usr/bin/env node
// ĐO «GIẤY VÀ BẢNG CO GIÃN ĐỘC LẬP» (11/11) — Chromium THẬT, phòng THẬT trong Node (may-chu.mjs), dữ liệu giả. Đo trên CÙNG một câu, CÙNG một nét mẫu:
//   · cỡ chữ đề trên máy em (px CSS thật trên màn = cỡ chữ khai × phép co đang áp),
//   · bề dày một nét mẫu thầy kẻ ngang trên bảng đen (đếm điểm ảnh có mực của canvas bảng, đổi ra px CSS),
// ở năm khổ máy em, qua ba trạng thái: vừa vào (bảng trống) ⇒ thầy viết trên bảng quá 2 giây ⇒ thầy quay lại gạch trên giấy quá 2 giây.
// Chạy được với CẢ bản cũ (một phép co) lẫn bản mới ⇒ bảng TRƯỚC / SAU:
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <dist>
//   node scripts/thu-live-1011/do-doc-lap-1111.mjs <dist> <tệp số đo .json> [thư mục ảnh — có thì chụp bộ that-4-em-*.jpg]
// Biến môi trường: DL_CPU=4 (bóp CPU máy em 844 khi đo khung hình) · DL_ANH=1 (câu có ẢNH: giấy dựng thường — chỉ chụp + đo máy em 844 rồi thôi).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const SO_DO = resolve(process.argv[3] ?? 'so-do-doc-lap.json')
const ANH = process.argv[4] ? resolve(process.argv[4]) : null
if (ANH) mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const loiTrang = []
const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function chup(t, ten, tuy = {}) {
  if (!ANH) return
  let q = 86, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, ...tuy }); q -= 6 } while (buf.length > 150 * 1000 && q > 30)
  writeFileSync(join(ANH, `that-4-em-${ten}.jpg`), buf)
  console.log(`  ảnh that-4-em-${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}
const ANH_GIA = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240" viewBox="0 0 640 240"><rect width="640" height="240" fill="white"/><g fill="none" stroke="#1f2937" stroke-width="3"><path d="M90 40v120a40 40 0 0 0 80 0V40"/><path d="M70 40h120"/><path d="M130 30v-18h170v60"/><path d="M270 72h60v110a30 30 0 0 1-60 0z"/><path d="M420 60h120v130H420z"/><path d="M300 110h120"/></g><g fill="#2563eb" opacity="0.35"><path d="M92 110h76v50a38 38 0 0 1-76 0z"/><path d="M272 130h56v52a28 28 0 0 1-56 0z"/></g><g font-family="sans-serif" font-size="20" fill="#111827"><text x="78" y="225">Ống 1</text><text x="268" y="230">Ống 2</text><text x="436" y="225">Bình hứng</text></g></svg>')
const CO_ANH = !!process.env.DL_ANH
const CAU = { ...(CO_ANH ? { thanCauImg: ANH_GIA } : {}), qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] }
const KHO = [['844x390', 844, 390, 2, 'S1'], ['667x375', 667, 375, 2, 'S2'], ['1180x820', 1180, 820, 2, 'S3'], ['1971x1247', 1971, 1247, 1, 'S4'], ['iPhone dọc xoay 390x844', 390, 844, 3, 'S5']]

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay${CO_ANH ? '&anh=1' : ''}`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
await may.moLuot(CAU, 'B')

// ───────────── NĂM MÁY EM ─────────────
const em = {}
for (const [ten, w, h, dpr, sbd] of CO_ANH ? KHO.slice(0, 1) : KHO) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: w < 1200 })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${ten}: ${e.message}`))
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}`)
  await t.locator('.bpu-hs').waitFor({ timeout: 20000 })
  em[ten] = { t, ctx }
}
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(500)
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await ngu(1700)
for (const ten of Object.keys(em)) {
  const t = em[ten].t
  await t.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await t.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
  await t.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
  await t.locator('.lv').waitFor({ timeout: 6000 })
  await t.locator('.lv[data-soi]').waitFor({ timeout: 6000 }).catch(() => {})
}
await ngu(900)

/** Số đo trên máy em: cỡ chữ đề (px CSS thật), khung giấy / khung bảng, bề dày nét mẫu trên bảng (px CSS thật). `cot` = hoành độ lấy mẫu (0..1 bề ngang ô bảng của thầy). */
const do1 = (t, cot = 0.72) => t.evaluate((cot) => {
  const lv = document.querySelector('.lv'), xoay = lv.hasAttribute('data-xoay')
  const hop = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return xoay ? [Math.round(r.top), Math.round(innerWidth - r.right), Math.round(r.height), Math.round(r.width)] : [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }
  const co = (e) => { if (!e || !e.offsetWidth) return null; const r = e.getBoundingClientRect(); return Math.round(parseFloat(getComputedStyle(e).fontSize) * (xoay ? r.height : r.width) / e.offsetWidth * 100) / 100 }
  const chu = document.querySelector('.lv-gt[data-khop] .lv-gt-chu'), pa = [...document.querySelectorAll('.lv-gt[data-khop] .lv-gt-chu')][1]
  // nét mẫu: cột `cot` của canvas bảng ⇒ dải điểm ảnh có mực dài nhất
  let day = null, dai = null
  const c = document.querySelector('.lv-cuon canvas'), khung = document.querySelector('.lv-cuon')
  if (c && c.width > 2 && khung && getComputedStyle(khung).visibility !== 'hidden') {
    // bề dày = tổng độ phủ mực dọc một cột (điểm ảnh mờ ở mép tính theo phần), trung bình 9 cột quanh `cot` ⇒ chính xác dưới một điểm ảnh
    const k = c.width / parseFloat(c.style.width), g2 = c.getContext('2d')
    let tong = 0, so = 0
    for (let j = -4; j <= 4; j++) { const x = Math.round(c.width * (cot + j * 0.025)), d = g2.getImageData(x, 0, 1, c.height).data; let a = 0; for (let i = 3; i < d.length; i += 4) a += d[i]; tong += a / 255; so++ }
    day = Math.round(tong / so / k * 100) / 100
    // bề DÀI nét mẫu (thầy kẻ ngang 80 % bề ngang bảng): hàng nhiều mực nhất quanh cột mẫu ⇒ cột có mực đầu tiên tới cột cuối — tỉ lệ thuận với phép co của bảng
    { const x = Math.round(c.width * cot), d = g2.getImageData(x, 0, 1, c.height).data; let y = 0, lon = 0; for (let i = 3, r = 0; i < d.length; i += 4, r++) if (d[i] > lon) { lon = d[i]; y = r }
      const y0 = Math.max(0, y - Math.ceil(4 * k)), cao = Math.min(c.height - y0, Math.ceil(8 * k)), h = g2.getImageData(0, y0, c.width, cao).data
      let dau = -1, cuoi = -1
      for (let cx = 0; cx < c.width; cx++) { let co = false; for (let r = 0; r < cao; r++) if (h[(r * c.width + cx) * 4 + 3] > 60) { co = true; break } if (co) { if (dau < 0) dau = cx; cuoi = cx } }
      dai = dau < 0 ? null : Math.round((cuoi - dau + 1) / k * 10) / 10 }
  }
  const g = document.querySelector('.lv-giay'), cuon = document.querySelector('.lv-kg-cuon')
  return { chuDe: co(chu), chuPhuongAn: co(pa), giay: hop(g), bang: hop(document.querySelector('.lv-bang')), net: day, netDai: dai, soi: lv.hasAttribute('data-soi'), cuonGiay: cuon ? [Math.round(cuon.scrollTop), cuon.scrollHeight, cuon.clientHeight] : null, mui: g?.getAttribute('data-mui') ?? null }
}, cot)
const doHet = async (nhan, kq) => { for (const ten of Object.keys(em)) { (kq[ten] ??= {})[nhan] = await do1(em[ten].t) } }
const kq = {}
if (CO_ANH) {
  // CÂU CÓ ẢNH: giấy thầy «lạ» ⇒ máy em dựng giấy theo bề ngang khung của EM (chữ to tự nhiên, ảnh co vừa khung), nét trên giấy ẩn; bảng đen vẫn co giãn độc lập
  const t = em['844x390'].t
  const bang0 = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
  await thay.mouse.move(bang0.x + bang0.w * 0.1, bang0.y + bang0.h * 0.3); await thay.mouse.down()
  for (let i = 1; i <= 30; i++) { await thay.mouse.move(bang0.x + bang0.w * (0.1 + 0.8 * i / 30), bang0.y + bang0.h * (0.3 + 0.03 * Math.sin(i / 3))); await ngu(10) }
  await thay.mouse.up(); await ngu(2800)
  const d = await t.evaluate(() => { const g = document.querySelector('.lv-giay'), a = g.querySelector('img'), c = g.querySelector('.lv-de-trong'), chu = g.querySelector('.lv-de-trong p, .lv-de-trong .ht2-lam-de, .lv-de-trong [class*="de"]'); const r = a?.getBoundingClientRect(), G = g.getBoundingClientRect(); const k = c ? c.getBoundingClientRect().width / c.offsetWidth : 1; return { soi: document.querySelector('.lv').hasAttribute('data-soi'), coAnh: !!a, anhTrongKhung: !!r && r.left >= G.left - 1 && r.right <= G.right + 1 && r.width > 40, heSoPhong: Math.round(k * 100) / 100, chuDe: chu ? Math.round(parseFloat(getComputedStyle(chu).fontSize) * k * 100) / 100 : null, giay: [Math.round(G.left), Math.round(G.width)], cvGiayAn: getComputedStyle(g.querySelector('canvas')).display === 'none' } })
  console.log('câu có ảnh (844 × 390):', JSON.stringify(d))
  await chup(t, '844-cau-co-anh-giay-dung-thuong')
  writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), cauCoAnh: d, loiTrang }, null, 2) + '\n')
  await trinh.close(); await may.dong()
  process.exit(loiTrang.length ? 1 : 0)
}
await doHet('vua_vao_bang_trong', kq)
await chup(em['844x390'].t, '844-vua-vao-giay-uu-tien')

// ───────────── KHUNG HÌNH khi thầy viết (máy em 844) ─────────────
const E = em['844x390']
const cdp = await E.ctx.newCDPSession(E.t)
const cpu = Number(process.env.DL_CPU || 1)
if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
await E.t.evaluate(() => { const K = (window.__kh = { t: [], luc: [], xep: [], chay: true }); let truoc = performance.now(); const f = (n) => { K.t.push(n - truoc); K.luc.push(n); truoc = n; if (K.chay) requestAnimationFrame(f) }; requestAnimationFrame(f); K.viec = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) K.viec.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ entryTypes: ['longtask'] }) } catch { /* không hỗ trợ */ } const g = document.querySelector('.lv-giay'); if (g) new MutationObserver(() => K.xep.push(performance.now())).observe(g, { attributes: true, attributeFilter: ['style'] }) })

// ───────────── THẦY VIẾT TRÊN BẢNG: nét mẫu kẻ ngang (dài), rồi vài nét ngắn cho đủ hơn 2 giây ─────────────
const bang = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
const ke = async (x0, y0, x1, y1, buoc = 30, nghi = 8) => { await thay.mouse.move(x0, y0); await thay.mouse.down(); for (let i = 1; i <= buoc; i++) { await thay.mouse.move(x0 + (x1 - x0) * i / buoc, y0 + (y1 - y0) * i / buoc); await ngu(nghi) } await thay.mouse.up() }
await ke(bang.x + bang.w * 0.1, bang.y + bang.h * 0.3, bang.x + bang.w * 0.9, bang.y + bang.h * 0.3, 40, 8)
await ngu(700)
await doHet('net_dau_tren_bang_chua_qua_2_giay', kq)
// chụp đúng LÚC khung bảng đang nở (phép transform đang chạy): chờ khung bảng nhận chuyển động rồi chụp sau 150 ms
const dangNo = ANH ? E.t.waitForFunction(() => /transform/.test(document.querySelector('.lv-bang')?.style.transition ?? ''), null, { polling: 'raf', timeout: 6000 }).then(async () => { await ngu(150); await chup(E.t, '844-bang-dang-no') }, () => console.log('  (không bắt được lúc khung bảng đang nở)')) : null
for (let i = 0; i < 5; i++) { await ke(bang.x + bang.w * 0.1, bang.y + bang.h * (0.4 + i * 0.05), bang.x + bang.w * 0.4, bang.y + bang.h * (0.42 + i * 0.05), 22, 12); await ngu(120) }
await dangNo
await ngu(900)
await doHet('thay_viet_bang_qua_2_giay', kq)
await chup(E.t, '844-bang-uu-tien')
await chup(em['667x375'].t, '667-bang-uu-tien')
await chup(em['1180x820'].t, '1180-bang-uu-tien', { scale: 'css' })
await chup(em['1971x1247'].t, '1971-bang-uu-tien', { scale: 'css' })
await chup(em['iPhone dọc xoay 390x844'].t, 'iphone-doc-xoay-bang-uu-tien')
const khung = await E.t.evaluate(() => { const K = window.__kh; K.chay = false; const t = K.t.slice(5).sort((a, b) => a - b); const tb = t.reduce((a, b) => a + b, 0) / Math.max(1, t.length); const dai = K.t.map((d, i) => [Math.round(K.luc[i] - K.luc[0]), Math.round(d)]).filter((x) => x[1] > 34); return { viecDai: K.viec.map((v) => [v[0] - Math.round(K.luc[0]), v[1]]), khungDai: dai, xepLuc: K.xep.map((x) => Math.round(x - K.luc[0])).filter((x, i, a) => !i || x - a[i - 1] > 30), so: t.length, kh_giay: Math.round(1000 / tb * 10) / 10, p95_ms: Math.round(t[Math.floor(t.length * 0.95)] * 10) / 10, dai_nhat_ms: Math.round(t[t.length - 1] * 10) / 10, tren_34ms: t.filter((x) => x > 34).length } })
// khung hình lúc bố cục ĐỨNG YÊN (đã ưu tiên bảng — không có lần nở nào trong quãng đo): thầy viết tiếp 5 nét
await E.t.evaluate(() => { const K = (window.__kh2 = { t: [], chay: true }); let truoc = performance.now(); const f = (n) => { K.t.push(n - truoc); truoc = n; if (K.chay) requestAnimationFrame(f) }; requestAnimationFrame(f) })
for (let i = 0; i < 5; i++) { await ke(bang.x + bang.w * 0.5, bang.y + bang.h * (0.4 + i * 0.05), bang.x + bang.w * 0.85, bang.y + bang.h * (0.42 + i * 0.05), 22, 12); await ngu(120) }
const khungYen = await E.t.evaluate(() => { const K = window.__kh2; K.chay = false; const t = K.t.slice(5).sort((a, b) => a - b); const tb = t.reduce((a, b) => a + b, 0) / Math.max(1, t.length); return { so: t.length, kh_giay: Math.round(1000 / tb * 10) / 10, p95_ms: Math.round(t[Math.floor(t.length * 0.95)] * 10) / 10, dai_nhat_ms: Math.round(t[t.length - 1] * 10) / 10, tren_34ms: t.filter((x) => x > 34).length } })
if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })

// ───────────── THẦY QUAY LẠI GẠCH TRÊN GIẤY ─────────────
await to.locator('.mc-m').nth(4).click().catch(() => {})
const de = await to.locator('.mc-than .mc-de').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.bottom, w: r.width } })
await ke(de.x + de.w * 0.42, de.y + 3, de.x + de.w * 0.72, de.y + 3, 24, 8)
await ngu(2700)
await doHet('thay_gach_giay_qua_2_giay', kq)
await chup(E.t, '844-giay-uu-tien-net-khop-chu')
await chup(em['667x375'].t, '667-giay-uu-tien')
await chup(em['1180x820'].t, '1180-giay-uu-tien', { scale: 'css' })
await chup(em['iPhone dọc xoay 390x844'].t, 'iphone-doc-xoay-giay-uu-tien')

// ───────────── GIẤY CUỘN + MŨI TÊN: em vừa tự cuộn lên đầu giấy, thầy trỏ / gạch ở cuối giấy ─────────────
const giayThay = await to.locator('.mc-vung-de').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
let muiTen = null, troi = null
if (kq['844x390'].thay_gach_giay_qua_2_giay.cuonGiay) {
  const g = kq['844x390'].thay_gach_giay_qua_2_giay.giay
  // em chạm vào giấy (đang đọc) rồi thầy gạch sát đáy giấy ⇒ không tự trôi, hiện mũi tên
  await E.t.touchscreen.tap(g[0] + 120, g[1] + 200)
  await ngu(120)
  await ke(giayThay.x + giayThay.w * 0.15, giayThay.y + giayThay.h * 0.9, giayThay.x + giayThay.w * 0.5, giayThay.y + giayThay.h * 0.9, 24, 10)
  await thay.mouse.move(giayThay.x + giayThay.w * 0.5, giayThay.y + giayThay.h * 0.9)
  await ngu(500)
  muiTen = await do1(E.t)
  await chup(E.t, '844-giay-cuon-mui-ten-thay-dang-viet-o-duoi')
  // quá 4 giây em không chạm, thầy vẫn trỏ ở dưới ⇒ khung giấy tự trôi tới
  await ngu(4200)
  await thay.mouse.move(giayThay.x + giayThay.w * 0.52, giayThay.y + giayThay.h * 0.9)
  await ngu(900)
  troi = await do1(E.t)
  await chup(E.t, '844-giay-tu-troi-toi-cho-thay')
}

// ───────────── CHẠM HAI LẦN: phóng kín giấy / bảng (844, 667) ─────────────
const phong = {}
for (const ten of ['844x390', '667x375']) {
  const t = em[ten].t, d0 = await do1(t)
  if (!d0.cuonGiay) break // bản một phép co: không có khung giấy riêng
  const hai = async (x, y) => { await t.touchscreen.tap(x, y); await ngu(90); await t.touchscreen.tap(x, y); await ngu(900) }
  await hai(d0.giay[0] + 150, d0.giay[1] + 250)
  const g = await do1(t)
  if (ten === '844x390') await chup(t, '844-cham-hai-lan-giay-phu-kin')
  await hai(d0.giay[0] + 150, d0.giay[1] + 250)
  const d1 = await do1(t)
  await hai(d1.bang[0] + d1.bang[2] / 2, d1.bang[1] + 250)
  const b = await do1(t)
  if (ten === '844x390') await chup(t, '844-cham-hai-lan-bang-phu-kin')
  await hai(b.bang[0] + b.bang[2] / 2, b.bang[1] + 250)
  phong[ten] = { giayPhuKin: { chuDe: g.chuDe, giay: g.giay }, bangPhuKin: { netDai: b.netDai, net: b.net, bang: b.bang }, veLai: (await do1(t)).giay }
  console.log(`${ten}: chạm hai lần — giấy phủ kín: chữ đề ${g.chuDe} px · bảng phủ kín: nét mẫu dài ${b.netDai} px, dày ${b.net} px`)
}

const ra = { phong, khungHinh844DungYen: khungYen, luc: new Date().toISOString(), ghiChu: 'Chromium thật (không phải máy thật), phòng thật trong Node, dữ liệu giả; màn chiếu của thầy 1366 × 768. Cỡ chữ + bề dày nét: px CSS thật trên màn máy em.', dist: DIST, cpu, khungHinh844: khung, muiTen, troi, kq, loiTrang }
writeFileSync(SO_DO, JSON.stringify(ra, null, 2) + '\n')
for (const ten of Object.keys(kq)) for (const tt of Object.keys(kq[ten])) { const v = kq[ten][tt]; console.log(`${ten.padEnd(26)} ${tt.padEnd(36)} chữ đề ${String(v.chuDe).padStart(6)} px · nét dày ${String(v.net).padStart(5)} dài ${String(v.netDai).padStart(6)} px · giấy ${JSON.stringify(v.giay)} · bảng ${JSON.stringify(v.bang)} · cuộn ${JSON.stringify(v.cuonGiay)}`) }
console.log('khung hình 844 khi thầy viết (CPU ×' + cpu + '):', JSON.stringify(khung))
console.log('khung hình 844 đứng yên (CPU ×' + cpu + '):', JSON.stringify(khungYen))
console.log('mũi tên:', JSON.stringify(muiTen && { mui: muiTen.mui, cuon: muiTen.cuonGiay }), '· tự trôi:', JSON.stringify(troi && { mui: troi.mui, cuon: troi.cuonGiay }))
if (loiTrang.length) console.log('LỖI TRANG:', loiTrang.slice(0, 5).join(' | '))
await trinh.close(); await may.dong()
process.exit(loiTrang.length ? 1 : 0)
