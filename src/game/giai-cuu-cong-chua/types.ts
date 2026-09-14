import type { HocTro, TuThe } from './bo-nguoi'

export type PhaVan = 'chay' | 'canhMoDau' | 'trum' | 'xong'

/**
 * Cảnh mở đầu trận rồng. Màn tối lại, chữ hiện từng dòng.
 * Máy chủ quyết cảnh này chứ không phải máy khách — 12 máy phải thấy cùng lúc.
 */
export interface CanhMoDau {
  /** Giây trong ván lúc cảnh bắt đầu. */
  batDau: number
  /** Các dòng chữ, hiện dần. */
  dong: string[]
}

export const LOI_CANH_MO_DAU: readonly string[] = [
  'Người yêu cũ của bạn',
  'đang bị con rồng giam giữ.',
  'Chiến thắng con rồng,',
  'bạn sẽ được quay lại với người yêu cũ…',
  'DŨNG CẢM LÊN',
]
export type PhaRong = 'do' | 'phun' | 'dap' | 'ho' | 'nga'

export interface PhimBam {
  trai: boolean
  phai: boolean
  /** Thời điểm bấm nhảy gần nhất (giây trong ván). -999 nghĩa là chưa bấm. */
  nhayLuc: number
}

export interface NguoiChoi {
  id: number
  laBot: boolean
  hocTro: HocTro
  /** Công thức hoá chất đang cầm. */
  hoaChat: string
  mang: number
  x: number
  /** y của CHÂN. Trục y hướng LÊN. */
  y: number
  vx: number
  vy: number
  chamDat: boolean
  /** Thời điểm rời mặt đất gần nhất — để cho nhảy muộn. */
  roiDatLuc: number
  nhayConLai: number
  batTuDen: number
  song: boolean
  huong: 1 | -1
  tuThe: TuThe
  phim: PhimBam
  /** Đang phải chọn lại hoá chất cho tới giây này. */
  chonLaiDen: number
  /** Số lần thực sự đổi sang chất khác. */
  soLanDoiChat: number
  /** Số lần ĐƯỢC MỜI chọn lại — phải bằng số mạng đã mất mà còn sống. */
  soLanDuocChon: number
  /** Đang khổng lồ cho tới giây này. Ăn hoa thì đặt lại. */
  khongLoDen: number
}

export interface BangTin {
  /** Phương trình hiện sau cú dẫm. */
  pt: string
  tieuChi: string
  nhan: string
  mau: string
  den: number
}
