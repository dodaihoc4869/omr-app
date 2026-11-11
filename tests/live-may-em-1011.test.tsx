// LIVE BẢNG trên MÁY EM (đợt 1B, đặc tả docs/dac-ta-live-bang-1011.md mục 2.2, 4.3c, 4.7): màn Bình Phản Ứng thật + lớp live nạp lười, phòng giả chạy đúng
// luật phòng (src/lib/bpu/phong.ts + phong-live.ts). LUẬT THẦY CHỐT TỐI 10/11 («khi chuyển câu thì vẫn giữ live tiếng với hs, màn hình hs hiện câu hỏi như
// bình thường, khi bấm gọi lên bảng … lập tức màn hình hs chuyển sang chế độ live»). Khoá:
//   · phòng không có khối `live` (công tắc tắt / phòng đời cũ) ⇒ không có gì của live trên máy em;
//   · thầy live ⇒ máy em GIỮ màn câu hỏi (chưa gửi lẫn đã gửi) + dấu nhỏ «Thầy đang live» (có nút tiếng khi máy chủ có tiếng), KHÔNG vào bảng;
//   · thầy gọi em lên bảng (cờ `live.bang`) ⇒ bảng live; lượt mới ⇒ về màn câu hỏi, live còn nguyên; thầy tắt ⇒ lớp tự thu;
//   · bảng live: không nút thoát, có tay nắm, khay có Tiếng / đội + kJ, KHÔNG mang đáp án;
//   · xoay máy / vào toàn màn hình giữa lúc live KHÔNG gửi `roi` (khoá xoay 600 ms), chia đôi thật sau đó VẪN bị bắt;
//   · khung nét nhị phân của phòng tới được thư viện live (kết nối đặt `binaryType = 'arraybuffer'`).
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiLenBang, moLuot, nhanTra, taoPhong, viewEm, type TrangThaiPhong } from '../src/lib/bpu/phong'
import { datCoLive, liveBat, liveDat, liveSan, liveTat } from '../src/lib/bpu/phong-live'
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

  // 11/11 (thầy test máy thật): em GỬI xong tự về bảng live; dấu «Thầy đang live» nay là tay nắm nhỏ mép trái (`.lv-phu.lv-dau`), ô tiếng nằm trong khay.
  it('thầy live ⇒ đang làm thì giữ màn câu hỏi + tay nắm «Thầy đang live»; em gửi ⇒ TỰ về bảng live; gọi bạn lên bảng ⇒ vẫn bảng live; lượt mới ⇒ về màn câu hỏi (live còn); thầy tắt ⇒ lớp tự thu', async () => {
    const st = phong(); moLuot(st, cau, T0)
    const { ws, bao } = await vao(st)
    expect(ws.binaryType).toBe('arraybuffer')
    liveSan(st, { san: true, ss: null }, T0); liveBat(st, T0 + 1); bao()
    await waitFor(() => expect(lop('.lv-dau')).toBe(1))
    expect(screen.getByText('Thầy đang live')).toBeTruthy()
    expect(lop('.lv')).toBe(0)
    expect(screen.getByLabelText('Gửi đáp án')).toBeTruthy() // màn làm bài còn nguyên
    expect(lop('.lv-dau .lv-vua:not(.lv-wa)')).toBe(0) // máy chủ chưa có tiếng ⇒ khay không có ô tiếng
    expect(document.querySelector('.lv-dau .lv-nam')!.getAttribute('aria-label')).toBe('Mở khay điều khiển')
    // (K1) em gửi ⇒ TỰ về bảng live ngay (cờ phòng `bang` vẫn tắt)
    nhanTra(st, 'S1', 'B', T0 + 2000); bao()
    expect(viewEm(st, 'S1').live?.bang).toBe(false)
    await waitFor(() => expect(lop('.lv')).toBe(1))
    expect(lop('.lv-dau')).toBe(0)
    expect(document.querySelector('.lv-luot')!.textContent).toContain('Đã gửi')
    // thầy gọi BẠN lên bảng ⇒ phòng bật cờ `bang` ⇒ máy em vẫn ở bảng live, dải lượt có đoán + cổ vũ
    nhanTra(st, 'S2', 'A', T0 + 2500); goiLenBang(st, 'S2', ['Chưa lên bảng buổi này'], T0 + 3000)
    expect(viewEm(st, 'S1').live?.bang).toBe(true)
    bao()
    await waitFor(() => expect(document.querySelector('.lv-luot')!.textContent).toContain('Làm đúng'))
    expect(lop('.lv')).toBe(1)
    expect(lop('.lv-dau')).toBe(0)
    await waitFor(() => expect(tinChu(ws, 'live-ok')).toBeGreaterThanOrEqual(1)) // báo phòng để đếm «em xem»
    // KHÔNG có nút thoát; có tay nắm; SFU chưa cấu hình ⇒ ẩn nút tiếng, ghi chú nhẹ; có đội + kJ
    const goc = document.querySelector('.lv')!
    expect([...goc.querySelectorAll('button')].map((b) => (b.textContent ?? '') + (b.getAttribute('aria-label') ?? '')).join('|')).not.toMatch(/Thoát|Đóng|Rời/i)
    expect(goc.querySelector('.lv-nam')!.getAttribute('aria-label')).toBe('Mở khay điều khiển')
    expect(goc.querySelector('.lv-khay')!.textContent).toContain('Đội Natri')
    expect(goc.querySelector('.lv-khay')!.textContent).toContain('chưa có tiếng')
    expect(goc.querySelector('.lv-khay .lv-vua')).toBeNull()
    // đề trên giấy là khối đề dùng chung, chỉ xem — không lộ đáp án
    await waitFor(() => expect(goc.querySelector('.lv-giay')!.textContent).toContain('amine bậc hai'), { timeout: 5000 }) // khối đề của chặng nạp lười
    expect(JSON.stringify(viewEm(st, 'S1').live)).not.toMatch(/"dung"|"giai"/)
    // lượt MỚI ⇒ cờ `bang` tự tắt ⇒ máy em về màn câu hỏi, live (tiếng) còn nguyên
    moLuot(st, { ...cau, qid: 'q2', cau: { ...cau.cau, qid: 'q2' } }, T0 + 9000)
    expect(viewEm(st, 'S1').live).toMatchObject({ bat: true, bang: false })
    bao()
    await waitFor(() => expect(lop('.lv-dau')).toBe(1))
    expect(lop('.lv')).toBe(0)
    expect(screen.getByLabelText('Gửi đáp án')).toBeTruthy()
    // thầy bật TAY «Bảng → máy em» (giảng trên bảng mà không gọi ai) ⇒ bảng live; tắt tay ⇒ về màn câu hỏi
    liveDat(st, { bang: true }, T0 + 9500); bao()
    await waitFor(() => expect(lop('.lv')).toBe(1))
    liveDat(st, { bang: false }, T0 + 9600); bao()
    await waitFor(() => expect(lop('.lv')).toBe(0))
    // thầy tắt live ⇒ hết dấu
    liveTat(st, T0 + 10_000); bao()
    await waitFor(() => expect(lop('.lv-dau')).toBe(0))
  })

  // 11/11 lần 4 (thầy: tự bật tiếng, tự tắt mic khi vào live): em trong lớp nay mặc định BẬT; thầy chọn «Em ở xa» (`live-dat { tiengLop: false }`) ⇒ tắt.
  it('tiếng theo phòng: máy chủ có tiếng, em trong lớp ⇒ mặc định BẬT, thầy chọn «Em ở xa» ⇒ TẮT; nút tiếng trên dấu và trong khay bật / tắt được', async () => {
    const st = phong(); datCoLive(st, { cho: true, sfu: true }, T0); moLuot(st, cau, T0)
    const { bao } = await vao(st)
    liveBat(st, T0 + 1000); bao()
    await waitFor(() => expect(lop('.lv-dau .lv-vua:not(.lv-wa)')).toBe(1))
    expect(document.querySelector('.lv-dau .lv-vua:not(.lv-wa)')!.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('.lv-dau .lv-vua:not(.lv-wa)')!.getAttribute('aria-label')).toContain('đang bật')
    liveDat(st, { tiengLop: false }, T0 + 1500); bao()
    await waitFor(() => expect(document.querySelector('.lv-dau .lv-vua:not(.lv-wa)')!.getAttribute('aria-pressed')).toBe('false'))
    const nutDau = document.querySelector('.lv-dau .lv-vua:not(.lv-wa)')!
    expect(nutDau.getAttribute('aria-label')).toContain('đang tắt')
    fireEvent.click(nutDau)
    await waitFor(() => expect(document.querySelector('.lv-dau .lv-vua:not(.lv-wa)')!.getAttribute('aria-pressed')).toBe('true'))
    // sang bảng live: khay giữ đúng lựa chọn của em
    liveDat(st, { bang: true }, T0 + 2000); bao()
    await waitFor(() => expect(lop('.lv .lv-vua:not(.lv-wa)')).toBe(1))
    expect(document.querySelector('.lv .lv-vua:not(.lv-wa)')!.textContent).toContain('Đang bật')
    fireEvent.click(document.querySelector('.lv .lv-vua:not(.lv-wa)')!)
    await waitFor(() => expect(document.querySelector('.lv .lv-vua:not(.lv-wa)')!.textContent).toContain('Đang tắt'))
  })

  it('khung nét nhị phân của phòng tới thư viện live ⇒ bảng có nét (ghi chú «Bảng đen» biến mất)', async () => {
    const st = phong(); moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 500)
    const { ws, bao } = await vao(st).catch(async () => { // đã gửi ⇒ không còn nút Gửi: dựng tay
      const w = WsGia.ds[0]!; return { ws: w, bao: () => w.nhan(viewEm(st, 'S1')) }
    })
    liveBat(st, T0 + 1000); liveDat(st, { bang: true }, T0 + 1001); bao()
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
    liveBat(st, T0 + 1); liveDat(st, { bang: true }, T0 + 2); bao()
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
    liveBat(st, T0 + 1); liveDat(st, { bang: true }, T0 + 2); bao()
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
    liveBat(st, T0 + 1); liveDat(st, { bang: true }, T0 + 2); bao()
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
