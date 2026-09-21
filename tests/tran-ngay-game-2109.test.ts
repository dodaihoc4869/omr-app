// @vitest-environment node
// HAI TRẦN CÂU/NGÀY TÍNH RIÊNG (thầy lệnh 21/09 ~19:30: "cho riêng trần hộ tống đoàn là 60 câu nhé, tính riêng hẳn"): ĐOÀN 60 (chỉ lượt của PHIÊN ĐOÀN, json $.doan = 1) · ĐẢO + chế độ khác 36; KHÔNG ăn vào nhau; bỏ trần gộp.
// Máy đọc `tranNgay`/`dailyUsed`: recommendations = ĐẢO, doan-sanh = ĐOÀN (CHỈ-THÊM). Khoá: đếm theo loại, hai chiều độc lập ở lúc RÚT (start/mo) và lúc TRẢ LỜI (answer, gồm cả cổng nguyên tử của INSERT), lời báo có đúng số của trần. SQLite thật.
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


import { TRAN_CAU_DAO_NGAY, TRAN_CAU_DOAN_NGAY } from '../server/src/game-v2-luot'
import { danhDau } from '../server/src/game-v2-doan'
type Loai = 'doan' | 'dao'
/** `n` lượt trả lời hôm nay của S1 trong MỘT phiên thuộc loại `loai` (phiên Đoàn có json $.doan = 1). */
const lamDay = (d: D1That, n: number, loai: Loai) => {
  const id = loai === 'doan' ? 'p-doan' : 'p-dao'
  d.sql.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ ...(loai === 'doan' ? { doan: 1 } : {}), mode: 'adventure', questions: [], created: 1 }), 'x')
  const ins = d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  for (let i = 0; i < n; i++) ins.run(`${id}-${i}`, 'S1', id, `Z${loai}${i}`, `gz${loai}${i}`, JSON.stringify({ attempt: { qid: `Z${loai}${i}`, group: `gz${loai}${i}`, correct: true, at: T0 - 3_600_000 + i, assisted: false } }), '2026-09-22T01:00:00.000Z')
}
const moDoan = (d: D1That) => goi(d, 'S1', 'mo', { cheDo: 'phong' })
const recs = async (d: D1That) => gameV2(d.env, 'recommendations', { token: await gameToken(d.env, 'S1') }) as Promise<any>

describe('hằng số và điều kiện đếm', () => {
  it('Đoàn 60, Đảo 36 (không còn trần gộp)', () => { expect([TRAN_CAU_DOAN_NGAY, TRAN_CAU_DAO_NGAY]).toEqual([60, 36]) })
})

describe('tranNgay / dailyUsed cho màn: recommendations = ĐẢO, doan-sanh = ĐOÀN', () => {
  it('recommendations trả tranNgay 36 và dailyUsed CHỈ của Đảo (60 lượt Đoàn không hiện ở đây)', async () => {
    const d = dung(); lamDay(d, 60, 'doan'); lamDay(d, 5, 'dao')
    const r = await recs(d)
    expect(r).toMatchObject({ ok: true, tranNgay: 36, dailyUsed: 5, remaining: 31 })
  })
  it('doan-sanh trả tranNgay 60 và dailyUsed CHỈ của Đoàn (36 lượt Đảo không hiện ở đây)', async () => {
    const d = dung(); lamDay(d, 36, 'dao'); lamDay(d, 7, 'doan')
    const s = await goi(d, 'S1', 'sanh') as any
    expect(s).toMatchObject({ ok: true, tranNgay: 60, dailyUsed: 7 })
  })
  it('doan-sanh trả changHomNay {daDi, toiDa}: trần 6 chặng/ngày (Boss chốt 4 ⇒ 6), daDi đếm chặng đã LÊN ĐƯỜNG hôm nay (sảnh bỏ dở không tính)', async () => {
    const d = dung()
    const chang = (ma: string, tt: string) => { d.sql.prepare("INSERT INTO doan_chang(ma,json,chu,trang_thai,tao_luc) VALUES(?,?,'S1',?,?)").run(ma, '{}', tt, new Date(T0 - 3_600_000).toISOString()); d.sql.prepare('INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,vao_luc) VALUES(?,?,?,?,0,?)').run(ma, 'S1', '2026-09-22', '12', new Date(T0 - 3_600_000).toISOString()) }
    chang('DH1', 'xong'); chang('DH2', 'dang_di'); chang('DH3', 'sanh') // sảnh chưa đi ⇒ không tính
    expect((await goi(d, 'S1', 'sanh') as any).changHomNay).toEqual({ daDi: 2, toiDa: 6 })
  })
  it('đường cũ (cờ game_luot_moi = tat) cũng trả tranNgay 36 theo Đảo', async () => {
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    expect(await recs(d)).toMatchObject({ ok: true, tranNgay: 36 })
  })
})

describe('hai trần độc lập lúc RÚT câu', () => {
  it('đủ 36 lượt ĐẢO ⇒ Đảo hết (báo 36) nhưng Đoàn VẪN mở được', async () => {
    const d = dung(); lamDay(d, 36, 'dao')
    expect(await recs(d)).toMatchObject({ remaining: 0, tranNgay: 36 })
    expect((await moDoan(d)).ok).toBe(true)
  })
  it('đủ 60 lượt ĐOÀN ⇒ Đoàn hết (báo 60) nhưng Đảo VẪN còn nguyên 36', async () => {
    const d = dung(); lamDay(d, 60, 'doan')
    await expect(moDoan(d)).rejects.toThrow(/hoàn thành 60 câu hôm nay/)
    expect(await recs(d)).toMatchObject({ remaining: 36, dailyUsed: 0 })
  })
  it('35/36 Đảo còn 1 câu; 59/60 Đoàn vẫn mở', async () => {
    const d = dung(); lamDay(d, 35, 'dao'); lamDay(d, 59, 'doan')
    expect(await recs(d)).toMatchObject({ remaining: 1 })
    expect((await moDoan(d)).ok).toBe(true)
  })
})

describe('hai trần độc lập lúc TRẢ LỜI (answer, cả cổng nguyên tử của INSERT)', () => {
  /** Một phiên đang chờ với MỘT câu Phần I chưa trả lời, loại `loai`; trả về thông số để gọi answer. */
  const phienCho = async (d: D1That, loai: Loai) => {
    const q = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_question WHERE qid = 'A-9'").get() as { json: string }).json)
    const id = `cho-${loai}`
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ ...(loai === 'doan' ? { doan: 1 } : {}), mode: 'adventure', created: T0, questions: [{ qid: 'A-9', maDe: 'DE1', version: 'v1', group: q.group, novel: true }] }), new Date(T0).toISOString())
    const b = { token: await gameToken(d.env, 'S1'), session: id, qid: 'A-9', answer: 'B' }
    return loai === 'doan' ? danhDau(b) : b // câu của Đoàn chỉ trả lời qua cửa nội bộ của Đoàn (laGoiNoiBoDoan)
  }
  it('Đảo đủ 36 ⇒ chặn trả lời trong phiên Đảo (báo 36) nhưng phiên ĐOÀN vẫn ghi được', async () => {
    const d = dung(); lamDay(d, 36, 'dao')
    await expect(gameV2(d.env, 'answer', await phienCho(d, 'dao'))).rejects.toThrow(/hoàn thành 36 câu hôm nay/)
    const r = await gameV2(d.env, 'answer', await phienCho(d, 'doan')) as any
    expect(r.ok).toBe(true)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM game_v2_attempt WHERE session = 'cho-doan'").get() as { n: number }).n).toBe(1)
  })
  it('Đoàn đủ 60 ⇒ chặn trả lời trong phiên Đoàn (báo 60) nhưng phiên ĐẢO vẫn ghi được', async () => {
    const d = dung(); lamDay(d, 60, 'doan')
    await expect(gameV2(d.env, 'answer', await phienCho(d, 'doan'))).rejects.toThrow(/hoàn thành 60 câu hôm nay/)
    const r = await gameV2(d.env, 'answer', await phienCho(d, 'dao')) as any
    expect(r.ok).toBe(true)
  })
})

describe('đường cũ (cờ game_luot_moi = tat): Đoàn vẫn theo trần ĐOÀN, không theo trần Đảo', () => {
  it('36 lượt Đảo ⇒ Đoàn KHÔNG bị chặn bởi trần; 60 lượt Đoàn ⇒ Đoàn từ chối (báo 60)', async () => {
    const d = dung()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    lamDay(d, 36, 'dao')
    // đường cũ đòi bằng chứng học của em (em này chưa có) ⇒ báo lời KHÁC — miễn KHÔNG phải lời chạm trần: 36 lượt Đảo không chặn Đoàn
    const loi = await moDoan(d).then(() => '', (x: Error) => x.message)
    expect(loi).not.toMatch(/hoàn thành \d+ câu hôm nay/)
    const e = dung()
    e.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    lamDay(e, 60, 'doan')
    await expect(moDoan(e)).rejects.toThrow(/hoàn thành 60 câu hôm nay/)
  })
})

describe('cổng NGUYÊN TỬ của INSERT tính đúng loại: hai câu trả lời song song khi Đảo còn đúng 1 suất', () => {
  it('35/36 Đảo + hai câu song song ⇒ chỉ MỘT được ghi (lượt thứ hai bị cổng chặn), tổng Đảo = 36', async () => {
    const d = dung(); lamDay(d, 35, 'dao')
    const cho = (id: string, qid: string) => {
      const q = JSON.parse((d.sql.prepare('SELECT json FROM game_v2_question WHERE qid = ?').get(qid) as { json: string }).json)
      d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ mode: 'adventure', created: T0, questions: [{ qid, maDe: 'DE1', version: 'v1', group: q.group, novel: true }] }), new Date(T0).toISOString())
    }
    cho('song-1', 'A-8'); cho('song-2', 'A-9')
    const token = await gameToken(d.env, 'S1')
    const kq = await Promise.allSettled([
      gameV2(d.env, 'answer', { token, session: 'song-1', qid: 'A-8', answer: 'B' }),
      gameV2(d.env, 'answer', { token, session: 'song-2', qid: 'A-9', answer: 'B' }),
    ])
    expect(kq.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM game_v2_attempt WHERE sbd = 'S1' AND session NOT IN ('p-doan')").get() as { n: number }).n).toBe(36)
  })
})
