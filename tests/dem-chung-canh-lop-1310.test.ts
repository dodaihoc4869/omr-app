// @vitest-environment node
// Cạnh tiên quyết cả lớp (`docCanhLop`, ~9.600 lần/ngày × 22 ms, ~8.400 dòng/lần) qua ĐỆM CHUNG theo khung thời gian (13/10 tối — thầy: "mọi chỗ rút
// câu rất là lag … tối ưu chuyên sâu"). Khoá: isolate thứ hai CÙNG khung không đọc D1, kết quả trùng đọc thẳng; khung mới ⇒ đọc lại; không Cache API ⇒ như cũ.
import { afterEach, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { docCanhLop } from '../server/src/hanh-trinh-dong-co'
import { SQL_DONG_CO_HANH_TRINH } from '../server/src/hanh-trinh-dong-co-schema'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

class CacheGia { kho = new Map<string, string>(); async match(u: string) { const v = this.kho.get(u); return v === undefined ? undefined : new Response(v) } async put(u: string, r: Response) { this.kho.set(u, await r.text()) } }
afterEach(() => { delete (globalThis as { caches?: unknown }).caches; xoaMoiDem() })
const TOI = Date.parse('2026-10-13T14:01:00Z') // 21:01 VN — cao điểm, khung 10 phút

function d1() {
  const d = taoD1That()
  for (const q of SQL_DONG_CO_HANH_TRINH) d.sql.exec(q)
  const ins = d.sql.prepare('INSERT INTO hanh_trinh_v4_canh(sbd,tu,den,n_co,dung_co,n_chua,dung_chua,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)')
  for (const [sbd, tu, den, nc, dc, nch, dch] of [['S1', 'a', 'x', 3, 2, 1, 0], ['S2', 'a', 'x', 1, 1, 2, 1], ['S1', 'b', 'x', 2, 1, 0, 0], ['S3', 'c', 'y', 4, 4, 1, 1], ['S2', 'a', 'z', 0, 0, 0, 0]] as const)
    ins.run(sbd, tu, den, nc, dc, nch, dch, TOI - 3600_000)
  let lan = 0
  const env = { ...d.env, DB: { prepare: (q: string) => { if (q.includes('FROM hanh_trinh_v4_canh WHERE den IN')) lan++; return d.env.DB.prepare(q) }, batch: d.env.DB.batch.bind(d.env.DB) } } as unknown as Env
  return { d, env, lan: () => lan }
}

it('isolate thứ hai cùng khung: 0 lượt D1, kết quả trùng đọc thẳng; khung mới ⇒ đọc lại', async () => {
  const thang = d1()
  const mong = await docCanhLop(thang.env, ['x', 'y', 'z'], TOI) // không Cache API ⇒ đường cũ
  expect(mong.length).toBeGreaterThan(0)
  ;(globalThis as { caches?: unknown }).caches = { default: new CacheGia() }
  xoaMoiDem()
  const a = d1(), b = d1(), c = d1()
  const ra = await docCanhLop(a.env, ['x', 'y', 'z'], TOI)
  expect(a.lan()).toBe(1)
  expect(ra).toEqual(mong)
  const rb = await docCanhLop(b.env, ['y', 'x'], TOI + 60_000)
  expect(b.lan()).toBe(0)
  expect(rb).toEqual(mong.filter((r) => ['x', 'y'].includes(String(r.den))))
  await docCanhLop(c.env, ['x'], TOI + 10 * 60_000) // khung kế
  expect(c.lan()).toBe(1)
  for (const k of [thang, a, b, c]) k.d.sql.close()
})
