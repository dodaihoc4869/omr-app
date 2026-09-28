// Thầy 28/09: chiến dịch ĐANG MỞ có nút "Chỉnh sửa" ⇒ hộp M3 thêm đề / thêm bớt em / sửa hạn, tóm tắt thay đổi trước khi lưu,
// nút "Lưu" mờ đi khi đang lưu nhưng GIỮ NGUYÊN chữ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))

import DsChienDichDaGiao from '../src/components/chien-dich/DsChienDichDaGiao'
import { useAppStore } from '../src/store/appStore'

const CD = { id: 'cd-1', ten: 'Chiến dịch luyện', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-05', theLucNgay: 60, huyetChien: true, maCa: null, taoLuc: 'x', trangThai: 'dang_chay', soCau: 6, soEm: 2, hetHan: false }
const EM = [
  { sbd: 'S1', hoTen: 'An', lop: '12', khoi: '12', tenLop: '12A1' },
  { sbd: 'S2', hoTen: 'Bảo', lop: '12', khoi: '12', tenLop: '12A1' },
  { sbd: 'S3', hoTen: 'Chi', lop: '12', khoi: '12', tenLop: '12A2' },
]
let choLuu: ((v: unknown) => void) | null = null

beforeEach(() => {
  goi.mockReset()
  choLuu = null
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/chien-dich') {
      if (b.action === 'danh-sach') return { ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: [CD, { ...CD, id: 'cd-2', ten: 'Đã xong', trangThai: 'da_dong', hetHan: true }] } }
      if (b.action === 'ds-em') return { ok: true, du: { ok: true, em: EM } }
    }
    if (duong === '/gv/chien-dich/sua') {
      if (b.action === 'doc') return { ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: { ...CD, sbd: ['S1', 'S2'], theLucNgay: 12 }, nhatKy: [] } }
      const kq = {
        ok: true, tomTat: 'x', themMaDe: [], toKhongCoCauMoi: [], soCauTheoTo: {}, soCauCu: 6, soCauThem: 0, soCauSau: 6,
        themSbd: (b.themSbd as string[]) ?? [], botSbd: (b.botSbd as string[]) ?? [], soEmSau: 3, hanCu: '2026-10-05', hanNop: String(b.hanNop ?? '2026-10-05'), moLai: false,
        ...(b.hanNop === '2026-10-02'
          ? { theLucCu: 12, theLucNgay: (b.theLucNgay as number) ?? 15, theLucCan: 15, tuNang: b.theLucNgay == null, chuaKipHan: ((b.theLucNgay as number) ?? 15) < 15 }
          : { theLucCu: 12, theLucNgay: 12, theLucCan: 3, tuNang: false, chuaKipHan: false }),
      }
      if (b.action === 'xem-truoc') return { ok: true, du: kq }
      if (b.action === 'luu') return new Promise((r) => { choLuu = r }).then(() => ({ ok: true, du: { ...kq, id: 'cd-1', tomTat: '+1 em, hạn 05/10 → 07/10' } }))
    }
    return { ok: false, loai: 'tu_choi', chu: 'lạ' }
  })
})
afterEach(cleanup)
const oHan = () => waitFor(() => {
  const x = document.querySelector('[data-khoi="sua-chien-dich"] input[type="date"]') as HTMLInputElement | null
  if (!x) throw new Error('chưa có ô hạn')
  return x
})

describe('nút Chỉnh sửa chiến dịch đang mở', () => {
  it('chỉ chiến dịch đang mở có nút "Chỉnh sửa"', async () => {
    render(<DsChienDichDaGiao />)
    await screen.findByText('Chiến dịch luyện')
    const nut = screen.getAllByRole('button', { name: 'Chỉnh sửa' })
    expect(nut).toHaveLength(1)
    expect(nut[0]!.closest('tr')!.textContent).toContain('Chiến dịch luyện')
  })

  it('thêm em + sửa hạn ⇒ tóm tắt "+1 em, hạn 05/10 → 07/10"; Lưu mờ đi khi đang lưu, giữ chữ; lưu xong đóng hộp, báo, tải lại', async () => {
    const toast = vi.fn()
    useAppStore.setState({ showToast: toast } as never)
    render(<DsChienDichDaGiao />)
    await screen.findByText('Chiến dịch luyện')
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }))
    expect(await screen.findByRole('dialog', { name: 'Chỉnh sửa: Chiến dịch luyện' })).toBeTruthy()
    const han = await oHan()
    expect(han.value).toBe('2026-10-05')
    const luu = screen.getByRole('button', { name: 'Lưu' }) as HTMLButtonElement
    expect(luu.disabled).toBe(true) // chưa đổi gì
    expect(document.querySelector('[data-khoi="tom-tat-sua"]')!.textContent).toContain('Chưa có thay đổi nào')

    // Thêm em S3 qua bộ chọn Khối › Lớp › Em (dùng lại của màn Giao).
    await waitFor(() => expect(screen.getByRole('button', { name: /Chọn em/ })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /Chọn em/ }))
    const tim = document.querySelector('.cd-tam-chon input[type="search"]') as HTMLInputElement
    fireEvent.change(tim, { target: { value: 'Chi' } })
    fireEvent.click(await screen.findByRole('checkbox', { name: /Chi/ }))
    fireEvent.click(document.querySelector('.cd-nut-mo-chon') as HTMLElement) // đóng tấm chọn em
    fireEvent.change(han, { target: { value: '2026-10-07' } })
    expect(document.querySelector('[data-khoi="tom-tat-sua"]')!.textContent).toContain('+1 em, hạn 05/10 → 07/10')

    await waitFor(() => expect(luu.disabled).toBe(false), { timeout: 2000 })
    expect(goi.mock.calls.some(([d, b]) => d === '/gv/chien-dich/sua' && b.action === 'xem-truoc' && JSON.stringify(b.themSbd) === '["S3"]' && b.hanNop === '2026-10-07')).toBe(true)

    fireEvent.click(luu)
    await waitFor(() => expect(luu.disabled).toBe(true))
    expect(luu.textContent).toBe('Lưu')
    const goiLuu = goi.mock.calls.find(([d, b]) => d === '/gv/chien-dich/sua' && b.action === 'luu')!
    expect(goiLuu[1]).toMatchObject({ id: 'cd-1', themSbd: ['S3'], hanNop: '2026-10-07' })
    expect(goiLuu[1].botSbd).toBeUndefined()
    expect(goiLuu[1].themMaDe).toBeUndefined()

    const soDanhSach = goi.mock.calls.filter(([, b]) => b.action === 'danh-sach').length
    choLuu!(null)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Chỉnh sửa: Chiến dịch luyện' })).toBeNull())
    expect(toast).toHaveBeenCalledWith('Đã lưu chiến dịch: +1 em, hạn 05/10 → 07/10', 'success')
    await waitFor(() => expect(goi.mock.calls.filter(([, b]) => b.action === 'danh-sach').length).toBeGreaterThan(soDanhSach))
  })

  it('hạn mới trước hôm nay ⇒ báo ngay cạnh ô, không cho lưu', async () => {
    render(<DsChienDichDaGiao />)
    await screen.findByText('Chiến dịch luyện')
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }))
    const han = await oHan()
    fireEvent.change(han, { target: { value: '2026-09-20' } })
    expect(screen.getByText('Hạn nộp mới phải từ hôm nay trở đi')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Lưu' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('rút hạn phải nâng số câu/ngày ⇒ hiện "Số câu/ngày: 12 → 15 (để kịp hạn 02/10)"; thầy nhập tay thấp hơn ⇒ cảnh báo vàng, vẫn cho lưu', async () => {
    render(<DsChienDichDaGiao />)
    await screen.findByText('Chiến dịch luyện')
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa' }))
    const han = await oHan()
    fireEvent.change(han, { target: { value: '2026-10-02' } })
    await waitFor(() => expect(document.querySelector('[data-khoi="so-cau-ngay"]')?.textContent).toBe('Số câu/ngày: 12 → 15 (để kịp hạn 02/10)'), { timeout: 2000 })
    expect(document.querySelector('[data-khoi="tom-tat-sua"]')!.textContent).toContain('hạn 05/10 → 02/10, số câu/ngày 12 → 15')
    const o = screen.getByLabelText('Số câu mỗi ngày (một em)') as HTMLInputElement
    expect(o.value).toBe('15')
    fireEvent.change(o, { target: { value: '10' } })
    await waitFor(() => expect(screen.getByText(/Chưa kịp hạn: cần ít nhất 15 câu\/ngày/)).toBeTruthy(), { timeout: 2000 })
    expect(goi.mock.calls.some(([d, b]) => d === '/gv/chien-dich/sua' && b.action === 'xem-truoc' && b.theLucNgay === 10)).toBe(true)
    await waitFor(() => expect((screen.getByRole('button', { name: 'Lưu' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.change(o, { target: { value: '0' } })
    expect(screen.getByText('Số câu mỗi ngày phải là số nguyên từ 1 trở lên')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Lưu' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
