// BẢNG CHUYÊN ĐỀ CỦA RIÊNG MỘT CA (lõi dựng phiếu cả ca — `phieu-ca-ca.ts` — dùng).
// Trước đây tệp này còn gói ẢNH phiếu từng em thành .zip để gửi Zalo; thầy lệnh "Bỏ phiếu Zalo" (21/09) nên ảnh phiếu + gói zip đã gỡ (không màn nào gọi). Tên tệp giữ nguyên để khỏi đổi import.
import type { ChiTietCauRow } from './exam-api'

/** Một chuyên đề trong bảng của ca: số câu, số câu sai. */
export interface ChuyenDeMatDiem {
  ten: string
  soCau: number
  soSai: number
}

/** Gộp chi tiết từng câu thành bảng chuyên đề của RIÊNG ca này, sắp giảm dần
 * theo số câu sai. Câu không ghi chuyên đề thì bỏ qua — không gộp vào một ô
 * "khác" vì phiếu gửi phụ huynh không nói được gì với chữ "khác". */
export function chuyenDeTuChiTiet(rows: ChiTietCauRow[]): ChuyenDeMatDiem[] {
  const m = new Map<string, ChuyenDeMatDiem>()
  for (const r of rows) {
    const ten = (r.chuyenDe || '').trim()
    if (!ten) continue
    const c = m.get(ten) ?? { ten, soCau: 0, soSai: 0 }
    c.soCau += 1
    if (r.dungSai === false) c.soSai += 1
    m.set(ten, c)
  }
  return [...m.values()].sort((a, b) => b.soSai - a.soSai || b.soCau - a.soCau)
}
