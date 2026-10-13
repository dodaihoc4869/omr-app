// @vitest-environment jsdom
// Tick ACK trước ctx.waitUntil: bảng cần đợi đúng gói, không đứng yên hoặc đọc chi tiết nặng.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (...a: unknown[]) => goi(...a) }))
import BangBaiDangGiao from '../src/components/chien-dich/BangBaiDangGiao'
import { baoBaiDangGiaoThayDoi } from '../src/lib/bai-dang-giao-thay-doi'
const GOC = { id: 'g1', khoa_bai: 'B1', ten: 'Bài 1. Ester', lop: '12A1', han: '2026-10-20', bat_dau: '2026-10-14' }
const MOI = { ...GOC, id: 'g2', khoa_bai: 'B2', ten: 'Bài 2. Lipid' }
const bang = (ds = [GOC]) => ({ ok: true, du: { bat: true, goi: ds, serverNow: Date.parse('2026-10-14T00:00:00+07:00'), thongKe: Object.fromEntries(ds.map(g => [g.id, { soEm: 2, pGap: 50, pTuLam: 25 }])) } })
const doi = () => { let tra!: (r: unknown) => void; return { cho: new Promise(r => { tra = r }), tra: (r: unknown) => tra(r) } }
const nhip = async (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
const baoTick = () => act(() => baoBaiDangGiaoThayDoi([{ lop: '12A1', khoaBai: 'B2', loai: 'tick' }]))
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-14T00:00:00+07:00'))
  goi.mockReset(); goi.mockResolvedValue(bang())
})
afterEach(() => { cleanup(); vi.useRealTimers() })

it('tick mới tự đọc tổng hợp, đợi tác vụ nền đến đúng bài/lớp; giữ bảng/ngày nháp và dừng khi sẵn sàng', async () => {
  const { container } = render(<BangBaiDangGiao />)
  await nhip()
  const table = container.querySelector('table')
  fireEvent.click(screen.getByRole('button', { name: 'Sửa hạn Bài 1. Ester · 12A1' }))
  const o = screen.getByLabelText('Hạn mới của Bài 1. Ester · 12A1') as HTMLInputElement
  fireEvent.change(o, { target: { value: '2026-10-22' } })
  goi.mockResolvedValueOnce(bang([{ ...MOI, lop: '12B' }, GOC])) // Cùng khóa bài ở lớp khác chưa phải gói vừa tick.
  goi.mockResolvedValueOnce(bang([GOC, MOI]))
  baoTick(); expect(screen.getByText('Đang cập nhật bài vừa thay đổi…')).toBeTruthy()
  await nhip()
  expect(goi).toHaveBeenCalledTimes(2)
  expect(container.querySelector('table')).toBe(table); expect(o.value).toBe('2026-10-22')
  await nhip(800)
  expect(screen.getByRole('button', { name: 'Sửa hạn Bài 2. Lipid · 12A1' })).toBeTruthy()
  expect(screen.queryByText('Đang cập nhật bài vừa thay đổi…')).toBeNull()
  expect(o.isConnected).toBe(true); expect(o.value).toBe('2026-10-22')
  await nhip(60_000)
  expect(goi.mock.calls.map(([, b]) => b)).toEqual([{ action: 'tong_hop' }, { action: 'tong_hop' }, { action: 'tong_hop' }])
})
it('bỏ tick tự gỡ gói sau ACK; không đọc lại mã chi tiết hay buộc đồng bộ', async () => {
  goi.mockResolvedValueOnce(bang([GOC, MOI])).mockResolvedValueOnce(bang())
  render(<BangBaiDangGiao />); await nhip()
  act(() => baoBaiDangGiaoThayDoi([{ lop: '12A1', khoaBai: 'B2', loai: 'bo-tick' }]))
  await nhip()
  expect(screen.queryByRole('button', { name: 'Sửa hạn Bài 2. Lipid · 12A1' })).toBeNull()
  expect(goi.mock.calls.map(([, b]) => b.action)).toEqual(['tong_hop', 'tong_hop'])
})
it('Cập nhật tay thấy gói mới thì tắt trạng thái chờ và hủy lượt retry chưa chạy', async () => {
  render(<BangBaiDangGiao />); await nhip()
  baoTick(); await nhip()
  expect(screen.getByText('Đang cập nhật bài vừa thay đổi…')).toBeTruthy()
  goi.mockResolvedValueOnce(bang([GOC, MOI]))
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' })); await nhip()
  expect(screen.queryByText('Đang cập nhật bài vừa thay đổi…')).toBeNull()
  await nhip(60_000); expect(goi).toHaveBeenCalledTimes(3)
})
it('lỗi mạng giữ bảng, dừng tự đọc và báo rõ để thử lại', async () => {
  const { container } = render(<BangBaiDangGiao />); await nhip()
  const table = container.querySelector('table')
  goi.mockResolvedValueOnce({ ok: false, chu: 'Không nối được máy chủ.' })
  baoTick(); await nhip()
  expect(screen.getByRole('alert').textContent).toContain('Không nối được máy chủ')
  expect(screen.queryByText('Đang cập nhật bài vừa thay đổi…')).toBeNull()
  expect(container.querySelector('table')).toBe(table)
  await nhip(60_000); expect(goi).toHaveBeenCalledTimes(2)
})
it('gói chưa tạo chỉ đọc tối đa 6 lần, giữ bảng và có Cập nhật để thử tiếp', async () => {
  const { container } = render(<BangBaiDangGiao />); await nhip()
  const table = container.querySelector('table')
  baoTick(); await nhip(60_000)
  expect(goi).toHaveBeenCalledTimes(7) // Một lần mở + sáu lần chờ sau tick.
  expect(screen.getByRole('alert').textContent).toContain('chưa cập nhật đủ bài')
  expect(container.querySelector('table')).toBe(table)
  goi.mockResolvedValueOnce(bang([GOC, MOI]))
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' })); await nhip()
  expect(screen.getByRole('button', { name: 'Sửa hạn Bài 2. Lipid · 12A1' })).toBeTruthy()
})
it('đọc cũ đang chờ lúc tick không đè bảng; nhiều thông báo được gộp và unmount hủy lịch đọc', async () => {
  const cho = doi()
  goi.mockImplementationOnce(() => cho.cho)
  const { unmount } = render(<BangBaiDangGiao />)
  baoTick(); baoTick(); await nhip()
  expect(goi).toHaveBeenCalledTimes(1)
  await act(async () => cho.tra(bang()))
  expect(screen.queryByRole('button', { name: 'Sửa hạn Bài 1. Ester · 12A1' })).toBeNull()
  goi.mockResolvedValueOnce(bang([GOC, MOI])); await nhip(800)
  expect(screen.getByRole('button', { name: 'Sửa hạn Bài 2. Lipid · 12A1' })).toBeTruthy()
  baoTick(); unmount(); await nhip(60_000)
  expect(goi).toHaveBeenCalledTimes(2)
  baoTick(); await nhip(60_000); expect(goi).toHaveBeenCalledTimes(2)
})
it('Save đang chờ không bị nhân đọc; ACK và Đã lưu vẫn được giữ sau tự cập nhật', async () => {
  const { container } = render(<BangBaiDangGiao />); await nhip()
  fireEvent.click(screen.getByRole('button', { name: 'Sửa hạn Bài 1. Ester · 12A1' }))
  const o = screen.getByLabelText('Hạn mới của Bài 1. Ester · 12A1') as HTMLInputElement
  fireEvent.change(o, { target: { value: '2026-10-22' } })
  const cho = doi(), table = container.querySelector('table')
  goi.mockImplementationOnce(() => cho.cho)
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hạn' })); baoTick(); await nhip(1600)
  expect(goi).toHaveBeenCalledTimes(2)
  await act(async () => cho.tra({ ok: true, du: { goiId: 'g1', han: '2026-10-22' } }))
  goi.mockResolvedValueOnce(bang([{ ...GOC, han: '2026-10-22' }, MOI])); await nhip(800)
  expect(screen.getByText('Đã lưu hạn mới')).toBeTruthy()
  expect(o.value).toBe('2026-10-22'); expect(o.isConnected).toBe(true)
  expect(container.querySelector('table')).toBe(table)
  expect(goi.mock.calls.filter(([, b]) => b.action === 'tong_hop')).toHaveLength(2)
})
