// @vitest-environment node
// B3 CHUỖI NGÀY THEO BÀI + BÌNH GIỮ CHUỖI (thầy chốt 26/10; docs/hop-dong-duolingo-2610.md mục 4–5) — hàm thuần chuoiNgayCuaEm.
import { describe, expect, it } from 'vitest'
import { chuoiNgayCuaEm, thuHaiCua, CAU_MOT_BAI, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'

const nk = (o: { hoc?: Record<string, number>; tuSua?: string[]; phep?: string[]; mua?: Record<string, number> } = {}): NhatKyChuoi =>
  ({ soCau: new Map(Object.entries(o.hoc ?? {})), tuSua: new Set(o.tuSua ?? []), phep: new Set(o.phep ?? []), mua: new Map(Object.entries(o.mua ?? {})) })
const ngay = (dau: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${dau}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10))
const hocCacNgay = (ds: string[], cau = CAU_MOT_BAI) => Object.fromEntries(ds.map(d => [d, cau]))
// 26/10/2026 là thứ Hai.
describe('chuoiNgayCuaEm', () => {
  it('thứ Hai đầu tuần đúng', () => { expect(thuHaiCua('2026-10-26')).toBe('2026-10-26'); expect(thuHaiCua('2026-11-01')).toBe('2026-10-26') })
  it('ngày đạt = xong ≥ 1 bài (≥ 6 câu); 5 câu không tính; tự sửa xong 1 câu thì tính', () => {
    expect(chuoiNgayCuaEm(nk({ hoc: { '2026-10-27': 6, '2026-10-28': 6 } }), '2026-10-28').so).toBe(2)
    expect(chuoiNgayCuaEm(nk({ hoc: { '2026-10-27': 6, '2026-10-28': 5 } }), '2026-10-28').so).toBe(1) // hôm nay chưa đủ ⇒ giữ tới hôm qua
    expect(chuoiNgayCuaEm(nk({ hoc: { '2026-10-27': 6 }, tuSua: ['2026-10-28'] }), '2026-10-28').so).toBe(2)
  })
  it('hôm nay chưa học ⇒ chuỗi giữ tới hôm qua, lịch hôm nay "cho"', () => {
    const r = chuoiNgayCuaEm(nk({ hoc: hocCacNgay(ngay('2026-10-26', 3)) }), '2026-10-29')
    expect(r.so).toBe(3); expect(r.lich7.at(-1)).toEqual({ ngay: '2026-10-29', kieu: 'cho' })
  })
  it('lỡ một ngày: bình tặng thứ Hai đỡ, chuỗi giữ nhưng không cộng ngày; ghi binhVuaDo', () => {
    // Bắt đầu thứ Hai 26/10 (được 1 bình), lỡ 28/10.
    const r = chuoiNgayCuaEm(nk({ hoc: hocCacNgay(['2026-10-26', '2026-10-27', '2026-10-29']) }), '2026-10-29')
    expect(r.so).toBe(3); expect(r.giuChuoi).toBe(0); expect(r.binhVuaDo).toBe('2026-10-28')
    expect(r.lich7.slice(-4).map(x => x.kieu)).toEqual(['hoc', 'hoc', 'binh', 'hoc'])
  })
  it('vắng có phép: giữ chuỗi, KHÔNG tốn bình', () => {
    const r = chuoiNgayCuaEm(nk({ hoc: hocCacNgay(['2026-10-26', '2026-10-27', '2026-10-29']), phep: ['2026-10-28'] }), '2026-10-29')
    expect(r.so).toBe(3); expect(r.giuChuoi).toBe(1); expect(r.binhVuaDo).toBeUndefined()
  })
  it('bình mang tối đa 2 (thứ Hai cộng dồn), mua thêm không vượt sức chứa', () => {
    const hoc = hocCacNgay(ngay('2026-10-26', 22)) // 3 thứ Hai: 26/10, 2/11, 9/11, 16/11
    expect(chuoiNgayCuaEm(nk({ hoc }), '2026-11-16').giuChuoi).toBe(2)
    expect(chuoiNgayCuaEm(nk({ hoc: hocCacNgay(['2026-10-27']), mua: { '2026-10-27': 5 } }), '2026-10-27').giuChuoi).toBe(2)
  })
  it('mốc 30 ngày tặng 1 bình; mốc 100 ngày nâng sức chứa lên 3', () => {
    const r30 = chuoiNgayCuaEm(nk({ hoc: hocCacNgay(ngay('2026-10-27', 30)) }), '2026-11-25') // bắt đầu thứ Ba: thứ Hai 2/11,9/11,16/11,23/11
    expect(r30.so).toBe(30); expect(r30.sucChua).toBe(2); expect(r30.giuChuoi).toBe(2)
    const r100 = chuoiNgayCuaEm(nk({ hoc: hocCacNgay(ngay('2026-10-26', 100)) }), '2027-02-02')
    expect(r100.so).toBe(100); expect(r100.sucChua).toBe(3)
  })
  it('hết bình mà lỡ ngày ⇒ tắt; hôm sau học 3 bài (1 + 2 bù) ⇒ sống lại đúng số cũ', () => {
    // Bắt đầu thứ Ba 27/10 (chưa có bình), học 27–29, lỡ 30, 31 học 18 câu.
    const hoc = { ...hocCacNgay(['2026-10-27', '2026-10-28', '2026-10-29']), '2026-10-31': 3 * CAU_MOT_BAI }
    const r = chuoiNgayCuaEm(nk({ hoc }), '2026-10-31')
    expect(r.so).toBe(4); expect(r.lich7.find(x => x.ngay === '2026-10-30')!.kieu).toBe('cuu')
  })
  it('đang trong hạn cứu (hôm nay mới 1 bài) ⇒ chuỗi tạm tắt, trả cuu {daLam 0/2, soCu}', () => {
    const hoc = { ...hocCacNgay(['2026-10-27', '2026-10-28', '2026-10-29']), '2026-10-31': CAU_MOT_BAI }
    const r = chuoiNgayCuaEm(nk({ hoc }), '2026-10-31')
    expect(r.so).toBe(1)
    expect(r.cuu).toMatchObject({ daLam: 0, can: 2, soCu: 3, hetHan: '2026-10-31T17:00:00.000Z' })
  })
  it('cứu tối đa 1 lần mỗi tuần', () => {
    const hoc = { ...hocCacNgay(['2026-10-27', '2026-10-28']), '2026-10-30': 18, '2026-11-01': 18 } // lỡ 29 (cứu bằng 30), lỡ 31 (tuần đã cứu ⇒ tắt)
    const r = chuoiNgayCuaEm(nk({ hoc }), '2026-11-01')
    expect(r.lich7.find(x => x.ngay === '2026-10-29')!.kieu).toBe('cuu')
    expect(r.lich7.find(x => x.ngay === '2026-10-31')!.kieu).toBe('tat')
    expect(r.so).toBe(1)
  })
  it('chưa học bao giờ ⇒ 0, lịch 7 ngày đủ 7 ô', () => {
    const r = chuoiNgayCuaEm(nk(), '2026-10-29')
    expect(r.so).toBe(0); expect(r.lich7).toHaveLength(7)
  })
})
