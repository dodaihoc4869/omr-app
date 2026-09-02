// Chi tiết từng câu của một lượt (QUANLYCATHI mục 5): đúng thứ tự em nhìn
// thấy, đủ chuyên đề/mức độ/đáp án chọn/đáp án đúng/đúng-sai/giây làm câu.
import { describe, expect, it } from 'vitest'
import { taoBaiGhiDiem, taoChiTietCau } from '../src/lib/chi-tiet-cau'
import { gradeFromKeyBank } from '../src/lib/exam-grade'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { khoiTuNamSinh } from '../src/lib/exam-api'
import type { TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../src/data/examContent'

const mcq = (n: number, correct: 'A' | 'B' | 'C' | 'D', chuyenDe?: string, mucDo?: 'biet' | 'hieu' | 'van_dung'): TeacherMcqQuestion => ({
  id: `T-I-${n}`,
  text: `Câu ${n}`,
  choices: ['a', 'b', 'c', 'd'],
  correct,
  chuyenDe,
  mucDo,
})
const tf = (n: number): TeacherTrueFalseQuestion => ({ id: `T-II-${n}`, text: `ĐS ${n}`, ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'], chuyenDe: 'Điện hoá', mucDo: 'hieu' })
const sa = (n: number): TeacherShortAnswerQuestion => ({ id: `T-III-${n}`, text: `TLN ${n}`, correct: '12,5', chuyenDe: 'Este', mucDo: 'van_dung' })

const bank = {
  phanI: [mcq(1, 'A', 'Este – lipid', 'biet'), mcq(2, 'B'), mcq(3, 'C', 'Polymer', 'van_dung')],
  phanII: [tf(1)],
  phanIII: [sa(1)],
}

describe('taoChiTietCau', () => {
  it('mỗi câu em được gán một dòng, đúng thứ tự hiển thị, đủ cột (kiểm chứng 12)', () => {
    const asg = assignStudentQuestions(bank, '123456', 'HS01')
    const q1 = asg.phanI[0].question as TeacherMcqQuestion
    const answers = { phanI: { [asg.phanI[0].qid]: q1.correct }, phanII: { [asg.phanII[0].qid]: ['D', 'S', 'D', 'S'] as ('D' | 'S' | null)[] }, phanIII: { [asg.phanIII[0].qid]: '12.5' } }
    const giayCau = { [asg.phanI[0].qid]: 41.6, [asg.phanIII[0].qid]: -3 }
    const rows = taoChiTietCau(bank, '123456', 'HS01', answers, giayCau)
    expect(rows).toHaveLength(asg.phanI.length + asg.phanII.length + asg.phanIII.length)
    expect(rows[0]).toEqual({ phan: 'I', soCau: 1, qid: asg.phanI[0].qid, chuyenDe: q1.chuyenDe ?? '', mucDo: q1.mucDo ?? '', dapAnChon: q1.correct, dapAnDung: q1.correct, dungSai: true, giay: 42 })
    // câu không trả lời → sai, đáp án chọn rỗng
    const bo = rows.find((r) => r.phan === 'I' && r.qid === asg.phanI[1].qid)!
    expect(bo.dapAnChon).toBe('')
    expect(bo.dungSai).toBe(false)
    // Phần II so cả 4 ý, Phần III so sau khi quy dấu phẩy
    const ds = rows.find((r) => r.phan === 'II')!
    expect(ds).toMatchObject({ dapAnChon: 'DSDS', dapAnDung: 'DSDS', dungSai: true, chuyenDe: 'Điện hoá', mucDo: 'hieu' })
    const tln = rows.find((r) => r.phan === 'III')!
    expect(tln).toMatchObject({ dapAnChon: '12.5', dapAnDung: '12,5', dungSai: true, giay: null })
    // thiếu chuyên đề → chuỗi rỗng, không bịa
    for (const r of rows) expect(typeof r.chuyenDe).toBe('string')
  })

  it('taoBaiGhiDiem gói điểm từng phần đúng bằng engine chấm', () => {
    const asg = assignStudentQuestions(bank, '123456', 'HS02')
    const answers = { phanI: {}, phanII: {}, phanIII: { [asg.phanIII[0].qid]: '12,5' } }
    const graded = gradeFromKeyBank(bank, '123456', 'HS02', answers)
    const bai = taoBaiGhiDiem(bank, '123456', 'HS02', 2, answers, graded, null, 'may-A')
    expect(bai.lanThu).toBe(2)
    expect(bai.idThietBi).toBe('may-A')
    expect(bai.diem.tong).toBe(graded.score.total)
    expect(bai.diem.III).toBe(0.25)
    expect(bai.cau.filter((c) => c.dungSai).length).toBe(1)
  })
})

describe('khoiTuNamSinh', () => {
  it('năm học 2026–2027 (từ tháng 9): sinh 2010 → khối 11, 2009 → 12, 2011 → 10', () => {
    const t = new Date('2026-09-15T00:00:00')
    expect(khoiTuNamSinh('2010', t)).toBe(11)
    expect(khoiTuNamSinh(2009, t)).toBe(12)
    expect(khoiTuNamSinh('2011', t)).toBe(10)
  })
  it('trước tháng 9 vẫn tính năm học cũ; giá trị lạ → null', () => {
    expect(khoiTuNamSinh('2010', new Date('2026-05-01T00:00:00'))).toBe(10)
    expect(khoiTuNamSinh('abc')).toBeNull()
    expect(khoiTuNamSinh('1980')).toBeNull()
  })
})
