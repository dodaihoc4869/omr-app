// RÚT ĐÚNG SỐ CÂU KHI CA BẬT ĐỀ RIÊNG TỪNG EM.
//
// Thầy báo 14/09: "tôi đặt 8 trắc nghiệm 2 đúng sai và 2 trả lời ngắn, rút 30%
// câu sai ra nếu chưa đủ tổng 12 câu thì rút tiếp các câu hỏi mới ở trong bài
// đã tick". Màn làm bài hiện "PHẦN I — Trắc nghiệm (4 câu)" trong khi thầy đặt
// 8 — em nhận thiếu 4 câu và máy không nói một tiếng nào.
//
// NGUYÊN NHÂN GỐC: nhánh "đề riêng" của `assignStudentQuestions` chỉ LỌC gói đề
// theo bản đồ `boTheoEm` rồi trả về luôn. Bản đồ rơi mất câu nào — câu ấy không
// nằm trong gói đề đã phát, hoặc lúc dựng bản đồ kho còn thiếu — thì em nhận
// thiếu đúng chừng ấy câu. Không bù, không báo.
//
// Luật đúng: câu khắc phục lỗi sai vào trước, rồi RÚT TIẾP câu mới trong chính
// gói đề của ca (kho thầy đã tick) cho đủ chỉ tiêu từng phần.
import { describe, expect, it } from 'vitest'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import type { PublicExamBank } from '../src/data/examContent'

const mcq = (i: number) => ({ id: `Q-I-${i}`, text: `Câu trắc nghiệm ${i}`, choices: ['A', 'B', 'C', 'D'] })
const tf = (i: number) => ({ id: `Q-II-${i}`, text: `Câu đúng sai ${i}`, ideas: ['a', 'b', 'c', 'd'] })
const sa = (i: number) => ({ id: `Q-III-${i}`, text: `Câu trả lời ngắn ${i}` })

function khoTick(soI = 30, soII = 10, soIII = 10): PublicExamBank {
  return {
    phanI: Array.from({ length: soI }, (_, i) => mcq(i + 1)),
    phanII: Array.from({ length: soII }, (_, i) => tf(i + 1)),
    phanIII: Array.from({ length: soIII }, (_, i) => sa(i + 1)),
    soCau: { I: 8, II: 2, III: 2 },
  } as unknown as PublicExamBank
}
const dat = (b: PublicExamBank, m: Record<string, string[]>) => {
  ;(b as unknown as { boTheoEm: Record<string, string[]> }).boTheoEm = m
  return b
}

const SBD = '12121212'
const MA_CA = '561169'

describe('đề riêng từng em — rút đủ số câu thầy đặt', () => {
  it('bản đồ chỉ có 4 câu khắc phục thì vẫn phải phát đủ 8/2/2', () => {
    // 30% của 12 câu sai ca trước = 4 câu khắc phục, đều rơi vào phần I.
    const bank = dat(khoTick(), { [SBD]: ['Q-I-3', 'Q-I-7', 'Q-I-11', 'Q-I-19'] })
    const a = assignStudentQuestions(bank, MA_CA, SBD)
    expect(a.phanI.length).toBe(8)
    expect(a.phanII.length).toBe(2)
    expect(a.phanIII.length).toBe(2)
    // BỐN CÂU KHẮC PHỤC PHẢI CÒN NGUYÊN — bù thêm không được đẩy chúng ra.
    const idI = a.phanI.map((x) => x.qid)
    for (const q of ['Q-I-3', 'Q-I-7', 'Q-I-11', 'Q-I-19']) expect(idI).toContain(q)
    expect(new Set(idI).size).toBe(idI.length)
  })

  it('bản đồ trỏ vào câu KHÔNG có trong gói đề thì vẫn phát đủ, không phát bài rỗng', () => {
    const bank = dat(khoTick(), { [SBD]: ['NGOAI-KHO-1', 'NGOAI-KHO-2', 'Q-II-4'] })
    const a = assignStudentQuestions(bank, MA_CA, SBD)
    expect(a.phanI.length).toBe(8)
    expect(a.phanII.length).toBe(2)
    expect(a.phanIII.length).toBe(2)
    expect(a.phanII.map((x) => x.qid)).toContain('Q-II-4')
  })

  it('kho ít hơn chỉ tiêu thì trả đúng những gì có, không bịa câu', () => {
    const a = assignStudentQuestions(dat(khoTick(5, 1, 1), { [SBD]: ['Q-I-2'] }), MA_CA, SBD)
    expect(a.phanI.length).toBe(5)
    expect(a.phanII.length).toBe(1)
    expect(a.phanIII.length).toBe(1)
  })

  it('hai lần gọi ra ĐÚNG một bộ câu — chấm lại không được lệch điểm', () => {
    const a1 = assignStudentQuestions(dat(khoTick(), { [SBD]: ['Q-I-3'] }), MA_CA, SBD)
    const a2 = assignStudentQuestions(dat(khoTick(), { [SBD]: ['Q-I-3'] }), MA_CA, SBD)
    expect(a1.phanI.map((x) => x.qid)).toEqual(a2.phanI.map((x) => x.qid))
    expect(a1.phanIII.map((x) => x.qid)).toEqual(a2.phanIII.map((x) => x.qid))
  })

  it('hai em khác nhau thì phần bù khác nhau — không phải cả lớp một đề', () => {
    const b = dat(khoTick(), { '111': ['Q-I-3'], '222': ['Q-I-3'] })
    const a1 = assignStudentQuestions(b, MA_CA, '111')
    const a2 = assignStudentQuestions(b, MA_CA, '222')
    expect(a1.phanI.map((x) => x.qid)).not.toEqual(a2.phanI.map((x) => x.qid))
  })

  it('CA CŨ KHÔNG GHI soCau thì giữ nguyên hành vi cũ — cấm đổi điểm ca đã gửi phụ huynh', () => {
    const bank = dat(khoTick(), { [SBD]: ['Q-I-3', 'Q-II-1'] })
    delete (bank as unknown as { soCau?: unknown }).soCau
    const a = assignStudentQuestions(bank, MA_CA, SBD)
    expect(a.phanI.length).toBe(1)
    expect(a.phanII.length).toBe(1)
    expect(a.phanIII.length).toBe(0)
  })

  it('câu khắc phục KHÔNG dồn lên đầu — giữ đúng thứ tự kho', () => {
    const a = assignStudentQuestions(dat(khoTick(), { [SBD]: ['Q-I-19', 'Q-I-25'] }), MA_CA, SBD)
    const ids = a.phanI.map((x) => x.qid)
    expect(ids.length).toBe(8)
    const soThuTu = ids.map((x) => Number(x.replace('Q-I-', '')))
    expect([...soThuTu].sort((p, q) => p - q)).toEqual(soThuTu)
    expect(ids[0]).not.toBe('Q-I-19')
  })
})
