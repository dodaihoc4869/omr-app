// @vitest-environment node
// Hỏi xong phải có lịch kiểm trong ngân sách thật, kể cả câu nằm ngoài mẫu 96 câu cũ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam, type KhoOmni } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { sqlCauHoiThayDenHan } from '../server/src/hoi-thay-lich-on'

const NOW = Date.parse('2026-10-16T01:00:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi() })

async function kho(): Promise<KhoOmni> {
  const k = taoKhoOmni({ 'DH-B7': 130, 'DH-B8': 14 }, 1)
  for (const sql of SQL_BANG_HANH_TRINH) k.d.sql.exec(sql)
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12',ten_lop=NULL,mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B7','Bài 7',130,0,'v1'),('DH-B8','Bài 8',14,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B7','v1','x'),('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  const tick = k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('b7', '12 - Lớp Thường', 'B7', 'Bài 7', 7, '["DH-B7"]', '2026-10-01T11:00:00Z')
  tick.run('b8', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-15T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: [...k.qids('DH-B7'), ...k.qids('DH-B8')], maDe: ['DH-B7', 'DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}

function hen(k: KhoOmni, qid: string, due = NOW - 1, sbd = 'S1', id = 'kiem-1610-001') {
  const q = k.d.sql.prepare('SELECT version,content_group FROM game_v2_question WHERE qid=?').get(qid) as { version: string; content_group: string }
  k.d.sql.prepare(`INSERT INTO hoi_thay_kiem(id,sbd,qid_goc,nhom_goc,version_goc,qid_kiem,version_kiem,khoa_noi_dung,snapshot_json,assistance,trang_thai,phat_luc,het_han_luc,nop_luc,dung,den_han)
    VALUES(?,?,?,?,?,?,?,'k','{}','assisted','da_nop',?,?,?,1,?)`).run(id, sbd, qid, q.content_group, q.version, qid + '~ss0', 'v1', NOW - 2 * 86400000, NOW - 86400000, NOW - 2 * 86400000, due)
}

it('Gói7: câu đã hỏi đến hạn ngoài mẫu 96 được ưu tiên ôn, vẫn giữ câu mới và mức ngày', async () => {
  // NB ngoài mẫu 96: lịch kiểm không được vượt điều kiện tiên quyết của câu TH.
  const k = await kho(), qid = k.qids('DH-B7').at(-2)!
  await lam(k.env, 'S1', qid, NOW - 4 * 86400000, true, { cauVersion: 'v1' })
  hen(k, qid)
  const r = (await lapGoi7(k.env, 'S1', NOW))!
  expect(r.hs.hoiThayDenHan).toContain(qid)
  expect(r.plan.viec.some(v => v.qid === qid && ['sua', 'on'].includes(v.vai))).toBe(true)
  const ids = r.plan.viec.map(v => v.qid)
  expect(new Set(ids).size).toBe(ids.length)
  expect(r.plan.viec.length).toBeLessThanOrEqual(24)
  expect(r.plan.viec.some(v => k.qids('DH-B8').includes(v.qid) && ['moi', 'tiep_can'].includes(v.vai))).toBe(true)
  k.d.sql.close()
})

it('SQL lịch: đúng em, chỉ tới hạn, phiên bản hiện tại, không lấy lại việc đã xác nhận', async () => {
  const k = await kho(), [a, b, c] = k.qids('DH-B7')
  hen(k, a!, NOW - 1, 'S1', 'a')
  hen(k, b!, NOW + 1, 'S1', 'b')
  hen(k, c!, NOW - 1, 'S2', 'c')
  // Scalar tương quan đúng hình dạng dùng khi piggyback vào truy vấn đã có.
  const get = () => k.d.sql.prepare(`SELECT(SELECT json_group_array(qid_goc) FROM(${sqlCauHoiThayDenHan('x.sbd','x.now')})) ds FROM(SELECT ? sbd,? now) x`).get('S1', NOW) as { ds: string }
  expect(JSON.parse(get().ds)).toEqual([a])
  k.d.sql.prepare('UPDATE game_v2_question SET version=? WHERE qid=?').run('v2', a!)
  expect(JSON.parse(get().ds)).toEqual([])
  k.d.sql.prepare('UPDATE game_v2_question SET version=? WHERE qid=?').run('v1', a!)
  k.d.sql.prepare('UPDATE hoi_thay_kiem SET den_han=NULL WHERE id=?').run('a')
  expect(JSON.parse(get().ds)).toEqual([])
  k.d.sql.close()
})

it('câu vừa xem lời giải vẫn bị chặn dù đã có lịch kiểm đến hạn', async () => {
  const k = await kho(), qid = k.qids('DH-B7').at(-2)!
  await lam(k.env, 'S1', qid, NOW - 4 * 86400000, true, { cauVersion: 'v1' })
  hen(k, qid)
  k.d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES(?,?,?,?,0)').run('S1', qid, 'hoc_tap:tro_ly', new Date(NOW - 60_000).toISOString())
  const r = (await lapGoi7(k.env, 'S1', NOW))!
  expect(r.plan.viec.map(v => v.qid)).not.toContain(qid)
  k.d.sql.close()
})
