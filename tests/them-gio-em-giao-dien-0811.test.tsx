// THÊM GIỜ CHO TỪNG EM — giao diện (thầy 08/11, docs/ban-ve-them-gio-em-0811): chạm em ĐANG LÀM mở tấm thêm giờ, em khác mở hồ sơ;
// có bước hỏi lại; lỗi thì báo thật và KHÔNG tự bấm lại; hạn riêng + phút đã thêm tính đúng như máy chủ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import TheoDoiCa from '../src/components/ca-thi/TheoDoiCa'
import ThemGioEm from '../src/components/ca-thi/ThemGioEm'
import { hanRiengEm } from '../src/lib/them-gio-em'

afterEach(() => { cleanup(); vi.useRealTimers() })
const T0 = Date.parse('2026-11-08T03:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()

describe('hanRiengEm — cùng công thức máy chủ', () => {
  it('ca tính giờ riêng: phút thêm = hạn − (vào + thời gian ca); vào muộn tính từ lúc ca bắt đầu', () => {
    const h = hanRiengEm({ vaoLuc: iso(T0 + 8 * 60_000), hetGioLuc: iso(T0 + 63 * 60_000) }, { thoiGianPhut: 45, batDau: iso(T0) })
    expect(h).toEqual({ hetLucMs: T0 + 63 * 60_000, themPhutEm: 10, vaoMuonPhut: 8 })
  })
  it('ca «cả phòng cùng hết giờ»: mốc là giờ bắt đầu chung, em vào phòng chờ sớm không bị tính là được thêm', () => {
    const h = hanRiengEm({ vaoLuc: iso(T0 - 5 * 60_000), hetGioLuc: iso(T0 + 45 * 60_000) }, { thoiGianPhut: 45, dongBoGio: true, batDauThiLuc: iso(T0) })
    expect(h.themPhutEm).toBe(0)
  })
  it('hạn không đọc được ⇒ không có đồng hồ riêng', () => {
    expect(hanRiengEm({ vaoLuc: iso(T0), hetGioLuc: '' }, { thoiGianPhut: 45 }).hetLucMs).toBeNull()
  })
})

const emMau = [
  { sbd: 'S1', hoTen: 'Nguyễn Lan Anh', tt: 'dang_lam', daLam: 3, tongCau: 10, soLanRoiMan: 0, tongGiayRoiMan: 0, diem: null, hetLucMs: Date.now() + 3 * 60_000, themPhutEm: 5 },
  { sbd: 'S2', hoTen: 'Phạm Quốc Bảo', tt: 'da_nop', daLam: 10, tongCau: 10, soLanRoiMan: 0, tongGiayRoiMan: 0, diem: 8 },
]
const goc = { tenCa: 'Ca', maCa: 'C1', link: 'x', daChepLink: false, onChepLink: () => {}, moLuc: '', hetHanVao: '', thoiGianPhut: 45, congBoChu: '', phamViChu: '', conGiay: null, soChuaVao: null, nguongLan: 3, dangTai: false, dangDuyet: null, onLamMoi: () => {}, onMoKhoa: () => {}, onChieuMa: () => {}, onKetThuc: () => {}, dangLamNgay: 1 }

describe('TheoDoiCa: chạm em đang làm ⇒ thêm giờ', () => {
  it('em đang làm hiện «Còn mm:ss» + «+N′»; chạm mở tấm thêm giờ, chạm em đã nộp mở hồ sơ', () => {
    const themGio = vi.fn(), xem = vi.fn()
    render(<TheoDoiCa {...(goc as never)} em={emMau as never} onXemEm={xem} onThemGioEm={themGio} />)
    const nhan = document.querySelector('.ct-gio-em')!
    expect(nhan.textContent).toMatch(/Còn 0[23]:\d\d/)
    expect(nhan.classList.contains('sap-het')).toBe(true)
    expect(nhan.textContent).toContain('+5′')
    fireEvent.click(screen.getByText('Nguyễn Lan Anh').closest('button')!)
    expect(themGio).toHaveBeenCalledWith('S1')
    fireEvent.click(screen.getByText('Phạm Quốc Bảo').closest('button')!)
    expect(xem).toHaveBeenCalledWith('S2')
  })
  it('không truyền onThemGioEm ⇒ chạm em đang làm vẫn mở hồ sơ như cũ', () => {
    const xem = vi.fn()
    render(<TheoDoiCa {...(goc as never)} em={emMau as never} onXemEm={xem} />)
    fireEvent.click(screen.getByText('Nguyễn Lan Anh').closest('button')!)
    expect(xem).toHaveBeenCalledWith('S1')
  })
})

const em = { sbd: 'S1', hoTen: 'Nguyễn Lan Anh', vaoMuonPhut: 8, hetLucMs: Date.now() + 3 * 60_000, themPhutEm: 0, daLam: null, tongCau: null }

describe('ThemGioEm: chọn ⇒ hỏi lại ⇒ cộng', () => {
  it('bấm +10 chưa gọi máy chủ; Đồng ý mới gọi đúng 10 phút; xong báo đã thêm', async () => {
    const chay = vi.fn(async (p: number) => ({ phut: p, themPhutEm: p, hetGioLuc: iso(em.hetLucMs + p * 60_000) }))
    const xong = vi.fn()
    render(<ThemGioEm em={em} chay={chay} onDong={() => {}} onHoSo={() => {}} onXong={xong} />)
    fireEvent.click(screen.getByRole('button', { name: /\+10/ }))
    expect(chay).not.toHaveBeenCalled()
    expect(screen.getByText(/Hạn nộp mới/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý thêm 10 phút' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Đã thêm 10 phút cho Lan Anh'))
    expect(chay).toHaveBeenCalledTimes(1)
    expect(chay).toHaveBeenCalledWith(10)
    expect(xong).toHaveBeenCalledTimes(1)
  })
  it('máy chủ báo lỗi ⇒ hiện đúng câu lỗi, không tự gọi lại', async () => {
    const chay = vi.fn(async () => { throw new Error('Em đã nộp bài — không thêm giờ.') })
    render(<ThemGioEm em={em} chay={chay} onDong={() => {}} onHoSo={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /\+5/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý thêm 5 phút' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Em đã nộp bài — không thêm giờ.'))
    expect(chay).toHaveBeenCalledTimes(1)
  })
  it('đã thêm 20 phút ⇒ ô +15 chìm (vượt trần 30 phút mỗi em)', () => {
    render(<ThemGioEm em={{ ...em, themPhutEm: 20 }} chay={vi.fn()} onDong={() => {}} onHoSo={() => {}} />)
    expect((screen.getByRole('button', { name: /\+15/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /\+10/ }) as HTMLButtonElement).disabled).toBe(false)
  })
})
