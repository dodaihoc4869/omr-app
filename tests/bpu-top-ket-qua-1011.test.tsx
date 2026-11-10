// Bình Phản Ứng — thầy báo 10/11 (lần 2):
// (1) «vẫn bị load vào màn hình cũ mới vào đến top»: bấm câu ⇒ màn đua NGAY (lượt chờ, cho-luot.ts) dù lượt mới về chậm; không lúc nào lộ đề / điểm danh;
// (2) chấm Đạt / Chưa đạt trên tờ ⇒ thẻ kết quả ~3 giây trên bảng (số thật từ `bienDong`) rồi về màn đua; phím ⇒ chuyển ngay;
// (3) máy em: cả lớp thấy kết quả lên bảng (kJ đội chỉ sau khi mở đáp án).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chamLenBang, duDoan, goiLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewBang, viewEm } from '../src/lib/bpu/phong'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const goiLenhGhi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async (...a: unknown[]) => { goiLenhGhi(...a); return { ok: true, du: { ok: true, ve: 've-thay' } } } }))
vi.mock('../src/lib/ung-vien-chieu', () => ({ layEmChieu: async () => new Map() }))
// Bảng chọn câu giả: một nút «Chiếu q2» gọi đúng `onChieu` bảng truyền xuống (như bấm một câu trong danh sách).
vi.mock('../src/components/bpu/ChonCauBpu', () => ({ default: (p: { onChieu: (ds: unknown[]) => Promise<string> }) => <div className="bcc"><button type="button" onClick={() => void p.onChieu([{ khoa: 'q2', qid: 'q2', phan: 'I', tuLuan: false, maDe: 'm', tenDe: 'Bài', q: { text: 'Đề q2', choices: ['a', 'b', 'c', 'd'] } }])}>Chiếu q2</button></div> }))

class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const chamSo = (a: string, b: string) => a === b
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Đỗ Đại Học', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }, { sbd: 'S3', ten: 'Lê Ngọc Anh', coMat: true, luc: T0 }] })
const cau = (qid: string) => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, maDe: 'm', phan: 'I', text: `Đề ${qid} trên giấy`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 })
const q = (s: string) => document.querySelector(s)
const cho = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

beforeEach(() => { WsGia.ds = []; goiLenhGhi.mockReset(); vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' })))) })
afterEach(() => { vi.unstubAllGlobals(); document.documentElement.classList.remove('may-yeu') })

describe('chọn câu ⇒ màn đua ngay, lượt về chậm vẫn không lộ màn cũ', () => {
  it('phòng còn lượt cũ đang «làm bảng» (tải lại trang): bấm câu ⇒ tháp lửa ngay, không đề / điểm danh suốt lúc chờ; lượt về ⇒ cập nhật', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const st = phong()
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
    const onChieuCau = vi.fn(async () => '')
    const p = { buoiId: 'b1', ma: '123456', onDong: () => {}, onChieuCau, lenBangTo: () => true }
    const { rerender } = render(<Bang {...p} diemDanh />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    ws.nhan(viewBang(st))
    expect(q('.bb-dd')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Enter' }) // Xong điểm danh ⇒ «Hôm nay làm gì?»
    fireEvent.click(await screen.findByRole('button', { name: 'Chiếu q2' }))
    // Ngay nhịp bấm: bảng chọn đóng, màn đua của lượt chờ (số cũ giữ, chưa em nào gửi), không đề trên giấy, không điểm danh.
    expect(q('.bcc')).toBeNull()
    expect(q('.bb-tl')).toBeTruthy()
    expect(q('.bb-de')).toBeNull()
    expect(q('.bb-dd')).toBeNull()
    expect(document.body.textContent).toMatch(/0\/3 em đã gửi/)
    expect(document.body.textContent).not.toMatch(/Đề q1 trên giấy/)
    expect(onChieuCau).toHaveBeenCalledTimes(1)
    // Tờ dựng xong ⇒ gan-gv đổi props (hết cờ điểm danh, có câu) mà lượt CHƯA về (trễ phòng): vẫn màn đua.
    rerender(<Bang {...p} qid="q2" luot={1} tuDong />)
    await cho(30)
    expect(goiLenhGhi.mock.calls.some((c) => c[0] === '/gv/bpu/luot' && (c[1] as { qid: string }).qid === 'q2')).toBe(true)
    expect(q('.bb-tl')).toBeTruthy()
    expect(q('.bb-de')).toBeNull()
    expect(q('.bb-dd')).toBeNull()
    // Lượt thật về (trễ) ⇒ thay lượt chờ, vẫn màn đua; em gửi ⇒ «1/3».
    moDapAn(st, T0 + 1, chamSo); moLuot(st, cau('q2'), T0 + 2); ws.nhan(viewBang(st))
    expect(q('.bb-tl')).toBeTruthy()
    expect(q('.bb-pill')?.textContent).toBe('Lượt 2')
    nhanTra(st, 'S2', 'B', T0 + 3); ws.nhan(viewBang(st))
    expect(document.body.textContent).toMatch(/1\/3 em đã gửi/)
  })
  it('tờ không dựng được ⇒ thôi chờ, báo lỗi, mở lại bảng chọn câu', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    render(<Bang buoiId="b1" ma="123456" diemDanh onDong={() => {}} onChieuCau={async () => 'Chưa dựng được tờ chiếu.'} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    WsGia.ds[0]!.nhan(viewBang(phong()))
    fireEvent.keyDown(window, { key: 'Enter' })
    await act(async () => { fireEvent.click(await screen.findByRole('button', { name: 'Chiếu q2' })) })
    await cho(10)
    expect(document.body.textContent).toMatch(/Chưa dựng được tờ chiếu/)
    expect(q('.bcc')).toBeTruthy()
  })
})

describe('thẻ kết quả lên bảng trên bảng chiếu', () => {
  async function dung() {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const kq = await import('../src/components/bpu/TheKetQuaLenBang')
    const st = phong()
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); nhanTra(st, 'S2', 'A', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
    render(<Bang buoiId="b1" qid="q1" luot={1} tuDong onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    ws.nhan(viewBang(st))
    return { st, ws, kq }
  }
  it('Đạt: tên + «Đạt» ngay; số thật về ⇒ em +100, đội +200; ~3 giây rồi tự về màn đua', async () => {
    const { st, ws, kq } = await dung()
    act(() => kq.hienKetQua(true))
    expect(q('.bkq')?.textContent).toMatch(/Đỗ Đại Học/)
    expect(q('.bkq-kq')?.textContent).toBe('Đạt')
    expect(q('.bkq-so')?.getAttribute('aria-busy')).toBe('true') // phòng chưa trả số
    chamLenBang(st, true, T0 + 1); moDapAn(st, T0 + 2, chamSo); ws.nhan(viewBang(st))
    expect(q('.bkq-so')?.textContent).toMatch(/\+100 kJ/)
    expect(q('.bkq-so')?.textContent).toMatch(/\+200 kJ/)
    await cho(kq.KQ_HIEN_MS - 600)
    expect(q('.bkq')).toBeTruthy()
    await cho(1100)
    expect(q('.bkq')).toBeNull()
    expect(q('.bb-tl')).toBeTruthy()
  }, 10_000)
  it('Chưa đạt mà máy em đã đúng ⇒ em −100, đội −100; phím bất kì ⇒ chuyển ngay', async () => {
    const { st, ws, kq } = await dung()
    document.documentElement.classList.add('may-yeu')
    act(() => kq.hienKetQua(false))
    chamLenBang(st, false, T0 + 1); moDapAn(st, T0 + 2, chamSo); ws.nhan(viewBang(st))
    expect(q('.bkq-kq')?.textContent).toBe('Chưa đạt')
    expect(q('.bkq-so')?.textContent).toMatch(/−100 kJ.*−100 kJ/)
    let nuot = false
    await act(async () => { nuot = kq.tatTheKq(); await new Promise((r) => setTimeout(r, 10)) })
    expect(nuot).toBe(true)
    expect(q('.bkq')).toBeNull()
    expect(kq.tatTheKq()).toBe(false) // hết thẻ ⇒ phím đi tiếp như thường (Esc ra Hôm nay)
  })
  it('Chưa đạt mà máy em sai / không gửi ⇒ 0 kJ, lời cảm ơn (không trừ)', async () => {
    const { st, ws, kq } = await dung()
    act(() => kq.hienKetQua(false))
    st.luot!.goi!.sbd = 'S3' // em được gọi không gửi trên máy
    chamLenBang(st, false, T0 + 1); moDapAn(st, T0 + 2, chamSo); ws.nhan(viewBang(st))
    expect(q('.bkq-so')?.textContent).toMatch(/^Em0 kJ/)
    expect(q('.bkq-phu')?.textContent).toMatch(/Cảm ơn/)
  })
  it('gan-gv: chấm trên tờ ⇒ hiện thẻ; phím trong lúc thẻ hiện bị nuốt (không ra Hôm nay)', async () => {
    const src = (await import('node:fs')).readFileSync('src/components/bpu/gan-gv.tsx', 'utf8')
    expect(src).toMatch(/hienKetQua\(dat\)\s*\n\s*hienBang\(\)/)
    expect(src).toMatch(/if \(tatTheKq\(\) \|\| \(e\.key === 'Escape' && escRaHomNay\(\)\)\)/)
  })
})

describe('máy em: kết quả lên bảng cho cả lớp', () => {
  // SỬA CÓ CHỦ ĐÍCH 10/11 (thầy «gọn hơn, bỏ em đạt, chỉ ghi đạt / không đạt nổi bật»): bạn cùng lớp thấy «Tên gọi · Đạt» (không còn dòng kJ đội);
  // em được gọi thấy nhãn «Đạt» (không «Em ·»).
  it('bạn được gọi Đạt ⇒ «Đại Học · Đạt» (sau khi mở đáp án); em được gọi thấy nhãn «Đạt»; vẫn giữ lớp che', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong()
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); nhanTra(st, 'S2', 'B', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
    ws.nhan(viewEm(st, 'S2'))
    expect(q('.bpu-klb')).toBeNull()
    chamLenBang(st, true, T0 + 1); ws.nhan(viewEm(st, 'S2'))
    expect(q('.bpu-klb')).toBeNull() // chưa mở đáp án ⇒ máy em chưa hiện (hiện cùng lúc với số kJ đội)
    expect(duDoan(st, 'S2', 1, T0 + 1)).toBe(false) // đã chấm ⇒ hết đoán (bảng đang hiện kết quả)
    moDapAn(st, T0 + 2, chamSo); ws.nhan(viewEm(st, 'S2'))
    expect(q('.bpu-klb > span')?.textContent).toBe('Đại Học · Đạt') // SỬA CÓ CHỦ ĐÍCH 10/11: tên gọi hai chữ
    expect(q('.bpu-klb')?.getAttribute('aria-label')).toMatch(/Đỗ Đại Học \(Đội Natri\) lên bảng: Đạt/)
    expect(q('.bpu-che')).toBeTruthy()
    ws.nhan(viewEm(st, 'S1'))
    expect(q('.bpu-klb b')?.textContent).toBe('Đạt')
    expect(q('.bpu-klb')?.textContent).not.toMatch(/Em ·/)
  })
  it('viewEm: kJ đội lên bảng chỉ có sau khi mở đáp án; Chưa đạt ⇒ dải tế nhị, không nêu số trừ', () => {
    const st = phong()
    moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); goiLenBang(st, 'S1', ['x'], T0); chamLenBang(st, false, T0)
    const g0 = viewEm(st, 'S2').luot!.goi as { dat: boolean | null; kjDoi?: number }
    expect(g0.dat).toBe(false)
    expect(g0.kjDoi).toBeUndefined()
    expect('dung' in viewEm(st, 'S2').luot!).toBe(false) // không đáp án trước khi mở
    moDapAn(st, T0 + 1, chamSo)
    expect((viewEm(st, 'S2').luot!.goi as { kjDoi?: number }).kjDoi).toBe(-100)
  })
  it('máy em hiện nhãn «Học · Chưa đạt» — không nêu số trừ (SỬA CÓ CHỦ ĐÍCH 10/11: bỏ dòng «Cảm ơn bạn đã lên bảng»)', async () => {
    const { default: K } = await import('../src/components/bpu/KetQuaLenBangEm')
    render(<K g={{ sbd: 'S1', ten: 'Đỗ Đại Học', doi: 0, lyDo: [], emDoan: null, emTiep: 0, tiep: 0, dat: false, kjDoi: -100 }} laEm={false} />)
    expect(document.body.textContent).toMatch(/Học · Chưa đạt/)
    expect(document.body.textContent).not.toMatch(/−100/)
  })
})

describe('SỬA CÓ CHỦ ĐÍCH 10/11 — «Kết thúc buổi» bấm MỘT lần là kết thúc (thầy «nút bấm kết thúc bấm 1 lần là kết thúc luôn nhé»)', () => {
  it('«Hôm nay làm gì?» trên bảng: một lần bấm ⇒ gọi kết thúc ngay, không còn «Bấm lần nữa»', async () => {
    const { default: ChonCauBpu } = await vi.importActual<typeof import('../src/components/bpu/ChonCauBpu')>('../src/components/bpu/ChonCauBpu')
    const onKetThuc = vi.fn(async () => '')
    render(<ChonCauBpu buoiId="b1" lop="12A1" buocDau="hd" onChieu={async () => ''} onDong={() => {}} onHoatDong={() => {}} onKetThuc={onKetThuc} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Kết thúc buổi học/ })) })
    expect(onKetThuc).toHaveBeenCalledTimes(1)
    expect(document.body.textContent).not.toMatch(/Bấm lần nữa/)
  })
  it('nút «Kết thúc buổi» cạnh Điểm danh: một lần bấm ⇒ đóng buổi', async () => {
    const ketThucBuoiHoc = vi.fn(async () => '')
    vi.doMock('../src/components/bpu/gan-gv', () => ({ ketThucBuoiHoc }))
    const { default: Nut } = await import('../src/components/hom-nay-thay/NutDiemDanh')
    render(<Nut className="n" />)
    act(() => { window.dispatchEvent(new CustomEvent('bpu-phien', { detail: { buoiId: 'b1', tamAn: true } })) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Kết thúc buổi/ })) })
    await waitFor(() => expect(ketThucBuoiHoc).toHaveBeenCalledWith('b1'))
    expect(document.body.textContent).not.toMatch(/Bấm lần nữa/)
    vi.doUnmock('../src/components/bpu/gan-gv')
  })
})
