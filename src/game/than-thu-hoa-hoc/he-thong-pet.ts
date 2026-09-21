/**
 * DỮ LIỆU THẦN THÚ HOÁ HỌC (ALCHEMON)
 * 4 hệ: Hoả/nhiệt nhôm · Acid/ăn mòn · Base/kết tủa · Khí/halogen.
 * Danh pháp 2018 cho mọi chữ HIỆN RA cho học sinh (acid, base, sodium…).
 * Tuân thủ tuyệt đối quy tắc check:mau (chỉ dùng rgb / rgba, không dùng hex code).
 */

import { CAP_TOI_DA, type CapTienHoa } from './hinh-thai'
import { heSoTienHoa } from './can-bang-thap'
import { vaLichSu, type DongLichSuThap } from './rut-cau-thap'
import {
  thanhExp, SUC_CHUA_ONG,
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
  // ─── TỨ ĐẠI TỰ NHIÊN ───
  dat_quy: {
    id: 'dat_quy',
    ten: 'Hoàng Giáp Cương Nham Thần Quy',
    danhHieu: 'SiO₂ + CaCO₃ — Thái Sơn Thạch Giáp Trấn Địa Quân',
    he: 'dat',
    mauChinh: 'rgb(180, 83, 9)',
    mauPhu: 'rgb(217, 119, 6)',
    mauHaoQuang: 'rgba(217, 119, 6, 0.45)',
    moTa: 'Tích tụ từ mạng lưới tinh thể Silicate (SiO₂) và lớp kết tủa CaCO₃, BaSO₄ ngàn năm không tan. Sở hữu lớp mai tinh thể cứng như kim cương.',
    kyNangThuong: 'Thạch Nham Trấn Giáp',
    kyNangNo: 'CONTINENTAL CRUST IMPACT — Đại Địa Băng Liệt Kích',
    nguyenToGoc: 'SiO₂ + CaCO₃',
  },
  nuoc_long: {
    id: 'nuoc_long',
    ten: 'Vương Thuỷ Lam Giao Thần Long',
    danhHieu: 'H₂O + H⁺ — Cửu Uyên Triều Tịch Hải Hoàng Long',
    he: 'nuoc',
    mauChinh: 'rgb(14, 165, 233)',
    mauPhu: 'rgb(2, 132, 199)',
    mauHaoQuang: 'rgba(56, 189, 248, 0.45)',
    moTa: 'Ngưng tụ từ hàng tỷ liên kết hydro bền vững trong H₂O tinh khiết, dung môi vạn năng có khả năng hoà tan và phân ly mọi hợp chất ion.',
    kyNangThuong: 'Lam Triều Thuỷ Trảm',
    kyNangNo: 'HYDROGEN VORTEX TSUNAMI — Hải Triều Cực Hạn Luân Hồi',
    nguyenToGoc: 'H₂O + H⁺',
  },
  lua_phuong: {
    id: 'lua_phuong',
    ten: 'Xích Diệm Nhiệt Nhôm Phượng',
    danhHieu: '2Al + Fe₂O₃ — Triều Dương Thiêu Thiết Đế Quân',
    he: 'lua',
    mauChinh: 'rgb(239, 68, 68)',
    mauPhu: 'rgb(249, 115, 22)',
    mauHaoQuang: 'rgba(239, 68, 68, 0.45)',
    moTa: 'Sinh ra từ phản ứng nhiệt nhôm bộc phát giữa Al và Fe₂O₃ ở 2000°C làm tan chảy sắt thép, toả nhiệt lượng khổng lồ.',
    kyNangThuong: 'Hoả Vũ Nhiệt Nhôm',
    kyNangNo: 'SOLAR FLARE ERUPTION — Bùng Nổ Hào Quang Mặt Trời',
    nguyenToGoc: 'Al + Fe₂O₃',
  },
  khi_bang: {
    id: 'khi_bang',
    ten: 'Thanh Phong Bão Tố Thiên Bằng',
    danhHieu: 'F₂ · Cl₂ — Cửu Trùng Cuồng Phong Halogen Đế',
    he: 'khi',
    mauChinh: 'rgb(16, 185, 129)',
    mauPhu: 'rgb(52, 211, 153)',
    mauHaoQuang: 'rgba(16, 185, 129, 0.45)',
    moTa: 'Hấp thụ khí Halogen F₂, Cl₂ có tính oxi hoá mãnh liệt và động học phân tử chất khí khuếch tán với tốc độ cực đại.',
    kyNangThuong: 'Phong Nhẫn Halogen',
    kyNangNo: 'HURRICANE PRESSURE ZERO — Bão Tố Chân Không Tuyệt Diệt',
    nguyenToGoc: 'F₂ + Cl₂',
  },

  // ─── TỨ TRỤ TÂM THỨC ───
  ductin_su: {
    id: 'ductin_su',
    ten: 'Kim Cương Bất Hoại Quang Sư',
    danhHieu: 'C(sp³) — Vạn Kiếp Bất Biến Định Luật Vương',
    he: 'ductin',
    mauChinh: 'rgb(226, 232, 240)',
    mauPhu: 'rgb(168, 85, 247)',
    mauHaoQuang: 'rgba(168, 85, 247, 0.45)',
    moTa: 'Kết tinh từ Định luật bảo toàn khối lượng và cấu trúc kim cương sp³ bất biến. Thể hiện đức tin sắt đá không lay chuyển trước mọi khó khăn.',
    kyNangThuong: 'Quang Sư Trảo Kích',
    kyNangNo: 'LAW OF CONSERVATION REALM — Vạn Kiếp Bảo Toàn Kim Cương Giới',
    nguyenToGoc: 'C(sp³) + Bảo Toàn',
  },
  tinhyeu_ho: {
    id: 'tinhyeu_ho',
    ten: 'Hồng Tinh Cộng Hóa Cửu Vĩ Hồ',
    danhHieu: 'C–C, C–H — Vạn Hữu Liên Kết Ái Tâm Thần',
    he: 'tinhyeu',
    mauChinh: 'rgb(244, 63, 94)',
    mauPhu: 'rgb(251, 113, 133)',
    mauHaoQuang: 'rgba(244, 63, 94, 0.45)',
    moTa: 'Sinh ra từ liên kết cộng hoá trị sẻ chia đôi electron và liên kết hydro sự sống trong chuỗi xoắn kép DNA. Kết nối trái tim với tình yêu thương tri thức.',
    kyNangThuong: 'Cộng Hóa Hồ Hoả',
    kyNangNo: 'COVALENT SOUL HARMONY — Đồng Tâm Cộng Hoá Vạn Vật Linh',
    nguyenToGoc: 'C–C, DNA',
  },
  bieton_huou: {
    id: 'bieton_huou',
    ten: 'Tố Linh Đệm Thần Hươu',
    danhHieu: 'HCO₃⁻ / H₂CO₃ — Tri Ân Cân Bằng Dưỡng Dục Quân',
    he: 'bieton',
    mauChinh: 'rgb(20, 184, 166)',
    mauPhu: 'rgb(45, 212, 191)',
    mauHaoQuang: 'rgba(20, 184, 166, 0.45)',
    moTa: 'Mang sức mạnh của hệ đệm sinh học HCO₃⁻/H₂CO₃ và nguyên lý chuyển dịch cân bằng Le Chatelier. Đại diện cho lòng biết ơn công ơn cha mẹ và thầy cô.',
    kyNangThuong: 'Đệm Tố Cam Lộ',
    kyNangNo: 'LE CHATELIER EQUILIBRIUM FLOURISH — Vạn Cổ Cân Bằng Khai Hoa Trận',
    nguyenToGoc: 'HCO₃⁻/H₂CO₃',
  },
  sangy_ma: {
    id: 'sangy_ma',
    ten: 'Thần Quang Vô Cực Thiên Mã',
    danhHieu: 'E = hν — Lượng Tử Diệu Giác Khai Trí Quân',
    he: 'sangy',
    mauChinh: 'rgb(234, 179, 8)',
    mauPhu: 'rgb(250, 204, 21)',
    mauHaoQuang: 'rgba(250, 204, 21, 0.55)',
    moTa: 'Hội tụ từ năng lượng photon ánh sáng E = hν và electron nhảy mức lượng tử quang hoá. Biểu trưng cho tia sáng ý thức và trí tuệ khai mở.',
    kyNangThuong: 'Lượng Tử Quang Tiễn',
    kyNangNo: 'COSMIC CONSCIOUSNESS ILLUMINATION — Vô Cực Diệu Giác Phổ Độ Quang',
    nguyenToGoc: 'E = hν',
  },
}

/** Ánh xạ an toàn từ 6 thần thú cũ sang 8 thần thú mới để học sinh cũ không bị mất thú. */
export const ANH_XA_ID_CU: Record<string, string> = {
  hoa_long: 'lua_phuong',
  thuy_quai: 'nuoc_long',
  thiet_giap: 'dat_quy',
  loi_dieu: 'khi_bang',
  loi_kim: 'ductin_su',
  moc_tinh: 'tinhyeu_ho',
}

// Giữ alias tương thích ngược trong DANH_SACH_THAN_THU
DANH_SACH_THAN_THU['hoa_long'] = DANH_SACH_THAN_THU['lua_phuong']!
DANH_SACH_THAN_THU['thuy_quai'] = DANH_SACH_THAN_THU['nuoc_long']!
DANH_SACH_THAN_THU['thiet_giap'] = DANH_SACH_THAN_THU['dat_quy']!
DANH_SACH_THAN_THU['loi_dieu'] = DANH_SACH_THAN_THU['khi_bang']!
DANH_SACH_THAN_THU['loi_kim'] = DANH_SACH_THAN_THU['ductin_su']!
DANH_SACH_THAN_THU['moc_tinh'] = DANH_SACH_THAN_THU['tinhyeu_ho']!

/**
 * HỆ SỐ BÙ CÂN BẰNG THEO HỆ.
 * Bảng khắc chế 8 hệ mới cân bằng đối xứng 1:1 (mỗi hệ 2 thắng 2 thua),
 * nên hệ số bù chuẩn cho mọi hệ là 1.00.
 */
export const BU_CAN_BANG_HE: Record<HeNguyenTo, number> = {
  dat: 1.0,
  nuoc: 1.0,
  lua: 1.0,
  khi: 1.0,
  ductin: 1.0,
  tinhyeu: 1.0,
  bieton: 1.0,
  sangy: 1.0,
  // Alias hệ cũ
  hoa: 1.0,
  axit: 1.0,
  kiem: 1.0,
  dien: 1.0,
  huuco: 1.0,
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
  /**
   * SỔ CÂU ĐÃ HỎI Ở THÁP — sống qua mọi lượt leo và mọi máy.
   *
   * Thầy báo 15-09: *"số câu chơi ở các tầng lặp lại nhiều"*. Bản cũ chỉ nhớ
   * trong MỘT lượt leo, đóng ra mở lại là quên hết. Nay nằm trong hồ sơ nên đi
   * theo em sang điện thoại.
   */
  lichSuThap: DongLichSuThap[]
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
    // Hồ sơ cũ được chuyển đổi tự động sang id mới thông qua ANH_XA_ID_CU.
    // Id lạ hoặc rỗng thì về rỗng = chưa chọn.
    idThanhThuChon: (() => {
      const raw = chuoi('idThanhThuChon', '')
      const mapped = ANH_XA_ID_CU[raw] ?? raw
      return DANH_SACH_THAN_THU[mapped] !== undefined ? mapped : md.idThanhThuChon
    })(),
    capDo,
    exp: so('exp', 0),
    khoExp: Math.min(SUC_CHUA_ONG, so('khoExp', 0)),
    soExp: vaSoExp(o.soExp),
    // luôn tính lại theo cấp, không tin số cũ trong máy
    expToiDa: thanhExp(capDo),
    capTienHoa: capDo as CapTienHoa,
    tangThapCaoNhat: Math.max(1, Math.round(so('tangThapCaoNhat', 1))),
    lichSuThap: vaLichSu((tho as Record<string, unknown> | null)?.lichSuThap),
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
    expToiDa: thanhExp(1), // thanh đầu của đường cấp MỚI (160), không còn EXP_BAN_DAU của đường cũ
    capTienHoa: 1,
    tangThapCaoNhat: 1,
    lichSuThap: [],
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
  /**
   * ĐƯỜNG 120 CẤP bắt buộc đổi hệ số này.
   *
   * Cũ `1 + (cap − 1) × 0,25` đúng với 12 cấp (ra ×3,75) nhưng với 120 cấp ra
   * ×30,75 — thú một phát giết mọi trùm, tháp mất sạch sức nặng. Công thức mới
   * nằm trong `can-bang-thap.ts` để máu trùm và chỉ số thú dùng CHUNG một chỗ,
   * không phải hai công thức cạnh nhau rồi lệch nhau.
   */
  const heSoTH = heSoTienHoa(capTienHoa)

  const mau = Math.round((160 + capDo * 22) * heSoHoc * heSoTH * bu)
  const cong = Math.round((30 + capDo * 6) * heSoHoc * heSoTH * bu)
  const giap = Math.round((12 + capDo * 3) * heSoHoc * heSoTH * bu)
  const cp = Math.round((mau / 10 + cong * 2 + giap * 1.5) * 10)

  return { cp, mau, cong, giap }
}
