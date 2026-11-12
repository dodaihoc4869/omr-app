// @vitest-environment jsdom
// Thầy 12/11 tối: «cảnh báo này chỉ hiện 2 giây rồi ẩn xuống dưới nhấp nháy, khi ẩn xuống bỏ hiệu ứng nhấp nháy xung quanh màn hình».
// + «Màn hình trên máy tính học sinh không có nút vàng bên phải để bấm» (thanh cuộn của bảng đè lên tay nắm).
import { readFileSync } from 'node:fs'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BAO_TO_MS, BaoRoiMan } from '../src/components/bpu/BaoRoiMan'

const q = (s: string) => document.querySelector(s)
describe('cảnh báo «Rời màn hình» trên màn thầy', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('em vừa rời ⇒ thẻ to + viền; đúng 2 giây sau thu thành viên nhỏ ở đáy, không còn viền quanh màn', () => {
    render(<BaoRoiMan sbd={['S1']} ten={['Dương Thị Ngọc Ánh']} />)
    expect(BAO_TO_MS).toBe(2000)
    expect(q('.bpu-bao-chay')!.parentElement).toBe(document.body)
    expect(q('.bpu-bao-chay')!.classList.contains('gon')).toBe(false)
    expect(q('.bpu-bao-chay-the strong')!.textContent).toBe('Dương Thị Ngọc Ánh')
    act(() => { vi.advanceTimersByTime(1900) })
    expect(q('.bpu-bao-chay-the')).not.toBeNull()
    act(() => { vi.advanceTimersByTime(200) })
    expect(q('.bpu-bao-chay-the')).toBeNull()
    expect(q('.bpu-bao-chay')!.classList.contains('gon')).toBe(true)
    expect(q('.bpu-bao-chay-gon')!.textContent).toBe('Rời màn hìnhDương Thị Ngọc Ánh')
  })
  it('đang thu gọn mà có em MỚI rời ⇒ thẻ to lại 2 giây; em quay lại bớt thì KHÔNG bật to lại; về hết ⇒ mất', () => {
    const r = render(<BaoRoiMan sbd={['S1']} ten={['A']} />)
    act(() => { vi.advanceTimersByTime(2100) })
    expect(q('.bpu-bao-chay.gon')).not.toBeNull()
    r.rerender(<BaoRoiMan sbd={['S1', 'S2']} ten={['A', 'B']} />)
    expect(q('.bpu-bao-chay-the strong')!.textContent).toBe('A · B')
    act(() => { vi.advanceTimersByTime(2100) })
    expect(q('.bpu-bao-chay-gon span')!.textContent).toBe('A · B')
    r.rerender(<BaoRoiMan sbd={['S2']} ten={['B']} />)
    expect(q('.bpu-bao-chay-the')).toBeNull()
    expect(q('.bpu-bao-chay-gon span')!.textContent).toBe('B')
    r.rerender(<BaoRoiMan sbd={[]} ten={[]} />)
    expect(q('.bpu-bao-chay')).toBeNull()
  })
  it('CSS: thu gọn ⇒ tắt viền quanh màn, viên nằm đáy và tự nhấp nháy; máy yếu / giảm chuyển động đứng yên', () => {
    const css = readFileSync('src/components/bpu/bpu-bang.css', 'utf8')
    expect(css).toContain('.bpu-bao-chay.gon::before { display: none; }')
    expect(css).toContain('.bpu-bao-chay.gon { place-items: end center; }')
    expect(css).toMatch(/\.bpu-bao-chay-gon \{[^}]*animation: bpu-bao-chay-gon 0\.9s ease-in-out infinite alternate;/)
    expect(css).toContain('html.may-yeu .bpu-bao-chay-gon { animation: none; }')
    expect(readFileSync('src/components/bpu/BangBinhPhanUng.tsx', 'utf8')).toContain('<BaoRoiMan sbd={roiNay}')
  })
})

describe('máy tính học sinh: tay nắm mép phải không bị thanh cuộn đè', () => {
  it('bảng live ẩn thanh cuộn; máy dùng chuột thì tay nắm to, rõ', () => {
    const css = readFileSync('src/components/live/live-em.css', 'utf8')
    expect(css).toContain('.lv .lv-kg-cuon { scrollbar-width: none; }')
    expect(css).toContain('.lv .lv-kg-cuon::-webkit-scrollbar { display: none; }')
    expect(css).toMatch(/@media \(hover: hover\) and \(pointer: fine\) \{\s*\.lv \.lv-nam i, \.lv-phu \.lv-nam i \{ width: 8px; height: 64px; border-radius: 4px; opacity: 0\.95; \}/)
  })
})
