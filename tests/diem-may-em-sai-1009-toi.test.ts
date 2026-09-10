// ĐIỂM BẬT LÊN LÚC THI XONG BỊ SAI, VÀ MÀN XEM LẠI BÀY RA TOÀN CÂU LẠ.
//
// Thầy báo 21:03 ngày 10/09, kèm ảnh màn Ca thi. Ca 234641 "2009 - Lớp 1:1 - L2",
// đề riêng, mẫu số 8/2/2 rút từ kho 26/9/9.
//
//   Màn của thầy (chấm lại tại chỗ)   Sheet (điểm máy EM tự ghi lúc nộp)
//   ─────────────────────────────────  ──────────────────────────────────
//   Đỗ Anh Toàn      8,88              3,13
//   Lưu Ngọc Tuân    7,56              1,88
//   Trần Minh Đăng   5,69              2,56
//
// Tôi tính tay lại từ đáp án thô của hai em, ra ĐÚNG con số bên trái. Máy em sai.
//
// NGUYÊN NHÂN GỐC — ĐÚNG LỖI SÁNG NAY, NỬA CÒN LẠI.
//
// Sáng 10/09 `gomCa` ở máy thầy rút lại bộ câu bằng `hash(mãCa + SBD)` nên chấm
// đè điểm 28 em ca 890691; đã vá (commit 480e6ef). Nhưng máy EM cũng chấm, bằng
// `gradeFromKeyBank`, và hàm đó cũng gọi `assignStudentQuestions`.
//
// `keyBank` máy chủ trả về sau khi nộp là CẢ KHO của ca kèm `soCau`, KHÔNG kèm
// `boTheoEm`. Không có `boTheoEm` thì hạt giống rút ra một bộ 8 câu KHÁC HẲN bộ
// em vừa làm. Đáp án của em lưu theo qid, mà qid rút lại phần lớn không nằm
// trong bài, nên hầu hết câu tính là bỏ trống ⇒ điểm rơi xuống mức đoán mò.
//
// Cùng một chỗ hỏng gây ra vế thứ hai của lời thầy báo — "các câu trong đề hiển
// thị sai hết": màn Xem lại lời giải dựng từ chính bộ rút lại đó, nên em ngồi
// đọc lời giải của những câu em chưa từng nhìn thấy.
import { describe, expect, it } from 'vitest'
import { gradeFromKeyBank } from '../src/lib/exam-grade'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { boCauTuBaiLam } from '../src/lib/bo-cau-tu-bai-lam'
import type { AnswerRecord } from '../src/lib/exam-db'

const MA_CA = '234641'

/** Đáp án đúng của đúng những câu hai em đã làm — chép từ keyBank thật của ca. */
const DAP_AN_THAT: Record<string, string> = {
  '12-C1-B1-D1-I-19': 'D',
  '12-C1-B1-D1-I-26': 'C',
  '12-C1-B1-D1-I-34': 'D',
  '12-C1-B1-D1-I-47': 'C',
  '12-C1-B1-D1-I-90': 'B',
  '12-C1-B1-D2-I-2': 'C',
  '12-C1-B1-D2-I-4': 'B',
  '12-C1-B1-D2-I-11': 'B',
  '12-C1-B1-D3-I-7': 'C',
  '12-C1-B1-D3-I-11': 'C',
  '12-C1-B2-I-38': 'B',
}
const DAP_AN_II: Record<string, string> = {
  '12-C1-B1-D2-II-1': 'DSSD',
  '12-C1-B1-D2-II-2': 'DSDS',
  '12-C1-B1-D2-II-17': 'DDSD',
  '12-C1-B1-D3-II-10': 'DDSD',
}
const DAP_AN_III: Record<string, string> = {
  '12-C1-B1-D1-III-1': '3',
  '12-C1-B1-D3-III-3': '2',
  '12-C1-B1-D3-III-16': '82,3',
}

/** Kho THẬT của ca: 26 câu Phần I, 9 Phần II, 9 Phần III. Câu nào không nằm
 * trong bài của hai em thì đáp án là 'A' — không em nào chạm tới. */
function khoCa() {
  const mcq = (id: string) => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct: DAP_AN_THAT[id] ?? 'A' })
  const tf = (id: string) => ({ id, text: id, ideas: ['a', 'b', 'c', 'd'], correct: (DAP_AN_II[id] ?? 'DDDD').split('') })
  const sa = (id: string) => ({ id, text: id, correct: DAP_AN_III[id] ?? '0' })
  const phanI = [...Object.keys(DAP_AN_THAT), ...Array.from({ length: 15 }, (_, i) => `12-C1-B9-I-${i}`)].map(mcq)
  const phanII = [...Object.keys(DAP_AN_II), ...Array.from({ length: 5 }, (_, i) => `12-C1-B9-II-${i}`)].map(tf)
  const phanIII = [...Object.keys(DAP_AN_III), ...Array.from({ length: 6 }, (_, i) => `12-C1-B9-III-${i}`)].map(sa)
  expect(phanI).toHaveLength(26)
  expect(phanII).toHaveLength(9)
  expect(phanIII).toHaveLength(9)
  // Đúng dáng gói máy chủ trả về sau khi nộp: CẢ KHO + `soCau`, KHÔNG có `boTheoEm`.
  return { phanI, phanII, phanIII, soCau: { I: 8, II: 2, III: 2 } } as never
}

const BAI_12124: AnswerRecord = {
  phanI: {
    '12-C1-B1-D1-I-34': 'A',
    '12-C1-B1-D1-I-47': 'C',
    '12-C1-B1-D1-I-19': 'D',
    '12-C1-B1-D1-I-90': 'A',
    '12-C1-B1-D3-I-7': 'A',
    '12-C1-B1-D3-I-11': 'D',
    '12-C1-B2-I-38': 'B',
    '12-C1-B1-D2-I-4': 'D',
  },
  phanII: {
    '12-C1-B1-D2-II-1': ['D', 'S', 'S', 'D'],
    '12-C1-B1-D2-II-17': ['D', 'D', 'S', 'D'],
  },
  phanIII: { '12-C1-B1-D1-III-1': '21' },
} as never

const BAI_12125: AnswerRecord = {
  phanI: {
    '12-C1-B1-D1-I-26': 'C',
    '12-C1-B1-D1-I-34': 'D',
    '12-C1-B1-D1-I-47': 'C',
    '12-C1-B1-D2-I-2': 'B',
    '12-C1-B1-D2-I-11': 'B',
    '12-C1-B1-D3-I-7': 'A',
    '12-C1-B2-I-38': 'B',
  },
  phanII: {
    '12-C1-B1-D2-II-2': ['D', 'S', 'D', 'S'],
    '12-C1-B1-D3-II-10': ['D', 'D', 'S', 'D'],
  },
  phanIII: { '12-C1-B1-D3-III-3': '3', '12-C1-B1-D3-III-16': '82,3' },
} as never

const qidCua = (b: AnswerRecord) => [...Object.keys(b.phanI), ...Object.keys(b.phanII), ...Object.keys(b.phanIII)]

/** Đúng cách bên gọi PHẢI dùng: dựng qua `boCauTuBaiLam` để có bù mẫu số. */
const boCua = (sbd: string, b: AnswerRecord) => boCauTuBaiLam(khoCa(), MA_CA, sbd, b, undefined, { I: 8, II: 2, III: 2 })

describe('TÁI HIỆN LỖI: không đưa bộ câu vào thì máy em chấm nhầm đề', () => {
  it('hạt giống rút ra bộ câu KHÁC bộ em đã làm', () => {
    const a = assignStudentQuestions(khoCa(), MA_CA, '12124')
    const daLam = new Set(Object.keys(BAI_12124.phanI))
    const trung = a.phanI.filter((x) => daLam.has(x.qid)).length
    // eslint-disable-next-line no-console
    console.log(`[máy em] Phần I: bộ rút lại trùng ${trung}/8 câu em thật sự đã làm`)
    expect(a.phanI).toHaveLength(8)
    expect(trung).toBeLessThan(8)
  })

  it('điểm chấm theo bộ rút lại THẤP HƠN hẳn điểm thật — đúng thứ thầy thấy', () => {
    const sai = gradeFromKeyBank(khoCa(), MA_CA, '12124', BAI_12124).score.total
    const dung = gradeFromKeyBank(khoCa(), MA_CA, '12124', BAI_12124, boCua('12124', BAI_12124)).score.total
    // eslint-disable-next-line no-console
    console.log(`[máy em] 12124 — chấm nhầm đề ${sai} · chấm đúng đề ${dung}`)
    expect(sai).toBeLessThan(dung)
  })
})

describe('CHỮA: đưa bộ câu của em vào thì ra ĐÚNG điểm trên màn của thầy', () => {
  it('12124 Trần Minh Đăng = 5,69', () => {
    const g = gradeFromKeyBank(khoCa(), MA_CA, '12124', BAI_12124, boCua('12124', BAI_12124))
    // Phần I 3/8 đúng = 3 × 0,5625 = 1,69 · Phần II 2 câu trọn = 4,00 · Phần III 0/2 = 0
    expect(g.score.phanIScore).toBeCloseTo(1.69, 2)
    expect(g.score.phanIIScore).toBeCloseTo(4, 2)
    expect(g.score.phanIIIScore).toBeCloseTo(0, 2)
    expect(g.score.total).toBeCloseTo(5.69, 2)
  })

  it('12125 Lưu Ngọc Tuân = 7,56', () => {
    const g = gradeFromKeyBank(khoCa(), MA_CA, '12125', BAI_12125, boCua('12125', BAI_12125))
    // Phần I 5/8 đúng = 2,81 · Phần II 2 câu trọn = 4,00 · Phần III 1/2 = 0,75
    expect(g.score.phanIScore).toBeCloseTo(2.81, 2)
    expect(g.score.phanIIScore).toBeCloseTo(4, 2)
    expect(g.score.phanIIIScore).toBeCloseTo(0.75, 2)
    expect(g.score.total).toBeCloseTo(7.56, 2)
  })
})

describe('MẪU SỐ KHÔNG ĐƯỢC CO LẠI khi em bỏ trống câu', () => {
  // 12125 chỉ trả lời 7 câu Phần I và 1 câu Phần III. `scoreStudent` lấy ĐỘ DÀI
  // danh sách làm mẫu số, nên danh sách thiếu là điểm bị thổi lên.
  it('`boCauTuBaiLam` bù cho đủ 8/2/2 dù em bỏ trống', () => {
    const bo = boCauTuBaiLam(khoCa(), MA_CA, '12125', BAI_12125, undefined, { I: 8, II: 2, III: 2 })
    expect(bo).toHaveLength(12)
    const a = assignStudentQuestions({ ...(khoCa() as object), boTheoEm: { '12125': bo } } as never, MA_CA, '12125')
    expect(a.phanI).toHaveLength(8)
    expect(a.phanII).toHaveLength(2)
    expect(a.phanIII).toHaveLength(2)
  })

  it('bù TẤT ĐỊNH — hai lần dựng ra đúng một danh sách', () => {
    const m = () => boCauTuBaiLam(khoCa(), MA_CA, '12125', BAI_12125, undefined, { I: 8, II: 2, III: 2 })
    expect(m()).toEqual(m())
  })

  it('câu bù KHÔNG cho điểm — em không trả lời nó nên luôn sai', () => {
    expect(gradeFromKeyBank(khoCa(), MA_CA, '12125', BAI_12125, boCua('12125', BAI_12125)).score.total).toBeCloseTo(7.56, 2)
  })

  // CHỐT CHẶN CHO NGƯỜI SỬA SAU. Truyền THẲNG danh sách qid trong bài (không
  // qua `boCauTuBaiLam`) trông có vẻ gọn hơn, và với em trả lời đủ thì đúng —
  // nhưng em bỏ trống một câu là mẫu số co lại và điểm bị THỔI LÊN. 12125 trả
  // lời 7/8 câu Phần I: bù đúng ra 2,81, không bù thành 3,21.
  it('KHÔNG được truyền thẳng qid trong bài — mẫu số co lại, điểm thổi lên', () => {
    const khongBu = gradeFromKeyBank(khoCa(), MA_CA, '12125', BAI_12125, qidCua(BAI_12125)).score.phanIScore
    const coBu = gradeFromKeyBank(khoCa(), MA_CA, '12125', BAI_12125, boCua('12125', BAI_12125)).score.phanIScore
    // eslint-disable-next-line no-console
    console.log(`[mẫu số] Phần I — không bù ${khongBu} (chia 7) · có bù ${coBu} (chia 8)`)
    expect(khongBu).toBeGreaterThan(coBu)
    expect(coBu).toBeCloseTo(2.81, 2)
  })

  it('`giayCau` cũng là dấu vết: câu em XEM rồi bỏ trống vẫn vào bộ', () => {
    const bo = boCauTuBaiLam(khoCa(), MA_CA, '12125', BAI_12125, { '12-C1-B1-D1-I-90': 12 }, { I: 8, II: 2, III: 2 })
    expect(bo).toContain('12-C1-B1-D1-I-90')
  })
})

describe('MÀN XEM LẠI dùng CHUNG bộ câu ấy — không dựng bộ thứ hai', () => {
  it('bộ câu cho màn xem lại trùng khít bài em đã nộp', () => {
    const bo = boCua('12124', BAI_12124)
    const a = assignStudentQuestions({ ...(khoCa() as object), boTheoEm: { '12124': bo } } as never, MA_CA, '12124')
    const hien = [...a.phanI, ...a.phanII, ...a.phanIII].map((x) => x.qid).sort()
    expect(hien).toEqual([...bo].sort())
    // Mọi câu em ĐÃ LÀM đều phải có mặt trong màn xem lại.
    for (const q of qidCua(BAI_12124)) expect(hien).toContain(q)
  })
})
