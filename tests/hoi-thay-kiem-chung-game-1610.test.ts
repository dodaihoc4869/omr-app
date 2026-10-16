// @vitest-environment node
// Đi qua route chấm thật với SQLite: cờ chỉ lấy từ phiên máy chủ, đồng bộ sau khi sổ đã ghi bền.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { Q, seedChua } from './_chua-cau-sai-fixture'
import { gameV2 } from '../server/src/game-v2'
import * as dongBo from '../server/src/hoi-thay-dong-bo-sua'
import { hsMoKiemHoiThay, hsNopKiemHoiThay } from '../server/src/hoi-thay-kiem-chung'

const NOW = Date.parse('2026-10-16T03:00:00Z')
let d: D1That, token: string
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW)
  d = taoD1That(); token = await seedChua(d.env)
  d.sql.prepare("UPDATE game_v2_question SET json=json_set(json,'$.hinhAnh',json('[]')) WHERE qid=?").run(Q)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('HS1', JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: new Date(NOW).toISOString(), luatCap: 5 }), 'x')
})
afterEach(() => { d.sql.close(); vi.restoreAllMocks(); vi.useRealTimers() })
function phien(co = false, goi7 = false) {
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('P1', 'HS1', JSON.stringify({ mode: 'adventure', created: NOW, hoa2: 1, ...(goi7 ? { goi7: 1 } : {}), questions: [{ qid: Q, maDe: 'DH-12-C1-B1', version: 'v1', group: 'nhom-Q', novel: false, ...(co ? { hoiThayKiem: true } : {}) }] }), new Date(NOW).toISOString())
}
const nop = (them = {}, ctx?: any) => gameV2(d.env, 'answer', { token, session: 'P1', qid: Q, answer: '40', ...them }, ctx)
it('câu thường và cờ giả ở payload không gọi projection hay phát sinh D1 của Hỏi thầy', async () => {
  phien()
  const spy = vi.spyOn(dongBo, 'dongBoSuaLoiHoiThay')
  const lenh: string[] = [], prepare = d.env.DB.prepare.bind(d.env.DB)
  vi.spyOn(d.env.DB, 'prepare').mockImplementation(sql => { lenh.push(sql); return prepare(sql) })
  expect((await nop({ hoiThayKiem: true })).ok).toBe(true)
  expect(spy).not.toHaveBeenCalled()
  expect(lenh.some(sql => /hoi_thay_kiem|hoi_thay_can_giup|chua_loi_dot/.test(sql))).toBe(false)
  const raw = JSON.parse((d.sql.prepare("SELECT raw_json FROM su_kien_hoc WHERE nguon='game' AND ma_nguon='P1'").get() as any).raw_json)
  expect(raw.ht_cau_version).toBe('v1')
})
it('ref có lịch kiểm gọi projection sau ledger, chạy trong waitUntil; lỗi phụ không làm mất receipt', async () => {
  phien(true)
  const viec: Promise<unknown>[] = []
  const spy = vi.spyOn(dongBo, 'dongBoSuaLoiHoiThay').mockImplementation(async (_env, sbd, qid, luc) => {
    expect([sbd, qid, luc]).toEqual(['HS1', Q, NOW])
    const so = d.sql.prepare("SELECT raw_json FROM su_kien_hoc WHERE nguon='game' AND ma_nguon='P1'").get() as any
    expect(JSON.parse(so.raw_json).ht_cau_version).toBe('v1')
    throw new Error('D1 phụ tạm bận')
  })
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect((await nop({}, { waitUntil(p: Promise<unknown>) { viec.push(p) } })).ok).toBe(true)
  await Promise.all(viec)
  expect(spy).toHaveBeenCalledTimes(1)
  expect(d.dem('game_v2_attempt')).toBe(1)
  expect(d.dem('su_kien_hoc', "ma_nguon='P1'")).toBe(1)
  expect(log).toHaveBeenCalledWith('[hoi-thay] chưa đồng bộ ôn chung:', 'D1 phụ tạm bận')
})
it('sổ ghi thất bại trả ok:false thì giữ receipt và hạn kiểm, không phát lại projection từ sổ cũ', async () => {
  phien(true)
  d.sql.prepare(`INSERT INTO hoi_thay_kiem(id,sbd,qid_goc,nhom_goc,version_goc,qid_kiem,version_kiem,khoa_noi_dung,snapshot_json,assistance,trang_thai,phat_luc,het_han_luc,nop_luc,den_han)
    VALUES('hen','HS1',?,'nhom-Q','v1','kiem','k1','khoa','{}','assisted','da_nop',?,?,?,?)`).run(Q, NOW - 90_000_000, NOW - 4_000_000, NOW - 89_000_000, NOW - 1000)
  d.sql.exec("CREATE TRIGGER fail_ledger BEFORE INSERT ON su_kien_hoc WHEN NEW.ma_nguon='P1' BEGIN SELECT RAISE(ABORT,'ledger fail'); END")
  const spy = vi.spyOn(dongBo, 'dongBoSuaLoiHoiThay')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  expect((await nop()).ok).toBe(true)
  expect(d.dem('game_v2_attempt')).toBe(1)
  expect(d.dem('su_kien_hoc', "ma_nguon='P1'")).toBe(0)
  expect(spy).not.toHaveBeenCalled()
  expect(d.sql.prepare("SELECT den_han FROM hoi_thay_kiem WHERE id='hen'").get()).toMatchObject({ den_han: NOW - 1000 })
})
it('đáp án Gói7 được mở sau chấm: lần vừa nộp tự làm; kiểm trong 12 giờ assisted, hôm sau độc lập', async () => {
  phien(true, true)
  const r = await nop({ answer: '24' }) as any
  expect(r).toMatchObject({ ok: true, correct: true, attempt: { assisted: false } })
  expect(d.sql.prepare("SELECT assistance FROM su_kien_hoc WHERE ma_nguon='P1'").get()).toMatchObject({ assistance: 'none' })
  expect(d.sql.prepare("SELECT luc,co_ho_so,nguon FROM loi_giai_hoi WHERE sbd='HS1' AND qid=?").get(Q)).toMatchObject({ luc: new Date(NOW + 1).toISOString(), co_ho_so: 0, nguon: 'goi7:sau_nop' })
  async function kiem(luc: number) {
    vi.setSystemTime(luc)
    const mo = await hsMoKiemHoiThay(d.env, { token, qid: Q }) as any
    expect(mo.trangThai).toBe('co_cau')
    const snap = JSON.parse((d.sql.prepare('SELECT snapshot_json FROM hoi_thay_kiem WHERE id=?').get(mo.phienId) as any).snapshot_json)
    await hsNopKiemHoiThay(d.env, { token, phienId: mo.phienId, attemptId: `thu-${luc}`, traLoi: snap.q.correct })
    return (d.sql.prepare('SELECT assistance FROM hoi_thay_kiem WHERE id=?').get(mo.phienId) as any).assistance
  }
  expect(await kiem(NOW + 3600000)).toBe('assisted')
  expect(await kiem(NOW + 26 * 3600000)).toBe('none')
})
