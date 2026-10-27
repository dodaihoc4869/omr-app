// @vitest-environment node
// GỢI Ý RIÊNG CỦA CÂU sau lần sửa sai đầu (thầy 27/10: «Gợi ý: Em đọc lại đề, gạch chân điều đề hỏi…» là vô nghĩa). server/src/goi-y-rieng.ts. Khoá:
//   · lấy VẾ ĐẦU bước 1 lời giải, rồi vế đầu Kiến thức cốt lõi; không bao giờ có chữ / số của đáp án; Phần II không lấy từ lời giải;
//   · không có gì an toàn ⇒ null (máy em không hiện dòng Gợi ý) — không còn lời khuyên chung chung.
import { describe, expect, it } from 'vitest'
import { goiYTuLoiGiai, loDapAn } from '../server/src/goi-y-rieng'

const DE = 'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng dung dịch NaOH vừa đủ. Khối lượng muối thu được là'
const I = { phan: 'I' as const, correct: 'A', choices: ['8,2 gam.', '6,8 gam.', '9,6 gam.', '4,1 gam.'], text: DE }

describe('goiYTuLoiGiai', () => {
  it('bước 1 lời giải ⇒ chỉ vế đầu (trước ⇒), không đáp số', () => {
    const g = goiYTuLoiGiai({ ...I, solution: { buoc: ['n(ester) = 8,8 : 88 = 0,1 mol ⇒ n(CH₃COONa) = 0,1 mol ⇒ m = 8,2 gam.'], chot: 'Muối là CH₃COONa.' } })
    expect(g).toBe('n(ester) = 8,8 : 88 = 0,1 mol')
  })
  it('vế đầu lộ đáp án ⇒ thử Kiến thức cốt lõi; cũng lộ ⇒ null', () => {
    expect(goiYTuLoiGiai({ ...I, solution: { buoc: ['m = 0,1 × 82 = 8,2 gam'], chot: 'Este đơn chức + NaOH: n(muối) = n(este)' } })).toBe('Este đơn chức + NaOH: n(muối) = n(este)')
    expect(goiYTuLoiGiai({ ...I, solution: { chot: 'Khối lượng muối là 8,2 gam.' } })).toBeNull()
    expect(goiYTuLoiGiai({ ...I, solution: { chot: 'Chọn A vì muối là natri acetate.' } })).toBeNull()
  })
  it('Phần III: đáp số không lọt; Phần II: không lấy từ lời giải; lời giải trống ⇒ null', () => {
    const III = { phan: 'III' as const, correct: '8,2', choices: [], text: DE }
    expect(goiYTuLoiGiai({ ...III, solution: { chot: 'm = 0,1 × 82 = 8,2' } })).toBeNull()
    expect(goiYTuLoiGiai({ ...III, solution: JSON.stringify({ buoc: ['Tính số mol ester trước: 8,8 : 88 = 0,1 mol; rồi nhân 82'] }) })).toBe('Tính số mol ester trước: 8,8 : 88 = 0,1 mol')
    expect(goiYTuLoiGiai({ phan: 'II', correct: 'DSDS', choices: [], text: 'Cho các phát biểu', solution: { chot: 'Glucose và fructose là đồng phân.' } })).toBeNull()
    expect(goiYTuLoiGiai({ ...I, solution: null })).toBeNull()
  })
  it('loDapAn: chữ phương án đúng / «đáp án» / «chọn B» là lộ', () => {
    expect(loDapAn('Muối thu được 8,2 gam', I)).toBe(true)
    expect(loDapAn('Đáp án là A', I)).toBe(true)
    expect(loDapAn('Tính số mol ester trước', I)).toBe(false)
  })
})
