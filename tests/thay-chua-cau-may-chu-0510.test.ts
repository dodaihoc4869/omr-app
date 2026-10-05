// @vitest-environment node
// MÁY CHỦ `/gv/thay-chua-cau` (thầy 05/10, nút "Thầy chữa" trên tờ chiếu Gọi lên bảng / Dạy học): ghi nhãn `thay_da_chua`
// + mốc dạy lại `srs2_day_lai` — cùng hai thứ ô "Thầy đã chữa" của đầu giờ ghi. Idempotent, chỉ thầy, nguồn hợp lệ.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

describe('/gv/thay-chua-cau', () => {
  it('ghi nhãn + mốc dạy lại; gọi lại không ghi thêm; nguồn lạ / thiếu em ⇒ từ chối; không phải thầy ⇒ từ chối', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const g = (b: Record<string, unknown>, thay = true) => goiWorker(worker, env, '/gv/thay-chua-cau', b, thay)
    expect((await g({ sbd: '11072', qid: 'DE-A-I-17', nguon: 'len_bang', maNguon: '648412' }, false)).ok).toBe(false)
    const r = await g({ sbd: '11072', qid: 'DE-A-I-17', nguon: 'len_bang', maNguon: '648412' })
    expect(r.ok).toBe(true)
    expect(r.daCoTruoc).toBeUndefined()
    expect(d.sql.prepare('SELECT sbd, qid, nguon, ma_nguon FROM thay_da_chua').all()).toEqual([{ sbd: '11072', qid: 'DE-A-I-17', nguon: 'len_bang', ma_nguon: '648412' }])
    expect(d.sql.prepare('SELECT sbd, qid FROM srs2_day_lai').all()).toEqual([{ sbd: '11072', qid: 'DE-A-I-17' }])
    expect(await g({ sbd: '11072', qid: 'DE-A-I-17', nguon: 'len_bang', maNguon: '648412' })).toMatchObject({ ok: true, daCoTruoc: true })
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM srs2_day_lai').get()).toEqual({ n: 1 })
    expect((await g({ sbd: '11072', qid: 'DE-A-I-17', nguon: 'chien_dich', maNguon: 'x' })).ok).toBe(false)
    expect((await g({ qid: 'DE-A-I-17', nguon: 'day_hoc', maNguon: 'b1' })).ok).toBe(false)
    expect((await g({ sbd: '11072', qid: 'DE-A-I-17', nguon: 'day_hoc', maNguon: 'buoi-1' })).ok).toBe(true)
  })
})
