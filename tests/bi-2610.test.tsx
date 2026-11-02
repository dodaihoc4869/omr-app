// @vitest-environment jsdom
// LINH VẬT CHÍNH «Lửa» thay «Bi» (thầy 27/10 «Chọn Lửa build luôn nhé»): GIỮ API <Bi cam size className nhip noi> nên mọi người gọi không đổi;
// 7 cảm xúc map 1-1 sang trạng thái Lửa; khung giữ chỗ tỉ lệ 200 : 230; aria-hidden; mảnh lua-dong nạp LƯỜI; không màu thô; giảm chuyển động ⇒ tĩnh;
// không xuất hiện ở màn thi, đăng nhập, app thầy, app phụ huynh. 28/10: hình đổi sang «Cú Ngọc» (tên trên màn vẫn «Lửa»), màu --cn-* ở cu-ngoc.css (nạp lười).
// 01/11: linh vật đổi sang «Mol» (mặt bình cầu, mol-dong.ts — test riêng tests/mol-0111.test.tsx); bộ máy Cú Ngọc ở lua-dong.ts GIỮ LẠI (kiểu `Lua` + đường lùi) ⇒ test bộ máy giữ nguyên.
import { readFileSync } from 'node:fs'
import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Bi, CAM_BI, TT_THEO_CAM, TEN_LINH_VAT, biDungYen, cheDoBi, ttTheoCam } from '../src/components/linh-vat/Bi'
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
    expect(TEN_LINH_VAT).toBe('Mol')
  })
  it('mọi trạng thái có tư thế; đúng có lấy đà ≤ 80 ms rồi nảy; sai có giật mình', () => {
    for (const t of TRANG_THAI_LUA) { const v = CAM_XUC_LUA[t]; expect((v.seq?.length ?? 0) + (v.loop?.length ?? 0), t).toBeGreaterThan(0) }
    expect(CAM_XUC_LUA.vui.seq![0]!.d).toBeLessThanOrEqual(80)
    expect((CAM_XUC_LUA.vui.seq![1]!.p!.y as number)).toBeLessThan(0)
    expect((CAM_XUC_LUA.buon.seq![0]!.p!.es as number)).toBeGreaterThan(1)
  })
  it('khung giữ chỗ đúng tỉ lệ, aria-hidden, rồi vẽ Mol (mảnh nạp lười); đổi cảm xúc ⇒ đổi trạng thái', async () => {
    const { container, rerender } = render(<Bi cam="vui" size={64} />)
    const span = container.querySelector('span.bi.lua') as HTMLElement
    expect(span.getAttribute('aria-hidden')).toBe('true')
    expect(span.style.getPropertyValue('--lv-w')).toBe('64px')
    await waitFor(() => expect(span.querySelector('svg.lua-svg')).not.toBeNull())
    expect(span.querySelector('svg')!.getAttribute('viewBox')).toBe('0 -26 200 230') // Mol: đúng tỉ lệ 200 : 230
    expect(span.querySelector('svg.mol-svg')!.getAttribute('data-mat')).toBe('vui')
    rerender(<Bi cam="sai" size={64} />)
    expect(span.getAttribute('data-cam')).toBe('sai')
  })
  it('tĩnh khi giảm chuyển động; 02/11 máy yếu KHÔNG tĩnh mà chạy chế độ gọn; cỡ < 64 px ⇒ nhỏ (không vòng JS); bộ máy Cú Ngọc giữ nguyên', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as unknown as typeof window.matchMedia
    expect(biDungYen()).toBe(true); expect(cheDoBi(104)).toBe('tinh'); expect(cheDoBi(34)).toBe('nho')
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
    expect(biDungYen()).toBe(false); expect(cheDoBi(104)).toBe('day-du'); expect(cheDoBi(63)).toBe('nho'); expect(cheDoBi(64)).toBe('day-du')
    document.documentElement.classList.add('may-yeu'); expect(biDungYen()).toBe(false); expect(cheDoBi(104)).toBe('gon')
    expect(readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')).toContain('cheDo: cheDoBi(size), goc, keo: !!goc') // chỉ Mol đứng nghiêng cạnh đường (Lộ trình) kéo được
    const o = document.createElement('span'); document.body.appendChild(o)
    const l = taoLua(o, { trangThai: 'yen', tay: true })
    for (const t of TRANG_THAI_LUA) { l.datTrangThai(t); l.buoc(500); expect(l.trangThai).toBe(t) }
    l.datTrangThai('vui'); l.buoc(100)
    l.svg.dispatchEvent(new Event('pointerdown')); expect(l.trangThai).toBe('choc')
    l.buoc(1200); expect(l.trangThai).toBe('vui')
    l.datTrangThai('combo', { sau: 600, ve: 'vui' }); l.buoc(800); expect(l.trangThai).toBe('vui')
    l.huy(); expect(o.querySelector('svg')).toBeNull()
  })
  it('không màu thô trong mã vẽ; mọi biến --cn-* dùng tới đều khai ở cu-ngoc.css; mọi luật dưới app học sinh', () => {
    const ts = readFileSync('src/components/linh-vat/lua-dong.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const tsx = readFileSync('src/components/linh-vat/Bi.tsx', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const css = readFileSync('src/styles/cu-ngoc.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const s of [ts, tsx, css]) {
      expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(s).not.toMatch(/\b(?:rgba?|hsla?)\(/)
    }
    const co = new Set([...css.matchAll(/--cn-(\w+):/g)].map((m) => m[1]))
    const o = document.createElement('span'); document.body.appendChild(o)
    const l = taoLua(o, { tay: true })
    for (const t of TRANG_THAI_LUA) l.datTrangThai(t)
    const dung = new Set<string>()
    for (const e of o.querySelectorAll('*')) for (const m of (e.getAttribute('style') ?? '').matchAll(/var\(--cn-(\w+)\)/g)) dung.add(m[1]!)
    expect(dung.size).toBeGreaterThan(15)
    for (const k of dung) expect(co.has(k), '--cn-' + k).toBe(true)
    l.huy()
    for (const luat of css.split('}').map((x) => x.split('{')[0]!.trim()).filter((x) => x && !x.startsWith('@'))) expect(luat).toMatch(/\[data-trong='hs'\]/)
    expect(tsx).toMatch(/import\('\.\/mol-dong'\)/) // 01/11: Bi.tsx nạp lười Mol, chỉ lấy KIỂU từ lua-dong
    expect(tsx).not.toMatch(/^import (?!type)[^\n]*from '\.\/(?:lua|mol)-dong'/m)
  })
  it('Cú Ngọc: đủ biểu cảm bản vẽ (dỗi, tức giận, càu nhàu); đứng nghiêng (trái = gương); màu nạp cùng mảnh lười; cỡ mới trên màn', () => {
    for (const t of ['doi', 'gian', 'caunhau', 'nghi', 'covu'] as const) expect(TRANG_THAI_LUA).toContain(t)
    expect(readFileSync('src/components/linh-vat/lua-dong.ts', 'utf8')).toMatch(/^import '\.\.\/\.\.\/styles\/cu-ngoc\.css'/m)
    const o = document.createElement('span'); document.body.appendChild(o)
    const p = taoLua(o, { tay: true, goc: 'phai' }), t = taoLua(o, { tay: true, goc: 'trai' })
    expect(t.svg.querySelector(':scope > g')!.getAttribute('transform')).toBe('scale(-1,1)')
    expect(p.svg.querySelector(':scope > g')!.getAttribute('transform')).toBeNull()
    p.huy(); t.huy()
    // 28/10 luật tốc độ: Lửa đứng yên / chào trên Lộ trình ≤ 130 nút SVG (bằng hình shiba cũ) — hiệu ứng, kiểu bàn tay, mắt xoắn dựng LẦN ĐẦU cần
    for (const tt of ['yen', 'chao'] as const) { const l = taoLua(o, { tay: true, trangThai: tt }); expect(l.svg.querySelectorAll('*').length + 1, tt).toBeLessThanOrEqual(130); l.huy() }
    const lc = taoLua(o, { tay: true, trangThai: 'ngu' }); lc.buoc(300); expect(lc.svg.querySelectorAll('text').length).toBe(3); lc.datTrangThai('gian'); lc.buoc(300); expect(lc.svg.querySelectorAll('text').length).toBe(3); lc.huy()
    const hs = readFileSync('src/styles/trong-hs.css', 'utf8'), gon = readFileSync('src/styles/trong-thuong-gon.css', 'utf8')
    expect(hs).toMatch(/\.da-linh-vat \.bi \{ display: block; width: 83px;/) // Lộ trình: hình cao ≈ 86 px
    expect(gon).toMatch(/\.tp-tr-muc \{[^}]*width: 54px; height: 54px;/) // vòng mục tiêu 54 px
    expect(readFileSync('src/components/hoc-tap/ManLamBaiTap.tsx', 'utf8')).toMatch(/<Bi cam="mung" size=\{135\} \/>/) // kết chặng: hình cao ≈ 140 px
    expect(readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')).toMatch(/goc=\{ben < 0 \? 'phai' : 'trai'\}/)
  })
  it('không xuất hiện ở màn thi, đăng nhập, app thầy, app phụ huynh', () => {
    for (const t of ['src/screens/ExamTakeScreen.tsx', 'src/AppThi.tsx', 'src/screens/StudentLoginScreen.tsx', 'src/App.tsx', 'src/AppPhuHuynh.tsx']) {
      let s = ''
      try { s = readFileSync(t, 'utf8') } catch { continue }
      expect(s).not.toMatch(/linh-vat\/Bi/)
    }
  })
})
