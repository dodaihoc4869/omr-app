// RÚT CÂU KHÔNG LẶP cho ĐOÀN HỘ TỐNG (thầy lệnh 21/09 ~19:35: "Rút câu theo đúng luật cá nhân hóa, nâng đỡ tiến bộ và chặn câu lặp lại cho mỗi học sinh"; Boss giao).
//   • Câu CÁ NHÂN của Đoàn rút bằng CÙNG luật với Đảo Đợt 2 (`chooseLuotMoi`, loại 'kham_pha': 2 yếu + tới hạn + mới + thử thách, không vượt bậc + 1, sai hôm nay không quay lại, sai ≥ 3 lần đổi câu, đúng nghỉ 30 ngày).
//   • KHÔNG BAO GIỜ lặp câu em đã làm HÔM NAY (mọi nguồn: game, ôn lại, luyện, bài về nhà, ca…); ƯU TIÊN câu em CHƯA TỪNG làm ở đâu cả (mọi nguồn, mọi ngày); hết câu mới ⇒ lấy câu LÂU NHẤT chưa gặp và NÓI THẬT (`hetCauMoi`);
//     không còn câu nào phù hợp ⇒ báo thật "hết câu mới hôm nay".
//   • Câu chung của TRÙM nhớ câu đã ra ở các chặng trước của các em trong đoàn (`doan_trum_cau` nối `doan_luot`) và câu các em đã làm: câu CHƯA AI thấy đứng trước.
// Chỉ ĐỌC. Hàm thuần `tachMoiCu` / `chonLauNhat` không đọc D1 (test được).
import type { Env } from './kieu'

/** Lần làm gần nhất (ms) của mỗi câu em ĐÃ LÀM ở BẤT KỲ nguồn nào, mọi ngày (sổ học `su_kien_hoc`, đi chỉ mục (sbd, qid)). Lỗi đọc ⇒ rỗng (không chặn thêm). */
export async function docCauDaLamMoiNguon(env: Env, sbd: string): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  try {
    const r = await env.DB.prepare('SELECT qid, MAX(luc) AS luc FROM su_kien_hoc WHERE sbd = ? GROUP BY qid').bind(sbd).all<{ qid: string; luc: string }>()
    for (const x of r.results ?? []) { const t = Date.parse(String(x.luc)); ra.set(String(x.qid), Number.isFinite(t) ? t : 0) }
  } catch (e) {
    console.error('[cau-moi] không đọc được sổ học (bỏ qua bộ lọc câu đã làm):', e instanceof Error ? e.message : e)
  }
  return ra
}

/** qid VÀ nhóm nội dung em đã làm HÔM NAY ở mọi nguồn (lượt game kể cả có trợ giúp — `su_kien_hoc` không ghi câu có trợ giúp — cộng sổ học hôm nay). */
export async function docCauLamHomNay(env: Env, sbd: string, dauNgayIso: string, ngayVn: string): Promise<Set<string>> {
  const ra = new Set<string>()
  try {
    const a = await env.DB.prepare('SELECT qid, content_group FROM game_v2_attempt WHERE sbd = ? AND created_at >= ?').bind(sbd, dauNgayIso).all<{ qid: string; content_group: string | null }>()
    for (const x of a.results ?? []) { ra.add(String(x.qid)); if (x.content_group) ra.add(String(x.content_group)) }
  } catch (e) { console.error('[cau-moi] không đọc được lượt game hôm nay:', e instanceof Error ? e.message : e) }
  try {
    const s = await env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ?').bind(sbd, ngayVn).all<{ qid: string }>()
    for (const x of s.results ?? []) ra.add(String(x.qid))
  } catch (e) { console.error('[cau-moi] không đọc được sổ học hôm nay:', e instanceof Error ? e.message : e) }
  return ra
}

/** Tách kho thành câu MỚI (em chưa làm ở đâu, nhóm chưa có trong lịch sử game) và câu CŨ (đã làm ở ngày trước); câu làm HÔM NAY bị loại hẳn. */
export function tachMoiCu<T extends { qid: string; group: string }>(kho: readonly T[], homNay: ReadonlySet<string>, daLam: ReadonlyMap<string, number>, nhomDaChoi: ReadonlySet<string>): { moi: T[]; cu: T[] } {
  const moi: T[] = [], cu: T[] = []
  for (const q of kho) {
    if (homNay.has(q.qid) || homNay.has(q.group)) continue
    if (daLam.has(q.qid) || nhomDaChoi.has(q.group)) cu.push(q)
    else moi.push(q)
  }
  return { moi, cu }
}

/** Trong các câu CŨ, chọn `k` câu LÂU NHẤT chưa gặp (theo lần làm gần nhất ở mọi nguồn; câu chỉ có ở lịch sử game dùng `lucGame`). Ổn định theo qid. */
export function chonLauNhat<T extends { qid: string; group: string }>(cu: readonly T[], daLam: ReadonlyMap<string, number>, lucGame: ReadonlyMap<string, number>, k: number): T[] {
  const luc = (q: T) => Math.max(daLam.get(q.qid) ?? -1, lucGame.get(q.group) ?? -1)
  return [...cu].sort((a, b) => luc(a) - luc(b) || (a.qid < b.qid ? -1 : a.qid > b.qid ? 1 : 0)).slice(0, Math.max(0, k))
}

/**
 * Với các câu TRÙM ứng viên: số em trong đoàn ĐÃ THẤY câu ấy (đã làm ở bất kỳ nguồn nào, hoặc trùm đã ra ở chặng trước của em đó). 0 = chưa ai thấy ⇒ đứng trước.
 * `qids` = qid ứng viên; đọc theo lô `json_each` (không quá giới hạn tham số D1). Lỗi đọc ⇒ rỗng.
 */
export async function demEmDaThayTrum(env: Env, dsSbd: readonly string[], qids: readonly string[]): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  if (dsSbd.length === 0 || qids.length === 0) return ra
  const them = (qid: string, sbd: string, thay: Map<string, Set<string>>) => { const s = thay.get(qid) ?? new Set<string>(); s.add(sbd); thay.set(qid, s) }
  const thay = new Map<string, Set<string>>()
  try {
    for (const sbd of dsSbd) {
      const r = await env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))').bind(sbd, JSON.stringify(qids)).all<{ qid: string }>()
      for (const x of r.results ?? []) them(String(x.qid), sbd, thay)
    }
    const t = await env.DB.prepare(
      `SELECT DISTINCT t.qid, l.sbd FROM doan_trum_cau t JOIN doan_luot l ON l.ma_chang = t.ma_chang
        WHERE l.sbd IN (SELECT value FROM json_each(?)) AND t.qid IN (SELECT value FROM json_each(?))`,
    ).bind(JSON.stringify(dsSbd), JSON.stringify(qids)).all<{ qid: string; sbd: string }>()
    for (const x of t.results ?? []) them(String(x.qid), String(x.sbd), thay)
  } catch (e) {
    console.error('[cau-moi] không đọc được câu trùm đã thấy (giữ thứ tự cũ):', e instanceof Error ? e.message : e)
    return new Map()
  }
  for (const [q, s] of thay) ra.set(q, s.size)
  return ra
}
