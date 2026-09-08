// BÁO CÁO CỦA EM XƯNG "CON" — thầy báo tối 08/09.
//
// "thi thật hôm nay lúc học sinh xem báo cáo, có nhiều máy lấy nhầm báo cáo của
// phụ huynh." Thầy xác nhận: đúng em, đúng điểm, nhưng trang xưng hô kiểu gửi
// phụ huynh.
//
// NGUYÊN NHÂN GỐC: `phieu-ca-ca.ts` gọi `nhanXetTheoCa({ …, xung: 'con' })` —
// ghi cứng — rồi CẤT chuỗi kết quả vào `phieu.vieCanLam` trên máy chủ.
// `PhieuV3` đổi được xưng hô của phần khung bằng `laCuaEm`, nhưng `vieCanLam`
// là chuỗi đã cất nên in nguyên. Cả hai đường em xem báo cáo (nút trong app và
// link /p#) đều đọc chính chuỗi đó.
//
// PHÉP KIỂM QUYẾT ĐỊNH: đổi ngược bản "con" phải ra ĐÚNG bản sinh thẳng "em",
// trên mọi tổ hợp dữ liệu mà bộ sinh có thể gặp. Đúng trên mọi tổ hợp thì phép
// đổi không phải mẹo vá, mà là một phép biến đổi kín.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { doiXungVeEm, nhanXetTheoCa, type DuLieuNhanXetCa } from '../src/lib/nhan-xet-theo-ca'

const V3 = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuV3.tsx'), 'utf8')

/** Mọi câu số liệu có chứa đại từ mà bộ tín hiệu thật có thể sinh ra
 * (`src/lib/phan-tich-lam-bai.ts`), chép nguyên văn. */
const CAU_TIN_HIEU = [
  'Em không điền gì ở 3/28 câu.',
  'Em làm 12 phút trên 45 phút được phép, còn sai 9 câu.',
  'Trung bình 41,0 giây cho một câu sai, so với 18,5 giây cho một câu đúng.',
  'Sai 5/8 câu mức nhận biết (62%).',
  'Sai 6/10 câu ở Phần I (60%).',
  'Sai 9/28 câu, không có câu bỏ trống, thời gian phân bổ đều giữa các câu.',
  '',
]

const CHUYEN_DE = [
  [],
  [{ ten: 'Ester – lipid', soCau: 6, soSai: 4 }],
  [{ ten: 'Carbohydrate', soCau: 4, soSai: 1 }],
  [
    { ten: 'Hợp chất chứa nitrogen', soCau: 7, soSai: 5 },
    { ten: 'Polymer', soCau: 3, soSai: 2 },
  ],
]

function* moiToHop(): Generator<Omit<DuLieuNhanXetCa, 'xung'>> {
  for (const soCauSai of [0, 1, 9, 16]) {
    for (const soCauChua of [0, 5, 20]) {
      for (const cd of CHUYEN_DE) {
        for (const soLieu of CAU_TIN_HIEU) {
          for (const hanNop of ['', '2026-09-12T00:00:00.000Z']) {
            for (const tenCa of ['', '2009 - Lớp 2 - L1']) {
              yield {
                ngay: '2026-09-08T13:00:00.000Z',
                tenCa,
                soCauSai,
                tongSoCau: 28,
                chuyenDeSai: cd,
                tinHieu: soLieu ? [{ ma: 'bo_trong', nhan: 'x', soLieu, muc: 'nang' } as never] : [],
                soCauChua,
                hanNop: hanNop || null,
              }
            }
          }
        }
      }
    }
  }
}

describe('doiXungVeEm — phép biến đổi kín, không phải mẹo vá', () => {
  it('ĐỔI NGƯỢC bản "con" ra ĐÚNG bản sinh thẳng "em", trên MỌI tổ hợp', () => {
    let n = 0
    let khac = 0
    const viDu: string[] = []
    for (const d of moiToHop()) {
      const banCon = nhanXetTheoCa({ ...d, xung: 'con' })
      const banEm = nhanXetTheoCa({ ...d, xung: 'em' })
      n++
      if (doiXungVeEm(banCon) !== banEm) {
        khac++
        if (viDu.length < 3) viDu.push(`con: ${banCon}\n em: ${banEm}\ndoi: ${doiXungVeEm(banCon)}`)
      }
    }
    expect(n).toBeGreaterThan(500)
    expect(khac, `${khac}/${n} tổ hợp lệch:\n${viDu.join('\n---\n')}`).toBe(0)
  })

  it('bản "em" đi qua phép đổi thì KHÔNG suy suyển', () => {
    for (const d of moiToHop()) {
      const banEm = nhanXetTheoCa({ ...d, xung: 'em' })
      expect(doiXungVeEm(banEm)).toBe(banEm)
    }
  })

  it('KHÔNG đụng "con" trong nghĩa khác — con số, con đường', () => {
    expect(doiXungVeEm('Bài này có con số đáng chú ý.')).toBe('Bài này có con số đáng chú ý.')
    expect(doiXungVeEm('Em đi con đường khác.')).toBe('Em đi con đường khác.')
    expect(doiXungVeEm('Sai 3 câu, con số này giảm dần.')).toBe('Sai 3 câu, con số này giảm dần.')
  })

  it('đổi đúng bốn dạng bộ sinh tạo ra', () => {
    expect(doiXungVeEm('Con không điền gì ở 3/28 câu.')).toBe('Em không điền gì ở 3/28 câu.')
    expect(doiXungVeEm('Bài A. Con làm 5 câu khắc phục.')).toBe('Bài A. Em làm 5 câu khắc phục.')
    expect(doiXungVeEm('Bài A ngày 08/09, con sai 9/28 câu.')).toBe('Bài A ngày 08/09, em sai 9/28 câu.')
    // "của con" LUÔN đổi — đó là vế đối xứng của `doiXung` chiều xuôi
    // (`của em` → `của con`). Hai câu dưới phải ra cùng một kiểu.
    expect(doiXungVeEm('Đây là bài của con.')).toBe('Đây là bài của em.')
    expect(doiXungVeEm('Kết quả của con tốt.')).toBe('Kết quả của em tốt.')
  })

  it('chuỗi rỗng hoặc null không làm sập', () => {
    expect(doiXungVeEm('')).toBe('')
    expect(doiXungVeEm(null as unknown as string)).toBe('')
  })
})

describe('PhieuV3 áp phép đổi ĐÚNG CHỖ', () => {
  it('khối Việc cần làm đổi xưng hô khi là báo cáo của em', () => {
    expect(V3).toContain('laCuaEm ? doiXungVeEm(du.vieCanLam) : du.vieCanLam')
  })

  it('KHÔNG in thẳng du.vieCanLam nữa', () => {
    expect(V3).not.toContain('>{du.vieCanLam.trim()}</div>')
  })
})
