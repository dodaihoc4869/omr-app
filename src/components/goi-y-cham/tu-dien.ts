// CỬA DUY NHẤT tới lõi «Chạm để hiểu đề» của làn A (src/lib/goi-y-cham/: phat-hien · the-cham · tu-dien-chat — kéo cả từ điển ~395 chất,
// ~17,5 KB nén) ⇒ nạp LƯỜI một lần cho cả phiên, mảnh `tu-dien-cham` ngoài precache. Nạp hỏng (mất mạng lần đầu) ⇒ null ⇒ đề trơn như cũ;
// câu sau thử nạp lại.
import type { TheGiaiNghia, VungCham } from '../../lib/goi-y-cham/kieu'

export type TuDien = {
  phatHien: (chuDe: string) => VungCham[]
  /** `chuDe`: chữ đề chứa vùng — đề có «Cho nguyên tử khối …» thì M tính theo đúng số của đề. */
  theCho: (vung: VungCham, chuDe?: string) => TheGiaiNghia | null
}

let hua: Promise<TuDien | null> | null = null
/** Nạp từ điển MỘT lần cho cả phiên (lần mở câu đầu). */
export function napTuDien(): Promise<TuDien | null> {
  hua ??= Promise.all([import('../../lib/goi-y-cham/phat-hien'), import('../../lib/goi-y-cham/the-cham'), import('../../lib/goi-y-cham/tu-dien-chat')]).then(
    ([a, b, c]) => {
      const ntk = new Map<string, Record<string, number>>()
      const ntkCua = (chu: string) => {
        if (!ntk.has(chu)) { try { ntk.set(chu, c.docNguyenTuKhoiTrongDe(chu).bang) } catch { ntk.set(chu, {}) } }
        const bang = ntk.get(chu)!
        return Object.keys(bang).length ? bang : undefined
      }
      return { phatHien: a.phatHien, theCho: (v: VungCham, chuDe?: string) => b.theCho(v, chuDe ? ntkCua(chuDe) : undefined) }
    },
    () => { hua = null; return null },
  )
  return hua
}
