// @vitest-environment node
// LỖI 13/10 (thầy: "Nếu đã làm xong chặng 2 bấm làm tiếp chặng 3 câu bị lặp, còn nếu thoát ra bấm làm tiếp thì ko bị"). Nguyên nhân gốc: lệnh nộp câu ghi
// `game_v2_attempt` NGAY, còn dòng sổ học `su_kien_hoc` (nguồn "đã gặp / đã làm hôm nay" của kế hoạch Gói 7) ghi SAU khi trả lời máy em (ctx.waitUntil).
// Bấm "Học tiếp" ngay ⇒ kế hoạch lập khi sổ chưa có câu vừa làm ⇒ xếp lại. Khoá: câu đã có lượt trả lời (sổ chưa kịp ghi) KHÔNG vào chặng mới; qua 15
// phút (sổ chắc chắn đã ghi) thì kế hoạch tự quyết như cũ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const NOW = Date.parse('2026-10-13T12:00:00Z') // 19:00 giờ VN
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
const ghiLuotNgay = (k: Awaited<ReturnType<typeof kho>>, qids: string[], luc: number) => {
  const st = k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  for (const q of qids) st.run(`phien-cu|${q}`, 'S1', 'phien-cu', q, `g-${q}`, '{}', new Date(luc).toISOString())
}

it('xong chặng, bấm Học tiếp NGAY (sổ chưa kịp ghi): 6 câu vừa làm không quay lại chặng mới', async () => {
  const k = await kho()
  const truoc = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  const vuaLam = truoc.slice(0, 6)
  ghiLuotNgay(k, vuaLam, NOW - 20_000) // lượt trả lời đã ghi; dòng sổ học (ghi hoãn) chưa có
  const r = (await startGoi7(k.env, 'S1', NOW)) as { questions: { qid: string }[] }
  expect(r.questions.length).toBeGreaterThan(0)
  expect(r.questions.map((q) => q.qid).filter((q) => vuaLam.includes(q))).toEqual([])
})

it('lượt trả lời cũ hơn 15 phút không chặn (sổ đã ghi thì kế hoạch tự quyết như cũ)', async () => {
  const k = await kho()
  const truoc = (await lapGoi7(k.env, 'S1', NOW))!.plan.viec.map((v) => v.qid)
  ghiLuotNgay(k, truoc.slice(0, 6), NOW - 16 * 60_000)
  const r = (await startGoi7(k.env, 'S1', NOW)) as { questions: { qid: string }[] }
  expect(r.questions.map((q) => q.qid)).toEqual(truoc.slice(0, 6))
})
