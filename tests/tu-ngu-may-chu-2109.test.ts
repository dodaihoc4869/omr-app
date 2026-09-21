// TỪ NGỮ · MÁY CHỦ (thầy lệnh 21/09: "Thay toàn bộ từ Máy bằng A.I Đỗ Đại Học").
// Chủ ngữ TỰ ĐỘNG trong câu do máy chủ sinh ra phải là "A.I Đỗ Đại Học". KHÔNG đổi "máy chủ / máy em / máy này / máy chiếu" (là thiết bị).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { chuLoiMay } from '../server/src/nhat-ky-may'
import { MO_TA_THE } from '../server/src/game-v2-doan-the'

describe('từ ngữ máy chủ: chủ ngữ tự động là A.I Đỗ Đại Học', () => {
  it('câu lỗi cron cho thầy', () => {
    expect(chuLoiMay('nhac_nop_bai')).toBe('Nhắc nộp bài lỗi, A.I Đỗ Đại Học sẽ thử lại')
    expect(chuLoiMay('nhac_nop_bai')).not.toMatch(/\bmáy\b/i)
  })
  it('thẻ Tiếp sức "Loại 1 phương án"', () => {
    expect(MO_TA_THE.loai_phuong_an.moTa).toBe('A.I Đỗ Đại Học gạch một đáp án sai')
  })
  it('gv-bang-tin: câu cảnh báo không còn "máy sẽ thử lại"', () => {
    const src = readFileSync('server/src/gv-bang-tin.ts', 'utf8')
    expect(src).toContain('A.I Đỗ Đại Học sẽ thử lại')
    expect(src).not.toMatch(/, máy sẽ thử lại/)
  })
})
