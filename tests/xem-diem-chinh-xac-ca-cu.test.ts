import { describe, expect, it } from 'vitest'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { taoChiTietCau } from '../src/lib/chi-tiet-cau'
import type { PublicExamBank, TeacherMcqQuestion, TeacherTrueFalseQuestion, TeacherShortAnswerQuestion } from '../src/data/examContent'
import type { AnswerRecord } from '../src/lib/exam-db'
import * as fs from 'fs'
import * as path from 'path'

function makeMockBank(): PublicExamBank {
  const phanI: TeacherMcqQuestion[] = [
    { id: 'q1', text: 'Câu 1', choices: ['A', 'B', 'C', 'D'], correct: 'A', chuyenDe: 'Hóa vô cơ' },
    { id: 'q2', text: 'Câu 2', choices: ['A', 'B', 'C', 'D'], correct: 'B', chuyenDe: 'Hóa hữu cơ' },
    { id: 'q3', text: 'Câu 3', choices: ['A', 'B', 'C', 'D'], correct: 'C', chuyenDe: 'Hóa vô cơ' },
    { id: 'q4', text: 'Câu 4', choices: ['A', 'B', 'C', 'D'], correct: 'D', chuyenDe: 'Hóa hữu cơ' },
  ]
  const phanII: TeacherTrueFalseQuestion[] = [
    { id: 'q5', text: 'Câu 5', ideas: ['Ý 1', 'Ý 2', 'Ý 3', 'Ý 4'], correct: ['Đ', 'S', 'Đ', 'S'], chuyenDe: 'Kim loại' },
    { id: 'q6', text: 'Câu 6', ideas: ['Ý 1', 'Ý 2', 'Ý 3', 'Ý 4'], correct: ['S', 'Đ', 'S', 'Đ'], chuyenDe: 'Phi kim' },
  ]
  const phanIII: TeacherShortAnswerQuestion[] = [
    { id: 'q7', text: 'Câu 7', correct: '1.25', chuyenDe: 'Điện phân' },
    { id: 'q8', text: 'Câu 8', correct: '2.5', chuyenDe: 'Este' },
  ]
  return {
    maDe: 'TEST_CA',
    phanI,
    phanII,
    phanIII,
    soCau: { I: 2, II: 1, III: 1 },
  }
}

describe('SỬA TRIỆT ĐỂ LỖI LẪN LỘN BÁO CÁO VÀ SAI CÂU LÀM SAI TRONG LINK XEM ĐIỂM', () => {
  it('1. assignStudentQuestions đọc đúng boTheoEm cả dạng lồng { bo: { sbd: [...] } } và dạng phẳng', () => {
    const bank = makeMockBank()
    // Dạng lồng mới trong D1 ca.bo_theo_em_json
    const bankLong: PublicExamBank = {
      ...bank,
      boTheoEm: {
        bo: {
          '11001': ['q2', 'q4', 'q6', 'q8'],
          '11002': ['q1', 'q3', 'q5', 'q7'],
        },
      } as unknown as Record<string, string[]>,
    }

    const asg1 = assignStudentQuestions(bankLong, 'TEST_CA', '11001')
    expect(asg1.phanI.map((x) => x.qid)).toEqual(['q2', 'q4'])
    expect(asg1.phanII.map((x) => x.qid)).toEqual(['q6'])
    expect(asg1.phanIII.map((x) => x.qid)).toEqual(['q8'])

    const asg2 = assignStudentQuestions(bankLong, 'TEST_CA', '11002')
    expect(asg2.phanI.map((x) => x.qid)).toEqual(['q1', 'q3'])
    expect(asg2.phanII.map((x) => x.qid)).toEqual(['q5'])
    expect(asg2.phanIII.map((x) => x.qid)).toEqual(['q7'])
  })

  it('2. taoChiTietCau nhận diện đúng câu của em kể cả khi bank không có boTheoEm nhưng bài làm có đáp án', () => {
    const bank = makeMockBank()
    const answers: AnswerRecord = {
      phanI: { q2: 'B', q4: 'A' }, // q2 đúng, q4 sai (đáp án đúng là D)
      phanII: { q6: ['S', 'Đ', 'S', 'Đ'] }, // đúng cả 4 ý
      phanIII: { q8: '2.5' }, // đúng
    }

    // Không truyền boCuaEm và bank không có boTheoEm -> taoChiTietCau tự dựng từ bài làm
    const rows = taoChiTietCau(bank as any, 'TEST_CA', '11001', answers, { q2: 45, q4: 30 })

    expect(rows.map((r) => r.qid)).toEqual(['q2', 'q4', 'q6', 'q8'])
    const rQ2 = rows.find((r) => r.qid === 'q2')!
    expect(rQ2.dungSai).toBe(true)
    expect(rQ2.dapAnChon).toBe('B')
    expect(rQ2.dapAnDung).toBe('B')

    const rQ4 = rows.find((r) => r.qid === 'q4')!
    expect(rQ4.dungSai).toBe(false)
    expect(rQ4.dapAnChon).toBe('A')
    expect(rQ4.dapAnDung).toBe('D')

    const rQ6 = rows.find((r) => r.qid === 'q6')!
    expect(rQ6.dungSai).toBe(true)

    const rQ8 = rows.find((r) => r.qid === 'q8')!
    expect(rQ8.dungSai).toBe(true)
  })

  it('3. server/src/goi-cu.ts: phieuCuaEm truy vấn đủ bo_theo_em_json, so_cau_json, trả phieuSan và gắn vào bank', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../server/src/goi-cu.ts'), 'utf-8')
    const i = code.indexOf('export async function phieuCuaEm(')
    expect(i).toBeGreaterThan(0)
    const than = code.slice(i, i + 3500)

    // Truy vấn D1 phải lấy đủ trường của ca
    expect(than).toContain('c.bo_theo_em_json')
    expect(than).toContain('c.so_cau_json')
    expect(than).toContain('c.de_rieng')

    // Trả phieu đã lưu nếu có (không để báo cáo bị dựng lại khác với thầy)
    expect(than).toContain('phieu: phieuSan')
    expect(than).toContain('boTheoEm: goiRieng')
    expect(than).toContain('boCuaEm,')
    expect(than).toContain('soCau: soCauCa,')

    // Gắn vào bank để client có đủ cấu hình
    expect(than).toContain('bObj.boTheoEm = goiRieng')
    expect(than).toContain('bObj.soCau = soCauCa')
  })

  it('4. ExamTakeScreen.tsx: moLaiTuMayChu gắn boTheoEm và soCau vào bank, ưu tiên phieuSan', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/screens/ExamTakeScreen.tsx'), 'utf-8')
    const i = code.indexOf('const moLaiTuMayChu = async ()')
    expect(i).toBeGreaterThan(0)
    const than = code.slice(i, i + 3500)

    // Nạp phieuSan nếu server trả về hoặc từ layPhieu
    expect(than).toContain('setPhieuSan(b.phieu as PhieuDayDu)')

    // Gắn boTheoEm và soCau vào bank
    expect(than).toContain('boTheoEm: { [sb]: boEm }')
    expect(than).toContain('setBank(bankCoBo)')
    expect(than).toContain('setKeyBank(bankCoBo)')

    // boCauCuaEm đối chiếu attempt.answers trước khi tin assignment
    expect(code).toContain('const setBaiLam = qidDaGap(attempt.answers, attempt.giayCau)')

    // taoChiTietCau được truyền boCauCuaEm
    expect(code).toContain('taoChiTietCau(keyBank, attempt.maCa, attempt.sbd, attempt.answers, attempt.giayCau, boCauCuaEm)')

    // phieuCuaEm ưu tiên phieuSan
    expect(code).toContain('if (phieuSan) return phieuSan')
  })
})
