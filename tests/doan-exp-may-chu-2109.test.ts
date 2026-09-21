// @vitest-environment node
// ĐỢT 2 · ĐOÀN HỘ TỐNG (Điều 9): EXP kết chặng (`doan_chang` 5/10/15, các chặng thắng sau trong ngày một nửa; `doan_giap` +3 mỗi trùm vỡ giáp, kể cả chặng thua) qua cửa trần 120 EXP game/ngày, khoá sổ theo mã chặng;
// và trần 4 chặng/ngày (1 miễn phí + tối đa 3 bằng vé). SQLite thật; số viết thẳng (không import hằng luật).
import { describe, expect, it } from 'vitest'
import { docExpKetChang, traoExpKetChang } from '../server/src/game-v2-doan-exp'
import { LOI_DU_CHANG_NGAY, LOI_HET_VE, TOI_DA_CHANG_NGAY, quaCongVe } from '../server/src/game-v2-doan-mua'
import type { TomTatChang } from '../src/game/than-thu-v2/doan-core'
import { taoD1That, type D1That } from './_d1-that'

const NGAY = '2026-09-22'
const KET_LUC = Date.parse(`${NGAY}T20:30:00+07:00`)
const hoSoGame = (o: Record<string, unknown> = {}) => ({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-21T05:00:00.000Z', luatCap: 2, ...o })
const tt = (o: Partial<TomTatChang> & { thang: boolean; sao: number; trumVoGiap: boolean[] }): TomTatChang => ({ ghe: [{ id: 'S1', laMay: false }, { id: 'S2', laMay: false }, { id: 'BOT', laMay: true }], ...o } as unknown as TomTatChang)

function dung(bat = true): D1That {
  const d = taoD1That()
  for (const s of ['S1', 'S2']) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(s)
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run(s, JSON.stringify(hoSoGame()), 'x')
  }
  if (bat) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1', 'S2'] }))
  return d
}
const luot = (d: D1That, ma: string, sbd: string, thang: 0 | 1, ngay = NGAY, trangThai = 'xong') => {
  d.sql.prepare("INSERT OR IGNORE INTO doan_chang(ma,revision,json,chu,trang_thai,tao_luc) VALUES(?,0,'{}','x',?,'x')").run(ma, trangThai)
  d.sql.prepare("INSERT INTO doan_luot(ma_chang,sbd,ngay_vn,lop,ghe,thang,vao_luc) VALUES(?,?,?,'',1,?,'x')").run(ma, sbd, ngay, thang)
}
const khoan = (d: D1That, sbd: string) => d.sql.prepare("SELECT khoa, loai, exp, ghi_chu FROM exp_so WHERE sbd = ? AND loai IN ('doan_chang','doan_giap') ORDER BY khoa").all(sbd) as { khoa: string; loai: string; exp: number; ghi_chu: string }[]
const vi = (d: D1That, sbd: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_profile WHERE sbd=?').get(sbd) as { json: string }).json) as Record<string, any>

describe('EXP kết chặng Đoàn', () => {
  it('thắng 2 sao: chặng thắng ĐẦU ngày 10, chặng thắng thứ hai 5 (một nửa); vỡ giáp 2 trùm = +6 mỗi bạn thật; bạn máy không có sổ; vào ống nghiệm', async () => {
    const d = dung()
    luot(d, 'PREV', 'S2', 1) // S2 đã thắng một chặng hôm nay
    luot(d, 'M1', 'S1', 1); luot(d, 'M1', 'S2', 1)
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: true, sao: 2, trumVoGiap: [true, false, true] }))
    expect(khoan(d, 'S1')).toEqual([
      { khoa: 'S1|doan_chang|M1', loai: 'doan_chang', exp: 10, ghi_chu: 'Thắng chặng 2 sao +10 EXP' },
      { khoa: 'S1|doan_giap|M1', loai: 'doan_giap', exp: 6, ghi_chu: 'Vỡ giáp 2 trùm +6 EXP' },
    ])
    expect(khoan(d, 'S2').map((x) => [x.loai, x.exp])).toEqual([['doan_chang', 5], ['doan_giap', 6]])
    expect(d.dem('exp_so')).toBe(4) // không dòng nào của BOT
    expect(vi(d, 'S1')).toMatchObject({ wallet: 16, earned: 16, expGame: { ngay: NGAY, da: 16 } })
    expect(vi(d, 'S2').wallet).toBe(11)
  })

  it('3 sao đầu ngày = 15; 1 sao đầu ngày = 5, sau đó 3; gọi lại cùng chặng KHÔNG cộng đôi', async () => {
    const d = dung()
    luot(d, 'M1', 'S1', 1)
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: true, sao: 3, trumVoGiap: [] }))
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: true, sao: 3, trumVoGiap: [] }))
    expect(khoan(d, 'S1').map((x) => x.exp)).toEqual([15]); expect(vi(d, 'S1').wallet).toBe(15)
    luot(d, 'M2', 'S1', 1)
    await traoExpKetChang(d.env, 'M2', KET_LUC + 60_000, tt({ thang: true, sao: 1, trumVoGiap: [] }))
    expect(khoan(d, 'S1').map((x) => x.exp)).toEqual([15, 3]) // chặng thứ hai 1 sao = ceil(5/2) = 3
  })

  it('chặng THUA: không EXP chặng, vẫn +3 mỗi trùm vỡ giáp; thua không trùm ⇒ không khoản nào', async () => {
    const d = dung()
    luot(d, 'M1', 'S1', 0)
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: false, sao: 0, trumVoGiap: [true] }))
    expect(khoan(d, 'S1').map((x) => [x.loai, x.exp])).toEqual([['doan_giap', 3]])
    const e = dung(); luot(e, 'M1', 'S1', 0)
    await traoExpKetChang(e.env, 'M1', KET_LUC, tt({ thang: false, sao: 0, trumVoGiap: [] }))
    expect(khoan(e, 'S1')).toEqual([])
  })

  it('qua CỬA TRẦN 120 EXP game/ngày: đã nhận 118 ⇒ thắng 15 chỉ vào 2, vỡ giáp vào 0 (khoản ghi 0, đã xét); ngày mới trần mới', async () => {
    const d = dung()
    d.sql.prepare("UPDATE game_v2_profile SET json = json_set(json, '$.expGame', json(?)) WHERE sbd='S1'").run(JSON.stringify({ ngay: NGAY, da: 118 }))
    luot(d, 'M1', 'S1', 1)
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: true, sao: 3, trumVoGiap: [true] }))
    expect(khoan(d, 'S1').map((x) => [x.loai, x.exp])).toEqual([['doan_chang', 2], ['doan_giap', 0]])
    expect(vi(d, 'S1')).toMatchObject({ wallet: 2, expGame: { ngay: NGAY, da: 120 } })
    luot(d, 'M2', 'S1', 1, '2026-09-23')
    await traoExpKetChang(d.env, 'M2', Date.parse('2026-09-23T20:30:00+07:00'), tt({ thang: true, sao: 1, trumVoGiap: [] }))
    expect(khoan(d, 'S1').find((x) => x.khoa === 'S1|doan_chang|M2')!.exp).toBe(5)
  })

  it('EXP mới TẮT cho em ⇒ không ghi gì, không lỗi', async () => {
    const d = dung(false); luot(d, 'M1', 'S1', 1)
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: true, sao: 3, trumVoGiap: [true] }))
    expect(d.dem('exp_so')).toBe(0)
  })

  it('docExpKetChang trả các khoản của chặng cho màn kết chặng (thắng, vỡ giáp, tiếp sức); chặng khác không lẫn', async () => {
    const d = dung(); luot(d, 'M1', 'S1', 1); luot(d, 'M2', 'S1', 0)
    await traoExpKetChang(d.env, 'M1', KET_LUC, tt({ thang: true, sao: 2, trumVoGiap: [true] }))
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES('S1|tiepsuc|x|1','S1',?,'tiepsuc',NULL,'M1|1|2',5,?,'Tiếp sức đồng đội lần 1: +5')").run(NGAY, `${NGAY}T13:00:00.000Z`)
    d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES('S1|tiepsuc|x|2','S1',?,'tiepsuc',NULL,'M12|1|2',5,?,'khác')").run(NGAY, `${NGAY}T13:01:00.000Z`) // 'M12' không phải 'M1'
    const r = await docExpKetChang(d.env, 'S1', 'M1')
    expect(r.map((x) => [x.loai, x.exp])).toEqual([['tiepsuc', 5], ['doan_chang', 10], ['doan_giap', 3]]) // theo thời điểm ghi
    expect(await docExpKetChang(d.env, 'S1', 'M2')).toEqual([])
  })
})

describe('trần 4 chặng Đoàn mỗi ngày (1 miễn phí + tối đa 3 bằng vé)', () => {
  it('chặng đầu miễn phí; đã đi 4 chặng ⇒ chặng thứ 5 bị chặn bằng lời (dù còn vé); đã đi 3 chặng mà hết vé ⇒ lời hết vé cũ (không phải lời đủ 4 chặng)', async () => {
    expect(TOI_DA_CHANG_NGAY).toBe(4); expect(LOI_DU_CHANG_NGAY).toBe('Hôm nay em đã đi đủ 4 chặng. Mai đoàn lại lên đường.')
    const now = Date.parse(`${NGAY}T21:00:00+07:00`)
    const a = dung()
    expect(await quaCongVe(a.env, 'S1', 'MOI', now)).toEqual({ mienPhi: true })
    const d = dung()
    for (let i = 1; i <= 4; i++) luot(d, `C${i}`, 'S1', 1)
    d.sql.prepare("INSERT INTO doan_ve_so(khoa,sbd,ngay_vn,loai,so,ma_nguon,luc) VALUES('S1|ruong|x','S1',?,'ruong',5,'x',?)").run(NGAY, `${NGAY}T01:00:00.000Z`)
    await expect(quaCongVe(d.env, 'S1', 'MOI', now)).rejects.toThrow('đủ 4 chặng')
    const e = dung()
    for (let i = 1; i <= 3; i++) luot(e, `C${i}`, 'S1', 1)
    await expect(quaCongVe(e.env, 'S1', 'MOI', now)).rejects.toThrow(LOI_HET_VE)
  })
})
