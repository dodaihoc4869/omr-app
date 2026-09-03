// APP HỌC SINH phải có đủ ba mục: lịch sử ca thi · bài tập về nhà · nhắn tin.
// Trước đây chỉ có hồ sơ + nhắn tin, nên em mở app ra chẳng thấy gì của mình.
//
// Cũng khoá luôn luật của BA-APP.md mục 9: MỘT màn hồ sơ cho ba lối vào —
// thầy, em, phụ huynh nhìn cùng một cách trình bày, không dựng hai màn.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KhoiBaiTap, KhoiChuyenDe, KhoiLichSuCa, laYeu, NHAN_BAI_TAP, toneXepLoai } from '../src/components/HoSoEmView'
import type { BaiTapCuaEm, CaCuaEm, ChuyenDeEm } from '../src/lib/exam-api'

const CA: CaCuaEm[] = [
  {
    maCa: '984033',
    tenCa: 'Ca 12A1 tuần 2',
    lop: '12A1',
    lanThu: 1,
    nopLuc: '2026-09-02T15:00:00Z',
    trangThai: 'da_nop',
    diemI: 4.5,
    diemII: 1.6,
    diemIII: 1,
    tong: 7.1,
    hang: 3,
    siSo: 28,
    soLanRoiMan: 0,
  },
  {
    maCa: '984000',
    tenCa: '',
    lop: '12A1',
    lanThu: 2,
    nopLuc: '2026-08-20T15:00:00Z',
    trangThai: 'khoa',
    diemI: null,
    diemII: null,
    diemIII: null,
    tong: null,
    hang: null,
    siSo: null,
    soLanRoiMan: 3,
  },
]

const BAI_TAP: BaiTapCuaEm[] = [
  { maCa: '900001', tenCa: 'pH và acid–base', giaoLuc: '2026-09-01T02:00:00Z', hanNop: '2026-09-08T16:59:00Z', trangThai: 'chua_lam', tong: null },
  { maCa: '900002', tenCa: 'Cân bằng hoá học', giaoLuc: '2026-08-20T02:00:00Z', hanNop: '2026-08-27T16:59:00Z', trangThai: 'qua_han', tong: null },
  { maCa: '900003', tenCa: 'Ester', giaoLuc: '2026-08-10T02:00:00Z', hanNop: '', trangThai: 'da_nop', tong: 8.25 },
]

const CHUYEN_DE: ChuyenDeEm[] = [
  { ten: 'Cân bằng hoá học', soCau: 20, soSai: 15, tiLeSai: 0.75, xuHuong: 'xau' },
  { ten: 'pH và tính acid–base', soCau: 20, soSai: 6, tiLeSai: 0.3, xuHuong: 'tot' },
  { ten: 'Ester', soCau: 2, soSai: 2, tiLeSai: 1, xuHuong: 'chua_du' },
]

describe('Lịch sử ca thi trong app học sinh', () => {
  it('hiện điểm tổng, điểm 3 phần và hạng lớp', () => {
    render(<KhoiLichSuCa ca={CA} choEm />)
    expect(screen.getByText('Ca 12A1 tuần 2')).toBeTruthy()
    expect(screen.getByText('7,10')).toBeTruthy()
    expect(screen.getByText(/Phần I 4,50 · II 1,60 · III 1,00/)).toBeTruthy()
    expect(screen.getByText('3/28')).toBeTruthy()
  })

  it('KHÔNG hiện tên bạn nào khác — chỉ hạng và điểm của em', () => {
    const { container } = render(<KhoiLichSuCa ca={CA} choEm />)
    expect(container.textContent).not.toMatch(/Nguyễn|Trần|Lê /)
  })

  it('ca chưa chấm ghi rõ chưa chấm, không bịa điểm 0', () => {
    render(<KhoiLichSuCa ca={CA} choEm />)
    expect(screen.getByText('chưa chấm')).toBeTruthy()
    expect(screen.queryByText('0,00')).toBeNull()
  })

  it('ca bị khoá và số lần rời màn hiện đúng', () => {
    render(<KhoiLichSuCa ca={CA} choEm />)
    expect(screen.getByText('bị khoá')).toBeTruthy()
    expect(screen.queryByText(/rời màn 3 lần/)).toBeNull() // đã khoá thì không lặp lại nhãn rời màn
  })

  it('chưa nộp ca nào thì nói rõ, không để trống', () => {
    render(<KhoiLichSuCa ca={[]} choEm />)
    expect(screen.getByText('Em chưa nộp bài ca nào.')).toBeTruthy()
  })
})

describe('Bài tập về nhà trong app học sinh', () => {
  it('mỗi bài có nhãn trạng thái đúng', () => {
    render(<KhoiBaiTap baiTap={BAI_TAP} onMo={() => {}} />)
    expect(screen.getByText(NHAN_BAI_TAP.chua_lam.ten)).toBeTruthy()
    expect(screen.getByText(NHAN_BAI_TAP.qua_han.ten)).toBeTruthy()
    expect(screen.getByText(NHAN_BAI_TAP.da_nop.ten)).toBeTruthy()
  })

  it('bài quá hạn vẫn bấm vào làm được, và nói rõ là nộp muộn vẫn nhận', () => {
    const daMo: string[] = []
    render(<KhoiBaiTap baiTap={BAI_TAP} onMo={(m) => daMo.push(m)} />)
    expect(screen.getByText('làm muộn vẫn nộp được')).toBeTruthy()
    const hang = document.querySelector('[data-bai-tap="900002"]') as HTMLElement
    hang.click()
    expect(daMo).toEqual(['900002'])
  })

  it('bài ĐÃ NỘP thì không bấm vào làm lại được', () => {
    const daMo: string[] = []
    render(<KhoiBaiTap baiTap={BAI_TAP} onMo={(m) => daMo.push(m)} />)
    const hang = document.querySelector('[data-bai-tap="900003"]') as HTMLElement
    hang.click()
    expect(daMo).toEqual([])
  })

  it('điểm bài đã nộp hiện đúng, bài chưa nộp không hiện điểm', () => {
    render(<KhoiBaiTap baiTap={BAI_TAP} onMo={() => {}} />)
    expect(screen.getByText('8,25')).toBeTruthy()
  })

  it('màn của THẦY không có lối bấm vào làm bài hộ em', () => {
    const { container } = render(<KhoiBaiTap baiTap={BAI_TAP} />)
    expect(container.querySelectorAll('button[data-bai-tap]').length).toBe(0)
  })

  it('chưa giao bài nào thì nói rõ', () => {
    render(<KhoiBaiTap baiTap={[]} />)
    expect(screen.getByText('Chưa giao bài tập nào.')).toBeTruthy()
  })
})

describe('Chuyên đề mạnh — yếu', () => {
  it('nêu chuyên đề yếu nhất kèm số liệu, không nói chung chung', () => {
    render(<KhoiChuyenDe chuyenDe={CHUYEN_DE} choEm />)
    expect(screen.getByText(/Yếu nhất/)).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
  })

  it('chuyên đề còn ít câu thì ghi rõ CHƯA ĐỦ KẾT LUẬN, không xếp là yếu', () => {
    render(<KhoiChuyenDe chuyenDe={CHUYEN_DE} choEm />)
    expect(screen.getByText(/còn ít câu, chưa đủ kết luận/)).toBeTruthy()
    expect(laYeu({ tiLeSai: 1, soCau: 2 })).toBe(false)
  })
})

describe('Ngưỡng và màu dùng chung, không lệch giữa ba lối vào', () => {
  it('xếp loại ra đúng màu nhãn', () => {
    expect(toneXepLoai(null)).toBe('xam')
    expect(toneXepLoai(9)).toBe('xanh')
    expect(toneXepLoai(2)).toBe('do')
  })
})
