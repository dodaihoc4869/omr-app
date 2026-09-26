// @vitest-environment node
// CNH-1.0 P08 — BẰNG CHỨNG LỚP LỆNH D1 (`03` §6/§7.1/§8) trên LƯỢC ĐỒ THẬT (`node:sqlite`).
//
// Chứng minh: một lượt = ví + trạng thái + sổ + receipt CÙNG giao dịch; receipt-first (phát lại
// nguyên kết quả, KHÔNG cộng hai lần); CAS thua là no-op; cửa canh bất biến là LỖI CỨNG; hạn mức
// là CỦA NGÀY; mảnh đúng 1/ngày đạt; khiên đúng điều kiện §7.1; đổi vàng giữ dự trữ 400.
import { describe, expect, it } from 'vitest'
import { serialiseD1, taoD1That, type D1That } from './_d1-that'
import { doiVangCore, dungKhienCore, ghiManhNgayDat, giaiQuyetKhiendau, hapThuCore, renKhienCore } from '../server/src/cnh-exp-p08-lenh'

const PHIEN_BAN = 'CNH-1.0'
const NGAY = '2026-09-24'
/** `luc` (ISO) của mọi hàng gieo — cột NOT NULL, giá trị chỉ cần hợp lệ. */
const LUC = '2026-09-24T05:00:00.000Z'

interface Gieo {
  sbd?: string
  wallet?: number
  invested?: number
  level?: number
  fragment?: number
  unused?: number
  used?: number
  first?: 0 | 1
  achievedDays?: number
  gold?: number
  absorbedDay?: string
  absorbedToday?: number
  /** TRẠNG THÁI NGÀY — nguồn SỔ CŨ: `1` đạt ngày (`exp_so.loai='dat_ngay'`) · `0` có học (`su_kien_hoc` ≥ 4 câu) · `null` chưa học (không gieo gì). */
  achieved?: 0 | 1 | null
  /** Số câu KHÁC NHAU gieo vào `su_kien_hoc` khi `achieved=0` (mặc định 4 = ngưỡng "có học"). */
  soCauHoc?: number
}

/** Gieo ví P07 + trạng thái P08 + hàng ngày. Dùng SQL THẬT để đúng ràng buộc CHECK. */
function gieo(d1: D1That, o: Gieo = {}): string {
  const sbd = o.sbd ?? 'S1'
  d1.sql
    .prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, 0, 0)')
    .run(sbd, o.wallet ?? 0)
  const invested = o.invested ?? 0
  const first = o.first ?? 0
  d1.sql
    .prepare(
      `INSERT INTO cnh_exp_p08_state
         (student_id, absorbed_day, absorbed_today, invested_exp, level, fragment_balance, unused_shields,
          used_shields, first_shield_claimed, first_claim_status, achieved_days, gold, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    )
    .run(
      sbd,
      o.absorbedDay ?? NGAY,
      o.absorbedToday ?? 0,
      invested,
      o.level ?? 1,
      o.fragment ?? 0,
      o.unused ?? 0,
      o.used ?? 0,
      first,
      // §9.2: cờ và trạng thái phải KHỚP (CHECK ở tầng SQL).
      first === 1 ? 'claimed' : 'none',
      o.achievedDays ?? 0,
      o.gold ?? 0,
    )
  // TRẠNG THÁI NGÀY — nguồn THẬT là SỔ CŨ (`exp_so` + `su_kien_hoc`), KHÔNG phải `cnh_exp_day` (bảng P07 LUÔN RỖNG
  // vì đường nộp-bài/quyết-toán P07 chưa nối) — đúng như `docTranHapThu` (game-v2-hap-thu.ts). Gieo `cnh_exp_day`
  // ở đây sẽ là GIEO SAI và che mất lỗi "thú không cho ăn" (xem test hồi quy §HẤP THỤ).
  const achieved = o.achieved === undefined ? 1 : o.achieved
  if (achieved === 1) {
    d1.sql
      .prepare("INSERT INTO exp_so (khoa, sbd, ngay_vn, loai, qid, ma_nguon, exp, luc, ghi_chu) VALUES (?, ?, ?, 'dat_ngay', NULL, NULL, 80, ?, 'seed')")
      .run(`seed:${sbd}:dat`, sbd, NGAY, LUC)
  } else if (achieved === 0) {
    for (let i = 0; i < (o.soCauHoc ?? 4); i++) {
      d1.sql
        .prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, luc, ngay_vn) VALUES (?, ?, ?, 'game', 'seed', 1, 1, ?, ?)")
        .run(`seed:${sbd}:hoc:${i}`, sbd, `SEED-${i}`, LUC, NGAY)
    }
  }
  return sbd
}

const dem = (d1: D1That, bang: string, dk = '1=1') =>
  Number((d1.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${dk}`).get() as { n: number }).n)
const vi = (d1: D1That, sbd = 'S1') =>
  (d1.sql.prepare('SELECT wallet_exp AS w, revision AS r FROM cnh_exp_account WHERE student_id = ?').get(sbd) as { w: number; r: number })
const bang = (d1: D1That, sbd = 'S1') =>
  d1.sql.prepare('SELECT * FROM cnh_exp_p08_state WHERE student_id = ?').get(sbd) as Record<string, number | string>

/** uuid tất định để test không phụ thuộc ngẫu nhiên; `sleep` không chờ thật. */
let demUuid = 0
const phuThuoc = { uuid: () => `X${++demUuid}`, sleep: async () => {} }

const yeuCau = (sbd: string, ma: string, hash: string, ngay = NGAY) => ({
  studentId: sbd,
  learningDay: ngay,
  requestId: ma,
  requestHash: hash,
})

describe('P08 lệnh · HẤP THỤ (`03` §6)', () => {
  it('một lượt: ví giảm, invested/level/absorbed_today/receipt đổi CÙNG lúc', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400 })
    const r = await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(r).toMatchObject({ take: 200, walletAfter: 200, absorbedTodayAfter: 200, investedExpAfter: 200, levelAfter: 2, progressAfter: 80 })
    expect(vi(d1).w).toBe(200)
    expect(vi(d1).r).toBe(1) // ví P07 tăng revision
    const b = bang(d1)
    expect(Number(b.invested_exp)).toBe(200)
    expect(Number(b.level)).toBe(2)
    expect(Number(b.absorbed_today)).toBe(200)
    expect(String(b.absorbed_day)).toBe(NGAY)
    expect(Number(b.revision)).toBe(1)
    expect(dem(d1, 'cnh_exp_command', "command_type = 'hap_thu'")).toBe(1)
    expect(dem(d1, 'cnh_exp_p08_guard')).toBe(1)
  })

  it('phát lại cùng `request_id` + cùng hash ⇒ NGUYÊN kết quả cũ, KHÔNG trừ ví lần hai', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400 })
    const a = await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    const b = await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(b).toEqual(a)
    expect(vi(d1).w).toBe(200)
    expect(dem(d1, 'cnh_exp_command')).toBe(1)
  })

  it('cùng `request_id` nhưng KHÁC hash ⇒ IDEMPOTENCY_CONFLICT', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400 })
    await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    await expect(hapThuCore(d1.env, yeuCau('S1', 'R1', 'hKHAC'), phuThuoc)).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })

  it('§5 · sang NGÀY VN MỚI thì hạn mức là CỦA NGÀY: `absorbed_today` cũ KHÔNG chặn', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, absorbedDay: '2026-09-23', absorbedToday: 200 })
    const r = await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1', NGAY), phuThuoc)
    expect(r.take).toBe(200) // không phải 0
    expect(r.absorbedTodayAfter).toBe(200)
    expect(String(bang(d1).absorbed_day)).toBe(NGAY)
  })

  it('trần theo NGÀY ĐẠT: `su_kien_hoc` đủ 4 câu nhưng CHƯA đạt ngày ⇒ chỉ 120', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, achieved: 0 })
    expect((await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).take).toBe(120)
  })

  it('HỒI QUY 25/09 · `cnh_exp_day` (bảng P07 LUÔN RỖNG) KHÔNG còn là nguồn: hàng `achieved=1` mà SỔ CŨ trống ⇒ take 0', async () => {
    // ĐÂY CHÍNH LÀ LỖI "THÚ KHÔNG CHO ĂN": trước 25/09 hàm đọc `cnh_exp_day` (đường P07 chưa nối ⇒ luôn rỗng)
    // ⇒ luôn trả `chua_hoc` ⇒ trần 0 ⇒ take 0. Test này khoá lại: hàng P07 "đạt" một mình KHÔNG đủ.
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, achieved: null })
    d1.sql
      .prepare('INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved) VALUES (?, ?, ?, 0, 1)')
      .run('S1', NGAY, PHIEN_BAN)
    expect((await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).take).toBe(0)
    expect(vi(d1).w).toBe(400)
  })

  it('ngày ĐẠT (`exp_so.loai=\'dat_ngay\'`) ⇒ trần 200, KHÔNG cần hàng `cnh_exp_day` nào', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400 }) // `achieved` mặc định = 1 ⇒ một hàng `dat_ngay` trong `exp_so`
    expect(dem(d1, 'cnh_exp_day')).toBe(0) // chứng minh nguồn KHÔNG phải bảng P07
    expect((await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).take).toBe(200)
  })

  it('"CÓ HỌC" đếm câu KHÁC NHAU trong `su_kien_hoc`: 3 câu ⇒ 0 · 4 câu ⇒ 120 (ngưỡng `CO_HOC_TOI_THIEU_CAU`)', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, achieved: 0, soCauHoc: 3 })
    expect((await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).take).toBe(0)
    const d2 = taoD1That()
    gieo(d2, { wallet: 400, achieved: 0, soCauHoc: 4 })
    expect((await hapThuCore(d2.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).take).toBe(120)
  })

  it('ĐỌC ĐÚNG `invested_exp` ĐANG CÓ: thâm nhập 100 rồi hấp thụ 200 ⇒ cấp 3, tiến độ 30', async () => {
    // Ca này bắt lỗi "quên đọc invested_exp" (coi như 0) — lỗi sẽ cho cấp 2/tiến độ 80 thay vì cấp 3/30.
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, invested: 100, level: 1 })
    const r = await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(r).toMatchObject({ take: 200, investedExpAfter: 300, levelAfter: 3, progressAfter: 30 })
    expect(Number(bang(d1).invested_exp)).toBe(300)
    expect(Number(bang(d1).level)).toBe(3)
  })

  it('không có hàng ngày ⇒ CHƯA HỌC ⇒ take 0 (ví giữ nguyên)', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, achieved: null })
    expect((await hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).take).toBe(0)
    expect(vi(d1).w).toBe(400)
  })

  it('thiếu ví/trạng thái ⇒ NOT_FOUND, KHÔNG ghi gì', async () => {
    const d1 = taoD1That()
    await expect(hapThuCore(d1.env, yeuCau('KHONG_CO', 'R1', 'h1'), phuThuoc)).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
  })
})

describe('P08 lệnh · GHI MẢNH NGÀY ĐẠT (`03` §7.1)', () => {
  it('ngày ĐẠT ⇒ +1 mảnh, +1 ngày đạt, CÓ hàng sổ', async () => {
    const d1 = taoD1That()
    gieo(d1, { achieved: 1 })
    const r = await ghiManhNgayDat(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(r).toMatchObject({ fragmentEarned: 1, fragmentBalanceAfter: 1, achievedDaysAfter: 1 })
    expect(dem(d1, 'cnh_exp_fragment_ledger', "student_id = 'S1'")).toBe(1)
    expect(Number(bang(d1).fragment_balance)).toBe(1)
    expect(Number(bang(d1).achieved_days)).toBe(1)
  })

  it('`request_id` KHÁC nhưng CÙNG ngày ⇒ phát lại, KHÔNG tạo ngày thứ hai (§7.1)', async () => {
    const d1 = taoD1That()
    gieo(d1, { achieved: 1 })
    const a = await ghiManhNgayDat(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    const b = await ghiManhNgayDat(d1.env, yeuCau('S1', 'R2', 'h2'), phuThuoc)
    expect(b).toEqual(a)
    expect(dem(d1, 'cnh_exp_fragment_ledger', "student_id = 'S1'")).toBe(1)
    expect(Number(bang(d1).fragment_balance)).toBe(1)
  })

  it('ngày `studied` ⇒ NÉM `KHONG_DU_DIEU_KIEN`, KHÔNG ghi gì', async () => {
    const d1 = taoD1That()
    gieo(d1, { achieved: 0 })
    await expect(ghiManhNgayDat(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_fragment_ledger')).toBe(0)
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
  })
})

/** Gieo `n` NGÀY ĐẠT (sổ mảnh + `achieved_days`) — bất biến §7.1 đòi hai số này KHỚP nhau. */
function gieoNgayDat(d1: D1That, sbd: string, n: number): void {
  for (let i = 0; i < n; i++) {
    d1.sql
      .prepare(
        `INSERT INTO cnh_exp_fragment_ledger (entry_id, student_id, learning_day, policy_version, kind, delta, execution_id)
         VALUES (?, ?, ?, ?, 'achieved_fragment', 1, ?)`,
      )
      .run(`seed:${sbd}:${i}`, sbd, `2026-08-${String(i + 1).padStart(2, '0')}`, PHIEN_BAN, `seedX${i}`)
  }
  d1.sql.prepare('UPDATE cnh_exp_p08_state SET achieved_days = ? WHERE student_id = ?').run(n, sbd)
}

describe('P08 lệnh · RÈN KHIÊN (`03` §7.1)', () => {
  it('FIRST: đủ cấp 10 + 21 mảnh + 21 ngày đạt ⇒ cấp khiên ĐẦU, VÍ GIỮ NGUYÊN', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700, invested: 2400, level: 10, fragment: 21 })
    gieoNgayDat(d1, 'S1', 21)
    const r = await renKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(r).toMatchObject({ loai: 'first', claimIndex: 1, expCost: 0, walletAfter: 700, fragmentsAfter: 0, unusedAfter: 1 })
    expect(vi(d1).w).toBe(700)
    expect(Number(bang(d1).unused_shields)).toBe(1)
    expect(Number(bang(d1).first_shield_claimed)).toBe(1)
    expect(Number(bang(d1).fragment_balance)).toBe(0)
    expect(dem(d1, 'cnh_exp_spend_ledger', "command_type = 'ren_khien'")).toBe(1)
  })

  it('LATER: ví 700 + 21 mảnh ⇒ trừ 300, `claim_index` = 2', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700, invested: 2400, level: 10, fragment: 21, unused: 1, first: 1 })
    gieoNgayDat(d1, 'S1', 42)
    const r = await renKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(r).toMatchObject({ loai: 'later', claimIndex: 2, expCost: 300, walletAfter: 400, unusedAfter: 2 })
    expect(vi(d1).w).toBe(400)
  })

  it('chưa đủ điều kiện (20 mảnh) ⇒ NÉM, KHÔNG ghi gì', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700, invested: 2400, level: 10, fragment: 20 })
    gieoNgayDat(d1, 'S1', 21)
    await expect(renKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0)
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
    expect(Number(bang(d1).unused_shields)).toBe(0)
  })

  it('phát lại cùng `request_id` ⇒ NGUYÊN kết quả, KHÔNG cấp hai khiên', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700, invested: 2400, level: 10, fragment: 21 })
    gieoNgayDat(d1, 'S1', 21)
    const a = await renKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    const b = await renKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(b).toEqual(a)
    expect(Number(bang(d1).unused_shields)).toBe(1)
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(1)
  })
})

describe('P08 lệnh · ĐỔI VÀNG (`03` §8)', () => {
  it('ví 700 đổi 300 ⇒ ví 400, vàng +300 (CÙNG giao dịch)', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700, gold: 20 })
    const r = await doiVangCore(d1.env, { ...yeuCau('S1', 'R1', 'h1'), soExp: 300 }, phuThuoc)
    expect(r).toMatchObject({ soExp: 300, goldNhan: 300, walletAfter: 400, goldAfter: 320 })
    expect(vi(d1).w).toBe(400)
    expect(Number(bang(d1).gold)).toBe(320)
    expect(dem(d1, 'cnh_exp_spend_ledger', "command_type = 'doi_vang'")).toBe(1)
  })

  it('§8 · vàng đổi PHẢI vào sổ `vang_so` (shop hiện có đọc `SUM(vang_so)`) — nếu không em đổi mà shop không thấy', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700, gold: 20 }) // gương P08 KHỚP sổ cũ từ đầu
    d1.sql.prepare("INSERT INTO vang_so (sbd, loai, so_vang, exp_tru, khoa_yeu_cau, luc) VALUES ('S1','doi',20,0,'cu','x')").run()
    await doiVangCore(d1.env, { ...yeuCau('S1', 'R1', 'h1'), soExp: 300 }, phuThuoc)
    const tong = (d1.sql.prepare("SELECT COALESCE(SUM(so_vang),0) AS t FROM vang_so WHERE sbd = 'S1'").get() as { t: number }).t
    expect(tong).toBe(320) // 20 cũ + 300 vừa đổi — ĐÚNG số shop sẽ đọc
    expect(Number(bang(d1).gold)).toBe(320) // gương trong trạng thái P08 khớp sổ
    const hang = d1.sql.prepare("SELECT loai, so_vang, exp_tru FROM vang_so WHERE sbd = 'S1' AND khoa_yeu_cau = 'R1'").get() as { loai: string; so_vang: number; exp_tru: number }
    expect(hang).toMatchObject({ loai: 'doi', so_vang: 300, exp_tru: 300 })
  })

  it('đổi 301 (xuyên dự trữ 400) ⇒ NÉM, KHÔNG ghi gì', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700 })
    await expect(doiVangCore(d1.env, { ...yeuCau('S1', 'R1', 'h1'), soExp: 301 }, phuThuoc)).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(vi(d1).w).toBe(700)
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(0)
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
  })

  it('số 0 / âm / thập phân / NaN ⇒ NÉM (không ghi gì)', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700 })
    for (const soExp of [0, -5, 1.5, Number.NaN]) {
      await expect(
        doiVangCore(d1.env, { ...yeuCau('S1', `R${String(soExp)}`, 'h'), soExp }, phuThuoc),
        String(soExp),
      ).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    }
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
  })

  it('phát lại cùng `request_id` ⇒ NGUYÊN kết quả, KHÔNG trừ ví lần hai', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 700 })
    const a = await doiVangCore(d1.env, { ...yeuCau('S1', 'R1', 'h1'), soExp: 300 }, phuThuoc)
    const b = await doiVangCore(d1.env, { ...yeuCau('S1', 'R1', 'h1'), soExp: 300 }, phuThuoc)
    expect(b).toEqual(a)
    expect(vi(d1).w).toBe(400)
  })
})

describe('P08 lệnh · TRẠNG THÁI HỎNG & CỬA CANH', () => {
  it('hàng lệch cấp/thâm nhập (level ≠ suy từ invested_exp) ⇒ CORRUPT_STATE, không ghi gì', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400, invested: 200, level: 9 }) // invested 200 ⇒ PHẢI là cấp 2
    await expect(hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).rejects.toMatchObject({ ma: 'CORRUPT_STATE' })
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
  })

  it('cửa canh: ví bị đổi TRƯỚC khi batch chạy ⇒ bất biến hỏng = LỖI CỨNG, CẢ giao dịch rollback', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 400 })
    const db = d1.env.DB
    const batchThat = db.batch.bind(db)
    db.batch = (async (ds: unknown[]) => {
      // Mô phỏng "ai đó sửa ví giữa lúc đọc và lúc ghi": ví thành 999 ⇒ câu canh thấy ví ≠ kỳ vọng.
      d1.sql.prepare("UPDATE cnh_exp_account SET wallet_exp = 999 WHERE student_id = 'S1'").run()
      return batchThat(ds as never)
    }) as typeof db.batch
    await expect(hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).rejects.toThrow()
    expect(dem(d1, 'cnh_exp_command')).toBe(0) // rollback: KHÔNG có receipt giả-thành-công
    expect(dem(d1, 'cnh_exp_p08_guard')).toBe(0)
    expect(vi(d1).w).toBe(999)
  })
})

describe('P08 lệnh · ĐỒNG THỜI', () => {
  it('8 lời gọi ĐỒNG THỜI cùng `request_id` ⇒ MỘT receipt, MỘT lần trừ ví', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 1000 })
    serialiseD1(d1.env)
    const kq = await Promise.all(Array.from({ length: 8 }, () => hapThuCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)))
    for (const r of kq) expect(r).toEqual(kq[0])
    expect(dem(d1, 'cnh_exp_command')).toBe(1)
    expect(vi(d1).w).toBe(800) // chỉ trừ MỘT lần 200
  })

  it('8 lời gọi ĐỒNG THỜI cùng NGÀY (khác `request_id`) ⇒ vẫn CHỈ MỘT hàng sổ mảnh (§7.1)', async () => {
    const d1 = taoD1That()
    gieo(d1, { achieved: 1 })
    serialiseD1(d1.env)
    const kq = await Promise.all(
      Array.from({ length: 8 }, (_v, i) => ghiManhNgayDat(d1.env, yeuCau('S1', `R${i}`, `h${i}`), phuThuoc)),
    )
    expect(dem(d1, 'cnh_exp_fragment_ledger', "student_id = 'S1'")).toBe(1)
    expect(Number(bang(d1).fragment_balance)).toBe(1)
    expect(Number(bang(d1).achieved_days)).toBe(1)
    for (const r of kq) expect(r.fragmentBalanceAfter).toBe(1)
  })
})

describe('P08 lệnh · ĐỐI CHIẾU `legacy_unresolved` (`03` §9.2)', () => {
  /** Hồ sơ ở nhánh CHỜ: trạng thái ba nhánh + mảnh chờ, cờ khiên đầu = 0. */
  const gieoCho = (d1: D1That, sbd = 'S1', o: { unused?: number; pending?: number } = {}) => {
    gieo(d1, { sbd, wallet: 500, unused: o.unused ?? 0 })
    d1.sql
      .prepare("UPDATE cnh_exp_p08_state SET first_claim_status = 'legacy_unresolved', legacy_pending_fragments = ? WHERE student_id = ?")
      .run(o.pending ?? 40, sbd)
  }
  const yc = (sbd: string, ma: string, ketLuan: 'da_nhan' | 'con_thieu') => ({
    ...yeuCau(sbd, ma, `h${ma}`),
    legacyResolutionId: 'GV-01',
    ketLuan,
    giaoVien: 'co-lan',
  })

  it('`da_nhan`: ĐÓNG pending (status claimed, cờ 1), KHÔNG cấp thêm khiên, KHÔNG đụng mảnh', async () => {
    const d1 = taoD1That()
    gieoCho(d1)
    const r = await giaiQuyetKhiendau(d1.env, yc('S1', 'R1', 'da_nhan'), phuThuoc)
    expect(r).toMatchObject({ ketLuan: 'da_nhan', voucherCap: 0, unusedAfter: 0, firstClaimStatus: 'claimed', firstShieldClaimed: 1 })
    const b = bang(d1)
    expect(Number(b.first_shield_claimed)).toBe(1)
    expect(String(b.first_claim_status)).toBe('claimed')
    expect(Number(b.unused_shields)).toBe(0)
    expect(Number(b.legacy_pending_fragments)).toBe(40) // GIỮ NGUYÊN, không tự tiêu
    expect(dem(d1, 'cnh_exp_p08_giai_quyet')).toBe(1)
  })

  it('`con_thieu`: cấp MỘT voucher (+1 khiên CHƯA DÙNG), KHÔNG đụng mảnh', async () => {
    const d1 = taoD1That()
    gieoCho(d1, 'S1', { unused: 1 })
    const r = await giaiQuyetKhiendau(d1.env, yc('S1', 'R1', 'con_thieu'), phuThuoc)
    expect(r).toMatchObject({ ketLuan: 'con_thieu', voucherCap: 1, unusedAfter: 2 })
    expect(Number(bang(d1).unused_shields)).toBe(2)
    expect(Number(bang(d1).legacy_pending_fragments)).toBe(40)
  })

  it('`con_thieu` khi kho ĐÃ ĐỦ 5 ⇒ NÉM (voucher vẫn tôn trọng kho 5), không ghi gì', async () => {
    const d1 = taoD1That()
    gieoCho(d1, 'S1', { unused: 5 })
    await expect(giaiQuyetKhiendau(d1.env, yc('S1', 'R1', 'con_thieu'), phuThuoc)).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_p08_giai_quyet')).toBe(0)
    expect(Number(bang(d1).unused_shields)).toBe(5)
  })

  it('chạy lại CÙNG `legacy_resolution_id` ⇒ phát lại NGUYÊN kết quả, không cấp hai voucher', async () => {
    const d1 = taoD1That()
    gieoCho(d1)
    const a = await giaiQuyetKhiendau(d1.env, yc('S1', 'R1', 'con_thieu'), phuThuoc)
    const b = await giaiQuyetKhiendau(d1.env, yc('S1', 'R2', 'con_thieu'), phuThuoc) // request khác, cùng id đối chiếu
    expect(b).toEqual(a)
    expect(Number(bang(d1).unused_shields)).toBe(1)
    expect(dem(d1, 'cnh_exp_p08_giai_quyet')).toBe(1)
  })

  it('HAI học sinh CÙNG `legacy_resolution_id` đều giải quyết được (duy nhất theo học sinh)', async () => {
    const d1 = taoD1That()
    gieoCho(d1, 'S1')
    gieoCho(d1, 'S2')
    await giaiQuyetKhiendau(d1.env, yc('S1', 'R1', 'da_nhan'), phuThuoc)
    await giaiQuyetKhiendau(d1.env, yc('S2', 'R2', 'da_nhan'), phuThuoc)
    expect(dem(d1, 'cnh_exp_p08_giai_quyet')).toBe(2)
  })

  it('thiếu id đối chiếu / tên giáo viên / kết luận lạ ⇒ NÉM, không ghi gì', async () => {
    const d1 = taoD1That()
    gieoCho(d1)
    await expect(giaiQuyetKhiendau(d1.env, { ...yc('S1', 'R1', 'da_nhan'), legacyResolutionId: '' }, phuThuoc)).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    await expect(giaiQuyetKhiendau(d1.env, { ...yc('S1', 'R1', 'da_nhan'), giaoVien: '' }, phuThuoc)).rejects.toMatchObject({ ma: 'NOT_FOUND' })
    await expect(
      giaiQuyetKhiendau(d1.env, { ...yc('S1', 'R1', 'da_nhan'), ketLuan: 'bậy' as 'da_nhan' }, phuThuoc),
    ).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_p08_giai_quyet')).toBe(0)
  })
})

describe('P08 lệnh · DÙNG KHIÊN trong game (`03` §7.2)', () => {
  it('chuyển 1 khiên CHƯA DÙNG → ĐÃ DÙNG, kèm usage receipt, KHÔNG đụng mảnh/ví', async () => {
    const d1 = taoD1That()
    gieo(d1, { wallet: 500, unused: 3, used: 1, fragment: 8, achievedDays: 30 })
    const r = await dungKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(r).toMatchObject({ unusedAfter: 2, usedAfter: 2 })
    const b = bang(d1)
    expect(Number(b.unused_shields)).toBe(2)
    expect(Number(b.used_shields)).toBe(2)
    expect(Number(b.fragment_balance)).toBe(8) // §7.2 KHÔNG thêm/trừ mảnh
    expect(Number(b.achieved_days)).toBe(30) // KHÔNG quy đổi thành ngày đạt
    expect(vi(d1).w).toBe(500) // KHÔNG đụng ví
    // Usage receipt: hàng sổ tiêu shields_delta = -1 (kèm receipt trong `cnh_exp_command`).
    const so = d1.sql.prepare("SELECT shields_delta, exp_delta, fragments_delta FROM cnh_exp_spend_ledger WHERE command_type = 'dung_khien'").get() as { shields_delta: number; exp_delta: number; fragments_delta: number }
    expect(so).toMatchObject({ shields_delta: -1, exp_delta: 0, fragments_delta: 0 })
    expect(dem(d1, 'cnh_exp_command', "command_type = 'dung_khien'")).toBe(1)
  })

  it('hết khiên chưa dùng ⇒ NÉM, không ghi gì', async () => {
    const d1 = taoD1That()
    gieo(d1, { unused: 0, used: 4 })
    await expect(dungKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)).rejects.toMatchObject({ ma: 'KHONG_DU_DIEU_KIEN' })
    expect(dem(d1, 'cnh_exp_command')).toBe(0)
    expect(Number(bang(d1).used_shields)).toBe(4)
  })

  it('phát lại cùng request ⇒ KHÔNG trừ khiên lần hai', async () => {
    const d1 = taoD1That()
    gieo(d1, { unused: 2 })
    const a = await dungKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    const b = await dungKhienCore(d1.env, yeuCau('S1', 'R1', 'h1'), phuThuoc)
    expect(b).toEqual(a)
    expect(Number(bang(d1).unused_shields)).toBe(1)
    expect(dem(d1, 'cnh_exp_spend_ledger')).toBe(1)
  })
})
