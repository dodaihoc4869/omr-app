// GỌI LÊN BẢNG — THẺ "BUỔI CHỮA TỐI NAY (ĐÃ XẾP SẴN)" ở đầu mục 2 (B6, Code 1, 21/09/2026; Boss duyệt).
// Khoá: lệnh chưa có / lỗi / không khớp kho ⇒ thẻ ẨN và luồng cũ y nguyên; có đề xuất ⇒ thẻ hiện số thật; "Tự chọn lại" ẩn thẻ; "Mở buổi chữa này" mở ca gần nhất rồi điền sẵn đúng các câu máy đề xuất
// (cách "tự chọn"), và MỌI thao tác chọn tay của thầy bỏ giới hạn ấy.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const mocks = vi.hoisted(() => ({ goiLenh: vi.fn(), showToast: vi.fn(), danhSachCa: vi.fn() }))

/** Kho: một tờ `T` có 6 câu trắc nghiệm hợp lệ (id `T-I-<số>` ⇒ mã máy chủ `T-I-<số>`). */
const KHO: TeacherExamSource[] = [
  {
    maDe: 'T',
    nhom: '12 · C1 - Ester lipid',
    nguon: 'Bài 1. Ester',
    phanI: Array.from({ length: 6 }, (_, i) => ({ id: `T-I-${i + 1}`, text: `Câu ${i + 1}: ester nào thuỷ phân trong kiềm?`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', dang: { ma: 'ESTE.THUY_PHAN', ten: 'Thuỷ phân ester' }, canChua: { sao: 2 } })),
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

const THAN_TRA = {
  ok: true,
  ngay: '2026-09-22',
  lop: '',
  soEmCoSo3Ngay: 24,
  dangCaLopYeu: [{ lop: '12A1', siSo: 24, dang: [{ ma: 'ESTE.THUY_PHAN', ten: 'Thuỷ phân ester', soEmYeu: 9 }] }],
  dangBoNao: [],
  cauSaiNhieu: [
    { qid: 'T-I-1', maDe: 'T', phan: 'I', dang: 'ESTE.THUY_PHAN', soEmLam: 20, soEmSai: 9, tiLeSai: 0.45, loi: true, emSai: [{ sbd: 'S1', hoTen: 'Em Một', lop: '12A1' }] },
    { qid: 'T-I-2', maDe: 'T', phan: 'I', dang: 'ESTE.THUY_PHAN', soEmLam: 20, soEmSai: 8, tiLeSai: 0.4, emSai: [{ sbd: 'S2', hoTen: 'Em Hai', lop: '12A1' }] },
  ],
  dongBoNao: [],
}

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (...a: unknown[]) => mocks.goiLenh(...a) }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => [],
  danhSachCa: (...a: unknown[]) => mocks.danhSachCa(...a),
  chiTietCa: async () => ({
    ca: {},
    keyBank: { phanI: [{ id: 'CA-q1', text: 'Câu của ca', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' }], phanII: [], phanIII: [] },
    luot: [
      { sbd: 'S1', hoTen: 'Em Một', lanThu: 1, trangThai: 'da_nop', dapAn: { phanI: { 'CA-q1': 'B' }, phanII: {}, phanIII: {} }, giayCau: null },
      { sbd: 'S2', hoTen: 'Em Hai', lanThu: 1, trangThai: 'da_nop', dapAn: { phanI: { 'CA-q1': 'A' }, phanII: {}, phanIII: {} }, giayCau: null },
    ],
  }),
  qidDaLam: async () => ({}),
  hoSoEm: async () => ({ em: { hoTen: 'Em' }, chuyenDe: [] }),
  lichSuLenBang: async () => ({ soNgay: 0, theoEm: {} }),
  ghiLenBang: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadCauHinhMayChu: async () => ({}),
  loadExamSources: async () => KHO,
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
  docKhoChuaCa: async () => undefined,
  docBuoiChua: async () => null,
  luuBuoiChua: async () => {},
  xoaBuoiChua: async () => {},
  docMauGiayThuc: async () => [],
  themMauGiayThuc: async () => {},
  loadSessionTeacherBank: async () => undefined,
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/components/TheCau', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: mocks.showToast }),
}))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')

const CA = { maCa: 'CA1', tenCa: 'Ca kiểm tra 1', lop: '12A1', loai: 'thi', trangThai: 'dong', lenBang: true, moLuc: '2026-09-21T02:00:00.000Z', daNop: 2, daVao: 2 }

beforeEach(() => {
  mocks.goiLenh.mockReset()
  mocks.showToast.mockReset()
  mocks.danhSachCa.mockReset()
  mocks.danhSachCa.mockResolvedValue([CA])
})

const the = (c: HTMLElement) => c.querySelector('[data-buoi-xep-san]')
const choKho = (c: HTMLElement) => waitFor(() => expect(c.textContent).toContain('Khối 12'))

describe('thẻ ẨN — luồng cũ y nguyên', () => {
  it('máy chủ chưa có lệnh (404) ⇒ không thẻ, không báo lỗi đỏ; mục 2 và hộp tích đề vẫn như cũ', async () => {
    mocks.goiLenh.mockResolvedValue({ ok: false, loai: 'chua_co_lenh', chu: 'chưa có' })
    const { container } = render(<GoiLenBangScreen />)
    await choKho(container)
    await waitFor(() => expect(mocks.goiLenh).toHaveBeenCalled())
    expect(mocks.goiLenh.mock.calls[0][0]).toBe('/gv/buoi-chua-de-xuat')
    expect(the(container)).toBeNull()
    expect(container.textContent).not.toContain('Buổi chữa tối nay')
    expect(container.textContent).toContain('2. Câu để chữa lấy ở đâu')
    expect(container.textContent).toContain('Đã chọn: 0 câu')
    expect(container.textContent).not.toMatch(/chưa có lệnh|Máy chủ chưa có lệnh Buổi chữa/) // không lộ câu lỗi ra màn
  })
  it('lệnh lỗi mạng / thân sai dạng / lệnh ném lỗi ⇒ không thẻ', async () => {
    for (const kq of [{ ok: false, loai: 'mang', chu: 'x' }, { ok: true, du: { ok: false } }]) {
      mocks.goiLenh.mockReset()
      mocks.goiLenh.mockResolvedValue(kq)
      const { container, unmount } = render(<GoiLenBangScreen />)
      await choKho(container)
      await waitFor(() => expect(mocks.goiLenh).toHaveBeenCalled())
      expect(the(container)).toBeNull()
      unmount()
    }
    mocks.goiLenh.mockReset()
    mocks.goiLenh.mockRejectedValue(new Error('sập'))
    const { container } = render(<GoiLenBangScreen />)
    await choKho(container)
    expect(the(container)).toBeNull()
  })
  it('lệnh có dữ liệu nhưng KHÔNG câu nào khớp kho trên máy ⇒ thẻ ẩn', async () => {
    mocks.goiLenh.mockResolvedValue({ ok: true, du: { ...THAN_TRA, dangCaLopYeu: [], cauSaiNhieu: [{ qid: 'KHAC-I-1', dang: 'X', soEmLam: 20, soEmSai: 9, emSai: [] }] } })
    const { container } = render(<GoiLenBangScreen />)
    await choKho(container)
    await waitFor(() => expect(mocks.goiLenh).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 30))
    expect(the(container)).toBeNull()
  })
})

describe('dòng báo "câu chưa tra được nội dung đề" (tờ chiếu)', () => {
  it('0 câu thiếu ⇒ KHÔNG hiện dòng báo: buổi xếp sẵn dùng câu có trong kho nên mọi câu tra được', async () => {
    mocks.goiLenh.mockResolvedValue({ ok: true, du: THAN_TRA })
    const { container, getByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(the(container)).not.toBeNull())
    await choKho(container)
    fireEvent.click(getByRole('button', { name: 'Mở buổi chữa này' }))
    await waitFor(() => expect(container.querySelector('[data-dang-dung-xep-san]')).not.toBeNull(), { timeout: 4000 })
    // chờ buổi được xếp (tự chạy sau khi điền câu) rồi kiểm dòng báo
    await waitFor(() => expect(container.textContent).toMatch(/em lên bảng/), { timeout: 6000 })
    expect(container.querySelector('[data-thieu-noi-dung]')).toBeNull()
    expect(container.textContent).not.toContain('chưa tra được nội dung đề')
  })
})

describe('thẻ HIỆN với số thật', () => {
  beforeEach(() => mocks.goiLenh.mockResolvedValue({ ok: true, du: THAN_TRA }))

  it('hiện ở ĐẦU mục 2 (trước tiêu đề "2. Câu để chữa lấy ở đâu"): 2 câu · khoảng N phút · 2 em cần chú ý, lý do bằng số', async () => {
    const { container } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(the(container)).not.toBeNull())
    const t = the(container) as HTMLElement
    expect(t.textContent).toContain('Buổi chữa tối nay (đã xếp sẵn)')
    expect(t.textContent).toContain('2 câu để chữa')
    expect(t.textContent).toMatch(/khoảng \d+ phút/)
    expect(t.textContent).toContain('2 em cần chú ý')
    expect(t.textContent).toContain('Dạng em đang yếu: Thuỷ phân ester — 9/24 em')
    expect(t.textContent).toContain('Em cần chú ý: Em Một, Em Hai')
    // đứng TRƯỚC tiêu đề mục 2
    const thuTuThe = (container.textContent ?? '').indexOf('Buổi chữa tối nay (đã xếp sẵn)')
    expect(thuTuThe).toBeGreaterThan(-1)
    expect(thuTuThe).toBeLessThan((container.textContent ?? '').indexOf('2. Câu để chữa lấy ở đâu'))
  })

  it('"Tự chọn lại" ẩn thẻ; hộp tích đề và mục 2 vẫn dùng được y như cũ', async () => {
    const { container, getByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(the(container)).not.toBeNull())
    fireEvent.click(getByRole('button', { name: 'Tự chọn lại' }))
    expect(the(container)).toBeNull()
    expect(container.textContent).toContain('2. Câu để chữa lấy ở đâu')
    expect(container.textContent).toContain('Đã chọn: 0 câu')
  })

  it('"Mở buổi chữa này" khi CHƯA có ca nào ⇒ nói thật (không mở gì), thẻ vẫn còn', async () => {
    mocks.danhSachCa.mockResolvedValue([])
    const { container, getByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(the(container)).not.toBeNull())
    fireEvent.click(getByRole('button', { name: 'Mở buổi chữa này' }))
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalled())
    expect(String(mocks.showToast.mock.calls[0][0])).toMatch(/Chưa có ca nào/)
    expect(the(container)).not.toBeNull()
    expect(container.querySelector('[data-dang-dung-xep-san]')).toBeNull()
  })

  it('"Mở buổi chữa này" khi có ca: mở ca gần nhất, chọn cách "tự chọn" và ĐÚNG 2 câu đề xuất (ghi chú "Đang dùng 2 câu…"); chọn tay lại một đề ⇒ bỏ giới hạn', async () => {
    const { container, getByRole, getAllByRole } = render(<GoiLenBangScreen />)
    await waitFor(() => expect(the(container)).not.toBeNull())
    await choKho(container)
    fireEvent.click(getByRole('button', { name: 'Mở buổi chữa này' }))
    await waitFor(() => expect(container.querySelector('[data-dang-dung-xep-san]')).not.toBeNull(), { timeout: 4000 })
    expect(container.querySelector('[data-dang-dung-xep-san]')?.textContent).toContain('Đang dùng 2 câu của buổi chữa xếp sẵn')
    expect(getByRole('radio', { name: 'Tôi tự chọn bài để chữa' }).getAttribute('aria-checked')).toBe('true')
    // thầy tích tay một đề ⇒ giới hạn biến mất, quay về cách cũ
    for (let i = 0; i < 4; i++) for (const b of [...container.querySelectorAll('button[aria-expanded="false"]')] as HTMLElement[]) fireEvent.click(b) // mở hết cây như test chọn nhiều đề
    const la = getAllByRole('checkbox').filter((e) => /^Trắc nghiệm/.test(e.textContent ?? ''))
    expect(la.length).toBeGreaterThan(0)
    fireEvent.click(la[0])
    await waitFor(() => expect(container.querySelector('[data-dang-dung-xep-san]')).toBeNull())
    expect(container.textContent).toContain('Đã chọn: 6 câu')
  })
})
