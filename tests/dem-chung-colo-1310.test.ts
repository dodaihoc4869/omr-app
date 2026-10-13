// @vitest-environment node
// ĐỆM CHUNG GIỮA CÁC ISOLATE (thầy 13/10 ~21:45: "tất cả mọi chỗ rút câu rất là lag, bạn tối ưu máy chủ chuyên sâu cho app hoạt động mượt mà và tức thì").
// Số đo thật giờ cao điểm: đệm trong MỘT isolate phải dựng lại ở mỗi isolate mới ⇒ siêu dữ liệu câu 21.982 lần/ngày × 30,7 ms, danh mục Hành trình
// 4.708 lần × 54 ms (~26.000 dòng/lần). Lớp Cache API (server/src/dem-chung-colo.ts) — ở đây giả `caches.default` bằng Map. Khoá:
//  · isolate THỨ HAI (D1 khác, cùng kho, cùng dấu kho) KHÔNG đọc lại kho nặng mà kết quả y hệt; · kho lập lại chỉ mục ⇒ khoá đổi ⇒ đọc lại;
//  · mục quá hạn tối đa (10 phút từ lúc DỰNG) không dùng; · không có Cache API ⇒ đường cũ (các test khác).
import { afterEach, beforeEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { danhMuc, HAN_TOI_DA_DANH_MUC } from '../server/src/hanh-trinh-v5-d1'
import { batDemMetaCau, docMetaCau } from '../server/src/srs2-d1'
import { SQL_DAU_KHO_CAU } from '../server/src/dau-kho-cau'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

const SANG = Date.parse('2026-10-13T03:00:00Z')
class CacheGia {
  kho = new Map<string, string>()
  soDoc = 0
  soGhi = 0
  async match(u: string) { this.soDoc++; const v = this.kho.get(u); return v === undefined ? undefined : new Response(v) }
  async put(u: string, r: Response) { this.soGhi++; this.kho.set(u, await r.text()) }
}
let cg: CacheGia
beforeEach(() => { cg = new CacheGia(); (globalThis as { caches?: unknown }).caches = { default: cg } })
afterEach(() => { delete (globalThis as { caches?: unknown }).caches; xoaMoiDem(); batDemMetaCau(false) })

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 30 }, 3)
  k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','2026-10-13T01:00:00Z')`)
  const dem = { danhMuc: 0, meta: 0, dau: 0 }
  const goc = k.env.DB
  const env = { ...k.env, DB: { prepare: (q: string) => {
    if (q.includes("json_extract(g.json,'$.hanhTrinh')")) dem.danhMuc++
    if (q.startsWith('SELECT qid, ma_de, version, content_group, dang')) dem.meta++
    if (q === SQL_DAU_KHO_CAU) dem.dau++
    return goc.prepare(q)
  }, batch: goc.batch.bind(goc) } } as unknown as Env
  const lapLai = (luc: string) => k.d.sql.prepare('UPDATE game_v2_index SET indexed_at=? WHERE ma_de=?').run(luc, 'DH-B8')
  return { ...k, env, dem, lapLai }
}
const hsCua = (k: ReturnType<typeof kho>) =>
  ({ chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(0, 20).map((qid) => ({ qid })) }) as unknown as Parameters<typeof danhMuc>[1]
const gon = (ds: Awaited<ReturnType<typeof danhMuc>>) => JSON.parse(JSON.stringify(ds))

it('danh mục Hành trình: isolate thứ hai (cùng kho) lấy từ đệm chung — không đọc ~26.000 dòng, kết quả y hệt', async () => {
  const k1 = kho(), k2 = kho()
  const a = await danhMuc(k1.env, hsCua(k1), SANG)
  expect(k1.dem.danhMuc).toBe(1)
  expect(a.length).toBeGreaterThan(0)
  const b = await danhMuc(k2.env, hsCua(k2), SANG + 60_000)
  expect(k2.dem.danhMuc).toBe(0) // không đọc lại kho
  expect(k2.dem.dau).toBe(1) // chỉ hỏi dấu kho (một dòng)
  expect(gon(b)).toEqual(gon(a))
  k1.d.sql.close(); k2.d.sql.close()
})

it('danh mục: kho lập lại chỉ mục (dấu đổi) ⇒ khoá đổi ⇒ isolate mới đọc lại; mục quá hạn tối đa (từ lúc dựng) không dùng', async () => {
  const k1 = kho(), k2 = kho(), k3 = kho()
  await danhMuc(k1.env, hsCua(k1), SANG)
  k2.lapLai('2026-10-13T02:59:00Z')
  await danhMuc(k2.env, hsCua(k2), SANG + 60_000)
  expect(k2.dem.danhMuc).toBe(1)
  await danhMuc(k3.env, hsCua(k3), SANG + HAN_TOI_DA_DANH_MUC + 1)
  expect(k3.dem.danhMuc).toBe(1)
  k1.d.sql.close(); k2.d.sql.close(); k3.d.sql.close()
})

it('siêu dữ liệu câu: isolate khác (D1 khác, cùng kho) lấy từ đệm chung — 0 lượt đọc D1 nặng, kết quả y hệt; câu mới chỉ đọc phần thiếu', async () => {
  batDemMetaCau(true)
  const k1 = kho(), k2 = kho(), k3 = kho()
  const qs = k1.qids('DH-B8')
  const a = await docMetaCau(k1.env, qs.slice(0, 20), [], undefined)
  expect(k1.dem.meta).toBe(1)
  const b = await docMetaCau(k2.env, qs.slice(0, 20), [], undefined)
  expect(k2.dem.meta).toBe(0) // isolate thứ hai: không đọc D1
  expect([...b.entries()]).toEqual([...a.entries()])
  const c = await docMetaCau(k2.env, qs.slice(0, 25), [], undefined)
  expect(k2.dem.meta).toBe(1) // chỉ 5 câu mới đọc D1
  expect([...c.keys()].sort()).toEqual(qs.slice(0, 25).sort())
  const d = await docMetaCau(k3.env, qs.slice(0, 25), [], undefined)
  expect(k3.dem.meta).toBe(0) // isolate thứ ba: cả 25 câu từ đệm chung (ngăn đã gộp)
  expect([...d.entries()]).toEqual([...c.entries()])
  batDemMetaCau(false)
  const thang = await docMetaCau(k3.env, qs.slice(0, 25), [], undefined) // đọc THẲNG D1 (tắt đệm) để so
  expect([...d.entries()]).toEqual([...thang.entries()])
  k1.d.sql.close(); k2.d.sql.close(); k3.d.sql.close()
})

it('siêu dữ liệu câu: kho lập lại chỉ mục (dấu khác) ⇒ khoá đệm chung khác ⇒ isolate đó đọc D1', async () => {
  batDemMetaCau(true)
  const k1 = kho(), k2 = kho()
  const qs = k1.qids('DH-B8').slice(0, 10)
  await docMetaCau(k1.env, qs, [], undefined)
  k2.lapLai('2026-10-13T02:00:00Z')
  await docMetaCau(k2.env, qs, [], undefined)
  expect(k2.dem.meta).toBe(1)
  k1.d.sql.close(); k2.d.sql.close()
})
