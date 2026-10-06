// OMNI 3 — ÔN BÀI CŨ: phần ĐỌC cấu hình (xem `omni-on-bai-cu.ts` cho phần thuần). CHỈ import `cau-hinh-dem` (không kéo `srs2-*`/`bai-da-day` ⇒ không vòng import).
// Hai khoá `on_bai_cu_deu` / `on_bai_cu_ti_le` nằm trong NHÓM CỜ của `cau-hinh-dem.ts` ⇒ đọc KÈM câu đọc nhóm đầu tiên của request (cờ Hoá 2.0 / OMNI) — KHÔNG thêm vòng D1.
import type { Env } from './kieu'
import { docCauHinhDem } from './cau-hinh-dem'
import { docCauHinhTiLe, docOnBaiCuDeu, KHOA_ON_BAI_CU_DEU, KHOA_ON_BAI_CU_TI_LE, tiLeHieuLuc, tiLeRiengCuaLop, type TiLeMotPhan, type TiLeOnBaiCu } from './omni-on-bai-cu'

/** Công tắc chia ôn bài cũ đều (đệm 15 s trong isolate như mọi cờ): vắng dòng / lỗi đọc / JSON hỏng ⇒ BẬT; chỉ `{"bat":false}` ⇒ TẮT (y hệt cũ). */
export async function onBaiCuDeuBat(env: Env): Promise<boolean> {
  return docOnBaiCuDeu(await docCauHinhDem(env, KHOA_ON_BAI_CU_DEU).catch(() => null))
}

/** Tỉ lệ ôn bài cũ THẦY ĐÃ ĐẶT cho `lop` (đệm 15 s): vắng cấu hình / không có trường hợp lệ ⇒ null ⇒ nơi gọi dùng đúng hằng cũ (20 % / 40 %). Không bao giờ ném lỗi. */
export async function docTiLeRiengCuaLop(env: Env, lop: string | null | undefined): Promise<TiLeMotPhan | null> {
  return tiLeRiengCuaLop(docCauHinhTiLe(await docCauHinhDem(env, KHOA_ON_BAI_CU_TI_LE).catch(() => null)), lop)
}

/** Tỉ lệ ĐẦY ĐỦ đang áp cho `lop` (trường thiếu ⇒ hằng cũ). */
export async function docTiLeHieuLucCuaLop(env: Env, lop: string | null | undefined): Promise<TiLeOnBaiCu> {
  return tiLeHieuLuc(await docTiLeRiengCuaLop(env, lop))
}
