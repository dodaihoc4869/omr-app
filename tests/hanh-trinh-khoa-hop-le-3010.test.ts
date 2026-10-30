// @vitest-environment node
// 30/10 (lỗi #644 bắt được ở bộ đo kho cỡ thật trước khi mở lại app): bộ máy hành trình lọc dòng THI theo ca đã công bố bằng một câu UNION — khi sổ có dòng
// thi mà KHÔNG có dòng luyện, câu chỉ có ô ?1 nhưng truyền 4 tham số ⇒ D1 «column index out of range» ⇒ Sảnh «Máy chủ gặp trục trặc». Khoá lại: Sảnh của em
// có dòng thi (ca công bố + ca đã xoá) và dòng luyện vẫn ok.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG } from '../server/src/san-sang'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

/** Kho như học sinh thật giờ cao điểm: lớp 12 · Bài 8 (24 câu) vừa tick · gói bài 7 bật · một đợt hành trình. */
async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q) // bảng bản sẵn (san-sang.ts) có sẵn như bản sống
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))') // có ở bản sống
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { k, env: k.env as Env, token: await gameToken(k.env, 'S1') }
}

const sanh = async (env: Env, token: string) => (await (await worker.fetch(new Request('https://test/game-v2/hoc-tap-sanh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }), env, { waitUntil() {}, passThroughOnException() {} } as never)).json()) as Record<string, unknown>

for (const coLuyen of [false, true]) it(`Sảnh của em có dòng thi${coLuyen ? ' + dòng luyện' : ' (không có dòng luyện)'} ⇒ ok`, async () => {
  const { k, env, token } = await kho()
  const qs = k.qids('DH-B8')
  const ins = k.d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,received_at,assistance) VALUES(?,?,?,?,?,1,0,30,?,?,?,'none')`)
  const luc = (i: number) => new Date(NOW - 86_400_000 + i * 60_000).toISOString()
  ins.run('t1', 'S1', qs[0], 'thi', 'CA-X', luc(1), '2026-10-11', NOW - 86_400_000 + 60_000)
  ins.run('t2', 'S1', qs[1], 'thi', 'CA-XOA', luc(2), '2026-10-11', NOW - 86_400_000 + 120_000)
  ins.run('g1', 'S1', qs[2], 'game', 'ss1', luc(3), '2026-10-11', NOW - 86_400_000 + 180_000)
  if (coLuyen) ins.run('l1', 'S1', qs[3], 'luyen', 'de_thu:abc', luc(4), '2026-10-11', NOW - 86_400_000 + 240_000)
  const r = await sanh(env, token)
  expect(r.ok, JSON.stringify(r).slice(0, 200)).toBe(true)
})
