// @vitest-environment node
// CNH-1.0 — EXP_ONLY (Cline, 24/09/2026). Bộ kiểm RUNTIME D1 cho lớp EXP do tôi sở hữu:
//   A. SỔ KIỂM "route thật → P07" (`server/src/cnh-exp-route-gate.ts`) phải khớp MÃ THẬT của repo (không bịa route).
//   B. CỬA KÍCH HOẠT phải fail-closed đúng mã, và KHÔNG được đòi strict/AI metadata như điều kiện bắt buộc.
//   C. SUBSTRATE QUYẾT TOÁN trên D1 THẬT (node:sqlite + đủ schema/migration): retry cùng request ⇒ receipt CŨ,
//      key mâu thuẫn ⇒ IDEMPOTENCY_CONFLICT, cạnh tranh/ nhiều thiết bị ⇒ không cộng hai lần, qua ngày VN ⇒ NOT_FOUND.
// Chỉ ĐỌC/GHI trên D1 GIẢ trong bộ nhớ với dữ liệu TỔNG HỢP. Không deploy, không chạm dữ liệu thật.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { taoD1That, serialiseD1, type D1That } from './_d1-that'
import { LENH_QUYET_TOAN_CORE, LoiQuyetToan, PHIEN_BAN_CHINH_SACH, quyetToanQuyenCore, type PhanHoiQuyetToanCore } from '../server/src/cnh-exp-ledger'
import {
  SO_TICH_HOP, TEP_DE_XUAT_PATCH, deXuatPatch, kiemCuaKichHoat, kiemTichHopRoute, timDong, type CauHinhKichHoat,
} from '../server/src/cnh-exp-route-gate'

/** Mọi điều kiện cửa đều ĐẠT; từng ca đổi đúng một trường để thấy mã từ chối. */
const CUA_OK: CauHinhKichHoat = { phienBanChinhSach: PHIEN_BAN_CHINH_SACH, bangDaChay: true, duongCuConBat: false, viMoiLaChu: true, anhChupDaNoi: true, strictMetadata: false }

/** Đối chiếu `xuLy` của từng dòng với MÃ THẬT — chống bịa route/ lệch bản đang chạy. */
const DOI_CHIEU: readonly (readonly [string, string, string])[] = [
  ['/game-v2/answer', 'server/src/game-v2.ts', "action==='answer'"],
  ['/game-v2/complete', 'server/src/game-v2.ts', "action==='complete'"],
  ['/game-v2/invest', 'server/src/game-v2.ts', "action==='invest'"],
  ['/game-v2/khien-ren', 'server/src/game-v2.ts', "action==='khien-ren'"],
  ['/game-v2/doan-nop', 'server/src/game-v2-doan.ts', "action === 'doan-nop'"],
  ['/btvn/nop', 'server/src/index.ts', "p === '/btvn/nop'"],
  ['/btvn/xong-lo', 'server/src/index.ts', "p === '/btvn/xong-lo'"],
  ['/hs/on-lai/nop', 'server/src/index.ts', "p === '/hs/on-lai/nop'"],
  ['/hs/thu-thach-hom-nay/nop', 'server/src/index.ts', "p === '/hs/thu-thach-hom-nay/nop'"],
  ['/mom/submit', 'server/src/mom.ts', "action==='submit'"],
  ['/parent-news/assign', 'server/src/parent-news.ts', "action !== 'assign'"],
  ['/ph/giao-them', 'server/src/index.ts', "p === '/ph/giao-them'"],
  ['/ca/cham-lai', 'server/src/index.ts', "p === '/ca/cham-lai'"],
  ['/hs/ke-hoach-ngay', 'server/src/index.ts', "p === '/hs/ke-hoach-ngay'"],
]

const doc = (tep: string) => readFileSync(tep, 'utf8')

describe('SỔ KIỂM route → P07: đủ dòng, không trùng, và KHỚP mã thật', () => {
  it('mỗi đường khai một lần; dòng có tiền PHẢI có khoá idempotency; dòng đề xuất patch PHẢI có tệp đích', () => {
    expect(new Set(SO_TICH_HOP.map((d) => d.duong)).size).toBe(SO_TICH_HOP.length)
    for (const d of SO_TICH_HOP) {
      expect(d.xuLy.trim(), d.duong).not.toBe('')
      expect(d.vai.length, d.duong).toBeGreaterThan(0)
      expect(d.ghiChu.trim(), d.duong).not.toBe('')
      if (d.tien !== 'khong') expect(d.khoaIdempotency, `dòng tiền thiếu khoá: ${d.duong}`).toBeTruthy()
    }
    const patch = deXuatPatch()
    expect(new Set(patch.map((p) => p.duong)).size).toBe(patch.length)
    for (const p of patch) expect(TEP_DE_XUAT_PATCH[p.duong], p.duong).toBeTruthy()
    // Mọi dòng `de_xuat_patch` phải nằm trong danh sách trình Boss; `da_noi`/`ngoai_lat_nay` thì không.
    expect(new Set(patch.map((p) => p.duong))).toEqual(new Set(SO_TICH_HOP.filter((d) => d.trangThai === 'de_xuat_patch').map((d) => d.duong)))
  })

  it('mọi đường khai trong sổ đều tồn tại THẬT trong mã của bản đang chạy', () => {
    // Mỗi dòng sổ PHẢI có đúng một mục đối chiếu (không thừa, không thiếu) — đây là chốt chống bịa route.
    expect(new Set(DOI_CHIEU.map((x) => x[0]))).toEqual(new Set(SO_TICH_HOP.map((d) => d.duong)))
    for (const [duong, tep, mau] of DOI_CHIEU) {
      expect(timDong(duong), `sổ kiểm thiếu ${duong}`).not.toBeNull()
      expect(doc(tep), `${tep} không còn chứa ${mau}`).toContain(mau)
    }
    // `/game-v2/*` là route TIỀN TỐ: xác nhận tiền tố thật tồn tại trong index.ts.
    expect(doc('server/src/index.ts')).toContain("p.startsWith('/game-v2/')")
    expect(doc('server/src/index.ts')).toContain("p.startsWith('/mom/')")
  })

  it('deXuatPatch đủ 12 dòng và mỗi dòng nói rõ việc phải làm', () => {
    const patch = deXuatPatch()
    expect(patch.length).toBe(12)
    for (const p of patch) expect(p.viec.length, p.duong).toBeGreaterThan(20)
    // Đoàn KHÔNG nằm trong đề xuất patch (thuộc Aider) — đây là ràng buộc không sửa chồng.
    expect(patch.map((p) => p.duong)).not.toContain('/game-v2/doan-nop')
    expect(timDong('/game-v2/doan-nop')!.trangThai).toBe('ngoai_lat_nay')
  })
})

describe('CỬA KÍCH HOẠT: fail-closed đúng mã, và strict metadata KHÔNG phải điều kiện', () => {
  it('đủ điều kiện ⇒ CHO_PHEP; strictMetadata bật/tắt KHÔNG đổi quyết định', () => {
    expect(kiemCuaKichHoat(CUA_OK)).toMatchObject({ choPhep: true, ma: 'CHO_PHEP' })
    expect(kiemCuaKichHoat({ ...CUA_OK, strictMetadata: true }).choPhep).toBe(true)
    expect(kiemCuaKichHoat({ ...CUA_OK, strictMetadata: true }).ma).toBe(kiemCuaKichHoat(CUA_OK).ma)
    expect(kiemCuaKichHoat(CUA_OK).lyDo).toContain(LENH_QUYET_TOAN_CORE)
  })
  it('mỗi điều kiện thiếu/ sai ⇒ TỪ CHỐI đúng mã', () => {
    expect(kiemCuaKichHoat({ ...CUA_OK, bangDaChay: false })).toMatchObject({ choPhep: false, ma: 'THIEU_BANG' })
    expect(kiemCuaKichHoat({ ...CUA_OK, phienBanChinhSach: 'CNH-0.9' })).toMatchObject({ choPhep: false, ma: 'SAI_PHIEN_BAN' })
    expect(kiemCuaKichHoat({ ...CUA_OK, duongCuConBat: true, viMoiLaChu: true })).toMatchObject({ choPhep: false, ma: 'HAI_DUONG_TIEN' })
    expect(kiemCuaKichHoat({ ...CUA_OK, anhChupDaNoi: false })).toMatchObject({ choPhep: false, ma: 'THIEU_ANH_CHUP' })
    expect(kiemCuaKichHoat(null as unknown as CauHinhKichHoat)).toMatchObject({ choPhep: false, ma: 'CUA_KHONG_HOP_LE' })
  })
  it('thứ tự kiểm cố định: đường cũ bật + chưa chuyển quyền ví vẫn bị chặn ở thiếu ảnh chụp', () => {
    expect(kiemCuaKichHoat({ ...CUA_OK, duongCuConBat: true, viMoiLaChu: false, anhChupDaNoi: false }).ma).toBe('THIEU_ANH_CHUP')
    expect(kiemCuaKichHoat({ ...CUA_OK, duongCuConBat: true, viMoiLaChu: false }).choPhep).toBe(true)
  })
  it('route lạ và route thuộc Aider đều bị từ chối (không tự nối, không sửa chồng)', () => {
    expect(kiemTichHopRoute('/khong-co-that', CUA_OK)).toMatchObject({ choPhep: false, ma: 'CUA_KHONG_HOP_LE' })
    const doan = kiemTichHopRoute('/game-v2/doan-nop', CUA_OK)
    expect(doan).toMatchObject({ choPhep: false, ma: 'CUA_KHONG_HOP_LE' })
    expect(doan.dong?.trangThai).toBe('ngoai_lat_nay')
    const onLai = kiemTichHopRoute('/hs/on-lai/nop', CUA_OK)
    expect(onLai.choPhep).toBe(true)
    expect(onLai.dong?.duong).toBe('/hs/on-lai/nop')
    expect(kiemTichHopRoute('/hs/on-lai/nop', { ...CUA_OK, duongCuConBat: true }).ma).toBe('HAI_DUONG_TIEN')
  })
})

// ───────────────────────── SUBSTRATE QUYẾT TOÁN TRÊN D1 THẬT ─────────────────────────

let demUuid = 0
const phuThuoc = () => ({ uuid: () => `exec-${++demUuid}`, sleep: async () => {} })

/** Một em có tài khoản ví + một ngày học đã ghi (dữ liệu TỔNG HỢP). */
function coVi(d: D1That, o: { sbd?: string; ngay?: string; raw?: number; achieved?: 0 | 1; corePaid?: number; wallet?: number; earned?: number } = {}) {
  const sbd = o.sbd ?? 'S1', ngay = o.ngay ?? '2026-09-22'
  d.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, ?, 0)').run(sbd, o.wallet ?? 0, o.earned ?? 0)
  d.sql.prepare('INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision) VALUES (?, ?, ?, ?, ?, ?, 0, 0)')
    .run(sbd, ngay, PHIEN_BAN_CHINH_SACH, o.raw ?? 6, o.achieved ?? 0, o.corePaid ?? 0)
  return { sbd, ngay }
}
const dem = (d: D1That, bang: string) => (d.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang}`).get() as { n: number }).n
const vi = (d: D1That, sbd = 'S1') => d.sql.prepare('SELECT wallet_exp, earned_exp FROM cnh_exp_account WHERE student_id = ?').get(sbd) as { wallet_exp: number; earned_exp: number }
const ngayCua = (d: D1That, sbd = 'S1', ngay = '2026-09-22') => d.sql.prepare('SELECT raw_core, achieved, core_paid FROM cnh_exp_day WHERE student_id = ? AND learning_day = ?').get(sbd, ngay) as { raw_core: number; achieved: number; core_paid: number }
/** BẤT BIẾN TIỀN: tổng đã trả trong sổ = tổng thật sự đã cộng. Không phụ thuộc số DÒNG sổ (dòng 0 đồng vẫn hợp lệ). */
const tongDaTra = (d: D1That, sbd = 'S1') => Number((d.sql.prepare('SELECT COALESCE(SUM(amount), 0) AS s FROM cnh_exp_grant_ledger WHERE student_id = ?').get(sbd) as { s: number }).s)

describe('QUYẾT TOÁN trên D1 thật: receipt/lượt trả không cộng hai lần', () => {
  it('RETRY cùng request (mất phản hồi): trả ĐÚNG receipt cũ, ví/sổ/quyền KHÔNG đổi thêm', async () => {
    const d = taoD1That()
    const { sbd, ngay } = coVi(d, { achieved: 1, raw: 6 })
    const yc = { studentId: sbd, learningDay: ngay, requestId: 'req-1', requestHash: 'hash-A' }
    const a = await quyetToanQuyenCore(d.env, yc, phuThuoc())
    expect(a.commandType).toBe(LENH_QUYET_TOAN_CORE)
    expect(a.grant).toBeGreaterThan(0)
    const viSau = vi(d), ngaySau = ngayCua(d), soLedger = dem(d, 'cnh_exp_grant_ledger'), soLenh = dem(d, 'cnh_exp_command')
    const b = await quyetToanQuyenCore(d.env, yc, phuThuoc())
    expect(b).toEqual(a) // receipt CŨ nguyên vẹn, không có cờ `replayed`
    expect(vi(d)).toEqual(viSau)
    expect(ngayCua(d)).toEqual(ngaySau)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(soLedger)
    expect(dem(d, 'cnh_exp_command')).toBe(soLenh)
    expect(soLenh).toBe(1)
  })

  it('KEY MÂU THUẪN: cùng requestId nhưng payload khác ⇒ IDEMPOTENCY_CONFLICT, không ghi gì thêm', async () => {
    const d = taoD1That()
    const { sbd, ngay } = coVi(d, { achieved: 1 })
    await quyetToanQuyenCore(d.env, { studentId: sbd, learningDay: ngay, requestId: 'req-1', requestHash: 'hash-A' }, phuThuoc())
    const truoc = { vi: vi(d), ledger: dem(d, 'cnh_exp_grant_ledger') }
    const loi = await quyetToanQuyenCore(d.env, { studentId: sbd, learningDay: ngay, requestId: 'req-1', requestHash: 'hash-B' }, phuThuoc()).then(() => null, (e) => e)
    expect(loi).toBeInstanceOf(LoiQuyetToan)
    expect((loi as LoiQuyetToan).ma).toBe('IDEMPOTENCY_CONFLICT')
    expect(vi(d)).toEqual(truoc.vi)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(truoc.ledger)
  })

  it('CẠNH TRANH / NHIỀU THIẾT BỊ: hai yêu cầu song song cùng key ⇒ một receipt, một khoản, ví không gấp đôi', async () => {
    const d = taoD1That()
    const { sbd, ngay } = coVi(d, { achieved: 1 })
    // `batch` của D1 thật là giao dịch; adapter SQLite trong bộ nhớ phải được xếp hàng thì hai yêu cầu
    // "song song" mới đúng ngữ nghĩa D1 (không lồng BEGIN). Xem `serialiseD1` trong `tests/_d1-that.ts`.
    serialiseD1(d.env)
    const yc = { studentId: sbd, learningDay: ngay, requestId: 'req-1', requestHash: 'hash-A' }
    const [a, b] = await Promise.all([quyetToanQuyenCore(d.env, yc, phuThuoc()), quyetToanQuyenCore(d.env, yc, phuThuoc())])
    expect(a).toEqual(b)
    expect(dem(d, 'cnh_exp_command')).toBe(1)
    expect(vi(d).wallet_exp).toBe(a.walletAfter)
    expect(vi(d).earned_exp).toBe(a.earnedAfter)
    // Bất biến tiền: TỔNG đã trả trong sổ = ví hiện có = quyền đã chốt (không có khoản thứ hai).
    expect(tongDaTra(d)).toBe(a.walletAfter)
  })

  it('đã trả đủ rồi: quyết toán lần nữa bằng KEY KHÁC ⇒ grant 0, ví không tăng', async () => {
    const d = taoD1That()
    const { sbd, ngay } = coVi(d, { achieved: 1 })
    const a = await quyetToanQuyenCore(d.env, { studentId: sbd, learningDay: ngay, requestId: 'req-1', requestHash: 'h1' }, phuThuoc())
    const b = await quyetToanQuyenCore(d.env, { studentId: sbd, learningDay: ngay, requestId: 'req-2', requestHash: 'h1' }, phuThuoc())
    expect(b.grant).toBe(0)
    expect(b.walletAfter).toBe(a.walletAfter)
    expect(b.corePaidAfter).toBe(a.corePaidAfter)
    expect(dem(d, 'cnh_exp_command')).toBe(2) // hai LỆNH khác key ⇒ hai receipt, nhưng tiền KHÔNG tăng
    expect(tongDaTra(d)).toBe(a.walletAfter) // tổng cộng đúng MỘT quyền, không trả hai lần
  })

  it('QUA NGÀY VN: ngày chưa có dòng ⇒ NOT_FOUND (không tự bịa ngày/ tự cộng)', async () => {
    const d = taoD1That()
    const { sbd } = coVi(d, { ngay: '2026-09-22' })
    const loi = await quyetToanQuyenCore(d.env, { studentId: sbd, learningDay: '2026-09-23', requestId: 'req-x', requestHash: 'h' }, phuThuoc()).then(() => null, (e) => e)
    expect((loi as LoiQuyetToan).ma).toBe('NOT_FOUND')
    expect(dem(d, 'cnh_exp_command')).toBe(0)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(0)
  })

  it('TIỀN FAIL-CLOSED ở tầng SQL: ví không phải số nguyên / âm ⇒ câu ghi LỖI (không lưu rác)', () => {
    const d = taoD1That()
    coVi(d, { wallet: 10 })
    expect(() => d.sql.prepare('UPDATE cnh_exp_account SET wallet_exp = 1.5 WHERE student_id = ?').run('S1')).toThrow()
    expect(() => d.sql.prepare('UPDATE cnh_exp_account SET wallet_exp = -1 WHERE student_id = ?').run('S1')).toThrow()
    expect(vi(d).wallet_exp).toBe(10)
  })
})
