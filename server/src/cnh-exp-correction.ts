// CNH-1.0 P07 — SỬA ĐIỂM (correction) ĐÚNG MỘT LẦN — server-only, CHƯA nối route, CHƯA kích hoạt.
//
// ĐẶC TẢ 03 §1.3 (điều khoản đang cài, nguyên nghĩa):
//   "Teacher xác nhận lỗi tạo correction_id liên kết event_id gốc, version chấm cũ/mới, lý do và tác giả.
//    Dựng lại trạng thái chịu tác động. Thêm khoản bù dương còn thiếu ĐÚNG MỘT LẦN; lỗi hệ thống KHÔNG tự
//    thu hồi EXP/khiên đã tiêu. Không để cùng correction chạy lại tạo hai khoản."
//
// KHUÔN GIAO DỊCH (giống `cnh-exp-ledger.ts`), đã sửa theo review Boss 24/09:
//   1. DANH TÍNH YÊU CẦU ĐẦY ĐỦ: một chuỗi chuẩn hoá + băm SHA-256 phủ (em, ngày học, policy, correction_id,
//      event gốc, version chấm cũ/mới, lý do, tác giả, giá trị dựng lại). Băm truyền vào CHỈ được đối chiếu,
//      KHÔNG được tin: lệch nội dung ⇒ `INVALID_CORRECTION`. Receipt lưu cả chuỗi danh tính ⇒ replay so DANH TÍNH.
//      ⇒ Cùng correction_id nhưng KHÁC NGÀY (hoặc khác version/lý do/tác giả/giá trị) ⇒ `IDEMPOTENCY_CONFLICT`,
//        KHÔNG bao giờ trả receipt của ngày khác.
//   2. PRECONDITION REVISION Ở TẦNG SQL (chống stale overwrite): mọi ghi bị chặn bởi `revision` đọc được
//      (ngày + tài khoản) VÀ bởi sự tồn tại của claim của chính lượt này. Claim chỉ vào khi precondition còn đúng.
//      ⇒ Không bao giờ ghi "tổng dựng từ dữ liệu cũ" đè lên dữ liệu mới.
//   3. CẠNH TRANH KHỎE ⇒ THỬ LẠI: claim 0 dòng vì precondition đã cũ ⇒ **đọc lại + tính lại** (bounded retry),
//      KHÔNG phải `CORRUPT_STATE`. Chỉ bất biến trong-giao-dịch sai (claim đã vào mà giá trị kết quả không như
//      tính toán) mới là hỏng dữ liệu ⇒ `CHECK (ok = 1)` ném ⇒ ROLLBACK + `CORRUPT_STATE` (không thử lại).
//   4. NGUỒN CHẤM AUTHORITATIVE (chống "ghi tổng cũ đè tổng mới"): khi máy chủ có `docNguon`, module ĐỌC NGUỒN
//      mỗi lượt thử và **DỰNG LẠI** `rawCoreAfter`/`achievedAfter` TỪ NGUỒN (không dùng số nơi gọi khai);
//      nơi gọi khai `nguon.revision` ⇒ precondition: nguồn đã đổi ⇒ `RETRYABLE_CONFLICT` (TỪ CHỐI, buộc dựng lại),
//      và nguồn được XÁC NHẬN LẠI ngay trước khi ghi. KHÔNG dùng `max(raw)`: sửa XUỐNG là hợp lệ.
//      Đường tương thích (không có `docNguon`): giữ nguyên hành vi cũ — **giới hạn**: không có nguồn thì chỉ có
//      khoá CAS tiền (không phát hiện nổi tổng nguồn mới hơn) ⇒ wiring thật PHẢI cấu hình `docNguon`.
//   5. Sổ `cnh_exp_grant_ledger` UNIQUE (em, ngày, policy, semantic_revision) ⇒ khoá chống cộng hai lần ở SQL.
//   6. Khoản bù = `grant` của policy thuần `quyenCore` (đã trừ `corePaid + compensationAlreadyPaid`) ⇒ luôn >= 0,
//      KHÔNG thu hồi EXP/khiên đã tiêu; quyền mới nhỏ hơn đã trả ⇒ bù 0.
//
// ⚠️ KHÔNG phải route, KHÔNG bật cờ, KHÔNG đổi chấm thực tế. `eventId`/version/lý do/tác giả chỉ được LƯU vào
// receipt để truy vết; module không tự chấm lại bài và không tự quyết định giáo viên đúng/sai.
import type { D1Database, D1DatabaseSession, Env } from './kieu'
import { quyenCore } from './cnh-exp-policy'
import { bamSha256 } from './cnh-exp-task'

export const LENH_SUA_DIEM = 'adjust_correction' as const
export const PHIEN_BAN_CHINH_SACH = 'CNH-1.0' as const
export const SO_LAN_THU_LAI = 5
const LICH_CHO_MS = [20, 40, 80, 160, 320] as const

export type MaLoiSuaDiem = 'IDEMPOTENCY_CONFLICT' | 'RETRYABLE_CONFLICT' | 'NOT_FOUND' | 'CORRUPT_STATE' | 'INVALID_CORRECTION'

export class LoiSuaDiem extends Error {
  readonly ma: MaLoiSuaDiem
  constructor(ma: MaLoiSuaDiem, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiSuaDiem'
    this.ma = ma
  }
}

/** Giáo viên xác nhận lỗi — LƯU vào receipt để truy vết, KHÔNG dùng để tự chấm. */
export interface ThamChieuSuaDiem {
  eventId: string
  oldGradeVersion: string
  newGradeVersion: string
  reason: string
  teacherId: string
}

export interface YeuCauSuaDiem {
  /** Em (server suy ra, KHÔNG lấy từ thân yêu cầu). */
  studentId: string
  /** Ngày học GỐC của lần nộp bị sửa (ngày VN) — THUỘC danh tính yêu cầu. */
  learningDay: string
  /** `correction_id` do giáo viên xác nhận — khoá idempotency của lần sửa. */
  correctionId: string
  /** Băm của nội dung bản sửa; server TỰ tính lại và CHỈ đối chiếu (không tin giá trị này). */
  requestHash: string
  thamChieu: ThamChieuSuaDiem
  /** Tổng `raw_core` của NGÀY sau khi dựng lại (>= 0) — khi có nguồn, server DỰNG LẠI từ nguồn authoritative. */
  rawCoreAfter: number
  /** NGÀY có đạt sau khi dựng lại. */
  achievedAfter: boolean
  /**
   * PRECONDITION NGUỒN (khuyến nghị BẮT BUỘC khi máy chủ có `docNguon`): revision của nguồn chấm authoritative
   * mà nơi gọi đã dùng để dựng `rawCoreAfter`/`achievedAfter`. Nguồn đã đổi ⇒ TỪ CHỐI (không ghi tổng cũ).
   */
  nguon?: { revision: string }
}

export interface PhanHoiSuaDiem {
  commandType: typeof LENH_SUA_DIEM
  correctionId: string
  studentId: string
  learningDay: string
  policyVersion: string
  /** Băm DANH TÍNH ĐẦY ĐỦ — dùng để replay nhất quán (đổi ngày/version/revision nguồn/giá trị ⇒ khác). */
  dinhDanh: string
  /** Revision nguồn chấm authoritative đã dùng (null = đường tương thích không có nguồn). */
  nguonRevision: string | null
  /** `true` = nơi gọi có khai precondition nguồn VÀ khớp nguồn đọc được (đã xác nhận). */
  nguonDaXacNhan: boolean
  /** Giá trị THẬT ĐÃ GHI (dựng lại từ nguồn khi có) — để đối chiếu với số nơi gọi khai. */
  rawCoreGhi: number
  achievedGhi: boolean
  thamChieu: ThamChieuSuaDiem
  entitlement: number
  /** Khoản bù ĐÃ TRẢ ở lần này (0 nếu đã đủ hoặc quyền mới nhỏ hơn đã trả). */
  compensation: number
  walletAfter: number
  earnedAfter: number
  corePaidAfter: number
  compensationPaidAfter: number
  committedRevision: number
}

export interface PhuThuocSuaDiem {
  uuid?: () => string
  sleep?: (ms: number) => Promise<void>
  /**
   * ĐỌC NGUỒN CHẤM authoritative (bắt buộc ở đường an toàn). PHẢI đọc PRIMARY, không replica.
   * Trả `null` khi không đọc được nguồn ⇒ module TỪ CHỐI (không tự bịa tổng).
   * Có `docNguon` ⇒ module DỰNG LẠI `rawCoreAfter`/`achievedAfter` từ nguồn và KHÔNG dùng số nơi gọi khai.
   */
  docNguon?: (yc: YeuCauSuaDiem) => Promise<{ revision: string; rawCoreAfter: number; achievedAfter: boolean } | null>
  /**
   * KHOÁ NGUỒN TRONG CÙNG GIAO DỊCH — đóng khe "đọc-nguồn → ghi" (review Boss 24/09: §4.9).
   * Một mệnh đề SQL + tham số để câu CLAIM kiểm NGAY TRONG batch write, ví dụ:
   *   `{ sql: 'EXISTS (SELECT 1 FROM nguon_cham WHERE event_id = ? AND revision = ?)', bind: [eventId, revision] }`
   * Có mặt ⇒ claim chỉ vào khi nguồn CÒN đúng revision. Nguồn đổi ở BẤT KỲ khe nào (kể cả sau bước xác nhận
   * lại ngoài giao dịch) ⇒ claim 0 dòng ⇒ KHÔNG ghi gì ⇒ vòng lặp đọc lại + `docNguon` phát hiện lệch ⇒ TỪ CHỐI.
   * BẮT BUỘC kèm `docNguon` (không có nguồn thì không dựng lại được tổng ⇒ từ chối ngay).
   */
  nguonKiemTra?: KiemTraNguon
}

/**
 * Khoá nguồn kiểm TRONG batch. `sql` phải là một MỆNH ĐỀ boolean (không dấu `;`), `bind` theo đúng thứ tự `?`.
 * Đây là cơ chế duy nhất khiến việc kiểm nguồn là NGUYÊN TỬ với việc ghi (không còn cửa sổ thời gian).
 */
export interface KiemTraNguon {
  sql: string
  bind: readonly unknown[]
}

// ───────────────────────── DANH TÍNH YÊU CẦU + KIỂM ĐẦU VÀO ─────────────────────────

type DbDoc = Pick<D1Database, 'prepare'>
interface DongTaiKhoan { wallet_exp: number; earned_exp: number; revision: number }
interface DongNgay { raw_core: number; achieved: number; core_paid: number; compensation_paid: number; revision: number }
interface DongLenh { request_hash: string; response_json: string }

const macDinhUuid = (): string => crypto.randomUUID()
const macDinhSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
const jitter = (ms: number): number => ms + Math.floor(Math.random() * Math.max(1, Math.floor(ms / 4)))
const laSoNguyenAnToan = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const chuoi = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** Đầu vào để dựng băm NỘI DUNG hồ sơ sửa (không cần `requestHash` — server tự tính). */
export type DanhTinhSuaDiem = Pick<YeuCauSuaDiem, 'studentId' | 'learningDay' | 'correctionId' | 'thamChieu' | 'rawCoreAfter' | 'achievedAfter' | 'nguon'>

/** Chuỗi NỘI DUNG bản sửa: event gốc, version chấm cũ/mới, lý do, tác giả, giá trị dựng lại (băm do nơi gọi cấp). */
export function chuoiNoiDungSuaDiem(y: Pick<YeuCauSuaDiem, 'thamChieu' | 'rawCoreAfter' | 'achievedAfter'>): string {
  const t = (y?.thamChieu ?? {}) as Partial<ThamChieuSuaDiem>
  return JSON.stringify({
    v: 1,
    eventId: chuoi(t.eventId),
    oldGradeVersion: chuoi(t.oldGradeVersion),
    newGradeVersion: chuoi(t.newGradeVersion),
    reason: chuoi(t.reason),
    teacherId: chuoi(t.teacherId),
    rawCoreAfter: y?.rawCoreAfter,
    achievedAfter: y?.achievedAfter,
  })
}

/** BĂM NỘI DUNG bản sửa — `requestHash` do nơi gọi cấp; server ĐỐI CHIẾU ở biên, KHÔNG dùng làm danh tính. */
export async function bamYeuCauSuaDiem(y: Pick<YeuCauSuaDiem, 'thamChieu' | 'rawCoreAfter' | 'achievedAfter'>): Promise<string> {
  return bamSha256(chuoiNoiDungSuaDiem(y))
}

/** Chuỗi DANH TÍNH ĐẦY ĐỦ: (em, ngày học, policy, correction_id, revision nguồn khai) + toàn bộ nội dung bản sửa. */
export function chuoiDanhTinhSuaDiem(y: DanhTinhSuaDiem): string {
  return JSON.stringify({
    v: 1,
    studentId: chuoi(y?.studentId),
    learningDay: chuoi(y?.learningDay),
    policyVersion: PHIEN_BAN_CHINH_SACH,
    correctionId: chuoi(y?.correctionId),
    nguonRevision: chuoi(y?.nguon?.revision),
    noiDung: JSON.parse(chuoiNoiDungSuaDiem(y)),
  })
}

/** BĂM DANH TÍNH ĐẦY ĐỦ — server TỰ tính; dùng cho receipt/replay (đổi ngày/version/giá trị ⇒ khác băm). */
export async function bamDanhTinhSuaDiem(y: DanhTinhSuaDiem): Promise<string> {
  return bamSha256(chuoiDanhTinhSuaDiem(y))
}

/** Kiểm ĐẦU VÀO trước mọi ghi: thiếu/sai ⇒ `INVALID_CORRECTION`, giao dịch chưa hề mở. */
export function kiemTraYeuCauSuaDiem(v: unknown): YeuCauSuaDiem {
  if (!v || typeof v !== 'object') throw new LoiSuaDiem('INVALID_CORRECTION', 'thiếu yêu cầu sửa điểm')
  const o = v as YeuCauSuaDiem
  if (!chuoi(o.studentId)) throw new LoiSuaDiem('INVALID_CORRECTION', 'thiếu studentId')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(chuoi(o.learningDay))) throw new LoiSuaDiem('INVALID_CORRECTION', `learningDay phải YYYY-MM-DD: ${String(o.learningDay)}`)
  if (!chuoi(o.correctionId)) throw new LoiSuaDiem('INVALID_CORRECTION', 'thiếu correction_id')
  if (!chuoi(o.requestHash)) throw new LoiSuaDiem('INVALID_CORRECTION', 'thiếu request_hash')
  const t = o.thamChieu
  if (!t || typeof t !== 'object') throw new LoiSuaDiem('INVALID_CORRECTION', 'thiếu tham chiếu (event_id/version cũ-mới/lý do/tác giả)')
  for (const k of ['eventId', 'oldGradeVersion', 'newGradeVersion', 'reason', 'teacherId'] as const) {
    if (!chuoi(t[k])) throw new LoiSuaDiem('INVALID_CORRECTION', `thiếu ${k}`)
  }
  if (chuoi(t.oldGradeVersion) === chuoi(t.newGradeVersion)) throw new LoiSuaDiem('INVALID_CORRECTION', 'version chấm cũ và mới giống nhau ⇒ không phải sửa điểm')
  if (!laSoNguyenAnToan(o.rawCoreAfter)) throw new LoiSuaDiem('INVALID_CORRECTION', `rawCoreAfter phải là số nguyên an toàn >= 0: ${String(o.rawCoreAfter)}`)
  if (typeof o.achievedAfter !== 'boolean') throw new LoiSuaDiem('INVALID_CORRECTION', 'achievedAfter phải là boolean')
  if (o.nguon !== undefined && (!o.nguon || typeof o.nguon !== 'object' || !chuoi(o.nguon.revision))) {
    throw new LoiSuaDiem('INVALID_CORRECTION', 'nguon.revision phải là chuỗi không rỗng (revision nguồn chấm)')
  }
  return {
    ...o,
    studentId: chuoi(o.studentId), learningDay: chuoi(o.learningDay), correctionId: chuoi(o.correctionId), requestHash: chuoi(o.requestHash),
    ...(o.nguon ? { nguon: { revision: chuoi(o.nguon.revision) } } : {}),
  }
}

async function docLenh(db: DbDoc, studentId: string, correctionId: string): Promise<DongLenh | null> {
  const r = await db
    .prepare('SELECT request_hash, response_json FROM cnh_exp_command WHERE student_id = ? AND command_type = ? AND request_id = ?')
    .bind(studentId, LENH_SUA_DIEM, correctionId)
    .first<DongLenh>()
  return r ?? null
}

async function docTaiKhoan(db: DbDoc, studentId: string): Promise<DongTaiKhoan | null> {
  const r = await db.prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?').bind(studentId).first<DongTaiKhoan>()
  if (!r) return null
  if (!laSoNguyenAnToan(r.wallet_exp) || !laSoNguyenAnToan(r.earned_exp) || !laSoNguyenAnToan(r.revision)) {
    throw new LoiSuaDiem('CORRUPT_STATE', 'tài khoản có giá trị không phải số nguyên an toàn >= 0')
  }
  return r
}

async function docNgay(db: DbDoc, studentId: string, learningDay: string): Promise<DongNgay | null> {
  const r = await db
    .prepare('SELECT raw_core, achieved, core_paid, compensation_paid, revision FROM cnh_exp_day WHERE student_id = ? AND learning_day = ? AND policy_version = ?')
    .bind(studentId, learningDay, PHIEN_BAN_CHINH_SACH)
    .first<DongNgay>()
  if (!r) return null
  for (const k of ['raw_core', 'core_paid', 'compensation_paid', 'revision'] as const) {
    if (!laSoNguyenAnToan(r[k])) throw new LoiSuaDiem('CORRUPT_STATE', `ngày học có ${k} không phải số nguyên an toàn >= 0`)
  }
  if (r.achieved !== 0 && r.achieved !== 1) throw new LoiSuaDiem('CORRUPT_STATE', 'achieved phải là 0 hoặc 1')
  return r
}

/** Replay: so DANH TÍNH (không chỉ băm truyền vào) — lệch bất kỳ thành phần nào ⇒ `IDEMPOTENCY_CONFLICT`. */
function laiPhanHoi(lenhCu: DongLenh, dinhDanhHash: string, dinhDanh: string, correctionId: string): PhanHoiSuaDiem {
  if (lenhCu.request_hash !== dinhDanhHash) {
    throw new LoiSuaDiem('IDEMPOTENCY_CONFLICT', `correction_id ${correctionId} đã dùng với nội dung khác`)
  }
  const phanHoi = JSON.parse(lenhCu.response_json) as PhanHoiSuaDiem
  if (phanHoi?.dinhDanh !== dinhDanh) {
    throw new LoiSuaDiem('IDEMPOTENCY_CONFLICT', `correction_id ${correctionId} đã dùng cho danh tính khác (khác ngày/version/giá trị dựng lại)`)
  }
  return phanHoi
}


// ───────────────────────── LỆNH: SỬA ĐIỂM ĐÚNG MỘT LẦN ─────────────────────────

/**
 * Ghi MỘT khoản bù cho MỘT `correction_id`; trả phản hồi ĐÃ LƯU nếu đúng danh tính đó đã chạy.
 *
 * Bất biến (test D1 thật canh): ví/earned chỉ TĂNG đúng phần bù; `core_paid + compensation_paid` không vượt quyền
 * đã chốt; mỗi `correction_id` có đúng MỘT receipt cho MỘT danh tính; sai bất biến ⇒ rollback TOÀN BỘ.
 */
export async function suaDiemMotLan(env: Env, yeuCau: YeuCauSuaDiem, phuThuoc: PhuThuocSuaDiem = {}): Promise<PhanHoiSuaDiem> {
  const yc = kiemTraYeuCauSuaDiem(yeuCau)
  const uuid = phuThuoc.uuid ?? macDinhUuid
  const sleep = phuThuoc.sleep ?? macDinhSleep
  // DANH TÍNH ĐẦY ĐỦ do server tự dựng (không tin `requestHash` truyền vào: chỉ đối chiếu nội dung ở biên).
  const dinhDanh = chuoiDanhTinhSuaDiem(yc)
  const dinhDanhHash = await bamDanhTinhSuaDiem(yc)
  const bamNoiDung = await bamYeuCauSuaDiem(yc)

  // KHOÁ NGUỒN TRONG-BATCH (đóng khe đọc-nguồn → ghi): kiểm đầu vào MỘT LẦN, trước mọi giao dịch.
  const nguonKiemTra = phuThuoc.nguonKiemTra
  if (nguonKiemTra) {
    if (!phuThuoc.docNguon) {
      throw new LoiSuaDiem('INVALID_CORRECTION', 'có khoá nguồn trong-batch nhưng thiếu `docNguon` ⇒ không dựng lại được tổng')
    }
    if (typeof nguonKiemTra.sql !== 'string' || !nguonKiemTra.sql.trim()) {
      throw new LoiSuaDiem('INVALID_CORRECTION', 'khoá nguồn trong-batch thiếu mệnh đề SQL')
    }
    if (!Array.isArray(nguonKiemTra.bind)) {
      throw new LoiSuaDiem('INVALID_CORRECTION', 'khoá nguồn trong-batch thiếu mảng bind')
    }
  }
  const khoaNguonSql = nguonKiemTra ? nguonKiemTra.sql : '1 = 1'
  const khoaNguonBind: readonly unknown[] = nguonKiemTra ? nguonKiemTra.bind : []

  // MỘT phiên PRIMARY cho mọi đọc/ghi: quyết toán là read-after-write, KHÔNG được đọc replica.
  const session: D1DatabaseSession | null = typeof env.DB.withSession === 'function' ? env.DB.withSession('first-primary') : null
  const dbDoc: DbDoc = session ?? env.DB
  const dbGhi: D1Database = (session as unknown as D1Database) ?? env.DB

  for (let lanThu = 0; lanThu < SO_LAN_THU_LAI; lanThu++) {
    // 1. RECEIPT TRƯỚC (theo ĐÚNG danh tính): lệch ngày/version/giá trị ⇒ IDEMPOTENCY_CONFLICT, KHÔNG trả receipt ngày khác.
    const lenhCu = await docLenh(dbDoc, yc.studentId, yc.correctionId)
    if (lenhCu) return laiPhanHoi(lenhCu, dinhDanhHash, dinhDanh, yc.correctionId)

    // 1b. KIỂM BĂM NỘI DUNG Ở BIÊN: chỉ khi chưa có receipt (có receipt thì DANH TÍNH đã quyết ở trên).
    if (yc.requestHash !== bamNoiDung) {
      throw new LoiSuaDiem('INVALID_CORRECTION', 'request_hash không khớp nội dung bản sửa (event/version/lý do/tác giả/giá trị)')
    }

    // 2. Đọc trạng thái ĐÃ LƯU (primary) — mỗi lượt thử đọc lại TƯƠI để không ghi bằng dữ liệu cũ.
    const taiKhoan = await docTaiKhoan(dbDoc, yc.studentId)
    const ngay = await docNgay(dbDoc, yc.studentId, yc.learningDay)
    if (!taiKhoan || !ngay) throw new LoiSuaDiem('NOT_FOUND', `thiếu tài khoản hoặc ngày ${yc.studentId}/${yc.learningDay} ⇒ chưa dựng lại được trạng thái`)

    // 3. NGUỒN CHẤM (precondition + DỰNG LẠI): không bao giờ ghi tổng do nơi gọi khai nếu máy chủ đọc được nguồn.
    const docNguon = phuThuoc.docNguon
    let rawCoreGhi = yc.rawCoreAfter
    let achievedGhi = yc.achievedAfter
    let nguonRevision: string | null = null
    let nguonDaXacNhan = false
    if (docNguon) {
      const ng = await docNguon(yc)
      if (!ng) throw new LoiSuaDiem('NOT_FOUND', 'không đọc được nguồn chấm authoritative ⇒ không ghi khoản bù')
      nguonRevision = chuoi(ng.revision)
      if (!nguonRevision) throw new LoiSuaDiem('CORRUPT_STATE', 'nguồn chấm trả revision rỗng')
      if (yc.nguon && yc.nguon.revision !== nguonRevision) {
        // NGƯỜN ĐÃ ĐỔI: tổng nơi gọi khai đã cũ ⇒ TỪ CHỐI, nơi gọi phải dựng lại từ nguồn mới (KHÔNG ghi tổng cũ).
        throw new LoiSuaDiem('RETRYABLE_CONFLICT', `nguồn chấm đã đổi: ${yc.nguon.revision} → ${nguonRevision}; phải dựng lại tổng theo nguồn mới`)
      }
      nguonDaXacNhan = !!yc.nguon && yc.nguon.revision === nguonRevision
      rawCoreGhi = ng.rawCoreAfter
      achievedGhi = ng.achievedAfter
    } else if (yc.nguon) {
      throw new LoiSuaDiem('RETRYABLE_CONFLICT', 'có precondition nguồn nhưng máy chủ chưa cấu hình đọc nguồn chấm')
    }

    // 4. DỰNG LẠI + BÙ DƯƠNG CÒN THIẾU (không bao giờ âm ⇒ không thu hồi EXP/khiên đã tiêu; KHÔNG dùng max(raw): sửa xuống hợp lệ).
    const { entitlement, grant } = quyenCore({ achieved: achievedGhi, rawCore: rawCoreGhi, corePaid: ngay.core_paid, compensationAlreadyPaid: ngay.compensation_paid })
    const bu = grant
    const walletAfter = taiKhoan.wallet_exp + bu
    const earnedAfter = taiKhoan.earned_exp + bu
    const compensationPaidAfter = ngay.compensation_paid + bu
    if (!Number.isSafeInteger(walletAfter) || !Number.isSafeInteger(earnedAfter) || !Number.isSafeInteger(compensationPaidAfter)) {
      throw new LoiSuaDiem('CORRUPT_STATE', 'khoản bù làm tràn số nguyên an toàn')
    }

    const committedRevision = taiKhoan.revision + 1
    const semanticRevision = ngay.revision + 1
    const executionId = uuid()
    const grantId = uuid()

    // 5. XÁC NHẬN LẠI NGUỒN NGAY TRƯỚC KHI GHI: nguồn đổi trong khe vừa rồi ⇒ TỪ CHỐI (không ghi tổng cũ).
    if (docNguon) {
      const lai = await docNguon(yc)
      if (!lai || chuoi(lai.revision) !== nguonRevision) {
        throw new LoiSuaDiem('RETRYABLE_CONFLICT', `nguồn chấm đổi trong lúc chờ (${nguonRevision} → ${lai ? chuoi(lai.revision) : 'không đọc được'}); không ghi giá trị cũ`)
      }
    }

    const phanHoi: PhanHoiSuaDiem = {
      commandType: LENH_SUA_DIEM, correctionId: yc.correctionId, studentId: yc.studentId, learningDay: yc.learningDay,
      policyVersion: PHIEN_BAN_CHINH_SACH, dinhDanh, nguonRevision, nguonDaXacNhan, rawCoreGhi, achievedGhi,
      thamChieu: yc.thamChieu, entitlement, compensation: bu,
      walletAfter, earnedAfter, corePaidAfter: ngay.core_paid, compensationPaidAfter, committedRevision,
    }


    // 4. CLAIM có PRECONDITION REVISION: chỉ vào khi CHƯA có receipt cho key này VÀ ngày/tài khoản còn đúng revision
    //    đã đọc. Precondition nằm NGAY TRONG câu claim ⇒ cả giao dịch không thể ghi bằng ảnh chụp cũ (chống stale overwrite).
    const claim = dbGhi.prepare(
      `INSERT OR IGNORE INTO cnh_exp_command
         (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM cnh_exp_command WHERE student_id = ? AND command_type = ? AND request_id = ?)
          AND EXISTS (SELECT 1 FROM cnh_exp_day WHERE student_id = ? AND learning_day = ? AND policy_version = ? AND revision = ?)
          AND EXISTS (SELECT 1 FROM cnh_exp_account WHERE student_id = ? AND revision = ?)
          AND (${khoaNguonSql})`,
    ).bind(
      yc.studentId, LENH_SUA_DIEM, yc.correctionId, dinhDanhHash, executionId, JSON.stringify(phanHoi), committedRevision,
      yc.studentId, LENH_SUA_DIEM, yc.correctionId,
      yc.studentId, yc.learningDay, PHIEN_BAN_CHINH_SACH, ngay.revision,
      yc.studentId, taiKhoan.revision,
      ...khoaNguonBind,
    )

    const suaNgay = dbGhi.prepare(
      `UPDATE cnh_exp_day
          SET raw_core = ?, achieved = ?, compensation_paid = ?, revision = revision + 1, cap_nhat_luc = datetime('now')
        WHERE student_id = ? AND learning_day = ? AND policy_version = ? AND revision = ?
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ? AND student_id = ?)`,
    ).bind(rawCoreGhi, achievedGhi ? 1 : 0, compensationPaidAfter, yc.studentId, yc.learningDay, PHIEN_BAN_CHINH_SACH, ngay.revision, executionId, yc.studentId)

    const congVi = dbGhi.prepare(
      `UPDATE cnh_exp_account
          SET wallet_exp = ?, earned_exp = ?, revision = revision + 1, cap_nhat_luc = datetime('now')
        WHERE student_id = ? AND revision = ?
          AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ? AND student_id = ?)`,
    ).bind(walletAfter, earnedAfter, yc.studentId, taiKhoan.revision, executionId, yc.studentId)

    // Sổ khoản bù: CHỈ ghi khi có bù (> 0). UNIQUE (em, ngày, policy, semantic_revision) chặn hai lần ghi song song.
    const ghiSo = dbGhi.prepare(
      `INSERT OR IGNORE INTO cnh_exp_grant_ledger
         (grant_id, student_id, learning_day, policy_version, semantic_revision, amount, execution_id)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE ? > 0 AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ? AND student_id = ?)`,
    ).bind(grantId, yc.studentId, yc.learningDay, PHIEN_BAN_CHINH_SACH, semanticRevision, bu, executionId, bu, executionId, yc.studentId)

    // BẤT BIẾN trong-giao-dịch. CHỈ điều kiện "claim đã vào" ở WHERE ngoài (thua claim / stale ⇒ 0 dòng, KHÔNG lỗi);
    // các bất biến còn lại ở CASE ⇒ sai thì ghi ok = 0 ⇒ `CHECK (ok = 1)` ném ⇒ rollback cả batch (hỏng dữ liệu thật).
    const guard = dbGhi.prepare(
      `INSERT INTO cnh_exp_guard (execution_id, ok)
       SELECT ?,
              CASE WHEN
                (SELECT COUNT(*) FROM cnh_exp_command
                  WHERE execution_id = ? AND student_id = ? AND request_id = ? AND request_hash = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_account
                      WHERE student_id = ? AND revision = ? AND wallet_exp = ? AND earned_exp = ?) = 1
                AND (SELECT COUNT(*) FROM cnh_exp_day
                      WHERE student_id = ? AND learning_day = ? AND policy_version = ?
                        AND revision = ? AND raw_core = ? AND achieved = ? AND compensation_paid = ?) = 1
                AND (? = 0 OR (SELECT COUNT(*) FROM cnh_exp_grant_ledger
                      WHERE execution_id = ? AND amount = ? AND learning_day = ?) = 1)
              THEN 1 ELSE 0 END
        WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ? AND student_id = ?)`,
    ).bind(
      executionId, executionId, yc.studentId, yc.correctionId, dinhDanhHash,
      yc.studentId, committedRevision, walletAfter, earnedAfter,
      yc.studentId, yc.learningDay, PHIEN_BAN_CHINH_SACH, semanticRevision, rawCoreGhi, achievedGhi ? 1 : 0, compensationPaidAfter,
      bu, executionId, bu, yc.learningDay,
      executionId, yc.studentId,
    )


    // 5. MỘT batch = MỘT giao dịch. Đọc `changes` từng câu để PHÂN LOẠI chính xác:
    //    · claim vào (changes[0] > 0) ⇒ đã ghi ⇒ kiểm bất biến bằng guard (CHECK ném nếu sai ⇒ rollback).
    //    · claim 0 dòng: (a) có receipt cùng key (một lượt khác thắng) ⇒ đọc receipt; (b) precondition revision cũ
    //      ⇒ cạnh tranh KHỎE ⇒ đọc lại + tính lại (bounded retry). KHÔNG phải CORRUPT_STATE.
    let kq: unknown
    try {
      kq = await dbGhi.batch([claim, suaNgay, congVi, ghiSo, guard])
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      // Bất biến trong-giao-dịch sai (bảng guard) ⇒ rollback: dữ liệu hỏng thật, KHÔNG thử lại mù.
      if (/cnh_exp_guard|CHECK/i.test(m)) throw new LoiSuaDiem('CORRUPT_STATE', `bất biến sửa điểm không đạt ⇒ đã rollback: ${m}`)
      // Cạnh tranh/va chạm kỹ thuật (UNIQUE execution_id, ...) ⇒ giao dịch đã rollback ⇒ thử lại có giới hạn.
      if (/UNIQUE|constraint/i.test(m)) { await sleep(jitter(LICH_CHO_MS[lanThu] ?? 320)); continue }
      throw e
    }

    const soDongClaim = Number((kq as { meta?: { changes?: number } }[] | undefined)?.[0]?.meta?.changes ?? 0)
    if (soDongClaim > 0) return phanHoi

    // 6. Claim không vào: phân biệt "một lượt khác cùng key đã thắng" với "precondition revision đã cũ".
    const cuaAi = await docLenh(dbDoc, yc.studentId, yc.correctionId)
    if (cuaAi) return laiPhanHoi(cuaAi, dinhDanhHash, dinhDanh, yc.correctionId)
    await sleep(jitter(LICH_CHO_MS[lanThu] ?? 320)) // cạnh tranh khỏe ⇒ lượt sau đọc lại trạng thái mới
  }
  throw new LoiSuaDiem('RETRYABLE_CONFLICT', `không giành được quyền ghi khoản bù sau ${SO_LAN_THU_LAI} lần thử`)
}

