// @vitest-environment node
// GOM LỆNH D1 (31/10, thử tải 2000 em: «D1 DB is overloaded. Too many requests for the same object within a 10 second window»): lệnh rời trong cùng lượt
// ⇒ một batch (một yêu cầu). Kết quả / lỗi của từng câu y hệt chạy riêng; lệnh học sinh qua ngăn có gom trả đúng như đường thẳng, số yêu cầu D1 giảm mạnh.
import { describe, expect, it, vi } from 'vitest'
import worker, { NganHocSinh } from '../server/src/index'
import { gomD1 } from '../server/src/gom-d1'
import { dbGoc } from '../server/src/cau-hinh-dem'
import { xoaEnvChungNgan, DAU_TRONG_NGAN, DAU_SBD_NGAN } from '../server/src/ngan-hoc-sinh'
import { xoaMoiDem } from '../server/src/dem-chung'
import { gameToken } from '../server/src/game-v2-auth'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG } from '../server/src/san-sang'
import { damBaoBangBaiDaDay } from '../server/src/bai-da-day'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import type { D1Database, Env } from '../server/src/kieu'

/** Đếm yêu cầu D1 thật: mỗi first/all/run rời = 1, mỗi batch = 1. */
function demYeuCau(db: D1Database) {
  const d = { n: 0 }
  const g = db as unknown as { prepare(q: string): Record<string, (...a: unknown[]) => unknown>; batch(ds: unknown[]): Promise<unknown> }
  const prep = g.prepare.bind(g), bat = g.batch.bind(g)
  const boc = (st: Record<string, (...a: unknown[]) => unknown>): Record<string, unknown> => ({
    __st: st,
    bind: (...a: unknown[]) => boc(st.bind!(...a) as never),
    first: (...a: unknown[]) => { d.n++; return st.first!(...a) },
    all: () => { d.n++; return st.all!() },
    run: () => { d.n++; return st.run!() },
  })
  const moi = {
    prepare: (q: string) => boc(prep(q)),
    batch: (ds: { __st?: unknown }[]) => { d.n++; return bat(ds.map((x) => x.__st ?? x)) },
  } as unknown as D1Database
  return { db: moi, d }
}

/** Kho như học sinh thật (lớp 12 · Bài 8 vừa tick · gói bài 7 bật · một đợt hành trình) — cùng cách tests/niem-phong-2910.test.ts. */
async function khoThat() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q)
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, Date.now())
  return k
}

describe('gom lệnh D1', () => {
  it('đọc song song trong một lượt ⇒ một batch; first / first(cột) / all / run đúng như chạy riêng', async () => {
    const k = taoKhoOmni({}, 3)
    const { db, d } = demYeuCau(k.env.DB)
    const g = gomD1(db)
    const [a, b, c, e] = await Promise.all([
      g.prepare('SELECT sbd FROM hoc_sinh ORDER BY sbd').all<{ sbd: string }>(),
      g.prepare('SELECT sbd, ho_ten FROM hoc_sinh WHERE sbd = ?').bind('S2').first<{ sbd: string }>(),
      g.prepare('SELECT ho_ten FROM hoc_sinh WHERE sbd = ?').bind('S3').first<string>('ho_ten'),
      g.prepare('SELECT sbd FROM hoc_sinh WHERE sbd = ?').bind('KHONG').first(),
    ])
    expect(d.n).toBe(1)
    expect(a.results.map((x) => x.sbd)).toEqual(['S1', 'S2', 'S3'])
    expect(b?.sbd).toBe('S2')
    expect(c).toBe((k.d.sql.prepare("SELECT ho_ten FROM hoc_sinh WHERE sbd='S3'").get() as { ho_ten: string }).ho_ten)
    expect(e).toBeNull()
    // ghi + đọc cùng lượt: ghi đúng một lần
    await Promise.all([g.prepare("UPDATE hoc_sinh SET ho_ten = 'X' WHERE sbd = ?").bind('S1').run(), g.prepare('SELECT 1 AS x').first()])
    expect((k.d.sql.prepare("SELECT ho_ten FROM hoc_sinh WHERE sbd='S1'").get() as { ho_ten: string }).ho_ten).toBe('X')
    // cùng câu đã chuẩn bị, gắn hai giá trị khác nhau trong cùng lượt ⇒ mỗi lệnh đúng giá trị của nó
    const st = g.prepare('SELECT sbd FROM hoc_sinh WHERE sbd = ?')
    const [x1, x2] = await Promise.all([st.bind('S1').first<{ sbd: string }>(), st.bind('S2').first<{ sbd: string }>()])
    expect([x1?.sbd, x2?.sbd]).toEqual(['S1', 'S2'])
    expect(dbGoc(g as unknown as object)).toBe(dbGoc(db as unknown as object))
  })

  it('một câu lỗi trong lô ⇒ các câu khác vẫn đúng, câu lỗi báo đúng lỗi của nó; về sau câu ấy chạy riêng', async () => {
    const k = taoKhoOmni({}, 3)
    const { db, d } = demYeuCau(k.env.DB)
    const g = gomD1(db)
    const goi = () => Promise.allSettled([
      g.prepare('SELECT sbd FROM hoc_sinh WHERE sbd = ?').bind('S1').first<{ sbd: string }>(),
      g.prepare('SELECT x FROM bang_khong_co').all(),
      g.prepare("UPDATE hoc_sinh SET ho_ten = ho_ten || '+' WHERE sbd = 'S2'").run(),
    ])
    const r = await goi()
    expect(r[0]).toMatchObject({ status: 'fulfilled', value: { sbd: 'S1' } })
    expect(r[1]).toMatchObject({ status: 'rejected' })
    expect(String((r[1] as PromiseRejectedResult).reason)).toMatch(/no such table/)
    expect(r[2]).toMatchObject({ status: 'fulfilled' })
    expect((k.d.sql.prepare("SELECT ho_ten FROM hoc_sinh WHERE sbd='S2'").get() as { ho_ten: string }).ho_ten.endsWith('+')).toBe(true)
    expect((k.d.sql.prepare("SELECT ho_ten FROM hoc_sinh WHERE sbd='S2'").get() as { ho_ten: string }).ho_ten.endsWith('++')).toBe(false) // ghi đúng một lần
    const n0 = d.n
    const r2 = await goi()
    expect(r2.map((x) => x.status)).toEqual(['fulfilled', 'rejected', 'fulfilled'])
    expect(d.n - n0).toBe(2) // lô (2 câu lành) + câu lỗi chạy riêng — không chạy lại cả lô
  })

  it('D1 quá tải ⇒ chờ rồi gửi lại cả lô (tối đa 3 lần), không tách lẻ; quá 3 lần ⇒ báo đúng lỗi quá tải', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    try {
      const k = taoKhoOmni({}, 3)
      const { db, d } = demYeuCau(k.env.DB)
      let hong = 2
      const goc = db.batch.bind(db)
      db.batch = ((ds: never[]) => (hong-- > 0 ? (d.n++, Promise.reject(new Error('D1_ERROR: D1 DB is overloaded. Too many requests for the same object within a 10 second window'))) : goc(ds))) as typeof db.batch
      const g = gomD1(db)
      const p = Promise.all([g.prepare('SELECT 1 AS a').first<{ a: number }>(), g.prepare('SELECT 2 AS b').first<{ b: number }>()])
      await vi.advanceTimersByTimeAsync(10_000)
      const [a, b] = await p
      expect([a?.a, b?.b]).toEqual([1, 2])
      expect(d.n).toBe(3) // 2 lô hỏng + 1 lô được — không chạy lẻ từng câu
      hong = 99
      const q = Promise.allSettled([g.prepare('SELECT 1 AS a').first(), g.prepare('SELECT 2 AS b').first()])
      await vi.advanceTimersByTimeAsync(20_000)
      const r = await q
      expect(r.map((x) => x.status)).toEqual(['rejected', 'rejected'])
      expect(String((r[0] as PromiseRejectedResult).reason)).toMatch(/overloaded/)
    } finally { vi.useRealTimers() }
  })

  it('batch tường minh giữ nguyên khối, đi chung lô với câu rời cùng lượt', async () => {
    const k = taoKhoOmni({}, 3)
    const { db, d } = demYeuCau(k.env.DB)
    const g = gomD1(db)
    const [kq, mot, kq2] = await Promise.all([
      g.batch([g.prepare('SELECT 1 AS a'), g.prepare('SELECT ? AS b').bind(2)]),
      g.prepare('SELECT ? AS c').bind(3).first<{ c: number }>(),
      g.batch([g.prepare('SELECT ? AS e').bind(5)]),
    ])
    expect(d.n).toBe(1)
    expect(kq.length).toBe(2)
    expect((kq[1] as { results: { b: number }[] }).results[0]!.b).toBe(2)
    expect(mot?.c).toBe(3)
    expect((kq2[0] as { results: { e: number }[] }).results[0]!.e).toBe(5)
    // batch lỗi ⇒ cả khối lỗi như cũ, việc khác cùng lượt vẫn đúng
    const r = await Promise.allSettled([g.batch([g.prepare("UPDATE hoc_sinh SET ho_ten='Y' WHERE sbd='S1'"), g.prepare('SELECT * FROM bang_khong_co')]), g.prepare('SELECT 7 AS z').first<{ z: number }>()])
    expect(r[0].status).toBe('rejected')
    expect(r[1]).toMatchObject({ status: 'fulfilled', value: { z: 7 } })
    expect((k.d.sql.prepare("SELECT ho_ten FROM hoc_sinh WHERE sbd='S1'").get() as { ho_ten: string }).ho_ten).not.toBe('Y') // khối lỗi không ghi gì
  })

  it('lệnh học sinh qua ngăn có gom: kết quả y hệt đường thẳng, số yêu cầu D1 ít hơn', async () => {
    const chay = async (gom: boolean) => {
      xoaMoiDem(); xoaEnvChungNgan()
      const k = await khoThat()
      const { db, d } = demYeuCau(k.env.DB)
      const env = { ...k.env, DB: db, ...(gom ? {} : { TAT_GOM_D1: '1' }) } as Env
      const token = await gameToken(env, 'S1')
      const nen: Promise<unknown>[] = []
      const st = { waitUntil: (p: Promise<unknown>) => { nen.push(p) } } as never
      const kq: unknown[] = []
      for (const lenh of ['hoc-tap-sanh', 'hoc-tap-dem', 'hoc-tap-sanh']) {
        const res = await new NganHocSinh(st, env).fetch(new Request(`https://t/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json', [DAU_TRONG_NGAN]: '1', [DAU_SBD_NGAN]: 'S1' }, body: JSON.stringify({ token }) }))
        const j = await res.json() as Record<string, unknown>
        expect(j.ok, `${lenh}: ${JSON.stringify(j).slice(0, 160)}`).toBe(true)
        kq.push({ ...j, serverNow: 0 })
        for (let i = 0; i < nen.length; i++) await nen[i]!.catch(() => null)
      }
      xoaEnvChungNgan()
      return { kq, n: d.n }
    }
    const thang = await chay(false)
    const gom = await chay(true)
    expect(JSON.stringify(gom.kq)).toBe(JSON.stringify(thang.kq))
    console.log(`yêu cầu D1: không gom ${thang.n} · có gom ${gom.n}`)
    expect(gom.n).toBeLessThan(thang.n)
  })
})
void worker
