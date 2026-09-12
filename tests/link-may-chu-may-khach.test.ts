// MÁY EM PHẢI TỰ TÌM ĐƯỢC LINK APPS SCRIPT.
//
// Lỗi đã dính: em bấm link mời, điền xong rồi bấm nộp → "Chưa có link kết nối —
// hỏi thầy link Apps Script". Vì màn khách đọc link bằng loadScriptUrl(), tức
// CHỈ đọc IndexedDB — mà link đó chỉ được lưu trên máy thầy, hoặc trên máy em đã
// từng vào thi bằng link có sẵn &api=. Máy mới thì rỗng.
//
// Link Apps Script KHÔNG phải bí mật (mọi link mời vào thi đều chứa nó); nó nằm
// sẵn trong public/cau-hinh.json để máy khách tự đọc. Test này khoá việc màn
// khách phải dùng loadScriptUrlHoacMacDinh() — hàm có đọc tiếp file đó.
//
// Repo này chỉ còn MỘT màn của khách là màn làm bài; màn hồ sơ em và màn phụ
// huynh đã tách sang repo riêng (TACHAPPHSPH.md).
import { describe, expect, it } from 'vitest'
import manThi from '../src/screens/ExamTakeScreen.tsx?raw'
import cauHinh from '../public/cau-hinh.json'

const MAN_KHACH: Record<string, string> = {
  'màn vào thi': manThi,
}

describe('Màn của KHÁCH (em vào làm bài) tự tìm được địa chỉ máy chủ', () => {
  it('dùng loadScriptUrlHoacMacDinh, KHÔNG dùng loadScriptUrl trần', () => {
    for (const [ten, ma] of Object.entries(MAN_KHACH)) {
      expect(ma, ten).toContain('loadScriptUrlHoacMacDinh')
      // loadScriptUrl( trần sẽ khớp cả tên dài, nên tìm đúng lời gọi không hậu tố.
      expect(/loadScriptUrl\(\)/.test(ma), `${ten} còn gọi loadScriptUrl() trần`).toBe(false)
    }
  })

  it('public/cau-hinh.json KHÔNG còn địa chỉ Google — đã cắt hẳn 12/09', () => {
    expect(cauHinh.scriptUrl).toBeUndefined()
    expect(JSON.stringify(cauHinh)).not.toContain('script.google.com')
  })

  it('cau-hinh.json KHÔNG chứa mã bí mật — file này ai cũng tải được', () => {
    // Đúng MỘT địa chỉ và mấy lời ghi chú. Địa chỉ Worker là công khai (lệnh
    // của em vốn không đòi mã bí mật). Thêm khoá nào nữa là phải xem lại có
    // đang lỡ đẩy bí mật lên repo public không — đây là repo CÔNG KHAI.
    expect(Object.keys(cauHinh).filter((k) => !k.startsWith('ghi_chu')).sort()).toEqual(['mayChuMoi'])
    expect(cauHinh.mayChuMoi).toMatch(/^https:\/\/[a-z0-9.-]+$/)
    // Ghi chú là văn xuôi, nhưng giá trị thì không được là chuỗi kiểu mã bí mật.
    expect(/^[A-Za-z0-9]{16,}$/.test(cauHinh.ghi_chu.trim())).toBe(false)
  })
})
