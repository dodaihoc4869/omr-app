// @vitest-environment node
// CNH-1.0 P08 — BẰNG CHỨNG ADAPTER ĐỌC BẢNG CŨ (`03` §9.1/§9.2) trên LƯỢC ĐỒ THẬT (`node:sqlite`).
//
// Dữ liệu TỔNG HỢP. Không chạm dữ liệu thật. Chứng minh: đọc đúng hồ sơ cũ ⇒ ảnh chụp; mảnh/ngày đạt
// lấy từ SỔ (§7.1); khiên cũ gọi ĐÚNG hàm cũ; sổ-vượt-hồ-sơ ⇒ `legacy_unresolved` + giữ mảnh chờ,
// KHÔNG tự tiêu; hồ sơ thiếu/hỏng ⇒ ném, không bịa.
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { docAnhChupCu, chuyenDoiTuLegacy, chuyenDoiHangLoat } from '../server/src/cnh-exp-p08-legacy'
import { khienConLai } from '../server/src/exp-ho-so-game'

const NGAY = '2026-09-24'
const PHIEN_BAN = 'CNH-1.0'

interface HoSo {
  cap?: number
  exp?: number
  wallet?: number
  shields?: { used: number }
  khienRen?: { manh: number; daRen: number }
  expMoi?: { daCong: number; manhDaTinh: number; ngayDat?: number }
  hapThu?: { ngay: string; da: number }
}

function gieoHoSo(d1: D1That, sbd: string, h: HoSo = {}, revision = 5): void {
  const json = JSON.stringify({ pet: 'dat_quy', choice: true, cap: 1, exp: 0, wallet: 0, ...h })
  d1.sql.prepare('INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES (?, ?, ?, ?)').run(sbd, revision, json, '2026-09-24T00:00:00Z')
}
function gieoManh(d1: D1That, sbd: string, soNgayDat: number, moiNgay = 1): void {
  for (let i = 0; i < soNgayDat; i++) {
    d1.sql
      .prepare("INSERT INTO manh_khien_so (khoa, sbd, ngay_vn, loai, so, luc) VALUES (?, ?, ?, 'dat', ?, ?)")
      .run(`m:${sbd}:${i}`, sbd, `2026-08-${String(i + 1).padStart(2, '0')}`, moiNgay, '2026-08-01T00:00:00Z')
  }
}
function gieoVang(d1: D1That, sbd: string, ds: number[]): void {
  ds.forEach((v, i) => {
    d1.sql
      .prepare('INSERT INTO vang_so (sbd, loai, so_vang, exp_tru, khoa_yeu_cau, luc) VALUES (?, ?, ?, 0, ?, ?)')
      .run(sbd, v >= 0 ? 'doi' : 'mua', v, `k:${sbd}:${i}`, '2026-09-24T00:00:00Z')
  })
}
const khienCu = (h: HoSo) =>
  Math.max(0, khienConLai({ cap: h.cap ?? 1, shields: h.shields, khienRen: h.khienRen, expMoi: h.expMoi } as never))

describe('P08 adapter cũ · đọc hồ sơ → ảnh chụp (`03` §9.1)', () => {
  it('đọc đủ trường: cấp/tiến độ/ống nghiệm/vàng/đồ/khiên/ngày đạt/hạn mức trong ngày/revision', async () => {
    const d1 = taoD1That()
    const ho: HoSo = { cap: 10, exp: 50, wallet: 300, shields: { used: 1 }, khienRen: { manh: 7, daRen: 2 }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 21 }, hapThu: { ngay: NGAY, da: 120 } }
    gieoHoSo(d1, 'S1', ho, 5)
    gieoVang(d1, 'S1', [500, -200])
    gieoManh(d1, 'S1', 21)
    d1.sql.prepare("INSERT INTO phu_kien_so_huu (sbd, ma_mon, mua, gia, khoa_yeu_cau, luc) VALUES ('S1','hao-quang','2026-09-01',10,'k1','x')").run()
    d1.sql.prepare("INSERT INTO exp_so (khoa, sbd, ngay_vn, loai, exp, luc) VALUES ('e1','S1','2026-09-24','dat_ngay',80,'x')").run()

    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a).toMatchObject({
      level: 10,
      progress: 50,
      wallet: 300,
      gold: 300, // 500 − 200
      items: 1,
      usedShields: 1,
      fragmentBalance: 7, // số dư SAU tiêu lấy từ HỒ SƠ
      achievedDays: 21,
      absorbedToday: 120,
      revision: 5,
      pendingReceipts: 1,
      firstClaimStatus: 'claimed', // đã rèn/dùng khiên (§9.2)
      legacyPendingFragments: 0,
    })
    expect(a.unusedShields).toBe(khienCu(ho)) // khiên cũ = ĐÚNG hàm cũ, không viết lại công thức
  })

  it('`absorbed_today` = 0 khi hôm nay KHÁC ngày hấp thụ trong hồ sơ', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 3, hapThu: { ngay: '2026-09-23', da: 200 } })
    expect((await docAnhChupCu(d1.env, 'S1', NGAY)).absorbedToday).toBe(0)
  })

  it('§7.1 · ngày đạt LẤY TỪ SỔ khi hồ sơ thiếu `expMoi.ngayDat`', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 5 })
    gieoManh(d1, 'S1', 3)
    expect((await docAnhChupCu(d1.env, 'S1', NGAY)).achievedDays).toBe(3)
  })
})

describe('P08 adapter cũ · §9.2 ma trận khiên cũ', () => {
  it('CHƯA từng nhận (không khiên, không mảnh) ⇒ `none`', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 2 })
    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a.firstClaimStatus).toBe('none')
    expect(a.legacyPendingFragments).toBe(0)
  })

  it('có MẢNH nhưng chưa từng nhận khiên ⇒ `none` + giữ mảnh tiêu được', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 9, khienRen: { manh: 7, daRen: 0 } })
    gieoManh(d1, 'S1', 7)
    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a.firstClaimStatus).toBe('none')
    expect(a.fragmentBalance).toBe(7)
    expect(a.legacyPendingFragments).toBe(0)
  })

  it('§9.2 · nhận KHIÊN QUÀ tiến hoá mà CHƯA từng rèn/dùng ⇒ VẪN `claimed` (không được cho first lần hai)', async () => {
    // Đây là ca bắt bug cũ `daRen > 0 || used > 0`: nó bỏ sót em chỉ có KHIÊN QUÀ.
    const d1 = taoD1That()
    const ho: HoSo = { cap: 10, shields: { used: 0 }, khienRen: { manh: 0, daRen: 0 }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 21 } }
    gieoHoSo(d1, 'S1', ho)
    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a.unusedShields).toBe(khienCu(ho)) // khiên quà ⇒ > 0
    expect(a.unusedShields).toBeGreaterThan(0)
    expect(a.usedShields).toBe(0)
    expect(a.firstClaimStatus).toBe('claimed') // ⇒ first=true, KHÔNG cấp first lần hai
  })

  it('SỔ có mảnh nhưng HỒ SƠ trắng (mâu thuẫn) ⇒ `legacy_unresolved` + giữ mảnh CHỜ, không tự tiêu', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 10, khienRen: { manh: 0, daRen: 0 }, shields: { used: 0 } })
    gieoManh(d1, 'S1', 5)
    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a.firstClaimStatus).toBe('legacy_unresolved')
    expect(a.fragmentBalance).toBe(0) // KHÔNG tự đẩy thành tiêu được
    expect(a.legacyPendingFragments).toBe(5) // GIỮ NGUYÊN trong nhánh chờ (§9.2)
  })

  it('§9.1 "giữ khiên cũ KỂ CẢ VƯỢT 5": chuyển nguyên con số + số đã dùng', async () => {
    const d1 = taoD1That()
    const ho: HoSo = { cap: 30, shields: { used: 1 }, khienRen: { manh: 3, daRen: 10 } }
    gieoHoSo(d1, 'S1', ho)
    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a.unusedShields).toBe(khienCu(ho))
    expect(a.usedShields).toBe(1)
    expect(a.fragmentBalance).toBe(3)
  })

  it('§7.1 · mảnh đã tiêu CÓ chứng cứ (đã rèn) KHÔNG bị coi là chờ', async () => {
    const d1 = taoD1That()
    // Sổ: 84 mảnh đã kiếm; hồ sơ: còn 0 mảnh + đã rèn 4 khiên ⇒ 4×21 = 84 đã tiêu CÓ chứng cứ ⇒ không chờ.
    gieoHoSo(d1, 'S1', { cap: 12, shields: { used: 4 }, khienRen: { manh: 0, daRen: 4 } })
    gieoManh(d1, 'S1', 84)
    const a = await docAnhChupCu(d1.env, 'S1', NGAY)
    expect(a.firstClaimStatus).toBe('claimed')
    expect(a.legacyPendingFragments).toBe(0)
  })
})

describe('P08 adapter cũ · hồ sơ thiếu/hỏng ⇒ NÉM (không bịa số)', () => {
  it('không có hồ sơ ⇒ NOT_FOUND', async () => {
    const d1 = taoD1That()
    await expect(docAnhChupCu(d1.env, 'KHONG_CO', NGAY)).rejects.toMatchObject({ ma: 'NOT_FOUND' })
  })

  it('JSON hỏng ⇒ CORRUPT_STATE', async () => {
    const d1 = taoD1That()
    d1.sql.prepare("INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES ('S1', 0, '{hỏng', 'x')").run()
    await expect(docAnhChupCu(d1.env, 'S1', NGAY)).rejects.toMatchObject({ ma: 'CORRUPT_STATE' })
  })
})

describe('P08 adapter cũ · chuyển đổi HÀNG LOẠT (§9.1)', () => {
  const ycHang = (o: Record<string, unknown> = {}) => ({
    migrationId: 'DOT-2409',
    learningDay: NGAY,
    effectiveAt: '2026-09-24T17:00:00.000Z',
    oldPolicy: 'legacy',
    newPolicy: PHIEN_BAN,
    dryRun: true,
    ...o,
  })

  it('dry-run: quét đủ số em nhưng KHÔNG ghi gì', async () => {
    const d1 = taoD1That()
    for (const s of ['S1', 'S2', 'S3']) {
      gieoHoSo(d1, s, { cap: 2 })
      gieoManh(d1, s, 1)
      d1.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, 100, 0, 0)').run(s)
    }
    const kq = await chuyenDoiHangLoat(d1.env, ycHang())
    expect(kq).toMatchObject({ xet: 3, chuyen: 3, daCo: 0, xong: true, conTro: null })
    expect(kq.loi).toEqual([])
    expect(Number((d1.sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_state').get() as { n: number }).n)).toBe(0)
  })

  it('MỘT `migration_id` cho CẢ ĐỢT: chuyển thật cả 3 em (đúng ca mà bug UNIQUE toàn cục từng chặn)', async () => {
    const d1 = taoD1That()
    for (const s of ['S1', 'S2', 'S3']) {
      gieoHoSo(d1, s, { cap: 2 })
      gieoManh(d1, s, 1)
      d1.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, 100, 0, 0)').run(s)
    }
    const kq = await chuyenDoiHangLoat(d1.env, ycHang({ dryRun: false }))
    expect(kq).toMatchObject({ xet: 3, chuyen: 3, daCo: 0 })
    expect(Number((d1.sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_state').get() as { n: number }).n)).toBe(3)
    expect(Number((d1.sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_chuyen_doi').get() as { n: number }).n)).toBe(3)
  })

  it('chạy lại CÙNG đợt ⇒ mọi em `daChuyen`, tài sản KHÔNG đổi (§9.3)', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 10, exp: 0 })
    gieoManh(d1, 'S1', 21)
    d1.sql.prepare("INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES ('S1', 250, 0, 0)").run()
    await chuyenDoiHangLoat(d1.env, ycHang({ dryRun: false }))
    const lai = await chuyenDoiHangLoat(d1.env, ycHang({ dryRun: false }))
    expect(lai).toMatchObject({ xet: 1, chuyen: 0, daCo: 1 })
    expect(Number((d1.sql.prepare("SELECT invested_exp AS v FROM cnh_exp_p08_state WHERE student_id = 'S1'").get() as { v: number }).v)).toBe(2400)
  })

  it('em LỖI không chặn em khác; gom vào `loi` (§9.2 danh sách đối chiếu)', async () => {
    const d1 = taoD1That()
    // S1 hồ sơ tốt; S2 JSON hỏng ⇒ lỗi; S3 tốt
    gieoHoSo(d1, 'S1', { cap: 2 })
    d1.sql.prepare("INSERT INTO game_v2_profile (sbd, revision, json, created_at) VALUES ('S2', 0, '{hỏng', 'x')").run()
    gieoHoSo(d1, 'S3', { cap: 2 })
    for (const s of ['S1', 'S2', 'S3']) d1.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, 100, 0, 0)').run(s)
    const kq = await chuyenDoiHangLoat(d1.env, ycHang({ dryRun: false }))
    expect(kq).toMatchObject({ xet: 3, chuyen: 2, daCo: 0 })
    expect(kq.loi).toHaveLength(1)
    expect(kq.loi[0]).toMatchObject({ studentId: 'S2', ma: 'CORRUPT_STATE' })
    expect(Number((d1.sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_state').get() as { n: number }).n)).toBe(2)
  })

  it('con trỏ: lượt 1 giới hạn 2 em ⇒ còn con trỏ; lượt 2 chạy tiếp tới hết', async () => {
    const d1 = taoD1That()
    for (const s of ['S1', 'S2', 'S3']) {
      gieoHoSo(d1, s, { cap: 2 })
      d1.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, 100, 0, 0)').run(s)
    }
    const luot1 = await chuyenDoiHangLoat(d1.env, ycHang({ dryRun: false, gioiHan: 2 }))
    expect(luot1).toMatchObject({ xet: 2, chuyen: 2, xong: false })
    expect(luot1.conTro).toBe('S2')
    const luot2 = await chuyenDoiHangLoat(d1.env, ycHang({ dryRun: false, gioiHan: 2, tuSbd: luot1.conTro }))
    expect(luot2).toMatchObject({ xet: 1, chuyen: 1, xong: true, conTro: null })
  })

  it('thiếu `migrationId` ⇒ NÉM, không quét gì', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 2 })
    await expect(chuyenDoiHangLoat(d1.env, ycHang({ migrationId: '' }))).rejects.toMatchObject({ ma: 'NOT_FOUND' })
  })
})

describe('P08 adapter cũ · ghép với lệnh chuyển đổi (§9.1)', () => {
  it('dry-run KHÔNG ghi; ghi thật tạo trạng thái P08 khớp ảnh chụp; VÍ KHÔNG bị chạm', async () => {
    const d1 = taoD1That()
    gieoHoSo(d1, 'S1', { cap: 10, exp: 0, wallet: 250, khienRen: { manh: 21, daRen: 0 }, expMoi: { daCong: 0, manhDaTinh: 0, ngayDat: 21 } })
    gieoManh(d1, 'S1', 21)
    d1.sql.prepare("INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES ('S1', 250, 0, 0)").run()
    const yc = { studentId: 'S1', learningDay: NGAY, migrationId: 'M1', effectiveAt: '2026-09-24T17:00:00.000Z', oldPolicy: 'legacy', newPolicy: PHIEN_BAN, dryRun: true }

    const thu = await chuyenDoiTuLegacy(d1.env, yc)
    expect(thu).toMatchObject({ dryRun: true, daChuyen: false, investedExp: 2400 })
    expect(Number((d1.sql.prepare('SELECT COUNT(*) AS n FROM cnh_exp_p08_state').get() as { n: number }).n)).toBe(0)

    const that = await chuyenDoiTuLegacy(d1.env, { ...yc, dryRun: false })
    expect(that.daChuyen).toBe(false)
    const h = d1.sql.prepare("SELECT * FROM cnh_exp_p08_state WHERE student_id = 'S1'").get() as Record<string, unknown>
    expect(h.level).toBe(10)
    expect(h.invested_exp).toBe(2400)
    expect(h.fragment_balance).toBe(21)
    expect(h.achieved_days).toBe(21)
    // Tiền đề B: ví GIỮ NGUYÊN ở `cnh_exp_account` (lệnh không chạm ví).
    expect((d1.sql.prepare("SELECT wallet_exp AS w FROM cnh_exp_account WHERE student_id = 'S1'").get() as { w: number }).w).toBe(250)
  })
})
