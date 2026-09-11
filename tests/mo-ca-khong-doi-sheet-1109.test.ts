// MỞ CA KHÔNG ĐỢI GOOGLE SHEET — đo ca thật 112480, 19h07 ngày 11/09.
//
//     bat_dau       12:07:06.336Z
//     cap_nhat_luc  12:07:07.482Z   ← máy chủ mới đã có ca
//
// Máy chủ mới nhận ca sau **1,15 giây**. Toàn bộ phần thầy ngồi chờ còn lại là
// Apps Script ghi gói đề vào bảng `CaKiemTra`. Chạy song song (đợt 5D) cắt được
// phần D1 nhưng không cắt được phần ấy — thầy vẫn kêu "mở rất chậm".
//
// Nay trả lời NGAY khi D1 và R2 có ca. Cơ sở: ca 704066 tối nay chứng minh mọi
// lượt của em đọng ở D1, không dòng nào cần Sheet để vào thi.
//
// HAI CHỐT CHẶN, và tệp này tồn tại vì chúng:
//   ① cờ TẮT hay đẩy HỎNG ⇒ quay về luật cũ, ĐỢI Sheet. Trả lời "đã mở" khi ca
//     không nằm ở đâu cả là thứ tệ nhất có thể làm ở màn này.
//   ② ca chưa lên Sheet phải HIỆN RA kèm nút thử lại. Đổi tốc độ lấy một lỗi
//     thầm lặng là đổi hỏng: thiếu ca trên Sheet là thiếu điểm và thiếu tin Zalo.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const API = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
const NEN = fs.readFileSync(path.join(process.cwd(), 'src/lib/ghi-sheet-nen.ts'), 'utf8')
const MAN = fs.readFileSync(path.join(process.cwd(), 'src/screens/ExamSetupScreen.tsx'), 'utf8')
const HAM = API.slice(API.indexOf('export async function publishSession('), API.indexOf('export async function capNhatKeyBank('))

describe('MỞ CA TRẢ LỜI NGAY KHI MÁY CHỦ MỚI CÓ CA', () => {
  it('chờ máy chủ mới, KHÔNG chờ lượt ghi Sheet', () => {
    expect(HAM).toContain('daLenMayChuMoi = await dayMayChuMoi')
    expect(HAM).toContain('theoGhiSheet(maCa, ghiSheet)')
    // `theoGhiSheet` bắn lượt ghi đi rồi trả về ngay — không `await ghiSheet()`
    // ở nhánh thành công.
    const nhanhOk = HAM.slice(HAM.indexOf('theoGhiSheet(maCa, ghiSheet)'))
    expect(nhanhOk).not.toContain('await ghiSheet()')
  })

  it('CHỐT ① — cờ tắt hoặc đẩy hỏng thì QUAY VỀ đợi Sheet', () => {
    expect(HAM).toContain('if (!daLenMayChuMoi) {')
    const nhanhLui = HAM.slice(HAM.indexOf('if (!daLenMayChuMoi) {'), HAM.indexOf('theoGhiSheet(maCa, ghiSheet)'))
    expect(nhanhLui).toContain('await ghiSheet()')
  })

  it('đẩy máy chủ mới ném lỗi cũng tính là CHƯA lên — không nuốt rồi đi tiếp', () => {
    expect(HAM).toMatch(/catch \{\s*\n\s*daLenMayChuMoi = false\s*\n\s*\}/)
  })

  it('cờ TẮT trả về false chứ không ném — tắt là thầy chủ ý tắt', () => {
    expect(HAM).toContain('if (!chMoi.BAT || !chMoi.URL) return false')
  })

  it('lượt ghi Sheet vẫn ném lỗi khi máy chủ từ chối — không coi là xong', () => {
    expect(HAM).toContain("if (!kq.ok) throw new Error(kq.error || 'Mở ca kiểm tra thất bại')")
  })
})

describe('CHỐT ② — ca chưa lên Sheet KHÔNG được im lặng', () => {
  it('giữ trạng thái từng ca và báo cho màn hình vẽ lại', () => {
    expect(NEN).toContain('export function ngheGhiSheet(')
    expect(NEN).toContain('export function trangThaiGhiSheet(')
    expect(NEN).toContain("export type TrangThaiSheet = 'dang_ghi' | 'xong' | 'hong'")
  })

  it('có đường hỏi MỌI ca chưa lên Sheet, để không ca nào trôi đi', () => {
    expect(NEN).toContain('export function caChuaLenSheet(')
  })

  it('nút Thử lại chạy ĐÚNG lượt ghi cũ, không dựng lại gói', () => {
    // Dựng lại gói là mở đường cho hai gói khác nhau cùng mang một mã ca.
    expect(NEN).toContain('thuLai: async () => {')
    expect(NEN).toContain('await chay_(maCa, chay)')
  })

  it('một người nghe hỏng không làm hỏng những người còn lại', () => {
    const bao = NEN.slice(NEN.indexOf('function bao()'), NEN.indexOf('function bao()') + 300)
    expect(bao).toContain('} catch {')
  })

  it('màn mở ca HIỆN dòng trạng thái ngay dưới mã ca', () => {
    expect(MAN).toContain('<DongGhiSheet maCa={opened.maCa} />')
    expect(MAN).toContain('CHƯA lên Google Sheet')
    expect(MAN).toContain('Thử lại')
  })

  it('ghi xong thì dòng ấy biến mất, không để lại rác trên màn', () => {
    const tp = MAN.slice(MAN.indexOf('function DongGhiSheet('))
    expect(tp).toContain("if (!d || d.trangThai === 'xong') return null")
  })
})
