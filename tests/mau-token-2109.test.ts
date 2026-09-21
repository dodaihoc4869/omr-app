// MÀU MỘT NGUỒN (`npm run check:mau`): ba tệp đã dọn sạch mã màu thô ngày 21/09 — index.css (bảng slate ấm, chữ ô giờ tối, khung lời giải),
// BangVinhDanh.css/.tsx (bốn màu Vinh danh). Khoá cho khỏi lộn lại; giá trị nằm ở src/styles/tokens.css và được khoá ở đó.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { it, expect } from 'vitest'

const doc = (t: string) => readFileSync(resolve(__dirname, '..', t), 'utf8')
const HEX = /#[0-9a-fA-F]{3,8}\b/g

it.each(['src/index.css', 'src/components/BangVinhDanh.css', 'src/components/BangVinhDanh.tsx'])('%s không còn mã màu #rrggbb', (t) => {
  expect(doc(t).match(HEX) ?? []).toEqual([])
})
it('tokens.css giữ đúng bảng slate ấm và `@theme` của index.css trỏ về nó (một nguồn)', () => {
  const tk = doc('src/styles/tokens.css'), css = doc('src/index.css')
  const bang: Record<string, string> = { 50: '#f5f4ef', 100: '#eeeee8', 200: '#dedfd9', 300: '#c3c8ca', 400: '#a6b0bc', 500: '#657180', 600: '#515e6b', 700: '#394652', 800: '#29323d', 900: '#202730', 950: '#171c23' }
  for (const [n, mau] of Object.entries(bang)) {
    expect(tk).toContain(`--slate-${n}: ${mau};`)
    expect(css).toContain(`--color-slate-${n}: var(--slate-${n});`)
  }
  expect(tk).toContain('--chu-o-gio-toi: #f1f5f9;')
  expect(tk).toContain('--loi-giai-nen: #fff8e9;')
})

it('check-mau.mjs: ngoại lệ ĐÓNG cho tranh vẽ của game — đúng 7 tệp, đủ đường dẫn, không glob; lệnh kiểm màu thoát 0', () => {
  const gs = doc('scripts/check-mau.mjs')
  const game = [...gs.matchAll(/^\s*'(game\/[^']+)',\s*$/gm)].map((m) => m[1])
  expect(game.sort()).toEqual([
    'game/than-thu-v2/EscortRoom.tsx', 'game/than-thu-v2/ImmortalShield.tsx', 'game/than-thu-v2/LinhTam.tsx', 'game/than-thu-v2/ProgressChart.tsx',
    'game/than-thu-v2/escort.css', 'game/than-thu-v2/game.css', 'game/than-thu-v2/progress-chart.css',
  ])
  for (const g of game) expect(g).not.toMatch(/[*?]/)
  const r = spawnSync(process.execPath, ['scripts/check-mau.mjs'], { cwd: resolve(__dirname, '..'), encoding: 'utf8' })
  expect(r.status, r.stdout.slice(-300)).toBe(0)
})
