// KHÔNG NUỐT LỖI XIN MÃ BÀI TẬP.
//
// Tối 09/09 thầy báo BA LẦN cùng một triệu chứng: "rút đề tạo khắc phục nhưng
// bấm chọn đáp án không được", "vẫn ko hiện nút nộp và không bấm được đáp án".
// Mỗi lần tôi phải SUY ĐOÁN vì máy không nói gì, và bốn giả thuyết liên tiếp
// đều chết khi đối chiếu dữ liệu máy chủ:
//
//   1. "phiếu đề chỉ giấu đáp án bằng CSS"  → sai, `boLoiGiai` xoá hẳn `dapAn`
//   2. "sai ở đường link `?vai=phieu`"      → sai, ảnh chỉ ra đường trong app
//   3. "cổng thiết bị chặn máy của thầy"    → sai, thầy xác nhận quay trên máy em
//   4. "cổng thiết bị hỏng / lượt thiếu id" → sai, đọc `LuotThi`: ca 335663 có
//                                             41/41 lượt qua đủ cổng, id không rỗng
//
// Thứ đáng lẽ trả lời ngay từ lần đầu là LỜI MÁY CHỦ, và nó đã bị ném đi bởi
// đúng một dòng:
//
//     link = (await xinLink().catch(() => '')) || ''
//
// `catch` trần đó biến mọi nguyên nhân khác nhau — máy chủ từ chối, hết giờ
// chờ, mất mạng, HTTP 500 — thành cùng một chuỗi rỗng. Vi phạm thẳng nguyên
// tắc vàng "không lặng lẽ sai".
//
// Nay lời máy chủ được giữ nguyên văn và ghép vào dòng nhắc đầu phiếu, nên một
// cú bấm của bất kỳ em nào cũng chỉ đúng thủ phạm.
//
// VẪN KHÔNG ĐƯỢC NÉM RA NGOÀI: xin hỏng thì phiếu vẫn phải mở được để em làm
// ra giấy. Bắt lỗi để ĐỌC, không phải để chặn.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const KHOI = fs.readFileSync(path.join(process.cwd(), 'src/components/KhoiBaiLuyen.tsx'), 'utf8')

/** Thân hàm `tai()` — chỗ duy nhất xin mã rồi dựng phiếu. */
const THAN_TAI = KHOI.slice(KHOI.indexOf('const tai = async () => {'), KHOI.indexOf('return (\n    <div style={{ marginTop: 14 }}>'))

describe('lỗi xin mã phải được GIỮ, không bị nuốt', () => {
  it('không còn `catch` trần ném lỗi đi', () => {
    expect(THAN_TAI).not.toContain("xinLink().catch(() => '')")
  })

  it('lời lỗi được đọc ra biến, có đường lùi khi không phải Error', () => {
    expect(THAN_TAI).toContain('let loiXin = ')
    expect(THAN_TAI).toContain('loiXin = e instanceof Error ? e.message : String(e ?? \'\')')
  })

  it('XIN HỎNG VẪN MỞ ĐƯỢC PHIẾU — bắt lỗi để ĐỌC, không phải để chặn', () => {
    // Nhánh catch vẫn trả chuỗi rỗng, không `throw` lại.
    const dau = THAN_TAI.indexOf('await xinLink().catch(')
    expect(dau).toBeGreaterThan(0)
    const than = THAN_TAI.slice(dau, dau + 220)
    expect(than).toContain("return ''")
    expect(than).not.toContain('throw')
  })

  it('lời máy chủ được ghép vào dòng nhắc đầu phiếu', () => {
    expect(THAN_TAI).toContain('const nhacDayDu = nhacTrongPhieu && loiXin ? `${nhacTrongPhieu} (máy chủ báo: ${loiXin})` : nhacTrongPhieu')
  })

  it('phiếu dựng bằng `nhacDayDu`, không phải bản chưa có lời máy chủ', () => {
    expect(THAN_TAI).toContain('chiDeChoEm ? { anGiai: true, loiNhac: nhacDayDu } : { nop }')
    expect(THAN_TAI).not.toContain('loiNhac: nhacTrongPhieu }')
  })

  it('KHÔNG ghép lời máy chủ khi phiếu nộp được — không doạ vô cớ', () => {
    // `nhacTrongPhieu` rỗng khi không phải phiếu chỉ đề, nên `nhacDayDu` rỗng theo.
    const dau = THAN_TAI.indexOf('const nhacDayDu =')
    const dong = THAN_TAI.slice(dau, THAN_TAI.indexOf('\n', dau))
    expect(dong).toContain('nhacTrongPhieu && loiXin')
  })
})

describe('nguồn lỗi thật sự có chữ để đọc', () => {
  it('`ghiPhieuKhacPhuc` ném lỗi mang lời máy chủ, không nuốt', async () => {
    const api = fs.readFileSync(path.join(process.cwd(), 'src/lib/exam-api.ts'), 'utf8')
    expect(api).toContain("if (!r.ok) throw new Error(r.error || 'Không ghi được phiếu khắc phục')")
  })

  it('máy chủ có câu từ chối riêng cho lệnh này — đọc lên là biết đúng cổng nào', () => {
    const gs = fs.readFileSync(path.join(process.cwd(), 'docs/apps-script-kiem-tra.gs'), 'utf8')
    expect(gs).toContain("const LOI_GP = { ok: false, error: 'Không ghi được phiếu khắc phục' }")
  })
})
