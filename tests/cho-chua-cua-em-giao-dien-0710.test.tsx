import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const api = vi.hoisted(() => ({ apiDanhSachChua: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
vi.mock('../src/components/chua-cau-sai/ManChuaCauSai', () => ({
  default: ({ qid }: { qid: string }) => <p>Đang chữa {qid}</p>,
}))

import ChoChuaCuaEm from '../src/components/chua-cau-sai/ChoChuaCuaEm'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Khối câu cần gỡ tiếp', () => {
  it('hiện lưới thẻ ngắn gọn, trạng thái, ngày hẹn và số câu', async () => {
    api.apiDanhSachChua.mockResolvedValue([
      { qid: 'Q1', trangThai: 'dang_chua_buoc', denHan: '2026-10-09T00:00:00.000Z' },
      { qid: 'Q2', trangThai: 'thieu_hoc_lieu' },
    ])

    const { container } = render(<ChoChuaCuaEm token="tok" />)

    expect(await screen.findByRole('heading', { name: 'Câu cần gỡ tiếp' })).toBeTruthy()
    expect(screen.getByLabelText('2 câu đang chờ')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Câu 1: Tiếp bước đang gỡ. Hẹn 09/10' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Câu 2: Đang chuẩn bị bài luyện' })).toBeTruthy()
    expect(container.querySelector('.tlu-cho-chua-luoi')).toBeTruthy()
    expect(container.querySelectorAll('.tlu-cho-chua-the')).toHaveLength(2)
  })

  it('mở đúng câu đã chọn và đánh dấu thẻ hiện tại', async () => {
    api.apiDanhSachChua.mockResolvedValue([
      { qid: 'Q1', trangThai: 'can_chan_doan' },
    ])
    render(<ChoChuaCuaEm token="tok" />)

    const nut = await screen.findByRole('button', { name: 'Câu 1: Tìm chỗ vướng' })
    fireEvent.click(nut)

    await waitFor(() => expect(nut.getAttribute('aria-current')).toBe('true'))
    expect(await screen.findByText('Đang chữa Q1')).toBeTruthy()
  })
})
