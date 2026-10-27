// LUYỆN CÂU KHẮC PHỤC — khối ở ngay màn Ca thi (thầy chốt 08/09).
//
// "Nút xem học sinh có luyện câu khắc phục không để luôn ngoài này. Bấm vào sẽ
// liệt kê đã làm câu khắc phục ca nào bao nhiêu lần hay chưa làm lần nào. Có ô
// tìm kiếm sẽ ra tên học sinh, bấm vào sẽ ra lịch sử luyện câu khắc phục."
//
// 27/10: khối `KhoiLuyenKhacPhuc` đã gỡ khỏi src/ (màn Ca thi không còn gắn nó, không màn nào dùng) ⇒ các phép kiểm
// hàm gom/tìm và mã nguồn của khối bỏ theo; chỉ giữ vế soát màn sống.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('khối đứng ở màn Ca thi', () => {
  it('KHÔNG có bản thứ hai trong chi tiết từng ca', () => {
    // KHÔNG còn bản thứ hai trong màn chi tiết ca — hai bản thì sớm muộn lệch.
    expect(doc('src/screens/ExamMonitorScreen.tsx')).not.toContain('đã mở phiếu khắc phục')
  })
})
