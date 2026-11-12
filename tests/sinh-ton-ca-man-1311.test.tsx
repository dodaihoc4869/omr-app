// TRÒ «SINH TỒN BỐN ĐỘI» Ở PHÒNG CHỜ CA KIỂM TRA · MÀN (jsdom; thầy 13/11: «Chuyển luôn game này sang cả phòng chờ của ca kiểm tra»).
// Khoá các rào của ca thi: thẻ sảnh MỘT nút «Chơi», 0 kết nối tới khi em bấm; bấm ⇒ đúng một WebSocket tới phòng của ca, gói vào = vé + `tro: 'st'`;
// phòng trả `st-vao` ⇒ màn trò phủ kín ở document.body (đúng em, đúng đội, đủ danh sách); gói của em đi `{ t: 'st', x }`, ảnh của phòng tới người nghe `tro`;
// THẦY BẮT ĐẦU (màn cha báo `batDau`, hoặc phòng báo `{ t: 'dong' }` / đóng mã 4000) ⇒ đóng kết nối + gỡ trò NGAY, `onBatDau` đúng một lần;
// 4010 ⇒ «chưa mở», không nối lại; 4003 / 4002 / 4009 / rớt mạng mỗi thứ một dòng chữ; phòng đầy ⇒ tự sang phòng kế; không vé ⇒ nút mờ, 0 mạng.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { KenhLop, NguoiLop, TinLop } from '../src/lib/live-khoi/kieu'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu.test' }) }))
// Màn trò thật (canvas + vòng vẽ) có bộ test riêng (tests/live-khoi-sinh-ton-*.test.ts); ở đây thay bằng màn giả ghi lại những gì thẻ sảnh truyền vào.
interface TroGiaProps { toi: NguoiLop | null; ds: readonly NguoiLop[]; kenh: KenhLop; soEm: number; xoay?: boolean }
const tro = vi.hoisted(() => ({ gan: 0, go: 0, props: null as unknown, tin: [] as unknown[] }))
vi.mock('../src/components/live-khoi/TroSinhTon', async () => {
  const { useEffect } = await import('react')
  return {
    default: function TroGia(p: TroGiaProps) {
      tro.props = p
      useEffect(() => { tro.gan++; const bo = p.kenh.nghe('tro', (t: TinLop) => { tro.tin.push(t) }); return () => { tro.go++; bo() } }, [p.kenh])
      return <div data-testid="tro-gia">{p.toi?.ten} · đội {p.toi?.doi} · {p.soEm} em · {p.ds.map((n) => n.ten).join(', ')}</div>
    },
  }
})
import SanhSinhTon from '../src/components/phong-cho/SanhSinhTon'
import PhongChoGame from '../src/components/PhongChoGame'
import { PHIEN_BAN_ST } from '../src/lib/live-khoi/kieu'
import { DOI_BPU } from '../src/lib/bpu/phong'

class WsGia {
  static ds: WsGia[] = []
  url: string; readyState = 0; binaryType = ''; gui: Record<string, unknown>[] = []; dong = false
  onopen: (() => void) | null = null; onmessage: ((e: { data: unknown }) => void) | null = null; onclose: ((e: { code: number; reason: string }) => void) | null = null; onerror: (() => void) | null = null
  constructor(url: string) { this.url = url; WsGia.ds.push(this) }
  send(d: unknown) { this.gui.push(JSON.parse(String(d))) }
  close() { this.dong = true; this.readyState = 3 }
  moRa() { this.readyState = 1; this.onopen?.() }
  nhan(o: unknown) { this.onmessage?.({ data: JSON.stringify(o) }) }
}
const troProps = () => tro.props as TroGiaProps

beforeEach(() => {
  WsGia.ds = []; tro.gan = 0; tro.go = 0; tro.props = null; tro.tin = []
  vi.stubGlobal('WebSocket', WsGia)
  try { localStorage.clear() } catch { /* bỏ qua */ }
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

const nutChoi = () => screen.getByRole('button', { name: 'Chơi' }) as HTMLButtonElement
/** Bấm «Chơi» và chờ lớp mạng đọc xong cấu hình máy chủ ⇒ trả kết nối vừa mở. */
async function bamChoi() {
  fireEvent.click(nutChoi())
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
  return WsGia.ds.at(-1)!
}
const DS = [['12121', 'Khánh Ngọc', 2], ['S2', 'Hải Đăng', 0], ['S3', 'Minh Anh', 1]]
/** Em bấm «Chơi», phòng nhận vé và trả `st-vao` ⇒ màn trò đang mở. */
async function vaoTro(props: Record<string, unknown> = {}) {
  const truoc = WsGia.ds.length
  const r = render(<SanhSinhTon maCa="123456" veDau="ve-ky" {...props} />)
  expect(WsGia.ds).toHaveLength(truoc) // chưa bấm ⇒ chưa có kết nối nào
  const ws = await bamChoi()
  await act(async () => { ws.moRa(); ws.nhan({ t: 'st-vao', toi: DS[0], ds: DS }) })
  await screen.findByTestId('tro-gia')
  return { ...r, ws }
}

describe('Sinh Tồn bốn đội · thẻ sảnh trong phòng chờ ca', () => {
  it('thẻ: tên trò, một dòng mô tả, bốn đội đúng DOI_BPU, MỘT nút lớn «Chơi»; chưa bấm ⇒ KHÔNG tạo WebSocket nào, chưa gắn màn trò', () => {
    render(<SanhSinhTon maCa="123456" veDau="ve-ky" />)
    expect(screen.getByRole('heading', { name: 'Sinh Tồn bốn đội' })).toBeTruthy()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(nutChoi().disabled).toBe(false)
    expect(screen.getByText(/Vuốt để chạy/)).toBeTruthy()
    const doi = [...document.querySelectorAll('.sst-doi li')]
    expect(doi.map((li) => li.textContent)).toEqual(DOI_BPU.map((d) => `${d.ky} · ${d.ten}`))
    expect(doi.map((li) => (li as HTMLElement).style.getPropertyValue('--d'))).toEqual(DOI_BPU.map((d) => `var(${d.mau})`))
    expect(WsGia.ds).toHaveLength(0)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(tro.gan).toBe(0)
  })
  it('thiếu vé hoặc mã ca (trò tắt / ca cũ) ⇒ nút mờ + dòng «chưa mở», bấm cũng 0 mạng', async () => {
    for (const p of [{ maCa: '123456' }, { veDau: 've-ky' }, {}]) {
      const r = render(<SanhSinhTon {...p} />)
      expect(nutChoi().disabled).toBe(true)
      expect(screen.getByText('Trò chơi chưa mở ở ca này. Em vẫn vào bài khi thầy bắt đầu.')).toBeTruthy()
      fireEvent.click(nutChoi())
      await act(async () => { await Promise.resolve(); await Promise.resolve() })
      expect(WsGia.ds).toHaveLength(0)
      r.unmount()
    }
  })
  it('bấm «Chơi» ⇒ đúng MỘT kết nối tới phòng của ca, gói đầu = vé + giao thức Sinh Tồn; đang vào ⇒ nút khoá (bấm lặp không mở thêm kết nối)', async () => {
    render(<SanhSinhTon maCa="123456" veDau="ve-ky" />)
    const ws = await bamChoi()
    expect(WsGia.ds).toHaveLength(1)
    expect(ws.url).toBe('wss://may-chu.test/dau-ion/123456')
    expect(screen.getByText('Đang vào trò…')).toBeTruthy()
    expect(nutChoi().disabled).toBe(true)
    fireEvent.click(nutChoi())
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(WsGia.ds).toHaveLength(1)
    await act(async () => { ws.moRa() })
    expect(ws.gui).toEqual([{ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: 've-ky' }])
    expect(document.querySelector('.sst-man')).toBeNull() // chưa có `st-vao` ⇒ chưa mở màn trò
  })
  it('phòng trả `st-vao` ⇒ màn trò phủ kín ở document.body: đúng em, đúng đội, đủ danh sách, nút «Thoát trò»; `st-ds` ⇒ danh sách mới', async () => {
    const { ws, container } = await vaoTro()
    const man = document.querySelector('.sst-man')!
    expect(man.parentElement).toBe(document.body)
    expect(container.contains(man)).toBe(false)
    expect(man.getAttribute('role')).toBe('dialog')
    expect(man.getAttribute('style')).toContain('--tr-nen') // khung xanh than cố định cho màn trò
    expect(troProps().toi).toEqual({ sbd: '12121', ten: 'Khánh Ngọc', doi: 2 })
    expect(troProps().ds.map((n) => [n.sbd, n.doi])).toEqual([['12121', 2], ['S2', 0], ['S3', 1]])
    expect(troProps().soEm).toBe(3)
    expect(screen.getByRole('button', { name: 'Thoát trò' })).toBeTruthy()
    await act(async () => { ws.nhan({ t: 'st-ds', ds: [DS[0], DS[1], 'rác', ['', 'x', 0]] }) })
    expect(troProps().ds.map((n) => n.sbd)).toEqual(['12121', 'S2'])
    expect(troProps().toi?.doi).toBe(2)
    expect(tro.gan).toBe(1) // danh sách đổi không dựng lại màn trò
  })
  it('kênh của trò: gói của em đi `{ t: "st", x }`; ảnh `{ t: "lop", k: "tro" }` của phòng tới người nghe; kênh là MỘT đối tượng cố định', async () => {
    const { ws } = await vaoTro()
    const kenh = troProps().kenh
    act(() => { kenh.gui('tro', { p: [10, 20, 100, 1], t: '~1' }) })
    expect(ws.gui.at(-1)).toEqual({ t: 'st', x: { p: [10, 20, 100, 1], t: '~1' } })
    const n = ws.gui.length
    act(() => { kenh.gui('chat', { c: 'không có chat ở phòng chờ ca' }) })
    expect(ws.gui).toHaveLength(n)
    const anh = { t: 'lop', k: 'tro', s: '', n: '', d: -1, l: 123, x: { ds: {}, an: [], d: [0, 0, 0, 0], v: 1, c: 0, h: [-1, ''] } }
    await act(async () => { ws.nhan(anh); ws.nhan({ t: 'lop', k: 'chat', x: { c: 'lạ' } }); ws.nhan({ t: 'st-ds', ds: DS }) })
    expect(tro.tin).toEqual([anh])
    expect(troProps().kenh).toBe(kenh)
  })
  it('«Thoát trò» (hoặc Esc) ⇒ đóng kết nối, gỡ màn trò, về thẻ; bấm «Chơi» lại ⇒ kết nối MỚI', async () => {
    const { ws } = await vaoTro()
    fireEvent.click(screen.getByRole('button', { name: 'Thoát trò' }))
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(tro.go).toBe(1)
    expect(nutChoi().disabled).toBe(false)
    const ws2 = await bamChoi()
    expect(WsGia.ds).toHaveLength(2)
    await act(async () => { ws2.moRa(); ws2.nhan({ t: 'st-vao', toi: DS[0], ds: DS }) })
    expect(document.querySelector('.sst-man')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(ws2.dong).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
  })
})

describe('Sinh Tồn bốn đội · KHÔNG cản việc vào bài', () => {
  it('thầy bắt đầu (màn cha báo `batDau`) ⇒ đóng kết nối + gỡ trò NGAY trong lượt đó, dải «Sắp vào thi · 3 · 2 · 1»; không tự gọi onBatDau', async () => {
    const onBatDau = vi.fn()
    const { ws, rerender } = await vaoTro({ onBatDau })
    rerender(<SanhSinhTon maCa="123456" veDau="ve-ky" batDau onBatDau={onBatDau} />)
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(screen.queryByTestId('tro-gia')).toBeNull()
    expect(tro.go).toBe(1)
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
    expect(document.querySelector('.sst-sap-thi')!.textContent).toBe('Sắp vào thi·321')
    expect(screen.queryByRole('button', { name: 'Chơi' })).toBeNull()
    expect(onBatDau).not.toHaveBeenCalled() // màn cha đã biết — nó tự vào bài
    expect(WsGia.ds).toHaveLength(1)
  })
  it('thầy bắt đầu khi em CHƯA bấm «Chơi» ⇒ thẻ đổi sang «Thầy đã bắt đầu thi», vẫn 0 kết nối', () => {
    const { rerender } = render(<SanhSinhTon maCa="123456" veDau="ve-ky" />)
    rerender(<SanhSinhTon maCa="123456" veDau="ve-ky" batDau />)
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
    expect(WsGia.ds).toHaveLength(0)
  })
  it('thầy bắt đầu đúng lúc em vừa bấm «Chơi» (đang đọc cấu hình máy chủ) ⇒ KHÔNG mở kết nối muộn', async () => {
    const { rerender } = render(<SanhSinhTon maCa="123456" veDau="ve-ky" />)
    fireEvent.click(nutChoi())
    rerender(<SanhSinhTon maCa="123456" veDau="ve-ky" batDau />)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(WsGia.ds).toHaveLength(0)
  })
  it('phòng đóng mã 4000 ⇒ gọi onBatDau ĐÚNG MỘT LẦN, đóng kết nối, gỡ trò, không nối lại', async () => {
    const onBatDau = vi.fn()
    const { ws } = await vaoTro({ onBatDau })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }) // bật sau khi vào trò: chỉ để soi hẹn giờ nối lại
    await act(async () => { ws.onclose?.({ code: 4000, reason: 'bat-dau' }) })
    expect(onBatDau).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(tro.go).toBe(1)
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(WsGia.ds).toHaveLength(1)
    expect(onBatDau).toHaveBeenCalledTimes(1)
  })
  it('phòng báo `{ t: "dong", ly: "bat-dau" }` rồi mới đóng 4000 ⇒ dừng trò ngay ở gói báo, onBatDau vẫn chỉ MỘT lần', async () => {
    const onBatDau = vi.fn()
    const { ws } = await vaoTro({ onBatDau })
    const dongSauBao = ws.onclose
    await act(async () => { ws.nhan({ t: 'dong', ly: 'bat-dau' }) })
    expect(onBatDau).toHaveBeenCalledTimes(1)
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(ws.onclose).toBeNull() // lớp mạng đã gỡ tai nghe ⇒ mã 4000 theo sau không gọi lần hai
    await act(async () => { dongSauBao?.({ code: 4000, reason: 'bat-dau' }) })
    expect(onBatDau).toHaveBeenCalledTimes(1)
  })
  it('trong màn thi thật: PhongChoGame nạp thẻ Sinh Tồn, truyền vé + `batDau` + `onBatDau`', async () => {
    const onBatDau = vi.fn()
    const r = render(<PhongChoGame cho={{ tenCa: 'Ca Ancol', maCa: '123456', veDau: 've-ky' }} onBatDau={onBatDau} />)
    await r.findByRole('heading', { name: 'Sinh Tồn bốn đội' })
    expect(r.container.textContent).toContain('Điểm chơi chỉ để vui trong lúc chờ.')
    const ws = await bamChoi()
    await act(async () => { ws.moRa(); ws.nhan({ t: 'st-vao', toi: DS[0], ds: DS }) })
    await screen.findByTestId('tro-gia')
    await act(async () => { ws.onclose?.({ code: 4000, reason: 'bat-dau' }) })
    expect(onBatDau).toHaveBeenCalledTimes(1)
    r.rerender(<PhongChoGame cho={{ tenCa: 'Ca Ancol', maCa: '123456', veDau: 've-ky', batDau: true }} onBatDau={onBatDau} />)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(r.container.textContent).toContain('Đang chờ Thầy bấm bắt đầu')
  })
})

describe('Sinh Tồn bốn đội · trạng thái mạng (mỗi thứ một dòng chữ trong thẻ)', () => {
  it('phòng đóng 4010 (công tắc tắt / mảnh cũ) ⇒ gỡ trò, dòng «chưa mở», nút mờ, KHÔNG nối lại', async () => {
    const onBatDau = vi.fn()
    const { ws } = await vaoTro({ onBatDau })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }) // bật sau khi vào trò: chỉ để soi hẹn giờ nối lại
    await act(async () => { ws.onclose?.({ code: 4010, reason: 'tat' }) })
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(screen.getByText('Trò chơi chưa mở ở ca này. Em vẫn vào bài khi thầy bắt đầu.')).toBeTruthy()
    expect(nutChoi().disabled).toBe(true)
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(WsGia.ds).toHaveLength(1)
    expect(onBatDau).not.toHaveBeenCalled()
  })
  it('phòng báo `{ t: "dong", ly: "tat" }` ⇒ như 4010', async () => {
    const { ws } = await vaoTro()
    await act(async () => { ws.nhan({ t: 'dong', ly: 'tat' }) })
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(screen.getByText(/Trò chơi chưa mở ở ca này/)).toBeTruthy()
  })
  it('4003 vé hết hạn ⇒ nút mờ; 4002 mở ở máy khác ⇒ bấm «Chơi» để chơi ở máy này; 4009 «day» ⇒ thử lại sau', async () => {
    const a = await vaoTro()
    await act(async () => { a.ws.onclose?.({ code: 4003, reason: 'x' }) })
    expect(screen.getByText('Lượt vào trò của ca này đã hết hạn. Em vẫn vào bài khi thầy bắt đầu.')).toBeTruthy()
    expect(nutChoi().disabled).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
    a.unmount()
    const b = await vaoTro()
    await act(async () => { b.ws.onclose?.({ code: 4002, reason: 'x' }) })
    expect(screen.getByText('Em vừa mở trò ở máy hoặc tab khác. Bấm «Chơi» để chơi ở máy này.')).toBeTruthy()
    expect(document.querySelector('.sst-man')).toBeNull()
    const n = WsGia.ds.length
    await bamChoi()
    expect(WsGia.ds).toHaveLength(n + 1)
    b.unmount()
    const c = await vaoTro()
    await act(async () => { c.ws.onclose?.({ code: 4009, reason: 'day' }) })
    expect(screen.getByText('Trò chơi đang đủ người. Em bấm «Chơi» để thử lại sau ít phút.')).toBeTruthy()
    expect(nutChoi().disabled).toBe(false)
  })
  it('phòng đầy ⇒ đóng 4009 «sang:1» ⇒ máy em TỰ nối phòng 1 của ca, không báo lỗi', async () => {
    const { ws } = await vaoTro()
    await act(async () => { ws.onclose?.({ code: 4009, reason: 'sang:1' }) })
    expect(WsGia.ds).toHaveLength(2)
    expect(WsGia.ds[1].url).toBe('wss://may-chu.test/dau-ion/123456/1')
    expect(screen.queryByText(/đủ người/)).toBeNull()
  })
  it('rớt mạng giữa trận ⇒ GIỮ màn trò, tự nối lại (gửi lại vé); nối lại hỏng 5 lần ⇒ gỡ trò, «Chưa nối được», bấm «Chơi» thử lại', async () => {
    const { ws } = await vaoTro()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await act(async () => { ws.onclose?.({ code: 1006, reason: '' }) })
    expect(document.querySelector('.sst-man')).toBeTruthy()
    expect(screen.getByText('Mất kết nối — đang nối lại (lần 1)…')).toBeTruthy()
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(WsGia.ds).toHaveLength(2)
    await act(async () => { WsGia.ds[1].moRa(); WsGia.ds[1].nhan({ t: 'st-vao', toi: ['12121', 'Khánh Ngọc', 0], ds: DS }) })
    expect(WsGia.ds[1].gui[0]).toMatchObject({ t: 'vao', tro: 'st', ve: 've-ky' })
    expect(troProps().toi?.doi).toBe(0) // phòng xếp lại đội ⇒ màn trò nhận đội mới
    expect(screen.queryByText(/Mất kết nối/)).toBeNull()
    // Rớt hẳn: năm lần nối lại đều hỏng.
    for (let i = 0; i < 6; i++) await act(async () => { WsGia.ds.at(-1)!.onclose?.({ code: 1006, reason: '' }); vi.advanceTimersByTime(8000) })
    expect(screen.getByText('Chưa nối được trò chơi. Em bấm «Chơi» để thử lại.')).toBeTruthy()
    expect(document.querySelector('.sst-man')).toBeNull()
    expect(nutChoi().disabled).toBe(false)
    const n = WsGia.ds.length
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(WsGia.ds).toHaveLength(n) // đã thôi, không tự nối nữa
  })
  it('thẻ tháo khỏi màn (em rời phòng chờ) ⇒ đóng kết nối', async () => {
    const { ws, unmount } = await vaoTro()
    unmount()
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.sst-man')).toBeNull()
  })
})

describe('Sinh Tồn bốn đội · kiểu (sanh-sinh-ton.css)', () => {
  const css = readFileSync(resolve(__dirname, '../src/components/phong-cho/sanh-sinh-ton.css'), 'utf8')
  const luat = (chon: string) => css.split('}').map((k) => k.split('{')).filter((k) => k.length === 2 && k[0].replace(/\/\*[\s\S]*?\*\//g, '').trim() === chon).map((k) => k[1]).join(';')
  it('màn trò cố định phủ kín, là vùng cử chỉ (không cuộn trang bên dưới); thẻ sảnh vẫn cuộn bình thường', () => {
    expect(luat('.sst-man')).toMatch(/position: fixed/)
    expect(luat('.sst-man')).toMatch(/inset: 0/)
    expect(luat('.sst-man')).toMatch(/touch-action: none/)
    expect(luat('.sst-man')).toMatch(/overscroll-behavior: contain/)
    expect(luat('.sst-the')).not.toMatch(/touch-action/)
    // Điện thoại cầm dọc: cùng phép xoay với lớp nổi Live theo khối (.lke[data-xoay]) ⇒ toạ độ chạm của màn trò (chieu-xoay.ts) khớp.
    expect(luat('.sst-man[data-xoay]')).toMatch(/transform-origin: 0 0; transform: rotate\(90deg\) translateY\(-100%\)/)
    expect(luat('.sst-man[data-xoay="nguoc"]')).toMatch(/transform: rotate\(-90deg\) translateX\(-100%\)/)
  })
  it('đích chạm: nút «Chơi» ≥ 48 px, «Thoát trò» ≥ 44 px ở góc trên-trái, không đè nút loa của trò (top 56 px)', () => {
    expect(Number(/min-height: (\d+)px/.exec(luat('.sst-the .sst-nut'))![1])).toBeGreaterThanOrEqual(48)
    const thoat = luat('.sst-man .sst-thoat')
    expect(Number(/min-height: (\d+)px/.exec(thoat)![1])).toBeGreaterThanOrEqual(44)
    expect(thoat).toMatch(/left: max\(8px, env\(safe-area-inset-left, 0px\)\); top: 6px/)
    expect(6 + Number(/min-height: (\d+)px/.exec(thoat)![1])).toBeLessThanOrEqual(56)
  })
  it('chỉ dùng biến màu có sẵn: không mã màu thô (#…, rgb, hsl)', () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
  })
})
