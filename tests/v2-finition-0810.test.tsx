import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import HanhTrinhDashboard from '../src/components/chien-dich/HanhTrinhDashboard'
import DongHanh from '../src/components/bat-linh/DongHanh'
import { BANG } from '../scripts/chup-omni-3/gia/bang-gv'

const { lire, liste } = vi.hoisted(() => ({ lire: vi.fn(), liste: vi.fn() }))
vi.mock('../src/components/chien-dich/api', async (original) => ({
  ...(await original<typeof import('../src/components/chien-dich/api')>()),
  docBang: lire, danhSachThongKe: liste,
}))
beforeEach(() => {
  liste.mockResolvedValue({ ok: true, du: { chienDich: [{ ...BANG.chienDich, id: 'hanh-trinh-gioi-hoa-khoi-12', ten: 'Hành trình giỏi Hóa · Khối 12', hanhTrinh: true, khoiHanhTrinh: 12 }] } })
  lire.mockResolvedValue({ ok: true, du: BANG })
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('bảng V2 hiện kế hoạch và số câu đã làm thật, không số phút tự bịa', async () => {
  render(<HanhTrinhDashboard />)
  const region = await screen.findByRole('region', { name: 'Kế hoạch của từng học sinh' })
  expect(await within(region).findByText(BANG.em[0].ten)).toBeTruthy()
  expect(within(region).getByText(`SBD ${BANG.em[0].sbd} · ${BANG.em[0].coXat} câu đã làm`)).toBeTruthy()
  expect(screen.getByText('Mức theo dạng')).toBeTruthy()
  expect(screen.queryByText('14–22 phút')).toBeNull()
})

it('lọc theo số báo danh không thay đổi dữ liệu của em', async () => {
  render(<HanhTrinhDashboard />)
  await screen.findByText(BANG.em[0].ten)
  fireEvent.change(screen.getByRole('textbox', { name: 'Tìm học sinh' }), { target: { value: 'khong-co-em-nay' } })
  expect(screen.getByText('Không có học sinh khớp tìm kiếm.')).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Tìm học sinh' }), { target: { value: BANG.em[0].sbd } })
  expect(screen.getByText(BANG.em[0].ten)).toBeTruthy()
})

it('mất dữ liệu không biến thành lớp có 0 em cần gỡ lỗi', async () => {
  lire.mockResolvedValue({ ok: false, chu: 'Không kết nối được', loai: 'mang' })
  render(<HanhTrinhDashboard />)
  expect(await screen.findByText('Chưa tải được kế hoạch học sinh.')).toBeTruthy()
  expect(within(screen.getByLabelText('Tóm tắt hành trình')).getAllByText('—')).toHaveLength(3)
})

it('hero giữ đúng tên, cấp và hình tiến hóa của thần thú học sinh', () => {
  const mo = vi.fn()
  render(<DongHanh thu={{ index: 2, cap: 32, ten: 'Lửa nhỏ' }} tenHanhTrinh="Hành trình giỏi Hóa · Khối 12" onMo={mo} />)
  expect(screen.getByRole('heading', { name: 'Hành trình giỏi Hóa · Khối 12' })).toBeTruthy()
  const button = screen.getByRole('button', { name: 'Gặp Lửa nhỏ, cấp 32' })
  expect(button.querySelector('img')?.getAttribute('src')).toContain('thu-2-2.webp')
  fireEvent.click(button)
  expect(mo).toHaveBeenCalledOnce()
})

it('tên bài không thay nhầm tiêu đề hành trình', () => {
  render(<DongHanh thu={null} tenHanhTrinh="Bài 5 · Saccharose" onMo={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Hành trình giỏi Hóa' })).toBeTruthy()
})
