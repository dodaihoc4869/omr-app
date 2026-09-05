// MÀN GỌI LÊN BẢNG — đặc tả mục 4.7. Kiểm bằng render, không chụp màn hình.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import KhoiGoiLenBang from '../src/components/KhoiGoiLenBang'
import { mergeKeepAnswers, type TeacherExamSource } from '../src/data/examContent'
import type { LuotDaCham } from '../src/lib/phan-cau-len-bang'

vi.mock('../src/store/appStore', () => ({ useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ showToast: vi.fn() }) }))

const q = (id: string, correct: 'A' | 'B' | 'C' | 'D', chuyenDe: string, sao: 0 | 1 | 2) => ({
  id,
  text: `Đề ${id}`,
  choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct,
  chuyenDe,
  canChua: { sao, dk: [], ly_do: '', bay: null },
})

const bankTu = (ds: ReturnType<typeof q>[]) =>
  mergeKeepAnswers([{ maDe: 'CA', phanI: ds, phanII: [], phanIII: [] } as unknown as TeacherExamSource])

const traLoi = (m: Record<string, string>) => ({ phanI: m, phanII: {}, phanIII: {} })
const nop = (sbd: string, hoTen: string, m: Record<string, string>): LuotDaCham => ({ sbd, hoTen, trangThai: 'da_nop', dapAn: traLoi(m) as never })

describe('KhoiGoiLenBang', () => {
  const ds = [q('c1', 'A', 'pH', 2), q('c2', 'B', 'Ester', 1), q('c3', 'C', 'pH', 0)]
  const bank = bankTu(ds)

  it('mỗi dòng ghi rõ SỐ CÂU, sao, chuyên đề, tên em và VÌ SAO chọn em ấy', () => {
    const { container } = render(
      <KhoiGoiLenBang
        maCa="111111"
        tenCa="11A1 · 05/09"
        bank={bank as never}
        luot={[nop('001', 'Lê Minh Đức', { c1: 'B', c2: 'B', c3: 'C' }), nop('002', 'Trần Thu Hà', { c1: 'B', c2: 'D', c3: 'C' })]}
      />,
    )
    const t = container.textContent ?? ''
    expect(t).toContain('Câu 1')
    expect(t).toContain('★★')
    expect(t).toContain('pH')
    expect(t).toContain('Lê Minh Đức')
    expect(t).toContain('sai câu này')
    expect(t).toContain('lớp đúng 0%')
  })

  it('câu cả lớp làm đúng nằm ở khối CHỈ ĐỌC ĐÁP ÁN, không gán cho ai', () => {
    const { container } = render(
      <KhoiGoiLenBang maCa="111111" tenCa="11A1" bank={bank as never} luot={[nop('001', 'A', { c1: 'B', c2: 'B', c3: 'C' }), nop('002', 'B', { c1: 'B', c2: 'D', c3: 'C' })]} />,
    )
    const t = container.textContent ?? ''
    expect(t).toContain('CHỈ ĐỌC ĐÁP ÁN')
    expect(t).toContain('1 câu chỉ đọc đáp án')
  })

  it('dòng nhắc hiểu nhầm chung hiện khi cả lớp cùng chọn một phương án sai', () => {
    const { container } = render(
      <KhoiGoiLenBang maCa="111111" tenCa="11A1" bank={bank as never} luot={[nop('001', 'A', { c1: 'B', c2: 'B', c3: 'C' }), nop('002', 'B', { c1: 'B', c2: 'B', c3: 'C' })]} />,
    )
    expect(container.textContent).toContain('cùng chọn B — hiểu nhầm chung')
  })

  it('PHÉP KIỂM 22 — hết câu thì nút gọi lượt sau ẨN HẲN', () => {
    // 2 câu đáng chữa, 3 em → một lượt là xong.
    const { queryByText } = render(
      <KhoiGoiLenBang
        maCa="111111"
        tenCa="11A1"
        bank={bank as never}
        luot={[nop('001', 'A', { c1: 'B', c2: 'B', c3: 'C' }), nop('002', 'B', { c1: 'B', c2: 'D', c3: 'C' }), nop('003', 'C', { c1: 'B', c2: 'D', c3: 'C' })]}
      />,
    )
    expect(queryByText(/GỌI LƯỢT/)).toBeNull()
  })

  it('PHÉP KIỂM 23 — còn câu thì hiện nút, bấm vào ra lượt tiếp', () => {
    // 3 câu đáng chữa, 2 em có mặt → lượt 1 hai câu, còn 1 câu.
    const ds2 = [q('c1', 'A', 'pH', 2), q('c2', 'B', 'Ester', 2), q('c3', 'C', 'pH', 2)]
    const { getByText, container } = render(
      <KhoiGoiLenBang maCa="111111" tenCa="11A1" bank={bankTu(ds2) as never} luot={[nop('001', 'A', { c1: 'B', c2: 'D', c3: 'A' }), nop('002', 'B', { c1: 'B', c2: 'D', c3: 'A' })]} />,
    )
    expect(container.textContent).toContain('Còn 1 câu chưa phân')
    fireEvent.click(getByText(/GỌI LƯỢT 2/))
    expect(container.textContent).toContain('LƯỢT 2')
    expect(container.textContent).not.toContain('Còn 1 câu chưa phân')
  })

  it('Đổi em khác giữ nguyên câu, chuyển sang em kia', () => {
    const ds1 = [q('c1', 'A', 'pH', 2)]
    const { getAllByTitle, container } = render(
      <KhoiGoiLenBang maCa="111111" tenCa="11A1" bank={bankTu(ds1) as never} luot={[nop('001', 'An', { c1: 'B' }), nop('002', 'Bình', { c1: 'A' })]} />,
    )
    expect(container.textContent).toContain('An')
    fireEvent.click(getAllByTitle('Giữ nguyên câu, đổi sang em khác')[0])
    const t = container.textContent ?? ''
    expect(t).toContain('Câu 1')
    expect(t).toContain('Bình')
  })

  it('chưa em nào nộp thì nói thẳng, không dựng bảng rỗng', () => {
    const { container } = render(<KhoiGoiLenBang maCa="111111" tenCa="11A1" bank={bank as never} luot={[{ sbd: '001', hoTen: 'A', trangThai: 'dang_lam', dapAn: null }]} />)
    expect(container.textContent).toContain('Chưa em nào nộp bài')
  })
})
