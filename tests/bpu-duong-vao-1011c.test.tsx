// Bình Phản Ứng — thầy báo 10/11 LẦN 3 «Vẫn chưa load hẳn vào đua top» · «hiệu ứng nộp bài trên bảng chưa đẹp».
// Chặn tái phát TỪNG ĐƯỜNG vào lượt mới (phòng trễ giả: lệnh / tin phòng về chậm, tờ báo câu chậm), mỗi đường: từ lúc bấm tới lúc lượt mới chạy chỉ thấy
// màn đua (hoặc thẻ kết quả), không điểm danh / đề trên giấy / mời lên bảng / «Đang mở…» / bảng chọn đứng chờ / tờ chiếu cũ.
//   a/h · Hôm nay → Điểm danh → Xong → Dạy học → chọn câu (lượt đầu, tờ dựng lần đầu); thầy còn buổi KHÁC mở ⇒ không dựng lại bảng cho buổi kia
//   b/f · «Câu tiếp» sau thẻ kết quả / sau mở đáp án      c · C → chọn câu khác      d · Esc ra Hôm nay → Điểm danh
//   e   · tải lại trang (phòng còn lượt cùng câu: làm bảng / đã mở đáp án)         g · L → tờ cũ → Đạt → về (tờ không lẫn dưới bảng)
// + hiệu ứng em nộp bài (nop-bai.ts): chỉ em VỪA gửi, theo view thật, máy yếu ⇒ bản gọn.
import type { ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewBang } from '../src/lib/bpu/phong'

const q = (s: string) => document.querySelector(s)
const cho = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))
const T0 = Date.now()
const chamSo = (a: string, b: string) => a === b

// ── Gốc bảng (gan-gv) với bảng giả: buổi, che tờ, phóng lại, hết câu. ──
const buoi = vi.hoisted(() => ({ goi: 0, ds: [] as string[], tre: 0 }))
const setScreen = vi.hoisted(() => vi.fn())
const cheLucDung = vi.hoisted(() => [] as boolean[])
vi.mock('../src/lib/buoi-hoc-api', () => ({ buoiDangMo: async () => { buoi.goi++; await new Promise((r) => setTimeout(r, buoi.tre)); return { ok: true, du: buoi.ds.map((id) => ({ id, moLuc: new Date().toISOString() })) } } }))
vi.mock('../src/store/appStore', () => ({ useAppStore: { getState: () => ({ showToast: vi.fn(), setScreen }) } }))
vi.mock('../src/lib/bpu/to-chieu-bpu', () => ({ dungToChieuBpu: async () => '<p>tờ</p>', napKhoDayHoc: async () => [], baiDaChonCuaBuoi: () => ({ maChon: [], boCau: [] }) }))
// Khung tờ giả: ghi lại tờ có bị che NGAY lúc gắn vào trang không (khung đầu tiên).
vi.mock('../src/components/KhungXemPhieu', () => ({ default: (p: { ten?: string }) => { cheLucDung.push(document.documentElement.hasAttribute('data-bpu-che-to')); return createPortal(<div className="lop-xem-phieu" aria-label={p.ten} />, document.body) } }))
const bangGia = vi.hoisted(() => ({ that: false }))
vi.mock('../src/components/bpu/BangBinhPhanUng', async (goc) => {
  const That = ((await goc()) as { default: ComponentType<{ buoiId: string }> }).default
  return { default: (p: { buoiId: string; qid?: string; bo?: boolean }) => (bangGia.that ? <That {...p} /> : <div className="bpu-bang" tabIndex={-1} data-bang={p.buoiId} data-qid={p.qid ?? ''} data-bo={String(!!p.bo)} />) }
})

// ── Bảng thật: phòng giả nối bằng WebSocket giả, lệnh thầy trễ. ──
const goiLenhGhi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async (...a: unknown[]) => { goiLenhGhi(...a); await new Promise((r) => setTimeout(r, 30)); return { ok: true, du: { ok: true, ve: 've-thay' } } } }))
vi.mock('../src/lib/ung-vien-chieu', () => ({ layEmChieu: async () => new Map() }))
vi.mock('../src/components/bpu/ChonCauBpu', () => ({ default: (p: { onChieu: (ds: unknown[]) => Promise<string> }) => <div className="bcc">{['q1', 'q2'].map((k) => <button key={k} type="button" onClick={() => void p.onChieu([{ khoa: k, qid: k, phan: 'I', tuLuan: false, maDe: 'm', tenDe: 'Bài', q: { text: `Đề ${k}`, choices: ['a', 'b', 'c', 'd'] } }])}>Chiếu {k}</button>)}</div> }))
class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: ['Đỗ Đại Học', 'Trần Gia Bảo', 'Lê Ngọc Anh', 'Phạm Bảo Châu'].map((ten, i) => ({ sbd: `S${i + 1}`, ten, coMat: true, luc: T0 })) })
const cau = (qid: string) => ({ qid, phan: 'I' as const, tuLuan: false, cau: { qid, maDe: 'm', phan: 'I', text: `Đề ${qid} trên giấy`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 })
/** Không lộ màn cũ: màn đua có mặt; không điểm danh / đề trên giấy / mời lên bảng / «Đang mở» / bảng chọn. */
function chiMauDua() {
  expect(q('.bb-tl')).toBeTruthy()
  for (const s of ['.bb-dd', '.bb-de', '.bb-goi', '.bb-lb', '.bb-cho', '.bcc', '.bb-den']) expect(q(s), s).toBeNull()
  expect(q('.bpu-bang')?.classList.contains('viet-bang')).toBe(false) // nửa phải không bị tắt đen («vùng em viết») khi đang là màn đua
  expect(document.body.textContent).not.toMatch(/trên giấy|Đang mở Bình Phản Ứng|Mời em lên bảng/)
}
const pill = () => q('.bb-tren .bb-pill')?.textContent

beforeEach(() => { WsGia.ds = []; goiLenhGhi.mockReset(); bangGia.that = false; buoi.goi = 0; buoi.ds = ['b1']; buoi.tre = 0; cheLucDung.length = 0
  vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response('{}'))) })
afterEach(async () => { cleanup(); const m = await import('../src/components/bpu/gan-gv'); m.dongBang(); document.body.innerHTML = ''; document.documentElement.className = ''; vi.unstubAllGlobals() })

describe('gốc bảng (gan-gv): đúng buổi, che tờ từ khung đầu', () => {
  const cauDh = (qid: string) => ({ khoa: qid, qid, phan: 'I', maDe: 'm', tenDe: 'Bài', chuyenDe: '', maDang: null, tenDang: null, mucDo: '', tuLuan: false, q: {} }) as never
  const nguon = { postMessage: () => {}, focus: () => {} } as unknown as Window
  async function moPhien() {
    vi.resetModules()
    const m = await import('../src/components/bpu/gan-gv'); m.datChoTuDong(0)
    await act(async () => { m.moBangDiemDanh({ buoiId: 'b1', ma: '123456' }) })
    return m
  }
  it('a/h: thầy còn buổi KHÁC mở (đứng đầu danh sách, máy chủ trả chậm) ⇒ tờ báo câu: bảng giữ ĐÚNG buổi, không hỏi lại máy chủ, không dựng lại bảng', async () => {
    buoi.ds = ['b0', 'b1']; buoi.tre = 400
    const m = await moPhien()
    const truoc = q('[data-bang]')
    await act(async () => { expect(await m.chieuCau([cauDh('q1'), cauDh('q2')])).toBe('') })
    await act(async () => { await m.moBangTuToChieu('q1', { tuDong: true, nguon }) })
    await cho(20)
    expect(q('[data-bang]')?.getAttribute('data-bang')).toBe('b1')
    expect(q('[data-bang]')).toBe(truoc) // cùng một bảng (không dựng lại «Đang mở…»)
    expect(q('[data-qid]')?.getAttribute('data-qid')).toBe('q1')
    expect(buoi.goi).toBe(0)
    // b/f: → «Câu tiếp» ⇒ tờ báo câu kế ⇒ vẫn đúng buổi, gửi ngay.
    m.toiCau(1)
    await act(async () => { await m.moBangTuToChieu('q2', { tuDong: true }) })
    await cho(10)
    expect(q('[data-qid]')?.getAttribute('data-qid')).toBe('q2')
    expect(buoi.goi).toBe(0)
  })
  it('h: tờ dựng lần đầu dưới bảng ⇒ đã bị che NGAY khung đầu (dù cờ che chưa bật trước đó)', async () => {
    const m = await moPhien()
    document.documentElement.removeAttribute('data-bpu-che-to') // giả lập nhịp cờ chưa kịp bật
    await act(async () => { await m.chieuCau([cauDh('q1')]) })
    expect(cheLucDung).toEqual([true])
  })
  it('g: chấm Đạt trên tờ ⇒ tờ che lại NGAY (không chờ bảng phóng xong), bảng kín màn (không mờ dần trên tờ)', async () => {
    const m = await moPhien()
    await act(async () => { await m.chieuCau([cauDh('q1')]) })
    await act(async () => { await m.moBangTuToChieu('q1', { tuDong: true, nguon }) })
    expect(m.lenBangTo({ sbd: 'S1', ten: 'Đỗ Đại Học', goiNgay: false })).toBe(true)
    await cho(20)
    expect(document.documentElement.hasAttribute('data-bpu-che-to')).toBe(false) // em lên bảng: tờ lộ (đúng ý)
    act(() => m.chamTuTo(true))
    expect(document.documentElement.hasAttribute('data-bpu-che-to')).toBe(true)
    const css = (await import('node:fs')).readFileSync('src/components/bpu/bpu-bang.css', 'utf8')
    expect(css).toMatch(/@keyframes bpu-no \{ from \{ transform: scale\(1\.04\); \} to \{ transform: none; \} \}/) // không có opacity
  })
  it('b/f: tờ hết câu ⇒ báo bảng thôi chờ câu kế', async () => {
    const m = await moPhien()
    const nghe = vi.fn(); window.addEventListener('bpu-het-cau', nghe)
    m.baoHetCau(1)
    window.removeEventListener('bpu-het-cau', nghe)
    expect(nghe).toHaveBeenCalledTimes(1)
  })
  it('e: chọn lại câu mà lượt của nó đã mở đáp án (bảng báo `moi`) ⇒ lượt mới (cờ bỏ lượt dở), không nối lại màn mở đáp án cũ', async () => {
    const m = await moPhien()
    await act(async () => { await m.chieuCau([cauDh('q1')], true) })
    await act(async () => { await m.moBangTuToChieu('q1', { tuDong: true, nguon }) })
    await cho(10)
    expect(q('[data-bo]')?.getAttribute('data-bo')).toBe('true')
  })
  it('d: Esc ra Hôm nay giữa lượt → Điểm danh ⇒ bảng hiện lại đúng chỗ, tờ vẫn che, cùng khung bảng', async () => {
    const m = await moPhien()
    await act(async () => { await m.chieuCau([cauDh('q1')]) })
    await act(async () => { await m.moBangTuToChieu('q1', { tuDong: true, nguon }) })
    const truoc = q('[data-bang]')
    expect(m.escRaHomNay()).toBe(true)
    await act(async () => { m.moBangDiemDanh({ buoiId: m.phienDangCo()!.buoiId }) })
    expect(q('[data-bang]')).toBe(truoc)
    expect((q('[data-bpu-bang]') as HTMLElement).style.visibility).toBe('')
    expect(document.documentElement.hasAttribute('data-bpu-che-to')).toBe(true)
    expect(q('[data-qid]')?.getAttribute('data-qid')).toBe('q1')
  })
})

describe('bảng thật: mọi đường vào lượt mới ⇒ màn đua ngay, cảnh giữ nguyên khi lượt thật về', () => {
  async function bang(p: Record<string, unknown>) {
    bangGia.that = true
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const r = render(<Bang buoiId="b1" onDong={() => {}} {...p} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    return { ...r, Bang, ws: WsGia.ds[0]! }
  }
  it('b/f: «Câu tiếp» (→) ⇒ NGAY màn đua lượt kế «0/4»; tờ báo câu (props) rồi lượt thật về chậm ⇒ cùng cảnh, không dựng lại', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); nhanTra(st, 'S2', 'A', T0); moDapAn(st, T0 + 1, chamSo)
    const onToi = vi.fn()
    const p = { qid: 'q1', luot: 1, tuDong: true, onToi, lenBangTo: () => true }
    const { ws, rerender, Bang } = await bang(p)
    ws.nhan(viewBang(st))
    expect(pill()).toBe('Lượt 1')
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(onToi).toHaveBeenCalledWith(1)
    chiMauDua()
    expect(pill()).toBe('Lượt 2')
    expect(document.body.textContent).toMatch(/0\/4 em đã gửi/)
    const canh = q('.bb-canh')
    rerender(<Bang buoiId="b1" onDong={() => {}} {...p} qid="q2" luot={2} />)
    await cho(40)
    chiMauDua()
    expect(goiLenhGhi.mock.calls.some((c) => c[0] === '/gv/bpu/luot' && (c[1] as { qid: string }).qid === 'q2')).toBe(true)
    moLuot(st, cau('q2'), T0 + 5); ws.nhan(viewBang(st))
    chiMauDua()
    expect(pill()).toBe('Lượt 2')
    expect(q('.bb-canh')).toBe(canh) // lượt chờ → lượt thật: không dựng lại cảnh (không mờ dần lần hai)
  })
  it('b: tờ hết câu ⇒ thôi chờ, về lượt đang có', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); moDapAn(st, T0 + 1, chamSo)
    const { ws } = await bang({ qid: 'q1', luot: 1, tuDong: true, onToi: () => {} })
    ws.nhan(viewBang(st))
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(pill()).toBe('Lượt 2')
    act(() => { window.dispatchEvent(new CustomEvent('bpu-het-cau')) })
    expect(pill()).toBe('Lượt 1')
  })
  it('b→c: đang chờ lượt câu kế mà thầy bấm C ⇒ bảng chọn mở (phím chọn câu không bị nuốt); L / O thì không tác động lên lượt cũ', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); moDapAn(st, T0 + 1, chamSo)
    const { ws } = await bang({ qid: 'q1', luot: 1, tuDong: true, onToi: () => {}, onChieuCau: async () => '' })
    ws.nhan(viewBang(st))
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(pill()).toBe('Lượt 2')
    const truoc = WsGia.ds[0]!.gui.length
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' })) })
    expect(WsGia.ds[0]!.gui.length).toBe(truoc) // không «mở đáp án» lượt cũ
    fireEvent.keyDown(window, { key: 'c' })
    expect(await screen.findByRole('button', { name: 'Chiếu q2' })).toBeTruthy()
  })
  it('a/h: bảng dựng với câu TRƯỚC khi phòng nối (tờ mở ở màn khác) ⇒ màn đua ngay, không «Đang mở…»; phòng còn lượt cũ «gọi em» câu khác ⇒ vẫn chờ lượt mới', async () => {
    const st = phong(); moLuot(st, cau('q9'), T0); nhanTra(st, 'S1', 'B', T0); goiLenBang(st, 'S1', ['x'], T0)
    const { ws } = await bang({ qid: 'q1', luot: 1, tuDong: true, lenBangTo: () => true })
    chiMauDua()
    ws.nhan(viewBang(st))
    await cho(40)
    chiMauDua()
    moDapAn(st, T0 + 1, chamSo); moLuot(st, cau('q1'), T0 + 2); ws.nhan(viewBang(st))
    chiMauDua()
    expect(pill()).toBe('Lượt 2')
  })
  it('e: tải lại trang, phòng còn lượt CÙNG câu đang «làm bảng» ⇒ chọn câu: màn đua của lượt ấy ngay (nối lại, không bảng chọn đứng chờ, không đề trên giấy)', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
    const onChieuCau = vi.fn(async () => '')
    const p = { ma: '123456', onChieuCau, lenBangTo: () => false }
    const { ws, rerender, Bang } = await bang({ ...p, diemDanh: true })
    ws.nhan(viewBang(st))
    expect(q('.bb-dd')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.click(await screen.findByRole('button', { name: 'Chiếu q1' }))
    chiMauDua()
    expect(pill()).toBe('Lượt 1')
    expect(onChieuCau).toHaveBeenLastCalledWith(expect.any(Array), false)
    rerender(<Bang buoiId="b1" onDong={() => {}} {...p} qid="q1" luot={1} tuDong />)
    await cho(40)
    chiMauDua()
    expect(goiLenhGhi.mock.calls.some((c) => c[0] === '/gv/bpu/luot')).toBe(false) // nối lại: không mở lượt mới
  })
  it('e: tải lại trang, lượt cùng câu ĐÃ mở đáp án ⇒ chọn câu: lượt mới (báo `moi`), màn đua «Lượt 2» ngay', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); moDapAn(st, T0 + 1, chamSo)
    const onChieuCau = vi.fn(async () => '')
    const { ws } = await bang({ ma: '123456', onChieuCau, diemDanh: true })
    ws.nhan(viewBang(st))
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.click(await screen.findByRole('button', { name: 'Chiếu q1' }))
    chiMauDua()
    expect(pill()).toBe('Lượt 2')
    expect(document.body.textContent).toMatch(/0\/4 em đã gửi/)
    expect(onChieuCau).toHaveBeenLastCalledWith(expect.any(Array), true)
  })
  it('c: C → chọn câu khác giữa lượt ⇒ màn đua lượt mới ngay; lượt thật về ⇒ cùng cảnh', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0)
    const { ws, rerender, Bang } = await bang({ qid: 'q1', luot: 1, tuDong: true, onChieuCau: async () => '' })
    ws.nhan(viewBang(st))
    fireEvent.keyDown(window, { key: 'c' })
    fireEvent.click(await screen.findByRole('button', { name: 'Chiếu q2' }))
    chiMauDua()
    expect(pill()).toBe('Lượt 2')
    const canh = q('.bb-canh')
    rerender(<Bang buoiId="b1" onDong={() => {}} qid="q2" luot={2} tuDong bo onChieuCau={async () => ''} />)
    await cho(40)
    moLuot(st, cau('q2'), T0 + 5); ws.nhan(viewBang(st))
    chiMauDua()
    expect(q('.bb-canh')).toBe(canh)
  })
  it('g: em lên bảng ở tờ cũ (phòng «gọi / làm bảng») ⇒ bảng (ẩn sau tờ) vẫn là màn đua — phóng lại là thấy màn đua, không đề trên giấy', async () => {
    const st = phong(); moLuot(st, cau('q1'), T0); nhanTra(st, 'S1', 'B', T0); goiLenBang(st, 'S1', ['x'], T0); lamBang(st, T0)
    const { ws } = await bang({ qid: 'q1', luot: 1, tuDong: true, lenBangTo: () => true })
    ws.nhan(viewBang(st))
    chiMauDua()
  })
})

describe('hiệu ứng em nộp bài (nop-bai.ts)', () => {
  it('chỉ em VỪA gửi của cùng lượt đang làm; lượt mới / mở đáp án / em vắng ⇒ không', async () => {
    const { emVuaGui } = await import('../src/components/bpu/nop-bai')
    const st = phong(); moLuot(st, cau('q1'), T0)
    const v0 = viewBang(st); nhanTra(st, 'S2', 'B', T0); nhanTra(st, 'S3', 'A', T0)
    const v1 = viewBang(st)
    expect(emVuaGui(v0, v1).map((e) => e.sbd)).toEqual(['S2', 'S3'])
    expect(emVuaGui(v1, v1)).toEqual([])
    moDapAn(st, T0 + 1, chamSo)
    expect(emVuaGui(v1, viewBang(st))).toEqual([])
    moLuot(st, cau('q2'), T0 + 2); nhanTra(st, 'S1', 'B', T0 + 3)
    expect(emVuaGui(v1, viewBang(st))).toEqual([])
  })
  it('đường cong: bắt đầu ở ô tên, kết thúc ở mặt chất lỏng, mờ vào / mờ ra; vệt quay theo hướng bay', async () => {
    const { khungCong } = await import('../src/components/bpu/nop-bai')
    const k = khungCong({ x: 100, y: 900 }, { x: 200, y: 100 }, { x: 200, y: 600 }, 1, 1, true)
    expect(k[0]!.transform).toMatch(/^translate\(100\.0px, 900\.0px\) rotate/)
    expect(k[k.length - 1]!.transform).toMatch(/^translate\(200\.0px, 600\.0px\) rotate\(9\d\.\ddeg\)/) // rơi thẳng xuống
    expect(Number(k[0]!.opacity)).toBe(0)
    expect(Number(k[k.length - 1]!.opacity)).toBe(0)
    expect(Math.max(...k.map((x) => Number(x.opacity)))).toBe(1)
  })
  it('bảng: em gửi ⇒ ô tên sáng + tích nảy (lớp «vua nay»); không bay khi không có hoạt cảnh (máy yếu / jsdom)', async () => {
    bangGia.that = true
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    render(<Bang buoiId="b1" qid="q1" luot={1} tuDong onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!, st = phong(); moLuot(st, cau('q1'), T0)
    ws.nhan(viewBang(st))
    expect(q('.bb-tl-o.nay')).toBeNull() // dựng bảng / nối lại: không nảy cả loạt
    nhanTra(st, 'S2', 'B', T0 + 1); ws.nhan(viewBang(st))
    expect(q('.bb-tl-o[data-sbd="S2"]')?.classList.contains('nay')).toBe(true)
    expect(q('.bb-tl-o[data-sbd="S2"]')?.classList.contains('vua')).toBe(true)
    expect(q('.bb-tl-o[data-sbd="S1"]')?.classList.contains('nay')).toBe(false)
    expect(document.querySelectorAll('.bb-tl-tia').length).toBe(0)
  })
})
