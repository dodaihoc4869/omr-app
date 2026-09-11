// CẢ LỚP ĐỨNG CHỜ VĨNH VIỄN — cú treo im lặng cuối cùng, bịt trước ca 18h 11/09.
//
// ĐƯỜNG ĐI CỦA LỖI, cả bốn bước đều "chạy đúng" theo mã của chính nó:
//
//   ① `batDauThi` gọi Apps Script → ca ĐÃ bắt đầu. Thầy nhìn màn Theo dõi thấy
//      "đã bắt đầu", không có gì bất thường.
//   ② Lượt đẩy mốc bắt đầu sang máy chủ mới nằm trong `try {} catch {}` KHÔNG
//      đọc kết quả. Chập mạng một nhịp là trượt, không ai biết.
//   ③ D1 còn `bat_dau_thi_luc` rỗng ⇒ `/phong-cho` trả `batDau: false`.
//   ④ `trangThaiPhongCho` thấy máy chủ mới TRẢ LỜI ĐƯỢC nên tin luôn và không
//      hỏi Apps Script nữa.
//
// Cả lớp đứng trong phòng chờ, không hết. Không một dòng lỗi ở cả hai phía.
//
// Sửa KHÔNG phải bằng cách bỏ máy chủ mới khỏi phòng chờ — làm thế là trả lại
// đúng nhịp 3 giây nện Apps Script mà đợt 3 vừa gỡ. Sửa bằng ba vế dưới đây.
import { beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  NHIP_DOI_CHIEU_MS,
  daBatDauTheoDuongCu,
  ghiNhoDaBatDauDuongCu,
  nenDoiChieu,
  quenDoiChieu,
} from '../src/lib/doi-chieu-phong-cho'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamMonitorScreen.tsx'), 'utf8')

beforeEach(() => quenDoiChieu())

describe('VẾ 1 — "chưa bắt đầu" chỉ được tin trong MỘT NHỊP', () => {
  it('lần thấy đầu tiên KHÔNG hỏi lại: câu trả lời của máy chủ mới còn mới', () => {
    expect(nenDoiChieu('CA1', 1_000_000)).toBe(false)
  })

  it('trong nhịp thì vẫn không hỏi — không nện Apps Script mỗi 3 giây', () => {
    nenDoiChieu('CA1', 1_000_000)
    expect(nenDoiChieu('CA1', 1_000_000 + 3_000)).toBe(false)
    expect(nenDoiChieu('CA1', 1_000_000 + 14_999)).toBe(false)
  })

  it('quá nhịp thì HỎI — đây là chỗ cắt cú treo', () => {
    nenDoiChieu('CA1', 1_000_000)
    expect(nenDoiChieu('CA1', 1_000_000 + NHIP_DOI_CHIEU_MS)).toBe(true)
  })

  it('hỏi xong thì đếm lại từ đầu, không hỏi dồn', () => {
    // Mốc tính THEO `NHIP_DOI_CHIEU_MS`, không gõ cứng con số — nhịp đổi thì
    // phép kiểm đi theo, còn LUẬT thì không đổi.
    nenDoiChieu('CA1', 1_000_000)
    expect(nenDoiChieu('CA1', 1_000_000 + NHIP_DOI_CHIEU_MS + 1_000)).toBe(true)
    expect(nenDoiChieu('CA1', 1_000_000 + NHIP_DOI_CHIEU_MS + 2_000)).toBe(false)
  })

  it('mỗi ca đếm riêng', () => {
    nenDoiChieu('CA1', 1_000_000)
    // CA2 lần đầu ⇒ chỉ ghi mốc
    expect(nenDoiChieu('CA2', 1_000_000 + NHIP_DOI_CHIEU_MS + 5_000)).toBe(false)
    expect(nenDoiChieu('CA1', 1_000_000 + NHIP_DOI_CHIEU_MS + 5_000)).toBe(true)
  })

  it('mã ca rỗng thì thôi, không nổ', () => {
    expect(nenDoiChieu('', 1_000_000)).toBe(false)
  })

  it('NHỊP LÀ 90 GIÂY — giãn ra sau khi đo Apps Script 10,2 giây một lượt', () => {
    // Đặt 15 giây lúc sáng 11/09. Đo lúc 20h05, đúng lúc thầy hỏi "40 em vào
    // phòng chờ có quá tải không": `trangThaiPhongCho` bên Apps Script mất
    // **10 185 ms** một lượt (chiều cùng ngày là 2,6 giây). 40 em × nhịp 15
    // giây = 2,7 lượt/giây đổ vào cửa ấy — đúng công thức của cú treo hàng loạt
    // mà chốt này sinh ra để chặn.
    //
    // 90 giây ⇒ 40 em còn 0,44 lượt/giây. Đổi lại: trường hợp xấu nhất em chờ
    // thêm 90 giây thay vì 15. Chấp nhận được, vì máy thầy nay thử lại lượt đẩy
    // mốc 3 lần (`dayMocBatDauMoi`) nên trường hợp ấy hiếm hẳn đi.
    expect(NHIP_DOI_CHIEU_MS).toBe(90000)
    // 40 em chia cho nhịp: phải dưới 0,5 lượt mỗi giây.
    expect(40 / (NHIP_DOI_CHIEU_MS / 1000)).toBeLessThan(0.5)
  })

  it('máy thầy THỬ LẠI lượt đẩy mốc — chữa ở một máy, không chữa ở bốn mươi máy', () => {
    const DAY = fs.readFileSync(path.join(process.cwd(), 'src/lib/day-ca-may-chu-moi.ts'), 'utf8')
    const han = DAY.slice(DAY.indexOf('export async function dayMocBatDauMoi('), DAY.indexOf('export async function dayMocBatDauMoi(') + 1600)
    expect(han).toContain('for (let i = 0; i < Math.max(1, soLan); i++)')
    expect(han).toContain('if (xong) return true')
  })
})

describe('VẾ 2 — nhớ rằng đường cũ đã xác nhận', () => {
  it('chưa ghi thì chưa nhớ', () => {
    expect(daBatDauTheoDuongCu('CA1')).toBe(false)
  })

  it('ghi rồi thì nhớ, và chỉ nhớ đúng ca ấy', () => {
    ghiNhoDaBatDauDuongCu('CA1')
    expect(daBatDauTheoDuongCu('CA1')).toBe(true)
    expect(daBatDauTheoDuongCu('CA2')).toBe(false)
  })

  it('dọn được từng ca một', () => {
    ghiNhoDaBatDauDuongCu('CA1')
    ghiNhoDaBatDauDuongCu('CA2')
    quenDoiChieu('CA1')
    expect(daBatDauTheoDuongCu('CA1')).toBe(false)
    expect(daBatDauTheoDuongCu('CA2')).toBe(true)
  })
})

describe('VẾ 3 — nối đúng vào đường đi thật', () => {
  it('phòng chờ: "ĐÃ bắt đầu" tin ngay, không tốn thêm lượt gọi nào', () => {
    expect(API).toContain('if (rMoi?.batDau) return rMoi')
  })

  it('phòng chờ: "CHƯA bắt đầu" mới phải qua cửa đối chiếu', () => {
    expect(API).toContain('if (rMoi && !nenDoiChieu(maCa)) return rMoi')
    // và hai dòng ấy phải đứng ĐÚNG THỨ TỰ này, nếu không thì "đã bắt đầu"
    // cũng bị giữ lại chờ đối chiếu.
    expect(API.indexOf('if (rMoi?.batDau) return rMoi')).toBeLessThan(
      API.indexOf('if (rMoi && !nenDoiChieu(maCa)) return rMoi'),
    )
  })

  it('đường cũ bảo đã bắt đầu ⇒ GHI NHỚ', () => {
    expect(API).toContain('if (r.batDau === true) ghiNhoDaBatDauDuongCu(maCa)')
  })

  it('VÀO THI: nhớ rồi thì KHÔNG trả dáng "cho" nữa — chỗ này mới thật sự cắt vòng treo', () => {
    const i = API.indexOf("if ((r.cach as string) === 'cho') {")
    expect(i).toBeGreaterThan(0)
    const than = API.slice(i, i + 400)
    expect(than).toContain('if (daBatDauTheoDuongCu(maCa)) return null')
    // phải đứng TRƯỚC câu return dáng chờ
    expect(than.indexOf('daBatDauTheoDuongCu')).toBeLessThan(than.indexOf('cach: \x27cho\x27'))
  })
})

describe('VẾ 4 — thầy phải biết ngay lúc bấm Bắt đầu', () => {
  it('`batDauThi` ĐỌC kết quả đẩy, không gọi suông', () => {
    expect(API).toContain('chuaSangMayChuMoi = !xong')
    // 11/09 tối: lượt đẩy này đổi sang `dayMocBatDauMoi` — đẩy đầy đủ ở đây ghi
    // đè tên ca, lớp, hạn vào phòng bằng rỗng (ca thật 704066). Luật cũ giữ
    // nguyên: phải ĐỌC kết quả, không gọi suông.
    expect(API).toContain('const xong = await dayMocBatDauMoi(')
  })

  it('lỗi ném ra cũng tính là chưa sang', () => {
    const i = API.indexOf('let chuaSangMayChuMoi = false')
    expect(i).toBeGreaterThan(0)
    expect(API.slice(i, i + 900)).toMatch(/\} catch \{\s*\n\s*chuaSangMayChuMoi = true\s*\n\s*\}/)
  })

  it('cờ TẮT thì KHÔNG kêu hỏng — tắt là thầy chủ ý tắt', () => {
    const i = API.indexOf('let chuaSangMayChuMoi = false')
    expect(API.slice(i, i + 400)).toContain('if (chMoi.BAT && chMoi.URL) {')
  })

  it('màn Theo dõi hét lên bằng toast ĐỎ', () => {
    expect(MAN).toContain('Mốc bắt đầu CHƯA sang máy chủ mới')
    const i = MAN.indexOf('Mốc bắt đầu CHƯA sang máy chủ mới')
    expect(MAN.slice(i, i + 200)).toContain("'error'")
  })
})
