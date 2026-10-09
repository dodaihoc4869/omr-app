// Chuyển con không được nhìn thấy dữ liệu em trước; lỗi làm mới giữ số thật nhưng có nhãn lỗi.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useTatCaVeCon } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { PH_OK } from './_ph-moi/du-lieu-mau'
import type { PhanHoiTatCa } from '../src/lib/ph-moi/api'

afterEach(cleanup)
const pm = docTatCaVeCon(PH_OK)!

describe('Báo cáo đúng con và trạng thái làm mới', () => {
  it('xoá báo cáo khi đổi con, bỏ phản hồi đến muộn của em trước', async () => {
    const cho = new Map<string, (r: PhanHoiTatCa) => void>()
    const api = vi.fn((sbd: string) => new Promise<PhanHoiTatCa>((r) => cho.set(sbd, r)))
    const { result, rerender } = renderHook(({ sbd }) => useTatCaVeCon(sbd, api), { initialProps: { sbd: 'A' } })
    await waitFor(() => expect(cho.has('A')).toBe(true))
    await act(async () => cho.get('A')!({ kieu: 'ok', pm }))
    expect(result.current.pm).toBe(pm)
    act(() => result.current.thuLai())
    rerender({ sbd: 'B' })
    expect(result.current.pm).toBeNull()
    await waitFor(() => expect(cho.has('B')).toBe(true))
    await act(async () => cho.get('A')!({ kieu: 'ok', pm }))
    expect(result.current.pm).toBeNull()
    const pmB = { ...pm, hoTen: 'Em B' }
    await act(async () => cho.get('B')!({ kieu: 'ok', pm: pmB }))
    expect(result.current.pm?.hoTen).toBe('Em B')
  })
  it('mất kết nối giữ báo cáo đã tải và nói rõ lỗi; thử lại thành công xoá lỗi', async () => {
    const api = vi.fn().mockResolvedValueOnce({ kieu: 'ok', pm }).mockResolvedValueOnce({ kieu: 'loi', chu: 'Chưa kết nối được' }).mockResolvedValue({ kieu: 'ok', pm })
    const { result } = renderHook(() => useTatCaVeCon('A', api))
    await waitFor(() => expect(result.current.pm).toBe(pm))
    await act(async () => result.current.thuLai())
    expect(result.current.pm).toBe(pm)
    expect(result.current.chuLoi).toBe('Chưa kết nối được')
    await act(async () => result.current.thuLai())
    expect(result.current.chuLoi).toBe('')
  })
})
