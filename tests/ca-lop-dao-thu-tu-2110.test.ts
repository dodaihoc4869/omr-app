// CA "CẢ LỚP CÙNG MỘT ĐỀ" CÓ PHÒNG CHỜ — VẪN ĐẢO THỨ TỰ CÂU (sửa 21/10).
//
// Lỗi: bấm Bắt đầu với ≥ 2 em ở phòng chờ thì màn Theo dõi dựng bản đồ chặn trùng
// (`sinhBoTheoEm`). Kho ca Cả lớp đúng bằng số câu mỗi em ⇒ ai cũng nhận đủ kho,
// bản đồ vô nghĩa — mà có bản đồ thì máy em GIỮ THỨ TỰ KHO, tức cả phòng cùng thứ tự
// câu, trái với chữ "đảo thứ tự câu" trên màn Mở ca. Nay kho chỉ vừa một bộ thì không
// dựng bản đồ ⇒ máy em đi `pick` (hoán vị theo maCa:sbd), như ca không phòng chờ.
// Điểm không đổi: mọi đáp án và mọi phép chấm đi theo qid.
import { describe, expect, it } from 'vitest'
import { khoChiVuaMotBo } from '../src/lib/de-rieng-blueprint'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import type { PublicExamBank, TeacherExamSource } from '../src/data/examContent'

const tn = (i: number) => ({ id: `q${i}`, text: `TN ${i}`, choices: ['a', 'b', 'c', 'd'], chuyenDe: 'Ester', mucDo: 'hieu' })
const ds = (i: number) => ({ id: `d${i}`, text: `DS ${i}`, ideas: ['a', 'b', 'c', 'd'], chuyenDe: 'Ester', mucDo: 'hieu' })
const nguon = (nI: number, nII = 0) => [{ maDe: 'D', phanI: Array.from({ length: nI }, (_, i) => tn(i)), phanII: Array.from({ length: nII }, (_, i) => ds(i)), phanIII: [] }] as unknown as TeacherExamSource[]

describe('khoChiVuaMotBo', () => {
  it('mỗi phần ≤ số câu mỗi em ⇒ true; một phần rộng hơn ⇒ false', () => {
    expect(khoChiVuaMotBo(nguon(9, 2), { I: 9, II: 2, III: 0 })).toBe(true)
    expect(khoChiVuaMotBo(nguon(9, 2), { I: 18, II: 4, III: 6 })).toBe(true)
    expect(khoChiVuaMotBo(nguon(10, 2), { I: 9, II: 2, III: 0 })).toBe(false)
  })
  it('câu trùng id giữa hai tờ đếm một lần', () => {
    const hai = [...nguon(9), ...nguon(9)]
    expect(khoChiVuaMotBo(hai, { I: 9, II: 0, III: 0 })).toBe(true)
  })
})

describe('không bản đồ ⇒ cả lớp cùng bộ câu, thứ tự câu khác nhau giữa các em', () => {
  it('14 em, kho 9 câu = số câu: ai cũng đủ 9 câu, ít nhất một em khác thứ tự em đầu', () => {
    const bank = { phanI: nguon(9)[0]!.phanI, phanII: [], phanIII: [], soCau: { I: 9, II: 0, III: 0 } } as unknown as PublicExamBank
    const thuTu = Array.from({ length: 14 }, (_, i) => assignStudentQuestions(bank, '654321', String(10000 + i)).phanI.map((x) => x.qid))
    for (const t of thuTu) expect([...t].sort()).toEqual(Array.from({ length: 9 }, (_, i) => `q${i}`).sort())
    expect(new Set(thuTu.map((t) => t.join(','))).size).toBeGreaterThan(1)
    // tất định: cùng mã ca + SBD ⇒ cùng thứ tự (chấm lại ra đúng bộ cũ)
    expect(assignStudentQuestions(bank, '654321', '10003').phanI.map((x) => x.qid)).toEqual(thuTu[3])
  })
})
