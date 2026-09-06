// SƠ ĐỒ CHUYỂN HOÁ — thầy chụp màn 06/09, câu cellulose của `12-C2-B6` III-22.
//
// Hai lỗi khác nhau chồng lên nhau trong một câu:
//
//   1. Nhãn mũi tên có ngoặc vuông LỒNG (`->[+[Ag(NH3)2]OH][t^\circ]`) làm
//      mhchem đóng nhãn sớm, `OH]` và `[t°]` rơi ra ngoài thành chữ rời.
//   2. Đo độ dài bằng `latex.length` nên MỖI mũi tên bị đẩy thành khối riêng,
//      sơ đồ vỡ thành "Cellulose" một dòng, mũi tên một dòng, "X" một dòng.
//
// Phép kiểm ở đây chạy KaTeX THẬT, không so chuỗi latex — vì cái sai nằm ở chỗ
// mhchem hiểu chuỗi đó thế nào, chuỗi vào trông vẫn "hợp lệ".
import { describe, expect, it } from 'vitest'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { beRongUocTinh, chuanHoaNhanMuiTen } from '../src/lib/chem-format'

/** Chữ mắt nhìn thấy + số lần có chỉ số dưới, đọc từ MathML của KaTeX. */
function ve(latex: string): { chu: string; soChiSo: number; soNhan: number } {
  const mm = katex.renderToString(latex, { throwOnError: true, strict: false, displayMode: false, output: 'mathml' })
  const than = mm.replace(/<annotation[\s\S]*?<\/annotation>/g, '')
  return {
    chu: than.replace(/<mspace[^>]*\/>/g, '').replace(/<[^>]+>/g, ''),
    soChiSo: (than.match(/<msub>/g) || []).length,
    // Mũi tên có nhãn trên + nhãn dưới được KaTeX dựng bằng munderover/mover.
    soNhan: (than.match(/<munderover>|<mover>|<munder>/g) || []).length,
  }
}

describe('Nhãn mũi tên có ngoặc vuông lồng', () => {
  const GOC = String.raw`->[+[Ag(NH3)2]OH][t^\circ]`

  it('BẢN GỐC ĐANG SAI — giữ lại để biết vì sao phải thoát ngoặc', () => {
    const r = ve(`\\ce{${GOC}}`)
    // Nhãn dưới biến mất: cả cụm dồn lên trên mũi tên.
    expect(r.chu).toContain('OH]')
    expect(r.chu).toContain('[t')
  })

  it('sau khi thoát ngoặc: đủ nhãn trên và nhãn dưới, chỉ số dưới còn nguyên', () => {
    const s = chuanHoaNhanMuiTen(GOC)
    expect(s).toBe(String.raw`->[+{[}Ag(NH3)2{]}OH][t^\circ]`)
    const r = ve(`\\ce{${s}}`)
    // `[Ag(NH3)2]OH` hiện đúng nguyên văn, KHÔNG còn dấu `]` lạc ra sau.
    expect(r.chu).toContain('[Ag(NH')
    expect(r.chu).toContain(']OH')
    expect(r.chu).not.toContain('OH]')
    // NH3 và (…)2 vẫn là chỉ số dưới — bọc cả nhãn trong {} thì mất hai cái này.
    expect(r.soChiSo).toBe(2)
    // Nhãn dưới `t°` có mặt.
    expect(r.chu).toContain('∘')
  })

  it('không đụng vào mũi tên nhãn bình thường', () => {
    const s = String.raw`->[+H2O][acid, t^\circ]`
    expect(chuanHoaNhanMuiTen(s)).toBe(s)
  })

  it('không đụng vào ngoặc vuông NGOÀI nhãn mũi tên', () => {
    // Nồng độ `[H+]` trong biểu thức hằng số cân bằng: không có mũi tên nào.
    expect(chuanHoaNhanMuiTen('K = [H+][OH-]')).toBe('K = [H+][OH-]')
    // Phức chất đứng làm chất phản ứng, không phải nhãn.
    expect(chuanHoaNhanMuiTen('[Cu(NH3)4]^2+ + 4H+ -> Cu^2+ + 4NH4+')).toBe('[Cu(NH3)4]^2+ + 4H+ -> Cu^2+ + 4NH4+')
  })

  it('lệch ngoặc thì GIỮ NGUYÊN, không đoán tiếp', () => {
    const hong = '->[+[Ag(NH3)2 OH'
    expect(chuanHoaNhanMuiTen(hong)).toBe(hong)
  })

  it('chạy được với mũi tên hai chiều và nhiều mũi tên trong một chuỗi', () => {
    const s = String.raw`A <=>[+[X]Y][t] B ->[+[Z]W] C`
    expect(chuanHoaNhanMuiTen(s)).toBe(String.raw`A <=>[+{[}X{]}Y][t] B ->[+{[}Z{]}W] C`)
  })
})

describe('Bề rộng ước tính quyết định nằm trong dòng hay tách khối', () => {
  const NGUONG = 26

  it('MŨI TÊN CỦA SƠ ĐỒ PHẢI NẰM TRONG DÒNG — đây là lỗi thầy chụp', () => {
    // Đúng chuỗi trong kho: `$\ce{->[+H2O][acid, t^\circ]}$`. Đếm thô ra 28 ký
    // tự nên bản cũ đẩy nó thành khối riêng, mũi tên rơi xuống một dòng.
    const latex = String.raw`\ce{->[+H2O][acid, t^\circ]}`
    expect(latex.length).toBeGreaterThan(NGUONG) // cách đo CŨ: sai
    expect(beRongUocTinh(latex)).toBeLessThanOrEqual(NGUONG)
  })

  it('hai nhãn XẾP CHỒNG nên chỉ tính nhãn dài hơn, không cộng dồn', () => {
    const mot = beRongUocTinh(String.raw`\ce{->[acid, t^\circ]}`)
    const hai = beRongUocTinh(String.raw`\ce{->[+H2O][acid, t^\circ]}`)
    expect(hai).toBe(mot)
  })

  it('mũi tên có phức chất trong nhãn vẫn nằm trong dòng', () => {
    expect(beRongUocTinh(String.raw`\ce{->[+{[}Ag(NH3)2{]}OH][t^\circ]}`)).toBeLessThanOrEqual(NGUONG)
  })

  it('PHƯƠNG TRÌNH DÀI VẪN PHẢI TÁCH KHỐI — không được nới lỏng', () => {
    // Phương trình ngắn nhất từng bị cắt trên máy thầy (04-09).
    expect(beRongUocTinh(String.raw`\ce{HCOOCH3 + NaOH -> HCOONa + CH3OH}`)).toBeGreaterThan(NGUONG)
    expect(beRongUocTinh(String.raw`\ce{CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH}`)).toBeGreaterThan(NGUONG)
  })

  it('công thức một chất vẫn nằm trong dòng', () => {
    expect(beRongUocTinh(String.raw`\ce{CH3COOC2H5}`)).toBeLessThanOrEqual(NGUONG)
    expect(beRongUocTinh(String.raw`\ce{[Cu(NH3)4]^2+}`)).toBeLessThanOrEqual(NGUONG)
  })

  it('lệnh LaTeX đếm là MỘT ký tự, không đếm cả tên lệnh', () => {
    // `\Delta_r H^\circ_{298}` mắt nhìn ra chừng 8 ký tự, không phải 22.
    expect(beRongUocTinh(String.raw`\Delta_r H^\circ_{298}`)).toBeLessThanOrEqual(12)
  })
})

describe('Ba câu trong kho dính lỗi ngoặc lồng đều chữa được', () => {
  // Quét `kho-de/xong/` ngày 06/09: ĐÚNG BA câu dính, ở ba file khác nhau.
  // Chuỗi dưới đây chép nguyên văn từ trường `de` của ba câu đó.
  //   12-C2-B5  III-14 · 12-C2-B6 III-22 → `->[+[Ag(NH3)2]OH][t^\circ]`
  //   12-C2-B7-D2 III-6                  → `->[+[Ag(NH3)2]OH, t^\circ]`
  const KHO = [
    String.raw`->[+[Ag(NH3)2]OH][t^\circ]`,
    String.raw`->[+[Ag(NH3)2]OH, t^\circ]`,
  ]
  for (const goc of KHO) {
    it(`dựng được không lỗi: ${goc}`, () => {
      const s = chuanHoaNhanMuiTen(goc)
      expect(s).not.toMatch(/\[[^\]{]*\[/) // không còn ngoặc lồng trần trong nhãn
      expect(() => ve(`\\ce{${s}}`)).not.toThrow()
      expect(beRongUocTinh(`\\ce{${s}}`)).toBeLessThanOrEqual(26)
    })
  }
})
