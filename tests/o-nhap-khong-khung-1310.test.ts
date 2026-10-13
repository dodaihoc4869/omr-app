// @vitest-environment node
// Thầy 13/10: "Bấm vào ô sớt thì bị chèn khung màu xanh nhìn xấu, bạn xử lý tất cả các chỗ này trên mọi chỗ mọi app". Khoá luật chung ở src/index.css
// (nạp cho cả 3 app): ô nhập chữ / ô chọn / ô soạn khi đang chọn KHÔNG vẽ khung ngoài và vòng Tailwind (thắng mọi luật khung riêng bằng !important),
// có dấu hiệu thay thế (viền ô sang màu chính); ô tick / nút radio / thanh trượt / nút KHÔNG nằm trong luật (giữ khung khi dùng bàn phím).
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const i = css.indexOf("O NHẬP CHỮ KHÔNG CHÈN KHUNG".replace('O', 'Ô'))
const khoi = css.slice(css.indexOf(':is(input', i), css.indexOf('}', css.indexOf(':is(input', i)) + 1)

it('luật chung có mặt, đúng phạm vi ô nhập chữ / ô chọn / ô soạn', () => {
  expect(i).toBeGreaterThan(0)
  expect(khoi).toMatch(/^:is\(input:not\(/)
  expect(khoi).toMatch(/textarea, select\):focus \{/)
  for (const loai of ['checkbox', 'radio', 'range', 'button', 'submit']) expect(khoi).toContain(`[type='${loai}']`)
})
it('bỏ khung ngoài + vòng Tailwind, có thay thế bằng viền màu chính (không mã màu thô)', () => {
  expect(khoi).toContain('outline: none !important;')
  expect(khoi).toContain('--tw-ring-shadow: 0 0 transparent !important;')
  expect(khoi).toContain('border-color: var(--m3-primary, currentColor);')
  expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
})
