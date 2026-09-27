// GAME HÓA 2.0 · BÙA TRỢ GIẢNG Phần II/III: máy chủ gửi `goiY.cotLoi` ⇒ ô "KIẾN THỨC CỐT LÕI" hiện TRƯỚC đề, đúng mẫu ô chốt của lời giải app
// (cùng lớp `loi-giai-chot lg-chot` + nhãn `loi-giai-nhan-nho` mà TheCau dùng; dưới `.m3` ⇒ nhãn nhỏ in hoa màu primary, chữ đậm, vạch trái).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TheCauAi } from '../src/game/than-thu-v2/dao2/TrongAi'
import type { CauDao2 } from '../src/game/than-thu-v2/dao2/dao2-core'

afterEach(cleanup)
const COT_LOI = 'Phản ứng tráng bạc xảy ra với chất có nhóm –CHO, hoặc chất chuyển được thành chất có nhóm –CHO trong môi trường phản ứng.'
const cauII = (them: Partial<CauDao2> = {}): CauDao2 => ({ qid: 'q2', maDe: 'DE', version: '1', group: 'g2', phan: 'II', text: 'Mỗi phát biểu sau đúng hay sai?', choices: [],
  ideas: ['Glucose và fructose là đồng phân của nhau.', 'Glucose và fructose đều tham gia phản ứng tráng bạc.', 'Saccharose có phản ứng tráng bạc.', 'Tinh bột là polymer thiên nhiên.'],
  hinhAnh: [], dang: 'D', tenDang: 'Carbohydrate', mucDo: 'hieu', sao: 1, kienThuc: [], vai: 'on_lai', ...them })

describe('Phần II/III · ô Kiến thức cốt lõi mở trước', () => {
  it('có cotLoi ⇒ ô chốt đúng lớp của lời giải app, nằm trước thẻ đề, trong khung `.m3`; chọn Đ/S vẫn chạy', () => {
    const chon = vi.fn()
    const { container } = render(<div className="dao dao2"><TheCauAi cau={cauII({ goiY: { cotLoi: COT_LOI } })} stt={3} traLoi="" khoa={false} onTraLoi={chon} /></div>)
    const o = container.querySelector('[data-cot-loi]') as HTMLElement
    expect(o).toBeTruthy()
    expect(o.classList.contains('loi-giai-chot')).toBe(true); expect(o.classList.contains('lg-chot')).toBe(true)
    expect(o.querySelector('.loi-giai-nhan-nho')?.textContent).toBe('Kiến thức cốt lõi')
    expect(o.textContent).toContain('nhóm –CHO')
    expect(o.closest('.m3')).toBeTruthy()
    // đứng TRƯỚC đề bài
    const the = container.querySelector('.the-cau') as HTMLElement
    expect(o.compareDocumentPosition(the) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelector('.dao2-bua')?.textContent).toMatch(/mở trước Kiến thức cốt lõi/)
    // Phần II không bao giờ gạch
    expect(container.querySelectorAll('[data-gach]').length).toBe(0)
    fireEvent.click(screen.getAllByRole('button', { name: 'Sai' })[1]!); expect(chon).toHaveBeenCalledWith('-S--')
    // chưa chốt ⇒ không có khối LỜI GIẢI
    expect(container.querySelector('.loi-giai')).toBeNull()
  })

  it('Phần III có cotLoi cũng hiện; không có goiY ⇒ không ô cốt lõi, không dòng Bùa (đề giữ nguyên)', () => {
    const { container, rerender } = render(<div className="dao dao2"><TheCauAi cau={cauII({ phan: 'III', ideas: [], text: 'Tính khối lượng muối (gam).', goiY: { cotLoi: 'n muối = n ester' } })} stt={1} traLoi="" khoa={false} onTraLoi={() => {}} /></div>)
    expect(container.querySelector('[data-cot-loi]')?.textContent).toContain('n muối = n ester')
    rerender(<div className="dao dao2"><TheCauAi cau={cauII()} stt={1} traLoi="" khoa={false} onTraLoi={() => {}} /></div>)
    expect(container.querySelector('[data-cot-loi]')).toBeNull(); expect(container.querySelector('.dao2-bua')).toBeNull()
    expect(container.querySelector('.cau-de')?.textContent).toContain('Mỗi phát biểu sau đúng hay sai?')
  })

  it('CSS: ô cốt lõi dưới `.m3` lấy nhãn/vạch màu primary (m3/the-cau.css), dao2.css không đổi màu nhãn; không mã màu #', () => {
    const m3 = readFileSync(resolve(__dirname, '../src/components/m3/the-cau.css'), 'utf8')
    expect(m3).toMatch(/\.m3 \.loi-giai-nhan-nho\s*\{\s*color:\s*var\(--m3-primary\)/)
    expect(m3).toMatch(/\.m3 \.lg-chot\s*\{\s*border-left-color:\s*var\(--m3-primary\)/)
    const css = readFileSync(resolve(__dirname, '../src/game/than-thu-v2/dao2/dao2.css'), 'utf8')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/loi-giai-nhan-nho[^{]*\{[^}]*color/)
    expect(css).toMatch(/prefers-reduced-motion:no-preference/)
  })
})
