// @vitest-environment jsdom
// LINH VẬT «MOL» — MẶT BÌNH CẦU (thầy chốt 01/11: «Chọn Mol bình cầu, thêm cả cáu, rất cáu nữa nhé. Đặt tên linh vật là Mol thôi»; bản vẽ docs/ban-ve-mol-0111).
// Khoá: đủ 11 mặt; cấp giận 2 dỗi · 3 bực · 4 CÁU · 5 RẤT CÁU (đầu đỏ dần, rất cáu có hơi nước + run); trạng thái cũ map đúng mặt; chạm ⇒ ngạc nhiên rồi về
// (đang giận thì không); tĩnh ⇒ không chuyển động; huỷ ⇒ gỡ sạch; ≤ 130 nút SVG (luật tốc độ 28/10); không màu thô; tên «Mol» trên màn.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAT_THEO_CAP, MAT_THEO_TRANG_THAI, MOL_DANG_SONG, VIEWBOX_MOL, svgMol, taoLua, type MatMol } from '../src/components/linh-vat/mol-dong'
import { TRANG_THAI_LUA } from '../src/components/linh-vat/lua-dong'

const MAT: MatMol[] = ['vui', 'khen', 'chao', 'nghi', 'ngac', 'buon', 'ngu', 'doi', 'buc', 'cau', 'ratCau']
const moi = (o: Parameters<typeof taoLua>[1] = {}) => { const s = document.createElement('span'); s.className = 'bi lua'; document.body.appendChild(s); return { s, l: taoLua(s, o) } }
afterEach(() => { vi.useRealTimers(); document.body.innerHTML = '' })

describe('Mol — hình', () => {
  it('11 mặt dựng được, khung 200 : 230, mỗi mặt ≤ 130 nút SVG; mặt khác nhau thì hình khác nhau', () => {
    expect(VIEWBOX_MOL).toBe('0 -26 200 230')
    const ve = new Set<string>()
    for (const m of MAT) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.innerHTML = svgMol(m)
      expect(svg.querySelectorAll('*').length + 1, m).toBeLessThanOrEqual(130)
      ve.add(svgMol(m).replace(/molb?\d+/g, 'id'))
    }
    expect(ve.size).toBe(MAT.length)
  })
  it('mọi trạng thái cũ của Lửa có mặt Mol; cấp giận 2–5 ⇒ dỗi · bực · cáu · rất cáu', () => {
    for (const t of TRANG_THAI_LUA) expect(MAT, t).toContain(MAT_THEO_TRANG_THAI[t])
    expect(MAT_THEO_CAP).toEqual({ 2: 'doi', 3: 'buc', 4: 'cau', 5: 'ratCau' })
  })
  it('giận = dung dịch sôi: cáu ⇒ đỏ cam dâng tới miệng; rất cáu ⇒ đỏ dâng sát mắt + hơi nước; mặt thường dung dịch cam ở cằm', () => {
    const cau = svgMol('cau'), rat = svgMol('ratCau'), vui = svgMol('vui')
    const dang = (x: string) => Number(/translate\(0 (-?\d+)\)/.exec(x)![1])
    expect(dang(vui)).toBe(0); expect(dang(cau)).toBeLessThan(0); expect(dang(rat)).toBeLessThan(dang(cau))
    expect(vui).toMatch(/class="m-cam mol-nuoc-cam"/); expect(cau).toMatch(/class="m-soi mol-nuoc-cam"/); expect(rat).toMatch(/class="m-soi2 mol-nuoc-cam"/)
    expect(cau).toContain('m-net-do'); expect(cau).not.toContain('mol-hoi')
    expect(rat).toContain('m-net-do'); expect(rat).toContain('mol-hoi')
    expect(vui).not.toContain('mol-hoi'); expect(vui).not.toContain('m-net-do')
  })
})

describe('Mol — bộ máy (giữ giao diện Lua)', () => {
  it('cấp 4 ⇒ mặt cáu + giật; cấp 5 ⇒ rất cáu + run; hạ cấp ⇒ về mặt theo trạng thái; data-cap-ve cho biểu tượng tab', () => {
    const { l } = moi({ trangThai: 'vui' })
    expect(l.svg.getAttribute('data-mat')).toBe('vui')
    l.datCap(4); expect(l.cap).toBe(4)
    expect(l.svg.getAttribute('data-mat')).toBe('cau'); expect(l.svg.getAttribute('data-dong')).toBe('giat'); expect(l.svg.getAttribute('data-cap-ve')).toBe('4')
    l.datCap(5)
    expect(l.svg.getAttribute('data-mat')).toBe('ratCau'); expect(l.svg.getAttribute('data-dong')).toBe('run')
    l.datCap(1)
    expect(l.cap).toBe(0); expect(l.svg.getAttribute('data-mat')).toBe('vui'); expect(l.svg.hasAttribute('data-cap-ve')).toBe(false)
    l.huy()
  })
  it('chạm ⇒ ngạc nhiên 0,9 giây rồi về; đang giận (cấp ≥ 2) chạm không đổi mặt', () => {
    vi.useFakeTimers()
    const { l } = moi({ trangThai: 'chao' })
    l.svg.dispatchEvent(new Event('click'))
    expect(l.svg.getAttribute('data-mat')).toBe('ngac')
    vi.advanceTimersByTime(1000)
    expect(l.svg.getAttribute('data-mat')).toBe('chao')
    l.datCap(3); l.svg.dispatchEvent(new Event('click'))
    expect(l.svg.getAttribute('data-mat')).toBe('buc')
    l.huy()
  })
  it('mừng xong về vui (sau / ve); nói ⇒ miệng mấp máy rồi thôi; tĩnh ⇒ không chuyển động; huỷ ⇒ gỡ sạch', () => {
    vi.useFakeTimers()
    const { s, l } = moi({ trangThai: 'combo', tuyChon: { sau: 600, ve: 'vui' } })
    expect(l.svg.getAttribute('data-dong')).toBe('nhun')
    vi.advanceTimersByTime(700); expect(l.trangThai).toBe('vui')
    l.noi('Học tiếp nhé'); expect(l.svg.classList.contains('mol-noi')).toBe(true)
    vi.advanceTimersByTime(7000); expect(l.svg.classList.contains('mol-noi')).toBe(false)
    const t = moi({ trangThai: 'combo', tinh: true }).l
    expect(t.svg.hasAttribute('data-tinh')).toBe(true); expect(t.svg.hasAttribute('data-dong')).toBe(false)
    expect(MOL_DANG_SONG.size).toBe(2)
    l.huy(); t.huy()
    expect(s.querySelector('svg')).toBeNull(); expect(MOL_DANG_SONG.size).toBe(0)
  })
})

describe('Mol — màu, nạp lười, tên', () => {
  it('không màu thô trong mol-dong.ts / mol.css; màu chỉ từ token có sẵn; giảm chuyển động / máy yếu tắt hoạt ảnh', () => {
    const ts = readFileSync('src/components/linh-vat/mol-dong.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const css = readFileSync('src/styles/mol.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const x of [ts, css]) { expect(x).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); expect(x).not.toMatch(/\b(?:rgba?|hsla?)\(/) }
    for (const k of ['--tr-gv', '--cam', '--tr-sai', '--btg-chu-doan']) expect(css).toContain(`var(${k})`)
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.mol-svg \* \{ animation: none !important; \} \}/)
    expect(css).toMatch(/html\.may-yeu \.mol-svg \* \{ animation: none !important; \}/)
  })
  it('Bi.tsx nạp Mol bằng import() (mảnh lười, kho chạy-lúc); tên «Mol» ở lời nói + nút', () => {
    expect(readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')).toMatch(/import\('\.\/mol-dong'\)/)
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/'\*\*\/mol-dong-\*\.\{js,css\}'/)
    const loi = readFileSync('src/lib/lua-cam-xuc.ts', 'utf8')
    for (const c of ['Mol vui lắm', 'Mol cáu lắm rồi!', 'Mol giận rồi!', 'Mol bực rồi đấy!']) expect(loi).toContain(c)
    expect(loi).not.toMatch(/`(?:Em làm thật, )?Lửa (?:vui|cáu|giận|bực)/)
    for (const t of ['src/components/kiem-tra-duo/BiNop.tsx', 'src/components/hoc-tap/ManKiemTraCaNhan.tsx']) expect(readFileSync(t, 'utf8')).toContain('Cùng Mol ôn lại nhé!')
  })
})
