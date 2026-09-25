// @vitest-environment node
// CNH-1.0 — SỬA ĐIỂM (correction) ĐÚNG MỘT LẦN — D1 THẬT (node:sqlite + đủ schema/migration của P07).
// Đặc tả 03 §1.3: correction_id liên kết event gốc + version chấm cũ/mới + lý do + tác giả; DỰNG LẠI trạng thái;
// THÊM KHOẢN BÙ DƯƠNG CÒN THIẾU ĐÚNG MỘT LẦN; KHÔNG thu hồi EXP/khiên đã tiêu; cùng correction chạy lại KHÔNG tạo hai khoản.
// Bộ này kiểm bằng D1 thật: retry cùng correction_id · hai yêu cầu đồng thời · correction KHÁC hợp lệ ·
// không cộng thưởng hai lần · ROLLBACK khi lỗi ghi · không thu hồi khi quyền mới nhỏ hơn đã trả.
import { describe, expect, it } from 'vitest'
import { serialiseD1, taoD1That, type D1That } from './_d1-that'
import {
  LENH_SUA_DIEM, LoiSuaDiem, PHIEN_BAN_CHINH_SACH, bamYeuCauSuaDiem, suaDiemMotLan, type YeuCauSuaDiem,
} from '../server/src/cnh-exp-correction'

const SBD = 'S1'
const NGAY = '2026-09-22'
const THAM_CHIEU = { eventId: 'ev-1', oldGradeVersion: 'grade-1', newGradeVersion: 'grade-2', reason: 'Thầy chấm lại câu 3', teacherId: 'GV-01' }

/** Em có ví + ngày học đã ghi (dữ liệu TỔNG HỢP). `corePaid` = phần quyền core đã chốt trước đó. */
function dung(o: { raw?: number; achieved?: 0 | 1; corePaid?: number; compPaid?: number; wallet?: number; earned?: number } = {}): D1That {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, ?, 0)').run(SBD, o.wallet ?? 0, o.earned ?? 0)
  d.sql.prepare(
    'INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(SBD, NGAY, PHIEN_BAN_CHINH_SACH, o.raw ?? 50, o.achieved ?? 0, o.corePaid ?? 50, o.compPaid ?? 0)
  return d
}

async function yeuCau(o: { correctionId: string; rawCoreAfter: number; achievedAfter?: boolean; thamChieu?: Partial<typeof THAM_CHIEU>; hash?: string }): Promise<YeuCauSuaDiem> {
  const thamChieu = { ...THAM_CHIEU, ...(o.thamChieu ?? {}) }
  const rawCoreAfter = o.rawCoreAfter
  const achievedAfter = o.achievedAfter ?? false
  return {
    studentId: SBD, learningDay: NGAY, correctionId: o.correctionId, thamChieu, rawCoreAfter, achievedAfter,
    requestHash: o.hash ?? (await bamYeuCauSuaDiem({ thamChieu, rawCoreAfter, achievedAfter })),
  }
}
/** Không chờ thật để test tất định/nhanh; uuid đếm để dễ đọc. */
let demUuid = 0
const phuThuoc = () => ({ uuid: () => `exec-${++demUuid}`, sleep: async () => {} })

const dem = (d: D1That, bang: string, where = '1=1') => (d.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${where}`).get() as { n: number }).n
const tongSoBu = (d: D1That) => Number((d.sql.prepare('SELECT COALESCE(SUM(amount), 0) AS s FROM cnh_exp_grant_ledger WHERE student_id = ?').get(SBD) as { s: number }).s)
const vi = (d: D1That) => d.sql.prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?').get(SBD) as { wallet_exp: number; earned_exp: number; revision: number }
const ngayCua = (d: D1That) =>
  d.sql.prepare('SELECT raw_core, achieved, core_paid, compensation_paid, revision FROM cnh_exp_day WHERE student_id = ? AND learning_day = ?').get(SBD, NGAY) as {
    raw_core: number; achieved: number; core_paid: number; compensation_paid: number; revision: number
  }
const soLenh = (d: D1That) => dem(d, 'cnh_exp_command', `command_type = '${LENH_SUA_DIEM}'`)
/** Ảnh chụp trạng thái TIỀN để so trước/sau một thao tác. */
const chup = (d: D1That) => JSON.stringify({ vi: vi(d), ngay: ngayCua(d), so: soLenh(d), bu: tongSoBu(d), guard: dem(d, 'cnh_exp_guard') })


describe('Boss independent correction edge cases', () => {
  it('same correction key on another day must reject instead of returning wrong-day receipt', async () => {
    const d = dung()
    const a = await yeuCau({ correctionId: 'corr-day', rawCoreAfter: 77 })
    await suaDiemMotLan(d.env, a, phuThuoc())
    await expect(suaDiemMotLan(d.env, { ...a, learningDay: '2026-09-23' }, phuThuoc())).rejects.toMatchObject({ ma: 'IDEMPOTENCY_CONFLICT' })
  })
  it('concurrent distinct corrections with same recomputed total do not turn healthy CAS conflict into corruption', async () => {
    const d = dung()
    serialiseD1(d.env)
    const a = await yeuCau({ correctionId: 'corr-a', rawCoreAfter: 77 })
    const b = await yeuCau({ correctionId: 'corr-b', rawCoreAfter: 77, thamChieu: { eventId: 'ev-2' } })
    const out = await Promise.allSettled([suaDiemMotLan(d.env, a, phuThuoc()), suaDiemMotLan(d.env, b, phuThuoc())])
    expect(out.map(x => x.status)).toEqual(['fulfilled', 'fulfilled'])
    expect(vi(d).wallet_exp).toBe(27)
    expect(soLenh(d)).toBe(2)
  })
})
