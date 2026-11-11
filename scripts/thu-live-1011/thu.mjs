#!/usr/bin/env node
// LƯU Ý 11/11: luật màn máy em + thanh màn chiếu đã đổi sau khi thầy test máy thật (đặc tả 4.3e) — nhiều phép kiểm dưới đây theo luật CŨ («gửi xong vẫn ở màn
// câu hỏi», nút «Tắt live» trên thanh, tay nắm mép phải) sẽ trượt. Kịch bản hiện hành: scripts/thu-live-1011/thu-2.mjs. Tệp này giữ để tham khảo phần đo khung hình.
// BỘ THỬ LIVE BẢNG (10/11, đợt 1B) — Chromium THẬT, HAI TRANG (thầy + em) qua phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011] [tệp số đo = docs/ban-ve-live-1011/so-do-that.json]
// Kịch bản: thầy bấm Live (thẻ chọn mic → Bắt đầu live) ⇒ máy em giữ màn câu hỏi + dấu «Thầy đang live» ⇒ thầy gọi em lên bảng ⇒ máy em sang bảng live ⇒ thầy viết bằng bút (sự kiện
// con trỏ thật, 200 Hz) ⇒ nét hiện bên em ⇒ khay ⇒ em rời màn ⇒ thẻ gọn trên tờ ⇒ mất mạng / nối lại bắt kịp ⇒ lượt mới (về màn câu hỏi) ⇒ tắt live.
// Ảnh thật `that-*.jpg` (≤ 150 KB) để đối chiếu bản vẽ; đo khung hình máy em lúc nhận nét ở CPU ×1 / ×4 / ×6.
// KHÔNG kiểm được ở đây: tiếng (cần Cloudflare Realtime SFU thật + mic thật), khoá xoay của Android, vùng an toàn iPhone — kiểm trên máy thật.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'
import { taoNgauNhien, vietDong, camBut } from '../but-bang-1011/chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
const SO_DO = resolve(process.argv[4] ?? join(ANH, 'so-do-that.json'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

/** Chốt chặn thứ hai (ngoài trang.tsx): mọi yêu cầu không về máy chủ thử đều bị huỷ — bộ thử không bao giờ chạm máy chủ thật. */
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function chup(t, ten, tuy = {}) {
  let q = 86, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, ...tuy }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(ANH, `that-${ten}.jpg`), buf)
  console.log(`  ảnh that-${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}
const CAU = [
  { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  { qid: 'Q2', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Phenol (C6H5OH) tác dụng được với dung dịch nào sau đây?', choices: ['NaCl', 'NaOH', 'HCl', 'NaHCO3'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 2, kienThuc: [] },
]

async function trangEm(sbd, w, h, dpr, ts = '', tuy = {}) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, ...tuy })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message}`))
  await t.addInitScript(() => {
    const D = (window.__do = { bat: false, khung: [], xl: [] })
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (f) => raf((x) => { const a = performance.now(); f(x); if (D.bat) D.xl.push(performance.now() - a) })
    let truoc = 0
    const vong = (x) => { if (D.bat && truoc) D.khung.push(x - truoc); truoc = x; raf(vong) }
    raf(vong)
  })
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}${ts}`)
  return { t, ctx }
}
/** Em chọn phương án B rồi bấm Gửi (màn làm bài của Bình Phản Ứng). */
async function emGui(t) {
  await t.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await t.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
  await t.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
}

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
kiem('Tờ chiếu có nút «Live» khi phòng bật công tắc live', true)
await ngu(600)
await chup(thay, '01-thay-chua-live-1366')

// ───────────── EM (đã vào lớp, lượt đang mở, chưa gửi) ─────────────
await may.moLuot(CAU[0], 'B')
const em = await trangEm('S1', 844, 390, 2)
await em.t.locator('.bpu-hs').waitFor({ timeout: 20000 })
const em2 = await trangEm('S2', 390, 844, 3)
await em2.t.locator('.bpu-hs').waitFor({ timeout: 20000 })

// ───────────── BẬT LIVE ─────────────
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await to.locator('.mc-lv-the select').waitFor({ timeout: 8000 }).catch(() => {})
await ngu(700)
kiem('Bấm Live lần đầu ⇒ thẻ bật live + chọn mic', await to.locator('.mc-lv-the select option').count() > 0, `${await to.locator('.mc-lv-the select option').count()} mic`)
await chup(thay, '04-thay-bat-live-chon-mic-1366')
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click()
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
kiem('«Bắt đầu live» ⇒ viên đỏ LIVE + đồng hồ + «Tắt live»', await to.locator('.mc-lv-tat:not(.mc-lv-bg)').isVisible())
kiem('Bấm Live ⇒ bút bật sẵn', await to.locator('body.mc-co-but').count() === 1)
const mepPhai = await to.locator('#mc-cai-btn').evaluate((e) => Math.round(e.getBoundingClientRect().right))
kiem('Thanh dưới 1366 không tràn khi live (Tắt live + Cài đặt còn trong màn)', mepPhai <= 1366 && mepPhai > 0, `mép phải nút Cài đặt ${mepPhai} px`)

// LUẬT THẦY CHỐT TỐI 10/11: live = TIẾNG; máy em vẫn là màn câu hỏi như thường + dấu nhỏ «Thầy đang live» (kèm nút tiếng); CHƯA vào bảng.
await em2.t.locator('.lv-dau').waitFor({ timeout: 8000 })
kiem('Thầy bật live: máy em giữ màn câu hỏi + dấu «Thầy đang live» có nút tiếng, KHÔNG vào bảng', await em2.t.locator('.lv').count() === 0 && await em2.t.locator('.lv-dau button').count() === 1 && await em.t.locator('.lv').count() === 0)
const hDau = await em2.t.evaluate(() => { const d = document.querySelector('.lv-dau').getBoundingClientRect(), g = document.querySelector('.bpu-gui-noi')?.getBoundingClientRect(); return { dau: [d.left, d.top, d.right, d.bottom], gui: g ? [g.left, g.top, g.right, g.bottom] : null } })
kiem('Dấu «Thầy đang live» không đè nút «Gửi» nổi', !hDau.gui || hDau.dau[2] < hDau.gui[0] || hDau.dau[1] > hDau.gui[3] || hDau.dau[3] < hDau.gui[1], JSON.stringify(hDau.dau.map(Math.round)))
await chup(em2.t, '41-em-dau-thay-dang-live-man-cau-hoi-390')
await em2.t.locator('.lv-dau button').tap()
kiem('Chạm nút tiếng trên dấu ⇒ «đang bật»', await em2.t.locator('.lv-dau button[aria-pressed="true"]').count() === 1)
await emGui(em.t)
await emGui(em2.t)
await ngu(1700)
kiem('Em gửi xong khi thầy live: vẫn màn Bình Phản Ứng (đã gửi) + dấu, chưa vào bảng', await em.t.locator('.lv').count() === 0 && await em.t.locator('.lv-dau').count() === 1)
await chup(em2.t, '42-em-dau-thay-dang-live-da-gui-390')
// Chuyển câu khi đang live: tờ dựng lại / sang đợt — live (tiếng) không rớt, máy em vẫn màn câu hỏi
kiem('Công tắc «Bảng → máy em» có trên cụm Live, đang tắt', await to.locator('.mc-lv-bg[aria-pressed="false"]').isVisible())
// THẦY GỌI EM LÊN BẢNG (phòng: pha «gọi») ⇒ máy cả lớp LẬP TỨC sang bảng live, xoay ngang
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S2', lyDo: ['Chưa lên bảng buổi này'] })))
await em.t.locator('.lv').waitFor({ timeout: 8000 })
await chup(em.t, '25-em-vao-live-844')
kiem('Thầy gọi em lên bảng ⇒ máy em tự sang bảng live', true)
await em2.t.locator('.lv[data-xoay]').waitFor({ timeout: 8000 })
kiem('Máy dọc không khoá ngang được ⇒ hình xoay 90° bằng CSS', true)
await to.locator('.mc-lv-bg[aria-pressed="true"]').waitFor({ timeout: 5000 }).then(() => kiem('Gọi lên bảng ⇒ công tắc «Bảng → máy em» tự bật', true), () => kiem('Gọi lên bảng ⇒ công tắc «Bảng → máy em» tự bật', false))
await ngu(1200)

// ───────────── THẦY VIẾT (sự kiện con trỏ thật, 200 Hz) ─────────────
const cdpThay = await ctxThay.newCDPSession(thay)
const K = 1366 / 1920
async function viet(dsNet, { nghi = 70 } = {}) {
  const cho = []
  const gui = (type, x, y, ap, buttons) => cho.push(cdpThay.send('Input.dispatchMouseEvent', { type, x: x * K, y: y * K, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: ap }).catch(() => {}))
  for (const m of dsNet) {
    const dau = performance.now()
    gui('mousePressed', m[0][0], m[0][1], m[0][2], 1)
    for (let i = 1; i < m.length; i++) {
      for (let con = dau + m[i][3] - performance.now(); con > 0; con = dau + m[i][3] - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
      gui('mouseMoved', m[i][0], m[i][1], m[i][2], 1)
    }
    const c = m[m.length - 1]
    gui('mouseReleased', c[0], c[1], 0, 0)
    await ngu(nghi)
  }
  await Promise.all(cho)
}
const rnd = taoNgauNhien(1011)
await viet([...vietDong('Giải:', 1312, 170, 44, { rnd, vMax: 900 }), ...vietDong('CH_3CHOHCH_3', 1312, 262, 42, { rnd, vMax: 900 }), camBut([[1306, 372], [1450, 376], [1600, 370]], { rnd, vMax: 900 })])
await ngu(900)
const soNetThay = await to.locator('body').evaluate(() => window.__mcBut.xuat().net.length)
const soNetEm = () => em.t.evaluate(() => { const c = document.querySelectorAll('.lv-cv')[0]; const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 97) if (d[i]) n++; return n })
const diemEm = await soNetEm()
kiem('Thầy viết ⇒ nét hiện trên máy em', soNetThay > 5 && diemEm > 20, `thầy ${soNetThay} nét · lớp «đã chốt» máy em có ${diemEm} mẫu điểm ảnh có mực`)
await chup(thay, '05-thay-dang-live-1366')
await chup(em.t, '13-em-an-het-844')
await chup(em2.t, '36-em-iphone-doc-xoay-css-an-het-390')

// Khay điều khiển: chạm tay nắm
await em.t.locator('.lv-nam').tap()
await em.t.locator('.lv-khay[data-mo]').waitFor({ timeout: 4000 })
await ngu(450)
const nut = await em.t.locator('.lv-khay button, .lv-nam').evaluateAll((ds) => ds.map((e) => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height) }))
kiem('Khay mở: Tiếng · mạng · đội + kJ; mọi nút ≥ 48 px; không có nút thoát', nut.every((v) => v >= 47.5) && await em.t.locator('.lv-khay').getByText(/Thoát|Đóng|Rời/).count() === 0, `nút nhỏ nhất ${Math.min(...nut).toFixed(0)} px`)
await chup(em.t, '19-em-khay-mo-844')
await ngu(3300)
kiem('Khay tự thu sau 3 giây không chạm', await em.t.locator('.lv-khay[data-mo]').count() === 0)
await em2.t.locator('.lv-nam').tap(); await ngu(450)
await chup(em2.t, '37-em-iphone-doc-xoay-css-khay-mo-390')

// ───────────── EM RỜI MÀN ⇒ THẺ TRÊN TỜ ─────────────
const roi = (t, an) => t.evaluate((an) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => an }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (an ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')) }, an)
await roi(em2.t, true)
await to.locator('.mc-lv-roi-mo').waitFor({ timeout: 6000 })
kiem('Em rời màn khi live ⇒ tờ hiện thẻ tên (không viền đỏ toàn màn) + viền mảnh', await to.locator('.mc-lv-vien').isVisible() && (await to.locator('.mc-lv-roi-mo').innerText()).includes('Lê Gia Huy'))
await ngu(500)
await chup(thay, '09-thay-em-roi-man-the-mo-1366')
await ngu(4200)
kiem('Thẻ tự thu gọn sau 4 giây', await to.locator('.mc-lv-roi-gon').isVisible())
await chup(thay, '08-thay-em-roi-man-the-gon-1366')
await roi(em2.t, false)
await em2.t.locator('.bpu-hs').tap({ position: { x: 30, y: 400 } }).catch(() => {})
await to.locator('.mc-lv-vien').waitFor({ state: 'hidden', timeout: 8000 }).then(() => kiem('Em quay lại ⇒ tên tự mất, viền tắt', true), () => kiem('Em quay lại ⇒ tên tự mất, viền tắt', false))
await em2.ctx.close() // phần đo bên dưới chỉ còn MỘT máy em (máy đo không phải vẽ thêm trang thứ ba)

// ───────────── ĐO KHUNG HÌNH MÁY EM KHI NHẬN NÉT ─────────────
const tk = (ds) => { const s = [...ds].sort((a, b) => a - b), lay = (p) => (s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2) : 0); return { n: s.length, trungVi: lay(0.5), p95: lay(0.95), lonNhat: lay(1) } }
const cdpEm = await em.ctx.newCDPSession(em.t)
const soDo = []
await cdpEm.send('Performance.enable')
const docCdp = async () => Object.fromEntries((await cdpEm.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
// mức nền: bảng live đứng yên (thầy không viết) 2 giây ở CPU ×4 — luồng chính bận bao nhiêu khi không có nét nào
await cdpEm.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await ngu(300)
const nen0 = await docCdp(), tNen = performance.now()
await ngu(2000)
const nen1 = await docCdp()
const nenNghi = +((nen1.TaskDuration - nen0.TaskDuration) / ((performance.now() - tNen) / 1000) * 100).toFixed(1)
console.log(`  mức nền ×4 (không nét): luồng chính bận ${nenNghi} %`)
for (const cpu of [1, 4, 6]) {
  await cdpEm.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await ngu(300)
  const truocCdp = await docCdp(), t0Do = performance.now()
  await em.t.evaluate(() => { window.__do.khung = []; window.__do.xl = []; window.__do.bat = true })
  const r2 = taoNgauNhien(40 + cpu), y0 = 430 + (cpu === 1 ? 0 : cpu === 4 ? 150 : 300)
  await viet([...vietDong('n = 0,1 mol', 1312, y0, 40, { rnd: r2, vMax: 900 }), ...vietDong('CH_3COOH + NaOH', 1312, y0 + 70, 38, { rnd: r2, vMax: 900 })], { nghi: 60 })
  await ngu(500)
  const D = await em.t.evaluate(() => { window.__do.bat = false; return window.__do })
  const sauCdp = await docCdp(), giayDo = (performance.now() - t0Do) / 1000
  // phần trăm thời gian luồng chính bận (đã nhân hệ số hãm CPU): tổng việc · mã · bố cục · tính kiểu
  const luong = Object.fromEntries(['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration'].map((k) => [k.replace('Duration', ''), +((sauCdp[k] - truocCdp[k]) / giayDo * 100).toFixed(1)]))
  const kh = tk(D.khung), xl = tk(D.xl), tong = D.khung.reduce((s, v) => s + v, 0)
  const dong = { cpu: '×' + cpu, khungMoiGiay: +(kh.n / (tong / 1000)).toFixed(1), cachKhungTrungViMs: kh.trungVi, cachKhungP95Ms: kh.p95, khungTreHon20Ms: D.khung.filter((v) => v > 20).length, soKhung: kh.n, xuLyMoiKhungMs: { trungVi: xl.trungVi, p95: xl.p95, lonNhat: xl.lonNhat }, luongChinhBanPhanTram: luong }
  soDo.push(dong)
  console.log('  đo', JSON.stringify(dong))
}
await cdpEm.send('Emulation.setCPUThrottlingRate', { rate: 1 })
kiem('Máy em nhận nét ở CPU ×4: ≥ 55 khung / giây', soDo[1].khungMoiGiay >= 55, `${soDo[1].khungMoiGiay} khung/giây · p95 khoảng khung ${soDo[1].cachKhungP95Ms} ms · xử lý mỗi khung p95 ${soDo[1].xuLyMoiKhungMs.p95} ms`)

// ───────────── MẤT MẠNG ⇒ NỐI LẠI BẮT KỊP ─────────────
await em.t.context().setOffline(true)
may.cat('S1')
await em.t.locator('.lv[data-mat]').waitFor({ timeout: 8000 }).then(() => kiem('Mất mạng ⇒ bảng đứng, dải «Mất kết nối · đang nối lại…»', true), () => kiem('Mất mạng ⇒ bảng đứng, dải «Mất kết nối · đang nối lại…»', false))
await ngu(300)
await chup(em.t, '33-em-mat-mang-noi-lai-844')
await viet(vietDong('> 2 mol', 1312, 900, 40, { rnd, vMax: 900 }))
const truocNoi = await soNetEm()
await em.t.context().setOffline(false)
await em.t.locator('.lv:not([data-mat])').waitFor({ timeout: 15000 }).catch(() => {})
await ngu(2500)
const sauNoi = await soNetEm()
kiem('Nối lại ⇒ tự bắt kịp nét thầy viết lúc mất mạng (từ sổ nét)', sauNoi > truocNoi, `mẫu mực ${truocNoi} → ${sauNoi}`)

// ───────────── CHUYỂN CÂU ⇒ LƯỢT MỚI: MÁY EM VỀ MÀN CÂU HỎI DỌC, LIVE (TIẾNG) VẪN CHẠY ─────────────
await thay.keyboard.press('Escape').catch(() => {})
await to.locator('#mc-sau').click()
await ngu(600)
await may.moLuot(CAU[1], 'B')
await em.t.locator('.lv-dau').waitFor({ timeout: 8000 }).then(() => kiem('Lượt mới khi đang live ⇒ máy em về màn câu hỏi (bỏ bảng live) + dấu «Thầy đang live»', true), () => kiem('Lượt mới khi đang live ⇒ máy em về màn câu hỏi (bỏ bảng live) + dấu «Thầy đang live»', false))
kiem('Chuyển câu: viên LIVE trên tờ còn nguyên (live không rớt), bảng → máy em tự tắt', await to.locator('.mc-lv-cum b#mc-lv-dh').count() === 1 && await to.locator('.mc-lv-bg[aria-pressed="false"]').count() === 1 && await em.t.locator('.lv').count() === 0)
// gọi lần nữa ở câu mới ⇒ bảng mới (sạch nét của câu cũ)
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S3', lyDo: ['Chưa lên bảng buổi này'] })))
await em.t.locator('.lv').waitFor({ timeout: 8000 })
await ngu(900)
const sauChuyen = await soNetEm()
kiem('Câu mới: bảng live của máy em là bảng mới (sạch nét câu cũ)', sauChuyen < 5, `mẫu mực còn ${sauChuyen}`)

// ───────────── TẮT LIVE ─────────────
await to.locator('.mc-lv-tat:not(.mc-lv-bg)').click()
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 8000 })
await ngu(800)
kiem('Tắt live ⇒ tờ về nút «Live», máy em bỏ lớp live + dấu', await em.t.locator('.lv, .lv-dau').count() === 0)

kiem('Không lỗi trang nào', loiTrang.length === 0, loiTrang.slice(0, 4).join(' | '))
writeFileSync(SO_DO, JSON.stringify({ ngay: new Date().toISOString(), ghiChu: 'Bộ thử scripts/thu-live-1011/thu.mjs — Chromium không đầu, phòng thật trong Node, nét đi đường WebSocket (không SFU). Máy em 844 × 390 @2x.', khungHinhMayEm: soDo, luongChinhBanKhiDungYenX4PhanTram: nenNghi, kiem: ket }, null, 2) + '\n')
await trinh.close()
await may.dong()
const hong = ket.filter((k) => !k.dat)
console.log(hong.length ? `\n${hong.length} mục CHƯA đạt` : `\nĐạt cả ${ket.length} mục`)
process.exit(hong.length ? 1 : 0)
