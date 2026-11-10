// Bình Phản Ứng — VỀ LẠI CÓ XÁC NHẬN (thầy 10/11: «Quay lại bình phản ứng vẫn chưa ẩn cảnh báo»).
// Trước: `ve` chỉ gửi MỘT lần đúng lúc trang hiện lại — lúc ấy chưa có tiêu điểm, hoặc tin đi vào kết nối đã chết ⇒ bảng báo đỏ mãi.
// Nay: còn nợ `ve` thì tự thử lại; phòng còn ghi `dangRoi` thì gửi lại; chạm vào màn = đã về; phòng im sau `ve` ⇒ nối lại.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moLuot, roiMan, taoPhong, veMan, viewEm } from '../src/lib/bpu/phong'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; dong = false; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() { this.dong = true; this.readyState = 3 } nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }] })
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 }
const coTin = (ws: WsGia, t: string) => ws.gui.filter((x) => JSON.parse(x).t === t).length
const cho = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })
let an = false, co = true
const an_ = (v: boolean, tieuDiem = !v) => { an = v; co = tieuDiem; act(() => { document.dispatchEvent(new Event('visibilitychange')) }) }

beforeEach(() => {
  WsGia.ds = []; an = false; co = true; _datLaiTatMan()
  vi.stubGlobal('WebSocket', WsGia)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' }))))
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => an })
  vi.spyOn(document, 'hasFocus').mockImplementation(() => co)
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); delete (document as unknown as Record<string, unknown>).hidden })

async function vao() {
  const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
  render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
  await waitFor(() => expect(WsGia.ds.length).toBe(1))
  const ws = WsGia.ds[0]!
  const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
  await screen.findByLabelText('Gửi đáp án')
  await cho(0)
  return { ws, st }
}

describe('viewEm.em.dangRoi', () => {
  it('phòng ghi em đang rời ⇒ dangRoi true; em về ⇒ false', () => {
    const st = phong(); moLuot(st, cau, T0)
    expect(viewEm(st, 'S1').em?.dangRoi).toBe(false)
    roiMan(st, 'S1', T0 + 1000)
    expect(viewEm(st, 'S1').em?.dangRoi).toBe(true)
    veMan(st, 'S1', T0 + 2000)
    expect(viewEm(st, 'S1').em?.dangRoi).toBe(false)
  })
})

describe('về lại có xác nhận', () => {
  it('trang hiện lại mà CHƯA có tiêu điểm ⇒ chưa gửi; có tiêu điểm sau đó (không có sự kiện focus) ⇒ tự gửi `ve` trong ~0,5 s', async () => {
    const { ws } = await vao()
    an_(true)
    expect(coTin(ws, 'roi')).toBe(1)
    an_(false, false) // hiện lại nhưng hasFocus() còn false
    expect(coTin(ws, 've')).toBe(0)
    co = true // trình duyệt trả tiêu điểm muộn, không bắn sự kiện
    await cho(650)
    expect(coTin(ws, 've')).toBe(1)
  })

  it('không có tiêu điểm nhưng em CHẠM vào màn ⇒ gửi `ve` ngay', async () => {
    const { ws } = await vao()
    an_(true); an_(false, false)
    expect(coTin(ws, 've')).toBe(0)
    act(() => { fireEvent.pointerDown(document.body) })
    expect(coTin(ws, 've')).toBe(1)
  })

  it('đã gửi `ve` nhưng phòng VẪN ghi dangRoi (tin mất) ⇒ gửi lại `ve`; phòng xác nhận ⇒ thôi', async () => {
    const { ws, st } = await vao()
    an_(true); roiMan(st, 'S1', T0 + 1000)
    an_(false)
    expect(coTin(ws, 've')).toBe(1)
    await cho(1100)
    ws.nhan(viewEm(st, 'S1')) // phòng chưa nhận `ve`: dangRoi còn true
    await cho(50)
    expect(coTin(ws, 've')).toBe(2)
    veMan(st, 'S1', T0 + 3000); ws.nhan(viewEm(st, 'S1'))
    const n = coTin(ws, 've')
    await cho(1300)
    expect(coTin(ws, 've')).toBe(n) // đã xác nhận ⇒ không gửi nữa, không nối lại
    expect(WsGia.ds.length).toBe(1)
  })

  it('gửi `ve` mà phòng IM quá 2,5 s (kết nối chết) ⇒ bỏ kết nối cũ, nối lại (phòng tự gỡ «đang rời» khi em chào lại)', async () => {
    const { ws } = await vao()
    an_(true); an_(false)
    expect(coTin(ws, 've')).toBe(1)
    await cho(3300)
    expect(ws.dong).toBe(true)
    await waitFor(() => expect(WsGia.ds.length).toBe(2))
    await waitFor(() => expect(coTin(WsGia.ds[1]!, 'chao')).toBe(1))
  }, 12000)

  it('trang còn ẩn / cửa sổ nổi giữ tiêu điểm ⇒ KHÔNG gửi `ve` dù phòng ghi dangRoi', async () => {
    const { ws, st } = await vao()
    an_(true); roiMan(st, 'S1', T0 + 1000)
    ws.nhan(viewEm(st, 'S1'))
    await cho(700)
    expect(coTin(ws, 've')).toBe(0)
    an_(false, false) // hiện nhưng cửa sổ nổi đang giữ tiêu điểm
    ws.nhan(viewEm(st, 'S1'))
    await cho(700)
    expect(coTin(ws, 've')).toBe(0)
  })
})
