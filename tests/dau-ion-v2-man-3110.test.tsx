// «ĐẤU NGUYÊN TỬ 2» · MÀN (jsdom): 0 mạng khi em chưa bấm «Vào sân đấu»; bấm ⇒ đúng một WebSocket tới phòng của ca, gói đầu là vé + phiên bản giao thức,
// chào xong tự xin vào sân; vào sân ⇒ màn trận phủ kín; KÉO Ở ĐÂU CŨNG ĐI (cần ảo vô hình, không vẽ gì che màn), CHẠM NHANH THÌ ĐI TỚI; máy em chỉ gửi HƯỚNG ĐI;
// không vé ⇒ «Chơi với A.I» tại máy, 0 mạng; THẦY BẮT ĐẦU (`batDau` hoặc phòng báo `dong`) ⇒ huỷ requestAnimationFrame NGAY trong lượt đó,
// đóng kết nối, tháo màn trận, chỉ còn một dòng chữ; `dong` của phòng gọi `onBatDau` để màn cha vào bài.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu.test' }) }))
import DauIon from '../src/components/phong-cho/DauIon'
import { docYDinh, maAnh, PHIEN_BAN } from '../src/lib/dau-ion/goi'
import { taoTran } from '../src/lib/dau-ion/loi'

class WsGia {
  static ds: WsGia[] = []
  url: string; readyState = 0; binaryType = ''; gui: unknown[] = []; dong = false
  onopen: (() => void) | null = null; onmessage: ((e: { data: unknown }) => void) | null = null; onclose: ((e: { code: number; reason: string }) => void) | null = null; onerror: (() => void) | null = null
  constructor(url: string) { this.url = url; WsGia.ds.push(this) }
  send(d: unknown) { this.gui.push(typeof d === 'string' ? JSON.parse(d) : d) }
  close() { this.dong = true; this.readyState = 3 }
  moRa() { this.readyState = 1; this.onopen?.() }
  nhan(o: unknown) { this.onmessage?.({ data: typeof o === 'string' || o instanceof ArrayBuffer ? o : JSON.stringify(o) }) }
  yDinh() { return this.gui.filter((g): g is Uint8Array => g instanceof Uint8Array).map((b) => docYDinh(b)!) }
}

let hang: FrameRequestCallback[] = [], dongHo = 0
const huyRaf = vi.fn()
/** Chạy n khung hình (16 ms một khung). */
const khung = (n: number) => act(() => { for (let i = 0; i < n; i++) { dongHo += 16; const q = hang; hang = []; for (const f of q) f(dongHo) } })
beforeEach(() => {
  WsGia.ds = []; hang = []; dongHo = 1000; huyRaf.mockClear()
  vi.stubGlobal('WebSocket', WsGia)
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { hang.push(f); return hang.length })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { huyRaf(id); hang = [] })
  vi.spyOn(performance, 'now').mockImplementation(() => dongHo)
  try { localStorage.clear() } catch { /* bỏ qua */ }
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

const ptr = (el: Element, type: string, o: Record<string, unknown>) => act(() => { const e = new Event(type, { bubbles: true }); Object.assign(e, { pointerId: 1, pointerType: 'touch', ...o }); el.dispatchEvent(e) })
/** Vào sân mạng: bấm nút, mở kết nối, chào, phòng gửi sân 4 ghế — CHỈ NGƯỜI THẬT (thầy 01/11: không A.I). `soGhe` = 1 ⇒ sân chờ bạn. */
async function vaoSanMang(props: Record<string, unknown> = {}, soGhe = 4) {
  const r = render(<DauIon maCa="123456" veDau="ve-ky" {...props} />)
  expect(WsGia.ds).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Vào sân đấu' }))
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
  const ws = WsGia.ds[0]
  await act(async () => { ws.moRa(); ws.nhan({ t: 'chao', v: PHIEN_BAN, toi: 1, ten: 'Minh Anh' }) })
  const ghe = [[1, 'Minh Anh', 3, 0], [2, 'Quốc Bảo', 6, 0], [3, 'Khánh Ngọc', 4, 0], [4, 'Bạn Fe', 5, 0]].slice(0, soGhe)
  await act(async () => { ws.nhan({ t: 'san', v: PHIEN_BAN, so: 1, toi: 1, con: 60, ghe, vp: [[1, 'e', 100, 100]] }) })
  // Ảnh trận: em ở (200, 200), các bạn ở xa.
  const tr = taoTran(ghe.map((g) => ({ id: g[0] as number, nt: g[2] as number })), 1)
  Object.assign(tr.ghe[0], { x: 200, y: 200 })
  const anh = maAnh(1, 60, tr.ghe, [])
  await act(async () => { ws.nhan(anh.buffer); ws.nhan(maAnh(2, 60, tr.ghe, []).buffer) })
  return { ...r, ws }
}

describe('Đấu Nguyên Tử 2 · màn phòng chờ', () => {
  it('không vé (sảnh tắt / ca cũ) ⇒ báo sảnh chưa mở, nút chính «Chơi với A.I», KHÔNG mở WebSocket; chơi tại máy rồi Rời sân', async () => {
    render(<DauIon maCa="123456" />)
    expect(await screen.findByText(/Sảnh đấu chưa mở ở ca này/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chơi với A.I' }))
    expect(document.querySelector('.dn-man')).toBeTruthy()
    khung(5)
    expect(screen.getAllByText(/A\.I /).length).toBeGreaterThan(0)
    expect(WsGia.ds).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Rời sân' }))
    expect(document.querySelector('.dn-man')).toBeNull()
  })

  it('sảnh: tiêu đề, 5 chip cấp, MỘT nút chính, 7 nguyên tố; KHÔNG còn «Thách theo số báo danh» / «Nhóm 3–4 bạn»', () => {
    render(<DauIon maCa="123456" veDau="ve-ky" />)
    expect(screen.getByRole('heading', { name: 'Đấu Nguyên Tử' })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(7)
    expect(document.querySelectorAll('.dn-cap-hang li')).toHaveLength(5)
    expect(document.querySelectorAll('.dn-nut-chinh')).toHaveLength(1)
    expect(document.body.textContent).not.toMatch(/Thách|Nhóm 3–4|Đấu nhanh/)
  })

  it('có vé ⇒ chỉ nối khi bấm; gói đầu là vé + v:2; chào xong tự xin vào sân; sân đến ⇒ màn trận', async () => {
    const { ws } = await vaoSanMang()
    expect(ws.url).toBe('wss://may-chu.test/dau-ion/123456')
    expect(ws.gui[0]).toMatchObject({ t: 'vao', v: PHIEN_BAN, ve: 've-ky' })
    expect(ws.gui).toContainEqual({ t: 'vao-san' })
    expect(document.querySelector('.dn-man')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Rời sân' })).toBeTruthy()
    khung(3)
    expect(document.body.textContent).toContain('Sân 1 · 4/6 bạn')
    expect(document.body.textContent).not.toMatch(/A\.I/)
    expect(document.querySelector('.dn-cho-ban')).toBeNull()
  })

  it('sân chỉ có em (không A.I, thầy 01/11) ⇒ «Đang chờ bạn vào sân», đồng hồ hiện «Chờ»; bạn thứ 2 vào ⇒ hết chờ', async () => {
    const { ws } = await vaoSanMang({}, 1)
    khung(3)
    expect(screen.getByText('Đang chờ bạn vào sân')).toBeTruthy()
    expect(document.querySelector('.dn-so-o .dn-o b')!.textContent).toBe('Chờ')
    expect(document.body.textContent).toContain('Sân 1 · đang chờ bạn thứ 2')
    expect(document.body.textContent).not.toMatch(/A\.I/)
    await act(async () => { ws.nhan({ t: 'ghe', ghe: [[1, 'Minh Anh', 3, 0], [2, 'Quốc Bảo', 6, 0]] }); ws.nhan({ t: 'van', con: 60, vp: [] }) })
    khung(3)
    expect(document.querySelector('.dn-cho-ban')).toBeNull()
    expect(document.querySelector('.dn-so-o .dn-o b')!.textContent).toBe('1:00')
    expect(document.body.textContent).toContain('Sân 1 · 2/6 bạn')
  })

  it('KÉO Ở BẤT KỲ ĐÂU (cả nửa dưới màn, ngoài sân) ⇒ KHÔNG vẽ cần / vòng tròn nào (thầy 01/11), máy em gửi đúng HƯỚNG ĐI ~12 lần/giây', async () => {
    const { ws } = await vaoSanMang()
    const man = document.querySelector('.dn-man')!, ben = document.querySelector('.dn-ben')!
    ptr(ben, 'pointerdown', { clientX: 100, clientY: 700 })
    expect(document.querySelector('.dn-can')).toBeNull()
    ptr(man, 'pointermove', { clientX: 160, clientY: 700 })
    khung(70)
    const yd = ws.yDinh()
    expect(yd.length).toBeGreaterThanOrEqual(12); expect(yd.length).toBeLessThanOrEqual(16)
    expect(yd.at(-1)!.dx).toBeGreaterThan(0.9); expect(Math.abs(yd.at(-1)!.dy)).toBeLessThan(0.05)
    ptr(man, 'pointerup', { clientX: 160, clientY: 700 })
    khung(10)
    expect(ws.yDinh().at(-1)).toMatchObject({ dx: 0, dy: 0 })
    expect(document.querySelector('.dn-can')).toBeNull()
    expect(man.hasAttribute('data-keo')).toBe(false)
  })

  it('CHẠM NHANH một điểm trên sân ⇒ đi tới điểm đó', async () => {
    const { ws } = await vaoSanMang()
    const cv = document.querySelector('.dn-khung canvas')!
    vi.spyOn(cv, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 600, bottom: 600, width: 600, height: 600, x: 0, y: 0, toJSON() {} } as DOMRect)
    ptr(cv, 'pointerdown', { clientX: 500, clientY: 200 })
    ptr(cv, 'pointerup', { clientX: 500, clientY: 200 })
    khung(12)
    const cuoi = ws.yDinh().at(-1)!
    expect(cuoi.dx).toBeGreaterThan(0.9) // em ở (200, 200) ⇒ đi sang phải
  })

  it('thầy bắt đầu (màn cha báo batDau) ⇒ huỷ requestAnimationFrame NGAY trong lượt đó, đóng kết nối, chỉ còn một dòng chữ', async () => {
    const { ws, rerender } = await vaoSanMang()
    khung(2)
    expect(hang.length).toBe(1)
    rerender(<DauIon maCa="123456" veDau="ve-ky" batDau />)
    expect(huyRaf).toHaveBeenCalled()
    expect(hang.length).toBe(0)
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.dn-man')).toBeNull()
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
  })

  it('phòng báo {t:"dong", ly:"bat-dau"} ⇒ dừng game trong cùng lượt + gọi onBatDau (màn cha vào bài ngay)', async () => {
    const onBatDau = vi.fn()
    const { ws } = await vaoSanMang({ onBatDau })
    khung(2)
    await act(async () => { ws.nhan({ t: 'dong', ly: 'bat-dau' }) })
    expect(onBatDau).toHaveBeenCalledTimes(1)
    expect(huyRaf).toHaveBeenCalled()
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.dn-man')).toBeNull()
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
  })

  it('phòng đóng 4010 (bản cũ / sảnh tắt) ⇒ thoát màn trận, nút chính thành «Chơi với A.I»', async () => {
    const { ws } = await vaoSanMang()
    await act(async () => { ws.onclose?.({ code: 4010, reason: 'tat' }) })
    expect(document.querySelector('.dn-man')).toBeNull()
    expect(screen.getByRole('button', { name: 'Chơi với A.I' })).toBeTruthy()
  })
})
