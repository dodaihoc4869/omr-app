// ĐỆM CỜ `cau_hinh` TRONG ISOLATE (tối ưu máy chủ 28/09, việc 2).
// Vì sao: mỗi vòng đi-về D1 nối tiếp ≈ 300–400 ms; cờ Game Hóa 2.0 (`game_hoa_2`), Bi-a (`bi_a`) và cửa CNH-1.0 (`cnh_exp_kich_hoat`)
// bị đọc lại MỖI lượt (Sảnh, start, Đoàn, Bi-a, trám P08 mọi phản hồi có profile) — nhiều lần trong CÙNG một request.
// Luật:
//  - Hạn đệm DEM_CO_MS = 15 s (≤ 30 s thầy cho phép) ⇒ cờ thầy vừa đổi trễ tối đa 15 s ở isolate KHÁC; isolate nhận lệnh ghi xoá đệm ngay.
//  - Lượt đọc đang bay được chia sẻ (nhiều nơi gọi trong cùng request ⇒ MỘT truy vấn).
//  - Lỗi đọc ⇒ `null` (giữ hành vi cũ `.catch(() => null)`) và KHÔNG đệm (lượt sau thử lại).
//  - Khoá theo đối tượng D1 gốc (WeakMap): D1 giả trong test / bản session `withSession` không lẫn nhau.
import type { Env } from './kieu'

export const DEM_CO_MS = 15_000

/** `withSession` tạo đối tượng D1 mới mỗi request ⇒ index.ts gắn khoá này trỏ về D1 gốc để đệm dùng chung. */
export const D1_GOC = Symbol.for('omr.d1Goc')

type O = { het: number; p: Promise<string | null> }
const demTheoDb = new WeakMap<object, Map<string, O>>()

/** D1 gốc của một đối tượng D1 (bản session ⇒ D1 gốc; còn lại ⇒ chính nó) — khoá cho mọi đệm theo isolate. */
export function dbGoc(db: object): object {
  return ((db as Record<symbol, unknown>)[D1_GOC] as object | undefined) ?? db
}

function bangDem(db: object): Map<string, O> {
  const goc = dbGoc(db)
  let m = demTheoDb.get(goc)
  if (!m) { m = new Map(); demTheoDb.set(goc, m) }
  return m
}

/** Giá trị `cau_hinh.gia_tri` của `khoa` (chuỗi) hoặc `null` (vắng dòng / lỗi đọc). Đệm DEM_CO_MS trong isolate. */
export function docCauHinhDem(env: Env, khoa: string, nowMs: number = Date.now()): Promise<string | null> {
  if (!env.DB) return Promise.resolve(null)
  const m = bangDem(env.DB as unknown as object)
  const o = m.get(khoa)
  if (o && o.het > nowMs) return o.p
  let loi = false
  const p = Promise.resolve()
    .then(() => env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string | null }>())
    .then((r) => (r?.gia_tri ?? null) as string | null, () => { loi = true; return null })
    .then((v) => { if (loi && m.get(khoa)?.p === p) m.delete(khoa); return v })
  m.set(khoa, { het: nowMs + DEM_CO_MS, p })
  return p
}

/** Gắn khoá D1_GOC lên bản session (để đệm cờ dùng chung với D1 gốc). Trả lại chính `phien`. */
export function gan<T>(phien: T, goc: unknown): T {
  // `withSession` trả CHÍNH nó (D1 giả/bộ đếm trong test) ⇒ không tự trỏ vào mình (mất đường về D1 gốc thật); trỏ thẳng về gốc cuối chuỗi.
  if ((phien as unknown) === goc || !goc || typeof goc !== 'object') return phien
  try { (phien as Record<symbol, unknown>)[D1_GOC] = dbGoc(goc) } catch { /* đối tượng đóng băng ⇒ chỉ mất đệm dùng chung */ }
  return phien
}

/** Bỏ đệm (một khoá, hoặc tất cả) — gọi ngay sau khi GHI `cau_hinh` để isolate này thấy giá trị mới tức thì. */
export function xoaDemCauHinh(env: Env, khoa?: string): void {
  if (!env.DB) return
  const m = bangDem(env.DB as unknown as object)
  if (khoa) m.delete(khoa)
  else m.clear()
}
