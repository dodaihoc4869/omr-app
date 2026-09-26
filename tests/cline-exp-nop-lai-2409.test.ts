// @vitest-environment node
// LÁT CẮT 3 — EXP / NỘP LẠI / MẤT MẠNG (thầy 24/09: chỉ 3 nhóm; nhóm 3 = EXP phần thưởng nộp lại mất mạng).
// CA ĐƯỜNG THẬT: `POST /hs/on-lai/nop` trên D1 THẬT + dữ liệu TỔNG HỢP — đúng chuỗi
// "route → chấm tại máy chủ → ghi sổ → đọc lại kết quả lần đầu → cộng EXP/ví".
// Bắt buộc kiểm: RETRY cùng yêu cầu trả ĐÚNG kết quả cũ và KHÔNG cộng EXP lần hai; CẠNH TRANH cũng vậy; sổ chỉ MỘT dòng cho (em, qid, nguồn, ngày).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'
import { ghiSuKien } from '../server/src/su-kien-hoc'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const cau = (qid: string) => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [],
  hinhAnh: [], dang: 'A.1', tenDang: 'Dạng A.1', mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: 'B', solution: `LG-${qid}`, reviewed: true,
})

function dung(soA = 12): D1That {
  const d = taoD1That()
  const ds = Array.from({ length: soA }, (_, i) => cau(`A-${i}`))
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,'kho/DE1.json',0,'v1')").run(ds.length)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ds) them.run('DE1', q.qid, q.version, q.group, q.dang, JSON.stringify(q))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
    .run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  daHocDang(d, 'S1', 'A.1')
  return d
}
const token = (d: D1That) => gameToken(d.env, 'S1')
/** Câu chỉ được phục vụ khi em ĐÃ GẶP (`su_kien_hoc`): dựng một lần SAI ở nguồn BTVN hôm trước — đúng cảnh "ôn lại câu từng sai". */
async function coCauDaGap(d: D1That, qid: string) {
  const r = await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'B1', sbd: 'S1', qid, lan: 1, ketQua: 0, luc: new Date(T0 - 86_400_000).toISOString() }])
  expect(r.ok).toBe(true)
}
/** Nộp bài làm các câu ôn lại qua ĐÚNG route; `traLoi` là mảng {qid,dapAn,giay?}. */
const nop = async (d: D1That, traLoi: unknown, t?: string) =>
  (await goiWorker(worker, d.env, '/hs/on-lai/nop', { token: t ?? (await token(d)), traLoi })) as Record<string, any>
const demSo = (d: D1That, qid: string) => (d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd='S1' AND qid=? AND nguon='on_lai'").get(qid) as { n: number }).n
const demExpSo = (d: D1That) => (d.sql.prepare("SELECT COUNT(*) AS n FROM exp_so WHERE sbd='S1'").get() as { n: number }).n
/** Tổng EXP đang nằm trong hồ sơ game (ví + đã hấp thụ) — đọc THẲNG từ đĩa, không tin phản hồi. */
const expHoSo = (d: D1That) => {
  const r = d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }
  const p = JSON.parse(r.json) as { exp?: number; wallet?: number; earned?: number }
  return (Number(p.exp) || 0) + (Number(p.wallet) || 0) + (Number(p.earned) || 0)
}
const TRA_LOI = [{ qid: 'A-5', dapAn: 'B', giay: 30 }]

describe('LÁT 3 · /hs/on-lai/nop: RETRY cùng yêu cầu trả receipt cũ, KHÔNG cộng hai lần', () => {
  it('nộp hai lần cùng câu: kết quả y hệt lần đầu, sổ một dòng, EXP không gấp đôi', async () => {
    const d = dung()
    await coCauDaGap(d, 'A-5')
    const t = await token(d)
    const a = await nop(d, TRA_LOI, t)
    expect(a.ok).toBe(true)
    expect(a.ketQua?.[0]).toMatchObject({ qid: 'A-5', dung: true })
    expect(demSo(d, 'A-5')).toBe(1)
    const exp1 = expHoSo(d), dong1 = demExpSo(d)
    const b = await nop(d, TRA_LOI, t)
    expect(b.ok).toBe(true)
    expect(b.ketQua?.[0]).toMatchObject({ qid: 'A-5', dung: a.ketQua[0].dung })
    expect(demSo(d, 'A-5')).toBe(1)                     // khoá (em, nguồn, ngày, qid, lần 1) ⇒ không ghi thêm
    expect(expHoSo(d)).toBe(exp1)                       // KHÔNG cộng EXP lần hai
    expect(demExpSo(d)).toBe(dong1)                     // KHÔNG thêm khoản sổ EXP
  })

  it('CẠNH TRANH: hai yêu cầu SONG SONG cũng chỉ một dòng sổ, EXP không gấp đôi', async () => {
    // Mốc tự hiệu chỉnh: đo ĐÚNG mức EXP của MỘT lần nộp trên D1 song sinh cùng fixture (không phụ thuộc con số tuyệt đối của luật EXP).
    const mot = dung()
    await coCauDaGap(mot, 'A-5')
    const e0 = expHoSo(mot)
    expect((await nop(mot, TRA_LOI, await token(mot))).ok).toBe(true)
    const motLan = expHoSo(mot) - e0

    const d = dung()
    await coCauDaGap(d, 'A-5')
    const t = await token(d)
    const g0 = expHoSo(d)
    const [a, b] = await Promise.all([nop(d, TRA_LOI, t), nop(d, TRA_LOI, t)])
    expect([a, b].filter((r) => r.ok === true).length).toBe(2)
    expect(demSo(d, 'A-5')).toBe(1)                       // sổ chỉ một dòng cho (em, qid, nguồn, ngày, lần 1)
    expect(expHoSo(d) - g0).toBe(motLan)                  // hai lượt song song ≠ cộng EXP hai lần
  })

  it('NHIỀU THIẾT BỊ / đáp án mâu thuẫn: máy thứ hai nộp đáp án KHÁC vẫn nhận ĐÚNG kết quả lần đầu, không thêm dòng', async () => {
    const d = dung()
    await coCauDaGap(d, 'A-5')
    const t = await token(d)
    const a = await nop(d, TRA_LOI, t) // đáp án đúng 'B'
    expect(a.ketQua?.[0]).toMatchObject({ qid: 'A-5', dung: true })
    const b = await nop(d, [{ qid: 'A-5', dapAn: 'A', giay: 10 }], t) // máy khác gửi đáp án SAI
    expect(b.ok).toBe(true)
    expect(b.ketQua?.[0]).toMatchObject({ qid: 'A-5', dung: true }) // giữ lần ĐẦU, không đổi điểm theo máy sau
    expect(demSo(d, 'A-5')).toBe(1)
  })
})
