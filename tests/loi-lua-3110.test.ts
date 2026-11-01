// LỬA ĐỔI CẢM XÚC — LỜI BONG BÓNG theo cấp (docs/DE-XUAT-BI-CAM-XUC-3110.md mục 3). Chữ chỉ nói sự thật; không chữ cấm, không emoji, không viết hoa cả câu,
// ≤ 110 ký tự, giờ HH:MM, số nào cũng có nhãn.
import { describe, expect, it } from 'vitest'
import { loiLua, xetLua, type VaoLua } from '../src/lib/lua-cam-xuc'
import type { SoLuaThat } from '../src/lib/lua-that'

const luc = (h: number, m = 0) => Date.UTC(2026, 9, 31, h - 7, m)
const vao = (h: number, m: number, x: Partial<VaoLua> = {}): VaoLua => ({ now: luc(h, m), daLam: 0, muc: 40, du: false, chuoi: 0, giuHomNay: false, ...x })
const so = (kq: string, cuoi = luc(15, 0), xongThat?: number): SoLuaThat => ({ kq: [...kq].map((c, i, a) => ({ t: cuoi - (a.length - 1 - i) * 60_000, tinh: c === '1' })), ...(xongThat !== undefined ? { xongThat } : {}) })
const loi = (v: VaoLua) => loiLua(xetLua(v).cap, v)

// đủ các tình huống có lời mới
const MAU: VaoLua[] = [
  vao(20, 15, { daLam: 12 }), vao(21, 30, { daLam: 10 }), vao(22, 20, { daLam: 6, chuoi: 12 }), vao(22, 20, { daLam: 0, chuoi: 2 }),
  vao(23, 5, { daLam: 0, chuoi: 12, giuChuoi: 0 }), vao(23, 59, { daLam: 18, chuoi: 365, giuChuoi: 0 }), vao(23, 5, { daLam: 0, chuoi: 0 }),
  vao(15, 0, { daLam: 10, so: so('1101101101') }), vao(15, 0, { daLam: 3, so: so('000') }), vao(22, 30, { daLam: 5, so: so('00000', luc(22, 30)) }),
  vao(15, 0, { daLam: 10, so: so('0101010100') }), vao(15, 10, { daLam: 18, so: so('111111', luc(15, 0), luc(15, 0)) }),
]

describe('lời theo cấp', () => {
  it('đúng mẫu đặc tả (số lấy từ dữ liệu thật)', () => {
    expect(loi(vao(20, 15, { daLam: 12 }))).toBe('Đã 20:15 rồi. Còn 28 câu nữa là đủ mức hôm nay.')
    expect(loi(vao(21, 30, { daLam: 10 }))).toBe('Mol bực rồi đấy! 21:30 mà còn 30 câu. Học ngay nhé.')
    expect(loi(vao(22, 20, { daLam: 6, chuoi: 12 }))).toBe('Mol giận rồi! 22:20 mà mới làm 6/40 câu. Chuỗi 12 ngày đang chờ em.')
    expect(loi(vao(23, 5, { daLam: 0, chuoi: 12, giuChuoi: 0 }))).toBe('Mol cáu lắm rồi! 23:05 mà chưa làm câu nào. Còn 54 phút (tới 23:59) để giữ chuỗi 12 ngày.')
    expect(loi(vao(15, 0, { daLam: 10, so: so('1101101101') }))).toBe('Mấy câu vừa rồi chưa được tính. Đọc kĩ đề rồi làm nhé.')
    expect(loi(vao(15, 0, { daLam: 3, so: so('000') }))).toBe('Mol giận rồi! 3 câu liền chưa được tính. Dừng lại, đọc kĩ đề.')
    expect(loi(vao(22, 30, { daLam: 5, so: so('00000', luc(22, 30)) }))).toBe('Mol cáu lắm rồi! 5 câu liền chưa được tính. Đọc kĩ đề rồi làm.')
    expect(loi(vao(15, 10, { daLam: 18, so: so('111111', luc(15, 0), luc(15, 0)) }))).toBe('Em làm thật, Mol vui lắm! Còn 22 câu nữa là đủ mức.')
  })
  it('chuỗi chỉ nhắc khi chuỗi ≥ 3 ngày và hôm nay chưa giữ; không có chuỗi ⇒ nói về đủ mức', () => {
    expect(loi(vao(22, 20, { daLam: 0, chuoi: 2 }))).toBe('Mol giận rồi! 22:20 mà chưa làm câu nào.')
    expect(loi(vao(23, 5, { daLam: 0, chuoi: 0 }))).toBe('Mol cáu lắm rồi! 23:05 mà chưa làm câu nào. Còn 54 phút (tới 23:59) để đủ mức hôm nay.')
  })
  it('giữ lời cũ (null): cấp 1, đủ mức, ngày nghỉ, ca kiểm tra, Kiểm tra ôn tập', () => {
    for (const v of [vao(15, 0, { daLam: 6 }), vao(22, 0, { daLam: 40, du: true }), vao(23, 0, { nghi: true }), vao(23, 0, { coCa: true }), vao(23, 0, { kiem: true })]) expect(loi(v)).toBeNull()
  })
})

describe('luật chữ (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md)', () => {
  const ds = MAU.map(loi).filter((x): x is string => !!x)
  it('có đủ lời để soát', () => expect(ds.length).toBe(MAU.length))
  it('không chữ cấm, không emoji, không viết hoa cả câu, ≤ 110 ký tự', () => {
    for (const s of ds) {
      expect(s, s).not.toMatch(/lười|đối phó|bấm vội|treo máy|cẩu thả|\bngu\b|dốt|\bkém\b/i)
      expect(s, s).not.toMatch(/\p{Extended_Pictographic}/u)
      expect(s, s).not.toBe(s.toUpperCase())
      expect(s.length, s).toBeLessThanOrEqual(110)
    }
  })
  it('giờ dạng HH:MM 24 giờ; số nào cũng có nhãn (câu · ngày · phút)', () => {
    for (const s of ds) {
      for (const g of s.match(/\d+:\d+/g) ?? []) expect(g).toMatch(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      const bo = s.replace(/\d{2}:\d{2}/g, '').replace(/\d+\/\d+ câu/g, '')
      for (const m of bo.matchAll(/\d+/g)) expect(bo.slice(m.index! + m[0].length), s).toMatch(/^ (?:câu|ngày|phút|trong \d+ câu)/)
    }
  })
})
