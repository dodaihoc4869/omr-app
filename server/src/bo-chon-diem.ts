// ĐIỂM CHỌN CÂU + SẮP XẾP TẤT ĐỊNH — CNH-1.0 §7.2 (P05).
//
// Thứ tự pipeline (02 §7.1): các hard filter (phạm vi, bảo vệ, giữ chỗ, luật lặp) chạy TRƯỚC và KHÔNG
// được thay bằng điểm thưởng; sau đó mới tới "deterministic priority" ở đây, rồi "fit time budget" và
// "atomic reserve". Module này chỉ làm phần ĐIỂM + SẮP XẾP; nó KHÔNG nới bất kỳ bảo vệ nào.
//
//   score = 0,30*repairNeed + 0,25*reviewNeed + 0,20*transferValue + 0,15*fit + 0,10*coverage − fatigue
//   Sắp: score GIẢM DẦN → SHA-256(`student|day|plan_version|qid|question_version`) TĂNG theo byte → qid TĂNG.
//
// KHÔNG dùng `Math.random`. Hash dùng `crypto.subtle` (có ở Worker và Node ≥ 18) nên hàm là async.
import {
  CHIA_REVIEW, DIEM_CHON, GIAY_DAI, GIAY_TOI_THIEU_ON, MOI_MET_MOI_LAN, MOI_MET_TRAN, NEN_REVIEW,
} from './ho-so-cau-hinh'

/** Trạng thái đợt dạy lại của kỹ năng mà câu phục vụ (02 §3.3). */
export type TrangThaiDot = 'needs_teaching' | 'practicing' | 'recovered' | 'stable' | null

export interface CauChonDiem {
  qid: string
  /** Phiên bản câu (`qid + version` = một phiên bản; đổi đáp án ⇒ version mới). */
  version: string
  part: 'I' | 'II' | 'III'
  /** Mức độ của câu (0 Biết · 1 Hiểu · 2 Vận dụng). */
  difficulty: 0 | 1 | 2
  familyId: string | null
  /** Có cơ hội transfer do MÁY CHỦ cấp (không do máy em khai). */
  transferChoPhep?: boolean
  /** Family đã được duyệt (có nhãn) và em CHƯA gặp. */
  familyMoiVoiEm?: boolean
}

export interface NguCanhChonDiem {
  /** Giờ máy chủ (ms). */
  nowMs: number
  /** Đợt dạy lại đang mở của skill mà câu phục vụ (nếu có). */
  trangThaiDot?: TrangThaiDot
  /** Mức đang luyện (`working_level`) của skill thấp nhất trong các skill của câu. */
  workingLevel: number
  /** Card đến hạn: `dueMs` (ms) và khoảng giữa lần review trước và `due` (`intervalMs`). */
  dueMs?: number | null
  intervalMs?: number | null
  /** Số task CÙNG SKILL đã hoàn tất hoặc đang giữ chỗ trong plan hôm nay. */
  soTaskCungSkillTrongPlan?: number
  /** Hai task LIỀN TRƯỚC (part + solveSeconds) để tính `fatigue`. */
  haiTaskTruoc?: readonly { part: 'I' | 'II' | 'III'; solveSeconds: number }[]
  /** `solveSeconds` của câu này (từ `uoc-luong-thoi-gian.ts`). */
  solveSeconds: number
  /** Probe hợp lệ đã được cấp cho câu này. */
  probeChoPhep?: boolean
}

export interface KetQuaDiem {
  qid: string
  score: number
  repairNeed: number
  reviewNeed: number
  transferValue: number
  fit: number
  coverage: number
  fatigue: number
}

const kep = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

/** `repairNeed` (§7.2): 1 nếu đang `needs_teaching`/`practicing` · 0,5 nếu `recovered` chưa `stable` · còn lại 0. */
export function chamRepairNeed(t: TrangThaiDot | undefined): number {
  if (t === 'needs_teaching' || t === 'practicing') return 1
  if (t === 'recovered') return 0.5
  return 0
}

/**
 * `reviewNeed` (§7.2): câu CHƯA due = 0. Khi due: `(clamp((now−due)/max(khoảng, 86400 giây), 0, 1) + 0,5) / 1,5`.
 * ĐƠN VỊ: mọi thời điểm ở đây là **mili-giây** (`nowMs`, `dueMs`, `intervalMs`) — sàn `86400 giây` được đổi sang ms.
 * LƯU Ý LUẬT: "chưa due" là `now < due` — KHÔNG cộng nền 0,5 cho câu chưa tới hạn.
 */
export function chamReviewNeed(nowMs: number, dueMs: number | null | undefined, intervalMs: number | null | undefined): number {
  if (dueMs === null || dueMs === undefined || !Number.isFinite(dueMs)) return 0
  if (nowMs < dueMs) return 0
  const khoang = Math.max(Number(intervalMs) || 0, GIAY_TOI_THIEU_ON * 1000)
  const muon = kep((nowMs - dueMs) / khoang, 0, 1)
  return (muon + NEN_REVIEW) / CHIA_REVIEW
}

/** `transferValue`: 1 khi có cơ hội transfer do máy chủ cấp VÀ family đã biết · 0,5 khi family đã duyệt nhưng em chưa gặp · còn lại 0. */
export function chamTransferValue(c: Pick<CauChonDiem, 'transferChoPhep' | 'familyId' | 'familyMoiVoiEm'>): number {
  if (!c.familyId) return 0 // family hoàn toàn mới KHÔNG được gọi là bằng chứng chuyển giao trong cùng family
  if (c.transferChoPhep && !c.familyMoiVoiEm) return 1
  if (c.transferChoPhep && c.familyMoiVoiEm) return 0.5
  return 0
}

/** `fit`: 1 khi cùng mức · 0,8 thấp hơn một mức · 0,6 thấp hơn hai mức · probe hợp lệ 0,5. */
export function chamFit(difficulty: number, workingLevel: number, probeChoPhep: boolean | undefined): number {
  if (probeChoPhep && difficulty === workingLevel + 1) return 0.5
  const lech = workingLevel - difficulty
  if (lech <= 0) return 1
  if (lech === 1) return 0.8
  return 0.6
}

/** `coverage` = 1/(1 + số task cùng skill đã hoàn tất hoặc giữ chỗ trong plan hôm nay). */
export const chamCoverage = (soTaskCungSkill: number | undefined): number => 1 / (1 + Math.max(0, Math.floor(Number(soTaskCungSkill) || 0)))

/** `fatigue` (§7.2): tối đa 0,4; cùng part với hai task liền trước, và thêm nếu cả hai đều dài (>180 giây). */
export function chamFatigue(part: CauChonDiem['part'], solveSeconds: number, haiTaskTruoc: NguCanhChonDiem['haiTaskTruoc']): number {
  const truoc = haiTaskTruoc ?? []
  let f = 0
  if (truoc.length >= 2 && truoc.slice(-2).every((x) => x.part === part)) f += MOI_MET_MOI_LAN
  if (solveSeconds > GIAY_DAI && truoc.length >= 1 && truoc[truoc.length - 1]!.solveSeconds > GIAY_DAI) f += MOI_MET_MOI_LAN
  return Math.min(MOI_MET_TRAN, f)
}

/** Điểm của MỘT câu theo đúng công thức §7.2. */
export function chamDiem(c: CauChonDiem, n: NguCanhChonDiem): KetQuaDiem {
  const repairNeed = chamRepairNeed(n.trangThaiDot)
  const reviewNeed = chamReviewNeed(n.nowMs, n.dueMs, n.intervalMs)
  const transferValue = chamTransferValue(c)
  const fit = chamFit(c.difficulty, n.workingLevel, n.probeChoPhep)
  const coverage = chamCoverage(n.soTaskCungSkillTrongPlan)
  const fatigue = chamFatigue(c.part, n.solveSeconds, n.haiTaskTruoc)
  const score = DIEM_CHON.repair * repairNeed + DIEM_CHON.review * reviewNeed + DIEM_CHON.transfer * transferValue
    + DIEM_CHON.fit * fit + DIEM_CHON.coverage * coverage - fatigue
  return { qid: c.qid, score, repairNeed, reviewNeed, transferValue, fit, coverage, fatigue }
}


/** Khoá hash để sắp xếp tất định: `student_id|day|plan_version|qid|question_version` (§7.2). */
export const khoaHashSap = (sbd: string, ngay: string, phienBan: number, qid: string, version: string): string =>
  `${sbd}|${ngay}|${phienBan}|${qid}|${version}`

/** SHA-256 hex của một chuỗi (dùng `crypto.subtle` — có ở Worker và Node ≥ 18). */
export async function sha256Hex(chuoi: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chuoi))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** So HAI chuỗi hex theo BYTE tăng dần (so từng ký tự hex = từng nibble; KHÔNG đổi sang số). */
export const soByte = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/**
 * SẮP XẾP TẤT ĐỊNH (§7.2): điểm giảm dần → hash TĂNG theo byte → qid tăng.
 * KHÔNG lọc bỏ câu nào (lọc là việc của hard filter trước đó). `khoa` là hàm dựng khoá hash cho từng câu.
 */
export async function sapTheoDiem(
  ds: readonly CauChonDiem[],
  diem: ReadonlyMap<string, number>,
  khoa: (c: CauChonDiem) => string,
): Promise<CauChonDiem[]> {
  const bang = new Map<string, string>()
  for (const c of ds) bang.set(c.qid, await sha256Hex(khoa(c)))
  return [...ds].sort((a, b) => {
    const da = diem.get(a.qid) ?? 0, db = diem.get(b.qid) ?? 0
    if (da !== db) return db - da
    const the = soByte(bang.get(a.qid)!, bang.get(b.qid)!)
    if (the !== 0) return the
    return a.qid < b.qid ? -1 : a.qid > b.qid ? 1 : 0
  })
}
