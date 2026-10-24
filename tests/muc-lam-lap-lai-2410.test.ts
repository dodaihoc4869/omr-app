// Mức làm 24/10 (thầy: «quét lại phần mức 1 tới mức 4… đo giây đọc đề cá nhân hoá», «tính thêm các câu hs lặp lại thì được đọc nhanh hơn bao nhiêu»):
// hệ số lặp (bảng số đo thật), «Thuộc» = nhanh mà ĐÚNG (Mức 1 chỉ còn «Bấm vội»), τ riêng vào ranh Mức 4. Đặc tả docs/DE-XUAT-HOC-THAT-DOI-PHO-2410.md mục 0.
import { describe, expect, it } from 'vitest'
import { HE_SO_LAP, heSoLap, mucLamCuaLuot, tongMucLam } from '../server/src/muc-lam'
import { lapLaiCacLuot, mucLamTuDong } from '../server/src/muc-lam-so'

describe('hệ số lặp', () => {
  it('câu mới thật = 1; song sinh / gặp lần 2 / 3 / 4+ theo bảng từng phần', () => {
    expect(heSoLap('I', null)).toBe(1)
    expect(heSoLap('I', { lan: 0, songSinh: false, ngayCach: null })).toBe(1)
    expect(heSoLap('I', { lan: 0, songSinh: true, ngayCach: null })).toBe(HE_SO_LAP.I[0])
    expect(heSoLap('I', { lan: 1, songSinh: false, ngayCach: 1 })).toBe(0.38)
    expect(heSoLap('I', { lan: 2, songSinh: false, ngayCach: 1 })).toBe(0.3)
    expect(heSoLap('I', { lan: 9, songSinh: false, ngayCach: 1 })).toBe(0.22)
    expect(heSoLap('III', { lan: 1, songSinh: false, ngayCach: 0 })).toBe(0.35)
  })
  it('quên dần: > 7 ngày × 1,6 · 4–7 ngày × 1,15 · không bao giờ vượt 1', () => {
    expect(heSoLap('I', { lan: 1, songSinh: false, ngayCach: 10 })).toBeCloseTo(0.38 * 1.6, 5)
    expect(heSoLap('I', { lan: 1, songSinh: false, ngayCach: 5 })).toBeCloseTo(0.38 * 1.15, 5)
    expect(heSoLap('II', { lan: 1, songSinh: false, ngayCach: 30 })).toBe(1)
  })
})

describe('Mức làm với câu lặp lại + «Thuộc»', () => {
  // 20 từ, không hình ⇒ T_đọc chung = 8 + 0,35 × 20 = 15 s
  const goc = { soTu: 20, coHinh: false, phan: 'I' as const }
  it('câu mới: 10 s sai ⇒ Mức 1 (Bấm vội), không «Thuộc»', () => {
    const m = mucLamCuaLuot({ ...goc, giay: 10, dung: false })!
    expect(m).toMatchObject({ ma: 1, giayDoc: 15 })
    expect(m.thuoc).toBeUndefined()
  })
  it('câu mới: 10 s đúng ⇒ «Thuộc» (vẫn kèm ghi chú cũ cho màn đang chạy)', () => {
    expect(mucLamCuaLuot({ ...goc, giay: 10, dung: true })).toMatchObject({ ma: 1, thuoc: true, ghiChu: 'dung_truoc_doc' })
  })
  it('gặp lần 4: T_đọc 15 × 0,22 ≈ 3 s ⇒ 10 s không còn là Mức 1', () => {
    const m = mucLamCuaLuot({ ...goc, giay: 10, dung: false, lap: { lan: 3, songSinh: false, ngayCach: 1 } })!
    expect(m.giayDoc).toBe(3)
    expect(m.heSoLap).toBe(0.22)
    expect(m.ma).toBeGreaterThan(1)
  })
  it('tổng: `tachThuoc` đưa lượt Thuộc ra khỏi dòng Mức 1; Σ dòng + Thuộc + treo = soDo', () => {
    const luot = [
      { mucLam: mucLamCuaLuot({ ...goc, giay: 5, dung: true }), dung: true },
      { mucLam: mucLamCuaLuot({ ...goc, giay: 5, dung: false }), dung: false },
      { mucLam: mucLamCuaLuot({ ...goc, giay: 40, dung: true }), dung: true },
    ]
    const cu = tongMucLam(luot)
    expect(cu.theoMuc[0].luot).toBe(2)
    expect(cu.soThuoc).toBe(1)
    const moi = tongMucLam(luot, { tachThuoc: true, tachTreo: true })
    expect(moi.theoMuc[0]).toMatchObject({ luot: 1, dung: 0, sai: 1 })
    expect(moi.soThuoc).toBe(1)
    expect(moi.theoMuc.reduce((s, d) => s + d.luot, 0) + moi.soThuoc + moi.soTreo + moi.soCoTinh).toBe(moi.soDo)
  })
})

describe('lapLaiCacLuot — đếm trong danh sách đã đọc', () => {
  it('đếm lượt TRƯỚC theo thời gian (không theo thứ tự mảng), song sinh từ `tc`, ngày cách lần trước', () => {
    const ra = lapLaiCacLuot([
      { sbd: 'A', qid: 'Q1', luc: '2026-10-20T03:00:00Z' },
      { sbd: 'A', qid: 'Q1', luc: '2026-10-10T03:00:00Z' },
      { sbd: 'A', qid: 'Q1-ss1', tc: 'Q1', luc: '2026-10-12T03:00:00Z' },
      { sbd: 'B', qid: 'Q1', luc: '2026-10-21T03:00:00Z' },
    ])
    expect(ra[1]).toEqual({ lan: 0, songSinh: false, ngayCach: null })
    expect(ra[0]).toMatchObject({ lan: 1, songSinh: false })
    expect(ra[0]!.ngayCach).toBeCloseTo(10, 5)
    expect(ra[2]).toEqual({ lan: 0, songSinh: true, ngayCach: null })
    expect(ra[3]).toEqual({ lan: 0, songSinh: false, ngayCach: null })
  })
})

describe('τ riêng vào ranh Mức 4', () => {
  it('cùng β, em nhanh (τ > 0) có thời gian thường ngắn hơn em τ = 0', () => {
    const d = { doMuc: { soTu: 20, coHinh: false, phan: 'I' as const }, giayDo: 60, goc: 'Q1', mucDo: 'hieu', dung: true }
    const beta = new Map([['Q1', Math.log(40_000)]])
    const lop = mucLamTuDong(d, beta)!
    const nhanh = mucLamTuDong({ ...d, tau: 0.5 }, beta)!
    expect(lop.thuong).toBe(40)
    expect(nhanh.thuong).toBe(Math.round(40 * Math.exp(-0.5)))
  })
})
