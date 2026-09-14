/**
 * BA MỨC ĐỘ KHÓ. Tên lấy đúng thang điểm của trung tâm, nên em nhìn là hiểu ngay
 * mình đang chọn gì — không cần chú thích "dễ / vừa / khó".
 *
 * Mọi con số điều chỉnh độ khó nằm HẾT ở đây. Cấm rải ngưỡng ra chỗ khác.
 */
export type MaDoKho = 'truot' | 'do' | 'thuKhoa'

export interface DoKho {
  ma: MaDoKho
  ten: string
  moTa: string
  mau: string
  /** Số quái trên đảo. */
  soQuai: number
  /** Tốc độ quái, đơn vị/giây. */
  tocDoQuai: number
  /** Số bông hoa khổng lồ rải trên đảo. */
  soHoa: number
  /** Độ chính xác của bot. */
  botDoChinhXac: number
  /** Máu rồng. */
  mauRong: number
  /** Cửa sổ hở của rồng — hẹp hơn là khó dẫm trúng hơn. */
  giayHoRong: number
}

export const BA_DO_KHO: readonly DoKho[] = [
  {
    ma: 'truot', ten: 'Trượt đại học', moTa: 'Ít quái, chậm, nhiều hoa. Học cách chơi.',
    mau: '#2FA8E8', soQuai: 8, tocDoQuai: 70, soHoa: 10,
    botDoChinhXac: 0.42, mauRong: 2, giayHoRong: 2.0,
  },
  {
    ma: 'do', ten: 'Đỗ đại học', moTa: 'Vừa sức. Quái đi tuần, hoa đủ dùng.',
    mau: '#1EA05A', soQuai: 16, tocDoQuai: 110, soHoa: 6,
    botDoChinhXac: 0.62, mauRong: 3, giayHoRong: 1.5,
  },
  {
    ma: 'thuKhoa', ten: 'Thủ khoa toàn quốc', moTa: 'Quái dày và nhanh, hoa hiếm, bot thuộc bài.',
    mau: '#FF5A4E', soQuai: 26, tocDoQuai: 160, soHoa: 3,
    botDoChinhXac: 0.82, mauRong: 4, giayHoRong: 1.1,
  },
] as const

export function layDoKho(ma: MaDoKho): DoKho {
  return BA_DO_KHO.find((d) => d.ma === ma) ?? BA_DO_KHO[1]!
}
