// @vitest-environment node
// THẦY LỆNH 21/09/2026: "Siết độ khó lấy khiên: ít nhất học đều 21 ngày mới lấy được khiên đầu tiên." (DE-XUAT-EXP-MANH-KHIEN-1909.md mục 4.)
// Tính chất: em ĐẠT MỌI NGÀY, hưởng MỌI thưởng mảnh cũ (chuỗi bội 7, dạng rời yếu MỖI ngày) ⇒ khiên RÈN đầu tiên KHÔNG sớm hơn ngày thứ 21.
import { describe, expect, it } from 'vitest'
import { congManh, tinhExp, type KhienRen, type VaoTinhExp } from '../server/src/exp-hoc-tap'

const ngayThu = (k: number): string => new Date(Date.UTC(2026, 8, 1) + (k - 1) * 86_400_000).toISOString().slice(0, 10)
const vaoNgay = (k: number, o: Partial<VaoTinhExp> = {}): VaoTinhExp => ({
  ngay: ngayThu(k), suKien: [], metaCau: {}, mucTieuCau: 8, lenBac: [], khacPhuc: [], loXong: [], baiBtvnNop: [], momXong: [], diemCa: [],
  datNgay: { chuoi: k, luc: `${ngayThu(k)}T10:00:00.000Z` }, // đạt mọi ngày, chuỗi liên tục
  dangRoiYeu: [{ maDang: 'ES-01', lan: k, luc: `${ngayThu(k)}T11:00:00.000Z` }, { maDang: 'AM-02', lan: k, luc: `${ngayThu(k)}T11:30:00.000Z` }], // MỌI ngày có dạng rời yếu
  daCoKhoa: new Set(), ...o,
})

/** Mô phỏng: cộng mảnh mỗi ngày như đường `capNhatExp`; trả ngày (1-based) rèn được khiên đầu tiên, hoặc null. */
function ngayKhienDauTien(soNgay: number, dau: KhienRen = { manh: 0, daRen: 0 }): number | null {
  let k: KhienRen = dau
  for (let ngay = 1; ngay <= soNgay; ngay++) {
    const them = tinhExp(vaoNgay(ngay)).manh.reduce((t, m) => t + m.so, 0)
    const sau = congManh(k, them, 0)
    if (sau.daRen > k.daRen) return ngay
    k = sau
  }
  return null
}

describe('khiên RÈN đầu tiên không sớm hơn ngày thứ 21 (mọi thưởng cũ bật hết)', () => {
  it('em đạt 100 ngày liền, mọi ngày có chuỗi + dạng rời yếu: khiên đầu tiên đúng ngày 21, khiên thứ hai đúng ngày 42', () => {
    expect(ngayKhienDauTien(100)).toBe(21)
    let k: KhienRen = { manh: 0, daRen: 0 }
    const ngayRen: number[] = []
    for (let ngay = 1; ngay <= 63; ngay++) {
      const sau = congManh(k, tinhExp(vaoNgay(ngay)).manh.reduce((t, m) => t + m.so, 0), 0)
      if (sau.daRen > k.daRen) ngayRen.push(ngay)
      k = sau
    }
    expect(ngayRen).toEqual([21, 42, 63])
  })
  it('20 ngày đạt thì CHƯA có khiên; mỗi ngày đạt cộng đúng 1 mảnh dù chuỗi bội 7 và có dạng rời yếu', () => {
    expect(ngayKhienDauTien(20)).toBeNull()
    for (const k of [1, 6, 7, 14, 21, 13, 20, 21]) expect(tinhExp(vaoNgay(k)).manh.reduce((t, m) => t + m.so, 0), `ngày ${k}`).toBe(1)
  })
  it('khoá sổ của chuỗi 7 và dạng rời yếu VẪN được ghi (0 mảnh) — chạy lại không sinh lại; ngày không đạt thì 0 mảnh', () => {
    const r = tinhExp(vaoNgay(7))
    expect(r.manh.map((m) => [m.loai, m.so]).sort()).toEqual([['chuoi7', 0], ['dang', 0], ['dang', 0], ['dat', 1]])
    const dacoKhoa = new Set(r.manh.map((m) => m.khoa))
    expect(tinhExp(vaoNgay(7, { daCoKhoa: dacoKhoa })).manh).toEqual([])
    expect(tinhExp(vaoNgay(7, { datNgay: null })).manh.reduce((t, m) => t + m.so, 0)).toBe(0 + 0) // dạng rời yếu vẫn 0 mảnh khi không đạt
  })
  it('mảnh em ĐANG có giữ nguyên (7 mảnh cũ ⇒ 7/21): cần đúng 14 ngày đạt nữa, không sớm hơn; khiên đã rèn giữ nguyên', () => {
    expect(ngayKhienDauTien(13, { manh: 7, daRen: 1 })).toBeNull()
    expect(ngayKhienDauTien(60, { manh: 7, daRen: 1 })).toBe(14)
    expect(congManh({ manh: 7, daRen: 1 }, 0, 0)).toEqual({ manh: 7, daRen: 1 })
    expect(congManh({ manh: 20, daRen: 2 }, 0, 0)).toEqual({ manh: 20, daRen: 2 }) // 12–20 mảnh cũ đang giữ vì trần 5 khiên chưa dùng: không tự rèn ngay, không mất
  })
})
