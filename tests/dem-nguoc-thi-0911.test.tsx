// ĐẾM NGƯỢC NGÀY THI 22/06/2027 (thầy 09/11 duyệt bản vẽ docs/ban-ve-dem-nguoc-0911) — src/components/hoc-tap/DemNguocThi.tsx.
// Khoá: chỉ lớp 12; số ngày theo NGÀY VIỆT NAM (đổi lúc 0 h VN); chặng màu; phần trăm năm học trong ống nghiệm; sau ngày thi không hiện.
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DemNguocThi from '../src/components/hoc-tap/DemNguocThi'
import { tinhDemNguoc } from '../src/components/hoc-tap/dem-nguoc'
import { laLop12 } from '../src/components/hoc-tap/la-lop-12'

// 0 h giờ Việt Nam của ngày d/m/y = 17 h UTC hôm trước.
const vn = (y: number, m: number, d: number, gio = 9) => Date.UTC(y, m - 1, d, gio - 7)

describe('tinhDemNguoc', () => {
  it('09/11/2026 ⇒ còn 225 ngày, ≈ 32 tuần, 6.300 câu, đã đi 22 % năm học, chặng thường', () => {
    expect(tinhDemNguoc(vn(2026, 11, 9))).toEqual({ con: 225, phanTram: 22, chang: 'binh', tuan: 32, cau: 6300 })
  })
  it('đổi ngày đúng 0 h giờ Việt Nam, không theo giờ UTC', () => {
    expect(tinhDemNguoc(Date.UTC(2026, 10, 9, 16, 59))!.con).toBe(225) // 23:59 VN ngày 09/11
    expect(tinhDemNguoc(Date.UTC(2026, 10, 9, 17, 0))!.con).toBe(224) // 0:00 VN ngày 10/11
  })
  it('chặng: ≤ 30 ngày nước rút · ≤ 7 tuần cuối · đúng ngày thi · qua ngày thi ⇒ null', () => {
    expect(tinhDemNguoc(vn(2027, 5, 30))).toMatchObject({ con: 23, chang: 'gap', phanTram: 92, tuan: 3, cau: 644 })
    expect(tinhDemNguoc(vn(2027, 5, 23))).toMatchObject({ con: 30, chang: 'gap' })
    expect(tinhDemNguoc(vn(2027, 5, 22))).toMatchObject({ con: 31, chang: 'binh' })
    expect(tinhDemNguoc(vn(2027, 6, 15))).toMatchObject({ con: 7, chang: 'tuan' })
    expect(tinhDemNguoc(vn(2027, 6, 22))).toMatchObject({ con: 0, chang: 'thi', phanTram: 100 })
    expect(tinhDemNguoc(vn(2027, 6, 23))).toBeNull()
  })
})

describe('laLop12', () => {
  it('nhận lớp 12 theo tên lớp hiệu lực, không nhận 10/11/120 hay rỗng', () => {
    for (const l of ['12 - Lớp Thường', '12 Tinh Hoa', '12A1', ' 12']) expect(laLop12(l)).toBe(true)
    for (const l of ['11 - Lớp Thường', '10A2', '120', 'Chưa xếp lớp', '', null, undefined]) expect(laLop12(l)).toBe(false)
  })
})

describe('DemNguocThi', () => {
  it('lớp 12: số ngày, ngày thi, dòng 28 câu, ống nghiệm có nhãn phần trăm', () => {
    render(<DemNguocThi lop="12 - Lớp Thường" nowMs={vn(2026, 11, 9)} />)
    const the = screen.getByRole('region', { name: 'Còn 225 ngày đến kỳ thi tốt nghiệp THPT' })
    expect(the.getAttribute('data-chang')).toBe('binh')
    expect(the.textContent).toContain('Thi tốt nghiệp THPT')
    expect(the.textContent).toContain('Thứ Ba · 22/06/2027')
    expect(the.textContent).toContain('≈ 32 tuần · đủ 28 câu mỗi ngày là thêm 6.300 câu')
    expect(screen.getByRole('img', { name: 'Ống nghiệm: đã đi 22% năm học lớp 12' })).toBeTruthy()
  })
  it('lớp 10, 11 không hiện; qua ngày thi không hiện', () => {
    const { container, rerender } = render(<DemNguocThi lop="11 - Lớp Thường" nowMs={vn(2026, 11, 9)} />)
    expect(container.innerHTML).toBe('')
    rerender(<DemNguocThi lop="12 - Lớp Thường" nowMs={vn(2027, 6, 23)} />)
    expect(container.innerHTML).toBe('')
  })
  it('đúng ngày thi: nhãn Hôm nay, lời chúc, ống nghiệm đầy', () => {
    render(<DemNguocThi lop="12 Tinh Hoa" nowMs={vn(2027, 6, 22)} />)
    const the = screen.getByRole('region', { name: 'Hôm nay thi tốt nghiệp THPT' })
    expect(the.getAttribute('data-chang')).toBe('thi')
    expect(the.textContent).toContain('Thầy tin em')
    expect(screen.getByRole('img', { name: 'Ống nghiệm: đã đi 100% năm học lớp 12' })).toBeTruthy()
  })
})
