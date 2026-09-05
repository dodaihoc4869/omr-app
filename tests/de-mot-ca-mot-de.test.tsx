// MỘT CA MỘT ĐỀ (thầy chốt 05/09).
//
// Trước đây khối đề của ca xổ ra từng mã máy chia theo bài và theo phần:
// "Cả ca · 28 câu", "Mã 12-C1-B1-DS · 2 câu", "Mã 12-C1-B1-P2-TN · 2 câu"…
// Ca ghép 9 bài là 10 dòng nút, mỗi dòng 1–4 câu — không ai in riêng 2 câu.
//
// Nay đúng MỘT đề của cả ca. Ca cắt bớt cho mỗi em một bộ khác nhau thì thay
// vào đó là HỘP TRƯỢT tìm em theo tên hoặc số báo danh.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

vi.mock('../src/components/NutPhieuHtml', () => ({
  default: ({ nhanXem }: { nhanXem: string }) => <button type="button">{nhanXem}</button>,
}))

const { default: NutTaiDeCa } = await import('../src/components/NutTaiDeCa')

const kho = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource => ({
  maDe,
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i}`, text: 't', choices: ['a', 'b', 'c', 'd'], correct: 'A' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i}`, text: 't', ideas: ['a', 'b', 'c', 'd'], correct: 'DDDD' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i}`, text: 't', correct: '1' })) as never,
})

// Đúng hình dạng ca thầy chụp: một bài tách thành TN / DS / TLN, ghép nhiều bài.
const CA_GHEP = [kho('12-C1-B1-DS', 0, 2, 0), kho('12-C1-B1-P2-TN', 2, 0, 0), kho('12-C1-B1-P2-TLN', 0, 0, 2), kho('12-C1-B2-TN', 4, 0, 0), kho('12-C2-B4-TN', 2, 0, 0)]

const chung = { maCa: '984033', tenCa: 'Ca 12A1', showToast: vi.fn() }

describe('đề của ca — chỉ một, không tách theo mã', () => {
  it('ca ghép 5 mã vẫn chỉ ra MỘT nút xem đề, tổng đúng số câu', () => {
    const { container, getAllByText } = render(<NutTaiDeCa {...chung} banks={CA_GHEP} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('Đề cả ca · 12 câu')
    expect(getAllByText('Xem đề')).toHaveLength(1)
  })

  it('KHÔNG còn dòng "Mã <mã đề>" nào — đó là cách máy chia kho, không phải cách thầy nghĩ về buổi thi', () => {
    const { container } = render(<NutTaiDeCa {...chung} banks={CA_GHEP} />)
    const chu = container.textContent ?? ''
    for (const s of CA_GHEP) expect(chu).not.toContain(`Mã ${s.maDe}`)
    expect(chu).not.toContain('Cả ca ·')
  })

  it('ca một đề cũng chỉ một nút, không nhắc mã đề', () => {
    const { container, getAllByText } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 18, 4, 6)]} />)
    expect(container.textContent).toContain('Đề cả ca · 28 câu')
    expect(container.textContent).not.toContain('Mã 12-C1-B1')
    expect(getAllByText('Xem đề')).toHaveLength(1)
  })

  it('kho rỗng thì không dựng khối nào', () => {
    const { container } = render(<NutTaiDeCa {...chung} banks={[kho('trong', 0, 0, 0)]} />)
    expect(container.textContent).toBe('')
  })
})

describe('ca cắt bớt — hộp trượt tìm em theo tên và số báo danh', () => {
  const dsEm = [
    { sbd: '001', hoTen: 'Lê Minh Đức' },
    { sbd: '002', hoTen: 'Trần Thu Hà' },
    { sbd: '015', hoTen: 'Nguyễn Bảo Anh' },
  ]
  const props = { ...chung, banks: [kho('12-C1-B1', 55, 15, 15)], soCauCa: { I: 18, II: 4, III: 6 }, dsEm }

  it('nói rõ mỗi em một bộ, và vẫn còn đúng một nút cho cả kho', () => {
    const { container, getAllByText } = render(<NutTaiDeCa {...props} />)
    const chu = container.textContent ?? ''
    expect(chu).toContain('mỗi em một bộ khác nhau')
    expect(chu).toContain('Cả kho của ca · 85 câu')
    expect(getAllByText('Xem đề')).toHaveLength(1)
  })

  it('có ô tìm, gõ TÊN thì lọc đúng em', () => {
    const { container, getByLabelText } = render(<NutTaiDeCa {...props} />)
    fireEvent.change(getByLabelText('Tìm em theo số báo danh hoặc tên'), { target: { value: 'thu hà' } })
    const chu = container.textContent ?? ''
    expect(chu).toContain('Trần Thu Hà')
    expect(chu).not.toContain('Lê Minh Đức')
  })

  it('gõ SỐ BÁO DANH cũng ra đúng em', () => {
    const { container, getByLabelText } = render(<NutTaiDeCa {...props} />)
    fireEvent.change(getByLabelText('Tìm em theo số báo danh hoặc tên'), { target: { value: '015' } })
    const chu = container.textContent ?? ''
    expect(chu).toContain('Nguyễn Bảo Anh')
    expect(chu).not.toContain('Trần Thu Hà')
  })

  it('không em nào khớp thì nói thẳng, không để hộp rỗng', () => {
    const { container, getByLabelText } = render(<NutTaiDeCa {...props} />)
    fireEvent.change(getByLabelText('Tìm em theo số báo danh hoặc tên'), { target: { value: 'zzz' } })
    expect(container.textContent).toContain('Không có em nào khớp')
  })

  it('danh sách em nằm trong HỘP TRƯỢT có chặn chiều cao, không đổ dài cả màn', () => {
    const { container } = render(<NutTaiDeCa {...props} />)
    const hop = container.querySelector('[data-hop-em]') as HTMLElement | null
    expect(hop).not.toBeNull()
    expect(hop!.style.overflowY).toBe('auto')
    expect(hop!.style.maxHeight).toBeTruthy()
  })

  it('ca KHÔNG cắt bớt thì không hiện hộp chọn em — mọi em cùng một đề', () => {
    const { container } = render(<NutTaiDeCa {...chung} banks={[kho('12-C1-B1', 18, 4, 6)]} soCauCa={{ I: 18, II: 4, III: 6 }} dsEm={dsEm} />)
    expect(container.querySelector('[data-hop-em]')).toBeNull()
    expect(container.textContent).not.toContain('Đề riêng của một em')
  })
})
