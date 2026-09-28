// KHỐI PHÒNG CHỜ làm lại (thầy 28/09: "làm lại cho đẹp trực quan đồng bộ với thiết kế hiện tại. Có tự đồng bộ hs vào phòng chờ sau 5 giây").
// Kiểm: vòng tự làm mới 5 giây QUA NHỊP CHUNG app thầy (đồng hồ giả), dừng khi tab ẩn / rời màn, lỗi GIỮ danh sách cũ + chấm "mất kết nối" + lùi dần,
// trạng thái trống có nút Chiếu mã, Huỷ ca hỏi lại trước, Bắt đầu thi giữ chữ khi đang gửi, không còn chữ "A.I Đỗ Đại Học",
// và "Thêm 5 phút" ẩn khi ca còn ở phòng chờ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import PhongChoCa, { type PhongChoCaProps } from '../src/components/ca-thi/PhongChoCa'
import KhoiThoiGianCa from '../src/components/KhoiThoiGianCa'
import ExamMonitorScreen from '../src/screens/ExamMonitorScreen'
import { NHIP_PHONG_CHO_THAY, TUY_CHON_NHIP_THAY } from '../src/lib/nhip-may-thay'

const m = vi.hoisted(() => ({
  detail: vi.fn(),
  ca: { maCa: '123456', tenCa: 'Ca thử', loai: 'thi', lop: '12', phongCho: true, batDauThiLuc: '', thoiGianPhut: 45, trangThai: 'mo', phamVi: 'tu_do', congBo: 'khong', dongBoGio: false },
}))
vi.mock('../src/store/appStore', () => ({ useAppStore: (select: (s: unknown) => unknown) => select({ maCaTheoDoi: '123456', classList: [], setScreen: vi.fn(), showToast: vi.fn() }) }))
vi.mock('../src/lib/exam-db', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  loadScriptUrl: async () => 'https://local.test',
  loadTeacherSecret: async () => 'test-only',
  loadSessionTeacherBank: async () => null,
  docSoCauCa: async () => undefined,
  docDeRiengCa: async () => undefined,
  docCheDoDeRieng: async () => false,
}))
vi.mock('../src/lib/exam-api', async (original) => ({ ...(await original<Record<string, unknown>>()), chiTietCa: m.detail, danhSachCa: async () => [] }))

let an = false
beforeEach(() => {
  an = false
  m.ca.batDauThiLuc = ''
  vi.useFakeTimers()
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (an ? 'hidden' : 'visible') })
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => an })
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

describe('Theo dõi ca · phòng chờ tự làm mới 5 giây QUA NHỊP CHUNG (useNhipThay + NHIP_PHONG_CHO_THAY)', () => {
  const EM3 = [
    { sbd: '12001', hoTen: 'Nguyễn Minh Anh', vaoLuc: '2026-09-28T07:00:00Z' },
    { sbd: '12002', hoTen: 'Trần Thu Hà', vaoLuc: '2026-09-28T07:00:00Z' },
  ]
  let loiMang = false
  let dsCho = EM3.slice(0, 1)
  beforeEach(() => {
    loiMang = false
    dsCho = EM3.slice(0, 1)
    m.detail.mockReset()
    m.detail.mockImplementation(async () => {
      if (loiMang) throw new Error('mất mạng')
      return { ca: { ...m.ca }, luot: [], dsCho, biChan: [] }
    })
  })
  /** Vẽ màn, chờ tải lần đầu xong (khối phòng chờ hiện). */
  const moMan = async () => {
    const r = render(<ExamMonitorScreen />)
    await nhay(0)
    await nhay(0)
    expect(r.container.querySelector('[data-vung="phong-cho"]')).toBeTruthy()
    return r
  }

  it('nhịp 5 giây là hằng của bảng nhịp app thầy; tuỳ chọn lùi ≤ 40 s', () => {
    expect(NHIP_PHONG_CHO_THAY).toBe(5000)
    expect(Math.max(...TUY_CHON_NHIP_THAY.phongCho.luiDanMs)).toBeLessThanOrEqual(40_000)
  })

  it('mạng tốt: tải lại chi tiết ca mỗi 5 giây; em mới vào hiện ngay', async () => {
    const { container } = await moMan()
    const dau = m.detail.mock.calls.length
    dsCho = EM3
    await nhay(4900)
    expect(m.detail.mock.calls.length).toBe(dau)
    await nhay(200)
    expect(m.detail.mock.calls.length).toBe(dau + 1)
    expect(container.querySelector('.ct-pc-dem')?.textContent).toContain('2em đang chờ')
    await nhay(10_000)
    expect(m.detail.mock.calls.length).toBe(dau + 3)
    expect(screen.getByText('tự cập nhật')).toBeTruthy()
  })

  it('tab ẩn ⇒ không gọi; rời màn ⇒ dừng hẳn', async () => {
    const r = await moMan()
    const dau = m.detail.mock.calls.length
    an = true
    await nhay(20_000)
    expect(m.detail.mock.calls.length).toBe(dau)
    an = false
    r.unmount()
    await nhay(20_000)
    expect(m.detail.mock.calls.length).toBe(dau)
  })

  it('lỗi mạng ⇒ GIỮ danh sách cũ + chấm "mất kết nối", lùi dần (không dội 5 s); tải lại được thì hết chấm', async () => {
    await moMan()
    loiMang = true
    await nhay(5100)
    expect(screen.getByText('mất kết nối')).toBeTruthy()
    expect(screen.getByText('Minh Anh')).toBeTruthy()
    const sauLoi = m.detail.mock.calls.length
    await nhay(20_000)
    expect(m.detail.mock.calls.length).toBe(sauLoi) // lùi 30 s, không gọi lại mỗi 5 s
    loiMang = false
    await nhay(10_100)
    expect(m.detail.mock.calls.length).toBe(sauLoi + 1)
    expect(screen.queryByText('mất kết nối')).toBeNull()
  })

  it('ca đã bấm Bắt đầu thi ⇒ không còn khối phòng chờ, không còn nhịp 5 giây', async () => {
    m.ca.batDauThiLuc = '2026-09-28T07:00:00Z'
    render(<ExamMonitorScreen />)
    await nhay(0)
    await nhay(0)
    const dau = m.detail.mock.calls.length
    await nhay(15_000)
    expect(m.detail.mock.calls.length).toBe(dau)
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
