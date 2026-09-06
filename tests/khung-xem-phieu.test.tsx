// XEM BÁO CÁO — thầy báo 06/09: "bấm lần đầu bị văng, bấm lần 2 mới xem được".
//
// Nguyên nhân: hiệu ứng lịch sử của `KhungXemPhieu` phụ thuộc `[dong]`, mà mọi
// nơi gọi đều truyền hàm nội tuyến. Cha vẽ lại một nhịp là hiệu ứng dọn rồi
// chạy lại; lúc dọn nó gọi `history.back()`, `popstate` rơi vào bộ nghe vừa
// gắn, bộ nghe gọi `dong()` — đóng luôn lớp phủ vừa mở.
//
// Bộ kiểm này dựng đúng cảnh đó: vẽ lại với hàm `dong` MỚI, rồi đòi lớp phủ
// vẫn còn và `dong` chưa hề bị gọi.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import KhungXemPhieu from '../src/components/KhungXemPhieu'

afterEach(() => cleanup())

const conLopPhu = () => document.querySelectorAll('.lop-xem-phieu').length

describe('Lớp phủ xem báo cáo không tự đóng', () => {
  it('CHA VẼ LẠI với hàm dong mới thì lớp phủ VẪN CÒN — đây là lỗi thầy gặp', () => {
    const dong = vi.fn()
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const r = render(<KhungXemPhieu src="https://x/p#m1" ten="Báo cáo" dong={() => dong()} />)
    expect(conLopPhu()).toBe(1)

    // Đúng cảnh `PhieuZaloEm` dựng xong ảnh phiếu rồi vẽ lại: hàm nội tuyến
    // đổi danh tính, nhưng lớp phủ không được đụng tới.
    for (let i = 0; i < 3; i++) r.rerender(<KhungXemPhieu src="https://x/p#m1" ten="Báo cáo" dong={() => dong()} />)

    expect(conLopPhu()).toBe(1)
    expect(dong).not.toHaveBeenCalled()
    // Và KHÔNG được lùi lịch sử giữa chừng — chính cú lùi thừa đó đẻ ra
    // `popstate` làm văng lớp phủ.
    expect(back).not.toHaveBeenCalled()
    back.mockRestore()
  })

  it('vuốt quay lại VẪN đóng được, và đóng bằng ĐÚNG hàm mới nhất', () => {
    const cu = vi.fn()
    const moi = vi.fn()
    const r = render(<KhungXemPhieu src="https://x/p#m1" dong={cu} />)
    r.rerender(<KhungXemPhieu src="https://x/p#m1" dong={moi} />)
    fireEvent.popState(window)
    expect(cu).not.toHaveBeenCalled()
    expect(moi).toHaveBeenCalledTimes(1)
  })

  it('phím Esc đóng được, cũng bằng hàm mới nhất', () => {
    const cu = vi.fn()
    const moi = vi.fn()
    const r = render(<KhungXemPhieu html="<p>x</p>" dong={cu} />)
    r.rerender(<KhungXemPhieu html="<p>x</p>" dong={moi} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(cu).not.toHaveBeenCalled()
    expect(moi).toHaveBeenCalledTimes(1)
  })

  it('nút X đóng được, cũng bằng hàm mới nhất', () => {
    const cu = vi.fn()
    const moi = vi.fn()
    const r = render(<KhungXemPhieu html="<p>x</p>" dong={cu} />)
    r.rerender(<KhungXemPhieu html="<p>x</p>" dong={moi} />)
    fireEvent.click(document.querySelector('.nut-dong-phieu') as HTMLElement)
    expect(cu).not.toHaveBeenCalled()
    expect(moi).toHaveBeenCalledTimes(1)
  })

  it('đóng bằng Esc thì GỠ mục lịch sử đã đẩy, không để lại nhịp back thừa', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const r = render(<KhungXemPhieu html="<p>x</p>" dong={() => {}} />)
    r.unmount()
    expect(back).toHaveBeenCalledTimes(1)
    back.mockRestore()
  })

  it('đóng bằng vuốt quay lại thì KHÔNG lùi thêm lần nữa', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const r = render(<KhungXemPhieu html="<p>x</p>" dong={() => {}} />)
    fireEvent.popState(window)
    r.unmount()
    expect(back).not.toHaveBeenCalled()
    back.mockRestore()
  })

  it('trả cuộn trang nền về như cũ sau khi đóng', () => {
    document.body.style.overflow = 'auto'
    const r = render(<KhungXemPhieu html="<p>x</p>" dong={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    r.unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})
