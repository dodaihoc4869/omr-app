// Việc C · nhóm D, TheCau (Code 4) — commit 1: lớp CSS `.m3 .the-cau …` + móc nạp CSS. TheCau nằm trong màn thi thật và được game thần thú
// + app giáo viên dùng chung, nên điều khoá ở đây là ĐỘ CÔ LẬP: không có tổ tiên `.m3` thì thẻ không đổi một lớp / kiểu nội tuyến nào.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TheCau from '../src/components/TheCau'

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  datDuong('/')
})

const CSS = doc('src/components/m3/the-cau.css')

/** Tách khối luật `selector { … }` (không lồng) — đủ cho tệp CSS phẳng này; @media được bỏ qua. */
function cacLuat(css: string) {
  const sach = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const ra: { chon: string[]; noiDung: string }[] = []
  for (const m of sach.matchAll(/([^{}]+)\{([^{}]*)\}/g)) ra.push({ chon: m[1].split(',').map((s) => s.trim()).filter(Boolean), noiDung: m[2] })
  return ra
}

describe('the-cau.css — !important chỉ nằm trong phạm vi `.m3 .the-cau`', () => {
  it('mọi luật có !important đều có TẤT CẢ bộ chọn bắt đầu bằng `.m3 .the-cau`', () => {
    const co = cacLuat(CSS).filter((r) => r.noiDung.includes('!important'))
    expect(co.length).toBeGreaterThan(20)
    for (const r of co) for (const s of r.chon) expect(s.startsWith('.m3 .the-cau'), s).toBe(true)
  })

  it('cả thư mục m3/: `!important` ngoài the-cau.css chỉ còn ở khối tắt chuyển động của m3.css; mọi bộ chọn của the-cau.css có tiền tố `.m3 `', () => {
    const dir = path.join(goc, 'src/components/m3')
    for (const ten of fs.readdirSync(dir).filter((t) => t.endsWith('.css') && t !== 'the-cau.css')) {
      const nd = fs.readFileSync(path.join(dir, ten), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      const dong = nd.split('\n').filter((l) => l.includes('!important'))
      if (ten === 'm3.css') {
        // duy nhất khối @media (prefers-reduced-motion: reduce) { .m3 * { animation: none !important; transition: none !important } }
        expect(dong.map((l) => l.trim()).sort(), ten).toEqual(['animation: none !important;', 'transition: none !important;'])
        expect(nd).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.m3 \*,[\s\S]*?animation: none !important;/)
      } else expect(dong, ten).toEqual([])
    }
    for (const r of cacLuat(CSS)) for (const s of r.chon) expect(s.startsWith('.m3 '), s).toBe(true)
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('đích chạm và bố cục: nút Đ|S ≥ 48 px, hàng phương án 52 px cố định (chọn không xô bố cục), ô nhập 56 px có vòng nét 2 px', () => {
    expect(CSS).toMatch(/\.m3 \.the-cau \.y-nut button \{[^}]*min-height: 48px !important/)
    expect(CSS).toMatch(/\.m3 \.the-cau \.pa-hang \{[^}]*min-height: 52px !important/)
    expect(CSS).toMatch(/\.m3 \.the-cau input \{[^}]*min-height: 56px !important/)
    expect(CSS).toMatch(/\.m3 \.the-cau input:focus,[\s\S]*?box-shadow: inset 0 0 0 2px var\(--m3-primary\)/)
  })

  it('đúng / sai / chọn luôn ba vai trò màu riêng: tertiary · error · primary', () => {
    expect(CSS).toMatch(/\[data-trang-thai='dung'\][^{]*\{[^}]*var\(--m3-tertiary-container\)/)
    expect(CSS).toMatch(/\[data-trang-thai='sai'\][^{]*\{[^}]*var\(--m3-error-container\)/)
    expect(CSS).toMatch(/\.pa-hang\[data-trang-thai='chon'\] \{[^}]*var\(--m3-primary-container\)/)
  })
})

const P1 = { cheDo: 'thi' as const, stt: 1, phan: 'I' as const, text: 'Ancol bậc II?', choices: ['a', 'b', 'c', 'd'] as [string, string, string, string], choicePerm: [0, 1, 2, 3], selected: null }
const P2 = { cheDo: 'thi' as const, stt: 2, phan: 'II' as const, text: 'Mỗi ý đúng hay sai?', ideas: ['a', 'b', 'c', 'd'] as [string, string, string, string], selected: [null, null, null, null] as (null | 'D' | 'S')[] }
const P3 = { cheDo: 'thi' as const, stt: 3, phan: 'III' as const, text: 'Tính V.', selected: '' }

describe('ngữ cảnh GAME / app giáo viên (không có tổ tiên `.m3`): TheCau không đổi một lớp, một kiểu nội tuyến nào', () => {
  for (const duong of ['/hs', '/']) {
    it(`đường ${duong}: gốc thẻ chỉ mang lớp the-cau, không lớp m3 ở đâu; kiểu nội tuyến gốc còn nguyên (44 px của Đ/S, 56 px ô nhập…)`, () => {
      datDuong(duong)
      const a = render(<TheCau {...P1} onSelect={() => {}} />)
      expect(a.container.querySelector('[class*="m3"]')).toBeNull()
      const the = a.container.querySelector('[data-ui-card="content"]') as HTMLElement
      expect(the.className).toBe('the-cau')
      expect(the.getAttribute('style')).toContain('background: var(--the)')
      expect(the.getAttribute('style')).toContain('box-shadow: var(--bong-1)')
      a.unmount()
      const b = render(<TheCau {...P2} onSelect={() => {}} />)
      expect(b.container.querySelector('[class*="m3"]')).toBeNull()
      const nut = b.container.querySelector('.y-nut button') as HTMLElement
      expect(nut.getAttribute('style')).toMatch(/width: 64px/)
      expect(nut.getAttribute('style')).toMatch(/min-height: 44px/) // ba-loi-0609 khoá 44 px ở kiểu nội tuyến
      b.unmount()
      const c = render(<TheCau {...P3} onChange={() => {}} />)
      expect(c.container.querySelector('[class*="m3"]')).toBeNull()
      expect(c.container.querySelector('input')!.getAttribute('style')).toMatch(/min-height: 56px/)
    })
  }
})

describe('dưới tổ tiên `.m3`: hành vi y hệt (chỉ đổi phần nhìn)', () => {
  const boc = (ui: React.ReactElement) => render(<div className="m3">{ui}</div>)

  it('Phần I: chạm CẢ HÀNG trả chữ cái GỐC; data-trang-thai đúng; chữ "A." còn trong DOM (test khác đọc mã A./a) )', () => {
    const onSelect = vi.fn()
    const { container } = boc(<TheCau {...P1} choicePerm={[2, 0, 1, 3]} onSelect={onSelect} />)
    const hang = container.querySelectorAll('.pa-hang')
    expect(hang).toHaveLength(4)
    expect(Array.from(hang).map((h) => h.getAttribute('data-trang-thai'))).toEqual(['trong', 'trong', 'trong', 'trong'])
    fireEvent.click(hang[0])
    expect(onSelect).toHaveBeenCalledWith('C')
    expect(container.querySelector('.pa-ma')!.textContent).toBe('A.')
  })

  it('Phần II: 8 nút Đúng/Sai gọi onSelect(chỉ số ý gốc, D|S); đã chọn thì data-trang-thai=chon', () => {
    const onSelect = vi.fn()
    const { container, rerender } = boc(<TheCau {...P2} onSelect={onSelect} />)
    const nut = container.querySelectorAll('.y-nut button')
    expect(nut).toHaveLength(8)
    fireEvent.click(nut[3])
    expect(onSelect).toHaveBeenCalledWith(1, 'S')
    rerender(<div className="m3"><TheCau {...P2} selected={['D', null, null, null]} onSelect={onSelect} /></div>)
    expect(container.querySelector('.y-nut button')!.getAttribute('data-trang-thai')).toBe('chon')
  })

  it('Phần III: ô nhập số giữ inputMode=decimal, gõ là gọi onChange, nút đổi dấu / dấu phẩy còn', () => {
    const onChange = vi.fn()
    const { container } = boc(<TheCau {...P3} onChange={onChange} />)
    const o = container.querySelector('input') as HTMLInputElement
    expect(o.getAttribute('inputmode')).toBe('decimal')
    fireEvent.change(o, { target: { value: '12,5' } })
    expect(onChange).toHaveBeenCalledWith('12,5')
    expect(screen.getByRole('button', { name: 'Thêm dấu âm' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Thêm dấu phẩy' })).toBeTruthy()
  })

  it('xem lại: đúng ✓ (aria-label đúng), em chọn sai ✗ (aria-label sai) — hai trạng thái vẫn có nhãn riêng', () => {
    const { container } = boc(<TheCau {...P1} cheDo="xem_lai" selected="A" correct="B" />)
    expect(Array.from(container.querySelectorAll('.pa-hang')).map((h) => h.getAttribute('data-trang-thai'))).toEqual(['sai', 'dung', 'trong', 'trong'])
    expect(container.querySelector('[aria-label="đúng"]')).toBeTruthy()
    expect(container.querySelector('[aria-label="sai"]')).toBeTruthy()
  })
})

describe('TheCau.tsx: chỉ thêm đúng một dòng nạp CSS; mọi chuỗi mà test khác khoá còn nguyên', () => {
  it('không đụng logic / chuỗi khoá (xao-y-phan-hai, danh-dau-cau-hoi-lai, ba-loi-0609)', () => {
    const t = doc('src/components/TheCau.tsx')
    expect(t).toContain("import './m3/the-cau.css'")
    expect(t).toContain("const k = (['a', 'b', 'c', 'd'] as const)[i]")
    expect(t).toContain("ma={`${'abcd'[viTri]})`}")
    expect(t).toContain('{props.cauHoiLai && <DaiHoiLai')
    expect(t).toContain('minHeight: 44')
    expect(t).toContain('inputMode="decimal"')
    expect(t).not.toContain('dungM3') // commit 1 chưa bật M3 theo route: game (/hs) cũng dùng TheCau
  })
})
