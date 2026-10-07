// Cờ pilot: đóng khi cấu hình hỏng, chỉ mở cho danh sách do thầy quản lý.
import type { Env } from './kieu'
import {
  CAU_HINH_MAC_DINH,
  KHOA_CHUA_CAU_SAI,
  type CauHinhChuaCauSai,
} from './chua-cau-sai-kieu'
const cache = new WeakMap<Env['DB'], { den: number; cfg: CauHinhChuaCauSai }>()
const ds = (v: unknown): string[] =>
  Array.isArray(v)
    ? [
        ...new Set(
          v
            .filter((x): x is string => typeof x === 'string' && !!x.trim())
            .map((x) => x.trim()),
        ),
      ].slice(0, 500)
    : []
const so = (v: unknown, mac: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.max(min, Math.min(max, Math.floor(v)))
    : mac
export function chuanCauHinh(v: unknown): CauHinhChuaCauSai {
  const o = v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
  const lop = ds(o.lop),
    sbd = ds(o.sbd)
  return {
    ...CAU_HINH_MAC_DINH,
    lop,
    sbd,
    phamVi: o.phamVi === 'tat_ca' ? 'tat_ca' : 'pilot',
    bat:
      o.bat === true &&
      (o.phamVi === 'tat_ca' || lop.length > 0 || sbd.length > 0),
    dongBoTuLuyen: o.dongBoTuLuyen !== false,
    cohortId:
      typeof o.cohortId === 'string' && /^[\w-]{1,80}$/.test(o.cohortId)
        ? o.cohortId
        : CAU_HINH_MAC_DINH.cohortId,
    kiemLaiSauGio: so(o.kiemLaiSauGio, 24, 24, 168),
    chanDoanToiDa: so(o.chanDoanToiDa, 4, 2, 8),
    vongHoTroToiDaMoiBuoc: so(o.vongHoTroToiDaMoiBuoc, 2, 1, 3),
    phutToiDaMotLuot: so(o.phutToiDaMotLuot, 10, 5, 20),
    cuaSoDoNgay: so(o.cuaSoDoNgay, 7, 7, 30),
  }
}
export async function docCauHinh(env: Env): Promise<CauHinhChuaCauSai> {
  const now = Date.now(),
    hit = cache.get(env.DB)
  if (hit && hit.den > now) return hit.cfg
  let cfg = chuanCauHinh(null)
  try {
    const row = await env.DB.prepare(
      'SELECT gia_tri FROM cau_hinh WHERE khoa = ?',
    )
      .bind(KHOA_CHUA_CAU_SAI)
      .first<{ gia_tri: string }>()
    if (row?.gia_tri) cfg = chuanCauHinh(JSON.parse(row.gia_tri))
  } catch {
    /* Không có cấu hình hợp lệ thì đóng pilot. */
  }
  cache.set(env.DB, { den: now + 15_000, cfg })
  return cfg
}
export function xoaDemChua(env: Env): void {
  cache.delete(env.DB)
}
export async function tinhNangBat(
  env: Env,
  opts: { sbd?: string; lop?: string } = {},
): Promise<boolean> {
  const cfg = await docCauHinh(env)
  if (!cfg.bat || !opts.sbd) return false
  if (cfg.phamVi === 'tat_ca') return true
  if (cfg.sbd.includes(opts.sbd)) return true
  const em = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?')
    .bind(opts.sbd)
    .first<{ lop: string }>()
  return !!em && cfg.lop.includes(em.lop)
}
