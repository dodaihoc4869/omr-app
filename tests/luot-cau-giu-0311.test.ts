// @vitest-environment node
// 03/11 (thầy «bỏ hẳn lỗi kiểu này» — cùng gốc lỗi Kiểm tra ôn tập #822): lượt học đang mở có một câu VỪA bị giữ cho ca thi ⇒ trước đây `resume` ném
// «Lượt cũ có câu đang bảo vệ. Em mở lượt mới.», `answer` từ chối câu ấy, `complete` vẫn đòi đủ câu ⇒ lượt kẹt. Nay câu ấy bị bỏ như câu đổi nguồn (29/09).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const giu = vi.hoisted(() => new Set<string>())
vi.mock('../server/src/game-v2-bank', async (goc) => ({ ...(await goc<typeof import('../server/src/game-v2-bank')>()), protectedQuestions: async () => new Set(giu) }))

import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { syncIndex } from '../server/src/game-v2-bank'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-29T21:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => { vi.useRealTimers(); giu.clear() })
const MA = 'DE-Y', R2 = `kho/${MA}.json`, DANG = { ma: 'ES.A.X', ten: 'Dạng X' }
const cau = () => [
  { phan: 'I', so: 1, de: 'Câu I.1 của tờ', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'B', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
  { phan: 'I', so: 2, de: 'Câu I.2 của tờ', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'C', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
  { phan: 'III', so: 1, de: 'Nguyên tử Y có Z = 19. Y thuộc chu kỳ mấy trong bảng tuần hoàn?', dap_an: '4', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
]
async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'10',3,?,0,'2026-09-29T08:00:00.000Z')").run(MA, MA, R2)
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','10A','mk','x')").run()
  d.objects.set(R2, { ma_de: MA, cau: cau() })
  expect((await syncIndex(d.env)).remaining).toBe(0)
  return d
}
const v = (d: D1That, qid: string) => (d.sql.prepare('SELECT version FROM game_v2_question WHERE ma_de=? AND qid=?').get(MA, qid) as { version: string }).version
function moLuot(d: D1That, id = 'LUOT-1') {
  const ref = (qid: string) => ({ qid, maDe: MA, version: v(d, qid), group: 'g-' + qid, novel: true })
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: [ref(`${MA}-I-1`), ref(`${MA}-I-2`), ref(`${MA}-III-1`)] }), new Date().toISOString())
  return id
}

it('câu vừa bị giữ cho ca thi giữa lượt ⇒ resume bỏ câu ấy (không bắt mở lượt mới), complete không đòi câu ấy', async () => {
  const d = await dung(), id = moLuot(d), token = await gameToken(d.env, 'S1')
  giu.add(`${MA}-I-1`)
  const r = await gameV2(d.env, 'resume', { token }) as { id: string; questions: { qid: string }[] }
  expect(r.id).toBe(id)
  expect(r.questions.map((q) => q.qid)).toEqual([`${MA}-I-2`, `${MA}-III-1`])
  await gameV2(d.env, 'answer', { token, session: id, qid: `${MA}-I-2`, answer: 'C' })
  await gameV2(d.env, 'answer', { token, session: id, qid: `${MA}-III-1`, answer: '4' })
  expect(await gameV2(d.env, 'complete', { token, session: id })).toMatchObject({ ok: true })
})

it('câu không bị giữ mà em chưa làm ⇒ complete vẫn đòi đủ câu', async () => {
  const d = await dung(), id = moLuot(d), token = await gameToken(d.env, 'S1')
  await gameV2(d.env, 'answer', { token, session: id, qid: `${MA}-I-2`, answer: 'C' })
  await expect(gameV2(d.env, 'complete', { token, session: id })).rejects.toThrow('Em cần hoàn thành các câu trong lượt.')
})
