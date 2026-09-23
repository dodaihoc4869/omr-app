// CHỐNG LẶP — CNH-1.0 (P04 mục 3–4). Hàm THUẦN: không đọc đồng hồ, không `Math.random`, giữ nguyên
// thứ tự ứng viên mà nơi gọi đưa vào (bộ chọn chịu trách nhiệm sắp hạng tất định).
//
// Nguồn luật: docs/cline-ca-nhan-hoa-2309/02-HOC-TAP-VA-RUT-CAU.md §4.2 (thứ tự ưu tiên 1→8) và
// THAM-SO.json `planning` (maxRoundQuestions 6, maxRegularPerFamilyPerRound 1, maxRepairPerFamilyPerRound 2,
// maxUnknownFamilyPerRound 1) + `learning` (recoveryInterveningTasks 2, recoveryActiveGapSeconds 300).
//
// LUẬT CỨNG:
//   · Quy tắc 1 (an toàn nội dung/phạm vi/quyền công bố) do cổng P02 lo; ở đây là ĐIỀU KIỆN VÀO:
//     `ngoaiPhamVi` ⇒ loại NGAY, không xét gì thêm (không nới bảo vệ để đủ lượt).
//   · Đã cấp trong NHIỆM VỤ ĐANG LÀM ⇒ TRẢ LẠI CÙNG TASK, không phát bản khác ở màn khác.
//   · Cùng `content_group` đã trả lời HÔM NAY bị chặn, TRỪ `repair_retry` do máy chủ tạo rõ; retry đó
//     KHÔNG nhận lại EXP câu và KHÔNG nâng FSRS.
//   · Card ĐẾN HẠN được ôn — module KHÔNG có bất kỳ cooldown 3/14/30 ngày nào ("bỏ các cooldown trái lịch").
//   · Chưa đến hạn thì KHÔNG dùng nguyên văn để lấp số (chỉ được dùng cho transfer/consolidation).
//   · Trong một lượt tối đa 6 câu; mỗi family tối đa 1 câu thường; repair tối đa 2 và phải cách ≥2 nhiệm vụ
//     khác HOẶC ≥300 giây hoạt động; chưa gán family thì tối đa 1 câu.
//   · Family vừa làm hôm nay phải nghỉ với consolidation mới, TRỪ 4 ngoại lệ — mỗi ngoại lệ ghi
//     `repeat_reason` để giải thích được vì sao câu được phát lần nữa.
import type { Env } from './kieu'

/** Mã lý do một ứng viên bị LOẠI (máy đọc được; không lộ qid đề bảo vệ cho học sinh). */
export type LyDoChongLap =
  | 'NGOAI_PHAM_VI'
  | 'DA_LAM_HOM_NAY'
  | 'KHONG_DEN_HAN'
  | 'FAMILY_VUA_LAM'
  | 'TRAN_FAMILY'
  | 'TRAN_CAU_CHUA_FAMILY'
  | 'TRAN_LUOT'

/** Ngoại lệ hợp lệ của luật lặp — GHI RÕ để giải thích (`repeat_reason`). */
export type LyDoNgoaiLe = 'TASK_DANG_LAM' | 'DUE_REVIEW' | 'REPAIR' | 'TEACHER_ASSIGNMENT' | 'PROBE'

export interface UngVienLap {
  qid: string
  /** Nhóm nội dung (bản sao cùng nhóm = một đơn vị chống lặp). */
  contentGroup: string
  /** `null` = kho CHƯA gán family (không bịa) ⇒ chịu trần riêng. */
  familyId: string | null
  difficulty: 0 | 1 | 2
  skillIds: string[]
  /** Card đã đến hạn (`due <= hôm nay`) — KHÔNG so bằng cooldown 3/14/30. */
  denHan: boolean
  /** Mục đích dự kiến cho câu này (`due_review`/`maintenance`/`consolidation`/`transfer`/`repair`…). */
  purpose: string
}

export interface DaChonTrongLuot {
  qid: string
  familyId: string | null
  purpose: string
  contentGroup: string
}

export interface NguCanhChongLap {
  /** Ngày VN hôm nay do MÁY CHỦ quyết. */
  homNay: string
  /** Ứng viên có nằm ngoài phạm vi/quyền/bảo vệ không (cổng P02 quyết). */
  ngoaiPhamVi?: boolean
  /** `content_group` → `taskId` của nhiệm vụ ĐANG MỞ (issued/continuing) chưa hết session. */
  taskDangMo?: ReadonlyMap<string, string>
  /** `content_group` đã có kết quả HÔM NAY của em (mọi nguồn). */
  daLamHomNay?: ReadonlySet<string>
  /** `content_group` có nhiệm vụ `repair_retry` do MÁY CHỦ tạo rõ (được phép lặp trong ngày). */
  retryChoPhep?: ReadonlySet<string>
  /** `family_id` → ngày VN gần nhất family đã có bằng chứng (để giãn cách 1 ngày). */
  familyLanCuoi?: ReadonlyMap<string, string>
  /** `content_group` → `assignmentId` của bài GIÁO VIÊN chủ động giao (ngoại lệ hợp lệ). */
  baiThayGiao?: ReadonlyMap<string, string>
  /** `content_group` của probe TỰ CHỌN đã được cấp. */
  probeChoPhep?: ReadonlySet<string>
  /** Đã chọn trong lượt này (nơi gọi truyền vào để hàm vẫn thuần). */
  daChon?: readonly DaChonTrongLuot[]
  /** Khoảng cách kể từ câu repair trước: số nhiệm vụ khác hoàn tất và giây hoạt động hợp lệ. */
  cachRepair?: { nhiemVu: number; giay: number }
  /** Trần câu một lượt (THAM-SO `maxRoundQuestions`). */
  tranCau?: number
}

export interface KetQuaChongLap {
  duoc: boolean
  lyDo?: LyDoChongLap
  /** Lý do được phát lặp (chỉ khi phát) — bắt buộc cho mọi ngoại lệ của luật giãn family. */
  repeatReason?: LyDoNgoaiLe
  /** Có task đang mở cho đúng `content_group` này ⇒ TRẢ LẠI task cũ, không tạo task mới. */
  dungLaiTask?: string
  /** `repair_retry`: KHÔNG nhận lại EXP câu và KHÔNG nâng FSRS (chỉ luyện lại). */
  khongNhanExpCau?: boolean
  khongNangFsrs?: boolean
}

export const TRAN_CAU_MOT_LUOT = 6
export const TRAN_CAU_THUONG_MOI_FAMILY = 1
export const TRAN_CAU_REPAIR_MOI_FAMILY = 2
export const TRAN_CAU_CHUA_FAMILY = 1
/** Giãn cách tối thiểu giữa HAI câu repair cùng family (02 §4.2.6). */
export const CACH_REPAIR_NHIEM_VU = 2
export const CACH_REPAIR_GIAY = 300

const laRepair = (purpose: string): boolean => purpose === 'repair' || purpose === 'repair_complete' || purpose === 'repair_retry'


/** Trần câu của lượt (nơi gọi có thể khai khác; thiếu ⇒ THAM-SO `maxRoundQuestions` = 6). */
export const tranCauCua = (n: NguCanhChongLap): number => (Number.isFinite(n.tranCau) ? Math.max(0, Math.floor(n.tranCau as number)) : TRAN_CAU_MOT_LUOT)

/**
 * MỘT ứng viên có được phát trong lượt này không? Trả kèm lý do loại HOẶC `repeat_reason` của ngoại lệ.
 * Thứ tự xét: phạm vi (1) → task đang mở (2) → đã làm hôm nay (3) → chưa đến hạn (4) → giãn family (7) →
 * trần theo family (6) → trần lượt (6). KHÔNG có bất kỳ cooldown 3/14/30 ngày nào.
 */
export function xetChongLap(u: UngVienLap, n: NguCanhChongLap): KetQuaChongLap {
  // (1) An toàn nội dung/phạm vi/quyền công bố — KHÔNG có ngoại lệ nào bỏ qua được.
  if (n.ngoaiPhamVi) return { duoc: false, lyDo: 'NGOAI_PHAM_VI' }

  const cg = u.contentGroup
  const task = cg ? n.taskDangMo?.get(cg) : undefined

  // (2) Đã cấp trong NHIỆM VỤ ĐANG MỞ ⇒ trả lại CÙNG task (không phát bản khác ở màn khác).
  if (task) return { duoc: true, dungLaiTask: task, repeatReason: 'TASK_DANG_LAM' }

  // (3) Cùng `content_group` đã trả lời HÔM NAY ⇒ chặn, TRỪ `repair_retry` do máy chủ tạo rõ.
  if (cg && n.daLamHomNay?.has(cg)) {
    if (!n.retryChoPhep?.has(cg)) return { duoc: false, lyDo: 'DA_LAM_HOM_NAY' }
    // Retry có mục đích: được phát lại nhưng KHÔNG nhận lại EXP câu và KHÔNG nâng FSRS.
    return { duoc: true, repeatReason: 'REPAIR', khongNhanExpCau: true, khongNangFsrs: true }
  }

  // (4) Chưa đến hạn ⇒ KHÔNG dùng nguyên văn để lấp số (chỉ transfer/consolidation có mục đích).
  if (!u.denHan && u.purpose === 'due_review') return { duoc: false, lyDo: 'KHONG_DEN_HAN' }

  const daChon = n.daChon ?? []
  const cungFamily = daChon.filter((x) => x.familyId !== null && x.familyId === u.familyId)
  const repairTrongLuot = cungFamily.filter((x) => laRepair(x.purpose)).length
  const thuongTrongLuot = cungFamily.length - repairTrongLuot

  // (7) Family VỪA LÀM hôm nay phải nghỉ với consolidation mới — 4 ngoại lệ, mỗi ngoại lệ có `repeat_reason`.
  let repeatReason: LyDoNgoaiLe | undefined
  if (u.familyId && n.familyLanCuoi?.get(u.familyId) === n.homNay) {
    if (u.denHan) repeatReason = 'DUE_REVIEW'
    else if (laRepair(u.purpose)) repeatReason = 'REPAIR'
    else if (cg && n.baiThayGiao?.has(cg)) repeatReason = 'TEACHER_ASSIGNMENT'
    else if (cg && n.probeChoPhep?.has(cg)) repeatReason = 'PROBE'
    else return { duoc: false, lyDo: 'FAMILY_VUA_LAM' }
  } else if (u.denHan) {
    repeatReason = 'DUE_REVIEW' // đến hạn là ngoại lệ hợp lệ của luật giãn family, ghi rõ lý do
  }

  // (6) Trần trong lượt theo family.
  if (u.familyId) {
    if (repairTrongLuot >= TRAN_CAU_REPAIR_MOI_FAMILY || thuongTrongLuot >= TRAN_CAU_THUONG_MOI_FAMILY) {
      return { duoc: false, lyDo: 'TRAN_FAMILY' }
    }
    // Câu repair thứ hai cùng family phải cách ≥2 nhiệm vụ khác HOẶC ≥300 giây hoạt động hợp lệ.
    if (laRepair(u.purpose) && repairTrongLuot === 1) {
      const cach = n.cachRepair ?? { nhiemVu: 0, giay: 0 }
      if (cach.nhiemVu < CACH_REPAIR_NHIEM_VU && cach.giay < CACH_REPAIR_GIAY) return { duoc: false, lyDo: 'TRAN_FAMILY' }
    }
  } else if (daChon.filter((x) => x.familyId === null).length >= TRAN_CAU_CHUA_FAMILY) {
    // Chưa gán family: không lấy nhiều hơn 1 câu chưa gán family trong một lượt.
    return { duoc: false, lyDo: 'TRAN_CAU_CHUA_FAMILY' }
  }

  // (6) Trần số câu của lượt.
  if (daChon.length >= tranCauCua(n)) return { duoc: false, lyDo: 'TRAN_LUOT' }

  return repeatReason ? { duoc: true, repeatReason } : { duoc: true }
}

/**
 * Lọc cả dãy ứng viên theo thứ tự nơi gọi đưa vào (bộ chọn đã sắp tất định).
 * Trả phần ĐƯỢC PHÁT (kèm `repeat_reason`) + mã lý do từng câu bị loại + số câu còn thiếu
 * ("không đủ câu thì RÚT NGẮN, không giảm bảo vệ" — 02 §4.2.8).
 */
export function chonTheoLuatChongLap(
  ds: readonly UngVienLap[],
  n: NguCanhChongLap,
): { chon: (UngVienLap & KetQuaChongLap)[]; loai: { qid: string; lyDo: LyDoChongLap }[]; thieu: number } {
  const chon: (UngVienLap & KetQuaChongLap)[] = []
  const loai: { qid: string; lyDo: LyDoChongLap }[] = []
  const daChon: DaChonTrongLuot[] = [...(n.daChon ?? [])]
  for (const u of ds) {
    const kq = xetChongLap(u, { ...n, daChon })
    if (!kq.duoc) { loai.push({ qid: u.qid, lyDo: kq.lyDo as LyDoChongLap }); continue }
    chon.push({ ...u, ...kq })
    if (!kq.dungLaiTask) daChon.push({ qid: u.qid, familyId: u.familyId, purpose: u.purpose, contentGroup: u.contentGroup })
  }
  return { chon, loai, thieu: Math.max(0, tranCauCua(n) - daChon.length) }
}

/** Gộp mã lý do để hiện cho giáo viên (không lộ qid đề bảo vệ cho học sinh). */
export function tomTatLyDoChongLap(loai: readonly { lyDo: LyDoChongLap }[]): Record<LyDoChongLap, number> {
  const ra: Record<LyDoChongLap, number> = {
    NGOAI_PHAM_VI: 0, DA_LAM_HOM_NAY: 0, KHONG_DEN_HAN: 0, FAMILY_VUA_LAM: 0,
    TRAN_FAMILY: 0, TRAN_CAU_CHUA_FAMILY: 0, TRAN_LUOT: 0,
  }
  for (const x of loai) ra[x.lyDo]++
  return ra
}

/**
 * Ngày VN gần nhất có bằng chứng của từng family từ SỰ KIỆN đã chuẩn hoá (thuần) — cơ sở luật giãn cách.
 * Nguồn family: KHO (P02 xác nhận kho thật CHƯA gắn nhãn) ⇒ thiếu nhãn thì family rỗng, KHÔNG bịa.
 */
export function familyLanCuoiTuSuKien(ds: readonly { sbd: string; familyId: string | null; ngayVn: string }[]): Map<string, string> {
  const ra = new Map<string, string>()
  for (const e of ds) {
    if (!e.familyId) continue
    const cu = ra.get(e.familyId)
    if (!cu || e.ngayVn > cu) ra.set(e.familyId, e.ngayVn)
  }
  return ra
}

/** Khoá `content_group` đã có KẾT QUẢ hôm nay của những em này (đi chỉ mục (sbd, ngày)). */
export async function docDaLamHomNay(env: Env, dsSbd: readonly string[], homNay: string): Promise<Map<string, Set<string>>> {
  const ra = new Map<string, Set<string>>()
  for (const sbd of dsSbd) ra.set(sbd, new Set())
  if (dsSbd.length === 0) return ra
  try {
    const r = await env.DB.prepare(
      `SELECT k.sbd, q.content_group FROM su_kien_hoc k JOIN game_v2_question q ON q.qid = k.qid
        WHERE k.sbd IN (SELECT value FROM json_each(?)) AND k.ngay_vn = ? AND k.ket_qua IS NOT NULL
          AND COALESCE(q.content_group, '') <> ''`,
    ).bind(JSON.stringify([...dsSbd]), homNay).all<{ sbd: string; content_group: string }>()
    for (const x of r.results ?? []) ra.get(String(x.sbd))?.add(String(x.content_group))
  } catch {
    /* thiếu bảng/chỉ mục ⇒ coi như chưa có dữ liệu; KHÔNG chặn oan */
  }
  return ra
}

