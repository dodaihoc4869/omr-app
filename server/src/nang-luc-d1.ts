// HỒ SƠ NĂNG LỰC TRÊN D1 — CNH-1.0 (P03). Lớp MỎNG: chỉ đọc/ghi, mọi luật nằm ở `nang-luc.ts` (thuần).
//
// Luật cứng:
//   · Cờ `cau_hinh.nang_luc_v1` MẶC ĐỊNH TẮT ⇒ đường học đang chạy không bị ảnh hưởng.
//   · `skill_snapshot`/`nang_luc_cursor` là PROJECTION từ sổ `su_kien_hoc` (nguồn sự thật). Mất là dựng lại được.
//   · D1 chưa áp `migration-2309-cnh1-su-kien-chuan.sql` ⇒ đọc bằng câu cũ (cột thiếu coi như rỗng), KHÔNG ném ra đường học.
//   · Nhãn kỹ năng/family lấy từ KHO thật (`game_v2_question`), KHÔNG bịa: thiếu nhãn ⇒ đếm và BỎ khỏi mẫu
//     (đúng tinh thần P02 — `baoThieuNhan` nói cho thầy biết cần gắn nhãn gì).
import type { Env } from './kieu'
import { mucTuChu } from '../../src/lib/btvn-nang-do'
import { thieuCot } from './su-kien-hoc'
import {
  anhChupTuSuKien, gopTangDan, POLICY_VERSION,
  type AnhChupNangLuc, type BangNangLuc, type MucDoCau, type NangLucSkill, type SuKienNL,
  type TuyChonNangLuc,
} from './nang-luc'
import type { D1PreparedStatement } from './kieu'

/** Khoá cờ trong `cau_hinh`; `'bat'` mới dùng hồ sơ năng lực mới. Chỉ ĐỌC. */
export const KHOA_BAT_NANG_LUC = 'nang_luc_v1'

let demBat = { luc: 0, bat: false }
export function xoaDemNangLuc(): void { demBat = { luc: 0, bat: false } }

/** Cờ bật. LỖI ĐỌC ⇒ `false` (giữ đường cũ) — không để một lỗi tạm đổi hồ sơ của em. */
export async function nangLucBat(env: Env): Promise<boolean> {
  const bayGio = Date.now()
  if (bayGio - demBat.luc < 30_000) return demBat.bat
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_BAT_NANG_LUC).first<{ gia_tri: string }>()
    demBat = { luc: bayGio, bat: String(r?.gia_tri ?? '').trim() === 'bat' }
  } catch {
    demBat = { luc: bayGio, bat: false }
  }
  return demBat.bat
}

/** Nhãn của một câu, lấy từ KHO THẬT. `contentGroup` thiếu ⇒ chính `qid` (không gộp bừa hai câu khác nhau). */
export interface NhanCau {
  skillIds: string[]
  version: string
  contentGroup: string
  approved: boolean
  /** `null` = kho KHÔNG khai mức ⇒ câu này bị bỏ khỏi mẫu bằng chứng (không đoán mức). */
  difficulty: MucDoCau | null
  /** `null` = chưa có nhãn family trong kho ⇒ KHÔNG bịa thành qid. */
  familyId: string | null
}

export async function docNhanCau(env: Env, qids: readonly string[]): Promise<Map<string, NhanCau>> {
  const ra = new Map<string, NhanCau>()
  const ds = [...new Set(qids.filter(Boolean))]
  for (let i = 0; i < ds.length; i += 400) {
    try {
      const r = await env.DB.prepare(
        `SELECT q.qid, q.version, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
           JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
          WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))`,
      ).bind(JSON.stringify(ds.slice(i, i + 400))).all<{ qid: string; version: string; content_group: string; json: string }>()
      for (const x of r.results ?? []) {
        const qid = String(x.qid)
        if (ra.has(qid)) continue
        let json: Record<string, unknown> = {}
        try { json = JSON.parse(String(x.json)) as Record<string, unknown> } catch { continue }
        const mucTho = json.mucDo ?? json.muc_do
        const chu = typeof mucTho === 'string' ? mucTho : ''
        const difficulty = chu && !/^\s*\d+\s*$/.test(chu) ? mucTuChu(chu) : typeof mucTho === 'number' ? (Math.min(2, Math.max(0, Math.round(mucTho))) as MucDoCau) : null
        const g = String(x.content_group ?? '').trim()
        const fam = json.family ?? json.familyId ?? json.nhom ?? null
        ra.set(qid, {
          skillIds: Array.isArray(json.kienThuc) ? (json.kienThuc as unknown[]).map((k) => String(k).trim()).filter(Boolean) : [],
          version: String(x.version ?? ''), contentGroup: g || qid, approved: json.reviewed === true,
          difficulty, familyId: typeof fam === 'string' && fam.trim() ? fam.trim() : null,
        })
      }
    } catch { /* kho chưa lập chỉ mục: hồ sơ sẽ báo thiếu nhãn, KHÔNG bịa */ }
  }
  return ra
}


/**
 * ĐỌC SỔ của một em → sự kiện đã chuẩn hoá + nhãn kỹ năng/mức/family từ kho.
 * Cột chuẩn (`attempt_id`…) chưa có thì dùng câu SQL CŨ và suy giá trị an toàn.
 */
let coCotChuan: boolean | null = null
export function xoaBietCotChuanNL(): void { coCotChuan = null }

export interface KetQuaDocSo {
  ds: SuKienNL[]
  /** Số dòng bị bỏ vì KHO chưa gắn nhãn kỹ năng (không có bằng chứng năng lực). */
  thieuNhan: number
  /** Số dòng bị bỏ vì kho không khai MỨC (difficulty) — không đoán mức. */
  thieuMuc: number
}

export async function docSuKienNL(env: Env, sbd: string): Promise<KetQuaDocSo> {
  const goc = 'khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de, muc_do'
  const them = ', attempt_id, assistance, visibility, correction_of, purpose, received_at'
  const chay = async (coMoi: boolean) =>
    env.DB.prepare(`SELECT ${goc}${coMoi ? them : ''} FROM su_kien_hoc WHERE sbd = ? ORDER BY ${coMoi ? 'received_at, khoa' : 'luc, khoa'}`)
      .bind(sbd).all<Record<string, unknown>>()
  let r: { results?: Record<string, unknown>[] }
  try {
    r = await chay(coCotChuan !== false)
    coCotChuan = true
  } catch (e) {
    const loi = e instanceof Error ? e.message : String(e)
    if (!thieuCot(loi)) throw e
    coCotChuan = false
    r = await chay(false)
  }
  const hang = r.results ?? []
  const nhan = await docNhanCau(env, hang.map((x) => String(x.qid)))
  const ds: SuKienNL[] = []
  let thieuNhan = 0
  let thieuMuc = 0
  for (const x of hang) {
    const qid = String(x.qid)
    const n = nhan.get(qid)
    if (!n || n.skillIds.length === 0) { thieuNhan++; continue }
    const mucTho = x.muc_do ?? n.difficulty
    const mucChu = typeof mucTho === 'string' ? mucTho.trim() : ''
    const difficulty = typeof mucTho === 'number'
      ? (Math.min(2, Math.max(0, Math.round(mucTho))) as MucDoCau)
      : mucChu && !/^\d+$/.test(mucChu) ? mucTuChu(mucChu) : n.difficulty
    if (difficulty === null) { thieuMuc++; continue }
    const luc = String(x.luc ?? '')
    const nhanLuc = x.received_at === null || x.received_at === undefined ? Date.parse(luc) : Number(x.received_at)
    const vis = String(x.visibility ?? '').trim()
    ds.push({
      eventId: String(x.khoa), attemptId: String(x.attempt_id ?? '').trim() || String(x.khoa), sbd, qid,
      contentGroup: n.contentGroup, familyId: n.familyId, skillIds: n.skillIds, prerequisiteIds: [],
      difficulty, learningDay: String(x.ngay_vn ?? ''), receivedAt: Number.isFinite(nhanLuc) ? nhanLuc : Date.parse(luc),
      correct: x.ket_qua === null || x.ket_qua === undefined ? null : Number(x.ket_qua) === 1,
      assistance: (String(x.assistance ?? '').trim() || 'none') as SuKienNL['assistance'],
      visibility: (vis || 'released') as SuKienNL['visibility'],
      correctionOf: x.correction_of ? String(x.correction_of) : null,
      activeSeconds: x.giay === null || x.giay === undefined ? null : Number(x.giay),
      purpose: x.purpose ? String(x.purpose) : null,
    })
  }
  return { ds, thieuNhan, thieuMuc }
}

// --- Snapshot/cursor trên D1 ---------------------------------------------------

interface HangSnapshot {
  skill_id: string; working_level: number; validated_level: number | null; confidence: number
  family_count: number; day_count: number; last_validated_at: string | null; can_kiem_lai: number
  episode_json: string | null; recent5_json: string; evidence_json: string; nhat_ky_json: string
  cursor_received_at: number; cursor_event_id: string; revision: number
}

export interface AnhChupDoc extends AnhChupNangLuc {
  revision: number
  cursor: { receivedAt: number; eventId: string } | null
  soDong: number
  bam: number
}

/** `so_dong` + `bam` của sổ: dấu hiệu RẺ để biết snapshot còn sạch hay không (một truy vấn, không tải dòng). */
export async function bamSo(env: Env, sbd: string): Promise<{ soDong: number; bam: number }> {
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS n,
            COALESCE(SUM(LENGTH(khoa) + COALESCE(ket_qua, 9) + LENGTH(COALESCE(assistance, '')) +
                         LENGTH(COALESCE(visibility, '')) + COALESCE(received_at, 0) % 100000), 0) AS b
       FROM su_kien_hoc WHERE sbd = ?`,
  ).bind(sbd).first<{ n: number; b: number }>()
  return { soDong: Number(r?.n) || 0, bam: Number(r?.b) || 0 }
}

/** Đọc snapshot đã lưu của một em (kèm đệm sự kiện). Không có ⇒ `null`. */
export async function docAnhChup(env: Env, sbd: string): Promise<AnhChupDoc | null> {
  try {
    const rs = await env.DB.prepare('SELECT * FROM skill_snapshot WHERE sbd = ? ORDER BY skill_id').bind(sbd).all<HangSnapshot>()
    const rows = rs.results ?? []
    if (rows.length === 0) return null
    const rc = await env.DB.prepare('SELECT * FROM nang_luc_cursor WHERE sbd = ?').bind(sbd).first<{ cursor_received_at: number; cursor_event_id: string; revision: number; so_dong: number; bam: number }>()
    const nhatKy: Record<string, SuKienNL[]> = {}
    const skills: NangLucSkill[] = rows.map((x) => {
      try { nhatKy[String(x.skill_id)] = JSON.parse(String(x.nhat_ky_json ?? '[]')) as SuKienNL[] } catch { nhatKy[String(x.skill_id)] = [] }
      const doc = <T>(s: string, macDinh: T): T => { try { return JSON.parse(String(s ?? '')) as T } catch { return macDinh } }
      return {
        sbd, skillId: String(x.skill_id), policyVersion: POLICY_VERSION,
        workingLevel: Number(x.working_level), validatedLevel: x.validated_level === null ? null : Number(x.validated_level),
        confidence: Number(x.confidence), familyCount: Number(x.family_count), dayCount: Number(x.day_count),
        lastValidatedAt: x.last_validated_at ?? null, canKiemLai: Number(x.can_kiem_lai) === 1, denNgay: '',
        recent5: doc(x.recent5_json, []), evidenceRefs: doc(x.evidence_json, []),
        dotDangMo: doc<import('./nang-luc').DotDayLai | null>(x.episode_json ?? 'null', null),
        dot: doc<import('./nang-luc').DotDayLai | null>(x.episode_json ?? 'null', null),
        kyNangNen: [],
      }
    })
    // `dotDangMo` phải suy lại từ `dot` (đợt đã đóng thì KHÔNG chặn xác nhận mức).
    for (const s of skills) s.dotDangMo = s.dot && (s.dot.state === 'needs_teaching' || s.dot.state === 'practicing') ? s.dot : null
    // `kyNangNen` suy lại từ đệm sự kiện (cột không lưu riêng) — dùng để lan tập "dơ" khi correction.
    for (const s of skills) {
      const nen = new Set<string>()
      for (const e of nhatKy[s.skillId] ?? []) for (const p of e.prerequisiteIds) if (p !== s.skillId) nen.add(p)
      s.kyNangNen = [...nen].sort()
    }
    const cursor = rc ? { receivedAt: Number(rc.cursor_received_at), eventId: String(rc.cursor_event_id) } : null
    const bang: BangNangLuc = {
      sbd, policyVersion: POLICY_VERSION, cursor, revision: Number(rc?.revision ?? 1), denNgay: '', skills,
    }
    return {
      bang, nhatKy, revision: Number(rc?.revision ?? 1), cursor,
      soDong: Number(rc?.so_dong ?? -1), bam: Number(rc?.bam ?? -1),
    }
  } catch {
    return null // chưa áp migration ⇒ coi như chưa có snapshot
  }
}

/** Ghi snapshot: thay TOÀN BỘ dòng kỹ năng của em + con trỏ, trong MỘT batch. */
export async function ghiAnhChup(env: Env, anh: AnhChupNangLuc, moc: string, so: { soDong: number; bam: number }): Promise<void> {
  const sbd = anh.bang.sbd
  const lenh: D1PreparedStatement[] = [env.DB.prepare('DELETE FROM skill_snapshot WHERE sbd = ? AND policy_version = ?').bind(sbd, POLICY_VERSION)]
  for (const s of anh.bang.skills) {
    lenh.push(env.DB.prepare(
      `INSERT INTO skill_snapshot (sbd, skill_id, policy_version, working_level, validated_level, confidence,
         family_count, day_count, last_validated_at, can_kiem_lai, episode_state, episode_json, recent5_json,
         evidence_json, nhat_ky_json, cursor_received_at, cursor_event_id, revision, cap_nhat_luc)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      sbd, s.skillId, POLICY_VERSION, s.workingLevel, s.validatedLevel, s.confidence, s.familyCount, s.dayCount,
      s.lastValidatedAt, s.canKiemLai ? 1 : 0, s.dot?.state ?? null, JSON.stringify(s.dot), JSON.stringify(s.recent5),
      JSON.stringify(s.evidenceRefs), JSON.stringify(anh.nhatKy[s.skillId] ?? []),
      anh.bang.cursor?.receivedAt ?? 0, anh.bang.cursor?.eventId ?? '', anh.bang.revision, moc,
    ))
  }
  lenh.push(env.DB.prepare(
    `INSERT INTO nang_luc_cursor (sbd, policy_version, cursor_received_at, cursor_event_id, so_dong, bam, revision, cap_nhat_luc)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(sbd, policy_version) DO UPDATE SET
       cursor_received_at = excluded.cursor_received_at, cursor_event_id = excluded.cursor_event_id,
       so_dong = excluded.so_dong, bam = excluded.bam, revision = excluded.revision, cap_nhat_luc = excluded.cap_nhat_luc`,
  ).bind(sbd, POLICY_VERSION, anh.bang.cursor?.receivedAt ?? 0, anh.bang.cursor?.eventId ?? '', so.soDong, so.bam, anh.bang.revision, moc))
  for (let i = 0; i < lenh.length; i += 25) await env.DB.batch(lenh.slice(i, i + 25))
}


// --- Dựng lại hồ sơ (đầy đủ / tăng dần) ---------------------------------------

/** Sự kiện ĐÃ được gộp từ trước (nằm trong đệm và nội dung y nguyên) — không phải việc mới. */
function daGopRoi(anh: AnhChupNangLuc, e: SuKienNL): boolean {
  for (const k of e.skillIds) {
    const cu = anh.nhatKy[k] ?? []
    if (cu.some((x) => x.eventId === e.eventId && x.correct === e.correct && x.visibility === e.visibility && x.assistance === e.assistance)) return true
  }
  return false
}

/** Mức đã từng xác nhận của từng kỹ năng (để KHÔNG xoá thành tích khi bằng chứng quá hạn — §3.2.6). */
function trangThaiTruoc(anh: AnhChupNangLuc | null): Map<string, { validatedLevel: number | null; lastValidatedAt: string | null }> | undefined {
  if (!anh) return undefined
  const m = new Map<string, { validatedLevel: number | null; lastValidatedAt: string | null }>()
  for (const s of anh.bang.skills) m.set(`${anh.bang.sbd}|${s.skillId}`, { validatedLevel: s.validatedLevel, lastValidatedAt: s.lastValidatedAt })
  return m
}

export interface TuyChonDung {
  /** Ngày VN hiện tại (server). */
  denNgay: string
  /** Giờ máy chủ (ISO) để ghi `cap_nhat_luc`. */
  moc: string
}

/**
 * DỰNG LẠI hồ sơ năng lực của một em rồi LƯU snapshot:
 *   · snapshot SẠCH (sổ không đổi) ⇒ trả luôn, KHÔNG đọc một dòng sự kiện nào;
 *   · có việc mới ⇒ gộp tăng dần; correction/tới-muộn/đổi embargo ⇒ dựng lại đúng kỹ năng đó từ SỔ.
 * Trả chính hồ sơ vừa dựng (nơi gọi không cần đọc lại).
 */
export async function dungLaiNangLuc(env: Env, sbd: string, tuy: TuyChonDung): Promise<BangNangLuc> {
  const so = await bamSo(env, sbd)
  const anhCu = await docAnhChup(env, sbd)
  const tuyChon: TuyChonNangLuc = { denNgay: tuy.denNgay }
  if (anhCu && anhCu.soDong === so.soDong && anhCu.bam === so.bam) {
    anhCu.bang.denNgay = tuy.denNgay // ngày đánh giá có thể đã sang ngày mới dù sổ không đổi
    for (const s of anhCu.bang.skills) s.denNgay = tuy.denNgay
    return anhCu.bang
  }
  const { ds } = await docSuKienNL(env, sbd)
  const truoc = trangThaiTruoc(anhCu)
  const anh = !anhCu
    ? anhChupTuSuKien(sbd, ds, tuyChon, truoc)
    : gopTangDan(anhCu, ds.filter((e) => !daGopRoi(anhCu, e)), tuyChon, () => ds, truoc)
  await ghiAnhChup(env, anh, tuy.moc, so)
  return anh.bang
}

/** Đọc snapshot đã lưu (KHÔNG dựng lại). `null` nếu chưa có/chưa áp migration. */
export async function docNangLucEm(env: Env, sbd: string): Promise<BangNangLuc | null> {
  const a = await docAnhChup(env, sbd)
  return a ? a.bang : null
}

/**
 * CÔNG BỐ kết quả một đợt (ca thi / bài) — chuyển `embargoed → released` cho MỌI câu của đợt đó.
 * Trước công bố, hồ sơ/câu chưa công bố KHÔNG vào bằng chứng năng lực (T47: không suy được đáp án
 * từ chênh lệch ví/bậc/due). Gọi hàm này ở bước công bố (P07 nối vào luồng duyệt điểm).
 */
export async function congBoSuKien(env: Env, nguon: string, maNguon: string): Promise<number> {
  const r = await env.DB.prepare(
    `UPDATE su_kien_hoc SET visibility = 'released' WHERE nguon = ? AND ma_nguon = ? AND COALESCE(visibility, '') = 'embargoed'`,
  ).bind(nguon, maNguon).run()
  return Number((r as { meta?: { changes?: number } }).meta?.changes ?? 0)
}

