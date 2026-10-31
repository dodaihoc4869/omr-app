// @vitest-environment node
// ĐỆM β CÂU THEO QID (31/10, thử tải 2000 em: `omni_beta_cau` đứng đầu thời gian D1): β chung cho mọi em ⇒ nhớ trong isolate 10 phút, kể cả câu CHƯA có β.
// Kết quả y hệt đường không đệm (β riêng, β + τ một lệnh UNION); lần sau chỉ đọc D1 cho câu mới; đủ β trong đệm ⇒ β + τ chỉ còn đọc τ; hết hạn ⇒ đọc lại.
import { afterEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { batDemBeta } from '../server/src/beta-dem'
import { docBetaCau, docBetaVaTau } from '../server/src/omni-d1'
import type { Env } from '../server/src/kieu'

afterEach(() => { batDemBeta(false) })

function dung() {
  const d = taoD1That()
  d.sql.exec(`CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS omni_em (sbd TEXT PRIMARY KEY, tau REAL, n_tau INTEGER NOT NULL DEFAULT 0)`)
  const b = d.sql.prepare("INSERT INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES (?, ?, 12, 'x')")
  for (let i = 1; i <= 6; i++) b.run(`Q${i}`, Math.log(10_000 * i))
  d.sql.prepare("INSERT INTO omni_em (sbd, s_uoc, tau, n_tau, phien_ban, cap_nhat_luc) VALUES (?, 0, ?, ?, 'v', 'x')").run('S1', 0.25, 9)
  const sql: string[] = []
  const goc = d.env.DB as unknown as { prepare(q: string): unknown }
  const DB = new Proxy(goc, { get: (t, k, r) => (k === 'prepare' ? (q: string) => { if (/omni_beta_cau|omni_em/.test(q)) sql.push(q); return t.prepare(q) } : Reflect.get(t, k, r)) })
  return { env: { ...d.env, DB } as unknown as Env, sql }
}
const gon = (m: Map<string, number>) => [...m].sort(([a], [b]) => a.localeCompare(b))

describe('đệm β câu theo qid', () => {
  it('β riêng: kết quả y hệt không đệm; lần sau không đọc D1; chỉ câu mới (kể cả câu không có β) mới đọc', async () => {
    const { env, sql } = dung()
    const qs = ['Q1', 'Q2', 'Q3', 'KHONG-B']
    const thang = gon(await docBetaCau(env, qs))
    expect(thang.length).toBe(3)
    batDemBeta(true)
    expect(gon(await docBetaCau(env, qs))).toEqual(thang)
    const n = sql.length
    expect(gon(await docBetaCau(env, [...qs].reverse()))).toEqual(thang)
    expect(sql.length).toBe(n) // đủ trong đệm (kể cả câu không có β)
    const qs2 = ['Q2', 'KHONG-B', 'Q4', 'Q5']
    const c = gon(await docBetaCau(env, qs2))
    expect(sql.length).toBe(n + 1) // chỉ Q4, Q5
    batDemBeta(false)
    expect(c).toEqual(gon(await docBetaCau(env, qs2)))
  })

  it('β + τ: y hệt lệnh UNION cũ; đủ β trong đệm ⇒ chỉ đọc τ (không chạm omni_beta_cau)', async () => {
    const { env, sql } = dung()
    const qs = ['Q1', 'Q6', 'KHONG-B']
    const [b0, t0] = await docBetaVaTau(env, qs, ['S1', 'S2'])
    expect(gon(t0)).toEqual([['S1', 0.25]])
    batDemBeta(true)
    const [b1, t1] = await docBetaVaTau(env, qs, ['S1', 'S2'])
    expect([gon(b1), gon(t1)]).toEqual([gon(b0), gon(t0)])
    const n = sql.length
    const [b2, t2] = await docBetaVaTau(env, qs, ['S1', 'S2'])
    expect([gon(b2), gon(t2)]).toEqual([gon(b0), gon(t0)])
    expect(sql.slice(n).length).toBe(1)
    expect(sql.slice(n).some((q) => /omni_beta_cau/.test(q))).toBe(false)
    // còn câu chưa nhớ ⇒ một lệnh UNION chỉ cho câu ấy
    const [b3] = await docBetaVaTau(env, ['Q1', 'Q3'], ['S1'])
    expect(sql.length).toBe(n + 2)
    expect(gon(b3)).toEqual([['Q1', Math.log(10_000)], ['Q3', Math.log(30_000)]])
  })

  it('hết hạn 10 phút ⇒ đọc lại D1 (thấy β cron vừa tính lại)', async () => {
    const { env, sql } = dung()
    batDemBeta(true)
    await docBetaCau(env, ['Q1', 'KHONG-B'])
    const goc = Date.now, t = goc()
    try {
      Date.now = () => t + 5 * 60_000
      const n = sql.length
      await docBetaCau(env, ['Q1', 'KHONG-B'])
      expect(sql.length).toBe(n)
      Date.now = () => t + 10 * 60_000 + 1
      await docBetaCau(env, ['Q1', 'KHONG-B'])
      expect(sql.length).toBe(n + 1)
    } finally { Date.now = goc }
  })
})
