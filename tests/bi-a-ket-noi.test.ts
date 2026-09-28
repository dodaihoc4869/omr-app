// @vitest-environment node
// BI-A PHẢN ỨNG GĐ2 · KẾT NỐI PHÒNG ĐẤU (src/game/bi-a/ket-noi.ts): mở ⇒ gửi vé; rớt ⇒ tự nối lại bằng CHÍNH vé cũ (1 → 2 → 4 → 5 giây);
// quá 60 giây không nối được ⇒ 'mat'; "Nối lại" bấm tay; giữ kết nối bằng ping 25 giây (hẹn nối tiếp); đóng hẳn thì thôi nối.
import { describe, expect, it } from 'vitest'
import { GIAY_BO_NOI, KetNoiBan, type GoiPhong, type TrangThaiNoi } from '../src/game/bi-a/ket-noi'

class WsGia {
  readyState = 0
  gui: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: unknown }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly url: string) {}
  send(s: string) { this.gui.push(s) }
  close() { this.readyState = 3 }
  mo() { this.readyState = 1; this.onopen?.() }
  rot() { this.readyState = 3; this.onclose?.() }
  den(m: unknown) { this.onmessage?.({ data: typeof m === 'string' ? m : JSON.stringify(m) }) }
}
function dung() {
  let t = 0
  const hen: { t: number; fn: () => void; id: number }[] = []
  let id = 0
  const ws: WsGia[] = [], tt: TrangThaiNoi[] = [], nhan: GoiPhong[] = []
  const kn = new KetNoiBan({
    url: 'wss://may.test/bi-a/phong/v1', ve: 'VE-CU', nhan: (m) => nhan.push(m), doi: (x) => tt.push(x),
    taoWs: (u) => { const w = new WsGia(u); ws.push(w); return w as unknown as WebSocket },
    datGio: (fn, ms) => { hen.push({ t: t + ms, fn, id: ++id }); return id as unknown as ReturnType<typeof setTimeout> },
    xoaGio: (x) => { const i = hen.findIndex((h) => h.id === (x as unknown as number)); if (i >= 0) hen.splice(i, 1) },
    bayGio: () => t,
  })
  const chay = (ms: number) => {
    const den = t + ms
    for (;;) {
      hen.sort((a, b) => a.t - b.t)
      const h = hen[0]
      if (!h || h.t > den) break
      hen.shift(); t = h.t; h.fn()
    }
    t = den
  }
  return { kn, ws, tt, nhan, chay, soHen: () => hen.length }
}

describe('KetNoiBan', () => {
  it('mở ⇒ gửi vé vào bàn; gói phòng chuyển tiếp (bỏ pong, bỏ gói hỏng); ping mỗi 25 giây bằng hẹn nối tiếp', () => {
    const d = dung()
    d.kn.mo()
    expect(d.ws).toHaveLength(1)
    expect(d.ws[0]!.url).toBe('wss://may.test/bi-a/phong/v1')
    d.ws[0]!.mo()
    expect(JSON.parse(d.ws[0]!.gui[0]!)).toEqual({ t: 'vao', ve: 'VE-CU' })
    expect(d.tt).toEqual(['noi'])
    d.ws[0]!.den({ t: 'tt', S: {} }); d.ws[0]!.den({ t: 'pong' }); d.ws[0]!.den('{hỏng'); d.ws[0]!.den({ khongT: 1 })
    expect(d.nhan.map((m) => m.t)).toEqual(['tt'])
    d.chay(25_000); d.chay(25_000)
    expect(d.ws[0]!.gui.filter((s) => s === '{"t":"ping"}')).toHaveLength(2)
    expect(d.soHen()).toBe(1) // luôn chỉ một hẹn ping chờ (không chồng)
    expect(d.kn.gui({ t: 'cu', v: 1 })).toBe(true)
  })

  it('rớt ⇒ "noi_lai", tự nối lại bằng CHÍNH vé cũ sau 1 → 2 → 4 → 5 giây; nối được ⇒ "noi" và đếm lại từ đầu', () => {
    const d = dung()
    d.kn.mo(); d.ws[0]!.mo()
    d.ws[0]!.rot()
    expect(d.kn.trangThai).toBe('noi_lai')
    expect(d.kn.gui({ t: 'cu' })).toBe(false) // chưa nối thì không gửi (cú cũ gửi muộn là sai lượt)
    d.chay(999); expect(d.ws).toHaveLength(1)
    d.chay(1); expect(d.ws).toHaveLength(2)
    d.ws[1]!.rot(); d.chay(2000); expect(d.ws).toHaveLength(3)
    d.ws[2]!.rot(); d.chay(4000); expect(d.ws).toHaveLength(4)
    d.ws[3]!.rot(); d.chay(5000); expect(d.ws).toHaveLength(5)
    d.ws[4]!.mo()
    expect(JSON.parse(d.ws[4]!.gui[0]!)).toEqual({ t: 'vao', ve: 'VE-CU' })
    expect(d.kn.trangThai).toBe('noi')
    d.ws[4]!.rot(); d.chay(1000); expect(d.ws).toHaveLength(6) // lại chờ 1 giây
  })

  it(`không nối được quá ${GIAY_BO_NOI} giây ⇒ "mat", thôi tự nối; bấm "Nối lại" ⇒ nối ngay`, () => {
    const d = dung()
    d.kn.mo(); d.ws[0]!.mo()
    d.ws[0]!.rot()
    for (let i = 0; i < 40 && d.kn.trangThai !== 'mat'; i++) { d.chay(5000); d.ws.at(-1)!.rot() }
    expect(d.kn.trangThai).toBe('mat')
    const soWs = d.ws.length
    d.chay(30_000)
    expect(d.ws).toHaveLength(soWs) // không nối nữa
    d.kn.noiLai()
    expect(d.ws).toHaveLength(soWs + 1)
    expect(d.kn.trangThai).toBe('noi_lai')
    d.ws.at(-1)!.mo()
    expect(d.kn.trangThai).toBe('noi')
  })

  it('đóng hẳn (rời bàn) ⇒ "dong", huỷ mọi hẹn, không tự nối', () => {
    const d = dung()
    d.kn.mo(); d.ws[0]!.mo()
    d.kn.dong()
    expect(d.kn.trangThai).toBe('dong')
    expect(d.soHen()).toBe(0)
    d.ws[0]!.rot()
    d.chay(60_000)
    expect(d.ws).toHaveLength(1)
    d.kn.mo(); d.kn.noiLai()
    expect(d.ws).toHaveLength(1)
  })
})
