// @vitest-environment jsdom
// TẢI LẠI PHẢI RA SỐ MÁY CHỦ (thầy 31/10 ~17:20, SBD thử 12121212: «load lại nhưng vẫn chưa thấy đồng bộ» — điện thoại xong 12/12 + 21 câu sửa, máy tính tải lại vẫn
// «Còn 6 câu tự làm · 1/2 chặng · Sửa lỗi 8» = số buổi sáng; đo D1 thật cùng lúc: máy chủ ĐÚNG — 2 chặng, bản Sảnh lập sẵn 17:18 «đã làm 12»).
// Gốc phía máy em: Sảnh / số Sửa lỗi vẽ NGAY bản đệm rồi hỏi máy chủ; lượt hỏi ấy hỏng / quá hạn chờ (vừa phát hành 17:14, em bấm tải lại giữa chừng) ⇒ KHÔNG ai hỏi
// lại cho tới khi cửa sổ mất rồi được chọn lại — máy tính để yên ⇒ số cũ nằm mãi. Nay: tự hỏi lại lùi dần tới khi có số thật; kênh đẩy nối lại ⇒ đọc lại một lượt;
// tin đẩy ⇒ đọc lại cả danh sách Tự sửa lỗi.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { docSanh, useSanhHoa2, type KetQuaSanh } from '../src/components/hoa2/api'
import { useSoCauCanSua, xoaNhoTuSua } from '../src/lib/tu-sua-loi'
import { moKenhDay, SU_KIEN_DOI } from '../src/lib/kenh-day'
import '../src/lib/chua-cau-sai-api' // nạp sẵn mảnh lười của taiTuSuaLoi (đồng hồ giả không chờ nạp mô-đun thật)

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))

const HOM = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10)
const goi7 = (daLam: number, muc = 12) => ({ bat: true, ngay: HOM, toiThieu: muc, daLamHomNay: daLam, tuLamCon: muc - daLam, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, goi: [{ id: 'g', ten: 'Bài 9. Amino acid (P1)', batDau: HOM, han: HOM, tong: 40, daGap: 10, con: 30, quota: 12, gapHomNay: daLam, quaHan: false, canBoSung: 0, to: ['de-9'] }], diemDaDo: [] })
const sanh = (daLam: number) => ({ ok: true, cheDo2: true, ngay: HOM, goi7: goi7(daLam), theLuc: { con: 12 - daLam, tong: 12 }, chienDich: null, doan: { con: 0 }, dao: { con: 12 - daLam } })
const daLam = (k: KetQuaSanh | null) => (k && k.cheDo2 && 'sanh' in k ? k.sanh.goi7?.daLamHomNay : undefined)
/** Đẩy giờ từng giây (mỗi giây một `act` ⇒ React chạy hiệu ứng của lượt hỏi lại giữa chừng). */
const troi = async (ms: number) => { for (let t = 0; t < ms; t += 1000) await act(async () => { await vi.advanceTimersByTimeAsync(Math.min(1000, ms - t)) }) }
const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); xoaNhoTuSua() })

describe('tải lại khi lượt làm tươi đầu hỏng', () => {
  it('Sảnh: bản đệm buổi sáng (6/12) + lượt hỏi đầu lỗi mạng ⇒ tự hỏi lại ⇒ số máy chủ (12/12), không chờ em chọn lại cửa sổ', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.setItem('omr_hoa2_sanh_dem:s1', JSON.stringify(docSanh(sanh(6))))
    let lan = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).endsWith('/cau-hinh.json')) return json({})
      if (++lan === 1) throw new TypeError('Failed to fetch')
      return json(sanh(12))
    }))
    const { result } = renderHook(() => useSanhHoa2('tk', 's1', 0, true))
    expect(daLam(result.current.ketQua)).toBe(6) // vẽ ngay bản đệm
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(lan).toBe(1)
    expect(daLam(result.current.ketQua)).toBe(6) // lượt đầu hỏng ⇒ vẫn đệm
    await troi(4_000)
    expect(lan).toBe(2)
    expect(daLam(result.current.ketQua)).toBe(12)
    expect(result.current.loi).toBe('')
    // có số thật rồi ⇒ thôi hỏi
    await troi(120_000)
    expect(lan).toBe(2)
  })

  it('Sảnh: máy chủ lỗi liên tiếp ⇒ hỏi lại LÙI DẦN (không dội máy chủ), app ẩn thì không hỏi', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    localStorage.setItem('omr_hoa2_sanh_dem:s1', JSON.stringify(docSanh(sanh(6))))
    let lan = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).endsWith('/cau-hinh.json') ? json({}) : (lan++, json({ ok: false, error: 'Máy chủ đang bận' })))))
    renderHook(() => useSanhHoa2('tk', 's1', 0, true))
    await troi(30_000)
    expect(lan).toBeGreaterThanOrEqual(3) // 0 · ~3 s · ~11 s · ~31 s
    expect(lan).toBeLessThanOrEqual(4)
    const an = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    const truoc = lan
    await troi(200_000)
    expect(lan).toBe(truoc)
    an.mockRestore()
  })

  it('Tự sửa lỗi (số trên nút Lộ trình): lượt tải đầu lỗi ⇒ tự tải lại, có số', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let lan = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url)
      if (u.endsWith('/cau-hinh.json')) return json({})
      if (u.includes('/hs/chua-cau-sai/co')) return json({ ok: true, bat: true })
      if (++lan === 1) throw new TypeError('Failed to fetch')
      return json({ ok: true, ds: [], dem: { can: 0 } })
    }))
    const { result } = renderHook(() => useSoCauCanSua('tk', true))
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(result.current).toBeNull()
    await troi(4_000)
    expect(lan).toBeGreaterThanOrEqual(2)
    expect(result.current).toBe(0)
  })
})

describe('kênh đẩy nối lại ⇒ đọc lại một lượt', () => {
  it('lần nối đầu không phát; mất kết nối rồi nối lại ⇒ phát SU_KIEN_DOI (tin lúc đứt có thể đã lỡ)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const ds: { onopen?: () => void; onclose?: () => void; close: () => void; readyState: number; send: () => void }[] = []
    class WsGia { onopen?: () => void; onclose?: () => void; onmessage?: () => void; onerror?: () => void; readyState = 1; constructor() { ds.push(this) } close() {} send() {} }
    vi.stubGlobal('WebSocket', WsGia)
    vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true, ve: 'v' })))
    const nghe = vi.fn()
    window.addEventListener(SU_KIEN_DOI, nghe)
    const dong = moKenhDay('tk')
    await act(async () => { await vi.advanceTimersByTimeAsync(50) })
    expect(ds).toHaveLength(1)
    ds[0]!.onopen?.()
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })
    expect(nghe).not.toHaveBeenCalled()
    ds[0]!.onclose?.()
    await act(async () => { await vi.advanceTimersByTimeAsync(3_000) })
    expect(ds).toHaveLength(2)
    ds[1]!.onopen?.()
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000) })
    expect(nghe).toHaveBeenCalledTimes(1)
    dong()
    window.removeEventListener(SU_KIEN_DOI, nghe)
  })
})
