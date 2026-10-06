// `/ca/co-luot-moi` (06/10) — EM NÀO CÓ LƯỢT TỰ LÀM MỚI KỂ TỪ MỘT MỐC. CHỈ ĐỌC.
//
// Vì sao: máy thầy chạy thử rút đề lúc mở ca, rồi chốt lúc Bắt đầu thi. Em làm bài (game, chiến dịch, luyện, Lên bảng…) trong
// khoảng giữa thì bản chạy thử cũ coi câu em vừa làm là câu "mới". Lệnh này cho máy thầy biết có em nào như vậy để rút lại.
//
// Lượt "tự làm" = đúng định nghĩa của `/ca/cau-da-dung` (cau-da-dung.ts): không hỗ trợ, không phải đọc lời giải / lướt / chẩn đoán,
// không thuộc ca chưa công bố, không phải câu nền. Mốc so với `luc` (giờ học của sự kiện) HOẶC `received_at` (giờ máy chủ nhận —
// sự kiện tới muộn vẫn tính). Một truy vấn cho cả lô; sổ cũ thiếu cột ⇒ lọc bằng luật cũ như `/ca/cau-da-dung`.
import type { Env } from './kieu'
import { TU_LAM_CU, TU_LAM_MOI } from './cau-da-dung'

type Obj = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim())
/** Tối đa em mỗi lượt (cả ca ≤ vài chục em; chừa dư cho phòng chờ). */
export const TOI_DA_EM_CO_LUOT_MOI = 200

export async function coLuotMoi(env: Env, b: Obj): Promise<Obj> {
  const ds = [...new Set((Array.isArray(b.sbd) ? b.sbd : []).map(chuoi).filter(Boolean))]
  const ms = Date.parse(chuoi(b.tu))
  if (!Number.isFinite(ms)) return { ok: false, error: 'Mốc thời gian không hợp lệ' }
  if (ds.length === 0) return { ok: true, em: [] }
  if (ds.length > TOI_DA_EM_CO_LUOT_MOI) return { ok: false, error: `Tối đa ${TOI_DA_EM_CO_LUOT_MOI} em mỗi lượt` }
  const iso = new Date(ms).toISOString()
  const lo = (tuLam: string, coNhan: boolean) =>
    env.DB.prepare(
      `SELECT DISTINCT sbd FROM su_kien_hoc
        WHERE sbd IN (SELECT value FROM json_each(?)) AND ket_qua IS NOT NULL AND (luc > ?${coNhan ? ' OR COALESCE(received_at, 0) > ?' : ''}) AND ${tuLam}`,
    ).bind(JSON.stringify(ds), iso, ...(coNhan ? [ms] : [])).all<Obj>()
  try {
    const r = await lo(TU_LAM_MOI, true).catch(() => lo(TU_LAM_CU, false))
    return { ok: true, em: (r.results ?? []).map((x) => chuoi(x.sbd)).filter(Boolean).sort() }
  } catch (e) {
    console.error('[co-luot-moi] lỗi:', e instanceof Error ? e.message : e)
    return { ok: false, error: 'Chưa đọc được sổ học' } // TIN THẬT: không trả "không có em nào" khi đọc hỏng
  }
}
