// BẢNG TIN KIỂU SÀN GIAO DỊCH — hợp đồng dữ liệu của màn (thầy chốt mẫu 21/09; đề bài prompt-bang-tin-san-2109.md).
// MỘT nguồn trạng thái: mọi khối đọc từ `DuLieuSan`; số của các khối phải KHỚP nhau (xem `chotSo` ở trang-thai.ts). Khối thiếu (null) ⇒ ẩn, không bịa.
import type { BangTin } from '../bang-tin-thay'

// Nguồn thật: `POST /gv/bang-tin-song` (server/src/gv-bang-tin-song.ts) — cộng nguyên các khối của `/gv/bang-tin`; mỗi 10 giây hỏi một lần, giữa hai lần chỉ nội suy chuyển động.

/** Chuỗi 60 điểm, mỗi điểm một phút, điểm cuối = hiện tại. */
export interface Tia60 {
  /** Số em đã học (luỹ kế trong ngày, từ mốc). */
  hs: number[]
  /** Số câu đã làm (luỹ kế). */
  cau: number[]
  /** Tỉ lệ đúng cả ngày, % (0–100). */
  tile: number[]
  /** Số em đúng nhịp bài tập về nhà; null khi chưa có số. */
  nhip: number[] | null
}

/** Nến 5 phút: `dong` = tỉ lệ đúng (%) của các câu gần nhất tại cuối khung; `soCau` = số câu làm trong khung. */
export interface NenSan {
  tu: number
  mo: number
  cao: number
  thap: number
  dong: number
  soCau: number
}

export interface LopSan {
  lop: string
  siSo: number
  daHoc: number
  soCau: number
  soCauDung: number
}

export interface EmNhiet {
  sbd: string
  hoTen: string
  lop: string
  soCau: number
  soCauDung: number
  dangVap: boolean
}

export type LoaiTin = 'len' | 'xuong' | 'cham'

/** Một dòng băng chạy đã soạn sẵn chữ ở máy chủ (không mã dạng): `chu` in đậm, `phu` chữ nhạt sau đó. */
export interface TinSan {
  luc: number
  loai: LoaiTin
  chu: string
  phu?: string
}

/** Một dòng "Dẫn đầu hôm nay": số câu hôm nay + tiến bộ (điểm %) so với CHÍNH em ấy trong 7 ngày — không so em này với em khác. */
export interface DanDauSan {
  sbd: string
  hoTen: string
  tenLop: string
  soCau: number
  tienBo: number
}

export interface DungNhipSan {
  soEm: number
  soCoLo: number
}

export interface DuLieuSan {
  /** Mốc hiển thị (ms) — chip "Từ 12:00 · Thứ Hai 21/09/2026". */
  mocMs: number
  /** Giờ máy chủ lúc trả lời (ms) và giờ máy khách lúc nhận: chênh lệch hai đồng hồ để đồng hồ màn chạy theo giờ máy chủ. */
  serverNow: number
  nhanLucMs: number
  tongEm: number
  soEmHoc: number
  soCau: number
  soCauDung: number
  dungNhip: DungNhipSan | null
  tia: Tia60 | null
  tin: TinSan[]
  nen: NenSan[] | null
  theoLop: LopSan[] | null
  nhiet: EmNhiet[] | null
  /** ≤ 5 em dẫn đầu (chăm + tiến bộ so với chính em). null ⇒ ẩn khối. */
  danDau: DanDauSan[] | null
  /** Các khối sẵn có của `/gv/bang-tin` (bài tập về nhà, tiến bộ, em cần để ý, dạng vấp, Bộ não, việc A.I đã làm, sức khoẻ). null ⇒ ẩn các khối ấy. */
  bt: BangTin | null
  /** Dữ liệu mô phỏng (chỉ bản vẽ / kiểm thử) — hiện chip "Dữ liệu mô phỏng". */
  moPhong?: boolean
}
