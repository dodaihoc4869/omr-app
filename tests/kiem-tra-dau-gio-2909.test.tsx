// THẺ "KIỂM TRA ĐẦU GIỜ" của mục Lên bảng (đặc tả DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909 mục B, 29/09) — app thầy.
// Khoá: thẻ nằm cạnh Dạy học; bước Điểm danh BÊ NGUYÊN (cùng thành phần, có "Thêm em chưa điểm danh được"); "Chiếu lên bảng" gọi ứng viên → chọn ≤ 6 em
// không trùng câu → chốt → tờ chiếu MỚI có dòng lịch sử câu trên thẻ tên; bảng chấm Đạt / Chưa đạt đi qua `/gv/dau-gio` cham (KHÔNG `ghiLenBang`);
// "Thầy đã chữa" gọi da-chua; "Gọi thêm" + "Kết thúc" (hỏi lại bằng hộp chung, nói thật số em chưa chấm).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi, ghiLenBang } = vi.hoisted(() => ({ goi: vi.fn(), ghiLenBang: vi.fn(async () => undefined) }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => KHO,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/exam-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/exam-api')>()), ghiLenBang }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

import KiemTraDauGio from '../src/components/day-hoc/KiemTraDauGio'
import GoiLenBangScreen from '../src/screens/GoiLenBangScreen'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { cauTheoQid, locUngVienTheoKho } from '../src/lib/dau-gio-kho'
import { dungToChieuDayHoc } from '../src/lib/day-hoc-len-bang'

const KHO: TeacherExamSource[] = [
  {
    maDe: 'KT12C1',
    nguon: 'Đề kiểm tra chương 1',
    nhom: '12 · C1 - Ester lipid',
    phanI: [
      { id: 'KT12C1-I-1', text: 'Chất nào sau đây là ester?', choices: ['CH3COOH', 'CH3COOCH3', 'C2H5OH', 'HCHO'], correct: 'B', mucDo: 'biet', chuyenDe: 'Ester – lipid' },
      { id: 'KT12C1-I-2', text: 'Thuỷ phân ester X trong NaOH thu được…', choices: ['a', 'b', 'c', 'd'], correct: 'C', mucDo: 'hieu', chuyenDe: 'Ester – lipid' },
    ] as TeacherExamSource['phanI'],
    phanII: [
      { id: 'KT12C1-II-1', text: 'Xét các phát biểu về chất béo', ideas: ['Chất béo là triester', 'Tan tốt trong nước', 'Nhẹ hơn nước', 'Có phản ứng xà phòng hoá'], correct: ['D', 'S', 'D', 'D'], mucDo: 'hieu', chuyenDe: 'Ester – lipid' },
    ] as unknown as TeacherExamSource['phanII'],
    phanIII: [
      { id: 'KT12C1-III-1', text: 'Tính khối lượng glycerol thu được khi xà phòng hoá 8,9 g tristearin.', correct: '0,92', mucDo: 'van_dung', chuyenDe: 'Ester – lipid' },
      { id: 'KT12C1-III-2', text: 'Trình bày cơ chế phản ứng xà phòng hoá ethyl acetate và giải thích vì sao phản ứng một chiều.', correct: '', chuyenDe: 'Ester – lipid' },
    ] as TeacherExamSource['phanIII'],
  },
]

const BUOI = { id: 'BH-1', ten: 'Buổi học 29/09 · 12A1', lop: '12A1', moLuc: '2026-09-29T11:00:00Z', hetHan: '2026-09-30T11:00:00Z', dongLuc: null, dangMo: true }
const EM = [
  { sbd: 'S1', hoTen: 'Nguyễn An' },
  { sbd: 'S2', hoTen: 'Trần Bảo' },
  { sbd: 'S3', hoTen: 'Lê Chi' },
]
const cv = (qid: string) => ({ qid, soLan: 1, dungLanDau: true, lanCuoi: '2026-09-10T03:00:00Z' })
let luot: any[] = []
let daKetThuc = false
function mock() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 3, sbd: ['S1', 'S2', 'S3'] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
    if (duong === '/gv/buoi-hoc')
      return {
        ok: true,
        du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat: EM.map((e) => ({ ...e, luc: '2026-09-29T11:01:00Z', cach: 'ma' })), siSo: 3, lopEm: EM.map((e) => ({ ...e, tenLop: '12A1' })) },
      }
    if (duong === '/gv/dau-gio') {
      const a = b.action
      if (a === 'xem') return { ok: true, du: { ok: true, daKetThuc, luot } }
      if (a === 'ung-vien') {
        const daGoi = new Set(luot.map((x) => x.sbd))
        return {
          ok: true,
          du: {
            ok: true,
            daGoi: [...daGoi],
            cauDaDung: luot.map((x) => x.qid),
            em: [
              // cả ba em đều đúng câu KT12C1-I-1 ⇒ app KHÔNG được giao trùng câu
              { sbd: 'S1', hoTen: 'Nguyễn An', cau: [cv('KT12C1-I-1'), cv('KT12C1-II-1')] },
              { sbd: 'S2', hoTen: 'Trần Bảo', cau: [cv('KT12C1-I-1'), cv('KT12C1-III-1'), cv('KHONG-CO-TRONG-KHO')] },
              { sbd: 'S3', hoTen: 'Lê Chi', cau: [cv('KT12C1-I-1'), cv('KT12C1-I-2')] },
            ].filter((e) => !daGoi.has(e.sbd)),
          },
        }
      }
      if (a === 'chot') {
        const so = Math.max(0, ...luot.map((x) => x.luot)) + 1
        const cap = b.cap as { sbd: string; qid: string; chuyenDe: string }[]
        luot = [...luot, ...cap.map((c) => ({ sbd: c.sbd, hoTen: EM.find((e) => e.sbd === c.sbd)!.hoTen, qid: c.qid, luot: so, chuyenDe: c.chuyenDe, trangThai: 'cho', chamLuc: null, daChuaLuc: null }))]
        return { ok: true, du: { ok: true, luot: so, nhan: cap, tuChoi: [], ds: luot } }
      }
      if (a === 'lich-su')
        return { ok: true, du: { ok: true, ketQua: (b.cap as any[]).map((c) => ({ ...c, chu: 'Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)', daChua: [] })) } }
      if (a === 'cham') {
        const x = luot.find((y) => y.sbd === b.sbd && y.qid === b.qid)
        if (x.trangThai === 'cho') x.trangThai = b.dat ? 'dat' : 'chua_dat'
        return { ok: true, du: { ok: true, ketQua: x.trangThai } }
      }
      if (a === 'da-chua') return { ok: true, du: { ok: true, luc: '2026-09-29T11:20:00.000Z' } }
      if (a === 'ket-thuc') {
        daKetThuc = true
        let n = 0
        luot = luot.map((x) => (x.trangThai === 'cho' ? (n++, { ...x, trangThai: 'bo' }) : x))
        return { ok: true, du: { ok: true, soBo: n, luot } }
      }
    }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}

beforeEach(() => {
  goi.mockReset()
  ghiLenBang.mockClear()
  luot = []
  daKetThuc = false
  mock()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  useCoHoa2.getState().dat(null)
})

describe('phần thuần phía app', () => {
  it('kho tra theo mã câu máy chủ; ứng viên không có trong kho / tự luận bị bỏ', () => {
    const k = cauTheoQid(KHO)
    expect(k.get('KT12C1-III-1')?.phan).toBe('III')
    expect(k.get('KT12C1-III-2')?.tuLuan).toBe(true)
    const [e] = locUngVienTheoKho([{ sbd: 'S', hoTen: '', cau: [cv('KT12C1-I-1'), cv('KHONG-CO'), cv('KT12C1-III-2')] }], k)
    expect(e!.cau.map((c) => c.qid)).toEqual(['KT12C1-I-1'])
  })
  it('tờ chiếu MỚI in dòng lịch sử câu trên thẻ tên', async () => {
    const k = cauTheoQid(KHO)
    const c = k.get('KT12C1-II-1')!
    const { html } = await dungToChieuDayHoc([c], new Map([[c.khoa, { sbd: 'S1', hoTen: 'Nguyễn An', lichSu: 'Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)' }]]), 'Kiểm tra đầu giờ · thử', 'abcdef0123456789abcdef01')
    expect(html).toContain('LÊN BẢNG — BẢN VẼ MỚI 28/09')
    expect(html).toContain('Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)')
    expect(html).toContain('Chất béo là triester')
  })
})

describe('thẻ Kiểm tra đầu giờ', () => {
  it('nằm cạnh thẻ Dạy học; bước Điểm danh bê nguyên (có mặt + thêm em tay)', async () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    render(<GoiLenBangScreen />)
    const the = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(the).toEqual(['Chiến dịch', 'Dạy học', 'Kiểm tra đầu giờ'])
    fireEvent.click(screen.getByRole('tab', { name: 'Kiểm tra đầu giờ' }))
    expect(await screen.findByRole('heading', { name: 'Kiểm tra đầu giờ', level: 1 })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Điểm danh' })).toBeTruthy()
    expect(await screen.findByText('Nguyễn An')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Thêm em chưa điểm danh được/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Chiếu mã điểm danh/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Chấm từng câu' })).toBeTruthy()
  })

  it('Chiếu lên bảng ⇒ 3 em, 3 câu KHÁC nhau, câu có trong kho; tờ chiếu mở; bảng chấm có lịch sử câu', async () => {
    render(<KiemTraDauGio />)
    const nut = await screen.findByRole('button', { name: 'Chiếu lên bảng' })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/dau-gio', expect.objectContaining({ action: 'chot' })))
    const cap = goi.mock.calls.find((c) => c[1]?.action === 'chot')![1].cap as { sbd: string; qid: string }[]
    expect(cap).toHaveLength(3)
    expect(new Set(cap.map((x) => x.qid)).size).toBe(3)
    expect(cap.every((x) => x.qid !== 'KHONG-CO-TRONG-KHO')).toBe(true)
    await waitFor(() => expect(document.querySelector('.lop-xem-phieu iframe')).toBeTruthy())
    expect((await screen.findAllByText(/Sai 20\/09 \(Ca\) · Đúng 22\/09 \(Đoàn\) · Đúng 25\/09 \(Bi-a\)/)).length).toBe(3)
    expect(screen.getByRole('heading', { name: 'Lượt 1' })).toBeTruthy()
  })

  it('Đạt / Chưa đạt đi qua /gv/dau-gio (KHÔNG ghiLenBang); Thầy đã chữa ⇒ da-chua; Kết thúc hỏi lại, em chưa chấm không ghi', async () => {
    luot = [
      { sbd: 'S1', hoTen: 'Nguyễn An', qid: 'KT12C1-I-1', luot: 1, chuyenDe: 'Ester – lipid', trangThai: 'cho', chamLuc: null, daChuaLuc: null },
      { sbd: 'S2', hoTen: 'Trần Bảo', qid: 'KT12C1-III-1', luot: 1, chuyenDe: 'Ester – lipid', trangThai: 'cho', chamLuc: null, daChuaLuc: null },
    ]
    render(<KiemTraDauGio />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nguyễn An: Đạt' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/dau-gio', expect.objectContaining({ action: 'cham', sbd: 'S1', qid: 'KT12C1-I-1', dat: true })))
    expect(await screen.findByText('Đã ghi: Đạt')).toBeTruthy()
    expect(ghiLenBang).not.toHaveBeenCalled()
    const dongBao = screen.getByText('SBD S2').closest('li')!
    fireEvent.click(within(dongBao).getByRole('checkbox', { name: /Thầy đã chữa/ }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/dau-gio', expect.objectContaining({ action: 'da-chua', sbd: 'S2' })))
    expect(await within(dongBao).findByText(/Thầy đã chữa · 29\/09/)).toBeTruthy()
    // Gọi thêm: nút đổi tên sau lượt đầu
    expect(screen.getByRole('button', { name: /Gọi thêm \(tối đa 6 em\)/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc kiểm tra' }))
    const hop = await screen.findByRole('alertdialog')
    expect(hop.textContent).toContain('1 em chưa chấm sẽ KHÔNG được ghi gì vào sổ học')
    fireEvent.click(within(hop).getByRole('button', { name: 'Kết thúc, không gọi thêm' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/dau-gio', expect.objectContaining({ action: 'ket-thuc' })))
    expect(await screen.findByText('Không chấm (đã kết thúc)')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Gọi thêm/ })).toBeNull()
    expect(goi.mock.calls.filter((c) => c[1]?.action === 'cham')).toHaveLength(1)
  })

  it('Gọi thêm: không gọi lại em đã gọi trong buổi', async () => {
    luot = [{ sbd: 'S1', hoTen: 'Nguyễn An', qid: 'KT12C1-I-1', luot: 1, chuyenDe: '', trangThai: 'dat', chamLuc: 'x', daChuaLuc: null }]
    render(<KiemTraDauGio />)
    const nut = await screen.findByRole('button', { name: /Gọi thêm/ })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/dau-gio', expect.objectContaining({ action: 'chot' })))
    const cap = goi.mock.calls.find((c) => c[1]?.action === 'chot')![1].cap as { sbd: string; qid: string }[]
    expect(cap.map((x) => x.sbd).sort()).toEqual(['S2', 'S3'])
    expect(cap.some((x) => x.qid === 'KT12C1-I-1')).toBe(false)
    expect(await screen.findByRole('heading', { name: 'Lượt 2' })).toBeTruthy()
  })
})
