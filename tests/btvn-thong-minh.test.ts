import { describe, it, expect } from 'vitest'

describe('BÀI TẬP VỀ NHÀ THÔNG MINH — 3 VÒNG PHÂN TẦNG', () => {
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
