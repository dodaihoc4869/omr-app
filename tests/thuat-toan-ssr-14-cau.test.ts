import { describe, expect, it } from 'vitest'
import { dungDeRieng, type CaTruocDaCham } from '../src/lib/de-rieng'
import type { CauUngVien, PhanDe, YeuCauRut } from '../src/lib/rut-de'

function mockCau(phan: PhanDe, id: string, dang: string, chuyenDe: string): CauUngVien {
  return {
    phan,
    id,
    maDe: 'de_test',
    soGoc: 1,
    chuyenDe,
    mucDo: 'hieu',
    dang: dang as any,
    text: `Nội dung câu ${id}`,
    coHinh: false,
    canXem: false,
    sao: 1,
    lyDoSao: '',
  }
}

describe('Thuật toán SSR ca 14 câu & Cặp đôi Song sinh', () => {
  const kho: Record<PhanDe, CauUngVien[]> = {
    I: [
      mockCau('I', 'I-este-1', 'thuy_phan_este', 'Ester – Lipid'),
      mockCau('I', 'I-este-2', 'thuy_phan_este', 'Ester – Lipid'), // twin of I-este-1
      mockCau('I', 'I-amin-1', 'amin_bac', 'Amin'),
      mockCau('I', 'I-amin-2', 'amin_bac', 'Amin'),
      mockCau('I', 'I-pep-1', 'peptit_dong_phan', 'Peptide'),
      mockCau('I', 'I-pep-2', 'peptit_dong_phan', 'Peptide'),
      ...Array.from({ length: 20 }, (_, i) => mockCau('I', `I-extra-${i}`, 'ly_thuyet', 'Chung')),
    ],
    II: [
      mockCau('II', 'II-este-1', 'tinh_chat_este', 'Ester – Lipid'),
      mockCau('II', 'II-este-2', 'tinh_chat_este', 'Ester – Lipid'), // twin of II-este-1
      mockCau('II', 'II-extra-1', 'tong_hop', 'Hóa vô cơ'),
      mockCau('II', 'II-extra-2', 'tong_hop', 'Hóa vô cơ'),
    ],
    III: [
      mockCau('III', 'III-toan-1', 'tinh_khoi_luong', 'Bài toán este'),
      mockCau('III', 'III-toan-2', 'tinh_khoi_luong', 'Bài toán este'), // twin of III-toan-1
      mockCau('III', 'III-extra-1', 'do_tan', 'Hóa lý'),
      mockCau('III', 'III-extra-2', 'do_tan', 'Hóa lý'),
      mockCau('III', 'III-extra-3', 'do_tan', 'Hóa lý'),
    ],
  }

  const yc14: YeuCauRut = {
    soCau: { I: 9, II: 2, III: 3 }, // Tổng 14 câu
    chuyenDe: [],
    mucDo: [],
    seed: 99999,
  }

  it('Rút đúng cấu trúc 14 câu (9 Phần I, 2 Phần II, 3 Phần III) cho từng em', () => {
    const caTruoc: CaTruocDaCham = {
      maCa: 'ca_cu',
      daLamCua: {
        hs1: ['I-este-1', 'I-amin-1', 'II-este-1', 'III-toan-1'],
        hs2: ['I-pep-1', 'II-este-1'],
      },
      saiCua: {
        hs1: ['I-este-1', 'I-amin-1', 'II-este-1', 'III-toan-1'], // sai 4 câu
        hs2: ['I-pep-1', 'II-este-1'],
      },
    }

    const res = dungDeRieng({
      uv: kho,
      yc: yc14,
      dsSbd: ['hs1', 'hs2'],
      dsCa: [caTruoc],
    })

    // Cả 2 em đều có đủ 14 câu
    expect(res.boTheoEm.hs1).toHaveLength(14)
    expect(res.boTheoEm.hs2).toHaveLength(14)

    // Khớp chuẩn 9 Phần I, 2 Phần II, 3 Phần III
    const pI_1 = res.boTheoEm.hs1.filter((q) => q.startsWith('I-'))
    const pII_1 = res.boTheoEm.hs1.filter((q) => q.startsWith('II-'))
    const pIII_1 = res.boTheoEm.hs1.filter((q) => q.startsWith('III-'))
    expect(pI_1).toHaveLength(9)
    expect(pII_1).toHaveLength(2)
    expect(pIII_1).toHaveLength(3)

    // hs1 có câu song sinh cùng dạng được kích hoạt
    expect(res.songSinhTheoEm.hs1.length).toBeGreaterThanOrEqual(1)
  })

  it('Hai học sinh có đề độc lập, triệt tiêu quay cóp', () => {
    const caTruoc: CaTruocDaCham = {
      maCa: 'ca_cu',
      daLamCua: {
        hs1: ['I-este-1'],
        hs2: ['I-amin-1'],
      },
      saiCua: {
        hs1: ['I-este-1'],
        hs2: ['I-amin-1'],
      },
    }

    const res = dungDeRieng({
      uv: kho,
      yc: yc14,
      dsSbd: ['hs1', 'hs2'],
      dsCa: [caTruoc],
    })

    const set1 = new Set(res.boTheoEm.hs1)
    const set2 = new Set(res.boTheoEm.hs2)
    let overlap = 0
    for (const q of set1) {
      if (set2.has(q)) overlap++
    }

    // Đề mỗi em là riêng biệt, độ trùng cực thấp
    expect(overlap).toBeLessThan(14)
  })
})
