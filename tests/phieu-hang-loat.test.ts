// Bảng chuyên đề của riêng một ca. (Phần gói .zip tự viết đã gỡ cùng lib/zip; tên tệp zip của ảnh phiếu đã gỡ cùng phiếu Zalo, 21/09.)
import { describe, expect, it } from 'vitest'
import { chuyenDeTuChiTiet } from '../src/lib/phieu-hang-loat'
import type { ChiTietCauRow } from '../src/lib/exam-api'

const row = (chuyenDe: string, dungSai: boolean | null): ChiTietCauRow => ({
  phan: 'I',
  soCau: 1,
  qid: Math.random().toString(36),
  chuyenDe,
  mucDo: '',
  dapAnChon: '',
  dapAnDung: '',
  dungSai,
  giay: null,
})

describe('Chuyên đề của riêng một ca', () => {
  it('đếm đúng số câu và số câu sai từng chuyên đề', () => {
    const cd = chuyenDeTuChiTiet([
      row('Ester – lipid', false),
      row('Ester – lipid', true),
      row('Ester – lipid', false),
      row('Carbohydrate', true),
    ])
    expect(cd[0]).toEqual({ ten: 'Ester – lipid', soCau: 3, soSai: 2 })
    expect(cd[1]).toEqual({ ten: 'Carbohydrate', soCau: 1, soSai: 0 })
  })

  it('sắp giảm dần theo số câu sai', () => {
    const cd = chuyenDeTuChiTiet([row('A', true), row('B', false), row('B', false)])
    expect(cd.map((c) => c.ten)).toEqual(['B', 'A'])
  })

  it('câu không ghi chuyên đề thì BỎ, không gộp vào ô "khác"', () => {
    expect(chuyenDeTuChiTiet([row('', false), row('  ', false)])).toEqual([])
  })

  it('câu bỏ trống (dungSai null) không tính là sai', () => {
    expect(chuyenDeTuChiTiet([row('A', null), row('A', true)])[0]).toEqual({ ten: 'A', soCau: 2, soSai: 0 })
  })
})
