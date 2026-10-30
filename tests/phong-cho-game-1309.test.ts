import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Phòng chờ thi · Đấu Nguyên Tử (thay Bắn nguyên tố 30/10)', () => {
  const tepExamTake = readFileSync(resolve(__dirname, '../src/screens/ExamTakeScreen.tsx'), 'utf8')
  const tepPhongCho = readFileSync(resolve(__dirname, '../src/components/PhongChoGame.tsx'), 'utf8')

  it('ExamTakeScreen tại phase === "cho" giữ nguyên câu bắt buộc và không chứa button trực tiếp', () => {
    const than = tepExamTake.slice(
      tepExamTake.indexOf("if (phase === 'cho') {"),
      tepExamTake.indexOf("if (phase === 'loading') {")
    )
    expect(than).toContain('Đang chờ Thầy bấm bắt đầu')
    expect(than).not.toContain('<NutChinh')
    expect(than).not.toContain('<button')
    expect(than).toContain('<PhongChoGame')
  })

  it('Phòng chờ giữ thông báo và nối game Đấu Nguyên Tử (nạp lười), truyền vé + cờ thầy bắt đầu', () => {
    expect(tepPhongCho).toContain('Đang chờ Thầy bấm bắt đầu')
    expect(tepPhongCho).toContain('Điểm chơi chỉ để vui trong lúc chờ.')
    expect(tepPhongCho).toContain("lazy(() => import('./phong-cho/DauIon'))")
    expect(tepPhongCho).toContain('<DauIon maCa={cho?.maCa} veDau={cho?.veDau} batDau={!!cho?.batDau} />')
    expect(tepPhongCho).toContain('loiCho')
    // Màn thi báo game dừng NGAY khi thấy thầy bắt đầu (trước khi vào bài).
    expect(tepExamTake).toMatch(/if \(tt\.batDau\) \{ setCho\(\(c\) => \(c && !c\.batDau \? \{ \.\.\.c, batDau: true \} : c\)\); void vaoSauBatDau\(\) \}/)

  })
})
