// Bình Phản Ứng — máy em, thầy báo 10/11 (bản 1011d):
// (1) «dòng hướng dẫn ở cuối màn hình che nút gửi bài» = dòng «Kéo từ trên xuống… để thoát khỏi chế độ toàn màn hình» Chrome Android hiện mỗi lần trang VÀO
//     toàn màn hình. Thầy chốt GIỮ tự bật toàn màn hình ⇒ vừa vào toàn màn hình thì thanh dưới (nút «Gửi đáp án») nâng lên khỏi vùng đáy ~4 s rồi hạ về
//     (chỉ transform); đã toàn màn hình thì chạm / gửi KHÔNG xin lại (mỗi lần xin là dòng ấy hiện lại).
// (2) thanh đội + nhãn Đạt / Chưa đạt: một khối gọn — xem tests/bpu-chon-may-1011 & bpu-top-ket-qua-1011.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiLenBang, chamLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewEm } from '../src/lib/bpu/phong'

class WsGia { static ds: WsGia[] = []; readyState = 1; tin: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(t: string) { this.tin.push(t) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }
const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
const cau = (qid: string) => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, maDe: 'm', phan: 'I', text: `Đề ${qid}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 })

let toanMan: Element | null = null
const xin = vi.fn(async () => { toanMan = document.documentElement; document.dispatchEvent(new Event('fullscreenchange')) })

describe('máy em — vừa vào toàn màn hình thì nâng nút «Gửi đáp án» khỏi dòng hướng dẫn của Chrome', () => {
  beforeEach(() => {
    vi.resetModules(); vi.useRealTimers(); toanMan = null; xin.mockClear()
    vi.doMock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
    WsGia.ds = []; vi.stubGlobal('WebSocket', WsGia)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' }))))
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => toanMan })
    ;(document.documentElement as unknown as { requestFullscreen: unknown }).requestFullscreen = xin
  })
  afterEach(() => {
    vi.useRealTimers(); vi.unstubAllGlobals(); vi.doUnmock('../src/lib/dia-chi-may-chu')
    delete (document as unknown as Record<string, unknown>).fullscreenElement
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen
  })

  it('chạm đầu ⇒ xin toàn màn hình MỘT lần; vào toàn màn hình ⇒ .nang-day ~4 s rồi hạ; chạm / gửi tiếp không xin lại', async () => {
    const { default: Man, NANG_DAY_MS } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong(); moLuot(st, cau('q1'), T0)
    WsGia.ds[0]!.nhan(viewEm(st, 'S1'))
    const goc = screen.getByRole('dialog', { name: 'Bình Phản Ứng' })
    expect(goc.classList.contains('nang-day')).toBe(false)
    vi.useFakeTimers()
    await act(async () => { fireEvent.click(goc) })
    expect(xin).toHaveBeenCalledTimes(1)
    expect(goc.classList.contains('nang-day')).toBe(true)
    fireEvent.click(goc); fireEvent.click(goc)
    expect(xin).toHaveBeenCalledTimes(1) // đã toàn màn hình ⇒ không xin lại (không bật lại dòng hướng dẫn)
    act(() => { vi.advanceTimersByTime(NANG_DAY_MS - 100) })
    expect(goc.classList.contains('nang-day')).toBe(true)
    act(() => { vi.advanceTimersByTime(200) })
    expect(goc.classList.contains('nang-day')).toBe(false)
    // em vuốt thoát toàn màn hình ⇒ không nâng; chạm lại ⇒ xin lại (thầy giữ tự bật) và nâng lại
    act(() => { toanMan = null; document.dispatchEvent(new Event('fullscreenchange')) })
    expect(goc.classList.contains('nang-day')).toBe(false)
    await act(async () => { fireEvent.click(goc) })
    expect(xin).toHaveBeenCalledTimes(2)
    expect(goc.classList.contains('nang-day')).toBe(true)
  })

  it('CSS: thanh dưới nâng bằng transform (không đổi bố cục), máy yếu / giảm chuyển động không trượt; đáy chừa safe-area', () => {
    const css = readFileSync('src/components/bpu/bpu-hs.css', 'utf8')
    expect(css).toMatch(/\.bpu-hs\.nang-day \.bpu-hs-day \{ transform: translateY\(-1[1-4]\dpx\)/)
    expect(css).toMatch(/\.bpu-hs-day \{[^}]*transition: transform/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.bpu-hs-day \{ transition: none; \} \}/)
    expect(css).toMatch(/html\.may-yeu \.bpu-hs-day \{ transition: none; \}/)
    expect(css).toMatch(/\.bpu-hs-day \{ padding: 12px 16px calc\(16px \+ env\(safe-area-inset-bottom, 0px\)\)/)
  })

  it('bạn cùng lớp Chưa đạt: nhãn nhỏ «Học · Chưa đạt» trong thanh đội, không có «Em ·», không số trừ', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong()
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); nhanTra(st, 'S2', 'C', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
    chamLenBang(st, false, T0 + 1); moDapAn(st, T0 + 2, (a, b) => a === b)
    WsGia.ds[0]!.nhan(viewEm(st, 'S2'))
    const klb = document.querySelector('.bpu-che-doi .bpu-klb')!
    expect(klb.querySelector('span')?.textContent).toBe('Học · Chưa đạt')
    expect(klb.classList.contains('em')).toBe(false)
    expect(klb.textContent).not.toMatch(/Em ·|−|kJ/)
  })
})
