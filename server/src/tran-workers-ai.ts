// TRẦN WORKERS AI MỖI NGÀY (11/11 — hoá đơn Cloudflare 127,61 USD; thầy «làm mọi thứ để dùng bản 5 đô/tháng»).
// Workers AI chỉ là đường dự phòng khi Gemini hết hạn mức (máy soạn sơ đồ, soan-so-do.ts). Ngày 27/10 đường này đốt 1,61 triệu neurons ≈ 17,6 USD.
// Gói trả phí có 10.000 neurons MIỄN PHÍ mỗi ngày ⇒ giữ dưới trần 9.000 (chừa lề cho sai số ước lượng); hết trần ⇒ trả như hết hạn mức (HTTP 429),
// máy soạn giữ con trỏ và chạy tiếp hôm sau. Tắt hẳn: cau_hinh khoa='workers_ai_tat' gia_tri='1'.
// Quy đổi neurons theo bảng giá Workers AI của @cf/openai/gpt-oss-120b (0,35 USD / triệu token vào, 0,75 USD / triệu token ra; 0,011 USD / 1.000 neurons).
import type { Env } from './kieu'

export const TRAN_NEURON_NGAY = 9000
export const NEURON_MOI_TRIEU_VAO = 31_818
export const NEURON_MOI_TRIEU_RA = 68_182
/** Lượt không báo số token ⇒ tính tối thiểu chừng này (thà dừng sớm còn hơn vượt). */
export const NEURON_TOI_THIEU_LUOT = 500
const KHOA = 'workers_ai_ngay'

export const ngayVnCua = (ms: number): string => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)
export function neuronCua(vao: number, ra: number): number {
  const n = Math.ceil(((Number(vao) || 0) * NEURON_MOI_TRIEU_VAO + (Number(ra) || 0) * NEURON_MOI_TRIEU_RA) / 1e6)
  return Math.max(NEURON_TOI_THIEU_LUOT, n)
}

/** Còn được gọi Workers AI hôm nay không (một lần đọc D1: công tắc tắt + số đã dùng). Đọc lỗi ⇒ KHÔNG gọi (đóng cửa). */
export async function conTranWorkersAi(env: Env, now = Date.now()): Promise<boolean> {
  try {
    const r = await env.DB.prepare(`SELECT khoa,gia_tri FROM cau_hinh WHERE khoa IN ('workers_ai_tat',?)`).bind(KHOA).all<{ khoa: string; gia_tri: string | null }>()
    let dung = 0
    for (const x of r.results ?? []) {
      if (x.khoa === 'workers_ai_tat' && String(x.gia_tri ?? '').trim() === '1') return false
      if (x.khoa === KHOA) {
        try { const o = JSON.parse(String(x.gia_tri ?? '{}')) as { ngay?: string; neuron?: number }; if (o.ngay === ngayVnCua(now)) dung = Number(o.neuron) || 0 } catch { /* hỏng ⇒ coi như 0 */ }
      }
    }
    return dung < TRAN_NEURON_NGAY
  } catch {
    return false
  }
}

/** Cộng số neurons vừa dùng vào ngày hôm nay (sang ngày mới thì đếm lại). */
export async function ghiDungWorkersAi(env: Env, vao: number, ra: number, now = Date.now()): Promise<void> {
  const ngay = ngayVnCua(now), n = neuronCua(vao, ra)
  await env.DB.prepare(
    `INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,json_object('ngay',?,'neuron',?),?)
     ON CONFLICT(khoa) DO UPDATE SET gia_tri=CASE WHEN json_extract(cau_hinh.gia_tri,'$.ngay')=? THEN json_object('ngay',?,'neuron',COALESCE(json_extract(cau_hinh.gia_tri,'$.neuron'),0)+?) ELSE excluded.gia_tri END,
       cap_nhat_luc=excluded.cap_nhat_luc`,
  ).bind(KHOA, ngay, n, new Date(now).toISOString(), ngay, ngay, n).run().catch(() => undefined)
}
