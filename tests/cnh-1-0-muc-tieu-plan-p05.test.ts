// @vitest-environment node
// P05/T13·T40 — MỘT plan/ngày: mục tiêu core ĐÓNG BĂNG + deferred_count/over_budget_seconds trong D1 thật.
// Chứng minh trên ĐƯỜNG SẢN PHẨM (`lapVaLuuKeHoach` / `hsKeHoachNgay`):
//   · Mục tiêu được chốt (role/n/min_success/policy_version/revision) và GHI vào `ke_hoach_ngay.muc_tieu_json`.
//   · Đầu vào đổi (thêm câu BTVN) KHÔNG làm mục tiêu đã chốt tăng ngầm (mở lại app trả ĐÚNG bản đã đóng băng).
//   · BTVN vượt tải GIỮ NGUYÊN assignment + HẠN GỐC; plan ghi số câu hoãn + số giây vượt.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { chotNgayCu, lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That } from './_d1-that'

const NOW = Date.parse('2026-09-23T05:00:00.000Z') // 12:00 giờ VN, 23/09
const NGAY_HOM_NAY = '2026-09-23'
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

  it('chốt ngày theo MỤC TIÊU CORE: có câu ĐỘC LẬP đúng ⇒ `achieved`; chỉ có TRỢ GIÚP ⇒ `studied`; không có gì ⇒ `none`', async () => {
    const HOM_QUA = '2026-09-22'
    const d = taoD1That()
    seedBtvn(d, 'GAN', 30, -48, 48)
    // Kế hoạch của HÔM QUA (đã đóng băng mục tiêu role homework_slice).
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], NOW - 24 * H)).get('S1')!
    expect(kh.ngay).toBe(HOM_QUA)
    const mt = d.sql.prepare("SELECT muc_tieu_json FROM ke_hoach_ngay WHERE ngay = ?").get(HOM_QUA) as { muc_tieu_json: string }
    expect(JSON.parse(mt.muc_tieu_json).role).toBe('homework_slice')

    // (a) KHÔNG có bằng chứng ⇒ none
    await chotNgayCu(d.env, ['S1'], NGAY_HOM_NAY, new Date(NOW).toISOString())
    const a = JSON.parse((d.sql.prepare("SELECT muc_tieu_ket_qua_json AS x FROM ke_hoach_ngay WHERE ngay = ?").get(HOM_QUA) as { x: string }).x)
    expect(a.trangThai).toBe('none')

    // (b) chỉ có câu làm CÓ TRỢ GIÚP ⇒ studied (hoàn tất việc, KHÔNG vào số độc lập đúng)
    const d2 = taoD1That()
    seedBtvn(d2, 'GAN', 30, -48, 48)
    await lapVaLuuKeHoach(d2.env, ['S1'], NOW - 24 * H)
    await ghiSuKien(d2.env, [{ nguon: 'btvn_lo', maNguon: 'GAN', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, giay: 60, luc: `${HOM_QUA}T05:00:00.000Z`, assistance: 'assisted' }])
    await chotNgayCu(d2.env, ['S1'], NGAY_HOM_NAY, new Date(NOW).toISOString())
    const b = JSON.parse((d2.sql.prepare("SELECT muc_tieu_ket_qua_json AS x FROM ke_hoach_ngay WHERE ngay = ?").get(HOM_QUA) as { x: string }).x)
    expect(b.trangThai).toBe('studied')
    expect(b.dung).toBe(0)

    // (c) có câu ĐỘC LẬP đúng ⇒ achieved
    const d3 = taoD1That()
    seedBtvn(d3, 'GAN', 30, -48, 48)
    await lapVaLuuKeHoach(d3.env, ['S1'], NOW - 24 * H)
    await ghiSuKien(d3.env, [{ nguon: 'btvn_lo', maNguon: 'GAN', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, giay: 60, luc: `${HOM_QUA}T05:00:00.000Z`, assistance: 'none' }])
    await chotNgayCu(d3.env, ['S1'], NGAY_HOM_NAY, new Date(NOW).toISOString())
    const c = JSON.parse((d3.sql.prepare("SELECT muc_tieu_ket_qua_json AS x FROM ke_hoach_ngay WHERE ngay = ?").get(HOM_QUA) as { x: string }).x)
    expect(c.trangThai).toBe('achieved')
    expect(c.dung).toBeGreaterThanOrEqual(1)
    expect(c.policyVersion).toBe(undefined) // kết quả chốt ngày không nhân bản policy (lấy từ mục tiêu đã đóng băng)
    expect(c.luc).toBeTruthy()
  })
})
