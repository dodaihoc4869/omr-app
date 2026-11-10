// LIVE BẢNG trên MÁY EM (đợt 1B, đặc tả docs/dac-ta-live-bang-1011.md mục 2.2, 4.7, 5 + điểm quyết 5): màn Bình Phản Ứng thật + lớp live nạp lười, phòng giả
// chạy đúng luật phòng (src/lib/bpu/phong.ts + phong-live.ts). Khoá:
//   · phòng không có khối `live` (công tắc tắt / phòng đời cũ) ⇒ không có gì của live trên máy em;
//   · thầy live mà lượt đang mở, em CHƯA gửi ⇒ giữ màn làm bài + dải «Thầy đang live»; gửi xong ⇒ tự sang bảng live; thầy tắt ⇒ lớp tự thu;
//   · bảng live: không nút thoát, có tay nắm ≥ 48 px, khay có Tiếng / đội + kJ, KHÔNG mang đáp án;
//   · xoay máy / vào toàn màn hình giữa lúc live KHÔNG gửi `roi` (khoá xoay 600 ms), chia đôi thật sau đó VẪN bị bắt;
//   · khung nét nhị phân của phòng tới được thư viện live (kết nối đặt `binaryType = 'arraybuffer'`).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moDapAn, moLuot, nhanTra, taoPhong, viewEm, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat, liveSan, liveTat } from '../src/lib/bpu/phong-live'
import { KHOA_XOAY_MS, _datLaiTatMan } from '../src/components/bpu/tat-man'
import { NOI_MS } from '../src/components/bpu/ManBinhPhanUng'
import { maBangMoi, maNetXong } from '../src/lib/live/ma-net'
import { maTrang } from '../src/components/live/bo-cuc'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

class WsGia { static ds: WsGia[] = []; readyState = 1; binaryType = 'blob'; gui: (string | Uint8Array)[] = []; onopen?: () => void; onmessage?: (e: { data: unknown }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string | Uint8Array) { this.gui.push(d) } close() {}
  nhan(v: unknown) { act(() => { this.onmessage?.({ data: v instanceof Uint8Array ? v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) : JSON.stringify(v) }) }) } }

const T0 = Date.now()
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 60 }
const phong = (coLive = true): TrangThaiPhong => {
  const st = taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
  if (coLive) datCoLive(st, { cho: true, sfu: false }, T0)
  return st
}
const tinChu = (ws: WsGia, t: string) => ws.gui.filter((x) => typeof x === 'string' && JSON.parse(x).t === t).length
const cho = (ms: number) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })

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
const lop = (k: string) => document.querySelectorAll(k).length

describe('máy em khi thầy live', () => {
  it('phòng không có khối live (công tắc tắt / phòng đời cũ): không dải, không lớp bảng, không nạp gì', async () => {
    const st = phong(false); moLuot(st, cau, T0)
    await vao(st)
    await cho(50)
    expect(viewEm(st, 'S1').live ?? null).toBeNull()
    expect(lop('.lv') + lop('.lv-dai')).toBe(0)
  })

  it('điểm quyết 5: lượt đang mở, em CHƯA gửi ⇒ giữ màn làm bài + dải «Thầy đang live»; gửi xong ⇒ bảng live; thầy tắt ⇒ lớp tự thu', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    expect(ws.binaryType).toBe('arraybuffer')
    liveSan(st, { san: true, ss: null }, T0); liveBat(st, T0 + 1); bao()
    await waitFor(() => expect(lop('.lv-dai')).toBe(1))
    expect(screen.getByText('Thầy đang live')).toBeTruthy()
    expect(lop('.lv')).toBe(0)
    expect(screen.getByLabelText('Gửi đáp án')).toBeTruthy() // màn làm bài còn nguyên
    // em gửi ⇒ phòng ghi ⇒ lớp bảng live
    nhanTra(st, 'S1', 'B', T0 + 2000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    expect(lop('.lv-dai')).toBe(0)
    await waitFor(() => expect(tinChu(ws, 'live-ok')).toBeGreaterThanOrEqual(1)) // báo phòng để đếm «em xem»
    // KHÔNG có nút thoát; có tay nắm; khay có Tiếng? (SFU chưa cấu hình ⇒ ẩn nút tiếng, ghi chú nhẹ) + đội + kJ
    const goc = document.querySelector('.lv')!
    expect([...goc.querySelectorAll('button')].map((b) => (b.textContent ?? '') + (b.getAttribute('aria-label') ?? '')).join('|')).not.toMatch(/Thoát|Đóng|Rời/i)
    expect(goc.querySelector('.lv-nam')!.getAttribute('aria-label')).toBe('Mở khay điều khiển')
    expect(goc.querySelector('.lv-khay')!.textContent).toContain('Đội Natri')
    expect(goc.querySelector('.lv-khay')!.textContent).toContain('chưa có tiếng')
    expect(goc.querySelector('.lv-khay .lv-vua')).toBeNull()
    // đề trên giấy là khối đề dùng chung, chỉ xem — không lộ đáp án
    expect(goc.querySelector('.lv-giay')!.textContent).toContain('amine bậc hai')
    expect(JSON.stringify(viewEm(st, 'S1').live)).not.toMatch(/"dung"|"giai"/)
    // thầy tắt live
    liveTat(st, T0 + 5000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(0))
  })

  it('đã mở đáp án (không còn gì để làm) mà thầy live ⇒ vào thẳng bảng live; lượt MỚI mở ⇒ về màn làm bài + dải', async () => {
    const st = phong(); moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 500); moDapAn(st, T0 + 900, (a, b) => a === b)
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    liveBat(st, T0 + 1000); ws.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(lop('.lv')).toBe(1))
    moLuot(st, { ...cau, qid: 'q2', cau: { ...cau.cau, qid: 'q2' } }, T0 + 3000); ws.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(lop('.lv-dai')).toBe(1))
    expect(lop('.lv')).toBe(0)
  })

  it('tiếng theo phòng: SFU có, em trong lớp ⇒ nút «Tiếng: Đang tắt» (mặc định tắt, bấm bật được)', async () => {
    const st = phong(); datCoLive(st, { cho: true, sfu: true }, T0); moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 500)
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    liveBat(st, T0 + 1000); WsGia.ds[0]!.nhan(viewEm(st, 'S1'))
    await waitFor(() => expect(lop('.lv .lv-vua')).toBe(1))
    const nut = document.querySelector('.lv .lv-vua')!
    expect(nut.textContent).toContain('Đang tắt')
    fireEvent.click(nut)
    await waitFor(() => expect(document.querySelector('.lv .lv-vua')!.textContent).toContain('Đang bật'))
  })

  it('khung nét nhị phân của phòng tới thư viện live ⇒ bảng có nét (ghi chú «Bảng đen» biến mất)', async () => {
    const st = phong(); moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 500)
    const { ws, bao } = await vao(st).catch(async () => { // đã gửi ⇒ không còn nút Gửi: dựng tay
      const w = WsGia.ds[0]!; return { ws: w, bao: () => w.nhan(viewEm(st, 'S1')) }
    })
    liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    expect(document.querySelector('.lv-bang')!.textContent).toContain('Bảng đen')
    const ghi = (k: Uint8Array, stt: number) => { k[1] = stt & 255; k[2] = (stt >> 8) & 255; return k }
    ws.nhan(ghi(maBangMoi(maTrang('0', { giay: [0.005, 0.009, 0.661, 0.919], bang: [0.667, 0.019, 0.995, 0.919] }, false), 16 / 9), 1))
    const net = { id: 'n1', cong: 'but' as const, mau: 'rgb(244,239,228)', co: 2.3, diem: [[0.7, 0.2, 0.5, 0], [0.72, 0.22, 0.5, 16], [0.75, 0.25, 0.4, 32]] as [number, number, number, number][] }
    for (const k of maNetXong(net)) ws.nhan(ghi(k, 2))
    await waitFor(() => expect(document.querySelector('.lv-bang')!.textContent).not.toContain('Bảng đen'))
  })
})

describe('rời màn khi live (đặc tả 4.7)', () => {
  const may = (trang: [number, number], man: [number, number], huong: string) => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('coarse'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
    Object.defineProperty(window, 'screen', { configurable: true, value: { width: man[0], height: man[1], orientation: { type: huong } } })
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: trang[0] })
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: trang[1] })
  }
  it('xoay máy giữa lúc live: cỡ trang và hướng màn lệch nhau ⇒ KHÔNG gửi `roi`; xoay xong vẫn không; chia đôi THẬT sau đó ⇒ có `roi`', async () => {
    may([390, 844], [390, 844], 'portrait-primary')
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    liveBat(st, T0 + 1); nhanTra(st, 'S1', 'B', T0 + 500); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    // hướng màn đã ngang, khung trang CHƯA đổi (lệch vài chục ms) ⇒ nếu xét ngay sẽ ra «chia đôi» giả
    may([390, 844], [844, 390], 'landscape-primary')
    act(() => { window.dispatchEvent(new Event('orientationchange')); window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 80)
    expect(tinChu(ws, 'roi')).toBe(0)
    // khung trang theo kịp
    may([844, 390], [844, 390], 'landscape-primary')
    act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(KHOA_XOAY_MS + 120)
    expect(tinChu(ws, 'roi')).toBe(0)
    // em kéo app khác vào chia đôi ⇒ vẫn bị bắt
    may([420, 390], [844, 390], 'landscape-primary')
    act(() => { window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 80)
    expect(tinChu(ws, 'roi')).toBe(1)
  })
  it('vào / ra toàn màn hình giữa lúc live (cỡ trang đổi trước, hướng đổi sau) ⇒ không gửi `roi`', async () => {
    may([390, 844], [390, 844], 'portrait-primary')
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    liveBat(st, T0 + 1); nhanTra(st, 'S1', 'B', T0 + 500); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    may([844, 390], [390, 844], 'portrait-primary') // trang đã ngang, hướng màn báo còn dọc
    act(() => { document.dispatchEvent(new Event('fullscreenchange')); window.dispatchEvent(new Event('resize')) })
    await cho(NOI_MS + 80)
    expect(tinChu(ws, 'roi')).toBe(0)
    may([844, 390], [844, 390], 'landscape-primary')
    await cho(KHOA_XOAY_MS + 120)
    expect(tinChu(ws, 'roi')).toBe(0)
  })
  it('thoát app khi đang ở bảng live ⇒ `roi` ngay (bộ bắt cũ vẫn chạy), lớp live nhường màn cảnh báo', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    liveBat(st, T0 + 1); nhanTra(st, 'S1', 'B', T0 + 500); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    an = true
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(tinChu(ws, 'roi')).toBe(1)
    an = false
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(screen.getByText('Em vừa rời màn hình')).toBeTruthy())
    expect(lop('.lv')).toBe(0)
  })
})
