// CỜ TẮT CHUNG của các việc máy tự làm B7–B11 (docs/de-xuat-b7-b8-b9-b11-2109.md, Boss duyệt): MỘT khoá `cau_hinh.tu_dong_cac_viec` = {vinhDanh, mungMoc, keoLai, suKhoe}.
// Vắng / hỏng khoá ⇒ vinhDanh, mungMoc, suKhoe BẬT; keoLai TẮT (chạy khô 3 ngày, Boss bật sau khi đọc nhật ký). Chỉ giá trị `false` tắt các cờ mặc định BẬT; chỉ giá trị `true` bật cờ mặc định TẮT.
// `POST /gv/tu-dong-cac-viec {vinhDanh?, mungMoc?, keoLai?, suKhoe?}` (thầy): đọc; có trường nào (boolean) thì gộp vào cờ hiện tại và ghi lại. Thầy chỉ tắt/bật, không cấu hình khác.
import type { Env } from './kieu'

export const KHOA_TU_DONG = 'tu_dong_cac_viec'
export interface CoTuDong { vinhDanh: boolean; mungMoc: boolean; keoLai: boolean; suKhoe: boolean }
export const CO_TU_DONG_MAC_DINH: Readonly<CoTuDong> = { vinhDanh: true, mungMoc: true, keoLai: false, suKhoe: true }
export const TEN_CO: readonly (keyof CoTuDong)[] = ['vinhDanh', 'mungMoc', 'keoLai', 'suKhoe']

export function docCoTuDong(v: unknown): CoTuDong {
  let o: unknown = v
  if (typeof v === 'string') {
    try { o = JSON.parse(v) } catch { o = null }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { ...CO_TU_DONG_MAC_DINH }
  const c = o as Record<string, unknown>
  return { vinhDanh: c.vinhDanh !== false, mungMoc: c.mungMoc !== false, keoLai: c.keoLai === true, suKhoe: c.suKhoe !== false }
}

export async function docCoTuDongD1(env: Env): Promise<CoTuDong> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_TU_DONG).first<{ gia_tri: string }>()
    return docCoTuDong(r?.gia_tri)
  } catch {
    return { ...CO_TU_DONG_MAC_DINH }
  }
}

export async function gvTuDongCacViec(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const hienTai = await docCoTuDongD1(env)
  const doi = TEN_CO.filter((k) => b[k] !== undefined)
  if (doi.some((k) => typeof b[k] !== 'boolean')) return { ok: false, error: 'Mỗi cờ chỉ nhận true hoặc false.' }
  if (doi.length === 0) return { ok: true, co: hienTai }
  const moi: CoTuDong = { ...hienTai }
  for (const k of doi) moi[k] = b[k] as boolean
  await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_TU_DONG, JSON.stringify(moi), new Date(nowMs).toISOString()).run()
  return { ok: true, co: moi }
}
