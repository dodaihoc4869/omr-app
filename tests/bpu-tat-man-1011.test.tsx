// Bình Phản Ứng — LUẬT RỜI MÀN 10/11 (thầy: «chỉ tắt màn hình là không báo; thoát app, chia đôi, cửa sổ nổi bắt TỨC THÌ; giữ chặt cho mọi điện thoại»)
// + GIỮ MÀN SÁNG suốt buổi. Giả lập: IdleDetector khoá / mở khoá / không có (iPhone) / chưa cho quyền; chia đôi (cỡ cửa sổ); cửa sổ nổi (blur);
// bàn phím; hộp hỏi quyền; mất tin `roi` cùng kết nối (gửi bù); wakeLock có / không (video câm dự phòng) và nhả khi kết thúc buổi.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ketThuc, moLuot, roiMan, taoPhong, viewEm } from '../src/lib/bpu/phong'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'
import { KIEM_KHOA_MS, NOI_MS } from '../src/components/bpu/ManBinhPhanUng'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }] })
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 60 }
const coTin = (ws: WsGia, t: string) => ws.gui.filter((x) => JSON.parse(x).t === t).length
const cho = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })

// Trạng thái máy giả
let an = false, co = true
let khoa: 'locked' | 'unlocked' = 'unlocked'
let soLanHoi = 0
let xinQuyen: { resolve: (s: string) => void } | null = null
class IdleGia {
  screenState: string | null = null
  static requestPermission = vi.fn(() => new Promise<string>((resolve) => { xinQuyen = { resolve } }))
  async start(o: { signal: AbortSignal }) { soLanHoi += 1; await Promise.resolve(); if (o.signal.aborted) throw new Error('huỷ'); this.screenState = khoa }
}
const datIdle = (quyen: 'granted' | 'denied' | 'prompt') => {
  vi.stubGlobal('IdleDetector', IdleGia)
  ;(window as unknown as { IdleDetector: unknown }).IdleDetector = IdleGia
  Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: async () => ({ state: quyen, onchange: null }) } })
}
const an_ = (v: boolean) => { an = v; co = !v; act(() => { document.dispatchEvent(new Event('visibilitychange')) }) }

beforeEach(() => {
  WsGia.ds = []; an = false; co = true; khoa = 'unlocked'; soLanHoi = 0; xinQuyen = null; _datLaiTatMan(); IdleGia.requestPermission.mockClear()
  vi.stubGlobal('WebSocket', WsGia)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' }))))
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => an })
  vi.spyOn(document, 'hasFocus').mockImplementation(() => co)
})
afterEach(() => {
  vi.unstubAllGlobals(); vi.restoreAllMocks()
  delete (window as unknown as Record<string, unknown>).IdleDetector
  delete (navigator as unknown as Record<string, unknown>).permissions
  delete (navigator as unknown as Record<string, unknown>).wakeLock
  delete (document as unknown as Record<string, unknown>).hidden
  delete (window as unknown as Record<string, unknown>).matchMedia
})

async function vao() {
  const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
  render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
  await waitFor(() => expect(WsGia.ds.length).toBe(1))
  const ws = WsGia.ds[0]!
  const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
  await screen.findByLabelText('Gửi đáp án')  // SỬA CÓ CHỦ ĐÍCH 10/11: nút gửi nổi, chưa chọn thì ẩn
  await cho(0) // đọc quyền xong
  return { ws, st }
}

describe('ẩn trang (thoát app / chuyển app / khoá màn)', () => {
  it('iPhone (không có IdleDetector): chuyển app ⇒ `roi` ĐỒNG BỘ trong sự kiện, 0 hẹn giờ; về lại ⇒ `ve`', async () => {
    const { ws } = await vao()
    const t0 = performance.now()
    an_(true)
    const ms = performance.now() - t0
    expect(coTin(ws, 'roi')).toBe(1) // ngay trong sự kiện, không chờ
    expect(ms).toBeLessThan(50)
    console.info(`[đo] iPhone: visibilitychange → ws.send(roi) = ${ms.toFixed(2)} ms (đồng bộ)`)
    an_(false)
    expect(coTin(ws, 've')).toBe(1)
    expect(await screen.findByText(/tắt màn hình đều bị tính là rời/)).toBeTruthy()
  })
  it('iPhone: KHOÁ MÀN cũng là rời (giữ chặt) — y như chuyển app', async () => {
    const { ws } = await vao()
    an_(true) // khoá màn trên iPhone: trang chỉ thấy visibilitychange
    expect(coTin(ws, 'roi')).toBe(1)
  })
  it('Android CHƯA cho quyền IdleDetector: khoá màn ⇒ vẫn báo (giữ chặt), đồng bộ', async () => {
    datIdle('prompt')
    const { ws } = await vao()
    khoa = 'locked'
    an_(true)
    expect(coTin(ws, 'roi')).toBe(1)
    expect(soLanHoi).toBe(0) // không có quyền ⇒ không hỏi máy dò
  })
  it('Android từ chối quyền: chuyển app ⇒ báo đồng bộ', async () => {
    datIdle('denied')
    const { ws } = await vao()
    an_(true)
    expect(coTin(ws, 'roi')).toBe(1)
  })
  it('Android CÓ quyền + màn đã KHOÁ ⇒ KHÔNG báo; mở màn ⇒ không gửi `ve`; pagehide lúc đang khoá ⇒ không báo', async () => {
    datIdle('granted')
    const { ws } = await vao()
    khoa = 'locked'
    an_(true)
    await cho(5)
    expect(soLanHoi).toBe(1) // hỏi tươi một lần
    expect(coTin(ws, 'roi')).toBe(0)
    act(() => { window.dispatchEvent(new Event('blur')) }) // tắt màn cũng làm mất tiêu điểm
    act(() => { window.dispatchEvent(new Event('pagehide')) })
    await cho(NOI_MS + 50)
    expect(coTin(ws, 'roi')).toBe(0)
    khoa = 'unlocked'; an_(false)
    expect(coTin(ws, 've')).toBe(0)
    expect(screen.queryByText('Em vừa rời màn hình')).toBeNull()
  })
  it('Android CÓ quyền: khoá màn rồi MỞ KHOÁ THẲNG vào app khác (trang vẫn ẩn, 2 lần hỏi liền) ⇒ báo', async () => {
    datIdle('granted')
    const { ws } = await vao()
    khoa = 'locked'; an_(true); await cho(5)
    expect(coTin(ws, 'roi')).toBe(0)
    khoa = 'unlocked' // bấm thông báo trên màn khoá ⇒ vào app khác, Chrome vẫn ẩn
    await cho(KIEM_KHOA_MS + 50)
    expect(coTin(ws, 'roi')).toBe(0) // một lần chưa đủ
    await cho(KIEM_KHOA_MS + 50)
    expect(coTin(ws, 'roi')).toBe(1)
  }, 8000)
  it('Android CÓ quyền: khoá màn rồi mở khoá BÌNH THƯỜNG (Chrome hiện lại ngay) ⇒ không báo', async () => {
    datIdle('granted')
    const { ws } = await vao()
    khoa = 'locked'; an_(true); await cho(KIEM_KHOA_MS + 50)
    khoa = 'unlocked'; await cho(KIEM_KHOA_MS + 50) // lần hỏi thứ nhất thấy mở khoá
    an_(false) // Chrome hiện lại trước lần hỏi thứ hai
    await cho(KIEM_KHOA_MS + 50)
    expect(coTin(ws, 'roi')).toBe(0)
    expect(coTin(ws, 've')).toBe(0)
  }, 8000)
  it('Android CÓ quyền + chuyển app (màn mở khoá) ⇒ báo sau MỘT vòng hỏi (không hẹn giờ)', async () => {
    datIdle('granted')
    const { ws } = await vao()
    const t0 = performance.now()
    an_(true)
    await waitFor(() => expect(coTin(ws, 'roi')).toBe(1), { interval: 1 })
    console.info(`[đo] Android có quyền: visibilitychange → ws.send(roi) = ${(performance.now() - t0).toFixed(2)} ms (một vòng IdleDetector giả)`)
    an_(false)
    expect(coTin(ws, 've')).toBe(1)
    expect(await screen.findByText(/Thoát app hay chuyển app đều bị tính là rời/)).toBeTruthy()
  })
  it('Android CÓ quyền: chuyển app rồi về NGAY trước khi hỏi xong ⇒ vẫn báo `roi` rồi `ve` liền (bảng không đỏ mãi)', async () => {
    datIdle('granted')
    const { ws } = await vao()
    an = true; co = false
    act(() => { document.dispatchEvent(new Event('visibilitychange')); an = false; co = true; document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(coTin(ws, 'roi')).toBe(1))
    expect(coTin(ws, 've')).toBe(1)
  })
})

describe('trang vẫn hiện (chia đôi / cửa sổ nổi / bàn phím / hộp quyền)', () => {
  const datHuong = (type: string) => Object.defineProperty(window.screen, 'orientation', { configurable: true, value: { type } })
  const datCo = (w: number, h: number) => {
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, get: () => w })
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, get: () => h })
  }
  beforeEach(() => {
    ;(window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({ matches: q.includes('coarse'), addEventListener() {}, removeEventListener() {} })
    vi.spyOn(window.screen, 'width', 'get').mockReturnValue(400)
    vi.spyOn(window.screen, 'height', 'get').mockReturnValue(860)
    datHuong('portrait-primary')
    datCo(400, 740)
  })
  afterEach(() => { delete (window.screen as unknown as Record<string, unknown>).orientation; delete (document.documentElement as unknown as Record<string, unknown>).clientWidth; delete (document.documentElement as unknown as Record<string, unknown>).clientHeight })

  it('CHIA ĐÔI màn hình (cửa sổ co còn nửa, vẫn có tiêu điểm) ⇒ `roi` sau NOI_MS + cảnh báo; về đủ cỡ ⇒ `ve`', async () => {
    const { ws } = await vao()
    datCo(400, 380); act(() => { window.dispatchEvent(new Event('resize')) })
    expect(coTin(ws, 'roi')).toBe(0)
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(1)
    expect(await screen.findByText('Không được dùng cửa sổ nổi')).toBeTruthy()
    // còn chia đôi mà chạm lại vào app (focus) ⇒ CHƯA về
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(coTin(ws, 've')).toBe(0)
    datCo(400, 740); act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 've')).toBe(1)
  })
  it('chia đôi máy nằm ngang (nửa trái) ⇒ báo', async () => {
    const { ws } = await vao()
    datHuong('landscape-primary'); datCo(420, 330); act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(1)
  })
  it('xoay ngang cả màn (không chia) ⇒ KHÔNG báo', async () => {
    const { ws } = await vao()
    datHuong('landscape-primary'); datCo(810, 330); act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(0)
  })
  it('em GẠT hộp hỏi quyền (không chọn) ⇒ chạm đáp án sau KHÔNG hỏi lại trong lần nạp trang này', async () => {
    datIdle('prompt')
    await vao()
    fireEvent.click(screen.getByRole('dialog', { name: 'Bình Phản Ứng' }))
    await act(async () => { xinQuyen!.resolve('default') })
    fireEvent.click(screen.getByRole('dialog', { name: 'Bình Phản Ứng' }))
    expect(IdleGia.requestPermission).toHaveBeenCalledTimes(1)
  })
  it('CỬA SỔ NỔI / bong bóng (mất tiêu điểm, cỡ không đổi) ⇒ `roi` sau NOI_MS; nháy tiêu điểm < NOI_MS ⇒ không', async () => {
    const { ws } = await vao()
    co = false; act(() => { window.dispatchEvent(new Event('blur')) })
    co = true; act(() => { window.dispatchEvent(new Event('focus')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(0)
    const t0 = performance.now()
    co = false; act(() => { window.dispatchEvent(new Event('blur')) })
    await waitFor(() => expect(coTin(ws, 'roi')).toBe(1), { interval: 5 })
    console.info(`[đo] cửa sổ nổi: blur → ws.send(roi) = ${(performance.now() - t0).toFixed(0)} ms (NOI_MS = ${NOI_MS})`)
    co = true; act(() => { window.dispatchEvent(new Event('focus')) })
    expect(coTin(ws, 've')).toBe(1)
  })
  it('BÀN PHÍM bật ⇒ KHÔNG báo (Chrome mới: khung bố cục không đổi; máy cũ co trang khi đang gõ ô nhập)', async () => {
    const { ws } = await vao()
    // Chrome ≥ 108 / Safari: chỉ visualViewport co, khung bố cục giữ nguyên, không mất tiêu điểm
    act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(0)
    // máy cũ: trang co còn ~45 % khi đang gõ ô nhập
    const o = document.createElement('input'); document.body.appendChild(o); o.focus()
    datCo(400, 380); act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(0)
    o.remove()
  })
  it('HỘP HỎI QUYỀN IdleDetector hiện lên (mất tiêu điểm) ⇒ KHÔNG báo; cho quyền xong ⇒ lần sau khoá màn không báo', async () => {
    datIdle('prompt')
    const { ws } = await vao()
    fireEvent.click(screen.getByRole('dialog', { name: 'Bình Phản Ứng' }))
    expect(IdleGia.requestPermission).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('dialog', { name: 'Bình Phản Ứng' })) // chạm tiếp khi hộp còn mở ⇒ không hỏi chồng
    expect(IdleGia.requestPermission).toHaveBeenCalledTimes(1)
    co = false; act(() => { window.dispatchEvent(new Event('blur')) })
    await cho(NOI_MS + 80)
    expect(coTin(ws, 'roi')).toBe(0)
    await act(async () => { xinQuyen!.resolve('granted') })
    co = true; act(() => { window.dispatchEvent(new Event('focus')) })
    await cho(NOI_MS + 30)
    expect(coTin(ws, 'roi')).toBe(0)
    khoa = 'locked'; an_(true); await cho(5)
    expect(coTin(ws, 'roi')).toBe(0)
    // đã cho quyền ⇒ chạm lần sau không hỏi lại
    khoa = 'unlocked'; an_(false)
    fireEvent.click(screen.getByRole('dialog', { name: 'Bình Phản Ứng' }))
    expect(IdleGia.requestPermission).toHaveBeenCalledTimes(1)
  })
})

describe('gửi bù khi tin `roi` mất cùng kết nối (iPhone treo trang)', () => {
  it('nối lại mà phòng chưa ghi lần rời ⇒ gửi bù `roi` rồi `ve`', async () => {
    const { ws, st } = await vao()
    an_(true)
    expect(coTin(ws, 'roi')).toBe(1) // đẩy vào kết nối… nhưng kết nối đã chết, phòng không nhận
    an_(false) // về lại: `ve` đi vào kết nối chết
    act(() => { ws.readyState = 3; ws.onclose?.() })
    await waitFor(() => expect(WsGia.ds.length).toBe(2), { timeout: 4000 })
    const ws2 = WsGia.ds[1]!
    await waitFor(() => expect(coTin(ws2, 'chao')).toBe(1))
    ws2.nhan(viewEm(st, 'S1')) // phòng trả lời `chao`: em.roi vẫn 0
    expect(coTin(ws2, 'roi')).toBe(1)
    expect(coTin(ws2, 've')).toBe(1)
    expect(ws2.gui.map((x) => JSON.parse(x).t).filter((t) => t === 'roi' || t === 've')).toEqual(['roi', 've'])
  })
  it('phòng ĐÃ ghi (biên nhận em.roi tăng) ⇒ nối lại KHÔNG gửi bù (không trừ kJ hai lần)', async () => {
    const { ws, st } = await vao()
    an_(true)
    roiMan(st, 'S1', T0 + 1); ws.nhan(viewEm(st, 'S1')) // biên nhận
    an_(false)
    act(() => { ws.readyState = 3; ws.onclose?.() })
    await waitFor(() => expect(WsGia.ds.length).toBe(2), { timeout: 4000 })
    const ws2 = WsGia.ds[1]!
    await waitFor(() => expect(coTin(ws2, 'chao')).toBe(1))
    ws2.nhan(viewEm(st, 'S1'))
    expect(coTin(ws2, 'roi')).toBe(0)
  })
})

describe('giữ màn sáng suốt buổi', () => {
  it('có wakeLock ⇒ xin khi phòng nối; trang hiện lại ⇒ xin lại; thầy kết thúc buổi ⇒ nhả', async () => {
    const nha = vi.fn(async () => {})
    const xin = vi.fn(async () => ({ release: nha, addEventListener() {} }))
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: xin } })
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async () => {})
    const { ws, st } = await vao()
    expect(xin).toHaveBeenCalledTimes(1)
    expect(play).not.toHaveBeenCalled() // có wakeLock ⇒ không cần video
    an_(true); an_(false)
    await cho(0)
    expect(xin).toHaveBeenCalledTimes(2)
    ketThuc(st, T0); ws.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(nha).toHaveBeenCalled())
  })
  it('KHÔNG có wakeLock (iPhone cũ) ⇒ video câm lặp playsinline; tự phát bị chặn ⇒ phát ở lần chạm; kết thúc ⇒ dừng + gỡ nguồn', async () => {
    let lan = 0
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) { lan += 1; return lan === 1 ? Promise.reject(new Error('NotAllowed')) : Promise.resolve() })
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const { ws, st } = await vao()
    expect(play).toHaveBeenCalledTimes(1)
    const vid = play.mock.instances[0] as unknown as HTMLVideoElement
    expect(vid.muted).toBe(true); expect(vid.loop).toBe(true); expect(vid.getAttribute('playsinline')).toBe('')
    expect(vid.src.startsWith('data:video/mp4;base64,')).toBe(true)
    expect(vid.src.length).toBeLessThan(1300)
    await cho(0)
    fireEvent.touchEnd(document.body)
    expect(play).toHaveBeenCalledTimes(2)
    ketThuc(st, T0); ws.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(pause).toHaveBeenCalled())
    expect(vid.getAttribute('src')).toBeNull()
  })
})
