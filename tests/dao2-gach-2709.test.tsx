// GAME HÓA 2.0 · BÙA TRỢ GIẢNG Phần I: máy chủ gửi `goiY.gach` (2 phương án SAI) ⇒ hai phương án ấy chữ gạch, ô tối "cháy thành tro",
// không bấm được; các phương án còn lại chọn bình thường. Không có `goiY` ⇒ không gạch gì. Đáp án không có trên máy trước khi chốt.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { TheCauAi } from '../src/game/than-thu-v2/dao2/TrongAi'
import { docGoiY } from '../src/game/than-thu-v2/dao2/dao2-core'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'

afterEach(cleanup)
const cau = (them: Partial<CauDao2> = {}): CauDao2 => ({ qid: 'q1', maDe: 'DE', version: '1', group: 'g1', phan: 'I', text: 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng NaOH dư. Khối lượng muối là', choices: ['4,1 gam', '8,2 gam', '9,6 gam', '6,8 gam'], ideas: [], hinhAnh: [], dang: 'D', tenDang: 'Thuỷ phân ester', mucDo: 'hieu', sao: 1, kienThuc: [], vai: 'on_lai', ...them })
const nutPa = (chu: string) => screen.getByRole('button', { name: new RegExp(`^${chu}\\.`) }) as HTMLButtonElement

describe('Phần I · gạch 2 phương án (Bùa Trợ giảng)', () => {
  it('A và D bị gạch: data-gach + disabled + aria-disabled; bấm A không chọn, bấm B chọn; dòng Bùa nói đúng phương án bị gạch', () => {
    const chon = vi.fn()
    const { container } = render(<div className="dao dao2"><TheCauAi cau={cau({ goiY: { gach: ['D', 'A'] } })} stt={3} traLoi="" khoa={false} onTraLoi={chon} /></div>)
    const a = nutPa('A'), b = nutPa('B'), c = nutPa('C'), d = nutPa('D')
    for (const n of [a, d]) { expect(n.hasAttribute('data-gach')).toBe(true); expect(n.disabled).toBe(true); expect(n.getAttribute('aria-disabled')).toBe('true') }
    for (const n of [b, c]) { expect(n.hasAttribute('data-gach')).toBe(false); expect(n.disabled).toBe(false) }
    fireEvent.click(a); fireEvent.click(d); expect(chon).not.toHaveBeenCalled()
    fireEvent.click(b); expect(chon).toHaveBeenCalledWith('B')
    expect(container.querySelector('.dao2-bua')?.textContent).toMatch(/Bùa Trợ giảng:.*phương án A và D đã cháy thành tro/)
    expect(container.querySelector('.dao2-bua')?.textContent).toMatch(/chưa tính Thành thạo/)
    // chế độ làm bài: KHÔNG có khối lời giải, không tô đáp án
    expect(container.querySelector('.loi-giai')).toBeNull()
    expect(container.querySelector('[data-trang-thai="dung"]')).toBeNull()
  })

  it('không có goiY ⇒ không phương án nào bị gạch, không dòng Bùa; đổi sang câu có gạch thì gạch đúng câu mới', () => {
    const chon = vi.fn()
    const { container, rerender } = render(<div className="dao dao2"><TheCauAi cau={cau()} stt={1} traLoi="" khoa={false} onTraLoi={chon} /></div>)
    expect(container.querySelectorAll('[data-gach]').length).toBe(0); expect(container.querySelector('.dao2-bua')).toBeNull()
    fireEvent.click(nutPa('A')); expect(chon).toHaveBeenCalledWith('A')
    rerender(<div className="dao dao2"><TheCauAi cau={cau({ qid: 'q2', goiY: { gach: ['B', 'C'] } })} stt={2} traLoi="" khoa={false} onTraLoi={chon} /></div>)
    expect([...container.querySelectorAll('.pa-hang[data-gach]')].map(n => n.textContent?.trim().charAt(0))).toEqual(['B', 'C'])
    rerender(<div className="dao dao2"><TheCauAi cau={cau({ qid: 'q3' })} stt={3} traLoi="" khoa={false} onTraLoi={chon} /></div>)
    expect(container.querySelectorAll('[data-gach]').length).toBe(0); expect(nutPa('B').disabled).toBe(false)
  })

  it('docGoiY đọc chặt: chỉ A–D, 1–2 chữ khác nhau, chỉ Phần I; sai dạng ⇒ không gợi ý', () => {
    expect(docGoiY({ gach: ['d', 'A'] }, 'I')).toEqual({ gach: ['A', 'D'] })
    expect(docGoiY({ gach: ['A', 'E'] }, 'I')).toEqual({ gach: ['A'] })
    expect(docGoiY({ gach: ['A', 'B', 'C'] }, 'I')).toBeNull()
    expect(docGoiY({ gach: ['A', 'D'] }, 'II')).toBeNull()
    expect(docGoiY('A,D', 'I')).toBeNull()
    expect(docGoiY({ cotLoi: '  ' }, 'II')).toBeNull()
  })
})
