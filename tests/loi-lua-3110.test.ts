// LỬA ĐỔI CẢM XÚC — LỜI BONG BÓNG theo cấp (docs/DE-XUAT-BI-CAM-XUC-3110.md mục 3). Chữ chỉ nói sự thật; không chữ cấm, không emoji, không viết hoa cả câu,
// ≤ 110 ký tự, giờ HH:MM, số nào cũng có nhãn.
// 01/11 tối thầy: «Câu văn trong bong bóng theo hướng gắt một chút» ⇒ «Làm kiểu câu ngắn kiểu: Bực thật đấy, lại đối phó»: cấp 2–5 câu CỰC NGẮN một dòng, không số;
// câu chưa được tính ⇒ gọi thẳng «đối phó» (ngoại lệ thầy cho chữ «đối phó» trong lời Mol giận); muộn mà chưa đủ câu ⇒ giục vào học.
import { describe, expect, it } from 'vitest'
import { KHO_CHAN_NGON, KHO_DOI_PHO, KHO_GIUC_HOC, chanNgon, chonCau, loiLua, soLuot, xetLua, type VaoLua } from '../src/lib/lua-cam-xuc'
import type { SoLuaThat } from '../src/lib/lua-that'

const luc = (h: number, m = 0) => Date.UTC(2026, 9, 31, h - 7, m)
const vao = (h: number, m: number, x: Partial<VaoLua> = {}): VaoLua => ({ now: luc(h, m), daLam: 0, muc: 40, du: false, chuoi: 0, giuHomNay: false, ...x })
const so = (kq: string, cuoi = luc(15, 0), xongThat?: number): SoLuaThat => ({ kq: [...kq].map((c, i, a) => ({ t: cuoi - (a.length - 1 - i) * 60_000, tinh: c === '1' })), ...(xongThat !== undefined ? { xongThat } : {}) })
const loi = (v: VaoLua) => loiLua(xetLua(v).cap, v)
const CO_DINH = new Set<string>([...Object.values(KHO_DOI_PHO).flat(), ...Object.values(KHO_GIUC_HOC).flat(), ...KHO_CHAN_NGON])

// đủ các tình huống có lời mới
const MAU: VaoLua[] = [
  vao(20, 15, { daLam: 12 }), vao(21, 30, { daLam: 10 }), vao(22, 20, { daLam: 6, chuoi: 12 }), vao(22, 20, { daLam: 0, chuoi: 2 }),
  vao(23, 5, { daLam: 0, chuoi: 12, giuChuoi: 0 }), vao(23, 59, { daLam: 18, chuoi: 365, giuChuoi: 0 }), vao(23, 5, { daLam: 0, chuoi: 0 }),
  vao(15, 0, { daLam: 10, so: so('1101101101') }), vao(15, 0, { daLam: 3, so: so('000') }), vao(22, 30, { daLam: 5, so: so('00000', luc(22, 30)) }),
  vao(15, 0, { daLam: 10, so: so('0101010100') }), vao(15, 10, { daLam: 18, so: so('111111', luc(15, 0), luc(15, 0)) }),
]

describe('lời theo cấp', () => {
  it('đúng kho câu thầy 01/11 tối: chưa được tính ⇒ kho «đối phó» theo cấp; muộn ⇒ giục vào học', () => {
    expect(KHO_GIUC_HOC[2]).toContain(loi(vao(20, 15, { daLam: 12 })))
    expect(KHO_GIUC_HOC[3]).toContain(loi(vao(21, 30, { daLam: 10 })))
    expect(loi(vao(22, 20, { daLam: 6, chuoi: 12 }))).toBe('Cáu rồi nhé! Sao chưa học?')
    expect(loi(vao(23, 5, { daLam: 0, chuoi: 12, giuChuoi: 0 }))).toBe('Đủ rồi! Vào học ngay!')
    expect(KHO_DOI_PHO[3]).toContain(loi(vao(15, 0, { daLam: 10, so: so('1101101101') })))
    expect(KHO_DOI_PHO[4]).toContain(loi(vao(15, 0, { daLam: 3, so: so('000') })))
    expect(KHO_DOI_PHO[5]).toContain(loi(vao(22, 30, { daLam: 5, so: so('00000', luc(22, 30)) })))
    expect(KHO_DOI_PHO[2]).toContain(loi(vao(15, 0, { daLam: 3, so: so('000'), ngayDau: true }))) // trần cấp 2 (ngày đầu)
    expect(loi(vao(15, 10, { daLam: 18, so: so('111111', luc(15, 0), luc(15, 0)) }))).toBe('Em làm thật, Mol vui lắm! Còn 22 câu nữa là đủ mức.')
  })
  it('kho câu (src/lib/loi-mol.ts): đủ câu mẫu của thầy; mỗi câu ≤ 80 ký tự (≤ 3 dòng bong bóng ở 390 px); «đối phó» chỉ ở kho câu chưa được tính', () => {
    expect(KHO_DOI_PHO[4].slice(0, 2)).toEqual(['Cáu rồi nhé! Đối phó mãi thế?', 'Không biết học đối phó có lợi ích gì?'])
    for (const c of ['Nhét data vào đầu đi, thầy ăn cơm em không thể no được.', 'Em không thể trồng cây chuối mà lại ra quả bưởi được.',
      'Để học giỏi Hoá cần 2 điều kiện: hiểu tiếng Việt và giỏi toán lớp 4.', 'Học thật, nỗ lực thật thì kết quả mới thật được.', 'Luôn phải thật khiêm hạ. Luôn phải thật xứng đáng.']) {
      expect(KHO_DOI_PHO[2], c).toContain(c); expect(KHO_DOI_PHO[3], c).toContain(c) // câu dỗi của thầy: cấp 2 dỗi + cấp 3 bực
    }
    expect(KHO_DOI_PHO[2][0]).toBe('Ơ, lại vội rồi đấy.'); expect(KHO_DOI_PHO[3][0]).toBe('Bực thật đấy! Lại đối phó.')
    expect(KHO_DOI_PHO[5]).toHaveLength(3)
    for (const kho of [KHO_DOI_PHO, KHO_GIUC_HOC]) {
      expect(Object.keys(kho)).toEqual(['2', '3', '4', '5'])
      for (const c of Object.values(kho).flat()) expect(c.length, c).toBeLessThanOrEqual(80)
    }
    for (const c of Object.values(KHO_GIUC_HOC).flat()) expect(c, c).not.toMatch(/đối phó/i)
  })
  it('xoay vòng tất định theo lượt, KHÔNG lặp liền câu vừa hiện; cùng lượt ⇒ cùng câu', () => {
    const kho = KHO_DOI_PHO[5]
    for (let l = 0; l < 12; l++) {
      expect(chonCau(kho, l)).toBe(chonCau(kho, l)) // tất định
      const truoc = chonCau(kho, l)
      expect(chonCau(kho, l + 1, truoc)).not.toBe(truoc) // lượt kế tiếp không lặp liền
      expect(chonCau(kho, l + 3, truoc)).not.toBe(truoc) // kể cả khi lượt nhảy đúng một vòng kho
    }
    expect(chonCau(['một câu'], 7, 'một câu')).toBe('một câu') // kho một câu: không có câu khác
    // qua loiLua: cùng vào ⇒ cùng câu; truyền câu vừa hiện ⇒ đổi câu
    const v = vao(22, 30, { daLam: 5, so: so('00000', luc(22, 30)) })
    const c1 = loi(v)!
    expect(loi(v)).toBe(c1)
    expect(loi({ ...v, loiTruoc: c1 })).not.toBe(c1)
  })
  it('chân ngôn (thầy 01/11 tối): đúng nguyên văn 4 câu; 1/3 lượt vui; lượt chân ngôn kế tiếp không lặp câu; tất định', () => {
    expect(KHO_CHAN_NGON).toEqual(['Cái gì nhận ra được thì không phải là ta.', 'Lòng biết ơn là nguyên lý của sự giàu có.', 'Năng lực của tình yêu là chữa lành và nuôi lớn.', 'Tập trung vào quá trình, kết quả là tất yếu.'])
    const ds = Array.from({ length: 30 }, (_, l) => chanNgon(l))
    expect(ds.filter(Boolean).length).toBe(10) // đúng 1/3
    const cn = ds.filter((x): x is string => !!x)
    for (let i = 1; i < cn.length; i++) expect(cn[i], `lượt ${i}`).not.toBe(cn[i - 1])
    for (const c of cn) expect(KHO_CHAN_NGON).toContain(c)
    expect(chanNgon(9)).toBe(chanNgon(9))
    expect(soLuot(5, luc(23, 59)) + 1).toBe(soLuot(5, luc(24, 0))) // qua 00:00 giờ VN ⇒ lượt mới
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
      expect(s, s).not.toMatch(/lười|bấm vội|treo máy|cẩu thả|\bngu\b|dốt|\bkém\b|chậm hiểu/i) // «đối phó»: thầy cho phép trong lời Mol giận (01/11 tối)
      expect(s, s).not.toMatch(/\p{Extended_Pictographic}/u)
      expect(s, s).not.toBe(s.toUpperCase())
      expect(s.length, s).toBeLessThanOrEqual(110)
    }
  })
  it('giờ dạng HH:MM 24 giờ; số nào cũng có nhãn (câu · ngày · phút)', () => {
    for (const s of ds) {
      for (const g of s.match(/\d+:\d+/g) ?? []) expect(g).toMatch(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      if (CO_DINH.has(s)) continue // câu nguyên văn của thầy trong kho (số trong câu là chữ của thầy, không phải số liệu)
      const bo = s.replace(/\d{2}:\d{2}/g, '').replace(/\d+\/\d+ câu/g, '')
      for (const m of bo.matchAll(/\d+/g)) expect(bo.slice(m.index! + m[0].length), s).toMatch(/^ (?:câu|ngày|phút|trong \d+ câu)/)
    }
  })
})
