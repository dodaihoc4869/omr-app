// «VÌ SAO EM SAI?» trên máy em — khối B đợt 2 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-2b, «làm hết sạch đẩy luôn lên bản sống»).
// Khoá: câu sai hiện 3 ô lý do, chưa chạm ⇒ «Tiếp tục» chờ (choLyDoSai); chạm ⇒ xếp hàng trên máy (sống qua tải lại), gửi KÈM lệnh nộp câu kế (`ly`),
// máy chủ nhận ⇒ bỏ khỏi hàng (đổi ý sau lúc gửi ⇒ giữ bản mới); câu làm lại không hỏi; dòng «vào lịch ôn 1 · 3 · 7 ngày» đã thay bằng nhóm sửa.
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { CHU_CHO_LY_DO, choLyDoSai, chonLyDoSai, daGuiLyDoSai, thanLyDoSai } from '../src/components/hoc-tap/vi-sao-sai'
import { KetSai } from '../src/components/hoc-tap/KetSaiDuo'

afterEach(() => { cleanup(); const g = thanLyDoSai(); daGuiLyDoSai(g); localStorage.clear() })

describe('KetSai', () => {
  it('3 ô lý do, bắt buộc chạm, chạm lại đổi ý, xếp hàng gửi kèm lệnh kế', () => {
    const { container, getByRole } = render(<KetSai qid="q1" dap="Đáp án đúng: B. Methylamine" giai="Methylamine có tính base mạnh hơn ammonia." laLamLai={false} tenDang="Tính base của amine" />)
    const o = [...container.querySelectorAll('.o-ly button')].map(b => b.textContent)
    expect(o).toEqual(['Tính / đọc đề sai', 'Chưa biết cách', 'Hiểu nhầm'])
    expect(container.querySelector('.ly-do h3')!.textContent).toBe('Vì sao em sai?')
    expect(container.textContent).toContain('Câu này vào nhóm sửa «Tính base của amine».')
    expect(container.textContent).not.toContain('1 · 3 · 7')
    expect(choLyDoSai()).toBe(true)
    expect(thanLyDoSai()).toEqual({})
    act(() => { fireEvent.click(getByRole('button', { name: 'Chưa biết cách' })) })
    expect(choLyDoSai()).toBe(false)
    expect(getByRole('button', { name: 'Chưa biết cách' }).getAttribute('aria-pressed')).toBe('true')
    act(() => { fireEvent.click(getByRole('button', { name: 'Hiểu nhầm' })) })
    expect(getByRole('button', { name: 'Chưa biết cách' }).getAttribute('aria-pressed')).toBe('false')
    const gui = thanLyDoSai()
    expect(gui).toEqual({ ly: [['q1', 'nham']] })
    expect(JSON.parse(localStorage.getItem('ddh.lyDoSai')!)).toEqual([['q1', 'nham']])
    // đổi ý SAU lúc gửi ⇒ máy chủ nhận bản cũ, hàng giữ bản mới
    chonLyDoSai('q1', 'tinh')
    daGuiLyDoSai(gui)
    expect(thanLyDoSai()).toEqual({ ly: [['q1', 'tinh']] })
    daGuiLyDoSai(thanLyDoSai())
    expect(thanLyDoSai()).toEqual({})
    expect(localStorage.getItem('ddh.lyDoSai')).toBeNull()
  })
  it('rời câu khi chưa chạm ⇒ hết chờ; câu làm lại không hỏi lý do', () => {
    const { unmount } = render(<KetSai qid="q2" dap="x" giai="" laLamLai={false} />)
    expect(choLyDoSai()).toBe(true)
    unmount()
    expect(choLyDoSai()).toBe(false)
    const { container } = render(<KetSai qid="q3" dap="x" giai="" laLamLai />)
    expect(container.querySelector('.o-ly')).toBeNull()
    expect(choLyDoSai()).toBe(false)
    expect(container.textContent).toContain('Câu gốc vẫn trong nhóm sửa.')
  })
})

describe('màn làm bài nối đúng chỗ', () => {
  const src = readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')
  it('nút Tiếp tục chờ lý do, thân lệnh nộp mang `ly`, bỏ lời hứa lịch ôn 1 · 3 · 7 ngày; kiểu nạp cùng mảnh kiểu màn làm bài (không tệp precache mới)', () => {
    expect(readFileSync('src/styles/trong-lam-bai.css', 'utf8')).toContain("@import '../components/hoc-tap/vi-sao-sai.css'")
    expect(src).not.toMatch(/import '\.\/vi-sao-sai\.css'/)
    expect(src).toContain('disabled={choLy}')
    expect(src).toContain('CHU_CHO_LY_DO')
    expect(src).toMatch(/if \(choLyDoSai\(\)\) return/)
    expect(src).toMatch(/const ly = thanLyDoSai\(q\.qid\), than = \{[^}]*\.\.\.ly,/)
    expect(src).toContain('daGuiLyDoSai(ly)')
    expect(src).not.toContain('1 · 3 · 7')
    expect(CHU_CHO_LY_DO).toBe('Chọn một lý do để tiếp tục')
  })
})
