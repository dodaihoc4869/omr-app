// CNH-1.0 P08 — JOB LẮP ĐẶT (chạy bằng cron, CÓ CỜ): (1) khởi tạo ví → (2) chuyển đổi hồ sơ → XONG.
//
// VÌ SAO CÓ TỆP NÀY: hai việc dưới đây PHẢI xong trước khi bật cờ `cnh_exp_kich_hoat`, nếu không mọi
// lệnh P08 ném `NOT_FOUND` ("thiếu ví hoặc trạng thái P08", xem `chayLenhP08`) hoặc MẤT VÍ:
//   (1) KHỞI TẠO VÍ — `cnh-exp-p08-khoi-tao.ts` (đổ `game_v2_profile.wallet → cnh_exp_account`).
//   (2) CHUYỂN ĐỔI HỒ SƠ — `cnh-exp-p08-legacy.ts` (`docAnhChupCu → chuyenDoiP08`, đẻ `cnh_exp_p08_state`).
// Hai việc này KHÔNG nằm sau cổng `laThay` (chúng là job nền), nên dùng ĐÚNG khuôn của
// `reset-toan-app.ts`: **cờ lên đạn trong `cau_hinh` + trạng thái tiến độ trong `cau_hinh`**, mỗi lượt
// cron làm MỘT lô rồi ghi con trỏ. Thầy/Boss lên đạn và theo dõi bằng `wrangler d1 execute` — không
// cần mã bí mật, không cần một đường HTTP mới.
//
// ⚠️ AN TOÀN MẶC ĐỊNH: KHÔNG cờ ⇒ KHÔNG chạy. Cờ HUỶ (`p08_setup_huy`) THẮNG cờ cho phép.
// ⚠️ MỘT LẦN: `buoc = 'xong'` thì không chạy lại. Đổi `dryRun` giữa chừng ⇒ CHẠY LẠI từ đầu lượt
//    (an toàn: lượt dry-run không ghi gì, lượt thật idempotent theo `migration_id`).
// ⚠️ TỆP NÀY KHÔNG BẬT cờ `cnh_exp_kich_hoat` — đó là quyết định RIÊNG của thầy/Boss, sau khi job xong.
import type { Env } from './kieu'
import { PHIEN_BAN_CHINH_SACH } from './cnh-exp-ledger'
import { khoiTaoViHangLoat } from './cnh-exp-p08-khoi-tao'
import { chuyenDoiHangLoat } from './cnh-exp-p08-legacy'

export const KHOA_CHO_PHEP = 'p08_setup_cho_phep'
export const KHOA_HUY = 'p08_setup_huy'
export const KHOA_TRANG_THAI = 'p08_setup'
/** Số em mỗi lượt cron (mỗi em ~5–6 truy vấn ⇒ giữ lượt cron nhẹ như `reset-toan-app`). */
export const SO_EM_MOI_LUOT = 25

export type BuocSetup = 'khoi_tao_vi' | 'chuyen_doi' | 'xong'

export interface TrangThaiSetup {
  buoc: BuocSetup
  dryRun: boolean
  conTro: string | null
  migrationId: string
  learningDay: string
  effectiveAt: string
  batDau: string
  capNhat: string
  khoiTao: { tao: number; daCo: number; loi: number; tongWallet: number; tongEarned: number }
  chuyenDoi: { chuyen: number; daCo: number; loi: number }
  loi: { studentId: string; ma: string; lyDo: string }[]
}

const VN_MS = 7 * 3_600_000

/** Ngày VN hiện tại + mốc hiệu lực `00:00` ngày VN KẾ TIẾP (§9.1), dạng ISO (`…Z`). */
export function ngayVnVaHieuLuc(nowMs: number): { learningDay: string; effectiveAt: string } {
  const vn = new Date(nowMs + VN_MS)
  const y = vn.getUTCFullYear()
  const m = vn.getUTCMonth()
  const d = vn.getUTCDate()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const learningDay = `${y}-${p2(m + 1)}-${p2(d)}`
  const effectiveAt = new Date(Date.UTC(y, m, d + 1, 0, 0, 0) - VN_MS).toISOString()
  return { learningDay, effectiveAt }
}

const docCauHinh = (env: Env, khoa: string) =>
  env.DB.prepare('SELECT gia_tri, cap_nhat_luc FROM cau_hinh WHERE khoa = ?')
    .bind(khoa)
    .first<{ gia_tri: string | null; cap_nhat_luc: string | null }>()

const ghiCauHinh = (env: Env, khoa: string, giaTri: string) =>
  env.DB.prepare(
    `INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, datetime('now'))
     ON CONFLICT (khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc`,
  )
    .bind(khoa, giaTri)
    .run()


/** Cờ `cau_hinh`: nhận `"true"`/`"1"` hoặc JSON `{"choPhep":true,"dryRun":true}`. */
function docCo(giaTri: string | null | undefined): { bat: boolean; dryRun: boolean } {
  const s = String(giaTri ?? '').trim()
  if (!s) return { bat: false, dryRun: false }
  try {
    const j = JSON.parse(s) as Record<string, unknown>
    if (j && typeof j === 'object' && !Array.isArray(j)) {
      const bat = j.choPhep === true || j.bat === true || (j.choPhep === undefined && j.bat === undefined)
      return { bat, dryRun: j.dryRun === true }
    }
  } catch {
    /* không phải JSON ⇒ đọc như cờ thô bên dưới */
  }
  const bat = s === 'true' || s === '1'
  return { bat, dryRun: false }
}

function docTrangThai(giaTri: string | null | undefined): TrangThaiSetup | null {
  const s = String(giaTri ?? '').trim()
  if (!s) return null
  try {
    const j = JSON.parse(s) as TrangThaiSetup
    if (!j || typeof j !== 'object' || typeof j.buoc !== 'string') return null
    return j
  } catch {
    return null
  }
}

function taoTrangThaiMoi(nowMs: number, dryRun: boolean): TrangThaiSetup {
  const { learningDay, effectiveAt } = ngayVnVaHieuLuc(nowMs)
  const luc = new Date(nowMs).toISOString()
  return {
    buoc: 'khoi_tao_vi',
    dryRun,
    conTro: null,
    migrationId: `P08-${learningDay.replace(/-/g, '')}`,
    learningDay,
    effectiveAt,
    batDau: luc,
    capNhat: luc,
    khoiTao: { tao: 0, daCo: 0, loi: 0, tongWallet: 0, tongEarned: 0 },
    chuyenDoi: { chuyen: 0, daCo: 0, loi: 0 },
    loi: [],
  }
}

export interface KetQuaSetup {
  chay: boolean
  lyDo: string
  trangThai?: TrangThaiSetup
}

/**
 * MỘT LƯỢT của job lắp đặt. Gọi từ cron (mỗi phút). Chỉ chạy khi có cờ lên đạn.
 *
 * Mỗi lượt làm **ĐÚNG MỘT lô** (`SO_EM_MOI_LUOT` em) rồi ghi con trỏ ⇒ cron sau chạy tiếp.
 * Hết `khoi_tao_vi` ⇒ tự sang `chuyen_doi`; hết `chuyen_doi` ⇒ `xong` (job KHÔNG tự bật cờ kích hoạt).
 */
export async function chaySetupP08NeuDuoc(env: Env, nowMs: number): Promise<KetQuaSetup> {
  const [rowCho, rowHuy, rowTt] = await Promise.all([
    docCauHinh(env, KHOA_CHO_PHEP),
    docCauHinh(env, KHOA_HUY),
    docCauHinh(env, KHOA_TRANG_THAI),
  ])
  const cho = docCo(rowCho?.gia_tri)
  if (!cho.bat) return { chay: false, lyDo: 'chua_len_dan' }
  if (docCo(rowHuy?.gia_tri).bat) return { chay: false, lyDo: 'da_huy' }

  let tt = docTrangThai(rowTt?.gia_tri)
  if (!tt) {
    tt = taoTrangThaiMoi(nowMs, cho.dryRun)
  } else if (tt.buoc === 'xong') {
    return { chay: false, lyDo: 'xong', trangThai: tt }
  } else if (tt.dryRun !== cho.dryRun) {
    // Đổi chế độ giữa chừng ⇒ CHẠY LẠI từ đầu (an toàn: dry-run không ghi; thật thì idempotent theo migration_id).
    tt = taoTrangThaiMoi(nowMs, cho.dryRun)
  }
  tt.capNhat = new Date(nowMs).toISOString()

  if (tt.buoc === 'khoi_tao_vi') {
    const r = await khoiTaoViHangLoat(env, { dryRun: tt.dryRun, gioiHan: SO_EM_MOI_LUOT, tuSbd: tt.conTro })
    tt.khoiTao = {
      tao: tt.khoiTao.tao + r.tao,
      daCo: tt.khoiTao.daCo + r.daCo,
      loi: tt.khoiTao.loi + r.loi.length,
      tongWallet: tt.khoiTao.tongWallet + r.tongWallet,
      tongEarned: tt.khoiTao.tongEarned + r.tongEarned,
    }
    tt.loi = [...tt.loi, ...r.loi].slice(-50)
    if (r.xong) {
      tt.buoc = 'chuyen_doi'
      tt.conTro = null
    } else {
      tt.conTro = r.conTro
    }
  } else {
    const r = await chuyenDoiHangLoat(env, {
      migrationId: tt.migrationId,
      learningDay: tt.learningDay,
      effectiveAt: tt.effectiveAt,
      oldPolicy: 'legacy-exam-pro-max',
      newPolicy: PHIEN_BAN_CHINH_SACH,
      dryRun: tt.dryRun,
      gioiHan: SO_EM_MOI_LUOT,
      tuSbd: tt.conTro,
    })
    tt.chuyenDoi = {
      chuyen: tt.chuyenDoi.chuyen + r.chuyen,
      daCo: tt.chuyenDoi.daCo + r.daCo,
      loi: tt.chuyenDoi.loi + r.loi.length,
    }
    tt.loi = [...tt.loi, ...r.loi].slice(-50)
    if (r.xong) {
      tt.buoc = 'xong'
      tt.conTro = null
    } else {
      tt.conTro = r.conTro
    }
  }

  await ghiCauHinh(env, KHOA_TRANG_THAI, JSON.stringify(tt))
  return { chay: true, lyDo: tt.buoc === 'xong' ? 'xong' : 'cho_tiep', trangThai: tt }
}
