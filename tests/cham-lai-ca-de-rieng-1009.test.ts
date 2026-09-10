// CHẤM LẠI CA ĐỀ RIÊNG — khai đúng MẪU SỐ, không khai cỡ kho.
//
// Thầy cho phép chấm lại hai ca để gửi Zalo (10/09). Lệnh chạy xong nhưng máy
// chủ TỪ CHỐI cả 21 em của ca 248567, mỗi em một dòng:
//
//     "12026: chấm theo 24/6/6 mà ca là 8/2/2 — điểm giữ nguyên"
//
// NGUYÊN NHÂN GỐC. `mergeKeepAnswers` trả về CẢ KHO trong `phanI/II/III` và để
// số câu MỖI EM ở thuộc tính `soCau`. Ca đề riêng rút 8/2/2 từ kho 24/6/6.
// `chamLaiCa` khai mẫu số bằng ĐỘ DÀI KHO ⇒ khai 24/6/6 trong khi thật sự chấm
// bằng 8/2/2 ⇒ máy chủ đối chiếu thấy lệch và từ chối cả lô.
//
// Nghĩa là `chamLaiCa` KHÔNG BAO GIỜ chạy được trên ca dùng bộ câu con. Lần
// chấm lại ca 248567 hỏng hôm 07/09 từng bị quy cho hạn chờ 25 giây — hạn chờ
// có thật, nhưng đây mới là chỗ chặn thật sự.
//
// CHỐT AN TOÀN CỦA MÁY CHỦ ĐÃ LÀM ĐÚNG VIỆC CỦA NÓ: nó chặn một lô điểm sai,
// và 21 dòng LuotThi giữ nguyên mốc 07/09. Phép kiểm này khoá phía client để
// máy chủ không phải chặn nữa.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { mergeKeepAnswers, type TeacherExamSource } from '../src/data/examContent'

const MA = fs.readFileSync(path.join(process.cwd(), 'src/lib/cham-lai-ca.ts'), 'utf8')

const cau = (i: number) => ({ id: `q${i}`, text: `c${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' })
const KHO: TeacherExamSource[] = [
  {
    maDe: 'K',
    phanI: Array.from({ length: 24 }, (_, i) => cau(i)),
    phanII: Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, text: `t${i}`, ideas: ['a', 'b', 'c', 'd'], correct: [true, false, true, false] })),
    phanIII: Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, text: `s${i}`, correct: '1' })),
  } as unknown as TeacherExamSource,
]

describe('KHO ĐỀ và MẪU SỐ là hai con số KHÁC NHAU', () => {
  it('`mergeKeepAnswers` giữ CẢ KHO, và để số câu mỗi em ở `soCau`', () => {
    const kb = mergeKeepAnswers(KHO, { I: 8, II: 2, III: 2 })
    // Đúng dáng ca 248567 thật của thầy.
    expect(kb.phanI.length).toBe(24)
    expect(kb.phanII.length).toBe(6)
    expect(kb.phanIII.length).toBe(6)
    expect(kb.soCau).toEqual({ I: 8, II: 2, III: 2 })
    // Chính chỗ này là cái bẫy: hai con số khác nhau, lấy nhầm là hỏng.
    expect(kb.phanI.length).not.toBe(kb.soCau?.I)
  })

  it('ca THƯỜNG không có `soCau` ⇒ cả kho chính là đề em làm', () => {
    const kb = mergeKeepAnswers(KHO)
    expect(kb.soCau).toBeUndefined()
  })
})

describe('`chamLaiCa` phải khai `keyBank.soCau`, KHÔNG khai độ dài kho', () => {
  it('mã lấy `soCau` trước, độ dài kho chỉ là đường lui', () => {
    expect(MA).toContain('const soCauCham = goi.keyBank.soCau ?? {')
    // Bản cũ khai thẳng độ dài kho — không được quay lại.
    expect(MA).not.toMatch(/const soCauCham = \{\s*\n\s*I: goi\.keyBank\.phanI\.length/)
  })

  it('CÓ đường lui cho ca thường, không phải bỏ hẳn', () => {
    const khoi = MA.slice(MA.indexOf('const soCauCham'), MA.indexOf('const em: DoiDiemMotEm[]'))
    expect(khoi).toContain('I: goi.keyBank.phanI.length')
    expect(khoi).toContain('II: goi.keyBank.phanII.length')
    expect(khoi).toContain('III: goi.keyBank.phanIII.length')
  })

  it('TÁI HIỆN BẰNG SỐ: khai cỡ kho là khai sai với mọi ca dùng bộ câu con', () => {
    const kb = mergeKeepAnswers(KHO, { I: 8, II: 2, III: 2 })
    const khaiSai = { I: kb.phanI.length, II: kb.phanII.length, III: kb.phanIII.length }
    const khaiDung = kb.soCau ?? khaiSai
    expect(khaiSai).toEqual({ I: 24, II: 6, III: 6 })
    expect(khaiDung).toEqual({ I: 8, II: 2, III: 2 })
    // Máy chủ so hai con số này; lệch là từ chối cả lô.
    expect(khaiSai).not.toEqual(khaiDung)
  })

  it('ca thường thì hai cách khai TRÙNG nhau — đường lui không đổi hành vi cũ', () => {
    const kb = mergeKeepAnswers(KHO)
    const khaiSai = { I: kb.phanI.length, II: kb.phanII.length, III: kb.phanIII.length }
    const khaiDung = kb.soCau ?? khaiSai
    expect(khaiDung).toEqual(khaiSai)
  })
})
