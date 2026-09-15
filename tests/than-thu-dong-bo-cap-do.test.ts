/**
 * HOÀ GIẢI PHẢI ĐƯA CẤP THÚ VÀO PHÉP SO.
 *
 * Thầy bắt được chiều 15-09, ngay sau khi phát hành:
 * *"Điện thoại và máy tính chưa hiện thần thú giống nhau."*
 *
 * ───────────────────────────────────────────────────────────────────────────
 * CON LỖI: bản đầu hoà giải bằng MỖI tổng sổ `soExp`. Sổ ấy chỉ mới có từ
 * 15-09, nên mọi hồ sơ nuôi từ trước có sổ RỖNG — tổng 0. Hai máy cùng tổng 0
 * thì hoà, mà hoà thì giữ bản của máy này. Kết cục: máy nào cũng giữ bản của
 * mình, mãi mãi. Đồng bộ chạy đủ, gọi mạng đủ, mà chẳng đổi gì.
 *
 * Toàn bộ tệp này chạy XANH trên bản đã sửa và ĐỎ trên bản cũ.
 */
import { describe, it, expect } from 'vitest'
import { hoaGiaiHoSo, mocTienTrinh, soMoc } from '../src/game/than-thu-hoa-hoc/dong-bo'
import { vaHoSo, type HoSoThanThuLuu } from '../src/game/than-thu-hoa-hoc/he-thong-pet'
import { thanhExp, soExpRong } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

/** Hồ sơ KIỂU CŨ: có cấp, có thú, nhưng SỔ EXP RỖNG — đúng dạng gây lỗi. */
function hoSoCu(capDo: number, idThu = 'hoa_long', them: Record<string, unknown> = {}): HoSoThanThuLuu {
  return vaHoSo({
    idThanhThuChon: idThu,
    capDo,
    exp: 0,
    khoExp: 0,
    soExp: soExpRong(),
    tangThapCaoNhat: 1,
    soCauDaThanhTay: 0,
    ngayChonThu: '2026-09-01',
    ...them,
  })
}

describe('Sổ EXP rỗng cả hai bên — cấp thú phải phá thế hoà', () => {
  it('MÁY CHỦ cấp cao hơn: máy này phải nhận cấp của máy chủ', () => {
    const dienThoai = hoSoCu(1)      // quả trứng
    const web = hoSoCu(3)            // đã mọc sừng
    const kq = hoaGiaiHoSo(dienThoai, web)
    expect(kq.hoSo.capDo).toBe(3)
    expect(kq.ben).toBe('mayChu')
  })

  it('MÁY NÀY cấp cao hơn: giữ cấp của máy này và phải đẩy lên', () => {
    const kq = hoaGiaiHoSo(hoSoCu(3), hoSoCu(1))
    expect(kq.hoSo.capDo).toBe(3)
    expect(kq.ben).toBe('may')
    expect(kq.canGhiLen).toBe(true)
  })

  it('HAI CHIỀU RA CÙNG MỘT CẤP — không phụ thuộc máy nào mở trước', () => {
    for (const [a, b] of [[1, 3], [3, 1], [5, 12], [12, 5], [2, 2]] as const) {
      const xuoi = hoaGiaiHoSo(hoSoCu(a), hoSoCu(b)).hoSo.capDo
      const nguoc = hoaGiaiHoSo(hoSoCu(b), hoSoCu(a)).hoSo.capDo
      expect(xuoi, `${a} vs ${b}`).toBe(Math.max(a, b))
      expect(nguoc, `${b} vs ${a}`).toBe(Math.max(a, b))
    }
  })

  it('CẤP KHÔNG BAO GIỜ TỤT — quét đủ 12 × 12 cặp', () => {
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        const kq = hoaGiaiHoSo(hoSoCu(a), hoSoCu(b))
        expect(kq.hoSo.capDo, `${a} vs ${b}`).toBe(Math.max(a, b))
      }
    }
  })
})

describe('Khối cấp độ phải ăn khớp sau khi trộn', () => {
  it('thanh EXP và hình thái tính lại theo đúng cấp đã chọn', () => {
    for (let a = 1; a <= 12; a++) {
      for (const b of [1, 6, 12]) {
        const kq = hoaGiaiHoSo(hoSoCu(a), hoSoCu(b))
        expect(kq.hoSo.expToiDa, `${a} vs ${b}`).toBe(thanhExp(kq.hoSo.capDo))
        expect(kq.hoSo.capTienHoa).toBe(kq.hoSo.capDo)
      }
    }
  })

  it('KHÁC CẤP thì KHÔNG cộng khống ống nghiệm — chỗ EXP ấy đã hoá thành cấp', () => {
    // Máy A cấp 3, ống cạn vì đã nạp hết. Máy B cấp 1, ống còn 900.
    const a = hoSoCu(3, 'hoa_long', { khoExp: 0 })
    const b = hoSoCu(1, 'hoa_long', { khoExp: 900 })
    const kq = hoaGiaiHoSo(a, b)
    expect(kq.hoSo.capDo).toBe(3)
    expect(kq.hoSo.khoExp).toBe(0)     // KHÔNG được thành 900
  })

  it('CÙNG CẤP thì lấy ống đầy hơn — chưa bên nào nạp, không cộng khống gì', () => {
    const a = hoSoCu(4, 'hoa_long', { khoExp: 120 })
    const b = hoSoCu(4, 'hoa_long', { khoExp: 640 })
    expect(hoaGiaiHoSo(a, b).hoSo.khoExp).toBe(640)
    expect(hoaGiaiHoSo(b, a).hoSo.khoExp).toBe(640)
  })
})

describe('Những gì đã đúng thì phải giữ nguyên', () => {
  it('sổ EXP vẫn lấy bên lớn hơn từng nguồn, dù bên nào thắng', () => {
    const a = vaHoSo({ ...hoSoCu(1), soExp: { ...soExpRong(), leoThap: 300, caThi: 0 } })
    const b = vaHoSo({ ...hoSoCu(5), soExp: { ...soExpRong(), leoThap: 0, caThi: 700 } })
    const kq = hoaGiaiHoSo(a, b)
    expect(kq.hoSo.capDo).toBe(5)
    expect(kq.hoSo.soExp.leoThap).toBe(300)
    expect(kq.hoSo.soExp.caThi).toBe(700)
  })

  it('tầng tháp và số câu đã thanh tẩy vẫn lấy bên lớn hơn', () => {
    const a = hoSoCu(1, 'hoa_long', { tangThapCaoNhat: 27, soCauDaThanhTay: 40 })
    const b = hoSoCu(6, 'hoa_long', { tangThapCaoNhat: 3, soCauDaThanhTay: 1 })
    const kq = hoaGiaiHoSo(a, b)
    expect(kq.hoSo.capDo).toBe(6)
    expect(kq.hoSo.tangThapCaoNhat).toBe(27)
    expect(kq.hoSo.soCauDaThanhTay).toBe(40)
  })

  it('bên nào đã chốt thần thú thì giữ — chọn một lần, không đổi', () => {
    const chuaChon = vaHoSo({ ...hoSoCu(1), idThanhThuChon: '', ngayChonThu: '' })
    const daChon = hoSoCu(1, 'moc_tinh')
    expect(hoaGiaiHoSo(chuaChon, daChon).hoSo.idThanhThuChon).toBe('moc_tinh')
    expect(hoaGiaiHoSo(daChon, chuaChon).hoSo.idThanhThuChon).toBe('moc_tinh')
  })

  it('máy chủ chưa có gì thì máy này thắng và phải đẩy lên', () => {
    const kq = hoaGiaiHoSo(hoSoCu(4), null)
    expect(kq.ben).toBe('may')
    expect(kq.canGhiLen).toBe(true)
    expect(kq.hoSo.capDo).toBe(4)
  })

  it('hai bản y hệt nhau thì KHÔNG gọi mạng', () => {
    const h = hoSoCu(7, 'loi_kim', { tangThapCaoNhat: 9, soCauDaThanhTay: 12 })
    expect(hoaGiaiHoSo(h, h).canGhiLen).toBe(false)
  })

  it('trộn xong mà khác bản máy chủ thì PHẢI đẩy lên', () => {
    const kq = hoaGiaiHoSo(hoSoCu(1, 'hoa_long', { tangThapCaoNhat: 30 }), hoSoCu(3))
    expect(kq.hoSo.capDo).toBe(3)
    expect(kq.hoSo.tangThapCaoNhat).toBe(30)   // bản trộn khác hẳn bản máy chủ
    expect(kq.canGhiLen).toBe(true)
  })
})

describe('Thước đo tiến trình', () => {
  it('cấp thú đứng ĐẦU — để không bao giờ tụt cấp', () => {
    const capCao = hoSoCu(9, 'hoa_long', { khoExp: 0 })
    const ongDay = hoSoCu(2, 'hoa_long', { khoExp: 1999 })
    expect(soMoc(mocTienTrinh(capCao), mocTienTrinh(ongDay))).toBeGreaterThan(0)
  })

  it('cùng cấp thì xét tiếp tổng sổ EXP, rồi tầng tháp', () => {
    const a = vaHoSo({ ...hoSoCu(4), soExp: { ...soExpRong(), caThi: 500 } })
    const b = hoSoCu(4)
    expect(soMoc(mocTienTrinh(a), mocTienTrinh(b))).toBeGreaterThan(0)

    const c = hoSoCu(4, 'hoa_long', { tangThapCaoNhat: 15 })
    const d = hoSoCu(4, 'hoa_long', { tangThapCaoNhat: 2 })
    expect(soMoc(mocTienTrinh(c), mocTienTrinh(d))).toBeGreaterThan(0)
  })

  it('y hệt nhau thì ngang, và phép so ĐỐI XỨNG', () => {
    const h = hoSoCu(5)
    expect(soMoc(mocTienTrinh(h), mocTienTrinh(h))).toBe(0)
    const a = mocTienTrinh(hoSoCu(3))
    const b = mocTienTrinh(hoSoCu(8))
    expect(soMoc(a, b)).toBe(-soMoc(b, a))
  })
})
