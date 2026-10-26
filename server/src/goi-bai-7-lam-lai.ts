// LÀM LẠI CUỐI CHẶNG KIỂU DUOLINGO (thầy 26/10; đặc tả docs/de-xuat-phan-cau-kieu-duolingo-2610.md, A3).
// Em làm xong 6 câu của chặng mà có câu SAI (tự làm) ⇒ app gọi lệnh này MỘT lần: mỗi câu sai nhận một CÂU ANH EM (cùng dạng, cùng phần, cùng mức hoặc kề,
// khác nhóm nội dung, đúng khối, em chưa gặp, không câu ca thi / BTVN chưa nộp / câu nghi sai đáp án — đúng bộ chọn `chonAnhEmChoCaDaDung` của thang làm lại).
// Không lặp nguyên câu vừa sai (em vừa xem đáp án). Câu nào không có câu anh em ⇒ bỏ qua, không ép.
// LUẬT: câu làm lại mang `goiY` ⇒ lệnh nộp ghi CÓ HỖ TRỢ (game-v2.ts `assisted: … || !!ref.goiY`): không EXP (giữ quyết định 20/10 "sửa không EXP"),
// không tính đóng lỗi; câu gốc vẫn vào lịch ôn như cũ. `tc` = câu gốc (sổ ghi đây là lượt làm lại của câu ấy).
// Đáp án KHÔNG xuống máy: chỉ trả đề (`publicQuestion`); đáp án về sau khi nộp như mọi câu.
// Chi phí: 1 lượt đọc phiên + lượt nộp của phiên (song song), meta câu sai, phần chung của bộ chọn câu anh em (một lần cho cả chặng), 1 lệnh ghi phiên.
import type { Env } from './kieu'
import { publicQuestion } from '../../src/game/than-thu-v2/core'
import { chonAnhEmChoCaDaDung } from './cau-anh-em'
import { docMetaCau } from './srs2-d1'
import { readGameScope } from './game-v2-reports'
import { tachSongSinh } from './loi-hoc-luat'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { docCauTheoRef } from './game-v2-bank'
import { duolingoChoEm } from './duolingo-bai-co'
import type { RefGoi7 } from './goi-bai-7'

type Row = Record<string, unknown>
/** Tối đa số câu làm lại mỗi chặng — vòng làm lại ngắn (chặng 6 câu nhắm ~80% đúng ⇒ thường 1–2 câu sai). */
export const TRAN_LAM_LAI = 3
export const GOI_Y_LAM_LAI = { cotLoi: 'Làm lại câu cùng dạng sau khi xem lời giải' }

interface PhienGoi7 { goi7?: number; created: number; questions: RefGoi7[]; lamLai?: number }

/** Câu sai TỰ LÀM của phiên (không phải câu làm lại, không lướt, không có hỗ trợ), theo thứ tự trong chặng. */
export function cauSaiCuaPhien(refs: readonly RefGoi7[], luot: readonly { qid: string; json: string }[]): RefGoi7[] {
  const sai = new Set<string>()
  for (const l of luot) {
    try {
      const r = JSON.parse(l.json) as { attempt?: { correct?: unknown; assisted?: unknown }; omni?: { luot?: unknown } }
      if (r.attempt?.correct === false && r.attempt.assisted !== true && r.omni?.luot !== true) sai.add(l.qid)
    } catch { /* Lượt hỏng: bỏ qua, không đoán. */ }
  }
  return refs.filter(r => !r.lamLaiCuoi && sai.has(r.qid))
}

export async function lamLaiCuoiChang7(env: Env, sbd: string, b: Row, now: number): Promise<Record<string, unknown>> {
  const id = String(b.session ?? '')
  if (!id) throw new Error('Thiếu mã chặng học.')
  const [row, luot, control, bat] = await Promise.all([
    env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id, sbd).first<{ json: string }>(),
    env.DB.prepare('SELECT qid,json FROM game_v2_attempt WHERE session=? AND sbd=?').bind(id, sbd).all<{ qid: string; json: string }>(),
    readGameScope(env, sbd),
    duolingoChoEm(env, sbd, now),
  ])
  if (!bat) return { ok: true, questions: [] } // cờ duolingo_bai tắt cho em ⇒ không có vòng làm lại
  if (!row) throw new Error('Không tìm thấy chặng học của em.')
  const s = JSON.parse(row.json) as PhienGoi7
  if (s.goi7 !== 1 || now - s.created > 2 * 3600000) return { ok: true, questions: [] }
  const daLam = new Set((luot.results ?? []).map(l => l.qid))
  // Gọi lại (mất mạng, bấm lặp) ⇒ trả đúng các câu làm lại đã cấp mà em chưa làm, không cấp vòng thứ hai.
  if (s.lamLai === 1) {
    const cu = s.questions.filter(r => r.lamLaiCuoi && !daLam.has(r.qid))
    return { ok: true, questions: await napCau(env, cu) }
  }
  if (!control.enabled) return { ok: true, questions: [] }
  const sai = cauSaiCuaPhien(s.questions, (luot.results ?? []).map(l => ({ qid: l.qid, json: String(l.json) }))).slice(0, TRAN_LAM_LAI)
  if (!sai.length) return { ok: true, questions: [] }
  // Câu anh em chọn theo câu THẬT em đã làm (câu gốc, hoặc câu anh em/song sinh đã đứng thay ở vai sửa).
  const meta = await docMetaCau(env, sai.map(r => r.qid), sai.map(r => r.maDe))
  const cho = sai.map(r => meta.get(r.qid)).filter((m): m is NonNullable<typeof m> => !!m && !!m.dang && !m.tuLuan)
  const trongDe = s.questions.map(r => ({ qid: r.qid, group: r.group }))
  const ae = await chonAnhEmChoCaDaDung(env, sbd, now, cho, trongDe)
  const moi: RefGoi7[] = [], questions: Record<string, unknown>[] = []
  for (const r of sai) {
    const x = ae.get(r.qid)
    if (!x || laCauTuLuan(x.q) || !x.q.reviewed || control.blocked.includes(x.q.qid) || control.types.length && (!x.q.dang || !control.types.includes(x.q.dang))) continue
    const ref: RefGoi7 = { qid: x.q.qid, maDe: x.q.maDe, version: x.q.version, group: x.q.group, novel: false, role: 'on_lai', vai: 'sua', huongDan: false,
      goiY: GOI_Y_LAM_LAI, tc: tachSongSinh(r.tc ?? r.qid).goc, lamLaiCuoi: true, lamLaiCua: r.qid }
    moi.push(ref)
    questions.push({ ...publicQuestion(x.q), vaiGoi7: 'lam_lai', lamLaiCua: r.qid })
  }
  if (!moi.length) return { ok: true, questions: [] }
  // Ghi một lần, chỉ khi phiên chưa có vòng làm lại (hai máy / bấm lặp cùng lúc ⇒ một bên thắng; bên kia nhận danh sách trống, máy em về màn kết chặng).
  const rs = await env.DB.prepare("UPDATE game_v2_session SET json=json_set(json,'$.questions',json(?),'$.lamLai',1) WHERE id=? AND sbd=? AND json_extract(json,'$.lamLai') IS NULL")
    .bind(JSON.stringify([...s.questions, ...moi]), id, sbd).run()
  if (!Number(rs.meta.changes)) return { ok: true, questions: [] }
  return { ok: true, questions }
}

/** Nạp lại đề các câu làm lại đã cấp (gọi lại lệnh). Câu không còn trong kho ⇒ bỏ. */
async function napCau(env: Env, refs: readonly RefGoi7[]): Promise<Record<string, unknown>[]> {
  const ra = await Promise.all(refs.map(r => docCauTheoRef(env, r).then(q => q && !laCauTuLuan(q) ? { ...publicQuestion(q), vaiGoi7: 'lam_lai', lamLaiCua: r.lamLaiCua ?? '' } : null, () => null)))
  return ra.filter((x): x is NonNullable<typeof x> => !!x)
}
