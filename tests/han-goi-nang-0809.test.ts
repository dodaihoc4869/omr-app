// LƯỢT GỌI NẶNG PHẢI CÓ HẠN RIÊNG — thầy báo khuya 08/09.
//
// ĐỢT 1. Điểm ca 447479 sai, mà `chamLaiCa` gọi qua cầu nối hỏng BA LẦN liền,
// cả ba đều "Máy chủ không trả lời sau 25 giây". Ca đó 36 em; `gomCa` xin
// `chiTietCa` KÈM ngân hàng đáp án. Vòng vá đầu chỉ nới hạn cho nhánh CÓ xin
// đáp án, và tệp này khoá lại điều đó bằng một phép kiểm ghi rằng nhánh KHÔNG
// xin đáp án "là gói nhỏ, giữ 25 giây".
//
// ĐỢT 2, cùng đêm — PHÉP KIỂM ẤY SAI, ĐO ĐƯỢC. `chamLaiCa('248567')` hỏng đúng
// câu đó HAI LẦN liền (34 giây và 46 giây tính từ lúc gọi), dù ca chỉ 21 em.
// Lần này máy đã cất sẵn bộ đề của ca nên `gomCa` gọi `chiTietCa(..., false)` —
// rơi đúng vào nhánh 25 giây mà phép kiểm cũ bảo vệ.
//
// Tức chỗ nặng KHÔNG phải ngân hàng đáp án: bản thân `chiTietCa` đã trả về
// `dapAn` đầy đủ của TỪNG LƯỢT rồi, nên gói to theo số em chứ không theo việc
// có xin đáp án hay không. Hạn dài nay áp cho CẢ HAI nhánh.
//
// Chép lại giả định cũ ở đây thay vì xoá lặng: phép kiểm cũ không "hỏng", nó
// khoá một điều mà lúc viết tôi tưởng là đúng và đo được là sai.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')

describe('hạn cho lượt gọi nặng', () => {
  it('chiTietCa dùng hạn dài Ở CẢ HAI NHÁNH — có hay không xin keyBank', () => {
    expect(API).toContain('const HAN_GIAY_CHI_TIET_CA = 90')
    expect(API).toContain(
      "postJson(scriptUrl, { action: 'chiTietCa', secret, maCa, xinKeyBank }, HAN_GIAY_CHI_TIET_CA)",
    )
  })

  it('KHÔNG còn nhánh nào của chiTietCa rơi về hạn mặc định', () => {
    // Dạng cũ `xinKeyBank ? … : undefined` chính là chỗ ca 248567 chết.
    expect(API).not.toContain("xinKeyBank ? HAN_GIAY_KEYBANK : undefined")
    expect(API).not.toContain("xinKeyBank ? HAN_GIAY_CHI_TIET_CA : undefined")
  })

  it('hạn mặc định vẫn là 25 giây cho mọi lượt gọi khác — không nới đại trà', () => {
    expect(API).toContain('const HAN_GIAY = 25')
    expect(API).toContain('giay: number = HAN_GIAY')
  })

  it('hạn dài bằng đúng mức của hoSoNhieuEm — lượt nặng khác cùng nhóm', () => {
    expect(API).toContain("action: 'hoSoNhieuEm', secret, sbd }, 90)")
  })

  it('lượt gọi NHỎ điển hình vẫn không kèm hạn riêng (chứng minh không nới đại trà)', () => {
    expect(API).toContain("postJson(scriptUrl, { action: 'danhSachCa', secret, daXoa })")
  })
})
