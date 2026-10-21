// Vân tay màn thi (22/10): giờ:phút TỰ GHÉP, không dựng Intl lúc em vào đề (đo máy yếu: lần đầu dựng bộ định dạng 'vi-VN' ~150 ms).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { gioPhutNay } from '../src/components/VanTay'

describe('gioPhutNay', () => {
  it('trùng toLocaleTimeString vi-VN ở đủ 1440 phút trong ngày', () => {
    const intl = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    for (let p = 0; p < 1440; p++) {
      const d = new Date(2026, 9, 22, 0, p)
      expect(gioPhutNay(d)).toBe(intl.format(d))
    }
  })
  it('không dùng Intl / toLocale trên đường vẽ vân tay', () => {
    const ma = readFileSync('src/components/VanTay.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(ma).not.toMatch(/Intl\.|toLocale/)
  })
})
