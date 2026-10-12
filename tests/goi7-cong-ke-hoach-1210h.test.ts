// @vitest-environment node
// KHẨN 12/10 23h — thầy: "học sinh báo lỗi 2 câu cuối app không cho làm tiếp bảo tìm câu phù hợp". Nguyên nhân gốc: câu gói em KHÔNG nhận được lúc phát
// câu (`startGoi7`: khác khối / câu nghi qua `chanKhacKhoiEm`, không còn chỉ mục, tự luận, sai dạng thầy giới hạn) vẫn vào kế hoạch của sảnh — vai tiếp
// cận, xếp CUỐI — nên làm hết phần còn lại thì sảnh "Còn 2 câu" mà mở chặng rỗng ("Hiện chưa có câu phù hợp…"). Khoá:
//  · câu gói khác khối em KHÔNG vào kế hoạch (vào `chan`);
//  · mọi câu kế hoạch xếp đều phát được: làm hết phần phát được ⇒ kế hoạch không còn câu "ma", lệnh mở chặng không rỗng khi sảnh còn câu;
//  · đợt cũ còn câu nhưng không câu nào phát được ⇒ mở theo kế hoạch hôm nay (không kẹt).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam, type KhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NOW = Date.parse('2026-10-12T02:00:00Z') // 09:00 giờ VN
const PHUT = 60_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi() })

/** Lớp "12 - Lớp Thường"; Bài 8 (12 câu) vừa tick; 2 câu của tờ ấy được ghi KHỐI 10 trong kho (nguồn khối `cau_hoi`) ⇒ em khối 12 không được nhận. */
async function kho(): Promise<KhoOmni & { token: string; khacKhoi: string[] }> {
  const k = taoKhoOmni({ 'DH-B8': 12 }, 1)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8'), khacKhoi = [b8[2]!, b8[7]!]
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',12,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  const st = k.d.sql.prepare("UPDATE cau_hoi SET lop='10' WHERE qid=?")
  for (const q of khacKhoi) st.run(q)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1'), khacKhoi }
}
const start = async (env: Env, token: string, now: number) => { vi.setSystemTime(now); return (await gameV2(env, 'hoc-tap-start', { token })) as { ok: boolean; id?: string; questions: { qid: string }[]; message?: string } }

it('câu gói khác khối em không vào kế hoạch; câu kế hoạch nào cũng phát được', async () => {
  const k = await kho()
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  for (const q of k.khacKhoi) expect(lap.chan.has(q)).toBe(true)
  expect(lap.plan.viec.map((v) => v.qid).filter((q) => k.khacKhoi.includes(q))).toEqual([])
  const s = await start(k.env, k.token, NOW + PHUT)
  expect(s.questions.length).toBe(Math.min(6, lap.plan.viec.length))
  for (const c of s.questions) expect(lap.plan.viec.map((v) => v.qid)).toContain(c.qid)
})

it('làm hết phần phát được ⇒ không còn "câu ma" trong kế hoạch: sảnh còn câu thì mở chặng không rỗng', async () => {
  const k = await kho()
  const b8 = k.qids('DH-B8')
  let t = NOW
  for (const q of b8.filter((x) => !k.khacKhoi.includes(x))) await lam(k.env, 'S1', q, (t += PHUT), true, { cauVersion: 'v1' })
  t += PHUT
  const lap = (await lapGoi7(k.env, 'S1', t))!
  expect(lap.plan.viec.map((v) => v.qid).filter((q) => k.khacKhoi.includes(q))).toEqual([])
  const s = await start(k.env, k.token, t + PHUT)
  if (lap.plan.viec.length) expect(s.questions.length).toBeGreaterThan(0)
  else expect(s.questions).toEqual([])
})
