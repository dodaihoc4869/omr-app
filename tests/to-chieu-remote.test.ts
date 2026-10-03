import { describe, expect, it } from 'vitest'
import {
  capNhatTrangThaiToChieu,
  guiLenhToChieu,
  layLenhMoiToChieu,
  layPhienToChieu,
  taoHoacCapNhatPhienToChieu,
} from '../server/src/to-chieu-remote'

describe('to-chieu-remote', () => {
  it('tạo phiên mới và tra cứu bằng mã phiên hoặc mã PIN', () => {
    const maPhien = 'phien_test_123'
    const res = taoHoacCapNhatPhienToChieu({
      maPhien,
      tieuDe: 'Buổi học test',
      dotHienTai: 0,
      tongSoDot: 5,
      dsO: [
        { soCau: 1, de: 'Câu 1...', dapAn: 'A', loiGiai: 'Lời giải 1' },
        { soCau: 2, de: 'Câu 2...', dapAn: 'B', loiGiai: 'Lời giải 2' },
      ],
    })

    expect(res.ok).toBe(true)
    expect(res.maPhien).toBe(maPhien)
    expect(res.maPin).toMatch(/^\d{6}$/)

    const pTheoMa = layPhienToChieu(maPhien)
    expect(pTheoMa).not.toBeNull()
    expect(pTheoMa?.tieuDe).toBe('Buổi học test')
    expect(pTheoMa?.dsO.length).toBe(2)

    const pTheoPin = layPhienToChieu(res.maPin)
    expect(pTheoPin).not.toBeNull()
    expect(pTheoPin?.maPhien).toBe(maPhien)
  })

  it('gửi lệnh từ điện thoại và lấy lệnh mới từ máy chiếu', () => {
    const maPhien = 'phien_test_lenh'
    taoHoacCapNhatPhienToChieu({ maPhien })

    // Điện thoại bấm "Lên bảng"
    const l1 = guiLenhToChieu(maPhien, 'LEN_BANG')
    expect(l1.ok).toBe(true)
    expect(l1.id).toBe(1)
    expect(l1.phien?.pha).toBe('goi')

    // Điện thoại bấm "Hiện lời giải"
    const l2 = guiLenhToChieu(maPhien, 'BAT_LOI_GIAI', { mo: true })
    expect(l2.ok).toBe(true)
    expect(l2.id).toBe(2)
    expect(l2.phien?.loiGiaiMo).toBe(true)

    // Máy chiếu lấy lệnh sau id = 0 -> nhận cả 2 lệnh
    const moi0 = layLenhMoiToChieu(maPhien, 0)
    expect(moi0.lenh.length).toBe(2)
    expect(moi0.lenh[0].loai).toBe('LEN_BANG')
    expect(moi0.lenh[1].loai).toBe('BAT_LOI_GIAI')

    // Máy chiếu đã thực thi đến id = 1 -> chỉ lấy sau id = 1
    const moi1 = layLenhMoiToChieu(maPhien, 1)
    expect(moi1.lenh.length).toBe(1)
    expect(moi1.lenh[0].id).toBe(2)

    // Cập nhật trạng thái từ máy chiếu
    capNhatTrangThaiToChieu(maPhien, { dotHienTai: 1, pha: 'chua', loiGiaiMo: true })
    const phienCapNhat = layPhienToChieu(maPhien)
    expect(phienCapNhat?.dotHienTai).toBe(1)
    expect(phienCapNhat?.pha).toBe('chua')
  })
})
