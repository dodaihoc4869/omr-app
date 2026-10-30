// «ĐẤU ION» · MÀN (jsdom): không mở mạng khi em chưa bấm «Vào sảnh đấu»; không có vé ⇒ chỉ Tập với A.I; vào sảnh ⇒ đúng một WebSocket tới
// phòng của ca, gói đầu là vé; danh sách bạn chỉ có tên gọi; thách bạn gửi đúng số thứ tự; THẦY BẮT ĐẦU ⇒ đóng kết nối, tháo màn trận, chỉ còn một dòng chữ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu.test' }) }))
import DauIon from '../src/components/phong-cho/DauIon'

class WsGia {
  static ds: WsGia[] = []
  url: string; readyState = 0; binaryType = ''; gui: unknown[] = []; dong = false
  onopen: (() => void) | null = null; onmessage: ((e: { data: unknown }) => void) | null = null; onclose: ((e: { code: number; reason: string }) => void) | null = null; onerror: (() => void) | null = null
  constructor(url: string) { this.url = url; WsGia.ds.push(this) }
  send(d: unknown) { this.gui.push(typeof d === 'string' ? JSON.parse(d) : d) }
  close() { this.dong = true; this.readyState = 3 }
  moRa() { this.readyState = 1; this.onopen?.() }
  nhan(o: unknown) { this.onmessage?.({ data: JSON.stringify(o) }) }
}

beforeEach(() => { WsGia.ds = []; vi.stubGlobal('WebSocket', WsGia); try { localStorage.clear() } catch { /* bỏ qua */ } })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Đấu Nguyên Tử · màn phòng chờ', () => {
  it('không có vé (máy chủ tắt / ca cũ) ⇒ báo sảnh chưa mở, chỉ Tập với A.I, KHÔNG mở WebSocket', async () => {
    render(<DauIon maCa="123456" />)
    expect(await screen.findByText(/Sảnh đấu chưa mở ở ca này/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Tập với A\.I/ })).toBeTruthy()
    expect(WsGia.ds).toHaveLength(0)
  })

  it('có vé ⇒ chờ em bấm «Vào sảnh đấu» mới nối; gói đầu là vé; danh sách bạn + thách theo số thứ tự / số báo danh', async () => {
    render(<DauIon maCa="123456" veDau="ve-ky" />)
    expect(WsGia.ds).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /Vào sảnh đấu/ }))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(WsGia.ds).toHaveLength(1)
    const ws = WsGia.ds[0]
    expect(ws.url).toBe('wss://may-chu.test/dau-ion/123456')
    await act(async () => { ws.moRa(); ws.nhan({ t: 'chao', toi: 1, ten: 'Minh Anh', ds: [[1, 'Minh Anh', 0, 'ranh'], [2, 'Quốc Bảo', 1, 'ranh'], [3, 'Thu Hà', 3, 'dau']] }) })
    expect(ws.gui[0]).toMatchObject({ t: 'vao', ve: 've-ky' })
    expect(screen.getByText('Quốc Bảo')).toBeTruthy()
    expect(screen.getByText('Đang đấu')).toBeTruthy()
    const nutThach = screen.getAllByRole('button', { name: 'Thách' })
    fireEvent.click(nutThach[0])
    expect(ws.gui).toContainEqual({ t: 'thach', den: 2 })
    fireEvent.change(screen.getByLabelText('Thách theo số báo danh'), { target: { value: '12124' } })
    fireEvent.submit(screen.getByLabelText('Thách theo số báo danh').closest('form')!)
    expect(ws.gui).toContainEqual({ t: 'thach', sbd: '12124' })
    fireEvent.click(screen.getByRole('button', { name: /Đấu nhanh/ }))
    expect(ws.gui).toContainEqual({ t: 'nhanh' })
  })

  it('lời thách đến ⇒ hộp Nhận lời / Để sau; trận đến ⇒ màn trận phủ kín; thầy bắt đầu ⇒ đóng kết nối, tháo màn trận', async () => {
    const { rerender } = render(<DauIon maCa="123456" veDau="ve-ky" />)
    fireEvent.click(screen.getByRole('button', { name: /Vào sảnh đấu/ }))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    const ws = WsGia.ds[0]
    await act(async () => { ws.moRa(); ws.nhan({ t: 'chao', toi: 1, ten: 'Em', ds: [[1, 'Em', 0, 'ranh'], [2, 'Gia Huy', 2, 'ranh']] }); ws.nhan({ t: 'moi', tu: 2, ten: 'Gia Huy', nt: 2, con: 20 }) })
    expect(screen.getByRole('alertdialog').textContent).toMatch(/Gia Huy thách em đấu 1–1/)
    fireEvent.click(screen.getByRole('button', { name: 'Nhận lời' }))
    expect(ws.gui).toContainEqual({ t: 'nhan', tu: 2 })
    await act(async () => { ws.nhan({ t: 'tran', id: 1, kieu: 'doi', toi: 1, giay: 90, haThang: 5, ghe: [[1, 'Em', 0], [2, 'Gia Huy', 2]] }) })
    expect(document.querySelector('.di-man')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Rời trận/ })).toBeTruthy()
    rerender(<DauIon maCa="123456" veDau="ve-ky" batDau />)
    expect(ws.dong).toBe(true)
    expect(document.querySelector('.di-man')).toBeNull()
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
  })

  it('phòng đấu báo {t:"dong"} (thầy bắt đầu ở máy chủ) ⇒ cùng kết quả dù màn cha chưa kịp thấy', async () => {
    render(<DauIon maCa="123456" veDau="ve-ky" />)
    fireEvent.click(screen.getByRole('button', { name: /Vào sảnh đấu/ }))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    const ws = WsGia.ds[0]
    await act(async () => { ws.moRa(); ws.nhan({ t: 'dong', ly: 'bat-dau' }) })
    expect(screen.getByText('Thầy đã bắt đầu thi')).toBeTruthy()
    expect(ws.dong).toBe(true)
  })

  it('Tập với A.I mở màn trận cục bộ, KHÔNG cần mạng', async () => {
    render(<DauIon maCa="123456" />)
    fireEvent.click(screen.getByRole('button', { name: /Tập với A\.I/ }))
    expect(document.querySelector('.di-man')).toBeTruthy()
    expect(WsGia.ds).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: /Rời trận/ }))
    expect(document.querySelector('.di-man')).toBeNull()
  })
})
