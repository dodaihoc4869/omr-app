/**
 * DỮ LIỆU THẦN THÚ HOÁ HỌC (ALCHEMON)
 * 4 hệ: Hoả/nhiệt nhôm · Acid/ăn mòn · Base/kết tủa · Khí/halogen.
 * Danh pháp 2018 cho mọi chữ HIỆN RA cho học sinh (acid, base, sodium…).
 * Tuân thủ tuyệt đối quy tắc check:mau (chỉ dùng rgb / rgba, không dùng hex code).
 */

import { CAP_TOI_DA, type CapTienHoa } from './hinh-thai'
import { EXP_BAN_DAU, thanhExp } from './kinh-nghiem'

export type HeNguyenTo = 'hoa' | 'axit' | 'kiem' | 'khi'
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
}

/**
 * Tương khắc nguyên tố:
 * Hoả (nhiệt nhôm) > Khí (halogen)
 * Khí (halogen) > Base (kiềm hấp thụ khí halogen)
 * Base > Acid (trung hoà acid)
 * Acid (ăn mòn) > Hoả (ăn mòn kim loại, dập phản ứng nhiệt)
 */
export function tinhHeSoTuongKhac(heCong: HeNguyenTo, heThu: HeNguyenTo): { heSo: number; thongDiep: string } {
  if (
    (heCong === 'hoa' && heThu === 'khi') ||
    (heCong === 'khi' && heThu === 'kiem') ||
    (heCong === 'kiem' && heThu === 'axit') ||
    (heCong === 'axit' && heThu === 'hoa')
  ) {
    return { heSo: 1.5, thongDiep: 'Khắc chế Nguyên Tố! Sát thương +50%' }
  }

  if (
    (heThu === 'hoa' && heCong === 'khi') ||
    (heThu === 'khi' && heCong === 'kiem') ||
    (heThu === 'kiem' && heCong === 'axit') ||
    (heThu === 'axit' && heCong === 'hoa')
  ) {
    return { heSo: 0.7, thongDiep: 'Bị khắc chế! Sát thương -30%' }
  }

  return { heSo: 1.0, thongDiep: 'Khắc chế tương đương' }
}

export interface HoSoThanThuLuu {
  idThanhThuChon: string
  capDo: number
  exp: number
  expToiDa: number
  capTienHoa: CapTienHoa
  tangThapCaoNhat: number
  /** Số câu sai đã thanh tẩy — nguồn EXP thật, có hiện ra màn. */
  soCauDaThanhTay: number
  danhHieuHienTai: string
  ngayNhanTrung: string
}

export const KHOA_LUU_THAN_THU = 'omr_than_thu_hoa_hoc_data'

/**
 * Trộn hồ sơ đọc từ máy với hồ sơ mặc định.
 *
 * Hồ sơ cũ hoặc hỏng thiếu `expToiDa` thì `exp / expToiDa` ra NaN, và thanh
 * EXP nhận `width: NaN%` — vỡ âm thầm, không ai thấy lỗi ở đâu.
 */
export function vaHoSo(tho: unknown, idChon = 'hoa_long'): HoSoThanThuLuu {
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
    idThanhThuChon: DANH_SACH_THAN_THU[chuoi('idThanhThuChon', md.idThanhThuChon)]
      ? chuoi('idThanhThuChon', md.idThanhThuChon) : md.idThanhThuChon,
    capDo,
    exp: so('exp', 0),
    // luôn tính lại theo cấp, không tin số cũ trong máy
    expToiDa: thanhExp(capDo),
    capTienHoa: capDo as CapTienHoa,
    tangThapCaoNhat: Math.max(1, Math.round(so('tangThapCaoNhat', 1))),
    soCauDaThanhTay: Math.max(0, Math.round(so('soCauDaThanhTay', 0))),
    danhHieuHienTai: chuoi('danhHieuHienTai', md.danhHieuHienTai),
    ngayNhanTrung: chuoi('ngayNhanTrung', md.ngayNhanTrung),
  }
}

export function layHoSoThanThuMacDinh(idChon = 'hoa_long'): HoSoThanThuLuu {
  return {
    idThanhThuChon: idChon,
    capDo: 1,
    exp: 0,
    expToiDa: EXP_BAN_DAU,
    capTienHoa: 1,
    tangThapCaoNhat: 1,
    soCauDaThanhTay: 0,
    danhHieuHienTai: 'Tập Sự Nguyên Tố',
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
}): { cp: number; mau: number; cong: number; giap: number } {
  const { capDo, capTienHoa, diemTrungBinh, tyLeBtvn } = params
  // CHƯA THI CA NÀO THÌ KHÔNG CÓ BUFF TỪ ĐIỂM — không bịa 7.0 như bản trước.
  // Bịa ở đây nghĩa là màn hình in "Điểm trung bình: 7.00đ" cho em chưa thi lần nào.
  const coDiem = diemTrungBinh !== null && Number.isFinite(diemTrungBinh)
  const heSoHoc = 1 + (coDiem ? (diemTrungBinh! / 10) * 0.4 : 0) + tyLeBtvn * 0.3
  // 12 hình thái: hệ số dàn đều thay vì ba nấc 1.0 / 1.5 / 2.2
  const heSoTienHoa = 1 + (Math.min(CAP_TOI_DA, Math.max(1, capTienHoa)) - 1) * 0.25

  const mau = Math.round((200 + capDo * 35) * heSoHoc * heSoTienHoa)
  const cong = Math.round((35 + capDo * 8) * heSoHoc * heSoTienHoa)
  const giap = Math.round((15 + capDo * 4) * heSoHoc * heSoTienHoa)
  const cp = Math.round((mau / 10 + cong * 2 + giap * 1.5) * 10)

  return { cp, mau, cong, giap }
}
