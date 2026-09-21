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

  it('dungPhieu render đầy đủ banner 3 Vòng Phân Tầng và nhãn vòng trên từng câu', async () => {
    const { dungPhieu } = await import('../src/lib/html-phieu')
    const html = dungPhieu(
      {
        hoTen: 'Đỗ Đại Học',
        sbd: 'ddh',
        ngay: new Date(),
        tenChuyenDe: 'Bài tập về nhà',
        nhanBia: 'BÀI TẬP VỀ NHÀ',
      },
      [
        { id: 'c1', phan: 'I', tieuDe: 'Câu 1', de: 'Nội dung câu 1', mucDo: 'biet', dapAn: 'A' },
        { id: 'c2', phan: 'I', tieuDe: 'Câu 2', de: 'Nội dung câu 2', mucDo: 'hieu', dapAn: 'B' },
        { id: 'c3', phan: 'I', tieuDe: 'Câu 3', de: 'Nội dung câu 3', mucDo: 'van_dung', dapAn: 'C' },
      ],
      { laBtvn: true },
    )
    expect(html).toContain('CÁC NHÓM CÂU TRONG BÀI TẬP VỀ NHÀ:')
    expect(html).toContain('Làm xong câu cốt lõi và câu dành riêng cho em là đạt chỉ tiêu')
    expect(html).toContain('Câu cốt lõi')
    expect(html).toContain('Câu dành riêng cho em')
    expect(html).toContain('Câu thử thách (sai không sao)')
    expect(html).toContain('vong-btvn vong-1')
    expect(html).toContain('vong-btvn vong-2')
    expect(html).toContain('vong-btvn vong-3')
  })
})

