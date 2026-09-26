// KHO ĐỀ GIAO THEO TUẦN — MÁY CHỦ (bước 2, 26/09/2026).
//
// Đọc cấu hình `cau_hinh.kho_de_giao` (thầy dựng ở màn "Giao đề theo tuần") rồi trả GIAO của MỘT EM:
// em nằm trong danh sách được tick + đang trong hạn. Khi em CÓ giao đang hiệu lực, kênh rút câu tự động
// chỉ được đưa câu THUỘC kho đề đã tick (và câu chấm tự động được) — nhờ `locTheoKhoDeGiao` cắm trong `readScope`.
//
// VẮNG / TẮT / HỎNG cấu hình ⇒ KHÔNG ràng buộc (giữ nguyên hành vi cũ; mọi test cũ không đổi).
import type { Env } from './kieu'
import { dangTrongHan, docKhoDeGiao, type KhoDeGiao } from '../../src/lib/kho-de-giao'

/** Khoá `cau_hinh` giữ cấu hình giao kho đề theo tuần. */
export const KHOA_KHO_DE_GIAO = 'kho_de_giao'
/** Đệm cấu hình (mức mô-đun) — `readScope` rất nóng nên không hỏi D1 mỗi lượt. */
const TTL_DEM_MS = 30_000
let dem: { luc: number; cfg: KhoDeGiao | null } | null = null
/** Xoá đệm cấu hình — gọi sau khi thầy ghi `cau_hinh.kho_de_giao` (và trong test). */
export function xoaDemKhoDeGiao(): void {
  dem = null
}

/** Đọc cấu hình `kho_de_giao` (đệm 30 giây). Vắng / JSON sai / lỗi D1 ⇒ null. `boQuaDem` để test đọc tươi. */
export async function docCauHinhKhoDeGiao(env: Env, now: number, boQuaDem = false): Promise<KhoDeGiao | null> {
  if (!boQuaDem && dem && now - dem.luc < TTL_DEM_MS) return dem.cfg
  let cfg: KhoDeGiao | null = null
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_KHO_DE_GIAO).first<{ gia_tri: string }>()
    if (r && r.gia_tri !== null && r.gia_tri !== undefined) {
      const p = docKhoDeGiao(r.gia_tri)
      cfg = p.ok ? p.cfg : null
    }
  } catch {
    cfg = null
  }
  dem = { luc: now, cfg }
  return cfg
}

/** GIAO đang hiệu lực của MỘT EM. */
export interface GiaoCuaEm {
  cfg: KhoDeGiao
  /** Tập mã tờ đề (`de_kho.ma_de`) em được làm. */
  maDe: ReadonlySet<string>
}
/** Cấu hình BẬT + em trong danh sách tick + CÒN TRONG HẠN. Không có ⇒ null (không ràng buộc). */
export async function docKhoDeGiaoCuaEm(env: Env, sbd: string, now: number): Promise<GiaoCuaEm | null> {
  const cfg = await docCauHinhKhoDeGiao(env, now)
  if (!cfg || !cfg.bat || !cfg.sbd.includes(sbd) || !dangTrongHan({ now, deadline: cfg.deadline })) return null
  return { cfg, maDe: new Set(cfg.maDe) }
}

/** Mã tờ đề của một câu pool (đọc chịu `maDe` / `ma_de` / `de`). */
const maDeCua = (q: unknown): string => {
  if (q === null || typeof q !== 'object') return ''
  const o = q as Record<string, unknown>
  for (const k of ['maDe', 'ma_de', 'de']) {
    const v = o[k]
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
  }
  return ''
}

/**
 * Lọc pool theo GIAO: giữ câu THUỘC đề đã tick VÀ KHÔNG tự luận (theo `laTuLuan`).
 * `giao` null ⇒ GIỮ NGUYÊN (không đổi hành vi cũ). Thuần — tách khỏi `readScope` để test được.
 */
export function locTheoKhoDeGiao<T>(pool: readonly T[], giao: GiaoCuaEm | null, laTuLuan: (q: T) => boolean): T[] {
  if (!giao) return [...pool]
  return pool.filter((q) => {
    const md = maDeCua(q)
    return md !== '' && giao.maDe.has(md) && !laTuLuan(q)
  })
}
