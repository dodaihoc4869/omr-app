// 07/10: mã bí mật máy chủ đổi lúc 16:05 ⇒ token phiên game em cất trong máy (ký bằng mã cũ) bị từ chối "Phiên game không hợp lệ." Sảnh chỉ hiện dòng đó + nút
// "Thử lại" gửi lại đúng token hỏng ⇒ mãi lỗi. Nay Sảnh gặp lời "phiên hỏng" ⇒ tự đăng xuất, màn đăng nhập nói thật vì sao (một lần).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CHU_PHIEN_HONG, KHOA_GHI_CHU_PHIEN_HONG, ghiChuPhienHong, laLoiPhienHong, layGhiChuPhienHong, useTuDangXuatKhiPhienHong } from '../src/lib/phien-hong'
import DangNhapHocSinh from '../src/screens/DangNhapHocSinh'

beforeEach(() => sessionStorage.clear())
afterEach(cleanup)

describe('laLoiPhienHong — đúng các lời máy chủ nói token em không dùng được', () => {
  it.each([
    'Phiên game không hợp lệ.',
    'Phiên game đã hết hạn. Em đăng nhập lại.',
    'Mật khẩu đã đổi. Em đăng nhập lại.',
    'Em nhập lại mật khẩu để mở hồ sơ game trên máy này.',
  ])('%s ⇒ phiên hỏng', (loi) => expect(laLoiPhienHong(loi)).toBe(true))
  it.each(['', 'Chưa tải được Sảnh.', 'Máy chủ trả lời chậm — thử lại sau ít phút.', 'Không nối được máy chủ.', 'Máy chủ trả lỗi HTTP 503'])('%s ⇒ KHÔNG phải phiên hỏng (đăng xuất nhầm là mất phiên tốt)', (loi) => expect(laLoiPhienHong(loi)).toBe(false))
  it('không phải chuỗi ⇒ false', () => {
    expect(laLoiPhienHong(undefined)).toBe(false)
    expect(laLoiPhienHong(null)).toBe(false)
    expect(laLoiPhienHong(42)).toBe(false)
  })
})

describe('ghi chú phiên hỏng — hiện MỘT lần', () => {
  it('chưa ghi ⇒ rỗng; ghi rồi lấy ⇒ có câu, lấy lần hai ⇒ rỗng', () => {
    expect(layGhiChuPhienHong()).toBe('')
    ghiChuPhienHong()
    expect(sessionStorage.getItem(KHOA_GHI_CHU_PHIEN_HONG)).toBe('1')
    expect(layGhiChuPhienHong()).toBe(CHU_PHIEN_HONG)
    expect(layGhiChuPhienHong()).toBe('')
  })
})

function Cay({ coPhien, loi, dangXuat }: { coPhien: boolean; loi: unknown; dangXuat: () => void }) {
  useTuDangXuatKhiPhienHong(coPhien, loi, dangXuat)
  return null
}

describe('useTuDangXuatKhiPhienHong', () => {
  it('đang có phiên + lời "phiên hỏng" ⇒ ghi chú rồi đăng xuất ĐÚNG MỘT lần (dựng lại cùng lời không gọi thêm)', () => {
    const dx = vi.fn()
    const { rerender } = render(<Cay coPhien loi="Phiên game không hợp lệ." dangXuat={dx} />)
    expect(dx).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(KHOA_GHI_CHU_PHIEN_HONG)).toBe('1')
    rerender(<Cay coPhien loi="Phiên game không hợp lệ." dangXuat={dx} />)
    expect(dx).toHaveBeenCalledTimes(1)
  })
  it('lỗi thường (mạng, chậm) ⇒ KHÔNG đăng xuất', () => {
    const dx = vi.fn()
    render(<Cay coPhien loi="Không nối được máy chủ." dangXuat={dx} />)
    expect(dx).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(KHOA_GHI_CHU_PHIEN_HONG)).toBeNull()
  })
  it('chưa có phiên (đã đăng xuất) ⇒ không gọi lại, không lặp', () => {
    const dx = vi.fn()
    render(<Cay coPhien={false} loi="Phiên game không hợp lệ." dangXuat={dx} />)
    expect(dx).not.toHaveBeenCalled()
  })
  it('gọi đúng hàm đăng xuất MỚI NHẤT (không dính closure cũ)', () => {
    const cu = vi.fn()
    const moi = vi.fn()
    const { rerender } = render(<Cay coPhien loi="" dangXuat={cu} />)
    rerender(<Cay coPhien loi="Mật khẩu đã đổi. Em đăng nhập lại." dangXuat={moi} />)
    expect(cu).not.toHaveBeenCalled()
    expect(moi).toHaveBeenCalledTimes(1)
  })
})

describe('màn đăng nhập học sinh sau khi bị đưa về vì phiên hỏng', () => {
  const props = () => ({ api: { dangNhap: vi.fn(), datMatKhau: vi.fn() } as never, onDangNhap: vi.fn(), logo: null })
  it('có ghi chú ⇒ hiện câu giải thích; dựng lại lần sau ⇒ không còn', () => {
    ghiChuPhienHong()
    const { unmount } = render(<DangNhapHocSinh {...props()} />)
    expect(screen.getByText(CHU_PHIEN_HONG)).toBeTruthy()
    unmount()
    render(<DangNhapHocSinh {...props()} />)
    expect(screen.queryByText(CHU_PHIEN_HONG)).toBeNull()
  })
  it('không ghi chú ⇒ màn sạch như cũ', () => {
    render(<DangNhapHocSinh {...props()} />)
    expect(screen.queryByText(CHU_PHIEN_HONG)).toBeNull()
  })
})
