// OMNI 3 · C1 — BƯỚC "BÀI HÔM NAY" trong bảng Dạy học (thầy chốt 05/10; hợp đồng docs/hop-dong-omni-3.md mục B `/gv/bai-da-day`).
// Khoá: chỉ hiện khi công tắc OMNI bật; lớp = lớp buổi đang mở; cây DẠY HỌC của khối, mỗi bài một chip trạng thái; chọn bài ⇒ `xem-truoc`
// ⇒ thẻ xác nhận ĐỦ 6 con số (ẩn ô "ca chốt ≥ 8" khi null) + cảnh báo quá tải; "Giao Bài <số> cho <lớp>" ⇒ `tick` đúng maDe (bỏ "Ví dụ minh hoạ",
// có ô tích để thêm) và phamVi (mọi bài đứng TRƯỚC kèm tờ); sửa hạn nộp / số lượt; "Bỏ tick" hỏi lại rồi gọi `bo-tick`; dòng chờ bài mới.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => KHO,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

import DayHocLenBang from '../src/components/day-hoc/DayHocLenBang'
import { dungCay } from '../src/lib/cay-chon-de'
import { locDeDayHoc } from '../src/lib/day-hoc-len-bang'
import { tachNhieuTheoPhan } from '../src/lib/tach-phan-de'
import { chuChoBaiMoi, dsBaiCuaKhoi, khoaBaiCua, maDeMacDinh, phamViTruoc, tenNganBai, trangThaiBai } from '../src/lib/bai-hom-nay'
import { hienHanNop } from '../src/components/chien-dich/ngay'

let soCau = 0
const cau = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-I-${++soCau}`, text: `Câu ${soCau} của ${maDe}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }))
const cauII = (maDe: string, n: number) => Array.from({ length: n }, () => ({ id: `${maDe}-II-${++soCau}`, text: `Ý ${soCau} của ${maDe}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DDSS' }))
const to = (maDe: string, nguon: string, nI: number, nII = 0, nhom = '12 · DẠY HỌC/C1 - Ester lipid'): TeacherExamSource =>
  ({ maDe, nhom, nguon, phanI: cau(maDe, nI), phanII: cauII(maDe, nII), phanIII: [] }) as unknown as TeacherExamSource
const KHO: TeacherExamSource[] = [
  to('DH-12-C1-B1', 'Bài 1. Ester', 2, 1),
  to('DH-12-C1-B1-VD', 'Bài 1. Ester · VÍ DỤ MINH HOẠ — dạy thêm', 1),
  to('DH-12-C1-B2', 'Bài 2. Lipid', 2),
  to('DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 2, 1),
  to('DH-12-C1-B3-VD', 'Bài 3. Xà phòng và chất giặt rửa · VÍ DỤ MINH HOẠ', 1),
  to('DH-12-C1-B3-DT', 'Bài 3. Xà phòng và chất giặt rửa · CÁC DẠNG TOÁN TRỌNG TÂM', 1),
  to('DH-11-C2-B3', 'Bài 3. Ammonia', 2, 0, '11 · DẠY HỌC/C2 - Nitrogen'),
  to('KT-12-C1', 'Đề kiểm tra chương 1', 3, 0, '12 · C1 - Ester lipid'),
]

const BUOI = { id: 'BH-9', ten: 'Buổi học 05/10 · 12A1', lop: '12A1', moLuc: '2026-10-05T11:00:00Z', hetHan: '2026-10-06T11:00:00Z', dongLuc: null, dangMo: true }
const XEM = { ok: true, soCau: 112, soTuLuan: 6, hanNop: '2026-10-12', D: 7, luotCan: 224, sucChua: 280, duLuot: 41, tongEm: 44, duDiem8: 29, quaTai: [{ sbd: '1', ten: 'Minh' }, { sbd: '2', ten: 'Hà' }, { sbd: '3', ten: 'Phúc' }], theLucNgay: 40 }
let co: Record<string, unknown> = { bat: true, lop: ['12A1'], sbd: [] }
let xem: Record<string, unknown> = XEM
// Chọn em nhận bài (thầy nhắn 05/10): danh sách em máy chủ (`ds-em`), em có mặt buổi đang mở, buổi gần đây (`gan-day`). Mặc định TẮT ⇒ hành vi cũ.
let dsEm: Record<string, unknown>[] | null = null
let coMatBuoi: Record<string, unknown>[] = []
let ganDay: Record<string, unknown>[] | null = null
let cd1: string | null = 'cd-1'
const EM_MAY_CHU = [
  { sbd: 'S1', hoTen: 'Nguyễn An', khoi: '12', tenLop: '12A1' },
  { sbd: 'S2', hoTen: 'Trần Bảo', khoi: '12', tenLop: '12A1' },
  { sbd: 'S3', hoTen: 'Lê Chi', khoi: '12', tenLop: '12A1' },
  { sbd: 'S9', hoTen: 'Phạm Hà', khoi: '12', tenLop: '12 - Tinh Hoa' },
  { sbd: 'S11', hoTen: 'Vũ Khoa', khoi: '11', tenLop: '11B' },
]
const buoiCu = (id: string, ngay: string, coMat: string[]) => ({ id, ten: `Buổi ${ngay}`, lop: '12A1', moLuc: `${ngay}T11:00:00Z`, hetHan: '', dongLuc: `${ngay}T13:00:00Z`, dangMo: false, coMat })
function chuanMock() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 44, sbd: [] }, { tenLop: '11B', khoi: '11', soEm: 30, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return ganDay ? { ok: true, du: { ok: true, buoi: ganDay } } : { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: coMatBuoi, siSo: 44, lopEm: [] } }
    if (duong === '/gv/chien-dich' && b.action === 'ds-em' && dsEm) return { ok: true, du: { ok: true, em: dsEm } }
    if (duong === '/gv/chien-dich/sua' && b.action === 'doc')
      return { ok: true, du: { ok: true, homNay: '2026-10-05', chienDich: { id: b.id, ten: 'Bài 2. Lipid', lop: '12A1', maDe: ['DH-12-C1-B2'], sbd: ['S1', 'S2'], hanNop: '2026-10-07', theLucNgay: 40, trangThai: 'dang_chay', soCau: 2, soEm: 2, hetHan: false }, nhatKy: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co } }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach')
      return {
        ok: true,
        du: {
          ok: true,
          bai: [
            { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, tickLuc: '2026-09-22T03:00:00Z', chienDichId: cd1, trangThai: 'da_day', hanNop: '2026-09-29', conNgay: null, chungChi: { dat: 38, tong: 44 } },
            { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, tickLuc: '2026-09-30T03:00:00Z', chienDichId: 'cd-2', trangThai: 'dang_luyen', hanNop: '2026-10-07', conNgay: 2, chungChi: { dat: 0, tong: 44 } },
          ],
          choBaiMoi: { soNgay: 4 },
        },
      }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') return { ok: true, du: xem }
    if (duong === '/gv/bai-da-day' && b.action === 'tick') return { ok: true, du: { ok: true, chienDichId: 'cd-3', hanNop: '2026-10-12', daCo: false } }
    if (duong === '/gv/bai-da-day' && b.action === 'bo-tick') return { ok: true, du: { ok: true, chienDich: 'da_huy' } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (action: string) => goi.mock.calls.filter(([d, b]) => d === '/gv/bai-da-day' && b.action === action).map(([, b]) => b as Record<string, unknown>)

beforeEach(() => {
  goi.mockReset()
  co = { bat: true, lop: ['12A1'], sbd: [] }
  xem = XEM
  dsEm = null
  coMatBuoi = []
  ganDay = null
  cd1 = 'cd-1'
  chuanMock()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('phần thuần (src/lib/bai-hom-nay.ts)', () => {
  const kho = locDeDayHoc(tachNhieuTheoPhan(KHO))
  const ds = dsBaiCuaKhoi(dungCay(kho), '12')
  it('bài của MỘT khối theo thứ tự cây, khoá bài = mã gốc chung, vị trí 1..n; khối khác không lẫn', () => {
    expect(ds.map((b) => [b.khoaBai, b.tenBai, b.viTri])).toEqual([
      ['DH-12-C1-B1', 'Bài 1. Ester', 1],
      ['DH-12-C1-B2', 'Bài 2. Lipid', 2],
      ['DH-12-C1-B3', 'Bài 3. Xà phòng và chất giặt rửa', 3],
    ])
    expect(dsBaiCuaKhoi(dungCay(kho), '11').map((b) => b.khoaBai)).toEqual(['DH-11-C2-B3'])
    expect(dsBaiCuaKhoi(dungCay(kho), '10')).toEqual([])
    expect(khoaBaiCua({ khoa: 'DẠY HỌC/12/x/Bài lạ', laMa: ['A-1', 'B-2'] })).toBe('DẠY HỌC/12/x/Bài lạ')
  })
  it('tờ mặc định bỏ "Ví dụ minh hoạ"; phạm vi = mọi bài đứng trước kèm tờ (cũng bỏ Ví dụ minh hoạ)', () => {
    expect(maDeMacDinh(ds[2]!)).toEqual(['DH-12-C1-B3-DT', 'DH-12-C1-B3-TN', 'DH-12-C1-B3-DS'])
    expect(phamViTruoc(ds, 3)).toEqual([
      { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, maDe: ['DH-12-C1-B1-TN', 'DH-12-C1-B1-DS'] },
      { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, maDe: ['DH-12-C1-B2'] },
    ])
    expect(phamViTruoc(ds, 1)).toEqual([])
  })
  it('chip trạng thái + tên ngắn + dòng chờ bài mới (từ ngày chờ thứ 3)', () => {
    expect(trangThaiBai({ trangThai: 'da_day', tickLuc: '2026-09-22T03:00:00Z', conNgay: null, chungChi: { dat: 38, tong: 44 } }, false).chu).toBe('Đã dạy 22/09 · chứng chỉ 38/44')
    expect(trangThaiBai({ trangThai: 'dang_luyen', tickLuc: '', conNgay: 2, chungChi: null }, false).chu).toBe('Đang luyện · còn 2 ngày')
    expect(trangThaiBai(null, true).chu).toBe('Bài hôm nay')
    expect(trangThaiBai(undefined, false).chu).toBe('Chưa dạy')
    expect(tenNganBai('Bài 6. Tinh bột và cellulose')).toBe('Bài 6')
    expect(tenNganBai('Ôn tập chương')).toBe('Ôn tập chương')
    expect(chuChoBaiMoi('12A1', { soNgay: 3 })).toBe('Lớp 12A1: 3 ngày chưa có bài mới')
    expect(chuChoBaiMoi('12A1', { soNgay: 2 })).toBeNull()
    expect(chuChoBaiMoi('12A1', null)).toBeNull()
  })
})

async function moBuoc() {
  render(<DayHocLenBang />)
  const buoc = (await screen.findByRole('heading', { name: 'Bài hôm nay' })).closest('section') as HTMLElement
  await waitFor(() => expect(within(buoc).getByText('Bài 3. Xà phòng và chất giặt rửa')).toBeTruthy())
  return buoc
}
const dong = (buoc: HTMLElement, khoa: string) => buoc.querySelector(`[data-bai="${khoa}"]`) as HTMLElement

describe('màn: bước Bài hôm nay', () => {
  it('OMNI tắt (hoặc máy chủ chưa có lệnh) ⇒ bảng Dạy học y như cũ: không có bước, không gọi /gv/bai-da-day', async () => {
    co = { bat: false, lop: [], sbd: [] }
    render(<DayHocLenBang />)
    expect(await screen.findByRole('heading', { name: 'Chiếu lên bảng' })).toBeTruthy()
    await waitFor(() => expect(goi.mock.calls.some(([d]) => d === '/gv/omni')).toBe(true))
    expect(screen.queryByRole('heading', { name: 'Bài hôm nay' })).toBeNull()
    expect(goi.mock.calls.some(([d]) => d === '/gv/bai-da-day')).toBe(false)
    expect(goi.mock.calls.some(([, b]) => b.action === 'ds-em' || b.action === 'gan-day')).toBe(false)
    expect(document.querySelector('[data-khoi="cho-bai-moi"]')).toBeNull()
  })

  it('lớp = lớp của buổi đang mở; cây DẠY HỌC khối 12 có chip trạng thái; dòng chờ bài mới ở đầu bảng', async () => {
    const buoc = await moBuoc()
    expect((within(buoc).getByLabelText('Lớp') as HTMLSelectElement).value).toBe('12A1')
    expect(lenh('danh-sach').at(-1)).toMatchObject({ lop: '12A1' })
    expect(dong(buoc, 'DH-12-C1-B1').textContent).toContain('Đã dạy 22/09 · chứng chỉ 38/44')
    expect(dong(buoc, 'DH-12-C1-B2').textContent).toContain('Đang luyện · còn 2 ngày')
    expect(dong(buoc, 'DH-12-C1-B3').textContent).toContain('Chưa dạy')
    expect(buoc.textContent).not.toContain('Ammonia') // khối 11 không lẫn
    expect(buoc.textContent).not.toContain('Đề kiểm tra chương 1') // TU LUYỆN không vào cây Dạy học
    expect(document.querySelector('[data-khoi="cho-bai-moi"]')?.textContent).toBe('Lớp 12A1: 4 ngày chưa có bài mới')
    // Bài đã tick: không chọn lại được, có "Bỏ tick".
    expect((within(dong(buoc, 'DH-12-C1-B1')).getByRole('radio') as HTMLInputElement).disabled).toBe(true)
    expect(within(dong(buoc, 'DH-12-C1-B2')).getByRole('button', { name: 'Bỏ tick' })).toBeTruthy()
  })

  it('chọn bài ⇒ "Bài hôm nay" + xem-truoc (bỏ Ví dụ minh hoạ) ⇒ thẻ xác nhận ĐỦ 6 con số + cảnh báo quá tải; tick gửi đúng maDe + phamVi', async () => {
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    expect(dong(buoc, 'DH-12-C1-B3').textContent).toContain('Bài hôm nay')
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(1))
    expect(lenh('xem-truoc')[0]).toEqual({ action: 'xem-truoc', lop: '12A1', khoaBai: 'DH-12-C1-B3', tenBai: 'Bài 3. Xà phòng và chất giặt rửa', viTri: 3, maDe: ['DH-12-C1-B3-DT', 'DH-12-C1-B3-TN', 'DH-12-C1-B3-DS'] })

    const the = (await screen.findByText('Câu rút được')).closest('[data-khoi="xac-nhan-tick"]') as HTMLElement
    const o = (k: string) => (the.querySelector(`[data-so-tick="${k}"]`) as HTMLElement).textContent ?? ''
    expect(o('cau')).toContain('112')
    expect(o('cau')).toContain('đã bỏ 6 câu tự luận')
    expect(o('han')).toContain('Hạn nộp tự tính')
    expect(o('han')).toContain('7ngày')
    expect(o('han')).toContain(`hết ${hienHanNop('2026-10-12', false)}`)
    expect(o('luot')).toContain('Lượt cần / sức chứa')
    expect(o('luot')).toContain('224/ 280 lượt')
    expect(o('luot')).toMatch(/80 ?% sức chứa/)
    expect(o('luot-ngay')).toContain('40lượt/ngày')
    expect(o('luot-ngay')).toContain('mặc định của lớp')
    expect(o('du-luot')).toContain('Đủ lượt để luyện hết')
    expect(o('du-luot')).toContain('41/ 44 em')
    expect(o('du-diem-8')).toContain('Đủ lượt để ca chốt ≥ 8')
    expect(o('du-diem-8')).toContain('29/ 44 em')
    expect(the.querySelectorAll('[data-so-tick]')).toHaveLength(6)
    expect(the.querySelector('[data-khoi="qua-tai"]')?.textContent).toContain('3 em quá tải ngay từ ngày đầu: Minh, Hà, Phúc')
    // Chữ chuẩn A2: app thầy không dùng chữ "thể lực".
    expect(buoc.textContent).not.toMatch(/thể lực/i)

    // Ô tích thêm "Ví dụ minh hoạ" ⇒ xem trước lại với tờ ấy.
    fireEvent.click(within(the).getByRole('checkbox', { name: /Ví dụ minh hoạ/ }))
    await waitFor(() => expect(lenh('xem-truoc').at(-1)!.maDe).toEqual(['DH-12-C1-B3-VD', 'DH-12-C1-B3-DT', 'DH-12-C1-B3-TN', 'DH-12-C1-B3-DS']))

    fireEvent.click(within(the).getByRole('button', { name: 'Giao Bài 3 cho 12A1' }))
    await waitFor(() => expect(lenh('tick')).toHaveLength(1))
    expect(lenh('tick')[0]).toEqual({
      action: 'tick',
      lop: '12A1',
      khoaBai: 'DH-12-C1-B3',
      tenBai: 'Bài 3. Xà phòng và chất giặt rửa',
      viTri: 3,
      maDe: ['DH-12-C1-B3-VD', 'DH-12-C1-B3-DT', 'DH-12-C1-B3-TN', 'DH-12-C1-B3-DS'],
      phamVi: [
        { khoaBai: 'DH-12-C1-B1', tenBai: 'Bài 1. Ester', viTri: 1, maDe: ['DH-12-C1-B1-TN', 'DH-12-C1-B1-DS'] },
        { khoaBai: 'DH-12-C1-B2', tenBai: 'Bài 2. Lipid', viTri: 2, maDe: ['DH-12-C1-B2'] },
      ],
    })
    // Giao xong: nạp lại trạng thái lớp, thẻ xác nhận đóng.
    await waitFor(() => expect(lenh('danh-sach').length).toBeGreaterThanOrEqual(2))
    await waitFor(() => expect(document.querySelector('[data-khoi="xac-nhan-tick"]')).toBeNull())
  })

  it('"Sửa hạn nộp hoặc số lượt/ngày": hai ô như màn Giao chiến dịch ⇒ xem-truoc + tick mang hanNop / theLucNgay', async () => {
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    await screen.findByText('Câu rút được')
    fireEvent.click(screen.getByRole('button', { name: 'Sửa hạn nộp hoặc số lượt/ngày' }))
    fireEvent.change(screen.getByLabelText(/Số lượt câu mỗi ngày/), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/Hạn nộp \(hết lúc 23:59\)/), { target: { value: '2026-10-14' } })
    await waitFor(() => expect(lenh('xem-truoc').at(-1)).toMatchObject({ theLucNgay: 50, hanNop: '2026-10-14' }))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Giao Bài 3 cho 12A1' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Giao Bài 3 cho 12A1' }))
    await waitFor(() => expect(lenh('tick').at(-1)).toMatchObject({ theLucNgay: 50, hanNop: '2026-10-14' }))
  })

  it('chưa có P (duDiem8 null) ⇒ ẩn ô "Đủ lượt để ca chốt ≥ 8", còn 5 ô; không quá tải ⇒ không cảnh báo', async () => {
    xem = { ...XEM, duDiem8: null, quaTai: [] }
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    const the = (await screen.findByText('Câu rút được')).closest('[data-khoi="xac-nhan-tick"]') as HTMLElement
    expect(the.querySelectorAll('[data-so-tick]')).toHaveLength(5)
    expect(the.querySelector('[data-so-tick="du-diem-8"]')).toBeNull()
    expect(the.querySelector('[data-khoi="qua-tai"]')).toBeNull()
  })

  it('máy chủ từ chối xem trước ⇒ hiện đúng lời máy chủ, nút giao tắt', async () => {
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc') return { ok: false, loai: 'tu_choi', chu: 'OMNI chưa bật cho lớp 12A1.' }
      return (chuanMockGoc as (d: string, b: Record<string, unknown>) => unknown)(duong, b)
    })
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    expect(await screen.findByText('OMNI chưa bật cho lớp 12A1.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Giao Bài 3 cho 12A1' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('"Bỏ tick" hỏi lại nói rõ hậu quả; "Giữ bài" ⇒ không gọi; đồng ý ⇒ bo-tick đúng lớp + khoá bài', async () => {
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B2')).getByRole('button', { name: 'Bỏ tick' }))
    let hop = await screen.findByRole('alertdialog')
    expect(hop.textContent).toContain('Bỏ tick Bài 2?')
    expect(hop.textContent).toContain('huỷ hẳn')
    expect(hop.textContent).toContain('kết quả đã làm vẫn giữ')
    fireEvent.click(within(hop).getByRole('button', { name: 'Giữ bài' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(lenh('bo-tick')).toHaveLength(0)
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B2')).getByRole('button', { name: 'Bỏ tick' }))
    hop = await screen.findByRole('alertdialog')
    fireEvent.click(within(hop).getByRole('button', { name: 'Bỏ tick' }))
    await waitFor(() => expect(lenh('bo-tick')).toEqual([{ action: 'bo-tick', lop: '12A1', khoaBai: 'DH-12-C1-B2' }]))
  })
})

describe('chọn em nhận bài (thầy nhắn 05/10: bê bộ chọn em của chiến dịch cũ + chọn theo điểm danh)', () => {
  const coDuEm = () => {
    dsEm = EM_MAY_CHU
    coMatBuoi = [
      { sbd: 'S1', hoTen: 'Nguyễn An', luc: '2026-10-05T11:01:00Z', cach: 'ma' },
      { sbd: 'S3', hoTen: 'Lê Chi', luc: '2026-10-05T11:02:00Z', cach: 'ma' },
      { sbd: 'X9', hoTen: 'Em lạ', luc: '2026-10-05T11:03:00Z', cach: 'thay' },
    ]
    ganDay = [
      { ...buoiCu('BH-9', '2026-10-05', ['S1', 'S3', 'X9']), dangMo: true }, // trùng buổi đang mở ⇒ bỏ
      buoiCu('BH-8', '2026-10-03', ['S2', 'S3']),
      buoiCu('BH-7', '2026-10-01', []), // 0 em có mặt ⇒ bỏ
      buoiCu('BH-6', '2026-09-29', ['S1']),
      buoiCu('BH-5', '2026-09-27', ['S2']),
      buoiCu('BH-4', '2026-09-25', ['S3']), // quá 3 buổi gần nhất ⇒ bỏ
    ]
  }
  const chonBai3 = async () => {
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    const khoi = (await screen.findByRole('heading', { name: 'Chọn em nhận chiến dịch' })).closest('section') as HTMLElement
    return { buoc, khoi }
  }

  it('mặc định CẢ LỚP của bài (bộ chọn em của màn Giao, chip "N / M em"); xem-truoc gửi đúng sbd', async () => {
    coDuEm()
    const { khoi } = await chonBai3()
    expect(khoi.querySelector('.cd-chip-muc')?.textContent).toBe('3 / 5 em')
    expect(within(khoi).getByRole('button', { name: 'Chọn em' })).toBeTruthy() // đúng ô chọn của màn Giao
    await waitFor(() => expect(lenh('xem-truoc').at(-1)).toMatchObject({ khoaBai: 'DH-12-C1-B3', sbd: ['S1', 'S2', 'S3'] }))
  })

  it('máy chủ B1 trả soEmChon (em được giao) ⇒ hai ô "Đủ lượt" chia cho số em được giao, ghi kèm số em cả lớp', async () => {
    coDuEm()
    xem = { ...XEM, soEmChon: 3, duLuot: 2, duDiem8: 1 }
    await chonBai3()
    const the = (await screen.findByText('Câu rút được')).closest('[data-khoi="xac-nhan-tick"]') as HTMLElement
    const o = (k: string) => (the.querySelector(`[data-so-tick="${k}"]`) as HTMLElement).textContent ?? ''
    expect(o('du-luot')).toContain('2/ 3 em')
    expect(o('du-luot')).toContain('em được giao · lớp có 44 em')
    expect(o('du-diem-8')).toContain('1/ 3 em')
  })

  it('"Theo điểm danh": buổi đang mở + tối đa 3 buổi gần nhất (bỏ buổi 0 em, bỏ trùng); bấm ⇒ đúng em có mặt; "Cả lớp" trả về mặc định; tick gửi đúng sbd', async () => {
    coDuEm()
    const { khoi } = await chonBai3()
    const hang = (await within(khoi).findByRole('group', { name: 'Chọn em theo điểm danh' })) as HTMLElement
    expect(within(hang).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Buổi 05/10 · 3 em có mặt',
      'Buổi 03/10 · 2 em có mặt',
      'Buổi 29/09 · 1 em có mặt',
      'Buổi 27/09 · 1 em có mặt',
      'Cả lớp (3 em)',
    ])
    expect(goi).toHaveBeenCalledWith('/gv/buoi-hoc', expect.objectContaining({ action: 'gan-day', lop: '12A1' }))
    expect(within(hang).getByRole('button', { name: 'Cả lớp (3 em)' }).getAttribute('aria-pressed')).toBe('true')

    // Buổi đang mở: S1, S3 có mặt (X9 không có trong danh sách em ⇒ không chọn được).
    fireEvent.click(within(hang).getByRole('button', { name: 'Buổi 05/10 · 3 em có mặt' }))
    expect(within(hang).getByRole('button', { name: 'Buổi 05/10 · 3 em có mặt' }).getAttribute('aria-pressed')).toBe('true')
    expect(khoi.querySelector('.cd-chip-muc')?.textContent).toBe('2 / 5 em')
    await waitFor(() => expect(lenh('xem-truoc').at(-1)!.sbd).toEqual(['S1', 'S3']))

    fireEvent.click(within(hang).getByRole('button', { name: 'Cả lớp (3 em)' }))
    await waitFor(() => expect(lenh('xem-truoc').at(-1)!.sbd).toEqual(['S1', 'S2', 'S3']))

    fireEvent.click(within(hang).getByRole('button', { name: 'Buổi 03/10 · 2 em có mặt' }))
    await waitFor(() => expect(lenh('xem-truoc').at(-1)!.sbd).toEqual(['S2', 'S3']))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Giao Bài 3 cho 12A1' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Giao Bài 3 cho 12A1' }))
    await waitFor(() => expect(lenh('tick')).toHaveLength(1))
    expect(lenh('tick')[0]).toMatchObject({ khoaBai: 'DH-12-C1-B3', sbd: ['S2', 'S3'] })
  })

  it('bỏ hết em ⇒ "Chọn ít nhất 1 em", nút giao khoá, không gọi xem-truoc với 0 em', async () => {
    coDuEm()
    const { khoi } = await chonBai3()
    await waitFor(() => expect(lenh('xem-truoc').length).toBeGreaterThan(0))
    fireEvent.click(within(khoi).getByRole('button', { name: 'Bỏ 12A1' }))
    expect(khoi.querySelector('.cd-chip-muc')?.textContent).toBe('0 / 5 em')
    expect(within(khoi).getByText('Chọn ít nhất 1 em.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Giao Bài 3 cho 12A1' }) as HTMLButtonElement).disabled).toBe(true)
    await new Promise((r) => setTimeout(r, 400))
    expect(lenh('xem-truoc').every((b) => (b.sbd as string[] | undefined)?.length !== 0)).toBe(true)
  })

  it('chưa có danh sách em ⇒ giữ hành vi cũ: không có khối chọn em, KHÔNG gửi sbd (máy chủ giao cả lớp)', async () => {
    const buoc = await moBuoc()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B3')).getByRole('radio'))
    await waitFor(() => expect(lenh('xem-truoc').length).toBe(1))
    expect(lenh('xem-truoc')[0]!.sbd).toBeUndefined()
    expect(screen.queryByRole('heading', { name: 'Chọn em nhận chiến dịch' })).toBeNull()
  })

  it('bài ĐÃ tick: "Đã giao N em" + "Sửa em" mở hộp sửa chiến dịch sẵn có; không có mã chiến dịch ⇒ sang mục Chiến dịch luyện', async () => {
    cd1 = null
    const { useAppStore } = await import('../src/store/appStore')
    const buoc = await moBuoc()
    expect(dong(buoc, 'DH-12-C1-B2').textContent).toContain('Đã giao 44 em')
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B2')).getByRole('button', { name: 'Sửa em' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/chien-dich/sua', { action: 'doc', id: 'cd-2' }))
    expect(await screen.findByText(/Chỉnh sửa: Bài 2\. Lipid/)).toBeTruthy()
    fireEvent.click(within(dong(buoc, 'DH-12-C1-B1')).getByRole('button', { name: 'Sửa em' }))
    expect(useAppStore.getState().screen).toBe('chiendich')
  })
})

describe('"Giao theo bài" ở mục Chiến dịch luyện — lối vào thứ hai của cùng bước Bài hôm nay', () => {
  it('OMNI bật ⇒ nút hiện; bấm ⇒ sang Lên bảng và mục ấy mở sẵn thẻ Dạy học (khoá phiên đọc một lần rồi xoá)', async () => {
    const [{ default: NutGiaoTheoBai }, { useAppStore }, { default: GoiLenBangScreen }, { KHOA_MO_THE_DAY_HOC, docMoTheDayHoc }] = await Promise.all([
      import('../src/components/chien-dich/NutGiaoTheoBai'),
      import('../src/store/appStore'),
      import('../src/screens/GoiLenBangScreen'),
      import('../src/lib/bai-hom-nay'),
    ])
    render(<NutGiaoTheoBai />)
    fireEvent.click(await screen.findByRole('button', { name: 'Giao theo bài' }))
    expect(useAppStore.getState().screen).toBe('goilenbang')
    expect(sessionStorage.getItem(KHOA_MO_THE_DAY_HOC)).toBe('1')
    cleanup()
    render(<GoiLenBangScreen />)
    expect(screen.getByRole('tab', { name: 'Dạy học' }).getAttribute('aria-selected')).toBe('true')
    expect(await screen.findByRole('heading', { name: 'Bài hôm nay' })).toBeTruthy()
    expect(sessionStorage.getItem(KHOA_MO_THE_DAY_HOC)).toBeNull()
    expect(docMoTheDayHoc()).toBe(false)
  })
  it('OMNI tắt ⇒ không có nút (màn như cũ)', async () => {
    co = { bat: false, lop: [], sbd: [] }
    const { default: NutGiaoTheoBai } = await import('../src/components/chien-dich/NutGiaoTheoBai')
    const { container } = render(<NutGiaoTheoBai />)
    await waitFor(() => expect(goi.mock.calls.some(([d]) => d === '/gv/omni')).toBe(true))
    expect(container.innerHTML).toBe('')
  })
})

let chuanMockGoc: unknown
beforeEach(() => {
  chuanMockGoc = goi.getMockImplementation()
})
