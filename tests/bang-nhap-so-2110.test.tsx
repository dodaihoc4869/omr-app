// BẢNG NHẬP SỐ Ở MỌI CHỖ TRẢ LỜI NGẮN (thầy 21/10, kèm ảnh màn luyện: "toàn bộ phần trả lời ngắn trong mọi chỗ, kể cả màn kiểm tra của học sinh
// phải hiện bảng nhập này, tuỳ theo đáp số mà hiện số ô nhập tương ứng").
//   1. Gói đề công khai (ca kiểm tra, luyện đề) gắn `soO` = số kí tự đáp số gõ chuẩn — KHÔNG có đáp án.
//   2. Câu công khai máy chủ (`cauCongKhai`: ôn câu, chữa câu sai…) và Tự luyện cũng gắn `soO`.
//   3. TheCau có `soO` hợp lệ ⇒ bảng nhập số đúng số ô; thiếu ⇒ ô nhập tự do cũ (KHÔNG tự về 4 ô — lỗi "10000 ⇒ 1000").
//   4. Bảng nhập: giá trị gửi đi y như ô cũ ("-" ASCII, "," thập phân), không quá số ô, gõ phím máy tính khi bảng đang được chọn.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { mergeAndStrip, type TeacherExamSource } from '../src/data/examContent'
import { cauCongKhai } from '../server/src/cau-theo-qid'
import { cauCongKhaiTu } from '../src/lib/tu-luyen'
import { soOHopLe } from '../src/lib/so-o-tra-loi-ngan'
import BangNhapSo from '../src/components/BangNhapSo'
import TheCau from '../src/components/TheCau'

afterEach(cleanup)

const nguon = [{ maDe: 'D', phanI: [], phanII: [], phanIII: [
  { id: 'a', text: 'Số amine', correct: '4' },
  { id: 'b', text: 'Phóng đại', correct: '10000' },
  { id: 'c', text: 'Enthalpy', correct: '-92,4' },
  { id: 'd', text: 'Số lớn', correct: '1.237.500.000' },
  { id: 'e', text: 'Chữ', correct: 'glucose' },
] }] as unknown as TeacherExamSource[]

describe('gói đề công khai gắn số ô, không lộ đáp án', () => {
  it('mergeAndStrip: soO theo đáp số; đáp án bàn phím không gõ được ⇒ không gắn; không còn correct', () => {
    const b = mergeAndStrip(nguon)
    expect(b.phanIII.map((q) => q.soO)).toEqual([1, 5, 5, undefined, undefined])
    for (const q of b.phanIII) expect(q).not.toHaveProperty('correct')
    expect(JSON.stringify(b)).not.toMatch(/10000|92,4|glucose/)
  })
  it('cauCongKhai (máy chủ) gắn soO cho Phần III, không correct', () => {
    const c = cauCongKhai({ qid: 'q', maDe: 'D', phan: 'III', text: 't', correct: '24' } as never) as Record<string, unknown>
    expect(c.soO).toBe(2)
    expect(c).not.toHaveProperty('correct')
    const tn = cauCongKhai({ qid: 'q', maDe: 'D', phan: 'I', text: 't', correct: 'A', choices: ['1', '2', '3', '4'] } as never) as Record<string, unknown>
    expect(tn).not.toHaveProperty('soO')
  })
  it('Tự luyện: câu công khai Phần III có soO, không dapAn', () => {
    const c = cauCongKhaiTu({ id: 'q', phan: 'III', maDe: 'D', text: 't', luaChon: null, dapAn: '7,5' } as never, '')
    expect(c.soO).toBe(3)
    expect(c).not.toHaveProperty('dapAn')
  })
  it('soOHopLe: chỉ số nguyên 1..8, thiếu/lạ ⇒ null (không tự về 4)', () => {
    expect([soOHopLe(2), soOHopLe('5'), soOHopLe(undefined), soOHopLe(0), soOHopLe(9), soOHopLe('x')]).toEqual([2, 5, null, null, null, null])
  })
})

function Boc({ soO, dau = '' }: { soO: number; dau?: string }) {
  const [v, setV] = useState(dau)
  return <><BangNhapSo value={v} onChange={setV} soO={soO} ariaLabel="Đáp số câu 1" /><span data-testid="gt">{v}</span></>
}
const bam = (ten: string) => fireEvent.click(screen.getByRole('button', { name: ten }))

describe('bảng nhập số', () => {
  it('đúng số ô; bấm phím ra giá trị như ô cũ ("-", ","); không vượt số ô', () => {
    const { container } = render(<Boc soO={5} />)
    expect(container.querySelectorAll('.bns-o')).toHaveLength(5)
    bam('9'); bam('2'); bam('Dấu phẩy'); bam('4'); bam('Dấu trừ')
    expect(screen.getByTestId('gt').textContent).toBe('-92,4')
    bam('7') // đủ 5 kí tự ⇒ không nhận thêm
    expect(screen.getByTestId('gt').textContent).toBe('-92,4')
    expect((screen.getByRole('button', { name: '7' }) as HTMLButtonElement).disabled).toBe(true)
    bam('Xoá một kí tự')
    expect(screen.getByTestId('gt').textContent).toBe('-92,')
    bam('Xoá hết')
    expect(screen.getByTestId('gt').textContent).toBe('')
  })
  it('gõ phím máy tính khi bảng đang được chọn ("." thành ",", Backspace xoá)', () => {
    render(<Boc soO={3} />)
    const bang = screen.getByRole('group', { name: 'Đáp số câu 1' })
    for (const k of ['7', '.', '5']) fireEvent.keyDown(bang, { key: k })
    expect(screen.getByTestId('gt').textContent).toBe('7,5')
    fireEvent.keyDown(bang, { key: 'Backspace' })
    expect(screen.getByTestId('gt').textContent).toBe('7,')
  })
  it('đáp án đã lưu dài hơn số ô vẫn hiện đủ, chỉ xoá bớt được', () => {
    const { container } = render(<Boc soO={2} dau="1234" />)
    expect(container.querySelectorAll('.bns-o')).toHaveLength(4)
    expect((screen.getByRole('button', { name: '5' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('TheCau Phần III', () => {
  const chung = { cheDo: 'thi' as const, stt: 1, text: 'Đề', phan: 'III' as const, selected: '', onChange: () => {} }
  it('có soO hợp lệ ⇒ bảng nhập số đúng số ô, không ô <input>', () => {
    const { container } = render(<TheCau {...chung} soO={2} />)
    expect(container.querySelectorAll('.bns-o')).toHaveLength(2)
    expect(container.querySelector('input')).toBeNull()
  })
  it('thiếu soO (gói ca cũ / đáp án không gõ được) ⇒ ô nhập tự do như trước', () => {
    const { container } = render(<TheCau {...chung} />)
    expect(container.querySelector('.bns')).toBeNull()
    expect(container.querySelector('input')).not.toBeNull()
  })
})
