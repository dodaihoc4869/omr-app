// Runtime workerd/D1 cục bộ, dữ liệu tổng hợp; không kết nối production.
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { Env } from '../server/src/kieu'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { moDot, phatItem, nopItem } from '../server/src/chua-cau-sai'
const E = { ...(env as unknown as Env), MA_BI_MAT: 'bi-mat-test-cuc-bo' } as Env
let token = '',
  dotId = '',
  itemId = ''
beforeAll(async () => {
  for (const sql of (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL) {
    const ds = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*--/.test(l))
      .map((l) => l.replace(/\s--.*$/, ''))
      .join('\n')
      .split(/;\s*(?:\n|$)/)
      .map((x) => x.trim())
      .filter(Boolean)
    for (let i = 0; i < ds.length; i += 50)
      await E.DB.batch(ds.slice(i, i + 50).map((x) => E.DB.prepare(x)))
  }
  const cot = new Set(
    (
      await E.DB.prepare("SELECT name FROM pragma_table_info('ca')").all<{
        name: string
      }>()
    ).results.map((x) => x.name),
  )
  for (const c of [
    'pham_vi',
    'danh_sach_chon_json',
    'mat_khau',
    'de_rieng',
    'pham_vi_hoi_lai',
  ])
    if (!cot.has(c))
      await E.DB.prepare(`ALTER TABLE ca ADD COLUMN ${c} TEXT`).run()
  token = await seedChua(E)
  const r = await moDot(E, { token, qid: Q })
  expect(r.status).toBe(200)
  dotId = ((await r.json()) as any).dotId
})
describe('Vòng chữa trên workerd/D1', () => {
  it('8 lần phát đồng thời giữ một phiên và một item', async () => {
    const rs = await Promise.all(
      Array.from({ length: 8 }, () => phatItem(E, { token, dotId })),
    )
    const ds = await Promise.all(rs.map((r) => r.json() as Promise<any>))
    expect(ds.every((r) => r.ok)).toBe(true)
    expect(new Set(ds.map((r) => r.item.id)).size).toBe(1)
    itemId = ds[0].item.id
    expect(
      (
        await E.DB.prepare(
          'SELECT COUNT(*) AS n FROM chua_loi_item',
        ).first<any>()
      ).n,
    ).toBe(1)
  })
  it('8 lần nộp đồng thời khoá đúng một receipt và một sự kiện', async () => {
    const rs = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        nopItem(E, {
          token,
          dotId,
          itemId,
          attemptId: `D1-${i}`,
          traLoi: i === 0 ? '40' : '23',
        }),
      ),
    )
    expect(rs.filter((r) => r.status === 200).length).toBe(1)
    expect(
      (
        await E.DB.prepare(
          'SELECT COUNT(*) AS n FROM chua_loi_nop',
        ).first<any>()
      ).n,
    ).toBe(1)
    expect(
      (
        await E.DB.prepare(
          "SELECT COUNT(*) AS n FROM su_kien_hoc WHERE nguon='chua_loi'",
        ).first<any>()
      ).n,
    ).toBe(1)
  })
  it('receipt đã lưu phát lại đúng, không sửa câu trả lời đầu', async () => {
    const n = await E.DB.prepare(
      'SELECT attempt_id,tra_loi,response_json FROM chua_loi_nop',
    ).first<any>()
    const r = await nopItem(E, {
      token,
      dotId,
      itemId,
      attemptId: n.attempt_id,
      traLoi: n.tra_loi,
    })
    const j = (await r.json()) as any
    expect(j.receiptId).toBe(JSON.parse(n.response_json).receiptId)
    expect(j.idempotent).toBe(true)
  })
})
