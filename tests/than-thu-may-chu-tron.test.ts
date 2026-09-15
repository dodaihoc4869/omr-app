/**
 * MÁY CHỦ TRỘN HỒ SƠ THẦN THÚ — CHẠY THẬT, KHÔNG SOI CHỮ.
 *
 * Thầy bắt được chiều 15-09. Soi thẳng cơ sở dữ liệu: bảng `than_thu` có ĐÚNG
 * MỘT dòng, và dòng ấy RỖNG —
 *   {"idThanhThuChon":"","capDo":1,"exp":0,"khoExp":0,"soExp":{…đều 0}}
 * — trong khi trên web em đang có một con đã mọc sừng.
 *
 * Cổng cũ chỉ chặn khi `tongExp < tongCu`. Sổ `soExp` mới có từ 15-09 nên hồ sơ
 * nuôi từ trước có sổ RỖNG, tổng 0; hồ sơ trắng cũng tổng 0. `0 < 0` là sai ⇒
 * hồ sơ trắng ghi đè lọt qua và XOÁ TRẮNG con thú của em.
 *
 * Luật mới: máy chủ TRỘN. Thứ tự ghi hết quan trọng — dòng trên máy chủ chỉ
 * tốt lên, không bao giờ nghèo đi.
 */
import { describe, it, expect } from 'vitest'
import {
  tronHoSoThu, mocTienTrinhThu, soMocThu, tongExpCuaThu,
  type HoSoThanThuMayChu,
} from '../server/src/tron-than-thu'

function hs(t: Partial<HoSoThanThuMayChu> = {}): HoSoThanThuMayChu {
  return {
    idThanhThuChon: 'hoa_long', capDo: 1, exp: 0, expToiDa: 300, capTienHoa: 1,
    khoExp: 0, soExp: { caThi: 0, btvn: 0, mom: 0, leoThap: 0, sanBoss: 0 },
    tangThapCaoNhat: 1, soCauDaThanhTay: 0,
    danhHieuHienTai: '', ngayNhanTrung: '', ngayChonThu: '2026-09-01',
    ...t,
  }
}

/** ĐÚNG dòng đang nằm trên máy chủ lúc thầy báo lỗi. */
const HO_SO_TRANG = hs({ idThanhThuChon: '', capDo: 1, ngayChonThu: '' })

describe('Hồ sơ trắng KHÔNG được xoá con thú của em', () => {
  it('trắng đẩy đè lên bản thật: con thú và cấp phải còn nguyên', () => {
    const that = hs({ idThanhThuChon: 'moc_tinh', capDo: 8, khoExp: 400 })
    const ra = tronHoSoThu(HO_SO_TRANG, that)
    expect(ra.idThanhThuChon).toBe('moc_tinh')
    expect(ra.capDo).toBe(8)
  })

  it('bản thật đẩy đè lên dòng trắng: máy chủ nhận đúng bản thật', () => {
    const that = hs({ idThanhThuChon: 'loi_kim', capDo: 5 })
    const ra = tronHoSoThu(that, HO_SO_TRANG)
    expect(ra.idThanhThuChon).toBe('loi_kim')
    expect(ra.capDo).toBe(5)
  })

  it('hai bản trắng thì vẫn trắng, không dựng thú mặc định', () => {
    expect(tronHoSoThu(HO_SO_TRANG, HO_SO_TRANG).idThanhThuChon).toBe('')
  })
})

describe('Trộn xong không bao giờ nghèo đi', () => {
  it('CẤP KHÔNG TỤT — quét đủ 12 × 12 cặp, cả hai chiều', () => {
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        expect(tronHoSoThu(hs({ capDo: a }), hs({ capDo: b })).capDo, `${a} vs ${b}`)
          .toBe(Math.max(a, b))
      }
    }
  })

  it('sổ EXP lấy bên lớn hơn TỪNG NGUỒN, dù bên nào thắng', () => {
    const a = hs({ capDo: 2, soExp: { caThi: 900, btvn: 0, mom: 0, leoThap: 30, sanBoss: 0 } })
    const b = hs({ capDo: 9, soExp: { caThi: 0, btvn: 600, mom: 0, leoThap: 0, sanBoss: 12 } })
    const ra = tronHoSoThu(a, b)
    expect(ra.capDo).toBe(9)
    expect(ra.soExp.caThi).toBe(900)
    expect(ra.soExp.btvn).toBe(600)
    expect(ra.soExp.leoThap).toBe(30)
    expect(ra.soExp.sanBoss).toBe(12)
    expect(tongExpCuaThu(ra)).toBe(1542)
  })

  it('tầng tháp và số câu đã thanh tẩy cũng lấy bên lớn hơn', () => {
    const ra = tronHoSoThu(
      hs({ capDo: 1, tangThapCaoNhat: 41, soCauDaThanhTay: 70 }),
      hs({ capDo: 7, tangThapCaoNhat: 2, soCauDaThanhTay: 3 }),
    )
    expect(ra.capDo).toBe(7)
    expect(ra.tangThapCaoNhat).toBe(41)
    expect(ra.soCauDaThanhTay).toBe(70)
  })

  it('ĐẨY ĐI ĐẨY LẠI nhiều lần vẫn ra đúng một kết quả (trộn là bất biến)', () => {
    const a = hs({ idThanhThuChon: 'thuy_quai', capDo: 6, tangThapCaoNhat: 11 })
    const b = hs({ idThanhThuChon: 'thuy_quai', capDo: 3, soExp: { caThi: 500, btvn: 0, mom: 0, leoThap: 0, sanBoss: 0 } })
    const mot = tronHoSoThu(a, b)
    const hai = tronHoSoThu(b, mot)
    const ba = tronHoSoThu(mot, hai)
    expect(hai.capDo).toBe(6)
    expect(ba.capDo).toBe(6)
    expect(ba.soExp.caThi).toBe(500)
    expect(ba.tangThapCaoNhat).toBe(11)
  })
})

describe('Ống nghiệm không được cộng khống', () => {
  it('KHÁC CẤP thì lấy ống của bên thắng — chỗ EXP kia đã hoá thành cấp', () => {
    const cao = hs({ capDo: 4, khoExp: 0 })
    const thap = hs({ capDo: 1, khoExp: 1200 })
    expect(tronHoSoThu(cao, thap).khoExp).toBe(0)
    expect(tronHoSoThu(thap, cao).khoExp).toBe(0)
  })

  it('CÙNG CẤP thì lấy ống đầy hơn — chưa bên nào nạp', () => {
    expect(tronHoSoThu(hs({ capDo: 5, khoExp: 90 }), hs({ capDo: 5, khoExp: 700 })).khoExp).toBe(700)
    expect(tronHoSoThu(hs({ capDo: 5, khoExp: 700 }), hs({ capDo: 5, khoExp: 90 })).khoExp).toBe(700)
  })
})

describe('Thước đo tiến trình', () => {
  it('cấp đứng ĐẦU, trên cả tổng EXP', () => {
    const capCao = hs({ capDo: 9 })
    const expNhieu = hs({ capDo: 2, soExp: { caThi: 9999, btvn: 0, mom: 0, leoThap: 0, sanBoss: 0 } })
    expect(soMocThu(mocTienTrinhThu(capCao), mocTienTrinhThu(expNhieu))).toBeGreaterThan(0)
  })

  it('cùng cấp thì xét tổng EXP, rồi tầng tháp', () => {
    expect(soMocThu(
      mocTienTrinhThu(hs({ capDo: 4, soExp: { caThi: 100, btvn: 0, mom: 0, leoThap: 0, sanBoss: 0 } })),
      mocTienTrinhThu(hs({ capDo: 4 })),
    )).toBeGreaterThan(0)
    expect(soMocThu(
      mocTienTrinhThu(hs({ capDo: 4, tangThapCaoNhat: 9 })),
      mocTienTrinhThu(hs({ capDo: 4, tangThapCaoNhat: 1 })),
    )).toBeGreaterThan(0)
  })

  it('y hệt nhau thì ngang, và phép so đối xứng', () => {
    expect(soMocThu(mocTienTrinhThu(hs()), mocTienTrinhThu(hs()))).toBe(0)
    const a = mocTienTrinhThu(hs({ capDo: 3 }))
    const b = mocTienTrinhThu(hs({ capDo: 8 }))
    expect(soMocThu(a, b)).toBe(-soMocThu(b, a))
  })
})
