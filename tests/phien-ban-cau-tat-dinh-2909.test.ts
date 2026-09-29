// @vitest-environment node
// LỖI THẦY BÁO 21:15 (29/09): em ở Đảo 2 chốt câu trả lời ngắn "Nguyên tử Y có Z = 19. Y thuộc chu kỳ mấy…" → báo đỏ
// "Câu đã được sửa hoặc rút khỏi kho", dù câu KHÔNG hề bị rút. Nguyên nhân gốc: `syncIndex` lập lại chỉ mục một tờ thì gán
// `version = crypto.randomUUID()` MỚI cho MỌI câu của tờ ⇒ chỉ cần sửa 1 câu KHÁC (hoặc thêm lời giải) là mọi lượt đang mở
// chứa bất kỳ câu nào của tờ ấy chết; và trong khoảng `de_kho.cap_nhat_luc` đã đổi mà chỉ mục chưa đồng bộ thì chấm hỏng ngay.
// Sửa: version TẤT ĐỊNH theo nội dung chấm (đề hiển thị + đáp án, KHÔNG gồm lời giải); chỉ mục lệch ⇒ tự đồng bộ đúng tờ đó rồi tra lại.
// Chạy trên SQLite thật (node:sqlite) với lược đồ thật + R2 giả (`_d1-that.ts`).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { docCauTheoRef, syncIndex } from '../server/src/game-v2-bank'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-29T21:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const MA = 'DE-Y'
const R2 = `kho/${MA}.json`
type Tho = Record<string, unknown>
const DANG = { ma: 'ES.A.X', ten: 'Dạng X' }
const cauGoc = (): Tho[] => [
  { phan: 'I', so: 1, de: 'Câu I.1 của tờ', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'B', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
  { phan: 'I', so: 2, de: 'Câu I.2 của tờ', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'C', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
  { phan: 'III', so: 1, de: 'Nguyên tử Y có Z = 19. Y thuộc chu kỳ mấy trong bảng tuần hoàn?', dap_an: '4', dang: DANG, chuyen_de: 'CD1', muc_do: 'biet' },
]
const Q3 = `${MA}-III-1`
let nhip = 0
/** Ghi lại gói R2 + đổi `cap_nhat_luc` như đường /kho/nap thật (sửa câu, ghi lời giải…). */
function ghiKho(d: D1That, cau: Tho[]) {
  d.objects.set(R2, { ma_de: MA, cau })
  d.sql.prepare('UPDATE de_kho SET cap_nhat_luc=? WHERE ma_de=?').run(`2026-09-29T20:${String(10 + ++nhip).padStart(2, '0')}:00.000Z`, MA)
}
async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'10',3,?,0,'2026-09-29T08:00:00.000Z')").run(MA, MA, R2)
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','10A','mk','x')").run()
  d.objects.set(R2, { ma_de: MA, cau: cauGoc() })
  expect((await syncIndex(d.env)).remaining).toBe(0)
  return d
}
const versionCua = (d: D1That, qid: string) => (d.sql.prepare('SELECT version FROM game_v2_question WHERE ma_de=? AND qid=?').get(MA, qid) as { version: string }).version
/** Mở một lượt Đảo chứa đúng các câu của tờ, ghi phiên bản câu LÚC MỞ (như `start`). */
function moLuot(d: D1That, id = 'LUOT-1') {
  const ref = (qid: string) => ({ qid, maDe: MA, version: versionCua(d, qid), group: 'g', novel: true })
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: [ref(`${MA}-I-1`), ref(`${MA}-I-2`), ref(Q3)] }), new Date().toISOString())
  return id
}
const traLoi = async (d: D1That, id: string, qid: string, answer: string) => gameV2(d.env, 'answer', { token: await gameToken(d.env, 'S1'), session: id, qid, answer }) as Promise<{ ok: boolean; correct: boolean; solution: unknown }>

describe('Phiên bản câu tất định — lượt đang mở không chết khi kho được ghi lại (29/09)', () => {
  it('sửa một câu KHÁC của tờ rồi đồng bộ ⇒ câu Z = 19 vẫn chấm được', async () => {
    const d = await dung(); const id = moLuot(d)
    const cau = cauGoc(); cau[1] = { ...cau[1], de: 'Câu I.2 của tờ (đã sửa chính tả)' }
    ghiKho(d, cau); await syncIndex(d.env)
    const r = await traLoi(d, id, Q3, '4')
    expect(r.ok).toBe(true); expect(r.correct).toBe(true)
  })

  it('chỉ thêm lời giải ⇒ version giữ nguyên, chấm được và trả lời giải MỚI NHẤT', async () => {
    const d = await dung(); const id = moLuot(d); const v0 = versionCua(d, Q3)
    const cau = cauGoc(); cau[2] = { ...cau[2], loi_giai: { noi_dung: 'Z = 19: 1s²2s²2p⁶3s²3p⁶4s¹ ⇒ 4 lớp electron ⇒ chu kỳ 4.' } }
    ghiKho(d, cau); await syncIndex(d.env)
    expect(versionCua(d, Q3)).toBe(v0)
    const r = await traLoi(d, id, Q3, '4')
    expect(r.correct).toBe(true)
    expect(JSON.stringify(r.solution)).toContain('chu kỳ 4')
  })

  it('kho vừa ghi mà chỉ mục CHƯA đồng bộ ⇒ tự đồng bộ đúng tờ đó rồi chấm (không báo đỏ)', async () => {
    const d = await dung(); const id = moLuot(d)
    const cau = cauGoc(); cau[0] = { ...cau[0], de: 'Câu I.1 viết lại' }
    ghiKho(d, cau) // KHÔNG gọi syncIndex
    const r = await traLoi(d, id, Q3, '4')
    expect(r.correct).toBe(true)
    const lech = d.sql.prepare('SELECT COUNT(*) n FROM de_kho d JOIN game_v2_index g ON g.ma_de=d.ma_de WHERE g.source_version<>d.cap_nhat_luc').get() as { n: number }
    expect(lech.n).toBe(0)
    // câu vừa đổi đề thì lượt cũ KHÔNG chấm theo bản cũ
    await expect(traLoi(d, id, `${MA}-I-1`, 'B')).rejects.toMatchObject({ ma: 'cau_doi' })
  })

  it('câu thật sự đổi ĐÁP ÁN ⇒ lượt cũ báo như cũ (không chấm theo đáp án cũ), có mã cau_doi', async () => {
    const d = await dung(); const id = moLuot(d)
    const cau = cauGoc(); cau[2] = { ...cau[2], dap_an: '5' }
    ghiKho(d, cau); await syncIndex(d.env)
    await expect(traLoi(d, id, Q3, '4')).rejects.toThrow('rút khỏi kho')
    await expect(traLoi(d, id, Q3, '4')).rejects.toMatchObject({ ma: 'cau_doi' })
  })

  it('lập lại chỉ mục không đổi gì ⇒ mọi version giữ nguyên; tờ bị xoá ⇒ tra theo ref ra null', async () => {
    const d = await dung()
    const truoc = d.sql.prepare('SELECT qid,version FROM game_v2_question ORDER BY qid').all()
    ghiKho(d, cauGoc()); await syncIndex(d.env)
    expect(d.sql.prepare('SELECT qid,version FROM game_v2_question ORDER BY qid').all()).toEqual(truoc)
    const ref = { maDe: MA, qid: Q3, version: versionCua(d, Q3) }
    expect((await docCauTheoRef(d.env, ref))?.correct).toBe('4')
    d.sql.prepare('UPDATE de_kho SET da_xoa=1 WHERE ma_de=?').run(MA)
    expect(await docCauTheoRef(d.env, ref)).toBeNull()
  })

  it('câu đổi ĐÁP ÁN giữa lượt ⇒ máy em bỏ qua được: resume không trả câu ấy, complete không đòi câu ấy', async () => {
    const d = await dung(); const id = moLuot(d)
    const cau = cauGoc(); cau[0] = { ...cau[0], dap_an: 'D' }
    ghiKho(d, cau); await syncIndex(d.env)
    const token = await gameToken(d.env, 'S1')
    const r = await gameV2(d.env, 'resume', { token }) as { id: string; questions: { qid: string }[] }
    expect(r.id).toBe(id)
    expect(r.questions.map(q => q.qid)).toEqual([`${MA}-I-2`, Q3])
    await traLoi(d, id, `${MA}-I-2`, 'C'); await traLoi(d, id, Q3, '4')
    expect(await gameV2(d.env, 'complete', { token, session: id })).toMatchObject({ ok: true })
  })
})
