// SNAPSHOT ĐỀ LÚC GIAO — CNH-1.0 (P01, T34).
//
// Nguồn quyết định: docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md §1.1 ("Mọi lần phát câu lưu
// snapshot bất biến gồm nội dung, thứ tự lựa chọn, đáp án hoặc tham chiếu đáp án phía server, chính sách
// chấm và mục đích") và 06-NGHIEM-THU.md T34 ("Chấm theo snapshot v1 hoặc thu hồi có reason; không trộn
// đề cũ/đáp án mới").
//
// LỖ HỔNG ĐÃ ĐO (lý do có tệp này): lúc NỘP, `/hs/on-lai/nop` gọi `layCauChoEm` để đọc lại kho đang sống
// rồi chấm bằng `chamMotCau(x, q)`. Kho đổi đáp án / đảo lựa chọn trong lúc em đang làm ⇒ em bị chấm bằng
// đáp án MỚI của đề CŨ. Không có chỗ nào ghi lại "câu này lúc giao có đáp án gì".
//
// CÁCH CHỮA: ghi ảnh chụp NGAY LÚC GIAO (bảng `cau_snapshot`), rồi lúc nộp:
//   · có snapshot + phiên bản khớp  ⇒ CHẤM BẰNG ĐÁP ÁN TRONG SNAPSHOT (không đọc kho sống);
//   · kho đổi phiên bản / đổi nhóm nội dung / đổi version chính sách ⇒ THU HỒI kèm lý do (không chấm);
//   · không có snapshot cho câu đã trả lời ⇒ THU HỒI (không đoán, không chấm bằng kho sống).
//
// CỜ `cau_snapshot` trong `cau_hinh` MẶC ĐỊNH TẮT: chưa áp migration + chưa bật cờ thì mọi đường giữ
// nguyên hành vi cũ (đúng 07 §3 "bật tính năng theo lớp rủi ro" — không tự bật).
import type { Env } from './kieu'
import { isAnswerCorrect } from './btvn-grading'
import { chamTheoPolicy, ChamInputError, ChamMaterialError, POLICY_MAC_DINH_PHAN_III, POLICY_VERSION, type GradingPolicyId } from '../../src/lib/cham-so-policy'

/** Khoá trong `cau_hinh`; giá trị `'bat'` mới bật. Chỉ ĐỌC, không tự ghi. */
export const KHOA_BAT_SNAPSHOT = 'cau_snapshot'

/** Câu nhìn từ phía máy chủ lúc giao (`PrivateQuestion` có đủ các trường này). */
export interface CauDeGiao {
  qid: string
  version: string
  group: string
  phan: string
  correct: string
}

export interface CauSnapshot {
  snapshotId: string
  sbd: string
  qid: string
  questionVersion: string
  contentGroup: string
  phan: string
  dapAn: string
  gradingPolicy: GradingPolicyId
  policyVersion: string
  issuedAt: number
}

/** Lý do thu hồi — mã máy đọc + câu chữ cho người. Không lộ đáp án, không lộ nguồn đề bảo vệ. */
export const LY_DO_THU_HOI = {
  'kho-doi-phien-ban': 'Câu này vừa được cập nhật. Em mở lại câu để làm bản mới nhé.',
  'chinh-sach-doi-phien-ban': 'Luật chấm của câu này vừa thay đổi. Em mở lại câu để làm bản mới nhé.',
  'thieu-snapshot': 'Chưa có bản ghi lúc giao câu nên chưa chấm được. Em mở lại câu rồi làm lại nhé.',
  'khong-con-trong-kho': 'Câu này không còn trong kho. Em chọn câu khác nhé.',
} as const
export type LyDoThuHoi = keyof typeof LY_DO_THU_HOI

export type QuyetDinh =
  | { kieu: 'tao-moi'; snapshot: CauSnapshot }
  | { kieu: 'dung-snapshot'; snapshot: CauSnapshot }
  | { kieu: 'thu-hoi'; lyDo: LyDoThuHoi; noiDung: string }

/** Băm tất định (FNV-1a hai nhánh) — cùng đầu vào cho cùng `snapshotId`, không cần thư viện ngoài. */
export function hashTatDinh(s: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c + i, 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

export const snapshotIdCua = (qid: string, questionVersion: string, contentGroup: string): string =>
  hashTatDinh(`${qid}\u0000${questionVersion}\u0000${contentGroup}`)

/** Ảnh chụp bất biến: mọi trường chép từ câu lúc giao, KHÔNG đọc lại kho về sau. */
export function taoSnapshot(sbd: string, cau: CauDeGiao, issuedAt: number): CauSnapshot {
  return {
    snapshotId: snapshotIdCua(cau.qid, cau.version, cau.group),
    sbd,
    qid: cau.qid,
    questionVersion: cau.version,
    contentGroup: cau.group,
    phan: cau.phan,
    dapAn: cau.correct,
    gradingPolicy: POLICY_MAC_DINH_PHAN_III,
    policyVersion: POLICY_VERSION,
    issuedAt,
  }
}

const thuHoi = (lyDo: LyDoThuHoi): QuyetDinh => ({ kieu: 'thu-hoi', lyDo, noiDung: LY_DO_THU_HOI[lyDo] })

/**
 * Quyết định dùng / tạo / thu hồi snapshot.
 *
 * `cheDo = 'phat'` (lúc phát câu): chưa có snapshot ⇒ TẠO MỚI từ câu vừa giao.
 * `cheDo = 'nop'` (lúc nộp): chưa có snapshot ⇒ THU HỒI. KHÔNG tạo mới lúc nộp, vì tạo mới lúc nộp nghĩa là
 * chấm đề cũ bằng đáp án đọc từ kho lúc này — đúng cái lỗi cần chặn.
 */
export function quyetDinhSnapshot(
  daCo: CauSnapshot | null,
  cau: CauDeGiao | null,
  sbd: string,
  issuedAt: number,
  cheDo: 'phat' | 'nop',
): QuyetDinh {
  if (!cau) return thuHoi('khong-con-trong-kho')
  if (!daCo) return cheDo === 'phat' ? { kieu: 'tao-moi', snapshot: taoSnapshot(sbd, cau, issuedAt) } : thuHoi('thieu-snapshot')
  if (daCo.policyVersion !== POLICY_VERSION) return thuHoi('chinh-sach-doi-phien-ban')
  if (daCo.questionVersion !== cau.version || daCo.contentGroup !== cau.group) return thuHoi('kho-doi-phien-ban')
  return { kieu: 'dung-snapshot', snapshot: daCo }
}

/** Metadata phía server không đủ để chấm; KHÔNG phải lỗi nhập của học sinh. */
export class LoiChinhSachSnapshot extends Error {
  readonly ma = 'SNAPSHOT_GRADING_POLICY_INVALID'
}

/**
 * Chấm đáp án VÀ policy đã lưu. Legacy snapshot chỉ lưu policy ID/version, không có
 * decimals/requiredUnit: policy cần các trường đó phải chặn, không suy từ kho sống.
 * Giữ boolean cho caller; input unsupported ném ChamInputError trước khi ghi event.
 * Cấu hình snapshot lỗi ném LoiChinhSachSnapshot để caller phân biệt lỗi phía server.
 */
export function chamTheoSnapshot(snapshot: CauSnapshot, emTraLoi: string): boolean {
  if (snapshot.phan !== 'III') return isAnswerCorrect(emTraLoi, snapshot.dapAn, snapshot.phan)
  if (typeof emTraLoi !== 'string' || emTraLoi.length === 0) throw new ChamInputError('answer phải là chuỗi không rỗng')
  if (snapshot.policyVersion !== POLICY_VERSION) throw new LoiChinhSachSnapshot('Phiên bản chính sách chấm chưa được hỗ trợ')
  let result
  try {
    result = chamTheoPolicy({
      policy: snapshot.gradingPolicy,
      policyVersion: snapshot.policyVersion,
      key: snapshot.dapAn,
      answer: emTraLoi,
    })
  } catch (e) {
    if (e instanceof ChamInputError || e instanceof ChamMaterialError) throw new LoiChinhSachSnapshot('Bản ghi lúc giao thiếu chính sách chấm hợp lệ')
    throw e
  }
  if (result.error) throw new ChamInputError(result.error)
  return result.correct
}

/** Đọc cờ bật. LỖI ĐỌC ⇒ `false` (giữ đường cũ) — không để một lỗi tạm làm hỏng việc nộp bài. */
export async function snapshotBat(env: Env): Promise<boolean> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_BAT_SNAPSHOT).first<{ gia_tri: string }>()
    return String(r?.gia_tri ?? '').trim() === 'bat'
  } catch (e) {
    console.error('[cau-snapshot] đọc cờ lỗi, giữ đường cũ:', e instanceof Error ? e.message : e)
    return false
  }
}

interface DongSnapshot {
  snapshot_id: string; sbd: string; qid: string; question_version: string; content_group: string
  phan: string; dap_an: string; grading_policy: string; policy_version: string; issued_at: number
}

const sangSnapshot = (r: DongSnapshot): CauSnapshot => ({
  snapshotId: String(r.snapshot_id),
  sbd: String(r.sbd),
  qid: String(r.qid),
  questionVersion: String(r.question_version),
  contentGroup: String(r.content_group ?? ''),
  phan: String(r.phan),
  dapAn: String(r.dap_an),
  gradingPolicy: String(r.grading_policy) as GradingPolicyId,
  policyVersion: String(r.policy_version),
  issuedAt: Number(r.issued_at),
})

/** Lấy ảnh chụp đã ghi cho (em, câu). Không có ⇒ `null`. Lỗi SQL ⇒ ném để nơi gọi tự quyết định (đóng cửa). */
export async function docSnapshot(env: Env, sbd: string, qid: string): Promise<CauSnapshot | null> {
  const r = await env.DB.prepare(
    `SELECT snapshot_id, sbd, qid, question_version, content_group, phan, dap_an, grading_policy, policy_version, issued_at
       FROM cau_snapshot WHERE sbd = ? AND qid = ?`,
  ).bind(sbd, qid).first<DongSnapshot>()
  return r ? sangSnapshot(r) : null
}

/** Đọc nhiều ảnh chụp trong MỘT truy vấn (tránh N+1 khi em nộp nhiều câu). */
export async function docSnapshotNhieu(env: Env, sbd: string, qids: string[]): Promise<Map<string, CauSnapshot>> {
  const ra = new Map<string, CauSnapshot>()
  if (qids.length === 0) return ra
  const r = await env.DB.prepare(
    `SELECT snapshot_id, sbd, qid, question_version, content_group, phan, dap_an, grading_policy, policy_version, issued_at
       FROM cau_snapshot WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`,
  ).bind(sbd, JSON.stringify(qids)).all<DongSnapshot>()
  for (const x of r.results ?? []) ra.set(String(x.qid), sangSnapshot(x))
  return ra
}

/** Ghi/ghi đè ảnh chụp cho (em, câu). Giao câu mới ⇒ ảnh chụp mới thay ảnh cũ (cùng khoá). */
export async function ghiSnapshot(env: Env, s: CauSnapshot): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO cau_snapshot (sbd, qid, snapshot_id, question_version, content_group, phan, dap_an, grading_policy, policy_version, issued_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(sbd, qid) DO UPDATE SET
       snapshot_id = excluded.snapshot_id,
       question_version = excluded.question_version,
       content_group = excluded.content_group,
       phan = excluded.phan,
       dap_an = excluded.dap_an,
       grading_policy = excluded.grading_policy,
       policy_version = excluded.policy_version,
       issued_at = excluded.issued_at`,
  ).bind(s.sbd, s.qid, s.snapshotId, s.questionVersion, s.contentGroup, s.phan, s.dapAn, s.gradingPolicy, s.policyVersion, s.issuedAt).run()
}
