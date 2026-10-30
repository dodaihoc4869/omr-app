// @vitest-environment node
// KHO SỔ TRONG NGĂN RIÊNG (30/10): đệm bộ nhớ isolate trượt (isolate mới / quá trần dòng) ⇒ đọc sổ từ SQLite của ngăn, D1 chỉ đọc phần MỚI — không đọc lại
// cả sổ của em. Kết quả lệnh y hệt đường không có kho.
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { taoKhoEm } from '../server/src/ngan-hoc-sinh'
import { xoaMoiDem } from '../server/src/dem-chung'
import { hoSoOmniEm } from '../server/src/omni-d1'
import { benLanLamMoi, docLanLam } from '../server/src/srs2-d1'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env, SqlNgan } from '../server/src/kieu'

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite')
const sqlGia = (): SqlNgan => {
  const db = new DatabaseSync(':memory:')
  return { exec: (q, ...b) => { const st = db.prepare(q); const r = /^\s*(SELECT|WITH)\b/i.test(q) ? st.all(...(b as never[])) : (st.run(...(b as never[])), []); return { toArray: () => r as Record<string, unknown>[] } } }
}

describe('kho sổ trong ngăn riêng', () => {
  it('ghi / đọc / thêm giữ đúng thứ tự và mốc; sai em ⇒ null', () => {
    const sql = sqlGia()
    const k = taoKhoEm(sql, 'S1')
    expect(k.docSo()).toBeNull()
    k.ghiSo([{ khoa: 'a', received_at: 1, raw_json: '{"x":1}' }, { khoa: 'b', received_at: 2, raw_json: null }], 2, 2, false)
    expect(k.docSo()).toEqual({ rows: [{ khoa: 'a', received_at: 1, raw_json: '{"x":1}' }, { khoa: 'b', received_at: 2, raw_json: null }], n: 2, r: 2 })
    k.ghiSo([{ khoa: 'c', received_at: 5 }], 3, 5, true)
    expect(k.docSo()!.rows.map((x) => x.khoa)).toEqual(['a', 'b', 'c'])
    expect(taoKhoEm(sql, 'S2').docSo()).toBeNull()
    k.ghiSo([{ khoa: 'z', received_at: 9 }], 1, 9, false)
    expect(k.docSo()).toEqual({ rows: [{ khoa: 'z', received_at: 9 }], n: 1, r: 9 })
  })

  it('isolate mới (đệm bộ nhớ trống) ⇒ hồ sơ OMNI không đọc lại CẢ sổ từ D1, chỉ phần mới; kết quả như cũ', async () => {
    const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
    const ins = k.d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,received_at,assistance,raw_json) VALUES(?,?,?,?,?,1,?,30,?,?,?,'none','{}')`)
    const them = (i: number) => ins.run(`k${i}`, 'S1', `DH-B8-${i % 24}`, 'game', `ss${i}`, i % 3 ? 1 : 0, new Date(Date.parse('2026-10-01T10:00:00Z') + i * 60_000).toISOString(), '2026-10-01', Date.parse('2026-10-01T10:00:00Z') + i * 60_000)
    for (let i = 0; i < 300; i++) them(i)
    const env0 = k.env as Env
    const doc: string[] = []
    const g = env0.DB as unknown as { prepare(q: string): unknown }
    const prep = g.prepare.bind(g)
    g.prepare = (q: string) => { if (/^SELECT khoa, sbd, qid, .*FROM su_kien_hoc WHERE sbd IN \(SELECT value FROM json_each\(\?\)\)/.test(q)) { doc.push(/received_at >= \?/.test(q) ? 'them' : 'ca'); }; return prep(q) }
    const env = { ...env0, KHO_EM: taoKhoEm(sqlGia(), 'S1') } as Env
    const now = Date.parse('2026-10-02T12:00:00Z')
    const a = await hoSoOmniEm(env, 'S1', now)
    expect(doc.length).toBeGreaterThan(0)
    const lan1 = doc.length
    expect(env.KHO_EM!.docSo()?.n).toBe(300)
    xoaMoiDem() // isolate mới
    const b = await hoSoOmniEm({ ...env } as Env, 'S1', now)
    expect(doc.slice(lan1)).toEqual([])
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
    them(300) // em vừa làm thêm một câu
    xoaMoiDem()
    const c = await hoSoOmniEm({ ...env } as Env, 'S1', now + 1)
    expect(doc.slice(lan1).every((x) => x === 'them')).toBe(true)
    expect(doc.slice(lan1).length).toBeGreaterThan(0)
    xoaMoiDem()
    const thang = await hoSoOmniEm({ ...env0 } as Env, 'S1', now + 1) // không kho: đọc cả sổ
    expect(JSON.stringify(c)).toBe(JSON.stringify(thang))
  })

  it('lần làm (srs2 docLanLam) trong ngăn đọc qua đệm sổ: y hệt đường D1 (song sinh, câu anh em, chẩn đoán, xem lời giải, lướt, mốc thời gian)', async () => {
    const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
    const ins = k.d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,received_at,assistance,purpose,visibility,raw_json) VALUES(?,?,?,?,?,1,?,30,?,?,?,?,?,?,?)`)
    const t0 = Date.parse('2026-10-01T10:00:00Z')
    const dong: [string, string, number | null, string | null, string | null, string | null, string][] = [
      ['DH-B8-0', 'game', 1, null, null, null, '{}'], ['DH-B8-0~ss1', 'game', 0, null, null, null, '{}'], ['DH-B8-1', 'game', 0, 'xem_loi_giai', null, null, '{}'],
      ['DH-B8-2', 'chua_loi', 1, 'chan_doan', null, null, '{"tc":"DH-B8-1"}'], ['DH-B8-3', 'game', 1, null, null, null, '{"tc":"DH-B8-1"}'],
      ['DH-B8-4', 'thi', 0, null, 'embargoed', null, '{}'], ['DH-B8-5', 'game', 0, 'luot', null, null, '{}'], ['DH-B8-6', 'game', null, null, null, 'assisted', '{"ms":5000}'],
    ]
    dong.forEach(([qid, nguon, kq, purpose, vis, ast, raw], i) => ins.run(`k${i}`, 'S1', qid, nguon, `m${i}`, kq, new Date(t0 + i * 60_000).toISOString(), '2026-10-01', t0 + i * 60_000, ast ?? 'none', purpose, vis, raw))
    const env0 = k.env as Env
    const qids = ['DH-B8-0', 'DH-B8-1', 'DH-B8-3', 'DH-B8-4', 'DH-B8-5', 'DH-B8-6']
    const chuan = (x: unknown) => JSON.stringify(x, (_k, v) => (v instanceof Map ? [...v].sort() : v))
    for (const tu of ['', new Date(t0 + 2 * 60_000).toISOString()]) {
      const benA = benLanLamMoi(), benB = benLanLamMoi()
      xoaMoiDem()
      const a = await docLanLam(env0, 'S1', qids, tu, benA)
      xoaMoiDem()
      const b = await docLanLam({ ...env0, KHO_EM: taoKhoEm(sqlGia(), 'S1') } as Env, 'S1', qids, tu, benB)
      const sx = (ds: { qid: string; luc?: string }[]) => [...ds].sort((x, y) => `${x.qid}|${x.luc}`.localeCompare(`${y.qid}|${y.luc}`))
      expect(chuan(sx(b as never))).toBe(chuan(sx(a as never)))
      expect(chuan(benB)).toBe(chuan(benA))
    }
  })
})
