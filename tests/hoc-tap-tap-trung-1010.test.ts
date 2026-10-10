// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam, T_SANG } from './omni-3-ke-hoach-chung'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { startDao2 } from '../server/src/srs2-game'
import { layKeHoachHomNay, xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemPhamVi } from '../server/src/bai-da-day'

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T_SANG) })
afterEach(() => { vi.useRealTimers(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemPhamVi() })
async function kho() {
  const k = taoKhoOmni({ 'DH-B1': 40 })
  k.d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài học',40,0,'v1'); INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x')")
  k.d.sql.prepare("UPDATE hoc_sinh SET mat_khau='mat-khau-gia' WHERE sbd='S1'").run()
  themChienDich(k.d, { id: 'CD-HOC', maDe: ['DH-B1'], qids: k.qids('DH-B1'), sbd: ['S1'], taoLuc: '2026-10-01T00:00:00Z', hanNop: '2026-10-15', theLuc: 24, huyetChien: false })
  return { ...k, token: await gameToken(k.env, 'S1') }
}
it('mở kế hoạch cho em chưa chọn thần thú, không trả bộ đệm hồ sơ riêng', async () => {
  const k = await kho()
  const r = await gameV2(k.env, 'hoc-tap-sanh', { token: k.token, sbd: 'S2' })
  expect(r).toMatchObject({ ok: true, cheDo2: true })
  expect(r.theLuc).toBeTruthy()
  expect(r).not.toHaveProperty('canChonThu')
  expect(r).not.toHaveProperty('_san')
  expect(k.d.sql.prepare('SELECT COUNT(*) AS n FROM game_v2_profile').get()).toMatchObject({ n: 0 })
})
it('có câu ôn vẫn mở bài tập chung, giữ phiên bản và không lộ đáp án/học liệu riêng', async () => {
  const k = await kho()
  await lam(k.env, 'S1', k.qids('DH-B1')[0]!, T_SANG - 86400000, false)
  const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
  expect(kh.conDoan.length).toBeGreaterThan(0)
  expect(await startDao2(k.env, 'S1', T_SANG)).toMatchObject({ lyDo: 'khoa_cho_doan' })
  const r = await gameV2(k.env, 'hoc-tap-start', { token: k.token })
  const qs = r.questions as Record<string, unknown>[]
  expect(qs.length).toBeGreaterThan(0); expect(qs.length).toBeLessThanOrEqual(6)
  for (const q of qs) { expect(q.version).toBeTruthy(); for (const field of ['correct', 'solution', 'xt', 'btv', 'hanhTrinh']) expect(q).not.toHaveProperty(field) }
  const row = k.d.sql.prepare('SELECT json FROM game_v2_session WHERE id=?').get(r.id as string) as { json: string }
  expect(JSON.parse(row.json)).toMatchObject({ hoa2: 1, hocTap: 1 })
  const lai = await gameV2(k.env, 'hoc-tap-start', { token: k.token })
  expect(lai.id).toBe(r.id)
})
it('bài tập chấm qua answer chung; gửi lại không tạo thêm lượt và không cần chọn thú', async () => {
  const k = await kho()
  const r = await gameV2(k.env, 'hoc-tap-start', { token: k.token })
  const q = (r.questions as { qid: string; phan: string }[])[0]!
  const answer = q.phan === 'I' ? 'B' : q.phan === 'II' ? 'DSDS' : '2'
  const body = { token: k.token, session: r.id, qid: q.qid, answer, msLam: 10000 }
  const first = await gameV2(k.env, 'answer', body)
  expect(typeof first.correct).toBe('boolean'); expect(typeof first.answer).toBe('string')
  await gameV2(k.env, 'answer', body)
  expect(k.d.sql.prepare('SELECT COUNT(*) AS n FROM game_v2_attempt WHERE session=? AND qid=?').get(r.id as string, q.qid)).toMatchObject({ n: 1 })
})
it('token sai không mở được kế hoạch hay phiên của em khác', async () => {
  const k = await kho()
  await expect(gameV2(k.env, 'hoc-tap-start', { token: 'gia', sbd: 'S1' })).rejects.toThrow()
  expect(k.d.sql.prepare('SELECT COUNT(*) AS n FROM game_v2_session').get()).toMatchObject({ n: 0 })
})

it('chuyển sang học tập nhả câu bị bàn Bi-a cũ giữ, không xoá lịch sử', async () => {
  const k = await kho()
  const { kh } = await layKeHoachHomNay(k.env, 'S1', T_SANG)
  k.d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('ban-cu','S1', JSON.stringify({ bia:1, questions: kh.conDao.map(qid=>({qid})) }), new Date(T_SANG).toISOString())
  const r = await gameV2(k.env, 'hoc-tap-start', { token:k.token })
  expect((r.questions as unknown[]).length).toBeGreaterThan(0)
  const row = k.d.sql.prepare("SELECT json FROM game_v2_session WHERE id='ban-cu'").get() as {json:string}
  expect(JSON.parse(row.json).dong).toBe(1)
})
it('câu thuộc ca mở bị chặn cả khi đã tạo đợt học chờ', async () => {
  const k = await kho()
  const first = await gameV2(k.env, 'hoc-tap-start', {token:k.token})
  const ids = (first.questions as {qid:string}[]).map(q=>q.qid)
  k.d.objects.set('de/ca-gia.json', {phanI:ids.map(id=>({id,text:id,choices:['a','b','c','d'],correct:'B'})),phanII:[],phanIII:[]})
  k.d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-GIA','Ca giả','mo',?,?,45,'thi','ca_lop_xong','de/ca-gia.json','x')").run(new Date(T_SANG-60000).toISOString(),new Date(T_SANG+1800000).toISOString())
  xoaDemCaBaoVe()
  const next=await gameV2(k.env,'hoc-tap-start',{token:k.token})
  for(const q of next.questions as {qid:string}[]) expect(ids).not.toContain(q.qid)
})
