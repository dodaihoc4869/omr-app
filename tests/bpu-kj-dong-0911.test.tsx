// Bình Phản Ứng — kJ ĐỘNG trên máy em (thầy 09/11 «app hs cũng được cộng trừ kJ hiệu ứng siêu đẹp mắt và hiển thị tinh tế ở mọi chỗ»):
// số kJ đếm mượt tới số mới (tăng xanh / giảm đỏ, máy yếu đổi tức thì) + thẻ biến động bay lên khi `bienDongEm` có id mới.
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moLuot, roiMan, taoPhong, viewEm, type BienDong } from '../src/lib/bpu/phong'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

let hang: FrameRequestCallback[] = []
const khung = (t: number) => { const c = hang; hang = []; act(() => { for (const f of c) f(t) }) }
beforeEach(() => {
  hang = []
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { hang.push(f); return hang.length })
  vi.stubGlobal('cancelAnimationFrame', () => { hang = [] })
})
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); document.documentElement.classList.remove('may-yeu') })

describe('SoKj — số kJ đếm mượt', () => {
  it('tăng: đếm dần (chậm dần cuối) + chữ xanh trong lúc đếm, xong thì về màu thường', async () => {
    const { SoKj, DEM_KJ_MS } = await import('../src/components/bpu/ManBinhPhanUng')
    const r = render(<SoKj v={100} />)
    const b = r.container.querySelector('.bpu-so')!
    expect(b.textContent).toBe('100')
    r.rerender(<SoKj v={150} />)
    expect(b.getAttribute('data-huong')).toBe('tang')
    khung(0); expect(b.textContent).toBe('100')
    khung(DEM_KJ_MS / 2); expect(b.textContent).toBe('144') // 100 + 50 × (1 − 0,5³)
    khung(DEM_KJ_MS); expect(b.textContent).toBe('150')
    expect(b.getAttribute('data-huong')).toBeNull()
  })
  it('giảm: chữ đỏ (data-huong="giam"), về đúng số mới; đổi giữa chừng ⇒ đếm tiếp từ số đang hiện', async () => {
    const { SoKj, DEM_KJ_MS } = await import('../src/components/bpu/ManBinhPhanUng')
    const r = render(<SoKj v={1200} />)
    const b = r.container.querySelector('.bpu-so')!
    expect(b.textContent).toBe('1.200')
    r.rerender(<SoKj v={1100} />)
    expect(b.getAttribute('data-huong')).toBe('giam')
    khung(0); khung(DEM_KJ_MS / 2)
    const giua = Number(b.textContent!.replace('.', ''))
    expect(giua).toBeLessThan(1200); expect(giua).toBeGreaterThan(1100)
    r.rerender(<SoKj v={1300} />)
    expect(b.getAttribute('data-huong')).toBe('tang')
    khung(1000); expect(b.textContent).toBe(giua.toLocaleString('vi-VN'))
    khung(1000 + DEM_KJ_MS); expect(b.textContent).toBe('1.300')
  })
  it('máy yếu ⇒ đổi số TỨC THÌ, không màu, không khung hình', async () => {
    const { SoKj } = await import('../src/components/bpu/ManBinhPhanUng')
    document.documentElement.classList.add('may-yeu')
    const r = render(<SoKj v={10} />)
    r.rerender(<SoKj v={60} />)
    const b = r.container.querySelector('.bpu-so')!
    expect(b.textContent).toBe('60')
    expect(b.getAttribute('data-huong')).toBeNull()
    expect(hang).toHaveLength(0)
  })
})

describe('TheBienDong — thẻ biến động bay lên', () => {
  const bd = (id: number, kjEm: number, kjDoi: number, lyDo: string): BienDong => ({ id, sbd: 'S1', doi: 0, kjEm, kjDoi, lyDo, luc: 0 })
  it('lần đầu không phát lại chuyện cũ; id mới ⇒ thẻ xanh / đỏ đúng chữ; ~2,5 s thì gỡ', async () => {
    vi.useFakeTimers()
    const { TheBienDong, THE_BD_MS } = await import('../src/components/bpu/ManBinhPhanUng')
    const cu = [bd(1, 10, 0, 'Cũ')]
    const r = render(<TheBienDong ds={cu} />)
    expect(r.container.querySelector('.bpu-bd-the')).toBeNull()
    r.rerender(<TheBienDong ds={[...cu, bd(2, 149, 0, 'Đúng · nhanh thứ 2')]} />)
    const the = r.container.querySelector('.bpu-bd-the')!
    expect(the.getAttribute('data-kq')).toBe('dung')
    expect(the.textContent).toBe('+149 kJĐúng · nhanh thứ 2')
    expect(the.querySelector('.bpu-lua')).toBeTruthy()
    r.rerender(<TheBienDong ds={[...cu, bd(2, 149, 0, 'Đúng · nhanh thứ 2'), bd(3, 0, -50, 'Rời màn hình')]} />)
    const ds = r.container.querySelectorAll('.bpu-bd-the')
    expect(ds).toHaveLength(2)
    expect(ds[1]!.getAttribute('data-kq')).toBe('sai')
    expect(ds[1]!.textContent).toBe('Đội −50 kJRời màn hình')
    act(() => { vi.advanceTimersByTime(THE_BD_MS) })
    expect(r.container.querySelectorAll('.bpu-bd-the')).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(THE_BD_MS) })
    expect(r.container.querySelector('.bpu-bd-the')).toBeNull()
  })
  it('em −100 cùng đội −100 ⇒ hiện cả hai', async () => {
    const { TheBienDong } = await import('../src/components/bpu/ManBinhPhanUng')
    const r = render(<TheBienDong ds={[]} />)
    r.rerender(<TheBienDong ds={[bd(5, -100, -100, 'Đúng trên máy, chưa giải được trên bảng')]} />)
    expect(r.container.querySelector('.bpu-bd-the')!.textContent).toBe('−100 kJĐúng trên máy, chưa giải được trên bảng · đội −100 kJ')
  })
})

describe('máy em: rời màn ⇒ kJ đội đếm xuống + thẻ «Rời màn hình»', () => {
  class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
    constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
    send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }
  it('đầu màn kJ đội giảm (đỏ) + thẻ đỏ', async () => {
    WsGia.ds = []
    vi.stubGlobal('WebSocket', WsGia)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' }))))
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!, T0 = Date.now()
    const st = taoPhong({ buoiId: 'b1', lop: 'L', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
    moLuot(st, { qid: 'q', phan: 'I', tuLuan: false, cau: { qid: 'q', text: 'Câu', choices: ['a', 'b', 'c', 'd'] }, dung: 'B', hanGiay: 60 }, T0)
    ws.nhan(viewEm(st, 'S1'))
    const so = await waitFor(() => { const b = document.querySelector('.bpu-hs-kj .bpu-so'); expect(b).toBeTruthy(); return b! })
    const truoc = viewEm(st, 'S1').doi.kj
    expect(so.textContent).toBe(String(truoc))
    roiMan(st, 'S1', T0 + 1000); ws.nhan(viewEm(st, 'S1'))
    expect(so.getAttribute('data-huong')).toBe('giam')
    khung(0); khung(2000)
    expect(so.textContent).toBe(String(truoc - 50))
    expect(screen.getByText('Rời màn hình').closest('.bpu-bd-the')!.getAttribute('data-kq')).toBe('sai')
  })
})
