// NHÃN «ĐÃ LÀM ĐÚNG / ĐÃ LÀM SAI» (thầy 03/11: «các màn rút kiểm tra của hs khi nhận câu có nhãn đã làm đúng đã làm sai … đếm rõ mấy lần … sau ca xem rõ 4 kết quả
// đúng sai lại … hiện cả trên app gv, xếp học sinh sai nhiều nhất lên trước»; bản vẽ docs/ban-ve-nhan-da-lam-0311.jpg).
// Nguồn: sổ su_kien_hoc (mỗi dòng = một lần em làm một câu, mọi nguồn: chặng · ôn lại · kiểm tra · ca thi · game…). CHỈ ĐỌC, một truy vấn, NGOÀI mọi lệnh nóng
// (máy khách gọi SAU khi câu đã hiện — nhãn chỉ là phụ, không bao giờ chặn việc hiện câu).
// Luật đếm:
//  · chỉ dòng có ket_qua 0/1 (bỏ trống / chưa làm không tính); bỏ dòng «đọc lời giải» (assistance ≠ none hoặc có purpose) — không phải một lần làm;
//  · chỉ dòng đã CÔNG BỐ (visibility released) — ca thi chưa công bố điểm không lộ qua nhãn của bài sau;
//  · LOẠI lần làm hiện tại (`tru` = nguon + ma_nguon của chính ca / bài kiểm tra đang làm) ⇒ «trước» đúng cả khi tải lại giữa bài hay so sánh sau khi nộp;
//  · «lần cuối» = kết quả của dòng mới nhất (luc lớn nhất).
// Đảo quyết định 12/09 (TheCau.tsx: «trong màn thi không gán nhãn câu đã sai trước đó» vì lo lệch phép đo): thầy 03/11 chọn có nhãn — ghi ở DIEU-PHOI.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'

const TOI_DA_QID = 150
const chuoi = (v: unknown): string => String(v ?? '').trim()

/** Mệnh đề lọc dòng sổ dùng chung (bí danh `s`). */
const LOC = `s.ket_qua IS NOT NULL
   AND COALESCE(NULLIF(s.assistance,''),'none')='none' AND COALESCE(s.purpose,'')=''
   AND COALESCE(NULLIF(s.visibility,''),'released')='released'`

export interface DemCau { s: number; d: number; l: 0 | 1 }

/** `{qid: [sai, dung, lanCuoi(0|1)]}` của một em cho các qid cho trước. */
export async function demLichSuQid(env: Env, sbd: string, qids: string[], tru?: { nguon: string; maNguon: string }): Promise<Record<string, [number, number, number]>> {
  const ra: Record<string, [number, number, number]> = {}
  if (!sbd || !qids.length || !env.DB) return ra
  const { results } = await env.DB.prepare(
    `SELECT s.qid AS qid, s.ket_qua AS kq, COUNT(*) AS n, MAX(s.luc) AS m
       FROM su_kien_hoc s
      WHERE s.sbd = ?1 AND s.qid IN (SELECT value FROM json_each(?2)) AND ${LOC}
        AND NOT (s.nguon = ?3 AND s.ma_nguon = ?4)
      GROUP BY s.qid, s.ket_qua`,
  ).bind(sbd, JSON.stringify(qids), tru?.nguon ?? '', tru?.maNguon ?? '').all<{ qid: string; kq: number; n: number; m: string }>()
  const moi: Record<string, string> = {}
  for (const r of results ?? []) {
    const c = (ra[r.qid] ??= [0, 0, 0])
    if (Number(r.kq) === 1) c[1] += Number(r.n); else c[0] += Number(r.n)
    if (!moi[r.qid] || r.m > moi[r.qid]!) { moi[r.qid] = r.m; c[2] = Number(r.kq) === 1 ? 1 : 0 }
  }
  return ra
}

/** /hs/lich-su-qid {token, qids[], tru?:{nguon, maNguon}} — em xem nhãn của chính mình (SBD từ token). */
export async function hsLichSuQid(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  let sbd = ''
  try { sbd = await gameIdentity(env, b) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Phiên không hợp lệ.' } }
  const qids = [...new Set((Array.isArray(b.qids) ? b.qids : []).map(chuoi).filter(Boolean))].slice(0, TOI_DA_QID)
  const t = b.tru as { nguon?: unknown; maNguon?: unknown } | undefined
  const tru = t && chuoi(t.nguon) && chuoi(t.maNguon) ? { nguon: chuoi(t.nguon), maNguon: chuoi(t.maNguon) } : undefined
  try { return { ok: true, ds: await demLichSuQid(env, sbd, qids, tru) } } catch { return { ok: true, ds: {} } } // sổ chưa có cột mới / D1 bận ⇒ không nhãn, không lỗi
}

/** /gv/lich-su-ca-em {maCa} — thầy: với MỖI em trong ca, số lần từng làm sai / đúng đúng những câu em có trong ca này (trừ chính ca). Một truy vấn, KHÔNG nằm trên nhịp 20 giây. */
export async function gvLichSuCaEm(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = chuoi(b.maCa)
  if (!maCa || !env.DB) return { ok: false, error: 'Thiếu mã ca' }
  try {
    const { results } = await env.DB.prepare(
      `SELECT c.sbd AS sbd,
              SUM(CASE WHEN s.ket_qua = 0 THEN 1 ELSE 0 END) AS sai,
              SUM(CASE WHEN s.ket_qua = 1 THEN 1 ELSE 0 END) AS dung
         FROM (SELECT DISTINCT sbd, qid FROM chi_tiet_cau WHERE ma_ca = ?1) c
         JOIN su_kien_hoc s ON s.sbd = c.sbd AND s.qid = c.qid
        WHERE ${LOC} AND NOT (s.nguon = 'thi' AND s.ma_nguon = ?1)
        GROUP BY c.sbd`,
    ).bind(maCa).all<{ sbd: string; sai: number; dung: number }>()
    const ds: Record<string, [number, number]> = {}
    for (const r of results ?? []) ds[r.sbd] = [Number(r.sai) || 0, Number(r.dung) || 0]
    return { ok: true, ds }
  } catch { return { ok: true, ds: {} } }
}
