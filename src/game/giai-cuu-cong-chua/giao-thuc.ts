/**
 * GIAO THỨC MÁY KHÁCH ↔ MÁY CHỦ.
 *
 * MỘT LUẬT DUY NHẤT, KHÔNG NHÂN NHƯỢNG: **máy khách chỉ gửi PHÍM BẤM.**
 * Không gửi toạ độ, không gửi "tôi dẫm trúng", không gửi "tôi ăn hoa", không
 * gửi số mạng. Máy chủ tính hết và là trọng tài duy nhất.
 *
 * Có một phép kiểm đọc chính tệp này và bắt lỗi nếu ai đó thêm trường vị trí
 * vào gói gửi lên — vì đó là cách mọi game nhiều người bị hack.
 */
import type { MaDoKho } from './do-kho'
import type { TuThe } from './bo-nguoi'

export const PHIEN_BAN_GIAO_THUC = 1

/* ─────────── MÁY KHÁCH → MÁY CHỦ ─────────── */

/** Bấm phím. Đây là THỨ DUY NHẤT máy khách được gửi trong lúc chơi. */
export interface GoiPhim {
  loai: 'phim'
  trai: boolean
  phai: boolean
  /** true đúng một lần ở khung hình bấm nhảy. */
  nhay: boolean
  /** Số thứ tự gói, để máy chủ bỏ gói đến muộn và máy khách đối chiếu dự đoán. */
  stt: number
}

/** Vào phòng. Chỉ biệt danh — KHÔNG số báo danh, KHÔNG họ tên thật. */
export interface GoiVao {
  loai: 'vao'
  bietDanh: string
  /** Mã máy ngẫu nhiên 16 byte, không tra ngược ra em nào. */
  maMay: string
  phienBan: number
}

/** Chọn hoá chất (ở phòng chờ, hoặc 6 giây sau khi mất một mạng). */
export interface GoiChonChat {
  loai: 'chonChat'
  hoaChat: string
}

/** Chủ phòng chọn mức độ. */
export interface GoiChonMuc {
  loai: 'chonMuc'
  doKho: MaDoKho
}

export type GoiLen = GoiPhim | GoiVao | GoiChonChat | GoiChonMuc

/* ─────────── MÁY CHỦ → MÁY KHÁCH ─────────── */

/** Một người trong ảnh chụp. Số thực làm tròn 1 chữ số để gói nhẹ. */
export interface NguoiTrongAnh {
  id: number
  x: number
  y: number
  vy: number
  huong: 1 | -1
  tuThe: TuThe
  mang: number
  hoaChat: string
  song: boolean
  /** Còn bất tử tới giây nào. */
  batTu: number
  /** Còn khổng lồ tới giây nào. */
  khongLo: number
}

/** Ảnh chụp trạng thái, máy chủ bắn 20 lần mỗi giây. */
export interface GoiAnh {
  loai: 'anh'
  giay: number
  nguoi: NguoiTrongAnh[]
  /** Chỉ số quái CÒN SỐNG — gửi chỉ số thay vì cả mảng cho nhẹ. */
  quaiSong: number[]
  /** Chỉ số hoa CÒN TRÊN ĐẢO. */
  hoaCon: number[]
  rong: { x: number; mau: number; pha: string; hoaChat: string; cotConLai: number } | null
  pha: 'chay' | 'canhMoDau' | 'trum' | 'xong'
  /** Giây trong ván lúc cảnh mở đầu bắt đầu. null khi không chiếu.
   *  Máy chủ giữ mốc này để 12 máy chiếu cảnh CÙNG LÚC. */
  canhMoDau: number | null
  /** Còn mấy người sống — để máy khách hiện "cửa hang còn đóng". */
  conSong: number
}

/** Bắt đầu ván: mọi thứ cố định cả ván, gửi đúng một lần. */
export interface GoiVaoVan {
  loai: 'vaoVan'
  hat: number
  doKho: MaDoKho
  idCuaBan: number
  nguoi: { id: number; bietDanh: string; laBot: boolean; hoaChat: string; kieuDau: string; mauAo: string }[]
}

export interface GoiPhongCho {
  loai: 'phongCho'
  maPhong: string
  giayConLai: number
  doKho: MaDoKho
  nguoi: { maMay: string; bietDanh: string; hoaChat: string | null; laChuPhong: boolean }[]
  /** Chất đã có người lấy — máy khách làm mờ. */
  chatDaLay: string[]
}

/** Một sự kiện đáng hiện chữ: dẫm, ăn hoa, mất mạng. Máy chủ quyết, máy khách chỉ vẽ. */
export interface GoiSuKien {
  loai: 'suKien'
  giay: number
  nhan: string
  pt: string
  tieuChi: string
  mau: string
  /** id người liên quan, để máy khách biết có phải mình không. */
  idA: number
  idB: number
}

export interface GoiKetVan {
  loai: 'ketVan'
  thang: number | null
  duong: 'rong' | 'sotCuoi' | null
  bang: { id: number; bietDanh: string; mang: number; hoaChatCuoi: string }[]
}

export interface GoiLoi {
  loai: 'loi'
  ma: 'phongDay' | 'phienBanLech' | 'chatDaCoNguoi' | 'goiLa' | 'chuaVao'
  loi: string
}

export type GoiXuong = GoiAnh | GoiVaoVan | GoiPhongCho | GoiSuKien | GoiKetVan | GoiLoi

/* ─────────── tiện ích ─────────── */

/** Làm tròn 1 chữ số — gói ảnh nhẹ đi khoảng một phần ba. */
export function tron(x: number): number {
  return Math.round(x * 10) / 10
}

/** Biệt danh: 2–16 ký tự, bỏ mọi thứ không phải chữ/số/khoảng trắng. */
export function loBietDanh(s: string): string {
  const sach = s.normalize('NFC').replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 16)
  return sach.length >= 2 ? sach : 'Ẩn danh'
}

/** Mã máy 16 byte dạng hex. Không tra ngược ra em nào. */
export function taoMaMay(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('')
}
