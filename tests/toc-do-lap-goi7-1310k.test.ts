// @vitest-environment node
// ĐỢT 18 · LÀN K (luật thầy 13/10: "sửa xong tốc độ máy chủ phải nhanh hơn"). Khoá ba cơ chế mới giúp Sảnh / Mở chặng bớt đợt chờ D1 mà KẾT QUẢ Y HỆT:
//  1. Bản gộp đọc (`gopDocD1`): lô gặp "bảng chưa có: X" ⇒ CHỈ câu nhắc X đi riêng, phần còn lại thử lại MỘT lô (trước: tách hết thành từng câu).
//  2. `docNguonKhoiD1` nhớ theo lượt TỪNG câu: lần qua cổng khối sau trong cùng lượt chỉ đọc câu chưa đọc; lệnh ghi đụng bảng nguồn ⇒ đọc lại.
//  3. `ddlDaXong`: chỉ báo "xong" khi nhóm DDL đã chạy thành công (đọc đoán trước chỉ khi không phải gửi lệnh tạo bảng).
import { describe, expect, it, vi } from 'vitest'
import { gopDocD1, xoaDemBangVang } from '../server/src/doc-d1-theo-luot'
import { docNguonKhoiD1 } from '../server/src/chan-khac-khoi'
import { chayDdlMotLan, ddlDaXong } from '../server/src/ddl-mot-lan'
import { taoD1That } from './_d1-that'
import type { D1Database, Env } from '../server/src/kieu'

type St = { sql: string; tham: unknown[] }
/** D1 giả ghi lại từng lô; câu nhắc bảng trong `thieu` ⇒ lỗi "no such table" (cả khi đi riêng lẫn trong lô — như D1 thật). */
function d1Gia(thieu: string[]) {
  const lo: string[][] = []
  const rieng: string[] = []
  const loiCua = (sql: string) => thieu.find((b) => new RegExp(`\\b${b}\\b`).test(sql))
  const prepare = (sql: string) => {
    const st: St & Record<string, unknown> = { sql, tham: [] }
    st.bind = (...t: unknown[]) => { st.tham = t; return st }
    st.all = async () => { rieng.push(sql); const b = loiCua(sql); if (b) throw new Error(`D1_ERROR: no such table: ${b}: SQLITE_ERROR`); return { results: [{ sql }] } }
    st.first = async () => ((await (st.all as () => Promise<{ results: unknown[] }>)()).results[0] ?? null)
    st.run = async () => ({ results: [], meta: { changes: 1 } })
    return st
  }
  const batch = vi.fn(async (ds: St[]) => {
    lo.push(ds.map((d) => d.sql))
    const b = ds.map((d) => loiCua(d.sql)).find(Boolean)
    if (b) throw new Error(`D1_ERROR: no such table: ${b}: SQLITE_ERROR`)
    return ds.map((d) => ({ results: [{ sql: d.sql }] }))
  })
  return { raw: { prepare, batch } as unknown as D1Database, lo, rieng, batch }
}

describe('gopDocD1 — lô gặp bảng chưa có', () => {
  it('chỉ câu nhắc bảng thiếu đi riêng; phần còn lại MỘT lô; mỗi câu ra đúng kết quả/lỗi của nó', async () => {
    xoaDemBangVang()
    const g = d1Gia(['bang_thieu'])
    const db = gopDocD1(g.raw)
    const r = await Promise.allSettled([
      db.prepare('SELECT 1 FROM a').all(),
      db.prepare('SELECT 1 FROM bang_thieu').all(),
      db.prepare('SELECT 2 FROM b').all(),
    ])
    expect(r[0]).toEqual({ status: 'fulfilled', value: { results: [{ sql: 'SELECT 1 FROM a' }] } })
    expect(r[1].status).toBe('rejected')
    expect(String((r[1] as PromiseRejectedResult).reason)).toMatch(/no such table: bang_thieu/)
    expect(r[2]).toEqual({ status: 'fulfilled', value: { results: [{ sql: 'SELECT 2 FROM b' }] } })
    expect(g.lo).toEqual([['SELECT 1 FROM a', 'SELECT 1 FROM bang_thieu', 'SELECT 2 FROM b'], ['SELECT 1 FROM a', 'SELECT 2 FROM b']])
    expect(g.rieng).toEqual(['SELECT 1 FROM bang_thieu'])
  })
  it('hai bảng thiếu trong cùng lô ⇒ lặp tách đúng từng bảng, câu tốt vẫn đi chung một lô', async () => {
    xoaDemBangVang()
    const g = d1Gia(['thieu_mot', 'thieu_hai'])
    const db = gopDocD1(g.raw)
    const r = await Promise.allSettled(['SELECT 1 FROM a', 'SELECT 1 FROM thieu_mot', 'SELECT 1 FROM thieu_hai', 'SELECT 2 FROM b'].map((q) => db.prepare(q).all()))
    expect(r.map((x) => x.status)).toEqual(['fulfilled', 'rejected', 'rejected', 'fulfilled'])
    expect(g.lo.at(-1)).toEqual(['SELECT 1 FROM a', 'SELECT 2 FROM b'])
    expect([...g.rieng].sort()).toEqual(['SELECT 1 FROM thieu_hai', 'SELECT 1 FROM thieu_mot'])
  })
  it('lỗi không chỉ ra bảng nào có trong lô ⇒ tách từng câu như cũ', async () => {
    xoaDemBangVang()
    const g = d1Gia([])
    g.batch.mockImplementationOnce(async () => { throw new Error('D1_ERROR: no such column: cot_moi') })
    const db = gopDocD1(g.raw)
    const r = await Promise.all([db.prepare('SELECT 1 FROM a').all(), db.prepare('SELECT 2 FROM b').all()])
    expect(r).toHaveLength(2)
    expect(g.rieng).toEqual(['SELECT 1 FROM a', 'SELECT 2 FROM b'])
  })
})

describe('docNguonKhoiD1 — nhớ theo lượt từng câu', () => {
  function kho() {
    const d = taoD1That()
    d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc,lop) VALUES('T10','Tờ 10',3,0,'v1','10'),('T12','Tờ 12',3,0,'v1','12');
      INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES
        ('T10','q1','v1','q1','d1','{"qid":"q1"}'),('T12','q2','v1','q2','d2','{"qid":"q2","lop":12}'),('T12','q3','v1','q3',NULL,'{"qid":"q3"}'),('T10','q3','v1','q3',NULL,'{"qid":"q3"}')`)
    let lan = 0
    const raw = d.env.DB as unknown as D1Database & Record<string, unknown>
    const boc = {
      prepare: (q: string) => { if (/UNION ALL/.test(q)) lan++; return raw.prepare(q) },
      batch: (ds: unknown[]) => raw.batch(ds as never),
    } as unknown as D1Database
    return { d, raw, boc, lan: () => lan }
  }
  const gon = (m: Map<string, Record<string, unknown>[]>) => Object.fromEntries([...m].map(([k, v]) => [k, v.map((r) => JSON.stringify(r)).sort()]).sort())
  it('lần sau chỉ đọc câu chưa đọc; kết quả y hệt đọc thẳng', async () => {
    const k = kho()
    const env = { DB: gopDocD1(k.boc) } as Env
    const tho = { DB: k.raw } as unknown as Env
    const a = await docNguonKhoiD1(env, ['q1', 'q2'])
    expect(k.lan()).toBe(1)
    const b = await docNguonKhoiD1(env, ['q2', 'q3', 'q1~ss0'])
    expect(k.lan()).toBe(2) // chỉ q3 mới phải đọc
    expect(gon(a)).toEqual(gon(await docNguonKhoiD1(tho, ['q1', 'q2'])))
    expect(gon(b)).toEqual(gon(await docNguonKhoiD1(tho, ['q2', 'q3', 'q1'])))
    expect(b.get('q3')).toHaveLength(2) // một câu ở hai tờ ⇒ hai dòng như cũ
    await docNguonKhoiD1(env, ['q1', 'q3'])
    expect(k.lan()).toBe(2) // đủ cả ⇒ 0 truy vấn
  })
  it('29/10 CPU giờ cao điểm: 6.000 câu ứng viên gom theo câu MỘT lần (tuyến tính) — trước lọc lại cả lô cho từng câu ⇒ O(câu × dòng), Sảnh sau nộp câu 2 giây CPU', async () => {
    const d = taoD1That()
    const N = 6000
    const qs = Array.from({ length: N }, (_, i) => `q${i}`)
    d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc,lop) VALUES('T10','Tờ 10',1,0,'v1','10')")
    const ins = d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('T10',?,'v1',?,'d1','{\"lop\":10}')")
    for (const q of qs) ins.run(q, q)
    const env = { DB: gopDocD1(d.env.DB as unknown as D1Database) } as Env
    const t0 = performance.now()
    const kq = await docNguonKhoiD1(env, qs)
    const ms = performance.now() - t0
    expect(kq.size).toBe(N)
    expect(kq.get('q5999')).toHaveLength(1)
    expect(ms, `gom nguồn khối 6.000 câu mất ${ms.toFixed(0)} ms`).toBeLessThan(1000)
  })
  it('lệnh ghi cùng lượt đụng bảng nguồn ⇒ đọc lại; D1 thô (không gộp) ⇒ luôn đọc như cũ', async () => {
    const k = kho()
    const env = { DB: gopDocD1(k.boc) } as Env
    await docNguonKhoiD1(env, ['q1'])
    await env.DB.prepare("UPDATE game_v2_question SET json='{\"qid\":\"q1\",\"lop\":10}' WHERE qid='q1'").run()
    const sau = await docNguonKhoiD1(env, ['q1'])
    expect(k.lan()).toBe(2)
    expect(sau.get('q1')?.[0]?.khoi).toBe(10)
    const tho = { DB: k.boc } as Env
    await docNguonKhoiD1(tho, ['q1'])
    await docNguonKhoiD1(tho, ['q1'])
    expect(k.lan()).toBe(4)
  })
  it('lỗi đọc ⇒ rỗng như cũ, và không nhớ lỗi (lần sau đọc lại)', async () => {
    let lan = 0
    const raw = {
      prepare: () => { const st: Record<string, unknown> = {}; st.bind = () => st; st.all = async () => { lan++; throw new Error('D1 bận') }; return st },
      batch: async () => { lan++; throw new Error('D1 bận') },
    } as unknown as D1Database
    const env = { DB: gopDocD1(raw) } as Env
    expect((await docNguonKhoiD1(env, ['q1'])).size).toBe(0)
    expect((await docNguonKhoiD1(env, ['q1'])).size).toBe(0)
    expect(lan).toBe(2)
  })
})

describe('ddlDaXong', () => {
  it('chỉ true sau khi nhóm DDL chạy THÀNH CÔNG', async () => {
    let lan = 0
    const db = { prepare: (s: string) => ({ s }), batch: async () => { lan++; if (lan === 1) throw new Error('D1 bận') } } as unknown as D1Database
    const env = { DB: db } as Env
    expect(ddlDaXong(env, 'nhom_k')).toBe(false)
    await expect(chayDdlMotLan(env, 'nhom_k', ['CREATE TABLE IF NOT EXISTS k (a)'])).rejects.toThrow('D1 bận')
    expect(ddlDaXong(env, 'nhom_k')).toBe(false)
    const p = chayDdlMotLan(env, 'nhom_k', ['CREATE TABLE IF NOT EXISTS k (a)'])
    expect(ddlDaXong(env, 'nhom_k')).toBe(false) // đang chạy
    await p
    expect(ddlDaXong(env, 'nhom_k')).toBe(true)
    expect(ddlDaXong(env, 'nhom_khac')).toBe(false)
  })
})
