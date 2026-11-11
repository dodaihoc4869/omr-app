#!/usr/bin/env node
// BỘ THỬ «CHUYỂN CÂU KHI MÁY EM ĐANG NGANG Ở LIVE» (thầy 11/11 tối: «khi chuyển câu thì máy hs đang ở màn hình ngang live thì câu hiện luôn theo kiểu xoay
// ngang không về dạng dọc nữa nhé»). Chromium THẬT: trang thầy (tờ chiếu thật) + năm máy em qua phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-ngang-chuyen-cau-1111.mjs <thư mục tạm> [tiền tố ảnh = sau] [thư mục ảnh = docs/ban-ve-live-1011]
// Máy em:
//   A  844 × 390 — trang NGANG thật (máy tự xoay theo cảm biến).
//   B  Android KHOÁ XOAY hệ thống (cầm ngang chỉ nhờ app khoá hướng): trang 360 × 740; `screen.orientation.lock('landscape')` (sau khi toàn màn hình) ⇒ bộ
//      thử đổi khung nhìn sang 740 × 360; `unlock()` ⇒ về 360 × 740 — ĐÚNG như máy thật có khoá xoay hệ thống bật.
//   C  iPhone KHOÁ XOAY (không có toàn màn hình, không khoá hướng được): trang 390 × 844; bảng live xoay HÌNH 90° bằng CSS ⇒ em xoay máy ngang để xem.
//   D  máy DỌC 390 × 844 chưa từng vào bảng (chưa gửi câu 1) ⇒ câu mới vẫn DỌC như cũ.
//   E  iPhone TỰ XOAY: trang 390 × 844 ⇒ vào bảng (xoay CSS) ⇒ em xoay máy (trang thành 844 × 390) ⇒ câu mới ngang tự nhiên ⇒ em xoay lại dọc ⇒ câu dọc.
// Ba trường hợp: (1) chuyển câu khi đang xem bảng live · (2) chuyển câu rồi thầy «lên bảng» (ép vào live) · (3) em gửi xong quay về live.
// Đo «nháy dọc»: mỗi khung hình (rAF) ghi lần nào màn câu hỏi hiện mà HÌNH đang dọc (trang dọc và gốc màn không xoay) — từ lúc em đã ở bảng ngang.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const TIEN_TO = process.argv[3] ?? 'sau'
const ANH = resolve(process.argv[4] ?? join(GOC, 'docs/ban-ve-live-1011'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function chup(t, ten) {
  let q = 84, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1000 && q > 30)
  writeFileSync(join(ANH, `ngang-chuyen-cau-${TIEN_TO}-${ten}.jpg`), buf)
  console.log(`  ảnh ngang-chuyen-cau-${TIEN_TO}-${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}
const CAU = [
  { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  { qid: 'Q2', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Phenol (C₆H₅OH) tác dụng được với dung dịch nào sau đây?', choices: ['NaCl', 'NaOH', 'HCl', 'NaHCO₃'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  // 11/11 (bố cục ngang «một bên đề một bên chọn đáp án»): đúng–sai + trả lời ngắn để đo phần chọn đáp án trọn khung trên máy xoay hình / Android 740
  { qid: 'Q3', maDe: 'm', version: '1', group: 'g', phan: 'II', text: 'Cho các phát biểu sau về phenol (C₆H₅OH) và ethanol (C₂H₅OH) ở điều kiện thường.', choices: [], ideas: ['Phenol tác dụng được với dung dịch NaOH, còn ethanol thì không.', 'Cả hai chất đều tác dụng với kim loại Na giải phóng khí H₂.', 'Phenol làm quỳ tím ẩm chuyển sang màu đỏ rõ rệt.', 'Dung dịch phenol tạo kết tủa trắng với nước bromine.'], hinhAnh: [], dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  { qid: 'Q4', maDe: 'm', version: '1', group: 'g', phan: 'III', soO: 4, text: 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam? (Làm tròn đến hàng phần trăm.)', choices: [], ideas: [], hinhAnh: [], dang: null, tenDang: 'Aniline', mucDo: 'van_dung', sao: 3, kienThuc: [] },
]

/** kieu: 'that' (trang thật như khung nhìn) · 'android-khoa' (khoá hướng đổi khung nhìn) · 'iphone' (không toàn màn hình, không khoá hướng). */
async function trangEm(sbd, w, h, kieu) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message}`))
  const xoayTay = { soLan: 0 }
  if (kieu === 'android-khoa') {
    // Máy thật: khoá ngang ⇒ màn quay ngang (khung nhìn đổi trục); nhả ⇒ quay về hướng mặc định của máy = DỌC (khoá xoay hệ thống đang bật).
    await ctx.exposeBinding('__xoayMay', async ({ page }, huong) => {
      const s = page.viewportSize(), ngang = huong === 'ngang'
      if ((s.width > s.height) === ngang) return
      xoayTay.soLan += 1
      await page.setViewportSize(ngang ? { width: Math.max(w, h), height: Math.min(w, h) } : { width: Math.min(w, h), height: Math.max(w, h) })
    })
  }
  await t.addInitScript((kieu) => {
    const M = (window.__nc = { khung: 0, docKhiCau: 0, daNgang: false, lanKhoa: 0, lanNha: 0, nhat: [] })
    const o = screen.orientation
    if (kieu === 'android-khoa') {
      // Chromium máy tính không cho khoá hướng ⇒ giả đúng hành vi Android: chỉ khoá được khi đang toàn màn hình.
      const loai = () => (innerWidth > innerHeight ? 'landscape-primary' : 'portrait-primary')
      try { Object.defineProperty(o, 'type', { configurable: true, get: loai }) } catch { /* bỏ qua */ }
      const bao = () => setTimeout(() => window.dispatchEvent(new Event('orientationchange')), 0)
      o.lock = (huong) => {
        if (!document.fullscreenElement) return Promise.reject(new DOMException('chưa toàn màn hình', 'SecurityError'))
        M.lanKhoa += 1
        return window.__xoayMay(String(huong).startsWith('landscape') ? 'ngang' : 'doc').then(bao)
      }
      o.unlock = () => { M.lanNha += 1; void window.__xoayMay('doc').then(bao) }
    } else if (kieu === 'iphone') {
      // iPhone: không có toàn màn hình cho trang, không khoá hướng.
      try { Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: undefined }) } catch { /* bỏ qua */ }
      try { o.lock = undefined } catch { /* bỏ qua */ }
    }
    // Mỗi khung hình: màn câu hỏi đang hiện (không có bảng live) mà HÌNH đang dọc ⇒ đếm (chỉ sau khi em đã từng ở bảng ngang).
    const hinhNgang = () => {
      const g = document.querySelector('.bpu-hs')
      if (!g) return innerWidth > innerHeight
      const r = g.getBoundingClientRect()
      const xoay = /matrix\(\s*0?\.?0*(e-\d+)?\s*,\s*1\s*,\s*-1/.test(getComputedStyle(g).transform) || g.hasAttribute('data-xoay')
      return xoay ? r.height > r.width : r.width > r.height
    }
    const buoc = () => {
      M.khung += 1
      const lv = document.querySelector('.lv')
      if (lv) M.daNgang = true
      else if (M.daNgang && document.querySelector('.bpu-hs .bpu-tra, .bpu-hs .bpu-hs-giua') && !hinhNgang()) { M.docKhiCau += 1; if (M.nhat.length < 6) M.nhat.push(`${innerWidth}×${innerHeight}`) }
      requestAnimationFrame(buoc)
    }
    requestAnimationFrame(buoc)
  }, kieu)
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}`)
  await t.locator('.bpu-hs').waitFor({ timeout: 20000 })
  return { t, ctx, sbd, kieu, xoayTay }
}
async function emChon(t) {
  await t.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await t.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
}
async function emGui(t) {
  await emChon(t)
  await t.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
  await t.locator('.lv').waitFor({ timeout: 6000 })
}
/** Trạng thái màn của máy em, hộp bao theo TRỤC CỦA HÌNH (gốc màn xoay 90° ⇒ đổi trục như bộ thử «lên bảng»). */
const trang = (t) => t.evaluate(() => {
  const g = document.querySelector('.bpu-hs'), lv = document.querySelector('.lv'), W = innerWidth
  const tf = g ? getComputedStyle(g).transform : 'none'
  const gXoay = !!g && (g.hasAttribute('data-xoay') || /^matrix\(\s*[-0-9.e]+\s*,\s*1\s*,\s*-1/.test(tf))
  const xoay = lv ? lv.hasAttribute('data-xoay') : gXoay
  const hop = (k) => { const e = document.querySelector(k); if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width && !r.height) return null; return (gXoay ? [r.top, W - r.right, r.bottom, W - r.left] : [r.left, r.top, r.right, r.bottom]).map((v) => Math.round(v)) }
  const gr = g?.getBoundingClientRect()
  const hinhW = gXoay ? gr?.height ?? 0 : gr?.width ?? 0, hinhH = gXoay ? gr?.width ?? 0 : gr?.height ?? 0
  const de = hop('.bpu-hs-than > .bpu-de-chang') ?? hop('.bpu-hs-than .ht2-lam-de, .bpu-hs-than .de-cau'), tra = hop('.bpu-hs-than > .bpu-tra'), gui = hop('.bpu-gui-noi[data-hien="true"]'), nam = hop('.lv-dau .lv-nam')
  const tran = g ? [...g.querySelectorAll('.bpu-hs-than, .bpu-hs-tren')].some((e) => e.scrollWidth > e.clientWidth + 1) : false
  return {
    vp: `${innerWidth}×${innerHeight}`, man: lv ? 'bang' : document.querySelector('.bpu-tra') ? 'cau' : document.querySelector('.bpu-che') ? 'che' : 'khac',
    lvXoay: !!lv && lv.hasAttribute('data-xoay'), gXoay, xoay, hinh: [Math.round(hinhW), Math.round(hinhH)], ngang: hinhW > hinhH,
    haiCot: !!de && !!tra && tra[0] >= de[2] - 1 && tra[1] < de[3], de, tra, gui, nam, tran,
    toanMan: !!document.fullscreenElement, nc: window.__nc,
  }
})
const datLaiNc = (t) => t.evaluate(() => { window.__nc.docKhiCau = 0; window.__nc.nhat = [] })
const ghiChu = (s) => `${s.vp} · hình ${s.hinh.join('×')}${s.gXoay ? ' (gốc xoay CSS)' : ''}${s.lvXoay ? ' (bảng xoay CSS)' : ''}`

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
await may.moLuot(CAU[0], 'B')

// ───────────── MÁY EM ─────────────
const A = await trangEm('S1', 844, 390, 'that'), B = await trangEm('S2', 360, 740, 'android-khoa'), C = await trangEm('S3', 390, 844, 'iphone')
const D = await trangEm('S4', 390, 844, 'iphone'), E = await trangEm('S5', 390, 844, 'iphone')
const MAY = { A, B, C, D, E }
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(500)
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await thay.mouse.click(600, 300); await ngu(500)

// D: câu 1 đang làm (dọc, chưa vào bảng) — màn trước khi thầy chuyển câu
const d0 = await trang(D.t)
kiem(`D (dọc, chưa gửi): màn câu hỏi DỌC như cũ — ${ghiChu(d0)}`, d0.man === 'cau' && !d0.ngang && !d0.gXoay)
// A, B, C, E gửi câu 1 ⇒ tự về bảng live (ngang)
for (const m of [A, B, C, E]) await emGui(m.t)
await ngu(1200)
// E: em xoay máy ngang (máy tự xoay) ⇒ bảng hết xoay CSS
await E.t.setViewportSize({ width: 844, height: 390 }); await E.t.evaluate(() => window.dispatchEvent(new Event('orientationchange'))); await ngu(900)
const b0 = { A: await trang(A.t), B: await trang(B.t), C: await trang(C.t), E: await trang(E.t) }
kiem(`TRƯỚC · A ở bảng live ngang — ${ghiChu(b0.A)}`, b0.A.man === 'bang' && !b0.A.lvXoay)
kiem(`TRƯỚC · B (Android khoá xoay) vào toàn màn hình + khoá ngang ⇒ bảng ngang — ${ghiChu(b0.B)} · toàn màn ${b0.B.toanMan} · khoá ${b0.B.nc.lanKhoa}`, b0.B.man === 'bang' && b0.B.toanMan && b0.B.vp === '740×360' && !b0.B.lvXoay)
kiem(`TRƯỚC · C (iPhone khoá xoay) ở bảng live xoay CSS — ${ghiChu(b0.C)}`, b0.C.man === 'bang' && b0.C.lvXoay)
kiem(`TRƯỚC · E (iPhone tự xoay) đã xoay máy ngang ⇒ bảng ngang tự nhiên — ${ghiChu(b0.E)}`, b0.E.man === 'bang' && !b0.E.lvXoay && b0.E.vp === '844×390')
await chup(A.t, 'bang-844'); await chup(B.t, 'bang-android-740'); await chup(C.t, 'bang-iphone-xoay-390')
for (const m of Object.values(MAY)) await datLaiNc(m.t)

/** Kiểm một máy đang ở màn câu hỏi NGANG: hình ngang, hai cột (đề trái · phần trả lời phải), nút gửi + tay nắm ở mép phải hình, không tràn ngang. */
function kiemCauNgang(nhan, ten, s, them = '') {
  const dat = s.man === 'cau' && s.ngang && s.haiCot && !s.tran && (!s.gui || s.gui[2] <= s.hinh[0] + 1) && (!s.nam || s.nam[2] <= s.hinh[0] + 1)
  kiem(`${nhan} · ${ten}: câu mới hiện NGANG (hai cột, nút «Gửi» + tay nắm mép phải hình) — ${ghiChu(s)}${them}`, dat, `đề ${JSON.stringify(s.de)} · trả lời ${JSON.stringify(s.tra)} · gửi ${JSON.stringify(s.gui)} · tay nắm ${JSON.stringify(s.nam)}`)
}

// ───────────── (1) THẦY CHUYỂN CÂU khi em đang xem bảng live ─────────────
await may.moLuot(CAU[1], 'B')
for (const m of [A, B, C, E]) await m.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
await ngu(1300) // đủ lâu để máy B kịp quay (nếu bị nhả khoá)
const c1 = { A: await trang(A.t), B: await trang(B.t), C: await trang(C.t), D: await trang(D.t), E: await trang(E.t) }
for (const k of ['A', 'B', 'C', 'E']) kiemCauNgang('(1) CHUYỂN CÂU', k, c1[k], ` · khung dọc ${c1[k].nc.docKhiCau}`)
for (const k of ['A', 'B', 'C', 'E']) kiem(`(1) KHÔNG NHÁY DỌC · ${k}: không khung hình nào hiện câu theo hình dọc`, c1[k].nc.docKhiCau === 0, `${c1[k].nc.docKhiCau} khung ${JSON.stringify(c1[k].nc.nhat)}`)
kiem(`(1) B · không nhả khoá ngang giữa chừng (nhả ${c1.B.nc.lanNha} lần, máy quay ${B.xoayTay.soLan} lần từ đầu)`, c1.B.nc.lanNha === 0 && c1.B.vp === '740×360')
kiem(`(1) D (dọc, chưa từng vào bảng): câu mới vẫn DỌC như cũ, gốc màn không xoay — ${ghiChu(c1.D)}`, c1.D.man === 'cau' && !c1.D.ngang && !c1.D.gXoay)
await chup(A.t, 'cau-moi-844'); await chup(B.t, 'cau-moi-android-740'); await chup(C.t, 'cau-moi-iphone-xoay-390'); await chup(D.t, 'cau-moi-doc-390')

// ───────────── (2) chuyển câu rồi THẦY GỌI LÊN BẢNG (ép cả lớp vào live) ─────────────
await emChon(B.t) // em B chọn dở, chưa gửi
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S4', lyDo: ['Chưa lên bảng buổi này'] })))
for (const m of [A, B, C, E]) await m.t.locator('.lv').waitFor({ timeout: 6000 })
await ngu(1300)
const c2 = { A: await trang(A.t), B: await trang(B.t), C: await trang(C.t), E: await trang(E.t) }
kiem(`(2) LÊN BẢNG · B ép vào bảng: vẫn ngang, không quay — ${ghiChu(c2.B)}`, c2.B.man === 'bang' && c2.B.vp === '740×360' && !c2.B.lvXoay && c2.B.nc.lanNha === 0)
kiem(`(2) LÊN BẢNG · C ép vào bảng: bảng xoay CSS như trước — ${ghiChu(c2.C)}`, c2.C.man === 'bang' && c2.C.lvXoay)
kiem(`(2) LÊN BẢNG · A, E ép vào bảng ngang — ${ghiChu(c2.A)} · ${ghiChu(c2.E)}`, c2.A.man === 'bang' && c2.E.man === 'bang' && !c2.A.lvXoay && !c2.E.lvXoay)
await chup(B.t, 'len-bang-android-740')
// thầy chuyển câu lần nữa (lượt mới) ⇒ cả lớp về câu mới — vẫn ngang
for (const m of Object.values(MAY)) await datLaiNc(m.t)
await may.moLuot(CAU[0], 'B')
for (const m of [A, B, C, E]) await m.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
await ngu(1300)
const c2b = { A: await trang(A.t), B: await trang(B.t), C: await trang(C.t), E: await trang(E.t) }
for (const k of ['A', 'B', 'C', 'E']) kiemCauNgang('(2) SAU LÊN BẢNG, CÂU MỚI', k, c2b[k], ` · khung dọc ${c2b[k].nc.docKhiCau}`)

// ───────────── (3) EM GỬI XONG ⇒ quay về live ─────────────
for (const m of [A, B, C]) await emGui(m.t)
await ngu(1300)
const c3 = { A: await trang(A.t), B: await trang(B.t), C: await trang(C.t) }
kiem(`(3) GỬI XONG · A, B, C về bảng live ngang (B không quay, C xoay CSS) — ${ghiChu(c3.B)}`, c3.A.man === 'bang' && c3.B.man === 'bang' && c3.C.man === 'bang' && c3.B.vp === '740×360' && c3.C.lvXoay && !c3.A.lvXoay)
kiem(`(3) B · suốt ba trường hợp không nhả khoá ngang (nhả ${c3.B.nc.lanNha} lần)`, c3.B.nc.lanNha === 0)

// ───────────── (4) BỐ CỤC NGANG «một bên đề một bên chọn đáp án» (thầy 11/11 tối): ba dạng câu trên A (ngang thật 844), B (Android 740), C (iPhone xoay hình) ─────────────
/** Phần chọn đáp án theo TRỤC CỦA HÌNH: mọi nút trọn trong hình + chạm được (điểm giữa không bị che / cắt), ≥ 44 px; trang / thân / cột trả lời không cuộn;
 *  tay nắm «Thầy đang live» không đè đầu màn / nút trả lời. */
const doTra = (t) => t.evaluate(() => {
  const g = document.querySelector('.bpu-hs'), W = innerWidth
  if (!g) return null
  const gXoay = g.hasAttribute('data-xoay')
  const gr = g.getBoundingClientRect(), HW = gXoay ? gr.height : gr.width, HH = gXoay ? gr.width : gr.height
  const hop = (e) => { const r = e.getBoundingClientRect(); return gXoay ? [r.top, W - r.right, r.bottom, W - r.left] : [r.left, r.top, r.right, r.bottom] }
  const cat = (a, b) => a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1
  const cuon = (e) => !!e && e.scrollHeight > e.clientHeight + 1 && !/hidden|clip/.test(getComputedStyle(e).overflowY)
  const tra = document.querySelector('.bpu-tra'), than = document.querySelector('.bpu-hs-than')
  const nut = tra ? [...tra.querySelectorAll('button, [role=radio], .ht2-lam-o-hang')].filter((e) => e.getBoundingClientRect().width > 0) : []
  const ngoai = nut.filter((e) => {
    const b = hop(e)
    if (b[0] < -0.5 || b[1] < -0.5 || b[2] > HW + 0.5 || b[3] > HH + 0.5) return true
    const r = e.getBoundingClientRect(), o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !o || !(o === e || e.contains(o) || o.contains(e))
  }).length
  const nho = nut.filter((e) => !e.matches('.ht2-lam-o-hang') && (e.getBoundingClientRect().width < 43.5 || e.getBoundingClientRect().height < 43.5)).length
  const nam = document.querySelector('.lv-phu .lv-nam'), tren = document.querySelector('.bpu-hs-tren')
  const namDe = nam ? nut.filter((e) => cat(hop(e), hop(nam))).length + (tren && cat(hop(nam), hop(tren)) ? 1 : 0) : 0
  return {
    hinh: [Math.round(HW), Math.round(HH)], gXoay, soNut: nut.length, ngoai, nho, namDe, phieu: !!document.querySelector('.bpu-hs-than[data-gon]'),
    cuon: document.scrollingElement.scrollHeight > innerHeight + 1 || cuon(g) || cuon(than) || cuon(tra),
    hop: nut.map((e) => hop(e).map((v) => Math.round(v))), dau: tren ? Math.round(hop(tren)[3] - hop(tren)[1]) : 0,
  }
})
for (const [ten, cau, dung] of [['đúng–sai', CAU[2], 'DSDS'], ['trả lời ngắn', CAU[3], '6,48'], ['trắc nghiệm', CAU[1], 'B']]) {
  await may.moLuot(cau, dung)
  for (const m of [A, B, C]) await m.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
  await ngu(1500) // phông + mảnh chặng + đo kiểu phiếu
  const d = { A: await doTra(A.t), B: await doTra(B.t), C: await doTra(C.t) }
  for (const k of ['A', 'B', 'C']) {
    const x = d[k]
    kiem(`(4) NGANG · ${ten} · ${k} (hình ${x.hinh.join('×')}${x.gXoay ? ', xoay CSS' : ''}): ${x.soNut} nút trả lời trọn khung, chạm được, ≥ 44 px; không cuộn; tay nắm không đè`,
      x.soNut > 0 && !x.ngoai && !x.nho && !x.cuon && !x.namDe, `ngoài ${x.ngoai} · nhỏ ${x.nho} · cuộn ${x.cuon} · tay nắm đè ${x.namDe} · phiếu ${x.phieu} · đầu ${x.dau}px`)
  }
  // ngang THẬT 844 × 390 (A) và XOAY HÌNH 844 × 390 (C) phải ra cùng một bố cục (luật sinh đôi `data-ngang` / `data-thap`)
  const lech = d.A.hop.length !== d.C.hop.length ? 99 : Math.max(0, ...d.A.hop.flatMap((h, i) => h.map((v, j) => Math.abs(v - d.C.hop[i][j]))))
  kiem(`(4) ${ten} · ngang thật (A) ≡ xoay hình (C): nút trả lời lệch tối đa ${lech} px`, lech <= 1)
  if (ten !== 'trắc nghiệm') { await chup(B.t, `bo-cuc-${ten === 'đúng–sai' ? 'dung-sai' : 'tra-loi-ngan'}-android-740`); await chup(C.t, `bo-cuc-${ten === 'đúng–sai' ? 'dung-sai' : 'tra-loi-ngan'}-iphone-xoay-390`) }
}

// ───────────── E: đang làm câu ngang thì em XOAY LẠI DỌC (máy tự xoay) ⇒ câu dọc như cũ ─────────────
await E.t.setViewportSize({ width: 390, height: 844 }); await E.t.evaluate(() => window.dispatchEvent(new Event('orientationchange'))); await ngu(900)
const e4 = await trang(E.t)
kiem(`E · em xoay máy về DỌC lúc đang làm câu ⇒ câu DỌC như cũ, gốc màn không xoay — ${ghiChu(e4)}`, e4.man === 'cau' && !e4.ngang && !e4.gXoay)

// ───────────── HẾT LIVE ⇒ nhả khoá ngang, câu về như thường ─────────────
await D.t.locator('.lv').count() // D đang ở câu
await to.locator('.mc-lv-cum').click()
await to.locator('.mc-lv-the [data-lv="tat"]').waitFor({ state: 'visible', timeout: 6000 })
await to.locator('.mc-lv-the [data-lv="tat"]').click()
for (const m of [A, B, C]) await m.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
await ngu(1300)
const h = { B: await trang(B.t), C: await trang(C.t) }
kiem(`HẾT LIVE · B nhả khoá ngang (về hướng của máy) — ${ghiChu(h.B)} · nhả ${h.B.nc.lanNha} lần`, h.B.nc.lanNha >= 1 && h.B.vp === '360×740')
kiem(`HẾT LIVE · C: gốc màn không còn xoay CSS — ${ghiChu(h.C)}`, !h.C.gXoay)

// Khoá / nhả / xoay hình KHÔNG được làm bộ bắt rời màn báo nhầm (rời màn = −50 kJ em, −50 kJ đội): phòng không ghi lần rời nào, không em nào «đang rời».
const st = may.trangThai(), roi = st.ds.filter((e) => ['S1', 'S2', 'S3', 'S4', 'S5'].includes(e.sbd)).map((e) => `${e.sbd}:${e.roi}`)
kiem(`RỜI MÀN · suốt kịch bản (vào bảng, khoá ngang, xoay hình, chuyển câu, lên bảng, gửi, hết live) phòng không ghi lần rời nào — ${roi.join(' ')}`, st.ds.every((e) => !e.roi) && !(st.roiNay ?? []).length, JSON.stringify(st.roiNay ?? []))
kiem('Không lỗi JavaScript trên các trang', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))
const hong = ket.filter((k) => !k.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt`)
await trinh.close(); await may.dong()
process.exit(hong.length ? 1 : 0)
