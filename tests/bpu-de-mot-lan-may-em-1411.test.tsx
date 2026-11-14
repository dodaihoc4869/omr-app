// SỬA LAG TẬN GỐC (thầy 14/11) — PHÍA MÁY EM: màn Bình Phản Ứng giữ đề của lượt; view không kèm đề (`cau: null` + đúng `ck`) ⇒ vẫn hiện đề đang giữ;
// lệch khoá (vừa nối lại / mất tin) ⇒ xin lại cả view (`xin-view`), không hiện màn thiếu đề; `chao` báo `cg: 1`.
import { act, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moLuot, taoPhong, viewEm } from '../src/lib/bpu/phong'

class WsGia {
  static ds: WsGia[] = []
  readyState = 1; daGui: string[] = []
  onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.daGui.push(d) }
  close() {}
  nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) }
}
const T0 = Date.now()
const cau = (qid: string) => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, maDe: 'm', phan: 'I', text: `Đề riêng của ${qid}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 })

describe('máy em — đề của lượt giữ trên máy', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
    WsGia.ds = []
    vi.stubGlobal('WebSocket', WsGia)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' }))))
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock('../src/lib/dia-chi-may-chu') })

  it('chao báo cg; view gọn (cau null, đúng ck) vẫn hiện đề; lệch ck ⇒ gửi xin-view, giữ màn cũ', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    await waitFor(() => expect(ws.daGui.some((d) => d.includes('"chao"'))).toBe(true))
    expect(JSON.parse(ws.daGui.find((d) => d.includes('"chao"'))!)).toMatchObject({ t: 'chao', cg: 1 })
    const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: T0 }] })
    moLuot(st, cau('q1'), T0)
    const v = viewEm(st, 'S1')
    ws.nhan({ ...v, luot: { ...v.luot, ck: 'k1' } })
    await waitFor(() => expect(document.body.textContent).toContain('Đề riêng của q1'))
    // View gọn: không kèm đề, đúng khoá ⇒ đề vẫn hiện, không xin lại.
    ws.nhan({ ...v, luot: { ...v.luot, ck: 'k1', cau: null, gon: 1, daGui: 1 } })
    expect(document.body.textContent).toContain('Đề riêng của q1')
    expect(ws.daGui.some((d) => d.includes('xin-view'))).toBe(false)
    // Lệch khoá (lượt mới mà máy chưa có đề) ⇒ xin lại cả view; màn không đổi sang màn thiếu đề.
    ws.nhan({ ...v, luot: { ...v.luot, so: 2, ck: 'k2', cau: null, gon: 1 } })
    expect(ws.daGui.filter((d) => d.includes('xin-view'))).toHaveLength(1)
    expect(document.body.textContent).toContain('Đề riêng của q1')
    // Vẫn lệch cùng khoá ⇒ KHÔNG xin lần hai (không vòng); view không có dấu gon (lượt không có đề) ⇒ không bao giờ xin.
    ws.nhan({ ...v, luot: { ...v.luot, so: 2, ck: 'k2', cau: null, gon: 1 } })
    ws.nhan({ ...v, luot: { ...v.luot, so: 3, ck: 'k3', cau: null } })
    expect(ws.daGui.filter((d) => d.includes('xin-view'))).toHaveLength(1)
  })
})
