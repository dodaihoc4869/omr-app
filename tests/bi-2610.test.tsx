// @vitest-environment jsdom
// LINH VẬT «Bi» (thầy chốt 26/10): 7 dáng vẽ được, mỗi Bi một bộ id riêng (useId), aria-hidden; KHÔNG màu thô trong Bi.tsx / bi.css (chỉ --tr-*);
// giảm chuyển động ⇒ Bi đứng yên; không dùng ở màn thi, đăng nhập, app thầy, app phụ huynh.
import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Bi, CAM_BI } from '../src/components/linh-vat/Bi'

describe('Bi', () => {
  it('vẽ đủ 7 dáng, data-cam đúng, ẩn với trình đọc màn hình, tỉ lệ 200:230', () => {
    for (const cam of CAM_BI) {
      const { container, unmount } = render(<Bi cam={cam} size={100} />)
      const svg = container.querySelector('svg.bi')!
      expect(svg.getAttribute('data-cam')).toBe(cam)
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.getAttribute('height')).toBe('115')
      expect(svg.querySelectorAll('path').length).toBeGreaterThan(8)
      expect(!!svg.querySelector('.bi-bot')).toBe(cam !== 'ngu') // ngủ ⇒ không bọt khí
      unmount()
    }
    expect(CAM_BI).toEqual(['chao', 'vui', 'nghi', 'sai', 'mung', 'ngu', 'lua'])
  })
  it('nhịp mặc định theo cảm xúc: vui ⇒ nảy, sai ⇒ lắc, mừng ⇒ nhảy; hai Bi cùng màn không trùng id', () => {
    const { container } = render(<><Bi cam="vui" /><Bi cam="sai" /><Bi cam="mung" /></>)
    expect([...container.querySelectorAll('svg.bi')].map((s) => s.getAttribute('data-nhip'))).toEqual(['nay', 'lac', 'nhay'])
    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
  })
  it('không màu thô (hex / rgb / tên màu) — chỉ biến --tr-*; giảm chuyển động & máy yếu ⇒ tắt chuyển động', () => {
    const tsx = readFileSync('src/components/linh-vat/Bi.tsx', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const css = readFileSync('src/styles/bi.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const s of [tsx, css]) {
      expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(s).not.toMatch(/\b(?:rgba?|hsla?)\(/)
      expect(s).not.toMatch(/(?<![\w-])(?:white|black|red|green|blue|orange|yellow|gray|grey)(?![\w-])/)
    }
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\[data-trong='hs'\] \.bi, \[data-trong='hs'\] \.bi \* \{ animation: none !important/)
    expect(css).toMatch(/\.may-yeu \.bi/)
    // mọi luật đều dưới app học sinh «Trong»
    for (const luat of css.split('}').map((x) => x.split('{')[0]!.trim()).filter((x) => x && !x.startsWith('@') && !/^(?:\d|from|to)/.test(x))) expect(luat).toMatch(/\[data-trong='hs'\]/)
  })
  it('không xuất hiện ở màn thi, đăng nhập, app thầy, app phụ huynh', () => {
    for (const t of ['src/screens/ExamTakeScreen.tsx', 'src/AppThi.tsx', 'src/screens/StudentLoginScreen.tsx', 'src/App.tsx', 'src/AppPhuHuynh.tsx']) {
      let s = ''
      try { s = readFileSync(t, 'utf8') } catch { continue }
      expect(s).not.toMatch(/linh-vat\/Bi/)
    }
  })
})
