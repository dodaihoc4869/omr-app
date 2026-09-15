/**
 * HOÀ GIẢI HAI BẢN HỒ SƠ THẦN THÚ — MÁY NÀY VÀ MÁY CHỦ.
 *
 * Thầy bắt được 15-09: "trên điện thoại vẫn là trứng, trên web thì là có sừng".
 *
 * ───────────────────────────────────────────────────────────────────────────
 * HOÀ GIẢI THEO TỔNG EXP, KHÔNG THEO ĐỒNG HỒ.
 *
 * Tổng EXP em đã kiếm chỉ có tăng, không bao giờ giảm — nên nó là thước đo
 * ĐƠN ĐIỆU, so được chắc chắn. Đồng hồ thì không: điện thoại đặt sai giờ, hoặc
 * múi giờ lệch, là một máy đè chết tiến trình của máy kia mà không ai biết.
 *
 * VÀ KHÔNG BAO GIỜ LÀM TỤT TIẾN TRÌNH. Ngay cả khi chọn bản của máy chủ, các
 * con số chỉ-tăng vẫn lấy giá trị LỚN HƠN của hai bên:
 *   · tầng tháp cao nhất
 *   · số câu sai đã thanh tẩy
 *   · từng dòng sổ EXP theo nguồn
 * Em leo tháp trên điện thoại rồi mở web ra: tầng đó phải còn.
 *
 * Bộ hàm này THUẦN — không đọc mạng, không đọc localStorage — để còn kiểm được.
 */

import { vaHoSo, type HoSoThanThuLuu } from './he-thong-pet'
import { DS_NGUON_EXP, tongSoExp } from './kinh-nghiem'

export type BenThang = 'may' | 'mayChu' | 'nhuNhau'

export interface KetQuaHoaGiai {
  hoSo: HoSoThanThuLuu
  ben: BenThang
  /** Có phải ghi ngược lên máy chủ không. */
  canGhiLen: boolean
  tongExpMay: number
  tongExpMayChu: number
}

/** Tổng EXP đã kiếm — mốc hoà giải. */
export function tongExpCuaHoSo(h: HoSoThanThuLuu): number {
  return tongSoExp(h.soExp)
}

/**
 * Trộn hai bản. `mayChuTho` là dữ liệu thô máy chủ trả (có thể `null` khi em
 * chưa từng đồng bộ).
 */
export function hoaGiaiHoSo(may: HoSoThanThuLuu, mayChuTho: unknown): KetQuaHoaGiai {
  const tMay = tongExpCuaHoSo(may)

  // Máy chủ chưa có gì: máy này thắng, và phải đẩy lên.
  if (mayChuTho === null || mayChuTho === undefined) {
    return { hoSo: may, ben: 'may', canGhiLen: true, tongExpMay: tMay, tongExpMayChu: 0 }
  }

  const mayChu = vaHoSo(mayChuTho)
  const tChu = tongExpCuaHoSo(mayChu)
  const ben: BenThang = tMay > tChu ? 'may' : tChu > tMay ? 'mayChu' : 'nhuNhau'
  // Bằng nhau thì giữ bản máy này — tránh nháy giao diện vô cớ.
  const nen = ben === 'mayChu' ? mayChu : may
  const kia = ben === 'mayChu' ? may : mayChu

  // CÁC CON SỐ CHỈ-TĂNG: luôn lấy bên lớn hơn, dù bên nào thắng.
  const soExp = { ...nen.soExp }
  for (const k of DS_NGUON_EXP) {
    soExp[k] = Math.max(nen.soExp[k] ?? 0, kia.soExp[k] ?? 0)
  }

  const hoSo: HoSoThanThuLuu = {
    ...nen,
    soExp,
    tangThapCaoNhat: Math.max(nen.tangThapCaoNhat, kia.tangThapCaoNhat),
    soCauDaThanhTay: Math.max(nen.soCauDaThanhTay, kia.soCauDaThanhTay),
    // Thần thú đã chọn: bên nào đã chốt thì giữ. Chọn một lần, không đổi —
    // nên nếu một bên còn rỗng thì đó là bên chưa kịp đồng bộ, không phải bên
    // vừa bỏ thú.
    idThanhThuChon: nen.idThanhThuChon !== '' ? nen.idThanhThuChon : kia.idThanhThuChon,
    ngayChonThu: nen.ngayChonThu !== '' ? nen.ngayChonThu : kia.ngayChonThu,
  }

  return {
    hoSo,
    ben,
    // ĐẨY LÊN KHI VÀ CHỈ KHI bản trộn khác bản đang nằm trên máy chủ.
    // Bản đầu viết `ben !== 'mayChu' || khacBan(...)`, nên hai bản y hệt nhau
    // vẫn gọi mạng mỗi lần mở game — tốn pin và 3G của em, chẳng được gì.
    canGhiLen: khacBan(hoSo, mayChu),
    tongExpMay: tMay,
    tongExpMayChu: tChu,
  }
}

/** Hai hồ sơ có khác nhau ở những trường đáng ghi không. */
export function khacBan(a: HoSoThanThuLuu, b: HoSoThanThuLuu): boolean {
  if (a.idThanhThuChon !== b.idThanhThuChon) return true
  if (a.capDo !== b.capDo || a.exp !== b.exp || a.khoExp !== b.khoExp) return true
  if (a.tangThapCaoNhat !== b.tangThapCaoNhat) return true
  if (a.soCauDaThanhTay !== b.soCauDaThanhTay) return true
  for (const k of DS_NGUON_EXP) if ((a.soExp[k] ?? 0) !== (b.soExp[k] ?? 0)) return true
  return false
}
