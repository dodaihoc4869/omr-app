import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useTatCaVeCon, NHIP_PH_MOI_MS } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import type { PhanHoiTatCa } from '../src/lib/ph-moi/api'
import { PH_OK } from './_ph-moi/du-lieu-mau'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })
const pm = docTatCaVeCon(PH_OK)!
const cho = () => {
  let xong!: (r: PhanHoiTatCa) => void
  const hua = new Promise<PhanHoiTatCa>((r) => { xong = r })
  return { hua, xong }
}

describe('báo cáo phụ huynh: tải lại không tạo lượt đọc chồng', () => {
  it('bấm tải lại liên tiếp trong lúc đọc lần đầu chỉ có một yêu cầu', async () => {
    const c = cho(), api = vi.fn(() => c.hua)
    const { result } = renderHook(() => useTatCaVeCon('A', api))
    act(() => { result.current.thuLai(); result.current.thuLai() })
    expect(api).toHaveBeenCalledTimes(1)
    expect(result.current.dangLamMoi).toBe(true)
    await act(async () => c.xong({ kieu: 'ok', pm }))
    expect(result.current.pm).toBe(pm)
    expect(result.current.dangLamMoi).toBe(false)
  })

  it('nhịp nền đến giữa lượt tải lại tay vẫn dùng chung lượt đang chờ', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const c = cho(), api = vi.fn().mockResolvedValueOnce({ kieu: 'ok', pm }).mockImplementation(() => c.hua)
    const { result } = renderHook(() => useTatCaVeCon('A', api))
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    await act(async () => { await vi.advanceTimersByTimeAsync(NHIP_PH_MOI_MS - 1000) })
    act(() => result.current.thuLai())
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(api).toHaveBeenCalledTimes(2)
    await act(async () => c.xong({ kieu: 'loi', chu: 'Mạng đang chậm' }))
    expect(result.current.pm).toBe(pm)
    expect(result.current.chuLoi).toBe('Mạng đang chậm')
    expect(result.current.dangLamMoi).toBe(false)
  })
})
