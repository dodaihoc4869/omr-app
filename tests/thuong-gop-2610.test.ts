// @vitest-environment node
// GỘP ĐỢT 3 THƯỞNG PHẠT (26/10): phần bổ sung lúc gộp — lịch tháng + chuỗi dài nhất (B3, chỉ khi nơi gọi xin) và khối `giai` của /hs/thuong.
import { describe, expect, it } from 'vitest'
import { chuoiNgayCuaEm, CAU_MOT_BAI, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'
import { docTomTatGiai } from '../server/src/thuong-giai-tuan'
import { docChuoiNgay, docTongQuan } from '../src/lib/thuong-api'

const nk = (hoc: Record<string, number>): NhatKyChuoi => ({ soCau: new Map(Object.entries(hoc)), tuSua: new Set(), phep: new Set(), mua: new Map() })
const ngay = (dau: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${dau}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10))

describe('chuoiNgayCuaEm — lịch 30 ngày + chuỗi dài nhất', () => {
  // 5 ngày học (01–05/10), lỡ dài (chuỗi tắt), rồi 3 ngày học (24–26/10); hôm nay 27/10 chưa học.
  const hoc = Object.fromEntries([...ngay('2026-10-01', 5), ...ngay('2026-10-24', 3)].map((d) => [d, CAU_MOT_BAI]))
  it('mặc định KHÔNG kèm (phản hồi lệnh nóng giữ nguyên cỡ)', () => {
    const r = chuoiNgayCuaEm(nk(hoc), '2026-10-27')
    expect(r.lich30).toBeUndefined(); expect(r.daiNhat).toBeUndefined()
  })
  it('thang = true ⇒ lich30 đủ 30 ô kết thúc hôm nay, daiNhat = chuỗi dài nhất trong cửa sổ', () => {
    const r = chuoiNgayCuaEm(nk(hoc), '2026-10-27', true)
    expect(r.so).toBe(3)
    expect(r.daiNhat).toBe(5)
    expect(r.lich30).toHaveLength(30)
    expect(r.lich30!.at(-1)).toEqual({ ngay: '2026-10-27', kieu: 'cho' })
    expect(r.lich30!.slice(-7)).toEqual(r.lich7)
  })
})

describe('giao diện đọc chuỗi + giải đúng trường máy chủ', () => {
  it('đọc cả ô "cho" (hôm nay chưa học), "cuu", cuu.soCu, lich30, daiNhat', () => {
    const r = chuoiNgayCuaEm(nk(Object.fromEntries(ngay('2026-10-20', 5).map((d) => [d, CAU_MOT_BAI]))), '2026-10-25', true)
    const c = docChuoiNgay(JSON.parse(JSON.stringify({ ...r, cuu: { hetHan: '2026-10-25T16:59:59.000Z', daLam: 0, can: 2, soCu: 9 } })))!
    expect(c.lich7).toHaveLength(7)
    expect(c.lich7.at(-1)!.kieu).toBe('cho')
    expect(c.lich30).toHaveLength(30)
    expect(c.daiNhat).toBe(5)
    expect(c.cuu).toMatchObject({ daLam: 0, can: 2, so: 9 })
  })
  it('khối giai: máy chủ trả null ⇒ giao diện không có giai; có ⇒ đủ 4 trường', () => {
    expect(docTongQuan({ ok: true, bat: {}, thongBao: [], giai: null })!.giai).toBeUndefined()
    const g = docTomTatGiai('S1', [[], [{ hang: 'bac', nhom: 'n1', nguyen_tu: 50, nguyen_tu_ho_tro: 0 }], [], [
      { em: 'S1', nguyen_tu: 50, ho_tro: 0, vao_luc: '2026-10-26T01:00:00Z', bac: null, ho_ten: 'Nguyễn Văn An', lop: '12A' },
      { em: 'S2', nguyen_tu: 80, ho_tro: 0, vao_luc: '2026-10-26T02:00:00Z', bac: null, ho_ten: 'Trần Thị Bình', lop: '12B' },
    ]], Date.parse('2026-10-27T03:00:00Z'))
    expect(g).toMatchObject({ hang: 'bac', thuHang: 2, soNguoi: 2 })
    expect(docTongQuan({ ok: true, bat: {}, thongBao: [], giai: g })!.giai).toMatchObject({ hang: 'bac', thuHang: 2, soNguoi: 2 })
  })
})
