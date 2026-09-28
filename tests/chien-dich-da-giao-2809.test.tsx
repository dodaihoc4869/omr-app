// Thầy 28/09: "không có chỗ xem những chiến dịch đã giao ở app gv" ⇒ khung "Chiến dịch đã giao" ở màn Ca kiểm tra.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))

import DsChienDichDaGiao from '../src/components/chien-dich/DsChienDichDaGiao'
import { KHOA_CHON_CHIEN_DICH } from '../src/components/chien-dich/LenBangChienDich'
import { useAppStore } from '../src/store/appStore'

const CD = { id: 'cd-1', ten: 'Chiến dịch luyện', lop: 'Chưa xếp lớp', maDe: ['DE'], hanNop: '2026-10-05', theLucNgay: 60, huyetChien: true, maCa: null, taoLuc: 'x', trangThai: 'dang_chay', soCau: 170, soEm: 1, hetHan: false }
beforeEach(() => {
  goi.mockReset()
  goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
    if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: [CD] } }
    if (b.action === 'huy' || b.action === 'dong') return { ok: true, du: { ok: true } }
    return { ok: false, loai: 'tu_choi', chu: 'lạ' }
  })
  sessionStorage.clear()
})
afterEach(cleanup)

describe('khung Chiến dịch đã giao', () => {
  it('hiện tên, lớp, số em, số câu, hạn nộp, trạng thái', async () => {
    render(<DsChienDichDaGiao />)
    expect(await screen.findByText('Chiến dịch luyện')).toBeTruthy()
    const muc = document.querySelector('.cd-muc-cd')!
    expect(muc.textContent).toContain('Chưa xếp lớp · 1 em · 170 câu')
    expect(muc.textContent).toContain('Đang chạy')
  })
  it('"Xem bảng" ghi id chiến dịch rồi mở màn Lên bảng', async () => {
    const setScreen = vi.fn()
    useAppStore.setState({ setScreen } as never)
    render(<DsChienDichDaGiao />)
    fireEvent.click(await screen.findByRole('button', { name: 'Xem bảng' }))
    expect(sessionStorage.getItem(KHOA_CHON_CHIEN_DICH)).toBe('cd-1')
    expect(setScreen).toHaveBeenCalledWith('goilenbang')
  })
  it('"Huỷ" hỏi lại rồi gọi lệnh huy và tải lại danh sách; bấm Không thì không gọi', async () => {
    render(<DsChienDichDaGiao />)
    const nut = await screen.findByRole('button', { name: 'Huỷ' })
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    fireEvent.click(nut)
    expect(goi.mock.calls.some(([, b]) => b.action === 'huy')).toBe(false)
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    fireEvent.click(nut)
    await waitFor(() => expect(goi.mock.calls.filter(([, b]) => b.action === 'huy')).toHaveLength(1))
    await waitFor(() => expect(goi.mock.calls.filter(([, b]) => b.action === 'danh-sach').length).toBeGreaterThanOrEqual(2))
  })
})
