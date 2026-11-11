// LIVE — SỬA KHẨN 11/11 trên MÁY EM (thầy test máy thật, 06:33): màn Bình Phản Ứng thật + lớp live thật, phòng = WebSocket giả phát `viewEm` theo luật phòng thật.
//   K1  «Khi chuyển câu, máy hs nhận câu nhưng khi bấm nộp thì không tự về màn live» ⇒ em bấm Gửi là về bảng live NGAY (không chờ phòng báo lại).
//   K2  «Bấm lên bảng là phải ép hết mọi hs vào live không chờ nộp xong» ⇒ cờ phòng `bang` ép cả em chưa gửi; máy em KHÔNG gửi hộ đáp án đang chọn dở.
//   K3  «Tạm dừng» ⇒ máy em hiện «Thầy tạm dừng live».
//   K4  tay nắm + khay ở MÉP TRÁI; ô tiếng nằm trong khay; không còn viên «Thầy đang live» nổi ở đáy màn.
//   K6  vào bảng sau khi gửi không có viên «Thầy đang live» chớp giữa màn.
//   B2  tin `roi` mang kiểu rời (`an` trên máy không phân biệt được khoá màn; `chia` khi chia đôi màn hình).
//   B3  bảng live không nuốt việc của lượt: dải đoán / tiếp sức gửi đúng lệnh `doan` / `tiep`.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { goiLenBang, moDapAn, moLuot, nhanTra, taoPhong, viewEm, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat, liveDat } from '../src/lib/bpu/phong-live'
import { _datLaiTatMan } from '../src/components/bpu/tat-man'
import { NOI_MS } from '../src/components/bpu/ManBinhPhanUng'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

class WsGia { static ds: WsGia[] = []; readyState = 1; binaryType = 'blob'; gui: (string | Uint8Array)[] = []; onopen?: () => void; onmessage?: (e: { data: unknown }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string | Uint8Array) { this.gui.push(d) } close() {}
  nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 0 }
const phong = (): TrangThaiPhong => {
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
  datCoLive(st, { cho: true, sfu: false }, T0)
  return st
}
const tin = (ws: WsGia, t: string) => ws.gui.filter((x): x is string => typeof x === 'string').map((x) => JSON.parse(x) as Record<string, unknown>).filter((m) => m.t === t)
const cho = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })
const lop = (k: string) => document.querySelectorAll(k).length

let an = false
beforeEach(() => {
  WsGia.ds = []; an = false; _datLaiTatMan()
  vi.stubGlobal('WebSocket', WsGia)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' }))))
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => an })
  vi.spyOn(document, 'hasFocus').mockImplementation(() => !an)
})
afterEach(() => {
  vi.unstubAllGlobals(); vi.restoreAllMocks()
  delete (document as unknown as Record<string, unknown>).hidden
  delete (window as unknown as Record<string, unknown>).matchMedia
})

async function vao(st: TrangThaiPhong) {
  const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
  const r = render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
  await waitFor(() => expect(WsGia.ds.length).toBe(1))
  const ws = WsGia.ds[0]!
  ws.nhan(viewEm(st, 'S1'))
  await screen.findByLabelText('Gửi đáp án')
  await cho(0)
  return { ws, bao: () => ws.nhan(viewEm(st, 'S1')), ...r }
}
/** Em chọn phương án rồi bấm nút Gửi nổi. */
async function chonVaGui(chu: string) {
  const pa = [...document.querySelectorAll<HTMLElement>('.duo-tra button, .duo-tra [role="radio"]')].find((b) => (b.textContent ?? '').includes(chu))
  expect(pa, `phương án chứa «${chu}»`).toBeTruthy()
  fireEvent.click(pa!)
  await cho(0)
  fireEvent.click(screen.getByLabelText('Gửi đáp án'))
}

describe('K1 · em gửi đáp án xong tự về bảng live', () => {
  it('đang live, thầy chuyển câu ⇒ máy em hiện câu hỏi; em BẤM GỬI ⇒ bảng live phủ ngay trong lượt vẽ kế (chưa cần phòng báo lại), không có viên «Thầy đang live» chớp', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv-dau')).toBe(1), { timeout: 4000 })
    await cho(1600) // thầy bật live đã lâu hơn 1,5 giây ⇒ lần vào bảng sau là «tức thì», không viên chào
    expect(lop('.lv')).toBe(0)
    await chonVaGui('CH3NHCH3')
    // CHƯA có tin nào của phòng về lượt gửi này (không gọi `bao()`) — máy em tự chuyển, không chờ phòng, không chờ tia lửa gửi bay xong (1,15 giây)
    await waitFor(() => expect(lop('.lv')).toBe(1), { timeout: 900 })
    expect(tin(ws, 'tra')).toEqual([{ t: 'tra', chon: 'B' }])
    expect(lop('.lv-dau')).toBe(0)
    expect(lop('.lv-vao')).toBe(0); expect(document.querySelector('.lv')!.hasAttribute('data-vao')).toBe(false)
    expect(document.querySelector('.bpu-hs')!.className).toContain('live-bang')
    // phòng xác nhận ⇒ vẫn bảng live, dải lượt ghi «Đã gửi»
    nhanTra(st, 'S1', 'B', T0 + 3000); bao()
    await waitFor(() => expect(document.querySelector('.lv-luot')!.textContent).toMatch(/Đã gửi · 1\/2 bạn đã gửi/))
    // AN TOÀN: trước khi thầy mở, máy em không có đáp án / lời giải
    expect(JSON.stringify(viewEm(st, 'S1'))).not.toMatch(/"dung"|"giai"/)
    // thầy mở đáp án ⇒ vẫn bảng live; kết quả của em hiện ở dải lượt (bảng live không nuốt kết quả)
    moDapAn(st, T0 + 4000, (a, b) => a === b); bao()
    await waitFor(() => expect(document.querySelector('.lv-luot .kq')!.textContent).toContain('Chính xác!'))
    expect(lop('.lv')).toBe(1)
    // câu MỚI ⇒ về màn câu hỏi để làm
    moLuot(st, { ...cau, qid: 'q2', cau: { ...cau.cau, qid: 'q2' } }, T0 + 5000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(0))
    expect(screen.getByLabelText('Gửi đáp án')).toBeTruthy()
    expect(lop('.lv-dau')).toBe(1)
  })
  it('đang live mà CHƯA có lượt nào (thầy đang giảng) ⇒ máy em ở bảng live; thầy tắt live ⇒ về màn chờ', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { bao } = await vao(st)
    moDapAn(st, T0 + 500, (a, b) => a === b); liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1), { timeout: 4000 })
    expect(document.querySelector('.lv-luot .kq')!.textContent).toContain('Em chưa gửi câu này')
  })
})

describe('K2 · thầy gọi lên bảng ⇒ ép cả lớp vào bảng live, không chờ nộp', () => {
  it('em đang làm dở (đã chọn, chưa gửi) ⇒ vào bảng live ngay; KHÔNG có tin `tra` nào được gửi hộ; dải lượt có đoán + tiếp sức gửi đúng lệnh', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv-dau')).toBe(1), { timeout: 4000 })
    fireEvent.click([...document.querySelectorAll<HTMLElement>('.duo-tra button, .duo-tra [role="radio"]')].find((b) => (b.textContent ?? '').includes('CH3NH2'))!)
    await cho(0)
    nhanTra(st, 'S2', 'A', T0 + 2000); goiLenBang(st, 'S2', ['Chưa lên bảng buổi này'], T0 + 3000)
    expect(viewEm(st, 'S1').live).toMatchObject({ bat: true, bang: true })
    bao()
    await waitFor(() => expect(lop('.lv')).toBe(1), { timeout: 900 })
    expect(tin(ws, 'tra')).toEqual([]) // không gửi hộ đáp án em chọn dở
    expect(viewEm(st, 'S1').luot!.emTra).toBeNull()
    const dai = document.querySelector('.lv-luot')!
    expect(dai.textContent).toContain('Em đoán Gia Bảo làm đúng không?')
    fireEvent.click([...dai.querySelectorAll('button')].find((b) => b.textContent === 'Làm đúng')!)
    fireEvent.click([...dai.querySelectorAll('button')].find((b) => /Tiếp sức|Cổ vũ/.test(b.textContent ?? ''))!)
    expect(tin(ws, 'doan')).toEqual([{ t: 'doan', v: 1 }])
    expect(tin(ws, 'tiep')).toEqual([{ t: 'tiep' }])
  })
  it('thầy bật tay «Bảng → máy em» giữa lượt cũng ép em chưa gửi vào bảng; tắt tay ⇒ em chưa gửi về lại màn làm bài (đáp án chọn dở còn nguyên)', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { bao } = await vao(st)
    liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv-dau')).toBe(1), { timeout: 4000 })
    liveDat(st, { bang: true }, T0 + 2000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    liveDat(st, { bang: false }, T0 + 3000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(0))
    expect(lop('.lv-dau')).toBe(1)
  })
})

describe('K3 · K4 · tạm dừng + khay mép trái', () => {
  it('thầy tạm dừng ⇒ bảng live ghi «Thầy tạm dừng live» (khay cũng ghi); tiếp tục ⇒ hết; lớp bảng KHÔNG dựng lại (không nháy)', async () => {
    const st = phong(); moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 100); moDapAn(st, T0 + 200, (a, b) => a === b)
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!, bao = () => ws.nhan(viewEm(st, 'S1'))
    liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    const goc = document.querySelector('.lv')!
    expect(screen.queryByText('Thầy tạm dừng live')).toBeNull()
    liveDat(st, { nghi: true }, T0 + 2000); bao()
    await waitFor(() => expect(screen.getAllByText('Thầy tạm dừng live').length).toBe(2)) // dải trên bảng + dòng đầu khay
    expect(document.querySelector('.lv')).toBe(goc)
    liveDat(st, { nghi: false }, T0 + 3000); bao()
    await waitFor(() => expect(screen.queryByText('Thầy tạm dừng live')).toBeNull())
    expect(document.querySelector('.lv')).toBe(goc)
  })
  it('tay nắm + khay neo MÉP TRÁI, trượt từ trái; ô tiếng trong khay; không còn viên «Thầy đang live» nổi đáy màn, không còn nút nổi «Bật mic lại»', () => {
    const css = readFileSync('src/components/live/live-em.css', 'utf8'), tsx = readFileSync('src/components/live/LopLive.tsx', 'utf8')
    const luat = (bo: string) => { const i = css.indexOf(`\n${bo} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)) }
    expect(luat('.lv .lv-nam, .lv-phu .lv-nam')).toMatch(/left: calc\(var\(--lv-at-trai, 0px\) \+ 2px\)/)
    expect(luat('.lv .lv-nam, .lv-phu .lv-nam')).not.toMatch(/right:/)
    expect(luat('.lv-khay')).toMatch(/left: calc\(var\(--lv-at-trai, 0px\) \+ 10px\)/)
    expect(luat('.lv-khay')).toMatch(/translate3d\(-236px, -50%, 0\)/)
    expect(luat('.lv-khay')).not.toMatch(/right:/)
    expect(tsx).not.toContain('className="lv-dau') // viên nổi cũ
    expect(tsx).not.toContain('lv-bat-tieng') // nút nổi «Bật mic lại» / «Chạm để bật tiếng»
    expect(tsx).toMatch(/className=\{`lv-vua mic/) // mic của em nằm trong khay
  })
})

describe('B2 · tin `roi` mang kiểu rời', () => {
  it('máy không phân biệt được khoá màn (không có IdleDetector): trang ẩn ⇒ `roi` kèm `k: an`', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws } = await vao(st)
    an = true
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(tin(ws, 'roi')).toEqual([{ t: 'roi', k: 'an' }])
  })
  it('chia đôi màn hình ⇒ `roi` kèm `k: chia`', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws } = await vao(st)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('coarse'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
    Object.defineProperty(window, 'screen', { configurable: true, value: { width: 390, height: 844, orientation: { type: 'portrait-primary' } } })
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 390 })
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 400 }) // cửa sổ chỉ còn nửa màn
    act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 80)
    expect(tin(ws, 'roi')).toEqual([{ t: 'roi', k: 'chia' }])
  })
})
