// APP PHỤ HUYNH MỚI 28/09 — thầy: "Trùng tu toàn bộ app phụ huynh, app phụ huynh không có giao bài cho con nữa chỉ xem được báo cáo mọi thứ về con".
// Bản vẽ https://claude.ai/artifact/2HShm51xEiuVKcTAUpfeFT. Khoá: (1) KHÔNG còn đường giao bài / lệnh ghi nào của phụ huynh; (2) các mục + màn chi tiết ca,
// đọc dữ liệu thật; (3) ca chưa công bố không lộ điểm / nhận xét; (4) không chữ game; (5) lớp đọc chặt các lệnh mới.
// SỬA CÓ CHỦ Ý — bản vẽ tối giản thầy chốt 09/10 (thay thứ tự 01/10): bốn mục → BA mục Hôm nay · Tiến bộ · Ca kiểm tra ("Lịch sử"/"Điểm số" → "Ca kiểm tra";
// bỏ mục "Lời thầy"); Hôm nay còn 4 khối (khoá chi tiết ở tests/ph-v3-toi-gian-0910.test.tsx).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { docBaoCaoCa, docHoc2, docLoiThay } from '../src/lib/ph-v3/du-lieu'
import { docTuyen, lienKetCa, chuHanNgay, chuThay, tuanNay } from '../src/components/ph-v3/tien-ich'
import { dungBieuDo, thuNgan } from '../src/components/ph-v3/ManDiemSo'
import { muoiBonNgay } from '../src/components/ph-v3/ManTienBo'
import { chuBanApp } from '../src/lib/cap-nhat-app'
import { PH_OK, CHI_TIET, NAY } from './_ph-moi/du-lieu-mau'

const daXem = vi.fn()
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrl: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<any>()), tenTheoSbd: async () => ({ sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', tenCa: '' }) }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [CANH_BAO] }) }))
vi.mock('../src/lib/canh-bao-thay-may-chu', async (original) => ({ ...(await original<any>()), baoDaXemPhuHuynh: (id: string) => { daXem(id); return Promise.resolve() } }))
const CANH_BAO = { id: 'cb-1', maBtvn: 'BT-1', tenBtvn: 'BTVN Este', guiLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-22T05:00:00Z', loi: 'Thầy nhắc con nộp bài trước 12:00.', trangThaiEm: 'chua_mo', chang: null, daXem: false }

const HOC2 = { ok: true, cheDo2: true, ngay: '2026-09-21', chienDich: { ten: 'Ester – Lipid', hanNop: '2026-09-25', conNgay: 5, tong: 120, daGap: 67, thanhThao: 20, canDayLai: 3 }, homNay: { tong: 40, daLam: 32 }, cauTungSai: { tong: 31, thanhThao: 12, canDayLai: 2, dangOn: 17 } }
const LOI_THAY = { ok: true, nhanXet: [{ maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', noiDung: 'Con mất điểm ở bài đốt cháy ester.', capNhatLuc: '2026-09-20T01:00:00Z', nopLuc: '2026-09-19T02:12:00Z', tong: 7.5 }] }
const BAO_CAO: Record<string, unknown> = {
  'CA-2': {
    ok: true, ca: { maCa: 'CA-2', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', nopLuc: '2026-09-19T02:12:00Z', thoiGianLamGiay: 1930 },
    congBo: { congBo: 'ngay', daCongBo: true, soEmDaNop: 30, soEmDaVao: 32 }, ketQua: { tong: 7.5, soCau: 28, soCauDung: 21 }, truoc: { tenCa: 'Ca trước', tong: 6.75, doi: 0.75 },
    phan: [{ ma: 'I', dung: 15, tong: 18, motPhan: 0, diem: 3.75, toiDa: 4.5 }, { ma: 'II', dung: 2, tong: 4, motPhan: 1, diem: 2.75, toiDa: 4 }, { ma: 'III', dung: 4, tong: 6, motPhan: 0, diem: 1, toiDa: 1.5 }],
    dang: [{ ma: 'D1', ten: 'Xà phòng hoá chất béo', dung: 1, tong: 4 }],
    cauCanXemLai: [{ qid: 'Q7', phan: 'I', soCau: 7, de: 'Đốt cháy hoàn toàn 0,1 mol ester X', dapAnChon: 'A', dapAnDung: 'B', loiGiai: 'k = 2', laDungNhungLau: false }],
    nhanXet: { noiDung: 'Con mất điểm ở bài đốt cháy ester.', capNhatLuc: '2026-09-20T01:00:00Z' },
  },
  'CA-3': { ok: true, ca: { maCa: 'CA-3', tenCa: 'Kiểm tra 60 phút', nopLuc: '2026-09-21T02:12:00Z' }, congBo: { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 27, soEmDaVao: 32 }, ketQua: { tong: 9.25 }, nhanXet: { noiDung: 'NHẬN XÉT KHÔNG ĐƯỢC LỘ' } },
}
const CAM_GAME = /thần thú|khiên|Võ đài|Đảo|Linh Tâm|Đoàn Hộ Tống|\bEXP\b|vàng|rương/i
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

let goi: { duong: string; than: Record<string, unknown> }[] = []
let tatCa: unknown = PH_OK
beforeEach(() => {
  goi = []
  tatCa = PH_OK
  daXem.mockClear()
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  localStorage.setItem('omr_ph_sbd', '12121212')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async (url: string, o?: { body?: string }) => {
    const duong = String(url).replace('https://may.test', '')
    const than = o?.body ? JSON.parse(o.body) : {}
    goi.push({ duong, than })
    const js = (t: unknown) => ({ ok: true, status: 200, json: async () => t, text: async () => JSON.stringify(t) })
    if (duong === '/ph/tat-ca-ve-con') return js(tatCa)
    if (duong === '/ph/hoc-2') return js(HOC2)
    if (duong === '/ph/loi-thay') return js(LOI_THAY)
    if (duong === '/ph/bao-cao-ca') return js(BAO_CAO[String(than.maCa)] ?? { ok: false, error: 'Không tìm thấy ca.' })
    if (duong === '/ph/chi-tiet-cau-ve-con') return js(CHI_TIET)
    return js({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

const diToi = async (hash: string) => {
  await act(async () => {
    window.history.replaceState(null, '', `/?vai=phuhuynh${hash}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}
const vaoApp = async () => {
  const r = render(<ParentPortalScreen />)
  await waitFor(() => expect(r.container.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
  return r
}

describe('app phụ huynh mới — CHỈ XEM, không giao bài (thầy 28/09)', () => {
  it('Hôm nay (bản vẽ tối giản 09/10): số câu MỘT nguồn (kế hoạch 32/40), tuần này, dạng luyện thêm + ca gần nhất, lời thầy; KHÔNG chiến dịch/BTVN/nút giao bài; chỉ gọi lệnh ĐỌC', async () => {
    const { container } = await vaoApp()
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    const ah = container.querySelector('[data-vung="anh-hung"]')!.textContent!
    expect(ah).toContain('Con đã làm hôm nay · Thứ Hai 21/09')
    expect(container.querySelector('[data-vung="so-cau-hom-nay"]')!.textContent).toBe('32/40 câu')
    expect(ah).toContain('Con đang làm, còn 8 câu nữa là xong kế hoạch hôm nay.')
    expect(ah).toContain('Giờ học quen của con: 19:30–21:00.')
    // 01/10 có: 52 phút, 38 câu (nguồn thứ hai), 79% đúng, +5 câu, Thứ 9/42, chuỗi 6 ngày — bản vẽ 09/10 bỏ.
    for (const bo of ['38', 'phút', '79%', '+5 câu', 'Thứ 9/42', 'Chuỗi 6 ngày']) expect(ah, bo).not.toContain(bo)
    expect(container.querySelector('[data-vung="tuan-nay"]')!.textContent).toContain('1/7 ngày') // 21/09/2026 là Thứ Hai
    const dang = container.querySelector('[data-vung="dang-luyen-them"]')!.textContent!
    expect(dang).toContain('Dạng con đang luyện thêm')
    expect(dang).toContain('Xà phòng hoá chất béo · Bài toán hỗn hợp ester')
    expect(dang).toContain('Ca kiểm tra gần nhất: 7,5 điểm (19/09)')
    expect((container.querySelector('[data-vung="ca-gan-nhat"]') as HTMLAnchorElement).getAttribute('href')).toBe('#ca/CA-2')
    expect(container.querySelector('[data-vung="loi-thay-moi"]')!.textContent).toContain('Con mất điểm ở bài đốt cháy ester.')
    expect(container.querySelector('[data-vung="chien-dich"], [data-vung="nhip-14"], [data-vung="khac-phuc"]')).toBeNull()
    for (const bo of ['Chiến dịch của con', 'Bài tập về nhà', 'Gia đình giao', 'câu cần thầy dạy lại', 'Con học lúc nào', 'Điều đáng mừng', 'đã lo cho con']) expect(container.textContent, bo).not.toContain(bo)
    expect(container.querySelector('[data-vung="ten-con"]')!.textContent).toBe('Nguyễn Minh Khôi · Lớp 12A1')
    // Không một nút / liên kết nào để giao bài.
    expect(container.textContent).not.toContain('Giao thêm bài cho con')
    expect([...container.querySelectorAll('button, a')].map((b) => b.textContent).join(' | ')).not.toMatch(/giao/i)
    expect(container.textContent).not.toMatch(CAM_GAME)
    expect(container.querySelector('[data-vung="canh-bao-thay"]')!.textContent).toContain('Thầy nhắc con nộp bài trước 12:00.')
    const duong = new Set(goi.map((g) => g.duong))
    for (const d of duong) expect(['/ph/tat-ca-ve-con', '/ph/hoc-2', '/ph/loi-thay']).toContain(d)
    expect(duong.has('/ph/giao-them')).toBe(false)
    expect(duong.has('/hoa2/ph-ngung')).toBe(false)
    for (const g of goi) expect(g.than).toEqual({ sbd: '12121212' })
  })

  it('BA mục điều hướng là liên kết (#hom-nay · #tien-bo · #ca-kiem-tra), mục đang xem có aria-current; Ca kiểm tra: ca gần nhất + lời thầy của ca + "Các ca trước"', async () => {
    tatCa = { ...PH_OK, tienBo: { diem: [{ ngay: '2026-09-05', diem: 6.25, maCa: 'CA-1', tenCa: 'Kiểm tra 15 phút' }, { ngay: '2026-09-12', diem: 6.75, maCa: 'CA-15', tenCa: 'Kiểm tra chương 4' }], dangTienBoNhat: [] } }
    const { container } = await vaoApp()
    const lk = [...container.querySelectorAll('nav[aria-label="Các mục chính"] a')] as HTMLAnchorElement[]
    expect(lk.map((a) => [a.getAttribute('href'), a.textContent])).toEqual([['#hom-nay', 'Hôm nay'], ['#tien-bo', 'Tiến bộ'], ['#ca-kiem-tra', 'Lịch sử'], ['#loi-thay', 'Lời thầy']])
    expect(lk[0]!.getAttribute('aria-current')).toBe('page')
    await diToi('#ca-kiem-tra')
    await waitFor(() => expect(container.querySelector('[data-vung="man-ca-kiem-tra"]')).toBeTruthy())
    expect(lk[2]!.getAttribute('aria-current')).toBe('page')
    expect(container.querySelector('h1')!.textContent).toBe('Lịch sử')
    expect(container.textContent).not.toMatch(/Điểm số/)
    const ca = container.querySelector('[data-vung="ca-gan-nhat"]')!
    for (const x of ['Kiểm tra 45 phút · Ester – Lipid', 'Thứ Bảy 19/09/2026 · 28 câu', '7,5', 'Trắc nghiệm', '15/18 câu']) expect(ca.textContent).toContain(x)
    await waitFor(() => expect(ca.querySelector('[data-vung="loi-thay-ca"]')!.textContent).toBe('Thầy Đỗ Đại Học: Con mất điểm ở bài đốt cháy ester.'))
    expect([...ca.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')])).toEqual([['Xem bài làm của con', '#ca/CA-2']])
    const ds = container.querySelector('[data-vung="ds-ca"]')!
    expect(ds.querySelector('h2')!.textContent).toBe('Các ca trước')
    expect([...ds.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['#ca/CA-15', '#ca/CA-1']) // mới trước, không lặp ca gần nhất
    expect(ds.textContent).toContain('6,75')
    // liên kết cũ còn lưu: #diem ⇒ Ca kiểm tra; #loi-thay ⇒ Hôm nay
    await diToi('#diem')
    await waitFor(() => expect(container.querySelector('[data-vung="man-ca-kiem-tra"]')).toBeTruthy())
    await diToi('#loi-thay')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Lời thầy' })).toBeTruthy())
  })

  it('chi tiết ca ĐÃ công bố: điểm, ba phần (điểm / trần), nhận xét của thầy, dạng, câu nên xem lại; bấm "Lời giải" ⇒ đề đủ phương án', async () => {
    const { container } = await vaoApp()
    await diToi('#ca/CA-2')
    await waitFor(() => expect(container.querySelector('[data-vung="diem-ca"]')).toBeTruthy())
    expect(goi.find((g) => g.duong === '/ph/bao-cao-ca')!.than).toEqual({ sbd: '12121212', maCa: 'CA-2' })
    const diem = container.querySelector('[data-vung="diem-ca"]')!.textContent!
    for (const x of ['7,5', 'Tăng 0,75 so với ca trước', 'Phần II · Đúng–sai', '2,75', '/ 4 điểm', 'Đúng trọn 2/4 câu · 1 câu đúng một phần', 'Đúng 15/18 câu', 'Con làm trong 32 phút 10 giây']) expect(diem).toContain(x)
    expect(container.querySelector('[data-vung="nhan-xet-thay"]')!.textContent).toContain('Con mất điểm ở bài đốt cháy ester.')
    const cau = container.querySelector('[data-vung="cau-xem-lai"]')!
    expect(cau.textContent).toContain('Con chọn A · Đáp án đúng B')
    fireEvent.click(screen.getByRole('button', { name: 'Lời giải' }))
    await waitFor(() => expect(cau.querySelector('.ph3-pa')).toBeTruthy())
    expect(goi.find((g) => g.duong === '/ph/chi-tiet-cau-ve-con')!.than).toEqual({ sbd: '12121212', qid: 'Q7' })
    expect(cau.querySelector('li[data-dung]')!.textContent).toContain('B.')
    expect(cau.querySelector('li[data-chon]')!.textContent).toContain('A.')
    const lui = container.querySelector('a.ph3-lui') as HTMLAnchorElement
    expect([lui.getAttribute('href'), lui.textContent]).toEqual(['#ca-kiem-tra', 'Lịch sử'])
  })

  it('chi tiết ca CHƯA công bố: chỉ câu "chờ công bố" — không điểm, không nhận xét dù máy chủ lỡ gửi', async () => {
    const { container } = await vaoApp()
    await diToi(`${lienKetCa('CA-3')}`)
    await waitFor(() => expect(container.textContent).toContain('Điểm hiện khi cả lớp nộp xong (27/32 em đã nộp).'))
    expect(container.textContent).not.toContain('9,25')
    expect(container.textContent).not.toContain('NHẬN XÉT KHÔNG ĐƯỢC LỘ')
    expect(container.querySelector('[data-vung="diem-ca"]')).toBeNull()
  })

  it('Tiến bộ (bản vẽ tối giản 09/10): đường điểm các ca (chuyển từ "Điểm số"), một danh sách dạng, nhịp 14 ngày; KHÔNG còn khối câu từng sai', async () => {
    const { container } = await vaoApp()
    await diToi('#tien-bo')
    await waitFor(() => expect(container.querySelector('[data-vung="xu-huong-diem"]')).toBeTruthy())
    const diem = container.querySelector('[data-vung="xu-huong-diem"]')!
    expect(diem.querySelector('#ph3-diem-ca')!.textContent).toBe('Điểm các ca kiểm tra')
    expect(diem.getAttribute('aria-labelledby')).toBe('ph3-diem-ca')
    expect(diem.querySelector('svg[role="img"]')!.getAttribute('aria-label')).toBe('Điểm các ca: 19/09 7,5')
    expect(container.querySelector('[data-vung="khac-phuc"]')).toBeNull()
    expect(container.textContent).not.toContain('chờ thầy dạy lại')
    const nh = container.querySelector('[data-vung="nhip-14"]')!.textContent!
    expect(nh).toContain('11/14')
    expect(nh).toContain('Con hay học khoảng 19:30–21:00')
    expect(container.querySelectorAll('.ph3-nhip__cot > span').length).toBe(14)
  })

  it('Lời thầy (bản vẽ tối giản 09/10): không còn mục riêng — lời mới nhất ở cuối Hôm nay; cảnh báo chưa xem ở đầu Hôm nay, bấm "Đã xem cảnh báo" ⇒ báo máy chủ và khối rời màn', async () => {
    const { container } = await vaoApp()
    await waitFor(() => expect(container.querySelector('[data-vung="loi-thay-moi"]')).toBeTruthy())
    expect(container.querySelector('[data-vung="thu-tuan"], [data-vung="man-loi-thay"], [data-vung="ds-nhan-xet"]')).toBeNull()
    expect(container.textContent).not.toContain('Hôm nay Khôi làm 38 câu')
    expect(container.textContent).not.toMatch(/A\.I|Bộ não/)
    const lt = container.querySelector('[data-vung="loi-thay-moi"]')!
    expect(lt.querySelector('h2')!.textContent).toBe('Thầy Đỗ Đại Học nhắn')
    expect(lt.querySelector('a')!.getAttribute('href')).toBe('#ca/CA-2')
    expect(container.querySelector('.ph3-luoi')!.firstElementChild!.getAttribute('data-vung')).toBe('canh-bao-thay')
    fireEvent.click(screen.getByRole('button', { name: 'Đã xem cảnh báo' }))
    expect(daXem).toHaveBeenCalledWith('cb-1')
    expect(container.querySelector('[data-vung="canh-bao-thay"]')).toBeNull()
  })

  it('máy chủ lỗi ⇒ lời thật + "Thử lại"; menu tài khoản: "Đổi số báo danh" + số bản ⇒ về đăng nhập, xoá SBD nhớ', async () => {
    tatCa = { ok: false, error: 'Không tìm thấy số báo danh của con.' }
    const { container } = render(<ParentPortalScreen />)
    expect(await screen.findByText('Không tìm thấy số báo danh của con.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tài khoản: mở để đổi số báo danh' }))
    const menu = container.querySelector('[role="menu"]') as HTMLElement
    expect((menu.querySelector('[data-vung="ban-app"]') as HTMLElement).textContent).toBe(chuBanApp())
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi số báo danh' }))
    expect(await screen.findByPlaceholderText(/Ví dụ: 12001/)).toBeTruthy()
    expect(localStorage.getItem('omr_ph_sbd')).toBeNull()
  })
})

describe('lớp đọc chặt của ba lệnh mới', () => {
  it('báo cáo ca CHƯA công bố: bỏ điểm/nhận xét dù JSON có; đã công bố: đủ phần + trần điểm', () => {
    const chua = docBaoCaoCa(BAO_CAO['CA-3'])!
    expect(chua.ketQua).toBeNull()
    expect(chua.nhanXet).toBeNull()
    const co = docBaoCaoCa(BAO_CAO['CA-2'])!
    expect(co.ketQua!.tong).toBe(7.5)
    expect(co.phan.map((p) => [p.ma, p.diem, p.toiDa])).toEqual([['I', 3.75, 4.5], ['II', 2.75, 4], ['III', 1, 1.5]])
    expect(docBaoCaoCa({ ok: false })).toBeNull()
  })
  it('Game Hoá 2.0: tổng không khớp ⇒ khối vắng (không bịa); công tắc tắt ⇒ ba khối null', () => {
    expect(docHoc2({ ok: true, cheDo2: false })).toEqual({ chienDich: null, homNay: null, cauTungSai: null })
    const lech = docHoc2({ ...HOC2, chienDich: { ...HOC2.chienDich, thanhThao: 70 }, homNay: { tong: 40, daLam: 41 }, cauTungSai: { tong: 31, thanhThao: 12, canDayLai: 2, dangOn: 1 } })!
    expect(lech).toEqual({ chienDich: null, homNay: null, cauTungSai: null })
    expect(docHoc2(HOC2)!.homNay).toEqual({ tong: 40, daLam: 32 })
  })
  it('lời thầy: bỏ dòng thiếu mã ca / nội dung', () => {
    expect(docLoiThay({ ok: true, nhanXet: [{ maCa: '', noiDung: 'x' }, { maCa: 'A', noiDung: '  ' }, { maCa: 'B', noiDung: 'Tốt', tong: 8 }] })!.map((x) => x.maCa)).toEqual(['B'])
    expect(docLoiThay({ ok: true })).toEqual([])
  })
  it('tuyến, hạn nộp, biểu đồ, 14 ngày', () => {
    expect(docTuyen('#ca/CA%2F1')).toEqual({ muc: 'ca-kiem-tra', maCa: 'CA/1' })
    expect(docTuyen('#ca-kiem-tra')).toEqual({ muc: 'ca-kiem-tra', maCa: null })
    expect(docTuyen('#diem')).toEqual({ muc: 'ca-kiem-tra', maCa: null })
    expect(docTuyen('#loi-thay')).toEqual({ muc: 'loi-thay', maCa: null })
    expect(docTuyen('#tien-bo')).toEqual({ muc: 'tien-bo', maCa: null })
    expect(docTuyen('#la')).toEqual({ muc: 'hom-nay', maCa: null })
    expect(docTuyen('#ca/%E0')).toEqual({ muc: 'hom-nay', maCa: null })
    expect(chuHanNgay('2026-09-30')).toBe('23:59 · Thứ Tư 30/09/2026')
    // Thầy 28/09: phụ huynh chỉ thấy "Thầy Đỗ Đại Học", không thấy "A.I Đỗ Đại Học" / "Bộ não A.I …"
    expect(chuThay('Bộ não A.I hỗ trợ riêng em Khôi đã xếp lịch ôn.')).toBe('Thầy Đỗ Đại Học đã xếp lịch ôn.')
    expect(chuThay('Bộ não A.I: thêm 2 câu/ngày')).toBe('Thầy Đỗ Đại Học: thêm 2 câu/ngày')
    expect(chuThay('A.I Đỗ Đại Học sẽ thử lại')).toBe('Thầy Đỗ Đại Học sẽ thử lại')
    expect(chuThay('Con làm tốt phần ester.')).toBe('Con làm tốt phần ester.')
    expect(thuNgan('2026-09-26')).toBe('T7')
    const b = dungBieuDo([{ diem: 6.25 }, { diem: 7.75 }, { diem: 10 }])
    for (const y of b.y) expect(y).toBeGreaterThanOrEqual(20)
    for (const y of b.y) expect(y).toBeLessThanOrEqual(130)
    expect(b.x[0]).toBe(28)
    expect(b.x[2]).toBe(302)
    const n = muoiBonNgay(NAY)
    expect(n).toHaveLength(14)
    expect([n[0], n[13]]).toEqual(['2026-09-08', '2026-09-21'])
    expect(tuanNay(NAY)).toEqual({ ngay: ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27'], homNay: 0 })
    // Chủ nhật 23:30 giờ VN (16:30 UTC) vẫn thuộc tuần bắt đầu Thứ Hai trước đó
    expect(tuanNay(Date.UTC(2026, 9, 11, 16, 30))).toEqual({ ngay: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'], homNay: 6 })
  })
})

describe('khoá nguồn', () => {
  it('cổng phụ huynh không còn mã giao bài / màn "đã ngừng" / bảng cũ; mọi lớp CSS mới bắt đầu bằng ph3-; không mã màu thô', () => {
    const p = doc('src/screens/ParentPortalScreen.tsx').replace(/\/\/.*$/gm, '')
    for (const cam of ['useGiaoThem', 'giaoThem', 'ManChinh', 'BangMoiThu', '/hoa2/ph-ngung', 'PhDaNgung', 'giao-them']) expect(p, cam).not.toContain(cam)
    const thuMuc = 'src/components/ph-v3'
    for (const t of fs.readdirSync(thuMuc)) {
      const s = doc(`${thuMuc}/${t}`)
      expect(s, t).not.toMatch(/giao-them|GiaoThem|giaoThem|\/mom\/|parent-news/)
      expect(s, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      if (t !== 'tien-ich.ts') expect(s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''), `${t}: chữ A.I`).not.toMatch(/A\.I|Bộ não/)
    }
    const css = doc(`${thuMuc}/ph-v3.css`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '')
    const lop = [...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]!).filter((x) => !/^woff2?$/.test(x))
    expect(lop.filter((x) => !x.startsWith('ph3')), 'lớp sai tiền tố').toEqual([])
  })
})
