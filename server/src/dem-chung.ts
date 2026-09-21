// ĐỆM TTL DÙNG CHUNG cho phần dữ liệu DÙNG CHUNG giữa các em (Boss 21/09 ~20:50: D1 nghẽn giờ cao điểm, top tải = truy vấn lặp lại y hệt).
// Kho MỨC MÔ-ĐUN (Map khoá chuỗi; không gắn với đối tượng `env`), TTL ngắn, có TRẦN bộ nhớ: quá số khoá hoặc quá "trọng lượng" ⇒ bỏ khoá CŨ NHẤT trước.
// Chỉ đệm dữ liệu KHÔNG riêng em nào (kho câu theo dạng, cờ cấu hình, kết quả xác thực token theo đúng token). Không bao giờ đệm câu trả lời của em, sổ, hồ sơ, đáp án đã nộp.
// `xoaMoiDem()` xoá mọi đệm (test / sau khi đổi cấu hình tay); `tests/_d1-that.ts` gọi nó mỗi lần dựng D1 giả để các test không lẫn nhau.
const moiDem: Array<() => void> = []
export function xoaMoiDem(): void { for (const f of moiDem) f() }

export class DemTTL<T> {
  private kho = new Map<string, { at: number; v: T; co: number }>()
  private tong = 0
  /** `hanMs` = tuổi thọ tối đa; `toiDaKhoa` = số khoá tối đa; `toiDaCo` = tổng "trọng lượng" tối đa (vd số ký tự JSON). */
  constructor(private readonly hanMs: number, private readonly toiDaKhoa: number, private readonly toiDaCo: number = Number.POSITIVE_INFINITY) { moiDem.push(() => this.xoa()) }
  /** Còn hạn ⇒ trả giá trị (và đưa khoá lên "mới nhất"); hết hạn / đồng hồ lùi ⇒ bỏ khoá và trả undefined. */
  doc(khoa: string, nowMs: number): T | undefined {
    const x = this.kho.get(khoa)
    if (!x) return undefined
    if (nowMs - x.at < 0 || nowMs - x.at >= this.hanMs) { this.bo(khoa); return undefined }
    this.kho.delete(khoa); this.kho.set(khoa, x)
    return x.v
  }
  ghi(khoa: string, nowMs: number, v: T, co: number = 1): void {
    this.bo(khoa)
    this.kho.set(khoa, { at: nowMs, v, co })
    this.tong += co
    for (const k of this.kho.keys()) {
      if (this.kho.size <= this.toiDaKhoa && this.tong <= this.toiDaCo) break
      if (k === khoa) continue // không bỏ chính khoá vừa ghi
      this.bo(k)
    }
  }
  xoa(): void { this.kho.clear(); this.tong = 0 }
  /** Số khoá và tổng trọng lượng hiện có (test). */
  get soKhoa(): number { return this.kho.size }
  get tongCo(): number { return this.tong }
  private bo(khoa: string): void { const x = this.kho.get(khoa); if (x) { this.tong -= x.co; this.kho.delete(khoa) } }
}
