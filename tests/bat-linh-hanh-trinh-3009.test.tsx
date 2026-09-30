import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BanDoHanhTrinh, { tenDaoHanhTrinh } from '../src/components/bat-linh/BanDoHanhTrinh'
import type { SanhHoa2 } from '../src/components/hoa2/api'

const sanh: SanhHoa2 = {
  ngay: '2026-09-30', chienDich: { id: 'cd12009c1c2', ten: '#cd12009c1c2', hanNop: '2026-10-04', D: 4, tong: 120, coXat: 67, thanhThao: 0, canDayLai: 0, thanhThaoTangTu: null },
  theLuc: { con: 28, tong: 40 }, huyetChien: false, doan: { con: 18 }, dao: { con: 10 }, khoaDao: true, loiKhoaDao: 'Hoàn thành câu ôn của lớp để mở đảo',
  ruong: { daLam: 12, tong: 40, moDuoc: false, daMo: false, qua: null }, bia: null, tamGiuCa: 0, thuSucThem: { duoc: false, soCau: 0 },
}

describe('Bản đồ hành trình sơn thủy', () => {
  it('không lộ mã nội bộ, giữ tên chủ đề thật khi có', () => {
    expect(tenDaoHanhTrinh(sanh)).toBe('Quần đảo Bát Linh')
    expect(tenDaoHanhTrinh({ ...sanh, chienDich: { ...sanh.chienDich!, ten: 'Carbohydrate' } })).toBe('Đảo Carbohydrate')
    expect(tenDaoHanhTrinh(null)).toBe('Quần đảo Bát Linh')
  })
  it('số câu, phần trăm và khóa cầu lấy dữ liệu thật; tối đa sáu dấu nhưng chữ không cắt số', () => {
    const { container } = render(<BanDoHanhTrinh s={sanh} />)
    expect(container.textContent).not.toContain('#cd')
    expect(screen.getByText('18 câu ôn còn lại')).toBeTruthy()
    expect(screen.getByText('10 câu mới còn lại')).toBeTruthy()
    expect(screen.getByText(sanh.loiKhoaDao)).toBeTruthy()
    expect(container.querySelector('[data-ve="o-phuc-kich"]')!.children).toHaveLength(6)
    expect(container.querySelector('[data-ve="suong"]')!.getAttribute('data-phan-tram')).toBe('56')
    expect(container.querySelector('[data-ve="cau-keo-len"]')).toBeTruthy()
  })
  it('mở cầu và hết sương khi tiến độ đạt đủ, trạng thái thiếu dữ liệu không bịa phần trăm', () => {
    const { container, rerender } = render(<BanDoHanhTrinh s={{ ...sanh, khoaDao: false, chienDich: { ...sanh.chienDich!, coXat: 140 } }} />)
    expect(container.querySelector('[data-ve="suong"]')!.getAttribute('opacity')).toBe('0')
    expect(container.querySelector('[data-ve="cau-ha"]')).toBeTruthy()
    rerender(<BanDoHanhTrinh s={null} />)
    expect(screen.getByText('Đang mở bản đồ…')).toBeTruthy()
    expect(container.textContent).not.toContain('%')
  })
})
