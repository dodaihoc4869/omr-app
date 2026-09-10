// XÁO BỐN Ý PHẦN II — việc cuối còn nợ của đặc tả đề riêng.
//
// Vì sao hoãn ba lần: nó đụng ĐƯỜNG CHẤM ĐIỂM. `correct` của Phần II là mảng
// bốn giá trị đánh theo THỨ TỰ Ý GỐC; xáo hiển thị mà quên quy về gốc lúc lưu
// là chấm sai cả lớp, và sai kiểu im lặng — điểm vẫn ra một con số trông bình
// thường.
//
// CÁCH LÀM AN TOÀN, chép đúng đường Phần I đã chạy cả năm: chỉ CHỖ HIỆN RA mới
// xáo, còn đáp án em chọn LUÔN cất theo thứ tự ý gốc. Nhờ vậy `correct`,
// `taoChiTietCau`, `gradeFromKeyBank` và toàn bộ đường chấm không phải đổi một
// dòng nào — và mấy phép kiểm dưới đây chứng minh đúng điều đó bằng SỐ.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import type { PublicExamBank } from '../src/data/examContent'

const THE_CAU = fs.readFileSync(path.join(process.cwd(), 'src/components/TheCau.tsx'), 'utf8')
const MAN_THI = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamTakeScreen.tsx'), 'utf8')

function bank(soCauII = 4): PublicExamBank {
  return {
    phanI: Array.from({ length: 18 }, (_, i) => ({
      id: `I-${i + 1}`,
      text: `TN ${i + 1}`,
      choices: ['a', 'b', 'c', 'd'],
    })),
    phanII: Array.from({ length: soCauII }, (_, i) => ({
      id: `II-${i + 1}`,
      text: `DS ${i + 1}`,
      ideas: [`ý a của ${i + 1}`, `ý b của ${i + 1}`, `ý c của ${i + 1}`, `ý d của ${i + 1}`],
    })),
    phanIII: Array.from({ length: 6 }, (_, i) => ({ id: `III-${i + 1}`, text: `TL ${i + 1}` })),
    soCau: { I: 18, II: soCauII, III: 6 },
  } as unknown as PublicExamBank
}

describe('BỘ XÁO — mỗi em một thứ tự, và luôn là hoán vị hợp lệ', () => {
  const b = bank()

  it('mỗi câu Phần II đều có `yPerm`, và nó là hoán vị của 0..3', () => {
    const a = assignStudentQuestions(b, '123456', '12001')
    expect(a.phanII.length).toBe(4)
    for (const it2 of a.phanII) {
      expect(it2.yPerm.length).toBe(4)
      expect([...it2.yPerm].sort((x, y) => x - y)).toEqual([0, 1, 2, 3])
    }
  })

  it('HAI EM khác nhau ⇒ thứ tự ý khác nhau (đây là mục đích của cả việc này)', () => {
    const a = assignStudentQuestions(b, '123456', '12001')
    const c = assignStudentQuestions(b, '123456', '12002')
    const khac = a.phanII.filter((x, i) => x.yPerm.join('') !== c.phanII[i].yPerm.join('')).length
    expect(khac).toBeGreaterThan(0)
  })

  it('TẤT ĐỊNH — cùng ca, cùng em, gọi lại ra đúng thứ tự cũ', () => {
    const a = assignStudentQuestions(b, '123456', '12001')
    const lai = assignStudentQuestions(b, '123456', '12001')
    expect(lai.phanII.map((x) => x.yPerm.join(''))).toEqual(a.phanII.map((x) => x.yPerm.join('')))
  })

  it('ĐỔI CA thì thứ tự đổi theo — không dùng lại một bộ xáo cho mọi ca', () => {
    const a = assignStudentQuestions(b, '123456', '12001')
    const c = assignStudentQuestions(b, '999999', '12001')
    expect(a.phanII.map((x) => x.yPerm.join('')).join('|')).not.toBe(c.phanII.map((x) => x.yPerm.join('')).join('|'))
  })

  it('xáo Ý ĐỘC LẬP với xáo phương án Phần I — hai hạt giống khác nhau', () => {
    const a = assignStudentQuestions(b, '123456', '12001')
    // Cùng seed thì hai bộ sẽ trùng nhau hàng loạt; khác seed thì không.
    const y = a.phanII.map((x) => x.yPerm.join('')).join('|')
    const c = a.phanI.slice(0, 4).map((x) => x.choicePerm.join('')).join('|')
    expect(y).not.toBe(c)
  })
})

describe('CHẤM ĐIỂM KHÔNG ĐƯỢC ĐỔI MỘT LY — chốt quan trọng nhất', () => {
  it('đáp án em chọn cất theo THỨ TỰ Ý GỐC, không theo thứ tự hiện ra', () => {
    // `onSelect` của TheCau nhận `ideaIdx` là chỉ số Ý GỐC; màn thi truyền thẳng
    // vào `setPhanII`. Nếu chỗ nào đó truyền vị trí hiển thị thì cả lớp chấm sai.
    expect(MAN_THI).toContain('onSelect={(idx, v) => setPhanII(item.qid, idx, v)}')
    // Và TheCau phải lấy `i` (chỉ số gốc) chứ không phải `viTri` khi gọi onSelect.
    const khoiII = THE_CAU.slice(THE_CAU.indexOf("} else if (props.phan === 'II') {"), THE_CAU.indexOf("} else if (props.phan === 'III')"))
    expect(khoiII).toContain('onSelect(i, v)')
    expect(khoiII).not.toContain('onSelect(viTri')
  })

  it('mọi lần ĐỌC dữ liệu trong khối Phần II đều dùng chỉ số GỐC', () => {
    const khoiII = THE_CAU.slice(THE_CAU.indexOf("} else if (props.phan === 'II') {"), THE_CAU.indexOf("} else if (props.phan === 'III')"))
    expect(khoiII).toContain('const idea = ideas[i]')
    expect(khoiII).toContain('const val = selected[i] ?? null')
    expect(khoiII).toContain('const dapAn = xemLai ? correct?.[i] : undefined')
    expect(khoiII).toContain('const img = ideaImgs?.[i]')
    // Chỉ NHÃN a) b) c) d) mới đi theo vị trí hiển thị.
    expect(khoiII).toContain("const chu = 'abcd'[viTri] as 'a' | 'b' | 'c' | 'd'")
  })

  it('KHÔNG đụng vào cách chấm: `correct` vẫn đánh theo thứ tự gốc', () => {
    // Cả `taoChiTietCau` lẫn engine chấm đều không được biết gì về xáo ý.
    const chiTiet = fs.readFileSync(path.join(process.cwd(), 'src/lib/chi-tiet-cau.ts'), 'utf8')
    expect(chiTiet).not.toContain('yPerm')
    const grade = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-grade.ts'), 'utf8')
    expect(grade).not.toContain('yPerm')
  })

  it('XEM LẠI dùng CÙNG thứ tự với lúc làm bài', () => {
    // Đảo lại thứ tự ở màn xem lại thì "ý b) em chọn Đúng" đổi nghĩa giữa hai
    // màn: em đọc một đằng, bài chấm một nẻo.
    expect(MAN_THI.match(/yPerm=\{item\.yPerm\}/g)?.length).toBe(2)
  })
})

describe('CA CŨ VÀ MỌI CHỖ KHÁC KHÔNG ĐƯỢC ĐỔI HÀNH VI', () => {
  it('thiếu `yPerm` ⇒ rơi về thứ tự gốc [0,1,2,3]', () => {
    const khoiII = THE_CAU.slice(THE_CAU.indexOf("} else if (props.phan === 'II') {"), THE_CAU.indexOf("} else if (props.phan === 'III')"))
    expect(khoiII).toContain('const thuTu = props.yPerm && props.yPerm.length === 4 ? props.yPerm : [0, 1, 2, 3]')
  })

  it('`yPerm` sai độ dài cũng rơi về thứ tự gốc, không vỡ', () => {
    const khoiII = THE_CAU.slice(THE_CAU.indexOf("} else if (props.phan === 'II') {"), THE_CAU.indexOf("} else if (props.phan === 'III')"))
    expect(khoiII).toContain('props.yPerm.length === 4')
  })

  it('màn Ngân hàng câu hỏi và Gọi lên bảng KHÔNG xáo — thầy đối chiếu với file đề', () => {
    const nh = fs.readFileSync(path.join(process.cwd(), 'src/screens/NganHangDeScreen.tsx'), 'utf8')
    const lb = fs.readFileSync(path.join(process.cwd(), 'src/screens/GoiLenBangScreen.tsx'), 'utf8')
    expect(nh).not.toContain('yPerm')
    expect(lb).not.toContain('yPerm')
  })

  it('LỜI GIẢI TỪNG Ý đi theo ĐÚNG thứ tự đang hiện, không lệch nhãn', () => {
    // Ý hiện ở vị trí b) mà lời giải in nhãn b) của ý gốc thứ hai là em đọc nhầm
    // hẳn sang lời giải của ý khác.
    expect(THE_CAU).toContain("const k = (['a', 'b', 'c', 'd'] as const)[i]")
    expect(THE_CAU).toContain("ma={`${'abcd'[viTri]})`}")
  })
})

describe('SỐ HỌC CỦA VIỆC CHỐNG NHÌN BÀI — xáo có thật sự làm khó không', () => {
  it('với 30 em, phần lớn các cặp KHÁC thứ tự ở ít nhất một câu', () => {
    const b = bank()
    const em = Array.from({ length: 30 }, (_, i) => `120${String(i).padStart(2, '0')}`)
    const bo = em.map((s) => assignStudentQuestions(b, '447479', s).phanII.map((x) => x.yPerm.join('')).join('|'))
    let giong = 0
    let tong = 0
    for (let i = 0; i < bo.length; i++) {
      for (let j = i + 1; j < bo.length; j++) {
        tong++
        if (bo[i] === bo[j]) giong++
      }
    }
    // eslint-disable-next-line no-console
    console.log(`[xáo ý] 30 em · ${tong} cặp · ${giong} cặp TRÙNG hoàn toàn cả 4 câu`)
    expect(giong).toBe(0)
  })

  it('bốn ý thật sự đổi chỗ, không phải hoán vị đồng nhất ở mọi câu', () => {
    const b = bank(20)
    const a = assignStudentQuestions(b, '447479', '12001')
    const doiCho = a.phanII.filter((x) => x.yPerm.join('') !== '0123').length
    // eslint-disable-next-line no-console
    console.log(`[xáo ý] 20 câu · ${doiCho} câu có thứ tự khác gốc`)
    expect(doiCho).toBeGreaterThan(10)
  })
})
