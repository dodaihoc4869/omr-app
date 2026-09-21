// DỌN DƯ THỪA G5 (Boss soát): câu báo lỗi "chưa có địa chỉ máy chủ / mã bí mật" phải chỉ ĐÚNG chỗ nhập — sau G4 đó là CÀI ĐẶT → Kết nối máy chủ,
// không còn "Ngân hàng câu hỏi → Cấu hình" (thanh bên ghi "Ngân hàng đề", và khối Cấu hình đã dời đi).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
const CHO_BAO_LOI = [
  ['src/screens/HocSinhScreen.tsx', 2],
  ['src/screens/LichSuCaScreen.tsx', 2],
  ['src/screens/ExamMonitorScreen.tsx', 2],
  ['src/screens/CauHoiScreen.tsx', 1],
  ['src/components/NutDongBoMoiCa.tsx', 2],
  ['src/lib/exam-api.ts', 1],
] as const

describe('G5 · câu báo lỗi chỉ đường sang Cài đặt → Kết nối máy chủ', () => {
  it.each(CHO_BAO_LOI)('%s: không còn "Ngân hàng câu hỏi → Cấu hình", có đúng %i câu chỉ tới Cài đặt', (f, n) => {
    const t = doc(f)
    expect(t).not.toContain('Ngân hàng câu hỏi → Cấu hình')
    expect(t.split('Cài đặt → Kết nối máy chủ').length - 1).toBe(n)
  })

  it('nơi được chỉ tới CÓ THẬT: Cài đặt có mục "Kết nối máy chủ" (địa chỉ + mã bí mật)', () => {
    expect(doc('src/screens/CaiDatScreen.tsx')).toContain('>Kết nối máy chủ</h2>')
    expect(doc('src/components/KhoiKetNoiKhoDe.tsx')).toContain('aria-label="Địa chỉ máy chủ"')
    expect(doc('src/components/ThanhBenTrai.tsx')).toContain("id: 'caidat'")
  })

  it('chữ lỗi nói việc cần làm: câu "Chưa cấu hình địa chỉ / Chưa nhập mã bí mật" luôn đi kèm đường tới Cài đặt (không câu nào cụt)', () => {
    for (const [f] of CHO_BAO_LOI) {
      for (const dong of doc(f).split('\n')) {
        if (/'Chưa cấu hình địa chỉ máy chủ|'Chưa nhập mã bí mật/.test(dong)) expect(dong, f).toContain('Cài đặt → Kết nối máy chủ')
      }
    }
  })
})
