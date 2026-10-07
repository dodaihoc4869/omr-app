// ĐỌC CẤU HÌNH CỜ — vòng chữa câu sai (07/10/2026).
// Cờ lưu trong D1 bảng `cau_hinh` (khoa = 'chua_cau_sai_v1').
// Cache nội phiên bằng Map; TTL = 60 giây.
import type { Env } from './kieu'
import {
  CAU_HINH_MAC_DINH, KHOA_CHUA_CAU_SAI,
  type CauHinhChuaCauSai,
} from './chua-cau-sai-kieu'

const cache = new Map<string, { exp: number; cfg: CauHinhChuaCauSai }>()
const TTL_MS = 60_000

async function docCauHinh(env: Env): Promise<CauHinhChuaCauSai> {
  const now = Date.now()
  const hit = cache.get('v1')
  if (hit && hit.exp > now) return hit.cfg

  let cfg: CauHinhChuaCauSai = CAU_HINH_MAC_DINH
  try {
    const row = await env.DB
      .prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?')
      .bind(KHOA_CHUA_CAU_SAI)
      .first<{ gia_tri: string }>()
    if (row?.gia_tri) {
      const parsed = JSON.parse(row.gia_tri) as Partial<CauHinhChuaCauSai>
      cfg = { ...CAU_HINH_MAC_DINH, ...parsed }
    }
  } catch { /* bảng chưa tạo hoặc chưa có dòng → dùng mặc định */ }

  cache.set('v1', { exp: now + TTL_MS, cfg })
  return cfg
}

/** Trả `true` nếu cờ bật VÀ học sinh `sbd` thuộc lớp/danh sách pilot. */
export async function tinhNangBat(
  env: Env,
  opts: { sbd?: string; lop?: string } = {},
): Promise<boolean> {
  const cfg = await docCauHinh(env)
  if (!cfg.bat) return false
  if (cfg.tatCa) return true
  // Không có phạm vi → đóng (không mở toàn trường khi thiếu allowlist)
  if (cfg.lop.length === 0 && cfg.sbd.length === 0) return false
  if (opts.sbd && cfg.sbd.includes(opts.sbd)) return true
  if (opts.lop && cfg.lop.includes(opts.lop)) return true
  return false
}

/** Lấy toàn bộ cấu hình (đã merge mặc định). */
export { docCauHinh }
