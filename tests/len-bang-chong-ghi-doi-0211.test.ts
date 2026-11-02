// @vitest-environment node
// CHỐNG GHI ĐÔI LÊN BẢNG (02/11, số thật: 158/159 lượt có hai dòng cách nhau ~0,85 giây — app thầy gửi lệnh cũ `action: ghiLenBang` tới chính Worker rồi
// «soi» thêm `/len-bang`). Cùng em · câu · chuyên đề · kết quả trong 10 giây = MỘT lần: một dòng `len_bang`, một dòng sổ, một lần `qid_da_lam`.
import { describe, it, expect, vi, afterEach } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const moi = (d: D1That, o: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'Este', qid: 'Q1', dat: false, ...o }, true)
const cu = (d: D1That, o: Record<string, unknown> = {}) => goiWorker(worker, d.env, '/goi', { action: 'ghiLenBang', sbd: 'S1', chuyenDe: 'Este', qid: 'Q1', dat: false, ...o }, true)
const dem = (d: D1That, bang: string, dk = '1') => (d.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${dk}`).get() as { n: number }).n

afterEach(() => { vi.useRealTimers() })

describe('POST /len-bang chống ghi đôi', () => {
  it('đường cũ (action ghiLenBang) rồi đường mới (/len-bang) cùng lượt ⇒ MỘT dòng mỗi bảng', async () => {
    const d = taoD1That()
    expect(await cu(d)).toMatchObject({ ok: true })
    expect(await moi(d)).toMatchObject({ ok: true })
    expect(dem(d, 'len_bang')).toBe(1)
    expect(dem(d, 'su_kien_hoc', "nguon = 'len_bang'")).toBe(1)
    expect(d.sql.prepare("SELECT so_lan FROM qid_da_lam WHERE sbd = 'S1' AND qid = 'Q1'").get()).toEqual({ so_lan: 1 })
  })
  it('khác câu / khác em / khác kết quả / khác chuyên đề ⇒ vẫn ghi đủ', async () => {
    const d = taoD1That()
    for (const o of [{}, { qid: 'Q2' }, { sbd: 'S2' }, { dat: true }, { chuyenDe: 'Amin' }]) expect(await moi(d, o)).toMatchObject({ ok: true })
    expect(dem(d, 'len_bang')).toBe(5)
  })
  it('cùng em cùng câu gọi lại sau hơn 10 giây ⇒ là lần mới, ghi', async () => {
    const d = taoD1That()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-02T10:00:00.000Z'))
    await moi(d)
    vi.setSystemTime(new Date('2026-11-02T10:00:09.000Z'))
    await moi(d)
    expect(dem(d, 'len_bang')).toBe(1)
    vi.setSystemTime(new Date('2026-11-02T10:00:11.000Z'))
    await moi(d)
    expect(dem(d, 'len_bang')).toBe(2)
  })
})
