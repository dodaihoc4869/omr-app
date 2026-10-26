// Cổng phụ huynh mở bằng liên kết riêng: lệnh xác định con (mạng) chạy SONG SONG với việc đọc địa chỉ đã lưu (IndexedDB).
// Trước 21/10 hai việc nối tiếp — IndexedDB mở chậm trên máy yếu thì lệnh mạng đứng chờ vô ích.
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ParentPortalScreen from '../src/screens/ParentPortalScreen'
import { xoaPass } from '../src/lib/ph-token'
import './_ph-nap-trang-cu' // trang cũ nạp lười (26/10): chờ mảnh về trước các test

const m = vi.hoisted(() => ({ xac: vi.fn(), datPass: vi.fn(), url: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: m.url }))
vi.mock('../src/lib/exam-api', () => ({ tenTheoSbd: async () => null }))
vi.mock('../src/lib/ph-token', async (goc) => ({ ...await goc<typeof import('../src/lib/ph-token')>(), xacDinhPhuHuynh: m.xac }))
vi.mock('../src/lib/mom-api', () => ({ datPassPhuHuynh: m.datPass }))
vi.mock('../src/components/ph-v3/AppPhuHuynh', () => ({ default: ({ sbd, hoTen }: { sbd: string; hoTen: string }) => <h1>{`Con ${sbd} ${hoTen}`}</h1> }))
beforeEach(() => { xoaPass(); localStorage.clear(); m.xac.mockReset(); m.datPass.mockReset(); m.url.mockReset() })
afterEach(() => { cleanup(); xoaPass(); localStorage.clear() })

it('lệnh xác định con đi NGAY, không chờ đọc địa chỉ đã lưu; địa chỉ về muộn vẫn vào đúng con', async () => {
  let traUrl!: (u: string) => void
  m.url.mockImplementation(() => new Promise<string>((r) => { traUrl = r }))
  m.xac.mockResolvedValue({ ok: true, sbd: 'A1', hoTen: 'Con A', lop: '12' })
  localStorage.setItem('omr_ph_pass', 'LIEN-KET-GIA')
  render(<ParentPortalScreen />)
  await waitFor(() => expect(m.xac).toHaveBeenCalledWith('LIEN-KET-GIA'))
  expect(m.xac).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('heading', { name: /Con A1/ })).toBeNull() // địa chỉ chưa về ⇒ chưa vào
  await act(async () => traUrl('/test'))
  await screen.findByRole('heading', { name: 'Con A1 Con A' })
  expect(m.datPass).toHaveBeenCalledWith('LIEN-KET-GIA')
  expect(m.xac).toHaveBeenCalledTimes(1) // không gọi lần hai
})

it('liên kết bị từ chối: hiện câu của máy chủ và cho nhập số báo danh như cũ', async () => {
  m.url.mockResolvedValue('/test')
  m.xac.mockResolvedValue({ ok: false, error: 'Liên kết không dùng được. Anh/chị nhờ Thầy gửi lại liên kết.' })
  localStorage.setItem('omr_ph_pass', 'LIEN-KET-HONG')
  render(<ParentPortalScreen />)
  await screen.findByText(/Liên kết không dùng được/)
  expect(screen.getByLabelText('Số báo danh của con')).toBeTruthy()
  expect(localStorage.getItem('omr_ph_pass')).toBeNull()
})

it('không có liên kết: không gọi lệnh xác định, vào bằng số báo danh đã lưu', async () => {
  m.url.mockResolvedValue('/test')
  localStorage.setItem('omr_ph_sbd', 'B7')
  render(<ParentPortalScreen />)
  await screen.findByRole('heading', { name: /Con B7/ })
  expect(m.xac).not.toHaveBeenCalled()
})

it('lần đầu (máy chưa lưu gì): ô số báo danh tự lấy tiêu điểm; máy đã lưu liên kết hoặc số báo danh: KHÔNG (bàn phím không bật rồi tắt)', async () => {
  m.url.mockImplementation(() => new Promise(() => {})) // giữ ở màn nhập
  const { unmount } = render(<ParentPortalScreen />)
  expect(document.activeElement).toBe(screen.getByLabelText('Số báo danh của con'))
  unmount()
  localStorage.setItem('omr_ph_pass', 'LIEN-KET-DA-LUU')
  m.xac.mockImplementation(() => new Promise(() => {}))
  const r2 = render(<ParentPortalScreen />)
  expect(document.activeElement).not.toBe(screen.getByLabelText('Số báo danh của con'))
  expect(screen.getByLabelText('Số báo danh của con')).toBeTruthy() // ô vẫn hiện, nhập được
  r2.unmount()
  xoaPass(); localStorage.clear(); localStorage.setItem('omr_ph_sbd', 'B9')
  render(<ParentPortalScreen />)
  expect(document.activeElement).not.toBe(screen.getByLabelText('Số báo danh của con'))
})

