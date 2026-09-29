// THUẬT TOÁN 2.0 — NỐI VÀO GAME (Bát Linh Đảo, Đoàn Hộ Tống) + lệnh `hoa2-*` của app học sinh.
// Chỉ chạy khi `cheDo2(env, sbd)` (cờ `cau_hinh.game_hoa_2`); cờ tắt ⇒ game đi đường cũ nguyên vẹn.
// Luật chơi giữ nguyên; chỉ đổi NGUỒN CÂU: Đảo nhận câu mới + câu ôn Đúng–sai, Đoàn nhận câu ôn Trắc nghiệm/Trả lời ngắn,
// đúng kế hoạch ngày đã chốt (`layKeHoachHomNay`). Đảo khoá khi còn câu ôn hôm nay ở Đoàn.
import type { Env } from './kieu'
import type { PrivateQuestion, Question } from '../../src/game/than-thu-v2/core'
import { publicQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from './cam-tu-luan'
import { doDayDu, napDayDuMem, protectedQuestions, type CauPool } from './game-v2-bank'
import { chiaLuot, chonPhuongAnGach, danXenLuot, moDuocRuong, nhanNo, phanLoaiDanXen, sucEmCua, type CauDanXen, type NguonNhan, type SucEm, type TrangThaiCau } from './srs2-loi'
import { coGoiY, docHangEm, docHoSo2, docLichSuCoNguon, docNhanNo, ganNguonDuoi, layKeHoachHomNay, LOI_KHOA_DAO, ngayVnCua, qidGoc, sanh2, type HoSo2, type MetaCau } from './srs2-d1'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Số câu một chuyến thám hiểm (6 ải) và số câu riêng của một chặng Đoàn (8 hiệp − 2 hiệp trùm). */
export const SO_CAU_CHUYEN = 6
export const SO_CAU_CHANG = 6
/** Rương Bát Linh: vàng (mua phụ kiện ở Cửa hàng), KHÔNG phải EXP — không đụng trần 120 EXP/ngày. */
export const VANG_RUONG = 20

/** Gợi ý M3 gửi xuống máy em: Phần I gạch 2 phương án sai (máy chủ chọn, KHÔNG gửi đáp án); Phần II, III mở trước ô Kiến thức cốt lõi. */
export interface GoiYM3 { gach?: string[]; cotLoi?: string }

/** Ô "Kiến thức cốt lõi" của lời giải (trường `chot`), đọc được mọi cách kho đã lưu. Không có ⇒ không gợi ý kiểu này. */
export function docCotLoi(solution: unknown): string | null {
  let o: unknown = solution
  if (typeof o === 'string') {
    try { o = JSON.parse(o) } catch { return null }
  }
  if (!o || typeof o !== 'object') return null
  const r = o as Row
  const c = r.chot ?? r.kienThucCotLoi ?? r.kien_thuc_cot_loi
  return typeof c === 'string' && c.trim() && !c.includes('[object Object]') ? c.trim() : null
}

export function goiYCho(q: PrivateQuestion, t: TrangThaiCau | undefined, khoa: string): GoiYM3 | null {
  if (!coGoiY(t)) return null
  if (q.phan === 'I' && /^[ABCD]$/.test(q.correct)) return { gach: chonPhuongAnGach(q.correct, khoa) }
  const cotLoi = docCotLoi(q.solution)
  return cotLoi ? { cotLoi } : null
}

/** Câu thứ mấy em làm trong game hôm nay (đếm cả câu này): quá 40 ⇒ không rơi EXP, không rơi vật phẩm (luật Huyết Chiến). */
export async function soCauGameHomNay(env: Env, sbd: string, nowMs: number): Promise<number> {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'game'").bind(sbd, ngayVnCua(nowMs)).first<{ n: number }>().catch(() => null)
  return Number(r?.n) || 0
}

export interface RefPhien { qid: string; maDe: string; version: string; group: string; novel: boolean; role: string; goiY?: GoiYM3; /** Nhãn nợ (Sổ nợ 29/09). */ nhanNo?: string }

/**
 * ĐAN XEN (thầy 29/09): câu của LƯỢT TỚI (chuyến Đảo / chặng Đoàn) — chia phần kế hoạch còn lại theo mật độ của em (`chiaLuot`), lấy lượt
 * đầu, nạp câu đầy đủ, rồi xếp thứ tự trong lượt (`danXenLuot`: mở/kết bằng câu dễ, không 2 khó/2 nợ liền nhau). Tất định: cùng kế hoạch
 * còn lại ⇒ cùng lượt. Câu bị chặn / thiếu siêu dữ liệu bị bỏ TRƯỚC khi chia.
 */
export async function napLuot(env: Env, hs: HoSo2, khoa: readonly string[], chan: ReadonlySet<string>, suc: SucEm, co: number, trumKho = false): Promise<{ q: PrivateQuestion; m: MetaCau }[]> {
  const thay = new Set<string>()
  const ung: CauDanXen[] = []
  for (const k of khoa) {
    const q = qidGoc(k), m = hs.meta.get(q)
    if (thay.has(q) || !m || chan.has(q) || chan.has(m.group)) continue
    thay.add(q)
    ung.push(phanLoaiDanXen(q, hs.tt.get(q), m))
  }
  const luot = chiaLuot(ung, suc, co)[0] ?? []
  const day = await napCau(env, hs, luot.map((x) => x.qid), luot.length, chan)
  const theo = new Map(day.map((x) => [x.q.qid, x]))
  const xep = danXenLuot(luot.filter((x) => theo.has(x.qid)), suc, { trumKho: trumKho && theo.size === co })
  return xep.map((x) => theo.get(x.qid)!)
}
/** Sức em (hạng chung) cho đan xen; lỗi đọc ⇒ trung bình. */
export async function sucEmHomNay(env: Env, sbd: string, hs: HoSo2): Promise<SucEm> {
  return sucEmCua((await docHangEm(env, sbd, hs).catch(() => null))?.hangChung)
}

/** Cỡ lô một truy vấn nạp câu đầy đủ (chặn cỡ tham số JSON; kế hoạch ngày ≤ vài chục câu nên thường chỉ MỘT lô). */
export const LO_NAP_CAU = 40
/**
 * Nạp câu đầy đủ theo thứ tự kế hoạch, bỏ câu đang bảo vệ/tự luận/rút khỏi kho; lấy tối đa `toiDa`.
 * Tối ưu 28/09: trước gọi `doDayDu` TỪNG câu nối tiếp (N+1, ≥ 6 vòng D1 mỗi lượt Đảo/Đoàn); nay nạp theo LÔ ứng viên (một truy vấn IN,
 * ≤ LO_NAP_CAU câu), chỉ nạp lô kế khi lô trước bị loại quá nhiều. Kết quả (thứ tự, luật bỏ câu) y hệt.
 */
export async function napCau(env: Env, hs: HoSo2, khoa: readonly string[], toiDa: number, chan: ReadonlySet<string>): Promise<{ q: PrivateQuestion; m: MetaCau }[]> {
  const ra: { q: PrivateQuestion; m: MetaCau }[] = []
  // Ứng viên theo thứ tự, mỗi qid một lần, đã lọc meta/chặn (không tốn truy vấn).
  const ung: { qid: string; m: MetaCau }[] = []
  const thay = new Set<string>()
  for (const k of khoa) {
    const qid = qidGoc(k)
    if (thay.has(qid)) continue
    thay.add(qid)
    const m = hs.meta.get(qid)
    if (!m || chan.has(qid) || chan.has(m.group)) continue
    ung.push({ qid, m })
  }
  let i = 0
  while (ra.length < toiDa && i < ung.length) {
    const lo = ung.slice(i, i + Math.min(LO_NAP_CAU, Math.max(toiDa - ra.length + 2, 8)))
    i += lo.length
    let day: Map<string, PrivateQuestion>
    try { day = await napDayDuMem(env, lo.map((x) => ({ maDe: x.m.maDe, qid: x.qid, version: x.m.version }))) } catch { continue } // lỗi đọc lô: bỏ lô như bỏ câu (hành vi cũ)
    for (const x of lo) {
      if (ra.length >= toiDa) break
      const q = day.get(`${x.m.maDe}|${x.qid}|${x.m.version}`)
      if (!q || laCauTuLuan(q)) continue // câu vừa sửa/rút khỏi kho hoặc tự luận: bỏ qua
      ra.push({ q, m: x.m })
    }
  }
  return ra
}

/** Điều kiện SQL (bảng `game_v2_session` bí danh `s`): phiên Bi-a Phản Ứng còn mở (chưa `dong`). */
export const DK_PHIEN_BIA_MO = "json_extract(s.json,'$.bia') = 1 AND COALESCE(json_extract(s.json,'$.dong'),0) = 0"
/** Điều kiện SQL: phiên Game Hóa 2.0 của Đảo/Đoàn (không phải Bi-a). */
export const DK_PHIEN_DAO_DOAN = "json_extract(s.json,'$.hoa2') = 1 AND COALESCE(json_extract(s.json,'$.bia'),0) = 0"
/**
 * Câu đang GIỮ trong các phiên còn hạn (< 2 giờ) thoả `dieuKien` mà em CHƯA trả lời — để Đảo/Đoàn và Bi-a không phát trùng câu của nhau
 * (Bi-a Phản Ứng, đặc tả mục 4.7). Lỗi đọc ⇒ tập rỗng (không chặn thêm, hành vi cũ).
 */
export async function cauDangGiu(env: Env, sbd: string, nowMs: number, dieuKien: string): Promise<Set<string>> {
  const ra = new Set<string>()
  try {
    const r = await env.DB.prepare(`SELECT s.id AS id, s.json AS json FROM game_v2_session s WHERE s.sbd = ? AND s.created_at >= ? AND ${dieuKien}`)
      .bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).all<Row>()
    const phien = r.results ?? []
    if (!phien.length) return ra
    const da = await env.DB.prepare('SELECT session, qid FROM game_v2_attempt WHERE sbd = ? AND session IN (SELECT value FROM json_each(?))')
      .bind(sbd, JSON.stringify(phien.map((x) => str(x.id)))).all<Row>()
    const daTraLoi = new Set((da.results ?? []).map((x) => `${str(x.session)}|${str(x.qid)}`))
    for (const x of phien) {
      const qs = (JSON.parse(str(x.json)) as { questions?: RefPhien[] }).questions ?? []
      for (const q of qs) if (!daTraLoi.has(`${str(x.id)}|${q.qid}`)) ra.add(q.qid)
    }
  } catch { /* lỗi đọc: không chặn thêm */ }
  return ra
}

/** Bàn Bi-a (ván A.I / online) chỉ giữ câu của ván đang diễn ra trong ngần này; quá hạn coi như em đã bỏ bàn (sửa lỗi 29/09). */
export const HAN_GIU_BAN_BIA_MS = 30 * 60_000
/**
 * Em mở Đảo/Đoàn ⇒ Bi-a KHÔNG được "ăn" mất câu (sửa lỗi 29/09: phiên "Trả lời câu hỏi" em tắt máy không gọi `dong` giữ 4 câu cuối 2 giờ,
 * Đảo báo nhầm "ca kiểm tra"). Đóng NGAY mọi phiên chỉ-trả-lời (`chiCau`) còn mở và mọi bàn Bi-a mở quá `HAN_GIU_BAN_BIA_MS`
 * (câu chưa trả lời về lại kế hoạch; `bi_a_van` để nguyên cho `bia-ket-van`). Trả câu còn giữ ở bàn đang chơi thật (< 30 phút).
 */
export async function nhaCauBiaChoDaoDoan(env: Env, sbd: string, nowMs: number): Promise<Set<string>> {
  await env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.dong', 1) WHERE sbd = ? AND json_extract(json,'$.bia') = 1 AND COALESCE(json_extract(json,'$.dong'),0) = 0
      AND (COALESCE(json_extract(json,'$.chiCau'),0) = 1 OR created_at < ?)`).bind(sbd, new Date(nowMs - HAN_GIU_BAN_BIA_MS).toISOString()).run().catch(() => null)
  return cauDangGiu(env, sbd, nowMs, DK_PHIEN_BIA_MO)
}

/** Lời báo khi lượt Đảo/Đoàn RỖNG — nói ĐÚNG lý do (trước 29/09 mọi trường hợp đều báo "ca kiểm tra"). */
export const LOI_LUOT_RONG = {
  cau_dang_bao_ve: 'Các câu còn lại hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.',
  cau_dang_o_bia: 'Các câu còn lại đang nằm trên bàn Bi-a em đang chơi. Em chơi xong hoặc thoát ván Bi-a rồi quay lại nhé.',
  chua_nap_duoc: 'Chưa tải được câu hôm nay (kho câu đang cập nhật). Em thử lại sau ít phút nhé.',
} as const
/** Chẩn đoán vì sao `napLuot` rỗng trên các khoá còn lại: ca khoá > bàn Bi-a giữ > không nạp được. */
export function lyDoLuotRong(khoa: readonly string[], hs: Pick<HoSo2, 'meta'>, chanCa: ReadonlySet<string>, giuBia: ReadonlySet<string>): keyof typeof LOI_LUOT_RONG {
  const qs = khoa.map(qidGoc)
  if (qs.some((q) => chanCa.has(q) || chanCa.has(hs.meta.get(q)?.group ?? '\u0000'))) return 'cau_dang_bao_ve'
  if (qs.some((q) => giuBia.has(q))) return 'cau_dang_o_bia'
  return 'chua_nap_duoc'
}
/** Lời báo hết câu có nhắc câu tạm hoãn vì ca (không lộ câu nào). */
const loiTamHoan = (n: number): string => (n > 0 ? ` Còn ${n} câu đang dùng cho ca kiểm tra, để dành hôm khác.` : '')

/**
 * Lượt Bát Linh Đảo (chuyến thám hiểm 6 ải) ở chế độ 2.0.
 * - Còn câu ôn hôm nay ở Đoàn ⇒ khoá, trả đúng lời thầy.
 * - Lượt đang chờ (chưa trả lời câu nào) ⇒ trả lại chính lượt ấy.
 * - Thứ tự trong chuyến: ĐAN XEN (thầy 29/09, `napLuot`) — mở/kết bằng câu dễ, không 2 câu khó/2 câu nợ liền nhau; em khá/giỏi Trùm là câu khó nhất.
 */
export async function startDao2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const tamHoan = kh.tamHoan?.ca ?? 0
  const tomTat = { theLuc: { con: kh.conDao.length + kh.conDoan.length, tong: kh.tong }, dao: { con: kh.conDao.length }, doan: { con: kh.conDoan.length }, ...(tamHoan ? { tamHoan } : {}) }
  if (kh.conDoan.length) return { ok: true, questions: [], lyDo: 'khoa_cho_doan', khoaDao: true, message: LOI_KHOA_DAO, ...tomTat }
  if (!kh.conDao.length) return { ok: true, questions: [], lyDo: 'xong_ke_hoach', het: true, message: kh.tong ? `Hôm nay em xong rồi.${loiTamHoan(tamHoan)} Mai quay lại khám phá tiếp nhé.` : tamHoan ? `Các câu hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.` : 'Hôm nay chưa có câu nào cho em. Thầy giao chiến dịch là đảo mở.', ...tomTat }
  const dangCho = await env.DB.prepare(`SELECT id, json FROM game_v2_session s WHERE sbd = ? AND created_at >= ? AND json_extract(json,'$.hoa2') = 1 AND COALESCE(json_extract(json,'$.doan'),0) = 0 AND COALESCE(json_extract(json,'$.bia'),0) = 0
      AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id) ORDER BY created_at DESC LIMIT 1`).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).first<Row>().catch(() => null)
  if (dangCho) {
    const cu = JSON.parse(str(dangCho.json)) as { questions: RefPhien[] }
    if (cu.questions.every((r) => kh.conDao.some((k) => qidGoc(k) === r.qid))) {
      const day = await napCau(env, hs, cu.questions.map((r) => r.qid), SO_CAU_CHUYEN, new Set())
      if (day.length === cu.questions.length) return { ok: true, id: str(dangCho.id), questions: day.map(({ q }, i) => ({ ...publicQuestion(q), vai: cu.questions[i]!.role, ...(cu.questions[i]!.goiY ? { goiY: cu.questions[i]!.goiY } : {}), ...(cu.questions[i]!.nhanNo ? { nhanNo: cu.questions[i]!.nhanNo } : {}) })), ...tomTat }
    }
  }
  const chanCa = await protectedQuestions(env)
  const giuBia = await nhaCauBiaChoDaoDoan(env, sbd, nowMs) // phiên chỉ-trả-lời / bàn bỏ dở nhả câu; câu trên bàn đang chơi không ra Đảo
  const chan = new Set([...chanCa, ...giuBia])
  // ĐAN XEN (thầy 29/09): chuyến mở/kết bằng câu dễ, không 2 câu khó / 2 câu nợ liền nhau, mật độ theo sức em.
  // Em khá/giỏi, chuyến đủ 6 ải: ải 6 (Trùm) vẫn là câu khó nhất (thầy 28/09); em yếu/TB kết chuyến bằng câu dễ.
  const suc = await sucEmHomNay(env, sbd, hs)
  const chon = await napLuot(env, hs, kh.conDao, chan, suc, SO_CAU_CHUYEN, suc === 'kha')
  if (!chon.length) { const lyDo = lyDoLuotRong(kh.conDao, hs, chanCa, giuBia); return { ok: true, questions: [], lyDo, message: LOI_LUOT_RONG[lyDo], ...tomTat } }
  const nhan = await docNhanNo(env, sbd, hs, chon.map(({ q }) => q.qid)).catch(() => new Map<string, string>())
  const refs: RefPhien[] = chon.map(({ q, m }, i) => {
    const t = hs.tt.get(q.qid)
    const g = goiYCho(q, t, `${sbd}|${q.qid}|${kh.ngay}`)
    const n = nhan.get(q.qid)
    return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: !!t?.laMoi, role: i === chon.length - 1 && chon.length === SO_CAU_CHUYEN ? 'trum' : t?.laMoi ? 'moi' : 'on_lai', ...(g ? { goiY: g } : {}), ...(n ? { nhanNo: n } : {}) }
  })
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, questions: refs }), new Date(nowMs).toISOString()).run()
  return { ok: true, id, questions: chon.map(({ q }, i) => ({ ...publicQuestion(q), vai: refs[i]!.role, ...(refs[i]!.goiY ? { goiY: refs[i]!.goiY } : {}), ...(refs[i]!.nhanNo ? { nhanNo: refs[i]!.nhanNo } : {}) })), ...tomTat }
}

/** Phiên câu riêng của em cho MỘT chặng Đoàn (gọi nội bộ từ `taoNguoi`). Chặng ít câu ôn thì ngắn lại, không độn câu. */
export async function startDoan2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  if (!kh.conDoan.length) return { ok: true, questions: [], lyDo: 'xong_on_hom_nay', message: kh.conDao.length ? 'Em đã phá hết ổ phục kích hôm nay. Cầu sang Bát Linh Đảo đã hạ — ra đảo khám phá nhé.' : `Hôm nay em không còn câu ôn nào.${loiTamHoan(kh.tamHoan?.ca ?? 0)} Mai quay lại hộ tống nhé.` }
  // Câu đã nằm trong một phiên Đoàn chưa chốt hết của hôm nay thì không phát lại ở phiên khác.
  const r = await env.DB.prepare(`SELECT json FROM game_v2_session WHERE sbd = ? AND created_at >= ? AND json_extract(json,'$.hoa2') = 1 AND json_extract(json,'$.doan') = 1`).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).all<Row>().catch(() => ({ results: [] as Row[] }))
  const dangPhat = new Set<string>()
  for (const x of r.results ?? []) for (const q of (JSON.parse(str(x.json)) as { questions: RefPhien[] }).questions) dangPhat.add(q.qid)
  const chanCa = await protectedQuestions(env)
  const chanBia = await nhaCauBiaChoDaoDoan(env, sbd, nowMs) // phiên chỉ-trả-lời / bàn bỏ dở nhả câu; câu trên bàn đang chơi không ra Đoàn
  const chan = new Set(chanCa)
  for (const q of dangPhat) chan.add(q)
  for (const q of chanBia) chan.add(q)
  // ĐAN XEN (thầy 29/09): chặng của TỪNG em theo sức em (mỗi em câu riêng).
  const suc = await sucEmHomNay(env, sbd, hs)
  let chon = await napLuot(env, hs, kh.conDoan, chan, suc, SO_CAU_CHANG)
  if (!chon.length) { const lai = new Set(chanCa); for (const q of chanBia) lai.add(q); chon = await napLuot(env, hs, kh.conDoan, lai, suc, SO_CAU_CHANG) } // phiên cũ bỏ dở: phát lại
  if (!chon.length) { const lyDo = lyDoLuotRong(kh.conDoan, hs, chanCa, chanBia); return { ok: true, questions: [], lyDo, message: LOI_LUOT_RONG[lyDo] } }
  const nhan = await docNhanNo(env, sbd, hs, chon.map(({ q }) => q.qid)).catch(() => new Map<string, string>())
  const refs: RefPhien[] = chon.map(({ q, m }) => {
    const g = goiYCho(q, hs.tt.get(q.qid), `${sbd}|${q.qid}|${kh.ngay}`)
    const n = nhan.get(q.qid)
    return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: false, role: 'toi_han', ...(g ? { goiY: g } : {}), ...(n ? { nhanNo: n } : {}) }
  })
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, questions: refs }), new Date(nowMs).toISOString()).run()
  return { ok: true, id, questions: chon.map(({ q }, i) => ({ ...publicQuestion(q), role: 'toi_han', ...(refs[i]!.goiY ? { goiY: refs[i]!.goiY } : {}), ...(refs[i]!.nhanNo ? { nhanNo: refs[i]!.nhanNo } : {}) })), soCauThieu: Math.max(0, SO_CAU_CHANG - chon.length) }
}

// ---------------------------------------------------------------- lệnh hoa2-* của app học sinh
export const LENH_HOA2: ReadonlySet<string> = new Set(['hoa2-sanh', 'hoa2-cau-da-lam', 'hoa2-cau-chi-tiet', 'hoa2-ruong-mo'])

export async function hoa2Action(env: Env, sbd: string, action: string, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  if (action === 'hoa2-sanh') return sanh2(env, sbd, nowMs)
  if (action === 'hoa2-cau-da-lam') return cauDaLam(env, sbd, nowMs)
  if (action === 'hoa2-cau-chi-tiet') return cauChiTiet(env, sbd, b)
  if (action === 'hoa2-ruong-mo') return moRuong(env, sbd, nowMs)
  return { ok: false, error: 'Lệnh không hợp lệ.' }
}

/** Nhóm "chiến dịch" giả cho câu ôn NGOÀI chiến dịch (câu sai trong ca kiểm tra đã công bố — nguồn `ca_sai` của `docHoSo2`). */
export const NHOM_CAU_ON_CA = 'cau-sai-ca-kiem-tra'
/** Nhóm giả cho câu nợ vì sai khi Lên bảng / Kiểm tra đầu giờ ngoài mọi chiến dịch và ca (Sổ nợ 29/09). */
export const NHOM_CAU_SAI_TAI_LOP = 'cau-sai-tai-lop'
/** Nguồn của một lần làm, hiện cạnh lịch sử câu: Bi-a / Đoàn Hộ Tống / Bát Linh Đảo / Ca kiểm tra / Lên bảng / Kiểm tra đầu giờ; nguồn khác ⇒ 'khac'. */
export type NguonLanLam = NguonNhan
/**
 * Gắn nguồn cho từng lần trong `lichSu` của các câu đã liệt kê (một truy vấn sổ, `docLichSuCoNguon`) và nhãn nợ `nhan`
 * ("Sai 2 lần · Ca 26/09 · Lên bảng 28/09") cho câu chưa thành thạo. Lỗi đọc ⇒ để trống nguồn (không làm hỏng danh sách).
 */
async function ganNguonLanLam(env: Env, sbd: string, cau: Record<string, unknown>[], hs: HoSo2): Promise<void> {
  if (!cau.length) return
  const ls = await docLichSuCoNguon(env, sbd, cau.map((c) => str(c.qid))).catch(() => null)
  for (const c of cau) {
    const goc = c.lichSu as TrangThaiCau['lichSu']
    const coNguon = ls ? ganNguonDuoi(goc, ls.get(str(c.qid))) : null
    if (coNguon) c.lichSu = coNguon
    const t = hs.tt.get(str(c.qid))
    if (t && !t.thanhThao) {
      const n = nhanNo(coNguon ?? goc, t.ngayChua ?? null, hs.chienDichCuCuaCau?.get(str(c.qid)) ?? null)
      if (n) c.nhan = n
    }
  }
}

/** Danh sách câu em ĐÃ làm trong mọi chiến dịch + câu ôn ngoài chiến dịch em đã làm (câu chưa làm không hiện). */
async function cauDaLam(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const homNay = ngayVnCua(nowMs)
  const hs = await docHoSo2(env, sbd, homNay)
  const cds = (await env.DB.prepare("SELECT id, ten, han_nop, qid_json FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC").bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
  const chienDich = cds.map((c) => ({ id: str(c.id), ten: str(c.ten), hanNop: str(c.han_nop), qids: (JSON.parse(str(c.qid_json) || '[]') as string[]).map(String) }))
  const cau: Record<string, unknown>[] = []
  const daCo = new Set<string>()
  for (const c of chienDich) {
    c.qids.forEach((qid, i) => {
      const t = hs.tt.get(qid), m = hs.meta.get(qid)
      if (!t || !m || t.laMoi || daCo.has(qid)) return
      daCo.add(qid)
      cau.push({
        qid, chienDichId: c.id, stt: i + 1, phan: m.phan, mucDo: m.mucDo, tenDang: m.tenDang ?? m.dang,
        trangThai: t.catTia ? 'can_day_lai' : t.thanhThao ? 'thanh_thao' : 'dang_on', lanCuoiDung: t.lanCuoiDung, henOn: t.henOn, lichSu: t.lichSu,
      })
    })
  }
  // Câu ôn NGOÀI chiến dịch (câu sai trong ca kiểm tra đã công bố): Đoàn và Bi-a phát câu ôn trước ⇒ em làm rồi thì phải thấy ở đây
  // (thầy 28/09: "Phải lưu câu đã làm ở game bia nữa").
  const ngoai: string[] = []
  for (const qid of hs.qidCaSai ?? []) {
    const t = hs.tt.get(qid), m = hs.meta.get(qid)
    if (!t || !m || t.laMoi || daCo.has(qid)) continue
    daCo.add(qid)
    ngoai.push(qid)
    cau.push({
      qid, chienDichId: NHOM_CAU_ON_CA, stt: ngoai.length, phan: m.phan, mucDo: m.mucDo, tenDang: m.tenDang ?? m.dang,
      trangThai: t.catTia ? 'can_day_lai' : t.thanhThao ? 'thanh_thao' : 'dang_on', lanCuoiDung: t.lanCuoiDung, henOn: t.henOn, lichSu: t.lichSu,
    })
  }
  if (ngoai.length) chienDich.push({ id: NHOM_CAU_ON_CA, ten: 'Câu sai trong ca kiểm tra', hanNop: '', qids: ngoai })
  // SỔ NỢ (29/09): câu sai khi Lên bảng / Kiểm tra đầu giờ ngoài mọi chiến dịch và ca.
  const taiLop: string[] = []
  for (const qid of hs.qidSaiTaiLop ?? []) {
    const t = hs.tt.get(qid), m = hs.meta.get(qid)
    if (!t || !m || t.laMoi || daCo.has(qid)) continue
    daCo.add(qid)
    taiLop.push(qid)
    cau.push({
      qid, chienDichId: NHOM_CAU_SAI_TAI_LOP, stt: taiLop.length, phan: m.phan, mucDo: m.mucDo, tenDang: m.tenDang ?? m.dang,
      trangThai: t.catTia ? 'can_day_lai' : t.thanhThao ? 'thanh_thao' : 'dang_on', lanCuoiDung: t.lanCuoiDung, henOn: t.henOn, lichSu: t.lichSu,
    })
  }
  if (taiLop.length) chienDich.push({ id: NHOM_CAU_SAI_TAI_LOP, ten: 'Câu sai khi lên bảng', hanNop: '', qids: taiLop })
  await ganNguonLanLam(env, sbd, cau, hs)
  return { ok: true, chienDich: chienDich.map(({ qids, ...c }) => ({ ...c, tong: qids.length })), cau }
}

/** Đề + đáp án + lời giải của câu em ĐÃ làm (đáp án không bao giờ xuống máy trước khi em làm câu đó). Tối đa 60 câu/lượt (tải PDF). */
async function cauChiTiet(env: Env, sbd: string, b: Row): Promise<Record<string, unknown>> {
  const qids = (Array.isArray(b.qids) ? b.qids : [b.qid]).map(str).filter(Boolean).slice(0, 60)
  if (!qids.length) return { ok: false, error: 'Thiếu câu cần xem.' }
  const daLam = await env.DB.prepare(`SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?)) AND COALESCE(visibility,'released') <> 'embargoed'`).bind(sbd, JSON.stringify(qids)).all<Row>()
    .catch(() => env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))').bind(sbd, JSON.stringify(qids)).all<Row>())
  const duoc = new Set((daLam.results ?? []).map((x) => str(x.qid)))
  const hs = await docHoSo2(env, sbd, ngayVnCua(Date.now()))
  const ra: Record<string, unknown>[] = []
  for (const qid of qids) {
    if (!duoc.has(qid)) continue
    const m = hs.meta.get(qid)
    if (!m) continue
    try {
      const [q] = await doDayDu(env, [{ qid, maDe: m.maDe, version: m.version, nhe: true } as unknown as CauPool])
      if (!q) continue
      const tl = await env.DB.prepare("SELECT json_extract(json,'$.traLoi') AS t FROM game_v2_attempt WHERE sbd = ? AND qid = ? ORDER BY created_at DESC LIMIT 1").bind(sbd, qid).first<Row>().catch(() => null)
      ra.push({ de: publicQuestionDayDu(q), dapAn: q.correct, loiGiai: q.solution, emTraLoi: tl?.t == null ? null : str(tl.t) })
    } catch { /* câu đã rút khỏi kho */ }
  }
  return { ok: true, cau: ra }
}
/** Bản đề để XEM LẠI: như bản công khai nhưng giữ cả hình sau lời giải. */
const publicQuestionDayDu = (q: PrivateQuestion): Question => {
  const { correct: _c, solution: _s, reviewed: _r, ...pub } = q
  return pub
}

/** Mở Rương Bát Linh: chỉ khi xong trọn kế hoạch hôm nay; mỗi ngày một lần. Quà = vàng (mua phụ kiện). */
async function moRuong(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh } = await layKeHoachHomNay(env, sbd, nowMs)
  const daLam = kh.tong - kh.conDao.length - kh.conDoan.length
  if (!moDuocRuong(kh.tong, daLam)) {
    // Trả CẢ `loi` (hợp đồng gốc) lẫn `error` (lớp gọi game-v2 chung của app học sinh đọc `error`) — cùng một lời, chỉ-thêm.
    const loi = `Em làm xong ${kh.tong}/${kh.tong} câu hôm nay thì rương mở. Hiện em đã làm ${daLam} câu.`
    return { ok: false, ma: 'chua_du', loi, error: loi }
  }
  const luc = new Date(nowMs).toISOString()
  const qua = { vang: VANG_RUONG }
  const ghi = await env.DB.prepare('INSERT OR IGNORE INTO ruong_bat_linh(sbd, ngay, mo_luc, qua_json) VALUES (?,?,?,?)').bind(sbd, kh.ngay, luc, JSON.stringify(qua)).run()
  if (ghi.meta.changes) {
    // Sổ vàng chỉ nhận loai ∈ {doi, mua, hoan} (CHECK có sẵn; đổi CHECK = đổi lược đồ, không làm). Quà rương ghi là
    // dòng `doi` với exp_tru = 0 (đổi 0 EXP lấy vàng), khoá `ruong-<ngày>` ⇒ nhận diện được và không trùng.
    await env.DB.prepare("INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc) VALUES (?, 'doi', ?, 0, NULL, ?, ?)").bind(sbd, VANG_RUONG, `ruong-${kh.ngay}`, luc).run()
      .catch((e: unknown) => console.error('[ruong-bat-linh] ghi vàng lỗi:', e instanceof Error ? e.message : e))
    return { ok: true, qua, lapLai: false }
  }
  return { ok: true, qua, lapLai: true }
}


