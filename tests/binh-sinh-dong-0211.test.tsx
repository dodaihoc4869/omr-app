// Thầy 02/11 tối: «Cái bình này màu hồng tôi muốn nó vector sinh động, nghiêng máy thì chất lỏng bên trong nghiêng theo, khi đổi màu thì tỏa sáng hồng
// tinh tế đẹp mắt, tải sẵn hiệu ứng cho mọi máy nhé» + «Tỏa nhẹ nhàng như hào quang tinh tế vào». Bản vẽ: docs/ban-ve-binh-0211.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { BinhHomNay } from '../src/components/hoc-tap/TrongHs'
import { gocMan, GOC_MAX, loXo, ganNghieng } from '../src/lib/binh-nghieng'

afterEach(() => { cleanup(); localStorage.clear() })

describe('góc màn từ cảm biến', () => {
  it('cầm dọc thẳng ⇒ 0; nghiêng phải ⇒ dương; nghiêng trái ⇒ âm; luôn trong ±GOC_MAX; thiếu số ⇒ 0', () => {
    expect(Math.abs(gocMan(70, 0))).toBeLessThan(0.01)
    expect(gocMan(60, 25)).toBeGreaterThan(5)
    expect(gocMan(60, -25)).toBeLessThan(-5)
    expect(Math.abs(gocMan(0, 89))).toBeLessThanOrEqual(GOC_MAX)
    expect(gocMan(null, 10)).toBe(0)
  })
})

describe('lò xo dung dịch', () => {
  const chay = (lx: ReturnType<typeof loXo>) => { let n = 0; while (lx.buoc(1 / 60) && n < 2000) n++; return n }
  it('đổi góc ⇒ tới đích rồi TỰ DỪNG (vòng vẽ không chạy mãi)', () => {
    const lx = loXo(false)
    for (let i = 0; i < 30; i++) lx.dat(20)
    const n = chay(lx)
    expect(n).toBeLessThan(400)
    expect(Math.abs(lx.goc - 20)).toBeLessThan(1)
  })
  it('rung tay ±0,5° quanh góc đứng yên không đánh thức vòng vẽ (≤ 1 lượt trong 300 mẫu ≈ 5 giây)', () => {
    const lx = loXo(false)
    for (let i = 0; i < 30; i++) lx.dat(10)
    chay(lx)
    let thuc = 0
    for (let i = 0; i < 300; i++) if (lx.dat(10 + (i % 2 ? 0.5 : -0.5))) thuc++
    expect(thuc).toBeLessThanOrEqual(1) // nhiều nhất một lượt lặng nốt phần dư của bộ lọc, rồi không thức nữa
  })
  it('máy yếu / giảm chuyển động: tắt dần tới hạn — không vượt quá đích (không sóng sánh)', () => {
    const lx = loXo(true)
    for (let i = 0; i < 30; i++) lx.dat(20)
    let max = 0
    while (lx.buoc(1 / 60)) max = Math.max(max, lx.goc)
    expect(max).toBeLessThanOrEqual(20.05)
  })
  it('máy thường: có sóng sánh nhẹ (vượt đích rồi lặng)', () => {
    const lx = loXo(false)
    for (let i = 0; i < 30; i++) lx.dat(20)
    let max = 0
    while (lx.buoc(1 / 60)) max = Math.max(max, lx.goc)
    expect(max).toBeGreaterThan(20.3)
  })
})

describe('gắn nghiêng', () => {
  it('không có cảm biến (máy tính) ⇒ không gắn gì; có ⇒ nghe khi hiện, gỡ sạch', () => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const w1 = { document } as unknown as Window
    expect(ganNghieng(g, () => [100, 150], { tatDan: false, win: w1 })).toBeTypeOf('function')
    const them = vi.fn(), bo = vi.fn()
    const w2 = { DeviceOrientationEvent: function () {}, document, addEventListener: them, removeEventListener: bo, matchMedia: () => ({ matches: false }), requestAnimationFrame: vi.fn(), cancelAnimationFrame: vi.fn() } as unknown as Window
    const go = ganNghieng(g, () => [100, 150], { tatDan: false, win: w2 })
    expect(them).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
    go()
    expect(bo).toHaveBeenCalledWith('deviceorientation', expect.any(Function))
  })
})

describe('bình Hôm nay', () => {
  it('chưa đủ: không hào quang; đủ: hào quang + sao, nở một lần mỗi ngày (lần sau trong ngày không nở lại)', () => {
    const a = render(<BinhHomNay da={20} muc={63} ranh={[]} />)
    expect(a.container.querySelector('.kb-hao')).toBeNull()
    a.unmount()
    const b = render(<BinhHomNay da={63} muc={63} ranh={[]} />)
    const svg = b.container.querySelector('svg')!
    expect(svg.querySelector('.kb-hao')).not.toBeNull()
    expect(svg.querySelectorAll('.kb-sao path')).toHaveLength(3)
    expect(svg.hasAttribute('data-no')).toBe(true)
    b.unmount()
    const c = render(<BinhHomNay da={63} muc={63} ranh={[]} />)
    expect(c.container.querySelector('svg')!.hasAttribute('data-no')).toBe(false)
  })
  it('mọi id gradient / clip theo useId — hai bình cùng trang không đụng id', () => {
    const { container } = render(<><BinhHomNay da={63} muc={63} ranh={[]} /><BinhHomNay da={10} muc={63} ranh={[]} /></>)
    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const e of container.querySelectorAll('[fill^="url(#"], [clip-path^="url(#"]')) {
      const id = (e.getAttribute('fill') || e.getAttribute('clip-path'))!.slice(5, -1)
      expect(ids).toContain(id)
    }
  })
  it('CSS bình: không hoạt ảnh vô hạn; máy yếu / giảm chuyển động tắt sao; không mã màu thô', () => {
    const css = fs.readFileSync(path.join(__dirname, '../src/styles/trong-kinh.css'), 'utf8')
    const khoi = css.slice(css.indexOf('/* BÌNH SINH ĐỘNG'), css.indexOf('/* BÌNH SINH ĐỘNG') + 4000).split('\n/*')[1]
    const kb = khoi.split('\n').filter((d) => d.includes('kb-binh') || d.includes('@keyframes kb-hao') || d.includes('@keyframes kb-sao'))
    expect(kb.join('\n')).not.toMatch(/infinite/)
    expect(css).toMatch(/html\.may-yeu \.kb-binh\[data-no\] \.kb-sao path \{ animation: none; \}/)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.kb-binh\[data-no\] \.kb-hao/)
    expect(khoi).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
  it('mã cảm biến nằm trong mảnh Hôm nay (không thêm tệp precache), bật lúc rảnh sau lần vẽ đầu', () => {
    const s = fs.readFileSync(path.join(__dirname, '../src/components/hoc-tap/TrongHs.tsx'), 'utf8')
    expect(s).toMatch(/^import \{ ganNghieng \} from '\.\.\/\.\.\/lib\/binh-nghieng'/m)
    expect(s).toMatch(/requestIdleCallback\(bat\)/)
  })
})
