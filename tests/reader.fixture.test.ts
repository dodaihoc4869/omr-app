import { describe, expect, it } from 'vitest'
import { readSheet } from '../src/engine/reader'
import { genAllBubbles, template } from '../src/engine/template'
import { generateSheet, bubbleIndex, type FillSpec } from './fixtures/generateSheet'

// Bộ ảnh test tổng hợp — mô phỏng Module 2+3 (mask 80–85%, T_min 0,35, R 2,2,
// hiệu chỉnh nền cục bộ) với các biến thể giảm sáng, bóng đổ, và ô tẩy mờ,
// theo đúng yêu cầu "không lặng lẽ sai" trong Định nghĩa hoàn thành.
// (Anchor + homography dùng OpenCV.js, không lặp lại unit test ở đây — xem
// ghi chú trong tests/fixtures/generateSheet.ts)

const CLEAR = 0.15 // gray ≈ 38, tô đậm rõ ràng
const RESIDUE = 0.75 // gray ≈ 191, vết tẩy mờ dưới ngưỡng T_min nhưng còn dư

const SBD = '000123'
const MADE = '101'
const PHAN_I = 'ABCDABCDABCDABCDAB'.split('') // 18 ký tự
const PHAN_II: string[] = ['DSDS', 'SDSD', 'DDSS', 'SSDD']
const PHAN_III = ['0,87', '1,25', '3,50', '-0,5', '2,00', '-1,2']

function buildCleanFills(): FillSpec[] {
  const fills: FillSpec[] = []
  SBD.split('').forEach((d, col) => fills.push({ bubbleId: `sbd.${col}.${d}`, darkFactor: CLEAR }))
  MADE.split('').forEach((d, col) => fills.push({ bubbleId: `made.${col}.${d}`, darkFactor: CLEAR }))
  PHAN_I.forEach((c, i) => fills.push({ bubbleId: `phanI.${i + 1}.${c}`, darkFactor: CLEAR }))
  PHAN_II.forEach((group, qi) =>
    group.split('').forEach((c, idea) => fills.push({ bubbleId: `phanII.${qi + 1}.${idea + 1}.${c}`, darkFactor: CLEAR })),
  )
  PHAN_III.forEach((val, qi) =>
    val.split('').forEach((c, col) => fills.push({ bubbleId: `phanIII.${qi + 1}.${col}.${c}`, darkFactor: CLEAR })),
  )
  return fills
}

const byId = bubbleIndex(genAllBubbles())

describe('readSheet — ca rõ, không biến thể', () => {
  it('đọc đúng 100% SBD, mã đề, cả ba phần', () => {
    const img = generateSheet(buildCleanFills(), byId)
    const sheet = readSheet(img)

    expect(sheet.sbd.value).toBe(SBD)
    expect(sheet.sbd.flag).toBeNull()
    expect(sheet.madeThi.value).toBe(MADE)

    sheet.phanI.forEach((a, i) => {
      expect(a.value).toBe(PHAN_I[i])
      expect(a.flag).toBeNull()
    })
    sheet.phanII.forEach((q, qi) => {
      q.forEach((a, idea) => {
        expect(a.value).toBe(PHAN_II[qi][idea])
        expect(a.flag).toBeNull()
      })
    })
    sheet.phanIII.forEach((a, i) => {
      expect(a.value).toBe(PHAN_III[i])
    })
  })
})

describe('readSheet — giảm sáng 40%', () => {
  it('vẫn đọc đúng nhờ hiệu chỉnh nền cục bộ tương đối, không dùng ngưỡng tuyệt đối', () => {
    const img = generateSheet(buildCleanFills(), byId, { brightnessScale: 0.6 })
    const sheet = readSheet(img)
    expect(sheet.sbd.value).toBe(SBD)
    sheet.phanI.forEach((a, i) => expect(a.value).toBe(PHAN_I[i]))
  })
})

describe('readSheet — bóng che nửa trái phiếu', () => {
  it('các câu Phần I nằm trong vùng bóng vẫn đọc đúng nhờ nền tham chiếu cục bộ', () => {
    const img = generateSheet(buildCleanFills(), byId, { shadowLeftDarken: 0.35 })
    const sheet = readSheet(img)
    // Phần I câu 1 nằm ở khối đầu tiên (blockOrigin x=18mm) — gần mép trái, chịu bóng nặng nhất.
    expect(sheet.phanI[0].value).toBe(PHAN_I[0])
    expect(sheet.phanI[0].flag).toBeNull()
  })
})

describe('readSheet — ô tẩy mờ (erasure)', () => {
  it('ra CỜ WARN_ERASURE, không được đoán ra một đáp án sai', () => {
    const fills = buildCleanFills().filter((f) => !f.bubbleId.startsWith('phanI.5.'))
    fills.push({ bubbleId: 'phanI.5.A', darkFactor: RESIDUE }) // câu 5 bị tẩy dở, không có đáp án nào tô rõ
    const img = generateSheet(fills, byId)
    const sheet = readSheet(img)

    expect(sheet.phanI[4].flag).toBe('WARN_ERASURE')
    expect(sheet.phanI[4].value).toBeNull() // không được lặng lẽ trả về đáp án sai

    // Các câu khác không bị ảnh hưởng
    sheet.phanI.forEach((a, i) => {
      if (i === 4) return
      expect(a.value).toBe(PHAN_I[i])
    })
  })

  it('tô 2 lựa chọn trở lên ra ERR_DOUBLE_MARK, không tính điểm', () => {
    const fills = buildCleanFills()
    fills.push({ bubbleId: 'phanI.1.C', darkFactor: CLEAR }) // câu 1 đáp án đúng là A, tô thêm C
    const img = generateSheet(fills, byId)
    const sheet = readSheet(img)
    expect(sheet.phanI[0].flag).toBe('ERR_DOUBLE_MARK')
  })
})

describe('template — không có bubble nào lệch ra ngoài khổ A4', () => {
  it('mọi toạ độ đều nằm trong 210×297mm', () => {
    genAllBubbles().forEach((b) => {
      expect(b.x_mm).toBeGreaterThanOrEqual(0)
      expect(b.x_mm).toBeLessThanOrEqual(template.page.width_mm)
      expect(b.y_mm).toBeGreaterThanOrEqual(0)
      expect(b.y_mm).toBeLessThanOrEqual(template.page.height_mm)
    })
  })
})
