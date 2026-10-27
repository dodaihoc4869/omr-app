import type { Env } from './kieu'

/**
 * ĐỢT 22 (thầy 13/10: "tối ưu máy chủ chuyên sâu hơn nữa, đảm bảo … máy chủ phản hồi tức thì") · DẤU KHO CÂU rẻ.
 * `game_v2_question` CHỈ được ghi lại cùng `game_v2_index` trong MỘT lô (`lapChiMucTo`, game-v2-bank.ts: xoá câu cũ của tờ, ghi câu mới, ghi mốc)
 * ⇒ (số tờ đã lập chỉ mục, mốc lập chỉ mục mới nhất) đổi ⇔ câu trong kho đổi (sửa đề/đáp án/duyệt, thêm/bớt tờ). Một lệnh đọc bảng nhỏ (một dòng/tờ)
 * thay cho đọc lại hàng nghìn câu kèm JSON mỗi khi đệm trong isolate vừa hết hạn mà kho không đổi (số đo 13/10: danh mục Hành trình 524 lần/3 giờ ×
 * 57 ms, câu của các tờ trong phạm vi 444 lần/3 giờ × 65 ms). Đệm dùng dấu này vẫn giữ HẠN TỐI ĐA riêng để chắc chắn tự làm mới.
 */
export const SQL_DAU_KHO_CAU = `SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') d FROM game_v2_index`

/** Dấu kho hiện tại; lỗi đọc ⇒ '' (nơi gọi coi như "không chắc" ⇒ đọc lại đầy đủ như cũ). */
export async function dauKhoCau(env: Env): Promise<string> {
  try {
    const r = await env.DB.prepare(SQL_DAU_KHO_CAU).first<{ d: string | null }>()
    return String(r?.d ?? '')
  } catch {
    return ''
  }
}

/**
 * Đệm đã đọc kho lúc `docLuc` (ms) mà CHƯA biết dấu (lần đọc đầu không hỏi dấu để không thêm lệnh): dữ liệu còn đúng nếu mốc lập chỉ mục mới nhất
 * trong dấu `d` có TRƯỚC lúc đọc (định dạng ISO như `indexed_at` máy chủ ghi). Mốc lạ/không so được ⇒ false (đọc lại cho chắc).
 */
export function dauTruocLucDoc(d: string, docLuc: number): boolean {
  const moc = d.slice(d.indexOf('|') + 1)
  if (!/^\d{4}-\d{2}-\d{2}T/.test(moc) || !Number.isFinite(docLuc)) return false
  return moc < new Date(docLuc).toISOString()
}


/**
 * ĐỆM THEO KHO trong isolate (28/10 — Analytics D1 27/10 19–23h: đọc câu rút gọn của tờ 8 %, siêu dữ liệu câu ~6 % thời gian D1; kho câu gần như tĩnh — mốc lập
 * chỉ mục mới nhất 07/10). Mỗi khoá đọc D1 nhiều nhất MỘT lần mỗi `hanMs` (30 phút) trong isolate; quá `kiemMs` (5 phút) thì hỏi dấu kho (một dòng nhẹ,
 * `dauKhoCau`): dấu đổi (thầy sửa đề / duyệt / thêm tờ ⇒ mốc lập chỉ mục đổi) ⇒ bỏ ngay, đọc lại. Không đọc được dấu ⇒ đọc lại (như cũ).
 * Lượt cùng khoá đến cùng lúc (isolate mới giờ cao điểm) chờ chung MỘT lượt đọc. Giới hạn số khoá + tổng trọng lượng (vd số câu) ⇒ bộ nhớ có trần.
 * Bộ test mặc định TẮT (kết quả test không phụ thuộc giờ thật / đệm giữa các ca); test của đệm bật bằng `batDemTheoKho(true)`.
 */
let demTheoKhoBat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
export function batDemTheoKho(b: boolean): void { demTheoKhoBat = b }
const cacDem: { xoa(): void }[] = []
/** Bỏ mọi đệm theo kho (test / sau khi lập lại chỉ mục trong cùng isolate). */
export function xoaDemTheoKho(): void { for (const d of cacDem) d.xoa() }
export class DemTheoKho<T> {
  private kho = new Map<string, { v: T; dau: string; kiem: number; luc: number; co: number }>()
  private dang = new Map<string, Promise<T>>()
  private tong = 0
  constructor(private readonly hanMs = 30 * 60_000, private readonly kiemMs = 5 * 60_000, private readonly toiDaKhoa = 64, private readonly toiDaCo = 400_000) { cacDem.push(this) }
  xoa(): void { this.kho.clear(); this.dang.clear(); this.tong = 0 }
  private bo(k: string): void { const x = this.kho.get(k); if (x) { this.tong -= x.co; this.kho.delete(k) } }
  async lay(env: Env, khoa: string, now: number, doc: () => Promise<T>, co: (v: T) => number = () => 1): Promise<T> {
    if (!demTheoKhoBat) return doc()
    const x = this.kho.get(khoa)
    if (x && now - x.luc >= 0 && now - x.luc < this.hanMs) {
      if (now - x.kiem >= 0 && now - x.kiem < this.kiemMs) return x.v
      const d = await dauKhoCau(env)
      if (d && (x.dau ? d === x.dau : dauTruocLucDoc(d, x.luc)) && this.kho.get(khoa) === x) { x.dau = d; x.kiem = now; return x.v }
    }
    this.bo(khoa)
    const dangDoc = this.dang.get(khoa)
    if (dangDoc) return dangDoc
    const p = doc()
    this.dang.set(khoa, p)
    try {
      const v = await p
      const c = Math.max(1, co(v))
      this.bo(khoa); this.kho.set(khoa, { v, dau: '', kiem: now, luc: now, co: c }); this.tong += c
      for (const k of this.kho.keys()) { if (this.kho.size <= this.toiDaKhoa && this.tong <= this.toiDaCo) break; if (k !== khoa) this.bo(k) }
      return v
    } finally { if (this.dang.get(khoa) === p) this.dang.delete(khoa) }
  }
}
