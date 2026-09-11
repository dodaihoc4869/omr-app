// MÁY HỌC SINH PHẢI BIẾT ĐỊA CHỈ MÁY CHỦ MỚI — phát hiện 16h40 ngày 11/09,
// giữa ca thật 237124.
//
// ====================================================================
// CHUYỆN THẬT, và nó phủ lên toàn bộ công việc của cả ngày
// ====================================================================
//
// Tra thẳng D1 lúc ca 237124 đang chạy:
//
//   ca có trên D1    : có
//   mốc bắt đầu      : 2026-09-11T09:10:24.283Z — ĐÃ sang máy chủ mới
//   trạng thái ca    : mo          phòng chờ : bật
//   lượt thi trên D1 : 0
//   em ở phòng chờ   : 0
//   báo trạng thái   : 0
//
// Phía thầy chạy đúng hoàn hảo. Phía học sinh BẰNG KHÔNG.
//
// NGUYÊN NHÂN GỐC: `MAC_DINH_MAY_CHU.BAT = false`, và chỗ DUY NHẤT ghi cấu hình
// là khối Cài đặt trong app quản lý của thầy — app mà học sinh không mở được.
// Nên với mọi máy của em, `vaoThiQuaMayChuMoi` dừng ngay dòng đầu:
//
//     const ch = await layCauHinhMayChu()
//     if (!ch.BAT) return null
//
// Toàn bộ phần tăng tốc chưa tới được học sinh một giây nào. Máy chủ mới tới
// lúc ấy chỉ phục vụ: lượt thầy đẩy ca, và các lượt đo tải của tôi.
//
// VÌ SAO KHÔNG THẤY SỚM: tôi đo bằng trang `/do-tai` do CHÍNH Worker phục vụ.
// Nó gọi thẳng Worker nên lúc nào cũng 0 lỗi — và che mất câu đáng lẽ phải hỏi
// từ sáng: *máy của em lấy địa chỉ máy chủ mới ở đâu ra?*
//
// LUẬT RÚT RA, ghi to: đo bằng công cụ chạy TRÊN máy chủ thì chỉ chứng minh máy
// chủ sống. Muốn biết NGƯỜI DÙNG có đi qua đó không thì phải đếm ở chỗ dữ liệu
// của người dùng đọng lại — bảng `luot` và `phong_cho`.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MCM = fs.readFileSync(path.join(process.cwd(), 'src/lib/may-chu-moi.ts'), 'utf8')
const DB = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-db.ts'), 'utf8')
const CFG = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/cau-hinh.json'), 'utf8')) as Record<string, string>

describe('ĐƯỜNG DẪN ĐỊA CHỈ TỚI MÁY EM', () => {
  it('`public/cau-hinh.json` mang địa chỉ máy chủ mới', () => {
    expect(typeof CFG.mayChuMoi).toBe('string')
    expect(CFG.mayChuMoi).toMatch(/^https:\/\//)
  })

  it('TUYỆT ĐỐI không có mã bí mật trong tệp ấy — lệnh của em vốn không đòi mã', () => {
    // Chỉ soi GIÁ TRỊ, bỏ qua các khoá `ghi_chu*`: chính lời ghi chú có nhắc
    // tên `MA_BI_MAT` để dặn người sau đừng đưa nó vào đây, và bắt cả lời dặn
    // ấy là bắt nhầm — phép kiểm đầu tiên tôi viết đã đỏ vì đúng lý do này.
    const giaTri = Object.entries(CFG)
      .filter(([k]) => !k.startsWith('ghi_chu'))
      .map(([, v]) => String(v))
      .join(' ')
      .toLowerCase()
    for (const xau of ['ma_bi_mat', 'mabimat', 'secret', 'x-ma-bi-mat']) {
      expect(giaTri, xau).not.toContain(xau)
    }
    // Và đúng hai khoá có giá trị: link Apps Script, địa chỉ Worker.
    expect(Object.keys(CFG).filter((k) => !k.startsWith('ghi_chu')).sort()).toEqual(['mayChuMoi', 'scriptUrl'])
  })

  it('chỉ nhận địa chỉ https, và cắt dấu gạch chéo thừa ở cuối', () => {
    expect(DB).toContain('export async function loadDiaChiMayChuMoiChoEm()')
    expect(DB).toContain("url.startsWith('https://') ? url.replace(/\\/+$/, '') : ''")
  })

  it('tệp hỏng hay mạng hỏng thì trả rỗng, KHÔNG nổ giữa lúc em vào thi', () => {
    const i = DB.indexOf('export async function loadDiaChiMayChuMoiChoEm()')
    expect(DB.slice(i, i + 700)).toMatch(/\} catch \{\s*\n\s*return ''\s*\n\s*\}/)
  })
})

describe('LUẬT CỦA `layCauHinhChoEm`', () => {
  const HAM = MCM.slice(MCM.indexOf('export async function layCauHinhChoEm()'), MCM.indexOf('export async function layCauHinhChoEm()') + 900)

  it('máy thầy đã bật ⇒ dùng nguyên cấu hình của thầy', () => {
    expect(HAM).toContain('if (ch.BAT && ch.URL) return ch')
  })

  it('máy thầy CHỦ Ý TẮT ⇒ tôn trọng, KHÔNG lén bật lại bằng đường tệp', () => {
    expect(HAM).toContain('if (ch.URL) return ch')
    // và vế ấy phải đứng TRƯỚC lượt đọc tệp
    expect(HAM.indexOf('if (ch.URL) return ch')).toBeLessThan(HAM.indexOf('loadDiaChiMayChuMoiChoEm()'))
  })

  it('máy chưa có cấu hình ⇒ đọc tệp, và CẤT LẠI để lần sau offline vẫn có', () => {
    expect(HAM).toContain('const url = await loadDiaChiMayChuMoiChoEm()')
    expect(HAM).toContain('if (!url) return ch')
    expect(HAM).toContain('await saveCauHinhMayChu(moi)')
  })

  it('đi qua `chuanHoaMayChu`, không tự chế cấu hình', () => {
    expect(HAM).toContain('chuanHoaMayChu({ ...ch, BAT: true, URL: url })')
  })
})

describe('ĐÚNG NHỮNG LỆNH CỦA EM MỚI DÙNG ĐƯỜNG NÀY', () => {
  const CUA_EM: [string, string][] = [
    ['vaoThiQuaMayChuMoi', 'vaoThiMoi(ch, maCa, sbd, idThietBi, canBank)'],
    ['trangThaiPhongCho', 'phongChoMoi(chMoi, maCa)'],
    ['submitAnswers', 'nopMoi(chMoi, maCa, sbd, dapAn, integrity, giayCau)'],
    ['luuTam', 'luuTamMoi(chMoi, maCa, sbd, dapAn, giayCau)'],
    ['pushExamStatus', 'trangThaiMoi(chMoi, status)'],
    ['layPhieu', 'layPhieuMoi(chMoi, ma)'],
  ]

  for (const [ten, moc] of CUA_EM) {
    it(`${ten} dùng layCauHinhChoEm`, () => {
      const i = API.indexOf(moc)
      expect(i, moc).toBeGreaterThan(0)
      const truoc = API.slice(Math.max(0, i - 260), i)
      expect(truoc).toContain('layCauHinhChoEm()')
    })
  }

  it('LỆNH CỦA THẦY vẫn dùng cờ của thầy — cờ tắt khẩn phải còn nguyên tác dụng', () => {
    for (const moc of ['dayCaMoi(chMoi, secret, {', 'dayDanhSachMoi(chMoi, secret, items)', 'dayPhieuMoi(chMoi, secret,']) {
      const i = API.indexOf(moc)
      expect(i, moc).toBeGreaterThan(0)
      const truoc = API.slice(Math.max(0, i - 400), i)
      expect(truoc, moc).toContain('layCauHinhMayChu()')
    }
  })
})

describe('ĐƯỜNG LÙI KHÔNG ĐƯỢC MẤT', () => {
  it('máy em nhận được địa chỉ nhưng Worker hỏng thì VẪN rơi về Apps Script', () => {
    // `vaoThiMoi` trả null khi hỏng, và chỗ gọi phải đi tiếp xuống đường cũ.
    const i = API.indexOf('const r = await vaoThiMoi(ch, maCa, sbd, idThietBi, canBank)')
    expect(API.slice(i, i + 120)).toContain('if (!r) return null')
  })

  it('cờ LUI_VE_APPS_SCRIPT vẫn mặc định bật', () => {
    const CH = fs.readFileSync(path.join(process.cwd(), 'src/lib/cau-hinh-may-chu.ts'), 'utf8')
    expect(CH).toContain('LUI_VE_APPS_SCRIPT: true')
  })
})
