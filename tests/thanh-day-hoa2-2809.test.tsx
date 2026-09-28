// THANH ĐÁY (< 880 px) CỦA APP THẦY THEO CỜ GAME HÓA 2.0: cờ bật ⇒ đúng các mục ThanhBenTrai hiện ở chế độ 2.0
// (MUC_HOA2_CHINH trên thanh, MUC_HOA2_THEM ở tờ "Thêm"), lấy CÙNG nguồn danh sách; cờ tắt ⇒ như cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: vi.fn() }))

import BottomNav from '../src/components/BottomNav'
import { MUC_DIEU_HUONG, MUC_HOA2_CHINH, MUC_HOA2_THEM } from '../src/components/ThanhBenTrai'
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

  it('cờ BẬT ⇒ đúng danh sách của ThanhBenTrai 2.0 (cùng nguồn), ẩn Hôm nay / Bài tập / Học sinh hỏi / Giao đề', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    render(<BottomNav />)
    expect(nhanThanh()).toEqual([...MUC_HOA2_CHINH.map((m) => m.ngan), 'Thêm'])
    expect(nhanThanh()).toEqual(['Ca kiểm tra', 'Lên bảng', 'Thêm'])
    expect(moThem()).toEqual(MUC_HOA2_THEM.map((m) => m.ten))
    const tatCa = [...nhanThanh(), ...MUC_HOA2_THEM.map((m) => m.ten)]
    for (const cu of ['Hôm nay', 'Bài tập', 'Học sinh hỏi', 'Giao đề theo tuần', 'Giao bài tập về nhà']) expect(tatCa).not.toContain(cu)
    expect(screen.getByRole('button', { name: 'Mở ca kiểm tra' })).toBeTruthy()
  })

  it('cờ BẬT: mục đang sáng theo danh sách 2.0; bấm mục trong Thêm thì chuyển màn', () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    useAppStore.getState().setScreen('exammonitor')
    render(<BottomNav />)
    const ca = [...document.querySelectorAll('.day-thay-thanh .day-thay-muc')].find((b) => b.textContent?.includes('Ca kiểm tra'))
    expect(ca?.getAttribute('aria-current')).toBe('page')
    moThem()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Học sinh' }))
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  it('cờ TẮT vẫn dùng MUC_DIEU_HUONG (không đụng danh sách cũ)', () => {
    expect(MUC_DIEU_HUONG.map((m) => m.id)).toEqual(['examhub', 'hocsinh', 'lichsuca', 'nganhangde', 'giaobtvn', 'goilenbang', 'cauhoi', 'khodegiao', 'caidat'])
  })
})
