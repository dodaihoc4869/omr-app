// BI-A PHẢN ỨNG GĐ2 · GIAO DIỆN ĐẤU VỚI BẠN (đặc tả 6.2, 8.2): Sảnh online (Điểm bàn, Đấu đơn với bạn, Đánh đôi, Nhập mã bàn, bạn đang ở Sảnh),
// tấm lời mời Nhận/Từ chối, Phòng chờ (mã bàn, ghế, chủ bàn Thêm A.I/Đổi chỗ/Bắt đầu), xếp câu khi phòng Bắt đầu, màn chơi online (Nhắn, mất kết nối).
// Máy chủ giả qua `datBoGoiBia`; WebSocket giả thay phòng đấu.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import BiaGame from '../src/game/bi-a/BiaGame'
import PhongCho, { type PhongCK } from '../src/game/bi-a/PhongCho'
import { datBoGoiBia } from '../src/game/bi-a/api'
import { congKhai, taoTran, type DauVaoGhe } from '../src/game/bi-a/tran'
import { biCuaGhe, chiaBi } from '../src/game/bi-a/luat'
import type { CauBia } from '../src/game/bi-a/dieu-khien'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })

const cau = (i: number): CauBia => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], dang: 'D', tenDang: `Dạng ${i}`, mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' } as unknown as CauBia)
const SANH = { ok: true, bat: true, online: true, diemBan: { diem: 1012, soVan: 3 }, chienDich: { ten: 'Ester – Lipid', hanNop: '2026-10-01', tong: 120 }, theLuc: { con: 26, tong: 40 }, doan: { con: 6 }, dao: { con: 20 }, tran: { con: 15, tong: 15, conDoan: 5, conDao: 10 }, giaoHuu: { mo: false, con: 2, toiDa: 2 } }
const VE = { van: 'VAN-1', ma: '4821', cheDo: 'don', loai: 'ban', ve: 'VE-SANH' }

class WsGia {
  static ds: WsGia[] = []
  readyState = 0
  gui: Record<string, unknown>[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(readonly url: string) { WsGia.ds.push(this) }
  send(s: string) { this.gui.push(JSON.parse(s)) }
  close() { this.readyState = 3 }
  mo() { act(() => { this.readyState = 1; this.onopen?.() }) }
  den(m: unknown) { act(() => { this.onmessage?.({ data: JSON.stringify(m) }) }) }
  rot() { act(() => { this.readyState = 3; this.onclose?.() }) }
}

let goi: ReturnType<typeof vi.fn>
let kich: Record<string, (d: Record<string, unknown>) => unknown>
const mayChu = (ghiDe: Record<string, (d: Record<string, unknown>) => unknown> = {}) => {
  kich = {
    'bia-sanh': () => SANH,
    'bia-loi-moi': () => ({ ban: [{ sbd: 'S2', ten: 'Minh Châu', conTran: 9 }], moi: [], phanHoi: [] }),
    'bia-tao-ban': () => VE,
    'bia-vao-ban': () => VE,
    'bia-moi': () => ({ id: 'MOI-1' }),
    'bia-tra-loi-moi': (d) => (d.nhan ? { ...VE, ma: null } : {}),
    'bia-xep-ban': () => ({ van: 'VAN-1', ghe: 0, session: 'ses-1', bi: biCuaGhe(chiaBi('don'), 0).map((ki, i) => ({ ki, cau: cau(i + 1) })), chot: cau(9), veTran: 'VE-TRAN' }),
    ...ghiDe,
  }
  goi = vi.fn(async (lenh: string, _t: string, d: Record<string, unknown> = {}) => ({ ok: true, ...((kich[lenh]?.(d) as object) ?? {}) }))
  datBoGoiBia(goi as never)
}
const lenh = (ten: string) => goi.mock.calls.filter((c) => c[0] === ten).map((c) => c[2] as Record<string, unknown>)
const ws = () => WsGia.ds.at(-1)!

beforeEach(() => {
  WsGia.ds = []
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('WebSocket', WsGia)
  mayChu()
})
afterEach(() => { cleanup(); datBoGoiBia(null); vi.unstubAllGlobals(); sessionStorage.clear() })

const phong = (o: Partial<PhongCK> = {}): PhongCK => ({ van: 'VAN-1', cheDo: 'don', loai: 'ban', ma: '4821', trangThai: 'cho', chuBan: 0, ghe: [{ ten: 'Khánh Linh', ai: false, noi: true, sanSang: false }, null], ...o })
function goiTT(toi: number) {
  const nguoi = (ten: string, sbd: string, ghe: number): DauVaoGhe => {
    const bi: DauVaoGhe['bi'] = {}
    for (const id of biCuaGhe(chiaBi('don'), ghe)) bi[id] = { qid: `q-${sbd}-${id}`, muc: 'TH', giay: 90 }
    return { ten, ai: false, sbd, bi, chot: { qid: `chot-${sbd}`, muc: 'VD', giay: 180 } }
  }
  const t = taoTran({ van: 'VAN-1', cheDo: 'don', loai: 'ban', ghe: [nguoi('Khánh Linh', 'S1', 0), nguoi('Minh Châu', 'S2', 1)], now: Date.now() })
  return { t: 'tt', toi, su: null, S: congKhai(t, Date.now()), chuMay: 0 }
}

describe('Sảnh Bi-a khi đã mở đấu với bạn (online)', () => {
  it('Điểm bàn, ba nút chơi với bạn bật (không còn "Sắp mở"), bạn đang ở Sảnh + Mời; báo có mặt kèm số câu còn', async () => {
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    expect(await screen.findByText('1012 · 3 ván')).toBeTruthy()
    for (const ten of [/^Đấu đơn với bạn$/, /^Đánh đôi 2 đấu 2/, /^Nhập mã bàn/, /^Đấu đơn với A\.I$/, /^Đánh đôi với A\.I/]) expect((screen.getByRole('button', { name: ten }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByText('Sắp mở')).toBeNull()
    expect(await screen.findByText('Minh Châu')).toBeTruthy()
    expect(screen.getByText('Bi-a còn 9 câu')).toBeTruthy()
    expect(lenh('bia-loi-moi')[0]).toEqual({ con: 15 })
    // Bỏ nút trùng "Tự chơi với A.I": nút A.I hiện thẳng trong thẻ "Chơi với A.I"; nút chính (vàng) duy nhất là "Đấu đơn với bạn".
    expect(screen.queryByRole('button', { name: /Tự chơi với A\.I/ })).toBeNull()
    expect(screen.getByRole('region', { name: 'Chơi với A.I' })).toBeTruthy()
    expect(Array.from(document.querySelectorAll('.bia-sanh .bia-nut-vang')).map((n) => n.textContent)).toEqual(['Đấu đơn với bạn'])
    expect(screen.getByText('1012 · 3 ván').previousElementSibling?.textContent).toBe('Điểm bàn')
    fireEvent.click(screen.getByRole('button', { name: /^Đánh đôi với A\.I/ }))
    await waitFor(() => expect(lenh('bia-xep-ban')[0]).toEqual({ loai: 'ai', cheDo: 'doi', soBi: 4 }))
  })

  it('hết câu Bi-a nhưng đã xong kế hoạch ⇒ nút thành "Bàn giao hữu với bạn", tạo bàn loai giao_huu', async () => {
    mayChu({ 'bia-sanh': () => ({ ...SANH, lyDoKhoa: 'xong_ke_hoach', message: 'Hôm nay em xong kế hoạch rồi.', tran: { con: 0, tong: 15 }, giaoHuu: { mo: true, con: 2, toiDa: 2 } }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /Bàn giao hữu với bạn · đấu đơn/ }))
    await waitFor(() => expect(lenh('bia-tao-ban')).toEqual([{ cheDo: 'don', loai: 'giao_huu' }]))
  })

  it('Đấu đơn với bạn ⇒ tạo bàn, nối phòng (gửi vé), Phòng chờ hiện mã bàn; Mời bạn; phòng Bắt đầu ⇒ xếp câu ⇒ san_sang; gói tt ⇒ màn chơi online: Nhắn, mất kết nối', async () => {
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /^Đấu đơn với bạn$/ }))
    await waitFor(() => expect(WsGia.ds).toHaveLength(1))
    expect(lenh('bia-tao-ban')).toEqual([{ cheDo: 'don', loai: 'ban' }])
    expect(ws().url).toBe('wss://may.test/bi-a/phong/VAN-1')
    expect(JSON.parse(sessionStorage.getItem('bia-ban-dang')!)).toMatchObject({ van: 'VAN-1' })
    expect(screen.getByText('Đang nối tới phòng đấu…')).toBeTruthy()
    ws().mo()
    expect(ws().gui[0]).toEqual({ t: 'vao', ve: 'VE-SANH' })
    ws().den({ t: 'phong', toi: 0, phong: phong() })
    expect(screen.getByText('Phòng chờ')).toBeTruthy()
    expect(screen.getByLabelText('Mã bàn 4 8 2 1').textContent).toBe('4821')
    expect(screen.getByText('Khánh Linh (em)')).toBeTruthy()
    expect(screen.getByText('Bạn vào bàn là vào ván ngay.')).toBeTruthy()
    fireEvent.click(await screen.findByRole('button', { name: 'Mời' }))
    await waitFor(() => expect(lenh('bia-moi')).toEqual([{ van: 'VAN-1', den: 'S2' }]))
    expect(await screen.findByText('Đã mời Minh Châu. Lời mời hết hạn sau 60 giây.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Đã mời' }) as HTMLButtonElement).disabled).toBe(true)
    // bạn vào ⇒ phòng Bắt đầu: xếp câu đúng bi ghế em rồi báo sẵn sàng
    ws().den({ t: 'phong', toi: 0, phong: phong({ trangThai: 'bat_dau', ghe: [{ ten: 'Khánh Linh', ai: false, noi: true, sanSang: false }, { ten: 'Minh Châu', ai: false, noi: true, sanSang: false }] }) })
    ws().den({ t: 'bat_dau', ghe: 0, veGhe: 'VE-GHE' })
    await waitFor(() => expect(ws().gui.at(-1)).toEqual({ t: 'san_sang', ve: 'VE-TRAN' }))
    expect(lenh('bia-xep-ban')).toEqual([{ veGhe: 'VE-GHE' }])
    expect(JSON.parse(sessionStorage.getItem('bia-xep:VAN-1')!).cauTheoBi.Na.qid).toBe('q1')
    // phòng gửi trạng thái đầu ⇒ màn chơi
    ws().den(goiTT(0))
    expect(await screen.findByRole('button', { name: 'Nhắn' })).toBeTruthy()
    expect(screen.getAllByText(/Minh Châu/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Nhắn' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cú đẹp!' }))
    expect(ws().gui.at(-1)).toEqual({ t: 'nhan', id: 1 })
    ws().den({ t: 'nhan', tu: 1, id: 6 })
    expect(await screen.findByText('Đấu lại không?')).toBeTruthy()
    ws().rot()
    expect(await screen.findByText('Mất kết nối · đang nối lại…')).toBeTruthy()
  })

  it('tấm lời mời: Từ chối ⇒ báo máy chủ, tấm tắt; Nhận ⇒ vào bàn bằng vé nhận được', async () => {
    let lan = 0
    mayChu({ 'bia-loi-moi': () => ({ ban: [], moi: lan++ < 1 ? [{ id: 'M1', tu: 'Minh Châu', cheDo: 'doi', loai: 'ban', conGiay: 42 }] : [], phanHoi: [] }) })
    const { unmount } = render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    const tam = await screen.findByRole('dialog', { name: 'Lời mời đấu Bi-a' })
    expect(tam.textContent).toContain('Minh Châu mời em đấu Bi-a · đánh đôi')
    expect(tam.textContent).toContain('còn 42 giây')
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    await waitFor(() => expect(lenh('bia-tra-loi-moi')).toEqual([{ id: 'M1', nhan: false }]))
    expect(screen.queryByRole('dialog', { name: 'Lời mời đấu Bi-a' })).toBeNull()
    unmount()
    mayChu({ 'bia-loi-moi': () => ({ ban: [], moi: [{ id: 'M2', tu: 'Minh Châu', cheDo: 'don', loai: 'ban', conGiay: 50 }], phanHoi: [] }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    await screen.findByRole('dialog', { name: 'Lời mời đấu Bi-a' })
    fireEvent.click(screen.getByRole('button', { name: 'Nhận' }))
    await waitFor(() => expect(WsGia.ds).toHaveLength(1))
    expect(lenh('bia-tra-loi-moi')).toEqual([{ id: 'M2', nhan: true }])
    ws().mo()
    expect(ws().gui[0]).toEqual({ t: 'vao', ve: 'VE-SANH' })
  })

  it('Nhập mã bàn: chỉ nhận 4 chữ số, đủ 4 mới bấm được "Vào bàn" ⇒ bia-vao-ban; mã sai ⇒ báo lỗi, ở lại Sảnh', async () => {
    mayChu({ 'bia-vao-ban': () => ({ message: 'Không thấy bàn có mã này (hoặc bàn đã đủ người).' }) })
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: /^Nhập mã bàn/ }))
    const o = screen.getByLabelText('Mã bàn (4 chữ số)') as HTMLInputElement
    fireEvent.change(o, { target: { value: '48a2' } })
    expect(o.value).toBe('482')
    expect((screen.getByRole('button', { name: 'Vào bàn' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(o, { target: { value: '48219' } })
    expect(o.value).toBe('4821')
    fireEvent.click(screen.getByRole('button', { name: 'Vào bàn' }))
    await waitFor(() => expect(lenh('bia-vao-ban')).toEqual([{ ma: '4821' }]))
    expect(await screen.findByText('Không thấy bàn có mã này (hoặc bàn đã đủ người).')).toBeTruthy()
    expect(WsGia.ds).toHaveLength(0)
  })

  it('đang có bàn online dở (tải lại trang) ⇒ thẻ "Vào lại bàn" nối lại bằng vé cũ; "Bỏ bàn đó" ẩn thẻ', async () => {
    sessionStorage.setItem('bia-ban-dang', JSON.stringify(VE))
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Vào lại bàn' }))
    await waitFor(() => expect(WsGia.ds).toHaveLength(1))
    ws().mo()
    expect(ws().gui[0]).toEqual({ t: 'vao', ve: 'VE-SANH' })
    cleanup()
    render(<BiaGame token="tk" hoTen="Khánh Linh" onVe={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ bàn đó' }))
    expect(screen.queryByRole('button', { name: 'Vào lại bàn' })).toBeNull()
    expect(sessionStorage.getItem('bia-ban-dang')).toBeNull()
  })
})

describe('Phòng chờ đánh đôi', () => {
  const doi = (ghe: PhongCK['ghe'], o: Partial<PhongCK> = {}) => phong({ cheDo: 'doi', ghe, ...o })
  const em = { ten: 'Khánh Linh', ai: false, noi: true, sanSang: false }
  const ve = (p: PhongCK, toi: number) => {
    const onGhe = vi.fn(), onBatDau = vi.fn()
    render(<PhongCho token="tk" phong={p} toi={toi} trangThaiNoi="noi" conTran={15} loi="" dangXep={false} onGhe={onGhe} onBatDau={onBatDau} onRoi={() => {}} />)
    return { onGhe, onBatDau }
  }
  it('chủ bàn: ghế trống có "Thêm A.I"; chưa đủ 4 ghế thì chưa Bắt đầu; Đổi chỗ chọn 2 ghế; ghế A.I có "Bỏ A.I"', () => {
    const { onGhe, onBatDau } = ve(doi([em, { ten: 'Minh Châu', ai: false, noi: false, sanSang: false }, null, { ten: 'A.I 3', ai: true, noi: true, sanSang: true }]), 0)
    expect(screen.getByText('Ghế 1 · Phe Kim loại · phá bàn')).toBeTruthy()
    expect(screen.getByText('Chủ bàn')).toBeTruthy()
    expect(screen.getByText('Đang nối lại')).toBeTruthy()
    const batDau = screen.getByRole('button', { name: 'Đủ 4 ghế mới bắt đầu' }) as HTMLButtonElement
    expect(batDau.disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm A.I' }))
    expect(onGhe).toHaveBeenLastCalledWith('them_ai', 2)
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ A.I' }))
    expect(onGhe).toHaveBeenLastCalledWith('bo_ai', 3)
    fireEvent.click(screen.getAllByRole('button', { name: 'Đổi chỗ' })[0]!)
    expect(screen.getByRole('button', { name: 'Huỷ' })).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Đổi vào đây' })[1]!)
    expect(onGhe).toHaveBeenLastCalledWith('doi_cho', 0, 2)
    expect(onBatDau).not.toHaveBeenCalled()
  })
  it('đủ 4 ghế ⇒ chủ bàn bấm Bắt đầu; bạn (không phải chủ) không có nút xếp ghế, chỉ chờ', () => {
    const du = doi([em, { ten: 'Minh Châu', ai: false, noi: true, sanSang: false }, { ten: 'A.I 2', ai: true, noi: true, sanSang: true }, { ten: 'A.I 3', ai: true, noi: true, sanSang: true }])
    const { onBatDau } = ve(du, 0)
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }))
    expect(onBatDau).toHaveBeenCalledTimes(1)
    cleanup()
    ve(du, 1)
    expect(screen.queryByRole('button', { name: /Bắt đầu|Thêm A\.I|Đổi chỗ|Bỏ A\.I/ })).toBeNull()
    expect(screen.getByText('Chờ chủ bàn bấm Bắt đầu.')).toBeTruthy()
    expect(screen.getByText('Minh Châu (em)')).toBeTruthy()
  })
})
