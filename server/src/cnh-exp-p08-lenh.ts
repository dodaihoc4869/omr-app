// CNH-1.0 P08 — LỚP LỆNH D1: HẤP THỤ · RÈN KHIÊN · ĐỔI VÀNG.
//
// Điều khoản: `03` §6 (hấp thụ, cập nhật wallet/invested/level/absorbed_today/receipt CÙNG lúc),
// §7.1 (`claim_shield`, `claim_index`, receipt duy nhất), §8 (đổi vàng + dự trữ 400).
// Khuôn an toàn MƯỢN NGUYÊN của P07 (`cnh-exp-ledger.ts`): một phiên `first-primary`, receipt-first,
// CAS trên `revision`, giao dịch gộp MỘT batch, cửa canh `CHECK (ok = 1)` trong-giao-dịch.
//
// ⚠️ MỌI con số lấy từ `cnh-exp-p08.ts` (hàm THUẦN). Tệp này KHÔNG tính lại chính sách, KHÔNG
// đọc/ghi bảng legacy, KHÔNG nối route, KHÔNG bật cờ.
//
// ⚠️ VÍ Ở ĐÂU: `wallet_exp`/`earned_exp` là của `cnh_exp_account` (P07) — P08 KHÔNG chép lại ví.
// Mọi cột còn lại (invested/level/mảnh/kho khiên/vàng) ở `cnh_exp_p08_state`.
import type { D1Database, D1DatabaseSession, Env } from './kieu'
import { PHIEN_BAN_CHINH_SACH, SO_LAN_THU_LAI } from './cnh-exp-ledger'
// Ngưỡng "có học" (số câu KHÁC NHAU trong ngày) — MỘT nguồn, dùng chung với `docTranHapThu` (đường cũ).
import { CO_HOC_TOI_THIEU_CAU } from '../../src/lib/hap-thu-ngay'
import {
  KINH_TE,
  TRAN_INVESTED_EXP,
  capTuInvestedExp,
  tinhHapThu,
  xetDoiVang,
  xetKhien,
  type TrangThaiNgay,
} from './cnh-exp-p08'

/** Loại lệnh P08 ghi vào `cnh_exp_command.command_type`. */
export const LENH_HAP_THU = 'hap_thu' as const
export const LENH_REN_KHIEN = 'ren_khien' as const
export const LENH_DOI_VANG = 'doi_vang' as const

const LICH_CHO_MS = [20, 40, 80, 160, 320] as const
const macDinhUuid = (): string => crypto.randomUUID()
const macDinhSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
const jitter = (ms: number): number => ms + Math.floor(Math.random() * Math.max(1, Math.floor(ms / 4)))

export type MaLoiLenhP08 = 'NOT_FOUND' | 'IDEMPOTENCY_CONFLICT' | 'CORRUPT_STATE' | 'KHONG_DU_DIEU_KIEN' | 'RETRYABLE_CONFLICT'

/** Lỗi lớp lệnh P08. Đọc `.ma`, KHÔNG bắt theo chuỗi thông điệp (giống `LoiNopBai.ma`). */
export class LoiLenhP08 extends Error {
  readonly ma: MaLoiLenhP08
  constructor(ma: MaLoiLenhP08, thongDiep: string) {
    super(thongDiep)
    this.name = 'LoiLenhP08'
    this.ma = ma
  }
}

/** Chỗ cắm cho test (uuid/ngủ tất định). Production không truyền ⇒ dùng mặc định. */
export interface PhuThuocLenhP08 {
  uuid?: () => string
  sleep?: (ms: number) => Promise<void>
}

type DbDoc = Pick<D1Database, 'prepare'>

/** Một hàng ví P07 (nguồn sự thật của `wallet_exp`). */
interface DongTaiKhoan {
  wallet_exp: number
  earned_exp: number
  revision: number
}

/** Một hàng trạng thái P08. */
interface DongBangP08 {
  absorbed_day: string
  absorbed_today: number
  invested_exp: number
  level: number
  fragment_balance: number
  unused_shields: number
  used_shields: number
  first_shield_claimed: number
  achieved_days: number
  gold: number
  revision: number
}

interface DongLenh {
  request_hash: string
  response_json: string
}

const soNguyenAnToan = (v: unknown): boolean => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0

function kiemTraTaiKhoan(r: DongTaiKhoan): DongTaiKhoan {
  if (!soNguyenAnToan(r.wallet_exp) || !soNguyenAnToan(r.earned_exp) || !soNguyenAnToan(r.revision)) {
    throw new LoiLenhP08('CORRUPT_STATE', 'hàng `cnh_exp_account` hỏng (âm/thập phân/tràn)')
  }
  return r
}

function kiemTraBangP08(r: DongBangP08): DongBangP08 {
  const so = [
    r.absorbed_today, r.invested_exp, r.level, r.fragment_balance, r.unused_shields,
    r.used_shields, r.first_shield_claimed, r.achieved_days, r.gold, r.revision,
  ]
  if (!so.every(soNguyenAnToan)) throw new LoiLenhP08('CORRUPT_STATE', 'hàng `cnh_exp_p08_state` hỏng (âm/thập phân/tràn)')
  if (r.level < 1 || r.level > KINH_TE.maxLevel) throw new LoiLenhP08('CORRUPT_STATE', `cấp ${r.level} ngoài 1…${KINH_TE.maxLevel}`)
  if (r.absorbed_today > KINH_TE.achievedAbsorbCap) throw new LoiLenhP08('CORRUPT_STATE', `absorbed_today ${r.absorbed_today} vượt trần ngày`)
  if (r.invested_exp > TRAN_INVESTED_EXP) throw new LoiLenhP08('CORRUPT_STATE', `invested_exp ${r.invested_exp} vượt đường cấp`)
  // `level` là số DẪN XUẤT ⇒ hàng lệch cấp/thâm nhập là hàng HỎNG, không được im lặng dùng.
  const capThat = capTuInvestedExp(r.invested_exp).level
  if (capThat !== r.level) {
    throw new LoiLenhP08('CORRUPT_STATE', `cấp ${r.level} KHÔNG khớp invested_exp ${r.invested_exp} (phải là ${capThat})`)
  }
  return r
}

async function docTaiKhoan(db: DbDoc, studentId: string): Promise<DongTaiKhoan | null> {
  const r = await db
    .prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?')
    .bind(studentId)
    .first<DongTaiKhoan>()
  return r == null ? null : kiemTraTaiKhoan(r)
}

async function docBangP08(db: DbDoc, studentId: string): Promise<DongBangP08 | null> {
  const r = await db
    .prepare(
      `SELECT absorbed_day, absorbed_today, invested_exp, level, fragment_balance, unused_shields,
              used_shields, first_shield_claimed, achieved_days, gold, revision
         FROM cnh_exp_p08_state WHERE student_id = ?`,
    )
    .bind(studentId)
    .first<DongBangP08>()
  return r == null ? null : kiemTraBangP08(r)
}

/** Trần hấp thụ theo NGÀY VN — NGUỒN THẬT là SỔ CŨ (`exp_so` + `su_kien_hoc`), KHÔNG phải `cnh_exp_day`.
 * ⚠️ VÌ SAO (25/09 — lỗi "thú không cho ăn được"): `cnh_exp_day` là bảng P07 do đường nộp-bài/quyết-toán P07
 * ghi — đường đó CHƯA nối (`cnh-exp-adapter.ts` tự khai "chưa route nào được nối") ⇒ bảng LUÔN RỖNG ⇒ hàm này
 * luôn trả `chua_hoc` ⇒ trần hấp thụ = 0 ⇒ `take = 0` ⇒ THÚ KHÔNG ĂN ĐƯỢC. Nay đọc đúng nguồn "đạt ngày" đang
 * sống (`exp_so.loai='dat_ngay'`) + "có học" (`su_kien_hoc` ≥ `CO_HOC_TOI_THIEU_CAU` câu KHÁC NHAU) — ĐỒNG BỘ
 * với `docTranHapThu` (`game-v2-hap-thu.ts`), nguồn mà đường `hapThu` CŨ vẫn dùng.
 * Đọc qua `db` (phiên `first-primary` khi có) để không lệch bản sao. Lỗi đọc ⇒ coi như chưa học (trần 0: an toàn). */
async function docTrangThaiNgay(db: DbDoc, studentId: string, learningDay: string): Promise<TrangThaiNgay> {
  let dat = 0
  try {
    const r = await db
      .prepare("SELECT COUNT(*) AS n FROM exp_so WHERE sbd = ? AND ngay_vn = ? AND loai = 'dat_ngay'")
      .bind(studentId, learningDay)
      .first<{ n: number }>()
    dat = Math.max(0, Math.floor(Number(r?.n) || 0))
  } catch {
    dat = 0
  }
  if (dat > 0) return 'achieved'
  let hoc = 0
  try {
    const r = await db
      .prepare('SELECT COUNT(DISTINCT qid) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND ket_qua IS NOT NULL')
      .bind(studentId, learningDay)
      .first<{ n: number }>()
    hoc = Math.max(0, Math.floor(Number(r?.n) || 0))
  } catch {
    hoc = 0
  }
  return hoc >= CO_HOC_TOI_THIEU_CAU ? 'studied' : 'chua_hoc'
}

async function docLenh(db: DbDoc, studentId: string, commandType: string, requestId: string): Promise<DongLenh | null> {
  const r = await db
    .prepare(
      `SELECT request_hash, response_json FROM cnh_exp_command
        WHERE student_id = ? AND command_type = ? AND request_id = ?`,
    )
    .bind(studentId, commandType, requestId)
    .first<DongLenh>()
  return r ?? null
}

/**
 * KHUNG LỆNH dùng chung cho cả ba lệnh: một phiên `first-primary`, receipt-first, CAS, MỘT batch.
 *
 * Hợp đồng (mượn nguyên `quyetToanQuyenCore`):
 *   1. Có receipt cùng `request_id` ⇒ hash khớp thì TRẢ NGUYÊN phản hồi cũ; khác ⇒ IDEMPOTENCY_CONFLICT.
 *   2. Thiếu ví/trạng thái P08 ⇒ NOT_FOUND (substrate KHÔNG tự đẻ ví/trạng thái).
 *   3. `dung(ctx)` tính phản hồi + các câu ghi (KHÔNG gồm câu chiếm CAS — khung tự dựng).
 *   4. Thua CAS là no-op IM LẶNG (`ON CONFLICT … DO NOTHING`) ⇒ đọc lại, thử lại; hết lượt ⇒ RETRYABLE_CONFLICT.
 *   5. Chỉ câu "đã chiếm được CAS" nằm ở WHERE ngoài của cửa canh; bất biến nằm trong CASE ⇒ hỏng là LỖI CỨNG.
 */
export interface ChungLenhP08 {
  studentId: string
  learningDay: string
  requestHash: string
  requestId: string
}

interface BoiCanhLenh {
  chung: ChungLenhP08
  taiKhoan: DongTaiKhoan
  bang: DongBangP08
  /** Trần hấp thụ của NGÀY VN hiện tại (`03` §6) — hai lệnh tiêu không dùng tới. */
  trangThaiNgay: TrangThaiNgay
  /** CHỈ ĐỂ ĐỌC (hook tra sổ/ngày). Mọi GHI bắt buộc đi qua `CauGhi` trong batch. */
  doc: DbDoc
}

interface KetQuaDung<T> {
  phanHoi: T
  /** Các câu ghi SAU câu chiếm CAS (giữ nguyên thứ tự). Khung tự `prepare`/`bind`. */
  ghi: (executionId: string) => CauGhi[]
  /**
   * HOOK tuỳ chọn: tìm một receipt ĐÃ CÓ cho CÙNG đối tượng nhưng KHÁC `request_id` (tất định theo
   * đối tượng, ví dụ theo `(học sinh, ngày, loại)`). Trả về ⇒ phát lại NGUYÊN phản hồi cũ.
   * Dùng cho lệnh mà khoá tự nhiên là DỮ LIỆU (sổ mảnh) chứ không phải `request_id`.
   */
  timLenhCu?: () => Promise<DongLenh | null>
  /**
   * ĐIỀU KIỆN PHỤ cho câu chiếm CAS (SQL + tham số). Thua điều kiện này giống thua CAS: no-op IM LẶNG
   * ⇒ khung đọc lại/thử lại. Dùng cho "khoá tự nhiên theo dữ liệu" (ví dụ: chưa có hàng sổ mảnh).
   */
  dieuKienClaim?: { sql: string; bind: unknown[] }
}

/** Một câu ghi: SQL + tham số. Lệnh KHÔNG cầm `db` ⇒ không thể lỡ tay ghi ngoài batch. */
export interface CauGhi {
  sql: string
  bind: unknown[]
}

async function chayLenhP08<T>(
  env: Env,
  commandType: string,
  chung: ChungLenhP08,
  dung: (ctx: BoiCanhLenh) => KetQuaDung<T>,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<T> {
  const uuid = phuThuoc.uuid ?? macDinhUuid
  const sleep = phuThuoc.sleep ?? macDinhSleep
  if (!chung.studentId || !chung.learningDay || !chung.requestHash || !chung.requestId) {
    throw new LoiLenhP08('NOT_FOUND', 'thiếu studentId/learningDay/requestHash/requestId')
  }

  // MỘT phiên cho MỌI đọc VÀ ghi: lệnh này là đọc-sau-ghi nên KHÔNG được đọc bản sao.
  const session: D1DatabaseSession | null =
    typeof env.DB.withSession === 'function' ? env.DB.withSession('first-primary') : null
  const dbDoc: DbDoc = session ?? env.DB
  const dbGhi: D1Database = (session as unknown as D1Database) ?? env.DB

  for (let lanThu = 0; lanThu < SO_LAN_THU_LAI; lanThu++) {
    // 1. Receipt trước: cùng chìa khoá + cùng hash ⇒ trả NGUYÊN phản hồi đã lưu.
    const lenhCu = await docLenh(dbDoc, chung.studentId, commandType, chung.requestId)
    if (lenhCu) {
      if (lenhCu.request_hash !== chung.requestHash) {
        throw new LoiLenhP08('IDEMPOTENCY_CONFLICT', `request_id ${chung.requestId} đã dùng với payload khác`)
      }
      return JSON.parse(lenhCu.response_json) as T
    }

    // 2. Trạng thái SỐNG trên primary.
    const taiKhoan = await docTaiKhoan(dbDoc, chung.studentId)
    const bang = await docBangP08(dbDoc, chung.studentId)
    if (!taiKhoan || !bang) {
      throw new LoiLenhP08('NOT_FOUND', `thiếu ví hoặc trạng thái P08 của ${chung.studentId}`)
    }

    // 3. Tính bằng hàm THUẦN (không tính lại chính sách ở đây).
    const trangThaiNgay = await docTrangThaiNgay(dbDoc, chung.studentId, chung.learningDay)
    const executionId = uuid()
    const { phanHoi, ghi, timLenhCu, dieuKienClaim } = dung({ chung, taiKhoan, bang, trangThaiNgay, doc: dbDoc })

    // 3b. Lệnh có khoá tự nhiên theo DỮ LIỆU: đã có receipt cũ ⇒ phát lại NGUYÊN kết quả đã chốt,
    //     KHÔNG chiếm CAS lần nữa (nên `request_id` khác vẫn idempotent — đúng cho "1 mảnh/ngày đạt").
    if (timLenhCu) {
      const cu = await timLenhCu()
      if (cu) return JSON.parse(cu.response_json) as T
    }

    // 4. MỘT batch: chiếm CAS → các câu ghi → cửa canh bất biến.
    const themSql = dieuKienClaim ? ` AND (${dieuKienClaim.sql})` : ''
    const claim = dbGhi
      .prepare(
        `INSERT INTO cnh_exp_command
           (student_id, command_type, request_id, request_hash, execution_id, response_json, committed_revision)
         SELECT ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM cnh_exp_account WHERE student_id = ? AND revision = ?)
            AND EXISTS (SELECT 1 FROM cnh_exp_p08_state WHERE student_id = ? AND revision = ?)${themSql}
         ON CONFLICT (student_id, command_type, request_id) DO NOTHING`,
      )
      .bind(
        chung.studentId,
        commandType,
        chung.requestId,
        chung.requestHash,
        executionId,
        JSON.stringify(phanHoi),
        bang.revision + 1,
        chung.studentId,
        taiKhoan.revision,
        chung.studentId,
        bang.revision,
        ...(dieuKienClaim?.bind ?? []),
      )

    await dbGhi.batch([claim, ...ghi(executionId).map((c) => dbGhi.prepare(c.sql).bind(...(c.bind as never[])))])

    // 5. Xác nhận đã chiếm được (thua CAS là no-op im lặng ⇒ thử lại).
    const daClaim = await docLenh(dbDoc, chung.studentId, commandType, chung.requestId)
    if (!daClaim) {
      await sleep(jitter(LICH_CHO_MS[Math.min(lanThu, LICH_CHO_MS.length - 1)]))
      continue
    }
    if (daClaim.request_hash !== chung.requestHash) {
      throw new LoiLenhP08('IDEMPOTENCY_CONFLICT', `request_id ${chung.requestId} đã dùng với payload khác`)
    }
    return JSON.parse(daClaim.response_json) as T
  }
  throw new LoiLenhP08('RETRYABLE_CONFLICT', `hết ${SO_LAN_THU_LAI} lượt thử lại lệnh P08`)
}

// ───────────────────────── LỆNH 1: HẤP THỤ (`03` §6) ─────────────────────────

export interface PhanHoiHapThu {
  commandType: typeof LENH_HAP_THU
  studentId: string
  learningDay: string
  policyVersion: string
  trangThaiNgay: TrangThaiNgay
  take: number
  absorbedTodayAfter: number
  investedExpAfter: number
  levelAfter: number
  progressAfter: number
  walletAfter: number
  /** Còn lại của trần NGÀY sau lượt này (nơi nối hiển thị "hấp thụ còn lại hôm nay"). */
  conLaiTranNgay: number
  /** Đã chạm cấp tối đa ⇒ không hấp thụ thêm (§6). */
  chamTranCap: boolean
  committedRevision: number
}

/**
 * HẤP THỤ (`03` §6). Một lượt = ví giảm, `invested_exp`/`level`/`absorbed_today`/receipt đổi CÙNG lúc.
 *
 * Sang NGÀY VN MỚI (`absorbed_day` khác) thì hạn mức coi như 0 — hạn mức là CỦA NGÀY (`03` §5:
 * "không cho dùng bù hạn mức hấp thụ đã bỏ qua ngày cũ"), KHÔNG cộng dồn ngày bỏ qua.
 */
export async function hapThuCore(
  env: Env,
  yeuCau: ChungLenhP08,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiHapThu> {
  return chayLenhP08<PhanHoiHapThu>(env, LENH_HAP_THU, yeuCau, ({ chung, taiKhoan, bang, trangThaiNgay }) => {
    const daHapHomNay = bang.absorbed_day === chung.learningDay ? bang.absorbed_today : 0
    const kq = tinhHapThu({
      walletExp: taiKhoan.wallet_exp,
      absorbedToday: daHapHomNay,
      trangThaiNgay,
      investedExp: bang.invested_exp,
    })
    const phanHoi: PhanHoiHapThu = {
      commandType: LENH_HAP_THU,
      studentId: chung.studentId,
      learningDay: chung.learningDay,
      policyVersion: PHIEN_BAN_CHINH_SACH,
      trangThaiNgay,
      take: kq.take,
      absorbedTodayAfter: kq.absorbedTodayAfter,
      investedExpAfter: kq.investedExpAfter,
      levelAfter: kq.levelAfter,
      progressAfter: kq.progressAfter,
      walletAfter: kq.walletAfter,
      conLaiTranNgay: kq.conLaiTranNgay,
      chamTranCap: kq.chamTranCap,
      committedRevision: bang.revision + 1,
    }
    return {
      phanHoi,
      ghi: (executionId) => [
        {
          // Ví P07: trừ ĐÚNG `take`. `wallet_exp >= take` để không bao giờ âm (vi phạm CHECK là rollback cả batch).
          sql: `UPDATE cnh_exp_account
                   SET wallet_exp = wallet_exp - ?, revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ? AND wallet_exp >= ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [kq.take, chung.studentId, taiKhoan.revision, kq.take, executionId],
        },
        {
          sql: `UPDATE cnh_exp_p08_state
                   SET absorbed_day = ?, absorbed_today = ?, invested_exp = ?, level = ?,
                       revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            chung.learningDay,
            kq.absorbedTodayAfter,
            kq.investedExpAfter,
            kq.levelAfter,
            chung.studentId,
            bang.revision,
            executionId,
          ],
        },
        {
          // Cửa canh: chỉ chèn khi ĐÃ chiếm CAS; bất biến trong CASE ⇒ hỏng là LỖI CỨNG (cả batch rollback).
          sql: `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
                SELECT ?,
                       CASE WHEN
                         (SELECT COUNT(*) FROM cnh_exp_account
                           WHERE student_id = ? AND revision = ? AND wallet_exp = ?) = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_p08_state
                               WHERE student_id = ? AND revision = ? AND absorbed_day = ?
                                 AND absorbed_today = ? AND invested_exp = ? AND level = ?) = 1
                       THEN 1 ELSE 0 END
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            executionId,
            chung.studentId,
            taiKhoan.revision + 1,
            kq.walletAfter,
            chung.studentId,
            bang.revision + 1,
            chung.learningDay,
            kq.absorbedTodayAfter,
            kq.investedExpAfter,
            kq.levelAfter,
            executionId,
          ],
        },
      ],
    }
  }, phuThuoc)
}

// ───────────── LỆNH 2: GHI MẢNH NGÀY ĐẠT (`03` §7.1) ─────────────

export const LENH_MANH_NGAY_DAT = 'manh_ngay_dat' as const
const LOAI_MANH = 'achieved_fragment' as const

export interface PhanHoiManhNgayDat {
  commandType: typeof LENH_MANH_NGAY_DAT
  studentId: string
  learningDay: string
  policyVersion: string
  fragmentEarned: number
  fragmentBalanceAfter: number
  achievedDaysAfter: number
  committedRevision: number
}

/** Yêu cầu ghi mảnh. `daDat` để nơi gọi TIN CẬY khẳng định ngày đã đạt (xem doc dưới). */
export interface YeuCauManhNgayDat extends ChungLenhP08 {
  /**
   * `true` = NƠI GỌI (đường máy chủ đã tự xác định "đạt ngày" từ sổ/plan) KHẲNG ĐỊNH ngày này ĐẠT,
   * nên KHÔNG cần tra `cnh_exp_day` (bảng P07).
   *
   * ⚠️ VÌ SAO CẦN: trong giai đoạn đường EXP CŨ còn chạy (chưa cutover), "đạt ngày" nằm ở `exp_so`
   * (`loai='dat_ngay'`) chứ KHÔNG ở `cnh_exp_day` ⇒ tra `cnh_exp_day` sẽ luôn ra "chưa đạt" và mảnh
   * KHÔNG BAO GIỜ được ghi. Chỉ đường máy chủ TIN CẬY mới được đặt cờ này; client KHÔNG bao giờ.
   */
  daDat?: boolean
}

/**
 * MỖI NGÀY ĐẠT tạo ĐÚNG MỘT hàng sổ mảnh (`03` §7.1). `studied` KHÔNG cho mảnh.
 *
 * KHOÁ TỰ NHIÊN LÀ DỮ LIỆU `(student, learning_day, achieved_fragment)`, KHÔNG phải `request_id`:
 * - Đã có hàng ⇒ phát lại NGUYÊN receipt cũ (kể cả `request_id` khác) ⇒ "không tạo ngày thứ hai",
 *   và "correction trả lại cùng quyền" cũng không đẻ hàng mới.
 * - Thua điều kiện "chưa có hàng" là no-op IM LẶNG ⇒ khung thử lại ⇒ gặp nhánh phát lại ở trên.
 */
export async function ghiManhNgayDat(
  env: Env,
  yeuCau: YeuCauManhNgayDat,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiManhNgayDat> {
  return chayLenhP08<PhanHoiManhNgayDat>(
    env,
    LENH_MANH_NGAY_DAT,
    yeuCau,
    ({ chung, bang, trangThaiNgay, doc }) => {
      // §7.1: mảnh CHỈ sinh từ NGÀY ĐẠT. `daDat` = nơi gọi TIN CẬY đã tự xác định "đạt" (giai đoạn đường
      // EXP cũ còn chạy, "đạt ngày" nằm ở `exp_so` chứ chưa ở `cnh_exp_day`).
      if (yeuCau.daDat !== true && trangThaiNgay !== 'achieved') {
        throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `ngày ${chung.learningDay} chưa đạt ⇒ không có mảnh (§7.1)`)
      }
      const them = KINH_TE.fragmentPerAchievedDay
      const phanHoi: PhanHoiManhNgayDat = {
        commandType: LENH_MANH_NGAY_DAT,
        studentId: chung.studentId,
        learningDay: chung.learningDay,
        policyVersion: PHIEN_BAN_CHINH_SACH,
        fragmentEarned: them,
        fragmentBalanceAfter: bang.fragment_balance + them,
        achievedDaysAfter: bang.achieved_days + 1,
        committedRevision: bang.revision + 1,
      }
      return {
        phanHoi,
        dieuKienClaim: {
          sql: 'NOT EXISTS (SELECT 1 FROM cnh_exp_fragment_ledger WHERE student_id = ? AND learning_day = ? AND kind = ?)',
          bind: [chung.studentId, chung.learningDay, LOAI_MANH],
        },
        timLenhCu: async () => {
          const so = await doc
            .prepare('SELECT execution_id FROM cnh_exp_fragment_ledger WHERE student_id = ? AND learning_day = ? AND kind = ?')
            .bind(chung.studentId, chung.learningDay, LOAI_MANH)
            .first<{ execution_id: string }>()
          if (!so) return null
          const lenh = await doc
            .prepare('SELECT request_hash, response_json FROM cnh_exp_command WHERE execution_id = ?')
            .bind(so.execution_id)
            .first<DongLenh>()
          return lenh ?? null
        },
        ghi: (executionId) => [
          {
            sql: `INSERT INTO cnh_exp_fragment_ledger
                    (entry_id, student_id, learning_day, policy_version, kind, delta, execution_id)
                  SELECT ?, ?, ?, ?, ?, ?, ?
                   WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
            bind: [`manh:${chung.studentId}:${chung.learningDay}`, chung.studentId, chung.learningDay, PHIEN_BAN_CHINH_SACH, LOAI_MANH, them, executionId, executionId],
          },
          {
            sql: `UPDATE cnh_exp_p08_state
                     SET fragment_balance = fragment_balance + ?, achieved_days = achieved_days + 1,
                         revision = revision + 1, cap_nhat_luc = datetime('now')
                   WHERE student_id = ? AND revision = ?
                     AND EXISTS (SELECT 1 FROM cnh_exp_fragment_ledger WHERE execution_id = ?)`,
            bind: [them, chung.studentId, bang.revision, executionId],
          },
          {
            sql: `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
                  SELECT ?,
                         CASE WHEN
                           (SELECT COUNT(*) FROM cnh_exp_p08_state
                             WHERE student_id = ? AND revision = ? AND fragment_balance = ? AND achieved_days = ?) = 1
                           AND (SELECT COUNT(*) FROM cnh_exp_fragment_ledger
                                 WHERE execution_id = ? AND student_id = ? AND learning_day = ?
                                   AND kind = ? AND delta = ?) = 1
                           AND (SELECT COUNT(*) FROM cnh_exp_fragment_ledger
                                 WHERE student_id = ?) = (SELECT achieved_days FROM cnh_exp_p08_state WHERE student_id = ?)
                         THEN 1 ELSE 0 END
                   WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
            bind: [
              executionId,
              chung.studentId,
              bang.revision + 1,
              bang.fragment_balance + them,
              bang.achieved_days + 1,
              executionId,
              chung.studentId,
              chung.learningDay,
              LOAI_MANH,
              them,
              chung.studentId,
              chung.studentId,
              executionId,
            ],
          },
        ],
      }
    },
    phuThuoc,
  )
}

// ───────────── LỆNH 3: RÈN KHIÊN (`03` §7.1) ─────────────

export interface PhanHoiKhien {
  commandType: typeof LENH_REN_KHIEN
  studentId: string
  learningDay: string
  loai: 'first' | 'later'
  claimIndex: number
  expCost: number
  fragmentsAfter: number
  walletAfter: number
  unusedAfter: number
  firstClaimedAfter: boolean
  committedRevision: number
}

/**
 * ĐỔI MỘT KHIÊN (`03` §7.1) — `claim_shield`. Nút quà và nút rèn chỉ là adapter vào CHÍNH lệnh này.
 * Dùng `xetKhien` (hàm thuần). Không đủ điều kiện ⇒ NÉM `KHONG_DU_DIEU_KIEN` (KHÔNG ghi gì).
 * `first` KHÔNG trừ ví; `later` trừ 300 và đòi ví ≥ 700. `claim_index` = tổng khiên đã cấp + 1.
 */
export async function renKhienCore(
  env: Env,
  yeuCau: ChungLenhP08,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiKhien> {
  return chayLenhP08<PhanHoiKhien>(env, LENH_REN_KHIEN, yeuCau, ({ chung, taiKhoan, bang }) => {
    const kq = xetKhien({
      level: bang.level,
      fragmentBalance: bang.fragment_balance,
      unusedShields: bang.unused_shields,
      usedShields: bang.used_shields,
      achievedDays: bang.achieved_days,
      firstShieldClaimed: bang.first_shield_claimed === 1,
      walletExp: taiKhoan.wallet_exp,
    })
    if (kq.loai === 'khong' || kq.claimIndexAfter === null) {
      throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', kq.lyDo || 'chưa đủ điều kiện đổi khiên')
    }
    const phanHoi: PhanHoiKhien = {
      commandType: LENH_REN_KHIEN,
      studentId: chung.studentId,
      learningDay: chung.learningDay,
      loai: kq.loai,
      claimIndex: kq.claimIndexAfter,
      expCost: kq.expCost,
      fragmentsAfter: kq.fragmentBalanceAfter,
      walletAfter: kq.walletAfter,
      unusedAfter: kq.unusedAfter,
      firstClaimedAfter: kq.firstClaimedAfter,
      committedRevision: bang.revision + 1,
    }
    return {
      phanHoi,
      ghi: (executionId) => [
        {
          // Ví: `first` giữ nguyên (chỉ tăng revision), `later` trừ 300. Vẫn đòi `wallet_exp >= expCost`.
          sql: `UPDATE cnh_exp_account
                   SET wallet_exp = wallet_exp - ?, revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ? AND wallet_exp >= ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [kq.expCost, chung.studentId, taiKhoan.revision, kq.expCost, executionId],
        },
        {
          sql: `UPDATE cnh_exp_p08_state
                   SET fragment_balance = ?, unused_shields = ?, first_shield_claimed = 1,
                       first_claim_status = 'claimed',
                       revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [kq.fragmentBalanceAfter, kq.unusedAfter, chung.studentId, bang.revision, executionId],
        },
        {
          sql: `INSERT INTO cnh_exp_spend_ledger
                  (entry_id, student_id, command_type, request_id, claim_index, exp_delta, gold_delta,
                   fragments_delta, shields_delta, execution_id)
                SELECT ?, ?, 'ren_khien', ?, ?, ?, 0, ?, 1, ?
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            `chi:${chung.studentId}:ren_khien:${chung.requestId}`,
            chung.studentId,
            chung.requestId,
            kq.claimIndexAfter,
            -kq.expCost,
            -KINH_TE.fragmentsPerShield,
            executionId,
            executionId,
          ],
        },
        {
          sql: `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
                SELECT ?,
                       CASE WHEN
                         (SELECT COUNT(*) FROM cnh_exp_account
                           WHERE student_id = ? AND revision = ? AND wallet_exp = ?) = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_p08_state
                               WHERE student_id = ? AND revision = ? AND fragment_balance = ?
                                 AND unused_shields = ? AND first_shield_claimed = 1
                                 AND first_claim_status = 'claimed') = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_spend_ledger
                               WHERE execution_id = ? AND command_type = 'ren_khien' AND request_id = ?
                                 AND claim_index = ? AND exp_delta = ? AND shields_delta = 1) = 1
                       THEN 1 ELSE 0 END
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            executionId,
            chung.studentId,
            taiKhoan.revision + 1,
            kq.walletAfter,
            chung.studentId,
            bang.revision + 1,
            kq.fragmentBalanceAfter,
            kq.unusedAfter,
            executionId,
            chung.requestId,
            kq.claimIndexAfter,
            -kq.expCost,
            executionId,
          ],
        },
      ],
    }
  }, phuThuoc)
}

// ───────────── LỆNH 4: ĐỔI VÀNG (`03` §8) ─────────────

export interface YeuCauDoiVang extends ChungLenhP08 {
  soExp: number
}

export interface PhanHoiDoiVang {
  commandType: typeof LENH_DOI_VANG
  studentId: string
  learningDay: string
  soExp: number
  goldNhan: number
  walletAfter: number
  goldAfter: number
  committedRevision: number
}

/**
 * ĐỔI `x` EXP SANG VÀNG (`03` §8): `x` nguyên > 0 và `x ≤ max(0, ví − 400)`; TRỪ VÍ + CỘNG VÀNG
 * trong CÙNG một giao dịch. `x` hỏng/vượt ⇒ NÉM `KHONG_DU_DIEU_KIEN`, KHÔNG ghi gì.
 * KHÔNG cho đổi vàng ngược thành EXP (hệ thống chưa có chính sách đó).
 */
export async function doiVangCore(
  env: Env,
  yeuCau: YeuCauDoiVang,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiDoiVang> {
  return chayLenhP08<PhanHoiDoiVang>(env, LENH_DOI_VANG, yeuCau, ({ chung, taiKhoan, bang }) => {
    const kq = xetDoiVang(taiKhoan.wallet_exp, yeuCau.soExp, bang.gold)
    if (!kq.ok) throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', kq.lyDo)
    const phanHoi: PhanHoiDoiVang = {
      commandType: LENH_DOI_VANG,
      studentId: chung.studentId,
      learningDay: chung.learningDay,
      soExp: kq.expTru,
      goldNhan: kq.goldNhan,
      walletAfter: kq.walletAfter,
      goldAfter: kq.goldAfter,
      committedRevision: bang.revision + 1,
    }
    return {
      phanHoi,
      ghi: (executionId) => [
        {
          sql: `UPDATE cnh_exp_account
                   SET wallet_exp = wallet_exp - ?, revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ? AND wallet_exp >= ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [kq.expTru, chung.studentId, taiKhoan.revision, kq.expTru, executionId],
        },
        {
          sql: `UPDATE cnh_exp_p08_state
                   SET gold = gold + ?, revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [kq.goldNhan, chung.studentId, bang.revision, executionId],
        },
        {
          sql: `INSERT INTO cnh_exp_spend_ledger
                  (entry_id, student_id, command_type, request_id, claim_index, exp_delta, gold_delta,
                   fragments_delta, shields_delta, execution_id)
                SELECT ?, ?, 'doi_vang', ?, NULL, ?, ?, 0, 0, ?
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            `chi:${chung.studentId}:doi_vang:${chung.requestId}`,
            chung.studentId,
            chung.requestId,
            -kq.expTru,
            kq.goldNhan,
            executionId,
            executionId,
          ],
        },
        {
          // ⚠️ NỐI VỚI SHOP HIỆN CÓ (§8 "Vàng đã sở hữu dùng mua đồ theo bảng giá hiện tại"):
          // cửa hàng đọc số dư = `SUM(vang_so.so_vang)` ⇒ vàng đổi ở đây PHẢI vào CÙNG sổ đó, nếu không
          // em đổi được vàng mà shop KHÔNG thấy. `khoa_yeu_cau = requestId` để bấm lặp không cộng hai lần.
          sql: `INSERT INTO vang_so (sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
                SELECT ?, 'doi', ?, ?, NULL, ?, datetime('now')
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [chung.studentId, kq.goldNhan, kq.expTru, chung.requestId, executionId],
        },
        {
          sql: `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
                SELECT ?,
                       CASE WHEN
                         (SELECT COUNT(*) FROM cnh_exp_account
                           WHERE student_id = ? AND revision = ? AND wallet_exp = ?) = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_p08_state
                               WHERE student_id = ? AND revision = ? AND gold = ?) = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_spend_ledger
                               WHERE execution_id = ? AND command_type = 'doi_vang' AND request_id = ?
                                 AND claim_index IS NULL AND exp_delta = ? AND gold_delta = ?) = 1
                         AND (SELECT COUNT(*) FROM vang_so
                               WHERE sbd = ? AND khoa_yeu_cau = ? AND loai = 'doi'
                                 AND so_vang = ? AND exp_tru = ?) = 1
                       THEN 1 ELSE 0 END
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            executionId,
            chung.studentId,
            taiKhoan.revision + 1,
            kq.walletAfter,
            chung.studentId,
            bang.revision + 1,
            kq.goldAfter,
            executionId,
            chung.requestId,
            -kq.expTru,
            kq.goldNhan,
            chung.studentId,
            chung.requestId,
            kq.goldNhan,
            kq.expTru,
            executionId,
          ],
        },
      ],
    }
  }, phuThuoc)
}

// ───────────── LỆNH 5: ĐỐI CHIẾU NHÁNH `legacy_unresolved` (`03` §9.2) ─────────────

export const LENH_GIAI_QUYET_KHIEN_DAU = 'giai_quyet_khien_dau' as const

export interface YeuCauGiaiQuyet extends ChungLenhP08 {
  /** Id đối chiếu của giáo viên (duy nhất THEO học sinh). */
  legacyResolutionId: string
  /** `da_nhan` = đã chứng minh em từng nhận ⇒ ĐÓNG pending; `con_thieu` = chứng minh quyền free còn thiếu ⇒ cấp MỘT voucher. */
  ketLuan: 'da_nhan' | 'con_thieu'
  giaoVien: string
}

export interface PhanHoiGiaiQuyet {
  commandType: typeof LENH_GIAI_QUYET_KHIEN_DAU
  studentId: string
  legacyResolutionId: string
  ketLuan: 'da_nhan' | 'con_thieu'
  voucherCap: 0 | 1
  firstClaimStatus: 'claimed'
  firstShieldClaimed: 1
  unusedAfter: number
  committedRevision: number
}

/**
 * GIẢI QUYẾT nhánh `legacy_unresolved` (`03` §9.2). Cả hai kết luận đều ĐÓNG pending khiên đầu
 * (`first_claim_status = 'claimed'`, cờ = 1):
 *   * `da_nhan`   — chứng minh em ĐÃ nhận ⇒ chỉ đóng pending, KHÔNG cấp thêm gì.
 *   * `con_thieu` — chứng minh quyền free CÒN THIẾU ⇒ cấp MỘT voucher free (+1 khiên CHƯA DÙNG),
 *                   KHÔNG đụng mảnh (mảnh mới vẫn của sổ v1), và **tôn trọng kho 5** ⇒ kho đã đủ thì NÉM.
 * Idempotent theo `(student_id, legacy_resolution_id)`; chạy lại ⇒ phát lại NGUYÊN kết quả cũ.
 * "Nếu thiếu bằng chứng mãi, giữ pending" ⇒ không gọi lệnh này thì `legacy_unresolved` đứng nguyên.
 */
export async function giaiQuyetKhiendau(
  env: Env,
  yeuCau: YeuCauGiaiQuyet,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiGiaiQuyet> {
  if (!yeuCau.legacyResolutionId) throw new LoiLenhP08('NOT_FOUND', 'thiếu legacy_resolution_id')
  if (yeuCau.ketLuan !== 'da_nhan' && yeuCau.ketLuan !== 'con_thieu') {
    throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `kết luận lạ: ${String(yeuCau.ketLuan)}`)
  }
  if (!yeuCau.giaoVien) throw new LoiLenhP08('NOT_FOUND', 'thiếu tên giáo viên đối chiếu')
  return chayLenhP08<PhanHoiGiaiQuyet>(env, LENH_GIAI_QUYET_KHIEN_DAU, yeuCau, ({ chung, bang, doc }) => {
    const voucherCap: 0 | 1 = yeuCau.ketLuan === 'con_thieu' ? 1 : 0
    if (voucherCap === 1 && bang.unused_shields >= KINH_TE.maxUnusedShields) {
      throw new LoiLenhP08(
        'KHONG_DU_DIEU_KIEN',
        `kho khiên đã đủ ${bang.unused_shields}/${KINH_TE.maxUnusedShields} — voucher vẫn TÔN TRỌNG kho 5 (§9.2)`,
      )
    }
    const unusedAfter = bang.unused_shields + voucherCap
    const phanHoi: PhanHoiGiaiQuyet = {
      commandType: LENH_GIAI_QUYET_KHIEN_DAU,
      studentId: chung.studentId,
      legacyResolutionId: yeuCau.legacyResolutionId,
      ketLuan: yeuCau.ketLuan,
      voucherCap,
      firstClaimStatus: 'claimed',
      firstShieldClaimed: 1,
      unusedAfter,
      committedRevision: bang.revision + 1,
    }
    return {
      phanHoi,
      dieuKienClaim: {
        sql: 'NOT EXISTS (SELECT 1 FROM cnh_exp_p08_giai_quyet WHERE student_id = ? AND legacy_resolution_id = ?)',
        bind: [chung.studentId, yeuCau.legacyResolutionId],
      },
      timLenhCu: async () => {
        const r = await doc
          .prepare('SELECT ket_qua_json FROM cnh_exp_p08_giai_quyet WHERE student_id = ? AND legacy_resolution_id = ?')
          .bind(chung.studentId, yeuCau.legacyResolutionId)
          .first<{ ket_qua_json: string }>()
        return r ? { request_hash: '', response_json: r.ket_qua_json } : null
      },
      ghi: (executionId) => [
        {
          sql: `INSERT INTO cnh_exp_p08_giai_quyet
                  (student_id, legacy_resolution_id, ket_luan, giao_vien, voucher_cap, ket_qua_json)
                SELECT ?, ?, ?, ?, ?, ?
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [chung.studentId, yeuCau.legacyResolutionId, yeuCau.ketLuan, yeuCau.giaoVien, voucherCap, JSON.stringify(phanHoi), executionId],
        },
        {
          // KHÔNG chạm `fragment_balance` (§9.2 "không đụng mảnh mới") và KHÔNG xoá mảnh chờ.
          sql: `UPDATE cnh_exp_p08_state
                   SET first_shield_claimed = 1, first_claim_status = 'claimed', unused_shields = ?,
                       revision = revision + 1, cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [unusedAfter, chung.studentId, bang.revision, executionId],
        },
        {
          sql: `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
                SELECT ?,
                       CASE WHEN
                         (SELECT COUNT(*) FROM cnh_exp_p08_state
                           WHERE student_id = ? AND revision = ? AND first_shield_claimed = 1
                             AND first_claim_status = 'claimed' AND unused_shields = ?) = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_p08_giai_quyet
                               WHERE student_id = ? AND legacy_resolution_id = ? AND ket_luan = ? AND voucher_cap = ?) = 1
                       THEN 1 ELSE 0 END
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            executionId,
            chung.studentId,
            bang.revision + 1,
            unusedAfter,
            chung.studentId,
            yeuCau.legacyResolutionId,
            yeuCau.ketLuan,
            voucherCap,
            executionId,
          ],
        },
      ],
    }
  }, phuThuoc)
}

// ───────────── LỆNH 6: DÙNG MỘT KHIÊN TRONG GAME (`03` §7.2) ─────────────

export const LENH_DUNG_KHIEN = 'dung_khien' as const

export interface PhanHoiDungKhien {
  commandType: typeof LENH_DUNG_KHIEN
  studentId: string
  unusedAfter: number
  usedAfter: number
  committedRevision: number
}

/**
 * DÙNG MỘT KHIÊN do tác dụng trong game (`03` §7.2): *"Chỉ trừ khiên do tác dụng game được người
 * chơi dùng, với usage receipt. Khiên không tự bảo vệ/quy đổi thành ngày đạt hay thêm mảnh."*
 *
 * Ở đây chỉ CHUYỂN 1 khiên từ kho CHƯA DÙNG sang ĐÃ DÙNG (`unused−1`, `used+1`), **không** đụng mảnh,
 * **không** đụng ví, **không** cộng ngày đạt. `cnh_exp_command` + hàng sổ tiêu (`shields_delta = -1`)
 * chính là usage receipt. Vắng học KHÔNG bao giờ trừ khiên ở đây (bỏ mọi cron giảm khiên).
 */
export async function dungKhienCore(
  env: Env,
  yeuCau: ChungLenhP08,
  phuThuoc: PhuThuocLenhP08 = {},
): Promise<PhanHoiDungKhien> {
  return chayLenhP08<PhanHoiDungKhien>(env, LENH_DUNG_KHIEN, yeuCau, ({ chung, bang }) => {
    if (bang.unused_shields < 1) {
      throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', 'không còn khiên CHƯA DÙNG để dùng')
    }
    const unusedAfter = bang.unused_shields - 1
    const usedAfter = bang.used_shields + 1
    const phanHoi: PhanHoiDungKhien = {
      commandType: LENH_DUNG_KHIEN,
      studentId: chung.studentId,
      unusedAfter,
      usedAfter,
      committedRevision: bang.revision + 1,
    }
    return {
      phanHoi,
      ghi: (executionId) => [
        {
          sql: `UPDATE cnh_exp_p08_state
                   SET unused_shields = ?, used_shields = ?, revision = revision + 1,
                       cap_nhat_luc = datetime('now')
                 WHERE student_id = ? AND revision = ?
                   AND EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [unusedAfter, usedAfter, chung.studentId, bang.revision, executionId],
        },
        {
          sql: `INSERT INTO cnh_exp_spend_ledger
                  (entry_id, student_id, command_type, request_id, claim_index, exp_delta, gold_delta,
                   fragments_delta, shields_delta, execution_id)
                SELECT ?, ?, 'dung_khien', ?, NULL, 0, 0, 0, -1, ?
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [`chi:${chung.studentId}:dung_khien:${chung.requestId}`, chung.studentId, chung.requestId, executionId, executionId],
        },
        {
          sql: `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
                SELECT ?,
                       CASE WHEN
                         (SELECT COUNT(*) FROM cnh_exp_p08_state
                           WHERE student_id = ? AND revision = ? AND unused_shields = ?
                             AND used_shields = ? AND fragment_balance = ? AND first_shield_claimed = ?) = 1
                         AND (SELECT COUNT(*) FROM cnh_exp_spend_ledger
                               WHERE execution_id = ? AND command_type = 'dung_khien' AND request_id = ?
                                 AND claim_index IS NULL AND shields_delta = -1
                                 AND exp_delta = 0 AND fragments_delta = 0) = 1
                       THEN 1 ELSE 0 END
                 WHERE EXISTS (SELECT 1 FROM cnh_exp_command WHERE execution_id = ?)`,
          bind: [
            executionId,
            chung.studentId,
            bang.revision + 1,
            unusedAfter,
            usedAfter,
            bang.fragment_balance, // §7.2: dùng khiên KHÔNG đụng mảnh
            bang.first_shield_claimed,
            executionId,
            chung.requestId,
            executionId,
          ],
        },
      ],
    }
  }, phuThuoc)
}




