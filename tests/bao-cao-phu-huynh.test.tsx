// BÁO CÁO GỬI PHỤ HUYNH — ba việc thầy chốt 04-09:
//
//  1. Nút "Vi phạm" nhấp nháy, bấm ra bằng chứng rời màn.
//  2. Phần cuối (xem đề của con, bài luyện) KHÔNG được biến mất chỉ vì thiếu
//     dòng "việc cần làm" — đây là lỗi thật: báo cáo em tự dựng sau khi nộp
//     không có dòng đó nên mất luôn nút xem đề.
//  3. Bài luyện tách làm hai nút: xem trước, và copy link gửi cho con.
import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { PhieuDayDu } from '../src/lib/phieu-du-lieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

vi.mock('../src/lib/exam-api', () => ({ layPhieu: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrlHoacMacDinh: async () => '' }))

const { default: PhieuScreen } = await import('../src/screens/PhieuScreen')

const cauLuyen = (id: string): CauLuyen =>
  ({ id, phan: 'I', text: 'Câu luyện', chuyenDe: 'Ester – lipid', mucDo: 'biet', choices: ['a', 'b', 'c', 'd'], correct: 'A' }) as unknown as CauLuyen

function phieu(them: Partial<PhieuDayDu> = {}): PhieuDayDu {
  return {
    v: 2,
    hoTen: 'Lê Minh Đức',
    sbd: '12121212',
    lop: '12A1',
    tenCa: 'Ca 12A1',
    maCa: '984033',
    ngay: '2026-09-04T11:55:00Z',
    diem: 2.35,
    diemPhan: { I: 2, II: 0.4, III: 0 },
    soCauSai: 20,
    tongSoCau: 28,
    hang: 8,
    siSo: 10,
    chuyenDeCa: [{ ten: 'Ester – lipid', soCau: 28, soSai: 20 }],
    chuyenDeTong: [],
    lichSu: [],
    diemLop: [],
    vieCanLam: '',
    thongKe: null,
    tinHieu: [],
    ducKet: [],
    cauSai: [],
    dai: [],
    ...them,
  }
}

describe('nút Vi phạm', () => {
  it('không có vi phạm thì KHÔNG hiện nút — không doạ suông', () => {
    const { queryByText } = render(<PhieuScreen duCoSan={phieu()} />)
    expect(queryByText(/Vi phạm/)).toBeNull()
  })

  it('có vi phạm thì hiện nút, và nút NHẤP NHÁY lúc chưa mở', () => {
    const { getByRole } = render(
      <PhieuScreen duCoSan={phieu({ viPham: { soLan: 2, tongGiay: 47, daKhoa: true, moc: [] } })} />,
    )
    const nut = getByRole('button', { name: /Vi phạm/ })
    expect(nut.className).toContain('bc-nhay')
    expect(nut.textContent).toContain('bài bị khoá')
  })

  it('bấm vào là ra bằng chứng: số lần, tổng thời gian, mốc từng lần', () => {
    const { getByRole, getByText, getAllByText, queryByText } = render(
      <PhieuScreen
        duCoSan={phieu({
          viPham: {
            soLan: 2,
            tongGiay: 47,
            daKhoa: false,
            nguong: { lan: 3, giay: 10 },
            moc: [
              { luc: '2026-09-04T11:40:00Z', giay: 15 },
              { luc: '2026-09-04T11:44:00Z', giay: 32 },
            ],
          },
        })}
      />,
    )
    // Chưa bấm thì khối bằng chứng còn gập (grid-template-rows 0fr, giống các
    // câu sai) — nội dung nằm sẵn trong DOM để trình đọc màn hình thấy, nhưng
    // aria-expanded phải là false.
    const nut = getByRole('button', { name: /Vi phạm/ })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(queryByText('em chọn')).toBeNull()
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(getByText('lần rời khỏi màn làm bài')).toBeTruthy()
    expect(getByText('47 giây')).toBeTruthy()
    expect(getByText(/Từng lần rời/)).toBeTruthy()
    // "32 giây" ra hai chỗ: ô "lần rời lâu nhất" và dòng mốc thứ hai.
    expect(getAllByText('32 giây').length).toBeGreaterThanOrEqual(2)
    expect(getByText('15 giây')).toBeTruthy()
    // Có nêu ngưỡng thầy đặt để phụ huynh biết mốc nào là quá.
    expect(document.body.textContent).toContain('là máy tự khoá bài')
    // Không kết luận gian lận — máy chỉ đo được tín hiệu.
    expect(document.body.textContent).not.toContain('gian lận')
  })

  it('lần rời không thấy quay lại thì nói thẳng, không bịa số giây', () => {
    const { getByRole, getByText } = render(
      <PhieuScreen duCoSan={phieu({ viPham: { soLan: 1, tongGiay: 0, daKhoa: true, moc: [{ luc: '2026-09-04T11:40:00Z', giay: null }] } })} />,
    )
    fireEvent.click(getByRole('button', { name: /Vi phạm/ }))
    expect(getByText('không thấy quay lại')).toBeTruthy()
  })
})

describe('phần cuối báo cáo', () => {
  it('KHÔNG có "việc cần làm" vẫn hiện nút xem đề của con', () => {
    const { getByRole } = render(<PhieuScreen duCoSan={phieu({ vieCanLam: '', deCuaEm: [cauLuyen('q1'), cauLuyen('q2')] })} />)
    expect(getByRole('button', { name: /Xem đề con vừa làm/ })).toBeTruthy()
  })

  it('có "việc cần làm" thì hiện đủ cả chữ lẫn nút', () => {
    const { getByText, getByRole } = render(
      <PhieuScreen duCoSan={phieu({ vieCanLam: 'Em làm lại 10 câu ester.', deCuaEm: [cauLuyen('q1')] })} />,
    )
    expect(getByText('Em làm lại 10 câu ester.')).toBeTruthy()
    expect(getByRole('button', { name: /Xem đề con vừa làm/ })).toBeTruthy()
  })
})

describe('bài luyện — hai nút', () => {
  it('có link thì ra hai nút riêng, nút copy link nhấp nháy', () => {
    const { getByRole } = render(
      <PhieuScreen duCoSan={phieu({ baiTap: [cauLuyen('b1')], linkBaiTap: 'https://vi.du/omr-app/p#abc123' })} />,
    )
    expect(getByRole('button', { name: /Xem trước/ })).toBeTruthy()
    const copy = getByRole('button', { name: /Copy link gửi cho con/ })
    expect(copy.className).toContain('bc-nhay')
    // Nút VÀNG (thầy chốt 04-09 tối), không phải tím.
    expect(copy.className).toContain('vang')
  })

  it('chưa có link thì chỉ còn nút xem — không dựng nút copy rồi copy chuỗi rỗng', () => {
    const { getByRole, queryByRole } = render(<PhieuScreen duCoSan={phieu({ baiTap: [cauLuyen('b1')] })} />)
    expect(getByRole('button', { name: /Xem trước/ })).toBeTruthy()
    expect(queryByRole('button', { name: /Copy link/ })).toBeNull()
  })

  it('gói bị cắt mất bài tập nhưng còn link thì vẫn gửi link cho con được', () => {
    const { queryByRole, getByRole } = render(<PhieuScreen duCoSan={phieu({ linkBaiTap: 'https://vi.du/omr-app/p#abc123' })} />)
    expect(queryByRole('button', { name: /Xem trước/ })).toBeNull()
    expect(getByRole('button', { name: /Copy link gửi cho con/ })).toBeTruthy()
  })

  it('bấm copy là link vào bộ nhớ tạm', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { getByRole } = render(
      <PhieuScreen duCoSan={phieu({ baiTap: [cauLuyen('b1')], linkBaiTap: 'https://vi.du/omr-app/p#abc123' })} />,
    )
    fireEvent.click(getByRole('button', { name: /Copy link gửi cho con/ }))
    // Số câu mặc định 10 đi kèm link để trang phiếu cắt đúng bấy nhiêu câu.
    expect(writeText).toHaveBeenCalledWith('https://vi.du/omr-app/p#abc123~10')
  })
})
