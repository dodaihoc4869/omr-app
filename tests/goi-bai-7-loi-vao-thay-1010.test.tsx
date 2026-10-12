// @vitest-environment jsdom
// Kiểm đường vào màn Hành trình thật: không thay HanhTrinhV2 bằng bản giả.
// SỬA CÓ CHỦ ĐÍCH — thầy 12/10: Hành trình còn 2 mục ("thu gọn tối giản hết lại thành 2 mục": Dạy học & đầu giờ · Chữa bài). Thẻ "Bài mới trong
// 7 ngày" bỏ khỏi màn: tiến độ từng gói nay là bảng "Bài đang giao" ở bước 4 (Tick bài vừa dạy) của mục Dạy học & đầu giờ — kiểm ở
// tests/hanh-trinh-2-muc-1210.test.tsx; câu nhiều em sai ở mục Chữa bài. `BangGoi7` vẫn dùng ở Bảng chiến dịch (tests/goi-bai-7-giao-dien-1010,
// tests/goi-bai-7-trung-tu-1210). Ở đây chỉ còn kiểm: không còn thẻ ấy, và KHOÁ CŨ `goi-7` của lối vào khác không gãy.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { goiLenh } from '../src/lib/goi-lenh-thay'
import { mucHanhTrinh, useSoDemGv } from '../src/lib/so-dem-gv'
import ChienDichScreen from '../src/screens/ChienDichScreen'

vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: vi.fn() }))
vi.mock('../src/components/chien-dich/TheBaiDaDay', () => ({ default: () => <p>Bài đã dạy</p> }))

beforeEach(() => {
  useSoDemGv.setState({ giaoTuCa: null, moHanhTrinh: null, canThayChua: null })
  vi.mocked(goiLenh).mockResolvedValue({ ok: true, du: { bat: true, goi: [], cau: [], em: [] } })
})
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

it('Hành trình không còn thẻ "Bài mới trong 7 ngày"; mở màn không đọc gói 7 ngày ở chỗ nào khác ngoài mục Dạy học', async () => {
  render(<ChienDichScreen />)
  await screen.findByText('Bài đã dạy')
  expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Dạy học & đầu giờ', 'Chữa bài'])
  expect(screen.queryByRole('tab', { name: 'Bài mới trong 7 ngày' })).toBeNull()
  expect(screen.queryByRole('region', { name: 'Bài mới trong 7 ngày' })).toBeNull()
  expect(goiLenh).not.toHaveBeenCalled()
})

it('khoá cũ { the: goi-7 } từ màn khác ⇒ mục Dạy học & đầu giờ (nơi có bảng Bài đang giao), yêu cầu được tiêu thụ một lần', async () => {
  expect(mucHanhTrinh('goi-7')).toBe('day-hoc')
  useSoDemGv.getState().datMoHanhTrinh({ the: 'goi-7' })
  render(<ChienDichScreen />)
  expect(screen.getByRole('tab', { name: 'Dạy học & đầu giờ' }).getAttribute('aria-selected')).toBe('true')
  await screen.findByText('Bài đã dạy')
  await waitFor(() => expect(useSoDemGv.getState().moHanhTrinh).toBeNull())
})
