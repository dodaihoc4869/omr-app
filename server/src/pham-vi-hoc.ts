// PHẠM VI HỌC CÁ NHÂN — CNH-1.0 (P02).
//
// Nguồn quyết định: docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md §2:
//
//   eligibleScope(q, student) =
//       q.approved
//       AND every(q.skill_ids, state == taught)
//       AND every(q.prerequisite_ids, state == taught)
//       AND NOT protected(q.qid, q.version, q.content_group)
//
// LUẬT CỨNG của §2 (khoá bằng test):
//   · Nguồn mở kỹ năng: xác nhận của GIÁO VIÊN cho ĐÚNG em; xác nhận học bù; dữ liệu bài học/đề đã công bố có
//     bằng chứng độc lập được chính sách nhập cho phép. V1 KHÔNG tự mở toàn kỹ năng vì gặp/đúng một câu.
//   · Import chỉ đánh dấu `encountered`; giáo viên xác nhận `taught` trước khi mở tự động.
//   · KHÔNG lấy membership lớp làm taught. KHÔNG fallback sang kho lớp khi thiếu (trả `NEED_TAUGHT_SCOPE`).
//   · Nền (prerequisite) dùng AND, KHÔNG dùng OR giữa các nền.
//   · Override giáo viên CHỈ thuộc bài giáo viên chủ động giao, ghi teacher_id + assignment_id + lý do;
//     KHÔNG ghi taught ngầm và KHÔNG mở kho cho game.
//   · Thiếu nhãn kỹ năng / chưa duyệt / bị thu hồi ⇒ KHÔNG phát câu xấu để đủ lượt.
import type { Env } from './kieu'

/** Trạng thái mỗi học sinh/kỹ năng (đặc tả §2). `unknown` = không có dòng trong bảng. */
export type TrangThaiScope = 'unknown' | 'encountered' | 'taught' | 'revoked'

/** Mã lý do loại câu — máy đọc được, dùng chung cho mọi bộ chọn. */
export type LyDoLoaiScope = 'NEED_TAUGHT_SCOPE' | 'THIEU_NHAN' | 'CHUA_DUYET' | 'DE_BAO_VE'

export interface CauXetDuyet {
  qid: string
  version: string
  contentGroup: string
  skillIds: string[]
  prerequisiteIds: string[]
  /** `quality_status` của kho: chỉ `'approved'` mới được phát tự động. */
  qualityStatus: string
}

export interface NgoaiLeGiaoBai {
  /** Kênh được phép dùng ngoại lệ. CHỈ bài giáo viên chủ động giao — không bao giờ là game. */
  kenh: 'btvn_thay_giao'
  assignmentId: string
  teacherId: string
  lyDo: string
  /** qid nằm TRONG đúng bài được giao. */
  qids: ReadonlySet<string>
}

export interface KetQuaScope {
  duoc: boolean
  lyDo?: LyDoLoaiScope
  /** Kỹ năng/nền còn thiếu (chỉ khi `NEED_TAUGHT_SCOPE`), để báo cho giáo viên. */
  thieu?: string[]
  /** Được phát nhưng KHÔNG được lộ lời giải (câu thuộc đề đang bảo vệ nhưng nằm trong bài đã giao). */
  khongLoLoiGiai?: boolean
}

export const TRANG_THAI_HOP_LE: readonly TrangThaiScope[] = ['unknown', 'encountered', 'taught', 'revoked']
export const NGUON_HOP_LE: readonly string[] = ['thay', 'thay_hoc_bu', 'import', 'de_cong_bo']

/** Kỹ năng này đã ĐƯỢC DẠY cho em chưa? `encountered`/`unknown`/`revoked` đều KHÔNG phải taught. */
export const daDuocDay = (phamVi: ReadonlyMap<string, TrangThaiScope>, skill: string): boolean =>
  phamVi.get(skill) === 'taught'

/** Câu bị bảo vệ? Kiểm cả qid LẪN content_group (đặc tả §1.1: "Bản đề bảo vệ phải kiểm cả qid, version và content_group"). */
export const biBaoVe = (cau: { qid: string; contentGroup: string }, baoVe: ReadonlySet<string> | null | undefined): boolean =>
  !!baoVe && (baoVe.has(cau.qid) || baoVe.has(cau.contentGroup))

/**
 * HÀM THUẦN: câu này có được phát cho em theo phạm vi không?
 * Thứ tự kiểm CỐ ĐỊNH: duyệt → nhãn → taught(skill) → taught(nền) → bảo vệ. Không đổi thứ tự vì lý do hiển thị.
 * Ngoại lệ giáo viên bỏ qua được phần `taught` (bài thầy giao) nhưng KHÔNG bỏ qua "chưa duyệt"/"thiếu nhãn".
 */
export function eligibleScope(
  cau: CauXetDuyet,
  phamVi: ReadonlyMap<string, TrangThaiScope>,
  baoVe?: ReadonlySet<string> | null,
  ngoaiLe?: NgoaiLeGiaoBai | null,
): KetQuaScope {
  if (cau.qualityStatus !== 'approved') return { duoc: false, lyDo: 'CHUA_DUYET' }
  if (!Array.isArray(cau.skillIds) || cau.skillIds.length === 0) return { duoc: false, lyDo: 'THIEU_NHAN' }

  const dungNgoaiLe =
    !!ngoaiLe &&
    ngoaiLe.kenh === 'btvn_thay_giao' &&
    ngoaiLe.assignmentId !== '' &&
    ngoaiLe.teacherId !== '' &&
    ngoaiLe.qids.has(cau.qid)

  if (dungNgoaiLe) {
    // Thầy giao đúng câu này: miễn phần `taught`, nhưng câu thuộc đề đang bảo vệ thì KHÔNG lộ lời giải.
    return { duoc: true, ...(biBaoVe(cau, baoVe) ? { khongLoLoiGiai: true } : {}) }
  }

  const thieu = [...cau.skillIds, ...(Array.isArray(cau.prerequisiteIds) ? cau.prerequisiteIds : [])]
    .filter((s) => !daDuocDay(phamVi, s))
  if (thieu.length > 0) return { duoc: false, lyDo: 'NEED_TAUGHT_SCOPE', thieu: [...new Set(thieu)] }

  if (biBaoVe(cau, baoVe)) return { duoc: false, lyDo: 'DE_BAO_VE' }
  return { duoc: true }
}

/** Lọc cả danh sách ứng viên của một bộ chọn: giữ câu đủ điều kiện, trả kèm lý do từng câu bị loại. */
export function locTheoPhamVi(
  cau: readonly CauXetDuyet[],
  phamVi: ReadonlyMap<string, TrangThaiScope>,
  baoVe?: ReadonlySet<string> | null,
  ngoaiLe?: NgoaiLeGiaoBai | null,
): { duoc: CauXetDuyet[]; loai: { qid: string; lyDo: LyDoLoaiScope }[]; khongLoLoiGiai: Set<string> } {
  const duoc: CauXetDuyet[] = []
  const loai: { qid: string; lyDo: LyDoLoaiScope }[] = []
  const khongLoLoiGiai = new Set<string>()
  for (const c of cau) {
    const r = eligibleScope(c, phamVi, baoVe, ngoaiLe)
    if (!r.duoc) { loai.push({ qid: c.qid, lyDo: r.lyDo as LyDoLoaiScope }); continue }
    duoc.push(c)
    if (r.khongLoLoiGiai) khongLoLoiGiai.add(c.qid)
  }
  return { duoc, loai, khongLoLoiGiai }
}

/** Lý do thiếu phạm vi, gộp theo mã để thầy đọc và báo cho giáo viên (không lộ số liệu học sinh khác). */
export function tomTatLyDo(loai: readonly { qid: string; lyDo: LyDoLoaiScope }[]): Record<LyDoLoaiScope, number> {
  const ra: Record<LyDoLoaiScope, number> = { NEED_TAUGHT_SCOPE: 0, THIEU_NHAN: 0, CHUA_DUYET: 0, DE_BAO_VE: 0 }
  for (const x of loai) ra[x.lyDo]++
  return ra
}

// ---------------------------------------------------------------------------
// ADAPTER ĐỌC/GHI PHẠM VI THẬT (D1). Không có bảng ⇒ coi như chưa dạy gì (unknown), KHÔNG ném ra đường học.
// ---------------------------------------------------------------------------

/** Khoá cờ trong `cau_hinh`; giá trị `'bat'` mới lọc theo phạm vi. Chỉ ĐỌC. */
export const KHOA_BAT_PHAM_VI = 'pham_vi_hoc'

/** Đệm cờ trong isolate (giống cổng đóng băng reset): tránh đọc `cau_hinh` mỗi request. */
let demBatPhamVi = { luc: 0, bat: false }
export function xoaDemPhamVi(): void { demBatPhamVi = { luc: 0, bat: false } }

/** Cờ bật lọc phạm vi. LỖI ĐỌC ⇒ `false` (giữ đường cũ) — không để một lỗi tạm làm trống kế hoạch của em. */
export async function phamViBat(env: Env): Promise<boolean> {
  const bayGio = Date.now()
  if (bayGio - demBatPhamVi.luc < 30_000) return demBatPhamVi.bat
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_BAT_PHAM_VI).first<{ gia_tri: string }>()
    demBatPhamVi = { luc: bayGio, bat: String(r?.gia_tri ?? '').trim() === 'bat' }
  } catch {
    demBatPhamVi = { luc: bayGio, bat: false }
  }
  return demBatPhamVi.bat
}

interface DongPhamVi { sbd: string; skill_id: string; state: string; revision: number }

const trangThaiCua = (v: unknown): TrangThaiScope => {
  const s = String(v ?? '').trim().toLowerCase()
  return (TRANG_THAI_HOP_LE as readonly string[]).includes(s) ? (s as TrangThaiScope) : 'unknown'
}

/** Phạm vi của MỘT em: Map kỹ năng → trạng thái. Bảng chưa có ⇒ Map rỗng. */
export async function docPhamVi(env: Env, sbd: string): Promise<Map<string, TrangThaiScope>> {
  const ra = new Map<string, TrangThaiScope>()
  try {
    const r = await env.DB.prepare('SELECT sbd, skill_id, state, revision FROM learner_scope WHERE sbd = ?').bind(sbd).all<DongPhamVi>()
    for (const x of r.results ?? []) ra.set(String(x.skill_id), trangThaiCua(x.state))
  } catch (e) {
    console.error('[pham-vi] chưa có bảng learner_scope:', e instanceof Error ? e.message : e)
  }
  return ra
}

/** Phạm vi của NHIỀU em trong MỘT truy vấn (T01: A và B cùng lớp, khác phạm vi). */
export async function docPhamViNhieu(env: Env, sbds: string[]): Promise<Map<string, Map<string, TrangThaiScope>>> {
  const ra = new Map<string, Map<string, TrangThaiScope>>()
  for (const s of sbds) ra.set(s, new Map())
  if (sbds.length === 0) return ra
  try {
    const r = await env.DB.prepare('SELECT sbd, skill_id, state, revision FROM learner_scope WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sbds)).all<DongPhamVi>()
    for (const x of r.results ?? []) {
      const s = String(x.sbd)
      if (!ra.has(s)) ra.set(s, new Map())
      ra.get(s)!.set(String(x.skill_id), trangThaiCua(x.state))
    }
  } catch (e) {
    console.error('[pham-vi] đọc nhiều em lỗi (coi như chưa dạy gì):', e instanceof Error ? e.message : e)
  }
  return ra
}

/** `revision` lớn nhất của phạm vi một em — nơi phát câu so lại trước khi phát (T12 "cache cũ"). 0 nếu chưa có dòng. */
export async function revisionPhamVi(env: Env, sbd: string): Promise<number> {
  try {
    const r = await env.DB.prepare('SELECT COALESCE(MAX(revision), 0) AS r FROM learner_scope WHERE sbd = ?').bind(sbd).first<{ r: number }>()
    return Number(r?.r) || 0
  } catch { return 0 }
}


/**
 * IMPORT CHỈ ĐÁNH DẤU `encountered` — KHÔNG BAO GIỜ ghi `taught` (đặc tả §2).
 * Không hạ bậc dòng đã `taught`/`revoked` (điều kiện WHERE ở nhánh DO UPDATE).
 */
export async function ghiEncountered(env: Env, sbd: string, skills: string[], moc: string, evidenceRef = ''): Promise<number> {
  const ds = [...new Set(skills.map((s) => String(s ?? '').trim()).filter(Boolean))]
  if (ds.length === 0) return 0
  let n = 0
  for (const skill of ds) {
    const r = await env.DB.prepare(
      `INSERT INTO learner_scope (sbd, skill_id, state, source, evidence_ref, revision, cap_nhat_luc)
       VALUES (?, ?, 'encountered', 'import', ?, 1, ?)
       ON CONFLICT(sbd, skill_id) DO UPDATE SET
         evidence_ref = excluded.evidence_ref, cap_nhat_luc = excluded.cap_nhat_luc
       WHERE learner_scope.state NOT IN ('taught','revoked')`,
    ).bind(sbd, skill, evidenceRef, moc).run()
    n += Number(r.meta?.changes ?? 0)
  }
  return n
}

/**
 * XÁC NHẬN ĐÃ DẠY (giáo viên cho đúng em, hoặc học bù, hoặc đề đã công bố đủ bằng chứng).
 * Từ chối `source = 'import'`: nguồn nhập KHÔNG được tự mở kỹ năng. Bắt buộc có tham chiếu bằng chứng.
 */
export async function ghiTaught(
  env: Env, sbd: string, skill: string, source: string, evidenceRef: string, moc: string,
): Promise<void> {
  if (!(NGUON_HOP_LE as readonly string[]).includes(source) || source === 'import') {
    throw new Error(`Nguồn "${source}" không được phép xác nhận taught (đặc tả §2).`)
  }
  if (!evidenceRef) throw new Error('Xác nhận taught phải kèm tham chiếu bằng chứng (event_id/assignment_id/teacher_id).')
  await env.DB.prepare(
    `INSERT INTO learner_scope (sbd, skill_id, state, source, evidence_ref, revision, cap_nhat_luc)
     VALUES (?, ?, 'taught', ?, ?, 1, ?)
     ON CONFLICT(sbd, skill_id) DO UPDATE SET
       state = 'taught', source = excluded.source, evidence_ref = excluded.evidence_ref,
       revision = learner_scope.revision + 1, cap_nhat_luc = excluded.cap_nhat_luc`,
  ).bind(sbd, skill, source, evidenceRef, moc).run()
}

/** THU HỒI quyền (state = revoked) + tăng revision để nơi phát phát hiện cache cũ (T12). */
export async function thuHoiPhamVi(env: Env, sbd: string, skill: string, lyDo: string, moc: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO learner_scope (sbd, skill_id, state, source, evidence_ref, revision, cap_nhat_luc)
     VALUES (?, ?, 'revoked', 'thay', ?, 1, ?)
     ON CONFLICT(sbd, skill_id) DO UPDATE SET
       state = 'revoked', source = 'thay', evidence_ref = excluded.evidence_ref,
       revision = learner_scope.revision + 1, cap_nhat_luc = excluded.cap_nhat_luc`,
  ).bind(sbd, skill, lyDo, moc).run()
}

/** Chi tiết một dòng phạm vi (UI giáo viên: nguồn, bằng chứng, revision). `null` nếu chưa có dòng. */
export async function docMotScope(
  env: Env, sbd: string, skill: string,
): Promise<{ state: TrangThaiScope; source: string; evidenceRef: string; revision: number } | null> {
  try {
    const r = await env.DB.prepare('SELECT state, source, evidence_ref, revision FROM learner_scope WHERE sbd = ? AND skill_id = ?').bind(sbd, skill)
      .first<{ state: string; source: string; evidence_ref: string; revision: number }>()
    if (!r) return null
    return { state: trangThaiCua(r.state), source: String(r.source), evidenceRef: String(r.evidence_ref ?? ''), revision: Number(r.revision) || 0 }
  } catch { return null }
}

