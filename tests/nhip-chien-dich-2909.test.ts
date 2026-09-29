// @vitest-environment node
// LUẬT CHẬM NHỊP CHUNG (29/09): trang Chiến dịch và Tổng quan phải ra CÙNG một trạng thái cho cùng một chiến dịch;
// chiến dịch vừa giao (ngày thứ 1) không bao giờ Chậm nhịp. Nguyên nhân lỗi cũ: so "đã làm qua" với mức cần HẾT HÔM NAY (1/8 = 12,5%)
// ngay từ phút đầu ⇒ 0 < 12,5% − 10% ⇒ Chậm nhịp; Tổng quan còn so sát nút với mức cần theo giờ.
import { describe, expect, it } from 'vitest'
import { laChamNhip, mucCanHetHomQua } from '../src/lib/nhip-chien-dich'
import { trangThaiHien } from '../src/components/chien-dich/DsChienDichDaGiao'
import { dongChienDich } from '../src/lib/tong-quan-gv'
import type { BangChienDich, ChienDichTom, ThongKeChienDich } from '../src/components/chien-dich/api'

const CD = { id: 'x', ten: 'CD', lop: '12', maDe: [], hanNop: '2026-10-05', theLucNgay: 40, huyetChien: false, maCa: null, taoLuc: '2026-09-29T01:00:00Z', trangThai: 'dang_chay', soCau: 100, soEm: 41, hetHan: false } as unknown as ChienDichTom
const tk = (coXat: number, ngayThu: number, tongNgay: number): ThongKeChienDich => ({ coXat, thanhThao: 0, dungNhip: 0, emLamQuaDu: 0, quaTai: 0, canDayLaiCau: 0, canDayLaiLuot: 0, mucCanHomNay: ngayThu / tongNgay, ngayThu, tongNgay })
const bang = (coXat: number, ngayThu: number, tongNgay: number): BangChienDich =>
  ({ chienDich: CD, homNay: '2026-09-29', hetHan: false, lop: { coXat, thanhThao: 0, huyetChien: 0, canDayLaiCau: 0, canDayLaiLuot: 0, mucCanHomNay: ngayThu / tongNgay, ngayThu, tongNgay }, dang: [], em: [], canDayLai: [] }) as BangChienDich
const now = Date.parse('2026-09-29T03:00:00Z')

describe('luật Chậm nhịp chung', () => {
  it('mức cần tới hết hôm qua = (ngày thứ − 1) / tổng ngày; máy chủ cũ ⇒ lùi về mức cần hôm nay', () => {
    expect(mucCanHetHomQua({ ngayThu: 1, tongNgay: 8 })).toBe(0)
    expect(mucCanHetHomQua({ ngayThu: 5, tongNgay: 10 })).toBe(0.4)
    expect(mucCanHetHomQua({ mucCanHomNay: 0.3 })).toBe(0.3)
  })
  it('ngày đầu (0% làm qua) ⇒ KHÔNG Chậm nhịp ở cả hai màn', () => {
    expect(trangThaiHien({ ...CD, thongKe: tk(0, 1, 8) })).toBe('dang_chay')
    expect(dongChienDich(CD, bang(0, 1, 8), now).nhip).toBe('dung')
  })
  it('hai màn ra cùng một trạng thái cho mọi mức', () => {
    for (const [coXat, ngayThu, tongNgay] of [[0, 2, 8], [0, 3, 8], [0.2, 3, 8], [0.5, 5, 8], [0.1, 4, 15]] as const) {
      const ds = trangThaiHien({ ...CD, thongKe: tk(coXat, ngayThu, tongNgay) }) === 'cham_nhip'
      const tq = dongChienDich(CD, bang(coXat, ngayThu, tongNgay), now).nhip === 'cham'
      expect(tq).toBe(ds)
      expect(ds).toBe(laChamNhip(coXat, { ngayThu, tongNgay }))
    }
    expect(laChamNhip(0, { ngayThu: 3, tongNgay: 8 })).toBe(true) // hụt 25% > 10đ%
    expect(laChamNhip(0.2, { ngayThu: 3, tongNgay: 8 })).toBe(false)
  })
})
