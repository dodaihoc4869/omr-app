// @vitest-environment node
// KHẨN 12/10 22h30 (thầy: "tối ưu triệt để máy chủ cho học sinh làm bài tập giờ cao điểm"). Số đo D1 thật 24 giờ: câu đọc siêu dữ liệu câu
// (`docMetaCau` › `docMetaCauTho`, srs2-d1.ts) đứng ĐẦU tổng thời gian D1 (~27.000 lần × ~1.800 dòng kèm tách JSON); danh mục hành trình (`danhMuc`) thứ
// hai — mà đệm 1 phút của nó khoá theo bản bọc D1 CỦA TỪNG LƯỢT GỌI nên không bao giờ dùng lại giữa các em. Khoá:
//  · giờ cao điểm: siêu dữ liệu câu nhớ theo isolate (khoá D1 gốc), kết quả Y HỆT đọc thẳng (cả thứ tự câu, tờ ưu tiên, tờ chứa câu, cờ tự luận);
//    lần sau chỉ đọc câu còn thiếu; kho lập lại chỉ mục (tem `game_v2_index` đổi) ⇒ đọc lại sau ≤ 5 giây;
//  · ngoài giờ cao điểm: đọc thẳng D1 như cũ (không đệm);
//  · danh mục hành trình giờ cao điểm dùng chung giữa các lượt gọi (bản bọc khác nhau, cùng D1 gốc).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { batDemMetaCau, docMetaCau, xoaDemMetaCau } from '../server/src/srs2-d1'
import { danhMuc } from '../server/src/hanh-trinh-v5-d1'
import { gopDocD1 } from '../server/src/doc-d1-theo-luot'
import type { Env } from '../server/src/kieu'

const SANG = Date.parse('2026-10-12T02:00:00Z') // 09:00 giờ VN
const CAO_DIEM = Date.parse('2026-10-12T14:00:00Z') // 21:00 giờ VN
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(CAO_DIEM); batDemMetaCau(true) })
afterEach(() => { vi.useRealTimers(); xoaDemMetaCau(); batDemMetaCau(false) })

/** Kho có câu nằm ở HAI tờ (để tờ ưu tiên có nghĩa) + một câu tự luận; đếm số lần chạy câu SQL siêu dữ liệu và số câu nó hỏi. */
function kho() {
  const k = taoKhoOmni({ 'DH-B8': 30 }, 3)
  const b8 = k.qids('DH-B8')
  const chep = k.d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) SELECT 'DH-ON8',qid,version,content_group,dang,json FROM game_v2_question WHERE ma_de='DH-B8' AND qid=?")
  for (const q of b8.slice(0, 10)) chep.run(q)
  k.d.sql.exec(`INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','2026-10-12T01:00:00Z'),('DH-ON8','v1','2026-10-12T01:00:00Z')`)
  const dem = { lan: 0, cau: [] as string[][] }
  const goc = k.env.DB
  const DB = { prepare: (q: string) => {
    const st = goc.prepare(q)
    if (q.includes('AS j_qid')) {
      const goiBind = st.bind.bind(st)
      st.bind = (...a: unknown[]) => { dem.lan++; dem.cau.push(JSON.parse(String(a[0])) as string[]); return goiBind(...a) }
    }
    return st
  }, batch: goc.batch.bind(goc) }
  const env = { ...k.env, DB } as unknown as Env
  /** Mỗi lượt gọi của máy chủ bọc D1 riêng (gameV2 › gopDocD1) — đệm phải dùng chung qua các bản bọc. */
  const luot = () => ({ ...env, DB: gopDocD1(env.DB, false) }) as Env
  return { ...k, b8, env, luot, dem }
}
const ra = (m: Map<string, unknown>) => [...m.entries()]

describe('siêu dữ liệu câu giờ cao điểm', () => {
  it('kết quả Y HỆT đọc thẳng (ngoài giờ) — thứ tự, tờ ưu tiên, tờ chứa câu, cờ tự luận; lượt sau không đọc lại', async () => {
    const k = kho()
    const hoi = [...k.b8.slice(5, 15).reverse(), 'DH-B1-TL', ...k.qids('DH-B0').slice(0, 4), k.b8[3]!, 'KHONG-CO']
    for (const uuTien of [[], ['DH-ON8'], ['DH-B8']]) {
      batDemMetaCau(false) // đối chứng: đọc thẳng D1
      const toThang = new Map<string, Set<string>>(), thang = await docMetaCau(k.luot(), hoi, uuTien, toThang)
      batDemMetaCau(true)
      const toDem = new Map<string, Set<string>>(), dem = await docMetaCau(k.luot(), hoi, uuTien, toDem)
      expect(ra(dem)).toEqual(ra(thang))
      expect(ra(toDem)).toEqual(ra(toThang))
    }
    expect(ra(await docMetaCau(k.luot(), hoi)).find(([q]) => q === 'DH-B1-TL')?.[1]).toMatchObject({ tuLuan: true })
    // 3 lượt đối chứng đọc thẳng + 1 lượt đầu có đệm; các lượt có đệm sau dùng lại.
    expect(k.dem.lan).toBe(4)
  })
  it('lượt sau chỉ đọc câu còn thiếu; kết quả vẫn bằng đọc thẳng', async () => {
    const k = kho()
    await docMetaCau(k.luot(), k.b8.slice(0, 12))
    const hoi = [...k.b8.slice(8, 20)]
    const dem = await docMetaCau(k.luot(), hoi, ['DH-ON8'])
    expect(k.dem.cau.at(-1)).toEqual([...k.b8.slice(12, 20)].sort())
    batDemMetaCau(false)
    expect(ra(dem)).toEqual(ra(await docMetaCau(k.luot(), hoi, ['DH-ON8'])))
  })
  it('kho lập lại chỉ mục (game_v2_index đổi) ⇒ sau 5 giây đọc lại, thấy bản mới', async () => {
    const k = kho()
    const q = k.b8[0]!
    expect((await docMetaCau(k.luot(), [q])).get(q)?.version).toBe('v1')
    k.d.sql.prepare("UPDATE game_v2_question SET version='v2', json=json_set(json,'$.version','v2') WHERE qid=?").run(q)
    k.d.sql.exec("UPDATE game_v2_index SET indexed_at='2026-10-12T14:00:01Z' WHERE ma_de='DH-B8'")
    vi.setSystemTime(CAO_DIEM + 6_000)
    expect((await docMetaCau(k.luot(), [q])).get(q)?.version).toBe('v2')
  })
  it('đợt 17: ngoài giờ cao điểm cũng đệm (cả ngày) — lượt sau không đọc lại; tắt đệm ⇒ mỗi lượt đọc thẳng', async () => {
    const k = kho()
    vi.setSystemTime(SANG)
    await docMetaCau(k.luot(), k.b8.slice(0, 5)); await docMetaCau(k.luot(), k.b8.slice(0, 5))
    expect(k.dem.lan).toBe(1)
    batDemMetaCau(false)
    await docMetaCau(k.luot(), k.b8.slice(0, 5)); await docMetaCau(k.luot(), k.b8.slice(0, 5))
    expect(k.dem.lan).toBe(3)
  })
})

describe('danh mục hành trình giờ cao điểm dùng chung giữa các lượt gọi', () => {
  it('hai lượt (hai bản bọc D1) trong 10 phút ⇒ đọc danh mục một lần', async () => {
    const k = kho()
    let soDoc = 0
    const goc = k.env.DB
    const env = { ...k.env, DB: { prepare: (q: string) => { if (q.includes("json_extract(g.json,'$.hanhTrinh')")) soDoc++; return goc.prepare(q) }, batch: goc.batch.bind(goc) } } as unknown as Env
    const hs = { chienDich: null, phamVi: { maDe: new Set(['DH-B8']) }, cau: k.b8.slice(0, 20).map((qid) => ({ qid })) } as unknown as Parameters<typeof danhMuc>[1]
    await danhMuc({ ...env, DB: gopDocD1(env.DB, false) } as Env, hs, CAO_DIEM)
    await danhMuc({ ...env, DB: gopDocD1(env.DB, false) } as Env, hs, CAO_DIEM + 3 * 60_000)
    expect(soDoc).toBe(1)
  })
})
