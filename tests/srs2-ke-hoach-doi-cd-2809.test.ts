// @vitest-environment node
// Thầy 28/09: "tôi đã giao chiến dịch test nhưng không bấm vào làm được" — em mở Sảnh TRƯỚC khi có chiến dịch ⇒ kế hoạch hôm nay chốt RỖNG cả ngày.
// Sửa: kế hoạch chốt với chiến dịch khác (hoặc chưa có) ⇒ lập lại theo chiến dịch hiện tại, giữ câu đã làm.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, sanh2 } from '../server/src/srs2-d1'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T02:00:00Z') // 09:00 VN
const cau = (qid: string, phan: 'I' | 'II') => JSON.stringify({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: phan === 'I' ? 'B' : 'DSDS', reviewed: true, solution: { chot: 'c' },
})
function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 12; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`, i % 4 === 0 ? 'II' : 'I'))
  return { d, env }
}

describe('kế hoạch ngày lập lại khi chiến dịch đổi trong ngày', () => {
  it('mở Sảnh trước khi có chiến dịch ⇒ rỗng; thầy giao sau đó (cùng ngày) ⇒ mở lại có câu để làm, gắn đúng chiến dịch', async () => {
    const { env } = dung()
    const truoc = await layKeHoachHomNay(env, 'S1', T0)
    expect(truoc.kh.tong).toBe(0)
    const t = await gvChienDich(env, { action: 'tao', ten: 'Test', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05' }, T0) as { id: string }
    const sau = await layKeHoachHomNay(env, 'S1', T0 + 60_000)
    expect(sau.kh.chienDichId).toBe(t.id)
    expect(sau.kh.tong).toBeGreaterThan(0)
    const s = await sanh2(env, 'S1', T0 + 60_000) as { theLuc: { con: number } }
    expect(s.theLuc.con).toBe(sau.kh.tong)
    // lần mở tiếp theo trong ngày: GIỮ kế hoạch đã chốt lại (không lập nữa)
    const lan3 = await layKeHoachHomNay(env, 'S1', T0 + 120_000)
    expect([...lan3.kh.dao, ...lan3.kh.doan]).toEqual([...sau.kh.dao, ...sau.kh.doan])
  })
})
