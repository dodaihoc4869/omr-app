// @vitest-environment node
// ĐOÀN HỘ TỐNG DÙNG KHO LỚP (thầy 21/09; Boss/Code 1 W3): câu cá nhân của Đoàn lấy từ dạng LỚP đã học (như lượt Đảo mới) thay vì chỉ dạng em có bằng chứng — em MỚI (chưa bằng chứng nào) vào Đoàn được, thay vì "Chưa có câu vừa sức".
// Rào giữ nguyên: bài về nhà CHƯA nộp, câu em đã làm hôm nay ở chỗ khác, trần 60 câu/ngày, câu Phần II không thành câu cá nhân; cờ lùi `cau_hinh.game_luot_moi = 'tat'` ⇒ đường cũ. SQLite thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())
const cau = (qid: string, dang: string, phan: 'I' | 'II' | 'III' = 'I') => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: phan === 'II' ? 'DSDS' : 'B', solution: `LG-${qid}`, reviewed: true,
})

/** Lớp 12: S1 (em MỚI, không bằng chứng, không bài nào) + S2 (bạn cùng lớp được giao bài cá nhân hoá dạng A.1 ⇒ lớp đã học A.1). Kho: A-0…A-29 Phần I dạng A.1, A2-0 Phần II dạng A.1, B-0…B-9 dạng B.2 (chưa ai học). */
function dung(o: { moDoan?: boolean; soA?: number; soII?: number; daHoc?: boolean } = {}): D1That {
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
  if (o.daHoc !== false) daHocDang(d, 'S1', 'A.1')
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

describe('kho CÁ NHÂN cho câu Đoàn', () => {
  it('em mới không dùng bằng chứng của bạn; em đã học nhận 6 câu đúng dạng, không Phần II', async () => {
    await expect(goi(dung({daHoc:false}), 'S1', 'mo')).rejects.toThrow(/thuộc phần em đã học/)
    const d = dung()
    const qs = await caNhanCua(d)
    expect(qs).toHaveLength(6)
    expect(new Set(qs).size).toBe(6)
    expect(qs.every((q) => /^A-\d+$/.test(q))).toBe(true) // A2-0 (Phần II) và B-* (chưa ai học) không bao giờ vào
    // phiên của em đóng dấu doan như trước (không chấm được qua `answer` thường)
    const phien = d.sql.prepare("SELECT json FROM game_v2_session WHERE sbd='S1'").all() as { json: string }[]
    expect(phien).toHaveLength(1)
    expect(JSON.parse(phien[0]!.json).doan).toBe(1)
  })

  it('kho cá nhân ÍT câu Phần I (4 câu A.1 + 3 câu Phần II cùng dạng, dạng B.2 chưa ai học có 10 câu): chỉ nhận 4 câu Phần I của dạng em đã học — không bù bằng Phần II, không bù bằng dạng chưa ai học', async () => {
    const d = dung({ soA: 4, soII: 3 })
    const qs = await caNhanCua(d)
    expect([...qs].sort()).toEqual(['A-0', 'A-1', 'A-2', 'A-3'])
  })

  it('cờ lùi cau_hinh.game_luot_moi = tat ⇒ đường CŨ: em mới báo "Chưa có câu đã chấm, đã công bố…" (không bằng chứng nào)', async () => {
    const d = dung({daHoc:false})
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow(/Chưa có câu đã chấm, đã công bố/)
  })

  it('bài về nhà CHƯA nộp của chính em: câu trong bài (và cùng nhóm nội dung) KHÔNG ra ở Đoàn — game hiện lời giải ngay', async () => {
    const d = dung()
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT2','CA2','DE1',20,'2026-09-21T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT2|S1','BT2','S1','Em Một')").run()
    const ins = d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT2',?,?,'A.1',0,0,'I',0,0)")
    const emCau = d.sql.prepare("INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,?,?,?)")
    for (let i = 0; i < 20; i++) { ins.run(`A-${i}`, i + 1); emCau.run(`BT2|S1|A-${i}`, 'BT2', 'S1', `A-${i}`, 0, 'loi', i + 1) } // 20 trong 30 câu A.1 nằm trong bài chưa nộp
    const qs = await caNhanCua(d)
    expect(qs).toHaveLength(6)
    for (const q of qs) expect(Number(q.slice(2)), q).toBeGreaterThanOrEqual(20) // chỉ còn A-20…A-29
  })

  it('câu em đã làm hôm nay ở chỗ khác (sổ học hôm nay, nguồn không phải game) KHÔNG ra', async () => {
    const d = dung()
    const ins = d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    for (let i = 0; i < 24; i++) ins.run(`k${i}`, 'S1', `A-${i}`, 'luyen', 'm', 1, 1, 30, '2026-09-22T02:00:00.000Z', '2026-09-22', 'A.1')
    const qs = await caNhanCua(d)
    for (const q of qs) expect(Number(q.slice(2)), q).toBeGreaterThanOrEqual(24)
  })

  it('trần ĐOÀN 60 câu/ngày (tính riêng): đã làm đủ 60 câu CỦA ĐOÀN hôm nay ⇒ từ chối bằng lời cũ', async () => {
    const d = dung()
    // SỬA CÓ CHỦ Ý 21/09 (thầy lệnh 19:30): trần Đoàn 60 chỉ đếm lượt của PHIÊN ĐOÀN ($.doan = 1); attempt phải có json thật ({attempt:{group,…}}) để hàm chọn câu đọc được
    d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('sd','S1',?,'x')").run(JSON.stringify({ doan: 1, mode: 'adventure', questions: [], created: 1 }))
    const ins = d.sql.prepare("INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)")
    for (let i = 0; i < 60; i++) ins.run(`a${i}`, 'S1', 'sd', `Q${i}`, `g${i}`, JSON.stringify({ attempt: { qid: `Q${i}`, group: `g${i}`, correct: true, at: T0 - 3_600_000 + i, assisted: false } }), '2026-09-22T01:00:00.000Z')
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow(/60 câu hôm nay/)
  })

  it('không dạng lớp nào và em không bằng chứng ⇒ báo "Chưa có câu vừa sức" (không rút bừa từ dạng chưa ai học)', async () => {
    const d = dung({daHoc:false})
    d.sql.exec('DELETE FROM btvn_em; DELETE FROM btvn_cau')
    await expect(goi(d, 'S1', 'mo')).rejects.toThrow(/thuộc phần em đã học/)
  })
})
