import type { AnhPhien } from './chua-cau-sai-phien'
import type { BuocChua, HieuBuoc } from './chua-cau-sai-kieu'
export type BuocChuaTrenLop = Pick<BuocChua, 'id' | 'tieuDe' | 'hoTro'> & {
  hieuBuoc?: Pick<
    HieuBuoc,
    | 'mucTieu'
    | 'yNghiaDaiLuong'
    | 'viSaoCanBuoc'
    | 'dieuKienApDung'
    | 'noiVoiBuocSau'
  >
}

/** Chỉ trả qua cổng giáo viên; không dùng làm response của học sinh. */
export interface NhomChuaTrenLop {
  id: string
  lop: string
  qid: string
  buocId: string
  tieuDe: string
  maLoi: string | null
  diemVuong: string
  cauGoc: AnhPhien['cauGoc']
  buoc: BuocChuaTrenLop[]
  em: {
    dotId: string
    sbd: string
    hoTen: string
    revision: number
    daHieu: string[]
    traLoi: string
    hoi: string
    soVongHoTro: number
  }[]
  guiLuc: number
}
