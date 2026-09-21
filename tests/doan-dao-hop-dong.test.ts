// @vitest-environment node
// Hợp đồng máy chủ cho ĐẢO THẦN THÚ bản mới (Code 6): `start` trả `role` từng câu, `answer` trả `lyDoThuong`. KHÔNG đổi cách chọn câu / chấm / thưởng.
import { describe, it, expect } from 'vitest'
import { chooseSession, chooseSessionWithRoles, DAY, type Attempt, type Evidence, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { lyDoThuong } from '../src/game/than-thu-v2/ly-do-thuong'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { taoD1That } from './_d1-that'

const q = (i: number, o: Partial<PrivateQuestion> = {}): PrivateQuestion => ({ qid: `Q${i}`, maDe: 'D', version: 'v', group: `g${i}`, phan: 'I', text: 't', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: `D${i % 4}`, tenDang: 'x', mucDo: 'biet', sao: 1, kienThuc: ['K'], correct: 'A', solution: null, reviewed: true, ...o })
const NOW = 1_800_000_000_000
describe('Đảo thần thú · vai của từng câu', () => {
  const pool = [...Array.from({ length: 16 }, (_, i) => q(i)), q(90, { dang: 'D0', mucDo: 'hieu' })]
  const evidence: Evidence[] = [{ qid: 'Q0', group: 'g0', dang: 'D0', mucDo: 'biet', kienThuc: ['K'], wrong: true, date: 'x', ca: 'c' }]
  const mastery = [{ key: 'D1', stage: 1, first: 1, due: NOW - DAY, groups: ['cu'], repaired: false }]
  it('chooseSession KHÔNG đổi: cùng danh sách, cùng thứ tự với bản có vai', () => {
    for (const mode of ['adventure', 'repair', 'arena'] as const) expect(chooseSessionWithRoles(pool, evidence, [], mastery, mode, NOW).map(x => x.q.qid)).toEqual(chooseSession(pool, evidence, [], mastery, mode, NOW).map(x => x.qid))
  })
  it('đúng bốn suất của công thức: yếu (≤2) → tới hạn (≤1) → lấp → thử thách (≤1, khó hơn đúng một bậc); chế độ khắc phục toàn "yeu"', () => {
    const ra = chooseSessionWithRoles(pool, evidence, [], mastery, 'adventure', NOW), vai = ra.map(x => x.role)
    expect(ra).toHaveLength(6); expect(vai.filter(v => v === 'yeu').length).toBeLessThanOrEqual(2); expect(vai.filter(v => v === 'toi_han')).toHaveLength(1); expect(vai.filter(v => v === 'thu_thach')).toHaveLength(1)
    expect(ra.filter(x => x.role === 'yeu').every(x => x.q.dang === 'D0')).toBe(true); expect(ra.find(x => x.role === 'toi_han')!.q.dang).toBe('D1'); expect(ra.find(x => x.role === 'thu_thach')!.q.qid).toBe('Q90')
    expect(new Set(vai.filter(v => !['yeu', 'toi_han', 'thu_thach'].includes(v)))).toEqual(new Set(['lap']))
    expect(chooseSessionWithRoles(pool, evidence, [], mastery, 'repair', NOW).every(x => x.role === 'yeu')).toBe(true)
  })
})
describe('Đảo thần thú · lý do thưởng (chữ sẵn in, khớp mốc 20/40/40 của advance)', () => {
  it('bảng', () => {
    expect(lyDoThuong({ correct: true, assisted: false, reward: 20, milestone: 1, stage: 1 })).toEqual({ moc: 1, exp: 20, chu: '+20 EXP · lần đầu em tự làm đúng dạng này — sao thứ 1' })
    expect(lyDoThuong({ correct: true, assisted: false, reward: 40, milestone: 2, stage: 2 })).toMatchObject({ moc: 2, exp: 40 }); expect(lyDoThuong({ correct: true, assisted: false, reward: 40, milestone: 2, stage: 2 }).chu).toContain('sao thứ 2'); expect(lyDoThuong({ correct: true, assisted: false, reward: 40, milestone: 3, stage: 3 }).chu).toContain('sao thứ 3')
    expect(lyDoThuong({ correct: true, assisted: true, reward: 0, milestone: 0, stage: 1 })).toMatchObject({ moc: 0, exp: 0 }); expect(lyDoThuong({ correct: true, assisted: true, reward: 0, milestone: 0, stage: 1 }).chu).toContain('trợ giúp')
    expect(lyDoThuong({ correct: false, assisted: false, reward: 0, milestone: 0, stage: 1 }).chu).toContain('Chưa đúng')
    expect(lyDoThuong({ correct: true, assisted: false, reward: 0, milestone: 0, stage: 1 }).chu).toContain('sao thứ 2 mở khi'); expect(lyDoThuong({ correct: true, assisted: false, reward: 0, milestone: 0, stage: 3 }).chu).toContain('đủ 3 sao')
    for (const d of [{ correct: true, assisted: false, reward: 20, milestone: 1, stage: 1 }, { correct: false, assisted: false, reward: 0, milestone: 0, stage: 0 }]) expect(lyDoThuong(d).chu).not.toMatch(/nắm chắc|giỏi|yếu kém/i)
  })
})

describe('Đảo thần thú · lệnh đọc-chỉ so-tay + role/lyDoThuong qua máy chủ thật (SQLite)', () => {
  it('so-tay chỉ liệt kê dạng em ĐƯỢC PHÉP làm (có bằng chứng), kèm tên + mã chương; start trả role, answer trả lyDoThuong; không ghi gì', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',9,'k',0,'v1')").run(); d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
    for (let i = 0; i < 9; i++) { const es = i < 6, x = q(i, { maDe: 'DE1', version: 'v1', dang: es ? 'ES.A.X' : 'AN.B.Y', tenDang: es ? 'Ester' : 'Ancol' }); d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', x.qid, 'v1', x.group, x.dang, JSON.stringify(x)) }
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','x','mk','x')").run()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
    await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: 'Q0', lan: 1, ketQua: 0, luc: new Date(Date.now() - 72 * 3_600_000).toISOString(), maDang: 'ES.A.X' }]); await dungLaiHoSo(d.env, ['S1'], new Date().toISOString())
    const token = await gameToken(d.env, 'S1'), truoc = (d.sql.prepare('SELECT COUNT(*) n FROM game_v2_session').get() as any).n
    expect(await gameV2(d.env, 'so-tay', { token })).toEqual({ ok: true, dang: [{ key: 'ES.A.X', ten: 'Ester', chuong: 'ES' }] }) // Ancol chưa có bằng chứng → không lộ
    expect((d.sql.prepare('SELECT COUNT(*) n FROM game_v2_session').get() as any).n).toBe(truoc)
    const st = await gameV2(d.env, 'start', { token, mode: 'adventure' }) as any
    expect(st.questions.length).toBeGreaterThan(0); for (const x of st.questions) { expect(['yeu', 'toi_han', 'lap', 'thu_thach', 'moi', 'trum']).toContain(x.role) /* Đợt 2 (21/09): bộ chọn lượt mới thêm vai 'moi' (câu chưa từng gặp) và 'trum' */; expect(x.correct).toBeUndefined() }
    const dau = st.questions[0], tl = await gameV2(d.env, 'answer', { token, session: st.id, qid: dau.qid, answer: 'A' }) as any
    expect(tl.lyDoThuong).toEqual({ moc: 1, exp: 10, chu: '+10 EXP · lần đầu em tự làm đúng dạng này — sao thứ 1' }) // sửa có chủ ý 21/09: nấc 1 thưởng 20 → 10
  })
})
