// THẺ "BUỔI CHỮA TỐI NAY (ĐÃ XẾP SẴN)" — `src/components/TheBuoiChuaXepSan.tsx` (B6, Code 1, 21/09/2026).
// Khoá: không có đề xuất ⇒ không vẽ gì; con số nào cũng có nhãn + đơn vị; tên em cắt "và N em khác"; ghi chú câu bỏ nói thật; hai nút gọi đúng hàm; chữ theo chuẩn từ ngữ.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import TheBuoiChuaXepSan, { SO_TEN_EM_HIEN, chuEmCanChuY } from '../src/components/TheBuoiChuaXepSan'
import type { DeXuatBuoiChua } from '../src/lib/buoi-chua-de-xuat'

const deXuat = (o: Partial<DeXuatBuoiChua> = {}): DeXuatBuoiChua => ({
  co: true,
  lyDoAn: '',
  cau: [],
  em: [{ sbd: '12007', hoTen: 'Trần Thu Hà', lyDo: 'Bộ não A.I gợi ý' }, { sbd: '12009', hoTen: '', lyDo: 'Sai 2 câu trong buổi' }],
  soCau: 8,
  soEm: 2,
  phut: 55,
  cacLyDo: ['Dạng em đang yếu: Thuỷ phân ester — 9/24 em', 'Câu cốt lõi nhiều em sai: 3 câu'],
  boQua: { khongCoTrongKho: 0, tuLuan: 0 },
  ...o,
})

describe('TheBuoiChuaXepSan', () => {
  it('không có đề xuất / đề xuất bị ẩn (co:false) ⇒ KHÔNG vẽ gì', () => {
    for (const d of [null, deXuat({ co: false, lyDoAn: 'it_du_lieu' })]) {
      const { container } = render(<TheBuoiChuaXepSan deXuat={d} onMo={() => {}} onTuChon={() => {}} />)
      expect(container.innerHTML).toBe('')
    }
  })

  it('có đề xuất: tiêu đề, ba con số CÓ NHÃN + ĐƠN VỊ (8 câu để chữa · khoảng 55 phút · 2 em cần chú ý), các dòng vì sao, tên em (thiếu tên thì SBD)', () => {
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat()} onMo={() => {}} onTuChon={() => {}} />)
    expect(screen.getByLabelText('Buổi chữa tối nay đã xếp sẵn')).toBeTruthy()
    expect(screen.getByText('Buổi chữa tối nay (đã xếp sẵn)')).toBeTruthy()
    const chu = container.textContent ?? ''
    expect(chu).toContain('8 câu để chữa')
    expect(chu).toContain('khoảng 55 phút')
    expect(chu).toContain('2 em cần chú ý')
    expect(chu).toContain('Dạng em đang yếu: Thuỷ phân ester — 9/24 em')
    expect(chu).toContain('Câu cốt lõi nhiều em sai: 3 câu')
    expect(chu).toContain('Em cần chú ý: Trần Thu Hà, 12009')
  })

  it('hai nút: "Mở buổi chữa này" và "Tự chọn lại" gọi đúng hàm; nút mở khoá khi đang mở (dangMo)', () => {
    const onMo = vi.fn()
    const onTuChon = vi.fn()
    const { rerender } = render(<TheBuoiChuaXepSan deXuat={deXuat()} onMo={onMo} onTuChon={onTuChon} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mở buổi chữa này' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tự chọn lại' }))
    expect(onMo).toHaveBeenCalledTimes(1)
    expect(onTuChon).toHaveBeenCalledTimes(1)
    rerender(<TheBuoiChuaXepSan deXuat={deXuat()} dangMo onMo={onMo} onTuChon={onTuChon} />)
    expect((screen.getByRole('button', { name: 'Mở buổi chữa này' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Mở buổi chữa này' }))
    expect(onMo).toHaveBeenCalledTimes(1) // đang mở thì bấm không gọi lại
  })

  it('câu bị bỏ nói THẬT: chưa có trên máy này + tự luận; không có thì không hiện dòng ấy', () => {
    const sach = render(<TheBuoiChuaXepSan deXuat={deXuat()} onMo={() => {}} onTuChon={() => {}} />).container.textContent ?? ''
    expect(sach).not.toContain('chưa có trên máy này')
    expect(sach).not.toContain('tự luận')
    const co = render(<TheBuoiChuaXepSan deXuat={deXuat({ boQua: { khongCoTrongKho: 2, tuLuan: 1 } })} onMo={() => {}} onTuChon={() => {}} />).container.textContent ?? ''
    expect(co).toContain('2 câu chưa có trên máy này — đồng bộ đề ở Ngân hàng câu hỏi để thêm.')
    expect(co).toContain('1 câu tự luận không đưa vào buổi xếp sẵn — thầy vẫn thêm tay được.')
  })

  it('tên em: ≤ 6 em hiện đủ; nhiều hơn thì 6 tên đầu + "và N em khác"; không có em thì không vẽ dòng ấy', () => {
    const em = (n: number) => Array.from({ length: n }, (_, i) => ({ sbd: `S${i}`, hoTen: `Em ${i}` }))
    expect(chuEmCanChuY(em(SO_TEN_EM_HIEN))).toBe('Em 0, Em 1, Em 2, Em 3, Em 4, Em 5')
    expect(chuEmCanChuY(em(9))).toBe('Em 0, Em 1, Em 2, Em 3, Em 4, Em 5 và 3 em khác')
    expect(chuEmCanChuY([])).toBe('')
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat({ em: [], soEm: 0 })} onMo={() => {}} onTuChon={() => {}} />)
    expect(container.querySelector('[data-em-can-chu-y]')).toBeNull()
  })

  it('chữ theo chuẩn: không nhãn năng lực, không emoji, không mã nội bộ; màu chỉ qua token (không hex thô)', () => {
    const { container } = render(<TheBuoiChuaXepSan deXuat={deXuat({ boQua: { khongCoTrongKho: 1, tuLuan: 1 } })} onMo={() => {}} onTuChon={() => {}} />)
    const chu = container.textContent ?? ''
    expect(chu).not.toMatch(/yếu kém|kém|giỏi|nắm chắc|dốt/i)
    expect(chu).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u)
    expect(chu).not.toMatch(/qid|ca_nhan|\bTN\b|\bVD\b/)
    expect(readFileSync('src/components/TheBuoiChuaXepSan.tsx', 'utf8')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
