// CỬA HÀNG PHỤ KIỆN THẦN THÚ — kiểu dùng chung của lớp MÀN (bước B1). Tên trường KHỚP hợp đồng máy chủ docs/hop-dong-shop-phu-kien-2109.md (thắng đề xuất khi khác nhau).
// Màn CHỈ nói chuyện với máy chủ qua `ShopApi` (tiêm từ ngoài): B1 gắn máy chủ giả (du-lieu-mau.ts), B5 gắn `call('game-v2/…')` thật.
// Số dư vàng / EXP luôn là số MÁY CHỦ trả; màn không lưu, không tự cộng trừ.
import type { BacPhuKien, OGanPhuKien } from '../../../lib/phu-kien-danh-muc'
import { O_GAN } from '../../../lib/phu-kien-danh-muc'

/** Năm chỗ đeo trên thần thú (khoá máy chủ): hao-quang · vet · khung · dau · co-lung. */
export type OGan = OGanPhuKien
export const CAC_O: readonly OGan[] = O_GAN
/** Bậc 1–5 = Thường · Đẹp · Hiếm · Sử thi · Huyền thoại. */
export type Bac = BacPhuKien

/** Món nào đang mặc ở từng chỗ đeo (`shop-danh-sach` và `thu-mac-do` trả đúng hình này). */
export type DangMac = Partial<Record<OGan, string | null>>

/** Đáp `vang-xem` khi cửa hàng MỞ. */
export interface ViSoMo {
  ok: true
  bat: true
  vang: number
  ongNghiem: number
  /** Số EXP thần thú luôn giữ lại (200). */
  giuLai: number
  /** EXP thừa đổi được tối đa — DO MÁY CHỦ TÍNH. */
  doiToiDa: number
  ngayAn: number
  chuoiNgay: number
  anThachSang: number
  mua: string
}
/** Đáp `vang-xem` khi cờ tắt: `{ok:true, bat:false}` — màn ẩn cửa hàng, ba lệnh còn lại trả `tam_dong`. */
export interface ViSoDong {
  ok: true
  bat: false
}
export type ViSo = ViSoMo | ViSoDong

/** Một phần tử `shop-danh-sach.mon[]` đúng như máy chủ trả. */
export interface MonMayChu {
  ma: string
  gia: number
  daCo: boolean
  dangMac: boolean
  /** `true` = điều kiện học ĐÃ đạt (hoặc món không có điều kiện). */
  moKhoa: boolean
  /** `null` khi đã mở khoá; ngược lại chữ ngắn "Cần chuỗi N ngày" (kèm " + M ấn thạch sáng" nếu có). */
  thieu: string | null
  /** Không giới hạn ⇒ null. `suatCon = suatTong − số cái đã bán`. */
  suatCon: number | null
  suatTong: number | null
}
/** Em đang ở đâu so với điều kiện học (để viết "em đang chuỗi 9 ngày"). */
export interface EmCo {
  chuoiNgay: number
  anThachSang: number
}

/** Món để VẼ = phần máy chủ trả + thông tin hiển thị ghép từ danh mục (`ghepDanhMuc`). */
export interface MonShop extends MonMayChu {
  ten: string
  bac: Bac
  oGan: OGan
  /** MỘT dòng "Bật mí Hoá học". */
  batMi: string
  /** Điều kiện học của món (số) — dùng nói "Cần có" và lời chỉ đường. */
  canChuoi: number | null
  canAnThach: number | null
}

/** Lỗi hợp đồng: `{ok:false, ma, loi}`. */
export interface LoiShop {
  ok: false
  ma: string
  loi: string
}

/** Mã lỗi khi mất mạng (do tầng gắn máy chủ tạo ra, không phải mã của máy chủ). */
export const MA_MAT_MANG = 'mat_mang'
/** Mã lỗi cờ tắt. */
export const MA_TAM_DONG = 'tam_dong'

/** Ném lỗi có `.ma` (mã hợp đồng) và `.message` (lời tiếng Việt của máy chủ, hiện thẳng lên màn). */
export class LoiShopApi extends Error {
  ma: string
  constructor(ma: string, loi: string) {
    super(loi)
    this.name = 'LoiShopApi'
    this.ma = ma
  }
}

export interface DapDoi {
  ok: true
  daDoi: number
  vang: number
  ongNghiem: number
  ngayAn: number
  lapLai: boolean
}
export interface DapDanhSach {
  ok: true
  phienBan: string
  vang: number
  /** CHỈ món đợt đang mở bán; món đợt sau màn tự vẽ "Sắp mở" từ danh mục. */
  mon: MonMayChu[]
  dangMac: DangMac
  emCo: EmCo
}
export interface DapMua {
  ok: true
  maMon: string
  vang: number
  /** Món mua xong TỰ MẶC vào chỗ đeo của nó. */
  daMac: boolean
  lapLai: boolean
}
export interface DapMacDo {
  ok: true
  dangMac: DangMac
}

/** Năm lệnh dưới `/game-v2/…`. Mỗi hàm trả Promise; lỗi ném `LoiShopApi`. */
export interface ShopApi {
  vangXem(): Promise<ViSo>
  /** `soExp` là số nguyên 1..doiToiDa; `khoaYeuCau` 8–64 ký tự [A-Za-z0-9_-], sinh MỘT lần cho mỗi lần bấm. */
  vangDoi(soExp: number, khoaYeuCau: string): Promise<DapDoi>
  shopDanhSach(): Promise<DapDanhSach>
  shopMua(maMon: string, giaThay: number, khoaYeuCau: string): Promise<DapMua>
  /** `maMon: null` = cởi. */
  thuMacDo(oGan: OGan, maMon: string | null): Promise<DapMacDo>
}

/** Điểm cắm vẽ thần thú mặc đồ. Mặc định = `ThuHinh` + lớp CSS giữ chỗ; sau này thay bằng `ThuMacDo` (Code 4). */
export interface VeThuDauVao {
  dangMac: DangMac
  pet: number
  cap: number
  size: number
  /** Tên trên khung tên + dòng nhỏ trên tên ("Thần thú của em") — để `ThuMacDo` vẽ khung. */
  ten?: string
  nhan?: string
  tinh?: boolean
}
export type VeThu = (o: VeThuDauVao) => import('react').ReactNode
