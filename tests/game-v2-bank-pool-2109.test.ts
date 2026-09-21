// @vitest-environment node
// CHI PHÍ D1 của kho rút câu game (Boss 21/09: truy vấn `game_v2_question … ORDER BY cursor LIMIT 300` ≈ 246 triệu dòng đọc/ngày): bản mới TÁCH HAI PHA (khoá rồi json theo 300), tuyến tính.
// Khoá: kết quả (nội dung + THỨ TỰ) đúng như thuật toán cũ; đề đã xoá / chỉ mục lệch phiên bản bị loại; mọi truy vấn ≤ 100 tham số (giới hạn D1); không còn phân trang bằng ORDER BY cursor. SQLite thật.
import { describe, expect, it } from 'vitest'
import { readScope } from '../server/src/game-v2-bank'
import { taoD1That, type D1That } from './_d1-that'

/** Bộ giả: 4 dạng; đề 'A' và 'A1' CÙNG qid (thứ tự `ma_de|qid` khác thứ tự bộ (ma_de, qid): 'A1|q' < 'A|q'); đề 'Z' đã xoá; đề 'OLD' chỉ mục lệch phiên bản. > 300 câu để nhiều trang. */
function dung(): { d: D1That; dang: string[]; soKhop: number } {
  const d = taoD1That()
  const dang = ['D.ONE', 'D.TWO', 'D.THREE', 'D.FOUR']
  const de = [['A', 0], ['A1', 0], ['B', 0], ['Z', 1], ['OLD', 0]] as const
  for (const [ma, xoa] of de) {
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?)").run(ma, `Đề ${ma}`, 0, xoa, `v-${ma}`)
    d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma, ma === 'OLD' ? 'v-CU' : `v-${ma}`, 'x')
  }
  let khop = 0
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const [ma] of de) {
    for (let i = 1; i <= 260; i++) {
      const qid = ma === 'B' ? `b${i}` : `q${i}` // 'A' và 'A1' CÙNG qid: qid thắng cuối theo thứ tự `ma_de|qid` ('A1|q' < 'A|q' ⇒ bản của 'A' thắng); 'B' qid riêng
      them.run(ma, qid, 'v', `g-${ma}-${i}`, dang[i % 4], JSON.stringify({ qid, ma_de: ma, dang: dang[i % 4], i }))
      if (ma !== 'Z' && ma !== 'OLD') khop++
    }
  }
  return { d, dang, soKhop: khop }
}

/** Thuật toán CŨ (nguyên văn truy vấn phân trang bằng cursor) — chuẩn đối chiếu. */
async function poolCu(d: D1That, ids: string[]): Promise<{ qid: string; ma_de: string }[]> {
  const pool: { qid: string; ma_de: string }[] = []
  let after = ''
  for (;;) {
    const r = await d.env.DB.prepare(`SELECT q.json,q.ma_de||'|'||q.qid cursor FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.dang IN (${ids.map(() => '?').join(',')}) AND q.ma_de||'|'||q.qid>? ORDER BY cursor LIMIT 300`).bind(...ids, after).all<{ json: string; cursor: string }>()
    pool.push(...r.results.map((x) => JSON.parse(x.json)))
    if (r.results.length < 300) break
    after = r.results[r.results.length - 1]!.cursor
  }
  return [...new Map(pool.map((q) => [q.qid, q])).values()]
}

describe('readScope: pool kho rút câu (hai pha) == thuật toán cũ', () => {
  it('nội dung + THỨ TỰ giống hệt bản cũ (kể cả qid trùng giữa đề A / A1 và > 300 câu), đề đã xoá và chỉ mục lệch phiên bản bị loại', async () => {
    const { d, dang, soKhop } = dung()
    const cu = await poolCu(d, dang)
    const moi = (await readScope(d.env, 'S1', dang)).pool as unknown as { qid: string; ma_de: string }[]
    expect(moi).toEqual(cu)
    expect(soKhop).toBeGreaterThan(300 * 2) // ≥ 3 trang
    expect(moi.map((q) => q.ma_de).every((m) => m !== 'Z' && m !== 'OLD')).toBe(true)
    expect(new Set(moi.map((q) => q.qid)).size).toBe(520) // A/A1 gộp theo qid như cũ (260) + B (260)
    expect(moi.filter((q) => q.qid === 'q1').map((q) => q.ma_de)).toEqual(['A']) // thứ tự `ma_de|qid`: A1 trước A ⇒ A thắng (sắp chỉ theo qid sẽ ra A1)
  })

  it('nhiều lô dạng (> 60 dạng ⇒ nhiều lượt) vẫn giống bản cũ theo từng lô', async () => {
    const { d } = dung()
    const nhieu = ['D.ONE', 'D.TWO', ...Array.from({ length: 70 }, (_, i) => `RONG.${i}`), 'D.THREE', 'D.FOUR']
    const moi = (await readScope(d.env, 'S1', nhieu)).pool as unknown as { qid: string }[]
    const cu: { qid: string }[] = []
    for (let i = 0; i < nhieu.length; i += 60) cu.push(...await poolCu(d, nhieu.slice(i, i + 60)))
    expect(moi).toEqual([...new Map(cu.map((q) => [q.qid, q])).values()])
    expect(moi.length).toBe(520)
  })

  it('chi phí: không còn phân trang ORDER BY cursor; mọi truy vấn ≤ 100 tham số; số truy vấn kho = 1 (khoá) + ⌈số câu / 300⌉', async () => {
    const { d, dang, soKhop } = dung()
    const log: { sql: string; n: number }[] = []
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => {
      const st = goc(q)
      return { ...st, bind: (...a: unknown[]) => { log.push({ sql: q, n: a.length }); return st.bind(...a) } } as unknown as ReturnType<typeof goc>
    }) as typeof d.env.DB.prepare
    await readScope(d.env, 'S1', dang)
    const kho = log.filter((x) => /game_v2_question/.test(x.sql))
    expect(kho.some((x) => /ORDER BY cursor/i.test(x.sql))).toBe(false)
    expect(Math.max(...log.map((x) => x.n))).toBeLessThanOrEqual(100)
    const soCauKhac = 260 * 3 // A, A1, B (không tính Z, OLD): số dòng khoá của pha 1
    expect(soKhop).toBe(soCauKhac)
    expect(kho.length).toBe(1 + Math.ceil(soCauKhac / 300))
  })
})
