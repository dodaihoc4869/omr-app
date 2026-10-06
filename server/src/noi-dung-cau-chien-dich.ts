// NỘI DUNG CÂU CHO TỜ CHIẾU CỦA CHIẾN DỊCH (`/gv/chien-dich` action `noi-dung-cau`) — thầy 06/10:
//   "Mở câu chữa các chiến dịch đã xong của lớp 11 vẫn còn lẫn rất nhiều các câu thuộc lớp 10. Bạn áp dụng chặn câu luôn cho các chiến dịch đã xong
//    nhé và tờ chữa phải loại bỏ hết câu nhầm khối".
// GỐC LỖI (tra 06/10): danh sách chữa của máy chủ đã sạch khối (`chanKhacKhoiLop` ở `buoi-chua` / `bang`), nhưng dòng nào cũng KHÔNG mang nội dung câu
// (đoạn đính nội dung cũ chọn cột `phan` không có trong `game_v2_question` ⇒ lỗi nuốt im). Tờ chiếu ở máy thầy phải tự ĐOÁN nội dung từ Ngân hàng đề trên máy
// (khớp đuôi mã, khoá theo số thứ tự `3`, `III-3`, `q3`…) ⇒ câu không có trên máy bị thay bằng MỘT CÂU KHÁC của tờ đầu tiên trong ngân hàng — thường là tờ lớp 10.
// CÁCH SỬA: máy chủ trả nội dung ĐÚNG mã câu (chỉ câu của chính chiến dịch), qua CÙNG cổng khối với danh sách chữa (một kết luận cho mọi nơi); máy thầy chỉ dùng
// nội dung đúng mã (máy chủ hoặc Ngân hàng đề khớp NGUYÊN mã), câu bị chặn thì BỎ khỏi tờ, không đoán.
// Đường của THẦY (sau cổng `laThay`): có đáp án + lời giải như màn chữa vẫn hiện; KHÔNG đi đường học sinh.
import type { Env } from './kieu'
import { chanKhacKhoiLop, docKhoiLopCong } from './chan-khac-khoi'
import { docCauTuJson, laCauTuLuan } from './cam-tu-luan'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const laChuoiKhac = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const mangChuoi = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.map((x) => (x == null ? '' : String(x))) : undefined)

/** Mỗi lượt xin tối đa bấy nhiêu mã (tờ "Chiếu cả N câu" thật ≈ 70 câu; máy thầy chia lô nhỏ hơn). */
export const TOI_DA_QID_NOI_DUNG = 120

export const MUC_DO_HOP_LE = ['biet', 'hieu', 'van_dung'] as const

/**
 * Câu của chỉ mục game (`game_v2_question.json`, khuôn `PrivateQuestion`) → câu theo KHUÔN NGÂN HÀNG ĐỀ của thầy (`TeacherMcqQuestion` / `TeacherTrueFalseQuestion` /
 * `TeacherShortAnswerQuestion`) để tờ chiếu dựng bằng đúng đường có sẵn (`cauLuyenTuBoCau`). Khác biệt phải đổi:
 *   · Phần II: chỉ mục lưu `correct` là chuỗi "DSDS", ngân hàng thầy là mảng 4 phần tử ['D','S','D','S'];
 *   · `solution` của chỉ mục = `loiGiai` (cấu trúc) HOẶC `explanation` (chuỗi) ⇒ tách về đúng trường;
 *   · `dang` của chỉ mục là mã (chuỗi) + `tenDang` ⇒ đối tượng `{ ma, ten }`;
 *   · `sao` ⇒ `canChua.sao` (cách `soSao` đọc); chuyên đề lấy từ `cau_hoi` (chỉ mục game không có) — thiếu chuyên đề thì tờ không có nút Đạt / Chưa đạt.
 * Câu hỏng (không đọc được phần / không có đề) hoặc câu TỰ LUẬN (cấm rút, 21/09) ⇒ `null`: không có nội dung, KHÔNG đoán.
 */
export function cauChoThay(json: unknown, chuyenDe: string): Row | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null
  const q = json as Row
  const phan = str(q.phan)
  if (phan !== 'I' && phan !== 'II' && phan !== 'III') return null
  if (!laChuoiKhac(q.qid) || !laChuoiKhac(q.text)) return null
  if (q.tuLuan === true) return null
  const ra: Row = { id: str(q.qid), phan, text: str(q.text) }
  if (Array.isArray(q.table)) ra.table = q.table
  if (laChuoiKhac(q.thanCauImg)) ra.thanCauImg = q.thanCauImg
  if (laChuoiKhac(q.imageDataUrl)) ra.imageDataUrl = q.imageDataUrl
  if (Array.isArray(q.hinhAnh)) ra.hinhAnh = q.hinhAnh
  const correct = str(q.correct).trim()
  if (phan === 'I') {
    const choices = mangChuoi(q.choices)
    if (!choices || choices.length !== 4 || !/^[ABCD]$/.test(correct)) return null
    ra.choices = choices
    ra.correct = correct
    if (Array.isArray(q.choiceImgs)) ra.choiceImgs = q.choiceImgs
  } else if (phan === 'II') {
    const ideas = mangChuoi(q.ideas)
    if (!ideas || ideas.length !== 4 || !/^[DS]{4}$/.test(correct)) return null
    ra.ideas = ideas
    ra.correct = correct.split('')
    if (Array.isArray(q.ideaImgs)) ra.ideaImgs = q.ideaImgs
  } else {
    if (!correct) return null
    ra.correct = correct
  }
  const sol = q.solution
  if (sol && typeof sol === 'object' && !Array.isArray(sol)) ra.loiGiai = sol
  else if (laChuoiKhac(sol)) ra.explanation = sol
  const muc = str(q.mucDo)
  if ((MUC_DO_HOP_LE as readonly string[]).includes(muc)) ra.mucDo = muc
  if (laChuoiKhac(q.dang)) ra.dang = { ma: q.dang, ten: laChuoiKhac(q.tenDang) ? q.tenDang : q.dang }
  const kienThuc = mangChuoi(q.kienThuc)
  if (kienThuc?.length) ra.kienThuc = kienThuc
  if (q.sao === 0 || q.sao === 1 || q.sao === 2) ra.canChua = { sao: q.sao, dk: [], ly_do: '', bay: null }
  if (chuyenDe.trim()) ra.chuyenDe = chuyenDe.trim()
  return ra
}

/** Mã câu → mã tờ đứng trước (`<tờ>-<phần>-<số>`), để chọn đúng dòng kho khi một mã nằm ở nhiều tờ. */
const toCuaQid = (qid: string): string => /^(.*)-(?:III|II|I)-\d+$/.exec(qid)?.[1] ?? ''

export type NoiDungCauChienDich = {
  ok: true
  /** Khối đích của lớp / chiến dịch (rỗng ⇒ lớp chưa rõ khối: cổng giữ hết, như mọi danh sách lớp). */
  khoiDich: number[]
  /** Mã câu ⇒ câu theo khuôn Ngân hàng đề của thầy (đã qua cổng khối). Thứ tự khoá = thứ tự xin. */
  cau: Record<string, Row>
  /** Mã câu BỊ CHẶN vì khác khối lớp / mâu thuẫn khối — tờ chiếu phải bỏ các câu này. */
  boKhoi: string[]
  /** Mã câu không có nội dung dùng được: không thuộc chiến dịch, không có trong chỉ mục game, hỏng, hoặc tự luận. Tờ hiện dòng thay thế và báo thầy. */
  khongCo: string[]
}

/**
 * Nội dung các câu `qids` của MỘT chiến dịch (`cd`). Chỉ trả câu thuộc `cd.qids`; qua `chanKhacKhoiLop` với CÙNG kênh-gọi-mô-tả như `buoi-chua` / `bang`
 * (`cauCua: qid` ⇒ cùng nguồn khối từ D1 ⇒ cùng kết luận). Đọc: một truy vấn `game_v2_question ⋈ cau_hoi` + (cổng) tối đa hai truy vấn khối.
 */
export async function noiDungCauChienDich(env: Env, cd: { lop: unknown; sbd: readonly string[]; qids: readonly string[] }, xin: readonly string[]): Promise<NoiDungCauChienDich> {
  const cua = new Set(cd.qids)
  const hoi = [...new Set(xin.map((q) => str(q).trim()).filter(Boolean))].slice(0, TOI_DA_QID_NOI_DUNG)
  const thuoc = hoi.filter((q) => cua.has(q))
  const khongThuoc = hoi.filter((q) => !cua.has(q))
  const khoiDich = await docKhoiLopCong(env, { lop: cd.lop, sbd: cd.sbd }).catch(() => [])
  // Khối đích đã đọc MỘT lần ở trên; truyền xuống cổng để cổng không đọc lại khi chỉ có một khối (cùng khối đích ⇒ cùng kết luận với `buoi-chua` / `bang`).
  const lop = { lop: cd.lop, sbd: cd.sbd, ...(khoiDich.length === 1 ? { khoi: khoiDich[0]! } : {}) }
  const giu = new Set((await chanKhacKhoiLop(env, 'noi_dung_cau', lop, thuoc.map((qid) => ({ qid })), { cauCua: (x) => x.qid })).map((x) => x.qid))
  const boKhoi = thuoc.filter((q) => !giu.has(q))
  const canDoc = thuoc.filter((q) => giu.has(q))
  const cau: Record<string, Row> = {}
  const khongCo = new Set<string>(khongThuoc)
  if (canDoc.length) {
    const rows = (await env.DB.prepare(
      `SELECT q.qid AS qid, q.ma_de AS ma_de, q.json AS json, c.chuyen_de AS chuyen_de
         FROM game_v2_question q LEFT JOIN cau_hoi c ON c.qid = q.qid
        WHERE q.qid IN (SELECT value FROM json_each(?)) AND json_valid(q.json)
          AND json_extract(q.json, '$.qid') = q.qid AND json_extract(q.json, '$.version') = q.version ORDER BY q.rowid`, // cùng điều kiện "còn trong kho" như `docMetaCau` (JSON lệch cột ⇒ coi như đã rút)
    ).bind(JSON.stringify(canDoc)).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
    // Một mã ở nhiều tờ: ưu tiên dòng của CHÍNH tờ trong mã (`<tờ>-<phần>-<số>`), rồi dòng đầu theo thứ tự nạp.
    const theoQid = new Map<string, Row>()
    for (const r of rows) {
      const qid = str(r.qid)
      const cu = theoQid.get(qid)
      const dungTo = str(r.ma_de) !== '' && str(r.ma_de) === toCuaQid(qid)
      if (!cu || (dungTo && str(cu.ma_de) !== toCuaQid(qid))) theoQid.set(qid, r)
    }
    for (const qid of canDoc) {
      const r = theoQid.get(qid)
      const j = r ? docCauTuJson(r.json) : null
      const c = r && j && !laCauTuLuan(j) ? cauChoThay(j, str(r.chuyen_de)) : null // JSON hỏng / tự luận / thiếu đề ⇒ không có nội dung (không đoán)
      if (c) cau[qid] = c
      else khongCo.add(qid)
    }
  }
  return { ok: true, khoiDich, cau, boKhoi, khongCo: hoi.filter((q) => khongCo.has(q)) }
}
