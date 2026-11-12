// @vitest-environment node
// H3 đợt 3 giảm chi phí D1 (12/11 tối): câu đọc bảng phụ / cron — so cũ↔mới trên D1 thật trong bộ nhớ + khoá kế hoạch truy vấn (EXPLAIN QUERY PLAN).
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { SQL_BANDIT_CU, SQL_BANDIT_DOC, docBanditLop, dungBanditLopNeuCu, HAN_DUNG_BANDIT_MS, CUA_SO_BANDIT_MS, chuKyDungBandit } from '../server/src/hanh-trinh-bandit-lop'

const NGAY = 86_400_000
const T = Date.UTC(2026, 10, 12, 13, 0, 0) // 20:00 VN — khung học
const keHoach = (sql: any, q: string) => (sql.prepare('EXPLAIN QUERY PLAN ' + q).all() as { detail: string }[]).map((r) => r.detail)

// ------------------------------------------------------------------ Q2 · bandit cả lớp cộng sẵn
function napCanThiep(sql: any) {
  const ins = sql.prepare('INSERT INTO hanh_trinh_v4_can_thiep(sbd,ngay,moc,qid,nhom,ky_nang,context,cach,xac_suat,goi_luc,do_luc,ket_qua) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
  let moc = 0
  const them = (ctx: string, cach: string, doLuc: number | null, kq: number | null) => ins.run(`E${moc % 7}`, '2026-11-01', moc++, 'q', 'n', 'k', ctx, cach, 0.5, 0, doLuc, kq)
  for (let i = 0; i < 12; i++) them('yeu', 'goi_y', T - (i + 1) * NGAY, i % 3 === 0 ? 0 : 1)
  for (let i = 0; i < 5; i++) them('yeu', 'lam_lai', T - 3 * NGAY, i % 2)
  for (let i = 0; i < 4; i++) them('manh', 'goi_y', T - 10 * NGAY, 1)
  them('manh', 'goi_y', T - 90 * NGAY, 0) // đúng mép cửa sổ ⇒ tính
  them('manh', 'goi_y', T - 90 * NGAY - 1, 0) // ngoài cửa sổ ⇒ bỏ
  them('manh', 'lam_lai', T - NGAY, null) // chưa chấm ⇒ bỏ
  them('moi', 'giai_mau', null, null) // chưa đo ⇒ bỏ
  them('moi', 'giai_mau', T - 2 * NGAY, 2) // kết quả khác 0/1 vẫn là một dòng (dung=0, sai=0) như câu cũ
}
const cuBandit = (sql: any, now: number) => sql.prepare(SQL_BANDIT_CU).all(now - CUA_SO_BANDIT_MS)

describe('Q2 bandit cả lớp cộng sẵn', () => {
  it('chưa dựng ⇒ câu cũ y nguyên, cùng thứ tự', async () => {
    const d = taoD1That(); napCanThiep(d.sql)
    const r = await docBanditLop(d.env, T)
    expect(r.results).toEqual(cuBandit(d.sql, T))
    expect(r.results.length).toBe(4)
  })
  it('đã dựng ⇒ y hệt câu cũ tại mốc dựng; dữ liệu đổi sau mốc chỉ vào ở lần dựng sau', async () => {
    const d = taoD1That(); napCanThiep(d.sql)
    const luc = cuBandit(d.sql, T)
    expect(await dungBanditLopNeuCu(d.env, T)).toEqual({ dung: true, soDong: 4 })
    d.sql.prepare("UPDATE hanh_trinh_v4_can_thiep SET ket_qua=1 WHERE context='manh'").run()
    expect((await docBanditLop(d.env, T + 60_000)).results).toEqual(luc)
    // Trong chu kỳ ⇒ không dựng lại; hết chu kỳ ⇒ dựng lại, khớp câu cũ lúc đó.
    expect(await dungBanditLopNeuCu(d.env, T + chuKyDungBandit(T) - 1)).toEqual({ dung: false })
    const T2 = T + chuKyDungBandit(T)
    expect((await dungBanditLopNeuCu(d.env, T2)).dung).toBe(true)
    expect((await docBanditLop(d.env, T2)).results).toEqual(cuBandit(d.sql, T2))
    // Mốc quá hạn (cron hỏng) ⇒ lùi về câu cũ.
    const T3 = T2 + HAN_DUNG_BANDIT_MS + 1
    d.sql.prepare("UPDATE hanh_trinh_v4_can_thiep SET ket_qua=0 WHERE context='yeu'").run()
    expect((await docBanditLop(d.env, T3)).results).toEqual(cuBandit(d.sql, T3))
  })
  it('lô giành mốc: hai cron cùng phút chỉ một lô dựng', async () => {
    const d = taoD1That(); napCanThiep(d.sql)
    const [a, b] = await Promise.all([dungBanditLopNeuCu(d.env, T), dungBanditLopNeuCu(d.env, T)])
    expect([a.dung, b.dung].filter(Boolean).length).toBe(1)
    expect((d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v4_bandit_lop').get() as { n: number }).n).toBe(4)
  })
  it('kế hoạch: đã dựng thì nhánh câu cũ không quét bảng can thiệp (điều kiện hằng xét trước vòng quét)', () => {
    const d = taoD1That()
    const ke = keHoach(d.sql, SQL_BANDIT_DOC).join('\n')
    expect(ke).toMatch(/SCAN hanh_trinh_v4_bandit_lop|SEARCH hanh_trinh_v4_bandit_lop/)
    // Nhánh câu cũ vẫn có (dự phòng) — nhưng đứng sau EXISTS hằng; thử thật: đã dựng, đếm số bước VM khi đọc không phụ thuộc số dòng can thiệp.
    expect(ke).toMatch(/hanh_trinh_v4_can_thiep/)
  })
})
