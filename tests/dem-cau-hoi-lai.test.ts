// HAI CON SỐ VÊNH TRÊN CÙNG MÀN CA THI — số trong tệp này lấy từ ca 638242
// thật: biên bản ghi "rút được 8", khối đỏ ghi "hỏi lại 9 câu". Cả hai đều
// đúng, chỉ đếm hai tập khác nhau (câu thứ 9 là 12-C1-B1-II-3, em từng sai
// nhưng nó vào đề theo lượt rút thường chứ máy không cố ý hỏi lại).
import { describe, expect, it } from 'vitest'
import { dongSoCauHoiLai } from '../src/lib/dem-cau-hoi-lai'

describe('dongSoCauHoiLai', () => {
  it('CA 638242 THẬT: 9 câu trong đề, biên bản rút 8 — nói rõ 1 câu tự vào đề', () => {
    expect(dongSoCauHoiLai({ tong: 9, daSua: 3, saiLai: 5, rutChuDong: 8 })).toBe(
      '9 câu em từng sai có trong đề này · sửa được 3 · còn sai 5 (máy chủ động rút lại 8, 1 câu còn lại tự vào đề)',
    )
  })

  it('hai số bằng nhau thì KHÔNG thêm ngoặc — cấm chữ thừa', () => {
    expect(dongSoCauHoiLai({ tong: 8, daSua: 5, saiLai: 3, rutChuDong: 8 })).toBe(
      '8 câu em từng sai có trong đề này · sửa được 5 · còn sai 3',
    )
  })

  it('máy không giữ biên bản thì im về số rút, không đoán', () => {
    expect(dongSoCauHoiLai({ tong: 9, daSua: 3, saiLai: 6, rutChuDong: null })).toBe(
      '9 câu em từng sai có trong đề này · sửa được 3 · còn sai 6',
    )
  })

  it('biên bản rút NHIỀU hơn số soi được thì nói thẳng, không giấu', () => {
    expect(dongSoCauHoiLai({ tong: 5, daSua: 2, saiLai: 3, rutChuDong: 8 })).toBe(
      '5 câu em từng sai có trong đề này · sửa được 2 · còn sai 3 (biên bản ghi rút 8 — máy này chỉ soi được 5 câu trong đề)',
    )
  })

  it('KHÔNG còn gọi cả hai số là "câu hỏi lại" — đó là chỗ thầy đọc ra vênh', () => {
    const s = dongSoCauHoiLai({ tong: 9, daSua: 3, saiLai: 5, rutChuDong: 8 })
    expect(s).not.toContain('hỏi lại 9 câu')
    expect(s).toContain('em từng sai có trong đề này')
  })
})
