// MỞ CA — TỪ 12/09 KHÔNG CÒN GOOGLE SHEET TRONG ĐƯỜNG ĐI.
//
// Lịch sử của tệp này: 11/09 mở một ca ghi HAI nơi — D1 (1,15 giây, đo ở ca
// thật 112480) và Apps Script ghi gói đề vào bảng `CaKiemTra` (phần thầy ngồi
// chờ). Đợt 5D cho hai lượt chạy song song rồi trả lời ngay khi D1 xong, và giữ
// một sổ theo dõi `ghi-sheet-nen.ts` để ca chưa lên Sheet không trôi đi im lặng.
//
// 12/09 rạng sáng thầy chốt: "không ghi điểm vào google sheet nữa" · "gỡ sạch
// google". Nên lượt ghi Sheet bị gỡ HẲN, cùng với sổ theo dõi và dòng báo của
// nó — giữ lại là để một nhánh mã không bao giờ chạy nhưng vẫn đọc như thật.
//
// HAI CHỐT CHẶN MỚI, và tệp này tồn tại vì chúng:
//   ① mở ca chỉ còn MỘT đích. Đẩy hỏng thì BÁO ĐỎ ngay, không có đường lùi nào
//     nuốt lỗi — trả lời "đã mở" khi ca không nằm ở đâu cả là thứ tệ nhất.
//   ② không còn một dòng nào trong màn mở ca nhắc tới Google Sheet.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamSetupScreen.tsx'), 'utf8')
const HAM = API.slice(API.indexOf('export async function publishSession('), API.indexOf('export async function capNhatKeyBank('))

describe('MỞ CA CHỈ CÒN MỘT ĐÍCH', () => {
  it('không còn lượt ghi Google Sheet nào trong hàm mở ca', () => {
    expect(HAM).not.toContain('theoGhiSheet')
    expect(HAM).not.toContain('ghiSheet')
    expect(HAM).not.toContain("action: 'publish'")
  })

  it('vẫn chờ máy chủ mới nhận ca rồi mới trả lời', () => {
    expect(HAM).toContain('daLenMayChuMoi = await dayMayChuMoi')
  })

  it('CHỐT ① — đẩy hỏng thì NÉM LỖI, không âm thầm báo đã mở', () => {
    const i = HAM.indexOf('if (!daLenMayChuMoi)')
    expect(i).toBeGreaterThan(0)
    expect(HAM.slice(i, i + 200)).toContain('throw new Error')
    // Lỗi ném ra từ lượt đẩy cũng phải nổi lên, không bị nuốt thành `false`.
    expect(HAM).not.toMatch(/catch \{\s*\n\s*daLenMayChuMoi = false\s*\n\s*\}/)
  })

  it('cờ TẮT trả về false chứ không ném — tắt là thầy chủ ý tắt', () => {
    expect(HAM).toContain('if (!chMoi.BAT || !chMoi.URL) return false')
  })

  it('BỐN CỜ TỪNG CHỈ SỐNG BÊN SHEET nay đi cùng ca', () => {
    // Quên chúng là mất cổng chặn phạm vi, mất chế độ đề riêng, mất cờ gọi lên
    // bảng — loại hỏng chỉ lộ ra giữa ca thật.
    expect(HAM).toContain('phamVi: moc.phamVi')
    expect(HAM).toContain('lenBang: moc.lenBang !== false')
    expect(HAM).toContain('deRieng: moc.deRieng === true')
    expect(HAM).toContain('phamViHoiLai:')
    expect(HAM).toContain('danhSachMoi:')
  })
})

describe('CHỐT ② — màn mở ca không còn nhắc Google Sheet', () => {
  it('sổ theo dõi ghi Sheet đã bị gỡ khỏi mã nguồn', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/lib/ghi-sheet-nen.ts'))).toBe(false)
  })

  it('màn mở ca không còn dòng báo "đang ghi lên Google Sheet"', () => {
    expect(MAN).not.toContain('DongGhiSheet')
    expect(MAN).not.toContain('ghi-sheet-nen')
    // Hai chú thích còn nhắc tên Sheet là nói về NGUỒN danh sách lớp thầy tự
    // nạp — không phải đường chạy của app. Thứ phải biến mất là dòng báo trạng
    // thái ghi Sheet.
    expect(MAN).not.toContain('Đang ghi nốt lên Google Sheet')
    expect(MAN).not.toContain('CHƯA lên Google Sheet')
  })
})
