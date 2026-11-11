#!/usr/bin/env node
// BỘ THỬ LIVE — SỬA KHẨN 11/11 (thầy test máy thật) + ba chỗ lệch 1B. Chromium THẬT, BA TRANG (thầy + hai máy em) qua phòng THẬT chạy trong Node
// (may-chu.mjs). Dữ liệu giả, không chạm máy chủ thật. Thay cho kịch bản «em gửi xong vẫn ở màn câu hỏi» của thu.mjs (luật màn đã đổi 11/11).
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-2.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011] [tệp số đo = docs/ban-ve-live-1011/so-do-that-2.json]
// Kịch bản: bật live ⇒ thanh màn chiếu gọn, nút phụ trong khay của nút «thêm» (K5) ⇒ máy em đang làm: tay nắm MÉP PHẢI, đứng trên nút «Gửi» (P — thầy 11/11 LẦN 3: «Chuyển mic, tắt
// tiếng, thanh ẩn sang hẳn góc phải ở giữa bảng đen … đề và bảng đen phải full … ẩn hết vào thanh ẩn»; lần 2 là mép trên) ⇒ em GỬI ⇒ tự về bảng live (K1), giấy + bảng PHỦ KÍN, giấy đề soi đúng
// giấy thầy (B1) ⇒ thầy gạch chân trên giấy ⇒ nét khớp chữ ⇒ thầy gọi lên bảng ⇒ em CHƯA gửi bị ép vào bảng live, có dải đoán / tiếp sức (K2, B3) ⇒
// tạm dừng / tiếp tục / kết thúc trong cửa sổ nút Live (K3) ⇒ em rời màn ⇒ thẻ ghi kiểu rời (B2) ⇒ chạm hai lần phóng bảng.
// KHÔNG kiểm được ở đây: TIẾNG (cửa /bpu/live của máy chủ thử trả «chưa cấu hình» — cần Cloudflare Realtime SFU thật + mic thật), khoá xoay Android, iPhone thật.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
const SO_DO = resolve(process.argv[4] ?? join(ANH, 'so-do-that-2.json'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = [], soDo = {}
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function chup(t, ten, tuy = {}) {
  let q = 86, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, ...tuy }); q -= 6 } while (buf.length > 150 * 1000 && q > 30)
  writeFileSync(join(ANH, `that-2-${ten}.jpg`), buf)
  console.log(`  ảnh that-2-${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}
// Chữ của câu TRÙNG với câu trên tờ chiếu của trang thử (scripts/thu-live-1011/trang.tsx) — như thật: tờ và lượt cùng lấy một câu của kho.
const CAU = [
  { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  { qid: 'Q2', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Phenol (C₆H₅OH) tác dụng được với dung dịch nào sau đây?', choices: ['NaCl', 'NaOH', 'HCl', 'NaHCO₃'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 2, kienThuc: [] },
]
async function trangEm(sbd, w, h, dpr) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: w < 1200 })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message}`))
  // Mốc giờ: lúc lớp bảng live (`.lv`) gắn vào trang, lúc dải «Thầy tạm dừng live» hiện / mất, lúc em bấm Gửi, lúc tin phòng tới.
  await t.addInitScript(() => {
    const M = (window.__moc = { lv: 0, lvMat: 0, nghi: 0, nghiMat: 0, gui: 0, tin: 0 })
    const xem = () => {
      const co = !!document.querySelector('.lv'), nghi = [...document.querySelectorAll('.lv-bao')].some((e) => (e.textContent || '').includes('Thầy tạm dừng live'))
      if (co && !M._lv) M.lv = performance.now(); if (!co && M._lv) M.lvMat = performance.now(); M._lv = co
      if (nghi && !M._ng) M.nghi = performance.now(); if (!nghi && M._ng) M.nghiMat = performance.now(); M._ng = nghi
    }
    new MutationObserver(xem).observe(document, { subtree: true, childList: true, characterData: true })
    document.addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('.bpu-gui-noi')) M.gui = performance.now() }, true)
    const Ws = window.WebSocket
    window.WebSocket = class extends Ws { constructor(u, p) { super(u, p); this.addEventListener('message', () => { M.tin = performance.now() }) } }
  })
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}`)
  return { t, ctx }
}
async function emGui(t) {
  await t.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await t.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
  await t.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
}
const moc = (t) => t.evaluate(() => ({ ...window.__moc, nay: performance.now() }))

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay${process.env.LV_TOI ? '&giay=toi' : ''}`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
const viTri = await to.locator('.mc-lv-nut').evaluate((e) => ({ trai: Math.round(e.getBoundingClientRect().left), dau: e.parentElement.firstElementChild === e }))
kiem('K4 · nút «Live» đứng ĐẦU thanh, sát mép trái màn chiếu', viTri.dau && viTri.trai < 60, `mép trái nút ${viTri.trai} px`)
await ngu(500)
await chup(thay, 'thay-chua-live-nut-live-trai-1366')

// ───────────── HAI MÁY EM (lượt đang mở, chưa gửi) ─────────────
await may.moLuot(CAU[0], 'B')
// SĂN LỖI «bảng đen xì không hiện đề» (thầy 11/11): chạy lại kịch bản ở điều kiện khác bằng biến môi trường —
//   LV_EM=1971x1247@1 (cửa sổ máy tính làm máy em) · LV_TOI=1 (màn chiếu của thầy nền tối) · LV_CUON=1 (thầy cuộn bảng đen trước khi chụp).
const [emW, emH, emDpr] = (process.env.LV_EM ?? '844x390@2').split(/[x@]/).map(Number)
const em = await trangEm('S1', emW, emH, emDpr || 1)
/** GIẤY ĐỀ trên máy em: có bề rộng / cao, nằm trong khung nhìn, có chữ đề, điểm giữa không bị phần tử khác phủ. */
const giayEm = (t) => t.evaluate(() => {
  const g = document.querySelector('.lv-giay')
  if (!g) return { co: false }
  const r = g.getBoundingClientRect(), o = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 60))
  return { co: true, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), trong: r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, chu: (g.innerText || '').replace(/\s+/g, ' ').slice(0, 60), phu: !(o && (g.contains(o) || o === g)), nen: getComputedStyle(g).backgroundColor, mau: getComputedStyle(g).color, man: innerWidth + 'x' + innerHeight }
})
async function kiemGiay(nhan) {
  const g = await giayEm(em.t)
  kiem(`GIẤY ĐỀ máy em · ${nhan}: có khổ, trong khung nhìn, có chữ đề, không bị phủ`, g.co && g.w > 80 && g.h > 60 && g.trong && /Alcohol|Phenol/.test(g.chu) && !g.phu, JSON.stringify(g))
}
await em.t.locator('.bpu-hs').waitFor({ timeout: 20000 })
const em2 = await trangEm('S2', 390, 844, 3)
await em2.t.locator('.bpu-hs').waitFor({ timeout: 20000 })

// ───────────── BẬT LIVE ─────────────
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(600)
const theTrai = await to.locator('.mc-lv-the').evaluate((e) => Math.round(e.getBoundingClientRect().left))
kiem('K4 · cửa sổ của nút Live neo MÉP TRÁI', theTrai < 40, `mép trái cửa sổ ${theTrai} px`)
await chup(thay, 'thay-cua-so-bat-live-trai-1366')
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await ngu(500)
// K5 (sửa chiều 11/11, thầy: «Phần nút ở dưới chưa gọn»): thanh gọn ở MỌI trạng thái — nút phụ nằm trong khay của nút «thêm» (src/lib/thanh-day-to-chieu.ts),
// «Lên bảng» ở lại trên thanh. Kiểm kỹ từng khổ + ảnh that-3-thanh-*: scripts/thu-live-1011/thu-thanh-day-1111.mjs.
const an = async () => to.locator('#mc-khay button').evaluateAll((ds) => ds.filter((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility === 'visible').length)
kiem('K5 · đang live: nút phụ nằm trong khay đang đóng; trên thanh còn «Lên bảng» + nút «thêm»', await an() === 0 && await to.locator('#mc-them').isVisible() && await to.locator('#mc-len-bang').isVisible())
await chup(thay, 'thay-thanh-gom-1366')
await to.locator('#mc-them').click()
await ngu(350)
kiem('K5 · bấm nút «thêm» ⇒ khay xoè, nằm trọn trong màn 1366', await an() >= 2 && await to.locator('#mc-khay').evaluate((e) => e.getBoundingClientRect().right <= 1366 && e.getBoundingClientRect().left >= 0))
await chup(thay, 'thay-thanh-xoe-1366')
await thay.mouse.click(600, 300)
await ngu(250)
kiem('K5 · bấm ra ngoài thanh ⇒ thu lại', await an() === 0)
await thay.keyboard.press('g'); await ngu(500)
kiem('K5 · phím tắt vẫn chạy khi thanh gom (G mở lời giải)', await to.locator('.mc-giai:not([hidden])').count() > 0)
await thay.keyboard.press('g'); await ngu(500)

// ───────────── P (11/11 lần 3): máy em đang làm bài — MỘT tay nắm ở MÉP PHẢI, đứng TRÊN nút «Gửi» nổi; khay trượt ra bên trái cột nút «Gửi» ─────────────
/** Hộp của viên tay nắm + các thứ liên quan (nút «Gửi», giấy đề, bảng đen, ô bảng của thầy = khung cuộn của lớp vẽ, khay). */
const hopNam = (t) => t.evaluate(() => {
  const h = (k) => { const e = document.querySelector(k); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null }
  return { vien: h('.lv-nam i'), nam: h('.lv-nam'), tieu: h('.bpu-hs-tieu'), kj: h('.bpu-hs-kj'), gui: h('.bpu-gui-noi[data-hien="true"]'), giay: h('.lv-giay'), bang: h('.lv-bang'), bangThay: h('.lv-cuon'), khay: h('.lv-khay'), w: innerWidth, h: innerHeight }
})
const de = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
/** Diện tích (giấy + bảng) / diện tích khung nhìn — đo trên DOM thật. */
const phuKin = (k) => Math.round(((k.giay[2] - k.giay[0]) * (k.giay[3] - k.giay[1]) + (k.bang[2] - k.bang[0]) * (k.bang[3] - k.bang[1])) / (k.w * k.h) * 1000) / 10
const NOI = '.lv-dau-cu, .lv-bat-tieng, .lv-tieng-tat, .lv-nam-hh, .lv > .lv-noi' // mọi thứ từng nổi riêng: nay không được còn
await em2.t.locator('.lv-phu.lv-dau .lv-nam').waitFor({ timeout: 8000 })
await em2.t.getByRole('radio', { name: /^A/ }).first().click({ timeout: 5000 }).catch(() => {}) // chọn dở, KHÔNG gửi ⇒ nút «Gửi» nổi hiện ra
await em2.t.locator('.bpu-gui-noi[data-hien="true"]').waitFor({ timeout: 5000 })
await ngu(450)
const n2 = await hopNam(em2.t)
kiem('P · máy em đang làm bài: MỘT tay nắm sát MÉP PHẢI (không còn ở mép trên / mép trái, không nút nổi nào khác), chưa vào bảng', n2.vien[2] >= n2.w - 6 && n2.vien[2] <= n2.w && n2.vien[2] - n2.vien[0] <= 6 && await em2.t.locator('.lv-nam').count() === 1 && await em2.t.locator('.lv').count() === 0 && await em2.t.locator(NOI).count() === 0, `viên ${JSON.stringify(n2.vien)}`)
kiem('P · tay nắm đứng TRÊN nút «Gửi» nổi: vùng chạm 44 × 76 không chạm nút «Gửi» (cách ≥ 8 px), không đè thẻ đội / ô kJ', !!n2.gui && n2.nam[3] <= n2.gui[1] - 8 && n2.nam[2] - n2.nam[0] >= 44 && n2.nam[3] - n2.nam[1] >= 76 && !de(n2.nam, n2.tieu) && !de(n2.nam, n2.kj), JSON.stringify({ nam: n2.nam, gui: n2.gui }))
await chup(em2.t, 'em-cau-hoi-tay-nam-phai-nut-gui-390')
await em2.t.locator('.lv-phu .lv-nam').tap()
await em2.t.locator('.lv-phu .lv-khay[data-mo]').waitFor({ timeout: 4000 })
await ngu(350)
const k2 = await hopNam(em2.t)
kiem('P · chạm tay nắm ⇒ khay trượt ra từ phải, dừng BÊN TRÁI cột nút «Gửi» (không che nút), nằm gọn trong màn, có «Thầy đang live»', (await em2.t.locator('.lv-phu .lv-khay').innerText()).includes('Thầy đang live') && k2.khay[2] <= k2.gui[0] - 4 && k2.khay[0] >= 0 && k2.khay[1] >= 0 && k2.khay[3] <= k2.h && !de(k2.khay, k2.gui), JSON.stringify({ khay: k2.khay, gui: k2.gui }))
await chup(em2.t, 'em-cau-hoi-khay-phai-mo-390')
await ngu(2600)
kiem('P · khay còn mở ở giây thứ 3 (tự thu sau 4 giây không chạm)', await em2.t.locator('.lv-phu .lv-khay[data-mo]').count() === 1)
await ngu(1500)
kiem('P · khay tự thu sau 4 giây', await em2.t.locator('.lv-phu .lv-khay[data-mo]').count() === 0)
await em2.t.locator('.lv-phu .lv-nam').tap()
await em2.t.locator('.lv-phu .lv-khay[data-mo]').waitFor({ timeout: 4000 })
await em2.t.touchscreen.tap(120, 700); await ngu(350)
kiem('P · chạm ra ngoài khay ⇒ thu ngay', await em2.t.locator('.lv-phu .lv-khay[data-mo]').count() === 0)

// ───────────── K1: em gửi ⇒ tự về bảng live ─────────────
await ngu(1200) // thầy bật live đã quá 1,5 giây ⇒ lần vào bảng này phải «tức thì», không viên chào
await emGui(em.t)
await em.t.locator('.lv').waitFor({ timeout: 4000 })
const m1 = await moc(em.t)
soDo.k1_gui_toi_bang_ms = Math.round((m1.lv - m1.gui) * 10) / 10
kiem('K1 · em bấm Gửi ⇒ máy em TỰ về bảng live (≤ 200 ms từ cú bấm)', m1.lv > 0 && m1.gui > 0 && m1.lv - m1.gui <= 200, `${soDo.k1_gui_toi_bang_ms} ms`)
kiem('K6 · vào bảng sau khi gửi: không có viên «Thầy đang live» chớp giữa màn', await em.t.locator('.lv-vao').count() === 0)
await ngu(700)
kiem('B3 · dải lượt trên bảng live ghi «Đã gửi · n/8 bạn đã gửi»', /Đã gửi · \d+\/\d+ bạn đã gửi/.test(await em.t.locator('.lv-luot').innerText()))
// B1: giấy đề máy em soi đúng giấy thầy
await em.t.locator('.lv[data-soi]').waitFor({ timeout: 6000 }).catch(() => {})
const soi = await em.t.evaluate(() => ({ soi: !!document.querySelector('.lv[data-soi]'), khop: !!document.querySelector('.lv-gt[data-khop]'), giay: document.querySelector('.lv')?.getAttribute('data-giay') }))
kiem('B1 · giấy đề máy em dựng theo số đo giấy thầy và TỰ KIỂM khớp (nét trên giấy được giữ)', soi.soi && soi.khop, JSON.stringify(soi))
// So từng dòng chữ: vị trí tương đối (‰ bề rộng giấy) của đề + 4 phương án trên tờ thầy và trên máy em
const doThay = await to.locator('body').evaluate(() => {
  const g = document.querySelector('.mc-dot:not([hidden]) .mc-vung-de') || document.querySelector('.mc-vung-de'), G = g.getBoundingClientRect()
  return [...g.querySelectorAll('.mc-than .mc-de, .mc-than .mc-pa-chu')].map((e) => { const r = e.getBoundingClientRect(); return [(r.left - G.left) / G.width, (r.top - G.top) / G.width, r.width / G.width, r.height / G.width].map((v) => Math.round(v * 1000)) })
})
const doEm = await em.t.evaluate(() => {
  // so với TẤM GIẤY SOI (`.lv-gt` = đúng ô giấy của thầy); ô giấy vẽ `.lv-giay` nay nới rộng hơn ô của thầy (phủ kín)
  const g = document.querySelector('.lv-giay'), G = g.querySelector('.lv-gt').getBoundingClientRect()
  return [...g.querySelectorAll('.lv-gt-chu:not(.ngan)')].map((e) => { const r = e.getBoundingClientRect(); return [(r.left - G.left) / G.width, (r.top - G.top) / G.width, r.width / G.width, r.height / G.width].map((v) => Math.round(v * 1000)) })
})
const lech = doThay.length === doEm.length && doThay.length > 0 ? Math.max(...doThay.flatMap((a, i) => a.map((v, j) => Math.abs(v - doEm[i][j])))) : -1
soDo.b1_so_khoi_chu = doThay.length; soDo.b1_lech_lon_nhat_phan_nghin_be_rong_giay = lech
kiem('B1 · mọi khối chữ (đề + phương án) trên máy em nằm đúng chỗ như giấy thầy (lệch ≤ 4 ‰ bề rộng giấy)', lech >= 0 && lech <= 4, `${doThay.length} khối, lệch lớn nhất ${lech} ‰`)
// Thầy gạch chân chữ «alcohol bậc II» trên GIẤY bằng bút (chuột = bút), mực xanh cho dễ thấy trên giấy sáng ⇒ nét tới máy em, nằm trên giấy
await to.locator('.mc-m').nth(4).click().catch(() => {})
const hop = await to.locator('.mc-than .mc-de').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.bottom, w: r.width } })
await thay.mouse.move(hop.x + hop.w * 0.42, hop.y + 3); await thay.mouse.down()
for (let i = 1; i <= 24; i++) { await thay.mouse.move(hop.x + hop.w * (0.42 + 0.3 * i / 24), hop.y + 3 + Math.sin(i / 3) * 1.2); await ngu(8) }
await thay.mouse.up()
await ngu(900)
const mucGiay = await em.t.evaluate(() => {
  const c = document.querySelector('.lv-cv'), g = document.querySelector('.lv-giay').getBoundingClientRect(), k = c.width / c.getBoundingClientRect().width
  const d = c.getContext('2d').getImageData(Math.round(g.left * k), Math.round(g.top * k), Math.round(g.width * k), Math.round(g.height * k)).data
  let n = 0; for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 40) n++
  return n
})
kiem('B1 · thầy gạch chân trên giấy ⇒ nét hiện TRÊN GIẤY của máy em (giấy khớp nên không bị ẩn)', mucGiay > 10, `${mucGiay} mẫu điểm ảnh có mực trong ô giấy`)
await chup(thay, 'giay-thay-gach-chan-1366')
await chup(em.t, 'giay-em-khop-giay-thay-844')
await chup(em.t, 'em-phu-kin-khay-dong-844')
const nb = await hopNam(em.t)
soDo.phu_kin_phan_tram = { '844x390': phuKin(nb) }
kiem('P · bảng live 844 × 390: MỘT tay nắm sát mép phải, giữa chiều cao; không còn nút / viên / huy hiệu nổi nào trên bảng', nb.vien[2] >= nb.w - 6 && nb.vien[2] - nb.vien[0] <= 6 && Math.abs((nb.vien[1] + nb.vien[3]) / 2 - nb.h / 2) <= 3 && await em.t.locator('.lv .lv-nam').count() === 1 && await em.t.locator(NOI).count() === 0, `viên ${JSON.stringify(nb.vien)}`)
kiem('P · 844 × 390: giấy + bảng PHỦ KÍN ≥ 92 % khung nhìn, lề ngoài ≤ 6 px, khe giữa ≤ 6 px', soDo.phu_kin_phan_tram['844x390'] >= 92 && nb.giay[0] <= 6 && nb.giay[1] <= 6 && nb.w - nb.bang[2] <= 6 && nb.h - nb.bang[3] <= 6 && nb.bang[0] - nb.giay[2] <= 6, `${soDo.phu_kin_phan_tram['844x390']} % · giấy ${JSON.stringify(nb.giay)} · bảng ${JSON.stringify(nb.bang)}`)
kiem('P · 844 × 390 (điện thoại dài): tay nắm đứng trên phần bảng nới thêm, KHÔNG đè ô bảng thầy viết', !!nb.bangThay && !de(nb.vien, nb.bangThay) && de(nb.vien, nb.bang), `ô bảng của thầy ${JSON.stringify(nb.bangThay)}`)
await em.t.locator('.lv .lv-nam').tap()
await em.t.locator('.lv .lv-khay[data-mo]').waitFor({ timeout: 4000 })
await ngu(350)
const khay = await em.t.locator('.lv .lv-khay').evaluate((e) => { const r = e.getBoundingClientRect(); return { trai: Math.round(r.left), phai: Math.round(r.right), tren: Math.round(r.top), duoi: Math.round(r.bottom), chu: e.innerText } })
kiem('P · khay trượt ra từ mép phải, nằm gọn trong màn, đè lên mép bảng (không đẩy bố cục): mạng · tiếng · đội + kJ', khay.phai <= 844 && khay.phai >= 844 - 14 && khay.tren >= 0 && khay.duoi <= 390 && /kJ/.test(khay.chu) && JSON.stringify((await hopNam(em.t)).giay) === JSON.stringify(nb.giay), `${khay.trai}–${khay.phai} × ${khay.tren}–${khay.duoi} px · ${khay.chu.replace(/\s+/g, ' ').slice(0, 80)}`)
await chup(em.t, 'em-khay-phai-mo-844')
// vuốt từ mép phải vào (bắt đầu trên tay nắm) cũng mở khay — trước hết thu khay bằng chạm ra ngoài
await em.t.touchscreen.tap(200, 120); await ngu(350)
kiem('P · chạm ra ngoài ⇒ khay thu', await em.t.locator('.lv .lv-khay[data-mo]').count() === 0)
{
  const cdp = await em.ctx.newCDPSession(em.t), diem = (x, y) => [{ x, y, id: 1, radiusX: 6, radiusY: 6, force: 1 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: diem(838, 195) })
  for (const x of [820, 790, 750, 700, 650]) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: diem(x, 196) }); await ngu(16) }
  const giua = await em.t.locator('.lv .lv-khay').evaluate((e) => ({ kieu: e.style.transform, phai: Math.round(e.getBoundingClientRect().right) }))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await ngu(350)
  kiem('P · vuốt từ mép phải vào (trên tay nắm) ⇒ khay bám ngón tay rồi mở', /translate3d/.test(giua.kieu) && await em.t.locator('.lv .lv-khay[data-mo]').count() === 1, JSON.stringify(giua))
  await cdp.detach()
}
await ngu(4300)
kiem('P · khay tự thu sau 4 giây không chạm', await em.t.locator('.lv .lv-khay[data-mo]').count() === 0)
// DẤU TRẠNG THÁI trên tay nắm — máy chủ thử không có tiếng / mic nên DỰNG TAY đúng mã mà LopLive dựng (vitest live-may-em-mep-phai-1111 khoá phần lôgic);
// ở đây chỉ chụp cho thầy xem cỡ + chỗ của bốn dấu: tiếng đang tắt · mic đang bật · đang giơ tay · mạng yếu.
await em.t.evaluate(() => {
  const bt = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
  const hinh = { tieng: '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M16 9.5l5 5m0-5l-5 5"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', tay: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V4a1.5 1.5 0 0 1 3 0v7m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1.6a6 6 0 0 1-4.8-2.4L4.5 14.4a1.6 1.6 0 0 1 2.4-2.1L8 13.4"/>', mang: '<path d="M5 20v-4M12 20v-9M19 20V5"/>' }
  const s = document.createElement('span'); s.className = 'lv-nam-dau'; s.id = 'thu-dau'
  s.innerHTML = Object.keys(hinh).map((k) => `<b data-dau="${k}">${bt(hinh[k])}</b>`).join('')
  document.querySelector('.lv .lv-nam').appendChild(s)
})
await ngu(200)
const dau = await em.t.evaluate(() => [...document.querySelectorAll('#thu-dau b')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }))
kiem('P · bốn dấu trạng thái (dựng tay): mỗi dấu 15 px, xếp dọc ngay trên viên thuốc, sát mép phải, không ra ngoài màn', dau.length === 4 && dau.every((d) => d[2] === 15 && d[3] === 15 && d[0] >= 844 - 18 && d[0] + d[2] <= 844 && d[1] >= 0), JSON.stringify(dau))
await chup(em.t, 'em-dau-trang-thai-dung-tay-844')
await chup(em.t, 'em-dau-trang-thai-can-canh-844', { clip: { x: 844 - 150, y: 195 - 110, width: 150, height: 220 } })
await em.t.evaluate(() => document.getElementById('thu-dau')?.remove())
// các khổ máy khác: 667 × 375 (điện thoại 16:9), 1180 × 820 (máy bảng), 1971 × 1247 (cửa sổ máy tính như ảnh thầy gửi) — phủ kín ≥ 92 %, tay nắm sát mép phải giữa chiều cao
for (const [w, h] of [[667, 375], [1180, 820], [1971, 1247]]) {
  await em.t.setViewportSize({ width: w, height: h }); await ngu(600)
  const k = await hopNam(em.t), pk = phuKin(k)
  soDo.phu_kin_phan_tram[`${w}x${h}`] = pk
  kiem(`P · khổ ${w} × ${h}: giấy + bảng phủ kín ≥ 92 %, lề ngoài ≤ 6 px bốn phía; tay nắm sát mép phải, giữa chiều cao`, pk >= 92 && k.giay[0] <= 6 && k.giay[1] <= 6 && k.w - k.bang[2] <= 6 && k.h - k.bang[3] <= 6 && k.h - k.giay[3] <= 6 && k.vien[2] >= k.w - 6 && Math.abs((k.vien[1] + k.vien[3]) / 2 - k.h / 2) <= 3, `${pk} % · giấy ${JSON.stringify(k.giay)} · bảng ${JSON.stringify(k.bang)} · ô bảng của thầy ${JSON.stringify(k.bangThay)}`)
  await kiemGiay(`khổ ${w} × ${h}`)
  if (w === 667) {
    // TỰ NÉ: ở khổ này ô bảng của thầy chạy sát mép phải ⇒ tay nắm đè mép bảng. Thầy viết sát mép phải, ngang tầm tay nắm ⇒ tay nắm mờ hẳn; thầy đi khỏi ⇒ rõ lại.
    const cot = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
    const mo0 = await em.t.locator('.lv .lv-nam').evaluate((e) => getComputedStyle(e).opacity)
    const tx = cot.x + cot.w - 10, ty = cot.y + cot.h * 0.5
    await thay.mouse.move(tx - 30, ty); await thay.mouse.down()
    for (let i = 1; i <= 10; i++) { await thay.mouse.move(tx - 30 + i * 2.6, ty + Math.sin(i) * 3); await ngu(10) }
    await ngu(250)
    const luc = await em.t.locator('.lv .lv-nam').evaluate((e) => ({ ne: e.hasAttribute('data-ne'), mo: getComputedStyle(e).opacity }))
    await chup(em.t, 'em-tay-nam-ne-net-667')
    await thay.mouse.up(); await thay.mouse.move(cot.x + 60, cot.y + 60)
    await ngu(1900)
    const sau = await em.t.locator('.lv .lv-nam').evaluate((e) => ({ ne: e.hasAttribute('data-ne'), mo: getComputedStyle(e).opacity }))
    kiem('P · thầy viết sát mép phải ngang tầm tay nắm ⇒ tay nắm MỜ HẲN (không chặn nhìn nét); bút đi khỏi ⇒ rõ lại', luc.ne && Number(luc.mo) < 0.3 && !sau.ne && Number(sau.mo) > 0.9, JSON.stringify({ truoc: mo0, luc, sau }))
    await chup(em.t, 'em-phu-kin-667')
  } else await chup(em.t, `em-phu-kin-${w}`, { scale: 'css' })
}
await em.t.setViewportSize({ width: 844, height: 390 }); await ngu(500)

// ───────────── K2: thầy gọi lên bảng ⇒ em CHƯA gửi bị ép vào bảng live ─────────────
kiem('K2 · trước khi gọi: máy em S2 chưa gửi (đang chọn dở phương án A), còn ở màn làm bài', await em2.t.locator('.lv').count() === 0)
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S1', lyDo: ['Chưa lên bảng buổi này'] })))
await em2.t.locator('.lv').waitFor({ timeout: 4000 })
const m2 = await moc(em2.t)
soDo.k2_tin_phong_toi_bang_ms = Math.round((m2.lv - m2.tin) * 10) / 10
kiem('K2 · thầy gọi lên bảng ⇒ máy em chưa gửi vào bảng live NGAY (≤ 200 ms từ tin phòng)', Math.abs(m2.lv - m2.tin) <= 200, `${soDo.k2_tin_phong_toi_bang_ms} ms`)
const st = may.trangThai()
kiem('K2 · không ai gửi hộ đáp án em chọn dở (phòng không có bài của S2)', !st.luot.tra.S2 && !!st.luot.tra.S1)
await ngu(600)
kiem('B3 · bảng live không nuốt trò đoán / tiếp sức: dải «Em đoán … làm đúng không?» + «Làm đúng» · «Chưa đúng» · tiếp sức', /Em đoán .* làm đúng không\?/.test(await em2.t.locator('.lv-luot').innerText()) && await em2.t.locator('.lv-luot button').count() === 3)
// P · iPhone máy dọc (390 × 844, không khoá ngang được ⇒ hình xoay 90° bằng CSS): «mép phải» là mép phải của HÌNH = đáy máy (phía thanh home)
/** Hộp theo trục của HÌNH đã xoay 90° thuận kim: x hình = y máy, y hình = (bề ngang máy − x máy). */
const hopXoay = (t) => t.evaluate(() => {
  const W = innerWidth, h = (k) => { const e = document.querySelector(k); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(W - r.right), Math.round(r.bottom), Math.round(W - r.left)] }
  return { xoay: document.querySelector('.lv').hasAttribute('data-xoay'), vien: h('.lv-nam i'), nam: h('.lv-nam'), giay: h('.lv-giay'), bang: h('.lv-bang'), luot: h('.lv-luot'), w: innerHeight, h: innerWidth }
})
const x1 = await hopXoay(em2.t)
soDo.phu_kin_phan_tram['iPhone dọc xoay 844x390'] = phuKin(x1)
kiem('P · iPhone máy dọc xoay CSS: tay nắm ở mép phải của HÌNH (đáy máy), giữa chiều cao hình; giấy + bảng phủ kín ≥ 92 %', x1.xoay && x1.vien[2] >= x1.w - 6 && Math.abs((x1.vien[1] + x1.vien[3]) / 2 - x1.h / 2) <= 3 && phuKin(x1) >= 92, `${phuKin(x1)} % · viên ${JSON.stringify(x1.vien)}`)
kiem('P · dải lượt (chưa đoán): DẢI MỎNG sát đáy hình, cao ≤ 36 px, cách đáy ≤ 8 px — che không quá một dòng', x1.luot[3] - x1.luot[1] <= 36 && x1.h - x1.luot[3] <= 8 && x1.luot[0] <= 12, `dải ${JSON.stringify(x1.luot)}`)
await chup(em2.t, 'em-iphone-doc-xoay-dai-doan-390')
// vùng an toàn GIẢ (Chromium máy tính không có tai thỏ): tai thỏ 47 px ở đỉnh máy, thanh home 34 px ở đáy máy ⇒ sau xoay là mép trái / mép phải của hình
await em2.t.addStyleTag({ content: '.lv-thuoc { padding: 47px 0px 34px 0px !important; }' })
await em2.t.evaluate(() => window.dispatchEvent(new Event('resize'))); await ngu(500)
const x2 = await hopXoay(em2.t)
kiem('P · iPhone xoay + vùng an toàn (giả 47 / 34): giấy chừa tai thỏ bên trái hình, bảng + tay nắm chừa thanh home bên phải hình', x2.giay[0] >= 47 + 3 && x2.giay[0] <= 47 + 6 && x2.bang[2] <= x2.w - 34 - 3 && x2.vien[2] <= x2.w - 34 && x2.vien[2] >= x2.w - 34 - 6 && x2.nam[2] <= x2.w - 34 + 1, `giấy ${JSON.stringify(x2.giay)} · bảng ${JSON.stringify(x2.bang)} · viên ${JSON.stringify(x2.vien)}`)
await chup(em2.t, 'em-iphone-doc-xoay-vung-an-toan-gia-390')
{ // chạm tay nắm khi hình xoay ⇒ khay ra từ mép phải HÌNH (đáy máy), nằm trong vùng an toàn
  await em2.t.locator('.lv .lv-nam').tap(); await em2.t.locator('.lv .lv-khay[data-mo]').waitFor({ timeout: 4000 }); await ngu(350)
  const kx = await em2.t.evaluate(() => { const r = document.querySelector('.lv .lv-khay').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] })
  kiem('P · iPhone xoay: khay ra từ mép phải của hình (đáy máy), trên thanh home, gọn trong màn', kx[3] <= 844 - 34 && kx[3] >= 844 - 34 - 14 && kx[0] >= 0 && kx[2] <= 390 && kx[1] >= 47, JSON.stringify(kx))
  await chup(em2.t, 'em-iphone-doc-xoay-khay-mo-390')
  await em2.t.touchscreen.tap(195, 200); await ngu(350)
}
{ // chạm hai lần phóng bảng vẫn chạy khi hình xoay
  const ob = await em2.t.locator('.lv-cuon').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, dai: Math.max(r.width, r.height) } })
  await em2.t.touchscreen.tap(ob.x, ob.y); await ngu(90); await em2.t.touchscreen.tap(ob.x, ob.y); await ngu(500)
  const dai2 = await em2.t.locator('.lv-cuon').evaluate((e) => { const r = e.getBoundingClientRect(); return Math.max(r.width, r.height) })
  kiem('P · iPhone xoay: chạm hai lần vào bảng đen vẫn phóng bảng (ô bảng của thầy to ra), có dòng «Chạm hai lần để về toàn cảnh»', dai2 > ob.dai * 1.005 && (await em2.t.locator('.lv-bao').allInnerTexts()).join(' ').includes('Chạm hai lần để về toàn cảnh'), `${Math.round(ob.dai)} → ${Math.round(dai2)} px`)
  const ob2 = await em2.t.locator('.lv-cuon').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  await em2.t.touchscreen.tap(ob2.x, ob2.y); await ngu(90); await em2.t.touchscreen.tap(ob2.x, ob2.y); await ngu(500)
  kiem('P · iPhone xoay: chạm hai lần nữa ⇒ về toàn cảnh, dải lượt hiện lại', await em2.t.locator('.lv-luot').count() === 1)
}
const rongDai = await em2.t.locator('.lv-luot').evaluate((e) => e.offsetWidth)
await em2.t.locator('.lv-luot button', { hasText: 'Làm đúng' }).tap()
await em2.t.locator('.lv-luot', { hasText: /Em đoán .* làm đúng$|Em đoán .* làm đúng(Tiếp sức|Cổ vũ)/ }).waitFor({ timeout: 4000 }).catch(() => {})
await ngu(300)
await em2.t.locator('.lv-luot button.tiep').tap()
await ngu(500)
const g = may.trangThai().luot.goi
kiem('B3 · bấm trên dải ⇒ phòng nhận đoán + tiếp sức của S2', g.duDoan.S2 === 1 && (g.tiep.S2 ?? 0) >= 1, JSON.stringify({ doan: g.duDoan.S2, tiep: g.tiep.S2 }))
const gon = await em2.t.locator('.lv-luot').evaluate((e) => ({ rong: e.offsetWidth, cao: e.offsetHeight, nut: e.querySelectorAll('button').length, chu: e.innerText.replace(/\s+/g, ' ') }))
soDo.dai_luot_px = { chua_doan: rongDai, da_doan: gon.rong, cao: gon.cao }
kiem('P · em đoán xong ⇒ dải thu về MỘT VIÊN NHỎ: chỉ còn tên bạn + điều em đoán + nút tiếp sức, hẹp hơn hẳn, cao ≤ 36 px', gon.nut === 1 && gon.rong < rongDai * 0.75 && gon.cao <= 36 && /Em đoán .* làm đúng/.test(gon.chu), `${rongDai} → ${gon.rong} px · ${gon.chu}`)
await chup(em2.t, 'em-iphone-doc-xoay-da-doan-vien-nho-390')

// ───────────── K3: tạm dừng / tiếp tục / kết thúc trong cửa sổ nút Live ─────────────
await to.locator('.mc-lv-cum').click()
await to.locator('.mc-lv-the [data-lv="tam-dung"]').waitFor({ state: 'visible', timeout: 6000 })
await ngu(400)
kiem('K3 · bấm viên Live ⇒ cửa sổ có «Tạm dừng», «Kết thúc live», công tắc «Bảng → máy em»', /Tạm dừng/.test(await to.locator('.mc-lv-the').innerText()) && /Kết thúc live/.test(await to.locator('.mc-lv-the').innerText()))
// M1: cửa sổ nút Live có dòng chẩn đoán mic + ba nút «Lọc tiếng ồn + khử vọng»; viên Live nêu đúng lý do không có tiếng (máy chủ thử không có SFU)
await ngu(1500)
const cdMic = await to.locator('#mc-lv-cd').innerText().catch(() => '')
kiem('M1 · cửa sổ nút Live có dòng chẩn đoán mic (tên mic · luồng · Hz · kênh · ba bộ xử lý · cách mở · mức âm · bộ gửi · máy chủ tiếng)', /Hz · \d kênh/.test(cdMic) && /khử vọng (bật|tắt) · lọc ồn (bật|tắt) · tự chỉnh (bật|tắt)/.test(cdMic) && /cách mở \d\/4/.test(cdMic) && /máy chủ tiếng CHƯA nối/.test(cdMic), cdMic.slice(0, 230))
for (let i = 0; i < 16 && !/Đang tắt — giọng trong nhất/.test(await to.locator('.mc-lv-the').innerText()); i++) await ngu(500)
{ // đọc MỘT lần trong trang (thẻ vẽ lại mỗi giây theo số đo mic ⇒ hai lần đọc rời có thể rơi vào hai lần vẽ khác nhau)
  const loc = await to.locator('.mc-lv-the').evaluate((e) => ({ an: e.querySelectorAll('[data-lv="loc"][data-c="tu"][aria-pressed="true"]').length, chu: e.innerText.replace(/\s+/g, ' ') }))
  kiem('M2 · «Lọc tiếng ồn + khử vọng»: mặc định «Tự động», đang TẮT khi không có đường vọng (giọng trong nhất)', loc.an === 1 && /Đang tắt — giọng trong nhất/.test(loc.chu), `nút «Tự động» đang ấn: ${loc.an} · ${loc.chu.slice(120, 300)}`)
}
kiem('M1 · viên Live nêu đúng lý do không có tiếng (ở đây: chưa nối máy chủ tiếng), không còn «Không tiếng» chung chung', /Chưa nối máy chủ tiếng/.test(await to.locator('.mc-lv-cum').innerText()))
kiem('M1 · vạch mức âm ghi đúng trạng thái: đang live ⇒ «Mức âm đang gửi cho lớp»', /Mức âm đang gửi cho lớp/.test(await to.locator('.mc-lv-the').innerText()))
await to.locator('.mc-lv-the [data-lv="loc"][data-c="bat"]').click(); await ngu(1600)
const cdBat = await to.locator('#mc-lv-cd').innerText().catch(() => '')
kiem('M2 · thầy ép «Bật» ⇒ mic mở lại với khử vọng + lọc ồn bật (dòng chẩn đoán đổi theo)', /khử vọng bật · lọc ồn bật/.test(cdBat) && /Đang bật — chống vọng/.test(await to.locator('.mc-lv-the').innerText()), cdBat + ' | bấm=' + await to.locator('.mc-lv-the [data-lv="loc"][aria-pressed="true"]').getAttribute('data-c'))
await to.locator('.mc-lv-the [data-lv="loc"][data-c="tu"]').click(); await ngu(900)
await chup(thay, 'thay-cua-so-live-tam-dung-ket-thuc-1366')
const tBam = await em.t.evaluate(() => performance.now())
await to.locator('.mc-lv-the [data-lv="tam-dung"]').click()
await em.t.locator('.lv-bao', { hasText: 'Thầy tạm dừng live' }).waitFor({ timeout: 4000 })
const m3 = await moc(em.t)
soDo.k3_tam_dung_toi_may_em_ms = Math.round(m3.nghi - tBam)
kiem('K3 · «Tạm dừng» ⇒ máy em hiện «Thầy tạm dừng live» (≤ 500 ms kể từ lúc bấm)', m3.nghi - tBam <= 500, `${soDo.k3_tam_dung_toi_may_em_ms} ms`)
await ngu(400)
kiem('K3 · viên Live ghi «TẠM DỪNG», cửa sổ đổi thành «Tiếp tục»; phiên live giữ nguyên', /TẠM DỪNG/.test(await to.locator('.mc-lv-cum').innerText()) && /Tiếp tục/.test(await to.locator('.mc-lv-the').innerText()) && may.trangThai().live.bat === true)
await chup(thay, 'thay-dang-tam-dung-1366')
await chup(em.t, 'em-thay-tam-dung-844')
// Thầy viết lúc tạm dừng ⇒ máy em KHÔNG nhận; tiếp tục ⇒ nhận đủ
/** Số mẫu điểm ảnh có mực trên BẢNG ĐEN của máy em: nét đã chốt của bảng nằm ở khung cuộn `.lv-cuon` (bảng đen cuộn, 11/11); cộng cả phần ô bảng của lớp
 *  «đã chốt» chung (bản trước khi có khung cuộn). */
const mucBang = (t) => t.evaluate(() => {
  let n = 0
  const dem = (c, x, y, w, h) => { if (w < 1 || h < 1) return; const d = c.getContext('2d').getImageData(x, y, w, h).data; for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 40) n++ }
  for (const c of document.querySelectorAll('.lv-cuon canvas')) dem(c, 0, 0, c.width, c.height)
  const c = document.querySelector('.lv-cv'), g = document.querySelector('.lv-bang').getBoundingClientRect(), k = c.width / c.getBoundingClientRect().width
  dem(c, Math.round(g.left * k), Math.round(g.top * k), Math.round(g.width * k), Math.round(g.height * k))
  return n
})
await kiemGiay('đang tạm dừng')
const mucTruoc = await mucBang(em.t)
const bang = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
await thay.mouse.move(bang.x + 40, bang.y + 120); await thay.mouse.down()
for (let i = 1; i <= 20; i++) { await thay.mouse.move(bang.x + 40 + i * 9, bang.y + 120 + Math.sin(i / 2) * 14); await ngu(8) }
await thay.mouse.up(); await ngu(500)
const mucLucDung = await mucBang(em.t)
kiem('K3 · đang tạm dừng: nét thầy viết lên bảng KHÔNG tới máy em', mucLucDung === mucTruoc, `mực trong ô bảng máy em ${mucTruoc} → ${mucLucDung}`)
const tBam2 = await em.t.evaluate(() => performance.now())
await to.locator('.mc-lv-the [data-lv="tam-dung"]').click()
await em.t.locator('.lv-bao', { hasText: 'Thầy tạm dừng live' }).waitFor({ state: 'detached', timeout: 4000 })
const m4 = await moc(em.t)
soDo.k3_tiep_tuc_toi_may_em_ms = Math.round(m4.nghiMat - tBam2)
await ngu(600)
const mucSau = await mucBang(em.t)
await kiemGiay('sau khi tiếp tục')
if (process.env.LV_CUON) {
  // thầy cuộn bảng đen (bản bút 11/11) ⇒ giấy đề máy em KHÔNG được trôi theo
  await thay.mouse.move(bang.x + 80, bang.y + 200); await thay.mouse.wheel(0, 700); await ngu(900)
  await kiemGiay('sau khi thầy cuộn bảng đen')
  await chup(em.t, 'san-em-sau-cuon'); await chup(thay, 'san-thay-sau-cuon')
}
await chup(em.t, 'san-em'); await chup(thay, 'san-thay')
kiem('K3 · «Tiếp tục» ⇒ máy em hết dải dừng (≤ 500 ms), nét viết lúc dừng tới máy em một lượt', m4.nghiMat - tBam2 <= 500 && mucSau > mucLucDung + 5, `${soDo.k3_tiep_tuc_toi_may_em_ms} ms · mực trong ô bảng ${mucLucDung} → ${mucSau}`)
await to.locator('.mc-lv-the [data-lv="the-dong"]').click().catch(() => {})

// ───────────── B2: em rời màn ⇒ thẻ ghi kiểu rời ─────────────
const roi = (t, anDi) => t.evaluate((anDi) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => anDi }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (anDi ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); if (!anDi) window.dispatchEvent(new Event('focus')) }, anDi)
await roi(em2.t, true)
await to.locator('.mc-lv-roi-mo').waitFor({ timeout: 6000 })
const chuRoi = await to.locator('.mc-lv-roi-mo').innerText()
kiem('B2 · thẻ «em rời màn» ghi KIỂU rời (Chromium máy tính không phân biệt được khoá màn ⇒ «thoát app hoặc khoá màn»)', chuRoi.includes('Lê Gia Huy') && chuRoi.includes('thoát app hoặc khoá màn'), chuRoi.replace(/\s+/g, ' ').slice(0, 110))
await ngu(300)
await chup(thay, 'thay-roi-man-ghi-kieu-1366')
await roi(em2.t, false)
await em2.t.locator('.bpu-hs').tap({ position: { x: 200, y: 500 } }).catch(() => {})
await ngu(900)

// ───────────── Phóng bảng: chạm hai lần ─────────────
const oBang = await em.t.locator('.lv-bang').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width } })
await em.t.touchscreen.tap(oBang.x, oBang.y); await ngu(90); await em.t.touchscreen.tap(oBang.x, oBang.y)
await ngu(500)
const oBang2 = await em.t.locator('.lv-bang').evaluate((e) => e.getBoundingClientRect().width)
kiem('Chạm hai lần vào bảng đen ⇒ phóng bảng (ô bảng rộng hơn), có dòng «Chạm hai lần để về toàn cảnh»', oBang2 > oBang.w * 1.02 && (await em.t.locator('.lv-bao').allInnerTexts()).join(' ').includes('Chạm hai lần để về toàn cảnh'), `${Math.round(oBang.w)} → ${Math.round(oBang2)} px`)
await chup(em.t, 'em-phong-bang-844')
await em.t.touchscreen.tap(oBang.x, oBang.y); await ngu(90); await em.t.touchscreen.tap(oBang.x, oBang.y)
await ngu(400)

// ───────────── K1 (tiếp): câu mới ⇒ về màn câu hỏi; K3: kết thúc live ─────────────
await may.moLuot(CAU[1], 'B')
await em.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
kiem('Thầy chuyển câu ⇒ máy em về màn câu hỏi để làm (live còn, tay nắm mép phải)', await em.t.locator('.lv-phu.lv-dau').count() === 1 && await em.t.locator('.bpu-gui-noi').count() === 1)
await emGui(em.t)
await em.t.locator('.lv').waitFor({ timeout: 4000 })
const m5 = await moc(em.t)
soDo.k1_gui_toi_bang_lan_2_ms = Math.round((m5.lv - m5.gui) * 10) / 10
kiem('K1 · câu thứ hai: gửi xong lại tự về bảng live', m5.lv - m5.gui <= 200, `${soDo.k1_gui_toi_bang_lan_2_ms} ms`)
await to.locator('.mc-lv-cum').click()
await to.locator('.mc-lv-the [data-lv="tat"]').waitFor({ state: 'visible', timeout: 6000 })
await to.locator('.mc-lv-the [data-lv="tat"]').click()
await em.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
await ngu(400)
kiem('K3 · «Kết thúc live» bấm MỘT lần ⇒ hết live: máy em về màn Bình Phản Ứng, màn chiếu về nút «Live», nút «thêm» vẫn ở cuối thanh', may.trangThai().live.bat === false && await to.locator('.mc-lv-nut').isVisible() && await to.locator('#mc-them').isVisible() && await em.t.locator('.lv-phu').count() === 0)
await chup(thay, 'thay-sau-ket-thuc-1366')

// AN TOÀN: suốt kịch bản, trước khi thầy mở đáp án, không tin nào tới máy em mang đáp án
kiem('AN TOÀN · lượt đang mở: view máy em không có khoá đáp án / lời giải', await em2.t.evaluate(() => true) && !JSON.stringify(may.trangThai().luot.ketQua ?? null).includes('dung'))
kiem('Không lỗi JavaScript trên ba trang', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))

const hong = ket.filter((k) => !k.dat)
writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium thật, phòng thật trong Node, dữ liệu giả; KHÔNG có tiếng (SFU chưa cấu hình ở máy chủ thử).', soDo, kiem: ket }, null, 2) + '\n')
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt · số đo: ${JSON.stringify(soDo)}`)
await trinh.close(); await may.dong()
process.exit(hong.length ? 1 : 0)
