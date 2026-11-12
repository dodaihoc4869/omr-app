// MÁY THẦY ĐỂ YÊN (12/11 giảm chi phí Cloudflare — Worker 650 nghìn lượt/ngày, gói ~333 nghìn): Bảng tin sàn / bản 3 / chip sức khoẻ hỏi theo TRẦN đã duyệt
// khi máy không ai chạm ≥ 3 phút; chạm lại ⇒ hỏi ngay rồi về nhịp thường. Vòng coi ca thi giữ nguyên nhịp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { RANH_SAU_MS, TUY_CHON_NHIP_THAY, datLanThaoTac, useNhipThay } from '../src/lib/nhip-may-thay'
import { batNhipBenVung } from '../src/lib/nhip-ben-vung'
import { henKhiCoKenh } from '../src/lib/kenh-co'
import { datLaiHeSo } from '../src/lib/nhip-de-nghi'

const an = (v: boolean) => Object.defineProperty(document, 'hidden', { configurable: true, get: () => v })
beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }); an(false); datLaiHeSo() })
afterEach(() => { cleanup(); an(false); datLaiHeSo(); vi.useRealTimers() })
const troi = async (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)))
const cham = () => act(() => { window.dispatchEvent(new Event('pointerdown')) })

describe('henKhiCoKenh — vòng lưới an toàn của app em khi kênh đẩy mở', () => {
  it('kênh mở ⇒ hẹn không sớm hơn 6 phút (đọc lại mỗi lần hẹn); kênh đóng ⇒ đúng nhịp cũ', async () => {
    const hen: number[] = []
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((_f: () => void, ms: number) => { hen.push(ms); return 0 }) as never)
    const n = batNhipBenVung(() => true, { coSoMs: 180_000, lechMs: 0, chayNgay: false, datGio: henKhiCoKenh, xoaGio: () => {} })
    ;(globalThis as { ddhKenh?: 1 }).ddhKenh = 1
    n.kich()
    await Promise.resolve(); await Promise.resolve()
    ;(globalThis as { ddhKenh?: 1 }).ddhKenh = undefined
    vi.setSystemTime(Date.now() + 25_000) // qua chặn dội
    n.kich()
    await Promise.resolve(); await Promise.resolve()
    n.dung()
    vi.mocked(setTimeout).mockRestore()
    expect(hen).toEqual([180_000, 360_000, 180_000])
  })
})

describe('useNhipThay — máy để yên', () => {
  it('đang thao tác ⇒ Bảng tin sàn 10 s; để yên ≥ 3 phút ⇒ 30 s; chạm lại ⇒ hỏi NGAY rồi về 10 s', async () => {
    datLanThaoTac(Date.now())
    const chay = vi.fn(async () => true)
    const r = renderHook(() => useNhipThay(chay, 10_000, true, TUY_CHON_NHIP_THAY.bangTinSan))
    await troi(10_100)
    expect(chay).toHaveBeenCalledTimes(1)
    // Để yên: mốc thao tác cuối cách đây hơn 3 phút ⇒ lượt hẹn kế tiếp theo trần 30 s.
    datLanThaoTac(Date.now() - RANH_SAU_MS - 1)
    await troi(10_000) // lượt hẹn sẵn 10 s (đặt lúc còn thao tác) vẫn chạy
    expect(chay).toHaveBeenCalledTimes(2)
    await troi(29_000)
    expect(chay).toHaveBeenCalledTimes(2)
    await troi(1_100)
    expect(chay).toHaveBeenCalledTimes(3)
    // Thầy chạm ⇒ hỏi ngay (đã qua chặn dội 10 s), rồi 10 s một lần như thường.
    await troi(12_000)
    await cham()
    await troi(0)
    expect(chay).toHaveBeenCalledTimes(4)
    await troi(10_100)
    expect(chay).toHaveBeenCalledTimes(5)
    r.unmount()
  })
  it('Theo dõi ca (không chamKhiRanh) ⇒ để yên vẫn 20 s', async () => {
    datLanThaoTac(Date.now() - RANH_SAU_MS - 1)
    const chay = vi.fn(async () => true)
    const r = renderHook(() => useNhipThay(chay, 20_000, true, TUY_CHON_NHIP_THAY.theoDoiCa))
    await troi(20_100)
    await troi(20_000)
    expect(chay).toHaveBeenCalledTimes(2)
    r.unmount()
  })
})
