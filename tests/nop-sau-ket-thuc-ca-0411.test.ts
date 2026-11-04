// @vitest-environment node
// KẾT THÚC CA (thầy 04/11: «Khi bấm kết thúc ca thì nhiều hs ko chấm chuẩn bị mất câu phải bấm nhận chấm lại»).
// Gốc lỗi: `khoaCa` đổi mọi lượt `dang_lam` ⇒ `da_nop` bằng bản lưu tạm NGAY khi thầy bấm. Máy em biết ca đóng rồi nộp — tới sau vài giây ⇒ `/nop` thấy lượt đã
// đóng ⇒ cất «bài bổ sung chờ duyệt» (thầy phải bấm Nhận + chấm lại). Nay lượt do thầy kết thúc ca đóng hộ mang dấu, bài tới trong 3 phút được NHẬN THẲNG + chấm lại.
// Chạy trên SQLite THẬT (`_d1-that.ts`): `/nop`, `khoaCa`, cron chấm bù thật.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { khoaCa } from '../server/src/goi-cu'
import { cronChamBu, xoaHenChamBu, PHUT_CHO_CHAM_BU, type GhiDiemCa } from '../server/src/cham-bu'
import { GIAY_NHAN_SAU_KHOA } from '../server/src/bai-bo-sung'
import type { NganHangDapAn } from '../server/src/cham-lai-ca'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const MA = 'KT1'
const NOW = Date.parse('2026-11-04T12:30:00.000Z') // 19:30 VN
const NH: NganHangDapAn = {
  phanI: [{ id: `${MA}-I-1`, text: 'I1', choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Este', mucDo: 'biet' }],
  phanII: [{ id: `${MA}-II-1`, text: 'II1', ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Điện hoá', mucDo: 'hieu' }],
  phanIII: [{ id: `${MA}-III-1`, text: 'III1', correct: '0.54', chuyenDe: 'Este', mucDo: 'van_dung' }],
  soCau: { I: 1, II: 1, III: 1 },
}
/** Bản lưu tạm cuối máy chủ giữ lúc thầy bấm Kết thúc: em mới làm Phần I. */
const LUU_TAM = { phanI: { [`${MA}-I-1`]: 'A' }, phanII: {}, phanIII: {} }
/** Bài đầy đủ trên máy em (gửi tới sau khi ca đóng). */
const TREN_MAY = { phanI: { [`${MA}-I-1`]: 'A' }, phanII: { [`${MA}-II-1`]: ['D', 'S', 'D', 'S'] }, phanIII: { [`${MA}-III-1`]: '0,540' } }
const ghiQuaWorker: GhiDiemCa = async (env, b) => new Response(JSON.stringify(await goiWorker(worker, env, '/cham-diem', b, true)))

function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,so_cau_json,sinh_tai_d1,cap_nhat_luc) VALUES(?,?,?,?,?,?,1,?)')
    .run(MA, 'Ca kết thúc', 'mo', 'thi', 'ca_lop_xong', JSON.stringify({ I: 1, II: 1, III: 1 }), new Date(NOW - 3_600_000).toISOString())
  d.objects.set(`key/${MA}.json`, NH)
  return d
}
function themLuot(d: D1That, sbd: string, tt = 'dang_lam', dapAn: unknown = LUU_TAM) {
  d.sql.prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,cap_nhat_luc,dap_an_json) VALUES(?,?,?,?,?,?,?,?)')
    .run(`${MA}|${sbd}|1`, MA, sbd, 1, new Date(NOW - 3_000_000).toISOString(), tt, new Date(NOW - 60_000).toISOString(), JSON.stringify(dapAn))
}
const luot = (d: D1That, sbd: string) => d.sql.prepare('SELECT trang_thai,tong,dap_an_json,integrity_json FROM luot WHERE khoa=?').get(`${MA}|${sbd}|1`) as { trang_thai: string; tong: number | null; dap_an_json: string; integrity_json: string | null }
const soBoSung = (d: D1That) => { try { return (d.sql.prepare("SELECT COUNT(*) n FROM bai_bo_sung WHERE trang_thai='cho'").get() as { n: number }).n } catch { return 0 } }
const nop = (d: D1That, sbd: string, dapAn: unknown = TREN_MAY) => goiWorker(worker, d.env, '/nop', { maCa: MA, sbd, dapAn, integrity: { leaveCount: 1, totalHiddenMs: 2000 } })

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); xoaHenChamBu() })
afterEach(() => vi.useRealTimers())

it('thầy kết thúc ca rồi máy em nộp trong 3 phút ⇒ nhận thẳng (gộp với bản lưu tạm), không thành bài bổ sung, cron chấm bù chấm đủ câu', async () => {
  const d = dung(); themLuot(d, 'E1')
  expect(await khoaCa(d.env, { maCa: MA })).toMatchObject({ ok: true, soEmBiNop: 1 })
  expect(JSON.parse(luot(d, 'E1').integrity_json!)).toMatchObject({ dongBoi: 'khoa' })
  vi.setSystemTime(NOW + 25_000)
  expect(await nop(d, 'E1')).toMatchObject({ ok: true, daNhan: true })
  expect(soBoSung(d)).toBe(0)
  const l = luot(d, 'E1')
  expect(JSON.parse(l.dap_an_json)).toEqual(TREN_MAY)
  expect(JSON.parse(l.integrity_json!)).toMatchObject({ nopSauKhoa: true, leaveCount: 1 })
  expect(JSON.parse(l.integrity_json!).dongBoi).toBeUndefined() // nhận một lần: dấu đã xoá
  const r = await cronChamBu(d.env, NOW + (PHUT_CHO_CHAM_BU + 1) * 60_000, ghiQuaWorker)
  expect(r.soGhi).toBeGreaterThan(0)
  expect(luot(d, 'E1').tong).toBe(10)
})

it('đã chấm theo bản lưu tạm rồi bài máy em mới tới (trong cửa) ⇒ xoá điểm cũ, chấm lại đủ câu', async () => {
  const d = dung(); themLuot(d, 'E2')
  await khoaCa(d.env, { maCa: MA })
  const r0 = await cronChamBu(d.env, NOW + (PHUT_CHO_CHAM_BU + 1) * 60_000, ghiQuaWorker)
  expect(r0.soGhi).toBeGreaterThan(0)
  const cu = luot(d, 'E2').tong!
  expect(cu).toBeLessThan(10)
  vi.setSystemTime(NOW + (GIAY_NHAN_SAU_KHOA - 10) * 1000)
  await nop(d, 'E2')
  expect(luot(d, 'E2').tong).toBeNull()
  xoaHenChamBu()
  await cronChamBu(d.env, NOW + (GIAY_NHAN_SAU_KHOA + 200) * 1000, ghiQuaWorker)
  expect(luot(d, 'E2').tong).toBe(10)
})

it('quá 3 phút sau khi kết thúc ca ⇒ như cũ: bài bổ sung chờ thầy duyệt, bài đã chốt không đổi', async () => {
  const d = dung(); themLuot(d, 'E3')
  await khoaCa(d.env, { maCa: MA })
  vi.setSystemTime(NOW + (GIAY_NHAN_SAU_KHOA + 5) * 1000)
  expect(await nop(d, 'E3')).toMatchObject({ ok: true, daNhan: true, boSung: 2 })
  expect(soBoSung(d)).toBe(1)
  expect(JSON.parse(luot(d, 'E3').dap_an_json)).toEqual(LUU_TAM)
})

it('em đã TỰ nộp (không phải thầy đóng hộ) rồi gửi bài khác ⇒ bài bổ sung, không ghi đè', async () => {
  const d = dung(); themLuot(d, 'E4')
  expect(await nop(d, 'E4', LUU_TAM)).toMatchObject({ ok: true })
  await khoaCa(d.env, { maCa: MA })
  vi.setSystemTime(NOW + 20_000)
  expect(await nop(d, 'E4')).toMatchObject({ ok: true, daNhan: true, boSung: 2 })
  expect(JSON.parse(luot(d, 'E4').dap_an_json)).toEqual(LUU_TAM)
})

it('nhận sau kết thúc ca chỉ một lần: gửi lại lần hai khác bài ⇒ bài bổ sung', async () => {
  const d = dung(); themLuot(d, 'E5')
  await khoaCa(d.env, { maCa: MA })
  vi.setSystemTime(NOW + 10_000)
  await nop(d, 'E5')
  vi.setSystemTime(NOW + 20_000)
  const lai = { ...TREN_MAY, phanI: { [`${MA}-I-1`]: 'B' } }
  expect(await nop(d, 'E5', lai)).toMatchObject({ ok: true, daNhan: true, boSung: 1 })
  expect(JSON.parse(luot(d, 'E5').dap_an_json)).toEqual(TREN_MAY)
})
