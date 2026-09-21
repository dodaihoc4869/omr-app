// HẤP THỤ THEO NGÀY + ĐƯỜNG CẤP MỚI + CHUYỂN ĐỔI HỒ SƠ (Code 1, 21/09/2026; thầy chốt 13:36; Điều 1 + 2 + 9 + 10 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`).
// Nghiệm thu (Boss): tổng bảng 240 000 · 9 số đầu 4 200 · không giảm · với MỌI chuỗi nạp hợp lệ (ngẫu nhiên 2 000 chuỗi) SỚM NHẤT tới cấp 10 là ngày 21 và tới cấp 120 là ngày 1 200 ·
// chuyển đổi bảo toàn tổng EXP (sau định giá lại thưởng nấc + bù bảng giá), idempotent, không em nào tăng cấp · ví dụ thật: cấp 7 dư 98 EXP, ống 0, 1 ngày có học ⇒ cấp 2 + 40/200, ống = T − 200.
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import {
  BU_DAT_NGAY, CHENH_THUONG_NAC, HAP_THU_CO_HOC, HAP_THU_DAT, LUAT_CAP_MOI, NGAY_SOM_NHAT_CAP_10, NGAY_SOM_NHAT_CAP_120, TRAN_EXP_GAME_NGAY,
  CO_HOC_TOI_THIEU_CAU, chenhDinhGia, chuyenDoiLuatCap, hapThu, laCoHoc, tongExpTheoDuongCu, tranExpGameNgay, tranHapThu, type HoSoCapExp, type HoSoCu,
} from '../src/lib/hap-thu-ngay'
import { BANG_THANH_EXP, nhanExp, thanhExp, thanhExpCu, tongExpToiCap, tongExpToiDinh } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'

const NGAY = '2026-09-21'
const hs = (o: Partial<HoSoCapExp> = {}): HoSoCapExp => ({ cap: 1, exp: 0, wallet: 0, ...o })
/** Tổng EXP đã nạp vào thú theo đường MỚI. */
const daNapTong = (h: { cap: number; exp: number }) => tongExpToiCap(h.cap) + h.exp
const ngayThu = (n: number) => `d${String(n).padStart(5, '0')}`
/** Kiểm nhanh trong vòng lặp lớn (expect của vitest quá chậm ở hàng triệu lần): sai ⇒ ném lỗi có nhãn. */
const chk = (dieuKien: boolean, nhan: string): void => {
  if (!dieuKien) throw new Error(`vi phạm: ${nhan}`)
}

describe('ĐƯỜNG CẤP MỚI — bảng 119 số viết thẳng', () => {
  it('119 số nguyên dương, KHÔNG GIẢM (thực tế tăng dần), tổng đúng 240 000, chín số đầu tổng 4 200', () => {
    expect(BANG_THANH_EXP).toHaveLength(119)
    expect(BANG_THANH_EXP.reduce((a, b) => a + b, 0)).toBe(240_000)
    expect(BANG_THANH_EXP.slice(0, 9)).toEqual([160, 200, 250, 320, 400, 500, 620, 780, 970])
    expect(BANG_THANH_EXP.slice(0, 9).reduce((a, b) => a + b, 0)).toBe(4200)
    for (let i = 0; i < 119; i++) {
      expect(Number.isInteger(BANG_THANH_EXP[i]) && BANG_THANH_EXP[i]! > 0, `số ${i}`).toBe(true)
      if (i > 0) expect(BANG_THANH_EXP[i]!, `số ${i}`).toBeGreaterThan(BANG_THANH_EXP[i - 1]!)
    }
    expect(tongExpToiDinh()).toBe(240_000)
  })
  it('thanhExp tra đúng bảng: cấp c ↦ số thứ c; cấp lẻ làm tròn; cấp < 1 như cấp 1; cấp ≥ 120 ⇒ 0', () => {
    for (let c = 1; c <= 119; c++) expect(thanhExp(c), `cấp ${c}`).toBe(BANG_THANH_EXP[c - 1])
    expect(thanhExp(120)).toBe(0)
    expect(thanhExp(121)).toBe(0)
    expect(thanhExp(0)).toBe(160)
    expect(thanhExp(-3)).toBe(160)
    expect(thanhExp(1.4)).toBe(160)
    expect(thanhExp(119.6)).toBe(0)
  })
  it('MỐC của bản đề xuất: tổng tới cấp 2 · 5 · 10 · 20 · 30 · 50 · 70 · 100 · 120 và ngày sớm nhất (đạt mọi ngày 200/ngày · chỉ có học 120/ngày)', () => {
    const MOC: Record<number, [number, number, number]> = {
      2: [160, 1, 2], 5: [930, 5, 8], 10: [4200, 21, 35], 20: [14790, 74, 124], 30: [26790, 134, 224], 50: [55820, 280, 466], 70: [93150, 466, 777], 100: [170050, 851, 1418], 120: [240000, 1200, 2000],
    }
    for (const [cap, [tong, ngayDat, ngayHoc]] of Object.entries(MOC)) {
      expect(tongExpToiCap(Number(cap)), `cấp ${cap}`).toBe(tong)
      expect(Math.ceil(tong / HAP_THU_DAT), `cấp ${cap} đạt`).toBe(ngayDat)
      expect(Math.ceil(tong / HAP_THU_CO_HOC), `cấp ${cap} có học`).toBe(ngayHoc)
    }
    expect(NGAY_SOM_NHAT_CAP_10).toBe(21)
    expect(NGAY_SOM_NHAT_CAP_120).toBe(1200)
    expect(tongExpToiCap(1)).toBe(0)
    expect(tongExpToiCap(999)).toBe(240_000)
  })
  it('đường CŨ giữ nguyên dưới tên thanhExpCu (chỉ để chuyển đổi): 120 · 400 (cấp 10) · 46 740 (cấp 119), tổng 1 286 590, cấp 120 ⇒ 0', () => {
    expect(thanhExpCu(1)).toBe(120)
    expect(thanhExpCu(10)).toBe(400)
    expect(thanhExpCu(119)).toBe(46_740)
    expect(thanhExpCu(120)).toBe(0)
    let t = 0
    for (let c = 1; c < 120; c++) t += thanhExpCu(c)
    expect(t).toBe(1_286_590)
  })
  it('SO ĐƯỜNG MỚI VỚI CŨ (kẽ hở đã báo Boss): đường mới ĐẮT hơn đường cũ ở mọi cấp ≤ 30 (nên em đã chơi không lên cấp khi chuyển) và RẺ hơn từ cấp 31 (cần thanh chặn của chuyển đổi)', () => {
    const cu = (cap: number) => tongExpTheoDuongCu(cap, 0, 0)
    for (let c = 2; c <= 30; c++) expect(tongExpToiCap(c), `cấp ${c}`).toBeGreaterThanOrEqual(cu(c))
    expect(tongExpToiCap(31)).toBeLessThan(cu(31))
    expect(tongExpToiCap(120)).toBeLessThan(cu(120))
  })
})

describe('tranHapThu · tranExpGameNgay', () => {
  it('đạt ⇒ 200 · có học chưa đạt ⇒ 120 · không học ⇒ 0', () => {
    expect(tranHapThu({ datHomNay: true, coHocHomNay: true })).toBe(200)
    expect(tranHapThu({ datHomNay: true, coHocHomNay: false })).toBe(200)
    expect(tranHapThu({ datHomNay: false, coHocHomNay: true })).toBe(120)
    expect(tranHapThu({ datHomNay: false, coHocHomNay: false })).toBe(0)
  })
  it('"CÓ HỌC" cần ≥ 4 câu KHÁC NHAU hôm nay (Boss siết 21/09): soCauHomNay 3 ⇒ 0 · 4 ⇒ 120; đạt ⇒ 200 bất kể số câu; soCauHomNay thắng coHocHomNay; số lạ ⇒ chưa học; chữ ký cũ (chỉ boolean) vẫn chạy', () => {
    expect(CO_HOC_TOI_THIEU_CAU).toBe(4)
    expect([0, 1, 3].map((n) => tranHapThu({ datHomNay: false, soCauHomNay: n }))).toEqual([0, 0, 0])
    expect([4, 5, 40].map((n) => tranHapThu({ datHomNay: false, soCauHomNay: n }))).toEqual([120, 120, 120])
    expect(tranHapThu({ datHomNay: true, soCauHomNay: 0 })).toBe(200)
    expect(tranHapThu({ datHomNay: false, coHocHomNay: true, soCauHomNay: 2 })).toBe(0) // số câu thắng cờ
    expect(tranHapThu({ datHomNay: false, coHocHomNay: false, soCauHomNay: 9 })).toBe(120)
    for (const n of [Number.NaN, -3, Number.NEGATIVE_INFINITY]) expect(tranHapThu({ datHomNay: false, soCauHomNay: n }), String(n)).toBe(0)
    expect(laCoHoc(3.9)).toBe(false)
    expect(laCoHoc(4)).toBe(true)
    expect(tranHapThu({ datHomNay: false, coHocHomNay: true })).toBe(120)
    expect(tranHapThu({ datHomNay: false })).toBe(0)
  })
  it('EXP game tối đa 120 mỗi ngày: nhận phần còn lại của trần, quá trần ⇒ 0, không âm, số lạ ⇒ 0', () => {
    expect(TRAN_EXP_GAME_NGAY).toBe(120)
    expect(tranExpGameNgay(0, 50)).toBe(50)
    expect(tranExpGameNgay(100, 50)).toBe(20)
    expect(tranExpGameNgay(120, 30)).toBe(0)
    expect(tranExpGameNgay(500, 30)).toBe(0)
    expect(tranExpGameNgay(0, 9999)).toBe(120)
    expect(tranExpGameNgay(-5, -5)).toBe(0)
    expect(tranExpGameNgay(Number.NaN, Number.NaN)).toBe(0)
    // mọi cặp: nhận ≤ xin, ≤ phần còn lại, và đã nhận + nhận ≤ 120 khi đã nhận ≤ 120
    const r = mulberry32(120)
    for (let i = 0; i < 3000; i++) {
      const da = Math.floor(r() * 200)
      const xin = Math.floor(r() * 300)
      const n = tranExpGameNgay(da, xin)
      expect(n).toBeLessThanOrEqual(xin)
      expect(n).toBeGreaterThanOrEqual(0)
      if (da <= 120) expect(da + n).toBeLessThanOrEqual(120)
    }
  })
})

describe('hapThu — cổng nạp của thần thú', () => {
  it('em đạt: ống 500 ⇒ nạp đúng 200 (hết trần, lý do "no"), ống còn 300, thú lên cấp 2 + 40/200; xin ít hơn trần thì nạp đủ, không có lý do', () => {
    const r = hapThu(hs({ wallet: 500 }), Number.POSITIVE_INFINITY, NGAY, 200)
    expect(r.daNap).toBe(200)
    expect(r.lyDo).toBe('no')
    expect(r.conTran).toBe(0)
    expect(r.hoSo).toMatchObject({ cap: 2, exp: 40, wallet: 300, hapThu: { ngay: NGAY, da: 200 } })
    const it2 = hapThu(hs({ wallet: 500 }), 150, NGAY, 200)
    expect(it2).toMatchObject({ daNap: 150, lyDo: null, conTran: 50 })
    expect(it2.hoSo).toMatchObject({ cap: 1, exp: 150, wallet: 350 }) // 150 < 160: chưa đủ lên cấp 2
  })
  it('có học nạp 120; đạt SAU khi đã nạp 120 thì nạp tiếp được tới 200; nạp lần ba trong ngày ⇒ "no"', () => {
    const a = hapThu(hs({ wallet: 1000 }), Number.POSITIVE_INFINITY, NGAY, 120)
    expect(a).toMatchObject({ daNap: 120, lyDo: 'no', conTran: 0 })
    const b = hapThu(a.hoSo, Number.POSITIVE_INFINITY, NGAY, 200)
    expect(b).toMatchObject({ daNap: 80, lyDo: 'no', conTran: 0 })
    expect(b.hoSo.hapThu).toEqual({ ngay: NGAY, da: 200 })
    expect(daNapTong(b.hoSo)).toBe(200)
    const c = hapThu(b.hoSo, 10, NGAY, 200)
    expect(c).toMatchObject({ daNap: 0, lyDo: 'no', conTran: 0 })
    expect(c.hoSo).toBe(b.hoSo) // không nạp gì ⇒ trả lại CHÍNH hồ sơ, không ghi
  })
  it('sang ngày mới `da` về 0 (nạp lại được); hồ sơ chưa có `hapThu` coi như 0', () => {
    const h = hs({ cap: 2, exp: 40, wallet: 900, hapThu: { ngay: '2026-09-21', da: 200 } })
    expect(hapThu(h, Number.POSITIVE_INFINITY, '2026-09-21', 200).daNap).toBe(0)
    const mai = hapThu(h, Number.POSITIVE_INFINITY, '2026-09-22', 120)
    expect(mai.daNap).toBe(120)
    expect(mai.hoSo.hapThu).toEqual({ ngay: '2026-09-22', da: 120 })
  })
  it('lý do đúng: không học ⇒ chua_hoc; ống rỗng ⇒ het_ong; cấp 120 ⇒ cap_toi_da; ống nhỏ hơn trần và xin nhiều ⇒ nạp hết ống, lý do het_ong', () => {
    expect(hapThu(hs({ wallet: 999 }), 100, NGAY, 0)).toMatchObject({ daNap: 0, lyDo: 'chua_hoc' })
    expect(hapThu(hs({ wallet: 0 }), 100, NGAY, 200)).toMatchObject({ daNap: 0, lyDo: 'het_ong' })
    expect(hapThu(hs({ cap: 120, exp: 0, wallet: 999 }), 100, NGAY, 200)).toMatchObject({ daNap: 0, lyDo: 'cap_toi_da' })
    const nho = hapThu(hs({ wallet: 70 }), Number.POSITIVE_INFINITY, NGAY, 200)
    expect(nho).toMatchObject({ daNap: 70, lyDo: 'het_ong', conTran: 130 })
    expect(hapThu(hs({ wallet: 70 }), 0, NGAY, 200)).toMatchObject({ daNap: 0, lyDo: null })
    // sắp đầy cấp 120: chỉ nạp phần còn thiếu, lý do cap_toi_da
    const gan = hapThu(hs({ cap: 119, exp: 3900, wallet: 500 }), Number.POSITIVE_INFINITY, NGAY, 200)
    expect(gan).toMatchObject({ daNap: 50, lyDo: 'cap_toi_da' })
    expect(gan.hoSo).toMatchObject({ cap: 120, exp: 0, wallet: 450 })
  })
  it('THUẦN: không sửa đầu vào (đóng băng sâu vẫn chạy); số lạ (NaN, âm, thiếu) không làm hỏng', () => {
    const h = Object.freeze({ cap: 3, exp: 10, wallet: 400, hapThu: Object.freeze({ ngay: NGAY, da: 20 }) }) as unknown as HoSoCapExp
    expect(hapThu(h, 999, NGAY, 120).daNap).toBe(100)
    const la = hapThu({ cap: Number.NaN, exp: -5, wallet: Number.NaN } as unknown as HoSoCapExp, Number.NaN, NGAY, Number.NaN)
    expect(la.daNap).toBe(0)
    expect(hapThu({ cap: 5, exp: 0, wallet: 100 }, -50, NGAY, 200).daNap).toBe(0)
    expect(hapThu({ cap: 5, exp: 0, wallet: 100 }, 50, NGAY, 9999).hoSo.hapThu).toEqual({ ngay: NGAY, da: 50 }) // trần kẹp 200
    expect(hapThu({ cap: 5, exp: 0, wallet: 500 }, Number.POSITIVE_INFINITY, NGAY, 9999).daNap).toBe(200)
  })
})

describe('TÍNH CHẤT: mọi chuỗi nạp hợp lệ — SỚM NHẤT cấp 10 là ngày 21, cấp 120 là ngày 1 200', () => {
  type Ngay = 'khong' | 'co_hoc' | 'dat' | 'co_hoc_roi_dat'
  /** Chạy một chuỗi ngày: mỗi ngày 1–3 lần nạp, ống luôn dư (worst case cho luật: em kiếm rất nhiều EXP). Trả về ngày đầu tiên đạt cấp 10 / 120 (0 nếu chưa). */
  function chay(hat: number, soNgay: number, xacSuatDat: number) {
    const r = mulberry32(hat)
    let h: HoSoCapExp = hs({ wallet: 50_000 })
    let tongNap = 0
    let ngayCap10 = 0
    let ngayCap120 = 0
    for (let d = 1; d <= soNgay; d++) {
      const kieu: Ngay = r() < xacSuatDat ? (r() < 0.2 ? 'co_hoc_roi_dat' : 'dat') : r() < 0.6 ? 'co_hoc' : 'khong'
      h = { ...h, wallet: h.wallet + Math.floor(r() * 3000) }
      const ngay = ngayThu(d)
      const lan: number[] = kieu === 'co_hoc_roi_dat' ? [HAP_THU_CO_HOC, HAP_THU_DAT] : kieu === 'dat' ? [HAP_THU_DAT] : kieu === 'co_hoc' ? [HAP_THU_CO_HOC] : [0]
      let napHomNay = 0
      for (const tran of lan) {
        for (let k = 1 + Math.floor(r() * 3); k > 0; k--) {
          const xin = r() < 0.5 ? Number.POSITIVE_INFINITY : Math.floor(r() * 400)
          const ra = hapThu(h, xin, ngay, tran)
          chk(ra.hoSo.wallet + ra.daNap === h.wallet, `d${d} bảo toàn ống`)
          chk(daNapTong(ra.hoSo) - daNapTong(h) === ra.daNap, `d${d} khớp nạp`)
          h = ra.hoSo
          napHomNay += ra.daNap
          tongNap += ra.daNap
          chk(napHomNay <= lan[lan.length - 1]!, `d${d} trần ngày`)
          chk(tongNap <= HAP_THU_DAT * d, `d${d} ≤ 200 × ngày`)
        }
      }
      if (!ngayCap10 && h.cap >= 10) ngayCap10 = d
      if (!ngayCap120 && h.cap >= 120) ngayCap120 = d
      chk(daNapTong(h) <= HAP_THU_DAT * d, `d${d} tổng ≤ 200 × ngày`)
    }
    return { ngayCap10, ngayCap120, h }
  }
  it('2 000 chuỗi ngẫu nhiên (60 ngày, nhiều kiểu học, ống luôn dư): KHÔNG chuỗi nào tới cấp 10 trước ngày 21; tổng nạp mỗi ngày ≤ trần; tổng ≤ 200 × ngày', () => {
    let toiCap10 = 0
    for (let i = 0; i < 2000; i++) {
      const { ngayCap10 } = chay(90_000 + i, 60, 0.3 + (i % 7) * 0.1)
      if (ngayCap10) {
        toiCap10++
        chk(ngayCap10 >= NGAY_SOM_NHAT_CAP_10, `chuỗi ${i}: cấp 10 ở ngày ${ngayCap10} < 21`)
      }
    }
    expect(toiCap10, 'lưới có chuỗi tới cấp 10 để phép kiểm có nghĩa').toBeGreaterThan(300)
  }, 120_000)
  it('em ĐẠT MỌI NGÀY, ống luôn dư ⇒ tới cấp 10 ĐÚNG ngày 21 và cấp 120 ĐÚNG ngày 1 200 (không sớm hơn, không muộn hơn)', () => {
    let h: HoSoCapExp = hs({ wallet: 10_000_000 })
    let cap10 = 0
    let cap120 = 0
    for (let d = 1; d <= 1210; d++) {
      h = hapThu(h, Number.POSITIVE_INFINITY, ngayThu(d), HAP_THU_DAT).hoSo
      if (!cap10 && h.cap >= 10) cap10 = d
      if (!cap120 && h.cap >= 120) cap120 = d
    }
    expect(cap10).toBe(21)
    expect(cap120).toBe(1200)
  })
  it('6 chuỗi dài (1 210 ngày, đạt 90–99 % số ngày): KHÔNG chuỗi nào tới cấp 120 trước ngày 1 200', () => {
    for (let i = 0; i < 6; i++) {
      const { ngayCap120, h } = chay(777 + i, 1210, 0.9 + i * 0.02)
      if (ngayCap120) chk(ngayCap120 >= NGAY_SOM_NHAT_CAP_120, `chuỗi ${i}: cấp 120 ở ngày ${ngayCap120} < 1200`)
      chk(daNapTong(h) <= HAP_THU_DAT * 1210, `chuỗi ${i} tổng`)
    }
  }, 120_000)
  it('em chỉ "có học" (120/ngày) mọi ngày: cấp 10 đúng ngày 35 (khớp bảng đề xuất)', () => {
    let h: HoSoCapExp = hs({ wallet: 10_000_000 })
    let cap10 = 0
    for (let d = 1; d <= 60; d++) {
      h = hapThu(h, Number.POSITIVE_INFINITY, ngayThu(d), HAP_THU_CO_HOC).hoSo
      if (!cap10 && h.cap >= 10) cap10 = d
    }
    expect(cap10).toBe(35)
  })
})

describe('chuyenDoiLuatCap — hồ sơ đã chơi sang đường mới', () => {
  it('VÍ DỤ THẬT: em cấp 7 dư 98 EXP, ống 0, 1 ngày có học ⇒ cấp 2 + 40/200, ống = T − 200; ghi truocSiet + luatCap 2; hôm nay đã hấp thụ 200', () => {
    const cu: HoSoCu = { cap: 7, exp: 98, wallet: 0 }
    const T = 120 + 130 + 150 + 160 + 180 + 190 + 98 // đường cũ: sáu thanh đầu + dở dang
    expect(tongExpTheoDuongCu(7, 98, 0)).toBe(T)
    const r = chuyenDoiLuatCap(cu, 1, NGAY, { luc: '2026-09-21T07:00:00.000Z' })
    expect(r.daChuyen).toBe(true)
    expect(r.hoSo).toMatchObject({ cap: 2, exp: 40, wallet: T - 200, luatCap: LUAT_CAP_MOI, hapThu: { ngay: NGAY, da: 200 } })
    expect(r.hoSo.truocSiet).toEqual({ cap: 7, exp: 98, wallet: 0, luc: '2026-09-21T07:00:00.000Z', dinhGiaLai: { chenh: 0, daTru: 0 }, buDatNgay: 0 })
    expect(r.tongCu).toBe(T)
    expect(r.tongMoi).toBe(T)
    expect(r.daHapThu).toBe(200)
    expect(cu).toEqual({ cap: 7, exp: 98, wallet: 0 }) // không sửa đầu vào
    // hôm chuyển đã ăn 200 ⇒ nạp tiếp hôm nay bị chặn
    expect(hapThu(r.hoSo, 100, NGAY, 200)).toMatchObject({ daNap: 0, lyDo: 'no' })
  })
  it('em có ống nghiệm lớn: hấp thụ min(T, 200 × ngày có học); phần dư về ống; ngày có học = 3 ⇒ 600 (cấp 5 dư 0…): thứ tự rải đúng', () => {
    const r = chuyenDoiLuatCap({ cap: 3, exp: 20, wallet: 1500 }, 3, NGAY)
    const T = 120 + 130 + 20 + 1500
    expect(r.tongCu).toBe(T)
    expect(r.daHapThu).toBe(600) // 200 × 3, dù T = 1 770
    expect(r.hoSo.wallet).toBe(T - 600)
    expect(daNapTong(r.hoSo)).toBe(600)
    expect(r.hoSo).toMatchObject({ cap: 3, exp: 240 }) // 160 + 200 = 360 tới cấp 3; 600 − 360 = 240 dở dang (cấp 4 cần 610)
  })
  it('ĐỊNH GIÁ LẠI thưởng nấc (Điều 9): nấc 1 −10, nấc 2 −30, nấc 3 −40; trừ vào T TRƯỚC khi rải, kẹp ≥ 0; ghi dinhGiaLai; EXP học tập không đổi', () => {
    expect(CHENH_THUONG_NAC).toEqual([0, 10, 30, 40])
    expect(chenhDinhGia([{ stage: 0 }, { stage: 1 }, { stage: 2 }, { stage: 3 }, {}, { stage: 99 }])).toBe(0 + 10 + 30 + 40 + 0 + 40)
    expect(chenhDinhGia(undefined)).toBe(0)
    const cu: HoSoCu = { cap: 4, exp: 5, wallet: 300, mastery: [{ stage: 1 }, { stage: 2 }, { stage: 3 }] }
    const r = chuyenDoiLuatCap(cu, 1, NGAY)
    const T = 120 + 130 + 150 + 5 + 300
    expect(r.tongCu).toBe(T)
    expect(r.tongMoi).toBe(T - 80)
    expect(r.daTruDinhGia).toBe(80)
    expect(r.hoSo.truocSiet).toMatchObject({ dinhGiaLai: { chenh: 80, daTru: 80 }, buDatNgay: 0 })
    expect(r.daHapThu + r.hoSo.wallet).toBe(T - 80)
    // kẹp ≥ 0: em chỉ có 30 EXP mà chênh 80 ⇒ về 0, không âm
    const be = chuyenDoiLuatCap({ cap: 1, exp: 30, wallet: 0, mastery: [{ stage: 1 }, { stage: 2 }, { stage: 3 }] }, 1, NGAY)
    expect(be.tongMoi).toBe(0)
    expect(be.hoSo).toMatchObject({ cap: 1, exp: 0, wallet: 0 })
    expect(be.hoSo.truocSiet).toMatchObject({ dinhGiaLai: { chenh: 80, daTru: 30 } })
    // mastery giữ nguyên (thưởng nấc sau này tính theo bảng mới)
    expect(r.hoSo.mastery).toEqual(cu.mastery)
  })
  it('BÙ BẢNG GIÁ (Điều 10): mỗi ngày đã đạt TRƯỚC 22/09 được cộng 60 vào T trước khi rải, ghi buDatNgay; thứ tự: trừ chênh rồi mới cộng bù', () => {
    expect(BU_DAT_NGAY).toBe(60)
    const cu: HoSoCu = { cap: 2, exp: 10, wallet: 40, mastery: [{ stage: 3 }] }
    const T = 120 + 10 + 40
    const r = chuyenDoiLuatCap(cu, 1, NGAY, { soNgayDatTruocBangGiaMoi: 1 })
    expect(r.tongMoi).toBe(Math.max(0, T - 40) + 60)
    expect(r.buDatNgay).toBe(60)
    expect(r.hoSo.truocSiet).toMatchObject({ dinhGiaLai: { chenh: 40, daTru: 40 }, buDatNgay: 60 })
    expect(r.daHapThu + r.hoSo.wallet).toBe(r.tongMoi)
    // chênh lớn hơn T: T − chênh kẹp về 0 RỒI mới cộng bù (không bù cho phần âm)
    const nho = chuyenDoiLuatCap({ cap: 1, exp: 5, wallet: 0, mastery: [{ stage: 3 }] }, 1, NGAY, { soNgayDatTruocBangGiaMoi: 2 })
    expect(nho.tongMoi).toBe(0 + 120)
    expect(nho.daHapThu + nho.hoSo.wallet).toBe(120)
  })
  it('IDEMPOTENT: chuyển lần hai trả lại CHÍNH hồ sơ (daChuyen = false); luatCap = 2 từ chối đổi', () => {
    const r1 = chuyenDoiLuatCap({ cap: 6, exp: 50, wallet: 700, mastery: [{ stage: 2 }] }, 2, NGAY)
    const r2 = chuyenDoiLuatCap(r1.hoSo, 2, NGAY, { soNgayDatTruocBangGiaMoi: 5 })
    expect(r2.daChuyen).toBe(false)
    expect(r2.hoSo).toBe(r1.hoSo)
    expect(chuyenDoiLuatCap({ cap: 1, exp: 0, wallet: 0, luatCap: 2 }, 9, NGAY).daChuyen).toBe(false)
  })
  it('TÍNH CHẤT 4 000 hồ sơ ngẫu nhiên (cấp cũ 1…120, EXP dở dang hợp lệ, ống, mastery, 0…300 ngày, bù 0…2): bảo toàn tổng, không tăng cấp, ≤ 200 × ngày, hôm nay ≤ 200, idempotent, thuần', () => {
    const r = mulberry32(2109)
    let kepCapCu = 0
    for (let i = 0; i < 4000; i++) {
      const cap = r() < 0.5 ? 1 + Math.floor(r() * 12) : 1 + Math.floor(r() * 120)
      const exp = cap >= 120 ? 0 : Math.floor(r() * thanhExpCu(cap))
      const wallet = r() < 0.3 ? 0 : Math.floor(r() * (r() < 0.5 ? 400 : 50_000))
      const mastery = Array.from({ length: Math.floor(r() * 8) }, () => ({ stage: Math.floor(r() * 4) }))
      const ngay = Math.floor(r() * (r() < 0.6 ? 3 : 300))
      const bu = Math.floor(r() * 3)
      const coHocHomNay = r() < 0.9
      const cu = Object.freeze({ cap, exp, wallet, mastery: Object.freeze(mastery) }) as unknown as HoSoCu
      const ra = chuyenDoiLuatCap(cu, ngay, NGAY, { soNgayDatTruocBangGiaMoi: bu, coHocHomNay })
      const nhan = `#${i} cap${cap} ngày${ngay}`
      const T = tongExpTheoDuongCu(cap, exp, wallet)
      expect(ra.tongCu, nhan).toBe(T)
      expect(ra.tongMoi, nhan).toBe(Math.max(0, T - chenhDinhGia(mastery)) + BU_DAT_NGAY * bu)
      expect(ra.daHapThu + ra.hoSo.wallet, `${nhan} bảo toàn`).toBe(ra.tongMoi)
      expect(daNapTong(ra.hoSo), `${nhan} khớp đã hấp thụ`).toBe(ra.daHapThu)
      expect(ra.daHapThu, nhan).toBeLessThanOrEqual(HAP_THU_DAT * ngay)
      expect(ra.hoSo.cap, `${nhan} KHÔNG tăng cấp`).toBeLessThanOrEqual(cap)
      expect(ra.hoSo.exp, nhan).toBeGreaterThanOrEqual(0)
      expect(ra.hoSo.wallet, nhan).toBeGreaterThanOrEqual(0)
      expect(ra.hoSo.hapThu!.da, nhan).toBeLessThanOrEqual(HAP_THU_DAT)
      expect(ra.hoSo.hapThu!.da, nhan).toBeLessThanOrEqual(ra.daHapThu)
      if (!coHocHomNay) expect(ra.hoSo.hapThu!.da, nhan).toBe(0)
      expect(ra.hoSo.luatCap, nhan).toBe(LUAT_CAP_MOI)
      expect(ra.hoSo.truocSiet, nhan).toMatchObject({ cap, exp, wallet })
      // idempotent + đầu vào không đổi
      expect(chuyenDoiLuatCap(ra.hoSo, ngay + 5, NGAY, { soNgayDatTruocBangGiaMoi: 9 }).hoSo, nhan).toBe(ra.hoSo)
      expect(cu.cap).toBe(cap)
      // thanh chặn "không tăng cấp" thực sự được dùng ở một số ca (ống lớn mà cấp cũ thấp, hoặc cấp cũ ≥ 31 khi đường mới rẻ hơn)
      if (ra.daHapThu < Math.min(ra.tongMoi, HAP_THU_DAT * ngay)) kepCapCu++
      // ĐÚNG CÔNG THỨC: hấp thụ = min(T mới, 200 × ngày, "cuối" cấp cũ); phần thừa về ống
      expect(ra.daHapThu, `${nhan} công thức`).toBe(Math.min(ra.tongMoi, HAP_THU_DAT * ngay, cap < 120 ? tongExpToiCap(cap + 1) - 1 : Number.POSITIVE_INFINITY))
    }
    expect(kepCapCu, 'lưới có ca bị thanh chặn "không tăng cấp" kẹp').toBeGreaterThan(50)
  })
  it('KHÔNG TĂNG CẤP (kẽ hở đã báo Boss): em cấp 40 (đường cũ) + 300 ngày có học KHÔNG lên cấp 41+ dù đường mới rẻ hơn từ cấp 31; em cấp 1 ống 5 000 chỉ tới "cuối" cấp 1 (159/160) — phần thừa về ống, hôm sau nạp tiếp qua cổng', () => {
    const cu: HoSoCu = { cap: 40, exp: 0, wallet: 0 }
    const r = chuyenDoiLuatCap(cu, 300, NGAY)
    const T = tongExpTheoDuongCu(40, 0, 0)
    expect(r.hoSo.cap).toBeLessThanOrEqual(40)
    expect(r.daHapThu + r.hoSo.wallet).toBe(T)
    expect(nhanExp({ capDo: 1, exp: 0 }, Math.min(T, HAP_THU_DAT * 300)).capDo, 'không kẹp thì sẽ lên cao hơn').toBeGreaterThan(40)
    expect(r.hoSo.wallet).toBeGreaterThan(0)
    // em cấp 1, ống lớn: chưa nạp nên cấp cũ thấp; chuyển đổi không đưa em lên cấp 2 ngay hôm chuyển
    const moi = chuyenDoiLuatCap({ cap: 1, exp: 100, wallet: 5000 }, 1, NGAY)
    expect(moi.hoSo).toMatchObject({ cap: 1, exp: 159, wallet: 5100 - 159 })
    expect(hapThu(moi.hoSo, Number.POSITIVE_INFINITY, NGAY, HAP_THU_DAT).daNap).toBe(200 - 159) // hôm nay còn 41 EXP trần ⇒ lên cấp 2 qua CỔNG
  })
  it('sau chuyển đổi, nạp qua cổng hapThu vẫn đúng: em 5 ngày có học, hôm nay chưa đạt ⇒ nạp thêm tối đa phần còn lại của 120 hôm nay', () => {
    const r = chuyenDoiLuatCap({ cap: 5, exp: 0, wallet: 3000 }, 5, NGAY, { luc: 'x' })
    expect(r.hoSo.hapThu).toEqual({ ngay: NGAY, da: 200 }) // 5 ngày × 200 = 1 000 EXP, ngày cuối (hôm nay) 200
    const mai = hapThu(r.hoSo, Number.POSITIVE_INFINITY, '2026-09-22', HAP_THU_CO_HOC)
    expect(mai.daNap).toBe(120)
  })
})
