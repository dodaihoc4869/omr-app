// CNH-1.0 P08 — ADAPTER ĐỌC BẢNG CŨ ⇒ ẢNH CHỤP cho `chuyenDoiP08` (`03` §9.1/§9.2).
//
// ⚠️ TỆP NÀY CHỈ ĐỌC. Không ghi, không sửa, không xoá bảng legacy. Nguồn đọc:
//   * `game_v2_profile.json` — hồ sơ thần thú: `cap`(cấp), `exp`(tiến độ), `wallet`(ống nghiệm),
//     `khienRen.{manh,daRen}`, `shields.used`, `expMoi.ngayDat`, `hapThu.{ngay,da}`, `revision`.
//   * `manh_khien_so` — SỔ MẢNH: mảnh ĐÃ KIẾM (`SUM(SQL_SO_MANH_TINH)`), ngày đạt (`loai='dat'`).
//   * `vang_so` — SỔ VÀNG: số dư = `SUM(so_vang)` (`doi` dương, `mua` âm).
//   * `phu_kien_so_huu` — đồ đã mua (đếm).
//
// ⚠️ §7.1 "Số fragment và ngày đạt CHỈ LẤY TỪ LEDGER SERVER" ⇒ adapter ĐỐI CHIẾU hồ sơ với sổ. Lệch
// mà KHÔNG giải thích được ⇒ đánh dấu `legacy_unresolved` + giữ phần lệch vào `legacy_pending_fragments`
// (§9.2: "giữ nguyên … KHÔNG xóa và KHÔNG tự tiêu"), KHÔNG bịa số, KHÔNG hồi tố coi mảnh là đã tiêu.
import type { Env } from './kieu'
import { LoiLenhP08 } from './cnh-exp-p08-lenh'
import { SQL_KHIEN_MOC, SQL_SO_MANH_TINH } from './exp-cau-hinh'
import { khienConLai } from './exp-ho-so-game'
import { chuyenDoiP08, type AnhChupCu, type KetQuaChuyenDoi } from './cnh-exp-p08-chuyen-doi'

/** Đúng phần hồ sơ cũ mà adapter cần (mọi trường đều có thể thiếu ⇒ xử lý riêng). */
interface HoSoCu {
  cap?: unknown
  exp?: unknown
  wallet?: unknown
  revision?: unknown
  shields?: { used?: unknown } | null
  khienRen?: { manh?: unknown; daRen?: unknown } | null
  expMoi?: { ngayDat?: unknown; daCong?: unknown; manhDaTinh?: unknown } | null
  hapThu?: { ngay?: unknown; da?: unknown } | null
}

const nguyenKhongAm = (v: unknown): number => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * ĐỌC ảnh chụp cũ của một học sinh. Ném khi KHÔNG có hồ sơ (không bịa).
 * `learningDay` để quyết định `absorbed_today` thuộc NGÀY NÀO (§9.1 "không reset hạn mức trong ngày").
 */
export async function docAnhChupCu(env: Env, studentId: string, learningDay: string): Promise<AnhChupCu> {
  const ho = await env.DB.prepare('SELECT json, revision FROM game_v2_profile WHERE sbd = ?')
    .bind(studentId)
    .first<{ json: string; revision: number }>()
  if (!ho) throw new LoiLenhP08('NOT_FOUND', `không có hồ sơ game cũ cho ${studentId}`)

  let p: HoSoCu
  try {
    p = JSON.parse(ho.json) as HoSoCu
  } catch {
    throw new LoiLenhP08('CORRUPT_STATE', `hồ sơ game cũ của ${studentId} không đọc được (JSON hỏng)`)
  }

  const cap = nguyenKhongAm(p.cap)
  const expTrongCap = nguyenKhongAm(p.exp)
  const wallet = nguyenKhongAm(p.wallet)
  const used = nguyenKhongAm(p.shields?.used)
  const manh = nguyenKhongAm(p.khienRen?.manh)
  const daRen = nguyenKhongAm(p.khienRen?.daRen)
  const ngayDat = nguyenKhongAm(p.expMoi?.ngayDat)
  const hapThuNgay = p.hapThu?.ngay
  const hapThuDa = nguyenKhongAm(p.hapThu?.da)

  const [manhSo, ngayDatSo, vangSo, doSo, soKhoan] = await Promise.all([
    // Mảnh ĐÃ KIẾM theo sổ — dùng CHUNG đoạn SQL `SQL_SO_MANH_TINH` với đường cộng mảnh cũ (mốc reset).
    env.DB.prepare(`SELECT COALESCE(SUM(${SQL_SO_MANH_TINH}), 0) AS m FROM manh_khien_so WHERE sbd = ?`).bind(studentId).first<{ m: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS d FROM manh_khien_so WHERE sbd = ? AND loai = 'dat' AND ngay_vn >= ${SQL_KHIEN_MOC}`).bind(studentId).first<{ d: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(so_vang), 0) AS g FROM vang_so WHERE sbd = ?').bind(studentId).first<{ g: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM phu_kien_so_huu WHERE sbd = ?').bind(studentId).first<{ n: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM exp_so WHERE sbd = ?').bind(studentId).first<{ n: number }>(),
  ])

  const manhKiem = nguyenKhongAm(manhSo?.m)
  const soNgayDatSo = nguyenKhongAm(ngayDatSo?.d)
  const gold = nguyenKhongAm(vangSo?.g)
  const items = nguyenKhongAm(doSo?.n)
  const khoanSo = nguyenKhongAm(soKhoan?.n)

  // Khiên ĐANG CÓ = `khienConLai` cũ = khiên quà tiến hoá + đã rèn − đã dùng (không âm). GỌI ĐÚNG HÀM CŨ,
  // không viết lại công thức (viết lại là mầm lệch với con số em đang thấy). §9.1: "giữ mọi khiên cũ, kể cả vượt 5".
  const unusedShields = Math.max(
    0,
    khienConLai({
      cap: cap < 1 ? 1 : cap,
      shields: (p.shields ?? undefined) as never,
      khienRen: (p.khienRen ?? undefined) as never,
      expMoi: (p.expMoi ?? undefined) as never,
    }),
  )

  // §9.2: *"Đã từng nhận BẤT KỲ khiên QUÀ/RÈN, **còn HOẶC ĐÃ DÙNG** ⇒ first=true."*
  // ⇒ Tổng khiên em từng có = `unused + used` (quà + rèn, không phụ thuộc việc đã rèn hay chưa).
  // ⚠️ KHÔNG dùng `daRen > 0 || used > 0`: cách đó BỎ SÓT em chỉ nhận **khiên QUÀ tiến hoá**
  // (chưa từng rèn, chưa từng dùng) ⇒ xếp nhầm `none` ⇒ em đó sẽ claim `first` LẦN THỨ HAI.
  const coDauVetKhien = unusedShields + used > 0
  // Sổ nói em ĐÃ KIẾM mảnh mà hồ sơ trắng trơn (mảnh 0, chưa rèn, chưa dùng) ⇒ MÂU THUẪN → chờ đối chiếu.
  const mauThuanManh = manhKiem > 0 && manh === 0 && daRen === 0 && used === 0

  // §9.2 "Khi dựng số dư mảnh từ ledger CHỈ trừ những lần THỰC SỰ đã tiêu theo luật cũ có chứng cứ,
  // đúng một lần; nếu snapshot đã là số dư sau tiêu thì KHÔNG trừ lại." ⇒ số dư DÙNG ĐƯỢC = hồ sơ `manh`
  // (đã là số SAU tiêu); phần sổ-vượt-hồ-sơ chỉ giữ làm mảnh CHỜ, không tự tiêu, không hồi tố.
  const daTieuCoChungCu = daRen * 21
  const lech = Math.max(0, manhKiem - manh - daTieuCoChungCu)
  const legacyPending = mauThuanManh ? manhKiem : lech

  return {
    level: cap < 1 ? 1 : cap,
    progress: expTrongCap,
    wallet,
    gold,
    items,
    unusedShields,
    usedShields: used,
    fragmentBalance: manh,
    achievedDays: ngayDat > 0 ? ngayDat : soNgayDatSo,
    absorbedToday: hapThuNgay === learningDay ? hapThuDa : 0,
    revision: nguyenKhongAm(ho.revision),
    pendingReceipts: khoanSo,
    nguonSo: 'game_v2_profile+manh_khien_so+vang_so+phu_kien_so_huu',
    firstClaimStatus: coDauVetKhien ? 'claimed' : mauThuanManh ? 'legacy_unresolved' : 'none',
    legacyPendingFragments: legacyPending,
  }
}

export interface YeuCauChuyenDoiTuLegacy {
  studentId: string
  learningDay: string
  migrationId: string
  effectiveAt: string
  oldPolicy: string
  newPolicy: string
  dryRun: boolean
}

/**
 * GHÉP: đọc hồ sơ cũ ⇒ ảnh chụp ⇒ `chuyenDoiP08`. `dryRun = true` để chạy thử KHÔNG ghi (§9.1
 * "chạy dry-run, kiểm tổng, rồi CAS"). Không tự bật cờ, không tự chuyển hàng loạt.
 */
export async function chuyenDoiTuLegacy(env: Env, yc: YeuCauChuyenDoiTuLegacy): Promise<KetQuaChuyenDoi> {
  const snapshot = await docAnhChupCu(env, yc.studentId, yc.learningDay)
  return chuyenDoiP08(env, { ...yc, snapshot })
}

// ───────── CHUYỂN ĐỔI HÀNG LOẠT (§9.1 "chạy dry-run, kiểm tổng, rồi CAS") ─────────

export interface YeuCauHangLoat {
  /** MỘT id cho cả ĐỢT — hợp lệ vì §9.3 nói id duy nhất THEO HỌC SINH (không toàn cục). */
  migrationId: string
  learningDay: string
  effectiveAt: string
  oldPolicy: string
  newPolicy: string
  dryRun: boolean
  /** Số em mỗi lượt (mặc định 40). */
  gioiHan?: number
  /** Con trỏ chạy tiếp: bắt đầu SAU `sbd` này (`null`/bỏ = từ đầu). */
  tuSbd?: string | null
}

export interface KetQuaHangLoat {
  xet: number
  /** Số em CHUYỂN ĐƯỢC ở lượt này. */
  chuyen: number
  /** Số em ĐÃ chuyển từ trước (chạy lại ⇒ cùng `migration_id`). */
  daCo: number
  /** Em lỗi — KHÔNG chặn các em còn lại; đưa vào danh sách đối chiếu. */
  loi: { studentId: string; ma: string; lyDo: string }[]
  /** Con trỏ cho lượt sau; `null` = đã hết. */
  conTro: string | null
  xong: boolean
}

/**
 * CHUYỂN ĐỔI HÀNG LOẠT (`03` §9.1). Quét `game_v2_profile` theo `sbd`, gọi `chuyenDoiTuLegacy` từng em.
 *
 * Hợp đồng:
 *   * `dryRun = true` ⇒ **không ghi gì** (kiểm tổng trước khi chạy thật).
 *   * MỘT em lỗi **KHÔNG** chặn các em khác — gom vào `loi` để đối chiếu (§9.2 "đưa hồ sơ vào danh sách đối chiếu").
 *   * Chạy lại **cùng `migration_id`** ⇒ mọi em trả `daChuyen: true`, tài sản KHÔNG đổi (§9.3).
 *   * `conTro` để chạy tiếp lượt sau (mỗi lượt `gioiHan` em ⇒ không vượt giới hạn một lượt D1).
 *   * ⚠️ TIỀN ĐỀ: ví PHẢI đã ở `cnh_exp_account` (xem `chuyenDoiP08`). Thứ tự đúng: migration → job này
 *     → RỒI MỚI đặt cờ kích hoạt.
 */
export async function chuyenDoiHangLoat(env: Env, yc: YeuCauHangLoat): Promise<KetQuaHangLoat> {
  const gioiHan = Math.max(1, Math.min(200, Math.floor(yc.gioiHan ?? 40)))
  if (!yc.migrationId) throw new LoiLenhP08('NOT_FOUND', 'thiếu migrationId cho đợt chuyển đổi')
  const r = await env.DB.prepare('SELECT sbd FROM game_v2_profile WHERE sbd > ? ORDER BY sbd LIMIT ?')
    .bind(yc.tuSbd ?? '', gioiHan)
    .all<{ sbd: string }>()
  const ds = (r.results ?? []).map((x) => String(x.sbd))
  let chuyen = 0
  let daCo = 0
  const loi: KetQuaHangLoat['loi'] = []
  for (const studentId of ds) {
    try {
      const kq = await chuyenDoiTuLegacy(env, {
        studentId,
        learningDay: yc.learningDay,
        migrationId: yc.migrationId,
        effectiveAt: yc.effectiveAt,
        oldPolicy: yc.oldPolicy,
        newPolicy: yc.newPolicy,
        dryRun: yc.dryRun,
      })
      if (kq.daChuyen) daCo += 1
      else chuyen += 1
    } catch (e) {
      loi.push({ studentId, ma: (e as { ma?: string }).ma ?? '', lyDo: e instanceof Error ? e.message : String(e) })
    }
  }
  const conTro = ds.length === gioiHan ? ds[ds.length - 1]! : null
  return { xet: ds.length, chuyen, daCo, loi, conTro, xong: conTro === null }
}

