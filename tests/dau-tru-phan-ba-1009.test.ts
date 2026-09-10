// DẤU TRỪ PHẦN III — câu em làm ĐÚNG bị chấm SAI.
//
// Thầy chụp được 10/09: màn xem lại in "Đáp án –1" và ngay dưới "Em đã trả lời
// -1", gạch chéo đỏ. Hai dòng nhìn y hệt nhau vì mắt người không phân biệt được
// en dash với hyphen — nhưng máy so chuỗi thì khác byte.
//
// Đề soạn trên Word nên đáp án mang `–` (U+2013, mã 8211); em gõ bàn phím ra
// `-` (U+002D, mã 45). `normalizeNumericAnswer` bản cũ chỉ đổi dấu phẩy thành
// dấu chấm, không đụng dấu trừ.
//
// ĐÂY LÀ KIỂU SAI TỆ NHẤT: sai IM LẶNG. Điểm vẫn ra một con số trông bình
// thường, không cờ nào bật, và em thì nhìn thấy đáp án của mình giống hệt đáp
// án đúng.
//
// SỐ THẬT đo trên sheet `ChiTietCau` ngày 10/09 (4 561 dòng): 10 dòng chấm oan,
// 10 lượt thi, 2 ca (248567 và 890691), TẤT CẢ ở Phần III. Đo ngược trên 2 485
// dòng đang chấm ĐÚNG: luật mới không lật dòng nào thành sai.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { normalizeNumericAnswer } from '../src/engine/score'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

/** Đúng cặp thầy chụp được, và đúng cặp trong sheet của hai ca kia. */
const CAP_THAT: [string, string][] = [
  ['–1', '-1'], // ca 890691, 6 lượt — chính ảnh thầy gửi
  ['–5', '-5'], // ca 248567, 4 lượt
]

describe('CẶP THẬT TRÊN MÁY CHỦ phải chấm ĐÚNG', () => {
  for (const [dapAn, emGo] of CAP_THAT) {
    it(`đáp án "${dapAn}" (mã ${dapAn.codePointAt(0)}) ≡ em gõ "${emGo}" (mã ${emGo.codePointAt(0)})`, () => {
      // Chốt lại rằng hai chuỗi này THẬT SỰ khác nhau — nếu không thì phép kiểm
      // này rỗng và sẽ xanh cả khi mã hỏng.
      expect(dapAn).not.toBe(emGo)
      expect(normalizeNumericAnswer(dapAn)).toBe(normalizeNumericAnswer(emGo))
    })
  }
})

describe('MỌI KIỂU DẤU TRỪ Word và bàn phím sinh ra', () => {
  const DAU = [
    ['‐', 0x2010, 'hyphen'],
    ['‑', 0x2011, 'non-breaking hyphen'],
    ['‒', 0x2012, 'figure dash'],
    ['–', 0x2013, 'en dash'],
    ['—', 0x2014, 'em dash'],
    ['―', 0x2015, 'horizontal bar'],
    ['−', 0x2212, 'minus sign'],
    ['－', 0xff0d, 'fullwidth hyphen'],
  ] as const
  for (const [ky, ma, ten] of DAU) {
    it(`${ten} (U+${ma.toString(16).toUpperCase()}) ≡ dấu trừ bàn phím`, () => {
      expect(ky.codePointAt(0)).toBe(ma)
      expect(normalizeNumericAnswer(`${ky}12,5`)).toBe(normalizeNumericAnswer('-12.5'))
    })
  }
})

describe('KHOẢNG TRẮNG — kể cả no-break space Word hay chèn', () => {
  it('"− 5" ≡ "-5"', () => {
    expect(normalizeNumericAnswer('− 5')).toBe(normalizeNumericAnswer('-5'))
  })
  it('no-break space (U+00A0) cũng bị bỏ', () => {
    const nbsp = ' '
    expect(nbsp.codePointAt(0)).toBe(0x00a0)
    expect(normalizeNumericAnswer(`-${nbsp}5`)).toBe('-5')
  })
  it('luật cũ vẫn giữ: "0,87" ≡ "0.87"', () => {
    expect(normalizeNumericAnswer('0,87')).toBe(normalizeNumericAnswer('0.87'))
  })
})

describe('KHÔNG ĐƯỢC NỚI QUÁ TAY — mấy thứ vẫn phải là SAI', () => {
  it('CỐ Ý không so theo SỐ HỌC: "0,80" KHÁC "0,8" — chữ số có nghĩa là có tính điểm', () => {
    expect(normalizeNumericAnswer('0,80')).not.toBe(normalizeNumericAnswer('0,8'))
  })
  it('dấu cộng đầu KHÔNG bị bỏ: "+5" khác "5"', () => {
    expect(normalizeNumericAnswer('+5')).not.toBe(normalizeNumericAnswer('5'))
  })
  it('số khác nhau vẫn khác nhau', () => {
    expect(normalizeNumericAnswer('-1')).not.toBe(normalizeNumericAnswer('-2'))
    expect(normalizeNumericAnswer('12')).not.toBe(normalizeNumericAnswer('1.2'))
  })
  it('dấu trừ KHÔNG bị nuốt: "-5" vẫn khác "5"', () => {
    expect(normalizeNumericAnswer('–5')).not.toBe(normalizeNumericAnswer('5'))
  })
})

describe('MỘT NGUỒN SỰ THẬT — sáu chỗ so đáp án Phần III không được lệch nhau', () => {
  // Trước 10/09 có SÁU bản sao rời nhau của cùng một luật. Sáu chỗ để lệch, và
  // lệch ở đây nghĩa là chấm sai — hoặc tệ hơn, màn xem lại nói một đằng mà
  // điểm ghi một nẻo.
  const PHAI_DUNG_CHUNG = [
    'src/lib/chi-tiet-cau.ts', // DungSai ghi lên Sheet
    'src/lib/exam-grade.ts', // danh sách câu sai
    'src/components/TheCau.tsx', // dấu ✓/✗ ở màn xem lại — đúng chỗ thầy chụp
    'src/lib/cau-hinh-nop-khac-phuc.ts', // chấm phiếu khắc phục
  ]
  for (const p of PHAI_DUNG_CHUNG) {
    it(`${p} gọi normalizeNumericAnswer, không tự viết luật riêng`, () => {
      const ma = doc(p)
      expect(ma).toContain('normalizeNumericAnswer')
      // Không còn bản sao trần nào.
      expect(ma).not.toMatch(/\.trim\(\)\.replace\(',', '\.'\)/)
    })
  }

  it('BẢN SAO BẮT BUỘC trong html-phieu phải khớp từng luật với bản gốc', () => {
    // Phiếu là tệp HTML rời chạy trên máy em, không import được — nên chỗ này
    // buộc phải chép. Phép kiểm khoá hai bên không lệch nhau.
    const ma = doc('src/lib/html-phieu.ts')
    expect(ma).toContain('var chuanIII = function (v)')
    expect(ma).toContain('chuanIII(chon) === chuanIII(dapAn)')
    // Đủ tám dấu trừ, y như `MOI_DAU_TRU`.
    for (const ky of ['‐', '‑', '‒', '–', '—', '―', '−', '－']) {
      expect(ma.includes(ky)).toBe(true)
    }
    // Không còn phép so trần.
    expect(ma).not.toContain("chon.replace(',', '.') === dapAn.replace(',', '.')")
  })

  it('CHẠY THẬT bản chép trong html-phieu, so kết quả với bản gốc trên 12 ca', () => {
    // Đọc chữ trong tệp chỉ chứng minh nó CÓ MẶT. Phép kiểm này lôi hàm ra chạy
    // và bắt nó ra ĐÚNG kết quả của `normalizeNumericAnswer`.
    const ma = doc('src/lib/html-phieu.ts')
    const m = ma.match(/var chuanIII = function \(v\) \{([\s\S]*?)\n {8}\};/)
    expect(m).toBeTruthy()
    // Trong tệp nguồn `\\s` là hai ký tự; JS sinh ra nhận `\s`.
    const than = (m as RegExpMatchArray)[1].replace(/\\\\s/g, '\\s')
    const chuanIII = new Function('v', than) as (v: unknown) => string
    const CA = ['–1', '-1', '−5', '- 5', '0,87', '0.87', '0,80', '+5', '12', '1.2', '－3', '—7']
    for (const v of CA) expect(chuanIII(v)).toBe(normalizeNumericAnswer(v))
  })
})
