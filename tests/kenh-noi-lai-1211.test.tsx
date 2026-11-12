// @vitest-environment jsdom
// NỐI LẠI KÊNH SAU KHI QUAY LẠI APP (12/11 giảm chi phí Cloudflare): app ẩn ≥ 25 s ⇒ các vòng nền đã tự đọc lại lúc hiện (Sảnh, kế hoạch, EXP, bài mẹ giao) ⇒ lần
// nối lại chỉ đọc thưởng + Tự sửa lỗi (không phát đọc lại toàn cổng). Mất kết nối khi app ĐANG HIỆN / ẩn ngắn / đang làm bài ⇒ đọc ĐỦ như cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { AN_LAU_MS, moKenhDay, SU_KIEN_DOI } from '../src/lib/kenh-day'
const kenhDayDangMo = () => (globalThis as { ddhKenh?: 1 }).ddhKenh === 1

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
const phu = vi.hoisted(() => ({ thuong: [] as string[], sua: [] as string[] }))
vi.mock('../src/components/thuong/dung-thuong', () => ({ capNhatTongQuan: (t: string) => { phu.thuong.push(t) } }))
vi.mock('../src/lib/tu-sua-loi', () => ({ taiTuSuaLoi: (t: string) => { phu.sua.push(t) } }))
const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
let dangAn = false
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); dangAn = false; phu.thuong.length = 0; phu.sua.length = 0; delete document.documentElement.dataset.dangLamBai })

async function kich(anMs: number | null) {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => dangAn)
  const ds: { onopen?: () => void; onclose?: () => void }[] = []
  class WsGia { onopen?: () => void; onclose?: () => void; onmessage?: () => void; onerror?: () => void; readyState = 1; constructor() { ds.push(this) } close() {} send() {} }
  vi.stubGlobal('WebSocket', WsGia)
  vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true, ve: 'v' })))
  const nghe = vi.fn()
  window.addEventListener(SU_KIEN_DOI, nghe)
  const dong = moKenhDay('tk')
  const troi = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
  await troi(50)
  ds[0]!.onopen?.()
  await troi(1_000)
  if (anMs === null) {
    ds[0]!.onclose?.() // đứt khi app đang hiện
    await troi(3_000)
  } else {
    dangAn = true; document.dispatchEvent(new Event('visibilitychange'))
    ds[0]!.onclose?.() // điện thoại tắt màn ⇒ kênh đứt
    await troi(anMs)
    dangAn = false; document.dispatchEvent(new Event('visibilitychange'))
    await troi(50)
  }
  expect(ds).toHaveLength(2)
  ds[1]!.onopen?.()
  await troi(1_000)
  dong()
  window.removeEventListener(SU_KIEN_DOI, nghe)
  return nghe.mock.calls.map((c) => (c[0] as CustomEvent).detail ?? null)
}

describe('nối lại kênh đẩy', () => {
  it('ẩn ≥ 25 s rồi quay lại ⇒ KHÔNG phát đọc lại toàn cổng (vòng nền đã tự đọc lúc hiện); chỉ đọc thưởng + Tự sửa lỗi', async () => {
    expect(await kich(AN_LAU_MS + 5_000)).toEqual([])
    expect(phu.thuong).toEqual(['tk'])
    expect(phu.sua).toEqual(['tk'])
  })
  it('ẩn ≥ 25 s nhưng đang ở màn làm bài / kiểm tra ⇒ phát như cũ (cổng hoãn tới lúc em về rồi đọc đủ)', async () => {
    document.documentElement.dataset.dangLamBai = ''
    expect(await kich(AN_LAU_MS + 5_000)).toEqual([null])
    expect(phu.thuong).toEqual([])
  })
  it('ẩn ngắn (10 s) ⇒ đọc đủ như cũ (vòng nền còn trong chặn dội 20 s, chưa tự đọc lại)', async () => {
    expect(await kich(10_000)).toEqual([null])
    expect(phu.thuong).toEqual([])
  })
  it('đứt khi app đang hiện ⇒ đọc đủ như cũ', async () => {
    expect(await kich(null)).toEqual([null])
  })
})

describe('cờ kênh đang mở ⇒ vòng lưới an toàn thưa ra', () => {
  it('nối được ⇒ globalThis.ddhKenh = 1 (vòng lưới an toàn hẹn ≥ 6 phút — henKhiCoKenh); đứt / đóng ⇒ gỡ cờ ⇒ nhịp cũ', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const ds: { onopen?: () => void; onclose?: () => void }[] = []
    class WsGia { onopen?: () => void; onclose?: () => void; onmessage?: () => void; onerror?: () => void; readyState = 1; constructor() { ds.push(this) } close() {} send() {} }
    vi.stubGlobal('WebSocket', WsGia)
    vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true, ve: 'v' })))
    const dong = moKenhDay('tk')
    await act(async () => { await vi.advanceTimersByTimeAsync(50) })
    expect(kenhDayDangMo()).toBe(false)
    ds[0]!.onopen?.()
    expect(kenhDayDangMo()).toBe(true)
    ds[0]!.onclose?.()
    expect(kenhDayDangMo()).toBe(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(3_000) })
    ds[1]!.onopen?.()
    expect(kenhDayDangMo()).toBe(true)
    dong()
    expect(kenhDayDangMo()).toBe(false)
  })
  it('đứt lúc app đang hiện rồi nối lại ⇒ thẻ Live hỏi lại một lượt (ddh-live-khoi); đứt lúc ẩn ⇒ không (thẻ tự hỏi khi app hiện lại)', async () => {
    const live = vi.fn()
    window.addEventListener('ddh-live-khoi', live)
    await kich(null)
    expect(live).toHaveBeenCalledTimes(1)
    await kich(10_000)
    await kich(AN_LAU_MS + 5_000)
    window.removeEventListener('ddh-live-khoi', live)
    expect(live).toHaveBeenCalledTimes(1)
  })
})
