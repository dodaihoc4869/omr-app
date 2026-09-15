/**
 * DỮ LIỆU THẦN THÚ HOÁ HỌC (ALCHEMON)
 * 4 hệ: Hoả/nhiệt nhôm · Acid/ăn mòn · Base/kết tủa · Khí/halogen.
 * Danh pháp 2018 cho mọi chữ HIỆN RA cho học sinh (acid, base, sodium…).
 * Tuân thủ tuyệt đối quy tắc check:mau (chỉ dùng rgb / rgba, không dùng hex code).
 */

import { CAP_TOI_DA, type CapTienHoa } from './hinh-thai'
import {
  EXP_BAN_DAU, thanhExp, SUC_CHUA_ONG,
  soExpRong, vaSoExp, type SoExpTheoNguon,
} from './kinh-nghiem'
import { type HeNguyenTo } from './tuong-khac'

// Vòng tương khắc SÁU HỆ sống ở `tuong-khac.ts` — một nguồn sự thật. Ở đây chỉ
// xuất lại để mọi chỗ đang nhập từ tệp này không phải sửa.
export { tinhHeSoTuongKhac, TEN_HE_NGAN, TEN_HE_DAY_DU, DS_HE, BANG_KHAC_CHE,
  heKhacDuoc, heBiKhacBoi, type KetQuaTuongKhac, type CapKhacChe } from './tuong-khac'
export type { HeNguyenTo }
export type { CapTienHoa }

export interface ThanThuInfo {
  id: string
  ten: string
  danhHieu: string
  he: HeNguyenTo
  mauChinh: string
  mauPhu: string
  mauHaoQuang: string
  moTa: string
  kyNangThuong: string
  kyNangNo: string
  nguyenToGoc: string
}

export const DANH_SACH_THAN_THU: Record<string, ThanThuInfo> = {
  hoa_long: {
    id: 'hoa_long',
    ten: 'Hỏa Long Nhiệt Nhôm',
    danhHieu: 'Bá Chủ Phản Ứng Tỏa Nhiệt',
    he: 'hoa',
    mauChinh: 'rgb(239, 68, 68)',
    mauPhu: 'rgb(249, 115, 22)',
    mauHaoQuang: 'rgba(239, 68, 68, 0.45)',
    moTa: 'Sinh ra từ phản ứng nhiệt nhôm bộc phát giữa Al và Fe₂O₃ ở 2000°C. Mang sức mạnh bộc phá cực hạn.',
    kyNangThuong: 'Phun Lửa Nhiệt Nhôm',
    kyNangNo: 'Thiêu Đốt Phân Tử Cấp Độ 4',
    nguyenToGoc: 'Al + Fe₂O₃',
  },
  thuy_quai: {
    id: 'thuy_quai',
    ten: 'Hải Quái Acid Aqua',
    danhHieu: 'Chúa Tể Ăn Mòn Kim Loại',
    he: 'axit',
    mauChinh: 'rgb(168, 85, 247)',
    mauPhu: 'rgb(99, 102, 241)',
    mauHaoQuang: 'rgba(168, 85, 247, 0.45)',
    moTa: 'Tích tụ từ nước cường toan — HNO₃ đặc trộn HCl đặc theo tỉ lệ 1 : 3. Rút cạn sinh lực và ăn mòn mọi lớp giáp kiềm kim.',
    kyNangThuong: 'Bắn Gai Acid H⁺',
    kyNangNo: 'Đại Hồng Thủy Cường Toan',
    nguyenToGoc: 'HNO₃ + 3HCl',
  },
  thiet_giap: {
    id: 'thiet_giap',
    ten: 'Bảo Thần Base Tinh Thể',
    danhHieu: 'Kim Thân Bất Hoại BaSO₄',
    he: 'kiem',
    mauChinh: 'rgb(14, 165, 233)',
    mauPhu: 'rgb(234, 179, 8)',
    mauHaoQuang: 'rgba(14, 165, 233, 0.45)',
    moTa: 'Kết tinh từ mạng lưới tinh thể base bền vững và kết tủa BaSO₄. Tạo màn chắn trung hoà mọi loại acid.',
    kyNangThuong: 'Khiên Kết Tủa BaSO₄',
    kyNangNo: 'Lồng Tinh Thể Trung Hòa',
    nguyenToGoc: 'Ba(OH)₂ + Na₂SO₄',
  },
  loi_dieu: {
    id: 'loi_dieu',
    ten: 'Phong Lôi Điểu Halogen',
    danhHieu: 'Tia Chớp Oxi Hóa Flo',
    he: 'khi',
    mauChinh: 'rgb(34, 197, 94)',
    mauPhu: 'rgb(16, 185, 129)',
    mauHaoQuang: 'rgba(34, 197, 94, 0.45)',
    moTa: 'Hấp thụ khí fluorine và chlorine. Fluorine có độ âm điện lớn nhất bảng tuần hoàn.',
    kyNangThuong: 'Lốc Xoáy Khí Clo Cl₂',
    kyNangNo: 'Cuồng Phong Oxi Hóa Flo F₂',
    nguyenToGoc: 'F₂, Cl₂',
  },
  // ─── HAI HỆ MỚI, thầy chốt 15-09 ───
  loi_kim: {
    id: 'loi_kim',
    ten: 'Lôi Kim Thú Điện Cực',
    danhHieu: 'Chúa Tể Dãy Điện Hoá',
    he: 'dien',
    mauChinh: 'rgb(100, 116, 139)',
    mauPhu: 'rgb(56, 189, 248)',
    mauHaoQuang: 'rgba(56, 189, 248, 0.45)',
    moTa: 'Sinh ra trong pin Zn–Cu, nơi electron chạy từ cực âm sang cực dương. Càng đứng trước trong dãy điện hoá, tính khử càng mạnh.',
    kyNangThuong: 'Dòng Electron Anode',
    kyNangNo: 'Điện Phân Nóng Chảy Toàn Cực',
    nguyenToGoc: 'Zn | Cu²⁺',
  },
  moc_tinh: {
    id: 'moc_tinh',
    ten: 'Mộc Tinh Ester Polymer',
    danhHieu: 'Linh Hồn Chuỗi Carbon',
    he: 'huuco',
    mauChinh: 'rgb(132, 204, 22)',
    mauPhu: 'rgb(180, 83, 9)',
    mauHaoQuang: 'rgba(132, 204, 22, 0.45)',
    moTa: 'Kết tinh từ chuỗi ester và polymer nối dài vô tận. Bộ giáp carbon bền hoá học, không acid nào ăn nổi.',
    kyNangThuong: 'Xích Chuỗi Polymer',
    kyNangNo: 'Than Hoạt Tính Hấp Phụ Toàn Diện',
    nguyenToGoc: '(RCOO)₃C₃H₅',
  },
}

/**
 * HỆ SỐ BÙ CÂN BẰNG THEO HỆ.
 *
 * Bảng khắc chế sáu hệ KHÔNG đối xứng — ép cho đối xứng là bịa phản ứng không
 * có (xem đầu `tuong-khac.ts`). Nên cân bằng ở đây: đo lợi thế khắc chế của
 * từng hệ khi đấu đủ năm hệ còn lại, rồi nhân ngược vào chỉ số gốc.
 *
 * Số đo trước khi bù — lợi thế (hệ số công trung bình ÷ hệ số thủ trung bình):
 *   Base 1,558 · Hoả 1,348 · Khí 1,000 · Hữu cơ 0,864 · Acid 0,860 · Điện hoá 0,642
 *   chênh lệch cao/thấp = 2,428 lần
 * Sau khi nhân các hệ số dưới đây: chênh lệch còn **1,011 lần**.
 *
 * Đổi bảng khắc chế thì phải ĐO LẠI bộ số này — phép kiểm sẽ bắt.
 */
export const BU_CAN_BANG_HE: Record<HeNguyenTo, number> = {
  hoa: 0.86,
  khi: 1.00,
  kiem: 0.80,
  axit: 1.08,
  dien: 1.25,
  huuco: 1.08,
}

export interface HoSoThanThuLuu {
  /**
   * Thần thú em chọn. **Rỗng nghĩa là CHƯA CHỌN** — game hiện màn chọn trước.
   *
   * Thầy chốt 15-09: mỗi em chỉ chọn một con ngay từ đầu theo sở thích. Trước
   * đây mặc định sẵn Hoả Long và cho bấm đổi tuỳ ý, nên "chọn theo sở thích"
   * chẳng có nghĩa gì, mà hệ tương khắc cũng vô nghĩa nốt: gặp trùm hệ nào thì
   * đổi sang hệ khắc hệ ấy.
   */
  idThanhThuChon: string
  capDo: number
  exp: number
  expToiDa: number
  capTienHoa: CapTienHoa
  /**
   * ỐNG NGHIỆM — EXP đã kiếm mà chưa nạp cho thần thú. Trần `SUC_CHUA_ONG`.
   * Đây là bể THỨ NHẤT; `exp` ở trên là bể thứ hai (đã nạp vào thú).
   */
  khoExp: number
  /** Sổ cộng dồn EXP theo năm nguồn — để dựng bảng tóm tắt cho em xem. */
  soExp: SoExpTheoNguon
  tangThapCaoNhat: number
  /** Số câu sai đã thanh tẩy — nguồn EXP thật, có hiện ra màn. */
  soCauDaThanhTay: number
  danhHieuHienTai: string
  ngayNhanTrung: string
  /** Thời điểm em chốt thần thú. Rỗng khi chưa chọn. */
  ngayChonThu: string
}

export const KHOA_LUU_THAN_THU = 'omr_than_thu_hoa_hoc_data'

/**
 * Trộn hồ sơ đọc từ máy với hồ sơ mặc định.
 *
 * Hồ sơ cũ hoặc hỏng thiếu `expToiDa` thì `exp / expToiDa` ra NaN, và thanh
 * EXP nhận `width: NaN%` — vỡ âm thầm, không ai thấy lỗi ở đâu.
 */
export function vaHoSo(tho: unknown, idChon = ''): HoSoThanThuLuu {
  const md = layHoSoThanThuMacDinh(idChon)
  if (typeof tho !== 'object' || tho === null) return md
  const o = tho as Record<string, unknown>
  const so = (k: string, mac: number): number => {
    const v = o[k]
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : mac
  }
  const chuoi = (k: string, mac: string): string => {
    const v = o[k]
    return typeof v === 'string' && v !== '' ? v : mac
  }
  const capDo = Math.max(1, Math.min(CAP_TOI_DA, Math.round(so('capDo', 1))))
  return {
    // Hồ sơ cũ (trước 15-09) đã có sẵn một thần thú — coi như em đã chọn rồi,
    // không bắt chọn lại. Id lạ hoặc rỗng thì về rỗng = chưa chọn.
    idThanhThuChon: DANH_SACH_THAN_THU[chuoi('idThanhThuChon', '')] !== undefined
      ? chuoi('idThanhThuChon', '') : md.idThanhThuChon,
    capDo,
    exp: so('exp', 0),
    khoExp: Math.min(SUC_CHUA_ONG, so('khoExp', 0)),
    soExp: vaSoExp(o.soExp),
    // luôn tính lại theo cấp, không tin số cũ trong máy
    expToiDa: thanhExp(capDo),
    capTienHoa: capDo as CapTienHoa,
    tangThapCaoNhat: Math.max(1, Math.round(so('tangThapCaoNhat', 1))),
    soCauDaThanhTay: Math.max(0, Math.round(so('soCauDaThanhTay', 0))),
    danhHieuHienTai: chuoi('danhHieuHienTai', md.danhHieuHienTai),
    ngayNhanTrung: chuoi('ngayNhanTrung', md.ngayNhanTrung),
    ngayChonThu: chuoi('ngayChonThu', md.ngayChonThu),
  }
}

export function layHoSoThanThuMacDinh(idChon = ''): HoSoThanThuLuu {
  return {
    idThanhThuChon: idChon,
    capDo: 1,
    exp: 0,
    khoExp: 0,
    soExp: soExpRong(),
    expToiDa: EXP_BAN_DAU,
    capTienHoa: 1,
    tangThapCaoNhat: 1,
    soCauDaThanhTay: 0,
    danhHieuHienTai: 'Tập Sự Nguyên Tố',
    // Mốc chọn thú, để biết em chọn lúc nào. Rỗng = chưa chọn.
    ngayChonThu: '',
    ngayNhanTrung: new Date().toISOString(),
  }
}

/**
 * Tính chỉ số lực chiến CP của thú gắn liền với ý thức học tập của học sinh
 */
export function tinhLucChienPet(params: {
  capDo: number
  capTienHoa: CapTienHoa
  diemTrungBinh: number | null
  tyLeBtvn: number // 0 .. 1
  /** Hệ của thần thú — quyết định hệ số bù cân bằng. Thiếu thì coi như 1,0. */
  he?: HeNguyenTo
}): { cp: number; mau: number; cong: number; giap: number } {
  const { capDo, capTienHoa, diemTrungBinh, tyLeBtvn, he } = params
  // Bù lợi thế khắc chế: hệ nào khắc được nhiều hệ khác thì chỉ số gốc thấp hơn.
  const bu = he !== undefined ? (BU_CAN_BANG_HE[he] ?? 1) : 1
  // CHƯA THI CA NÀO THÌ KHÔNG CÓ BUFF TỪ ĐIỂM — không bịa 7.0 như bản trước.
  // Bịa ở đây nghĩa là màn hình in "Điểm trung bình: 7.00đ" cho em chưa thi lần nào.
  const coDiem = diemTrungBinh !== null && Number.isFinite(diemTrungBinh)
  const heSoHoc = 1 + (coDiem ? (diemTrungBinh! / 10) * 0.4 : 0) + tyLeBtvn * 0.3
  // 12 hình thái: hệ số dàn đều thay vì ba nấc 1.0 / 1.5 / 2.2
  const heSoTienHoa = 1 + (Math.min(CAP_TOI_DA, Math.max(1, capTienHoa)) - 1) * 0.25

  const mau = Math.round((200 + capDo * 35) * heSoHoc * heSoTienHoa * bu)
  const cong = Math.round((35 + capDo * 8) * heSoHoc * heSoTienHoa * bu)
  const giap = Math.round((15 + capDo * 4) * heSoHoc * heSoTienHoa * bu)
  const cp = Math.round((mau / 10 + cong * 2 + giap * 1.5) * 10)

  return { cp, mau, cong, giap }
}
