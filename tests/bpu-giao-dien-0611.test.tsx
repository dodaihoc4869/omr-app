// Bình Phản Ứng — giao diện máy em + bảng chiếu với phòng giả (WebSocket giả, dữ liệu từ luật phòng thật): đi đủ các màn, không vỡ, chữ đúng chuẩn.
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewBang, viewEm, ketThuc } from '../src/lib/bpu/phong'

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
    expect(screen.getByRole('button', { name: 'Rời Bình Phản Ứng' })).toBeTruthy()
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
    moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewEm(st, 'S1'))
    act(() => { screen.getByRole('button', { name: 'Rời Bình Phản Ứng' }).click() })
    expect(screen.queryByRole('dialog', { name: 'Bình Phản Ứng' })).toBeNull()
    expect(onDong).not.toHaveBeenCalled()
    expect(WsGia.ds).toHaveLength(1) // vẫn một kết nối, không nối lại
    moLuot(st, { ...cau, qid: 'q2' }, T0 + 9000); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByRole('button', { name: 'Gửi đáp án' })).toBeTruthy()
    act(() => { screen.getByRole('button', { name: 'Gửi đáp án' }) })
    // đang thi ⇒ lượt mới KHÔNG tự hiện
    moDapAn(st, T0 + 12000, chamSo); ws.nhan(viewEm(st, 'S1'))
    act(() => { screen.getByRole('button', { name: 'Rời Bình Phản Ứng' }).click() })
    thi = true
    moLuot(st, { ...cau, qid: 'q3' }, T0 + 15000); ws.nhan(viewEm(st, 'S1'))
    await new Promise((r) => setTimeout(r, 30))
    expect(screen.queryByRole('dialog', { name: 'Bình Phản Ứng' })).toBeNull()
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
    moDapAn(st, T0 + 3000, chamSo); ws.nhan(viewBang(st))
    expect(await screen.findByText('Đáp án')).toBeTruthy()
    // 07/11: không còn phím X «Kết thúc buổi chơi» (một chỗ kết thúc: «Kết thúc buổi học»); V mở vinh danh.
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' })) })
    expect(ws.gui.some((t) => t.includes('ket-thuc'))).toBe(false)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' })) })
    expect(await screen.findByText('Vô địch buổi hôm nay')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/tinh thể|Cần kèm/)
  })
  it('bước điểm danh: mã + QR hiện ngay; phòng không mở được (lớp có ca mở) ⇒ lùi bản chiếu cũ', async () => {
    const { default: Bang } = await import('../src/components/bpu/BangBinhPhanUng')
    traMo.v = { ok: true, du: { ok: false, lyDo: 'ca-mo', error: 'Lớp đang có ca kiểm tra mở.' } }
    const onTat = vi.fn()
    render(<Bang buoiId="b1" ma="482715" linkQr="https://app/hs?diem-danh=482715" onDong={() => {}} onTat={onTat} />)
    expect(screen.getByText('Vào lớp: mở app, nhập mã')).toBeTruthy()
    await waitFor(() => expect(onTat).toHaveBeenCalled())
    traMo.v = { ok: true, du: { ok: true, ve: 've-thay' } }
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
    act(() => { screen.getByRole('button', { name: /Câu tiếp/ }).click() })
    expect(onToi).toHaveBeenCalledTimes(2)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })) })
    expect(onToi).toHaveBeenLastCalledWith(-1)
    // Esc chỉ đóng bảng: không lan tới khung tờ chiếu bên dưới (thầy 07/11 «bấm esc xong không có chỗ mở lại tờ chiếu»)
    const toNghe = vi.fn()
    window.addEventListener('keydown', toNghe)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(toNghe).not.toHaveBeenCalled()
    window.removeEventListener('keydown', toNghe)
    const o = document.querySelector('.bb-o .ten')!
    expect(o.textContent).toBe(st.ds[0]!.ten.split(' ').at(-1))
  })
  it('phương án ẩn mặc định: M hiện / ẩn (không mở đáp án); O mở đáp án; mở đáp án KHÔNG tự hiện phương án bên trái; Đúng–sai ⇒ hai hàng ống Đúng / Sai', async () => {
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
    expect(document.querySelector('.bb-pa')).toBeNull() // bên trái chỉ đề; kết quả ở cột phải
    const ds = { qid: 'q2', phan: 'II' as const, tuLuan: false, cau: { ...cau.cau, qid: 'q2', phan: 'II', choices: [], ideas: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'] }, dung: 'DSSD', hanGiay: 60 }
    moLuot(st, ds, T0 + 9000); nhanTra(st, 'S1', 'DSSS', T0 + 10000); nhanTra(st, 'S2', 'DSSD', T0 + 10000); moDapAn(st, T0 + 12000, chamSo); ws.nhan(viewBang(st))
    // Đúng–sai: HAI HÀNG ống (thầy 07/11) — hàng Đúng rồi hàng Sai, mỗi ống «ý) N em»; ống của đáp án đúng có lớp `dung`.
    await screen.findByText('Sai')
    const o = [...document.querySelectorAll('.bb-ong.gon')]
    expect(o.map((x) => x.textContent)).toEqual(['a) 2 em', 'b) 0 em', 'c) 0 em', 'd) 1 em', 'a) 0 em', 'b) 2 em', 'c) 2 em', 'd) 1 em'])
    expect(o.map((x) => x.classList.contains('dung'))).toEqual([true, false, false, true, false, true, true, false])
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
