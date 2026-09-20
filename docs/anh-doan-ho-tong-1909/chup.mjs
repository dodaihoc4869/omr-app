// Chụp 6 màn Đoàn Hộ Tống ở 390×844 (sáng) bằng dữ liệu GIẢ — không gọi máy chủ thật, không cần mật khẩu.
// Chạy từ gốc kho: node docs/anh-doan-ho-tong-1909/chup.mjs  (tự dựng máy chủ Vite tạm ở cổng 5188 rồi tắt)
// Đồng thời ĐO: màn trận và màn trùm không cuộn ở 360×740 và 390×844; màn tung chưởng tự tắt ≤ 3 giây, chạm là tắt; giảm chuyển động → không còn animation.
import { createServer } from 'vite'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const OUT = 'docs/anh-doan-ho-tong-1909', CONG = 5188
const server = await createServer({ server: { port: CONG, strictPort: true, host: '127.0.0.1' }, logLevel: 'error' })
await server.listen()
const base = `http://127.0.0.1:${CONG}`
const browser = await chromium.launch({ headless: true })

const profile = { pet: 'lua_phuong', choice: false, cap: 32, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, nickname: '' }
const ghe3 = (tt = ['dang_lam', 'da_chot', 'dang_lam']) => [
  { ghe: 0, ten: 'Minh', pet: 2, cap: 32, laMay: false, roi: false, laEm: true, trangThai: tt[0], tinHieu: null },
  { ghe: 1, ten: 'Thu Hà', pet: 1, cap: 30, laMay: false, roi: false, laEm: false, trangThai: tt[1], tinHieu: null },
  { ghe: 2, ten: 'Nam', pet: 3, cap: 12, laMay: false, roi: false, laEm: false, trangThai: tt[2], tinHieu: null },
]
const tran = (o = {}) => ({ tenChang: 'Vượt Đầm Bùn Acid', hiep: 3, soHiep: 8, laTrum: false, ketThuc: false, thang: null, linhTam: { hp: 80, toiDa: 100 }, quai: [{ ma: 5, loai: 'bun_acid', hp: 9 }, { ma: 6, loai: 'bun_acid', hp: 24 }], trumVoGiap: [],
  nangLuong: 2, daNhanTiepSuc: 0, giay: 40, moSauMs: 0, conMs: 27000, tenQuai: ['Bùn Acid', 'Khói Oxi Hoá'], loaiQuai: ['bun_acid', 'khoi_oxi_hoa'], tenTrum: ['Chúa tể Kết Tủa', 'Bá chủ Ăn Mòn'], loaiTrum: ['chua_te_ket_tua', 'ba_chu_an_mon'], ...o })
const cauEster = { qid: 'Q1', maDe: 'DEMO', version: 'v', group: 'g', phan: 'I', text: 'Thuỷ phân ethyl acetate trong dung dịch NaOH dư, đun nóng, thu được sản phẩm hữu cơ gồm', choices: ['CH3COOH, C2H5OH', 'CH3COONa, C2H5OH', 'CH3COONa, CH3OH', 'HCOONa, C2H5OH'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Ester', mucDo: 'hieu', sao: 2, kienThuc: [] }
const cauTrum = { qid: 'T1', maDe: 'DEMO', version: 'v', group: 'gt', phan: 'II', text: 'Cho ester X có công thức CH3COOC2H5. Mỗi bạn giữ một ý — cứ bàn với nhau:', choices: [], ideas: ['X có tên là ethyl acetate.', 'Thuỷ phân X trong NaOH thu được muối và ancol.', 'X tan tốt trong nước hơn ethanol.', 'Đốt cháy X thu được số mol CO2 bằng số mol H2O.'], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Ester', mucDo: 'hieu', sao: 1, kienThuc: [] }
const gheKq = (o) => ({ ghe: 0, nop: true, dung: true, tuLam: true, hanhDong: 'ky_nang', tenChieu: 'Liệt Diễm Xuyên Giáp', satThuong: 60, heSo: { dung: 1.5, lienKich: 2, anThach: 1.25 }, lienKich: true, chan: 0, hoi: 0, lan: 6, haGuc: 2, giup: 1, giupThanhCong: true, duocGiupBoi: null, nangLuongSau: 2, yGiu: [], yDung: [], ...o })
const hiepVuaXong = { hiep: 3, laTrum: false, tongSatThuong: 114, tongChan: 8, quaiHaGuc: 3, quaiConLai: 1, linhTamMat: 0, linhTamHoi: 0, linhTamSau: 80, trum: null, cuaEm: gheKq({}),
  ban: [{ ghe: 1, ra: 'don', tenChieu: 'Thuỷ Long Pháo', satThuong: 48, haGuc: 1, lienKich: true }, { ghe: 2, ra: 'chan', tenChieu: '', satThuong: 0, haGuc: 0, lienKich: false }] }
const MAN = {
  '1-sanh': null,
  '1b-phong-cho': { ma: 'DH7A2C', revision: 1, laChu: true, batDau: false, ghe: ghe3(['cho', 'cho', 'cho']), gioMayChu: 0 },
  '2-trong-tran': { ma: 'DH1', revision: 9, laChu: true, batDau: true, ghe: ghe3(), gioMayChu: 0, tran: tran(), cau: { qid: 'Q1', nhan: 'toi_han_on', de: cauEster } },
  '3-tiep-suc': { ma: 'DH1', revision: 10, laChu: true, batDau: true, ghe: ghe3(['da_chot', 'can_tiep_suc', 'dang_lam']), gioMayChu: 0, tran: tran({ conMs: 18000 }),
    cau: { qid: 'Q1', nhan: 'toi_han_on', de: cauEster, daChot: true, hanhDong: 'danh', ketQua: { correct: true, answer: 'B', solution: 'Ester thuỷ phân trong kiềm cho muối và ancol.' } }, tiepSuc: { conLuotNhan: 2, daXin: false, theNhan: null, banCan: [1], daGiup: false, lienKichSanSang: false } },
  '4-tung-chuong': { ma: 'DH1', revision: 12, laChu: true, batDau: true, ghe: ghe3(['cho', 'cho', 'cho']), gioMayChu: 0, tran: tran({ hiep: 4, laTrum: true, moSauMs: 6000, conMs: 60000, giay: 60, quai: [{ ma: 6, loai: 'bun_acid', hp: 18 }] }), hiepVuaXong },
  '5-trum-cau-chung': { ma: 'DH1', revision: 14, laChu: true, batDau: true, gioMayChu: 0, tran: tran({ hiep: 4, laTrum: true, giay: 60, conMs: 52000, quai: [] }),
    ghe: [...ghe3(['dang_lam', 'da_chot', 'dang_lam']), { ghe: 3, ten: 'Lan', pet: 0, cap: 20, laMay: false, roi: false, laEm: false, trangThai: 'da_chot', tinHieu: 'chac_y' }],
    trum: { coCau: true, giaoY: [1, 0, 2, 3], yCuaEm: [1], yDaChot: [true, false, false, true], qid: 'T1', tenDang: 'Ester', de: cauTrum } },
  '6-ket-chang': { ma: 'DH1', revision: 30, laChu: true, batDau: true, ghe: ghe3(['cho', 'cho', 'cho']), gioMayChu: 0, tran: tran({ hiep: 8, laTrum: true, ketThuc: true, thang: true, quai: [], trumVoGiap: [true, true], linhTam: { hp: 84, toiDa: 100 } }),
    ketChang: { thang: true, sao: 3, linhTam: { hp: 84, toiDa: 100 }, trumVoGiap: [true, true], quaiHaGuc: 17, soLienKich: 1,
      cuaEm: { ghe: 0, id: 'x', laMay: false, soCau: 6, soDung: 5, soTuLamDung: 5, satThuong: 168, chan: 8, haGuc: 6, soLanGiup: 1, soLanGiupThanhCong: 1, soLanDuocGiup: 0, soLienKich: 1 },
      tienBo: { soCau: 6, tuLamDung: 5, lenBac: 2, giup: 1, giupThanhCong: 1, duocGiup: 0 }, doanLop: { tramTruoc: 17, tramSau: 18, tongTram: 30, banThu: 10, siSo: 32, conTramToiMoc: 2, tenMocKe: 'Hồ Cân Bằng', trumLop: null }, ban: [{ ghe: 1, laMay: false, soLanGiupThanhCong: 0 }, { ghe: 2, laMay: false, soLanGiupThanhCong: 0 }] } },
}

async function moMan(ten, { width = 390, height = 844, giamChuyenDong = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: giamChuyenDong ? 'reduce' : 'no-preference', hasTouch: true, isMobile: true })
  const page = await ctx.newPage(); const loi = []
  page.on('pageerror', e => loi.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) loi.push(m.text()) })
  const xem = MAN[ten]
  await page.addInitScript(({ coPhong }) => {
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: 'DEMO', hoTen: 'Kiểm thử', token: 'test-only' }))
    sessionStorage.setItem('game-v2:DEMO', 'test-only'); sessionStorage.setItem('game-v2:man-dau', 'doan')
    if (coPhong) sessionStorage.setItem('doan:DEMO', 'DH1')
  }, { coPhong: !!xem })
  await page.route('**/*', async route => {
    const u = new URL(route.request().url())
    if (['127.0.0.1', 'localhost'].includes(u.hostname)) return route.continue()
    let data = { ok: true, items: [], ca: [], ds: [], btvn: [] }
    if (u.pathname.includes('/game-v2/')) {
      data = { ok: true, profile, revision: 1, tasks: [], doanMo: true } // cờ mở game BẬT cho em kiểm thử
      if (u.pathname.endsWith('/recommendations')) Object.assign(data, { dailyUsed: 12, remaining: 188, suggestions: [{ title: 'Ester', source: 'D', part: 'I' }, { title: 'Ester', source: 'D', part: 'I' }, { title: 'Ester', source: 'D', part: 'I' }, { title: 'Ancol', source: 'D', part: 'I' }, { title: 'Ancol', source: 'D', part: 'I' }, { title: 'Amin', source: 'D', part: 'I' }] })
      if (u.pathname.endsWith('/doan-sanh')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, dangDo: null, banDongHanh: { ten: 'Thu Hà', pet: 1, cap: 30, banVung: 'Ester', emVung: 'Ancol' }, anThach: { sang: 4, nut: 2, ganSang: { ten: 'Ester', conCau: 3, kyNang: 'Liệt Diễm Xuyên Giáp' }, ds: [{ dang: 'a', ten: 'Ester', trangThai: 'nut', conCau: 3 }, { dang: 'b', ten: 'Peptit', trangThai: 'nut', conCau: 5 }, { dang: 'c', ten: 'Ancol', trangThai: 'sang', conCau: 0 }, { dang: 'd', ten: 'Amin', trangThai: 'sang', conCau: 0 }, { dang: 'e', ten: 'Polime', trangThai: 'sang', conCau: 0 }, { dang: 'f', ten: 'Điện li', trangThai: 'sang', conCau: 0 }] }, sanh: { lop: '12A1', tenDoan: 'Đoàn Hộ Tống 12A1', mua: { so: 1, conNgay: 19 }, ve: 2, mienPhiHomNay: true, chuoi: { ngay: 5, daDiHomNay: false, mocKe: 7, conNgay: 2 },
        doanLop: { lop: '12A1', tram: 17, tongTram: 30, changThang: 221, changMoiTram: 13, conChangToiTramKe: 4, mocKe: 20, tenMocKe: 'Hồ Cân Bằng', conTramToiMoc: 3, gopSucHomNay: 9, siSo: 32 },
        trumLop: { dangMo: false, chuNhat: '2026-09-27', moSauMs: 4 * 86400000 + 4 * 3600000, conMs: 0, daGop: 0, mucTieu: 3200, daHa: false }, quaMoi: [] } }) })
      if (/\/doan-/.test(u.pathname)) data = xem ? { ok: true, doan: xem } : { ok: false, error: 'Không tìm thấy chặng này.' }
      if (u.pathname.endsWith('/doan-the-goi-y')) data.goiY = { den: 1, ten: 'Thu Hà', pet: 1, cap: 30, tenDang: 'Ancol', de: 'Oxi hoá ethanol bằng CuO, đun nóng, thu được chất hữu cơ X. X là…', the: [{ loai: 'nhac_cong_thuc', tieuDe: 'Nhắc công thức', moTa: 'Gửi bạn kiến thức gốc của câu' }, { loai: 'loai_phuong_an', tieuDe: 'Loại 1 phương án', moTa: 'Máy gạch một đáp án sai' }, { loai: 'buoc_dau', tieuDe: 'Chỉ bước đầu', moTa: 'Hé bước đầu của lời giải' }] }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  })
  await page.goto(`${base}/hs`)
  await page.getByRole('button', { name: /Thần Thú/i }).first().click()
  await page.locator('.dh').waitFor({ timeout: 20000 })
  return { page, ctx, loi }
}

const ketQua = []
for (const ten of Object.keys(MAN)) {
  const { page, ctx, loi } = await moMan(ten)
  if (ten === '4-tung-chuong') { await page.locator('.dh-chuong').waitFor(); await page.waitForTimeout(1500) } else await page.waitForTimeout(900)
  if (ten === '3-tiep-suc') { await page.getByRole('button', { name: /Tiếp sức cho Thu Hà/ }).click(); await page.locator('.dh-tam').waitFor(); await page.waitForTimeout(500) }
  await page.screenshot({ path: `${OUT}/${ten}-390-sang.jpg`, type: 'jpeg', quality: 84 })
  if (ten === '1-sanh') { await page.evaluate(() => document.querySelector('.dh').scrollTo(0, 99999)); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/1c-sanh-cuoi-trang-390-sang.jpg`, type: 'jpeg', quality: 84 }) }
  assert.deepEqual(loi, [], `${ten}: có lỗi console: ${loi.join(' | ')}`)
  ketQua.push(`${ten}: chụp xong, 0 lỗi console`)
  await ctx.close()
}

// ĐO 1: màn trận + màn trùm KHÔNG cuộn ở 360×740 và 390×844; nút chốt nằm trọn trong màn hình.
for (const ten of ['2-trong-tran', '5-trum-cau-chung']) for (const [w, h] of [[360, 740], [390, 844]]) {
  const { page, ctx } = await moMan(ten, { width: w, height: h }); await page.waitForTimeout(700)
  const do_ = await page.evaluate(() => { const g = document.querySelector('.dh'), k = document.querySelector('.dh-khung'); const nut = [...document.querySelectorAll('.dh-nut-lam,.dh-chan-trang')].at(-1)?.getBoundingClientRect(); return { cuon: g.scrollHeight - g.clientHeight, khung: Math.round(k.getBoundingClientRect().bottom), day: nut ? Math.round(nut.bottom) : 0, cao: innerHeight } })
  assert.ok(do_.cuon <= 0, `${ten} ${w}×${h}: trang cuộn được ${do_.cuon}px`); assert.ok(do_.day <= do_.cao, `${ten} ${w}×${h}: nút cuối tràn màn (${do_.day} > ${do_.cao})`)
  if (w === 360) await page.screenshot({ path: `${OUT}/${ten}-360x740-sang.jpg`, type: 'jpeg', quality: 84 })
  ketQua.push(`${ten} ${w}×${h}: không cuộn (dư ${do_.cuon}px), đáy nút cuối ${do_.day}/${do_.cao}`)
  await ctx.close()
}
// ĐO 2: tung chưởng tự tắt ≤ 3 s; chạm một lần là tắt.
{ const { page, ctx } = await moMan('4-tung-chuong'); await page.locator('.dh-chuong').waitFor(); const t0 = Date.now(); await page.locator('.dh-chuong').waitFor({ state: 'detached', timeout: 5000 }); const ms = Date.now() - t0
  assert.ok(ms <= 3300, `tung chưởng kéo dài ${ms}ms`); ketQua.push(`tung chưởng tự tắt sau ${ms}ms (≤ 3 s)`); await ctx.close() }
{ const { page, ctx } = await moMan('4-tung-chuong'); await page.locator('.dh-chuong').waitFor(); await page.locator('.dh-chuong').click({ position: { x: 30, y: 300 } }); await page.locator('.dh-chuong').waitFor({ state: 'detached', timeout: 800 }); ketQua.push('tung chưởng: một chạm là bỏ qua'); await ctx.close() }
// ĐO 3: giảm chuyển động → không phần tử nào trong màn tung chưởng còn animation; vẫn có số sát thương.
{ const { page, ctx } = await moMan('4-tung-chuong', { giamChuyenDong: true }); await page.locator('.dh-chuong').waitFor()
  const dong = await page.evaluate(() => [...document.querySelectorAll('.dh-chuong, .dh-chuong *')].filter(e => getComputedStyle(e).animationName !== 'none' || getComputedStyle(e, '::before').animationName !== 'none').length)
  assert.equal(dong, 0, `giảm chuyển động mà còn ${dong} phần tử có animation`); assert.match(await page.locator('.dh-chuong-so').innerText(), /114/)
  await page.screenshot({ path: `${OUT}/4-tung-chuong-giam-chuyen-dong-390-sang.jpg`, type: 'jpeg', quality: 84 }); ketQua.push('tung chưởng + giảm chuyển động: 0 animation, vẫn hiện −114'); await ctx.close() }

await browser.close(); await server.close()
console.log(ketQua.join('\n'))
