// NGÂN HÀNG ĐỀ — DUYỆT HÀNG LOẠT.
//
// Đợt nạp 04-09 để lại 199 câu cờ đỏ, gần hết là câu tác giả đề không tô vàng
// đáp án nên máy tự giải. Thầy đã chốt "câu tự giải không cần duyệt", nhưng hạ
// cờ từng câu là 199 lần bấm.
//
// LUẬT SỐNG CÒN của nút này: KHÔNG đổi một đáp án nào. Đổi đáp án hàng loạt là
// âm thầm chấm lại điểm của cả lớp — đúng thứ tuyệt đối không được làm.
import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const saveExamSource = vi.fn(async () => {})
const showToast = vi.fn()
let KHO: TeacherExamSource[] = []

vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => '',
  loadTeacherSecret: async () => '',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  saveExamSource: (s: TeacherExamSource) => saveExamSource(s),
  saveScriptUrl: vi.fn(),
  saveTeacherSecret: vi.fn(),
  saveSessionTeacherBank: vi.fn(),
  deleteExamSource: vi.fn(),
  // Khối "Mật khẩu mở app" trong màn Cài đặt đọc hai hàm này lúc dựng.
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => ({ moi: [], capNhat: [], loi: [], canXem: [] }), capNhatCaDaMo: async () => 0, caDungDe: async () => [] }))
vi.mock('../src/lib/exam-api', () => ({ capNhatKeyBank: vi.fn(), luuDe: vi.fn(), xoaDe: vi.fn() }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast }),
}))

const { default: NganHangDeScreen, demChoQuyet, duyetDe } = await import('../src/screens/NganHangDeScreen')

/** Đề mẫu: 1 câu đề thiếu đáp án (máy giải C), 1 câu máy giải khác đề, 1 câu sạch. */
function deMau(maDe = '12-C1-B2'): TeacherExamSource {
  return {
    maDe,
    phanI: [
      { id: `${maDe}-I-1`, text: 'Câu thiếu đáp án', choices: ['a', 'b', 'c', 'd'], correct: 'C', loiGiaiTrangThai: 'thieu_dap_an', dapAnTuGiai: 'C' },
      { id: `${maDe}-I-2`, text: 'Câu nghi đề sai', choices: ['a', 'b', 'c', 'd'], correct: 'A', loiGiaiTrangThai: 'nghi_dap_an_sai', dapAnTuGiai: 'B' },
      { id: `${maDe}-I-3`, text: 'Câu sạch', choices: ['a', 'b', 'c', 'd'], correct: 'D', loiGiaiTrangThai: 'khop' },
    ] as never,
    phanII: [{ id: `${maDe}-II-1`, text: 'Ý đúng sai', ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'], loiGiaiTrangThai: 'lech_co_hd' }] as never,
    phanIII: [{ id: `${maDe}-III-1`, text: 'Trả lời ngắn', correct: '4,5', loiGiaiTrangThai: 'thieu_dap_an' }] as never,
  }
}

describe('duyetDe — thuần logic', () => {
  it('hạ cờ đúng những câu chờ quyết, KHÔNG đụng câu đã sạch', () => {
    const { next, n } = duyetDe(deMau(), 'ghi chú')
    expect(n).toBe(4)
    const moi = [...next.phanI, ...next.phanII, ...next.phanIII]
    expect(moi.every((q) => q.loiGiaiTrangThai === 'khop')).toBe(true)
    // Câu vốn đã sạch không bị ghi đè ghi chú.
    expect(next.phanI[2].ghiChuLoiGiai).toBeUndefined()
  })

  it('GIỮ NGUYÊN mọi đáp án — đây là điều làm nút này an toàn', () => {
    const goc = deMau()
    const { next } = duyetDe(goc, 'ghi chú')
    expect(next.phanI.map((q) => q.correct)).toEqual(['C', 'A', 'D'])
    expect(next.phanII[0].correct).toEqual(['D', 'S', 'D', 'S'])
    expect(next.phanIII[0].correct).toBe('4,5')
    // Câu máy giải khác đề vẫn giữ đáp án CỦA TÁC GIẢ ĐỀ, không nhảy sang B.
    expect(next.phanI[1].correct).toBe('A')
  })

  it('ghi lại dấu vết ai duyệt, để sau còn truy được', () => {
    const { next } = duyetDe(deMau(), 'Thầy duyệt hàng loạt ngày 04/09/2026')
    expect(next.phanI[0].ghiChuLoiGiai).toContain('duyệt hàng loạt')
  })

  it('duyệt lần hai không đổi gì thêm', () => {
    const { next } = duyetDe(deMau(), 'g')
    expect(duyetDe(next, 'g').n).toBe(0)
  })

  it('không đụng vào bản gốc truyền vào', () => {
    const goc = deMau()
    duyetDe(goc, 'g')
    expect(goc.phanI[0].loiGiaiTrangThai).toBe('thieu_dap_an')
  })
})

describe('demChoQuyet', () => {
  it('tách hai loại: đề thiếu đáp án và máy giải khác đề', () => {
    expect(demChoQuyet([deMau()])).toEqual({ thieu: 2, nghi: 2, tong: 4 })
  })
  it('cộng dồn nhiều đề', () => {
    expect(demChoQuyet([deMau('A'), deMau('B')]).tong).toBe(8)
  })
  it('kho rỗng thì về 0, không ném lỗi', () => {
    expect(demChoQuyet([])).toEqual({ thieu: 0, nghi: 0, tong: 0 })
  })
})

describe('màn Ngân hàng đề — nút duyệt hàng loạt', () => {
  it('có câu cờ đỏ thì hiện nút duyệt cả kho, kèm đúng số câu', async () => {
    KHO = [deMau('A'), deMau('B')]
    const { findByRole } = render(<NganHangDeScreen />)
    expect(await findByRole('button', { name: /Duyệt hết 8 câu/ })).toBeTruthy()
  })

  it('kho sạch thì KHÔNG hiện nút — không bày một nút bấm vào chẳng làm gì', async () => {
    const sach = deMau('C')
    for (const q of [...sach.phanI, ...sach.phanII, ...sach.phanIII]) q.loiGiaiTrangThai = 'khop'
    KHO = [sach]
    const { queryByRole, findByText } = render(<NganHangDeScreen />)
    await findByText(/1 đề/)
    expect(queryByRole('button', { name: /Duyệt hết/ })).toBeNull()
  })

  it('bấm là hỏi trước, nêu rõ hai loại câu và cam kết không chấm lại', async () => {
    KHO = [deMau('A')]
    const { findByRole, getByText } = render(<NganHangDeScreen />)
    fireEvent.click(await findByRole('button', { name: /Duyệt hết 4 câu(?! của đề này)/ }))
    expect(getByText(/Duyệt hàng loạt cả 1 đề/)).toBeTruthy()
    expect(document.body.textContent).toContain('máy tự giải')
    expect(document.body.textContent).toContain('giữ đáp án của tác giả đề')
    expect(document.body.textContent).toContain('không ca nào phải chấm lại')
    // Chưa xác nhận thì chưa ghi gì xuống máy.
    expect(saveExamSource).not.toHaveBeenCalled()
  })

  it('xác nhận thì ghi lại đề đã hạ cờ, đáp án nguyên vẹn', async () => {
    saveExamSource.mockClear()
    showToast.mockClear()
    KHO = [deMau('A')]
    const { findByRole, getByRole } = render(<NganHangDeScreen />)
    fireEvent.click(await findByRole('button', { name: /Duyệt hết 4 câu(?! của đề này)/ }))
    fireEvent.click(getByRole('button', { name: 'Duyệt hết' }))
    await waitFor(() => expect(saveExamSource).toHaveBeenCalledTimes(1))
    const ghi = saveExamSource.mock.calls[0][0] as unknown as TeacherExamSource
    expect([...ghi.phanI, ...ghi.phanII, ...ghi.phanIII].every((q) => q.loiGiaiTrangThai === 'khop')).toBe(true)
    expect(ghi.phanI.map((q) => q.correct)).toEqual(['C', 'A', 'D'])
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Đã duyệt 4 câu'), 'success'))
  })

  it('mỗi đề có nút duyệt riêng, không bắt duyệt cả kho', async () => {
    KHO = [deMau('A'), deMau('B')]
    const { findAllByRole } = render(<NganHangDeScreen />)
    const nut = await findAllByRole('button', { name: /Duyệt hết 4 câu của đề này/ })
    expect(nut).toHaveLength(2)
  })
})
