// SỬA CÓ CHỦ ĐÍCH 14/10: giữ chip rải đều của Bảng chiến dịch hiện tại; bỏ giao/danh sách/đồng hồ cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import BangChienDich from '../src/components/chien-dich/BangChienDich'
import type { BangChienDich as DuBang } from '../src/components/chien-dich/api'

afterEach(cleanup)

describe('Phản biện #108 — chữ rải đều ở màn thầy', () => {
  it('Bảng chiến dịch: chip riêng "Rải đều câu mới: Bật/Tắt" cạnh trạng thái; ô Quá tải hôm nay trả dòng phụ như cũ', () => {
    const du = (raiDeu?: boolean): DuBang => ({
      chienDich: { id: 'cd-1', ten: 'Ester', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '', trangThai: 'dang_chay', soCau: 40, soEm: 0, ...(raiDeu === undefined ? {} : { raiDeu }) },
      homNay: '2026-10-01', hetHan: false, lop: { coXat: 0.5, thanhThao: 0.3, huyetChien: 1, canDayLaiCau: 0, canDayLaiLuot: 0 }, dang: [], em: [], canDayLai: [],
    }) as DuBang
    const { container, rerender } = render(<BangChienDich du={du()} nowMs={Date.UTC(2026, 9, 1, 3)} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    const chip = () => container.querySelector('[data-khoi="rai-deu"]')?.textContent ?? ''
    expect(chip()).toBe('Rải đều câu mới: Bật')
    const quaTai = container.querySelector('[data-so="qua-tai"]')!.parentElement!
    expect(quaTai.querySelector('.cd-kpi-phu')!.textContent).toBe('phải làm quá 40 lượt/ngày để kịp hạn')
    rerender(<BangChienDich du={du(false)} nowMs={Date.UTC(2026, 9, 1, 3)} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    expect(chip()).toBe('Rải đều câu mới: Tắt')
  })
  it('[phản biện vòng 2 #110] chiến dịch giao trước công tắc (thầy chưa đặt, raiDeuMacDinh) ⇒ chip "Bật (mặc định)"; thầy đã đặt ⇒ "Bật"', () => {
    const du = (them: Record<string, unknown>): DuBang => ({
      chienDich: { id: 'cd-1', ten: 'Ester', lop: '12A1', maDe: ['DE-A'], hanNop: '2026-10-04', theLucNgay: 40, huyetChien: true, maCa: null, taoLuc: '', trangThai: 'dang_chay', soCau: 40, soEm: 0, ...them },
      homNay: '2026-10-01', hetHan: false, lop: { coXat: 0.5, thanhThao: 0.3, huyetChien: 1, canDayLaiCau: 0, canDayLaiLuot: 0 }, dang: [], em: [], canDayLai: [],
    }) as DuBang
    const { container, rerender } = render(<BangChienDich du={du({ raiDeu: true, raiDeuMacDinh: true })} nowMs={Date.UTC(2026, 9, 1, 3)} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    const chip = () => container.querySelector('[data-khoi="rai-deu"]')?.textContent ?? ''
    expect(chip()).toBe('Rải đều câu mới: Bật (mặc định)')
    rerender(<BangChienDich du={du({ raiDeu: true, raiDeuMacDinh: false })} nowMs={Date.UTC(2026, 9, 1, 3)} dangChieu={false} onChieu={vi.fn(async () => true)} onDaChua={vi.fn()} />)
    expect(chip()).toBe('Rải đều câu mới: Bật')
  })
})
