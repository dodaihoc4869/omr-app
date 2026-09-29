// GAME HÓA 2.0 · VỎ APP THẦY: thanh bên chỉ còn "Mở ca kiểm tra" + Ca kiểm tra + Lên bảng + "Thêm…" (Học sinh, Ngân hàng đề,
// Cài đặt) KHI CỜ BẬT; cờ tắt ⇒ đúng danh sách cũ. Công tắc ở Cài đặt hỏi lại nói rõ hậu quả rồi mới `co-luu`.
// Gọi lên bảng khi cờ bật ⇒ chế độ chiến dịch.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', () => ({ loadExamSources: async () => [] }))

import ThanhBenTrai, { MAN_AN_KHI_HOA2, mucDangSang } from '../src/components/ThanhBenTrai'
import CongTacHoa2 from '../src/components/chien-dich/CongTacHoa2'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import GoiLenBangScreen from '../src/screens/GoiLenBangScreen'
import { useAppStore } from '../src/store/appStore'

beforeEach(() => {
  goi.mockReset()
  useAppStore.getState().setScreen('lichsuca')
})
afterEach(() => {
  cleanup()
  useCoHoa2.getState().dat(null)
  localStorage.clear()
})

const tenMuc = () => [...document.querySelectorAll('.ben-trai-muc')].map((b) => b.getAttribute('aria-label'))

describe('thanh bên theo cờ', () => {
  it('cờ TẮT ⇒ đúng danh sách cũ (Hôm nay, Giao bài tập về nhà, Học sinh hỏi… còn nguyên)', () => {
    render(<ThanhBenTrai />)
    expect(tenMuc()).toEqual(['Hôm nay', 'Học sinh', 'Ca kiểm tra', 'Ngân hàng đề', 'Giao bài tập về nhà', 'Gọi lên bảng', 'Học sinh hỏi', 'Giao đề theo tuần', 'Cài đặt'])
    expect(screen.queryByText('Thêm…')).toBeNull()
  })

  // ĐỔI CÓ CHỦ Ý 28/09 (bản vẽ thầy chốt docs/ban-ve-gv-2809/GV-ThanhBen): 5 mục + đáy Kho đề · Cài đặt; bỏ "Thêm…", "Lên bảng" → "Chữa trên lớp".
  it('cờ BẬT ⇒ "Mở ca kiểm tra" + Tổng quan · Ca kiểm tra · Chiến dịch luyện · Chữa trên lớp · Học sinh + vạch + đáy Kho đề · Cài đặt; ẩn 4 màn cũ', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    const { container } = render(<ThanhBenTrai />)
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra' })).toBeTruthy()
    expect(tenMuc()).toEqual(['Tổng quan', 'Ca kiểm tra', 'Chiến dịch luyện', 'Chữa trên lớp', 'Học sinh', 'Kho đề', 'Cài đặt'])
    expect(container.querySelector('.ben-trai-vach[role="separator"]')).toBeTruthy()
    expect(screen.queryByText('Thêm…')).toBeNull()
    expect(container.textContent).not.toContain('10²³')
    expect(container.textContent).toContain('Đỗ Đại Học')
    expect(container.textContent).toContain('Giáo viên')
    expect(screen.getByRole('button', { name: 'Ca kiểm tra' }).getAttribute('aria-current')).toBe('page')
    fireEvent.click(screen.getByRole('button', { name: 'Chữa trên lớp' }))
    expect(useAppStore.getState().screen).toBe('goilenbang')
    fireEvent.click(screen.getByRole('button', { name: 'Chiến dịch luyện' }))
    expect(useAppStore.getState().screen).toBe('chiendich')
    expect(MAN_AN_KHI_HOA2).toEqual(['examhub', 'giaobtvn', 'cauhoi', 'khodegiao'])
    expect(mucDangSang('toancanh', true)).toBe('hocsinh')
    expect(mucDangSang('exammonitor', true)).toBe('lichsuca')
    expect(mucDangSang('toancanh')).toBe('examhub')
  })

  it('máy chủ chưa có lệnh ⇒ cờ về TẮT (app như cũ)', async () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    goi.mockResolvedValue({ ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh' })
    await useCoHoa2.getState().doc()
    expect(useCoHoa2.getState().co).toBeNull()
  })
})

describe('công tắc Game Hóa 2.0 ở Cài đặt', () => {
  it('bật cả trung tâm: hộp xác nhận nói rõ hậu quả; Huỷ không lưu; xác nhận ⇒ `co-luu` và cờ bật', async () => {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: false, lop: [], sbd: [] } } }
      if (b.action === 'co-luu') return { ok: true, du: { ok: true, co: { bat: b.bat, lop: b.lop, sbd: b.sbd } } }
      return { ok: false, loai: 'tu_choi', chu: 'lệnh lạ' }
    })
    render(<CongTacHoa2 />)
    await waitFor(() => expect(goi.mock.calls.some(([, b]) => b.action === 'co-doc')).toBe(true))
    expect(screen.getByRole('radio', { name: 'Tắt' }).getAttribute('aria-checked')).toBe('true')
    const luu = screen.getByRole('button', { name: /Lưu và tắt/ }) as HTMLButtonElement
    expect(luu.disabled).toBe(true)

    fireEvent.click(screen.getByRole('radio', { name: 'Bật cả trung tâm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu và bật Game Hóa 2.0' }))
    let hop = screen.getByRole('alertdialog')
    expect(within(hop).getByRole('heading', { name: 'Bật Game Hóa 2.0 cho cả trung tâm?' })).toBeTruthy()
    expect(hop.textContent).toContain('chỉ còn Sảnh game')
    expect(hop.textContent).toContain('Bài tập về nhà (BTVN) ngừng')
    expect(hop.textContent).toContain('app phụ huynh ngừng')
    fireEvent.click(within(hop).getByRole('button', { name: 'Huỷ' }))
    expect(goi.mock.calls.some(([, b]) => b.action === 'co-luu')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu và bật Game Hóa 2.0' }))
    hop = screen.getByRole('alertdialog')
    fireEvent.click(within(hop).getByRole('button', { name: 'Bật Game Hóa 2.0' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/chien-dich', { action: 'co-luu', bat: true, lop: [], sbd: [] }))
    await waitFor(() => expect(useCoHoa2.getState().co?.bat).toBe(true))
  })

  it('bật theo lớp: phải nhập lớp; gửi đúng danh sách lớp', async () => {
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
      if (b.action === 'co-doc') return { ok: true, du: { ok: true, co: { bat: false, lop: [], sbd: [] } } }
      return { ok: true, du: { ok: true, co: { bat: b.bat, lop: b.lop, sbd: b.sbd } } }
    })
    render(<CongTacHoa2 />)
    await waitFor(() => expect(goi).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('radio', { name: 'Bật theo lớp' }))
    expect((screen.getByRole('button', { name: 'Lưu và bật Game Hóa 2.0' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Các lớp bật/), { target: { value: '12A1, 12A2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu và bật Game Hóa 2.0' }))
    const hop = screen.getByRole('alertdialog')
    expect(within(hop).getByRole('heading', { name: 'Bật Game Hóa 2.0 cho các lớp 12A1, 12A2?' })).toBeTruthy()
    fireEvent.click(within(hop).getByRole('button', { name: 'Bật Game Hóa 2.0' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/chien-dich', { action: 'co-luu', bat: true, lop: ['12A1', '12A2'], sbd: [] }))
  })
})

describe('Gọi lên bảng theo cờ', () => {
  it('cờ BẬT ⇒ chế độ chiến dịch (chọn chiến dịch ở đầu màn, gọi `danh-sach`)', async () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    goi.mockResolvedValue({ ok: true, du: { ok: true, homNay: '2026-10-05', chienDich: [] } })
    render(<GoiLenBangScreen />)
    expect(await screen.findByRole('heading', { name: 'Chưa có chiến dịch nào' })).toBeTruthy()
    expect(goi).toHaveBeenCalledWith('/gv/chien-dich', { action: 'danh-sach' })
    // Thầy lệnh 28/09: xoá khối "Gọi lên bảng theo một ca kiểm tra (cách cũ)"; đầu mục có thẻ Chiến dịch · Dạy học (+ Kiểm tra đầu giờ, 29/09).
    expect(screen.queryByRole('button', { name: /cách cũ/ })).toBeNull()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Chiến dịch', 'Dạy học', 'Kiểm tra đầu giờ'])
    expect(screen.getByRole('tab', { name: 'Chiến dịch' }).getAttribute('aria-selected')).toBe('true')
  })
})
