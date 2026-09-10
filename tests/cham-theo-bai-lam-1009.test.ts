// CHẤM LẠI PHẢI THEO BÀI EM ĐÃ LÀM, KHÔNG ĐƯỢC RÚT LẠI BỘ CÂU.
//
// Thầy bắt được 10/09, ca 890691. Lượt chấm lại của tôi ghi đè điểm của CẢ 28
// em bằng số sai, và sai IM LẶNG — con số vẫn trông như điểm thật:
//
//     Chu Thanh Mai   5,85 → 1,60
//     Nguyễn Anh Minh 8,75 → 2,00
//     Nguyễn Vũ Huy   8,25 → 1,75
//
// NGUYÊN NHÂN GỐC. `assignStudentQuestions` rút 18/4/6 từ kho bằng seed
// hash(mãCa + SBD). Chú thích đầu tệp ấy hứa "tái tạo lại được y hệt khi cần
// phúc khảo/chấm lại (không cần lưu lại bộ câu đã gán cho từng em)" — lời hứa
// đó CHỈ đúng khi KHO KHÔNG ĐỔI. Kho của ca 890691 đã phình từ 1 đề lên 3 đề
// (18/4/6 → 54/12/18) sau buổi thi, nên rút lại ra một bộ 18 câu khác hẳn bộ em
// đã làm. Điểm rơi về mức đoán mò.
//
// Đây là hạt giống tất định gặp dữ liệu KHÔNG tất định. Chỉ cần thầy nạp thêm
// một đề vào ca là mọi điểm chấm lại của ca ấy sai, không cảnh báo gì.
//
// CÁCH CHỮA: bài làm đã ghi đáp án THEO QID, và `giayCau` ghi cả câu em xem mà
// bỏ trống. Gộp hai nguồn ra đúng bộ câu đã phát. Không đoán, không rút lại.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import type { PublicExamBank } from '../src/data/examContent'

const GOM = fs.readFileSync(path.join(process.cwd(), 'src/lib/phieu-ca-ca.ts'), 'utf8')

const mcq = (id: string) => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct: 'A' })
const tf = (id: string) => ({ id, text: id, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'] })
const sa = (id: string) => ({ id, text: id, correct: '1' })

/** Kho lúc THI: đúng một đề 18/4/6. */
function khoMotDe(): PublicExamBank {
  return {
    phanI: Array.from({ length: 18 }, (_, i) => mcq(`A-I-${i}`)),
    phanII: Array.from({ length: 4 }, (_, i) => tf(`A-II-${i}`)),
    phanIII: Array.from({ length: 6 }, (_, i) => sa(`A-III-${i}`)),
    soCau: { I: 18, II: 4, III: 6 },
  } as unknown as PublicExamBank
}

/** Kho SAU KHI thầy nạp thêm hai đề: 54/12/18. Cùng ca, cùng SBD. */
function khoBaDe(): PublicExamBank {
  const k = khoMotDe() as unknown as { phanI: unknown[]; phanII: unknown[]; phanIII: unknown[] }
  return {
    phanI: [...(k.phanI as ReturnType<typeof mcq>[]), ...Array.from({ length: 36 }, (_, i) => mcq(`B-I-${i}`))],
    phanII: [...(k.phanII as ReturnType<typeof tf>[]), ...Array.from({ length: 8 }, (_, i) => tf(`B-II-${i}`))],
    phanIII: [...(k.phanIII as ReturnType<typeof sa>[]), ...Array.from({ length: 12 }, (_, i) => sa(`B-III-${i}`))],
    soCau: { I: 18, II: 4, III: 6 },
  } as unknown as PublicExamBank
}

describe('TÁI HIỆN LỖI: kho đổi thì rút lại ra bộ câu KHÁC', () => {
  it('cùng ca cùng em, kho 1 đề và kho 3 đề cho hai bộ câu khác nhau', () => {
    const a = assignStudentQuestions(khoMotDe(), '890691', '10026')
    const b = assignStudentQuestions(khoBaDe(), '890691', '10026')
    const idA = a.phanI.map((x) => x.qid).sort()
    const idB = b.phanI.map((x) => x.qid).sort()
    expect(idA).toHaveLength(18)
    expect(idB).toHaveLength(18)
    const chung = idA.filter((x) => idB.includes(x)).length
    // eslint-disable-next-line no-console
    console.log(`[chấm lại] kho 1 đề so kho 3 đề — Phần I trùng ${chung}/18 câu`)
    expect(idA).not.toEqual(idB)
    // Đây chính là chỗ điểm rơi về mức đoán mò.
    expect(chung).toBeLessThan(18)
  })
})

describe('CHỮA: đưa bộ câu THẬT vào thì rút lại ra ĐÚNG bộ ấy', () => {
  const boThat = {
    '10026': [
      ...Array.from({ length: 18 }, (_, i) => `A-I-${i}`),
      ...Array.from({ length: 4 }, (_, i) => `A-II-${i}`),
      ...Array.from({ length: 6 }, (_, i) => `A-III-${i}`),
    ],
  }

  it('kho 3 đề + bộ câu thật ⇒ ra ĐÚNG bộ em đã làm', () => {
    const kho = { ...khoBaDe(), boTheoEm: boThat } as unknown as PublicExamBank
    const a = assignStudentQuestions(kho, '890691', '10026')
    expect(a.phanI.map((x) => x.qid).sort()).toEqual(boThat['10026'].filter((x) => x.includes('-I-')).sort())
    expect(a.phanII).toHaveLength(4)
    expect(a.phanIII).toHaveLength(6)
  })

  it('trùng khít với bộ rút từ kho MỘT ĐỀ — tức đúng bộ lúc thi', () => {
    const kho = { ...khoBaDe(), boTheoEm: boThat } as unknown as PublicExamBank
    const moi = assignStudentQuestions(kho, '890691', '10026').phanI.map((x) => x.qid).sort()
    const luc = assignStudentQuestions(khoMotDe(), '890691', '10026').phanI.map((x) => x.qid).sort()
    expect(moi).toEqual(luc)
  })
})

describe('MẪU SỐ KHÔNG ĐƯỢC CO LẠI khi em bỏ trống câu', () => {
  // Ca 890691 thật: 27/28 em dựng lại đủ 18/4/6, riêng em 10016 ra 18/4/5 vì bỏ
  // trống một câu Phần III và không dừng lại ở đó nên `giayCau` cũng không ghi.
  //
  // Bù phải làm ở `gomCa` — nơi BIẾT danh sách là dựng lại — chứ KHÔNG làm trong
  // `assignStudentQuestions`. `boTheoEm` của ca chẩn đoán là danh sách CHỐT và
  // đã đầy đủ; bù vào đó là nhét câu em chưa từng thấy. Phép kiểm
  // `de-rieng-nhan` bắt đúng chỗ tôi từng gộp nhầm hai khái niệm này.
  it('`boTheoEm` CHỐT thì assignStudentQuestions KHÔNG bù — giữ nguyên nghĩa cũ', () => {
    const kho = { ...khoBaDe(), boTheoEm: { '10016': ['A-I-0', 'A-I-1'] } } as unknown as PublicExamBank
    const a = assignStudentQuestions(kho, '890691', '10016')
    expect(a.phanI.map((x) => x.qid)).toEqual(['A-I-0', 'A-I-1'])
  })

  it('`gomCa` bù cho đủ `soCau`, và bù tất định', () => {
    expect(GOM).toContain('const buCho = (cua: Set<string>, kho: { id: string }[], can: number, tag: string): string[] =>')
    expect(GOM).toContain('if (cuaEm.length >= can) return cuaEm')
    expect(GOM).toContain('sc?.I ?? khoI.length')
    expect(GOM).toContain('sc?.III ?? khoIII.length')
    // Bù bằng `pick` dùng chung, không viết bản rút thứ hai.
    expect(GOM).toContain("import { pick } from './exam-assign'")
  })
})

describe('`gomCa` phải dựng bộ câu TỪ BÀI LÀM', () => {
  it('gộp qid của đáp án VÀ của `giayCau` — câu bỏ trống chỉ còn dấu ở giayCau', () => {
    expect(GOM).toContain('const boTuBaiLam: Record<string, string[]> = {}')
    expect(GOM).toContain("for (const k of Object.keys(l.dapAn.phanI ?? {})) cu.add(k)")
    expect(GOM).toContain("for (const k of Object.keys(l.giayCau ?? {})) cu.add(k)")
  })

  it('ca CÓ `boTheoEm` đã lưu thì dùng bản đã lưu — đó là bản chốt lúc phát đề', () => {
    expect(GOM).toContain('const boTheoEm = rieng?.boTheoEm ?? boTuBaiLam')
  })

  it('CẢ HAI đường chấm và dựng phiếu đều dùng bộ ấy, không còn `rieng?.boTheoEm` trần', () => {
    expect(GOM).toContain('gradeSubmissionFull(bank!, ct.ca.maCa, sbd, moiNhat.dapAn, sc, boTheoEm)')
    expect(GOM).toContain('mergeKeepAnswers(bank, sc, boTheoEm)')
    expect(GOM).not.toContain('rieng?.boTheoEm)')
  })
})
