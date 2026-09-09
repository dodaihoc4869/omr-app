// CHỐT AN TOÀN CỦA maCanXoa — đồng bộ không được xoá nhầm đề đang dùng.
//
// Chiều 09/09 thầy báo "ngân hàng chỉ đẩy được 70 đề" trong khi kho có 90.
// Nếu máy chủ trả danh sách THIẾU thì bản cũ sẽ coi 20 đề vắng mặt là đã bị
// xoá và dọn sạch chúng khỏi máy thầy. Hai chốt dưới đây chặn đúng chuyện đó.
import { describe, expect, it } from 'vitest'
import { maCanXoa, TI_LE_TOI_THIEU } from '../src/lib/exam-sync'
import type { TeacherExamSource } from '../src/data/examContent'
import type { KhoDeItem } from '../src/lib/exam-api'

const kho = (n: number, tien = 'de'): KhoDeItem[] =>
  Array.from({ length: n }, (_, i) => ({ maDe: `${tien}${i}` }) as KhoDeItem)
const may = (n: number, tien = 'de'): TeacherExamSource[] =>
  Array.from({ length: n }, (_, i) => ({ maDe: `${tien}${i}` }) as TeacherExamSource)

describe('maCanXoa — chốt an toàn', () => {
  it('kho rỗng thì TUYỆT ĐỐI không xoá gì', () => {
    expect(maCanXoa([], may(90))).toEqual([])
  })

  it('kho trả 70 trong khi máy có 90 thì KHÔNG xoá gì — đúng ca thầy gặp', () => {
    expect(maCanXoa(kho(70), may(90))).toEqual([])
  })

  it('kho trả thiếu vừa phải (đúng ngưỡng 80%) thì vẫn xoá bình thường', () => {
    // 80 trên 100 đúng bằng ngưỡng nên không bị chặn; 20 mã vắng mặt bị dọn.
    expect(maCanXoa(kho(80), may(100))).toHaveLength(20)
  })

  it('kho trả ít hơn ngưỡng một chút thì bị chặn', () => {
    expect(maCanXoa(kho(79), may(100))).toEqual([])
  })

  it('thầy xoá tay vài đề (kho 88, máy 90) thì vẫn dọn đúng hai đề', () => {
    const m = may(90)
    const k = kho(90).filter((x) => x.maDe !== 'de5' && x.maDe !== 'de6')
    expect(maCanXoa(k, m).sort()).toEqual(['de5', 'de6'])
  })

  it('máy rỗng thì không nổ và không xoá gì', () => {
    expect(maCanXoa(kho(90), [])).toEqual([])
  })

  it('kho nhiều hơn máy (có đề mới) thì không xoá gì', () => {
    expect(maCanXoa(kho(90), may(70))).toEqual([])
  })

  it('ngưỡng được công bố để test và màn hình dùng chung một con số', () => {
    expect(TI_LE_TOI_THIEU).toBe(0.8)
  })
})
