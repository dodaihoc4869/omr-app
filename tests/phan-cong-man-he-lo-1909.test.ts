// MÀN "GIAO BÀI TẬP VỀ NHÀ" CỦA THẦY PHẢI NÓI ĐÚNG HỆ LÔ (19/09/2026).
//
// Thầy bỏ hệ Vòng 1/2/3 của BTVN, thay bằng LÔ theo ngày/giờ tính từ hạn nộp (`lich-lo-btvn.ts`).
// Nhãn nhỏ cạnh tiêu đề màn giao bài vẫn ghi "Bài tập theo 3 vòng" — đọc là hiểu nhầm hệ cũ còn sống.
// (Nhãn độ khó "Vòng 1/2/3" trên thẻ câu là trục phân loại nội dung, KHÔNG thuộc phạm vi này.)
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MAN = readFileSync(join(process.cwd(), 'src/screens/PhanCongScreen.tsx'), 'utf8')

describe('PhanCongScreen — nhãn hệ BTVN', () => {
  it('không còn nói "3 vòng"', () => {
    expect(MAN).not.toMatch(/3 vòng/i)
    expect(MAN).not.toMatch(/ba vòng/i)
  })

  it('nói hệ chặng theo hạn nộp (21/09: "lô" → "chặng" theo chuẩn từ ngữ, hàng 2)', () => {
    expect(MAN).toContain('Chia chặng theo hạn nộp')
  })
})
