// SỨC KHOẺ MÁY CHỦ cho app thầy — hợp đồng docs/hop-dong-suc-khoe-may-chu-2109.md (Code 3 ↔ Code 4), kế hoạch giờ cao điểm 21/09. `POST /gv/suc-khoe-may-chu` (mã bí mật thầy, không chạm D1, không đệm): thân `{ ok:true, muc:'tot'|'ban'|'nghen', heSo, p50Ms, p95Ms, … }`.
// Chip "Máy chủ: tốt / đang bận / nghẽn" = `muc`. Số đo là của isolate đang trả lời (hai lượt liền có thể lệch) ⇒ lấy MAX của vài lượt gần nhất; gọi ≤ 1 lần / 10 giây. ĐỌC CÓ CHỐNG SAI KIỂU: `muc` lạ ⇒ không có chip (không bịa "tốt").
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

export type MucMay = 'tot' | 'ban' | 'nghen'
const THU_TU: readonly MucMay[] = ['tot', 'ban', 'nghen']

/** Nhịp hỏi chip (hợp đồng: ≤ 1 lần / 10 giây). */
export const NHIP_SUC_KHOE_MS = 10_000
/** Số lượt gần nhất lấy MAX (chip chỉ về "tốt" khi cả ba lượt liền đều tốt). */
export const SO_MAU_CHIP = 3
/** Máy chủ nói KHÔNG (chưa có lệnh / từ chối / sai dạng) ⇒ 5 phút sau mới hỏi lại, chip ẩn. */
export const THU_LAI_CHIP_SAU_KHI_TU_CHOI_MS = 5 * 60_000

/** Chữ chip (chuẩn từ ngữ: một khái niệm một từ — "Máy chủ"). */
export const CHU_MUC_MAY: Record<MucMay, string> = { tot: 'Máy chủ: tốt', ban: 'Máy chủ: đang bận', nghen: 'Máy chủ: nghẽn' }

/** Đọc mức từ thân lệnh; thiếu / lạ ⇒ null. */
export function docMucMay(du: unknown): MucMay | null {
  if (!du || typeof du !== 'object' || Array.isArray(du)) return null
  const muc = (du as Record<string, unknown>).muc
  return muc === 'tot' || muc === 'ban' || muc === 'nghen' ? muc : null
}

/** MAX của các mức (nghẽn > bận > tốt); rỗng ⇒ null. */
export function mucCaoNhat(ds: readonly MucMay[]): MucMay | null {
  let cao: MucMay | null = null
  for (const m of ds) if (cao === null || THU_TU.indexOf(m) > THU_TU.indexOf(cao)) cao = m
  return cao
}

/** Hỏi máy chủ MỘT lần. `ok:false` + loai 'chua_co_lenh' / 'tu_choi' / 'khong_doc_duoc' = máy chủ nói KHÔNG; 'mang' / 'cham' = hụt nhất thời. */
export async function laySucKhoeMay(): Promise<KetQuaLenh<MucMay>> {
  const r = await goiLenh('/gv/suc-khoe-may-chu', {}, 'Máy chủ chưa có lệnh sức khoẻ.')
  if (!r.ok) return r
  const muc = docMucMay(r.du)
  if (!muc) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả sức khoẻ không đúng dạng.' }
  return { ok: true, du: muc }
}
