// ĐỆM CỜ `cau_hinh` TRONG ISOLATE (tối ưu máy chủ 28/09, việc 2).
// Vì sao: mỗi vòng đi-về D1 nối tiếp ≈ 300–400 ms; cờ Game Hóa 2.0 (`game_hoa_2`), Bi-a (`bi_a`) và cửa CNH-1.0 (`cnh_exp_kich_hoat`)
// bị đọc lại MỖI lượt (Sảnh, start, Đoàn, Bi-a, trám P08 mọi phản hồi có profile) — nhiều lần trong CÙNG một request.
// Luật:
//  - Hạn đệm DEM_CO_MS = 15 s (≤ 30 s thầy cho phép) ⇒ cờ thầy vừa đổi trễ tối đa 15 s ở isolate KHÁC; isolate nhận lệnh ghi xoá đệm ngay.
//  - Chỉ đệm giá trị đã hoàn tất. Các lượt chờ dùng timer RIÊNG, không await I/O của request khác.
//  - Lỗi đọc ⇒ `null` (giữ hành vi cũ `.catch(() => null)`) và KHÔNG đệm (lượt sau thử lại).
//  - Khoá theo đối tượng D1 gốc (WeakMap): D1 giả trong test / bản session `withSession` không lẫn nhau.
import type { Env } from './kieu'

export const DEM_CO_MS = 15_000

/** `withSession` tạo đối tượng D1 mới mỗi request ⇒ index.ts gắn khoá này trỏ về D1 gốc để đệm dùng chung. */
export const D1_GOC = Symbol.for('omr.d1Goc')

type O = { het: number; v: string | null; dangDoc: boolean }
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

/**
 * NHÓM CỜ đọc qua đệm này (tối ưu 05/10): một khoá trong nhóm lạnh ⇒ câu đọc của nó KÈM mọi khoá lạnh khác của nhóm (trước: mỗi cờ một lượt D1 riêng —
 * Sảnh/answer hỏi cờ Hoá 2.0, Bi-a, OMNI, cửa P08 ở các đợt khác nhau). Khoá KÈM chỉ được ghi vào đệm khi câu đọc về (cùng hạn DEM_CO_MS tính từ lúc
 * bắt đầu đọc, như khoá chính); trong lúc chờ, ai hỏi khoá kèm vẫn tự đọc như cũ (không phải chờ ai). Lỗi ⇒ không đệm gì. Khoá ngoài nhóm ⇒ y như cũ.
 */
const NHOM_CO: readonly string[] = ['game_hoa_2', 'bi_a', 'omni', 'omni_tham_so', 'cnh_exp_kich_hoat', 'the_luc_lop']
/** Khoá đang được đọc KÈM (theo D1 gốc) — không đọc kèm hai lần cùng lúc. */
const dangKemTheoDb = new WeakMap<object, Set<string>>()
/** Đời đệm (theo D1 gốc): tăng mỗi lần `xoaDemCauHinh` ⇒ câu đọc kèm bắt đầu TRƯỚC lần xoá không được ghi giá trị cũ vào đệm. */
const doiTheoDb = new WeakMap<object, number>()

/** Giá trị `cau_hinh.gia_tri` của `khoa` (chuỗi) hoặc `null` (vắng dòng / lỗi đọc). Đệm DEM_CO_MS trong isolate. */
export async function docCauHinhDem(env: Env, khoa: string, nowMs: number = Date.now()): Promise<string | null> {
  if (!env.DB) return null
  const m = bangDem(env.DB as unknown as object)
  let o = m.get(khoa)
  // Workerd gắn I/O với request: chỉ chờ bằng timer của chính lượt gọi này, tối đa 240 ms.
  for (let n = 0; o?.dangDoc && m.get(khoa) === o && n < 15; n++) await new Promise<void>(xong => setTimeout(xong, 16))
  o = m.get(khoa)
  if (o && !o.dangDoc && o.het > nowMs) return o.v
  const moi: O = { het: nowMs + DEM_CO_MS, v: null, dangDoc: true }
  m.set(khoa, moi)
  const goc = dbGoc(env.DB as unknown as object)
  let dangKem = dangKemTheoDb.get(goc)
  if (!dangKem) { dangKem = new Set(); dangKemTheoDb.set(goc, dangKem) }
  const kem = NHOM_CO.includes(khoa)
    ? NHOM_CO.filter((k) => { if (k === khoa || dangKem!.has(k)) return false; const x = m.get(k); return !x || (!x.dangDoc && x.het <= nowMs) })
    : []
  for (const k of kem) dangKem.add(k)
  const doi = doiTheoDb.get(goc) ?? 0
  try {
    let r: { gia_tri: string | null } | null = null
    let theo: Map<string, string | null> | null = null
    if (kem.length) {
      try {
        const ds = [khoa, ...kem]
        const t = await env.DB.prepare(`SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN (${ds.map(() => '?').join(', ')})`).bind(...ds).all<{ khoa: string; gia_tri: string | null }>()
        theo = new Map((t.results ?? []).map((x) => [String(x.khoa), x.gia_tri ?? null] as const))
        r = theo.has(khoa) ? { gia_tri: theo.get(khoa)! } : null
      } catch { theo = null /* câu nhóm lỗi (D1 giả chỉ có `first`, hay lỗi đọc) ⇒ đọc riêng khoá được hỏi như cũ; khoá kèm không đệm */ }
    }
    if (!theo) r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string | null }>()
    if (theo && (doiTheoDb.get(goc) ?? 0) === doi) {
      for (const k of kem) {
        const x = m.get(k)
        if (!x || (!x.dangDoc && x.het <= nowMs)) m.set(k, { het: nowMs + DEM_CO_MS, v: theo.get(k) ?? null, dangDoc: false })
      }
    }
    moi.v = r?.gia_tri ?? null
    return moi.v
  } catch {
    if (m.get(khoa) === moi) m.delete(khoa)
    return null
  } finally {
    moi.dangDoc = false
    for (const k of kem) dangKem.delete(k)
  }
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
  const goc = dbGoc(env.DB as unknown as object)
  doiTheoDb.set(goc, (doiTheoDb.get(goc) ?? 0) + 1)
  const m = bangDem(env.DB as unknown as object)
  if (khoa) m.delete(khoa)
  else m.clear()
}
