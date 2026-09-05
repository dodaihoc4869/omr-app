// MÀN MỞ THI TÁCH LÀM HAI + HAI KHỐI TÍCH CHỌN.
// Đặc tả MOCAVAGOILENBANG.md mục 1 và 3.
//
// "Một nút Mở ca cho hai việc khác hẳn nhau là nguồn gốc mọi rối."
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'
import type { CaKiemChung, HoSoEm } from '../src/lib/ca-chan-doan'

const de = (maDe: string, nhom: string, nI: number, nII: number, nIII = 0): TeacherExamSource => ({
  maDe,
  nhom,
  nguon: `Nguồn ${maDe}`,
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i}`, text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i}`, text: 't', ideas: ['a', 'b', 'c', 'd'], correct: 'DDDD', chuyenDe: 'Ester' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i}`, text: 't', correct: '1', chuyenDe: 'Ester' })) as never,
})

const KHO = [de('12-C1-B2', '12 · C1 - Ester lipid', 20, 6), de('12-C2-B4', '12 · C2 - Carbohydrate', 18, 5), de('12-C3-B8', '12 · C3 - Hợp chất chứa N', 16, 4)]

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => [],
  hoSoEm: async () => ({ em: {}, chuyenDe: [], ca: [], caGanNhat: null, chuyenDeCaGanNhat: [], soCauSaiCaGanNhat: 0 }),
  publishSession: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => '',
  loadTeacherSecret: async () => '',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: vi.fn(),
  saveSessionTeacherBank: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => null }))
vi.mock('../src/components/NutDongBo', () => ({ default: () => null }))
vi.mock('../src/components/KhoiRutDe', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn(), classList: [], moChiTietCa: vi.fn() }),
}))

const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')
const { default: KhoiCaChanDoan } = await import('../src/components/KhoiCaChanDoan')

describe('MỤC 1 — màn mở thi tách làm hai', () => {
  it('mở màn ra là hỏi LOẠI CA trước, chưa soạn gì cả', () => {
    const { container, getByLabelText } = render(<ExamSetupScreen />)
    expect(getByLabelText('Mở ca kiểm tra')).toBeTruthy()
    expect(getByLabelText('Mở ca chẩn đoán')).toBeTruthy()
    // Chưa chọn thì không có ô lớp, không có cây đề.
    expect(container.querySelector('[role="tree"]')).toBeNull()
  })

  it('hai thẻ nói rõ khác nhau ở đâu: lấy điểm vs lấy dữ liệu', () => {
    const { getByLabelText } = render(<ExamSetupScreen />)
    expect(getByLabelText('Mở ca kiểm tra').textContent).toContain('lấy điểm')
    expect(getByLabelText('Mở ca kiểm tra').textContent).toContain('cả lớp một đề')
    expect(getByLabelText('Mở ca chẩn đoán').textContent).toContain('lấy dữ liệu')
    expect(getByLabelText('Mở ca chẩn đoán').textContent).toContain('mỗi em một bộ')
  })

  it('chọn KIỂM TRA → luồng cũ nguyên vẹn, có cây chọn đề', async () => {
    const { container, getByLabelText } = render(<ExamSetupScreen />)
    fireEvent.click(getByLabelText('Mở ca kiểm tra'))
    await waitFor(() => expect(container.querySelector('[role="tree"]')).toBeTruthy())
  })

  it('chọn CHẨN ĐOÁN → ra hai khối tích, và nói thẳng KHÔNG vào sổ điểm', async () => {
    const { container, getByLabelText } = render(<ExamSetupScreen />)
    fireEvent.click(getByLabelText('Mở ca chẩn đoán'))
    await waitFor(() => expect(container.textContent).toContain('ĐỀ MỚI'))
    expect(container.textContent).toContain('ĐỀ CŨ')
    expect(container.textContent).toContain('KHÔNG vào sổ điểm')
    expect(container.textContent).toContain('15 phút')
  })

  it('quay lại được để đổi loại ca', async () => {
    const { container, getByLabelText, getByText } = render(<ExamSetupScreen />)
    fireEvent.click(getByLabelText('Mở ca chẩn đoán'))
    await waitFor(() => expect(container.textContent).toContain('ĐỀ MỚI'))
    fireEvent.click(getByText('← Chọn loại ca'))
    expect(getByLabelText('Mở ca kiểm tra')).toBeTruthy()
  })
})

// ------------------------------------------------------------------ MỤC 3

const HO_SO: HoSoEm[] = [
  { sbd: '001', ten: 'Em A', chuyenDe: { Ester: { tiLeSai: 0.7, buoiChuaDo: 2, daiDang: true, chuaTungDo: false } }, daRa: [] },
  { sbd: '002', ten: 'Em B', chuyenDe: { Ester: { tiLeSai: 0.4, buoiChuaDo: 1, daiDang: false, chuaTungDo: false } }, daRa: [] },
]

function dung(moCa = vi.fn(async () => {})) {
  const r = render(<KhoiCaChanDoan nguon={KHO} dsEm={[{ sbd: '001', hoTen: 'Em A' }, { sbd: '002', hoTen: 'Em B' }]} layHoSo={async () => HO_SO} moCa={moCa} showToast={vi.fn()} />)
  return { ...r, moCa }
}

const dongTong = (c: HTMLElement) => (c.querySelector('[data-dong-tong]') as HTMLElement).textContent ?? ''

describe('MỤC 3 — hai khối tích chọn, bật tắt độc lập', () => {
  it('mở ra chưa tích nội dung nào thì chưa mở được ca — không đoán hộ thầy', () => {
    const { container } = dung()
    expect(dongTong(container)).toContain('Chưa tích khối nào')
  })

  it('tích một đề mới + một chương cũ → chế độ ca_hai: 8 câu · 11 phút · 14 tín hiệu', () => {
    const { container, getAllByRole } = dung()
    fireEvent.click(getAllByRole('radio')[0])
    fireEvent.click(getAllByRole('checkbox')[0])
    expect(dongTong(container)).toContain('8')
    expect(dongTong(container)).toContain('11')
    expect(dongTong(container)).toContain('14')
    expect(container.textContent).toContain('Chữa bài mới và ôn cũ')
  })

  it('khối ĐỀ MỚI chỉ tích được MỘT đề — tích đề thứ hai thì bỏ đề trước', () => {
    const { container, getAllByRole } = dung()
    const radio = getAllByRole('radio')
    expect(radio).toHaveLength(KHO.length)
    fireEvent.click(radio[0])
    expect(radio[0].getAttribute('aria-checked')).toBe('true')
    fireEvent.click(radio[1])
    expect(radio[0].getAttribute('aria-checked')).toBe('false')
    expect(radio[1].getAttribute('aria-checked')).toBe('true')
    expect(getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  })

  it('khối ĐỀ CŨ tích được NHIỀU chương', () => {
    const { getAllByRole } = dung()
    const ox = getAllByRole('checkbox')
    expect(ox.length).toBeGreaterThanOrEqual(3)
    fireEvent.click(ox[0])
    fireEvent.click(ox[1])
    expect(getAllByRole('checkbox').filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(2)
  })

  it('chỉ đề mới → chi_moi, vẫn 8 câu · 11 phút · 14 tín hiệu', () => {
    const { container, getAllByRole, getByLabelText } = dung()
    fireEvent.click(getAllByRole('radio')[0]) // có đề mới
    fireEvent.click(getByLabelText('Bật khối đề cũ')) // tắt đề cũ
    expect(dongTong(container)).toContain('8')
    expect(dongTong(container)).toContain('14')
    expect(container.textContent).toContain('lõi chung dày hơn')
  })

  it('chỉ đề cũ → chi_cu, 7 câu · 10 phút · 13 tín hiệu, đo sâu hai chuyên đề', () => {
    const { container, getAllByRole, getByLabelText } = dung()
    fireEvent.click(getAllByRole('checkbox')[0]) // có chương cũ
    fireEvent.click(getByLabelText('Bật khối đề mới')) // tắt đề mới
    expect(dongTong(container)).toContain('7')
    expect(dongTong(container)).toContain('13')
    expect(container.textContent).toContain('đo sâu hai chuyên đề')
  })

  it('bỏ tích cả hai → nút Mở ca TẮT, dòng tổng nói chưa tích gì', () => {
    const { container, getByLabelText, getByText } = dung()
    fireEvent.click(getByLabelText('Bật khối đề mới'))
    fireEvent.click(getByLabelText('Bật khối đề cũ'))
    expect(dongTong(container)).toContain('Chưa tích khối nào')
    expect((getByText('Mở ca') as HTMLButtonElement).disabled).toBe(true)
  })

  it('Xem trước một em ra bảng câu KÈM LÝ DO chọn từng câu', async () => {
    const { container, getAllByRole, getByText } = dung()
    fireEvent.click(getAllByRole('radio')[0])
    fireEvent.click(getAllByRole('checkbox')[0])
    fireEvent.click(getByText('Xem trước một em'))
    await waitFor(() => expect(container.textContent).toContain('Xem trước'))
    expect(container.textContent).toContain('lõi chung')
    expect(container.textContent).toContain('tín hiệu')
  })

  it('bấm Mở ca thì giao bộ đã rút: lõi chung dùng chung, bộ riêng theo em', async () => {
    const moCa = vi.fn(async (_k: CaKiemChung) => {})
    const { getAllByRole, getByText } = dung(moCa)
    fireEvent.click(getAllByRole('radio')[0])
    fireEvent.click(getAllByRole('checkbox')[0])
    fireEvent.click(getByText('Mở ca'))
    await waitFor(() => expect(moCa).toHaveBeenCalled())
    const ket = moCa.mock.calls[0][0]
    expect(ket.loiChung).toHaveLength(3)
    expect(Object.keys(ket.theoEm)).toEqual(['001', '002'])
    // Lõi chung KHÔNG được nằm trong bộ riêng của bất kỳ em nào.
    const chung = new Set(ket.loiChung.map((c) => c.id))
    for (const r of Object.values(ket.theoEm)) expect(r.some((c) => chung.has(c.id))).toBe(false)
  })
})
