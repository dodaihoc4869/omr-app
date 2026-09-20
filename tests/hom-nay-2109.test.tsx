// APP GIÁO VIÊN · G2 — màn HÔM NAY. Mọi số hiện ra phải đến từ lệnh máy chủ (docs/hop-dong-gv-hom-nay-2109.md); chưa có ⇒ "đang chờ máy chủ", KHÔNG bịa số.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { useAppStore } from '../src/store/appStore'
import type { HomNay } from '../src/lib/hom-nay-api'
import {
  cauLyDo,
  hanhDongCua,
  layCauToiHan,
  layHomNay,
  ngayDai,
  phanTram,
  thuCuaHan,
} from '../src/lib/hom-nay-api'

const nap = vi.hoisted(() => ({ hom: null as unknown, cau: null as unknown, cho: false }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'bi-mat-thu' }))
vi.mock('../src/components/BangTinGiaoVien', () => ({ default: () => <div>bảng tin hoạt động</div> }))
vi.mock('../src/lib/cap-nhat-app', () => ({ daySangBanMoi: () => {} }))
import HomNayScreen from '../src/screens/HomNayScreen'
import ExamHubScreen from '../src/screens/ExamHubScreen'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const MAU: HomNay = {
  serverNow: 1, ngay: '2026-09-21', soEm: 261, soLop: 8, caDangMo: 0,
  nhiemVu: { tong: 261, dat: 142, tongHomQua: 261, datHomQua: 128 },
  btvn: { soEmCoLo: 100, soEmDungNhip: 86, dangChay: [{ ma: 'b1', ten: 'Chương 1 · Ester – Lipid', lop: '12A1', soEm: 34, loHienTai: 3, tongLo: 5, soEmKip: 30, han: '2026-09-25T16:00:00Z' }] },
  canYTuong: { tong: 17, ds: [
    { sbd: '12001', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', lyDo: 'tre_nhip', soLieu: { ngay: 4 } },
    { sbd: '12002', hoTen: 'Trần Thu Hà', lop: '12A1', lyDo: 'dang_yeu', soLieu: { ten: 'Oxi hoá ancol', soCauSai: 4 } },
    { sbd: '12003', hoTen: 'Lê Hoàng Nam', lop: '12A2', lyDo: 'tut_bac', soLieu: { soCau: 5, soNgay: 3 } },
  ] },
  dangYeu: [{ lop: '12A1', siSo: 34, dang: [{ ma: 'a', ten: 'Oxi hoá ancol', soEmYeu: 21 }, { ma: 'b', ten: 'Thuỷ phân ester', soEmYeu: 16 }] }],
  doan: { lop: '12A1', tram: 17, tongTram: 30, gopSucHomNay: 9, siSo: 34 },
}

beforeEach(() => {
  useAppStore.getState().setScreen('examhub')
  useAppStore.getState().setClassList([{ sbd: '12001', hoTen: 'Nguyễn Minh Khôi', sdt: '', lop: '12A1', namSinh: '2008', raw: {} }])
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string; headers?: Record<string, string> }) => {
    const u = new URL(String(url)).pathname
    const ok = (b: unknown) => ({ ok: true, status: 200, json: async () => b })
    if (nap.cho) return new Promise(() => {})
    if (u === '/ke-hoach/hom-nay-thay') return nap.hom ? ok({ ok: true, ...(nap.hom as object) }) : { ok: false, status: 404, json: async () => ({ ok: false }) }
    if (u === '/ke-hoach/do-phu-phuc-vu') return nap.cau ? ok({ ok: true, ...(nap.cau as object) }) : ok({ ok: false })
    void init
    return ok({ ok: true })
  }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  nap.hom = null
  nap.cau = null
  nap.cho = false
})

describe('hom-nay-api: hàm thuần', () => {
  it('cauLyDo: MỘT câu bằng SỐ cho mỗi lý do, không kết luận năng lực; hanhDongCua theo lý do', () => {
    const em = (lyDo: 'tre_nhip' | 'tut_bac' | 'dang_yeu', soLieu: object) => ({ sbd: 'x', hoTen: 'A', lop: '12', lyDo, soLieu })
    expect(cauLyDo(em('tre_nhip', { ngay: 4 }))).toBe('Trễ nhịp 4 ngày, chưa làm câu nào trong thời gian ấy')
    expect(cauLyDo(em('tut_bac', { soCau: 5, soNgay: 3 }))).toBe('Tụt bậc 5 câu trong 3 ngày')
    expect(cauLyDo(em('dang_yeu', { ten: 'Oxi hoá ancol', soCauSai: 4 }))).toBe('Dạng "Oxi hoá ancol" sai 4 câu')
    expect(cauLyDo(em('dang_yeu', { ma: 'CD:x' }))).toContain('CD:x')
    expect([hanhDongCua(em('tre_nhip', {})), hanhDongCua(em('tut_bac', {})), hanhDongCua(em('dang_yeu', {}))]).toEqual(['nhan_phu_huynh', 'xem_ho_so', 'dua_vao_buoi_chua'])
    for (const s of [cauLyDo(em('tre_nhip', {})), cauLyDo(em('tut_bac', {})), cauLyDo(em('dang_yeu', {}))]) expect(s).not.toMatch(/nắm chắc|năng lực|giỏi|kém/i)
  })

  it('phanTram: làm tròn; mẫu số 0 → null (không bịa 0%); ngayDai / thuCuaHan đúng thứ', () => {
    expect(phanTram(142, 261)).toBe(54)
    expect(phanTram(0, 0)).toBeNull()
    expect(ngayDai('2026-09-21')).toBe('Thứ Hai, 21/09')
    expect(ngayDai('2026-09-27')).toBe('Chủ nhật, 27/09')
    expect(ngayDai('hỏng')).toBe('')
    expect(thuCuaHan('2026-09-25T09:00:00')).toBe('thứ Sáu')
    expect(thuCuaHan(null)).toBe('')
  })
})

describe('hom-nay-api: gọi máy chủ', () => {
  it('layHomNay: POST /ke-hoach/hom-nay-thay kèm x-ma-bi-mat; trả dữ liệu khi ok, null khi 404 / sai mã / mạng hỏng', async () => {
    nap.hom = MAU
    const r = await layHomNay()
    expect(r!.nhiemVu!.dat).toBe(142)
    const goi = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(goi[0]).toBe('https://may.test/ke-hoach/hom-nay-thay')
    expect(goi[1].method).toBe('POST')
    expect(goi[1].headers['x-ma-bi-mat']).toBe('bi-mat-thu')
    nap.hom = null
    expect(await layHomNay()).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect(await layHomNay()).toBeNull()
  })

  it('layCauToiHan: chỉ nhận số; thiếu trường → null', async () => {
    nap.cau = { qidToiHan: 1179, qidPhucVuDuoc: 939 }
    expect(await layCauToiHan()).toEqual({ toiHan: 1179, moDuoc: 939 })
    nap.cau = { qidToiHan: 'nhiều' }
    expect(await layCauToiHan()).toBeNull()
  })
})

describe('HomNayScreen', () => {
  it('ĐANG CHỜ MÁY CHỦ (lệnh chưa có): bốn thẻ số hiện "—" và "đang chờ máy chủ", KHÔNG số nào bịa; vẫn có ô tìm và các nút điều hướng', async () => {
    const { container } = render(<HomNayScreen />)
    await screen.findByText(/BTVN đang chạy: đang chờ máy chủ/)
    const so = [...container.querySelectorAll('.hn-so-gia-tri')].map((e) => e.textContent)
    expect(so).toEqual(['—', '—', '—', '—'])
    expect(container.querySelectorAll('.hn-em')).toHaveLength(0)
    expect(screen.getByText('Danh sách em cần để ý: đang chờ máy chủ.')).toBeTruthy()
    expect(screen.getByText('Dạng yếu theo lớp: đang chờ máy chủ.')).toBeTruthy()
    expect(screen.queryByText(/ĐOÀN HỘ TỐNG/)).toBeNull() // thẻ game chỉ khi game mở
    expect(screen.getByText('1 học sinh', { exact: false })).toBeTruthy() // số em lấy tạm từ danh sách lớp CỦA MÁY, không phải bịa
  })

  it('ĐANG TẢI: chữ "Đang tải…", chưa số nào', () => {
    nap.cho = true
    const { container } = render(<HomNayScreen />)
    expect(screen.getAllByText('Đang tải…').length).toBeGreaterThan(0)
    expect([...container.querySelectorAll('.hn-so-gia-tri')].map((e) => e.textContent)).toEqual(['—', '—', '—', '—'])
  })

  it('CÓ DỮ LIỆU: mỗi số trên thẻ truy được về một trường của lệnh; danh sách em, lô BTVN, dạng yếu, Đoàn Hộ Tống', async () => {
    nap.hom = MAU
    nap.cau = { qidToiHan: 1179, qidPhucVuDuoc: 939 }
    const { container } = render(<HomNayScreen />)
    await screen.findByText('Nguyễn Minh Khôi')
    await waitFor(() => expect(container.querySelectorAll('.hn-so-gia-tri')[2].textContent).toBe('1.179'))
    const so = [...container.querySelectorAll('.hn-so-gia-tri')].map((e) => e.textContent)
    expect(so).toEqual(['142/261', '86%', '1.179', '17'])
    expect(screen.getByText('54% · hôm qua 49%')).toBeTruthy() // 142/261 ; 128/261
    expect(screen.getByText('cả trường · 939 mở được')).toBeTruthy()
    expect(screen.getByText('1 bài đang chạy')).toBeTruthy()
    expect(screen.getByText('Thứ Hai, 21/09', { exact: false })).toBeTruthy()
    expect(screen.getByText('Không có ca nào đang mở')).toBeTruthy()
    // em cần để ý: MỘT lý do + MỘT nút mỗi em
    const dong = container.querySelectorAll('.hn-em')
    expect(dong).toHaveLength(3)
    expect(within(dong[0] as HTMLElement).getByRole('button', { name: 'Nhắn phụ huynh' })).toBeTruthy()
    expect(within(dong[1] as HTMLElement).getByRole('button', { name: 'Đưa vào buổi chữa' })).toBeTruthy()
    expect(within(dong[2] as HTMLElement).getByRole('button', { name: 'Xem hồ sơ' })).toBeTruthy()
    for (const d of dong) expect(d.querySelectorAll('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Xem cả 17 em' })).toBeTruthy() // 17 > 3 em đang hiện
    // BTVN theo lô
    expect(screen.getByText('lô 3/5')).toBeTruthy()
    expect(screen.getByText('88% kịp')).toBeTruthy() // 30/34 em
    expect(container.querySelectorAll('.hn-lo i')).toHaveLength(5)
    expect(container.querySelectorAll('.hn-lo i.da')).toHaveLength(3)
    // dạng yếu + Đoàn Hộ Tống
    expect(screen.getByText('DẠNG CẢ LỚP 12A1 ĐANG YẾU')).toBeTruthy()
    expect(screen.getByText('21/34 em')).toBeTruthy()
    expect(screen.getByText('Trạm 17/30 · hôm nay 9/34 bạn góp sức')).toBeTruthy()
  })

  it('nút hành động: Xem hồ sơ / Nhắn phụ huynh → hồ sơ em; Đưa vào buổi chữa → Gọi lên bảng; Giao BTVN theo dạng → giaobtvn; Rút đề → examsetup', async () => {
    nap.hom = MAU
    render(<HomNayScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Xem hồ sơ' }))
    expect([useAppStore.getState().screen, useAppStore.getState().sbdDangXem]).toEqual(['hocsinh', '12003'])
    fireEvent.click(screen.getByRole('button', { name: 'Nhắn phụ huynh' }))
    expect(useAppStore.getState().sbdDangXem).toBe('12001')
    fireEvent.click(screen.getByRole('button', { name: 'Đưa vào buổi chữa' }))
    expect(useAppStore.getState().screen).toBe('goilenbang')
    fireEvent.click(screen.getByRole('button', { name: 'Giao BTVN theo 2 dạng này' }))
    expect(useAppStore.getState().screen).toBe('giaobtvn')
    fireEvent.click(screen.getByRole('button', { name: 'Rút đề kiểm tra' }))
    expect(useAppStore.getState().screen).toBe('examsetup')
  })

  it('ô tìm: 6 số → Chi tiết ca; SBD hoặc tên có trong danh sách lớp → hồ sơ em; không có → báo, không đổi màn', async () => {
    render(<HomNayScreen />)
    const o = screen.getByLabelText('Tìm học sinh hoặc mã ca')
    fireEvent.change(o, { target: { value: '111222' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect([useAppStore.getState().screen, useAppStore.getState().maCaTheoDoi]).toEqual(['exammonitor', '111222'])
    useAppStore.getState().setScreen('examhub')
    fireEvent.change(o, { target: { value: 'minh khôi' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect([useAppStore.getState().screen, useAppStore.getState().sbdDangXem]).toEqual(['hocsinh', '12001'])
    useAppStore.getState().setScreen('examhub')
    fireEvent.change(o, { target: { value: 'không có ai' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(useAppStore.getState().screen).toBe('examhub')
    expect(useAppStore.getState().toast?.text).toContain('Không tìm thấy')
  })
})

describe('ExamHubScreen = trang chủ Hôm nay + bảng tin hoạt động cũ; CSS', () => {
  it('ExamHubScreen dựng HomNayScreen rồi bảng tin hoạt động (không mất tính năng cũ)', async () => {
    render(<ExamHubScreen />)
    expect(screen.getByText('Chào thầy Học')).toBeTruthy()
    expect(screen.getByText('bảng tin hoạt động')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Lấy bản mới/ })).toBeTruthy()
    await screen.findByText(/BTVN đang chạy/)
  })

  it('hom-nay.css: token --m3-*, không hex, không !important; 4 cột → 2 cột (<1100) → 1 cột (<880)', () => {
    const css = doc('src/styles/hom-nay.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
    expect(css).toMatch(/\.hn-hang-so \{[^}]*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 1099px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/@media \(max-width: 879px\)/)
    expect(css).toContain('var(--m3-error-container)')
  })

  it('hợp đồng: màn (đủ dữ liệu) không có chữ "nắm chắc" hay kết luận năng lực; nguồn không dùng chữ "nắm chắc"', async () => {
    nap.hom = MAU
    const { container } = render(<HomNayScreen />)
    await screen.findByText('Nguyễn Minh Khôi')
    expect(container.textContent).not.toMatch(/nắm chắc|năng lực|giỏi|kém/i)
    for (const t of ['src/screens/HomNayScreen.tsx', 'src/lib/hom-nay-api.ts']) expect(doc(t)).not.toContain('nắm chắc')
  })
})
