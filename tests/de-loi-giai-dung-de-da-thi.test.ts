import { describe, expect, it } from 'vitest'
import { chiTietDeDaLam } from '../src/lib/de-loi-giai-cua-em'
import type { ChiTietCauRow, KeyBank } from '../src/lib/exam-api'

const bank = {
  phanI: [
    { id: 'q-kho-1', text: 'Câu trong kho 1', choices: ['A', 'B', 'C', 'D'], correct: 'A' },
    { id: 'q-da-thi', text: 'Câu em đã thi', choices: ['A', 'B', 'C', 'D'], correct: 'B' },
    { id: 'q-kho-2', text: 'Câu trong kho 2', choices: ['A', 'B', 'C', 'D'], correct: 'C' },
  ],
  phanII: [],
  phanIII: [],
} as unknown as KeyBank

const dapAn = { phanI: { 'q-da-thi': 'B' }, phanII: {}, phanIII: {} }

describe('Xem đề và lời giải dùng đúng đề học sinh đã thi', () => {
  it('ưu tiên tuyệt đối bảng chấm chính thức, không rút lại từ kho', () => {
    const daThi: ChiTietCauRow[] = [{
      phan: 'I', soCau: 1, qid: 'q-da-thi', chuyenDe: 'Este', mucDo: 'hieu',
      dapAnChon: 'B', dapAnDung: 'B', dungSai: true, giay: 35,
    }]
    expect(chiTietDeDaLam(bank, '848875', '12021', daThi, dapAn, null)).toEqual(daThi)
  })

  it('ca cũ thiếu bảng chấm vẫn dựng từ bộ câu đã lưu của em', () => {
    const rows = chiTietDeDaLam(bank, '848875', '12021', null, dapAn, null, ['q-da-thi'])
    expect(rows.map((x) => x.qid)).toEqual(['q-da-thi'])
  })
})
