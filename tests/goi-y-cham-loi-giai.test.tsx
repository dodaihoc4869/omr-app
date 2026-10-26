// LỜI GIẢI KIỂU SƠ ĐỒ (làn B, 26/10): kết quả nộp có `soDo` ⇒ THAY lời giải chữ / bước / kết quả bằng sơ đồ của thầy (lý do từng phương án giữ);
// không có `soDo` hoặc bản hỏng ⇒ lời giải cũ như cũ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import KhoiLoiGiaiChuan from '../src/components/loi-giai/KhoiLoiGiaiChuan'
import { thayBangSoDo } from '../src/components/goi-y-cham/thay-bang-so-do'
import { BAN_PYRITE } from './_goi-y-cham-gia'

afterEach(cleanup)
const LG = { chot: 'Bảo toàn S: n SO2 = 2 n FeS2.', buoc: ['n FeS2 = 80000/120', 'm SO2 = 2 · n · 64 · 0,9'], ketQua: '76,8' }

describe('KhoiLoiGiaiChuan + thayBangSoDo(soDo)', () => {
  it('không có soDo ⇒ thayBangSoDo trả undefined', () => { expect(thayBangSoDo(undefined)).toBeUndefined(); expect(thayBangSoDo(null)).toBeUndefined() })
  it('có soDo ⇒ sơ đồ + chuỗi tính có kết quả, ẩn lời giải chữ cũ', async () => {
    render(<KhoiLoiGiaiChuan phan="III" loiGiai={LG} correct="76,8" thayLoiGiai={thayBangSoDo(BAN_PYRITE)} />)
    await screen.findByText('Tóm tắt của thầy Đỗ Đại Học')
    expect(screen.getByText('H = 90%')).toBeTruthy()
    expect(screen.getByText('= 76,8 kg')).toBeTruthy()
    expect(screen.getByText(/Kết quả:/).textContent).toContain('76,8')
    expect(screen.queryByText(/80000\/120/)).toBeNull()
    expect(screen.queryByText('Kiến thức cốt lõi')).toBeNull()
    expect(screen.getByText('LỜI GIẢI')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Thừa số 6: 90/100' }))
    expect(document.querySelector('.gyc-bong-so')!.textContent).toContain('đánh thuế')
  })

  it('không có soDo ⇒ lời giải cũ y như trước', () => {
    render(<KhoiLoiGiaiChuan phan="III" loiGiai={LG} correct="76,8" />)
    expect(screen.getByText('Kiến thức cốt lõi')).toBeTruthy()
    expect(screen.getByText(/80000/)).toBeTruthy()
    expect(screen.queryByText('Tóm tắt của thầy Đỗ Đại Học')).toBeNull()
  })

  it('soDo hỏng ⇒ lời giải cũ (dự phòng)', async () => {
    render(<KhoiLoiGiaiChuan phan="III" loiGiai={LG} correct="76,8" thayLoiGiai={thayBangSoDo({ qid: 'x' })} />)
    expect(await screen.findByText('Kiến thức cốt lõi')).toBeTruthy()
    expect(screen.getByText(/80000/)).toBeTruthy()
  })

  it('Phần I: lý do từng phương án vẫn giữ khi có soDo', async () => {
    render(<KhoiLoiGiaiChuan phan="I" correct="B" loiGiai={{ chot: 'x', tungPa: { A: { dung: false, viSao: 'Thiếu hiệu suất.' }, B: { dung: true, viSao: 'Đúng chuỗi.' } } }} thayLoiGiai={thayBangSoDo(BAN_PYRITE)} />)
    await screen.findByText('Tóm tắt của thầy Đỗ Đại Học')
    expect(screen.getByText('Thiếu hiệu suất.')).toBeTruthy()
  })
})
