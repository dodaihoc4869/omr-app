// ĐƯỜNG NHANH PHẢI THẬT SỰ CHẠY — hai cửa khoá chết nó, tìm ra 19h45 ngày 11/09.
//
// Tra D1 sau khi đã phát hành cả đợt 5D lẫn 5E:
//
//     SELECT COUNT(tong), COUNT(ho_ten) FROM luot  →  311 lượt, 0 điểm, 0 tên
//     SELECT SUM(sinh_tai_d1) FROM ca              →  1 / 89 ca
//
// Tức việc tự chữa lành chưa chạy một lần nào. Hai nguyên nhân, độc lập nhau:
//
// ① CỬA `xinKeyBank`. Màn Chi tiết ca gọi `chiTietCa(..., !banksCu)`. Điện thoại
//    thầy không có sẵn ngân hàng đáp án của ca cũ ⇒ cờ ấy LUÔN bật ⇒ đường
//    nhanh nằm sau `if (!xinKeyBank)` bị bỏ qua VĨNH VIỄN trên điện thoại.
//
// ② CỬA `trang_thai = 'mo'`. Chặn chữa lành ca đang mở là đúng, nhưng kho của
//    thầy có 12 ca vẫn mang nhãn `mo` từ mấy hôm trước, chưa bao giờ đóng.
//    Chúng không chạy, nhãn thì vẫn `mo` ⇒ không bao giờ được chữa lành.
//
// Cộng lại đúng thứ thầy thấy: bấm chi tiết ca lần hai vẫn 7 giây.
//
// BÀI HỌC, lần thứ tư trong ngày: **đường nhanh có mặt trong mã không có nghĩa
// là nó chạy.** Chỉ có đếm ở chỗ dữ liệu đọng lại mới biết.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const WK = fs.readFileSync(path.join(process.cwd(), 'server/src/index.ts'), 'utf8')
const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const DAY = fs.readFileSync(path.join(process.cwd(), 'src/lib/day-ca-may-chu-moi.ts'), 'utf8')

describe('① CỬA xinKeyBank — mở ra bằng cách cất luôn ngân hàng', () => {
  const HAM = API.slice(API.indexOf('export async function chiTietCa('), API.indexOf("action: 'chiTietCa'"))

  it('đường nhanh KHÔNG còn nằm sau `if (!xinKeyBank)`', () => {
    expect(HAM).not.toContain('if (!xinKeyBank) {')
    expect(HAM).toContain('const nhanh = await chiTietCaMoi(chMoi, secret, maCa)')
  })

  it('chỉ lùi khi thật sự CHƯA có ngân hàng, không lùi theo cờ', () => {
    expect(HAM).toContain('if (nhanh && (!xinKeyBank || nhanh.keyBank)) return doiChiTietCaMoi(nhanh)')
  })

  it('gói dịch trả ngân hàng THẬT, không còn trả null cứng', () => {
    const d = API.slice(API.indexOf('function doiChiTietCaMoi('), API.indexOf('function doiChiTietCaMoi(') + 1400)
    expect(d).toContain('keyBank: (j.keyBank as KeyBank | null) ?? null')
    expect(d).not.toContain('keyBank: null,')
  })

  it('lượt chữa lành gửi kèm ngân hàng vừa đọc được từ Apps Script', () => {
    expect(API).toContain('(r.keyBank as KeyBank) ?? undefined')
    expect(DAY).toContain('keyBank ? { maCa, luot, keyBank } : { maCa, luot }')
  })

  it('KHOÁ RIÊNG — không dùng chung với gói đề công khai của học sinh', () => {
    // `de/<maCa>.json` phục vụ ở `GET /de/:maCa` công khai và TUYỆT ĐỐI không
    // được có đáp án. Ngân hàng có đáp án đi khoá khác.
    expect(WK).toContain('`key/${maCa}.json`')
    const layDe = WK.slice(WK.indexOf('async function layDe('), WK.indexOf('async function layDe(') + 600)
    expect(layDe).not.toContain('key/')
  })

  it('đường trả ngân hàng nằm trong khối ĐÒI mã bí mật', () => {
    expect(WK.indexOf("p === '/ca/chi-tiet'")).toBeGreaterThan(WK.indexOf('if (!laThay(req, env, b))'))
  })
})

describe('② CỬA ca đang mở — tính bằng ĐỒNG HỒ, không tin cái nhãn', () => {
  const HAM = WK.slice(WK.indexOf('function caDangChay('), WK.indexOf('function caDangChay(') + 700)

  it('nhãn khác `mo` thì chắc chắn đã xong', () => {
    expect(HAM).toContain("if (String(ca.trang_thai) !== 'mo') return false")
  })

  it('mở mà CHƯA bấm Bắt đầu ⇒ vẫn coi là đang chạy, đừng đụng vào', () => {
    expect(HAM).toContain('if (!bd) return true')
  })

  it('đã bấm Bắt đầu ⇒ hết giờ cộng thêm khoảng đệm là xong', () => {
    expect(HAM).toContain('Date.now() < bd + (phut + DEM_SAU_CA_PHUT) * 60000')
    expect(WK).toContain('const DEM_SAU_CA_PHUT = 30')
  })

  it('lượt chữa lành dùng đúng hàm ấy, không so nhãn nữa', () => {
    const nap = WK.slice(WK.indexOf('async function napDayDuCa('), WK.indexOf('async function napDayDuCa(') + 900)
    expect(nap).toContain('if (caDangChay(ca))')
    expect(nap).toContain("lyDo: 'ca_dang_chay'")
    expect(nap).not.toContain("=== 'mo'")
  })
})
