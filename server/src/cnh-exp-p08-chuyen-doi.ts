// CNH-1.0 P08 — CHUYỂN ĐỔI HỒ SƠ CŨ SANG P08 (`03` §9.1/§9.2).
//
// §9.1: *"Snapshot trước chuyển: level, progress, wallet, gold, items, unused_shields, used_shields,
// fragment_balance, achieved_days, absorbed_today, revision, pending receipts và nguồn sổ. Chạy
// dry-run, kiểm tổng, rồi CAS. CAS thua thì đọc lại và tính lại, không ghi đè. V1 không đổi bảng cấp
// nên giữ level/progress/wallet nguyên giá trị. … Giữ mọi khiên cũ, kể cả vượt 5."*
//
// ⚠️ MỌI số của hồ sơ cũ do CALLER đọc từ bảng legacy rồi truyền vào (tệp này KHÔNG đọc bảng legacy:
// hình dạng bảng cũ phải được chốt riêng). Ở đây chỉ CHIẾU + KIỂM + GHI, idempotent theo `migration_id`.
import type { D1Database } from './kieu'
import type { Env } from './kieu'
import { bamSha256, jsonChuanHoa } from './cnh-exp-task'
import { TRAN_INVESTED_EXP, capTuInvestedExp } from './cnh-exp-p08'
import { LoiLenhP08 } from './cnh-exp-p08-lenh'
import { tongExpToiCap } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'

export const LENH_CHUYEN_DOI = 'chuyen_doi_p08' as const

/** Trạng thái quyền khiên ĐẦU khi chuyển (`03` §9.2) — BA nhánh, không phải boolean. */
export type TrangThaiQuyenDau = 'none' | 'claimed' | 'legacy_unresolved'

/** Ảnh chụp hồ sơ cũ — §9.1 + §9.2. Caller đọc từ legacy rồi truyền vào. */
export interface AnhChupCu {
  level: number
  progress: number
  wallet: number
  gold: number
  /** Số item đang sở hữu — chỉ để KIỂM TỔNG; P08 không lưu item (§9.1 "Item IDs và vàng giữ nguyên"). */
  items: number
  unusedShields: number
  usedShields: number
  /** Số dư mảnh TIÊU ĐƯỢC (đã trừ phần đã tiêu có chứng cứ, ĐÚNG MỘT LẦN — §9.2). */
  fragmentBalance: number
  achievedDays: number
  absorbedToday: number
  revision: number
  pendingReceipts: number
  nguonSo: string
  /** §9.2: mặc định `none` (không truyền = chưa từng nhận). */
  firstClaimStatus?: TrangThaiQuyenDau
  /** §9.2: mảnh còn nhưng KHÔNG ghép được quà/rèn ⇒ giữ riêng, KHÔNG tự tiêu. */
  legacyPendingFragments?: number
}

/** Trạng thái P08 sẽ ghi (đúng cột của `cnh_exp_p08_state`). */
export interface TrangThaiP08Moi {
  absorbed_day: string
  absorbed_today: number
  invested_exp: number
  level: number
  fragment_balance: number
  unused_shields: number
  used_shields: number
  first_shield_claimed: 0 | 1
  first_claim_status: TrangThaiQuyenDau
  legacy_pending_fragments: number
  achieved_days: number
  gold: number
  revision: number
}

export interface YeuCauChuyenDoi {
  studentId: string
  /** Ngày VN HIỆN TẠI — §9.1 "không reset hạn mức đã dùng trong ngày" ⇒ phải giữ đúng ngày của `absorbed_today`. */
  learningDay: string
  migrationId: string
  /** `00:00` ngày VN kế tiếp (§9.1), dạng ISO. */
  effectiveAt: string
  oldPolicy: string
  newPolicy: string
  snapshot: AnhChupCu
  /** `true` ⇒ CHỈ tính và trả kết quả, KHÔNG ghi gì (§9.1 "chạy dry-run, kiểm tổng, rồi CAS"). */
  dryRun: boolean
}

export interface KetQuaChuyenDoi {
  studentId: string
  migrationId: string
  dryRun: boolean
  /** Đã chuyển từ trước (chạy lại CÙNG `migration_id`) ⇒ không ghi gì thêm. */
  daChuyen: boolean
  effectiveAt: string
  oldPolicy: string
  newPolicy: string
  snapshotHash: string
  investedExp: number
  soNgayDat: number
  state: TrangThaiP08Moi
}

const soNguyen = (v: unknown, ten: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new LoiLenhP08('CORRUPT_STATE', `ảnh chụp: ${ten} phải là số nguyên >= 0, nhận ${String(v)}`)
  }
  if (!Number.isSafeInteger(v)) throw new LoiLenhP08('CORRUPT_STATE', `ảnh chụp: ${ten} vượt miền an toàn`)
  return v
}

const MOT_NGAY_MS = 86_400_000

/**
 * KIỂM HIỆU LỰC (`03` §9.1): *"Hiệu lực lúc 00:00 ngày VN kế tiếp sau khi sẵn sàng migration"*.
 * Chặn `effective_at` lệch (nửa đêm giờ khác, hoặc không phải ngày kế tiếp) — hiệu lực sai giờ sẽ
 * làm lệnh cắt giữa ngày và phá luật "KHÔNG reset hạn mức đã dùng trong ngày" (§9.1).
 * VN = UTC+7 ⇒ 00:00 giờ VN chính là 17:00:00Z của NGÀY HÔM TRƯỚC.
 */
export function kiemTraHieuLucP08(effectiveAt: unknown, learningDay: string): string {
  if (typeof effectiveAt !== 'string') throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', 'effective_at phải là chuỗi ISO')
  const ms = Date.parse(effectiveAt)
  if (!Number.isFinite(ms)) throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `effective_at không phải mốc ISO: ${effectiveAt}`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(learningDay)) throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `learning_day phải YYYY-MM-DD: ${learningDay}`)
  const vn = new Date(ms + 7 * 3600 * 1000)
  if (vn.getUTCHours() !== 0 || vn.getUTCMinutes() !== 0 || vn.getUTCSeconds() !== 0 || vn.getUTCMilliseconds() !== 0) {
    throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `hiệu lực phải đúng 00:00 GIỜ VN (§9.1), nhận ${effectiveAt}`)
  }
  const ngayVn = vn.toISOString().slice(0, 10)
  const homSau = new Date(Date.parse(`${learningDay}T00:00:00.000Z`) + MOT_NGAY_MS).toISOString().slice(0, 10)
  if (ngayVn !== homSau) {
    throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `hiệu lực phải rơi vào NGÀY VN KẾ TIẾP ${homSau} (§9.1), nhận ${ngayVn}`)
  }
  return effectiveAt
}

/**
 * CHIẾU hồ sơ cũ → trạng thái P08. Thuần, KHÔNG ghi.
 *
 * §9.1 "V1 không đổi bảng cấp": `invested_exp = tongExpToiCap(level) + progress`, và phải ĐI VÒNG
 * đúng lại (level, progress) qua `capTuInvestedExp` — lệch là ảnh chụp hỏng. `first_shield_claimed`
 * suy từ `first_claim_status` (§9.2), không tin cờ rời.
 */
export function chieuTrangThaiP08(yc: YeuChauChieu): TrangThaiP08Moi {
  const s = yc.snapshot
  const level = soNguyen(s.level, 'level')
  const progress = soNguyen(s.progress, 'progress')
  const unused = soNguyen(s.unusedShields, 'unused_shields')
  const used = soNguyen(s.usedShields, 'used_shields')
  const fragmentBalance = soNguyen(s.fragmentBalance, 'fragment_balance')
  const achievedDays = soNguyen(s.achievedDays, 'achieved_days')
  const absorbedToday = soNguyen(s.absorbedToday, 'absorbed_today')
  const gold = soNguyen(s.gold, 'gold')
  const legacyPending = soNguyen(s.legacyPendingFragments ?? 0, 'legacy_pending_fragments')
  if (level < 1 || level > 120) throw new LoiLenhP08('CORRUPT_STATE', `ảnh chụp: level ${level} ngoài 1…120`)
  const trangThai: TrangThaiQuyenDau = s.firstClaimStatus ?? 'none'
  if (trangThai !== 'none' && trangThai !== 'claimed' && trangThai !== 'legacy_unresolved') {
    throw new LoiLenhP08('CORRUPT_STATE', `first_claim_status lạ: ${String(trangThai)}`)
  }

  const investedExp = tongExpToiCap(level) + progress
  if (investedExp > TRAN_INVESTED_EXP) {
    throw new LoiLenhP08('CORRUPT_STATE', `ảnh chụp: level/progress vượt đường cấp (${investedExp} > ${TRAN_INVESTED_EXP})`)
  }
  const lai = capTuInvestedExp(investedExp)
  if (lai.level !== level || lai.progress !== progress) {
    throw new LoiLenhP08(
      'CORRUPT_STATE',
      `ảnh chụp LỆCH: level ${level} + progress ${progress} đi vòng ra cấp ${lai.level} + tiến độ ${lai.progress}`,
    )
  }

  return {
    absorbed_day: yc.learningDay,
    absorbed_today: absorbedToday,
    invested_exp: investedExp,
    level,
    fragment_balance: fragmentBalance,
    unused_shields: unused,
    used_shields: used,
    first_shield_claimed: trangThai === 'claimed' ? 1 : 0,
    first_claim_status: trangThai,
    legacy_pending_fragments: legacyPending,
    achieved_days: achievedDays,
    gold,
    revision: 0,
  }
}

interface YeuChauChieu {
  learningDay: string
  snapshot: AnhChupCu
}

const COT_TRANG_THAI =
  'student_id, absorbed_day, absorbed_today, invested_exp, level, fragment_balance, unused_shields, used_shields, ' +
  'first_shield_claimed, first_claim_status, legacy_pending_fragments, achieved_days, gold, revision'

const bindTrangThai = (studentId: string, t: TrangThaiP08Moi): unknown[] => [
  studentId,
  t.absorbed_day,
  t.absorbed_today,
  t.invested_exp,
  t.level,
  t.fragment_balance,
  t.unused_shields,
  t.used_shields,
  t.first_shield_claimed,
  t.first_claim_status,
  t.legacy_pending_fragments,
  t.achieved_days,
  t.gold,
  t.revision,
]

interface DongChuyenDoi {
  migration_id: string
  ket_qua_json: string
}

/**
 * CHUYỂN ĐỔI một học sinh sang P08 (`03` §9.1).
 *
 * Hợp đồng:
 *   * Ảnh chụp hỏng / level+progress không đi vòng đúng ⇒ `CORRUPT_STATE`, KHÔNG ghi.
 *   * `dryRun = true` ⇒ chỉ tính và trả kết quả (§9.1 "chạy dry-run, kiểm tổng, rồi CAS").
 *   * Đã chuyển CÙNG `migration_id` ⇒ phát lại NGUYÊN kết quả cũ, không đổi tài sản (§9.3 "chạy lần
 *     hai không đổi tài sản/projection đã đúng"). **Ảnh chụp KHÁC ⇒ NÉM** — §9.3 "không cộng lại số
 *     dư mở đầu": sự kiện mới đi bằng đường cursor, KHÔNG được đổi số dư mở đầu.
 *   * Đã chuyển bằng `migration_id` KHÁC ⇒ NÉM: *"CAS thua thì đọc lại và tính lại, KHÔNG ghi đè."*
 *   * Ghi: bảng quyết định + trạng thái trong MỘT batch, cửa canh `CHECK (ok = 1)`.
 *
 * ⚠️ TIỀN ĐỀ VỀ VÍ (§9.1 "giữ … wallet nguyên giá trị"): lệnh này **KHÔNG ghi `wallet` đi đâu cả** —
 * nó chỉ LƯU `snapshot.wallet` làm BẰNG CHỨNG và để nguyên `cnh_exp_account.wallet_exp`. Tiền đề là
 * **ví đã nằm sẵn trong `cnh_exp_account`** (bước tạo tài khoản P07). Adapter đọc legacy PHẢI bảo đảm
 * điều đó TRƯỚC khi gọi lệnh này; nếu ví còn ở dạng cũ thì chuyển xong là MẤT VÍ.
 */
export async function chuyenDoiP08(env: Env, yc: YeuCauChuyenDoi): Promise<KetQuaChuyenDoi> {
  if (!yc.studentId || !yc.migrationId || !yc.learningDay) {
    throw new LoiLenhP08('NOT_FOUND', 'thiếu studentId/migrationId/learningDay')
  }
  kiemTraHieuLucP08(yc.effectiveAt, yc.learningDay)
  const state = chieuTrangThaiP08({ learningDay: yc.learningDay, snapshot: yc.snapshot })
  const snapshotHash = await bamSha256(jsonChuanHoa(yc.snapshot))
  const soNgayDat = state.achieved_days
  const dung: KetQuaChuyenDoi = {
    studentId: yc.studentId,
    migrationId: yc.migrationId,
    dryRun: yc.dryRun,
    daChuyen: false,
    effectiveAt: yc.effectiveAt,
    oldPolicy: yc.oldPolicy,
    newPolicy: yc.newPolicy,
    snapshotHash,
    investedExp: state.invested_exp,
    soNgayDat,
    state,
  }

  const db: D1Database = env.DB
  const docCu = async (): Promise<DongChuyenDoi | null> =>
    (await db
      .prepare('SELECT migration_id, ket_qua_json FROM cnh_exp_p08_chuyen_doi WHERE student_id = ?')
      .bind(yc.studentId)
      .first<DongChuyenDoi>()) ?? null

  const cu = await docCu()
  if (cu) {
    if (cu.migration_id !== yc.migrationId) {
      throw new LoiLenhP08(
        'KHONG_DU_DIEU_KIEN',
        `CAS thua: ${yc.studentId} đã chuyển bằng migration ${cu.migration_id} — đọc lại, KHÔNG ghi đè`,
      )
    }
    const cuKetQua = JSON.parse(cu.ket_qua_json) as KetQuaChuyenDoi
    // §9.3 "không cộng lại số dư mở đầu": chạy lại CÙNG migration nhưng ẢNH CHỤP KHÁC là gọi SAI
    // (sự kiện mới phải đi bằng đường cursor), nên NÉM thay vì im lặng trả kết quả cũ.
    if (cuKetQua.snapshotHash !== snapshotHash) {
      throw new LoiLenhP08(
        'KHONG_DU_DIEU_KIEN',
        `cùng migration ${yc.migrationId} nhưng ẢNH CHỤP KHÁC (hash ${snapshotHash} ≠ ${cuKetQua.snapshotHash}) — KHÔNG đổi số dư mở đầu`,
      )
    }
    return { ...cuKetQua, daChuyen: true }
  }

  if (yc.dryRun) return dung

  const ketQuaJson = JSON.stringify(dung)
  await db.batch([
    db
      .prepare(
        `INSERT INTO cnh_exp_p08_chuyen_doi
           (student_id, migration_id, effective_at, old_policy, new_policy, snapshot_json, snapshot_hash, ket_qua_json, so_ngay_dat)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
         ON CONFLICT (student_id) DO NOTHING`,
      )
      .bind(yc.studentId, yc.migrationId, yc.effectiveAt, yc.oldPolicy, yc.newPolicy, jsonChuanHoa(yc.snapshot), snapshotHash, ketQuaJson, soNgayDat),
    db
      .prepare(
        `INSERT INTO cnh_exp_p08_state (${COT_TRANG_THAI})
         SELECT ${COT_TRANG_THAI.split(', ').map(() => '?').join(', ')}
          WHERE EXISTS (SELECT 1 FROM cnh_exp_p08_chuyen_doi WHERE student_id = ? AND migration_id = ?)
            AND NOT EXISTS (SELECT 1 FROM cnh_exp_p08_state WHERE student_id = ?)`,
      )
      .bind(...bindTrangThai(yc.studentId, state), yc.studentId, yc.migrationId, yc.studentId),
    db
      .prepare(
        `INSERT INTO cnh_exp_p08_guard (execution_id, ok)
         SELECT ?,
                CASE WHEN
                  (SELECT COUNT(*) FROM cnh_exp_p08_state
                    WHERE student_id = ? AND absorbed_day = ? AND absorbed_today = ? AND invested_exp = ?
                      AND level = ? AND fragment_balance = ? AND unused_shields = ? AND used_shields = ?
                      AND first_shield_claimed = ? AND first_claim_status = ? AND legacy_pending_fragments = ?
                      AND achieved_days = ? AND gold = ? AND revision = 0) = 1
                  AND (SELECT COUNT(*) FROM cnh_exp_p08_chuyen_doi
                        WHERE student_id = ? AND migration_id = ? AND snapshot_hash = ?) = 1
                THEN 1 ELSE 0 END
          WHERE EXISTS (SELECT 1 FROM cnh_exp_p08_chuyen_doi WHERE student_id = ? AND migration_id = ?)`,
      )
      .bind(
        `cd:${yc.studentId}:${yc.migrationId}`,
        yc.studentId,
        state.absorbed_day,
        state.absorbed_today,
        state.invested_exp,
        state.level,
        state.fragment_balance,
        state.unused_shields,
        state.used_shields,
        state.first_shield_claimed,
        state.first_claim_status,
        state.legacy_pending_fragments,
        state.achieved_days,
        state.gold,
        yc.studentId,
        yc.migrationId,
        snapshotHash,
        yc.studentId,
        yc.migrationId,
      ),
  ])

  const sau = await docCu()
  if (!sau || sau.migration_id !== yc.migrationId) {
    throw new LoiLenhP08('KHONG_DU_DIEU_KIEN', `CAS thua khi ghi chuyển đổi cho ${yc.studentId}`)
  }
  return { ...(JSON.parse(sau.ket_qua_json) as KetQuaChuyenDoi), daChuyen: false }
}

