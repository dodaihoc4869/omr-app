// @vitest-environment node
// HỌC THÊM CÂU MỚI (thầy 29/10 17:36, ảnh màn «Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.» + «Về Lộ trình»; «Sửa ngay lỗi này cho mọi hs»).
// Em ĐÃ đủ mức hôm nay bấm «Học thêm câu mới» (Lộ trình, TrongHs.tsx) ⇒ trước: chặng RỖNG (kế hoạch chỉ xếp tới mức đã chốt) ⇒ em kẹt ở màn rỗng. Nay: một chặng 6 câu MỚI chưa gặp
// (không sửa / ôn), mức đã chốt và «đã làm hôm nay» không đổi; em CHƯA đủ mức ⇒ hành vi cũ (kế hoạch thường).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7, startGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien } from '../server/src/su-kien-hoc'

const NOW = Date.parse('2026-10-29T13:10:00Z') // 20:10 giờ VN
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
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8', 8, '["DH-B8"]', '2026-10-28T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B8'), maDe: ['DH-B8'], sbd: ['S1', 'S2'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return k
}
const dong = (q: string, i: number) => ({
  nguon: 'game', maNguon: 'phien-1', sbd: 'S1', qid: q, lan: 1, ketQua: 1, luc: new Date(NOW - 60_000).toISOString(), maDang: '', chuyenDe: '', mucDo: '',
  attemptId: `phien-1|${q}`, assistance: 'none', purpose: 'maintenance', receivedAt: NOW - 60_000 - i, cauVersion: 'v1',
})

it('đã đủ mức ⇒ «Học thêm câu mới» mở chặng 6 câu MỚI, không phát lại câu đã làm; mức và số đã làm không đổi', async () => {
  const k = await kho()
  const lap0 = (await lapGoi7(k.env, 'S1', NOW))!
  const ke = lap0.plan.viec.map((v) => v.qid)
  expect(ke.length).toBe(lap0.toiThieu)
  await ghiSuKien(k.env, ke.map((q, i) => dong(q, i)) as never)
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBe(lap.toiThieu) // đủ mức
  expect(lap.plan.viec).toEqual([]) // kế hoạch thường rỗng (đúng thiết kế: mức đã chốt)
  const them = lap.hocThem()
  expect(them.length).toBe(6)
  expect(new Set(them.map((v) => v.qid)).size).toBe(6)
  for (const v of them) { expect(ke).not.toContain(v.qid); expect(['moi', 'tiep_can']).toContain(v.vai) }
  // Mở chặng thật (không lưu phiên): có đủ 6 câu công khai, không đáp án
  const st = await startGoi7(k.env, 'S1', NOW, undefined, { khongLuu: true }) as { chuanBi?: { questions?: { qid: string }[]; rong?: unknown } } | null
  expect(st?.chuanBi?.rong).toBeUndefined()
  expect(st?.chuanBi?.questions?.length).toBe(6)
  for (const q of st!.chuanBi!.questions!) expect(ke).not.toContain(q.qid)
  expect(JSON.stringify(st!.chuanBi!.questions)).not.toContain('"correct"')
  // Mức đã chốt và số đã làm hôm nay giữ nguyên
  const lai = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lai.toiThieu).toBe(lap.toiThieu); expect(lai.daLamNgay).toBe(lap.daLamNgay)
})

it('em CHƯA đủ mức ⇒ chặng như cũ (kế hoạch thường), «học thêm» không chen vào', async () => {
  const k = await kho()
  const lap = (await lapGoi7(k.env, 'S1', NOW))!
  expect(lap.daLamNgay).toBeLessThan(lap.toiThieu)
  const st = await startGoi7(k.env, 'S1', NOW, undefined, { khongLuu: true }) as { chuanBi?: { refs?: { qid: string }[] } } | null
  expect(st?.chuanBi?.refs?.map((r) => r.qid)).toEqual(lap.plan.viec.slice(0, 6).map((v) => v.qid))
})
