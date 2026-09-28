// KHỐI PHÒNG CHỜ làm lại (thầy 28/09: "làm lại cho đẹp trực quan đồng bộ với thiết kế hiện tại. Có tự đồng bộ hs vào phòng chờ sau 5 giây").
// Kiểm: vòng tự làm mới 5 giây (đồng hồ giả), dừng khi tab ẩn / rời màn / Chiếu mã đang mở, lỗi GIỮ danh sách cũ + chấm "mất kết nối",
// trạng thái trống có nút Chiếu mã, Huỷ ca hỏi lại trước, Bắt đầu thi giữ chữ khi đang gửi, không còn chữ "A.I Đỗ Đại Học",
// và "Thêm 5 phút" ẩn khi ca còn ở phòng chờ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import PhongChoCa, { type PhongChoCaProps } from '../src/components/ca-thi/PhongChoCa'
import KhoiThoiGianCa from '../src/components/KhoiThoiGianCa'

let an = false
beforeEach(() => {
  an = false
  vi.useFakeTimers()
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (an ? 'hidden' : 'visible') })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const EM = [
  { sbd: '12001', hoTen: 'Nguyễn Minh Anh' },
  { sbd: '12002', hoTen: 'Trần Thu Hà' },
]
const dung = (o: Partial<PhongChoCaProps> = {}) => {
  const p: PhongChoCaProps = {
    maCa: '123456',
    em: EM,
    siSo: 30,
    onCauSai: false,
    coDongBoGio: true,
    dongBoGio: false,
    onDoiDongBoGio: vi.fn(),
    dangBatDau: false,
    onBatDau: vi.fn(),
    dangHuy: false,
    onHuy: vi.fn(),
    noiKhoiPhuc: 'Ca vào Lịch sử ca, khôi phục lại được.',
    onChieuMa: vi.fn(),
    ...o,
  }
  return { p, ...render(<PhongChoCa {...p} />) }
}
const nhay = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('PhongChoCa · tự làm mới 5 giây', () => {
  it('gọi lamMoi mỗi 5 giây, không gọi ngay khi vẽ', async () => {
    const lamMoi = vi.fn(async () => true)
    dung({ lamMoi })
    expect(lamMoi).not.toHaveBeenCalled()
    await nhay(5000)
    expect(lamMoi).toHaveBeenCalledTimes(1)
    await nhay(10000)
    expect(lamMoi).toHaveBeenCalledTimes(3)
    expect(screen.getByText('tự cập nhật')).toBeTruthy()
  })

  it('tab ẩn thì không gọi; hiện lại gọi ngay', async () => {
    const lamMoi = vi.fn(async () => true)
    dung({ lamMoi })
    an = true
    await nhay(15000)
    expect(lamMoi).not.toHaveBeenCalled()
    an = false
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(lamMoi).toHaveBeenCalledTimes(1)
  })

  it('rời màn (gỡ khối) hoặc Chiếu mã đang mở ⇒ dừng', async () => {
    const lamMoi = vi.fn(async () => true)
    const { unmount } = dung({ lamMoi, tamDung: true })
    await nhay(15000)
    expect(lamMoi).not.toHaveBeenCalled()
    unmount()
    const lamMoi2 = vi.fn(async () => true)
    const r = dung({ lamMoi: lamMoi2 })
    await nhay(5000)
    expect(lamMoi2).toHaveBeenCalledTimes(1)
    r.unmount()
    await nhay(20000)
    expect(lamMoi2).toHaveBeenCalledTimes(1)
  })

  it('không gọi chồng khi lần trước chưa xong', async () => {
    let xong: (v: boolean) => void = () => {}
    const lamMoi = vi.fn(() => new Promise<boolean>((r) => (xong = r)))
    dung({ lamMoi })
    await nhay(15000)
    expect(lamMoi).toHaveBeenCalledTimes(1)
    await act(async () => xong(true))
    await nhay(5000)
    expect(lamMoi).toHaveBeenCalledTimes(2)
  })

  it('lỗi mạng: GIỮ danh sách cũ + chấm "mất kết nối"; tải lại được thì tắt chấm', async () => {
    let ok = false
    const lamMoi = vi.fn(async () => {
      if (!ok) throw new Error('mất mạng')
      return true
    })
    dung({ lamMoi })
    await nhay(5000)
    expect(screen.getByText('mất kết nối')).toBeTruthy()
    expect(screen.getByText('Minh Anh')).toBeTruthy()
    expect(screen.getByText('Thu Hà')).toBeTruthy()
    ok = true
    await nhay(5000)
    expect(screen.queryByText('mất kết nối')).toBeNull()
  })

  it('lamMoi trả false (tải hỏng) cũng hiện "mất kết nối"', async () => {
    dung({ lamMoi: vi.fn(async () => false) })
    await nhay(5000)
    expect(screen.getByText('mất kết nối')).toBeTruthy()
  })
})

describe('PhongChoCa · nội dung', () => {
  it('số lớn có nhãn "em đang chờ / sĩ số", chip tên em; em mới vào được tô', () => {
    const { container, rerender, p } = dung()
    expect(container.querySelector('.ct-pc-dem')?.textContent).toBe('2em đang chờ / sĩ số 30')
    expect(screen.getByText('Phòng chờ')).toBeTruthy()
    expect(container.querySelectorAll('.ct-pc-moi').length).toBe(0)
    rerender(<PhongChoCa {...p} em={[...EM, { sbd: '12003', hoTen: 'Lê Văn Bình' }]} />)
    expect(container.querySelectorAll('.ct-pc-moi').length).toBe(1)
    expect(container.querySelector('.ct-pc-moi')?.textContent).toBe('Văn Bình')
  })

  it('0 em: trạng thái trống + nút Chiếu mã lên bảng', () => {
    const onChieuMa = vi.fn()
    dung({ em: [], onChieuMa })
    expect(screen.getByText('Chưa em nào vào — mở Chiếu mã để lớp quét QR')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu mã lên bảng' }))
    expect(onChieuMa).toHaveBeenCalledTimes(1)
  })

  it('ca ôn câu sai: MỘT dòng nói theo số em đang chờ; không còn chữ A.I Đỗ Đại Học', () => {
    const { container } = dung({ onCauSai: true })
    expect(container.textContent).toContain('Ca ôn câu sai: bấm Bắt đầu, máy rút bộ câu riêng cho 2 em đang chờ; em vào sau nhận đề ngẫu nhiên như ca thường.')
    expect(container.textContent).not.toContain('A.I')
    expect(fs.readFileSync('src/components/ca-thi/PhongChoCa.tsx', 'utf8')).not.toContain('Đỗ Đại Học rút')
  })

  it('công tắc Đồng bộ giờ: đổi được, giải thích mở bằng nút (i); bài tập về nhà không có công tắc', () => {
    const onDoiDongBoGio = vi.fn()
    dung({ onDoiDongBoGio })
    const sw = screen.getByRole('switch', { name: 'Đồng bộ giờ cả phòng' }) as HTMLInputElement
    expect(sw.checked).toBe(false)
    fireEvent.click(sw)
    expect(onDoiDongBoGio).toHaveBeenCalledWith(true)
    expect(screen.queryByText(/Lựa chọn được lưu khi bắt đầu ca/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Giải thích Đồng bộ giờ cả phòng' }))
    expect(screen.getByText(/Lựa chọn được lưu khi bắt đầu ca/)).toBeTruthy()
    cleanup()
    dung({ coDongBoGio: false })
    expect(screen.queryByRole('switch')).toBeNull()
  })

  it('Bắt đầu thi: bấm là gọi; đang gửi GIỮ chữ, chỉ tắt nút', () => {
    const onBatDau = vi.fn()
    const { rerender, p } = dung({ onBatDau })
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thi' }))
    expect(onBatDau).toHaveBeenCalledTimes(1)
    rerender(<PhongChoCa {...p} dangBatDau />)
    const nut = screen.getByRole('button', { name: 'Bắt đầu thi' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    expect(nut.getAttribute('aria-busy')).toBe('true')
  })

  it('Huỷ ca kiểm tra HỎI LẠI trước; Không huỷ thì thôi; Huỷ ca mới gọi', () => {
    const onHuy = vi.fn()
    dung({ onHuy })
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ ca kiểm tra' }))
    expect(onHuy).not.toHaveBeenCalled()
    expect(screen.getByText(/Em đang chờ sẽ thấy báo ca đã huỷ/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Không huỷ' }))
    expect(screen.getByRole('button', { name: 'Huỷ ca kiểm tra' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ ca kiểm tra' }))
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ ca' }))
    expect(onHuy).toHaveBeenCalledTimes(1)
  })
})

describe('Thêm 5 phút khi ca còn ở phòng chờ', () => {
  it('ẩn khi chưa bấm Bắt đầu thi; hiện lại khi ca đã bắt đầu', () => {
    const ca = { trangThai: 'mo' as const, phongCho: true, batDauThiLuc: '', thoiGianPhut: 45 }
    const themPhut = { tong: 0, chay: vi.fn() }
    render(<KhoiThoiGianCa ca={ca} themPhut={themPhut} />)
    expect(screen.queryByRole('button', { name: 'Thêm 5 phút' })).toBeNull()
    cleanup()
    render(<KhoiThoiGianCa ca={{ ...ca, batDauThiLuc: new Date().toISOString() }} themPhut={themPhut} />)
    expect(screen.getByRole('button', { name: 'Thêm 5 phút' })).toBeTruthy()
  })
})
