// DỮ LIỆU GIẢ ĐỢT 19 · LÀN M — bảng `/hs|/ph/nhip-hoc` của một em đứng ĐÚNG bậc cần chụp (bậc tính bằng phép máy chủ `bacChamChi`). Không dữ liệu thật.
//   bậc 3 (Lười, điểm 16–25): em làm thưa, bỏ nhiều ngày · bậc 11 (Chăm, điểm 90–97 hoặc ≥ 98 khi chuỗi < 7): đủ mức gần hết, chuỗi 11 ngày (điểm 95).
import type { KetQuaNhipHocEm } from '../../server/src/nhip-hoc-kieu'
import { bacChamChi } from '../../server/src/bac-cham-chi'
import { tomTatNhip, viecTiepNhip } from '../../server/src/nhip-hoc-luat'

const NGAY = Array.from({ length: 12 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`)
const HOM_NAY = NGAY[11]!

/** Bảng của em từ dãy số câu đã làm mỗi ngày (mức 30) — số tóm tắt + bậc tính bằng đúng phép máy chủ. */
export function nhipEmTuDay(lam: readonly number[]): KetQuaNhipHocEm {
  const ngay = lam.map((l, i) => ({ ngay: NGAY[i]!, muc: 30, lam: l }))
  const t = tomTatNhip(ngay, HOM_NAY)
  const bac = bacChamChi(ngay, HOM_NAY, t)
  return {
    ok: true, tu: NGAY[0]!, homNay: HOM_NAY, nhom: t.nhom, soNgayQua: t.soNgayQua, soNgayDu: t.soNgayDu, phanTram: Math.round((100 * t.soNgayDu) / Math.max(1, t.soNgayQua)), ngay,
    chuoiDuGanNhat: t.chuoiDuGanNhat, tongDaLam: t.tongLam + (t.homNay?.lam ?? 0), tongCauThieu: t.tongCauThieu, ngayDuGanNhat: t.ngayDuGanNhat, homNayMuc: t.homNay,
    chuoiBo: t.chuoiKhongLam, tocDo: { soNhanh: 2, soCoGiay: 60, dungNhanh: 70, coTuTinh: false, muc: 'tot' }, viecTiep: viecTiepNhip(t),
    ...(bac ? { bacCham: bac } : {}),
  }
}

/** Bậc 3 · Vua Ngủ Nướng. */
export const NHIP_BAC_3 = (): KetQuaNhipHocEm => nhipEmTuDay([30, 12, 0, 30, 10, 0, 0, 14, 30, 6, 12, 4])
/** Bậc 11 · Chiến Thần Năng Suất. */
export const NHIP_BAC_11 = (): KetQuaNhipHocEm => nhipEmTuDay([30, 30, 32, 30, 30, 30, 31, 30, 30, 33, 30, 8])
