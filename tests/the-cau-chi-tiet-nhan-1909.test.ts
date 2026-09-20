// SỬA (Code 4, rà cuối M3): huy hiệu 10,5 px "đáp án đúng" (trắng trên --p-xanh #10b981 = 2,54:1) và "em chọn" (trắng trên --p-do #ef4444 = 3,76:1)
// của TheCauChiTiet (tờ giấy báo cáo / phiếu). Nợ ghi từ nhóm A2 (đo Chromium ở tấm Hỏi bài Thầy). Nay nền là bản ĐẬM của cùng họ màu.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const TOKENS = doc('src/styles/tokens.css')
const TSX = doc('src/components/TheCauChiTiet.tsx')
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const tuongPhan = (a: string, b: string) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const token = (ten: string) => new RegExp(`--${ten}:\\s*(#[0-9a-fA-F]{6})`).exec(TOKENS)![1]

describe('huy hiệu đáp án đúng / em chọn của thẻ câu (giấy)', () => {
  it('bằng chứng lỗi cũ: chữ trắng trên --p-xanh / --p-do thiếu 4,5:1', () => {
    expect(tuongPhan(token('p-trang'), token('p-xanh'))).toBeLessThan(3)
    expect(tuongPhan(token('p-trang'), token('p-do'))).toBeLessThan(4.5)
  })

  it('bản đậm --p-xanh-dam / --p-do-dam: chữ trắng ≥ 4,5:1', () => {
    expect(tuongPhan(token('p-trang'), token('p-xanh-dam'))).toBeGreaterThanOrEqual(4.5)
    expect(tuongPhan(token('p-trang'), token('p-do-dam'))).toBeGreaterThanOrEqual(4.5)
  })

  it('hai token chỉ ở khối giấy (KHÔNG redefine ở nền tối — giấy luôn trắng mực đen)', () => {
    const iToi = TOKENS.indexOf('prefers-color-scheme: dark')
    expect(TOKENS.slice(iToi)).not.toMatch(/--p-(xanh|do)-dam/)
    expect(TOKENS.slice(0, iToi)).toMatch(/--p-xanh-dam:/)
  })

  it('TheCauChiTiet: hai huy hiệu dùng bản đậm; nhánh xem-trước-giải (--p-chim) giữ nguyên; màu viền / chữ cái A–D còn --p-xanh / --p-do', () => {
    expect(TSX).toContain("style={{ background: 'var(--p-xanh-dam)', color: 'var(--p-trang)' }}")
    expect(TSX).toContain("background: anLoiGiai ? 'var(--p-chim)' : 'var(--p-do-dam)'")
    expect(TSX).toContain("color: laDung ? 'var(--p-xanh)'")
    expect(TSX).not.toContain("background: 'var(--p-xanh)', color: 'var(--p-trang)'")
  })
})
