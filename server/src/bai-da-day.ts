// OMNI 3 — TICK BÀI ĐÃ DẠY (phạm vi đã dạy của lớp) → TỰ TẠO CHIẾN DỊCH THEO BÀI. Lệnh thầy `POST /gv/bai-da-day` (sau cổng `laThay`).
// ⚠ STUB HỢP ĐỒNG (phiên điều phối 05/10): chữ ký + doc là hợp đồng; agent "Tick bài + thư mục" thay thân bằng bản thật + test.
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 1 bước 1, 2, 3 (bai_da_day, pham_vi_lop); prompt-tick-bai-tu-giao.md mục A–B.
// Bảng CHỈ-THÊM, tạo lúc chạy (CI không chạy migration; bản SQL ở server/migration-0510-omni-3.sql):
//   bai_da_day  (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc, nguoi, chien_dich_id, bo_tick_luc)
//   pham_vi_lop (lop, khoa_bai, ten_bai, vi_tri, ma_de_json, nguon 'tick'|'truoc', cap_nhat_luc) PK (lop, khoa_bai)
import type { Env } from './kieu'

type Row = Record<string, unknown>

/** Phạm vi đã dạy của một lớp: mọi tờ (mã gốc, không hậu tố -TN/-DS/-TLN) thuộc bài đã tick ∪ bài đứng trước bài tick xa nhất. */
export interface PhamViLop {
  lop: string
  /** Mã tờ GỐC trong phạm vi. */
  maDe: Set<string>
  /** Mã tờ gốc → bài (khoá, tên, vị trí trong cây SGK). */
  baiTheoMaDe: Map<string, { khoaBai: string; tenBai: string; viTri: number }>
  /** Bài đã tick (đang luyện hoặc đã luyện) theo vị trí tăng dần, kèm chiến dịch tạo ra. */
  baiDaTick: { khoaBai: string; tenBai: string; viTri: number; chienDichId: string | null; tickLuc: string }[]
}

/**
 * `POST /gv/bai-da-day` — action:
 *   danh-sach {lop}                                  ⇒ { ok, bai: [{khoaBai, tenBai, viTri, tickLuc, chienDichId, trangThai:'dang_luyen'|'da_day', hanNop, conNgay, chungChi:{dat,tong}}], choBaiMoi: {soNgay}|null }
 *   xem-truoc {lop, khoaBai, tenBai, viTri, maDe[], theLucNgay?, hanNop?} ⇒ { ok, soCau, soTuLuan, hanNop, D, luotCan, sucChua, duLuot, tongEm, duDiem8, quaTai:[{sbd,ten}], theLucNgay }
 *   tick {lop, khoaBai, tenBai, viTri, maDe[], phamVi:[{khoaBai,tenBai,viTri,maDe[]}], hanNop?, theLucNgay?, nguoi?} ⇒ { ok, chienDichId, hanNop, daCo }
 *   bo-tick {lop, khoaBai}                          ⇒ { ok, chienDich: 'da_huy'|'da_dong'|null }
 */
export async function gvBaiDaDay(env: Env, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  void env; void b; void nowMs
  return { ok: false, error: 'Chức năng đang dựng.' }
}

/** Phạm vi đã dạy của LỚP (null ⇒ lớp chưa tick bài nào ⇒ OMNI không lọc theo phạm vi — giữ hành vi cũ). Đệm ngắn trong isolate. */
export async function phamViLop(env: Env, lop: string): Promise<PhamViLop | null> {
  void env; void lop
  return null
}
/** Phạm vi đã dạy của EM (theo lớp của em: lớp trong danh sách học sinh / chiến dịch gần nhất của em). null ⇒ không lọc. */
export async function phamViCuaEm(env: Env, sbd: string): Promise<PhamViLop | null> {
  void env; void sbd
  return null
}
/** Lớp của em (chuỗi tên lớp như chien_dich.lop / danh sách học sinh), null nếu không rõ. */
export async function lopCuaEm(env: Env, sbd: string): Promise<string | null> {
  void env; void sbd
  return null
}
