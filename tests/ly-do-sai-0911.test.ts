// @vitest-environment node
// «VÌ SAO EM SAI?» phía máy chủ — khối B đợt 2 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911, «làm hết sạch đẩy luôn lên bản sống»).
// Khoá: lệnh nộp câu mang `ly: [[qid, lý do], …]` ⇒ ghi bảng goi_bai_7_ly_do ở VIỆC PHỤ sau phản hồi (lần cuối thắng); thân lệnh không có `ly` ⇒ không
// câu lệnh nào chạm bảng; `ly` bẩn bị lọc (lý do lạ, qid quá dài, quá 20 cặp).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameToken } from '../server/src/game-v2-auth'
import { docCotLyDo, lySach } from '../server/src/ly-do-sai'

const NOW = Date.parse('2026-11-10T02:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemMetaCau() })

describe('lySach / docCotLyDo', () => {
  it('lọc thân lệnh bẩn, trùng qid giữ cặp sau', () => {
    expect(lySach(undefined)).toEqual([])
    expect(lySach('x')).toEqual([])
    expect(lySach([['q1', 'tinh'], ['q2', 'la'], [3, 'cach'], ['q3'], ['q1', 'nham'], ['x'.repeat(121), 'cach']])).toEqual([['q1', 'nham']])
    expect(lySach(Array.from({ length: 30 }, (_, i) => [`q${i}`, 'cach']))).toHaveLength(20)
    expect([...docCotLyDo('[["a","cach"],["b","la"],["c","nham"]]')]).toEqual([['a', 'cach'], ['c', 'nham']])
    expect(docCotLyDo(null).size).toBe(0)
    expect(docCotLyDo('{')).toEqual(new Map())
  })
})

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of [...SQL_BANG_HANH_TRINH, ...SQL_GOI7]) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-11-07T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}
async function goi(k: Awaited<ReturnType<typeof kho>>, lenh: string, than: Record<string, unknown>) {
  const phu: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { phu.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token: k.token }) }), k.env, ctx as never)
  const kq = (await res.json()) as Record<string, unknown>
  await Promise.allSettled(phu)
  return kq
}
const lyDaGhi = (k: Awaited<ReturnType<typeof kho>>) => k.d.sql.prepare("SELECT qid,ly FROM goi_bai_7_ly_do WHERE sbd='S1' ORDER BY qid").all()

describe('lệnh nộp câu mang lý do', () => {
  it('ghi lý do các câu sai trước (lần cuối thắng); không có `ly` ⇒ bảng không đổi', async () => {
    const k = await kho()
    const s = await goi(k, 'hoc-tap-start', {})
    expect(s.ok, JSON.stringify(s).slice(0, 200)).toBe(true)
    const [c1, c2, c3] = s.questions as { qid: string; phan: string }[]
    const sai = (c: { phan: string }) => (c.phan === 'I' ? 'A' : c.phan === 'II' ? 'DSDD' : '4')
    vi.setSystemTime(NOW + 60_000)
    const r1 = await goi(k, 'answer', { session: s.id, qid: c1!.qid, answer: sai(c1!), assisted: false, msLam: 30_000 })
    expect(r1.ok, JSON.stringify(r1).slice(0, 200)).toBe(true)
    expect(lyDaGhi(k)).toEqual([])
    vi.setSystemTime(NOW + 120_000)
    const r2 = await goi(k, 'answer', { session: s.id, qid: c2!.qid, answer: sai(c2!), assisted: false, msLam: 30_000, ly: [[c1!.qid, 'cach'], ['khac', 'la']] })
    expect(r2.ok).toBe(true)
    expect(lyDaGhi(k)).toEqual([{ qid: c1!.qid, ly: 'cach' }])
    vi.setSystemTime(NOW + 180_000)
    await goi(k, 'answer', { session: s.id, qid: c3!.qid, answer: sai(c3!), assisted: false, msLam: 30_000, ly: [[c1!.qid, 'nham'], [c2!.qid, 'tinh']] })
    expect(lyDaGhi(k)).toEqual([{ qid: c1!.qid, ly: 'nham' }, { qid: c2!.qid, ly: 'tinh' }].sort((a, b) => (a.qid < b.qid ? -1 : 1)))
  })
})
