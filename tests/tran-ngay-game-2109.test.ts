// @vitest-environment node
// TRẦN CÂU GAME/NGÀY để MÀN đọc, không viết cứng (Boss 21/09 P0: trần hạ 200 → 60 nhưng màn còn ghi "200 câu"): `tranNgay = TRAN_CAU_GAME_NGAY` CHỈ-THÊM ở `recommendations` (cả ba nhánh) và `doan-sanh`;
// và luật thật ở quanh trần: 58/59 lượt làm vẫn mở được Đoàn, đúng 60 thì từ chối bằng lời có số 60 (đo bằng mô phỏng — Boss hỏi vì sao thầy thấy 58 mà không mở được). SQLite thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())
const cau = (qid: string, dang: string, phan: 'I' | 'II' | 'III' = 'I') => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: phan === 'II' ? 'DSDS' : 'B', solution: `LG-${qid}`, reviewed: true,
})

/** Lớp 12: S1 (em MỚI, không bằng chứng, không bài nào) + S2 (bạn cùng lớp được giao bài cá nhân hoá dạng A.1 ⇒ lớp đã học A.1). Kho: A-0…A-29 Phần I dạng A.1, A2-0 Phần II dạng A.1, B-0…B-9 dạng B.2 (chưa ai học). */
function dung(o: { moDoan?: boolean; soA?: number; soII?: number } = {}): D1That {
  const d = taoD1That()
  if (o.moDoan !== false) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',41,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const ds = [...Array.from({ length: o.soA ?? 30 }, (_, i) => cau(`A-${i}`, 'A.1')), ...Array.from({ length: o.soII ?? 1 }, (_, i) => cau(`A2-${i}`, 'A.1', 'II')), ...Array.from({ length: 10 }, (_, i) => cau(`B-${i}`, 'B.2'))]
  for (const q of ds) them.run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q))
  for (const [sbd, ten] of [['S1', 'Em Một'], ['S2', 'Em Hai']] as const) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(sbd, ten)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run(sbd, JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  }
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT1','CA1','DE1',30,'2026-09-20T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT1|S2','BT1','S2','Em Hai')").run()
  d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT1','A-0',1,'A.1',0,0,'I',0,0)").run()
  return d
}
const goi = async (d: D1That, sbd: string, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, `doan-${lenh}`, { token: await gameToken(d.env, sbd), ...b }) as Promise<any>
/** Mở Đoàn cho `sbd` và đọc 6 câu cá nhân đã chọn (từ phiên đã đóng dấu `doan` của em). */
async function caNhanCua(d: D1That, sbd = 'S1'): Promise<string[]> {
  const mo = await goi(d, sbd, 'mo')
  expect(mo.ok).toBe(true)
  const chang = d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(mo.doan.ma) as { json: string }
  const nguoi = (JSON.parse(chang.json).nguoi as { sbd: string; cau: { qid: string }[] }[]).find((x) => x.sbd === sbd)!
  return nguoi.cau.map((c) => c.qid)
}


import { TRAN_CAU_GAME_NGAY } from '../server/src/game-v2-luot'
const lamDay = (d: D1That, n: number) => {
  const ins = d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  for (let i = 0; i < n; i++) ins.run(`a${i}`, 'S1', 's', `Z${i}`, `gz${i}`, JSON.stringify({ attempt: { qid: `Z${i}`, group: `gz${i}`, correct: true, at: T0 - 3_600_000 + i, assisted: false } }), '2026-09-22T01:00:00.000Z')
}
describe('tranNgay cho màn', () => {
  it('hằng là 60 và có mặt ở recommendations (nhánh lượt mới: có câu · hết lượt/hết trần) và doan-sanh', async () => {
    expect(TRAN_CAU_GAME_NGAY).toBe(60)
    const d = dung()
    const token = await gameToken(d.env, 'S1')
    const r1 = await gameV2(d.env, 'recommendations', { token }) as any
    expect(r1.ok).toBe(true); expect(r1.tranNgay).toBe(TRAN_CAU_GAME_NGAY)
    const e = dung(); lamDay(e, 60)
    const r2 = await gameV2(e.env, 'recommendations', { token: await gameToken(e.env, 'S1') }) as any
    expect(r2).toMatchObject({ ok: true, remaining: 0, tranNgay: TRAN_CAU_GAME_NGAY, dailyUsed: 60 })
    const s = await goi(d, 'S1', 'sanh') as any
    expect(s.ok).toBe(true); expect(s.tranNgay).toBe(TRAN_CAU_GAME_NGAY)
  })

  it('đường cũ (cờ game_luot_moi = tat) cũng trả tranNgay', async () => {
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    const r = await gameV2(d.env, 'recommendations', { token: await gameToken(d.env, 'S1') }) as any
    expect(r.ok).toBe(true); expect(r.tranNgay).toBe(60)
  })
})

describe('quanh trần 60: Đoàn mở ở 58/59, từ chối ở 60 bằng lời có số 60', () => {
  for (const [n, mo] of [[58, true], [59, true], [60, false]] as const) it(`${n} lượt làm hôm nay ⇒ ${mo ? 'MỞ được' : 'từ chối'}`, async () => {
    const d = dung(); lamDay(d, n)
    if (mo) { const r = await goi(d, 'S1', 'mo', { cheDo: 'phong' }); expect(r.ok).toBe(true) }
    else await expect(goi(d, 'S1', 'mo', { cheDo: 'phong' })).rejects.toThrow(new RegExp(`hoàn thành ${TRAN_CAU_GAME_NGAY} câu hôm nay`))
  })
})
