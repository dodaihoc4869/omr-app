// @vitest-environment node
// ĐỌC QUA BẢN SAO TRONG NGĂN (31/10, công tắc BAT_BAN_SAO_NGAN): mỗi lệnh mở phiên D1 từ DẤU TRANG của em (lệnh trước của em ghi gì thì phiên sau thấy), dấu trang
// lưu SQLite của ngăn (ngăn ngủ dậy vẫn dùng đúng dấu); tắt công tắc ⇒ không mở phiên. Kết quả lệnh y hệt đường không phiên.
import { createRequire } from 'node:module'
import { beforeEach, describe, expect, it } from 'vitest'
import { NganHocSinh, DAU_TRONG_NGAN, DAU_SBD_NGAN, xoaEnvChungNgan } from '../server/src/ngan-hoc-sinh'
import '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaMoiDem } from '../server/src/dem-chung'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env, SqlNgan } from '../server/src/kieu'

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')
const sqlGia = (): SqlNgan => {
  const db = new DatabaseSync(':memory:')
  return { exec: (q, ...b) => { const st = db.prepare(q); const r = /^\s*(SELECT|WITH)\b/i.test(q) ? st.all(...(b as never[])) : (st.run(...(b as never[])), []); return { toArray: () => r as Record<string, unknown>[] } } }
}

beforeEach(() => { xoaMoiDem(); xoaEnvChungNgan() })

function kho(bat: boolean) {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='mk'`)
  const moPhien: string[] = []
  let dem = 0
  const goc = k.env.DB as unknown as Record<string, unknown>
  // D1 giả có phiên: mỗi phiên là chính D1 giả + dấu trang tăng dần sau mỗi lệnh chạy qua phiên.
  goc.withSession = (bm?: string) => {
    moPhien.push(String(bm))
    let cuoi = bm && bm !== 'first-unconstrained' ? bm : 'b0'
    const tang = <T,>(p: Promise<T>) => p.then((v) => { cuoi = `b${++dem}`; return v })
    const prep = (goc.prepare as (q: string) => Record<string, (...a: unknown[]) => unknown>).bind(goc)
    const boc = (st: Record<string, (...a: unknown[]) => unknown>): Record<string, unknown> => ({ __st: st, bind: (...a: unknown[]) => boc(st.bind!(...a) as never), first: (...a: unknown[]) => tang(st.first!(...a) as Promise<unknown>), all: () => tang(st.all!() as Promise<unknown>), run: () => tang(st.run!() as Promise<unknown>) })
    return {
      prepare: (q: string) => boc(prep(q)),
      batch: (ds: { __st?: unknown }[]) => tang((goc.batch as (d: unknown[]) => Promise<unknown>)(ds.map((x) => x.__st ?? x))),
      getBookmark: () => cuoi,
    }
  }
  const env = { ...k.env, ...(bat ? { BAT_BAN_SAO_NGAN: '1' } : {}) } as Env
  const sql = sqlGia()
  const nen: Promise<unknown>[] = []
  const state = { waitUntil: (p: Promise<unknown>) => { nen.push(p) }, storage: { sql } } as never
  const goi = async (ngan: NganHocSinh, lenh: string, than: Record<string, unknown>) => {
    const res = await ngan.fetch(new Request(`https://t/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json', [DAU_TRONG_NGAN]: '1', [DAU_SBD_NGAN]: 'S1' }, body: JSON.stringify(than) }))
    return { ...(await res.json() as Record<string, unknown>), serverNow: 0 }
  }
  return { k, env, state, sql, moPhien, goi }
}

describe('đọc qua bản sao trong ngăn', () => {
  it('lệnh đầu mở phiên first-unconstrained; lệnh sau mở từ dấu trang của lệnh trước; ngăn mới (ngủ dậy) đọc dấu trang đã lưu', async () => {
    const x = kho(true)
    const token = await gameToken(x.k.env, 'S1')
    const ngan = new NganHocSinh(x.state, x.env)
    const a = await x.goi(ngan, 'hoc-tap-dem', { token })
    expect(a.ok).toBe(true)
    expect(x.moPhien).toContain('first-unconstrained')
    const n = x.moPhien.length
    await x.goi(ngan, 'hoc-tap-dem', { token })
    expect(x.moPhien.slice(n).some((b) => /^b\d+$/.test(b))).toBe(true) // lệnh sau mở từ dấu trang
    const luu = String(x.sql.exec('SELECT bm FROM phien_d1 WHERE id = 1').toArray()[0]?.bm)
    expect(luu).toMatch(/^b\d+$/)
    xoaEnvChungNgan()
    const ngan2 = new NganHocSinh(x.state, x.env) // ngăn ngủ dậy: chỉ còn SQLite
    const m = x.moPhien.length
    await x.goi(ngan2, 'hoc-tap-dem', { token })
    expect(x.moPhien.slice(m)).toContain(luu)
  })

  it('công tắc tắt ⇒ không mở phiên; kết quả có phiên y hệt không phiên', async () => {
    const tat = kho(false)
    const token = await gameToken(tat.k.env, 'S1')
    const nganTat = new NganHocSinh(tat.state, tat.env)
    await tat.goi(nganTat, 'hoc-tap-dem', { token })
    await tat.goi(nganTat, 'hoc-tap-dem', { token })
    // ngăn không mở phiên từ dấu trang (index.ts vẫn có thể mở phiên 'first-unconstrained' cho lệnh chỉ đọc — đường cũ từ 22/09)
    expect(tat.moPhien.filter((b) => b !== 'first-unconstrained')).toEqual([])
    const a = await tat.goi(nganTat, 'hoc-tap-sanh', { token })
    expect(() => tat.sql.exec('SELECT bm FROM phien_d1').toArray()).toThrow() // không có bảng dấu trang
    xoaMoiDem(); xoaEnvChungNgan()
    const bat = kho(true)
    const b = await bat.goi(new NganHocSinh(bat.state, bat.env), 'hoc-tap-sanh', { token: await gameToken(bat.k.env, 'S1') })
    expect(bat.moPhien.length).toBeGreaterThan(0)
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })
})
