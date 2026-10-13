// @vitest-environment node
// Đợt 22 · tối ưu máy chủ (thầy 13/10: "tối ưu máy chủ chuyên sâu hơn nữa, đảm bảo 100% app load tức thì và máy chủ phản hồi tức thì").
// Số đo D1 thật 3 giờ sau đợt 21: danh mục Hành trình (`danhMuc`) 524 lần × 57 ms, câu các tờ trong phạm vi (`cauCuaToPhamVi`) 444 lần × 65 ms —
// đọc lại hàng nghìn câu kèm JSON mỗi khi đệm isolate hết hạn dù kho KHÔNG đổi. Khoá: DẤU KHO CÂU (`dau-kho-cau.ts`, một dòng từ game_v2_index):
//  · đệm hết hạn + dấu không đổi ⇒ không đọc lại kho; · kho lập lại chỉ mục ⇒ đọc lại ngay lượt kế, kết quả mới; · quá hạn tối đa ⇒ đọc lại dù dấu không đổi.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { danhMuc, HAN_TOI_DA_DANH_MUC } from '../server/src/hanh-trinh-v5-d1'
import { cauCuaToPhamVi } from '../server/src/srs2-d1'
import { SQL_DAU_KHO_CAU } from '../server/src/dau-kho-cau'
import { xoaMoiDem } from '../server/src/dem-chung'
import type { Env } from '../server/src/kieu'

const PHUT = 60_000
const SANG = Date.parse('2026-10-13T03:00:00Z') // 10:00 giờ VN — ngoài cao điểm (đệm 1 phút)
afterEach(() => xoaMoiDem())

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 30 }, 3)
  k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','2026-10-13T01:00:00Z')`)
  const dem = { kho: 0, dau: 0 }
  const goc = k.env.DB
  const env = { ...k.env, DB: { prepare: (q: string) => {
    if (q.includes("json_extract(g.json,'$.hanhTrinh')") || q.startsWith('SELECT ma_de, qid, json FROM game_v2_question')) dem.kho++
    if (q === SQL_DAU_KHO_CAU) dem.dau++
    return goc.prepare(q)
  }, batch: goc.batch.bind(goc) } } as unknown as Env
  const lapLai = (luc: string) => k.d.sql.prepare('UPDATE game_v2_index SET indexed_at=? WHERE ma_de=?').run(luc, 'DH-B8')
  return { ...k, env, dem, lapLai }
}

it('danh mục Hành trình: hết hạn 1 phút + kho không đổi ⇒ chỉ hỏi dấu kho; lập lại chỉ mục ⇒ đọc lại; quá hạn tối đa ⇒ đọc lại', async () => {
  const k = kho()
  const hs = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.qids('DH-B8').slice(0, 20).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
  const a = await danhMuc(k.env, hs, SANG)
  expect(k.dem.kho).toBe(1)
  const b = await danhMuc(k.env, hs, SANG + 2 * PHUT)
  expect(k.dem.kho).toBe(1); expect(b).toBe(a)
  // Lần đọc đầu hỏi dấu SONG SONG (không thêm vòng chờ); lần hết hạn hỏi dấu một lần.
  expect(k.dem.dau).toBe(2)
  k.lapLai('2026-10-13T03:05:00Z')
  const c = await danhMuc(k.env, hs, SANG + 4 * PHUT)
  expect(k.dem.kho).toBe(2); expect(c).not.toBe(a); expect(c.map((x) => x.qid)).toEqual(a.map((x) => x.qid))
  // Quá hạn tối đa (tính từ lần đọc thật) ⇒ đọc lại dù dấu không đổi.
  await danhMuc(k.env, hs, SANG + 4 * PHUT + HAN_TOI_DA_DANH_MUC)
  expect(k.dem.kho).toBe(3)
  k.d.sql.close()
})

it('câu các tờ trong phạm vi: quá 5 phút + kho không đổi ⇒ dùng tiếp (y hệt); lập lại chỉ mục ⇒ đọc lại; quá 30 phút ⇒ đọc lại', async () => {
  const k = kho()
  const a = await cauCuaToPhamVi(k.env, ['DH-B8'], SANG)
  expect(k.dem.kho).toBe(1); expect(a.qids.length).toBeGreaterThan(0)
  expect(await cauCuaToPhamVi(k.env, ['DH-B8'], SANG + 3 * PHUT)).toBe(a)
  expect(k.dem.kho).toBe(1)
  const b = await cauCuaToPhamVi(k.env, ['DH-B8'], SANG + 8 * PHUT)
  expect(b).toBe(a); expect(k.dem.kho).toBe(1)
  // Một câu của tờ thôi được duyệt (lập lại chỉ mục) ⇒ lượt kế sau hạn kiểm đọc lại và thấy bớt một câu.
  const bo = a.qids[0]!
  const row = k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(bo) as { json: string }
  k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({ ...JSON.parse(row.json), reviewed: false }), bo)
  k.lapLai('2026-10-13T03:10:00Z')
  const c = await cauCuaToPhamVi(k.env, ['DH-B8'], SANG + 14 * PHUT)
  expect(k.dem.kho).toBe(2); expect(c.qids).toEqual(a.qids.filter((q) => q !== bo))
  await cauCuaToPhamVi(k.env, ['DH-B8'], SANG + 14 * PHUT + 30 * PHUT)
  expect(k.dem.kho).toBe(3)
  k.d.sql.close()
})
