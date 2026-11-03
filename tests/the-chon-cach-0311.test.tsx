// Thầy 03/11 chốt bản vẽ docs/ban-ve-chon-cach-0311.jpg: câu mới khổ rộng ⇒ thẻ «Chọn cách làm» hai ô lớn thay dải hai nút; điện thoại dọc giữ dải nút.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { TheChonCach } from '../src/components/hoc-tap/TheChonCach'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

describe('TheChonCach', () => {
  it('hai ô lớn, chữ chuẩn (tự làm / có hỗ trợ), bấm gọi đúng việc, khoá khi đang nộp', () => {
    const hoc = vi.fn(), tu = vi.fn()
    const { rerender } = render(<TheChonCach chua={false} khoa={false} onHoc={hoc} onTuLam={tu} />)
    expect(screen.getByRole('heading', { name: 'Em muốn làm câu này thế nào?' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Học cách giải.*Xem lời giải từng bước · tính là có hỗ trợ/ }))
    fireEvent.click(screen.getByRole('button', { name: /Tự làm câu này.*Tính là câu tự làm/ }))
    expect(hoc).toHaveBeenCalledTimes(1); expect(tu).toHaveBeenCalledTimes(1)
    rerender(<TheChonCach chua khoa onHoc={hoc} onTuLam={tu} />)
    expect(screen.getByText(/Xem phần thầy chữa/)).toBeTruthy()
    expect(screen.getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })
  it('CSS: điện thoại ẩn thẻ; khổ rộng hiện thẻ, ẩn dải hai nút; chỉ biến màu sẵn có', () => {
    const css = doc('src/styles/trong-chang-ngang.css')
    expect(css).toMatch(/:root\[data-trong\] \.duo-chon \{ display: none; \}/)
    expect(css).toMatch(/\[data-chon-cach\] > \.duo-day:not\(\.duo-ket\) \{ display: none; \}/)
    const khoi = css.slice(css.indexOf('.duo-chon {'), css.indexOf('.duo-chon-di'))
    expect(khoi).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(doc('src/components/hoc-tap/ManLamBaiTap.tsx')).toMatch(/choChonCach && <TheChonCach /)
  })
})
