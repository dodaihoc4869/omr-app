// @vitest-environment node
// LẶP CÂU (thầy 27/10 tối: «Học sinh báo app bấm vào toàn lặp câu»). Đo D1 thật (chỉ đọc): 100 lượt lặp cùng em – cùng câu ở 20 em, 91 lượt cách < 15 phút,
// 82 lượt lần trước đã ĐÚNG, 0 lượt trong cùng đợt. Tái hiện: giờ cao điểm mở chặng chậm (quá 40 s máy em bỏ chờ ⇒ Thử lại; hoặc Hôm nay mở trước) ⇒ HAI đợt
// cùng bộ câu; em làm hết ở đợt A, đợt B (tạo sau, mới nhất) còn nguyên. Trước: lần mở chặng sau DÙNG LẠI đợt B, chỉ trừ câu đã trả lời trong B ⇒ phát lại cả
// chặng vừa làm. Nay: câu của đợt cũ đã làm ở bất kỳ đợt nào (hôm nay / 15 phút vừa qua) không phát lại.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const NOW = Date.parse('2026-10-13T13:30:00Z') // 20:30 giờ VN — giờ cao điểm
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 60 }, 2)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL;
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8',60,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-12T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}

it('hai đợt cùng bộ câu (mở chặng quá giờ chờ rồi Thử lại): làm hết ở đợt A, mở chặng sau KHÔNG phát lại câu ấy từ đợt B', async () => {
  const k = await kho()
  const a = (await startGoi7(k.env, 'S1', NOW)) as { id: string; questions: { qid: string }[] }
  expect(a.questions.length).toBeGreaterThan(0)
  const daLam = a.questions.map((q) => q.qid)
  // Đợt B: cùng bộ câu, tạo SAU đợt A (lượt mở chặng đầu xong muộn hơn lượt Thử lại) ⇒ là đợt mới nhất.
  const jsonA = String(k.d.sql.prepare('SELECT json FROM game_v2_session WHERE id=?').get(a.id)!.json)
  k.d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('dot-b', 'S1', jsonA, new Date(NOW + 5_000).toISOString())
  // Em làm hết ở đợt A (lượt trả lời đã ghi; sổ học ghi hoãn chưa kịp có).
  const st = k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  daLam.forEach((q, i) => st.run(`${a.id}|${q}`, 'S1', a.id, q, `g-${q}`, '{}', new Date(NOW + 60_000 + i * 30_000).toISOString()))
  const sau = NOW + 60_000 + daLam.length * 30_000
  vi.setSystemTime(sau)
  const r = (await startGoi7(k.env, 'S1', sau)) as { id?: string; questions: { qid: string }[] }
  expect(r.questions.map((q) => q.qid).filter((q) => daLam.includes(q))).toEqual([])
  expect(r.questions.length).toBeGreaterThan(0)
})

it('đợt cũ còn câu CHƯA làm ở đâu cả ⇒ vẫn dùng lại đúng đợt ấy (không đổi hành vi cũ)', async () => {
  const k = await kho()
  const a = (await startGoi7(k.env, 'S1', NOW)) as { id: string; questions: { qid: string }[] }
  const [dau, ...con] = a.questions.map((q) => q.qid)
  k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run(`${a.id}|${dau}`, 'S1', a.id, dau, `g-${dau}`, '{}', new Date(NOW + 60_000).toISOString())
  vi.setSystemTime(NOW + 120_000)
  const r = (await startGoi7(k.env, 'S1', NOW + 120_000)) as { id: string; questions: { qid: string }[] }
  expect(r.id).toBe(a.id)
  expect(r.questions.map((q) => q.qid)).toEqual(con)
})
