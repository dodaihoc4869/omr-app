// @vitest-environment node
// 03/11 (thầy «bỏ hẳn lỗi kiểu này» — cùng gốc lỗi Kiểm tra ôn tập #822): Bài tự kiểm (Gói 7) trước đây gặp MỘT câu đang giữ cho ca thi là ném «Có câu đang
// được giữ cho ca kiểm tra. Em làm bài tự kiểm sau nhé.» ⇒ khoá cả tờ. Nay câu ấy bị bỏ khỏi lượt (không xuống máy, không chấm, không hiện đáp án).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const giu = vi.hoisted(() => new Set<string>())
vi.mock('../server/src/game-v2-bank', async (goc) => ({ ...(await goc<typeof import('../server/src/game-v2-bank')>()), protectedQuestions: async () => new Set(giu) }))

import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { damBaoGoi7, dongBoGoi7 } from '../server/src/goi-bai-7'
import { kiemGoi7 } from '../server/src/goi-bai-7-kiem'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemKeHoach } from '../server/src/dem-ke-hoach'
type Row = Record<string, unknown>
const NOW = Date.parse('2026-10-14T02:00:00Z'), ID = 'g7:tick'
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); giu.clear(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemKeHoach() })
async function kho() {
  const k = taoKhoOmni({ 'DH-B1': 18 }, 5)
  await Promise.all([damBaoBangBaiDaDay(k.env), damBaoGoi7(k.env)])
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='gia';
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-14"}','x');
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',18,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('tick','12A1','B1','Bài mới',1,'["DH-B1"]','2026-10-14T00:00:00Z');`)
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: k.qids('DH-B1'), maDe: ['DH-B1'], sbd: ['S1', 'S2', 'S3', 'S4', 'S5'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW, 10, '', true)
  return k
}
const traDung = (qs: Row[]) => Object.fromEntries(qs.map((q) => [String(q.qid), q.phan === 'I' ? 'B' : q.phan === 'II' ? 'DSDS' : '4']))

it('một câu của tờ đang giữ cho ca thi ⇒ vẫn tự kiểm được, câu ấy không xuống máy, không chấm', async () => {
  const k = await kho(), cauGiu = k.qids('DH-B1')[0]!
  giu.add(cauGiu)
  const start = await kiemGoi7(k.env, 'S1', 'hoc-tap-kiem-start', { goiId: ID, maDe: 'DH-B1' }, NOW)
  const qs = start.questions as Row[]
  expect(qs.length).toBeGreaterThan(0)
  expect(JSON.stringify(start)).not.toContain(cauGiu)
  expect(start.tong).toBe(qs.length)
  const nop = await kiemGoi7(k.env, 'S1', 'hoc-tap-kiem-nop', { goiId: ID, id: start.id, tra: traDung(qs) }, NOW + 1000)
  expect(JSON.stringify(nop)).not.toContain(cauGiu)
})

it('câu bị giữ GIỮA lượt ⇒ mở lại không trả câu ấy, nộp bỏ câu ấy, kết quả không hiện đáp án câu ấy', async () => {
  const k = await kho()
  const start = await kiemGoi7(k.env, 'S1', 'hoc-tap-kiem-start', { goiId: ID, maDe: 'DH-B1' }, NOW)
  const qs = start.questions as Row[], cauGiu = String(qs[0]!.qid)
  giu.add(cauGiu)
  const lai = await kiemGoi7(k.env, 'S1', 'hoc-tap-kiem-start', { goiId: ID, maDe: 'DH-B1' }, NOW + 500)
  expect((lai.questions as Row[]).map((q) => q.qid)).not.toContain(cauGiu)
  expect(lai.tong).toBe(qs.length - 1)
  const nop = await kiemGoi7(k.env, 'S1', 'hoc-tap-kiem-nop', { goiId: ID, id: start.id, tra: traDung(qs) }, NOW + 1000)
  expect(nop.tong).toBe(qs.length - 1)
  expect(JSON.stringify(nop)).not.toContain(cauGiu)
})

it('mọi câu của tờ đều đang giữ ⇒ báo em tự kiểm tờ khác (không lộ câu)', async () => {
  const k = await kho()
  for (const q of k.qids('DH-B1')) giu.add(q)
  await expect(kiemGoi7(k.env, 'S1', 'hoc-tap-kiem-start', { goiId: ID, maDe: 'DH-B1' }, NOW)).rejects.toThrow(/tờ khác/)
})
