import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { NHIP_PH_MOI_MS, useTatCaVeCon } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import type { PhanHoiTatCa } from '../src/lib/ph-moi/api'
import { PH_OK } from './_ph-moi/du-lieu-mau'

const pm = docTatCaVeCon(PH_OK)!
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('hook phụ huynh khi hàm đọc từ chối Promise', () => {
  it('giữ báo cáo cũ và lý do, bấm thử lại nhận bản mới và hết trạng thái tải', async () => {
    const moi = { ...pm, hoTen: 'Nguyễn Minh An' }
    const api = vi.fn().mockResolvedValueOnce({ kieu: 'ok', pm }).mockRejectedValueOnce(new Error('Hàm đọc bị lỗi')).mockResolvedValue({ kieu: 'ok', pm: moi })
    const { result } = renderHook(() => useTatCaVeCon('A', api))
    await act(async () => {})
    await act(async () => result.current.thuLai())
    expect(result.current.pm).toBe(pm)
    expect(result.current.trangThai).toBe('ok')
    expect(result.current.dangLamMoi).toBe(false)
    expect(result.current.chuLoi).toContain('Chưa tải được báo cáo')
    await act(async () => result.current.thuLai())
    expect(result.current.pm).toBe(moi)
    expect(result.current.chuLoi).toBe('')
    expect(result.current.dangLamMoi).toBe(false)
    expect(api).toHaveBeenCalledTimes(3)
  })

  it('lỗi lúc mở có thể thử lại; lỗi liên tiếp khiến nhịp nền lùi thực sự', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const api = vi.fn().mockRejectedValueOnce(new Error('Lỗi 1')).mockRejectedValueOnce(new Error('Lỗi 2')).mockRejectedValueOnce(new Error('Lỗi 3')).mockRejectedValueOnce(new Error('Lỗi 4')).mockResolvedValue({ kieu: 'ok', pm })
    const { result } = renderHook(() => useTatCaVeCon('A', api))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(result.current.trangThai).toBe('loi')
    expect(result.current.pm).toBeNull()
    expect(result.current.dangLamMoi).toBe(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(NHIP_PH_MOI_MS * 3) })
    expect(api).toHaveBeenCalledTimes(4)
    await act(async () => { await vi.advanceTimersByTimeAsync(299_999) })
    expect(api).toHaveBeenCalledTimes(4)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(api).toHaveBeenCalledTimes(5)
    expect(result.current.pm).toBe(pm)
    expect(result.current.chuLoi).toBe('')
  })

  it('lượt đọc cũ bị reject sau đổi con không thay trạng thái của con mới', async () => {
    let tuChoi!: (e: unknown) => void
    const api = vi.fn((sbd: string): Promise<PhanHoiTatCa> => sbd === 'A' ? new Promise((_r, reject) => { tuChoi = reject }) : Promise.resolve({ kieu: 'ok', pm: { ...pm, hoTen: 'Em B' } }))
    const { result, rerender } = renderHook(({ sbd }) => useTatCaVeCon(sbd, api), { initialProps: { sbd: 'A' } })
    rerender({ sbd: 'B' })
    await act(async () => {})
    await act(async () => tuChoi(new Error('Lỗi lượt của A')))
    expect(result.current.pm?.hoTen).toBe('Em B')
    expect(result.current.trangThai).toBe('ok')
    expect(result.current.chuLoi).toBe('')
    expect(result.current.dangLamMoi).toBe(false)
  })
})
