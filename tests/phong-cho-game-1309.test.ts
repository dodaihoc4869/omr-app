import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Phòng chờ thi · Bắn nguyên tố', () => {
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

  it('Phòng chờ giữ thông báo và nối mini-game cục bộ đã duyệt', () => {
    expect(tepPhongCho).toContain('Đang chờ Thầy bấm bắt đầu')
    expect(tepPhongCho).toContain('Điểm chơi chỉ để vui trong lúc chờ.')
    expect(tepPhongCho).toContain('<BanNguyenTo')
    expect(tepPhongCho).toContain('loiCho')

  })
})
