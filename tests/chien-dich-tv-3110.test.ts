// @vitest-environment node
// BẢNG TRA «EM THUỘC CHIẾN DỊCH NÀO» (31/10, chien-dich-tv.ts): đường của MỘT em đọc danh sách nhẹ (không sbd_json) + bảng tra theo sbd. Kết quả PHẢI y hệt đường cũ
// (đọc cả dòng) ở mọi trường hợp: JSON có dấu cách, mảng lẫn kiểu, JSON hỏng, không phải mảng, chiến dịch huỷ (trong / ngoài phạm vi), hành trình lưu trữ,
// trùng giờ tạo; danh sách em đổi / chiến dịch mới ⇒ thiếu dấu ⇒ đường cũ cho tới khi lập lại; dấu đổi khi đệm thành viên còn hạn ⇒ đọc lại.
import { afterEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { lapChiMucTv } from '../server/src/chien-dich-tv'
import { docChienDichKemDaHuyCuaEm, docChienDichThoCuaEm, xoaDemChienDich } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-31T07:00:00Z')
afterEach(() => { xoaDemChienDich() })

function dung() {
  const d = taoD1That()
  const them = d.sql.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, dong_luc, trang_thai)
    VALUES (?,?,?,?,?,?,?,40,1,NULL,?,?,?)`)
  const khoi = JSON.stringify([...Array.from({ length: 300 }, (_, i) => `E${i + 1}`), 'S"X'])
  them.run('hanh-trinh-v3-khoi-12', 'Khối 12', 'Khối 12', khoi, '["DH-B8"]', '["q1","q2"]', '9999-12-31', '2026-10-01T00:00:00Z', null, 'dang_chay')
  them.run('cd-a', 'A', '12A1', '[ "E5" , "E7" ]', '["DH-B9"]', '["q3"]', '2026-12-01', '2026-10-05T00:00:00Z', null, 'dang_chay')
  them.run('cd-b', 'B', '12A2', '["E5", 7, null, ["E9"], "E9", "E9"]', '[]', '["q4"]', '2026-12-01', '2026-10-05T00:00:00Z', null, 'da_dong')
  them.run('cd-c', 'C', '12A1', '["E1","E2"]', '[]', '["q5","q6"]', '2026-11-01', '2026-10-02T00:00:00Z', '2026-10-10T00:00:00Z', 'da_huy')
  them.run('cd-d', 'D', '12A1', '["E1"]', '[]', '["q7"]', '2026-11-01', '2026-09-01T00:00:00Z', '2026-09-20T00:00:00Z', 'da_huy')
  them.run('hanh-trinh-gioi-hoa-khoi-12', 'Lưu trữ', 'Khối 12', '["E1","E4"]', '[]', '["q8"]', '9999-12-31', '2026-09-30T00:00:00Z', '2026-10-08T00:00:00Z', 'da_huy')
  them.run('cd-e', 'E hỏng', '12A3', '["E1",', '[]', '[]', '2026-12-01', '2026-10-06T00:00:00Z', null, 'dang_chay')
  them.run('cd-f', 'F đối tượng', '12A3', '{"a":"E1"}', '[]', '[]', '2026-12-01', '2026-10-06T00:00:00Z', null, 'dang_chay')
  them.run('cd-g', 'G trùng giờ', '12A3', '["E1","E2","E3"]', '[]', '["q9"]', '2026-12-01', '2026-10-06T00:00:00Z', null, 'dang_chay')
  const sql: string[] = []
  const goc = d.env.DB as unknown as { prepare(q: string): unknown; batch(x: unknown[]): unknown }
  const DB = new Proxy(goc, { get: (t, k, r) => (k === 'prepare' ? (q: string) => { if (/chien_dich/.test(q)) sql.push(q); return t.prepare(q) } : Reflect.get(t, k, r)) })
  const env = { ...d.env, DB } as unknown as Env
  return { d, env, envCu: { ...env, TAT_CHIEN_DICH_TV: '1' } as Env, sql }
}
const SBD = ['E1', 'E2', 'E3', 'E4', 'E5', 'E7', 'E9', 'E299', 'E300', 'S"X', 'KHONG']
/** Kết quả của em, bỏ phần đường mới không còn mang (danh sách em của chiến dịch). */
async function chup(env: Env, sbd: string) {
  const a = await docChienDichKemDaHuyCuaEm(env, sbd)
  const tho = await docChienDichThoCuaEm(env, sbd)
  return {
    ds: a.ds.map(({ sbd: _s, ...x }) => x),
    daHuy: a.daHuy.map((x) => ({ ...x, qids: [...x.qids].sort() })),
    tho: tho.map(({ sbd_json: _j, ...x }) => x),
  }
}
async function cu(x: ReturnType<typeof dung>) {
  const ra: Record<string, unknown> = {}
  for (const s of SBD) { xoaDemChienDich(); ra[s] = await chup(x.envCu, s) }
  return ra
}

describe('bảng tra thành viên chiến dịch', () => {
  it('kết quả y hệt đường cũ cho mọi em; đường mới không đọc sbd_json; isolate lạnh không thêm lệnh', async () => {
    const x = dung()
    const truoc = await cu(x)
    // chưa có bảng tra ⇒ đường cũ, vẫn đúng
    xoaDemChienDich()
    expect(await chup(x.env, 'E1')).toEqual(truoc['E1'])
    const r = await lapChiMucTv(x.env, NOW)
    expect(r).toEqual({ lap: 8, loi: 0 }) // mọi chiến dịch trong phạm vi (trừ cd-d huỷ trước mốc)
    xoaDemChienDich()
    // isolate lạnh: số lệnh đường mới ≤ đường cũ
    let n = x.sql.length
    await docChienDichKemDaHuyCuaEm(x.envCu, 'E1')
    const lenhCu = x.sql.length - n
    xoaDemChienDich()
    n = x.sql.length
    await docChienDichKemDaHuyCuaEm(x.env, 'E1')
    const moi = x.sql.slice(n)
    expect(moi.length).toBeLessThanOrEqual(lenhCu)
    expect(moi.some((q) => /SELECT \*/.test(q))).toBe(false)
    // chiến dịch đã lập chỉ mục không mang danh sách em về
    expect((await docChienDichThoCuaEm(x.env, 'E1')).every((r) => r.sbd_json == null)).toBe(true)
    for (const s of SBD) expect(await chup(x.env, s), s).toEqual(truoc[s])
    // isolate ấm: em mới chỉ một lệnh tra thành viên; em cũ không lệnh nào
    n = x.sql.length
    await docChienDichKemDaHuyCuaEm(x.env, 'E200')
    expect(x.sql.length - n).toBe(1)
    n = x.sql.length
    await docChienDichKemDaHuyCuaEm(x.env, 'E200')
    expect(x.sql.length - n).toBe(0)
  })

  it('danh sách em đổi / chiến dịch mới ⇒ thiếu dấu ⇒ đường cũ (đúng ngay), lập lại ⇒ đường mới, vẫn y hệt', async () => {
    const x = dung()
    await lapChiMucTv(x.env, NOW)
    x.d.sql.prepare("UPDATE chien_dich SET sbd_json = ? WHERE id = 'cd-g'").run('["E2","E3","E301"]')
    x.d.sql.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai)
      VALUES ('cd-h','H','12A4','["E1","E301"]','[]','["q10"]','2026-12-01',40,1,NULL,'2026-10-20T00:00:00Z','dang_chay')`).run()
    const dau = x.d.sql.prepare('SELECT chien_dich_id FROM chien_dich_tv_dau ORDER BY 1').all().map((r) => (r as { chien_dich_id: string }).chien_dich_id)
    expect(dau).not.toContain('cd-g')
    expect(dau).not.toContain('cd-h')
    SBD.push('E301')
    try {
      const truoc = await cu(x)
      xoaDemChienDich()
      for (const s of SBD) expect(await chup(x.env, s), s).toEqual(truoc[s])
      expect(await lapChiMucTv(x.env, NOW + 60_000)).toEqual({ lap: 2, loi: 0 })
      xoaDemChienDich()
      for (const s of SBD) expect(await chup(x.env, s), s).toEqual(truoc[s])
      expect(x.d.sql.prepare("SELECT COUNT(*) AS n FROM chien_dich_tv WHERE chien_dich_id = 'cd-g'").get()).toEqual({ n: 3 })
      // đổi trạng thái (không đổi danh sách em) ⇒ dấu giữ nguyên
      x.d.sql.prepare("UPDATE chien_dich SET trang_thai = 'da_dong' WHERE id = 'cd-h'").run()
      expect(x.d.sql.prepare("SELECT COUNT(*) AS n FROM chien_dich_tv_dau WHERE chien_dich_id = 'cd-h'").get()).toEqual({ n: 1 })
    } finally { SBD.pop() }
  })

  it('đệm thành viên còn hạn mà dấu đổi (danh sách hết hạn 60 s) ⇒ đọc lại thành viên, không dùng bản cũ', async () => {
    const x = dung()
    await lapChiMucTv(x.env, NOW)
    xoaDemChienDich()
    const goc = Date.now
    const t = goc()
    try {
      Date.now = () => t
      expect((await chup(x.env, 'E3')).ds.map((c) => c.id)).toContain('cd-g')
      x.d.sql.prepare("UPDATE chien_dich SET sbd_json = '[\"E1\"]' WHERE id = 'cd-g'").run()
      await lapChiMucTv(x.env, NOW + 120_000)
      Date.now = () => t + 61_000 // danh sách hết hạn, đệm thành viên (30 phút) còn
      await chup(x.env, 'E1') // em khác đọc lại danh sách (dấu mới)
      const n = x.sql.length
      const sau = await chup(x.env, 'E3')
      expect(sau.ds.map((c) => c.id)).not.toContain('cd-g')
      expect(x.sql.slice(n).some((q) => /FROM chien_dich_tv WHERE sbd/.test(q))).toBe(true)
      xoaDemChienDich()
      expect(sau).toEqual(await chup(x.envCu, 'E3'))
    } finally { Date.now = goc }
  })
})
