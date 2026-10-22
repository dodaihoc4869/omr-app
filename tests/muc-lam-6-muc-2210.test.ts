// @vitest-environment node
// MỨC LÀM 6 MỨC (thầy 22/10: thêm "treo máy", "cố tình treo máy"; đặc tả docs/dac-ta-muc-lam-6-muc-2210.md mục 3–4, 7).
import { describe, expect, it } from 'vitest'
import { ghepDocVaoRaw, lamSachDo } from '../server/src/do-giay-luot'
import { docDoMuc } from '../server/src/muc-lam-so'
import { mucCongKhai, mucLamCuaLuot, nangCoTinhTheoNgay, tongCongKhai, tongMucLam, treoCuaLuot, type DauVaoMucLam } from '../server/src/muc-lam'

const goc: DauVaoMucLam = { giay: 185, soTu: 40, coHinh: false, phan: 'III', dung: false }
const treo = (v: number, a: number, l: number, n = 0, w: 0 | 1 = 0) => ({ v, a, l, n, w })

describe('đo treo máy: máy chủ nhận và ghi số đo', () => {
  it('nhận v a l n w (nguyên, kẹp khoảng), l không vượt v; thiếu v/a/l ⇒ chưa đo; không có g ⇒ không nhận', () => {
    expect(lamSachDo({ g: 185, v: 640.4, a: 0, l: 600, n: 0, w: 1 })?.treo).toEqual({ v: 640, a: 0, l: 600, n: 0, w: 1 })
    expect(lamSachDo({ g: 30, v: 90000, a: -5, l: 10 })?.treo).toBeUndefined()
    expect(lamSachDo({ g: 30, v: 90000, a: 3, l: 99999, n: 500 })?.treo).toEqual({ v: 7200, a: 3, l: 7200, n: 60, w: 0 })
    expect(lamSachDo({ g: 30, v: 40, a: 0, l: 80 })?.treo?.l).toBe(40)
    expect(lamSachDo({ g: 30, t: 12 })?.treo).toBeUndefined()
    expect(lamSachDo({ t: 12, v: 40, a: 0, l: 5 })?.treo).toBeUndefined()
  })

  it('ghi vào raw_json.doc rồi đọc lại đúng (một vòng), lượt cũ không có trường ⇒ không có treo', () => {
    const d = { ...lamSachDo({ g: 185, v: 640, a: 12, l: 600, n: 1, w: 1 })!, tu: 40, hinh: 0 as const, phan: 'III' as const }
    const raw = ghepDocVaoRaw({ chon: 'A' }, d) as Record<string, unknown>
    expect(raw.chon).toBe('A')
    expect(docDoMuc(raw)?.treo).toEqual({ v: 640, a: 12, l: 600, n: 1, w: 1 })
    expect(docDoMuc({ doc: { t: 40, p: 'III', dh: 1 } })?.treo).toBeUndefined()
  })
})

describe('lõi: Mức làm 5 · Treo máy, Mức làm 6 · Cố tình treo máy', () => {
  it('treo 10 phút rồi bấm: giây làm 185 (Mức 3 theo giây) nhưng đè thành Treo máy, kèm giây treo', () => {
    const m = mucLamCuaLuot({ ...goc, treo: treo(640, 0, 600) })!
    expect(m.ma).toBe(3)
    expect(m.treo).toBe('treo')
    expect(m.giayTreo).toBe(600)
    expect(m.chuaDoTreo).toBeUndefined()
  })

  it('tính nháp 4 phút có chạm (lặng dài nhất 100 giây) ⇒ KHÔNG treo; lặng 299 giây ⇒ không; 300 ⇒ treo', () => {
    expect(mucLamCuaLuot({ ...goc, treo: treo(240, 0, 100) })!.treo).toBeUndefined()
    expect(treoCuaLuot(treo(320, 0, 299))).toBeNull()
    expect(treoCuaLuot(treo(320, 0, 300))).toBe('treo')
  })

  it('rời app: giữ được màn sáng ⇒ 180 giây là treo; không giữ được (màn có thể tự tắt) ⇒ phải 600 giây', () => {
    expect(treoCuaLuot(treo(60, 200, 30, 0, 1))).toBe('treo')
    expect(treoCuaLuot(treo(60, 200, 30, 0, 0))).toBeNull()
    expect(treoCuaLuot(treo(60, 650, 30, 0, 0))).toBe('treo')
  })

  it('ba lần lặng 2–3 phút rồi chạm trước ngưỡng cắt (n = 3) ⇒ Cố tình treo máy; n = 2 ⇒ chưa', () => {
    expect(treoCuaLuot(treo(500, 0, 170, 3))).toBe('co_tinh')
    expect(treoCuaLuot(treo(500, 0, 170, 2))).toBeNull()
  })

  it('lượt chưa có số đo treo (máy em cũ) ⇒ chuaDoTreo, không đoán; giây cũ/ước tính không bao giờ có treo', () => {
    expect(mucLamCuaLuot(goc)!.chuaDoTreo).toBe(true)
    expect(mucLamCuaLuot({ ...goc, uocTinh: 'cu', treo: treo(640, 0, 600) })!.treo).toBeUndefined()
  })

  it('cùng một ngày ≥ 3 lượt treo ⇒ cả ba thành Cố tình; 2 lượt ⇒ giữ Treo; ngày khác không cộng dồn', () => {
    const t = mucLamCuaLuot({ ...goc, treo: treo(640, 0, 600) })!
    const ba = nangCoTinhTheoNgay([{ ngay: 'A', mucLam: t }, { ngay: 'A', mucLam: t }, { ngay: 'A', mucLam: t }, { ngay: 'B', mucLam: t }])
    expect(ba.map((x) => x.mucLam?.treo)).toEqual(['co_tinh', 'co_tinh', 'co_tinh', 'treo'])
    expect(t.treo).toBe('treo') // không sửa đầu vào
    expect(nangCoTinhTheoNgay([{ ngay: 'A', mucLam: t }, { ngay: 'A', mucLam: t }]).map((x) => x.mucLam?.treo)).toEqual(['treo', 'treo'])
  })

  it('bản công khai (máy chiếu, học sinh, phụ huynh): Mức 6 hạ về Mức 5', () => {
    const c = mucLamCuaLuot({ ...goc, treo: treo(500, 0, 170, 3) })!
    expect(mucCongKhai(c).treo).toBe('treo')
    expect(mucCongKhai(null)).toBeNull()
    const tong = tongMucLam([{ mucLam: c, dung: false }])
    expect([tong.soTreo, tong.soCoTinh]).toEqual([0, 1])
    expect([tongCongKhai(tong).soTreo, tongCongKhai(tong).soCoTinh]).toEqual([1, 0])
  })

  it('tổng: mặc định bốn dòng như cũ (lượt treo vẫn theo giây); tachTreo ⇒ lượt treo ra khỏi bốn dòng và khỏi "sai dù đã nghĩ"', () => {
    const t = mucLamCuaLuot({ ...goc, treo: treo(640, 0, 600) })!
    const thuong = mucLamCuaLuot({ ...goc, treo: treo(200, 0, 60) })!
    const ds = [{ mucLam: t, dung: false }, { mucLam: thuong, dung: false }, { mucLam: mucLamCuaLuot(goc), dung: true }]
    const cu = tongMucLam(ds)
    expect([cu.soDo, cu.theoMuc[2].luot, cu.saiDuNghi, cu.soTreo, cu.soChuaDoTreo]).toEqual([3, 3, 2, 1, 1])
    const moi = tongMucLam(ds, { tachTreo: true })
    expect([moi.soDo, moi.theoMuc[2].luot, moi.saiDuNghi, moi.soTreo]).toEqual([3, 2, 1, 1])
  })
})
