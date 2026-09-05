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
    // Thầy chốt 05/09 chiều: ca chẩn đoán GHI DỮ LIỆU ĐẦY ĐỦ như ca kiểm tra
    // để còn gửi báo cáo hằng ngày cho phụ huynh — không còn "không vào sổ".
    expect(container.textContent).toContain('ghi đầy đủ như ca kiểm tra')
    expect(container.textContent).toContain('15 phút')
  })

  it('quay lại được để đổi loại ca', async () => {
    const { container, getByLabelText, getByText } = render(<ExamSetupScreen />)
    fireEvent.click(getByLabelText('Mở ca chẩn đoán'))
    await waitFor(() => expect(container.textContent).toContain('ĐỀ MỚI'))
    fireEvent.click(getByText('← Chọn loại ca'))
    expect(getByLabelText('Mở ca kiểm tra')).toBeTruthy()
  })

  it('tiêu đề nói đúng loại ca đang soạn', async () => {
    const { container, getByLabelText } = render(<ExamSetupScreen />)
    fireEvent.click(getByLabelText('Mở ca chẩn đoán'))
    await waitFor(() => expect(container.textContent).toContain('ĐỀ MỚI'))
    expect(container.querySelector('h1')?.textContent).toBe('Mở ca chẩn đoán')
  })
})

// ------------------------------------------------------------------ MỤC 3
// THẦY CHỐT KHÁC ĐẶC TẢ (05/09 chiều): cả HAI khối đều tích được tới từng bài
// và từng dạng, y như màn Mở ca kiểm tra — không còn "đề mới chỉ một đề".

const HO_SO: HoSoEm[] = [
  { sbd: '001', ten: 'Em A', chuyenDe: { Ester: { tiLeSai: 0.7, buoiChuaDo: 2, daiDang: true, chuaTungDo: false } }, daRa: [] },
  { sbd: '002', ten: 'Em B', chuyenDe: { Ester: { tiLeSai: 0.4, buoiChuaDo: 1, daiDang: false, chuaTungDo: false } }, daRa: [] },
]

/** Mở màn Mở ca, chọn CHẨN ĐOÁN, chờ hai cây hiện ra. */
async function moChanDoan() {
  const r = render(<ExamSetupScreen />)
  fireEvent.click(r.getByLabelText('Mở ca chẩn đoán'))
  await waitFor(() => expect(r.container.textContent).toContain('ĐỀ MỚI'))
  return r
}

const dongTong = (c: HTMLElement) => (c.querySelector('[data-dong-tong]') as HTMLElement)?.textContent ?? ''
const cayCua = (c: HTMLElement, khoi: 'moi' | 'cu') => c.querySelector(`[data-khoi="${khoi}"]`) as HTMLElement

/** Mở hết cây của một khối rồi tích dòng khớp chữ. */
function tichTrongCay(cay: HTMLElement, chu: RegExp) {
  for (let i = 0; i < 4; i++) {
    const nut = [...cay.querySelectorAll('button[aria-expanded="false"]')] as HTMLElement[]
    if (!nut.length) break
    for (const b of nut) fireEvent.click(b)
  }
  const dong = [...cay.querySelectorAll('button')].filter((b) => chu.test(b.textContent ?? ''))
  if (!dong.length) throw new Error(`không thấy dòng khớp ${chu}`)
  fireEvent.click(dong[0])
  return dong[0]
}

describe('MỤC 3 — hai khối, mỗi khối là cây bốn tầng', () => {
  it('mỗi khối có CÂY riêng, tích được tới tầng dạng TN · ĐS · TLN', async () => {
    const { container } = await moChanDoan()
    expect(cayCua(container, 'moi')).toBeTruthy()
    expect(cayCua(container, 'cu')).toBeTruthy()
    const cay = cayCua(container, 'moi')
    for (let i = 0; i < 4; i++) {
      const nut = [...cay.querySelectorAll('button[aria-expanded="false"]')] as HTMLElement[]
      if (!nut.length) break
      for (const b of nut) fireEvent.click(b)
    }
    // Tầng dạng: mã đã tách theo phần.
    expect(cay.textContent).toMatch(/12-C1-B2-(TN|DS)/)
  })

  it('ĐỀ MỚI tích được NHIỀU mã, không còn giới hạn một đề', async () => {
    const { container } = await moChanDoan()
    const cay = cayCua(container, 'moi')
    tichTrongCay(cay, /12-C1-B2-TN/)
    tichTrongCay(cay, /12-C1-B2-DS/)
    expect(container.textContent).toContain('2 mã')
  })

  it('tích ĐỀ MỚI và ĐỀ CŨ ở hai cây độc lập → chế độ ca_hai', async () => {
    const { container } = await moChanDoan()
    tichTrongCay(cayCua(container, 'moi'), /12-C1-B2-TN/)
    tichTrongCay(cayCua(container, 'cu'), /12-C2-B4-TN/)
    expect(dongTong(container)).toContain('8')
    expect(dongTong(container)).toContain('14')
    expect(container.textContent).toContain('Chữa bài mới và ôn cũ')
  })

  it('chỉ tích ĐỀ CŨ → chi_cu: 7 câu · 13 tín hiệu, đo sâu hai chuyên đề', async () => {
    const { container } = await moChanDoan()
    tichTrongCay(cayCua(container, 'cu'), /12-C2-B4-TN/)
    expect(dongTong(container)).toContain('7')
    expect(dongTong(container)).toContain('13')
    expect(container.textContent).toContain('đo sâu hai chuyên đề')
  })

  it('chỉ tích ĐỀ MỚI → chi_moi: 8 câu · 14 tín hiệu, lõi chung dày hơn', async () => {
    const { container } = await moChanDoan()
    tichTrongCay(cayCua(container, 'moi'), /12-C1-B2-TN/)
    expect(dongTong(container)).toContain('8')
    expect(container.textContent).toContain('lõi chung dày hơn')
  })

  it('chưa tích gì thì dòng tổng nói thẳng, không đoán hộ thầy', async () => {
    const { container } = await moChanDoan()
    expect(dongTong(container)).toContain('Chưa tích khối nào')
  })

  it('tắt một khối thì cây của khối đó biến mất, chế độ tự đổi', async () => {
    const { container, getByLabelText } = await moChanDoan()
    tichTrongCay(cayCua(container, 'moi'), /12-C1-B2-TN/)
    tichTrongCay(cayCua(container, 'cu'), /12-C2-B4-TN/)
    fireEvent.click(getByLabelText('Bật khối đề cũ'))
    expect(cayCua(container, 'cu')).toBeNull()
    expect(container.textContent).toContain('lõi chung dày hơn')
  })
})

describe('BẢO MẬT VÀ DỮ LIỆU — hai loại ca giống hệt nhau (thầy chốt 05/09)', () => {
  it('ca chẩn đoán vẫn có ĐỦ ô lớp, thời gian, công bố điểm, chống gian lận, phạm vi', async () => {
    const { container } = await moChanDoan()
    const t = container.textContent ?? ''
    expect(t).toContain('Lớp & thời gian')
    expect(t).toContain('Rời màn hình khi làm bài')
    expect(t).toContain('Ai được vào ca này')
    expect(t).toContain('Không công bố trên máy em')
  })

  it('nói thẳng dữ liệu vẫn ghi đầy đủ để gửi phụ huynh', async () => {
    const { container } = await moChanDoan()
    expect(container.textContent).toContain('ghi đầy đủ như ca kiểm tra')
  })

  it('màn Rút đề của ca kiểm tra KHÔNG chen vào ca chẩn đoán', async () => {
    const { container } = await moChanDoan()
    expect(container.textContent).not.toContain('Bộ câu ra đề')
  })
})
