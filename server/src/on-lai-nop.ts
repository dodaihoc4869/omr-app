// POST /hs/on-lai/nop — em NỘP bài làm của các câu "ôn lại" (`viec[].chiTiet.qid`, lấy đề bằng `/hs/cau-theo-qid`).
//
// Vì sao có lệnh này: trước đây em làm việc on_lai bằng luồng luyện câu sai CŨ, kết quả nằm ở localStorage máy em và KHÔNG về máy chủ,
// nên hồ sơ không bao giờ thấy em làm đúng lại — câu không lên bậc, không "đã khắc phục" qua đường này. Đây là tim của vòng "tiến bộ từng ngày".
//
// LUẬT (khoá bằng tests/on-lai-nop-1909.test.ts):
//   · BẮT BUỘC token học sinh (`gameIdentity`); SBD trần bị từ chối — không nộp hộ, không giả em khác.
//   · Chỉ nhận qid mà `/hs/cau-theo-qid` sẽ trả cho CHÍNH em đó (`layCauChoEm`: đã gặp, không thuộc đề đang bảo vệ) — một tập, không lệch.
//   · CHẤM tại máy chủ bằng `isAnswerCorrect` — MỘT luật chấm cho sổ. Đáp án rỗng/`----` = bỏ trống → ket_qua NULL, không cộng lan_sai.
//   · Ghi `su_kien_hoc` nguon='on_lai', ma_nguon=`on_lai:<ngày VN>`, lan=1: idempotent theo khoá, nộp lại cùng câu cùng ngày giữ lần ĐẦU
//     (không cho sửa đáp án sau khi đã thấy lời giải). Kết quả trả về được ĐỌC LẠI từ sổ, nên nộp lại luôn ra kết quả lần đầu.
//   · ĐÁP ÁN VÀ LỜI GIẢI CHỈ ĐI RA SAU KHI ĐÃ GHI SỔ THÀNH CÔNG. Ghi không được thì `ok:false` và KHÔNG có đáp án nào trong phản hồi.
//   · Dựng lại hồ sơ (`dungLaiHoSo`, luật Leitner hiện có: đúng cùng ngày VN chỉ tính một mốc); lỗi ở bước này không làm hỏng lượt nộp
//     (sổ là nguồn sự thật, kế hoạch kế tiếp tự dựng lại khi số dòng sổ đổi).
//   · EXP học tập: đúng đường `creditAcademic` với khoá `practice:<qid>` (mỗi câu một lần cả đời, trần 100/ngày) — CHỈ khi em đã có hồ sơ game
//     (không tự tạo hồ sơ chỉ để cộng EXP); xung đột phiên bản thì bỏ qua EXP, không làm hỏng lượt nộp.
import type { Env } from './kieu'
import { isAnswerCorrect } from './btvn-grading'
import { creditAcademic } from './game-v2-academic'
import { loadProfile } from './game-v2'
import { gameIdentity } from './game-v2-auth'
import { dungLaiHoSo } from './ho-so-nam-kt'
import { TIEN_BO_NGAY } from './ke-hoach-ngay-d1'
import { DAI_QID_TOI_DA, donQid, layCauChoEm, TOI_DA_QID_MOT_LUOT } from './cau-theo-qid'
import { ghiSuKien, laBoTrong, ngayVn, phanTuQid, type SuKien } from './su-kien-hoc'

const GIAY_MIN = 5
const GIAY_MAX = 1200
const DAI_DAP_AN_TOI_DA = 40
const EXP_MOI_CAU = 2

interface BaiLam {
  qid: string
  dapAn: string
  giay: number | null
}

/** Đọc `traLoi` do máy em gửi: bỏ mục hỏng, khử trùng theo qid (giữ mục ĐẦU), đáp án cắt ở 40 ký tự, giây hợp lệ 5..1200 hoặc null. */
export function docTraLoi(ds: unknown[]): BaiLam[] {
  const ra = new Map<string, BaiLam>()
  for (const x of ds) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    const qid = typeof o.qid === 'string' ? o.qid.trim() : ''
    if (!qid || qid.length > DAI_QID_TOI_DA || ra.has(qid)) continue
    const dapAn = (Array.isArray(o.dapAn) ? o.dapAn.join('') : typeof o.dapAn === 'string' || typeof o.dapAn === 'number' ? String(o.dapAn) : '').trim().slice(0, DAI_DAP_AN_TOI_DA)
    const g = typeof o.giay === 'number' ? o.giay : NaN
    ra.set(qid, { qid, dapAn, giay: Number.isFinite(g) && g >= GIAY_MIN && g <= GIAY_MAX ? Math.round(g) : null })
  }
  return [...ra.values()]
}

/** Cộng EXP học tập cho các câu ĐÚNG lần đầu. Không bao giờ ném lỗi ra ngoài. */
async function ganExp(env: Env, sbd: string, qidDung: string[], luc: string): Promise<number> {
  if (qidDung.length === 0) return 0
  try {
    const co = await env.DB.prepare('SELECT 1 AS x FROM game_v2_profile WHERE sbd = ?').bind(sbd).first()
    if (!co) return 0
    for (let lan = 0; lan < 2; lan++) {
      const { profile: p, revision } = await loadProfile(env, sbd)
      const gain = creditAcademic(p, qidDung.map((q) => ({ key: `practice:${q}`, at: luc, amount: EXP_MOI_CAU })), luc)
      if (gain <= 0) return 0
      const r = await env.DB.prepare('UPDATE game_v2_profile SET json = ?, revision = revision + 1 WHERE sbd = ? AND revision = ?').bind(JSON.stringify(p), sbd, revision).run()
      if (r.meta.changes) return gain
    }
  } catch (e) {
    console.error('[on-lai] cộng EXP lỗi (bỏ qua):', e instanceof Error ? e.message : e)
  }
  return 0
}

export async function hsOnLaiNop(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const sbd = await gameIdentity(env, b) // ném lỗi nếu không có token hợp lệ: SBD trần không bao giờ được nộp
  if (!Array.isArray(b.traLoi)) return { ok: false, error: 'Thiếu bài làm (traLoi)' }
  if (b.traLoi.length > TOI_DA_QID_MOT_LUOT) return { ok: false, error: `Mỗi lần nộp tối đa ${TOI_DA_QID_MOT_LUOT} câu` }
  const lam = docTraLoi(b.traLoi)
  const xin = donQid(lam.map((x) => x.qid))
  if (xin.length === 0) return { ok: true, ketQua: [], khongCo: [], tienBo: null, exp: 0 }

  const r = await layCauChoEm(env, sbd, xin)
  if (r.loi) return { ok: false, error: r.loi }
  const cauTheoQid = new Map(r.cau.map((q) => [q.qid, q]))
  const nhan = lam.filter((x) => cauTheoQid.has(x.qid))
  if (nhan.length === 0) return { ok: true, ketQua: [], khongCo: r.khongCo, tienBo: null, exp: 0 }

  // CHẤM rồi GHI SỔ. Chưa ghi được thì không có đáp án nào đi ra.
  const now = Date.now()
  const luc = new Date(now).toISOString()
  const maNguon = `on_lai:${ngayVn(now)}`
  const suKien: SuKien[] = nhan.map((x) => {
    const q = cauTheoQid.get(x.qid)!
    return {
      nguon: 'on_lai', maNguon, sbd, qid: x.qid, lan: 1, luc, giay: x.giay, maDang: q.dang, chuyenDe: '', mucDo: q.mucDo ?? '',
      ketQua: laBoTrong(x.dapAn) ? null : isAnswerCorrect(x.dapAn, q.correct, phanTuQid(x.qid, q.phan)) ? 1 : 0,
    }
  })
  const ghi = await ghiSuKien(env, suKien)
  if (!ghi.ok) return { ok: false, error: 'Chưa ghi được bài làm. Em nộp lại nhé.' }

  // Kết quả LẦN ĐẦU đã lưu (nộp lại cùng câu cùng ngày không đổi được).
  const daLuu = await env.DB.prepare(
    `SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = 'on_lai' AND ma_nguon = ? AND lan = 1 AND qid IN (SELECT value FROM json_each(?))`,
  ).bind(sbd, maNguon, JSON.stringify(nhan.map((x) => x.qid))).all<{ qid: string; ket_qua: number | null }>()
  const ketQuaLuu = new Map((daLuu.results ?? []).map((x) => [String(x.qid), x.ket_qua === null ? null : Number(x.ket_qua)]))
  if (nhan.some((x) => !ketQuaLuu.has(x.qid))) return { ok: false, error: 'Chưa ghi được bài làm. Em nộp lại nhé.' }

  try {
    await dungLaiHoSo(env, [sbd], luc)
  } catch (e) {
    console.error('[on-lai] dựng lại hồ sơ lỗi (sổ đã ghi, kế hoạch sau sẽ tự dựng lại):', e instanceof Error ? e.message : e)
  }
  let tienBo: { daLamCau: number; lenBac: number; tutBac: number } | null = null
  try {
    const t = await env.DB.prepare(TIEN_BO_NGAY).bind(JSON.stringify([sbd]), ngayVn(now)).first<Record<string, unknown>>()
    tienBo = { daLamCau: Number(t?.da_lam) || 0, lenBac: Number(t?.len_bac) || 0, tutBac: Number(t?.tut_bac) || 0 }
  } catch { /* không có tiến bộ ngày thì vẫn trả kết quả từng câu */ }

  const exp = await ganExp(env, sbd, nhan.filter((x) => ketQuaLuu.get(x.qid) === 1).map((x) => x.qid), luc)

  // ĐÁP ÁN Ở ĐÂY MỚI ĐI RA — sau khi đã ghi sổ và đọc lại kết quả lần đầu.
  const ketQua = nhan.map((x) => {
    const q = cauTheoQid.get(x.qid)!
    const k = ketQuaLuu.get(x.qid)
    return {
      qid: x.qid,
      dung: k === null || k === undefined ? null : k === 1,
      dapAnDung: q.correct,
      loiGiai: q.solution ?? null,
      anhLoiGiai: (q.hinhAnh ?? []).filter((h) => h.viTri === 'sau_loi_giai'),
    }
  })
  return { ok: true, ketQua, khongCo: r.khongCo, tienBo, exp }
}
