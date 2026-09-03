// MÁY EM VÀ MÁY PHỤ HUYNH PHẢI TỰ TÌM ĐƯỢC LINK APPS SCRIPT.
//
// Lỗi thầy chụp: em điền xong hồ sơ, bấm Đăng ký → "Chưa có link kết nối — hỏi
// thầy link Apps Script". Vì hai màn khách đọc link bằng loadScriptUrl(), tức
// CHỈ đọc IndexedDB — mà link đó chỉ được lưu trên máy thầy, hoặc trên máy em
// đã từng vào thi bằng link có sẵn &api=. Máy mới thì rỗng.
//
// Link Apps Script KHÔNG phải bí mật (mọi link mời vào thi đều chứa nó); nó nằm
// sẵn trong public/cau-hinh.json để máy khách tự đọc. Test này khoá việc hai màn
// khách phải dùng loadScriptUrlHoacMacDinh() — hàm có đọc tiếp file đó.
import { describe, expect, it } from 'vitest'
import manStudent from '../src/screens/StudentProfileScreen.tsx?raw'
import manParent from '../src/screens/ParentScreen.tsx?raw'
import manThi from '../src/screens/ExamTakeScreen.tsx?raw'
import cauHinh from '../public/cau-hinh.json'

const MAN_KHACH: Record<string, string> = {
  'màn học sinh': manStudent,
  'màn phụ huynh': manParent,
  'màn vào thi': manThi,
}

describe('Màn của KHÁCH (em, phụ huynh) tự tìm được link Apps Script', () => {
  it('dùng loadScriptUrlHoacMacDinh, KHÔNG dùng loadScriptUrl trần', () => {
    for (const [ten, ma] of Object.entries(MAN_KHACH)) {
      expect(ma, ten).toContain('loadScriptUrlHoacMacDinh')
      // loadScriptUrl( trần sẽ khớp cả tên dài, nên tìm đúng lời gọi không hậu tố.
      expect(/loadScriptUrl\(\)/.test(ma), `${ten} còn gọi loadScriptUrl() trần`).toBe(false)
    }
  })

  it('public/cau-hinh.json có link /exec thật để máy khách đọc', () => {
    expect(cauHinh.scriptUrl).toMatch(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/)
  })

  it('cau-hinh.json KHÔNG chứa mã bí mật — file này ai cũng tải được', () => {
    // Chỉ đúng HAI khoá: ghi chú và link. Thêm khoá nào nữa là phải xem lại có
    // đang lỡ đẩy bí mật lên repo public không.
    expect(Object.keys(cauHinh).sort()).toEqual(['ghi_chu', 'scriptUrl'])
    // Ghi chú là văn xuôi, nhưng giá trị thì không được là chuỗi kiểu mã bí mật.
    expect(/^[A-Za-z0-9]{16,}$/.test(cauHinh.ghi_chu.trim())).toBe(false)
  })
})
