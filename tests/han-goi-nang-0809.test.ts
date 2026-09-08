// LƯỢT GỌI NẶNG PHẢI CÓ HẠN RIÊNG — thầy báo khuya 08/09.
//
// Điểm ca 447479 sai, mà `chamLaiCa` gọi qua cầu nối hỏng BA LẦN liền, cả ba
// đều "Máy chủ không trả lời sau 25 giây". Ca đó 36 em; `gomCa` xin `chiTietCa`
// KÈM ngân hàng đáp án, gói mang cả đáp án của kho lẫn bài làm từng em.
//
// Hạn 25 giây hợp với lượt gọi nhỏ. Gói to mà vẫn 25 giây thì thầy ngồi chờ rồi
// nhận một dòng "kiểm tra mạng" trong khi mạng không sao — máy nói dối về
// nguyên nhân, đúng loại lỗi tệ nhất.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

describe('hạn cho lượt gọi nặng', () => {
  it('chiTietCa KÈM keyBank dùng hạn dài, không dùng hạn mặc định', () => {
    expect(API).toContain('const HAN_GIAY_KEYBANK = 90')
    expect(API).toContain("postJson(scriptUrl, { action: 'chiTietCa', secret, maCa, xinKeyBank }, xinKeyBank ? HAN_GIAY_KEYBANK : undefined)")
  })

  it('KHÔNG nới hạn cho lượt KHÔNG xin keyBank — gói nhỏ thì giữ 25 giây', () => {
    // `xinKeyBank ? … : undefined` giữ đúng điều đó: không xin thì rơi về mặc định.
    expect(API).not.toContain("{ action: 'chiTietCa', secret, maCa, xinKeyBank }, HAN_GIAY_KEYBANK")
  })

  it('hạn mặc định vẫn là 25 giây cho mọi lượt gọi khác', () => {
    expect(API).toContain('const HAN_GIAY = 25')
    expect(API).toContain('giay: number = HAN_GIAY')
  })

  it('hạn dài bằng đúng mức của hoSoNhieuEm — lượt nặng khác cùng nhóm', () => {
    expect(API).toContain("action: 'hoSoNhieuEm', secret, sbd }, 90)")
  })
})
