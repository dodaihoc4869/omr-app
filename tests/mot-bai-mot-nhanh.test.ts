// MỘT BÀI = MỘT NHÁNH, và đồng bộ phải BỚT chứ không chỉ THÊM.
//
// Hai lỗi thầy gặp chiều 09/09 sau khi kho xếp lại theo bài:
//   1. Cây chọn đề hiện "Bài 4. Glucose và fructose" ba dòng liền nhau.
//   2. Ô đếm ghi "252 đề" trong khi kho chỉ có 90.
// Cả hai đều phải chết ở đây trước khi lên bản phát hành.
import { describe, expect, it } from 'vitest'
import { dungCay, duoiPhanBiet, type Nut } from '../src/lib/cay-chon-de'
import { maCanXoa } from '../src/lib/exam-sync'
import type { TeacherExamSource } from '../src/data/examContent'
import type { KhoDeItem } from '../src/lib/exam-api'

const de = (maDe: string, nhom: string, nguon: string, n: [number, number, number]): TeacherExamSource =>
  ({
    maDe,
    nhom,
    nguon,
    phanI: Array.from({ length: n[0] }, (_, i) => ({ id: `${maDe}-I-${i}` })),
    phanII: Array.from({ length: n[1] }, (_, i) => ({ id: `${maDe}-II-${i}` })),
    phanIII: Array.from({ length: n[2] }, (_, i) => ({ id: `${maDe}-III-${i}` })),
  }) as unknown as TeacherExamSource

const tim = (ds: Nut[], khoa: string): Nut | null => {
  for (const n of ds) {
    if (n.khoa === khoa) return n
    const s = n.con.length ? tim(n.con, khoa) : null
    if (s) return s
  }
  return null
}

describe('một bài chỉ ra MỘT nhánh, dù kho cắt bài thành nhiều mã', () => {
  // Đúng hình dạng kho thật: bài 4 bị cắt đôi vì quá 150 câu, mỗi nửa lại
  // tách theo phần.
  const KHO = [
    de('12-C2-B4-D1-TN', '12 · C2 - Carbohydrate', 'Bài 4. Glucose và fructose', [60, 0, 0]),
    de('12-C2-B4-D1-DS', '12 · C2 - Carbohydrate', 'Bài 4. Glucose và fructose', [0, 20, 0]),
    de('12-C2-B4-D2-TN', '12 · C2 - Carbohydrate', 'Bài 4. Glucose và fructose', [58, 0, 0]),
    de('12-C2-B4-D2-DS', '12 · C2 - Carbohydrate', 'Bài 4. Glucose và fructose', [0, 18, 0]),
    de('12-C2-B5-TN', '12 · C2 - Carbohydrate', 'Bài 5. Saccharose và maltose', [80, 0, 0]),
  ]
  const cay = dungCay(KHO)
  const chuong = tim(cay, '12/C2 - Carbohydrate')!

  it('chương chỉ có ĐÚNG HAI nhánh bài, không phải ba', () => {
    expect(chuong.con.map((n) => n.nhan)).toEqual(['Bài 4. Glucose và fructose', 'Bài 5. Saccharose và maltose'])
  })

  it('không có hai nhánh bài nào trùng tên', () => {
    const ten = chuong.con.map((n) => n.nhan)
    expect(new Set(ten).size).toBe(ten.length)
  })

  it('bài bị cắt đôi gom đủ số câu của CẢ HAI nửa', () => {
    const b4 = tim(cay, '12/C2 - Carbohydrate/Bài 4. Glucose và fructose')!
    expect(b4.soCau).toEqual({ I: 118, II: 38, III: 0 })
    expect(b4.laMa).toHaveLength(4)
  })

  it('lá của bài nhiều mã có ghi rõ D1 / D2, không để hai dòng giống hệt', () => {
    const b4 = tim(cay, '12/C2 - Carbohydrate/Bài 4. Glucose và fructose')!
    expect(b4.con.map((n) => n.nhan)).toEqual(['Trắc nghiệm · D1', 'Đúng sai · D1', 'Trắc nghiệm · D2', 'Đúng sai · D2'])
  })

  it('bài chỉ một mã thì lá KHÔNG bày đuôi ra cho rối', () => {
    const b5 = tim(cay, '12/C2 - Carbohydrate/Bài 5. Saccharose và maltose')!
    expect(b5.con.map((n) => n.nhan)).toEqual(['Trắc nghiệm'])
  })

  it('tích ô bài là tích hết cả bốn mã bên dưới', () => {
    const b4 = tim(cay, '12/C2 - Carbohydrate/Bài 4. Glucose và fructose')!
    expect(b4.laMa.sort()).toEqual(['12-C2-B4-D1-DS', '12-C2-B4-D1-TN', '12-C2-B4-D2-DS', '12-C2-B4-D2-TN'])
  })
})

describe('duoiPhanBiet', () => {
  it('rút đuôi D1 / D2 của mã bị cắt', () => {
    expect(duoiPhanBiet('12-C2-B4-D1')).toBe('D1')
    expect(duoiPhanBiet('12-C1-B1-D12')).toBe('D12')
  })
  it('mã không bị cắt thì trả nguyên mã', () => {
    expect(duoiPhanBiet('12-C2-B5')).toBe('12-C2-B5')
    expect(duoiPhanBiet('100')).toBe('100')
  })
})

describe('maCanXoa — đồng bộ phải BỚT chứ không chỉ THÊM', () => {
  const kho = (...ma: string[]): KhoDeItem[] => ma.map((maDe) => ({ maDe }) as KhoDeItem)
  const may = (...ma: string[]): TeacherExamSource[] => ma.map((maDe) => ({ maDe }) as TeacherExamSource)

  it('mã còn ở máy mà kho không còn thì phải xoá', () => {
    // Phải đủ nhiều mã để không chạm chốt "kho trả thiếu quá nhiều thì cấm xoá"
    // (xem TI_LE_TOI_THIEU trong exam-sync): 8 mã kho trên 10 mã máy là 80%.
    const conSong = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8']
    expect(maCanXoa(kho(...conSong), may(...conSong, '12-C2-B4', '12-TO-01'))).toEqual(['12-C2-B4', '12-TO-01'])
  })

  it('máy trùng khớp kho thì không xoá gì', () => {
    expect(maCanXoa(kho('a', 'b'), may('a', 'b'))).toEqual([])
  })

  it('kho có thêm đề mới không làm xoá gì ở máy', () => {
    expect(maCanXoa(kho('a', 'b', 'c'), may('a'))).toEqual([])
  })

  it('CHỐT AN TOÀN: kho rỗng thì TUYỆT ĐỐI không xoá — gần như chắc là lỗi mạng', () => {
    expect(maCanXoa([], may('a', 'b', 'c'))).toEqual([])
  })

  it('máy rỗng thì không nổ', () => {
    expect(maCanXoa(kho('a'), [])).toEqual([])
  })
})
