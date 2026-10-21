// MỨC LÀM BÀI — Mức làm 1–4 của một lượt (thầy 21/10). Bảng ranh giới tính tay từ đặc tả docs/dac-ta-muc-lam-bai-2010.md mục 3:
//   T_đọc = 8 + 0,35 × số từ + 10 nếu có hình (làm tròn); sàn nghĩ I 6 · II 12 · III 15; Mức 4 khi giây ≥ 0,8 × thời gian thường (CHỈ khi β thật).
import { describe, expect, it } from 'vitest'
import { mucLamCuaLuot, SAN_NGHI_GIAY, tongMucLam, type DauVaoMucLam } from '../server/src/muc-lam'
import { thoiGianDoc } from '../src/lib/thoi-gian-len-bang'

const goc: DauVaoMucLam = { giay: 10, soTu: 20, coHinh: false, phan: 'I', dung: false } // T_đọc = 8 + 7 = 15; sàn 6 ⇒ Mức 2 kéo dài tới 21

describe('thoiGianDoc — một hàm cho thời gian đọc', () => {
  it('8 + 0,35 × số từ + 10 nếu có hình', () => {
    expect(thoiGianDoc(0, false)).toBe(8)
    expect(thoiGianDoc(20, false)).toBeCloseTo(15, 10)
    expect(thoiGianDoc(20, true)).toBeCloseTo(25, 10)
    expect(thoiGianDoc(100, true)).toBeCloseTo(53, 10)
  })
})

describe('mucLamCuaLuot — ranh giới', () => {
  it('Mức 1: giây < T_đọc (14 < 15); đúng ranh giới 15 ⇒ Mức 2', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 14 })).toMatchObject({ ma: 1, giay: 14, giayDoc: 15, sanNghi: 6 })
    expect(mucLamCuaLuot({ ...goc, giay: 15 })!.ma).toBe(2)
  })
  it('Mức 2: T_đọc ≤ giây < T_đọc + sàn (15..20); 21 ⇒ Mức 3', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 20 })!.ma).toBe(2)
    expect(mucLamCuaLuot({ ...goc, giay: 21 })!.ma).toBe(3)
  })
  it('Mức 3 khi chưa có thời gian thường thật (không có Mức 4), dù giây rất lớn', () => {
    const r = mucLamCuaLuot({ ...goc, giay: 600 })!
    expect(r.ma).toBe(3)
    expect(r.thuong).toBeUndefined()
  })
  it('Mức 4: chỉ khi β thật; giây ≥ 0,8 × thường (thường 30 ⇒ từ 24 giây); dưới 24 là Mức 3', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 23, thuongGiay: 30 })).toMatchObject({ ma: 3, thuong: 30 })
    expect(mucLamCuaLuot({ ...goc, giay: 24, thuongGiay: 30 })).toMatchObject({ ma: 4, thuong: 30 })
    expect(mucLamCuaLuot({ ...goc, giay: 24, thuongGiay: null })!.ma).toBe(3)
    expect(mucLamCuaLuot({ ...goc, giay: 24, thuongGiay: 0 })!.ma).toBe(3)
  })
  it('thời gian thường nhỏ hơn T_đọc vẫn không kéo lượt ở dưới T_đọc lên Mức 3–4 (thứ tự: Mức 1, 2 trước)', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 12, thuongGiay: 5 })!.ma).toBe(1)
    expect(mucLamCuaLuot({ ...goc, giay: 17, thuongGiay: 5 })!.ma).toBe(2)
    expect(mucLamCuaLuot({ ...goc, giay: 21, thuongGiay: 5 })!.ma).toBe(4)
  })
  it('sàn nghĩ theo phần: I 6 · II 12 · III 15', () => {
    expect(SAN_NGHI_GIAY).toEqual({ I: 6, II: 12, III: 15 })
    // T_đọc 15 ⇒ Mức 2 tới 15 + sàn − 1
    expect(mucLamCuaLuot({ ...goc, phan: 'II', giay: 26 })!.ma).toBe(2)
    expect(mucLamCuaLuot({ ...goc, phan: 'II', giay: 27 })!.ma).toBe(3)
    expect(mucLamCuaLuot({ ...goc, phan: 'III', giay: 29 })!.ma).toBe(2)
    expect(mucLamCuaLuot({ ...goc, phan: 'III', giay: 30 })!.ma).toBe(3)
  })
  it('có hình cộng 10 giây vào T_đọc', () => {
    expect(mucLamCuaLuot({ ...goc, coHinh: true, giay: 24 })).toMatchObject({ ma: 1, giayDoc: 25 })
    expect(mucLamCuaLuot({ ...goc, coHinh: true, giay: 25 })!.ma).toBe(2)
  })
  it('câu chỉ là ảnh (40 từ + hình): T_đọc "≈" 32 s, Mức 1 chỉ khi giây < 16 (0,5 × T_đọc); 16..37 ⇒ Mức 2; từ 38 ⇒ Mức 3', () => {
    const anh = { ...goc, soTu: 40, coHinh: true }
    expect(mucLamCuaLuot({ ...anh, giay: 15 })).toMatchObject({ ma: 1, giayDoc: 32, xapXi: true })
    expect(mucLamCuaLuot({ ...anh, giay: 16 })!.ma).toBe(2)
    expect(mucLamCuaLuot({ ...anh, giay: 31 })!.ma).toBe(2) // dưới T_đọc nhưng đề ảnh ⇒ KHÔNG Mức 1
    expect(mucLamCuaLuot({ ...anh, giay: 37 })!.ma).toBe(2)
    expect(mucLamCuaLuot({ ...anh, giay: 38 })!.ma).toBe(3)
    // 40 từ KHÔNG hình: câu chữ bình thường
    expect(mucLamCuaLuot({ ...goc, soTu: 40, coHinh: false, giay: 20 })!.xapXi).toBeUndefined()
  })
  it('hệ số đọc của em kẹp 0,75–1,5 (vắng ⇒ 1,0)', () => {
    expect(mucLamCuaLuot({ ...goc, heSoDoc: 2, giay: 22 })).toMatchObject({ giayDoc: 23 }) // 15 × 1,5
    expect(mucLamCuaLuot({ ...goc, heSoDoc: 0.1, giay: 12 })).toMatchObject({ giayDoc: 11 }) // 15 × 0,75
    expect(mucLamCuaLuot({ ...goc, giay: 12 })).toMatchObject({ giayDoc: 15 })
  })
  it('lượt ĐÚNG ở Mức 1 chỉ mang ghi chú "đúng trước khi đọc hết đề"; lượt sai / Mức khác không có ghi chú', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 8, dung: true })).toMatchObject({ ma: 1, ghiChu: 'dung_truoc_doc' })
    expect(mucLamCuaLuot({ ...goc, giay: 8, dung: false })!.ghiChu).toBeUndefined()
    expect(mucLamCuaLuot({ ...goc, giay: 8, dung: null })!.ghiChu).toBeUndefined()
    expect(mucLamCuaLuot({ ...goc, giay: 18, dung: true })!.ghiChu).toBeUndefined()
  })
  it('thiếu dữ liệu ⇒ null ("Chưa có số đo"): giây < 1 / NaN / không có số từ / phần lạ', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 0 })).toBeNull()
    expect(mucLamCuaLuot({ ...goc, giay: 0.4 })).toBeNull()
    expect(mucLamCuaLuot({ ...goc, giay: Number.NaN })).toBeNull()
    expect(mucLamCuaLuot({ ...goc, soTu: -1 })).toBeNull()
    expect(mucLamCuaLuot({ ...goc, soTu: Number.NaN })).toBeNull()
    expect(mucLamCuaLuot({ ...goc, phan: 'IV' as never })).toBeNull()
  })
  it('giây lẻ làm tròn; giây 900 (trần đồng hồ) vẫn xếp được', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 14.4 })).toMatchObject({ ma: 1, giay: 14 })
    expect(mucLamCuaLuot({ ...goc, giay: 900 })!.ma).toBe(3)
  })
})

describe('tongMucLam — gộp theo mức', () => {
  const m = (ma: 1 | 2 | 3 | 4, ghiChu?: 'dung_truoc_doc', thuong?: number) => ({ ma, giay: 10, giayDoc: 15, sanNghi: 6, ...(thuong ? { thuong } : {}), ...(ghiChu ? { ghiChu } : {}) })
  it('đếm lượt / đúng / sai theo mức, sai khi làm vội (Mức 1–2) và sai dù đã nghĩ (3–4), chưa có số đo, ghi chú đúng-trước-khi-đọc', () => {
    const t = tongMucLam([
      { mucLam: m(1), dung: false }, { mucLam: m(1), dung: false }, { mucLam: m(1, 'dung_truoc_doc'), dung: true },
      { mucLam: m(2), dung: false }, { mucLam: m(3), dung: true }, { mucLam: m(3), dung: false },
      { mucLam: m(4, undefined, 30), dung: true }, { mucLam: m(4, undefined, 30), dung: null },
      { dung: false }, { mucLam: null, dung: true },
    ])
    expect(t.soDo).toBe(8)
    expect(t.chuaCoSoDo).toBe(2)
    expect(t.theoMuc.map((x) => [x.ma, x.luot, x.dung, x.sai])).toEqual([[1, 3, 1, 2], [2, 1, 0, 1], [3, 2, 1, 1], [4, 2, 1, 1]])
    expect(t.saiLamVoi).toBe(3) // 2 sai Mức 1 + 1 sai Mức 2
    expect(t.saiDuNghi).toBe(2) // 1 sai Mức 3 + 1 bỏ trống Mức 4
    expect(t.dungTruocDoc).toBe(1)
    expect(t.coBetaThat).toBe(true)
  })
  it('tập rỗng / toàn lượt chưa đo: mọi số 0, coBetaThat false', () => {
    expect(tongMucLam([])).toMatchObject({ soDo: 0, chuaCoSoDo: 0, saiLamVoi: 0, saiDuNghi: 0, coBetaThat: false })
    expect(tongMucLam([{ dung: true }, { dung: false }])).toMatchObject({ soDo: 0, chuaCoSoDo: 2 })
  })
  it('ranh giới vào từng mức (ranh2 · ranh3 · ranh4) khớp đúng cách xếp: giây ≥ ranh ⇒ thuộc mức ấy; thường lẻ làm tròn LÊN (0,8 × 123 = 98,4 ⇒ ranh 99)', () => {
    const co = (giay: number, thuongGiay: number | null) => mucLamCuaLuot({ giay, soTu: 20, coHinh: false, phan: 'I', dung: false, thuongGiay })!
    const m = co(50, 123)
    expect([m.ranh2, m.ranh3, m.ranh4]).toEqual([15, 21, 99]) // T_đọc(20 từ) = 15, sàn nghĩ phần I = 6
    expect(co(98, 123).ma).toBe(3)
    expect(co(99, 123).ma).toBe(4)
    expect(co(14, null).ma).toBe(1)
    expect(co(15, null).ma).toBe(2)
    expect(co(21, null).ma).toBe(3)
    expect(co(50, null).ranh4).toBeUndefined()
    // câu chỉ ảnh: ranh Mức làm 2 = ceil(0,5 × T_đọc)
    const a = mucLamCuaLuot({ giay: 16, soTu: 40, coHinh: true, phan: 'I', dung: false })!
    expect([a.giayDoc, a.ranh2, a.ma]).toEqual([32, 16, 2])
    expect(mucLamCuaLuot({ giay: 15, soTu: 40, coHinh: true, phan: 'I', dung: false })!.ma).toBe(1)
  })
})
