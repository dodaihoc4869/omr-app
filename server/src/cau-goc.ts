// POST /hs/cau-goc — nút nhỏ "Xem câu gốc" ở ca "Kiểm chứng câu đã đúng" (thầy 07/10: "hiển thị câu gốc đã đúng để học sinh có thể đối chiếu kiến thức của câu thay thế").
//
// `{ maCa, sbd, qid: [qid câu GỐC] (≤ 4) }` → `{ ok, cau: { <qid gốc>: câu công khai }, khongCo: [qid không phát được] }`.
//
// LUẬT ĐỎ "đáp án không xuống máy học sinh trước khi nộp": đường này công khai (như `/hs/cau-theo-qid`, định danh bằng SBD) nên CHỈ trả danh sách trường ĐƯỢC PHÉP (đề, phương án / ý, bảng, hình
// của đề — không `correct`, không `solution`, không ảnh sau lời giải): lấy từ `cauCongKhai` rồi thu hẹp thêm. Không có đường nào trả nội dung thô của kho.
//
// AI ĐƯỢC XEM CÂU NÀO — một tập duy nhất, nhỏ: câu gốc mà bản đồ nhãn của CHÍNH em này ở CHÍNH ca này ghi cho một câu thay ("~goc:<qid câu thay>" → qid gốc, ghi lúc máy thầy
// bấm Bắt đầu hoặc lúc em vào muộn — xem `banDoDaDung`). Em phải có lượt ở ca (đã vào thi). Xin qid ngoài tập ấy ⇒ vào `khongCo` như câu không có trong kho (không lộ kho có gì → không dò kho).
//
// Mọi cổng "câu phục vụ cho em" còn lại giữ nguyên như `/hs/cau-theo-qid`, TRỪ những cổng chỉ có nghĩa với việc LUYỆN (kho đề giao theo tuần, phạm vi cá nhân, bộ chọn chung): câu gốc ở đây
// chỉ để ĐỐI CHIẾU với câu em đang làm, không phải việc em được giao.
//   · có trong chỉ mục game, tờ kho còn (`TU_CHI_MUC_GAME`); câu TỰ LUẬN không bao giờ;
//   · đề đang bảo vệ (`protectedQuestions`): bỏ — NGOẠI LỆ duy nhất: câu chỉ dính bảo vệ vì nằm trong đề của CHÍNH ca này (bản của em khác giữ nguyên câu ấy) thì vẫn cho xem, vì với em xin
//     xem đó là câu em đã đúng từ trước (`protectedQuestionsTruCa`); câu dính bảo vệ của ca KHÁC vẫn bị giữ;
//   · khác khối: `chanKhacKhoiEm` (luật thầy 05/10) — kênh riêng `cau_goc`.
// Không kiểm được đề bảo vệ ⇒ ĐÓNG CỬA (`ok:false`, máy em cho bấm lại), không đoán.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { TIEN_TO_GOC } from '../../src/lib/rut-de-da-dung'
import { protectedQuestions, protectedQuestionsTruCa } from './game-v2-bank'
import { laCauTuLuan } from './cam-tu-luan'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { cauCongKhai, donQid, khongBiBaoVe, TU_CHI_MUC_GAME } from './cau-theo-qid'

export const TOI_DA_CAU_GOC = 4
const SBD_DUONG_JSON = /^[A-Za-z0-9_-]{1,64}$/

type Dong = { da_dung: string | null; co_luot: number }

/** Câu gốc như máy em nhận: CHỈ phần đề. Đi qua `cauCongKhai` (đã bỏ đáp án, lời giải, ảnh sau lời giải) rồi bỏ nốt nhãn nội bộ (mức độ, dạng, kiến thức…). */
export function cauGocCongKhai(q: PrivateQuestion) {
  const c = cauCongKhai(q)
  return {
    qid: c.qid, phan: c.phan, text: c.text, choices: c.choices, ideas: c.ideas, table: c.table,
    thanCauImg: c.thanCauImg, imageDataUrl: c.imageDataUrl, choiceImgs: c.choiceImgs, ideaImgs: c.ideaImgs, hinhAnh: c.hinhAnh,
  }
}

/** qid câu gốc mà bản đồ nhãn `daDung` (JSON của MỘT em) cho phép xem: giá trị của các khoá "~goc:…". JSON hỏng / không phải đối tượng ⇒ rỗng. */
export function cauGocDuocXem(daDungJson: unknown): Set<string> {
  const ra = new Set<string>()
  if (typeof daDungJson !== 'string' || daDungJson === '') return ra
  let o: unknown
  try { o = JSON.parse(daDungJson) } catch { return ra }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return ra
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (k.startsWith(TIEN_TO_GOC) && typeof v === 'string' && v.trim() !== '') ra.add(v.trim())
  }
  return ra
}

export async function hsCauGoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = String(b.maCa ?? '').trim()
  const sbd = String(b.sbd ?? '').trim()
  if (!maCa || !sbd) return { ok: false, error: 'Thiếu mã ca hoặc số báo danh' }
  if (maCa.length > 40 || sbd.length > 40) return { ok: false, error: 'Không tìm thấy học sinh' }
  if (!Array.isArray(b.qid)) return { ok: false, error: 'Thiếu danh sách câu (qid)' }
  if (b.qid.length > TOI_DA_CAU_GOC) return { ok: false, error: `Mỗi lần xin tối đa ${TOI_DA_CAU_GOC} câu` }
  const xin = donQid(b.qid)
  const khongPhat = (): Record<string, unknown> => ({ ok: true, cau: {}, khongCo: xin })
  if (xin.length === 0 || !SBD_DUONG_JSON.test(sbd)) return khongPhat() // SBD đi thẳng vào đường dẫn JSON `$.daDung."<sbd>"` nên chỉ nhận chữ/số/gạch (không có đối tượng JS nào được đánh chỉ mục theo SBD ở đây)

  // Một truy vấn: bản đồ nhãn của CHÍNH em ở ca này (cắt ngay trong D1 bằng `->`, không kéo bản đồ cả lớp) + em đã có lượt ở ca chưa.
  let dong: Dong | null
  try {
    dong = await env.DB.prepare(
      `SELECT (SELECT CASE WHEN json_valid(c.bo_theo_em_json) AND json_type(c.bo_theo_em_json) = 'object' THEN c.bo_theo_em_json -> ? END FROM ca c WHERE c.ma_ca = ?) AS da_dung,
              EXISTS (SELECT 1 FROM luot WHERE ma_ca = ? AND sbd = ?) AS co_luot`,
    ).bind(`$.daDung."${sbd}"`, maCa, maCa, sbd).first<Dong>()
  } catch {
    return { ok: false, error: 'Chưa lấy được câu gốc. Em thử lại sau.' }
  }
  if (Number(dong?.co_luot) !== 1) return khongPhat()
  const choPhep = cauGocDuocXem(dong?.da_dung)
  const duoc = xin.filter((q) => choPhep.has(q))
  if (duoc.length === 0) return khongPhat()

  // Nội dung từ chỉ mục game (cùng nguồn `/hs/cau-theo-qid`); câu tự luận không bao giờ phát.
  const rc = await env.DB.prepare(`SELECT q.json ${TU_CHI_MUC_GAME}`).bind(JSON.stringify(duoc)).all<{ json: string }>()
  const theoQid = new Map<string, PrivateQuestion>()
  for (const x of rc.results ?? []) {
    try {
      const q = JSON.parse(x.json) as PrivateQuestion
      if (laCauTuLuan(q)) continue
      if (q?.qid && !theoQid.has(q.qid)) theoQid.set(q.qid, q)
    } catch { /* dòng hỏng: bỏ */ }
  }
  if (theoQid.size === 0) return khongPhat()

  // Đề đang bảo vệ: không kiểm được ⇒ đóng cửa. Câu dính tập chung ⇒ xét lại KHÔNG tính đề của chính ca này.
  let sach: PrivateQuestion[]
  try {
    const baoVe = await protectedQuestions(env)
    const ung = [...theoQid.values()]
    const dinh = ung.filter((q) => !khongBiBaoVe(q, baoVe))
    const baoVeKhac = dinh.length > 0 ? await protectedQuestionsTruCa(env, maCa) : null
    sach = ung.filter((q) => khongBiBaoVe(q, baoVe) || (baoVeKhac !== null && khongBiBaoVe(q, baoVeKhac)))
  } catch {
    return { ok: false, error: 'Chưa kiểm tra xong phạm vi đề thi đang bảo vệ. Em thử lại sau.' }
  }

  // LUẬT THẦY 05/10: cổng cuối khác khối — câu khác khối em không ra máy em.
  const giu = await chanKhacKhoiEm(env, 'cau_goc', sbd, sach)
  const cau: Record<string, unknown> = {}
  for (const q of giu) cau[q.qid] = cauGocCongKhai(q)
  return { ok: true, cau, khongCo: xin.filter((q) => !(q in cau)) }
}
