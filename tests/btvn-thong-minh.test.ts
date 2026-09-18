import { describe, it, expect } from 'vitest'
import { phanTangBtvn, tinhTienDoThongMinh } from '../src/lib/bai-tap'

describe('BÀI TẬP VỀ NHÀ THÔNG MINH — 3 VÒNG PHÂN TẦNG', () => {
  const cauHoi = [
    { id: 'c1', chuyenDe: 'Ester', mucDo: 'biet', sao: 0 },
    { id: 'c2', chuyenDe: 'Ester', mucDo: 'hieu', sao: 1 },
    { id: 'c3', chuyenDe: 'Amin', mucDo: 'hieu', sao: 1 },
    { id: 'c4', chuyenDe: 'Peptide', mucDo: 'van_dung', sao: 2 },
  ]

  it('phân đúng 3 vòng: Lõi, Trọng tâm cá nhân (chuyên đề yếu), và Thử thách (2 sao)', () => {
    // Em này yếu Amin
    const pt = phanTangBtvn(cauHoi, ['Amin'])
    expect(pt['c1'].vong).toBe('loi')
    expect(pt['c1'].batBuoc).toBe(true)

    expect(pt['c2'].vong).toBe('loi')
    expect(pt['c2'].batBuoc).toBe(true)

    // c3 thuộc Amin (chuyên đề yếu) nên vào vòng Trọng tâm cá nhân
    expect(pt['c3'].vong).toBe('trong_tam')
    expect(pt['c3'].batBuoc).toBe(true)

    // c4 là 2 sao nên vào vòng Thử thách
    expect(pt['c4'].vong).toBe('thu_thach')
    expect(pt['c4'].batBuoc).toBe(false)
  })

  it('học sinh không phải làm 100% đề máy móc: làm xong Lõi + Trọng tâm là ĐẠT 100% yêu cầu', () => {
    // Em làm c1, c2, c3 (bỏ c4 câu 2 sao thử thách)
    const td = tinhTienDoThongMinh(cauHoi, ['c1', 'c2', 'c3'], ['Amin'])
    expect(td.datYeuCau).toBe(true)
    expect(td.tiLeHoanThanh).toBe(100)
    expect(td.tongDaLam).toBe(3)
    expect(td.tongSoCau).toBe(4)
  })

  it('học sinh bỏ câu lõi hoặc trọng tâm thì chưa đạt yêu cầu', () => {
    // Em chỉ làm c1, c4 (bỏ c2 và c3 là câu bắt buộc)
    const td = tinhTienDoThongMinh(cauHoi, ['c1', 'c4'], ['Amin'])
    expect(td.datYeuCau).toBe(false)
    expect(td.tiLeHoanThanh).toBe(33) // 1/3 câu bắt buộc
  })
})
