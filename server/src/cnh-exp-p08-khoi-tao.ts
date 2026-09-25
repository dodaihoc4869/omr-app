// CNH-1.0 P08 — KHỞI TẠO VÍ (`cnh_exp_account`) TỪ HỒ SƠ CŨ (`game_v2_profile.json`).
//
// VÌ SAO CÓ TỆP NÀY: `chuyenDoiP08` (`cnh-exp-p08-chuyen-doi.ts`) CỐ Ý **KHÔNG** chép ví — nó chỉ ghi
// `cnh_exp_p08_state`; đầu tệp đó ghi rõ *"nếu ví còn ở dạng cũ thì chuyển xong là MẤT VÍ"*.
// `migration-2309-cnh-exp-ledger.sql` ghi: *"Account initialization / legacy migration is a SEPARATE
// job and MUST run before this substrate is activated in production."* Tệp này CHÍNH LÀ job đó.
//
// ⚠️ THỨ TỰ BẮT BUỘC: (1) migration → (2) **JOB NÀY (khởi tạo ví)** → (3) `chuyenDoiHangLoat` →
// (4) đặt cờ kích hoạt. Bỏ bước (2) ⇒ mọi lệnh P08 đọc ví = 0, và cửa canh
// `EXISTS(... cnh_exp_account ...)` trong `cnh-exp-p08-lenh.ts` cũng KHÔNG qua ⇒ **MẤT VÍ**.
//
// ⚠️ TỆP NÀY CHỈ ĐỌC `game_v2_profile`. Không ghi/sửa/xoá bảng legacy. Không bật cờ, không chuyển đổi.
// ⚠️ IDEMPOTENT: hàng `cnh_exp_account` đã có ⇒ **KHÔNG ghi đè** (chạy lại an toàn, đếm vào `daCo`).
// ⚠️ `cnh_exp_account.revision` bắt đầu ở **0**: CNH-1.0 có CAS riêng, KHÔNG mượn `revision` hồ sơ cũ.
import type { Env } from './kieu'
import { LoiLenhP08 } from './cnh-exp-p08-lenh'

/**
 * Lọc về số nguyên KHÔNG ÂM — CÙNG quy tắc `nguyenKhongAm` của adapter cũ (`cnh-exp-p08-legacy.ts`):
 * thiếu/NaN/âm/thập phân ⇒ cắt về 0 (`Math.floor` + `> 0 ? n : 0`). Bảng `cnh_exp_account` có CHECK
 * `typeof(...) = 'integer'` nên ghi thẳng giá trị thô sẽ **rollback cả batch**; lọc trước là bắt buộc.
 */
const nguyenKhongAm = (v: unknown): number => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export interface YeuCauKhoiTaoVi {
  /** `true` ⇒ CHỈ đọc và tính, **KHÔNG ghi gì** (đối chiếu tổng trước khi chạy thật). */
  dryRun: boolean
  /** Số em mỗi lượt (mặc định 40). */
  gioiHan?: number
  /** Con trỏ chạy tiếp: bắt đầu SAU `sbd` này (`null`/bỏ = từ đầu). */
  tuSbd?: string | null
}

export interface KetQuaKhoiTaoVi {
  /** Số hồ sơ đọc được ở lượt này. */
  xet: number
  /** Số em ĐƯỢC tạo hàng ví ở lượt này. */
  tao: number
  /** Số em ĐÃ có hàng ví (bỏ qua, KHÔNG ghi đè). */
  daCo: number
  /** Em lỗi — KHÔNG chặn em khác; đưa vào danh sách đối chiếu. */
  loi: { studentId: string; ma: string; lyDo: string }[]
  /** Con trỏ cho lượt sau; `null` = đã hết. */
  conTro: string | null
  xong: boolean
  /** Tổng ví ĐÃ GHI (hoặc SẼ GHI khi `dryRun`) ở lượt này — để đối chiếu tổng. */
  tongWallet: number
  /** Tổng earned ĐÃ GHI (hoặc SẼ GHI khi `dryRun`) ở lượt này — để đối chiếu tổng. */
  tongEarned: number
}


/**
 * KHỞI TẠO VÍ HÀNG LOẠT từ `game_v2_profile` (`03` §9.1 tiền đề ví). Quét theo `sbd` bằng con trỏ
 * (mỗi lượt `gioiHan` em ⇒ không vượt giới hạn một lượt D1).
 *
 * Hợp đồng:
 *   * `dryRun = true` ⇒ **không ghi gì**; `tongWallet`/`tongEarned` là con số SẼ ghi (đối chiếu trước).
 *   * MỘT em lỗi **KHÔNG** chặn em khác — gom vào `loi` để đối chiếu.
 *   * Chạy lại trên cùng dữ liệu ⇒ mọi em trả `daCo` ⇒ tài sản KHÔNG đổi.
 *   * Học sinh KHÔNG có `game_v2_profile` không nằm trong phạm vi (không có ví cũ để chuyển) —
 *     CÙNG phạm vi với `chuyenDoiHangLoat`.
 */
export async function khoiTaoViHangLoat(env: Env, yc: YeuCauKhoiTaoVi): Promise<KetQuaKhoiTaoVi> {
  const gioiHan = Math.max(1, Math.min(200, Math.floor(yc.gioiHan ?? 40)))
  const r = await env.DB.prepare('SELECT sbd, json FROM game_v2_profile WHERE sbd > ? ORDER BY sbd LIMIT ?')
    .bind(yc.tuSbd ?? '', gioiHan)
    .all<{ sbd: string; json: string }>()
  const ds = r.results ?? []

  let daCo = 0
  let tongWallet = 0
  let tongEarned = 0
  const loi: KetQuaKhoiTaoVi['loi'] = []
  const ghi: { sbd: string; wallet: number; earned: number }[] = []

  for (const row of ds) {
    const studentId = String(row.sbd)
    try {
      const cu = await env.DB.prepare('SELECT 1 AS x FROM cnh_exp_account WHERE student_id = ?')
        .bind(studentId)
        .first<{ x: number }>()
      if (cu) {
        daCo += 1
        continue
      }
      let p: { wallet?: unknown; earned?: unknown }
      try {
        p = JSON.parse(row.json) as { wallet?: unknown; earned?: unknown }
      } catch {
        throw new LoiLenhP08('CORRUPT_STATE', `hồ sơ cũ của ${studentId} không đọc được (JSON hỏng)`)
      }
      if (p === null || typeof p !== 'object' || Array.isArray(p)) {
        throw new LoiLenhP08('CORRUPT_STATE', `hồ sơ cũ của ${studentId} không phải đối tượng`)
      }
      const wallet = nguyenKhongAm(p.wallet)
      const earned = nguyenKhongAm(p.earned)
      tongWallet += wallet
      tongEarned += earned
      ghi.push({ sbd: studentId, wallet, earned })
    } catch (e) {
      loi.push({ studentId, ma: (e as { ma?: string }).ma ?? '', lyDo: e instanceof Error ? e.message : String(e) })
    }
  }

  if (!yc.dryRun && ghi.length > 0) {
    // `WHERE NOT EXISTS` là chốt thứ hai chống ghi đè (ngoài lần đọc ở trên): chạy đua cũng không
    // đè ví đã có. MỘT `batch` ⇒ hoặc cả lượt vào, hoặc không em nào (không trạng thái nửa vời).
    await env.DB.batch(
      ghi.map((g) =>
        env.DB.prepare(
          `INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision, cap_nhat_luc)
           SELECT ?, ?, ?, 0, datetime('now')
            WHERE NOT EXISTS (SELECT 1 FROM cnh_exp_account WHERE student_id = ?)`,
        ).bind(g.sbd, g.wallet, g.earned, g.sbd),
      ),
    )
  }

  const conTro = ds.length === gioiHan ? String(ds[ds.length - 1]!.sbd) : null
  return { xet: ds.length, tao: ghi.length, daCo, loi, conTro, xong: conTro === null, tongWallet, tongEarned }
}

/** Tổng ví/earned hiện có trong `cnh_exp_account` — để ĐỐI CHIẾU sau khi chạy thật. */
export async function tongViHienCo(env: Env): Promise<{ soEm: number; tongWallet: number; tongEarned: number }> {
  const r = await env.DB.prepare(
    'SELECT COUNT(*) AS n, COALESCE(SUM(wallet_exp), 0) AS w, COALESCE(SUM(earned_exp), 0) AS e FROM cnh_exp_account',
  ).first<{ n: number; w: number; e: number }>()
  return { soEm: Number(r?.n ?? 0), tongWallet: Number(r?.w ?? 0), tongEarned: Number(r?.e ?? 0) }
}

/** Tổng ví/earned ĐỌC TỪ HỒ SƠ CŨ — mốc đối chiếu của cả đợt (một truy vấn, không phân trang). */
export async function tongViTuHoSoCu(env: Env): Promise<{ soEm: number; tongWallet: number; tongEarned: number }> {
  const r = await env.DB.prepare('SELECT json FROM game_v2_profile').all<{ json: string }>()
  let soEm = 0
  let tongWallet = 0
  let tongEarned = 0
  for (const row of r.results ?? []) {
    let p: { wallet?: unknown; earned?: unknown }
    try {
      p = JSON.parse(row.json) as { wallet?: unknown; earned?: unknown }
    } catch {
      continue
    }
    if (p === null || typeof p !== 'object' || Array.isArray(p)) continue
    soEm += 1
    tongWallet += nguyenKhongAm(p.wallet)
    tongEarned += nguyenKhongAm(p.earned)
  }
  return { soEm, tongWallet, tongEarned }
}
