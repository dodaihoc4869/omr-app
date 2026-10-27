// APP PHỤ HUYNH MỚI — MÀN (Code 2; thầy chốt mẫu 21/09; docs/ban-ve-ph-moi-thu-ve-con-2109/): màn chính (thẻ "Hôm nay của con" → bảng, thẻ "Ca kiểm tra gần nhất" → bảng ở khối ca, dải cảnh báo thụ động, MỘT nút dính đáy,
// chân "Đổi số báo danh"), bảng chín khối (khối nào máy chủ không trả ⇒ ẨN), câu bị che không lộ đáp án, danh sách dài dựng theo nhóm mở, lời giải chỉ khi có mã câu, và ParentPortalScreen thật đi màn chính → bảng → về.
// 27/10: màn chính `ph-moi/ManChinh`, bảng `ph-moi/BangMoiThu` (+ ph-apple.css) đã gỡ khỏi src/ vì không màn nào dùng (cổng /ph mở ph-v3) ⇒
// các phép kiểm màn và khoá nguồn của chúng bỏ theo; chỉ giữ hook nạp dữ liệu `useTatCaVeCon` (còn sống).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup } from '@testing-library/react'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { NHIP_PH_MOI_MS, useTatCaVeCon } from '../src/lib/ph-moi/use-tat-ca-ve-con'
import { PH_OK } from './_ph-moi/du-lieu-mau'

const pmOf = (raw: unknown = PH_OK) => docTatCaVeCon(raw)!

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('useTatCaVeCon — nhịp 180 giây ± 30 giây, giữ bản cũ khi lỗi', () => {
  let ngauNhien: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    vi.useFakeTimers()
    ngauNhien = vi.spyOn(Math, 'random').mockReturnValue(0.5) // độ lệch đúng 0 ⇒ nhịp chính xác 180 giây
  })
  afterEach(() => {
    ngauNhien.mockRestore()
    vi.useRealTimers()
  })
  const { renderHook } = require('@testing-library/react')
  const chay = async (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)))
  it('nạp ngay; lỗi lần đầu ⇒ trạng thái loi + chữ thật; thuLai nạp lại; thành công ⇒ ok; lỗi sau đó GIỮ bản cũ; sbd null ⇒ không gọi', async () => {
    const api = vi.fn().mockResolvedValueOnce({ kieu: 'loi', chu: 'Chưa nối được' }).mockResolvedValueOnce({ kieu: 'ok', pm: pmOf() }).mockResolvedValue({ kieu: 'loi', chu: 'Lại lỗi' })
    const { result } = renderHook(() => useTatCaVeCon('12121212', api))
    await chay(0)
    expect(result.current.trangThai).toBe('loi')
    expect(result.current.chuLoi).toBe('Chưa nối được')
    await act(async () => result.current.thuLai())
    await chay(0)
    expect(result.current.trangThai).toBe('ok')
    await chay(NHIP_PH_MOI_MS)
    expect(api).toHaveBeenCalledTimes(3)
    expect(result.current.trangThai).toBe('ok') // lỗi nhất thời: giữ bản cũ
    expect(result.current.pm).toBeTruthy()
    const ko = vi.fn()
    renderHook(() => useTatCaVeCon(null, ko))
    await chay(NHIP_PH_MOI_MS)
    expect(ko).not.toHaveBeenCalled()
  })
})
