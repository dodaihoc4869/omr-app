import type { HocTro, TuThe } from './nhan-vat'

export type PhaVan = 'chay' | 'trum' | 'xong'
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
