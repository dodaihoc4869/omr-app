// VÁ 19/09 — sự cố "chọn rút đề chương 1 Ester nhưng đề ra cả chương 2
// Carbohidrate" (thầy báo qua ảnh chụp nhóm chat phụ huynh: "8 câu chương 2",
// "4 câu chương 2 sai hết", "2 câu chương 2").
//
// NGUYÊN NHÂN GỐC: `dungDeRiengChoCa` (de-rieng-nguon.ts) có bước "BÙ KHO" —
// khi kho câu Chương 1 (đúng chuyên đề thầy chọn lúc mở ca) không đủ số câu
// mỗi phần cho CẢ LỚP (đề mới, ít câu, hoặc đã loại bớt câu sao), phần thiếu
// được lấp bằng `loadExamSources()` — TOÀN BỘ kho câu trên máy thầy, không
// lọc chuyên đề. Khác với "câu khắc phục" (30% câu em từng sai — thầy chủ
// động chốt 08/09 "bất kể chuyên đề gì"), bù kho không có lý do gì lấy chuyên
// đề khác — đây là khoảng trống ngoài ý định, không phải tính năng.
//
// `locKhoToanBoTheoChuyenDeCa` là hàm THUẦN LOGIC tách riêng để test không
// cần giả lập mạng/IndexedDB — chỉ cần đúng khối lọc trước khi bù, không cần
// dựng lại toàn bộ `dungDeRiengChoCa`.
import { describe, expect, it } from 'vitest'
import { locKhoToanBoTheoChuyenDeCa } from '../src/lib/de-rieng-nguon'
import type { TeacherExamSource, TeacherMcqQuestion } from '../src/data/examContent'

function cauI(id: string, chuyenDe: string): TeacherMcqQuestion {
  return { id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe } as TeacherMcqQuestion
}

const KHO_TOAN_BO: TeacherExamSource[] = [
  {
    maDe: 'kho-tong',
    phanI: [
      cauI('E-1', 'Ester – lipid'),
      cauI('E-2', 'Ester – lipid'),
      cauI('C-1', 'Carbohydrate'),
      cauI('C-2', 'Carbohydrate'),
      cauI('A-1', 'Amin'),
    ],
    phanII: [],
    phanIII: [],
  },
]

describe('locKhoToanBoTheoChuyenDeCa (vá 19/09)', () => {
  it('ca chỉ chọn chương Ester ⇒ bù kho CHỈ được lấy câu Ester, không lấy Carbohydrate/Amin', () => {
    const bankGocCa: TeacherExamSource[] = [{ maDe: 'ca-1', phanI: [cauI('E-9', 'Ester – lipid')], phanII: [], phanIII: [] }]
    const loc = locKhoToanBoTheoChuyenDeCa(KHO_TOAN_BO, bankGocCa)
    const ids = loc.flatMap((s) => s.phanI).map((q) => q.id)
    expect(ids).toEqual(['E-1', 'E-2'])
    expect(ids).not.toContain('C-1')
    expect(ids).not.toContain('C-2')
    expect(ids).not.toContain('A-1')
  })

  it('ca chọn NHIỀU chuyên đề (thầy mở ca gộp) ⇒ bù kho lấy đúng các chuyên đề đó, không hơn', () => {
    const bankGocCa: TeacherExamSource[] = [
      { maDe: 'ca-1', phanI: [cauI('E-9', 'Ester – lipid'), cauI('C-9', 'Carbohydrate')], phanII: [], phanIII: [] },
    ]
    const loc = locKhoToanBoTheoChuyenDeCa(KHO_TOAN_BO, bankGocCa)
    const ids = loc.flatMap((s) => s.phanI).map((q) => q.id)
    expect(ids.sort()).toEqual(['C-1', 'C-2', 'E-1', 'E-2'])
    expect(ids).not.toContain('A-1')
  })

  it('kho gốc của ca KHÔNG câu nào gắn chuyên đề (dữ liệu cũ) ⇒ trả nguyên kho toàn bộ, không lọc mù', () => {
    const bankGocCa: TeacherExamSource[] = [{ maDe: 'ca-1', phanI: [{ id: 'X-1', text: 'Câu X-1', choices: ['a', 'b', 'c', 'd'], correct: 'A' } as TeacherMcqQuestion], phanII: [], phanIII: [] }]
    const loc = locKhoToanBoTheoChuyenDeCa(KHO_TOAN_BO, bankGocCa)
    const ids = loc.flatMap((s) => s.phanI).map((q) => q.id)
    expect(ids.sort()).toEqual(['A-1', 'C-1', 'C-2', 'E-1', 'E-2'])
  })

  it('so khớp chuyên đề không phân biệt hoa thường / dấu / gạch ngang (chuanChuyenDe)', () => {
    const bankGocCa: TeacherExamSource[] = [{ maDe: 'ca-1', phanI: [cauI('E-9', 'ESTER - LIPID')], phanII: [], phanIII: [] }]
    const loc = locKhoToanBoTheoChuyenDeCa(KHO_TOAN_BO, bankGocCa)
    const ids = loc.flatMap((s) => s.phanI).map((q) => q.id)
    expect(ids).toEqual(['E-1', 'E-2'])
  })
})
