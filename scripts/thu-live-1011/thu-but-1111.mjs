#!/usr/bin/env node
// ĐO BÚT + ĐỒNG BỘ NÉT TRÊN MÁY EM (11/11, thầy thử máy thật: «đang bị giật khựng ở máy hs, phải đồng bộ nét bút tức thì mượt mà cực mượt mà»).
// Chromium THẬT, HAI TRANG (tờ chiếu của thầy + máy em) qua phòng THẬT chạy trong Node (may-chu.mjs); nét đi đường WebSocket của phòng (không SFU). Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-but-1111.mjs <thư mục tạm> [tệp số đo = docs/ban-ve-but-1011/so-do-may-em.json] [thư mục ảnh = docs/ban-ve-but-1011]
//   Đo bản CŨ: build cùng cấu hình trên một bản giải nén `git archive <commit cũ>` rồi trỏ <thư mục tạm> sang đó, thêm TEN=truoc.
// ĐO (mỗi khung hình của MÁY EM ghi: giờ · chu vi đuôi nét dở vừa vẽ · số lần tô xuống lớp chốt · chỗ con trỏ — không đọc điểm ảnh nên không làm chậm khung):
//   · trong từng nét của thầy: khoảng cách giữa hai khung có mực mới (p95, dài nhất) · số quãng đứng ≥ 50 ms · trễ «thầy chạm bút → máy em có mực»
//   · con trỏ: số khung mực đang chảy mà con trỏ đứng im · số lần con trỏ đang đứng rồi nhảy ≥ 6 px trong một khung
//   · nét «ướt» so nét «khô» trên máy em (ảnh ô bảng ngay trước và sau khi nét chốt)
//   · khung hình máy em lúc nhận nét ở CPU ×1 / ×4 / ×6
// Bản mới còn: bảng đen cuộn (thầy lăn chuột ⇒ viết tiếp ⇒ máy em tự trôi theo) + ảnh cây bút phóng to, bảng đã cuộn (thầy + em).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { moMayChu } from './may-chu.mjs'
import { taoNgauNhien, vietDong } from '../but-bang-1011/chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const SO_DO = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-may-em.json'))
const ANH = resolve(process.argv[4] ?? join(GOC, 'docs/ban-ve-but-1011'))
const TEN = process.env.TEN || 'sau'
mkdirSync(dirname(SO_DO), { recursive: true }); mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const loiTrang = []

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function luuAnh(buf, ten, rong) {
  let q = 88, ra
  do { ra = await (rong ? sharp(buf).resize({ width: rong, kernel: 'lanczos3' }) : sharp(buf)).jpeg({ quality: q, mozjpeg: true }).toBuffer(); q -= 6 } while (ra.length > 150 * 1024 && q > 30)
  writeFileSync(join(ANH, ten), ra)
  console.log(`  ảnh ${ten} ${Math.round(ra.length / 1024)} KB`)
}
const CAU = { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] }

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
await may.moLuot(CAU, 'B')

// ───────────── EM ─────────────
const ctxEm = await trinh.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
await chanNgoai(ctxEm)
const em = await ctxEm.newPage()
em.on('pageerror', (e) => loiTrang.push(`em: ${e.message}`))
await em.addInitScript(() => {
  // GHI MỖI KHUNG (rẻ, không đọc điểm ảnh): [giờ tuyệt đối ms, chu vi đuôi nét dở vừa vẽ trên lớp «đang viết» (đơn vị nét, đầu nét tiến thì chu vi đổi),
  //   số lần tô xuống lớp đã chốt, x con trỏ, y con trỏ (px CSS; −1 = ẩn), độ cuộn bảng của máy em (px)] + thời gian xử lý của mỗi lượt rAF.
  // Chu vi lấy bằng cách đếm trong chính các lệnh vẽ của lớp vẽ (bọc beginPath / quadraticCurveTo / fill) ⇒ không làm chậm khung hình như chụp điểm ảnh.
  const D = (window.__do = { bat: false, khung: [], cach: [], xl: [], anh: {} })
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (f) => raf((x) => { const a = performance.now(); f(x); if (D.bat) D.xl.push(performance.now() - a) })
  const P = CanvasRenderingContext2D.prototype, bp = P.beginPath, qc = P.quadraticCurveTo, fl = P.fill, fr = P.fillRect
  let dai = 0, nq = 0, px = 0, py = 0, song = 0, chot = 0, but = null
  P.beginPath = function () { dai = 0; nq = 0; px = py = NaN; return bp.call(this) }
  P.quadraticCurveTo = function (a, b, x, y) { if (px === px) dai += Math.hypot(x - px, y - py); px = x; py = y; nq++; return qc.call(this, a, b, x, y) }
  // đa giác nét có nhiều đoạn cong (≥ 6); thân cây bút chỉ có 2 ⇒ không tính nhầm cây bút là mực
  // D.boBut = không vẽ cây bút (để so ảnh nét ướt / khô mà không dính hình bút): bỏ các lệnh tô ít đoạn cong + fillRect trên lớp «đang viết»
  P.fill = function (...ts) { const c = this.canvas, trongLv = c && c.isConnected && c.closest('.lv'); if (trongLv && nq < 6 && D.boBut && c.width === c.height && !ts.length) return; if (nq >= 6 && trongLv) { if (c.width === c.height) song = Math.max(song, dai); else chot++ } return fl.apply(this, ts) }
  // cây bút vẽ trên canvas (bản 11/11): đai màu của nó là lệnh fillRect duy nhất trên lớp «đang viết» ⇒ gốc phép biến đổi lúc đó = chỗ ngòi bút
  P.fillRect = function (x, y, w, h) {
    const c = this.canvas
    if (c && c.width === c.height && c.isConnected && c.closest('.lv')) { const m = this.getTransform(), k = window.devicePixelRatio || 1, v = /translate3d\(([-0-9.]+)px, ?([-0-9.]+)px/.exec(c.style.transform); but = [m.e / k + (v ? +v[1] : 0), m.f / k + (v ? +v[2] : 0), this.globalAlpha > 0.99]; if (D.boBut) return }
    return fr.call(this, x, y, w, h)
  }
  let truoc = 0
  const vong = (x) => {
    raf(vong)
    if (D.bat && truoc) D.cach.push(x - truoc)
    truoc = x
    if (!D.bat || D.nhe) { song = 0; chot = 0; return }
    // con trỏ: bản mới = cây bút vẽ trên canvas (ghi ở trên); bản cũ = chấm tròn `.lv-tro` dời bằng transform
    const b = document.querySelector('.lv-tro')
    let cx = -1, cy = -1
    if (but) { cx = but[0]; cy = but[1] }
    else if (b && b.style.opacity === '1') { const m = /translate3d\(([-0-9.]+)px, ?([-0-9.]+)px/.exec(b.style.transform); if (m) { cx = +m[1]; cy = +m[2] } }
    D.but = but; but = null
    const tr = document.querySelector('.lv-cuon > div')
    const mc = tr ? /translate3d\(0(?:px)?, ?([-0-9.]+)px/.exec(tr.style.transform) : null
    D.khung.push([performance.timeOrigin + performance.now(), +song.toFixed(2), chot, cx, cy, mc ? -mc[1] : 0])
    song = 0; chot = 0
  }
  raf(vong)
  // chụp ô bảng đen (mọi canvas của lớp live chồng đúng chỗ, thu về px CSS) — chỉ khi được gọi
  D.chup = (ten) => {
    const o = document.querySelector('.lv-bang'); if (!o) return
    const r = o.getBoundingClientRect(), tam = document.createElement('canvas'); tam.width = Math.round(r.width * 2); tam.height = Math.round(r.height * 2)
    const g = tam.getContext('2d', { willReadFrequently: true })
    for (const c of document.querySelectorAll('.lv canvas')) { const q = c.getBoundingClientRect(); if (q.width > 4 && c.width > 4) g.drawImage(c, (q.left - r.left) * 2, (q.top - r.top) * 2, q.width * 2, q.height * 2) }
    D.anh[ten] = g.getImageData(0, 0, tam.width, tam.height).data
  }
  D.so = (a, b2) => { const x = D.anh[a], y = D.anh[b2]; let khac = 0, khac16 = 0, lon = 0; if (!x || !y) return null; for (let i = 3; i < x.length; i += 4) { const v = Math.abs(x[i] - y[i]); if (v) { khac++; if (v >= 16) khac16++; if (v > lon) lon = v } } return [khac, khac16, lon] }
})
await em.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=S1`)
await em.locator('.bpu-hs').waitFor({ timeout: 20000 })

// ───────────── BẬT LIVE + GỌI EM LÊN BẢNG ⇒ MÁY EM VÀO BẢNG LIVE ─────────────
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(600)
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click()
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S2', lyDo: ['Chưa lên bảng buổi này'] })))
await em.locator('.lv').waitFor({ timeout: 8000 })
await ngu(1500)
const coCuon = await to.locator('body').evaluate(() => typeof window.__mcBut.cuon === 'function')

// ───────────── THẦY VIẾT (sự kiện con trỏ thật, 200 Hz) ─────────────
const cdpThay = await ctxThay.newCDPSession(thay)
const K = 1366 / 1920
/** Viết các nét (toạ độ ở khổ 1920); trả giờ chạm / nhấc của từng nét (đồng hồ máy, ms). `dung` = đứng yên ngần ấy ms trước khi nhấc. */
async function viet(dsNet, { nghi = 110, dung = 0, sauNhac = null } = {}) {
  const cho = [], moc = []
  const gui = (type, x, y, ap, buttons) => cho.push(cdpThay.send('Input.dispatchMouseEvent', { type, x: x * K, y: y * K, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: ap }).catch(() => {}))
  for (const m of dsNet) {
    const dau = performance.now(), t0 = Date.now()
    gui('mousePressed', m[0][0], m[0][1], m[0][2], 1)
    for (let i = 1; i < m.length; i++) {
      for (let con = dau + m[i][3] - performance.now(); con > 0; con = dau + m[i][3] - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
      gui('mouseMoved', m[i][0], m[i][1], m[i][2], 1)
    }
    const c = m[m.length - 1]
    if (dung) { await Promise.all(cho); await ngu(dung) }
    if (sauNhac) await sauNhac('truoc')
    gui('mouseReleased', c[0], c[1], 0, 0)
    moc.push([t0, Date.now(), m.length])
    if (sauNhac) { await Promise.all(cho); await sauNhac('sau') }
    // giữa hai nét: bút lơ lửng đi tới đầu nét sau (như tay thật) — máy em phải thấy con trỏ trượt theo
    const ke = dsNet[dsNet.indexOf(m) + 1]
    if (ke) { const buoc = Math.max(2, Math.round(nghi / 8)); for (let i = 1; i < buoc; i++) { gui('mouseMoved', c[0] + (ke[0][0] - c[0]) * i / buoc, c[1] + (ke[0][1] - c[1]) * i / buoc, 0, 0); await ngu(8) } } else await ngu(nghi)
  }
  await Promise.all(cho)
  return moc
}
const tk = (ds) => { const s = [...ds].sort((a, b) => a - b), lay = (p) => (s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1) : 0); return { n: s.length, trungVi: lay(0.5), p95: lay(0.95), lonNhat: lay(1) } }

/** Phân tích chuỗi khung của máy em theo mốc từng nét của thầy. Khung «có mực mới» = chu vi đuôi nét dở đổi so với khung trước. */
function phanTich(khung, moc) {
  const cach = [], tre = [], dung = []
  let dungIm = 0, coMuc = 0, nhay = 0, dung50 = 0
  // chỉ tính đuôi nét dở ĐỔI (đầu nét tiến); lần tô xuống lớp chốt lúc nét xong không đổi hình nên không tính là mực mới
  const moi = (i) => i > 0 && khung[i][1] > 0 && Math.abs(khung[i][1] - khung[i - 1][1]) > 0.3
  for (let j = 0; j < moc.length; j++) {
    const [t0, t1] = moc[j], het = moc[j + 1] ? moc[j + 1][0] : Infinity
    // khung có mực mới thuộc nét này: từ lúc thầy chạm tới 300 ms sau khi nhấc, nhưng không lấn sang nét sau (mực của nét sau không thể tới trước «chạm + 40 ms»)
    const ds = []
    for (let i = 1; i < khung.length; i++) if (khung[i][0] >= t0 && khung[i][0] <= Math.min(t1 + 300, het + 40) && moi(i)) ds.push(khung[i][0])
    if (ds.length < 2) continue
    tre.push(ds[0] - t0)
    let dai = 0
    for (let i = 1; i < ds.length; i++) { const d = ds[i] - ds[i - 1]; cach.push(d); if (d > dai) dai = d; if (d >= 50) dung50++ }
    dung.push(dai)
  }
  for (let i = 2; i < khung.length; i++) {
    const a = khung[i - 1], b = khung[i], muc = moi(i) && moi(i - 1) && b[1] > 0
    const buoc = b[3] < 0 || a[3] < 0 ? 0 : Math.hypot(b[3] - a[3], b[4] - a[4]), buocTruoc = a[3] < 0 || khung[i - 2][3] < 0 ? 0 : Math.hypot(a[3] - khung[i - 2][3], a[4] - khung[i - 2][4])
    if (muc) { coMuc++; if (buoc < 0.05) dungIm++ }
    if (buoc >= 6 && buocTruoc < 0.05 && a[3] >= 0) nhay++
  }
  return { soNet: tre.length, cachKhungCoMucMs: tk(cach), quangDungDaiNhatMoiNetMs: tk(dung), quangDungTu50Ms: dung50, treChamButToiMucMs: tk(tre), conTro: { khungMucChay: coMuc, trongDoConTroDungIm: dungIm, dungRoiNhay6px: nhay } }
}

const rnd = taoNgauNhien(1111)
const BAI = [...vietDong('CH_3COOH + NaOH', 1312, 150, 40, { rnd, vMax: 700 }), ...vietDong('> CH_3COONa + H_2O', 1312, 225, 40, { rnd, vMax: 700 }), ...vietDong('n = 0,1 mol', 1312, 300, 40, { rnd, vMax: 700 }), ...vietDong('C_6H_5OH + NaOH', 1312, 375, 40, { rnd, vMax: 700 })]
const kq = { ten: TEN, ngay: new Date().toISOString(), may: 'Chromium không đầu /opt/pw-browsers, thầy 1366 × 768, máy em 844 × 390 @2x; phòng thật trong Node; nét đi WebSocket của phòng (không SFU, không mạng thật)' }

// 1 · NHỊP MỰC + CON TRỎ ở CPU ×1
await em.evaluate(() => { window.__do.khung = []; window.__do.bat = true })
const moc = await viet(BAI)
await ngu(700)
let D = await em.evaluate(() => { window.__do.bat = false; return { khung: window.__do.khung } })
kq.nhipMuc = phanTich(D.khung, moc)
console.log(`[${TEN}] nhịp mực ×1:`, JSON.stringify(kq.nhipMuc))

// 2 · NÉT ƯỚT so NÉT KHÔ trên máy em: đứng yên 250 ms cuối nét (đầu nét đã tới nơi), chụp ô bảng, nhấc bút, chờ nét chốt, chụp lại
const danh = (ten) => em.evaluate((n) => new Promise((xong) => requestAnimationFrame(() => { window.__do.chup(n); xong() })), ten)
const uotKho = []
await em.evaluate(() => { window.__do.khung = []; window.__do.bat = true; window.__do.boBut = true })
await viet(vietDong('H_2O', 1312, 450, 40, { rnd, vMax: 700 }), { dung: 300, sauNhac: async (luc) => { if (luc === 'truoc') await danh('uot'); else { await ngu(700); await danh('kho'); uotKho.push(await em.evaluate(() => window.__do.so('uot', 'kho'))) } } })
await em.evaluate(() => { window.__do.bat = false; window.__do.boBut = false })
{ const ds = uotKho.filter(Boolean); kq.uotSoKhoMayEm = { soNet: ds.length, netCoKhac: ds.filter((x) => x[0] > 0).length, diemAnhKhac: ds.reduce((s, x) => s + x[0], 0), khac16: ds.reduce((s, x) => s + x[1], 0), mucLon: ds.reduce((s, x) => Math.max(s, x[2]), 0), ghiChu: 'ô bảng đen của máy em ở đúng điểm ảnh thiết bị (@2x)' } }
console.log(`[${TEN}] ướt so khô máy em:`, JSON.stringify(kq.uotSoKhoMayEm))

// 3 · KHUNG HÌNH MÁY EM lúc nhận nét ở CPU ×1 / ×4 / ×6 (không chụp ô bảng mỗi khung — chỉ đo khung)
const cdpEm = await ctxEm.newCDPSession(em)
await cdpEm.send('Performance.enable')
const docCdp = async () => Object.fromEntries((await cdpEm.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
kq.khungHinhMayEm = []
for (const cpu of [1, 4, 6]) {
  await cdpEm.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await ngu(300)
  const c0 = await docCdp(), t0 = performance.now()
  await em.evaluate(() => { window.__do.cach = []; window.__do.xl = []; window.__do.nhe = true; window.__do.bat = true })
  const r2 = taoNgauNhien(40 + cpu)
  await viet([...vietDong('n = 0,1 mol', 1312, 520 + (cpu === 1 ? 0 : cpu === 4 ? 70 : 140), 38, { rnd: r2, vMax: 900 }), ...vietDong('CH_3COOH', 1500, 520 + (cpu === 1 ? 0 : cpu === 4 ? 70 : 140), 38, { rnd: r2, vMax: 900 })], { nghi: 60 })
  await ngu(500)
  const X = await em.evaluate(() => { window.__do.bat = false; window.__do.nhe = false; return { cach: window.__do.cach, xl: window.__do.xl } })
  const c1 = await docCdp(), giay = (performance.now() - t0) / 1000
  const kh = tk(X.cach), xl = tk(X.xl), tong = X.cach.reduce((s, v) => s + v, 0)
  const dong = { cpu: '×' + cpu, khungMoiGiay: +(kh.n / (tong / 1000)).toFixed(1), cachKhungP95Ms: kh.p95, khungTreHon20Ms: X.cach.filter((v) => v > 20).length, soKhung: kh.n, xuLyMoiKhungMs: { trungVi: xl.trungVi, p95: xl.p95, lonNhat: xl.lonNhat }, luongChinhBanPhanTram: +((c1.TaskDuration - c0.TaskDuration) / giay * 100).toFixed(1), maPhanTram: +((c1.ScriptDuration - c0.ScriptDuration) / giay * 100).toFixed(1), boCucPhanTram: +((c1.LayoutDuration - c0.LayoutDuration) / giay * 100).toFixed(1), tinhKieuPhanTram: +((c1.RecalcStyleDuration - c0.RecalcStyleDuration) / giay * 100).toFixed(1), soLanBoCuc: c1.LayoutCount - c0.LayoutCount, soLanTinhKieu: c1.RecalcStyleCount - c0.RecalcStyleCount }
  kq.khungHinhMayEm.push(dong)
  console.log(`[${TEN}] khung hình máy em`, JSON.stringify(dong))
}
await cdpEm.send('Emulation.setCPUThrottlingRate', { rate: 1 })

// 4 · BẢNG ĐEN CUỘN + ẢNH (chỉ bản có bảng cuộn)
if (coCuon) {
  // ảnh cây bút phóng to: thầy đang viết dở một nét (bút chạm bảng) rồi lơ lửng
  const cho = []
  const gui = (type, x, y, ap, buttons) => cho.push(cdpThay.send('Input.dispatchMouseEvent', { type, x: x * K, y: y * K, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: ap }).catch(() => {}))
  const chupBut = async (ten) => {
    const p = await em.evaluate(() => new Promise((xong) => { window.__do.bat = true; requestAnimationFrame(() => requestAnimationFrame(() => { window.__do.bat = false; xong(window.__do.but) })) }))
    if (!p) return null
    const buf = await em.screenshot({ type: 'png', clip: { x: Math.max(0, p[0] - 58), y: Math.max(0, p[1] - 64), width: 130, height: 96 } })
    await luuAnh(buf, ten, 780)
    return p
  }
  gui('mousePressed', 1700, 640, 0.5, 1)
  for (let i = 1; i <= 30; i++) { gui('mouseMoved', 1700 + i * 2.4, 640 - Math.sin(i / 5) * 16, 0.5, 1); await ngu(6) }
  await Promise.all(cho); await ngu(350)
  const pCham = await chupBut('9-cay-but-dang-viet.jpg')
  gui('mouseReleased', 1772, 640, 0, 0)
  for (let i = 1; i <= 14; i++) { gui('mouseMoved', 1772 + i * 1.6, 640 - i * 2.2, 0, 0); await ngu(16) }
  await Promise.all(cho); await ngu(350)
  const pLo = await chupBut('9-cay-but-lo-lung.jpg')
  kq.cayBut = { dangVietCham: pCham ? pCham[2] : null, loLungCham: pLo ? pLo[2] : null }

  // thầy LĂN CHUỘT trên bảng đen ⇒ bảng cuộn; viết tiếp hai dòng ở phần dưới ⇒ máy em tự trôi theo
  const cuon0 = await to.locator('body').evaluate(() => window.__mcBut.cuon())
  for (let i = 0; i < 6; i++) { await cdpThay.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 1600 * K, y: 500 * K, deltaX: 0, deltaY: 60 }); await ngu(30) }
  await ngu(300)
  const cuon1 = await to.locator('body').evaluate(() => window.__mcBut.cuon())
  const emTruoc = await em.evaluate(() => { const t = document.querySelector('.lv-cuon > div'); return t ? t.style.transform : '' })
  await em.evaluate(() => { window.__do.khung = []; window.__do.bat = true })
  const moc2 = await viet([...vietDong('n = 0,2 mol', 1312, 760, 40, { rnd, vMax: 700 }), ...vietDong('CH_3COONa', 1312, 850, 40, { rnd, vMax: 700 })])
  await ngu(900)
  D = await em.evaluate(() => { window.__do.bat = false; return { khung: window.__do.khung } })
  const emSau = await em.evaluate(() => { const t = document.querySelector('.lv-cuon > div'); return t ? t.style.transform : '' })
  const net = await to.locator('body').evaluate(() => window.__mcBut.xuat().net.map((n) => [n.id.slice(0, 2), Math.max(...n.diem.map((d) => d[1]))]))
  // bước trôi của máy em: độ cuộn đổi nhiều nhất trong một khung (px CSS)
  let buocLon = 0
  for (let i = 1; i < D.khung.length; i++) buocLon = Math.max(buocLon, Math.abs(D.khung[i][5] - D.khung[i - 1][5]))
  kq.bangCuon = {
    thayLanChuot: { truoc: cuon0, sau: +cuon1.toFixed(4) }, netBang: net.filter((n) => n[0] === 'b_').length, netGiay: net.filter((n) => n[0] !== 'b_').length,
    yLonNhatCuaNet: +Math.max(...net.map((n) => n[1])).toFixed(4), mayEmTroiTheo: { truoc: emTruoc, sau: emSau, buocTroiLonNhatMoiKhungPx: +buocLon.toFixed(1) }, nhipMucKhiDaCuon: phanTich(D.khung, moc2),
  }
  console.log(`[${TEN}] bảng cuộn:`, JSON.stringify(kq.bangCuon))
  await ngu(400)
  await luuAnh(await thay.screenshot({ type: 'png' }), '9-bang-da-cuon-thay.jpg')
  await luuAnh(await em.screenshot({ type: 'png' }), '9-bang-da-cuon-may-em.jpg')
  // kéo VẠCH CUỘN ở mép phải ô bảng (bút / chuột): kéo xuống 80 px ⇒ bảng đi tiếp xuống 120 px; hoàn tác sau khi cuộn vẫn đúng nét
  const o = await to.locator('body').evaluate(() => window.__mcBut.vung().bang)
  const cuonTruocKeo = await to.locator('body').evaluate(() => window.__mcBut.cuon())
  const xk = o[2] * 1366 - 8, yk = 300
  await cdpThay.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xk, y: yk, button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen', force: 0.5 })
  for (let i = 1; i <= 8; i++) { await cdpThay.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xk, y: yk + i * 10, button: 'left', buttons: 1, pointerType: 'pen', force: 0.5 }); await ngu(16) }
  await cdpThay.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xk, y: yk + 80, button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen', force: 0 })
  await ngu(500)
  const sauKeo = await to.locator('body').evaluate(() => ({ cuon: window.__mcBut.cuon(), net: window.__mcBut.xuat().net.length }))
  const emKeo = await em.evaluate(() => { const t = document.querySelector('.lv-cuon > div'); return t ? t.style.transform : '' })
  await to.locator('body').evaluate(() => window.__mcBut.hoanTac())
  await ngu(300)
  const sauHoanTac = await to.locator('body').evaluate(() => window.__mcBut.xuat().net.length)
  kq.bangCuon.keoVachCuon = { cuonTruoc: +cuonTruocKeo.toFixed(4), cuonSau: +sauKeo.cuon.toFixed(4), doiPx: Math.round((sauKeo.cuon - cuonTruocKeo) * 768), kéoKhôngSinhNét: sauKeo.net === net.length, mayEmTheo: emKeo, hoanTacSauCuon: `${sauKeo.net} → ${sauHoanTac} nét` }
  console.log(`[${TEN}] kéo vạch cuộn:`, JSON.stringify(kq.bangCuon.keoVachCuon))
  // thầy cuộn ngược lên đầu: nét cũ còn nguyên
  await to.locator('body').evaluate(() => window.__mcBut.cuon(0))
  await ngu(300)
  await luuAnh(await thay.screenshot({ type: 'png' }), '9-bang-cuon-ve-dau-thay.jpg')
}
kq.loiTrang = loiTrang
writeFileSync(SO_DO, JSON.stringify(kq, null, 2) + '\n')
await trinh.close()
await may.dong()
console.log(loiTrang.length ? 'LỖI TRANG: ' + loiTrang.join(' | ') : 'không lỗi trang')
process.exit(loiTrang.length ? 1 : 0)
