// @vitest-environment jsdom
// Thầy 12/11 tối: «cảnh báo này chỉ hiện 2 giây rồi ẩn xuống dưới nhấp nháy, khi ẩn xuống bỏ hiệu ứng nhấp nháy xung quanh màn hình».
// + «Màn hình trên máy tính học sinh không có nút vàng bên phải để bấm» (thanh cuộn của bảng đè lên tay nắm).
import { readFileSync } from 'node:fs'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BaoRoiMan } from '../src/components/bpu/BaoRoiMan'

const q = (s: string) => document.querySelector(s)
// Lần 2 cùng tối: «bỏ luôn cảnh báo to đùng đó, hiện cảnh báo tinh tế gọn gàng».
describe('cảnh báo «Rời màn hình» trên màn thầy — bản gọn', () => {
  afterEach(() => { cleanup() })

  it('em rời ⇒ CHỈ có viên nhỏ ở đáy (không thẻ to, không viền quanh màn), nằm ngoài khung bảng', () => {
    render(<BaoRoiMan sbd={['S1']} ten={['Dương Thị Ngọc Ánh']} />)
    expect(q('.bpu-bao-chay')!.parentElement).toBe(document.body)
    expect(q('.bpu-bao-chay')!.classList.contains('nhe')).toBe(true)
    expect(q('.bpu-bao-chay-the')).toBeNull()
    expect(q('.bpu-roi-gon')!.textContent).toBe('Rời màn hìnhDương Thị Ngọc Ánh')
    expect(q('[role="alert"]')).not.toBeNull()
  })
  it('có em MỚI rời ⇒ viên dựng lại (nảy một lần); em quay lại bớt ⇒ chỉ đổi tên, không nảy; về hết ⇒ mất', () => {
    const r = render(<BaoRoiMan sbd={['S1']} ten={['A']} />)
    const dau = q('.bpu-roi-gon')
    r.rerender(<BaoRoiMan sbd={['S1', 'S2']} ten={['A', 'B']} />)
    const hai = q('.bpu-roi-gon')
    expect(hai).not.toBe(dau)
    expect(hai!.querySelector('span')!.textContent).toBe('A · B')
    r.rerender(<BaoRoiMan sbd={['S2']} ten={['B']} />)
    expect(q('.bpu-roi-gon')).toBe(hai)
    expect(q('.bpu-roi-gon span')!.textContent).toBe('B')
    r.rerender(<BaoRoiMan sbd={[]} ten={[]} />)
    expect(q('.bpu-bao-chay')).toBeNull()
  })
  it('CSS: tắt viền quanh màn, viên nằm đáy, không bắt chạm; máy yếu / giảm chuyển động đứng yên; mã không còn dựng thẻ to', () => {
    const css = readFileSync('src/components/bpu/bpu-bang.css', 'utf8'), ma = readFileSync('src/components/bpu/BaoRoiMan.tsx', 'utf8')
    expect(css).toContain('.bpu-bao-chay.nhe::before { display: none; }')
    expect(css).toContain('.bpu-bao-chay.nhe { place-items: end center; }')
    expect(css).toMatch(/\.bpu-bao-chay \{[^}]*pointer-events: none;/)
    expect(css).toContain('html.may-yeu .bpu-roi-gon i::after { animation: none; }')
    expect(ma).not.toContain('bpu-bao-chay-the')
    expect(ma).not.toContain('setTimeout')
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
