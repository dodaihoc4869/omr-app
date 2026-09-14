/**
 * DỮ LIỆU THẦN THÚ HOÁ HỌC (ALCHEMON)
 * 4 Hệ nguyên tố: Hỏa/Nhiệt Nhôm, Axit/Ăn Mòn, Kiềm/Tinh Thể, Khí/Halogen
 * Tuân thủ tuyệt đối quy tắc check:mau (chỉ dùng rgb / rgba, không dùng hex code).
 */

export type HeNguyenTo = 'hoa' | 'axit' | 'kiem' | 'khi'
export type CapTienHoa = 1 | 2 | 3

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
    ten: 'Hải Quái Axit Aqua',
    danhHieu: 'Chúa Tể Ăn Mòn Kim Loại',
    he: 'axit',
    mauChinh: 'rgb(168, 85, 247)',
    mauPhu: 'rgb(99, 102, 241)',
    mauHaoQuang: 'rgba(168, 85, 247, 0.45)',
    moTa: 'Tích tụ từ dòng dung dịch cường toan HNO₃ và HCl đặc. Rút cạn sinh lực và ăn mòn mọi lớp giáp kiềm kim.',
    kyNangThuong: 'Bắn Gai Axit H⁺',
    kyNangNo: 'Đại Hồng Thủy Cường Toan',
    nguyenToGoc: 'HNO₃ + HCl',
  },
  thiet_giap: {
    id: 'thiet_giap',
    ten: 'Bảo Thần Kiềm Tinh Thể',
    danhHieu: 'Kim Thân Bất Hoại BaSO₄',
    he: 'kiem',
    mauChinh: 'rgb(14, 165, 233)',
    mauPhu: 'rgb(234, 179, 8)',
    mauHaoQuang: 'rgba(14, 165, 233, 0.45)',
    moTa: 'Kết tinh từ mạng lưới tinh thể bazơ bền vững và kết tủa BaSO₄. Tạo màn chắn trung hòa mọi loại axit.',
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
    moTa: 'Hấp thụ khí Flo và Clo đậm đặc, có độ âm điện mạnh nhất bảng tuần hoàn, giật điện và làm tê liệt đối thủ.',
    kyNangThuong: 'Lốc Xoáy Khí Clo Cl₂',
    kyNangNo: 'Cuồng Phong Oxi Hóa Flo F₂',
    nguyenToGoc: 'F₂ + Cl₂',
  },
}

/**
 * Tương khắc nguyên tố:
 * Hỏa (Nhiệt nhôm) > Khí (Halogen)
 * Khí (Halogen) > Kiềm (Hấp thụ kiềm)
 * Kiềm (Bazơ) > Axit (Trung hòa axit)
 * Axit (Ăn mòn) > Hỏa (Dập tắt oxit / nhiệt)
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
  soLanThangPvp: number
  danhHieuHienTai: string
  ngayNhanTrung: string
}

export const KHOA_LUU_THAN_THU = 'omr_than_thu_hoa_hoc_data'

export function layHoSoThanThuMacDinh(idChon = 'hoa_long'): HoSoThanThuLuu {
  return {
    idThanhThuChon: idChon,
    capDo: 1,
    exp: 0,
    expToiDa: 100,
    capTienHoa: 1,
    tangThapCaoNhat: 1,
    soLanThangPvp: 0,
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
  const diemHocTap = diemTrungBinh !== null && Number.isFinite(diemTrungBinh) ? diemTrungBinh : 7.0
  const heSoHoc = 1 + (diemHocTap / 10) * 0.4 + tyLeBtvn * 0.3
  const heSoTienHoa = capTienHoa === 3 ? 2.2 : capTienHoa === 2 ? 1.5 : 1.0

  const mau = Math.round((200 + capDo * 35) * heSoHoc * heSoTienHoa)
  const cong = Math.round((35 + capDo * 8) * heSoHoc * heSoTienHoa)
  const giap = Math.round((15 + capDo * 4) * heSoHoc * heSoTienHoa)
  const cp = Math.round((mau / 10 + cong * 2 + giap * 1.5) * 10)

  return { cp, mau, cong, giap }
}
