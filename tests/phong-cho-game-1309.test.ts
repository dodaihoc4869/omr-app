import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Phòng chờ thi Free Fire X Google Mini-Game', () => {
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

  it('PhongChoGame chứa hoạt ảnh nhảy dù phong cách Free Fire 4 màu Google và mini-game nguyên tử', () => {
    expect(tepPhongCho).toContain('PHÒNG CHỜ THI TRỰC TUYẾN')
    expect(tepPhongCho).toContain('Cao độ:')
    expect(tepPhongCho).toContain('Điểm nguyên tử:')
    expect(tepPhongCho).toContain('KHO_NGUYEN_TU')
    expect(tepPhongCho).toContain('canvas')
  })
})
