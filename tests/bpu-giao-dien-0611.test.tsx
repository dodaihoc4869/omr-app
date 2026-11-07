// Bình Phản Ứng — giao diện máy em + bảng chiếu với phòng giả (WebSocket giả, dữ liệu từ luật phòng thật): đi đủ các màn, không vỡ, chữ đúng chuẩn.
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiLenBang, lamBang, moDapAn, moLuot, nhanTra, taoPhong, viewBang, viewEm, ketThuc } from '../src/lib/bpu/phong'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const traMo = vi.hoisted(() => ({ v: { ok: true, du: { ok: true, ve: 've-thay' } } as Record<string, unknown> }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: async () => traMo.v }))
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
  it('«Em chưa biết làm»: bấm hai lần mới gửi cờ kb; sau đó hiện «Em đã báo: chưa biết làm»', async () => {
    const { default: Man } = await import('../src/components/bpu/ManBinhPhanUng')
    render(<Man token="tok" buoiId="b1" onDong={() => {}} />)
    await waitFor(() => expect(WsGia.ds.length).toBe(1))
    const ws = WsGia.ds[0]!
    const st = phong(); moLuot(st, cau, T0); ws.nhan(viewEm(st, 'S1'))
    const nut = await screen.findByRole('button', { name: 'Em chưa biết làm' })
    act(() => { nut.click() })
    expect(ws.gui.some((t) => t.includes('"kb":true'))).toBe(false)
    act(() => { screen.getByRole('button', { name: 'Bấm lần nữa để báo thầy' }).click() })
    expect(ws.gui.some((t) => t.includes('"kb":true'))).toBe(true)
    nhanTra(st, 'S1', '', T0 + 1000, true); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Em đã báo: chưa biết làm')).toBeTruthy()
    moDapAn(st, T0 + 5000, chamSo); ws.nhan(viewEm(st, 'S1'))
    expect(await screen.findByText('Cảm ơn em đã thành thật')).toBeTruthy()
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
})
