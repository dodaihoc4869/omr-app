// @vitest-environment jsdom
// LINH VẬT CHÍNH «Lửa» thay «Bi» (thầy 27/10 «Chọn Lửa build luôn nhé»): GIỮ API <Bi cam size className nhip noi> nên mọi người gọi không đổi;
// 7 cảm xúc map 1-1 sang trạng thái Lửa; khung giữ chỗ tỉ lệ 200 : 230; aria-hidden; mảnh lua-dong nạp LƯỜI; không màu thô; giảm chuyển động ⇒ tĩnh;
// không xuất hiện ở màn thi, đăng nhập, app thầy, app phụ huynh.
import { readFileSync } from 'node:fs'
import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Bi, CAM_BI, TT_THEO_CAM, TEN_LINH_VAT, biDungYen, ttTheoCam } from '../src/components/linh-vat/Bi'
import { CAM_XUC_LUA, TRANG_THAI_LUA, taoLua } from '../src/components/linh-vat/lua-dong'

afterEach(() => { vi.useRealTimers(); document.documentElement.classList.remove('may-yeu') })

describe('Lửa thay Bi', () => {
  it('7 cảm xúc của Bi map 1-1 sang trạng thái Lửa; nhịp yên không màn vào; mừng xong về vui', () => {
    expect(CAM_BI).toEqual(['chao', 'vui', 'nghi', 'sai', 'mung', 'ngu', 'lua'])
    expect(TT_THEO_CAM).toEqual({ chao: 'chao', vui: 'vui', nghi: 'nghi', sai: 'buon', mung: 'combo', ngu: 'ngu', lua: 'covu' })
    expect(new Set(Object.values(TT_THEO_CAM)).size).toBe(7)
    for (const t of Object.values(TT_THEO_CAM)) expect(TRANG_THAI_LUA).toContain(t)
    expect(ttTheoCam('mung')).toEqual(['combo', { sau: 3600, ve: 'vui' }])
    expect(ttTheoCam('chao', 'yen')).toEqual(['yen', { em: true }])
    expect(ttTheoCam('mung', 'yen')[0]).toBe('cuoi')
    expect(TEN_LINH_VAT).toBe('Lửa')
  })
  it('mọi trạng thái có tư thế; đúng có lấy đà ≤ 80 ms rồi nảy; sai có giật mình', () => {
    for (const t of TRANG_THAI_LUA) { const v = CAM_XUC_LUA[t]; expect((v.seq?.length ?? 0) + (v.loop?.length ?? 0), t).toBeGreaterThan(0) }
    expect(CAM_XUC_LUA.vui.seq![0]!.d).toBeLessThanOrEqual(80)
    expect((CAM_XUC_LUA.vui.seq![1]!.p!.y as number)).toBeLessThan(0)
    expect((CAM_XUC_LUA.buon.seq![0]!.p!.es as number)).toBeGreaterThan(1)
  })
  it('khung giữ chỗ đúng tỉ lệ, aria-hidden, rồi vẽ Lửa (mảnh nạp lười); đổi cảm xúc ⇒ đổi trạng thái', async () => {
    const { container, rerender } = render(<Bi cam="vui" size={64} />)
    const span = container.querySelector('span.bi.lua') as HTMLElement
    expect(span.getAttribute('aria-hidden')).toBe('true')
    expect(span.style.getPropertyValue('--lv-w')).toBe('64px')
    await waitFor(() => expect(span.querySelector('svg.lua-svg')).not.toBeNull())
    expect(span.querySelector('svg')!.getAttribute('viewBox')).toBe('-120 -238 240 276') // 240 : 276 = 200 : 230
    rerender(<Bi cam="sai" size={64} />)
    expect(span.getAttribute('data-cam')).toBe('sai')
  })
  it('tĩnh khi giảm chuyển động / máy yếu; bộ máy chạy mọi trạng thái, chạm ⇒ bị chọc rồi về; huỷ ⇒ gỡ sạch', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as unknown as typeof window.matchMedia
    expect(biDungYen()).toBe(true)
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
    expect(biDungYen()).toBe(false)
    document.documentElement.classList.add('may-yeu'); expect(biDungYen()).toBe(true)
    const o = document.createElement('span'); document.body.appendChild(o)
    const l = taoLua(o, { trangThai: 'yen', tay: true })
    for (const t of TRANG_THAI_LUA) { l.datTrangThai(t); l.buoc(500); expect(l.trangThai).toBe(t) }
    l.datTrangThai('vui'); l.buoc(100)
    l.svg.dispatchEvent(new Event('pointerdown')); expect(l.trangThai).toBe('choc')
    l.buoc(1200); expect(l.trangThai).toBe('vui')
    l.datTrangThai('combo', { sau: 600, ve: 'vui' }); l.buoc(800); expect(l.trangThai).toBe('vui')
    l.huy(); expect(o.querySelector('svg')).toBeNull()
  })
  it('không màu thô trong mã vẽ; mọi biến --lv-* dùng tới đều khai ở lua.css; mọi luật dưới app học sinh', () => {
    const ts = readFileSync('src/components/linh-vat/lua-dong.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const tsx = readFileSync('src/components/linh-vat/Bi.tsx', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const css = readFileSync('src/styles/lua.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const s of [ts, tsx, css]) {
      expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(s).not.toMatch(/\b(?:rgba?|hsla?)\(/)
    }
    const co = new Set([...css.matchAll(/--lv-(\w+):/g)].map((m) => m[1]))
    const o = document.createElement('span'); document.body.appendChild(o)
    const l = taoLua(o, { tay: true })
    for (const t of TRANG_THAI_LUA) l.datTrangThai(t)
    const dung = new Set<string>()
    for (const e of o.querySelectorAll('*')) for (const m of (e.getAttribute('style') ?? '').matchAll(/var\(--lv-(\w+)\)/g)) dung.add(m[1]!)
    expect(dung.size).toBeGreaterThan(15)
    for (const k of dung) expect(co.has(k), '--lv-' + k).toBe(true)
    l.huy()
    for (const luat of css.split('}').map((x) => x.split('{')[0]!.trim()).filter((x) => x && !x.startsWith('@'))) expect(luat).toMatch(/\[data-trong='hs'\]/)
    expect(tsx).toMatch(/import\('\.\/lua-dong'\)/)
    expect(tsx).not.toMatch(/^import (?!type)[^\n]*from '\.\/lua-dong'/m)
  })
  it('không xuất hiện ở màn thi, đăng nhập, app thầy, app phụ huynh', () => {
    for (const t of ['src/screens/ExamTakeScreen.tsx', 'src/AppThi.tsx', 'src/screens/StudentLoginScreen.tsx', 'src/App.tsx', 'src/AppPhuHuynh.tsx']) {
      let s = ''
      try { s = readFileSync(t, 'utf8') } catch { continue }
      expect(s).not.toMatch(/linh-vat\/Bi/)
    }
  })
})
