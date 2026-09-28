// BẢNG DẠY HỌC — sửa 1 (thầy 28/09):
//  (1) "cây thư mục hiện thiếu lớp 10": nguyên nhân — khử trùng câu trên CẢ KHO trước khi lọc nhánh DẠY HỌC, câu Dạy học trùng "Bộ đề" / cây bài
//      bị nhánh kia giành ⇒ Khối 10 mất sạch. Nay lọc DẠY HỌC trước (`khoDayHoc`); chip lọc lớp tự sinh theo dữ liệu.
//  (2) khối "Thêm em chưa điểm danh được": tìm theo SBD/tên không dấu, em đã có mặt hiện đã tích + nhãn, thêm/bỏ em tay; em thêm tay được thuật toán
//      chọn em tính như em có mặt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({ ...(await goc<typeof import('../src/lib/exam-db')>()), loadExamSources: async () => [] }))

import { khoDayHoc } from '../src/lib/day-hoc-len-bang'
import { khuTrungNguon } from '../src/lib/khu-trung-cau'
import { tachNhieuTheoPhan } from '../src/lib/tach-phan-de'
import { dungCay, khoiCuaDe } from '../src/lib/cay-chon-de'
import { boDau, docTrangThai, locEmThem } from '../src/lib/buoi-hoc-api'
import { xepEmChoDanhSach } from '../src/lib/chon-em-day-hoc'
import HopChonDe from '../src/components/HopChonDe'
import DayHocLenBang from '../src/components/day-hoc/DayHocLenBang'

const q = (id: string, text: string) => ({ id, text, choices: ['A1', 'B1', 'C1', 'D1'], correct: 'A' as const })
const de = (maDe: string, nhom: string, cau: [string, string][]): TeacherExamSource => ({ maDe, nhom, nguon: maDe, phanI: cau.map(([i, t]) => q(i, t)), phanII: [], phanIII: [] })

// Đúng hình kho thật: câu Dạy học lớp 10 trùng NGUYÊN VĂN với Bộ đề (hạng ưu tiên 0) và với cây bài `10-…` (mã đứng trước "DH-…").
const KHO: TeacherExamSource[] = [
  de('10-C1-B1', '10 · C1 - Nguyên tử', [['10-C1-B1-I-1', 'Hạt mang điện dương là'], ['10-C1-B1-I-2', 'Số khối A bằng']]),
  de('DB-10-01', '10 · Bộ đề chuẩn cấu trúc', [['DB-10-01-I-1', 'Số hiệu nguyên tử Z bằng']]),
  de('DH-10-C1-B1', '10 · DẠY HỌC/C1 - Nguyên Tử', [['DH-10-C1-B1-I-1', 'Hạt mang điện dương là'], ['DH-10-C1-B1-I-2', 'Số khối A bằng'], ['DH-10-C1-B1-I-3', 'Số hiệu nguyên tử Z bằng']]),
  de('DH-12-C1-B1', '12 · DẠY HỌC/C1 - Ester lipid', [['DH-12-C1-B1-I-1', 'Chất nào là ester?']]),
]

describe('(1) cây DẠY HỌC đủ khối', () => {
  it('NGUYÊN NHÂN GỐC tái hiện: khử trùng cả kho rồi mới lọc ⇒ mất Khối 10', () => {
    const cu = tachNhieuTheoPhan(khuTrungNguon(KHO).nguon).filter((s) => /DẠY HỌC\//.test(s.nhom ?? ''))
    expect(cu.some((s) => khoiCuaDe(s) === '10')).toBe(false)
  })
  it('khoDayHoc: lọc DẠY HỌC trước ⇒ Khối 10 đủ 3 câu, Khối 12 còn nguyên; không có đề ngoài nhánh', () => {
    const ds = khoDayHoc(KHO, khuTrungNguon, tachNhieuTheoPhan)
    const cay = dungCay(ds)
    expect(cay.map((n) => n.nhan)).toEqual(['DẠY HỌC'])
    expect(cay[0]!.con.map((n) => [n.nhan, n.soCau.I])).toEqual([
      ['Khối 10', 3],
      ['Khối 12', 1],
    ])
    expect(ds.every((s) => s.maDe.startsWith('DH-'))).toBe(true)
  })
  it('chip lọc lớp TỰ SINH theo dữ liệu: có khối 10 và 12 ⇒ Tất cả · Lớp 10 · Lớp 12 (không có Lớp 11)', () => {
    render(<HopChonDe ds={khoDayHoc(KHO, khuTrungNguon, tachNhieuTheoPhan)} daChon={new Set()} onChon={() => {}} chonNhieu />)
    const nhom = screen.getByRole('group', { name: 'Lọc theo khối' })
    expect(within(nhom).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tất cả', 'Lớp 10', 'Lớp 12'])
    cleanup()
  })
})

describe('(2) tìm em để thêm tay', () => {
  const ds = [
    { sbd: '1203', hoTen: 'Nguyễn Minh Anh', tenLop: '12 - Tinh Hoa' },
    { sbd: '1107', hoTen: 'Đỗ Thị Ánh', tenLop: '11' },
    { sbd: '1001', hoTen: 'Trần Đức', tenLop: '10' },
  ]
  it('không dấu, không phân biệt hoa; SBD; mọi từ phải khớp; lọc theo lớp', () => {
    expect(boDau('Đỗ Thị ÁNH')).toBe('do thi anh')
    expect(locEmThem(ds, '', 'minh anh').map((e) => e.sbd)).toEqual(['1203'])
    expect(locEmThem(ds, '', 'DO THI').map((e) => e.sbd)).toEqual(['1107'])
    expect(locEmThem(ds, '', 'duc').map((e) => e.sbd)).toEqual(['1001'])
    expect(locEmThem(ds, '', '110').map((e) => e.sbd)).toEqual(['1107'])
    expect(locEmThem(ds, '11', '').map((e) => e.sbd)).toEqual(['1107'])
    expect(locEmThem(ds, '11', 'minh')).toEqual([])
  })
  it('em THẦY THÊM TAY được thuật toán chọn em tính như em có mặt', () => {
    const tt = docTrangThai({ buoi: { id: 'B', dangMo: true }, coMat: [{ sbd: 'T1', hoTen: 'Em thêm tay', luc: 'x', cach: 'thay' }] })!
    expect(tt.coMat[0]!.cach).toBe('thay')
    const [k] = xepEmChoDanhSach([{ qid: 'Q', mucDo: 'biet' }], tt.coMat, {})
    expect(k!.sbd).toBe('T1')
  })
})

describe('(2) khối "Thêm em chưa điểm danh được" trên màn', () => {
  const BUOI = { id: 'BH-1', ten: 'Buổi học 28/09 · 12 - Tinh Hoa', lop: '12 - Tinh Hoa', moLuc: 'x', hetHan: 'y', dongLuc: null, dangMo: true }
  const LOP = [
    { sbd: '1203', hoTen: 'Nguyễn Minh Anh', tenLop: '12 - Tinh Hoa' },
    { sbd: '1204', hoTen: 'Lê Bảo Châu', tenLop: '12 - Tinh Hoa' },
    { sbd: '1107', hoTen: 'Đỗ Thị Ánh', tenLop: '11' },
  ]
  let coMat: { sbd: string; hoTen: string; luc: string; cach: string }[]
  beforeEach(() => {
    coMat = [{ sbd: '1203', hoTen: 'Nguyễn Minh Anh', luc: '2026-09-28T11:00:00Z', cach: 'ma' }]
    goi.mockReset()
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [] } }
      if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
      if (duong === '/gv/buoi-hoc' && b.action === 'them-em') for (const s of b.sbd as string[]) coMat.push({ sbd: s, hoTen: LOP.find((e) => e.sbd === s)!.hoTen, luc: 'z', cach: 'thay' })
      if (duong === '/gv/buoi-hoc' && b.action === 'bot-em') coMat = coMat.filter((e) => e.sbd !== b.sbd)
      if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '111222', coMat: [...coMat], siSo: 2, lopEm: LOP } }
      return { ok: false, loai: 'chua_co_lenh', chu: 'x' }
    })
  })
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('mặc định lọc lớp của buổi; em đã có mặt đã tích + "đã điểm danh"; tìm không dấu; thêm ⇒ "thầy thêm"; bỏ được', async () => {
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: /Thêm em chưa điểm danh được/ }))
    const khoi = await screen.findByRole('group', { name: 'Thêm em chưa điểm danh được' })
    const ds = within(khoi).getByRole('list', { name: 'Danh sách học sinh để thêm' })
    expect(within(ds).queryByText('Đỗ Thị Ánh')).toBeNull() // lớp khác, đang lọc lớp của buổi
    const oAnh = within(ds).getByRole('checkbox', { name: /Nguyễn Minh Anh/ }) as HTMLInputElement
    expect(oAnh.checked && oAnh.disabled).toBe(true)
    expect(within(ds).getByText('đã điểm danh')).toBeTruthy()
    const nut = within(khoi).getByRole('button', { name: 'Thêm 0 em vào danh sách có mặt' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    // "Mọi lớp" + tìm không dấu
    fireEvent.change(within(khoi).getByLabelText('Lớp'), { target: { value: '' } })
    fireEvent.change(within(khoi).getByLabelText('Tìm theo SBD hoặc tên'), { target: { value: 'do thi anh' } })
    const oMoi = within(ds).getByRole('checkbox', { name: /Đỗ Thị Ánh/ })
    fireEvent.click(oMoi)
    fireEvent.click(within(khoi).getByRole('button', { name: 'Thêm 1 em vào danh sách có mặt' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/buoi-hoc', { action: 'them-em', id: 'BH-1', sbd: ['1107'] }))
    expect(await within(khoi).findByText('thầy thêm')).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Học sinh có mặt' }).textContent).toContain('Thị Ánh')
    fireEvent.click(within(khoi).getByRole('button', { name: 'Bỏ Đỗ Thị Ánh khỏi danh sách có mặt' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/buoi-hoc', { action: 'bot-em', id: 'BH-1', sbd: '1107' }))
    await waitFor(() => expect(within(khoi).queryByText('thầy thêm')).toBeNull())
  })
})
