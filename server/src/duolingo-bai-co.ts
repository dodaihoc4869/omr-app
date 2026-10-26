// CỜ «HỌC KIỂU DUOLINGO» (26/10; hợp đồng docs/hop-dong-duolingo-2610.md mục 2). Khoá `cau_hinh.duolingo_bai` = {"cheDo":"tat"|"thu"|"bat","lop":[…]}:
//   tat (hoặc vắng dòng) ⇒ mở chặng giữ y thứ tự cũ, `hoc-tap-lam-lai` trả rỗng · thu ⇒ chỉ các lớp trong `lop` · bat ⇒ mọi em.
// Gác A1 (trộn chặng 6 câu, bai-6-cau.ts) và A3 (làm lại cuối chặng, goi-bai-7-lam-lai.ts). Thầy chốt phát hành bằng cờ, bật dần.
// Đọc qua đệm cấu hình 15 s (`docCauHinhDem`) + đệm bảng lớp (`lopCuaEm`) ⇒ nơi gọi bắt đầu SỚM, song song lượt đọc khác — không thêm vòng chờ D1.
import type { Env } from './kieu'
import { docCauHinhDem } from './cau-hinh-dem'
import { lopCuaEm } from './bai-da-day'

export const KHOA_DUOLINGO_BAI = 'duolingo_bai'
export type CheDoDuolingo = 'tat' | 'thu' | 'bat'
export interface CoDuolingo { cheDo: CheDoDuolingo; lop: string[] }

/** Đọc giá trị thô; hỏng / vắng ⇒ tắt. */
export function docCoDuolingo(v: string | null | undefined): CoDuolingo {
  if (!v) return { cheDo: 'tat', lop: [] }
  try {
    const j = JSON.parse(v) as { cheDo?: unknown; lop?: unknown }
    const cheDo: CheDoDuolingo = j.cheDo === 'bat' || j.cheDo === 'thu' ? j.cheDo : 'tat'
    const lop = Array.isArray(j.lop) ? j.lop.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 100) : []
    return { cheDo, lop }
  } catch { return { cheDo: 'tat', lop: [] } }
}

/** Cờ có áp cho em này không (lớp em lấy từ bảng lớp đã đệm). Lỗi đọc ⇒ tắt (giữ đường cũ). */
export async function duolingoChoEm(env: Env, sbd: string, nowMs: number = Date.now()): Promise<boolean> {
  try {
    const co = docCoDuolingo(await docCauHinhDem(env, KHOA_DUOLINGO_BAI, nowMs))
    if (co.cheDo === 'bat') return true
    if (co.cheDo === 'tat' || !co.lop.length) return false
    const lop = await lopCuaEm(env, sbd)
    return !!lop && co.lop.includes(lop)
  } catch { return false }
}
