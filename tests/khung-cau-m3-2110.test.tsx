// KhungCauM3 (21/10): khung không memo, chỉ góc "Xem lại sau" memo ⇒ mỗi lần chọn đáp án không vẽ lại góc của mọi thẻ.
// Góc memo bỏ qua hàm ⇒ nút phải gọi `onDoiDau` MỚI NHẤT, không phải hàm cũ giữ danh sách dấu cũ.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { KhungCauM3 } from '../src/screens/DaiCauChuaLamM3'

describe('KhungCauM3 — góc memo gọi hàm mới nhất', () => {
  it('vẽ lại với onDoiDau mới (cùng soY, daDanhDau) ⇒ bấm gọi hàm mới, không gọi hàm cũ', () => {
    const cu = vi.fn()
    const moi = vi.fn()
    const { container, rerender } = render(<KhungCauM3 soY={0} daDanhDau={false} onDoiDau={cu}><p>thẻ</p></KhungCauM3>)
    rerender(<KhungCauM3 soY={0} daDanhDau={false} onDoiDau={moi}><p>thẻ mới</p></KhungCauM3>)
    fireEvent.click(container.querySelector('.thi-cau-dau')!)
    expect(moi).toHaveBeenCalledTimes(1)
    expect(cu).not.toHaveBeenCalled()
    expect(container.textContent).toContain('thẻ mới')
  })

  it('DOM giữ nguyên: .thi-cau-boc > [thẻ, .thi-cau-goc]', () => {
    const { container } = render(<KhungCauM3 soY={2} daDanhDau onDoiDau={() => {}}><p>thẻ</p></KhungCauM3>)
    const boc = container.querySelector('.thi-cau-boc')!
    expect([...boc.children].map((e) => e.tagName + (e.className ? '.' + e.className : ''))).toEqual(['P', 'DIV.thi-cau-goc'])
    expect(boc.querySelector('.thi-cau-nhan')?.textContent).toBe('Mới 2/4 ý')
    expect(boc.querySelector('.thi-cau-dau')?.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('khung thẻ màn thi: contain bố cục (đo máy yếu 22/10)', () => {
  it('.thi-cau-boc có contain: layout style; màn thi truyền onZoom cho thẻ câu (ảnh phóng to không nằm trong khung bị contain)', async () => {
    const { readFileSync } = await import('node:fs')
    expect(readFileSync('src/screens/man-thi-m3.css', 'utf8')).toMatch(/\.m3 \.thi-cau-boc \{ position: relative; contain: layout style; \}/)
    const man = readFileSync('src/screens/ExamTakeScreen.tsx', 'utf8')
    expect((man.match(/onZoom=\{setZoomSrc\}/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })
})
