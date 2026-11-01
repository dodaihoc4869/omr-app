// «ĐẤU NGUYÊN TỬ» 3 ĐẤU 3 · MÀN (jsdom): sảnh MỘT nút «Đấu» + dòng luật; 0 mạng khi em chưa bấm; bấm ⇒ đúng một WebSocket tới phòng của ca, gói đầu là vé +
// giao thức 3, chào xong tự xin vào sân; sân đến ⇒ màn trận tràn màn (tỉ số phe + đồng hồ); `thay` ⇒ tên mới + tin «… vào thay A.I»; ván mới đổi phe ⇒ báo;
// phòng đầy ⇒ tự nối phòng kế; KÉO Ở ĐÂU CŨNG ĐI, CHẠM NHANH THÌ ĐI TỚI; gợi ý lần đầu 3 giây; hết ván theo PHE, không thứ hạng, huy hiệu; không vé ⇒
// «Đấu» chơi 3 đấu 3 với A.I tại máy, 0 mạng; THẦY BẮT ĐẦU ⇒ huỷ requestAnimationFrame NGAY, đóng kết nối, dải «Sắp vào thi · 3 · 2 · 1».
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
  try { localStorage.clear(); localStorage.setItem('ddh.dauIon', JSON.stringify({ daXemGoiY: true, nt: 3 })) } catch { /* bỏ qua */ }
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

const ptr = (el: Element, type: string, o: Record<string, unknown>) => act(() => { const e = new Event(type, { bubbles: true }); Object.assign(e, { pointerId: 1, pointerType: 'touch', ...o }); el.dispatchEvent(e) })
/** Sân 3 đấu 3: em (Bazơ) + 2 bạn thật + 3 A.I. Dòng ghế [id, tên, nguyên tố, là A.I, phe]. */
const GHE = [[1, 'Minh Anh', 3, 0, 0], [2, 'Quốc Bảo', 6, 0, 1], [3, 'Khánh Ngọc', 4, 0, 0], [200, 'Sodium', 0, 1, 0], [201, 'Oxygen', 1, 1, 1], [202, 'Iron', 5, 1, 1]]
async function vaoSanMang(props: Record<string, unknown> = {}) {
  const r = render(<DauIon maCa="123456" veDau="ve-ky" {...props} />)
  expect(WsGia.ds).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Đấu' }))
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
  const ws = WsGia.ds[0]
  await act(async () => { ws.moRa(); ws.nhan({ t: 'chao', v: PHIEN_BAN, toi: 1, ten: 'Minh Anh' }) })
  await act(async () => { ws.nhan({ t: 'san', v: PHIEN_BAN, so: 1, toi: 1, con: 60, buoc: 0, ti: [7, 5], ghe: GHE, vp: [[1, 'e', 100, 100]] }) })
  // Ảnh trận: em ở (200, 200), các bạn ở xa.
  const tr = taoTran(GHE.map((g) => ({ id: g[0] as number, nt: g[2] as number, phe: g[4] as number })), 1)
  Object.assign(tr.ghe[0], { x: 200, y: 200 })
  await act(async () => { ws.nhan(maAnh(1, 42, tr.ghe, [], 1, [7, 5]).buffer); ws.nhan(maAnh(2, 42, tr.ghe, [], 2, [7, 5]).buffer) })
  return { ...r, ws, tr }
}

describe('Đấu Nguyên Tử 3 đấu 3 · màn phòng chờ', () => {
  it('sảnh: tiêu đề, hai phe, MỘT nút lớn «Đấu» + dòng luật, 7 ký hiệu; 0 kết nối tới khi bấm', () => {
    render(<DauIon maCa="123456" veDau="ve-ky" />)
    expect(screen.getByRole('heading', { name: 'Đấu Nguyên Tử' })).toBeTruthy()
    expect(document.querySelectorAll('.dn-nut-chinh')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Đấu' })).toBeTruthy()
    expect(screen.getByText('3 đấu 3 · thiếu bạn thì A.I vào thay · bạn vào là A.I nhường chỗ')).toBeTruthy()
    expect(document.body.textContent).toMatch(/Phe Bazơ.*3 đấu 3.*Phe Axit/)
    expect(screen.getAllByRole('radio')).toHaveLength(7)
    expect(WsGia.ds).toHaveLength(0)
  })

  it('không vé (sảnh tắt / ca cũ) ⇒ «Đấu» chơi 3 đấu 3 với A.I TẠI MÁY, 0 mạng; hai cột phe 3 + 3; Rời sân', async () => {
    render(<DauIon maCa="123456" />)
    expect(await screen.findByText(/Sảnh đấu chưa mở ở ca này/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đấu' }))
    expect(document.querySelector('.dn-man')).toBeTruthy()
    khung(5)
    const cot = document.querySelectorAll('.dn-doi-cot')
    expect(cot).toHaveLength(2)
    expect([...cot].map((c) => c.querySelectorAll('li').length)).toEqual([3, 3])
    expect(document.querySelector('.dn-doi')!.textContent).toMatch(/A\.I /)
    expect(WsGia.ds).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /Rời sân/ }))
    expect(document.querySelector('.dn-man')).toBeNull()
  })

  it('có vé ⇒ chỉ nối khi bấm; gói đầu là vé + giao thức 3; chào xong tự xin vào sân; sân đến ⇒ trận với tỉ số PHE + đồng hồ từ ảnh trận', async () => {
    const { ws } = await vaoSanMang()
    expect(ws.url).toBe('wss://may-chu.test/dau-ion/123456')
    expect(ws.gui[0]).toMatchObject({ t: 'vao', v: PHIEN_BAN, ve: 've-ky' })
    expect(ws.gui).toContainEqual({ t: 'vao-san' })
    expect(document.querySelector('.dn-man')).toBeTruthy()
    khung(3)
    const ts = document.querySelector('.dn-ti-so')!
    expect(ts.getAttribute('aria-label')).toBe('Phe Bazơ 7, Phe Axit 5, còn 0:42')
    expect(document.querySelector('.dn-doi')!.textContent).toContain('A.I Sodium')
  })

  it('`thay {cu, moi}`: tên mới vào cột phe ngay, tin «Gia Huy vào thay A.I · Phe Bazơ»; ván mới đổi phe em ⇒ «Ván mới · em ở Phe Axit»', async () => {
    const { ws } = await vaoSanMang()
    khung(2)
    await act(async () => { ws.nhan({ t: 'thay', cu: 200, moi: 4, ten: 'Gia Huy', nt: 0, phe: 0, ai: 0 }) })
    khung(2)
    expect(document.querySelector('.dn-tin')!.textContent).toContain('Gia Huy vào thay A.I · Phe Bazơ')
    await act(async () => { ws.nhan({ t: 'van', con: 60, buoc: 50, vp: [], ghe: GHE.map((g) => [g[0], g[1], g[2], g[3], 1 - (g[4] as number)]) }) })
    khung(2)
    expect(document.querySelector('.dn-tin')!.textContent).toContain('Ván mới · em ở Phe Axit')
  })

  it('phòng đầy ⇒ đóng 4009 «sang:1» ⇒ máy em TỰ nối phòng 1 của ca, không báo lỗi', async () => {
    const { ws } = await vaoSanMang()
    await act(async () => { ws.onclose?.({ code: 4009, reason: 'sang:1' }) })
    expect(WsGia.ds).toHaveLength(2)
    expect(WsGia.ds[1].url).toBe('wss://may-chu.test/dau-ion/123456/1')
  })

  it('KÉO Ở BẤT KỲ ĐÂU ⇒ KHÔNG vẽ cần / vòng tròn nào, máy em gửi đúng HƯỚNG ĐI ~12 lần/giây', async () => {
    const { ws } = await vaoSanMang()
    const man = document.querySelector('.dn-man')!, kh = document.querySelector('.dn-khung')!
    ptr(kh, 'pointerdown', { clientX: 100, clientY: 300 })
    ptr(man, 'pointermove', { clientX: 160, clientY: 300 })
    khung(70)
    const yd = ws.yDinh()
    expect(yd.length).toBeGreaterThanOrEqual(12); expect(yd.length).toBeLessThanOrEqual(16)
    expect(yd.at(-1)!.dx).toBeGreaterThan(0.9); expect(Math.abs(yd.at(-1)!.dy)).toBeLessThan(0.05)
    ptr(man, 'pointerup', { clientX: 160, clientY: 300 })
    khung(10)
    expect(ws.yDinh().at(-1)).toMatchObject({ dx: 0, dy: 0 })
    expect(document.querySelector('.dn-can')).toBeNull()
  })

  it('CHẠM NHANH một điểm trên sân ⇒ đi tới điểm đó', async () => {
    const { ws } = await vaoSanMang()
    const cv = document.querySelector('.dn-khung canvas')!
    vi.spyOn(cv, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 600, bottom: 300, width: 600, height: 300, x: 0, y: 0, toJSON() {} } as DOMRect)
    ptr(cv, 'pointerdown', { clientX: 500, clientY: 100 })
    ptr(cv, 'pointerup', { clientX: 500, clientY: 100 })
    khung(12)
    expect(ws.yDinh().at(-1)!.dx).toBeGreaterThan(0.9) // em ở (200, 200) ⇒ đi sang phải
  })

  it('lần đầu vào sân ⇒ gợi ý «Kéo để chạy · súng tự ngắm, tự bắn» 3 giây rồi tự tắt, lần sau không hiện', async () => {
    try { localStorage.setItem('ddh.dauIon', JSON.stringify({ daXemGoiY: false, nt: 3 })) } catch { /* bỏ qua */ }
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await vaoSanMang()
    expect(document.querySelector('.dn-goi-y-dau')!.textContent).toMatch(/Kéo để chạy.*súng tự ngắm, tự bắn/)
    await act(async () => { vi.advanceTimersByTime(3100) })
    expect(document.querySelector('.dn-goi-y-dau')).toBeNull()
    expect(JSON.parse(localStorage.getItem('ddh.dauIon')!).daXemGoiY).toBe(true)
  })

  it('hết ván: «Phe Bazơ thắng 12 – 9», hai cột phe, KHÔNG số thứ hạng, mỗi em thật một huy hiệu, A.I «lấp ghế», đếm ngược ván mới', async () => {
    const { ws } = await vaoSanMang()
    khung(2)
    const bang = [[1, 4, 2, 4, 2, 9, 2, 21, 24], [2, 4, 4, 5, 2, 10, 1, 26, 15], [3, 5, 3, 3, 3, 6, 1, 25, 18], [200, 3, 1, 3, 1, 14, 3, 15, 31], [201, 3, 3, 3, 1, 7, 4, 17, 20], [202, 2, 5, 2, 1, 5, 0, 12, 9]]
    await act(async () => { ws.nhan({ t: 'ket', bang, nghi: 6, ti: [12, 9] }) })
    khung(2)
    const ket = document.querySelector('.dn-ket')!
    expect(ket.querySelector('h2')!.textContent).toBe('Phe Bazơ thắng 12 – 9')
    expect(ket.textContent).toContain('Phe em thắng!')
    expect(ket.querySelectorAll('.dn-cot')).toHaveLength(2)
    expect(ket.querySelectorAll('.dn-huy')).toHaveLength(3)
    expect(ket.textContent).toContain('A.I lấp ghế')
    expect(ket.textContent).not.toMatch(/Hạng|hạng \d/)
    expect(ket.textContent).toMatch(/Ván mới sau 6 giây/)
  })

  it('thầy bắt đầu (màn cha báo batDau) ⇒ huỷ requestAnimationFrame NGAY trong lượt đó, đóng kết nối, dải «Sắp vào thi · 3 · 2 · 1»', async () => {
    const { ws, rerender } = await vaoSanMang()
    khung(2)
    expect(hang.length).toBe(1)
    rerender(<DauIon maCa="123456" veDau="ve-ky" batDau />)
    expect(huyRaf).toHaveBeenCalled()
    expect(hang.length).toBe(0)
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.dn-man')).toBeNull()
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
    expect(document.querySelector('.dn-sap-thi')!.textContent).toBe('Sắp vào thi·321')
  })

  it('phòng báo {t:"dong", ly:"bat-dau"} ⇒ dừng game trong cùng lượt + gọi onBatDau (màn cha vào bài ngay, không chờ dải 3 · 2 · 1)', async () => {
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

  it('phòng đóng 4010 (bản cũ / sảnh tắt) ⇒ thoát màn trận, «Đấu» chuyển sang chơi với A.I tại máy', async () => {
    const { ws } = await vaoSanMang()
    await act(async () => { ws.onclose?.({ code: 4010, reason: 'tat' }) })
    expect(document.querySelector('.dn-man')).toBeNull()
    expect(screen.getByText(/Bấm «Đấu» để chơi với A.I tại máy/)).toBeTruthy()
  })
})
