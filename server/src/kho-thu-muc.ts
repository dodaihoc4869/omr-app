// OMNI 3 — HAI THƯ MỤC MỤC ĐÍCH CỦA KHO: DẠY HỌC (tick bài, game) · TU LUYỆN (mọi tờ còn lại: chỉ Tu luyện + ca kiểm tra).
// ⚠ STUB HỢP ĐỒNG: agent "Tick bài + thư mục" thay thân bằng bản thật + test. Đặc tả mục 2.
// Bảng CHỈ-THÊM `de_kho_thu_muc (ma_de PK, thu_muc 'DAY_HOC'|'TU_LUYEN', cap_nhat_luc)` — app thầy đồng bộ (≤ 1 lần/ngày, ≤ 400 mã/lệnh).
// Thiếu dòng ⇒ TU_LUYEN, TRỪ mã bắt đầu bằng "DH-" ⇒ DAY_HOC.
import type { Env } from './kieu'

export type ThuMuc = 'DAY_HOC' | 'TU_LUYEN'
/** Luật lùi khi chưa đồng bộ: mã "DH-…" là DẠY HỌC, còn lại TU LUYỆN. Thuần. */
export const thuMucTheoMa = (maDe: string): ThuMuc => (maDe.trim().toUpperCase().startsWith('DH-') ? 'DAY_HOC' : 'TU_LUYEN')

/** `POST /kho/thu-muc {ds:[{maDe, thuMuc}]}` (sau cổng thầy) ⇒ { ok, daGhi }. */
export async function gvKhoThuMuc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  void env; void b
  return { ok: false, error: 'Chức năng đang dựng.' }
}
/** Thư mục của các mã tờ (mã gốc hoặc mã tách phần đều được). Lỗi đọc ⇒ luật lùi `thuMucTheoMa`. */
export async function thuMucCuaMaDe(env: Env, maDe: readonly string[]): Promise<Map<string, ThuMuc>> {
  void env
  return new Map(maDe.map((m) => [m, thuMucTheoMa(m)]))
}
