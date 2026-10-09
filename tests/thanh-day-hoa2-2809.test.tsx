// THANH ĐÁY (< 880 px) CỦA APP THẦY THEO CỜ GAME HÓA 2.0: cờ bật ⇒ đúng các mục ThanhBenTrai hiện ở chế độ 2.0
// (MUC_HOA2_CHINH trên thanh — 5 mục; MUC_HOA2_DAY ở nút bánh răng thanh trên), lấy CÙNG nguồn danh sách; cờ tắt ⇒ như cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: vi.fn() }))

import BottomNav from '../src/components/BottomNav'
import { MUC_DIEU_HUONG, MUC_HOA2_CHINH, MUC_HOA2_DAY } from '../src/components/ThanhBenTrai'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { useAppStore } from '../src/store/appStore'

beforeEach(() => {
  useAppStore.getState().setScreen('lichsuca')
})
afterEach(() => {
  cleanup()
  useCoHoa2.getState().dat(null)
  localStorage.clear()
})

const nhanThanh = () => [...document.querySelectorAll('.day-thay-thanh .day-thay-muc')].map((b) => b.textContent?.trim())
const moThem = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
  return [...within(screen.getByRole('menu', { name: 'Thêm chức năng' })).getAllByRole('menuitem')].map((b) => b.textContent?.trim())
}

describe('thanh đáy theo cờ Game Hóa 2.0', () => {
  it('cờ TẮT ⇒ như cũ: 4 mục chính + Thêm, tờ Thêm đủ các mục còn lại', () => {
    render(<BottomNav />)
    expect(nhanThanh()).toEqual(['Hôm nay', 'Học sinh', 'Ca kiểm tra', 'Bài tập', 'Thêm'])
    // ĐỔI CÓ CHỦ Ý 02/10 (Vòng học v2): tờ Thêm có thêm "Gỡ nút thắt".
    expect(moThem()).toEqual(['Ngân hàng đề', 'Gọi lên bảng', 'Học sinh hỏi', 'Gỡ nút thắt', 'Giao đề theo tuần', 'Cài đặt'])
    expect(document.querySelector('nav.day-thay')?.hasAttribute('data-hoa2')).toBe(false)
  })

  // ĐỔI CÓ CHỦ Ý 28/09 (bản vẽ docs/ban-ve-gv-2809/GV-ThanhBen): 5 mục trên thanh, KHÔNG còn "Thêm"; Kho đề + Cài đặt ở bánh răng thanh trên.
  // ĐỔI CÓ CHỦ Ý 09/10 — bản vẽ tối giản thầy chốt 09/10: 5 mục Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề (≤ 5 — luật C6);
  // bánh răng = Cài đặt (vào thẳng); nút nổi "Mở ca" CHỈ ở màn Ca kiểm tra (mở ca nằm trong màn ấy).
  it('cờ BẬT ⇒ 5 mục của ThanhBenTrai 2.0 (cùng nguồn), không "Thêm"; ẩn Bài tập / Học sinh hỏi / Giao đề / Chữa bài / Chiến dịch', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    render(<BottomNav />)
    expect(nhanThanh()).toEqual(MUC_HOA2_CHINH.map((m) => m.ngan))
    expect(nhanThanh()).toEqual(['Hôm nay', 'Hành trình', 'Ca kiểm tra', 'Học sinh', 'Kho đề'])
    expect(nhanThanh().length).toBeLessThanOrEqual(5)
    expect(screen.queryByRole('button', { name: 'Thêm' })).toBeNull()
    for (const cu of ['Tổng quan', 'Chiến dịch', 'Chữa bài', 'Bài tập', 'Học sinh hỏi', 'Giao đề theo tuần', 'Giao bài tập về nhà', 'Lên bảng', 'Gỡ nút']) expect(nhanThanh()).not.toContain(cu)
    // đang ở Ca kiểm tra (beforeEach) ⇒ nút nổi Mở ca có mặt
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra' })).toBeTruthy()
  })

  it('cờ BẬT: nút nổi "Mở ca" chỉ ở màn Ca kiểm tra; cờ TẮT ⇒ như cũ (mọi màn trừ Theo dõi ca / Mở ca)', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    useAppStore.getState().setScreen('tongquan')
    const { unmount } = render(<BottomNav />)
    expect(screen.queryByRole('button', { name: 'Mở ca kiểm tra' })).toBeNull()
    unmount()
    useCoHoa2.getState().dat(null)
    render(<BottomNav />)
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra' })).toBeTruthy()
  })

  it('cờ BẬT: mục đang sáng theo danh sách 2.0; bánh răng thanh trên vào thẳng Cài đặt', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    useAppStore.getState().setScreen('exammonitor')
    render(<BottomNav />)
    const ca = [...document.querySelectorAll('.day-thay-thanh .day-thay-muc')].find((b) => b.textContent?.includes('Ca kiểm tra'))
    expect(ca?.getAttribute('aria-current')).toBe('page')
    expect(MUC_HOA2_DAY.map((m) => m.ten)).toEqual(['Cài đặt'])
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cài đặt' }))
    expect(useAppStore.getState().screen).toBe('caidat')
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Kho đề/ }))
    expect(useAppStore.getState().screen).toBe('nganhangde')
  })

  it('cờ TẮT vẫn dùng MUC_DIEU_HUONG (không đụng danh sách cũ)', () => {
    expect(MUC_DIEU_HUONG.map((m) => m.id)).toEqual(['examhub', 'hocsinh', 'lichsuca', 'nganhangde', 'giaobtvn', 'goilenbang', 'cauhoi', 'bangonutthat', 'khodegiao', 'caidat'])
  })
})
