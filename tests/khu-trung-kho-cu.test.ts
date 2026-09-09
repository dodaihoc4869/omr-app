// KHO CŨ KHÔNG BAO GIỜ THẮNG BẢN ĐANG DÙNG.
//
// Ngày 09/09 thầy cho khôi phục 19 đề đã xoá vào nhánh "Kho cũ trước 09-09".
// Chúng chứa đúng những câu đang có trong cây theo bài, chỉ chia đề khác. Nếu
// thứ tự ưu tiên sai thì thầy tích cả hai nhánh là ra câu lặp, hoặc tệ hơn:
// bản cũ (chưa sửa đáp án, chưa có mã dạng) đè lên bản mới.
import { describe, expect, it } from 'vitest'
import { hangUuTien, khuTrungNguon, laNhanhBoDe, laNhanhKhoCu, tongBoQua } from '../src/lib/khu-trung-cau'
import type { TeacherExamSource } from '../src/data/examContent'

const mcq = (ma: string, so: number, de: string) => ({ id: `${ma}-I-${so}`, text: de, choices: ['a', 'b', 'c', 'd'], correct: 'A' }) as never
const de = (maDe: string, nhom: string, I: unknown[]): TeacherExamSource => ({ maDe, nhom, phanI: I, phanII: [], phanIII: [] }) as TeacherExamSource

describe('nhận nhánh', () => {
  it('Kho cũ', () => {
    expect(laNhanhKhoCu({ nhom: '12 · Kho cũ trước 09-09' })).toBe(true)
    expect(laNhanhKhoCu({ nhom: 'Kho cũ trước 09-09' })).toBe(true)
    expect(laNhanhKhoCu({ nhom: '12 · C1 - Ester – Lipid' })).toBe(false)
    expect(laNhanhKhoCu({ nhom: '12 · Bộ đề chuẩn cấu trúc' })).toBe(false)
  })
  it('Bộ đề vẫn nhận đúng sau khi thêm hạng', () => {
    expect(laNhanhBoDe({ nhom: '12 · Bộ đề chuẩn cấu trúc' })).toBe(true)
    expect(laNhanhBoDe({ nhom: '12 · Kho cũ trước 09-09' })).toBe(false)
  })
  it('thứ tự hạng: Bộ đề < cây bài < Kho cũ', () => {
    expect(hangUuTien({ nhom: '12 · Bộ đề chuẩn cấu trúc' })).toBe(0)
    expect(hangUuTien({ nhom: '12 · C2 - Carbohydrate' })).toBe(1)
    expect(hangUuTien({ nhom: '12 · Kho cũ trước 09-09' })).toBe(2)
    expect(hangUuTien({ nhom: '' })).toBe(1)
  })
})

describe('khuTrungNguon với ba nhánh', () => {
  it('Kho cũ THUA cây theo bài, dù đứng trước', () => {
    const cu = de('12-C2-B4', '12 · Kho cũ trước 09-09', [mcq('cu', 1, 'Glucose có mấy nhóm -OH?')])
    const moi = de('12-C2-B4-D1', '12 · C2 - Carbohydrate', [mcq('moi', 1, 'Glucose có mấy nhóm -OH?')])
    const kq = khuTrungNguon([cu, moi])
    expect(kq.nguon.map((s) => s.maDe)).toEqual(['12-C2-B4-D1'])
    expect(tongBoQua(kq.boQua)).toBe(1)
  })

  it('Kho cũ THUA cả Bộ đề', () => {
    const cu = de('12-TO-01', '12 · Kho cũ trước 09-09', [mcq('cu', 1, 'X')])
    const bo = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('bo', 1, 'X')])
    expect(khuTrungNguon([cu, bo]).nguon.map((s) => s.maDe)).toEqual(['100'])
  })

  it('ba nhánh cùng một câu ⇒ chỉ Bộ đề sống', () => {
    const cu = de('12-TO-01', '12 · Kho cũ trước 09-09', [mcq('cu', 1, 'X')])
    const bai = de('12-C2-B4-D1', '12 · C2 - Carbohydrate', [mcq('bai', 1, 'X')])
    const bo = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('bo', 1, 'X')])
    const kq = khuTrungNguon([cu, bai, bo])
    expect(kq.nguon.map((s) => s.maDe)).toEqual(['100'])
    expect(tongBoQua(kq.boQua)).toBe(2)
  })

  it('câu CHỈ có ở Kho cũ thì vẫn giữ — không mất câu nào', () => {
    const cu = de('12-TO-01', '12 · Kho cũ trước 09-09', [mcq('cu', 1, 'Câu chỉ Kho cũ mới có')])
    const bai = de('12-C2-B4-D1', '12 · C2 - Carbohydrate', [mcq('bai', 1, 'Câu khác hẳn')])
    const kq = khuTrungNguon([cu, bai])
    expect(kq.nguon).toHaveLength(2)
    expect(tongBoQua(kq.boQua)).toBe(0)
  })

  it('chỉ chọn Kho cũ, không chọn nhánh nào khác ⇒ giữ nguyên, không bỏ câu nào', () => {
    const a = de('12-TO-01', '12 · Kho cũ trước 09-09', [mcq('a', 1, 'X'), mcq('a', 2, 'Y')])
    const b = de('12-TO-02', '12 · Kho cũ trước 09-09', [mcq('b', 1, 'Z')])
    const kq = khuTrungNguon([a, b])
    expect(kq.nguon).toEqual([a, b])
    expect(tongBoQua(kq.boQua)).toBe(0)
  })
})
