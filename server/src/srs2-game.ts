// THUẬT TOÁN 2.0 — NỐI VÀO GAME (Bát Linh Đảo, Đoàn Hộ Tống) + lệnh `hoa2-*` của app học sinh.
// Chỉ chạy khi `cheDo2(env, sbd)` (cờ `cau_hinh.game_hoa_2`); cờ tắt ⇒ game đi đường cũ nguyên vẹn.
// Luật chơi giữ nguyên; chỉ đổi NGUỒN CÂU: Đảo nhận câu mới + câu ôn Đúng–sai, Đoàn nhận câu ôn Trắc nghiệm/Trả lời ngắn,
// đúng kế hoạch ngày đã chốt (`layKeHoachHomNay`). Đảo khoá khi còn câu ôn hôm nay ở Đoàn.
import type { Env } from './kieu'
import type { PrivateQuestion, Question } from '../../src/game/than-thu-v2/core'
import { publicQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from './cam-tu-luan'
import { doDayDu, protectedQuestions, type CauPool } from './game-v2-bank'
import { chonPhuongAnGach, moDuocRuong, xepChuyenDao, type TrangThaiCau } from './srs2-loi'
import { coGoiY, docHoSo2, layKeHoachHomNay, LOI_KHOA_DAO, ngayVnCua, qidGoc, sanh2, type HoSo2, type MetaCau } from './srs2-d1'

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

interface RefPhien { qid: string; maDe: string; version: string; group: string; novel: boolean; role: string; goiY?: GoiYM3 }

/** Nạp câu đầy đủ theo thứ tự kế hoạch, bỏ câu đang bảo vệ/tự luận/rút khỏi kho; lấy tối đa `toiDa`. */
async function napCau(env: Env, hs: HoSo2, khoa: readonly string[], toiDa: number, chan: ReadonlySet<string>): Promise<{ q: PrivateQuestion; m: MetaCau }[]> {
  const ra: { q: PrivateQuestion; m: MetaCau }[] = []
  const daLay = new Set<string>()
  for (const k of khoa) {
    if (ra.length >= toiDa) break
    const qid = qidGoc(k)
    if (daLay.has(qid)) continue
    const m = hs.meta.get(qid)
    if (!m || chan.has(qid) || chan.has(m.group)) continue
    try {
      const [q] = await doDayDu(env, [{ qid, maDe: m.maDe, version: m.version, nhe: true } as unknown as CauPool])
      if (!q || laCauTuLuan(q)) continue
      ra.push({ q, m })
      daLay.add(qid)
    } catch { /* câu vừa sửa/rút khỏi kho: bỏ qua */ }
  }
  return ra
}

/**
 * Lượt Bát Linh Đảo (chuyến thám hiểm 6 ải) ở chế độ 2.0.
 * - Còn câu ôn hôm nay ở Đoàn ⇒ khoá, trả đúng lời thầy.
 * - Lượt đang chờ (chưa trả lời câu nào) ⇒ trả lại chính lượt ấy.
 * - Câu ôn Đúng–sai trước; câu mới dễ → khó: ải 1–2 dễ nhất, câu khó nhất cuối chuyến làm Trùm ải (`xepChuyenDao`).
 */
export async function startDao2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const tomTat = { theLuc: { con: kh.conDao.length + kh.conDoan.length, tong: kh.tong }, dao: { con: kh.conDao.length }, doan: { con: kh.conDoan.length } }
  if (kh.conDoan.length) return { ok: true, questions: [], lyDo: 'khoa_cho_doan', khoaDao: true, message: LOI_KHOA_DAO, ...tomTat }
  if (!kh.conDao.length) return { ok: true, questions: [], lyDo: 'xong_ke_hoach', het: true, message: kh.tong ? 'Hôm nay em xong rồi. Mai quay lại khám phá tiếp nhé.' : 'Hôm nay chưa có câu nào cho em. Thầy giao chiến dịch là đảo mở.', ...tomTat }
  const dangCho = await env.DB.prepare(`SELECT id, json FROM game_v2_session s WHERE sbd = ? AND created_at >= ? AND json_extract(json,'$.hoa2') = 1 AND COALESCE(json_extract(json,'$.doan'),0) = 0
      AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id) ORDER BY created_at DESC LIMIT 1`).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).first<Row>().catch(() => null)
  if (dangCho) {
    const cu = JSON.parse(str(dangCho.json)) as { questions: RefPhien[] }
    if (cu.questions.every((r) => kh.conDao.some((k) => qidGoc(k) === r.qid))) {
      const day = await napCau(env, hs, cu.questions.map((r) => r.qid), SO_CAU_CHUYEN, new Set())
      if (day.length === cu.questions.length) return { ok: true, id: str(dangCho.id), questions: day.map(({ q }, i) => ({ ...publicQuestion(q), vai: cu.questions[i]!.role, ...(cu.questions[i]!.goiY ? { goiY: cu.questions[i]!.goiY } : {}) })), ...tomTat }
    }
  }
  const chan = await protectedQuestions(env)
  // Thầy 28/09: câu ôn Đúng–sai đi trước như cũ; câu mới dễ → khó ⇒ ải 1–2 dễ nhất, ải 6 (Trùm) khó nhất.
  const chon = xepChuyenDao(await napCau(env, hs, kh.conDao, SO_CAU_CHUYEN, chan), (x) => !!hs.tt.get(x.q.qid)?.laMoi, (x) => x.m.mucDo)
  if (!chon.length) return { ok: true, questions: [], lyDo: 'cau_dang_bao_ve', message: 'Các câu hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.', ...tomTat }
  const refs: RefPhien[] = chon.map(({ q, m }, i) => {
    const t = hs.tt.get(q.qid)
    const g = goiYCho(q, t, `${sbd}|${q.qid}|${kh.ngay}`)
    return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: !!t?.laMoi, role: i === chon.length - 1 && chon.length === SO_CAU_CHUYEN ? 'trum' : t?.laMoi ? 'moi' : 'on_lai', ...(g ? { goiY: g } : {}) }
  })
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, questions: refs }), new Date(nowMs).toISOString()).run()
  return { ok: true, id, questions: chon.map(({ q }, i) => ({ ...publicQuestion(q), vai: refs[i]!.role, ...(refs[i]!.goiY ? { goiY: refs[i]!.goiY } : {}) })), ...tomTat }
}

/** Phiên câu riêng của em cho MỘT chặng Đoàn (gọi nội bộ từ `taoNguoi`). Chặng ít câu ôn thì ngắn lại, không độn câu. */
export async function startDoan2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  if (!kh.conDoan.length) return { ok: true, questions: [], lyDo: 'xong_on_hom_nay', message: kh.conDao.length ? 'Em đã phá hết ổ phục kích hôm nay. Cầu sang Bát Linh Đảo đã hạ — ra đảo khám phá nhé.' : 'Hôm nay em không còn câu ôn nào. Mai quay lại hộ tống nhé.' }
  // Câu đã nằm trong một phiên Đoàn chưa chốt hết của hôm nay thì không phát lại ở phiên khác.
  const r = await env.DB.prepare(`SELECT json FROM game_v2_session WHERE sbd = ? AND created_at >= ? AND json_extract(json,'$.hoa2') = 1 AND json_extract(json,'$.doan') = 1`).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).all<Row>().catch(() => ({ results: [] as Row[] }))
  const dangPhat = new Set<string>()
  for (const x of r.results ?? []) for (const q of (JSON.parse(str(x.json)) as { questions: RefPhien[] }).questions) dangPhat.add(q.qid)
  const chan = await protectedQuestions(env)
  for (const q of dangPhat) chan.add(q)
  let chon = await napCau(env, hs, kh.conDoan, SO_CAU_CHANG, chan)
  if (!chon.length) chon = await napCau(env, hs, kh.conDoan, SO_CAU_CHANG, await protectedQuestions(env)) // phiên cũ bỏ dở: phát lại
  if (!chon.length) return { ok: true, questions: [], lyDo: 'cau_dang_bao_ve', message: 'Các câu ôn hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.' }
  const refs: RefPhien[] = chon.map(({ q, m }) => {
    const g = goiYCho(q, hs.tt.get(q.qid), `${sbd}|${q.qid}|${kh.ngay}`)
    return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: false, role: 'toi_han', ...(g ? { goiY: g } : {}) }
  })
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, questions: refs }), new Date(nowMs).toISOString()).run()
  return { ok: true, id, questions: chon.map(({ q }, i) => ({ ...publicQuestion(q), role: 'toi_han', ...(refs[i]!.goiY ? { goiY: refs[i]!.goiY } : {}) })), soCauThieu: Math.max(0, SO_CAU_CHANG - chon.length) }
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

/** Danh sách câu em ĐÃ làm trong mọi chiến dịch (câu chưa làm không hiện). */
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


