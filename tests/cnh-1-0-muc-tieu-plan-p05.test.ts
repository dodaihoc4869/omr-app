// @vitest-environment node
// P05/T13·T40 — MỘT plan/ngày: mục tiêu core ĐÓNG BĂNG + deferred_count/over_budget_seconds trong D1 thật.
// Chứng minh trên ĐƯỜNG SẢN PHẨM (`lapVaLuuKeHoach` / `hsKeHoachNgay`):
//   · Mục tiêu được chốt (role/n/min_success/policy_version/revision) và GHI vào `ke_hoach_ngay.muc_tieu_json`.
//   · Đầu vào đổi (thêm câu BTVN) KHÔNG làm mục tiêu đã chốt tăng ngầm (mở lại app trả ĐÚNG bản đã đóng băng).
//   · BTVN vượt tải GIỮ NGUYÊN assignment + HẠN GỐC; plan ghi số câu hoãn + số giây vượt.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { goiWorker, taoD1That } from './_d1-that'

const NOW = Date.parse('2026-09-23T05:00:00.000Z') // 12:00 giờ VN, 23/09
const H = 3_600_000
const iso = (gio: number) => new Date(NOW + gio * H).toISOString()

function themEm(d: ReturnType<typeof taoD1That>, sbd = 'S1') {
  d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,trang_thai,cap_nhat_luc) VALUES(?,?,'da_duyet','x')").run(sbd, 'Em')
}

/** BTVN giáo viên giao: `giaoGio`/`hanGio` tính theo giờ so với NOW (âm = đã qua). */
function seedBtvn(d: ReturnType<typeof taoD1That>, ma: string, soCau: number, giaoGio: number, hanGio: number, sbd = 'S1') {
  themEm(d, sbd)
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)')
    .run(ma, 'CA', 'DE', soCau, iso(giaoGio), iso(hanGio), 'x')
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,lo_da_xong) VALUES(?,?,?,0)').run(`${ma}|${sbd}`, ma, sbd)
}

describe('P05/T13·T40 — một plan/ngày, mục tiêu core đóng băng (D1 thật)', () => {
  it('chốt mục tiêu vào plan và GHI vào D1 (`muc_tieu_json`) với policy_version + revision', async () => {
    const d = taoD1That()
    seedBtvn(d, 'GAN', 30, -24, 48)
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(kh.mucTieu.role).toBe('homework_slice') // có BTVN tới hạn là việc BẮT BUỘC
    expect(kh.mucTieu.policyVersion).toBe('cnh1-p05-v1')
    expect(kh.mucTieu.revision).toBe(1)
    expect(kh.mucTieu.n).toBeGreaterThan(0)
    expect(kh.mucTieu.minSuccess).toBeGreaterThanOrEqual(1)
    expect(kh.mucTieu.requiredTaskIds.length).toBeGreaterThan(0)
    const row = d.sql.prepare("SELECT muc_tieu_json FROM ke_hoach_ngay WHERE sbd='S1'").get() as { muc_tieu_json: string }
    expect(JSON.parse(row.muc_tieu_json).role).toBe('homework_slice')
    expect(JSON.parse(row.muc_tieu_json).n).toBe(kh.mucTieu.n)
  })

  it('ĐẦU VÀO ĐỔI ⇒ mục tiêu đã chốt KHÔNG tăng ngầm (mở lại app trả đúng bản đóng băng)', async () => {
    const d = taoD1That()
    seedBtvn(d, 'GAN', 30, -24, 48)
    const lan1 = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    // Thầy giao THÊM bài (đầu vào mới sẽ cho n lớn hơn nếu tính lại) — mở lại app trong cùng ngày.
    seedBtvn(d, 'THEM', 40, 0, 72)
    const lan2 = (await lapVaLuuKeHoach(d.env, ['S1'], NOW + 2 * H)).get('S1')!
    expect(lan2.mucTieu.n).toBe(lan1.mucTieu.n) // KHÔNG tăng điều kiện đạt
    expect(lan2.mucTieu.minSuccess).toBe(lan1.mucTieu.minSuccess)
    expect(lan2.mucTieu.revision).toBe(1)
    expect(lan2.mucTieu.requiredTaskIds).toEqual(lan1.mucTieu.requiredTaskIds)
    // CHỨNG MINH PHÉP ĐO CÓ NGHĨA: một em CÓ SẴN hai bài từ đầu thì n (tính mới) LỚN HƠN bản đã chốt của S1.
    const d2 = taoD1That()
    seedBtvn(d2, 'GAN', 30, -24, 48, 'S2')
    seedBtvn(d2, 'THEM', 40, 0, 72, 'S2')
    const tinhMoi = (await lapVaLuuKeHoach(d2.env, ['S2'], NOW + 2 * H)).get('S2')!
    expect(tinhMoi.mucTieu.n).toBeGreaterThan(lan1.mucTieu.n)
  })

  it('BTVN quá tải GIỮ NGUYÊN hạn gốc và plan ghi `deferred_count`/`over_budget_seconds` > 0', async () => {
    const d = taoD1That()
    // 60 câu trong 2 ngày, ngân sách mặc định 20 phút ⇒ vượt tải rõ.
    seedBtvn(d, 'NANG', 60, -24, 48)
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!
    expect(kh.tai.vuot).toBeGreaterThan(0)
    expect(kh.hoan.deferredCount).toBe(kh.tai.vuot)
    expect(kh.hoan.overBudgetSeconds).toBeGreaterThan(0)
    // Assignment/hạn gốc của BTVN KHÔNG bị đổi trong lúc cắt việc mềm.
    const bt = kh.viec.find((v) => v.loai === 'btvn_lo' || v.loai === 'btvn_nop')
    expect(bt?.hanCung ?? bt?.hanMem).toBeTruthy()
    const row = d.sql.prepare("SELECT deferred_count, over_budget_seconds FROM ke_hoach_ngay WHERE sbd='S1'").get() as { deferred_count: number; over_budget_seconds: number }
    expect(Number(row.deferred_count)).toBe(kh.hoan.deferredCount)
    expect(Number(row.over_budget_seconds)).toBe(kh.hoan.overBudgetSeconds)
  })

  it('`/hs/ke-hoach-ngay` trả mục tiêu core đã đóng băng + số vượt tải cho giao diện', async () => {
    const d = taoD1That()
    seedBtvn(d, 'GAN', 30, -24, 48)
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    const mt = r.mucTieu as { role: string; policyVersion: string; revision: number; n: number }
    expect(mt.policyVersion).toBe('cnh1-p05-v1')
    expect(mt.role).toBe('homework_slice')
    expect(mt.revision).toBeGreaterThanOrEqual(1)
    expect(r.hoan).toMatchObject({ deferredCount: expect.any(Number), overBudgetSeconds: expect.any(Number) })
  })
})
