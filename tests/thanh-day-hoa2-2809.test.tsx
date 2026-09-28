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
    expect(moThem()).toEqual(['Ngân hàng đề', 'Gọi lên bảng', 'Học sinh hỏi', 'Giao đề theo tuần', 'Cài đặt'])
    expect(document.querySelector('nav.day-thay')?.hasAttribute('data-hoa2')).toBe(false)
  })

  // ĐỔI CÓ CHỦ Ý 28/09 (bản vẽ docs/ban-ve-gv-2809/GV-ThanhBen): 5 mục trên thanh, KHÔNG còn "Thêm"; Kho đề + Cài đặt ở bánh răng thanh trên.
  it('cờ BẬT ⇒ 5 mục của ThanhBenTrai 2.0 (cùng nguồn), không "Thêm"; ẩn Hôm nay / Bài tập / Học sinh hỏi / Giao đề', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    render(<BottomNav />)
    expect(nhanThanh()).toEqual(MUC_HOA2_CHINH.map((m) => m.ngan))
    expect(nhanThanh()).toEqual(['Tổng quan', 'Ca kiểm tra', 'Chiến dịch', 'Chữa bài', 'Học sinh'])
    expect(screen.queryByRole('button', { name: 'Thêm' })).toBeNull()
    for (const cu of ['Hôm nay', 'Bài tập', 'Học sinh hỏi', 'Giao đề theo tuần', 'Giao bài tập về nhà', 'Lên bảng']) expect(nhanThanh()).not.toContain(cu)
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra' })).toBeTruthy()
  })

  it('cờ BẬT: mục đang sáng theo danh sách 2.0; bánh răng thanh trên mở Kho đề · Cài đặt', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    useAppStore.getState().setScreen('exammonitor')
    render(<BottomNav />)
    const ca = [...document.querySelectorAll('.day-thay-thanh .day-thay-muc')].find((b) => b.textContent?.includes('Ca kiểm tra'))
    expect(ca?.getAttribute('aria-current')).toBe('page')
    fireEvent.click(screen.getByRole('button', { name: 'Kho đề và Cài đặt' }))
    const menu = screen.getByRole('menu', { name: 'Kho đề và Cài đặt' })
    expect([...within(menu).getAllByRole('menuitem')].map((b) => b.textContent?.trim())).toEqual(MUC_HOA2_DAY.map((m) => m.ten))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Kho đề' }))
    expect(useAppStore.getState().screen).toBe('nganhangde')
  })

  it('cờ TẮT vẫn dùng MUC_DIEU_HUONG (không đụng danh sách cũ)', () => {
    expect(MUC_DIEU_HUONG.map((m) => m.id)).toEqual(['examhub', 'hocsinh', 'lichsuca', 'nganhangde', 'giaobtvn', 'goilenbang', 'cauhoi', 'khodegiao', 'caidat'])
  })
})
