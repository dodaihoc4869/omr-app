// THẺ "BUỔI CHỮA TỐI NAY (ĐÃ XẾP SẴN)" — `src/components/TheBuoiChuaXepSan.tsx` (B6, Code 1, 21/09/2026; cập nhật
// 25/09 theo LUẬT MỚI: chữa / chỉ đọc đáp án · sàn 80 % · em nhiều lượt · cảnh báo · danh sách câu bung/thu gọn).
// Khoá: không có đề xuất ⇒ không vẽ gì; con số nào cũng có nhãn + đơn vị; câu liệt kê ĐÚNG thứ tự chữa; tên em cắt
// "và N em khác"; ghi chú câu bỏ nói thật; nút "Tự chọn lại" gọi đúng hàm; chữ theo chuẩn từ ngữ.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import TheBuoiChuaXepSan, { SO_TEN_EM_HIEN, chuEmCanChuY } from '../src/components/TheBuoiChuaXepSan'
import type { DeXuatBuoiChua } from '../src/lib/buoi-chua-de-xuat'

const deXuat = (o: Partial<DeXuatBuoiChua> = {}): DeXuatBuoiChua => ({
  co: true,
  lyDoAn: '',
  cau: [],
  em: [
    { sbd: '12007', hoTen: 'Trần Thu Hà', lyDo: 'lên bảng 2 lượt' },
    { sbd: '12009', hoTen: '', lyDo: 'lên bảng 1 lượt' },
  ],
  soCau: 8,
  soEm: 2,
  phut: 55,
  cacLyDo: ['Câu cả lớp sai: 3/8 câu — 12 lượt sai', 'Chữa 100 % câu lọc ra (sàn 80 %)'],
  boQua: { khongCoTrongKho: 0, tuLuan: 0 },
  tiLeChua: 1,
  dat80: true,
  soEmNhieuLuot: 1,
  canhBao: [],
  soCauDocDapAn: 2,
  hang: [
    { nhom: 'chua', qid: 'Q7', phan: 'I', sao: 0, soEmSai: 9, lyDo: '9/24 em làm sai · câu cốt tủy', sbd: '12007', hoTen: 'Trần Thu Hà', luotCuaEm: 2, viSao: 'sai câu này' },
    { nhom: 'chua', qid: 'Q3', phan: 'II', sao: 2, soEmSai: 8, lyDo: '8/20 em làm sai', sbd: '12009', hoTen: '', luotCuaEm: 1, viSao: 'Bộ não A.I gợi ý' },
    { nhom: 'doc_dap_an', qid: 'Q12', phan: 'I', sao: 0, soEmSai: 2, lyDo: '2/24 em làm sai' },
  ],
  ...o,
})

describe('TheBuoiChuaXepSan', () => {
  it('không có đề xuất / đề xuất bị ẩn (co:false) ⇒ KHÔNG vẽ gì', () => {
    for (const d of [null, deXuat({ co: false, lyDoAn: 'it_du_lieu' })]) {
      const { container } = render(<TheBuoiChuaXepSan deXuat={d} onTuChon={() => {}} />)
      expect(container.innerHTML).toBe('')
    }
  })

  it('có đề xuất: tiêu đề, nhãn sàn 80 %, con số CÓ NHÃN + ĐƠN VỊ (8 câu chữa · 2 câu chỉ đọc đáp án · khoảng 55 phút), vì sao, em lên bảng', () => {
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat()} onTuChon={() => {}} />)
    expect(screen.getByLabelText('Buổi chữa tối nay đã xếp sẵn')).toBeTruthy()
    expect(screen.getByText('Buổi chữa tối nay (đã xếp sẵn)')).toBeTruthy()
    const chu = container.textContent ?? ''
    expect(chu).toContain('8 câu chữa')
    expect(chu).toContain('2 câu chỉ đọc đáp án')
    expect(chu).toContain('khoảng')
    expect(chu).toContain('55 phút')
    expect(chu).toContain('Đạt sàn 80 %')
    expect(chu).toContain('Câu cả lớp sai: 3/8 câu — 12 lượt sai')
    expect(chu).toContain('2 em lên bảng')
    expect(chu).toContain('1 em nhiều lượt')
    expect(chu).toContain('Trần Thu Hà, 12009')
  })

  it('sàn 80 %: chưa đạt ⇒ nhãn "Chưa đạt sàn 80 %" (không hiện "Đạt sàn 80 %")', () => {
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat({ dat80: false })} onTuChon={() => {}} />)
    expect(container.textContent).toContain('Chưa đạt sàn 80 %')
    expect(container.textContent).not.toContain('Đạt sàn 80 %')
  })

  it('cảnh báo hiện THẬT qua ô ghi chú (câu cả lớp sai chưa chữa kịp — cần thêm phút); không có thì không vẽ', () => {
    const { container: sach } = render(<TheBuoiChuaXepSan deXuat={deXuat()} onTuChon={() => {}} />)
    expect(sach.textContent).not.toContain('cần thêm')
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat({ canhBao: ['3 câu cả lớp sai chưa chữa kịp: cần thêm 8 phút'] })} onTuChon={() => {}} />)
    expect(container.textContent).toContain('cần thêm 8 phút')
  })

  it('nút "Tự chọn lại" gọi đúng hàm', () => {
    const onTuChon = vi.fn()
    render(<TheBuoiChuaXepSan deXuat={deXuat()} onTuChon={onTuChon} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tự chọn lại' }))
    expect(onTuChon).toHaveBeenCalledTimes(1)
  })

  it('danh sách câu: đầu tiên THU GỌN; bấm "Xem N câu" ⇒ hiện ĐÚNG thứ tự chữa (chữa kèm em, rồi chỉ đọc đáp án)', () => {
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat()} onTuChon={() => {}} />)
    expect(container.querySelector('[data-ds-cau]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Xem 3 câu \(thứ tự chữa\)/ }))
    const ds = container.querySelector('[data-ds-cau]')
    expect(ds).not.toBeNull()
    const chu = ds!.textContent ?? ''
    expect(chu).toContain('Phần I câu Q7')
    expect(chu).toContain('Trần Thu Hà (lượt 2)')
    expect(chu).toContain('Phần II câu Q3')
    expect(chu).toContain('12009')
    expect(chu).toContain('Phần I câu Q12')
    expect(chu).toContain('chỉ đọc đáp án')
    // ĐÚNG thứ tự chữa: Q7 → Q3 → Q12
    expect(chu.indexOf('Q7')).toBeLessThan(chu.indexOf('Q3'))
    expect(chu.indexOf('Q3')).toBeLessThan(chu.indexOf('Q12'))
    // bấm lần nữa ⇒ thu gọn lại
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }))
    expect(container.querySelector('[data-ds-cau]')).toBeNull()
  })

  it('không có câu trong danh sách ⇒ KHÔNG có nút bung/thu gọn', () => {
    render(<TheBuoiChuaXepSan deXuat={deXuat({ hang: [] })} onTuChon={() => {}} />)
    expect(screen.queryByRole('button', { name: /Xem/ })).toBeNull()
  })

  it('câu bị bỏ nói THẬT: chưa có trên máy này + tự luận; không có thì không hiện dòng ấy', () => {
    const sach = render(<TheBuoiChuaXepSan deXuat={deXuat()} onTuChon={() => {}} />).container.textContent ?? ''
    expect(sach).not.toContain('chưa có trên máy này')
    expect(sach).not.toContain('tự luận')
    const co = render(<TheBuoiChuaXepSan deXuat={deXuat({ boQua: { khongCoTrongKho: 2, tuLuan: 1 } })} onTuChon={() => {}} />).container.textContent ?? ''
    expect(co).toContain('2 câu chưa có trên máy này — đồng bộ đề ở Ngân hàng câu hỏi để thêm.')
    expect(co).toContain('1 câu tự luận không đưa vào buổi xếp sẵn — thầy vẫn thêm tay được.')
  })

  it('tên em: ≤ 6 em hiện đủ; nhiều hơn thì 6 tên đầu + "và N em khác"; không có em thì không vẽ dòng ấy', () => {
    const em = (n: number) => Array.from({ length: n }, (_, i) => ({ sbd: `S${i}`, hoTen: `Em ${i}` }))
    expect(chuEmCanChuY(em(SO_TEN_EM_HIEN))).toBe('Em 0, Em 1, Em 2, Em 3, Em 4, Em 5')
    expect(chuEmCanChuY(em(9))).toBe('Em 0, Em 1, Em 2, Em 3, Em 4, Em 5 và 3 em khác')
    expect(chuEmCanChuY([])).toBe('')
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat({ em: [], soEm: 0 })} onTuChon={() => {}} />)
    expect(container.querySelector('[data-em-can-chu-y]')).toBeNull()
  })

  it('chữ theo chuẩn: không nhãn năng lực, không emoji, không mã nội bộ; màu chỉ qua token (không hex thô)', () => {
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat({ boQua: { khongCoTrongKho: 1, tuLuan: 1 } })} onTuChon={() => {}} />)
    const chu = container.textContent ?? ''
    expect(chu).not.toMatch(/yếu kém|kém|giỏi|nắm chắc|dốt/i)
    expect(chu).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
    expect(chu).not.toMatch(/qid|ca_nhan|\bTN\b|\bVD\b/)
    expect(readFileSync('src/components/TheBuoiChuaXepSan.tsx', 'utf8')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

