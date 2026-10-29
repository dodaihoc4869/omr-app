// CHẤM NHANH «Kiểm tra» (thầy 28/10, SBD thử, câu Đúng/Sai Bài 8 Amine: «Bấm kiểm tra vẫn bị chậm, chưa tức thì ngay» — lúc VẮNG, 2 đợt chờ D1 của `answer` vẫn chậm).
//
// Mục tiêu: bấm «Kiểm tra» ⇒ có đúng / sai ~150–250 ms đầu cuối ⇒ KHÔNG đợt chờ D1 nào trước khi máy em biết đúng / sai.
// Cách làm (máy em xin bằng `luong: 1`; index.ts `traLoiNopLuong`): lệnh `answer` trả THEO LUỒNG (NDJSON, như đăng nhập kèm Sảnh — dang-nhap-kem-sanh.ts):
//   · DÒNG 1 (`tam: true`) — chấm TỪ BỘ NHỚ isolate, không chạm D1: token qua kiểm chữ ký + hạn (bước 1 của `gameIdentityHaiBuoc`, không đọc mật khẩu),
//     phiên + câu (bản riêng có đáp án) + phạm vi thầy đặt của em + tập câu bảo vệ ca thi đều lấy từ ĐỆM ISOLATE do lượt `answer` thường / lượt mở chặng nạp.
//   · DÒNG 2 — phản hồi `answer` ĐẦY ĐỦ, y hệt hôm nay (chạy đúng `gameV2('answer')` trong CÙNG yêu cầu, giữ bằng `ctx.waitUntil`): ghi lượt trả lời, thưởng,
//     EXP, sổ… MỘT lô như cũ; idempotent theo biên nhận `phiên|câu` (nộp lại ⇒ `replayed`, trả đúng bản chấm đầu). Máy em ngắt giữa chừng ⇒ máy chủ vẫn ghi xong;
//     máy em giữ bản nháp tới khi có dòng 2, không có ⇒ tự gửi lại (cùng biên nhận ⇒ không tính hai lần).
// Đệm thiếu / cũ / không chắc ⇒ KHÔNG có dòng 1 ⇒ phản hồi JSON thường như cũ (không bao giờ đoán).
//
// An toàn:
//  · Đáp án chỉ xuống SAU khi em nộp: dòng 1 chỉ có khi máy chủ đã NHẬN đáp án và đang ghi đúng đáp án ấy trong cùng yêu cầu (không có kênh «hỏi thử»:
//    câu đã có biên nhận trong isolate ⇒ không chấm nhanh; dòng 2 luôn là bản chấm đã lưu — nộp lại đáp án khác vẫn chấm theo lần đầu).
//  · Câu bảo vệ ca thi: tập câu bảo vệ của isolate (≤ HAN_BAO_VE_MS, xoá ngay khi isolate ghi bảng `ca` — `xoaDemCaBaoVe`) + phạm vi / câu chặn của thầy cho em
//    (≤ HAN_EM_MS). Không có / quá hạn ⇒ không chấm nhanh.
//  · Chỉ phiên học tập (`hocTap` / `goi7`), không Kim cương / Đoàn / Võ đài / Bi-a / câu chẩn đoán / phiên thu hồi chiến dịch / phiên OMNI đang xét lướt; hết hạn 2 giờ ⇒ không.
//  · Dòng 2 KHÁC dòng 1 (câu vừa đổi đáp án, phạm vi vừa đổi…) ⇒ máy em lấy dòng 2 (bản lưu là chuẩn).
import { khopPhanIII } from '../../src/lib/cham-so'
import { ngoaiKenhSo } from '../../src/lib/so-o-tra-loi-ngan'
import { grade, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { apXaoTheoRef, laQidChanDoan } from './lam-lai-so'
import { boSungKichThuocDe, docDoGiayMot } from './do-giay-luot'
import { khongTinhTuDo, laPhienNguyenTu, type PhienNt } from './thuong-tra-loi'
import { laCauTuLuan } from './cam-tu-luan'
import type { Env } from './kieu'
import { THAM_SO_OMNI } from './omni-kieu'
import { nhanTocDo } from './omni-toc-do'
import { dangKySauXoaCaBaoVe, protectedQuestions } from './game-v2-bank'
import type { NoiDungNiem } from './niem-phong'

type RefPhien = { qid: string; maDe: string; version: string; xt?: unknown } & Record<string, unknown>
type PhienNho = { doan?: number; guardian?: string; created: number; questions: RefPhien[]; hoa2?: number; bia?: number; hocTap?: number; goi7?: number; kimCuong?: number; thuHoiLuc?: string } & Record<string, unknown>

/** Hạn đệm phạm vi / câu chặn của thầy cho từng em (và cờ OMNI của em). */
export const HAN_EM_MS = 5 * 60_000
/** Hạn tập câu bảo vệ ca thi (dùng chung isolate). Isolate ghi bảng `ca` ⇒ xoá ngay (`xoaBaoVeNhanh`, gọi từ `xoaDemCaBaoVe`). */
export const HAN_BAO_VE_MS = 5 * 60_000
/** Hạn câu riêng đã nhớ (câu đổi đáp án ⇒ version đổi ⇒ đường thường báo `cau_doi`; hạn này chỉ để đệm không giữ bản cũ quá lâu). */
export const HAN_CAU_MS = 30 * 60_000
/** Phiên `answer` chấp nhận tới 2 giờ sau khi mở (game-v2.ts) — chấm nhanh dừng sớm 1 phút để không bao giờ chấm phiên máy chủ sẽ từ chối. */
const HAN_PHIEN_MS = 2 * 3_600_000 - 60_000
// Trần bộ nhớ: câu riêng ~2–5 KB ⇒ 1.500 câu ≈ ≤ 7,5 MB (150 chặng đang mở / isolate); phiên, em, biên nhận nhỏ.
// 29/10 22:00 ăn kiêng bộ nhớ (`exceededMemory` giờ cao điểm): phiên 600 → 400, câu riêng 1 500 → 800 (~4 MB), em 2 000 → 1 000.
const TOI_DA_PHIEN = 400, TOI_DA_CAU = 800, TOI_DA_EM = 1000, TOI_DA_BIEN_NHAN = 20_000

const phienNho = new Map<string, { sbd: string; phien: PhienNho; luc: number }>()
const cauNho = new Map<string, { q: PrivateQuestion; luc: number }>()
const emNho = new Map<string, { enabled: boolean; blocked: Set<string>; types: string[]; omni: boolean; luc: number }>()
let baoVe: { tap: Set<string>; luc: number } | null = null
const bienNhan = new Set<string>()

const catBot = <K, V>(m: Map<K, V>, toiDa: number) => { while (m.size > toiDa) { const k = m.keys().next().value as K; m.delete(k) } }
const khoaCau = (ref: { qid: string; maDe: string; version: string }) => `${ref.maDe}|${ref.qid}|${ref.version}`

/** Xoá mọi đệm chấm nhanh (test; lệnh khẩn). */
export function xoaChamNhanh(): void { phienNho.clear(); cauNho.clear(); emNho.clear(); baoVe = null; bienNhan.clear(); daLo.clear() }
/** Isolate vừa ghi bảng `ca` (mở / đóng / công bố ca thi…) ⇒ bỏ tập câu bảo vệ đã nhớ — lượt sau phải đọc lại qua đường thường. */
export function xoaBaoVeNhanh(): void { baoVe = null }
dangKySauXoaCaBaoVe(xoaBaoVeNhanh)

/** Nhớ phiên (đúng JSON máy chủ đã đọc) — gọi từ lượt `answer` thường / lượt nạp sau mở chặng. */
export function nhoPhien(id: string, sbd: string, phien: unknown, now = Date.now()): void {
  if (!id || !sbd || !phien || typeof phien !== 'object') return
  phienNho.delete(id); phienNho.set(id, { sbd, phien: phien as PhienNho, luc: now }); catBot(phienNho, TOI_DA_PHIEN)
}
/** Nhớ câu GỐC (chưa xáo, đúng như `currentQuestion` trả — đã qua luật tự luận / kênh số) theo ref của phiên. */
export function nhoCau(ref: { qid: string; maDe: string; version: string }, q: PrivateQuestion, now = Date.now()): void {
  const k = khoaCau(ref); cauNho.delete(k); cauNho.set(k, { q, luc: now }); catBot(cauNho, TOI_DA_CAU)
}
/** Nhớ phạm vi / câu chặn của thầy cho em (`readGameScope`) + em có đang được xét OMNI ở lượt vừa rồi. */
export function nhoEm(sbd: string, control: { enabled?: unknown; blocked?: unknown; types?: unknown }, omni: boolean, now = Date.now()): void {
  const blocked = new Set<string>(Array.isArray(control.blocked) ? control.blocked.map(String) : [])
  const types = Array.isArray(control.types) ? control.types.map(String) : []
  emNho.delete(sbd); emNho.set(sbd, { enabled: control.enabled !== false, blocked, types, omni, luc: now }); catBot(emNho, TOI_DA_EM)
}
/** Nhớ tập câu bảo vệ ca thi (BẢN SAO, trước khi thêm câu chặn riêng của em). */
export function nhoBaoVe(tap: Set<string>, now = Date.now()): void { baoVe = { tap: new Set(tap), luc: now } }
/** Biên nhận `phiên|câu` đã vào đường chấm thường ở isolate này ⇒ lần sau KHÔNG chấm nhanh (dòng 2 sẽ là bản đã lưu). */
export function nhoBienNhan(receipt: string): void {
  bienNhan.add(receipt)
  if (bienNhan.size > TOI_DA_BIEN_NHAN) { const dau = bienNhan.values().next().value as string; bienNhan.delete(dau) }
}
/** Đáp án đã được chấm nhanh (dòng 1 đã xuống máy em) theo biên nhận: lượt nộp lại câu ấy ở isolate này (vd. dòng 2 lỗi rồi gửi lại) chấm theo ĐÚNG đáp án
 *  đã nộp lần đó — biết đáp án rồi nộp lại đáp án khác không được tính. */
const daLo = new Map<string, string>()
export function nhoDaLo(receipt: string, traLoi: string): void { daLo.delete(receipt); daLo.set(receipt, traLoi); catBot(daLo, TOI_DA_BIEN_NHAN) }
export function dapAnDaLo(receipt: string): string | undefined { return daLo.get(receipt) }
/** Phiên đã nhớ đủ câu chưa (để lượt `answer` biết có cần nạp nền cả phiên). */
export function phienDuCau(id: string): boolean {
  const p = phienNho.get(id)
  return !!p && p.phien.questions.every((r) => laQidChanDoan(r.qid) || cauNho.has(khoaCau(r)))
}

/** Thời lượng em làm có thể rơi vào vùng «lướt» không? Cùng cách đọc `docMsLam` (omni-game.ts): số hữu hạn ≥ 0 ⇒ làm tròn; vắng / âm / không phải số ⇒ không đo (không bao giờ lướt). */
function coTheLaLuot(v: unknown): boolean {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  if (!Number.isFinite(n) || n < 0) return false
  return Math.round(n) < THAM_SO_OMNI.LUOT_MS_MAX
}

// DÒNG 1 SỚM TỪ ĐƯỜNG THƯỜNG (29/10, thầy «Bấm kiểm tra vẫn chưa tức thì»): đệm isolate trượt (câu / phiên chưa nằm trong isolate này — gặp nhiều giờ cao điểm khi có nhiều isolate)
// ⇒ trước đây em chờ cả lệnh `answer` (~3 đợt D1: đọc đầu → OMNI → lô ghi) mới thấy đúng / sai. Nay đường thường (game-v2.ts) gửi dòng 1 NGAY khi đã chấm xong sau đợt đọc đầu
// (phiên, câu, phạm vi, đề bảo vệ đều ĐÃ kiểm ở đường thường), không chờ OMNI + lô ghi. Nơi gọi (nop-luong.ts) đăng ký hàm nhận theo đúng đối tượng thân yêu cầu `b`.
const tamSomCua = new WeakMap<object, (d: DongNhanh) => void>()
export function dangKyTamSom(b: object, f: (d: DongNhanh) => void): void { tamSomCua.set(b, f) }
/** Gửi dòng 1 sớm nếu thân yêu cầu `b` có đăng ký (một lần). Trả true khi đã gửi — nơi gọi khi ấy PHẢI nhớ đáp án đã lộ (`nhoDaLo`). */
export function phatTamSom(b: object, d: DongNhanh): boolean {
  const f = tamSomCua.get(b)
  if (!f) return false
  tamSomCua.delete(b)
  try { f(d); return true } catch { return false }
}
export { coTheLaLuot as coTheLaLuotMs }

export type DongNhanh = { ok: true; tam: true; correct: boolean; answer: string; traLoi: string; solution: unknown; solutionImages: unknown[]; khongTinh?: true; omni?: { luot: true } }

/**
 * Chấm từ bộ nhớ. KHÔNG chạm D1, không ghi gì. Trả `null` khi có BẤT KỲ điều gì chưa chắc (đường thường lo, lỗi / lời báo y như cũ).
 * `sbd`: SBD của token đã qua kiểm chữ ký + hạn.
 */
export function chamNhanh(sbd: string, b: Record<string, unknown>, now = Date.now()): DongNhanh | null {
  const id = String(b.session ?? ''), qid = String(b.qid ?? '')
  if (!id || !qid || laQidChanDoan(qid) || bienNhan.has(`${id}|${qid}`)) return null
  const ph = phienNho.get(id)
  if (!ph || ph.sbd !== sbd) return null
  const s = ph.phien
  if (s.doan || s.guardian || s.bia || s.kimCuong === 1 || s.thuHoiLuc) return null
  if (s.hocTap !== 1 && s.goi7 !== 1) return null
  if (!(now - Number(s.created) < HAN_PHIEN_MS)) return null
  const ref = s.questions.find((x) => x.qid === qid)
  if (!ref) return null
  const em = emNho.get(sbd)
  if (!em || now - em.luc > HAN_EM_MS || !em.enabled) return null
  if (!baoVe || now - baoVe.luc > HAN_BAO_VE_MS) return null
  const c = cauNho.get(khoaCau(ref))
  if (!c || now - c.luc > HAN_CAU_MS) return null
  const qGoc = c.q
  if (laCauTuLuan(qGoc) || ngoaiKenhSo(qGoc)) return null
  const q = apXaoTheoRef(qGoc, ref as never)
  if (baoVe.tap.has(q.qid) || baoVe.tap.has(q.group) || em.blocked.has(q.qid) || em.blocked.has(q.group)) return null
  if (em.types.length && (!q.dang || !em.types.includes(q.dang))) return null
  const tra = String(b.answer ?? '').trim()
  if (q.phan === 'I' && !/^[ABCD]$/.test(tra) || q.phan === 'II' && !/^[DS]{4}$/.test(tra) || q.phan === 'III' && (!tra || tra.length > 40)) return null
  const correct = s.hocTap === 1 && q.phan === 'III' ? khopPhanIII(String(b.answer ?? ''), q.correct) : grade(q, String(b.answer ?? ''))
  // OMNI (omni-game.ts): LƯỚT chỉ xảy ra khi SAI (sai ∧ quá nhanh ∧ < 3 lượt/ngày) — cần số đọc D1 ⇒ câu sai của em đang được xét OMNI đi đường thường.
  // 29/10 (thầy «Bấm kiểm tra vẫn chưa tức thì»): NHƯNG ngưỡng lướt luôn nằm trong [LUOT_MS_MIN, LUOT_MS_MAX] = [3 s, 8 s] (omni-toc-do.ts `nguongLuotMs`) ⇒ câu sai làm TỪ 8 giây
  // trở lên (hoặc máy không đo được thời lượng ⇒ `nhanTocDo` = null) KHÔNG BAO GIỜ là lướt ⇒ vẫn chấm nhanh được. Trước: mọi câu sai của em OMNI đều đi đường D1 chậm (~3 đợt).
  if (!correct && em.omni && s.hoa2 === 1 && coTheLaLuot(b.msLam)) return null
  const khongTinh = laPhienNguyenTu(s as unknown as PhienNt) && khongTinhTuDo(boSungKichThuocDe(docDoGiayMot(b, { ms: b.msLam }), q.phan, q), correct)
  return { ok: true, tam: true, correct, answer: q.correct, traLoi: tra, solution: q.solution, solutionImages: q.hinhAnh.filter((h) => h.viTri === 'sau_loi_giai'), ...(khongTinh ? { khongTinh: true as const } : {}) }
}

/**
 * DÒNG 1 TỪ TEM NIÊM PHONG (niem-phong.ts, 29/10 «giờ cao điểm cũng phải tức thì 100%»): tem đã mở (`moNiem`) ⇒ chấm KHÔNG cần phiên / câu / phạm vi trong isolate này,
 * 0 đợt D1 — isolate nào đón lệnh cũng có dòng 1 ngay. Điều kiện thêm so với chấm bằng đệm: biên nhận chưa vào đường thường ở isolate này; isolate đã có tập câu bảo vệ
 * ca thi còn mới ⇒ câu thuộc ca thi bị chặn; phạm vi của em còn mới trong isolate (tạm dừng / câu chặn) ⇒ tôn trọng. Phần còn lại (phiên còn hạn, câu còn trong kho, ca thi…)
 * do lệnh `answer` đầy đủ xét — dòng 2 là bản lưu chuẩn. `null` ⇒ đường thường.
 */
export function chamTuNiem(sbd: string, nd: NoiDungNiem, b: Record<string, unknown>, now = Date.now()): DongNhanh | null {
  const id = String(b.session ?? ''), qid = String(b.qid ?? '')
  if (!id || !qid || nd.q !== qid || laQidChanDoan(qid) || bienNhan.has(`${id}|${qid}`)) return null
  if (baoVe && now - baoVe.luc <= HAN_BAO_VE_MS && (baoVe.tap.has(nd.q) || baoVe.tap.has(nd.g))) return null
  const em = emNho.get(sbd)
  if (em && now - em.luc <= HAN_EM_MS && (!em.enabled || em.blocked.has(nd.q) || em.blocked.has(nd.g))) return null
  const tra = String(b.answer ?? '').trim()
  if (nd.p === 'I' && !/^[ABCD]$/.test(tra) || nd.p === 'II' && !/^[DS]{4}$/.test(tra) || nd.p === 'III' && (!tra || tra.length > 40)) return null
  const correct = nd.p === 'III' ? khopPhanIII(String(b.answer ?? ''), nd.c) : grade({ phan: nd.p, correct: nd.c }, String(b.answer ?? ''))
  // OMNI: câu sai làm dưới 8 giây của phiên Hoá 2.0 có thể là «lướt». Tem mang thời gian kỳ vọng `y` + số lướt hôm nay `u` ⇒ QUYẾT LƯỚT NGAY, không đợt D1 (29/10 thầy «bấm kiểm tra vẫn chậm»:
  // trước đây mọi câu sai nhanh đều đi đường D1 ~2 s). Thiếu `y` (OMNI chưa biết) ⇒ đường thường. Công thức y như `xetOmniTraLoi`: sai ∧ nhãn 'luot' ∧ số lướt < LUOT_TOI_DA_NGAY;
  // số lướt = `u` + `lm` (máy em đếm lướt đã thấy từ lúc tem được niêm phong). Dòng 2 vẫn là bản chuẩn.
  let luot = false
  if (!correct && nd.o === 1 && coTheLaLuot(b.msLam)) {
    if (!(typeof nd.y === 'number' && nd.y > 0)) return null
    const lm = Math.min(20, Math.max(0, Math.round(Number(b.lm)) || 0))
    luot = nhanTocDo(Math.round(Number(b.msLam)), nd.y, false) === 'luot' && (Number(nd.u) || 0) + lm < THAM_SO_OMNI.LUOT_TOI_DA_NGAY
  }
  const d = docDoGiayMot(b, { ms: b.msLam })
  const dKichThuoc = d && d.giay !== null && nd.t >= 0 ? { ...d, tu: nd.t, hinh: nd.h, phan: nd.p } : d // đúng như `boSungKichThuocDe`
  const khongTinh = luot || khongTinhTuDo(dKichThuoc, correct)
  return { ok: true, tam: true, correct, answer: nd.c, traLoi: tra, solution: nd.l, solutionImages: Array.isArray(nd.m) ? nd.m : [], ...(khongTinh ? { khongTinh: true as const } : {}), ...(luot ? { omni: { luot: true as const } } : {}) }
}

/** Câu ĐẦY ĐỦ của mọi ref trong phiên (đúng điều kiện `SQL_CAU_THEO_PHIEN` của game-v2.ts: tờ chưa xoá, chỉ mục khớp bản nguồn). */
const SQL_NAP_PHIEN = `SELECT json_extract(j.value,'$.maDe') AS ma_de, json_extract(j.value,'$.qid') AS qid, json_extract(j.value,'$.version') AS version, q.json AS json
  FROM game_v2_session s, json_each(s.json,'$.questions') j
  JOIN game_v2_question q ON q.ma_de=json_extract(j.value,'$.maDe') AND q.qid=json_extract(j.value,'$.qid') AND q.version=json_extract(j.value,'$.version')
  JOIN de_kho d ON d.ma_de=q.ma_de AND COALESCE(d.da_xoa,0)=0 JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
  WHERE s.id=? AND s.sbd=?`

/**
 * NẠP NỀN cả phiên vào đệm (CHỈ ĐỌC, ngoài đường chờ — `ctx.waitUntil` sau mở chặng / sau lượt `answer` thường thiếu câu): một lô ba câu đọc (phiên + câu + phạm vi)
 * + tập câu bảo vệ ca thi (đệm sẵn của game-v2-bank).
 * Câu song sinh (qid ảo) / chẩn đoán không có trong kho ⇒ bỏ (lượt `answer` thường của câu ấy tự nhớ). Không bao giờ ném.
 */
export async function napPhienNhanh(env: Env, id: string, sbd: string): Promise<void> {
  try {
    if (!id || !sbd) return
    const baoVeSom = protectedQuestions(env)
    baoVeSom.catch(() => {})
    const [ph, cau, pv] = await env.DB.batch<Record<string, unknown>>([
      env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(id, sbd),
      env.DB.prepare(SQL_NAP_PHIEN).bind(id, sbd),
      env.DB.prepare('SELECT json FROM game_v2_scope WHERE sbd=?').bind(sbd),
    ])
    const dong = ph?.results?.[0]
    if (!dong || typeof dong.json !== 'string') return
    const now = Date.now()
    nhoPhien(id, sbd, JSON.parse(dong.json), now)
    // Phạm vi thầy đặt (như `readGameScope`: không có dòng ⇒ mở, không chặn) — chỉ khi chưa có bản mới hơn từ lượt `answer`. Em vừa mở chặng được ⇒ đã qua cổng
    // lịch Kiểm tra ôn tập. OMNI chưa biết ⇒ coi như có (câu sai đi đường thường).
    if (!emNho.has(sbd)) { const j = pv?.results?.[0]?.json; nhoEm(sbd, typeof j === 'string' ? JSON.parse(j) as Record<string, unknown> : { enabled: true, types: [], blocked: [] }, true, now) }
    try { nhoBaoVe(await baoVeSom, Date.now()) } catch { /* đọc lỗi ⇒ không nhớ: không chấm nhanh */ }
    for (const r of cau?.results ?? []) {
      try {
        const q = JSON.parse(String(r.json)) as PrivateQuestion
        if (!q || laCauTuLuan(q) || ngoaiKenhSo(q)) continue
        nhoCau({ maDe: String(r.ma_de), qid: String(r.qid), version: String(r.version) }, q, now)
      } catch { /* câu hỏng: bỏ, đường thường lo */ }
    }
  } catch (e) { console.error('[cham-nhanh] nạp phiên lỗi (bỏ qua):', e instanceof Error ? e.message : e) }
}
