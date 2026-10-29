// ĐỆM ISOLATE CHO MÀN SỬA CÂU (thầy 29/10, video 08:25: «Mở câu quá lâu, kiểm tra chưa tức thì» — «Đang mở câu…» ~3,3 s, «Đang kiểm tra…» ~1,3 s ngay lúc vắng).
// Đo trên mã: mo-dot kèm gon-mo = ~16 đợt chờ D1 NỐI TIẾP (mỗi `cauDuoc` ba bốn đợt: em có thật + đã gặp → nội dung → đề bảo vệ → kho đề giao tuần; làm HAI lần: lúc giao đợt,
// lúc mở bản làm lại; `cacBan` thêm 1–3 đợt; `quyen` hai lần); gon-nop ~8 đợt (cùng các hàm ấy + kemChiTiet).
// Cách làm: nhớ KẾT QUẢ những hàm ấy trong isolate, ngắn hạn, theo đúng khoá (em × câu / câu × phiên bản). Giữ nguyên ý nghĩa an toàn:
//  · Câu trả ra vẫn là câu mà `cauDuoc` gốc trả; mỗi lần dùng bản nhớ vẫn QUA LẠI cổng đề bảo vệ của ca thi (đọc tập câu bảo vệ — đệm 5 giây của game-v2-bank, tươi như đường gốc)
//    ⇒ câu vừa vào đề thi không bao giờ được phục vụ từ bản nhớ. Chỉ phần «em có thật / đã gặp / câu nghi / kho đề giao tuần» được nhớ tối đa HAN_CAU_GON_MS.
//  · Chỉ nhớ kết quả CÓ câu (không nhớ «không tìm thấy» / lỗi) ⇒ sự cố thoáng qua không bị kéo dài.
//  · Hai lượt cùng khoá đang chạy ⇒ dùng chung MỘT lượt đọc (mở chặng kèm bản làm lại không còn đọc câu hai lần).
//  · Trần bộ nhớ: tối đa TOI_DA_KHOA khoá / TOI_DA_CO ký tự JSON; `xoaMoiDem()` (test) và `xoaDemCaBaoVe()` (isolate vừa ghi bảng `ca`) xoá cả kho.
import { DemTTL, dangKyXoaDem } from './dem-chung'
import { dangKySauXoaCaBaoVe } from './game-v2-bank'

/** Tuổi tối đa của bản nhớ câu / bản làm lại / học liệu (ms). */
export const HAN_CAU_GON_MS = 3 * 60_000
const TOI_DA_KHOA = 600
const TOI_DA_CO = 3_000_000

/** Một kho nhớ theo khoá chuỗi + chia sẻ lượt đang chạy. Giá trị `null`/`undefined` KHÔNG được nhớ. */
export class NhoCoLuot<T extends object> {
  private readonly kho: DemTTL<T>
  private readonly bay = new Map<string, Promise<T | null>>()
  private daDangKy = false
  constructor(hanMs: number = HAN_CAU_GON_MS) {
    this.kho = new DemTTL<T>(hanMs, TOI_DA_KHOA, TOI_DA_CO)
    dangKyXoaDem(() => this.bay.clear())
  }
  /** Đăng ký xoá-khi-isolate-ghi-bảng-`ca` ở LẦN GHI ĐẦU (không ở lúc dựng: nhiều mô-đun dựng kho này lúc nạp, vòng nhập với game-v2-bank dễ chưa khởi tạo xong). */
  private dangKy(): void {
    if (this.daDangKy) return
    this.daDangKy = true
    dangKySauXoaCaBaoVe(() => { this.kho.xoa(); this.bay.clear() })
  }
  /** Bản nhớ còn hạn, hoặc undefined. */
  doc(khoa: string, nowMs = Date.now()): T | undefined { return this.kho.doc(khoa, nowMs) }
  ghi(khoa: string, v: T, nowMs = Date.now()): void {
    this.dangKy()
    let co = 1
    try { co = Math.max(1, JSON.stringify(v).length) } catch { /* vòng tham chiếu ⇒ trọng lượng 1 */ }
    this.kho.ghi(khoa, nowMs, v, co)
  }
  /** Lấy từ bản nhớ; không có ⇒ chạy `tai` (dùng chung với lượt cùng khoá đang chạy), nhớ kết quả khác null. Lỗi của `tai` ném ra như cũ (không nhớ). */
  async lay(khoa: string, tai: () => Promise<T | null>, nowMs = Date.now()): Promise<T | null> {
    const co = this.kho.doc(khoa, nowMs)
    if (co) return co
    const dang = this.bay.get(khoa)
    if (dang) return dang
    const p: Promise<T | null> = Promise.resolve().then(tai).then((v) => { if (v) this.ghi(khoa, v); return v })
      .finally(() => { if (this.bay.get(khoa) === p) this.bay.delete(khoa) })
    this.bay.set(khoa, p)
    return p
  }
}
