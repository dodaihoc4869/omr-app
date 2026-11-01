// LỬA ĐỔI CẢM XÚC — HÌNH theo cấp (docs/DE-XUAT-BI-CAM-XUC-3110.md mục 2.1 + 7): dựng cấp 0–5 không lỗi; cấp 4–5 có tròng đỏ, răng, gân; cấp 5 thêm hơi
// nước + lớp lửa ngoài; cấp 0–1 giống hệt hình hôm nay; hạ cấp ⇒ về đúng hình cũ. Lớp giận nạp LƯỜI (mảnh riêng), màu chỉ biến --cn-*.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { taoLua, type Lua } from '../src/components/linh-vat/lua-dong'
import { dungGian } from '../src/components/linh-vat/lua-gian'
import { ttTheoCap } from '../src/components/linh-vat/Bi'

const thay = (e: Element): boolean => { for (let x: Element | null = e; x && x.tagName !== 'svg'; x = x.parentElement) if ((x as SVGElement).style?.display === 'none') return false; return true }
const coMau = (l: Lua, sel: string, mau: string) => [...l.svg.querySelectorAll<SVGElement>(sel)].some((e) => (e.style.fill === `var(--cn-${mau})` || e.style.stroke === `var(--cn-${mau})`) && thay(e))
const moi = (tt: 'chao' | 'gian' = 'gian') => { const o = document.createElement('span'); o.className = 'bi lua'; document.body.appendChild(o); return taoLua(o, { tay: true, trangThai: tt }) }
const goc = (l: Lua) => l.svg.outerHTML.replace(/lua\d+/g, 'lua')

describe('Lửa theo cấp', () => {
  it('dựng cấp 0–5 không lỗi, lên rồi xuống đủ vòng', () => {
    const l = moi()
    for (const c of [0, 1, 2, 3, 4, 5, 3, 0, 5, 2]) { expect(() => { l.datCap(c, dungGian); l.buoc(300) }).not.toThrow(); expect(l.cap).toBe(c) }
    l.huy()
  })
  it('cấp 0–1 giống HỆT hình hôm nay (không thêm nút nào)', () => {
    const a = moi('chao'), b = moi('chao')
    b.datCap(1, dungGian)
    expect(goc(b)).toBe(goc(a))
    a.huy(); b.huy()
  })
  it('cấp 2 đồng hồ · cấp 3 một gân · cấp 4 tròng đỏ + răng + gân · cấp 5 thêm hơi nước, lửa ngoài, tròng lõi vàng', () => {
    const l = moi()
    l.datCap(2, dungGian)
    expect(coMau(l, 'circle', 'rang')).toBe(true) // mặt đồng hồ
    expect(coMau(l, 'path', 'gian')).toBe(false)
    l.datCap(3, dungGian)
    expect(coMau(l, 'path', 'gian')).toBe(true)
    expect(coMau(l, 'circle', 'matDo')).toBe(false)
    l.datCap(4, dungGian)
    expect(coMau(l, 'circle', 'matDo')).toBe(true)
    expect(coMau(l, 'path', 'rang')).toBe(true) // răng nghiến
    expect(coMau(l, 'path', 'gian')).toBe(true)
    expect(coMau(l, 'path', 'hoi')).toBe(false)
    expect(coMau(l, 'path', 'luaNgoai')).toBe(false)
    l.datCap(5, dungGian)
    for (const m of ['matDo', 'matSang']) expect(coMau(l, 'circle', m), m).toBe(true)
    for (const m of ['rang', 'gian', 'hoi', 'luaNgoai']) expect(coMau(l, 'path', m), m).toBe(true)
    expect(l.svg.querySelector('radialGradient')).not.toBeNull() // quầng đỏ
    expect(l.svg.getAttribute('data-cap-ve')).toBe('5')
    l.huy()
  })
  it('hạ cấp ⇒ về đúng hình cũ: mọi chi tiết giận ẩn, mắt sáng + miệng thường hiện lại', () => {
    const l = moi()
    l.datCap(5, dungGian); l.datCap(0, dungGian)
    for (const m of ['matDo', 'matSang']) expect(coMau(l, 'circle', m), m).toBe(false)
    for (const m of ['rang', 'gian', 'hoi', 'luaNgoai']) expect(coMau(l, 'path', m), m).toBe(false)
    expect(coMau(l, 'path', 'mieng')).toBe(true)
    expect(l.svg.hasAttribute('data-cap-ve')).toBe(false)
    l.huy()
  })
  it('chạm: cấp 0–2 cười khúc khích (choc) · cấp 3–5 giậm chân, không cười', () => {
    const l = moi('chao')
    l.svg.dispatchEvent(new Event('pointerdown')); expect(l.trangThai).toBe('choc')
    l.buoc(1200)
    l.datTrangThai('gian'); l.datCap(4, dungGian)
    l.svg.dispatchEvent(new Event('pointerdown')); expect(l.trangThai).toBe('giam')
    l.buoc(1200); expect(l.trangThai).toBe('gian')
    l.huy()
  })
  it('dáng theo cấp: 2 dỗi · 3 càu nhàu · 4–5 tức giận; cấp 0–1 theo cảm xúc cũ', () => {
    expect(ttTheoCap('chao', undefined, 0)[0]).toBe('chao')
    expect(ttTheoCap('vui', undefined, 1)[0]).toBe('vui')
    expect(ttTheoCap('chao', undefined, 2)[0]).toBe('doi')
    expect(ttTheoCap('chao', undefined, 3)[0]).toBe('caunhau')
    expect(ttTheoCap('chao', 'yen', 4)).toEqual(['gian', { em: true }])
    expect(ttTheoCap('mung', undefined, 5)[0]).toBe('gian')
  })
})

describe('màu + nạp lười', () => {
  it('không màu thô; mọi biến --cn-* lớp giận dùng đều có khai; mọi luật dưới app học sinh', () => {
    const ts = readFileSync('src/components/linh-vat/lua-gian.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const css = readFileSync('src/styles/lua-gian.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const s of [ts, css]) { expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); expect(s).not.toMatch(/\b(?:rgba?|hsla?)\(/) }
    const co = new Set([...(readFileSync('src/styles/cu-ngoc.css', 'utf8') + css).matchAll(/--cn-(\w+):/g)].map((m) => m[1]))
    const l = moi()
    for (const c of [2, 3, 4, 5]) l.datCap(c, dungGian)
    const dung = new Set<string>()
    for (const e of l.svg.querySelectorAll('*')) for (const m of (e.getAttribute('style') ?? '').matchAll(/var\(--cn-(\w+)\)/g)) dung.add(m[1]!)
    for (const k of dung) expect(co.has(k), '--cn-' + k).toBe(true)
    l.huy()
    for (const luat of css.split('}').map((x) => x.split('{')[0]!.trim()).filter((x) => x && !x.startsWith('@'))) expect(luat).toMatch(/\[data-trong='hs'\]/)
  })
  it('01/11 Mol thay hình: Bi.tsx / Lộ trình KHÔNG còn nạp lớp giận Cú Ngọc (Mol tự vẽ cấp 2–5); lua-dong không nhập lua-gian', () => {
    const tsx = readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')
    expect(tsx).not.toMatch(/lua-gian'/)
    expect(readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')).toMatch(/import\('\.\.\/linh-vat\/mol-dong'\)\.then\(\(m\) => m\.datIconTabMol\(/)
    expect(readFileSync('src/components/linh-vat/lua-dong.ts', 'utf8')).not.toMatch(/^import (?!type)[^\n]*lua-gian/m)
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/'\*\*\/lua-gian-\*\.\{js,css\}'/)
  })
})
