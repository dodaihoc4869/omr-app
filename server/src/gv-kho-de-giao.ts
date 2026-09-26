// MÀN THẦY "GIAO ĐỀ THEO TUẦN" — MÁY CHỦ (bước 4, 26/09/2026).
// Đọc + ghi cấu hình `cau_hinh.kho_de_giao`; lệnh của thầy (đã qua cổng `laThay` ở index.ts).
import type { Env } from './kieu'
import { docKhoDeGiao } from '../../src/lib/kho-de-giao'
import { KHOA_KHO_DE_GIAO, xoaDemKhoDeGiao } from './kho-de-giao'

const chuoi = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')
const hang = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' ? (x as Record<string, unknown>) : {})

/** `{ action:'doc' }` → cấu hình + lớp/em/đề cho màn thầy. `{ action:'luu', ... }` → kiểm + ghi. */
export async function gvKhoDeGiao(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const action = chuoi(b.action) || 'doc'
  if (action === 'luu') return luu(env, b)
  if (action !== 'doc') return { ok: false, error: 'Hành động không hợp lệ (doc | luu)' }
  return doc(env)
}

async function doc(env: Env): Promise<Record<string, unknown>> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_KHO_DE_GIAO).first<{ gia_tri: string }>()
  const p = docKhoDeGiao(r?.gia_tri)
  const em = await env.DB.prepare("SELECT sbd, ho_ten, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' ORDER BY lop, sbd").all<Record<string, unknown>>()
  const de = await env.DB.prepare('SELECT ma_de, ten_de, lop, so_cau FROM de_kho WHERE COALESCE(da_xoa, 0) = 0 ORDER BY ma_de').all<Record<string, unknown>>()
  return {
    ok: true,
    cfg: p.ok ? p.cfg : null,
    loiCfg: p.ok ? null : p.error,
    em: (em.results ?? []).map((x) => ({ sbd: chuoi(x.sbd), hoTen: chuoi(x.ho_ten), lop: chuoi(x.lop), tenLop: chuoi(x.ten_lop) })),
    de: (de.results ?? []).map((x) => ({ maDe: chuoi(x.ma_de), ten: chuoi(x.ten_de), lop: chuoi(x.lop), soCau: Number(x.so_cau) || 0 })),
  }
}

async function luu(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const raw = hang(b.cfg ?? b)
  const p = docKhoDeGiao({ ...raw, ma: KHOA_KHO_DE_GIAO })
  if (!p.ok) return { ok: false, error: p.error }
  await env.DB.prepare(
    'INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc',
  ).bind(KHOA_KHO_DE_GIAO, JSON.stringify(p.cfg), new Date().toISOString()).run()
  xoaDemKhoDeGiao()
  return { ok: true, cfg: p.cfg }
}
