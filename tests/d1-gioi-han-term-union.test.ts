// @vitest-environment node
// D1 THẬT chỉ cho TỐI ĐA 5 term trong một truy vấn UNION (thử 21/09: 6 term ⇒ "too many terms in compound SELECT"); node:sqlite cho 500 nên lỗi lọt qua test (Code 4 thêm term thứ 6 ở /ph/tat-ca-ve-con ⇒ 500 trên D1 thật).
// D1 giả (tests/_d1-that.ts) nay ném đúng lỗi ấy. Khoá hàm đếm.
import { describe, expect, it } from 'vitest'
import { D1_TOI_DA_TERM_UNION, demTermUnionToiDa, taoD1That } from './_d1-that'

const noi = (n: number) => Array.from({ length: n }, (_, i) => `SELECT ${i}`).join(' UNION ALL ')
describe('đếm term UNION', () => {
  it('1–5 term hợp lệ, 6 vượt; UNION và UNION ALL đều tính', () => {
    expect(demTermUnionToiDa('SELECT 1')).toBe(1)
    expect(demTermUnionToiDa(noi(5))).toBe(5)
    expect(demTermUnionToiDa(noi(6))).toBe(6)
    expect(demTermUnionToiDa('SELECT 1 UNION SELECT 2 UNION SELECT 3')).toBe(3)
  })
  it('đếm THEO NHÓM NGOẶC: hai truy vấn con 3 term không cộng dồn thành 6; truy vấn con 6 term thì vượt', () => {
    expect(demTermUnionToiDa(`SELECT * FROM (${noi(3)}) WHERE x IN (${noi(3)})`)).toBe(3)
    expect(demTermUnionToiDa(`SELECT * FROM (${noi(6)})`)).toBe(6)
  })
  it('chữ "UNION" trong chuỗi, tên, chú thích không tính', () => {
    expect(demTermUnionToiDa(`SELECT 'a UNION b UNION c UNION d UNION e UNION f UNION g' -- UNION UNION UNION\n UNION ALL SELECT 2`)).toBe(2)
  })
})
describe('D1 giả ném lỗi như D1 thật', () => {
  it('5 term chạy được; 6 term ném "too many terms in compound SELECT" ở all / first / run', async () => {
    const d = taoD1That()
    expect((await d.env.DB.prepare(noi(D1_TOI_DA_TERM_UNION)).all()).results).toHaveLength(5)
    await expect(d.env.DB.prepare(noi(6)).all()).rejects.toThrow(/too many terms in compound SELECT/)
    await expect(d.env.DB.prepare(noi(6)).first()).rejects.toThrow(/too many terms/)
    await expect(d.env.DB.prepare(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) SELECT 'a','b','c' UNION ALL SELECT 1,2,3 UNION ALL SELECT 1,2,3 UNION ALL SELECT 1,2,3 UNION ALL SELECT 1,2,3 UNION ALL SELECT 1,2,3`).run()).rejects.toThrow(/too many terms/)
  })
})
