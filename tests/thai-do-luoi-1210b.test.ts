// Thầy 12/10 duyệt bản vẽ: nhãn thái độ trong tấm Hồ sơ làm bài dùng CÙNG luật nhóm Nhịp học ở Hôm nay —
// Lười = đủ mức ≤ 40% số ngày đã tính HOẶC ≥ 3 ngày liền không làm; Chăm chỉ ≥ 80%; ở giữa Chưa đều.
// SỬA CÓ CHỦ ĐÍCH 12/10 (thầy chốt: "6 ngày liền làm đủ mới thoát nhóm lười nhé"): Lười chỉ khi chuỗi ngày đủ mức liền GẦN NHẤT < 6
// (lùi từ hôm qua; hôm nay đã đủ thì cộng hôm nay); thoát rồi ≥ 80% là Chăm, còn lại Chưa đều. Hai bên (hồ sơ + Hôm nay) cùng một phép thuần.
import { describe, expect, it } from 'vitest'
import { ketLuanThaiDo, tinhThaiDo } from '../server/src/bai-hang-ngay'
import { NGUONG_THAI_DO, type MucTinHieu, type NgayBaiEm, type TinHieuThaiDo } from '../server/src/bai-hang-ngay-kieu'
import { LUAT_NHOM_NHIP } from '../server/src/nhip-hoc-kieu'
import { chuoiDuGanNhat, ngayDuCanThemDeCham, nhomNhipTheoLuat } from '../server/src/nhip-hoc-luat'
import { nhomTheoLuat } from '../src/lib/nhip-hoc-thay'

const tin = (ma: TinHieuThaiDo['ma'], muc: MucTinHieu, tu = 0, mau = 0): TinHieuThaiDo =>
  ({ ma, ten: ma, tu, mau, giaTri: mau ? Math.round((tu / mau) * 100) : null, muc, chu: ma, nguong: '' }) as TinHieuThaiDo

/** Sáu tín hiệu: (a) ngày đủ mức `du`/`n`, các tín hiệu khác trong ngưỡng. */
function bo(du: number, n: number): TinHieuThaiDo[] {
  const p = (du / n) * 100
  return [
    tin('ngay-du-muc', n < 3 ? 'chua-du' : p >= 80 ? 'tot' : p >= 50 ? 'chu-y' : 'xau', du, n),
    tin('qua-nhanh', 'tot'), tin('don-bai', 'tot'), tin('goi-y', 'tot'), tin('chon-lap', 'tot'), tin('xu-huong', 'tot'),
  ]
}

describe('nhãn thái độ = luật nhóm Nhịp học', () => {
  it.each([
    [9, 11, 0, 'cham-chi', 'cham'],
    [7, 11, 0, 'chua-deu', 'chua-deu'],
    [5, 11, 0, 'chua-deu', 'chua-deu'],
    [4, 11, 0, 'luoi', 'luoi'],
    [0, 11, 11, 'luoi', 'luoi'],
    [9, 11, 3, 'luoi', 'luoi'],
    [2, 2, 0, 'chua-du-du-lieu', 'chua-du'],
  ] as const)('đủ %i/%i ngày, %i ngày liền không làm ⇒ hồ sơ %s, Hôm nay %s', (du, n, chuoi, nhan, nhom) => {
    expect(ketLuanThaiDo(bo(du, n), chuoi).nhan).toBe(nhan)
    expect(nhomTheoLuat(n, du, chuoi)).toBe(nhom)
  })

  it('Lười vì chuỗi ngày bỏ ⇒ lý do ghi rõ số ngày liền', () => {
    const k = ketLuanThaiDo(bo(9, 11), 4)
    expect(k.chu).toBe('Lười')
    expect(k.lyDo.join(' ')).toContain('4 ngày liền không làm câu nào')
  })
})

describe('thoát nhóm Lười: đủ mức 6 ngày liền (thầy chốt 12/10) — hồ sơ thầy và Hôm nay cùng kết quả', () => {
  it('một hằng số ở cả hai hợp đồng', () => {
    expect(LUAT_NHOM_NHIP.ngayLienThoatLuoi).toBe(6)
    expect(NGUONG_THAI_DO.ngayLienThoatLuoi).toBe(LUAT_NHOM_NHIP.ngayLienThoatLuoi)
  })
  it.each([
    // du, n, chuỗi bỏ, chuỗi đủ gần nhất ⇒ hồ sơ, Hôm nay
    [4, 11, 0, 6, 'chua-deu', 'chua-deu'], // 36% mà đủ 6 ngày liền ⇒ thoát, chưa tới 80% ⇒ Chưa đều
    [4, 11, 0, 5, 'luoi', 'luoi'], // 5 ngày ⇒ vẫn Lười
    [12, 15, 3, 6, 'cham-chi', 'cham'], // ≥ 80% + có 3 ngày bỏ nhưng đủ 6 ngày liền gần nhất ⇒ Chăm
    [12, 15, 3, 5, 'luoi', 'luoi'],
    [9, 11, 0, 0, 'cham-chi', 'cham'], // không Lười thì chuỗi không đổi gì
  ] as const)('đủ %i/%i ngày, bỏ %i ngày liền, đủ liền %i ⇒ hồ sơ %s, Hôm nay %s', (du, n, bo3, lien, nhan, nhom) => {
    expect(ketLuanThaiDo(bo(du, n), bo3, lien).nhan).toBe(nhan)
    expect(nhomTheoLuat(n, du, bo3, lien)).toBe(nhom)
    expect(nhomNhipTheoLuat(n, du, bo3, lien)).toBe(nhom)
  })
  it('vừa thoát ⇒ lý do bằng số nói rõ đã ra khỏi nhóm Lười', () => {
    expect(ketLuanThaiDo(bo(4, 11), 0, 6).lyDo.join(' ')).toContain('Đủ mức 6 ngày liền gần nhất — đã ra khỏi nhóm Lười (cần 6 ngày liền).')
  })
  it('chuỗi đủ mức liền gần nhất: lùi từ hôm qua, hôm nay đủ thì cộng, hôm nay chưa đủ không cắt chuỗi', () => {
    const N = (ngay: string, lam: number) => ({ ngay, muc: 24, lam })
    const ds = [N('2026-10-01', 0), N('2026-10-02', 24), N('2026-10-03', 30), N('2026-10-04', 24)]
    expect(chuoiDuGanNhat(ds, '2026-10-05')).toBe(3) // hôm nay ngoài dãy
    expect(chuoiDuGanNhat([...ds, N('2026-10-05', 24)], '2026-10-05')).toBe(4) // hôm nay đủ ⇒ cộng
    expect(chuoiDuGanNhat([...ds, N('2026-10-05', 3)], '2026-10-05')).toBe(3) // hôm nay đang làm ⇒ không cắt
    expect(chuoiDuGanNhat([...ds.slice(0, 3), N('2026-10-04', 23)], '2026-10-05')).toBe(0) // hôm qua thiếu ⇒ 0
  })
  it('tinhThaiDo đếm chuỗi đủ mức (gồm hôm nay đã đủ) và đưa vào kết luận', () => {
    const ngay = (ma: string, homNay: string): NgayBaiEm[] =>
      ma.split(' ').map((c, i) => {
        const d = `2026-10-${String(i + 1).padStart(2, '0')}`
        const lam = c === 'd' ? 24 : 0
        return { ngay: d, mucToiThieu: 24, daLam: lam, thieu: 24 - lam, datMuc: lam >= 24, mucUocTinh: true, nguonMuc: 'mac-dinh', tang: 1, cheDo: 'goi7', homNay: d === homNay }
      })
    const goi = (ma: string) => tinhThaiDo({ ngay: ngay(ma, '2026-10-12'), luot: [], cauDaLam: new Set(), cauHoTro: new Set(), den: '2026-10-12' }).ketLuan.nhan
    expect(goi('k k k k k k d d d d d k')).toBe('luoi') // 5 ngày liền tới hôm qua, hôm nay chưa làm
    expect(goi('k k k k k k d d d d d d')).toBe('chua-deu') // + hôm nay đủ = 6 ⇒ thoát
  })
})

describe('số ngày đủ mức cần thêm để lên Chăm (Việc tiếp của nhóm Chưa đều)', () => {
  it('nhỏ nhất k với (đủ + k) × 100 ≥ 80 × (số ngày + k); hôm nay đã đủ ⇒ đã tính hôm nay', () => {
    expect(ngayDuCanThemDeCham(11, 7, false)).toBe(9) // 16/20 = 80%
    expect(ngayDuCanThemDeCham(11, 8, false)).toBe(4) // 12/15 = 80%
    expect(ngayDuCanThemDeCham(11, 8, true)).toBe(3) // hôm nay đủ ⇒ 9/12 rồi, cần 12/15
    expect(ngayDuCanThemDeCham(10, 8, false)).toBe(0) // đã 80%
    expect(ngayDuCanThemDeCham(11, 4, false)).toBe(24) // 28/35 = 80%
    for (const [n, du, h] of [[11, 7, false], [11, 8, true], [20, 3, false], [5, 3, true]] as const) {
      const k = ngayDuCanThemDeCham(n, du, h)
      const nn = n + (h ? 1 : 0) + k, dd = du + (h ? 1 : 0) + k
      expect(dd * 100 >= 80 * nn).toBe(true)
      if (k > 0) expect((dd - 1) * 100 >= 80 * (nn - 1)).toBe(false)
    }
  })
})
