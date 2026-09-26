// @vitest-environment node
// KHO ĐỀ GIAO THEO TUẦN — MÁY CHỦ (bước 2, 26/09/2026): `readScope` chỉ đưa câu TRONG đề đã giao.
//
// Bốn điều phải luôn đúng:
//   1. Em trong danh sách + trong hạn ⇒ pool CHỈ có câu của tờ đã tick.
//   2. Qua hạn ⇒ thôi ràng buộc.
//   3. Cấu hình tắt (bat:false) ⇒ thôi ràng buộc.
//   4. KHÔNG có cấu hình ⇒ hành vi cũ y nguyên (mọi test cũ không đổi).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readScope } from '../server/src/game-v2-bank'
import { xoaDemKhoDeGiao } from '../server/src/kho-de-giao'
import { taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const GIAO = '2026-10-01T00:00:00+07:00'
const HAN = '2026-10-10T00:00:00+07:00'
const TRONG = '2026-10-05T00:00:00+07:00'
const SAU = '2026-10-20T00:00:00+07:00'
const MA_A = 'DH-12-CA-TN'
const MA_B = 'DH-12-CB-TN'
const cauJson = (qid: string, maDe: string) => ({ qid, maDe, version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'A.1', tenDang: 'Dạng A.1', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: 'B', solution: `LG-${qid}`, reviewed: true })

/** Thêm MỘT tờ đề (n câu phần I, dạng A.1, khối 12) vào D1 đã có. */
function themTo(d: D1That, maDe: string, n: number) {
  d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,?)').run(maDe, maDe, '12', n, `kho/${maDe}.json`, 'v1')
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 0; i < n; i++) {
    const qid = `${maDe}-I-${i}`
    them.run(maDe, qid, 'v1', `g-${qid}`, 'A.1', JSON.stringify(cauJson(qid, maDe)))
  }
}

/** D1 có HAI tờ cùng dạng A.1 (A: 8 câu, B: 8 câu) + hai em khối 12; S1/S2 đã "học" dạng A.1. */
function dungHaiTo(): D1That {
  const d = taoD1That()
  for (const sbd of ['S1', 'S2']) d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,lop,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, `Em ${sbd}`, 'mk', '12', 'x')
  themTo(d, MA_A, 8)
  themTo(d, MA_B, 8)
  daHocDang(d, 'S1', 'A.1')
  daHocDang(d, 'S2', 'A.1')
  return d
}

/** Ghi cấu hình `kho_de_giao` (mặc định: bật, tick S1, đề A). */
const ghiGiao = (d: D1That, o: Record<string, unknown> = {}) =>
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kho_de_giao',?,'x')").run(JSON.stringify({ ma: 'kho_de_giao', bat: true, khoi: 12, lop: '12', sbd: ['S1'], maDe: [MA_A], giaoLuc: GIAO, deadline: HAN, ...o }))
const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(s)) }
const maCua = (pool: readonly { maDe: string }[]) => [...new Set(pool.map((q) => q.maDe))].sort()

beforeEach(() => xoaDemKhoDeGiao())
afterEach(() => { vi.useRealTimers(); xoaDemKhoDeGiao() })

describe('kho đề giao theo tuần — readScope chỉ đưa câu trong đề đã giao', () => {
  it('S1 (trong danh sách, trong hạn) chỉ nhận câu tờ A; S2 (ngoài danh sách) nhận cả A lẫn B', async () => {
    const d = dungHaiTo(); ghiGiao(d); xoaDemKhoDeGiao(); gio(TRONG)
    const s1 = await readScope(d.env, 'S1')
    const s2 = await readScope(d.env, 'S2')
    expect(s1.pool.length).toBeGreaterThan(0)
    expect(maCua(s1.pool)).toEqual([MA_A])
    expect(maCua(s2.pool)).toEqual([MA_A, MA_B])
  })
  it('qua hạn ⇒ thôi ràng buộc (S1 nhận cả A lẫn B)', async () => {
    const d = dungHaiTo(); ghiGiao(d); xoaDemKhoDeGiao(); gio(SAU)
    expect(maCua((await readScope(d.env, 'S1')).pool)).toEqual([MA_A, MA_B])
  })
  it('cấu hình tắt (bat:false) ⇒ thôi ràng buộc', async () => {
    const d = dungHaiTo(); ghiGiao(d, { bat: false }); xoaDemKhoDeGiao(); gio(TRONG)
    expect(maCua((await readScope(d.env, 'S1')).pool)).toEqual([MA_A, MA_B])
  })
  it('KHÔNG có cấu hình ⇒ hành vi cũ y nguyên (cả hai tờ)', async () => {
    const d = dungHaiTo(); gio(TRONG)
    expect(maCua((await readScope(d.env, 'S1')).pool)).toEqual([MA_A, MA_B])
  })
})
