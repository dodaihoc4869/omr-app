/**
 * ĐỒNG BỘ THẦN THÚ — KHÔNG ĐƯỢC LÀM TỤT TIẾN TRÌNH CỦA EM.
 *
 * Thầy bắt được 15-09: "trên điện thoại vẫn là trứng, trên web thì là có sừng".
 *
 * Đây là chỗ dễ mất dữ liệu nhất trong cả game: hai máy, hai bản, một bản phải
 * thắng. Phép kiểm này giữ ba luật:
 *  1. Hoà giải theo TỔNG EXP, không theo đồng hồ — đồng hồ máy em lệch được.
 *  2. Con số chỉ-tăng (tầng tháp, câu đã thanh tẩy, từng dòng sổ EXP) luôn lấy
 *     bên LỚN HƠN, dù bên nào thắng. Em leo tháp trên điện thoại rồi mở web:
 *     tầng đó phải còn.
 *  3. Thần thú đã chọn không bao giờ bị xoá về rỗng.
 */
import { describe, it, expect } from 'vitest'
import { hoaGiaiHoSo, tongExpCuaHoSo, khacBan } from '../src/game/than-thu-hoa-hoc/dong-bo'
import { vaHoSo, layHoSoThanThuMacDinh, type HoSoThanThuLuu } from '../src/game/than-thu-hoa-hoc/he-thong-pet'
import { DS_NGUON_EXP } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

function hs(p: Partial<HoSoThanThuLuu> & { soExp?: Partial<Record<string, number>> }): HoSoThanThuLuu {
  return vaHoSo({ ...layHoSoThanThuMacDinh('hoa_long'), ...p })
}

describe('tongExpCuaHoSo', () => {
  it('cộng đủ năm nguồn', () => {
    expect(tongExpCuaHoSo(hs({ soExp: { caThi: 100, btvn: 50, mom: 20, leoThap: 5, sanBoss: 25 } }))).toBe(200)
  })
  it('hồ sơ mới là 0', () => {
    expect(tongExpCuaHoSo(layHoSoThanThuMacDinh())).toBe(0)
  })
})

describe('Máy chủ chưa có gì', () => {
  it('máy này thắng và phải đẩy lên', () => {
    const kq = hoaGiaiHoSo(hs({ capDo: 4, soExp: { caThi: 900 } }), null)
    expect(kq.ben).toBe('may')
    expect(kq.canGhiLen).toBe(true)
    expect(kq.hoSo.capDo).toBe(4)
  })
  it('undefined cũng vậy', () => {
    expect(hoaGiaiHoSo(hs({}), undefined).ben).toBe('may')
  })
})

describe('Hoà giải theo tổng EXP', () => {
  it('máy chủ nhiều EXP hơn thì máy chủ thắng', () => {
    const may = hs({ capDo: 2, soExp: { caThi: 300 } })
    const chu = hs({ capDo: 6, soExp: { caThi: 3000 } })
    const kq = hoaGiaiHoSo(may, chu)
    expect(kq.ben).toBe('mayChu')
    expect(kq.hoSo.capDo).toBe(6)
  })

  it('máy này nhiều EXP hơn thì máy này thắng và đẩy lên', () => {
    const kq = hoaGiaiHoSo(hs({ capDo: 8, soExp: { leoThap: 5000 } }), hs({ capDo: 3, soExp: { leoThap: 400 } }))
    expect(kq.ben).toBe('may')
    expect(kq.canGhiLen).toBe(true)
    expect(kq.hoSo.capDo).toBe(8)
  })

  it('bằng nhau thì giữ bản máy này, không nháy giao diện', () => {
    const may = hs({ capDo: 5, danhHieuHienTai: 'BẢN MÁY NÀY', soExp: { btvn: 800 } })
    const chu = hs({ capDo: 5, danhHieuHienTai: 'bản máy chủ', soExp: { btvn: 800 } })
    const kq = hoaGiaiHoSo(may, chu)
    expect(kq.ben).toBe('nhuNhau')
    expect(kq.hoSo.danhHieuHienTai).toBe('BẢN MÁY NÀY')
  })

  it('KHÔNG dùng đồng hồ — bản có mốc mới hơn mà ít EXP vẫn thua', () => {
    const may = hs({ capDo: 9, soExp: { caThi: 9000 }, ngayNhanTrung: '2020-01-01T00:00:00Z' })
    const chu = hs({ capDo: 2, soExp: { caThi: 100 }, ngayNhanTrung: '2099-12-31T23:59:59Z' })
    expect(hoaGiaiHoSo(may, chu).ben).toBe('may')
  })
})

describe('KHÔNG LÀM TỤT TIẾN TRÌNH', () => {
  it('máy chủ thắng nhưng tầng tháp của máy này cao hơn thì GIỮ tầng cao', () => {
    const may = hs({ soExp: { caThi: 100 }, tangThapCaoNhat: 41 })
    const chu = hs({ soExp: { caThi: 5000 }, tangThapCaoNhat: 7 })
    const kq = hoaGiaiHoSo(may, chu)
    expect(kq.ben).toBe('mayChu')
    expect(kq.hoSo.tangThapCaoNhat).toBe(41)
    expect(kq.canGhiLen, 'phải đẩy lại vì bản trộn khác bản máy chủ').toBe(true)
  })

  it('số câu đã thanh tẩy cũng lấy bên lớn hơn', () => {
    const kq = hoaGiaiHoSo(
      hs({ soExp: { caThi: 10 }, soCauDaThanhTay: 63 }),
      hs({ soExp: { caThi: 9000 }, soCauDaThanhTay: 4 }),
    )
    expect(kq.hoSo.soCauDaThanhTay).toBe(63)
  })

  it('TỪNG DÒNG sổ EXP lấy bên lớn hơn, không lấy nguyên một bên', () => {
    const may = hs({ soExp: { caThi: 100, btvn: 5000, mom: 0, leoThap: 0, sanBoss: 0 } })
    const chu = hs({ soExp: { caThi: 9000, btvn: 10, mom: 700, leoThap: 0, sanBoss: 0 } })
    const kq = hoaGiaiHoSo(may, chu)
    expect(kq.hoSo.soExp.caThi).toBe(9000)
    expect(kq.hoSo.soExp.btvn).toBe(5000)
    expect(kq.hoSo.soExp.mom).toBe(700)
  })

  it('trộn xong tổng EXP không bao giờ nhỏ hơn cả hai bên', () => {
    const may = hs({ soExp: { caThi: 400, leoThap: 1200 } })
    const chu = hs({ soExp: { caThi: 3000, btvn: 200 } })
    const kq = hoaGiaiHoSo(may, chu)
    expect(tongExpCuaHoSo(kq.hoSo)).toBeGreaterThanOrEqual(kq.tongExpMay)
    expect(tongExpCuaHoSo(kq.hoSo)).toBeGreaterThanOrEqual(kq.tongExpMayChu)
  })

  it('trộn 200 cặp ngẫu nhiên: không cặp nào làm tụt một con số chỉ-tăng', () => {
    const r = (n: number) => Math.floor(Math.random() * n)
    for (let i = 0; i < 200; i++) {
      const a = hs({
        tangThapCaoNhat: 1 + r(60), soCauDaThanhTay: r(90),
        soExp: { caThi: r(5000), btvn: r(3000), mom: r(2000), leoThap: r(4000), sanBoss: r(2500) },
      })
      const b = hs({
        tangThapCaoNhat: 1 + r(60), soCauDaThanhTay: r(90),
        soExp: { caThi: r(5000), btvn: r(3000), mom: r(2000), leoThap: r(4000), sanBoss: r(2500) },
      })
      const kq = hoaGiaiHoSo(a, b)
      expect(kq.hoSo.tangThapCaoNhat).toBe(Math.max(a.tangThapCaoNhat, b.tangThapCaoNhat))
      expect(kq.hoSo.soCauDaThanhTay).toBe(Math.max(a.soCauDaThanhTay, b.soCauDaThanhTay))
      for (const k of DS_NGUON_EXP) {
        expect(kq.hoSo.soExp[k]).toBe(Math.max(a.soExp[k] ?? 0, b.soExp[k] ?? 0))
      }
    }
  })
})

describe('Thần thú đã chọn không bị xoá', () => {
  it('máy chủ thắng nhưng chưa chọn thú thì lấy thú của máy này', () => {
    const may = hs({ idThanhThuChon: 'moc_tinh', ngayChonThu: '2026-09-15T01:00:00Z', soExp: { caThi: 10 } })
    const chu = vaHoSo({ idThanhThuChon: '', capDo: 7, soExp: { caThi: 9000 } })
    const kq = hoaGiaiHoSo(may, chu)
    expect(kq.ben).toBe('mayChu')
    expect(kq.hoSo.idThanhThuChon).toBe('moc_tinh')
    expect(kq.hoSo.ngayChonThu).not.toBe('')
  })

  it('máy này chưa chọn, máy chủ đã chọn thì nuốt thú của máy chủ', () => {
    const may = vaHoSo({ idThanhThuChon: '', soExp: { caThi: 9000 } })
    const chu = hs({ idThanhThuChon: 'loi_kim', soExp: { caThi: 10 } })
    expect(hoaGiaiHoSo(may, chu).hoSo.idThanhThuChon).toBe('loi_kim')
  })
})

describe('khacBan — chỉ đẩy lên khi thật sự khác', () => {
  it('hai bản y hệt thì không khác', () => {
    const a = hs({ capDo: 4, soExp: { caThi: 900 }, tangThapCaoNhat: 5 })
    expect(khacBan(a, hs({ capDo: 4, soExp: { caThi: 900 }, tangThapCaoNhat: 5 }))).toBe(false)
  })
  it('lệch một dòng sổ là khác', () => {
    expect(khacBan(hs({ soExp: { mom: 100 } }), hs({ soExp: { mom: 150 } }))).toBe(true)
  })
  it('lệch ống EXP là khác', () => {
    expect(khacBan(hs({ khoExp: 0 }), hs({ khoExp: 300 }))).toBe(true)
  })
  it('bản giống hệt máy chủ thì KHÔNG đẩy lên vô ích', () => {
    const chung = hs({ capDo: 3, soExp: { caThi: 500 }, tangThapCaoNhat: 2 })
    const kq = hoaGiaiHoSo(chung, chung)
    expect(kq.canGhiLen).toBe(false)
  })
})

describe('Dữ liệu hỏng từ máy chủ', () => {
  it('máy chủ trả rác thì không vỡ, coi như hồ sơ mặc định', () => {
    for (const rac of ['chuoi', 123, [], { capDo: 'ba' }, { soExp: 'hong' }]) {
      const kq = hoaGiaiHoSo(hs({ capDo: 5, soExp: { caThi: 900 } }), rac)
      expect(kq.hoSo.capDo).toBe(5)
      expect(Number.isFinite(tongExpCuaHoSo(kq.hoSo))).toBe(true)
    }
  })
})
