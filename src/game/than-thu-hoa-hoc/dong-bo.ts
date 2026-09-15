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

import { vaHoSo, type CapTienHoa, type HoSoThanThuLuu } from './he-thong-pet'
import { tronLichSu } from './rut-cau-thap'
import { DS_NGUON_EXP, thanhExp, tongSoExp } from './kinh-nghiem'

export type BenThang = 'may' | 'mayChu' | 'nhuNhau'

export interface KetQuaHoaGiai {
  hoSo: HoSoThanThuLuu
  ben: BenThang
  /** Có phải ghi ngược lên máy chủ không. */
  canGhiLen: boolean
  tongExpMay: number
  tongExpMayChu: number
}

/** Tổng EXP đã kiếm — một trong các mốc hoà giải. */
export function tongExpCuaHoSo(h: HoSoThanThuLuu): number {
  return tongSoExp(h.soExp)
}

/**
 * THƯỚC ĐO TIẾN TRÌNH — so theo thứ tự từ điển, mục trước quan trọng hơn.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG SO BẰNG MỖI TỔNG EXP (lỗi bản 15-09, thầy bắt được ngay chiều
 * hôm ấy: "điện thoại và máy tính chưa hiện thần thú giống nhau"):
 *
 * Sổ `soExp` chỉ mới có từ 15-09. Mọi hồ sơ nuôi từ trước có sổ RỖNG — tổng 0.
 * Hai máy cùng tổng 0 thì hoà, mà hoà thì luật cũ giữ bản của máy này. Nên máy
 * nào cũng giữ bản của mình, mãi mãi: điện thoại giữ quả trứng, web giữ con đã
 * mọc sừng, đồng bộ chạy mà chẳng đổi gì. **Cấp thú không hề nằm trong phép so.**
 *
 * CẤP THÚ ĐỨNG ĐẦU, vì cấp chỉ tăng không bao giờ giảm. Để tổng EXP đứng đầu
 * thì gặp ca "máy A cấp 3 đã nạp hết ống, máy B cấp 1 còn đầy ống" là máy A bị
 * TỤT CẤP — lỗi nhìn thấy ngay và đáng sợ hơn hẳn.
 */
export function mocTienTrinh(h: HoSoThanThuLuu): readonly number[] {
  return [
    h.capDo,
    tongSoExp(h.soExp),
    h.tangThapCaoNhat,
    h.soCauDaThanhTay,
    h.khoExp + h.exp,
  ]
}

/** So hai thước đo theo thứ tự từ điển: >0 là a hơn, <0 là b hơn, 0 là ngang. */
export function soMoc(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y ? 1 : -1
  }
  return 0
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
  const d = soMoc(mocTienTrinh(may), mocTienTrinh(mayChu))
  const ben: BenThang = d > 0 ? 'may' : d < 0 ? 'mayChu' : 'nhuNhau'
  // Bằng nhau thì giữ bản máy này — tránh nháy giao diện vô cớ.
  const nen = ben === 'mayChu' ? mayChu : may
  const kia = ben === 'mayChu' ? may : mayChu

  // CÁC CON SỐ CHỈ-TĂNG: luôn lấy bên lớn hơn, dù bên nào thắng.
  const soExp = { ...nen.soExp }
  for (const k of DS_NGUON_EXP) {
    soExp[k] = Math.max(nen.soExp[k] ?? 0, kia.soExp[k] ?? 0)
  }

  // KHỐI CẤP ĐỘ LẤY TRỌN MỘT BÊN, không trộn từng trường.
  // `capDo`, `exp` (đã nạp vào thú) và `khoExp` (còn trong ống) là ba con số ăn
  // khớp nhau: nạp ống vào thú là ống vơi đi, cấp lên, `exp` đổi. Lấy cấp của
  // bên này mà ống của bên kia là CỘNG KHỐNG — chỗ EXP ấy đã hoá thành cấp rồi.
  //
  // NGOẠI LỆ DUY NHẤT: hai bên cùng cấp thì chưa bên nào nạp thêm, lấy ống đầy
  // hơn không cộng khống gì cả — và đó là ca thường gặp nhất (hai máy cùng cấp,
  // một máy vừa làm bài kiếm thêm).
  const khoExp = nen.capDo === kia.capDo
    ? Math.max(nen.khoExp, kia.khoExp)
    : nen.khoExp

  const hoSo: HoSoThanThuLuu = {
    ...nen,
    soExp,
    khoExp,
    // Cấp là con số CHỈ TĂNG — hoà giải xong không bao giờ được thấp hơn cả hai
    // bên. `expToiDa` và `capTienHoa` phải tính lại theo cấp ấy, nếu không hồ sơ
    // ra cấp 5 mà thanh EXP vẫn dài bằng cấp 1.
    capDo: nen.capDo,
    capTienHoa: nen.capDo as CapTienHoa,
    expToiDa: thanhExp(nen.capDo),
    tangThapCaoNhat: Math.max(nen.tangThapCaoNhat, kia.tangThapCaoNhat),
    // SỔ THÁP: cộng hiểu biết hai máy, không bên nào đè bên nào. Leo trên máy
    // tính rồi mở điện thoại thì không gặp lại câu vừa hỏi.
    lichSuThap: tronLichSu(nen.lichSuThap, kia.lichSuThap),
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
