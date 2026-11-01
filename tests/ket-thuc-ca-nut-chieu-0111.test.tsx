// @vitest-environment jsdom
// NÚT «CHIẾU CHỮA BÀI» Ở MÀN KẾT THÚC CA (thầy chốt 01/11): có câu sai ⇒ nút bấm được «· N câu» + dòng luật xếp; có lý do (chưa có đề có đáp án / cả lớp
// đúng hết / chưa có bảng chấm / đang tổng hợp) ⇒ nút mờ + lý do; còn em đang làm ⇒ vẫn bấm được + dòng nhắc; đang dựng ⇒ mờ; vắng prop ⇒ không nút.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import KetThucCa, { type KetThucCaProps } from '../src/components/ca-thi/KetThucCa'

afterEach(cleanup)
const goc: KetThucCaProps = { tenCa: 'KT 15 phút', luc: '', siSo: 32, phutDe: 15, lop: null, them: null, dangTai: false, loi: '', canCongBo: false, dangCongBo: false, onCongBo: () => {}, onXemBaoCao: () => {}, onMoEm: () => {}, emChuaNop: [] }
const nut = () => screen.queryByRole('button', { name: /Chiếu chữa bài/ }) as HTMLButtonElement | null

describe('nút Chiếu chữa bài', () => {
  it('có câu sai ⇒ bấm được, ghi số câu + luật xếp', () => {
    const onChieu = vi.fn()
    render(<KetThucCa {...goc} chieu={{ soCau: 9, ly: '', canhBao: '', dang: false }} onChieu={onChieu} />)
    expect(nut()!.textContent).toBe('Chiếu chữa bài · 9 câu')
    expect(nut()!.disabled).toBe(false)
    expect(screen.getByText('Xếp khó → dễ, cùng mức thì sai nhiều → ít')).toBeTruthy()
    fireEvent.click(nut()!)
    expect(onChieu).toHaveBeenCalledTimes(1)
  })
  it.each(['Máy này chưa có đề có đáp án của ca', 'Cả lớp đúng hết · không có câu cần chữa', 'Chưa có bảng chấm từng câu của ca này', 'Đang tổng hợp…'])('lý do «%s» ⇒ nút mờ + lý do', (ly) => {
    render(<KetThucCa {...goc} chieu={{ soCau: 0, ly, canhBao: '', dang: false }} onChieu={() => {}} />)
    expect(nut()!.disabled).toBe(true)
    expect(nut()!.textContent).toBe('Chiếu chữa bài')
    expect(screen.getByText(ly)).toBeTruthy()
  })
  it('còn em đang làm ⇒ vẫn bấm được + dòng nhắc; đang dựng ⇒ mờ', () => {
    const { rerender } = render(<KetThucCa {...goc} chieu={{ soCau: 3, ly: '', canhBao: '2 em còn đang làm — chiếu lúc này các em ấy thấy đề và lời giải', dang: false }} onChieu={() => {}} />)
    expect(nut()!.disabled).toBe(false)
    expect(screen.getByText(/2 em còn đang làm/).hasAttribute('data-canh-bao')).toBe(true)
    rerender(<KetThucCa {...goc} chieu={{ soCau: 3, ly: '', canhBao: '', dang: true }} onChieu={() => {}} />)
    expect(screen.getByRole('button', { name: /Đang dựng tờ chiếu/ }).hasAttribute('disabled')).toBe(true)
  })
  it('vắng prop ⇒ không có nút', () => {
    render(<KetThucCa {...goc} />)
    expect(nut()).toBeNull()
  })
})
