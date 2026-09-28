// Thầy 28/09: "không có chỗ xem những chiến dịch đã giao ở app gv" ⇒ khung "Chiến dịch đã giao" ở màn Ca kiểm tra.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))

import DsChienDichDaGiao, { chuHan, trangThaiHien } from '../src/components/chien-dich/DsChienDichDaGiao'
import { KHOA_CHON_CHIEN_DICH } from '../src/components/chien-dich/LenBangChienDich'
import { useAppStore } from '../src/store/appStore'

const CD = { id: 'cd-1', ten: 'Chiến dịch luyện', lop: 'Chưa xếp lớp', maDe: ['DE'], hanNop: '2026-10-05', theLucNgay: 60, huyetChien: true, maCa: null, taoLuc: 'x', trangThai: 'dang_chay', soCau: 170, soEm: 1, hetHan: false }
beforeEach(() => {
  goi.mockReset()
  goi.mockImplementation(async (_d: string, b: Record<string, unknown>) => {
    if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: [CD] } }
    if (b.action === 'huy' || b.action === 'dong') return { ok: true, du: { ok: true } }
    return { ok: false, loai: 'tu_choi', chu: 'lạ' }
  })
  sessionStorage.clear()
})
afterEach(cleanup)

describe('khung Chiến dịch đã giao', () => {
  it('bảng số liệu (bản vẽ 28/09): tên, số câu, lớp, số em, hạn nộp, trạng thái; máy chủ cũ không có thongKe ⇒ ô số "—"; xin danh-sach kèm thongKe', async () => {
    render(<DsChienDichDaGiao />)
    expect(await screen.findByText('Chiến dịch luyện')).toBeTruthy()
    expect(goi.mock.calls.some(([, b]) => b.action === 'danh-sach' && b.thongKe === true)).toBe(true)
    const muc = document.querySelector('.cd-muc-cd')!
    expect(muc.textContent).toContain('170 câu')
    expect(muc.textContent).toContain('Chưa xếp lớp1 em')
    expect(muc.textContent).toContain('còn 7 ngày')
    expect(muc.textContent).toContain('Đang chạy')
    expect(muc.textContent).toContain('—')
    const dau = [...document.querySelectorAll('thead th')].map((x) => x.textContent)
    expect(dau.slice(0, 9)).toEqual(['Chiến dịch', 'Lớp', 'Đã làm qua', 'Thành thạo', 'Đúng nhịp', 'Quá tải hôm nay', 'Cần dạy lại', 'Hạn nộp', 'Trạng thái'])
  })
  it('có thongKe: số liệu từng cột, thẻ số tổng, lọc theo trạng thái (Chậm nhịp / Chờ buổi chữa / Đã kết thúc), tìm theo tên', async () => {
    const tk = (coXat: number, thanhThao: number, dungNhip: number, quaTai: number, cau: number, luot: number, mucCan = 0.5) => ({ coXat, thanhThao, dungNhip, emLamQuaDu: 0, quaTai, canDayLaiCau: cau, canDayLaiLuot: luot, mucCanHomNay: mucCan })
    const ds = [
      { ...CD, id: 'a', ten: 'Carbohydrate', lop: '12 - Tinh Hoa', soEm: 44, thongKe: tk(0.72, 0.46, 39, 3, 9, 23) },
      { ...CD, id: 'b', ten: 'Ester', lop: '12 - Lớp Thường', soEm: 66, thongKe: tk(0.3, 0.2, 52, 7, 11, 30) },
      { ...CD, id: 'c', ten: 'Amine', lop: '11 - Tinh Hoa', soEm: 38, hanNop: '2026-09-26', hetHan: true, thongKe: tk(0.97, 0.63, 30, 0, 8, 12) },
      { ...CD, id: 'd', ten: 'Kim loại', lop: '12 - Lớp Thường', soEm: 66, trangThai: 'da_dong', hanNop: '2026-09-18', hetHan: true, thongKe: tk(0.95, 0.69, 0, 0, 0, 0) },
    ]
    goi.mockImplementation(async (_d: string, b: Record<string, unknown>) =>
      b.action === 'danh-sach' ? { ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: ds } } : { ok: false, loai: 'tu_choi', chu: 'lạ' },
    )
    const { container } = render(<DsChienDichDaGiao onGiaoMoi={vi.fn()} />)
    await screen.findByText('Carbohydrate')
    const so = (k: string) => container.querySelector(`[data-so="${k}"]`)?.textContent
    expect(so('dang-chay')).toBe('2/ 4 chiến dịch')
    expect(so('thanh-thao-tb')).toBe(`${Math.round(((0.46 * 44 + 0.2 * 66) / 110) * 100)}% câu`)
    expect(so('qua-tai')).toBe('10em')
    expect(so('can-day-lai')).toBe('28câu') // chỉ chiến dịch chưa kết thúc: 9 + 11 + 8
    const hang = (ten: string) => screen.getByText(ten).closest('tr') as HTMLElement
    expect(hang('Carbohydrate').textContent).toContain('72% số câu')
    expect(hang('Carbohydrate').textContent).toContain('39 / 44')
    expect(hang('Carbohydrate').querySelector('.cd-vach')).toBeTruthy() // vạch mức cần hôm nay
    expect(hang('Ester').textContent).toContain('Chậm nhịp')
    expect(hang('Amine').textContent).toContain('Chờ buổi chữa')
    expect(hang('Amine').textContent).toContain('hết hạn 2 ngày')
    expect(within(hang('Amine')).getByRole('button', { name: 'Mở buổi chữa' })).toBeTruthy()
    expect(hang('Kim loại').textContent).toContain('Đã kết thúc')
    expect(hang('Kim loại').textContent).toContain('69% cuối kỳ')
    expect(within(hang('Kim loại')).getByRole('button', { name: 'Xem lại' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '+ Giao chiến dịch mới' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Chờ buổi chữa · 1' }))
    expect(container.querySelectorAll('tbody tr.cd-muc-cd')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Đang chạy · 2' }))
    expect(container.querySelectorAll('tbody tr.cd-muc-cd')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Tất cả · 4' }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm chiến dịch' }), { target: { value: 'lớp thường' } })
    expect(container.querySelectorAll('tbody tr.cd-muc-cd')).toHaveLength(2)
    expect(chuHan('2026-09-28', '2026-09-28')).toBe('hết hôm nay 23:59')
    expect(trangThaiHien({ ...CD, thongKe: tk(0.1, 0, 0, 0, 0, 0, 0.3) } as never)).toBe('cham_nhip')
  })
  it('"Xem bảng" ghi id chiến dịch rồi mở màn Lên bảng', async () => {
    const setScreen = vi.fn()
    useAppStore.setState({ setScreen } as never)
    render(<DsChienDichDaGiao />)
    fireEvent.click(await screen.findByRole('button', { name: 'Xem bảng' }))
    expect(sessionStorage.getItem(KHOA_CHON_CHIEN_DICH)).toBe('cd-1')
    expect(setScreen).toHaveBeenCalledWith('goilenbang')
  })
  it('"Huỷ" hỏi lại rồi gọi lệnh huy và tải lại danh sách; bấm Không thì không gọi', async () => {
    render(<DsChienDichDaGiao />)
    const nut = await screen.findByRole('button', { name: 'Huỷ' })
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    fireEvent.click(nut)
    expect(goi.mock.calls.some(([, b]) => b.action === 'huy')).toBe(false)
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    fireEvent.click(nut)
    await waitFor(() => expect(goi.mock.calls.filter(([, b]) => b.action === 'huy')).toHaveLength(1))
    await waitFor(() => expect(goi.mock.calls.filter(([, b]) => b.action === 'danh-sach').length).toBeGreaterThanOrEqual(2))
  })
})
