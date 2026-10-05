// OMNI 3 — LỚP D1: công tắc, bảng đệm, đọc sổ → hồ sơ OMNI (phát lại tất định), ma trận Q, β câu, chứng chỉ, vé, nhật ký, phần thêm cho Sảnh/PH.
// ⚠ STUB HỢP ĐỒNG (phiên điều phối 05/10): chữ ký + doc là hợp đồng; agent "OMNI D1 + API" thay thân bằng bản thật + test.
// Mọi bảng `omni_*` là ĐỆM dựng lại 100 % từ `su_kien_hoc` (+ `omni_xac_nhan` chỉ-thêm). Bản SQL: server/migration-0510-omni-3.sql.
import type { Env } from './kieu'
import { type CoOmni, type HoSoOmniEm, type PhOmni, type QCau, type SanhOmni, type Vkn } from './omni-kieu'
import { phatLaiEm } from './omni-p-vkn'

/** Công tắc `cau_hinh.omni` (đệm 15 s). Lỗi đọc ⇒ TẮT. */
export async function docCoOmni(env: Env): Promise<CoOmni> {
  void env
  return { bat: false, lop: [], sbd: [] }
}
/** OMNI áp cho em? = Hoá 2.0 áp cho em (`cheDo2`) ∧ cờ omni áp (theo lớp/SBD). `lop` vắng ⇒ tự tra lớp của em. Lỗi ⇒ false. */
export async function omniBat(env: Env, sbd: string, lop?: string | null): Promise<boolean> {
  void env; void sbd; void lop
  return false
}
/** Tạo mọi bảng omni_* (IF NOT EXISTS), một lần mỗi isolate. */
export async function damBaoBangOmni(env: Env): Promise<void> {
  void env
}
/** Ma trận Q của các câu (qid gốc). Câu chưa duyệt/chưa gợi ⇒ gợi từ nhãn kho (omni-q.ts `goiYQ`), không có nhãn ⇒ qMacDinh. Không bao giờ thiếu khoá. */
export async function qCuaCau(env: Env, qids: readonly string[]): Promise<Map<string, QCau>> {
  void env
  return new Map(qids.map((q) => [q, { qid: q, phan: 'I', maDang: null, mucDo: null, vkn: [`cau:${q}`], nguon: 'mac_dinh' } as QCau]))
}
/** Danh mục vi kỹ năng theo id (tên, tên lỗi, nhãn nền). Id `dang:<ma>` ⇒ Vkn tổng hợp tên = tên dạng. */
export async function vknTheoId(env: Env, ids: readonly string[]): Promise<Map<string, Vkn>> {
  void env
  return new Map(ids.map((id, i) => [id, { id, maDang: id.replace(/^dang:/, ''), ten: id, thuTu: i }]))
}
/** Hồ sơ OMNI của em tại `nowMs` (phát lại sổ — đệm 60 s trong isolate + snapshot `omni_em`/`omni_p_vkn`). Lỗi ⇒ hồ sơ rỗng (prior). */
export async function hoSoOmniEm(env: Env, sbd: string, nowMs: number): Promise<HoSoOmniEm> {
  void env
  return phatLaiEm(sbd, { suKien: [], q: new Map(), homNay: new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10) })
}
/** Hồ sơ OMNI của nhiều em một lượt (Bảng bài, đệm). */
export async function hoSoOmniNhieuEm(env: Env, dsSbd: readonly string[], nowMs: number): Promise<Map<string, HoSoOmniEm>> {
  const ra = new Map<string, HoSoOmniEm>()
  for (const s of dsSbd) ra.set(s, await hoSoOmniEm(env, s, nowMs))
  return ra
}
/** Thời gian kỳ vọng riêng (ms) của em cho câu: e^{β câu − τ em} (omni-toc-do.ts `msKyVong`). */
export async function kyVongMsCau(env: Env, sbd: string, q: { qid: string; phan: 'I' | 'II' | 'III'; mucDo: string | null }, nowMs: number): Promise<number> {
  void env; void sbd; void nowMs
  return q.phan === 'I' ? 90_000 : q.phan === 'II' ? 210_000 : 180_000
}
/** Số lượt lướt hôm nay của em (dòng purpose 'luot' ngày VN hôm nay). */
export async function soLuotHomNay(env: Env, sbd: string, nowMs: number): Promise<number> {
  void env; void sbd; void nowMs
  return 0
}
/** Phần OMNI thêm vào `hoa2-sanh` (null khi OMNI tắt cho em). `kh`, `hs` là kế hoạch + hồ sơ srs2 sanh2 đã đọc (khỏi đọc lại). */
export async function omniChoSanh(env: Env, sbd: string, nowMs: number, ngu: { tong: number; con: number; chienDichId: string | null }): Promise<SanhOmni | null> {
  void env; void sbd; void nowMs; void ngu
  return null
}
/** Phần OMNI thêm vào `/ph/hoc-2` (null khi tắt). */
export async function omniChoPh(env: Env, sbd: string, nowMs: number): Promise<PhOmni | null> {
  void env; void sbd; void nowMs
  return null
}
/** Việc đêm (cron 00:01 VN): β câu + snapshot hồ sơ các em đang bật OMNI, chia lô ≤ 40 em/lượt cron; idempotent theo ngày. */
export async function chayOmniDem(env: Env, nowMs: number): Promise<{ soEm: number; soBeta: number; xong: boolean }> {
  void env; void nowMs
  return { soEm: 0, soBeta: 0, xong: true }
}
/** Hiệu chỉnh tuần (đêm thứ Hai): S, T theo dạng trong ràng buộc; so dự báo với ca chốt (MAE, thiên lệch); ghi v2_hieu_chinh. */
export async function hieuChinhOmniTuan(env: Env, nowMs: number): Promise<Record<string, unknown>> {
  void env; void nowMs
  return { ok: true, boQua: 'stub' }
}
