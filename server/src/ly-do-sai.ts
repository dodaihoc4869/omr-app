// «VÌ SAO EM SAI?» phía máy chủ — khối B đợt 2 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911, «làm hết sạch đẩy luôn lên bản sống»).
// Máy em xếp hàng lý do (src/components/hoc-tap/vi-sao-sai.tsx) rồi gửi KÈM lệnh nộp câu kế: `ly: [[qid, 'tinh'|'cach'|'nham'], …]`.
// Ghi ở VIỆC PHỤ sau phản hồi (ctx.waitUntil của lệnh nộp, cùng chỗ ghi sổ) bằng MỘT câu lệnh cho mọi lý do của lượt ⇒ em bấm không chờ thêm;
// thân lệnh không có `ly` ⇒ 0 câu lệnh (đường nộp y như cũ). Đọc lại: gộp vào câu đọc mức ngày (goi-bai-7-loai-ngay.ts), không thêm lượt đọc.
import type { Env } from './kieu'
import { docThamSoEm } from './ca-nhan-hoa-v2'
import { THAM_SO_GOC, type ThamSoLuat } from './loi-hoc-luat'

export type LyDoSai = 'tinh' | 'cach' | 'nham'
export const laLyDoSai = (x: unknown): x is LyDoSai => x === 'tinh' || x === 'cach' || x === 'nham'
/** Câu song sinh / anh em phát thay («<gốc>~ss0») ⇒ câu GỐC: lý do và dấu «Chưa chắc» luôn ghi / đọc theo câu gốc (ngày Sửa xếp theo câu gốc). */
export const qidGocLy = (q: string): string => q.replace(/~.*$/, '')

/** Làm sạch `ly` của thân lệnh: tối đa 20 cặp [qid ≤ 120 ký tự, lý do hợp lệ]; trùng qid ⇒ giữ cặp sau. Sai kiểu ⇒ []. */
export function lySach(x: unknown): [string, LyDoSai][] {
  if (!Array.isArray(x)) return []
  const m = new Map<string, LyDoSai>()
  for (const c of x.slice(0, 20)) if (Array.isArray(c) && typeof c[0] === 'string' && c[0] && c[0].length <= 120 && laLyDoSai(c[1])) { const q = qidGocLy(c[0]); m.delete(q); m.set(q, c[1]) }
  return [...m]
}

/** Ghi lý do (lần cuối thắng) — MỘT câu lệnh cho cả lượt. Lỗi ⇒ ghi nhật ký, không ném (việc phụ sau phản hồi). */
export async function ghiLyDoSai(env: Env, sbd: string, ly: readonly [string, LyDoSai][], luc: string): Promise<void> {
  if (!ly.length || !sbd) return
  try {
    await env.DB.prepare(`INSERT INTO goi_bai_7_ly_do(sbd,qid,ly,luc) SELECT ?1,json_extract(value,'$[0]'),json_extract(value,'$[1]'),?2 FROM json_each(?3) WHERE true
      ON CONFLICT(sbd,qid) DO UPDATE SET ly=excluded.ly,luc=excluded.luc`).bind(sbd, luc, JSON.stringify(ly)).run()
  } catch (e) { console.error('[ly-do-sai] chưa ghi được:', e instanceof Error ? e.message : e) }
}

/** «CHƯA CHẮC» (khối B lát 5, bản vẽ dt-sang-5): câu SỬA em làm đúng nhưng chạm «Chưa chắc» ⇒ dấu `cc:<qid>` (giá trị 'cc') trong CÙNG bảng — ngày Sửa sau
 *  xếp lại câu ấy; làm đúng và chắc ⇒ xoá dấu. Một câu lệnh, chỉ cho câu sửa làm đúng, trong việc phụ sau phản hồi. Lỗi ⇒ ghi nhật ký, không ném. */
export async function ghiChuaChac(env: Env, sbd: string, qid: string, chuaChac: boolean, luc: string): Promise<void> {
  if (!sbd || !qid || qid.length > 120) return
  const k = `cc:${qidGocLy(qid)}`
  try {
    await (chuaChac
      ? env.DB.prepare(`INSERT INTO goi_bai_7_ly_do(sbd,qid,ly,luc) VALUES(?1,?2,'cc',?3) ON CONFLICT(sbd,qid) DO UPDATE SET luc=excluded.luc`).bind(sbd, k, luc)
      : env.DB.prepare('DELETE FROM goi_bai_7_ly_do WHERE sbd=? AND qid=?').bind(sbd, k)).run()
  } catch (e) { console.error('[chua-chac] chưa ghi được:', e instanceof Error ? e.message : e) }
}

/** Đọc cột `ly` (json_group_array của [qid, lý do], cũ → mới) từ câu đọc mức ngày ⇒ Map câu GỐC → lý do (dòng mới hơn thắng; dòng cũ ghi theo mã song sinh
 *  «X~ss0» quy về «X»); dấu «Chưa chắc» giữ dưới khoá `cc:<câu gốc>` (giá trị 'cc'). */
export function docCotLyDo(v: unknown): Map<string, LyDoSai | 'cc'> {
  const m = new Map<string, LyDoSai | 'cc'>()
  if (typeof v !== 'string' || !v) return m
  try { const a: unknown = JSON.parse(v); if (Array.isArray(a)) for (const c of a) if (Array.isArray(c) && typeof c[0] === 'string' && (laLyDoSai(c[1]) || (c[1] === 'cc' && c[0].startsWith('cc:')))) m.set(qidGocLy(c[0]), c[1]) } catch { /* bỏ */ }
  return m
}

/** MÁY NÂNG LOẠI LỖI (đề xuất v5 mục 3: «chống chọn Tính sai cho ít việc — sai lại lần nữa ⇒ nâng thành Chưa biết cách»): câu đã sai tự làm từ 2 lần mà lý do
 *  là «Tính / đọc đề sai» ⇒ coi là «Chưa biết cách». Dùng chung cho nhóm lỗi ngày Sửa và luật đóng lỗi (srs2-d1, chua-cau-sai-adapter). */
export const lyDoHieuLuc = (ly: LyDoSai | 'cc' | undefined, soLanSai: number): LyDoSai | undefined =>
  ly === 'cc' || !ly ? undefined : ly === 'tinh' && soLanSai >= 2 ? 'cach' : ly

/** THAM SỐ LUẬT RIÊNG của em (v2_tham_so_em — như `docThamSoEm`) + LÝ DO SAI (câu GỐC → lý do) trong MỘT câu D1 — thay câu đọc tham số riêng ở hồ sơ học
 *  (srs2-d1) và Tự sửa lỗi (chua-cau-sai-adapter) ⇒ thêm luật theo loại lỗi mà KHÔNG thêm lệnh D1 (test số lệnh Sảnh). Câu gộp lỗi (bảng thiếu) ⇒ đọc
 *  tham số như cũ, lý do rỗng. */
// Câu gộp / bảng lý do hỏng (bảng chưa tạo trên D1 này) ⇒ nhớ 10 phút trong isolate: lượt sau đọc riêng / bỏ đọc — không lặp câu hỏng (giữ số lệnh Sảnh);
// lỗi thoáng qua thì hết 10 phút thử lại.
const NGHI_MS = 10 * 60_000
let gopHongDen = 0, lyHongDen = 0
export async function docThamSoEmVaLyDo(env: Env, sbd: string): Promise<{ em: ThamSoLuat | null; ly: Map<string, LyDoSai> }> {
  const ly = new Map<string, LyDoSai>()
  if (Date.now() < gopHongDen) { const [em, l] = await Promise.all([docThamSoEm(env, sbd).catch(() => null), docLyDoLoi(env, sbd)]); return { em, ly: l } }
  try {
    const r = await env.DB.prepare(`SELECT t.tham_so_json,(SELECT json_group_array(json_array(qid,ly)) FROM goi_bai_7_ly_do WHERE sbd=?1 AND ly IN ('tinh','cach','nham')) ly
      FROM (SELECT 1) x LEFT JOIN v2_tham_so_em t ON t.sbd=?1`).bind(sbd).first<Record<string, unknown>>()
    for (const [q, l] of docCotLyDo(r?.ly)) if (l !== 'cc') ly.set(q, l)
    let em: ThamSoLuat | null = null
    try {
      const o = typeof r?.tham_so_json === 'string' ? (JSON.parse(r.tham_so_json) as ThamSoLuat) : null
      em = o && Number.isInteger(o.cachSaiCuoi) && Array.isArray(o.mocDuyTri) && o.mocDuyTri.length ? { ...THAM_SO_GOC, ...o } : null
    } catch { /* tham số hỏng ⇒ dùng chung */ }
    return { em, ly }
  } catch {
    gopHongDen = Date.now() + NGHI_MS
    const [em, l] = await Promise.all([docThamSoEm(env, sbd).catch(() => null), docLyDoLoi(env, sbd)])
    return { em, ly: l }
  }
}

/** Lý do sai của một em (câu GỐC → lý do) cho luật đóng lỗi — đọc SONG SONG trong đợt đọc sẵn có của nơi gọi (không thêm đợt chờ). Bảng chưa có / lỗi ⇒ rỗng. */
export async function docLyDoLoi(env: Env, sbd: string): Promise<Map<string, LyDoSai>> {
  const m = new Map<string, LyDoSai>()
  if (Date.now() < lyHongDen) return m
  try {
    const r = await env.DB.prepare("SELECT qid,ly FROM goi_bai_7_ly_do WHERE sbd=? AND ly IN ('tinh','cach','nham')").bind(sbd).all<{ qid: string; ly: string }>()
    for (const x of r.results ?? []) if (laLyDoSai(x.ly)) m.set(qidGocLy(String(x.qid)), x.ly)
  } catch { lyHongDen = Date.now() + NGHI_MS /* bảng chưa có trên D1 này */ }
  return m
}
