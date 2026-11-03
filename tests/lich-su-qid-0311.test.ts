// @vitest-environment node
// NHÃN «ĐÃ LÀM ĐÚNG / SAI» (thầy 03/11): server/src/lich-su-qid.ts — đếm theo sổ su_kien_hoc trên lược đồ THẬT (SQLite trong bộ nhớ).
import { describe, expect, it } from 'vitest'
import { demLichSuQid, gvLichSuCaEm } from '../server/src/lich-su-qid'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

function dung() {
  const d = taoD1That()
  let n = 0
  const sk = (sbd: string, qid: string, nguon: string, ma: string, kq: number | null, luc: string, ex: { assistance?: string; purpose?: string; visibility?: string } = {}) =>
    d.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, luc, ngay_vn, assistance, purpose, visibility) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(`k${++n}`, sbd, qid, nguon, ma, kq, luc, luc.slice(0, 10), ex.assistance ?? null, ex.purpose ?? null, ex.visibility ?? null)
  return { d, sk, env: d.env as unknown as Env }
}

describe('demLichSuQid', () => {
  it('đếm sai / đúng + lần cuối; bỏ trống, đọc lời giải, chưa công bố KHÔNG tính; loại lần làm hiện tại', async () => {
    const { sk, env } = dung()
    sk('S1', 'Q1', 'game', 'A', 0, '2026-10-01T01:00:00Z')
    sk('S1', 'Q1', 'game', 'B', 0, '2026-10-02T01:00:00Z')
    sk('S1', 'Q1', 'thi', 'CA1', 1, '2026-10-03T01:00:00Z')
    sk('S1', 'Q1', 'game', 'C', null, '2026-10-04T01:00:00Z') // bỏ trống
    sk('S1', 'Q1', 'on_lai', 'D', 0, '2026-10-05T01:00:00Z', { assistance: 'assisted', purpose: 'xem_loi_giai' }) // đọc lời giải
    sk('S1', 'Q1', 'thi', 'CA2', 0, '2026-10-06T01:00:00Z', { visibility: 'hidden' }) // ca chưa công bố
    sk('S2', 'Q1', 'game', 'A', 0, '2026-10-01T01:00:00Z') // em khác
    sk('S1', 'Q2', 'game', 'A', 1, '2026-10-01T01:00:00Z')
    expect(await demLichSuQid(env, 'S1', ['Q1', 'Q2', 'Q3'])).toEqual({ Q1: [2, 1, 1], Q2: [0, 1, 1] })
    // lần cuối = dòng mới nhất (CA1 đúng); trừ ca hiện tại CA1 ⇒ còn 2 sai, 0 đúng, lần cuối sai
    expect(await demLichSuQid(env, 'S1', ['Q1'], { nguon: 'thi', maNguon: 'CA1' })).toEqual({ Q1: [2, 0, 0] })
  })
})

describe('gvLichSuCaEm', () => {
  it('mỗi em: số lần từng sai / đúng đúng những câu em có trong ca (trừ chính ca)', async () => {
    const { d, sk, env } = dung()
    const ct = (sbd: string, qid: string, so: number) => d.sql.prepare("INSERT INTO chi_tiet_cau (khoa, ma_ca, sbd, lan_thu, phan, so_cau, qid, cap_nhat_luc) VALUES (?,?,?,1,'I',?,?,'2026-10-02T00:00:00Z')").run(`${sbd}-${so}`, 'CA1', sbd, so, qid)
    ct('S1', 'Q1', 1); ct('S1', 'Q2', 2); ct('S2', 'Q1', 1)
    sk('S1', 'Q1', 'game', 'A', 0, '2026-10-01T01:00:00Z'); sk('S1', 'Q2', 'game', 'A', 1, '2026-10-01T01:00:00Z'); sk('S1', 'Q1', 'thi', 'CA1', 0, '2026-10-02T01:00:00Z')
    sk('S2', 'Q9', 'game', 'A', 0, '2026-10-01T01:00:00Z') // câu ngoài ca ⇒ không tính
    expect(await gvLichSuCaEm(env, { maCa: 'CA1' })).toEqual({ ok: true, ds: { S1: [1, 1] } })
  })
})
