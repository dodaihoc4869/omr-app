// @vitest-environment node
// BỘ NHỚ ISOLATE (đo 13/10 21:20–22:05 VN, workflow 38428596656: 111/15.814 yêu cầu lỗi, 100% `exceededMemory` — Worker vượt 128 MB, bị giết ⇒ em "không
// load được câu", p99 3,75 s). Khoá: (1) nhiều yêu cầu CÙNG LÚC cần cùng danh mục Hành trình ⇒ MỘT lượt đọc/dựng (trước: mỗi yêu cầu tự đọc ~24.000 dòng
// và dựng một bản riêng); (2) tổng số câu đệm danh mục có trần; (3) đệm kết quả D1 dùng chung có trần nhỏ hơn.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { danhMuc, TRAN_CAU_DEM_DANH_MUC } from '../server/src/hanh-trinh-v5-d1'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

const SANG = Date.parse('2026-10-13T03:00:00Z')
afterEach(() => xoaMoiDem())

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 30 }, 3)
  k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','2026-10-13T01:00:00Z')`)
  const dem = { kho: 0 }
  const goc = k.env.DB
  const env = { ...k.env, DB: { prepare: (q: string) => { if (q.includes("json_extract(g.json,'$.hanhTrinh')")) dem.kho++; return goc.prepare(q) }, batch: goc.batch.bind(goc) } } as unknown as Env
  return { ...k, env, dem }
}

it('10 yêu cầu cùng lúc cần cùng danh mục ⇒ MỘT lượt đọc kho, mọi yêu cầu nhận đúng một bản', async () => {
  const k = kho()
  const hs = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(0, 20).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
  const ds = await Promise.all(Array.from({ length: 10 }, () => danhMuc(k.env, hs, SANG)))
  expect(k.dem.kho).toBe(1)
  for (const x of ds) expect(x).toBe(ds[0])
  expect(ds[0]!.length).toBeGreaterThan(0)
  // xong lượt dựng ⇒ lần sau lấy từ đệm, không đọc lại
  expect(await danhMuc(k.env, hs, SANG + 1000)).toBe(ds[0])
  expect(k.dem.kho).toBe(1)
  k.d.sql.close()
})

it('lượt dựng lỗi ⇒ mọi bên chờ nhận lỗi; lượt sau đọc lại (không giữ lời hứa hỏng)', async () => {
  const k = kho()
  const hs = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(0, 5).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
  let hong = true
  const goc = k.env.DB
  const env = { ...k.env, DB: { prepare: (q: string) => { if (hong && q.includes("json_extract(g.json,'$.hanhTrinh')")) throw new Error('D1 quá tải'); return goc.prepare(q) }, batch: goc.batch.bind(goc) } } as unknown as Env
  const kq = await Promise.allSettled([danhMuc(env, hs, SANG), danhMuc(env, hs, SANG)])
  expect(kq.map((x) => x.status)).toEqual(['rejected', 'rejected'])
  hong = false
  expect((await danhMuc(env, hs, SANG)).length).toBeGreaterThan(0)
  k.d.sql.close()
})

it('trần tổng số câu đệm danh mục trong một isolate là hữu hạn và ≤ 40.000', () => {
  expect(TRAN_CAU_DEM_DANH_MUC).toBeGreaterThan(0)
  expect(TRAN_CAU_DEM_DANH_MUC).toBeLessThanOrEqual(40_000)
})

// 22/10 22:25–23:20 VN: 116 lỗi exceededMemory (8 đêm trước 0) — danh mục ~34.000 câu, nhiều lớp dựng song song. Mỗi isolate dựng MỘT danh mục một lúc.
it('danh mục hai khoá khác nhau dựng NỐI TIẾP trong một isolate (không song song), lượt treo không khoá cổng quá CHO_CONG_DUNG_MS', async () => {
  const { CHO_CONG_DUNG_MS } = await import('../server/src/hanh-trinh-v5-d1')
  expect(CHO_CONG_DUNG_MS).toBeGreaterThan(0)
  expect(CHO_CONG_DUNG_MS).toBeLessThanOrEqual(30_000)
  const nguon = (await import('node:fs')).readFileSync(new URL('../server/src/hanh-trinh-v5-d1.ts', import.meta.url), 'utf8')
  expect(nguon).toMatch(/congDung\.get\(khoaDb\)/)
  expect(nguon).toMatch(/Promise\.race\(\[truoc,new Promise\(r=>setTimeout\(r,CHO_CONG_DUNG_MS\)\)\]\)/)
  expect(nguon.indexOf('dem.delete(key)\n    let tong')).toBeLessThan(nguon.indexOf('return dungDanhMuc(env,ids,mas)'))
})

it('hai danh mục khác khoá gọi cùng lúc: cả hai dựng xong đúng (cổng nối tiếp không làm mất / lẫn kết quả)', async () => {
  const k = kho()
  const hsA = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(0, 10).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
  const hsB = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(10, 25).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
  const [a, b] = await Promise.all([danhMuc(k.env, hsA, SANG), danhMuc(k.env, hsB, SANG)])
  expect(a.length).toBeGreaterThan(0)
  expect(b.length).toBeGreaterThan(0)
  expect(k.dem.kho).toBe(2)
  expect(await danhMuc(k.env, hsA, SANG + 1000)).toBe(a)
  expect(await danhMuc(k.env, hsB, SANG + 1000)).toBe(b)
})
