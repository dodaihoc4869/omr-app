#!/usr/bin/env node
// KIỂM VUỐT APP HỌC SINH (12/10 — thầy: "học sinh báo app học sinh không vuốt lên được … kiểm tra thật kĩ").
//
// Mở cổng /hs THẬT (StudentPortalScreen qua Vite dev, cấu hình tối thiểu — không ghi public/sw-version.json), máy chủ GIẢ ngay trong kịch
// bản (mọi yêu cầu ra ngoài 127.0.0.1 bị chặn và trả dữ liệu mẫu; không tài khoản thật, câu chưa nộp không kèm đáp án).
// Điện thoại hasTouch + isMobile, DPR 2, mặc định 390×844 (`--man=360x800` …). VUỐT THẬT bằng sự kiện chạm CDP
// (Input.dispatchTouchEvent: start → move × 15 → end), không scrollTo để cuộn. Mỗi màn đo:
//   · khung nhìn có bị NỚI quá màn không (nội dung tràn ngang ⇒ trình duyệt nới khung nhìn, lớp `fixed` dài quá mép dưới);
//   · vuốt từ GIỮA màn tới khi hết: vùng đang nhìn cuộn được bao nhiêu px / tối đa;
//   · vuốt MỘT nhịp từ VÙNG NGÓN CÁI (cách đáy 30px — nơi có khối nút ghim / thanh mục dưới): vùng đang nhìn phải đi;
//   · trang Hôm nay ẩn phía sau lớp phủ KHÔNG được cuộn (cuộn nhầm lớp = em thấy "không vuốt được");
//   · phần tử cuối (nút Sai của ý d, phản hồi, nút cuối màn) nằm trong màn, CHẠM ĐƯỢC (elementFromPoint ở tâm trúng chính nó) và
//     không nằm dưới khối nút ghim.
//
//   node scripts/kiem-vuot-hs.mjs [--man=390x844] [--anh=<thư mục ảnh JPG ≤150KB>] [--chi=lam-cau,hom-nay,…]
// Chromium: PW_CHROMIUM hoặc /opt/pw-browsers/chromium (KHÔNG `playwright install`). Thoát mã 1 nếu có màn hỏng.
// KIEM_VUOT_GO=1 ⇒ khi một nhịp vuốt không đi, in chuỗi tổ tiên dưới ngón tay (overflow / touch-action / overscroll) để dò.
// Chromium headless: Input.synthesizeScrollGesture kiểu chạm cuộn 0 px kể cả trang đối chứng ⇒ dùng dispatchTouchEvent kéo ngón tay.
import { mkdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const GOC = resolve(import.meta.dirname, '..')
const ANH = arg('anh', '')
const CHI = arg('chi', '').split(',').filter(Boolean)
const [RONG, CAO] = arg('man', '390x844').split('x').map(Number)
if (ANH) mkdirSync(ANH, { recursive: true })

// ── Vite dev, cấu hình TỐI THIỂU: react + hằng build; `virtual:pwa-register` ⇒ hàm rỗng (không service worker) ─────────────────
const vite = await createServer({
  configFile: false, root: GOC, logLevel: 'error', clearScreen: false,
  server: { port: 0, host: '127.0.0.1', hmr: false, fs: { strict: false } },
  define: { __PHIEN_BAN__: JSON.stringify('kiem-vuot'), __SW_BUILT_AT__: 0 },
  plugins: [react(), { name: 'pwa-rong', resolveId: (id) => (id === 'virtual:pwa-register' ? '\0pwa-rong' : null), load: (id) => (id === '\0pwa-rong' ? 'export function registerSW(){return()=>{}}' : null) }],
})
await vite.listen()
const goc = `http://127.0.0.1:${vite.httpServer.address().port}`
const { NHIP_EM_LUOI } = await vite.ssrLoadModule('/scripts/chup-v2/gia/nhip-hoc-em.ts')

// ── DỮ LIỆU GIẢ ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Câu Đúng–sai 4 ý DÀI (ảnh thầy gửi 12/10: "Câu 4 trong 5 câu", Oxide cao nhất…) — cao hơn màn điện thoại.
const Y_DAI = [
  'Theo chiều tăng điện tích hạt nhân, tính base của các hydroxide trong dãy giảm dần.',
  'Theo chiều tăng điện tích hạt nhân, tính acid của các hydroxide trong dãy tăng dần.',
  'Trong dãy trên, HNO₃ là hydroxide thể hiện tính acid mạnh nhất, còn LiOH là hydroxide thể hiện tính base mạnh nhất.',
  'Be(OH)₂ là hydroxide lưỡng tính, tan được trong cả dung dịch acid mạnh và dung dịch base mạnh (ý cuối).',
]
const DE_DS = 'Xét dãy hydroxide ứng với hóa trị cao nhất của các nguyên tố chu kì 2: LiOH, Be(OH)₂, H₃BO₃, H₂CO₃, HNO₃.'
const cauDs = (qid, tenDang) => ({ qid, version: '1', group: 'g', phan: 'II', tenDang, text: DE_DS, choices: [], ideas: Y_DAI, hinhAnh: [] })
const CAU_HOC = [
  cauDs('H1', 'Oxide cao nhất, hydroxide, hợp chất với hydrogen — chọn phát biểu'),
  cauDs('H2', 'Biến đổi tính acid – base của hydroxide'),
  { qid: 'H3', version: '1', group: 'g', phan: 'I', tenDang: 'Thuỷ phân este', text: 'Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], ideas: [], hinhAnh: [] },
]
const GOI7 = { bat: true, ngay: '2026-10-12', toiThieu: 24, daLamHomNay: 0, tuLamCon: 24, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 0, dat: 0, tyLe: null },
  goi: [{ id: 'g9', ten: 'Bài 9. Ôn tập chương 2 (đề 2)', batDau: '2026-10-10', han: '2026-10-16', tong: 18, daGap: 5, con: 13, quota: 3, gapHomNay: 0, quaHan: false, canBoSung: 0, nguonDayDu: true, to: ['DH-12-C2-B9'] },
    { id: 'g8', ten: 'Bài 8. Ôn tập chương 2 (đề 1)', batDau: '2026-10-08', han: '2026-10-14', tong: 20, daGap: 12, con: 8, quota: 3, gapHomNay: 0, quaHan: false, canBoSung: 0, nguonDayDu: true, to: ['DH-12-C2-B8'] }], diemDaDo: [] }
const SANH = { ok: true, cheDo2: true, ngay: '2026-10-12', goi7: GOI7,
  hanhTrinh: { tang: 2, toiThieu: 24, daLam: 0, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 1, cauTrongChang: 6, bai: [
    { khoa: 'b1', ten: 'Este — khái niệm, danh pháp', tangMo: 3 }, { khoa: 'b2', ten: 'Thuỷ phân este', tangMo: 2 }, { khoa: 'b3', ten: 'Chất béo', tangMo: 1 }, { khoa: 'b4', ten: 'Glucose và fructose', tangMo: 1 }] },
  chienDich: { id: 'cd1', ten: 'Hành trình giỏi hoá · Khối 12' }, theLuc: { con: 24, tong: 24 }, huyetChien: false, doan: { con: 2 }, dao: { con: 16 }, khoaDao: false, loiKhoaDao: '',
  ruong: { daLam: 0, tong: 24, moDuoc: false, daMo: false, qua: null }, bia: null, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 }, chuoiNgay: 3 }
const DANG = ['Khái niệm ester', 'Thuỷ phân ester', 'Chất béo', 'Glucose', 'Saccharose', 'Tinh bột', 'Cellulose', 'Amine']
const CDL = { ok: true, chienDich: [{ id: 'cd1', ten: 'Hành trình giỏi hoá · Khối 12', hanNop: '9999-12-31', tong: 120 }],
  cau: Array.from({ length: 24 }, (_, i) => ({ qid: `C${8300 + i}`, chienDichId: 'cd1', stt: 8300 + i, phan: i % 5 === 3 ? 'II' : 'I', mucDo: 'hieu', tenDang: DANG[i % DANG.length],
    trangThai: i % 4 === 1 ? 'can_day_lai' : 'dang_on', lanCuoiDung: i % 3 !== 1, henOn: '2026-10-13', lichSu: [{ ngay: '2026-10-11', dung: i % 3 !== 1, coGoiY: false }] })) }
// Câu gốc em làm sai (màn chữa trực tiếp câu gốc): CHÍNH câu Đúng–sai dài; đã nộp nên được kèm đáp án + lời giải (đúng hợp đồng).
const CT_DS = { de: { ...cauDs('H1', 'Oxide cao nhất, hydroxide'), maDe: 'DH-12-C2-B9', mucDo: 'hieu', sao: 2, kienThuc: [] }, dapAn: 'DSSD', emTraLoi: 'DDDD',
  loiGiai: { chot: 'Trong một chu kì, theo chiều tăng điện tích hạt nhân tính base của hydroxide giảm, tính acid tăng; Be(OH)₂ lưỡng tính.' } }
const DS_CHUA = [{ dotId: 'd1', qid: 'H1', trangThai: 'thieu_hoc_lieu' }, { dotId: 'd2', qid: 'H2', trangThai: 'dang_chua_buoc' }, { dotId: 'd3', qid: 'C8301', trangThai: 'can_thay' },
  { dotId: 'd4', qid: 'C8302', trangThai: 'cho_gap_lai_2', denHan: '2026-10-13T08:00:00Z' }, { dotId: 'd5', qid: 'C8303', trangThai: 'da_tu_sua' }]
// Ca kiểm tra GIẢ: phòng chờ (`cach: 'cho'`) hoặc vào thẳng bài (`cach: 'moi'` + gói đề công khai — KHÔNG đáp án).
const DE_THI = {
  phanI: Array.from({ length: 4 }, (_, i) => ({ id: `T${i + 1}`, text: `Câu trắc nghiệm ${i + 1}: Thuỷ phân hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là`, choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'] })),
  phanII: [{ id: 'TS1', text: DE_DS, ideas: Y_DAI }, { id: 'TS2', text: DE_DS, ideas: Y_DAI }],
  phanIII: [{ id: 'TT1', text: 'Lên men 45 gam glucose với hiệu suất 80%. Thể tích khí CO₂ (đkc, lít) thu được là bao nhiêu?' }, { id: 'TT2', text: 'Đốt cháy hoàn toàn 0,1 mol ethyl acetate. Số mol CO₂ thu được là bao nhiêu?' }],
  soCau: { I: 4, II: 2, III: 2 },
}
const CA_THI = { ok: true, lanThu: 1, vaoLuc: new Date().toISOString(), hetGioLuc: new Date(Date.now() + 45 * 60_000).toISOString(), thoiGianPhut: 45, congBo: 'khong', loai: 'thi', hanNop: '', tenCa: 'Kiểm tra 45 phút · 12A1', nguongLan: 3, nguongGiay: 10, lop: '12A1', giuDeDoc: false, anHanGiay: 0 }
let cachVaoThi = 'moi'

async function mayChuGia(ctx) {
  await ctx.route((u) => !u.href.startsWith(goc), async (r) => {
    const u = new URL(r.request().url())
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors })
    if (!/workers\.dev$|may-chu|script\.google/.test(u.hostname)) return r.abort()
    const tra = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(o) })
    const d = u.pathname
    if (d.endsWith('/hoa2-sanh') || d.endsWith('/hoc-tap-sanh')) return tra(SANH)
    if (d.endsWith('/hs/nhip-hoc')) return tra(NHIP_EM_LUOI)
    if (d.endsWith('/hoc-tap-start')) return tra({ ok: true, id: 's1', questions: CAU_HOC })
    if (d.endsWith('/game-v2/answer')) return tra({ ok: true, correct: false, answer: 'DSSD', solution: { chot: 'Chốt: trong một chu kì, theo chiều tăng điện tích hạt nhân tính base giảm, tính acid tăng.' } })
    if (d.endsWith('/hoa2-cau-da-lam')) return tra(CDL)
    if (d.endsWith('/hoa2-cau-chi-tiet')) return tra({ ok: true, cau: [CT_DS] })
    if (d.endsWith('/hs/chua-cau-sai/danh-sach')) return tra({ ok: true, ds: DS_CHUA })
    if (d.endsWith('/hs/chua-cau-sai/mo-dot') || d.endsWith('/hs/chua-cau-sai/phat-item')) return tra({ ok: true, dotId: 'd1', trangThai: 'thieu_hoc_lieu', coHocLieu: false, revision: 1, tienDo: { soBuocDaQua: 0, soBuocCanKiem: 0 }, tienDoChiTiet: [], cauGoc: null, item: null })
    if (d.endsWith('/vao-thi')) return tra(cachVaoThi === 'cho' ? { ok: true, cach: 'cho', lop: '12A1', thoiGianPhut: 45, congBo: 'khong', tenCa: CA_THI.tenCa } : { ...CA_THI, cach: 'moi', deUrl: '/de/ca-gia' })
    if (d.endsWith('/de/ca-gia')) return tra(DE_THI)
    if (d.endsWith('/phong-cho')) return tra({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'cho' })
    return tra({ ok: true, items: [], ds: [] })
  })
}

// ── ĐO TRONG TRANG ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Vùng cuộn của MÀN ĐANG NHÌN: tổ tiên gần nhất (theo cây DOM) của điểm giữa màn là hộp cuộn dọc cỡ màn (cao ≥ nửa khung nhìn — lớp phủ
 *  toàn màn, kể cả khi nội dung chưa tràn); không có ⇒ trang. Ghi nhớ để đo lại sau mỗi nhịp vuốt. */
const VUNG = ([x, y]) => {
  const goc = document.scrollingElement
  const cuonDuoc = (e) => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.clientHeight >= innerHeight / 2
  let e = document.elementFromPoint(x, y)
  while (e && e !== document.body && e !== document.documentElement && !cuonDuoc(e)) e = e.parentElement
  const v = e && e !== document.body && e !== document.documentElement ? e : goc
  window.__vung = v
  const ten = v === goc ? 'trang' : v.tagName.toLowerCase() + '.' + String(v.className).trim().split(/\s+/).slice(0, 4).join('.')
  return { ten, laTrang: v === goc, top: Math.round(v.scrollTop), max: Math.round(v.scrollHeight - v.clientHeight), trang: Math.round(goc.scrollTop), iw: innerWidth, ih: innerHeight }
}
const VUNG_CU = () => { const v = window.__vung ?? document.scrollingElement; return { top: Math.round(v.scrollTop), max: Math.round(v.scrollHeight - v.clientHeight), trang: Math.round(document.scrollingElement.scrollTop) } }
/** Chỉ để DỰNG LẠI tình huống "màn vừa mở" trước nhịp vuốt ngón cái — không dùng để cuộn thay em. */
const DAT_VE_DAU = () => { if (window.__vung) window.__vung.scrollTop = 0 }
/** Phần tử cuối (bộ chọn → phần tử hiển thị CUỐI): trong màn? chạm được ở tâm? đáy có lọt dưới đỉnh khối nút ghim (nếu có)? */
const CUOI = ([chon, chonGhim]) => {
  const hien = (e) => e && (e.offsetWidth || e.offsetHeight) && getComputedStyle(e).visibility !== 'hidden'
  const e = [...document.querySelectorAll(chon)].filter(hien).pop()
  if (!e) return { co: false }
  const r = e.getBoundingClientRect()
  const x = r.left + r.width / 2, y = r.top + r.height / 2
  const t = y >= 0 && y < innerHeight ? document.elementFromPoint(x, y) : null
  // Khối nút ghim chỉ tính khi nó đang nằm TRÊN màn và cùng cột với phần tử (màn ngang: khối nút là cột phải, không che cột đề).
  const g = chonGhim ? [...document.querySelectorAll(chonGhim)].filter(hien).pop() : null
  const rg = g?.getBoundingClientRect()
  const ghim = rg && rg.top < innerHeight && rg.bottom > 0 && rg.left < r.right && rg.right > r.left ? Math.round(rg.top) : null
  const vh = visualViewport ? visualViewport.height : innerHeight
  const cham = !!t && (t === e || e.contains(t))
  return { co: true, chu: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28), tren: Math.round(r.top), duoi: Math.round(r.bottom), ghim,
    trongMan: r.top >= 0 && r.bottom <= vh + 0.5, cham, duoiGhim: ghim !== null && r.bottom > ghim + 0.5,
    che: cham || !t ? '' : t.tagName.toLowerCase() + '.' + String(t.className).trim().split(/\s+/).slice(0, 3).join('.') }
}

const trinh = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' })
async function moCong() {
  const ctx = await trinh.newContext({ viewport: { width: RONG, height: CAO }, screen: { width: RONG, height: CAO }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', serviceWorkers: 'block' })
  await ctx.addInitScript(() => { try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '12121212', token: 'tk-gia', hoTen: 'Nguyễn Khánh Ngọc', lop: '12A1', namSinh: '2008' })) } catch { /* chế độ riêng tư */ } })
  await mayChuGia(ctx)
  const p = await ctx.newPage()
  const loi = []
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  const cdp = await ctx.newCDPSession(p)
  await p.goto(goc + '/hs')
  await p.waitForSelector('.ht2-hn-nhip:not(.ht2-hn-xuong)', { timeout: 60000 }) // 12/10E: Nhịp học nay là phần dưới của thẻ "Hôm nay của em"
  await p.waitForTimeout(800)
  return { ctx, p, cdp, loi }
}
/** Vuốt LÊN một nhịp bằng ngón tay (nội dung đi lên = cuộn xuống): chạm ở (x, y), kéo lên `dy` px trong 15 bước. */
async function vuot(p, cdp, x, y, dy = 300) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
  for (let i = 1; i <= 15; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.max(1, y - (dy * i) / 15), id: 1 }] })
    await p.waitForTimeout(12)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await p.waitForTimeout(450)
}
async function cham(p, chon) {
  const l = typeof chon === 'string' ? p.locator(chon) : p.getByRole('button', { name: chon })
  await l.first().scrollIntoViewIfNeeded()
  await l.first().tap()
}
async function chup(p, ten) {
  if (!ANH) return
  for (const q of [70, 55, 40, 30]) {
    const tep = `${ANH}/${ten}.jpg`
    await p.screenshot({ path: tep, type: 'jpeg', quality: q })
    if (statSync(tep).size <= 150_000) return
  }
}

// ── KỊCH BẢN: cách mở màn + bộ chọn phần tử cuối phải chạm được + khối nút ghim (nếu có) ─────────────────────────────────────
const NUT_GHIM = '.ht2-lam .ht2-lam-day' // thanh đáy (màn làm bài 12/10D)
// 12/10E (thầy: "gộp hai phần làm một"): nút học duy nhất của thẻ Hôm nay ghi số câu — "Bắt đầu học · N câu" / "Học tiếp · N câu".
const vaoLam = async (p) => { await cham(p, /Bắt đầu học|Học tiếp|Tiếp tục học/); await p.waitForSelector('.ht2-lam .ht2-lam-than .ht2-lam-y, .ht2-lam .ht2-lam-than .ht2-lam-pa', { timeout: 20000 }); await p.waitForTimeout(600) }
const chonDs = async (p) => { for (const n of await p.locator('.ht2-lam .ht2-lam-y-nut button:first-child').all()) { await n.scrollIntoViewIfNeeded(); await n.tap() } }
const nopCau = async (p) => { await chonDs(p); await cham(p, /^Nộp câu/); await p.waitForSelector('.ht2-lam-ket', { timeout: 10000 }); await p.waitForTimeout(400) }
const tabDuoi = (i) => async (p) => { await cham(p, `.ht-menu button:nth-child(${i})`); await p.waitForTimeout(500) }
const dongTamCuaEm = async (p) => { await cham(p, '.ht2-anh'); await p.waitForSelector('.ht2-tam'); await p.waitForTimeout(400); await cham(p, '.ht2-tam [aria-label="Đóng"]'); await p.waitForTimeout(500) }
const vaoCa = async (p, cach) => {
  cachVaoThi = cach
  await cham(p, /Vào ca kiểm tra/)
  await p.waitForSelector('input[type="password"]', { timeout: 10000 })
  await p.locator('input:not([type="password"])').first().fill('123456')
  await p.locator('input[type="password"]').first().fill('matkhau-gia')
  await p.locator('input[type="password"]').first().press('Enter')
}
const KICH = [
  { ten: 'hom-nay', mo: async () => {}, cuoi: '.ht-noi-dung button, .ht-noi-dung a' },
  { ten: 'hom-nay-sau-dong-tam', mo: async (p) => { await dongTamCuaEm(p); await cham(p, /Vào ca kiểm tra/); await p.waitForTimeout(600); await p.keyboard.press('Escape'); await p.waitForTimeout(600) }, cuoi: '.ht-noi-dung button, .ht-noi-dung a' },
  { ten: 'lam-cau', mo: vaoLam, cuoi: '.ht2-lam .ht2-lam-than button', ghim: NUT_GHIM },
  { ten: 'lam-cau-sau-dong-tam', mo: async (p) => { await dongTamCuaEm(p); await vaoLam(p) }, cuoi: '.ht2-lam .ht2-lam-than button', ghim: NUT_GHIM },
  { ten: 'lam-cau-phan-hoi', mo: async (p) => { await vaoLam(p); await nopCau(p) }, cuoi: '.ht2-lam .ht2-lam-than button, .ht2-lam .ht2-lam-than .ht2-lam-y-ket', ghim: NUT_GHIM },
  { ten: 'lam-cau-chuyen-cau', mo: async (p) => { await vaoLam(p); await nopCau(p); await cham(p, /Câu tiếp theo/); await p.waitForTimeout(600) }, cuoi: '.ht2-lam .ht2-lam-than button', ghim: NUT_GHIM },
  { ten: 'lam-cau-ngan', mo: async (p) => { await vaoLam(p); for (let i = 0; i < 2; i++) { await nopCau(p); await cham(p, /Câu tiếp theo/); await p.waitForTimeout(600) } }, cuoi: '.ht2-lam .ht2-lam-than button', ghim: NUT_GHIM },
  { ten: 'hanh-trinh', mo: tabDuoi(2), cuoi: '.ht-noi-dung button, .ht-noi-dung a, .ht-noi-dung li' },
  { ten: 'on-sua', mo: tabDuoi(3), cuoi: '.ht-noi-dung button, .ht-noi-dung a' },
  { ten: 'ket-qua', mo: tabDuoi(4), cuoi: '.ht-noi-dung button, .ht-noi-dung a' },
  { ten: 'cau-da-lam', mo: async (p) => { await cham(p, /Câu đã làm/); await p.waitForTimeout(1500) }, cuoi: '.fixed.inset-0 button' },
  { ten: 'tu-chua', mo: async (p) => { await cham(p, /Tự chữa lỗi/); await p.waitForTimeout(1200) }, cuoi: '.fixed.inset-0 button' },
  { ten: 'chua-cau-goc', mo: async (p) => { await vaoLam(p); await nopCau(p); await cham(p, /Tự chữa câu này/); await p.waitForTimeout(1500) }, cuoi: '.fixed.inset-0 button' },
  // Phòng chờ: bàn chơi "Bắn nguyên tố" (cao 352px) nằm giữa màn — vuốt dọc bắt đầu TRÊN bàn chơi vẫn phải cuộn phòng chờ (kéo ngang = dời tàu).
  { ten: 'phong-cho', mo: async (p) => { await vaoCa(p, 'cho'); await p.waitForSelector('.pc-room', { timeout: 20000 }); await p.waitForTimeout(1500) }, cuoi: '.pc-room .pc-assurance' },
  { ten: 'lam-bai-kiem-tra', mo: async (p) => { await vaoCa(p, 'moi'); await p.waitForSelector('.man-lam-bai', { timeout: 25000 }); await p.waitForTimeout(1500) }, cuoi: '.man-lam-bai button' },
]

const BANG = []
let hong = 0
for (const k of KICH) {
  if (CHI.length && !CHI.includes(k.ten)) continue
  const { ctx, p, cdp, loi } = await moCong()
  let d
  try {
    await k.mo(p)
    await p.waitForTimeout(400)
    const giua = [Math.round(RONG / 2), Math.round(CAO * 0.55)]
    const dau = await p.evaluate(VUNG, giua)
    await chup(p, `vuot-${k.ten}-dau`)
    // 1) vuốt từ GIỮA màn tới khi hết cuộn
    let truoc = dau.top, sau = { top: dau.top, max: dau.max, trang: dau.trang }
    for (let nhip = 0; nhip < 40; nhip++) {
      await vuot(p, cdp, giua[0], giua[1])
      sau = await p.evaluate(VUNG_CU)
      if (sau.top === truoc) {
        if (process.env.KIEM_VUOT_GO) console.log('  [dò] dừng ở', sau.top, await p.evaluate(([x, y]) => { const ds = []; for (let e = document.elementFromPoint(x, y); e; e = e.parentElement) { const cs = getComputedStyle(e); if (/auto|scroll/.test(cs.overflowY) || /auto|scroll/.test(cs.overflowX) || cs.touchAction !== 'auto') ds.push(`${e.tagName.toLowerCase()}.${String(e.className).split(/\s+/).slice(0, 3).join('.')} oy=${cs.overflowY} ox=${cs.overflowX} ta=${cs.touchAction} ob=${cs.overscrollBehaviorY} ${e.scrollTop}/${e.scrollHeight - e.clientHeight}`) } return ds }, giua))
        break
      }
      truoc = sau.top
    }
    const c = await p.evaluate(CUOI, [k.cuoi, k.ghim ?? ''])
    await chup(p, `vuot-${k.ten}-cuoi`)
    // 2) về đầu rồi vuốt MỘT nhịp từ vùng ngón cái (đáy màn − 30px)
    await p.evaluate(DAT_VE_DAU)
    await p.waitForTimeout(250)
    const t0 = await p.evaluate(VUNG_CU)
    await vuot(p, cdp, giua[0], CAO - 30, 200)
    const t1 = await p.evaluate(VUNG_CU)
    const noi = dau.iw > RONG || dau.ih > CAO
    const trangAn = dau.laTrang ? 0 : sau.trang - dau.trang + (t1.trang - t0.trang)
    const ngonCai = t1.top - t0.top
    const chamDuoc = c.co && c.trongMan && c.cham && !c.duoiGhim
    // Vùng đã tới cuối (max đo SAU khi vuốt — nội dung nạp dần có thể đổi chiều cao) và nhịp ngón cái đi được nếu còn chỗ cuộn.
    const dat = !noi && sau.top >= sau.max - 1 && (sau.max === 0 || ngonCai > 0) && trangAn === 0 && chamDuoc
    if (!dat) hong++
    d = { ten: k.ten, dat, tu: dau.top, vung: dau.ten, px: sau.top - dau.top, max: sau.max, ngonCai, trangAn, noi: noi ? `${dau.iw}×${dau.ih}` : '',
      cuoi: c.co ? `${c.chu} [${c.tren}–${c.duoi}${c.ghim !== null ? ` · nút ghim từ ${c.ghim}` : ''}]` : 'không thấy', chamDuoc, che: c.che ?? '', loi: loi.join(' | ') }
  } catch (e) {
    hong++
    d = { ten: k.ten, dat: false, tu: 0, vung: '', px: 0, max: 0, ngonCai: 0, trangAn: 0, noi: '', cuoi: 'LỖI KỊCH BẢN: ' + String(e.message).split('\n')[0].slice(0, 140), chamDuoc: false, che: '', loi: loi.join(' | ') }
    await chup(p, `vuot-${k.ten}-loi`).catch(() => {})
  }
  BANG.push(d)
  await ctx.close()
}

console.log(`\nKIỂM VUỐT APP HỌC SINH · ${RONG}×${CAO} · chạm CDP`)
console.log('màn · cuộn được (px) · phần tử cuối chạm được')
for (const d of BANG) {
  console.log(`${d.dat ? 'ĐẠT ' : 'HỎNG'} ${d.ten} · ${d.px}/${d.max} px (từ ${d.tu}) (vuốt ngón cái +${d.ngonCai}) · ${d.chamDuoc ? 'có' : 'KHÔNG'} — ${d.cuoi}`)
  const ghi = [d.vung && `vùng cuộn: ${d.vung}`, d.trangAn && `TRANG ẨN SAU LỚP PHỦ BỊ CUỘN ${d.trangAn}px`, d.noi && `KHUNG NHÌN BỊ NỚI ${d.noi}`, d.che && `bị che bởi ${d.che}`, d.loi && `lỗi trang: ${d.loi}`].filter(Boolean)
  if (ghi.length) console.log('      ' + ghi.join(' · '))
}
console.log(`\n${BANG.length - hong}/${BANG.length} màn đạt.`)
await trinh.close()
await vite.close()
process.exit(hong ? 1 : 0)
