import { describe, it, expect } from 'vitest'
import { caDungDe, chonDeCanTai } from '../src/lib/exam-sync'
import type { TeacherExamSource } from '../src/data/examContent'
import type { KhoDeItem } from '../src/lib/exam-api'

const item = (maDe: string, ngayNap: string): KhoDeItem => ({ maDe, ngayNap, nguon: '', soCau: 28, soNghi: 0, capNhatLuc: '' })
const local = (maDe: string, ngayNap?: string): TeacherExamSource => ({ maDe, phanI: [], phanII: [], phanIII: [], ngayNap })

describe('chonDeCanTai — chỉ tải đề mới hoặc đã đổi', () => {
  it('đề chưa có local -> mới; ngayNap khác -> cập nhật; giống -> bỏ qua', () => {
    const tren = [item('100', '2026-09-02'), item('101', '2026-09-01'), item('102', '2026-09-03')]
    const co = [local('101', '2026-09-01'), local('102', '2026-08-30')]
    const { moi, capNhat } = chonDeCanTai(tren, co)
    expect(moi.map((x) => x.maDe)).toEqual(['100'])
    expect(capNhat.map((x) => x.maDe)).toEqual(['102'])
  })
})

// Trước khi xoá một đề, hộp hỏi phải nói ĐÚNG số ca đã mở dùng đề đó. Nói sai
// hoặc không nói là thầy phải đoán "xoá đề có mất bài đã nộp không" — không mất,
// vì mỗi ca giữ bản đề riêng, nhưng thầy không có cách nào tự biết điều đó.
describe('caDungDe — ca đã mở nào đang dùng mã đề này', () => {
  const banks = [
    { maCa: '111111', sources: [{ maDe: '100' }] },
    { maCa: '222222', sources: [{ maDe: '100' }, { maDe: '12-C1-B1' }] },
    { maCa: '333333', sources: [{ maDe: '101' }] },
  ]

  it('trả về đúng các ca có dùng, kể cả ca ghép nhiều đề', () => {
    expect(caDungDe(banks, '100')).toEqual(['111111', '222222'])
    expect(caDungDe(banks, '12-C1-B1')).toEqual(['222222'])
  })

  it('đề chưa ca nào dùng -> danh sách rỗng, không báo nhầm', () => {
    expect(caDungDe(banks, '999')).toEqual([])
    expect(caDungDe([], '100')).toEqual([])
  })

  it('so mã đề khớp tuyệt đối, không khớp một phần', () => {
    expect(caDungDe(banks, '10')).toEqual([])
    expect(caDungDe(banks, '12-C1')).toEqual([])
  })
})
