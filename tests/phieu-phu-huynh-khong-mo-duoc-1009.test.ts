// PHỤ HUYNH KHÔNG MỞ ĐƯỢC BÁO CÁO (thầy chụp màn 10/09 22:05).
//
// Màn phụ huynh hiện: "Không mở được báo cáo — Máy chủ không trả lời sau 25
// giây. Kiểm tra mạng rồi thử lại. Phụ huynh nhắn lại cho Thầy Đỗ Đại Học để
// nhận link mới."
//
// TÔI ĐOÁN SAI LẦN ĐẦU. Thấy vừa phát hành bản mới, tôi ngờ máy phụ huynh còn
// giữ service worker cũ trỏ vào tệp JS đã bị xoá (bản cũ `index-2OzXr0z3.js`
// đúng là trả 404 sau lượt đẩy). Ảnh thầy gửi bác bỏ: TRANG MỞ RA BÌNH THƯỜNG,
// đủ giao diện tiếng Việt — chữ báo lỗi là của chính app. Tức app chạy tốt, chỉ
// lượt gọi `layPhieu` hết hạn chờ.
//
// NGUYÊN NHÂN GỐC — hai chỗ:
//   1. `layPhieu` dùng hạn mặc định 25 giây, trong khi `luuPhieu` (GHI đúng cái
//      gói ấy) đã được cho 90 giây vì "gói nặng". Đọc và ghi cùng một gói mà
//      hai hạn lệch nhau gần bốn lần.
//   2. Apps Script khoá theo script, tức TOÀN CỤC. Đo tối 10/09 lúc 14 em ca
//      817428 đang nộp: `danhSachCa` — lệnh đọc nhẹ nhất — cũng quá 25 giây.
//      Phụ huynh mở link đúng lúc đó thì không có cách nào kịp.
//
// Và màn ấy là ĐƯỜNG CỤT: không có nút thử lại, còn câu chữ thì bảo đi xin link
// mới trong khi link không hề hỏng.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { laLoiCho } from '../src/screens/PhieuScreen'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')

describe('HẠN CHỜ CỦA PHỤ HUYNH', () => {
  it('`layPhieu` KHÔNG còn dùng hạn mặc định 25 giây', () => {
    expect(API).not.toMatch(/postJson\(scriptUrl, \{ action: 'layPhieu', ma \}\)\s*$/m)
    expect(API).toContain('const HAN_GIAY_LAY_PHIEU = 90')
    expect(API).toContain("postJson(scriptUrl, { action: 'layPhieu', ma }, HAN_GIAY_LAY_PHIEU)")
  })

  it('bằng đúng hạn của `luuPhieu` — hai đầu cùng một gói', () => {
    const luu = /action: 'luuPhieu'[\s\S]{0,120}?\}, (\d+)\)/.exec(API)
    expect(luu).not.toBeNull()
    expect(Number(luu![1])).toBe(90)
  })

  it('THỬ LẠI đúng một lượt, không phải vòng vô hạn', () => {
    expect(API).toContain('for (let lan = 0; lan < 2; lan++)')
    expect(API).toContain('if (lan === 0) await new Promise')
  })

  it('phiếu KHÔNG TỒN TẠI thì báo ngay, không bắt chờ thêm 90 giây', () => {
    expect(API).toContain("if (e instanceof Error && e.message.includes('Không tìm thấy phiếu')) throw e")
  })
})

describe('PHÂN BIỆT MÁY CHỦ BẬN VỚI LINK HỎNG', () => {
  it('hết hạn chờ và lỗi mạng = BẬN, link vẫn dùng được', () => {
    expect(laLoiCho('Máy chủ không trả lời sau 90 giây. Kiểm tra mạng rồi thử lại.')).toBe(true)
    expect(laLoiCho('Failed to fetch')).toBe(true)
    expect(laLoiCho('Máy chủ trả lỗi HTTP 503')).toBe(true)
  })

  it('phiếu bị thu hồi hay sai phiên bản = HỎNG, phải xin link mới', () => {
    expect(laLoiCho('Không tìm thấy phiếu')).toBe(false)
    expect(laLoiCho('Báo cáo này thuộc phiên bản khác, Thầy cần gửi lại link mới.')).toBe(false)
  })

  it('chuỗi rỗng không được nhận bừa là bận', () => {
    expect(laLoiCho('')).toBe(false)
  })
})

describe('MÀN LỖI KHÔNG CÒN LÀ ĐƯỜNG CỤT', () => {
  it('có nút Thử lại', () => {
    expect(MAN).toContain('Thử lại')
    expect(MAN).toContain('onClick={() => location.reload()}')
  })

  it('lời khuyên đổi theo loại lỗi, không dán một câu cho mọi trường hợp', () => {
    expect(MAN).toContain('laLoiCho(loi)')
    expect(MAN).toContain('Link vẫn còn dùng được')
  })
})
