// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { gopDocD1 } from '../server/src/doc-d1-theo-luot'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { D1Database, D1PreparedStatement, D1Result } from '../server/src/kieu'

const SQL = 'SELECT qid, version FROM game_v2_question'
const ketQua = (version: string): D1Result => ({ success: true, results: [{ qid: 'q1', version }], meta: { changes: 0, last_row_id: 0, rows_read: 1, rows_written: 0 } })
function cho<T>() { let mo!: (v: T) => void; const p = new Promise<T>(r => { mo = r }); return { p, mo } }
function kho() {
  let version = 'cu', soDoc = 0
  let chanDoc: ReturnType<typeof cho<D1Result>> | undefined, chanGhi: ReturnType<typeof cho<void>> | undefined
  const docDaChay = cho<void>(), ghiDaChay = cho<void>()
  const raw = {
    prepare: (sql: string) => {
      const st = {
        bind: () => st,
        all: async () => { soDoc++; docDaChay.mo(); return chanDoc ? chanDoc.p : ketQua(version) },
        run: async () => { ghiDaChay.mo(); if (chanGhi) await chanGhi.p; version = 'moi'; return ketQua(version) },
        first: async () => ({ sql, version }),
      }
      return st as unknown as D1PreparedStatement
    },
    batch: async (ds: D1PreparedStatement[]) => Promise.all(ds.map(s => s.all())),
  } as D1Database
  return { luot: () => gopDocD1(raw), docDaChay, ghiDaChay, soDoc: () => soDoc, chanDoc: () => (chanDoc = cho<D1Result>()), boChanDoc: () => { chanDoc = undefined }, chanGhi: () => (chanGhi = cho<void>()) }
}
beforeEach(xoaMoiDem)

describe('kho dùng chung khi thầy sửa nguồn trong lúc em đọc', () => {
  it('đọc cũ về sau khi ghi xong không được đưa trở lại đệm', async () => {
    const d = kho(), chan = d.chanDoc()
    const cu = d.luot().prepare(SQL).all()
    await d.docDaChay.p
    await d.luot().prepare("UPDATE game_v2_question SET version='moi'").run()
    chan.mo(ketQua('cu'))
    expect((await cu).results[0]).toMatchObject({ version: 'cu' })
    d.boChanDoc()
    expect((await d.luot().prepare(SQL).all()).results[0]).toMatchObject({ version: 'moi' })
    expect(d.soDoc()).toBe(2)
  })

  it('đọc trong lúc lệnh ghi còn bay không được đệm đến 60 giây sau ghi', async () => {
    const d = kho(), chan = d.chanGhi()
    const ghi = d.luot().prepare("UPDATE game_v2_question SET version='moi'").run()
    await d.ghiDaChay.p
    expect((await d.luot().prepare(SQL).all()).results[0]).toMatchObject({ version: 'cu' })
    chan.mo()
    await ghi
    expect((await d.luot().prepare(SQL).all()).results[0]).toMatchObject({ version: 'moi' })
    expect(d.soDoc()).toBe(2)
  })
})
