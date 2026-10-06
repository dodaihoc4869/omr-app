// @vitest-environment node
// HUỶ CHIẾN DỊCH ⇒ LƯỢT GAME EM ĐANG MỞ (thầy 06/10: "hủy chiến dịch thì những học sinh đã phân phải đc thu hồi hết").
// Máy em đã tải sẵn câu của lượt Đảo / bàn Bi-a trước lúc thầy huỷ ⇒ em vẫn nộp được câu của chiến dịch đã huỷ. Nay lúc huỷ máy chủ đánh cờ `thuHoiLuc` vào JSON lượt
// (thu-hoi-chien-dich.ts); `answer` báo mã `cau_doi` đúng cho câu của chiến dịch bị huỷ (máy em tự sang câu kế, KHÔNG tính sai — cùng đường câu rút khỏi kho),
// `resume` / `complete` bỏ câu ấy. Lượt không dính chiến dịch / lượt Đoàn / em ngoài chiến dịch / lượt quá 2 giờ KHÔNG có cờ ⇒ không tốn thêm truy vấn nào.
// D1 THẬT (node:sqlite, lược đồ đủ migration) + R2 giả — cùng nền với tests/phien-ban-cau-tat-dinh-2909.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { syncIndex } from '../server/src/game-v2-bank'
import { gvChienDich } from '../server/src/srs2-gv'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { themChienDich } from './omni-3-ke-hoach-chung'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-10-06T21:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemChienDich() })
afterEach(() => vi.useRealTimers())

const MA = 'DE-Y'
const R2 = `kho/${MA}.json`
const DANG = { ma: 'ES.A.X', ten: 'Dạng X' }
const cauGoc = (): Record<string, unknown>[] => [
  { phan: 'I', so: 1, de: 'Câu I.1 của tờ', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'B', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
  { phan: 'I', so: 2, de: 'Câu I.2 của tờ', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'C', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
  { phan: 'III', so: 1, de: 'Nguyên tử Y có Z = 19. Y thuộc chu kỳ mấy trong bảng tuần hoàn?', dap_an: '4', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
]
const Q1 = `${MA}-I-1`, Q2 = `${MA}-I-2`, Q3 = `${MA}-III-1`
async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'10',3,?,0,'2026-10-06T08:00:00.000Z')").run(MA, MA, R2)
  for (const [s, ten] of [['S1', 'Em Một'], ['S2', 'Em Hai']]) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'10A','mk','x')").run(s, ten)
  d.objects.set(R2, { ma_de: MA, cau: cauGoc() })
  expect((await syncIndex(d.env)).remaining).toBe(0)
  return d
}
const versionCua = (d: D1That, qid: string) => (d.sql.prepare('SELECT version FROM game_v2_question WHERE ma_de=? AND qid=?').get(MA, qid) as { version: string }).version
/** Mở một lượt (Đảo / Bi-a / Đoàn) của `sbd` chứa các câu `qids` — như `start`. `tuoiMs` = lượt đã mở cách đây bấy nhiêu ms. */
function moLuot(d: D1That, id: string, qids: string[], o: { sbd?: string; them?: Record<string, unknown>; tuoiMs?: number; tc?: Record<string, string> } = {}) {
  const ref = (qid: string) => ({ qid, maDe: MA, version: versionCua(d, qid), group: 'g', novel: true, ...(o.tc?.[qid] ? { tc: o.tc[qid] } : {}) })
  const luc = T0 - (o.tuoiMs ?? 60_000)
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, o.sbd ?? 'S1', JSON.stringify({ mode: 'adventure', created: luc, hoa2: 1, questions: qids.map(ref), ...(o.them ?? {}) }), new Date(luc).toISOString())
  return id
}
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id=?').get(id) as { json: string }).json) as Record<string, unknown>
const traLoi = async (d: D1That, id: string, qid: string, answer: string, sbd = 'S1') => gameV2(d.env, 'answer', { token: await gameToken(d.env, sbd), session: id, qid, answer }) as Promise<{ ok: boolean; correct: boolean }>
const soLanTraLoi = (d: D1That) => Number((d.sql.prepare('SELECT COUNT(*) n FROM game_v2_attempt').get() as { n: number }).n)
/** Chiến dịch CD1 giao S1 một câu (Q1) rồi huỷ lúc `T0` (gọi qua đúng lệnh của thầy). */
async function huyCD1(d: D1That, qids = [Q1], sbd = ['S1'], id = 'CD1') {
  themChienDich(d, { id, maDe: [MA], qids, sbd, hanNop: '2026-10-12', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
  return gvChienDich(d.env, { action: 'huy', id }, T0)
}
const loiMa = async (p: Promise<unknown>): Promise<string | undefined> => p.then(() => undefined, (e: { ma?: string }) => e.ma)

describe('huỷ chiến dịch ⇒ lượt game đang mở của em được giao', () => {
  it('lượt có câu của chiến dịch được đánh cờ; lệnh huỷ báo số em và số lượt đã thu hồi', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q1, Q2, Q3])
    const r = await huyCD1(d) as { ok: boolean; thuHoi: { soEm: number; soLuotDangMo: number; nhaTick: boolean } }
    expect(r.ok).toBe(true)
    expect(r.thuHoi).toEqual({ soEm: 1, soLuotDangMo: 1, nhaTick: false })
    expect(phien(d, 'L1').thuHoiLuc).toBe(new Date(T0).toISOString())
  })

  it('em nộp CÂU CỦA CHIẾN DỊCH đã huỷ ⇒ mã cau_doi (máy em tự sang câu kế), KHÔNG ghi lần làm; các câu khác của lượt vẫn chấm bình thường', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q1, Q2, Q3])
    await huyCD1(d)
    const truoc = soLanTraLoi(d)
    expect(await loiMa(traLoi(d, 'L1', Q1, 'B'))).toBe('cau_doi')
    expect(soLanTraLoi(d)).toBe(truoc)
    expect((d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S1' AND qid=?").get(Q1) as { n: number }).n).toBe(0)
    const r2 = await traLoi(d, 'L1', Q2, 'C')
    expect(r2.ok).toBe(true); expect(r2.correct).toBe(true)
    const r3 = await traLoi(d, 'L1', Q3, '4')
    expect(r3.ok).toBe(true); expect(r3.correct).toBe(true)
  })

  it('lượt KHÔNG chứa câu của chiến dịch / em KHÔNG trong chiến dịch / lượt Đoàn / lượt quá 2 giờ ⇒ không có cờ, chấm như cũ (không tốn truy vấn thêm)', async () => {
    const d = await dung()
    moLuot(d, 'KHAC', [Q2, Q3])                                              // không có câu của chiến dịch
    moLuot(d, 'EM-HAI', [Q1, Q2], { sbd: 'S2' })                             // em ngoài chiến dịch
    moLuot(d, 'DOAN', [Q1, Q2], { them: { doan: 1 } })                       // lượt Đoàn do phòng quản
    moLuot(d, 'CU', [Q1, Q2], { tuoiMs: 3 * 3_600_000 })                     // đã quá 2 giờ (answer cũng báo hết hạn)
    const r = await huyCD1(d) as { thuHoi: { soLuotDangMo: number } }
    expect(r.thuHoi.soLuotDangMo).toBe(0)
    for (const id of ['KHAC', 'EM-HAI', 'DOAN', 'CU']) expect(phien(d, id).thuHoiLuc, id).toBeUndefined()
    expect((await traLoi(d, 'EM-HAI', Q1, 'B', 'S2')).correct).toBe(true) // S2 không được giao chiến dịch ⇒ câu vẫn của em ấy
  })

  it('câu ANH EM / bản song sinh làm thay câu của chiến dịch cũng bị thu hồi (khoá kế hoạch = câu lỗi `tc` hoặc phần trước "~")', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q2, Q3], { tc: { [Q2]: Q1 } }) // Q2 đứng thay Q1 (câu lỗi của chiến dịch)
    await huyCD1(d)
    expect(phien(d, 'L1').thuHoiLuc).toBeDefined()
    expect(await loiMa(traLoi(d, 'L1', Q2, 'C'))).toBe('cau_doi')
    expect((await traLoi(d, 'L1', Q3, '4')).correct).toBe(true)
  })

  it('lượt Bi-a (bia = 1) cũng được đánh cờ — mọi câu Bi-a nộp qua `answer`', async () => {
    const d = await dung()
    moLuot(d, 'BIA', [Q1, Q2], { them: { bia: 1, van: 'V1' } })
    await huyCD1(d)
    expect(phien(d, 'BIA').thuHoiLuc).toBeDefined()
    expect(await loiMa(traLoi(d, 'BIA', Q1, 'B'))).toBe('cau_doi')
  })

  it('`resume` trả lượt cũ nhưng BỎ câu của chiến dịch đã huỷ; lượt không dính chiến dịch trả đủ', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q1, Q2, Q3])
    const dayDu = await gameV2(d.env, 'resume', { token: await gameToken(d.env, 'S1') }) as { questions: { qid: string }[] }
    expect(dayDu.questions.map((q) => q.qid)).toEqual([Q1, Q2, Q3])
    await huyCD1(d)
    const sau = await gameV2(d.env, 'resume', { token: await gameToken(d.env, 'S1') }) as { questions: { qid: string }[] }
    expect(sau.questions.map((q) => q.qid)).toEqual([Q2, Q3])
  })

  it('`complete` KHÔNG đòi câu đã thu hồi: em làm đủ các câu còn lại là kết thúc được lượt', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q1, Q2, Q3])
    await huyCD1(d)
    await traLoi(d, 'L1', Q2, 'C'); await traLoi(d, 'L1', Q3, '4')
    const r = await gameV2(d.env, 'complete', { token: await gameToken(d.env, 'S1'), session: 'L1' }) as { ok: boolean; total: number; correct: number }
    expect(r.ok).toBe(true)
    expect(r.total).toBe(2)
    // đối chứng: lượt CHƯA bị thu hồi mà em bỏ câu ⇒ vẫn bị đòi như cũ
    moLuot(d, 'L2', [Q1, Q2, Q3], { sbd: 'S2' })
    await traLoi(d, 'L2', Q2, 'C', 'S2')
    await expect(gameV2(d.env, 'complete', { token: await gameToken(d.env, 'S2'), session: 'L2' })).rejects.toThrow('Em cần hoàn thành các câu trong lượt.')
  })

  it('huỷ hai chiến dịch liên tiếp: cờ giữ lúc SỚM NHẤT nên câu của CẢ HAI đều bị thu hồi', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q1, Q2, Q3])
    await huyCD1(d, [Q1], ['S1'], 'CD1')
    const luc1 = phien(d, 'L1').thuHoiLuc
    vi.setSystemTime(T0 + 60_000)
    themChienDich(d, { id: 'CD2', maDe: [MA], qids: [Q2], sbd: ['S1'], hanNop: '2026-10-12', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
    await gvChienDich(d.env, { action: 'huy', id: 'CD2' }, T0 + 60_000)
    expect(phien(d, 'L1').thuHoiLuc).toBe(luc1)
    expect(await loiMa(traLoi(d, 'L1', Q1, 'B'))).toBe('cau_doi')
    expect(await loiMa(traLoi(d, 'L1', Q2, 'C'))).toBe('cau_doi')
    expect((await traLoi(d, 'L1', Q3, '4')).correct).toBe(true)
  })

  it('KẾT THÚC (dong) KHÔNG thu hồi lượt đang mở: em làm nốt lượt như cũ', async () => {
    const d = await dung()
    moLuot(d, 'L1', [Q1, Q2, Q3])
    themChienDich(d, { id: 'CD1', maDe: [MA], qids: [Q1], sbd: ['S1'], hanNop: '2026-10-12', taoLuc: '2026-10-05T01:00:00.000Z', theLuc: 40 })
    await gvChienDich(d.env, { action: 'dong', id: 'CD1' }, T0)
    expect(phien(d, 'L1').thuHoiLuc).toBeUndefined()
    expect((await traLoi(d, 'L1', Q1, 'B')).correct).toBe(true)
  })
})
