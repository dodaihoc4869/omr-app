// @vitest-environment node
// ĐỆM «PHỤC VỤ ĐƯỢC» THEO KHO (31/10): phần chỉ phụ thuộc kho câu (có trong chỉ mục, nhóm nội dung, tự luận) nhớ theo qid; lần sau chỉ đọc D1 cho qid mới;
// kết quả (duoc / khongCoChiMuc / tuLuan / biBaoVe) y hệt đường không đệm; kho đổi (dấu kho đổi) ⇒ đọc lại.
import { afterEach, describe, expect, it } from 'vitest'
import { qidPhucVuDuoc } from '../server/src/cau-theo-qid'
import { batDemTheoKho, xoaDemTheoKho } from '../server/src/dau-kho-cau'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import type { Env } from '../server/src/kieu'

afterEach(() => { batDemTheoKho(false); xoaDemTheoKho() })

function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24, 'DH-B9': 10 }, 3)
  k.d.sql.exec(`INSERT OR IGNORE INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','B8',24,0,'v1'),('DH-B9','B9',10,0,'v1');
    INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','2026-10-01T00:00:00Z'),('DH-B9','v1','2026-10-01T00:00:00Z')`)
  const doc: number[] = []
  const g = k.env.DB as unknown as { prepare(q: string): unknown }
  const goc = g.prepare.bind(g)
  g.prepare = (q: string) => { if (/SELECT q\.qid, q\.content_group, q\.json FROM game_v2_question q/.test(q)) doc.push(1); return goc(q) }
  return { k, env: k.env as Env, doc }
}
const gon = (p: Awaited<ReturnType<typeof qidPhucVuDuoc>>) => ({ duoc: [...p.duoc].sort(), khong: [...p.khongCoChiMuc].sort(), tuLuan: [...p.tuLuan].sort(), baoVe: [...p.biBaoVe].sort(), kiem: p.kiemDuocBaoVe })

describe('đệm phục vụ được theo kho', () => {
  it('lần sau dùng lại phần kho (không đọc D1 cho qid đã nhớ), kết quả y hệt đường không đệm', async () => {
    const { k, env, doc } = kho()
    const qs = [...k.qids('DH-B8').slice(0, 15), 'KHONG-CO-1', ...k.qids('DH-B9').slice(0, 5)]
    const baoVe = { baoVe: new Set<string>([qs[2]!]), kiemDuocBaoVe: true }
    const thang = gon(await qidPhucVuDuoc(env, qs, baoVe))
    batDemTheoKho(true)
    const a = gon(await qidPhucVuDuoc(env, qs, baoVe))
    expect(a).toEqual(thang)
    const n = doc.length
    const b = gon(await qidPhucVuDuoc(env, qs, baoVe))
    expect(doc.length).toBe(n) // không đọc lại
    expect(b).toEqual(thang)
    const qs2 = [...qs.slice(5), ...k.qids('DH-B8').slice(15, 20)]
    const c = gon(await qidPhucVuDuoc(env, qs2, baoVe))
    expect(doc.length).toBe(n + 1) // chỉ qid mới
    batDemTheoKho(false)
    expect(c).toEqual(gon(await qidPhucVuDuoc(env, qs2, baoVe)))
    expect(thang.duoc.length).toBeGreaterThan(5)
    expect(thang.khong).toContain('KHONG-CO-1')
    expect(thang.baoVe).toEqual([qs[2]])
  })
})
