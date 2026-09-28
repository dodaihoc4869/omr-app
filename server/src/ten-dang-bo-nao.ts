// TÊN DẠNG cạnh MÃ DẠNG cho màn của THẦY (chuẩn từ ngữ luật 4: mã nội bộ không hiện cho thầy) — Code 3, 21/09/2026.
// Ra đời cho Bộ não A.I (đã GỠ 28/09/2026); nay `tenCuaCacDang` là hàm DÙNG CHUNG của bảng tin, báo cáo ca, buổi chữa, giao thêm… (giữ tên tệp để khỏi đổi đường nhập).
// Tên lấy từ chỉ mục game (`game_v2_question.json.tenDang`, cùng nguồn với hồ sơ mạnh–yếu); mã chuyên đề `CD:<tên>` thì tên chính là phần sau `CD:`. Không biết tên ⇒ KHÔNG thêm khoá.
// Chỉ ĐỌC: một truy vấn (chia lô 60 mã). Lỗi đọc ⇒ giữ mã.
import type { Env } from './kieu'

type Obj = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()

/** Tên của các mã dạng (mã không biết tên vắng khỏi bản đồ). */
export async function tenCuaCacDang(env: Env, dsMa: string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const that: string[] = []
  for (const m of new Set(dsMa.map(chuoi).filter(Boolean))) {
    if (m.startsWith('CD:')) { if (chuoi(m.slice(3))) ra.set(m, chuoi(m.slice(3))) } else that.push(m)
  }
  for (let i = 0; i < that.length; i += 60) {
    try {
      const r = await env.DB.prepare("SELECT dang, MAX(json_extract(json, '$.tenDang')) AS ten FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang")
        .bind(JSON.stringify(that.slice(i, i + 60))).all<Obj>()
      for (const x of r.results ?? []) if (chuoi(x.ten)) ra.set(chuoi(x.dang), chuoi(x.ten))
    } catch {
      /* không tra được tên: giữ mã */
    }
  }
  return ra
}
