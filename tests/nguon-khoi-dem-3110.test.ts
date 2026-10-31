// @vitest-environment node
// ĐỆM NGUỒN KHỐI GIỮA CÁC LỆNH (31/10, thử tải 2000 em: câu đọc nguồn khối 11.525 lần / 6 phút): câu đã đọc dùng lại (đệm theo kho), chỉ câu mới đọc D1;
// kết quả y hệt đọc thẳng; kho câu đổi (dấu kho đổi) ⇒ đọc lại.
import { afterEach, describe, expect, it } from 'vitest'
import { docNguonKhoiD1 } from '../server/src/chan-khac-khoi'
import { batDemTheoKho, xoaDemTheoKho } from '../server/src/dau-kho-cau'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

afterEach(() => { batDemTheoKho(false); xoaDemTheoKho() })

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  const doc: string[] = []
  const g = k.env.DB as unknown as { prepare(q: string): unknown }
  const goc = g.prepare.bind(g)
  g.prepare = (q: string) => { if (/FROM game_v2_question q LEFT JOIN de_kho d/.test(q)) doc.push('nguon'); return goc(q) }
  return { k, env: k.env as Env, doc }
}
const chuan = (m: Map<string, unknown[]>) => JSON.stringify([...m].sort((a, b) => (a[0] < b[0] ? -1 : 1)))

describe('đệm nguồn khối', () => {
  it('lệnh sau dùng lại câu đã đọc, chỉ đọc câu mới; kết quả y hệt đọc thẳng', async () => {
    const { k, env, doc } = kho()
    const qs = k.qids('DH-B8')
    const thang = await docNguonKhoiD1(env, qs.slice(0, 10)) // đệm tắt (mặc định trong test)
    batDemTheoKho(true)
    const a = await docNguonKhoiD1(env, qs.slice(0, 10))
    expect(chuan(a)).toBe(chuan(thang))
    const n = doc.length
    const b = await docNguonKhoiD1(env, qs.slice(0, 10))
    expect(doc.length).toBe(n) // không đọc lại
    expect(chuan(b)).toBe(chuan(thang))
    const c = await docNguonKhoiD1(env, qs.slice(5, 15))
    expect(doc.length).toBe(n + 1) // chỉ 5 câu mới
    batDemTheoKho(false)
    expect(chuan(c)).toBe(chuan(await docNguonKhoiD1(env, qs.slice(5, 15))))
  })

  it('kho câu đổi (dấu kho đổi) ⇒ đọc lại', async () => {
    const { k, env, doc } = kho()
    const qs = k.qids('DH-B8').slice(0, 4)
    batDemTheoKho(true)
    const t0 = Date.now()
    await docNguonKhoiD1(env, qs)
    const n = doc.length
    k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-MOI','v1','${new Date(t0 + 1000).toISOString()}')`)
    const goc = Date.now
    Date.now = () => t0 + 6 * 60_000 // quá 5 phút ⇒ hỏi dấu kho
    try { await docNguonKhoiD1(env, qs) } finally { Date.now = goc }
    expect(doc.length).toBe(n + 1)
  })
})
