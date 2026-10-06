// ƯU TIÊN BƯỚC EM TỰ KHAI (06/10, lệnh thầy "Làm chuẩn đoán bước sai") — MỘT luật dùng chung cho:
//   · Trạm hồi phục (omni-game.ts `taoTram`): chọn "tên lỗi" của 3 câu sai liền ⇒ nhãn câu nền;
//   · Chẩn đoán bước sai trước khi làm lại (chan-doan-buoc-sai.ts): chọn bước cần kiểm của câu sai.
// NGUỒN: bảng chỉ-thêm `omni_buoc_sai(sbd, qid, ngay, ma_vkn, luc)` (omni-can-than.ts): mỗi dòng = em TỰ KHAI "sai vì bước nào" (thẻ Cẩn thận (c))
// HOẶC em làm SAI câu chẩn đoán của bước ấy (chan-doan-buoc-sai.ts ghi tương đương một dòng).
// LUẬT CHỌN (tự chọn — ghi rõ):
//   1. CỬA SỔ 14 ngày VN gần nhất, tính cả hôm nay (`CUA_SO_BUOC_SAI_NGAY`): bước khai lâu hơn coi như đã cũ (em đã học thêm, P đã đổi).
//   2. Bỏ dòng "Em chưa rõ" (`chua_ro`) và mã rỗng.
//   3. CHỈ xét bước nằm trong tập ỨNG VIÊN của nơi gọi (vi kỹ năng của 3 câu sai / của câu đang làm lại) — khai cho câu khác dạng không kéo nhầm.
//   4. Xếp: NHIỀU dòng nhất trong cửa sổ → dòng GẦN nhất (luc lớn) → P thấp hơn → mã (tất định).
//   Không dòng nào khớp ⇒ null: nơi gọi giữ ĐÚNG luật cũ (vi kỹ năng P thấp nhất).
// Đọc D1: MỘT truy vấn theo khoá chính (sbd, …) — chỉ ở đường hiếm (Trạm mở / chuyến có câu cần chẩn đoán); bảng chưa có / lỗi ⇒ [] (không làm hỏng gì).
import type { Env } from './kieu'
import { MA_EM_CHUA_RO } from './omni-can-than'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Cửa sổ xét bước em tự khai (ngày VN, tính cả hôm nay). */
export const CUA_SO_BUOC_SAI_NGAY = 14
/** Trần số dòng đọc mỗi lần (một em hiếm khi quá vài chục dòng/14 ngày; trần chặn bảng bị dồn). */
const TRAN_DONG_DOC = 400

/** Một dòng `omni_buoc_sai` đã đọc. */
export interface DongBuocSai { qid: string; ngay: string; maVkn: string; luc: string }

/** Ngày VN (YYYY-MM-DD) của mốc ms. */
const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
/** Ngày VN đầu cửa sổ (tính cả hôm nay ⇒ lùi CUA_SO − 1 ngày). */
export const dauCuaSoBuocSai = (nowMs: number): string => ngayVn(nowMs - (CUA_SO_BUOC_SAI_NGAY - 1) * 86_400_000)

/** Dòng bước sai của em trong cửa sổ (mới trước). Bảng chưa có / lỗi đọc ⇒ []. */
export async function docBuocSaiGanDay(env: Env, sbd: string, nowMs: number): Promise<DongBuocSai[]> {
  if (!sbd) return []
  try {
    const r = await env.DB.prepare('SELECT qid, ngay, ma_vkn, luc FROM omni_buoc_sai WHERE sbd = ? AND ngay >= ? ORDER BY luc DESC LIMIT ?')
      .bind(sbd, dauCuaSoBuocSai(nowMs), TRAN_DONG_DOC).all<Row>()
    return (r.results ?? []).map((x) => ({ qid: str(x.qid), ngay: str(x.ngay), maVkn: str(x.ma_vkn), luc: str(x.luc) }))
  } catch {
    return []
  }
}

/**
 * Bước em tự khai nên ƯU TIÊN trong `ungVien` (thuần, tất định — luật ở đầu tệp). `pCua` = P hiện tại của vi kỹ năng (hoà số dòng + mốc ⇒ P thấp hơn).
 * Nơi gọi đã lọc cửa sổ khi đọc; hàm vẫn tự bỏ `chua_ro` / mã rỗng / mã ngoài ứng viên.
 */
export function chonBuocTuKhai(dong: readonly Pick<DongBuocSai, 'maVkn' | 'luc'>[], ungVien: Iterable<string>, pCua: (k: string) => number): string | null {
  const tap = new Set([...ungVien].filter(Boolean))
  if (!tap.size || !dong.length) return null
  const dem = new Map<string, { n: number; cuoi: string }>()
  for (const x of dong) {
    const k = str(x.maVkn).trim()
    if (!k || k === MA_EM_CHUA_RO || !tap.has(k)) continue
    const d = dem.get(k) ?? { n: 0, cuoi: '' }
    d.n++
    if (str(x.luc) > d.cuoi) d.cuoi = str(x.luc)
    dem.set(k, d)
  }
  if (!dem.size) return null
  return [...dem.entries()].sort(([a, x], [b, y]) => y.n - x.n || (y.cuoi > x.cuoi ? 1 : y.cuoi < x.cuoi ? -1 : 0) || pCua(a) - pCua(b) || (a < b ? -1 : a > b ? 1 : 0))[0]![0]
}
