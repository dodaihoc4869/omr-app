// Bình Phản Ứng — giao diện máy em + bảng chiếu với phòng giả (WebSocket giả, dữ liệu từ luật phòng thật): đi đủ các màn, không vỡ, chữ đúng chuẩn.
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOI_BPU, boLuotRong, goiLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewBang, viewEm, ketThuc } from '../src/lib/bpu/phong'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const traMo = vi.hoisted(() => ({ v: { ok: true, du: { ok: true, ve: 've-thay' } } as Record<string, unknown> }))
const goiLenhGhi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async (...a: unknown[]) => { goiLenhGhi(...a); return traMo.v } }))
vi.mock('../src/lib/ung-vien-chieu', () => ({ layEmChieu: async () => new Map() }))

class WsGia { static ds: WsGia[] = []; readyState = 1; gui: string[] = []; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void; onerror?: () => void
  constructor(public url: string) { WsGia.ds.push(this); setTimeout(() => this.onopen?.(), 0) }
  send(d: string) { this.gui.push(d) } close() {} nhan(v: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(v) }) }) } }

const T0 = Date.now()
const chamSo = (a: string, b: string) => a === b
const phong = () => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: [{ sbd: 'S1', ten: 'Nguyễn Minh Anh', coMat: true, luc: T0 }, { sbd: 'S2', ten: 'Trần Gia Bảo', coMat: true, luc: T0 }] })
const cau = { qid: 'q1', phan: 'I' as const, tuLuan: false, cau: { qid: 'q1', maDe: 'm', phan: 'I', text: 'Chất nào là amine bậc hai?', choices: ['CH3NH2', 'CH3NHCH3', '(CH3)3N', 'C6H5NH2'], ideas: [], hinhAnh: [], kienThuc: [] }, dung: 'B', hanGiay: 60 }

beforeEach(() => { WsGia.ds = []; vi.stubGlobal('WebSocket', WsGia); vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, ve: 've-em', buoiId: 'b1' })))) })
afterEach(() => { vi.unstubAllGlobals() })

describe('máy em', () => {
  it('chờ → câu → đã gửi → đoán bạn lên bảng → kết quả → kết thúc', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    expect(ws.url).toBe('wss://may-chu/bpu/phong?ve=ve-em')
    const st = phong()
    ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText(/Em đã vào lớp lúc/)).toBeTruthy()
    // Lúc chờ (chưa có lượt) em rời được — không bị kẹt khi thầy quên kết thúc / có ca kiểm tra.
    expect(screen.queryByRole('button', { name: 'Rời Bình Phản Ứng' })).toBeNull() // SỬA CÓ CHỦ ĐÍCH 09/11: khoá cứng
    moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Thoát|Đóng/ })).toBeNull()
    nhanTra(st, 'S1', 'B', T0 + 3000); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText(/Đã gửi sau 3 giây/)).toBeTruthy()
    goiLenBang(st, 'S2', ['Lý do một', 'Lý do hai'], T0); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Em đoán bạn ấy làm đúng không?')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cổ vũ bạn ấy|Tiếp sức/ })).toBeTruthy()
    lamBang(st, T0); moDapAn(st, T0 + 5000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Chính xác!')).toBeTruthy()
    ketThuc(st, T0); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Về chặng đang làm' })).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/tinh thể|mẻ/i)
  })
  it('SỬA CÓ CHỦ ĐÍCH 07/11 — bỏ «Em chưa biết làm» + «Thành thật +20 kJ»; hết giờ chưa gửi ⇒ khoá, câu để trống', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /chưa biết làm/ })).toBeNull()
    expect(document.body.textContent).not.toMatch(/Thành thật|\+20 kJ/)
    moLuot(st, cau, Date.now() - 120_000); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText(/Hết giờ — câu này để trống/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Gửi đáp án' })).toBeNull()
  })
  it('GIỮ NỐI SẴN (gửi câu tức thì): ẩn khi chưa có lượt, lượt mới ⇒ tự hiện; «Rời» ⇒ ẩn (vẫn nối); lượt sau lại hiện; đang thi ⇒ không tự hiện', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    let thi = false
    const onDong = vi.fn()
    render(<Man token="tok" buoiId="b1" onDong={onDong} giuNoi mo={0} chan={() => thi} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong(); ws.nhan(viewEm(st, 'S1'))
    expect(screen.queryByRole('dialog', { name: 'Bình Phản Ứng' })).toBeNull()
    moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    // SỬA CÓ CHỦ ĐÍCH 09/11 (thầy «bỏ chữ rời bình phản ứng … khoá cứng tới khi tôi kết thúc buổi học»): không còn nút rời; mở đáp án ⇒ màn vẫn ở lại.
    moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(screen.queryByRole('button', { name: 'Rời Bình Phản Ứng' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Bình Phản Ứng' })).toBeTruthy()
    expect(onDong).not.toHaveBeenCalled()
    expect(WsGia.ds).toHaveLength(1) // vẫn một kết nối, không nối lại
    moLuot(st, { ...cau, qid: 'q2' }, T0 + 9000); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    void thi
  })
  it('em được gọi lên bảng thấy lý do', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong(); moLuot(st, cau, T0); goiLenBang(st, 'S1', ['Em đã tự làm đúng câu này trên app: lên giảng lại cho cả lớp.'], T0)
    WsGia.ds[0]!.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Em được mời lên bảng!')).toBeTruthy()
    expect(screen.getByText(/lên giảng lại cho cả lớp/)).toBeTruthy()
  })
})

describe('máy em · thầy 09/11 (ngọn lửa đội · tự che sau khi gửi · xanh / đỏ · `ve`)', () => {
  const vao = async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    return WsGia.ds[0]!
  }
  const coTin = (ws: WsGia, t: string) => ws.gui.filter((x) => JSON.parse(x).t === t).length
  it('đầu màn: ngọn lửa đội + tên đội + kJ đội', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    await screen.findByRole('button', { name: 'Gửi đáp án' })
    const ten = DOI_BPU[st.ds[0]!.doi]!.ten
    expect(document.querySelector('.bpu-hs-tren .bpu-lua')).toBeTruthy()
    expect(document.querySelector('.bpu-hs-tren .bpu-hs-tieu b')!.textContent).toBe(ten)
    expect(screen.getByLabelText(new RegExp(`${ten} đang có \\d+ kJ`))).toBeTruthy()
  })
  it('bấm gửi ⇒ tia lửa bay rồi TỰ CHE (không đề, không nút); thầy mở đáp án ⇒ vẫn che, em chọn sai ĐỎ, đáp án đúng XANH; câu mới ⇒ mở', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    const pa = await screen.findAllByRole('radio')
    act(() => { pa[0]!.click() })
    act(() => { screen.getByRole('button', { name: 'Gửi đáp án' }).click() })
    expect(ws.gui.map((x) => JSON.parse(x)).find((x) => x.t === 'tra')).toMatchObject({ chon: 'A' })
    // che NGAY (chưa chờ phòng báo lại): đang bay thì phương án còn nằm dưới nhưng đã khoá
    expect(document.querySelector('.bpu-che.bay .bpu-tia')).toBeTruthy()
    expect(screen.getByText('Đang gửi…')).toBeTruthy()
    expect(screen.getAllByRole('radio').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
    await waitFor(() => expect(screen.queryAllByRole('radio')).toHaveLength(0), { timeout: 6000 }) // hiệu ứng gửi ~1,15 s; máy chạy test bận ⇒ chừa rộng (chập chờn 09/11)
    expect(document.body.textContent).not.toContain('Chất nào là amine bậc hai?')
    nhanTra(st, 'S1', 'A', T0 + 2000); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText(/Đã gửi sau 2 giây/)).toBeTruthy()
    expect(screen.getByText('Nhìn lên bảng để chữa bài')).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0) // không nút mở ra, không nút đổi đáp án, không nút rời giữa lượt
    moDapAn(st, T0 + 5000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Chưa đúng')).toBeTruthy()
    expect(document.querySelector('.bpu-che')!.getAttribute('data-kq')).toBe('sai')
    expect(document.querySelector('.bpu-kq-o[data-kq="sai"] b')!.textContent).toBe('A')
    expect(document.querySelector('.bpu-kq-o[data-kq="dung"] b')!.textContent).toBe('B')
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(document.body.textContent).not.toContain('Chất nào là amine bậc hai?')
    expect(screen.queryByRole('button', { name: 'Rời Bình Phản Ứng' })).toBeNull() // SỬA CÓ CHỦ ĐÍCH 09/11: khoá cứng, không nút rời
    moLuot(st, { ...cau, qid: 'q2' }, T0 + 9000); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    expect(document.querySelector('.bpu-che')).toBeNull()
  })
  it('em chọn đúng ⇒ lớp che XANH «Chính xác!»; Đúng–sai ⇒ ý đúng xanh, ý sai đỏ kèm đáp án', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 1000); moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Chính xác!')).toBeTruthy()
    expect(document.querySelector('.bpu-che')!.getAttribute('data-kq')).toBe('dung')
    expect(document.querySelector('.bpu-kq-o[data-kq="sai"]')).toBeNull()
    expect(document.querySelector('.bpu-kq-cot[data-kq="dung"]')!.textContent).toContain('Em chọn')
    const ds = { qid: 'q2', phan: 'II' as const, tuLuan: false, cau: { ...cau.cau, qid: 'q2', phan: 'II', choices: [], ideas: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'] }, dung: 'DSSD', hanGiay: 60 }
    moLuot(st, ds, T0 + 9000); nhanTra(st, 'S1', 'DSSS', T0 + 10000); moDapAn(st, T0 + 12000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Chưa đúng')).toBeTruthy()
    expect([...document.querySelectorAll('.bpu-kq-dong')].map((x) => x.textContent)).toEqual(['a)Em: Đúng ✓', 'b)Em: Sai ✓', 'c)Em: Sai ✓', 'd)Em: Sai ✗Đáp án: Đúng ✓'])
    expect(screen.getByText(/Em đúng 3\/4 ý/)).toBeTruthy()
  })
  it('mất mạng lúc gửi mà phòng bỏ lượt rỗng rồi mở câu khác CÙNG SỐ lượt ⇒ không che nhầm câu mới (khoá = số lượt + giờ mở)', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    const pa = await screen.findAllByRole('radio')
    ws.readyState = 0 // mất mạng: đáp án nằm hàng chờ
    act(() => { pa[1]!.click() })
    act(() => { screen.getByRole('button', { name: 'Gửi đáp án' }).click() })
    expect(document.querySelector('.bpu-che')).toBeTruthy()
    expect(boLuotRong(st)).toBe(true)
    moLuot(st, { ...cau, qid: 'q2' }, T0 + 7000); ws.nhan(viewEm(st, 'S1'))
    expect(viewEm(st, 'S1').luot!.so).toBe(1)
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    expect(document.querySelector('.bpu-che')).toBeNull()
  })
  // SỬA CÓ CHỦ ĐÍCH 09/11 (thầy «che luôn cả em chưa gửi»): mở đáp án ⇒ máy em chưa gửi cũng CHE (không đề, không lời giải), chỉ kết quả + đáp án đúng XANH.
  it('em chưa gửi mà thầy mở đáp án ⇒ CHE, đáp án đúng tô XANH, không đề', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Em chưa gửi câu này')).toBeTruthy()
    expect(document.querySelector('.bpu-che')).toBeTruthy()
    expect(screen.queryByText(/Chất nào là amine bậc hai/)).toBeNull()
    expect(document.querySelector('.bpu-kq-o[data-kq="dung"] b')!.textContent).toBe('B')
    expect(document.querySelector('.bpu-kq-o[data-kq="sai"]')).toBeNull()
  })
  // SỬA CÓ CHỦ ĐÍCH 09/11 (lần 2, luật chặt): rời màn nay TRỪ em −50 + đội −50 ⇒ màn cảnh báo nhắc rõ mức trừ (trước: không nhắc kJ).
  it('SỬA CÓ CHỦ ĐÍCH 09/11 — rời màn nhắc «em −50 kJ · đội −50 kJ»; ẩn app ≥ 2 s ⇒ `roi`, hiện lại ⇒ `ve` (cả khi rời bằng pagehide)', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    await screen.findByRole('button', { name: 'Gửi đáp án' })
    let an = false
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => an })
    const tieuDiem = vi.spyOn(document, 'hasFocus').mockImplementation(() => !an)
    try {
      // 09/11 (lần 4) thầy «cảnh báo … phải tức thì»: ẩn app ⇒ `roi` NGAY (không chờ 2 giây)
      // 09/11 (lần 5): ẩn app ⇒ báo sau ~0,45 s (trang còn chạy = chuyển app); hiện lại trước hạn (tắt màn rồi mở / chớp) ⇒ KHÔNG báo
      an = true; act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      an = false; act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      await act(async () => { await new Promise((r) => setTimeout(r, 600)) })
      expect(coTin(ws, 'roi')).toBe(0)
      an = true; act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      await act(async () => { await new Promise((r) => setTimeout(r, 600)) })
      expect(coTin(ws, 'roi')).toBe(1)
      an = false; act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      expect(coTin(ws, 've')).toBe(1)
      expect(await screen.findByText('Bảng đang báo tên em — quay lại tập trung lên bảng.')).toBeTruthy()
      expect(document.querySelector('.bpu-tru')!.textContent).toBe('Rời màn hình: em −50 kJ · đội −50 kJ')
      // hiện lại lần nữa mà không rời ⇒ không gửi thêm `ve`
      act(() => { document.dispatchEvent(new Event('visibilitychange')) })
      expect(coTin(ws, 've')).toBe(1)
      // rời bằng đóng trang (pagehide) ⇒ `roi` ngay; quay lại (pageshow) ⇒ `ve`
      an = true; act(() => { window.dispatchEvent(new Event('pagehide')) })
      expect(coTin(ws, 'roi')).toBe(2)
      an = false; act(() => { window.dispatchEvent(new Event('pageshow')) })
      expect(coTin(ws, 've')).toBe(2)
    } finally { vi.useRealTimers(); tieuDiem.mockRestore(); delete (document as unknown as Record<string, unknown>).hidden }
  })
  it('09/11 CỬA SỔ NỔI: app vẫn hiện nhưng mất tiêu điểm ⇒ `roi` + cảnh báo «Không được dùng cửa sổ nổi»; lấy lại tiêu điểm ⇒ `ve`', async () => {
    const ws = await vao()
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    await screen.findByRole('button', { name: 'Gửi đáp án' })
    let co = true
    const tieuDiem = vi.spyOn(document, 'hasFocus').mockImplementation(() => co)
    try {
      co = false; act(() => { window.dispatchEvent(new Event('blur')) })
      await new Promise((r) => setTimeout(r, 450))
      expect(coTin(ws, 'roi')).toBe(1)
      expect(await screen.findByText('Không được dùng cửa sổ nổi')).toBeTruthy()
      co = true; act(() => { window.dispatchEvent(new Event('focus')) })
      expect(coTin(ws, 've')).toBe(1)
      // mất tiêu điểm chớp qua (< 350 ms) ⇒ không báo
      co = false; act(() => { window.dispatchEvent(new Event('blur')) })
      co = true; act(() => { window.dispatchEvent(new Event('focus')) })
      await new Promise((r) => setTimeout(r, 450))
      expect(coTin(ws, 'roi')).toBe(1)
    } finally { tieuDiem.mockRestore() }
  })
})

describe('bảng chiếu', () => {
  it('điểm danh → lượt → gọi lên bảng → mở đáp án → vinh danh', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    render(<Bang buoiId="b1" ma="482715" linkQr="https://app/hs?diem-danh=482715" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong()
    ws.nhan(viewBang(st))
    expect(await screen.findByText('Vào lớp: mở app, nhập mã')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Mã QR điểm danh' })).toBeTruthy()
    moLuot(st, cau, T0); nhanTra(st, 'S1', 'B', T0 + 1000); ws.nhan(viewBang(st))
    expect(await screen.findByText(/em đã gửi/)).toBeTruthy()
    goiLenBang(st, 'S2', ['Lý do A', 'Lý do B', 'Lý do C'], T0); ws.nhan(viewBang(st))
    expect(await screen.findByText('Mời em lên bảng')).toBeTruthy()
    expect(screen.getByText('Lý do B')).toBeTruthy()
    lamBang(st, T0); ws.nhan(viewBang(st))
    expect(await screen.findByText('Đang làm trên bảng')).toBeTruthy()
    // 07/11: em viết lên bảng ⇒ CHỈ vùng em viết (nửa phải) đen, đề trái vẫn sáng; B bật lại, B lần nữa tắt
    const tat = () => screen.queryByRole('status', { name: /Vùng em viết tạm tắt chiếu/ })
    expect(tat()).toBeTruthy()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' })) })
    expect(tat()).toBeNull()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' })) })
    expect(tat()).toBeTruthy()
    moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewBang(st))
    expect(await screen.findByText('Đáp án')).toBeTruthy()
    // 07/11: không còn phím X «Kết thúc buổi chơi» (một chỗ kết thúc: «Kết thúc buổi học»); V mở vinh danh.
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })) })
    expect(ws.gui.some((t) => t.includes('ket-thuc'))).toBe(false)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' })) })
    expect(await screen.findByText('Vô địch buổi hôm nay')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/tinh thể|Cần kèm/)
  })
  it('SỬA CÓ CHỦ ĐÍCH 07/11 (thầy «vẫn bị nhảy vào màn điểm danh cũ, bỏ hẳn đi»): phòng không mở được ⇒ KHÔNG lùi bản chiếu cũ; bảng giữ mã + QR, báo lỗi', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    traMo.v = { ok: true, du: { ok: false, lyDo: 'ca-mo', error: 'Lớp đang có ca kiểm tra mở.' } }
    const onTat = vi.fn()
    render(<Bang buoiId="b1" ma="482715" linkQr="https://app/hs?diem-danh=482715" onDong={() => {}} onTat={onTat} />)
    expect(screen.getByText('Vào lớp: mở app, nhập mã')).toBeTruthy()
    expect(await screen.findByText(/Lớp đang có ca kiểm tra mở/)).toBeTruthy()
    expect(onTat).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Mã QR điểm danh' })).toBeTruthy()
    traMo.v = { ok: true, du: { ok: true, ve: 've-thay' } }
  })
  it('08/11 thầy «bỏ đếm thời gian»: mở lượt KHÔNG giới hạn giờ (hanGiay 0) dù tờ gửi giây ước tính', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    goiLenhGhi.mockClear()
    render(<Bang buoiId="b1" qid="q9" luot={1} giay={150} tuDong onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    act(() => { WsGia.ds[0]!.nhan(viewBang(phong())) })
    await waitFor(() => expect(goiLenhGhi.mock.calls.find((c) => c[0] === '/gv/bpu/luot')?.[1]).toMatchObject({ qid: 'q9', hanGiay: 0 }))
  })
  it('chuyển câu: → và nút «Câu tiếp» báo tờ sang câu sau; lưới hiện tên gọi đủ chữ', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const onToi = vi.fn()
    render(<Bang buoiId="b1" qid="q1" luot={1} giay={150} tuDong onDong={() => {}} onToi={onToi} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong(); moLuot(st, cau, T0); WsGia.ds[0]!.nhan(viewBang(st))
    expect(await screen.findByText(/em đã gửi/)).toBeTruthy()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(onToi).toHaveBeenLastCalledWith(1)
    // SỬA CÓ CHỦ ĐÍCH 09/11 (thầy «thu hết các nút lại, chỉ để nút gọi lên bảng thôi»): lúc cả lớp làm, thanh trên CHỈ có «Gọi lên bảng»; chuyển câu bằng phím.
    const nut = [...document.querySelectorAll('.bb-tren button')].map((b) => b.textContent)
    expect(nut).toEqual(['Lên bảngL']) // 09/11 lần 2: nút chính «Lên bảng» (phím L) — sang tờ chiếu cũ, không tự gọi
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' })) })
    expect(onToi).toHaveBeenCalledTimes(2)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })) })
    expect(onToi).toHaveBeenLastCalledWith(-1)
    // Esc chỉ đóng bảng: không lan tới khung tờ chiếu bên dưới (thầy 07/11 «bấm esc xong không có chỗ mở lại tờ chiếu»)
    const toNghe = vi.fn()
    window.addEventListener('keydown', toNghe)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(toNghe).not.toHaveBeenCalled()
    window.removeEventListener('keydown', toNghe)
    // SỬA CÓ CHỦ ĐÍCH 09/11 (tháp lửa): dải tên mới theo đội — ô `.bb-tl-o`, vẫn tên gọi đủ chữ.
    const o = document.querySelector('.bb-tl-o .ten')!
    expect(o.textContent).toBe(st.ds[0]!.ten.split(' ').at(-1))
  })
  it('phương án ẩn mặc định: M hiện / ẩn (không mở đáp án); O mở đáp án; mở đáp án KHÔNG tự hiện phương án; Đúng–sai ⇒ đáp án gọn Đ · S', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    render(<Bang buoiId="b1" qid="q1" luot={1} onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewBang(st))
    await screen.findByText(/em đã gửi/)
    expect(document.querySelector('.bb-pa')).toBeNull()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' })) })
    expect(document.querySelectorAll('.bb-pa > div')).toHaveLength(4)
    expect(ws.gui.some((t) => t.includes('"mo"'))).toBe(false)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' })) })
    expect(document.querySelector('.bb-pa')).toBeNull()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' })) })
    expect(ws.gui.some((t) => t.includes('"mo"'))).toBe(true)
    moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewBang(st))
    await screen.findByText('Đáp án')
    expect(document.querySelector('.bb-pa')).toBeNull() // mở đáp án KHÔNG tự hiện phương án
    const ds = { qid: 'q2', phan: 'II' as const, tuLuan: false, cau: { ...cau.cau, qid: 'q2', phan: 'II', choices: [], ideas: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'] }, dung: 'DSSD', hanGiay: 60 }
    moLuot(st, ds, T0 + 9000); nhanTra(st, 'S1', 'DSSS', T0 + 10000); nhanTra(st, 'S2', 'DSSD', T0 + 10000); moDapAn(st, T0 + 12000, chamSo); ws.nhan(viewBang(st))
    // SỬA CÓ CHỦ ĐÍCH 09/11 (thầy chốt tháp lửa, DAC-TA mục 9.3): Đúng–sai mở đáp án ⇒ «Đáp án: Đ · S · S · Đ» + «x em đúng đủ 4 ý» (thay hai hàng ống).
    expect(await screen.findByText('Đ · S · S · Đ')).toBeTruthy()
    expect(document.querySelector('.bb-tl-da')!.textContent).toContain('1 em đúng đủ 4 ý')
    // M ⇒ tấm giấy 4 ý đè vùng tháp (ống ẩn), M lần nữa về màn đua.
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' })) })
    expect(document.querySelectorAll('.bb-de-pa .bb-ds > div')).toHaveLength(4)
    expect((document.querySelector('.bb-tl-dai') as HTMLElement).style.visibility).toBe('hidden')
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' })) })
    expect(document.querySelector('.bb-de-pa')).toBeNull()
  })
  it('G ⇒ lời giải thu gọn hiện NGAY TRÊN BẢNG (G lần nữa ẩn); tờ không có lời giải ⇒ lùi về tờ', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const onGiai = vi.fn()
    let html = '<div class="sol-label sol-tieu">Lời giải</div><div class="sol-text">Amine bậc hai có một nguyên tử H trên N.</div>'
    render(<Bang buoiId="b1" qid="q1" luot={1} onDong={() => {}} onGiai={onGiai} layGiai={async () => html} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong(); moLuot(st, cau, T0); WsGia.ds[0]!.nhan(viewBang(st))
    await screen.findByText(/em đã gửi/)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })) })
    expect(await screen.findByRole('region', { name: 'Lời giải thu gọn' })).toBeTruthy()
    expect(screen.getByText(/một nguyên tử H trên N/)).toBeTruthy()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })) })
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Lời giải thu gọn' })).toBeNull())
    // máy điều khiển (bước Đang chiếu) bấm «Lời giải» ⇒ cùng đường
    act(() => { WsGia.ds[0]!.onmessage?.({ data: JSON.stringify({ t: 'dk', lenh: 'giai' }) }) })
    expect(await screen.findByRole('region', { name: 'Lời giải thu gọn' })).toBeTruthy()
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })) })
    html = ''
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })) })
    await waitFor(() => expect(onGiai).toHaveBeenCalledTimes(1))
    expect(onGiai).toHaveBeenCalledTimes(1)
  })
  it('mở lại tờ / bấm P trên ĐÚNG câu đang chạy ⇒ nối lại lượt cũ (không mở lượt mới); câu khác hoặc P sau khi mở đáp án ⇒ lượt mới', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const soLuot = () => goiLenhGhi.mock.calls.filter((c) => c[0] === '/gv/bpu/luot').length
    const st = phong(); moLuot(st, cau, T0)
    goiLenhGhi.mockClear()
    const a = render(<Bang buoiId="b1" qid="q1" luot={1} tuDong onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    WsGia.ds[0]!.nhan(viewBang(st))
    expect(await screen.findByText(/em đã gửi/)).toBeTruthy()
    expect(soLuot()).toBe(0)
    a.rerender(<Bang buoiId="b1" qid="q1" luot={2} onDong={() => {}} />)
    expect(soLuot()).toBe(0)
    a.rerender(<Bang buoiId="b1" qid="q2" luot={3} tuDong onDong={() => {}} />)
    await waitFor(() => expect(soLuot()).toBe(1))
    moDapAn(st, T0 + 3000, chamSo); WsGia.ds[0]!.nhan(viewBang(st))
    a.rerender(<Bang buoiId="b1" qid="q1" luot={4} tuDong onDong={() => {}} />)
    expect(soLuot()).toBe(1)
    a.rerender(<Bang buoiId="b1" qid="q1" luot={5} onDong={() => {}} />)
    await waitFor(() => expect(soLuot()).toBe(2))
    a.unmount()
  })
})

// 09/11 (lần 3) thầy «thoát app là báo động … to như báo cháy»; «chèn chữ khi thoát ra» (CSS bảng trùng tên lớp `.bb-*` của Hôm nay).
describe('bảng · báo cháy rời màn + CSS gói trong bảng', () => {
  it('phòng báo `roiNay` ⇒ lớp phủ báo cháy NGOÀI khung bảng, tên em to; em quay lại ⇒ tắt', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    const khung = document.createElement('div'); document.body.appendChild(khung)
    render(<Bang buoiId="b1" qid="q1" luot={1} onDong={() => {}} gocPortal={khung} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const st = phong(); moLuot(st, cau, T0); WsGia.ds[0]!.nhan(viewBang(st))
    WsGia.ds[0]!.nhan({ ...viewBang(st), roiNay: ['S2'] })
    const bao = await screen.findByRole('alert')
    expect(bao.closest('.bpu-bao-chay')!.parentElement).toBe(document.body) // nổi cả khi khung bảng ẩn (em đang lên bảng ở tờ cũ)
    expect(bao.textContent).toContain('Trần Gia Bảo')
    WsGia.ds[0]!.nhan({ ...viewBang(st), roiNay: [] })
    await waitFor(() => expect(document.querySelector('.bpu-bao-chay')).toBeNull())
  })
  it('mọi luật CSS của bảng có lớp `.bb-*` đều gói trong `.bpu-bang` (không đè màn Hôm nay)', async () => {
    const { readFileSync } = await import('node:fs')
    // 09/11 tháp lửa: tệp CSS mới bpu-thap.css cũng phải gói trong `.bpu-bang`.
    const css = ['bpu-bang.css', 'bpu-thap.css'].map((t) => readFileSync(require('node:path').resolve(__dirname, '../src/components/bpu/', t), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
    const tach = (sel: string) => { const ra: string[] = []; let d = 0, cu = ''; for (const ch of sel) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { ra.push(cu); cu = '' } else cu += ch } return [...ra, cu] }
    const chon = [...css.matchAll(/([^{}@;]+)\{/g)].flatMap((m) => tach(m[1]!)).map((x) => x.trim()).filter((x) => x.includes('.bb-'))
    expect(chon.length).toBeGreaterThan(100)
    expect(chon.filter((x) => !/\.bpu-bang\b|\[data-bpu-bang\]/.test(x))).toEqual([])
  })
})

// 09/11 THÁP LỬA (thầy chốt «chốt bản ống nghiệm nhé»; bản vẽ docs/ban-ve-bpu-dua-top-0911, phương án A): màn câu không còn đề, đội đua bằng kJ trong ống nghiệm.
describe('bảng · tháp lửa (thầy chốt 09/11)', () => {
  const TEN = ['Nguyễn Lan Anh', 'Trần Quốc Bảo', 'Lê Thanh Tâm', 'Phạm Hà My', 'Vũ Minh Khôi', 'Đỗ Bảo Ngọc', 'Bùi Gia Huy', 'Hồ Tuấn Kiệt', 'Ngô Phương Thảo', 'Đinh Ngọc Hân', 'Lý Hải Đăng', 'Mai Minh Anh', 'Tạ Khánh Linh', 'Hà Bảo Hân', 'Lưu Đức Duy', 'Cao Mai Phương']
  const lop = (n: number, vang: number[] = []) => taoPhong({ buoiId: 'b1', lop: '12A1', nay: T0, ds: Array.from({ length: n }, (_, i) => ({ sbd: `E${i}`, ten: TEN[i]!, coMat: !vang.includes(i), luc: T0 + i })) })
  const moBang = async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    render(<Bang buoiId="b1" qid="q1" luot={1} onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    return WsGia.ds[0]!
  }
  const dichY = (el: Element | null) => Number(/translateY\((-?[\d.]+)px\)/.exec((el as HTMLElement).style.transform)?.[1])

  it('đang làm: KHÔNG chiếu đề; ống đội cao theo kJ, đội dẫn đầu «Dẫn đầu»; em chưa vào không hiện trên dải tên; em vừa gửi bừng sáng', async () => {
    const { kjDoi } = await import('../src/components/bpu/dua-top')
    const ws = await moBang()
    const st = lop(16, [15])
    st.ds.forEach((e, i) => { e.kj = (i * 37) % 200 })
    moLuot(st, cau, T0); ws.nhan(viewBang(st))
    await screen.findByText(/em đã gửi/)
    expect(document.body.textContent).not.toContain('Chất nào là amine bậc hai?')
    expect(document.querySelector('.bb-de-chu')).toBeNull()
    const v = viewBang(st), cot = [...document.querySelectorAll('.bb-tl-cot')]
    expect(cot).toHaveLength(4)
    const kj = [0, 1, 2, 3].map((d) => kjDoi(v, d)), dau = kj.indexOf(Math.max(...kj))
    expect(cot[dau]!.classList.contains('dan')).toBe(true)
    expect(cot[dau]!.textContent).toContain('Dẫn đầu')
    const y = cot.map((c) => dichY(c.querySelector('.bb-tl-day')))
    expect(Math.min(...y)).toBe(y[dau]) // chất lỏng đội nhiều kJ nhất dâng cao nhất
    for (const d of [0, 1, 2, 3]) expect(cot[d]!.querySelector('.bb-tl-chan .so')!.textContent).toContain(kj[d]!.toLocaleString('vi-VN'))
    expect(document.querySelectorAll('.bb-tl-o')).toHaveLength(15)
    expect(document.querySelector('.bb-tl-o[data-sbd="E15"]')).toBeNull()
    nhanTra(st, 'E0', 'B', T0 + 1000); ws.nhan(viewBang(st))
    await waitFor(() => expect(document.querySelector('.bb-tl-dem .so')!.textContent).toContain('1/15'))
    const o = document.querySelector('.bb-tl-o[data-sbd="E0"]')!
    expect(o.classList.contains('gui')).toBe(true)
    expect(o.classList.contains('vua')).toBe(true)
    // Em đang ở ngoài app (`roiNay`) ⇒ ô tên viền đỏ + nhãn chữ «Rời màn» (không chỉ bằng màu).
    ws.nhan({ ...viewBang(st), roiNay: ['E2'] })
    await waitFor(() => expect(document.querySelector('.bb-tl-o[data-sbd="E2"]')!.classList.contains('roi')).toBe(true))
    expect(document.querySelector('.bb-tl-o[data-sbd="E2"] .the-roi')!.textContent).toBe('Rời màn')
  })

  it('Bảng vàng top 6 theo kJ cả buổi + chuỗi đúng dài nhất (≥ 3)', async () => {
    const ws = await moBang()
    const st = lop(10)
    st.ds.forEach((e, i) => { e.kj = 1000 - ((i * 7) % 10) * 50 })
    st.ds[4]!.chuoi = 4
    moLuot(st, cau, T0); ws.nhan(viewBang(st))
    await screen.findByText(/em đã gửi/)
    const top = [...st.ds].sort((a, b) => b.kj - a.kj).slice(0, 6).map((e) => e.ten.split(' ').slice(-2).join(' '))
    expect([...document.querySelectorAll('.bb-tl-vang .bb-tl-hang .t')].map((x) => x.textContent)).toEqual(top)
    expect(document.querySelector('.bb-tl-chuoi')!.textContent).toContain('Minh Khôi · 4 câu đúng liền')
  })

  it('mở đáp án: đáp án gọn + số em đúng, vạch «trước», «+kJ lượt này», ▲ lên hạng, nhanh và đúng nhất tối đa 3 em; không nêu tên em sai', async () => {
    const ws = await moBang()
    const st = lop(5)
    st.ds[0]!.kj = 300; st.ds[1]!.kj = 200; st.ds[2]!.kj = 100
    moLuot(st, cau, T0)
    nhanTra(st, 'E3', 'B', T0 + 500); nhanTra(st, 'E2', 'B', T0 + 800); nhanTra(st, 'E4', 'B', T0 + 900); nhanTra(st, 'E1', 'A', T0 + 950); nhanTra(st, 'E0', 'B', T0 + 30000)
    ws.nhan(viewBang(st))
    await screen.findByText(/em đã gửi/)
    moDapAn(st, T0 + 40000, chamSo); ws.nhan(viewBang(st))
    await screen.findByText('Đáp án')
    expect(document.querySelector('.bb-tl-da')!.textContent).toContain('4/5 em đúng')
    expect(document.querySelectorAll('.bb-tl-cu').length).toBeGreaterThan(0)
    expect(document.querySelector('.bb-tl-cu')!.textContent).toMatch(/^trước /)
    expect(document.querySelectorAll('.bb-tl-chan .bb-tl-cong')).toHaveLength(2)
    expect(document.querySelector('.bb-tl-chan .bb-tl-cong')!.textContent).toMatch(/^\+[\d.]+ kJ lượt này$/)
    expect(screen.getByText(/Vượt năng lượng hoạt hoá/)).toBeTruthy()
    const nhanh = [...document.querySelectorAll('.bb-tl-nhanh .bb-tl-hang .t')].map((x) => x.textContent)
    expect(nhanh).toEqual(['Hà My', 'Thanh Tâm', 'Minh Khôi'])
    expect(document.querySelectorAll('.bb-tl-o .bb-tl-hc')).toHaveLength(3) // em đúng thứ 4 (E0) không có huy hiệu
    expect(document.querySelector('[aria-label^="Lên "]')).toBeTruthy() // Hà My từ hạng 4 lên
    // Tế nhị: em sai (Quốc Bảo) không có dấu riêng — trông như mọi em đã gửi.
    const sai = document.querySelector('.bb-tl-o[data-sbd="E1"]')!, dung0 = document.querySelector('.bb-tl-o[data-sbd="E0"]')!
    expect(sai.className).toBe(dung0.className)
    expect(document.querySelector('.bb-tl-nhanh')!.textContent).not.toContain('Quốc Bảo')
  })

  it('Trả lời ngắn ⇒ «Đáp số 2,24»; tự luận ⇒ «x em đã làm xong», không ô đáp án', async () => {
    const ws = await moBang()
    const st = lop(4)
    moLuot(st, { ...cau, qid: 'q3', phan: 'III', cau: { ...cau.cau, qid: 'q3', phan: 'III', choices: [] }, dung: '2.24' }, T0)
    nhanTra(st, 'E0', '2.24', T0 + 500); moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewBang(st))
    expect(await screen.findByText('Đáp số')).toBeTruthy()
    expect(screen.getByText('2,24')).toBeTruthy()
    moLuot(st, { ...cau, qid: 'q4', phan: 'III', tuLuan: true, cau: { ...cau.cau, qid: 'q4', phan: 'III', choices: [] }, dung: '' }, T0 + 9000)
    nhanTra(st, 'E1', 'xong', T0 + 9500); nhanTra(st, 'E2', 'xong', T0 + 9600); moDapAn(st, T0 + 12000, chamSo); ws.nhan(viewBang(st))
    await waitFor(() => expect(document.querySelector('.bb-tl-da')!.textContent).toContain('2 em đã làm xong'))
    expect(screen.queryByText('Đáp án')).toBeNull()
  })

  it('±kJ (bienDong): tin đầu chỉ ghi nhớ; id mới ⇒ nhãn ±kJ + lý do dưới ống đội (không bay được ⇒ hiện tĩnh)', async () => {
    const ws = await moBang()
    const st = lop(4)
    moLuot(st, cau, T0)
    const d0 = st.ds[0]!.doi, d1 = st.ds[1]!.doi
    const b1 = { id: 1, sbd: 'E0', doi: d0, kjEm: 100, kjDoi: 0, lyDo: 'Đúng câu trước', luc: T0 }
    ws.nhan({ ...viewBang(st), bienDong: [b1] })
    await screen.findByText(/em đã gửi/)
    expect(document.querySelector('.bb-tl-ly')).toBeNull()
    ws.nhan({ ...viewBang(st), bienDong: [b1, { id: 2, sbd: 'E0', doi: d0, kjEm: 100, kjDoi: 30, lyDo: 'Đúng · nhanh thứ 1', luc: T0 + 1 }] })
    await waitFor(() => expect(document.querySelector(`.bb-tl-cot[data-doi="${d0}"] .bb-tl-ly`)!.textContent).toBe('+130 kJ · Đúng · nhanh thứ 1'))
    ws.nhan({ ...viewBang(st), bienDong: [{ id: 3, sbd: null, doi: d1, kjEm: 0, kjDoi: -50, lyDo: 'Rời màn', luc: T0 + 2 }] })
    await waitFor(() => expect(document.querySelector(`.bb-tl-cot[data-doi="${d1}"] .bb-tl-ly.tru`)!.textContent).toBe('−50 kJ · Rời màn'))
  })
})
