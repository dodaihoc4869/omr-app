// Việc C · C6 (Code 4): KhungXemPhieu — khung toàn màn bao phiếu HTML — mặc M3 CHỈ ở cổng học sinh / phụ huynh (dungM3()).
// Khung còn được app giáo viên dùng chung (tờ máy chiếu, NutPhieuHtml) nên điều khoá số một là ĐỘ CÔ LẬP:
// ngoài M3 khung ra đúng DOM cũ (`.lop-xem-phieu` + `.nut-dong-phieu`), không một lớp / kiểu nội tuyến nào khác.
// Hành vi (Esc, quay lại, nút Đóng, hàm dong mới nhất) do tests/khung-xem-phieu.test.tsx khoá; ở đây khoá lại cho nhánh M3.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import KhungXemPhieu from '../src/components/KhungXemPhieu'
import { ThanhTren } from '../src/components/m3'
import { CSS_PHIEU_M3, dungPhieu } from '../src/lib/html-phieu'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

const goc = process.cwd()
const doc = (p: string) => fs.readFileSync(path.join(goc, p), 'utf8')
const datDuong = (d: string) => window.history.replaceState(null, '', d)
afterEach(() => {
  cleanup()
  datDuong('/')
})

const CSS = doc('src/components/m3/khung-xem-phieu.css')
const goc_ = () => document.querySelector('.lop-xem-phieu') as HTMLElement
const khungFrame = () => goc_().querySelector('iframe') as HTMLIFrameElement

/** Tách khối luật `selector { … }` (phẳng) của tệp CSS. */
function cacLuat(css: string) {
  const sach = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...sach.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ chon: m[1].split(',').map((s) => s.trim()).filter(Boolean), noiDung: m[2] }))
}
const luat = (chon: string) => cacLuat(CSS).find((r) => r.chon.includes(chon))!

describe('ngoài M3 (đường giáo viên, tờ máy chiếu): khung ra ĐÚNG DOM cũ', () => {
  for (const duong of ['/', '/gv']) {
    it(`đường ${duong}: gốc chỉ có lớp lop-xem-phieu, nút X cũ còn nguyên, không lớp m3 / thanh M3 ở đâu, iframe vẫn nền giấy`, () => {
      datDuong(duong)
      render(<KhungXemPhieu html="<p>x</p>" ten="Phiếu bài tập" dong={() => {}} />)
      expect(goc_().className).toBe('lop-xem-phieu')
      expect(goc_().getAttribute('style')).toBe('left: 0px; z-index: 99999;')
      expect(document.querySelector('[class*="m3"]')).toBeNull()
      expect(document.querySelector('.khung-phieu-thanh')).toBeNull()
      const nut = document.querySelectorAll('.nut-dong-phieu')
      expect(nut).toHaveLength(1)
      expect(nut[0].getAttribute('aria-label')).toBe('Đóng')
      expect(nut[0].getAttribute('title')).toBe('Đóng (Esc, hoặc vuốt quay lại)')
      expect(goc_().querySelectorAll('button')).toHaveLength(1)
      expect(khungFrame().getAttribute('style')).toContain('background: var(--p-giay)')
      expect(khungFrame().getAttribute('srcdoc')).toBe('<p>x</p>')
      expect(khungFrame().getAttribute('allow')).toBe('fullscreen')
    })
  }

  it('tờ máy chiếu (tên có "chiếu") là đồ của thầy: KHÔNG mặc M3 kể cả khi đường vào là cổng học sinh', () => {
    datDuong('/hs')
    render(<KhungXemPhieu html="<p>x</p>" ten="Tờ máy chiếu — gọi lên bảng" dong={() => {}} />)
    expect(goc_().className).toBe('lop-xem-phieu')
    expect(document.querySelector('[class*="m3"]')).toBeNull()
    expect(document.querySelector('.nut-dong-phieu')).toBeTruthy()
    expect(khungFrame().getAttribute('style')).toContain('background: var(--p-giay)')
  })
})

describe('cổng học sinh / phụ huynh (dungM3()): khung mặc M3 — một thanh trên, nút Đóng tròn 48 px, nền surface', () => {
  for (const duong of ['/hs', '/ph', '/?examCode=ABC123', '/?vai=phieu']) {
    it(`đường ${duong}: gốc mang lop-xem-phieu + m3; thanh trên đứng ĐẦU khung, có tên phiếu và đúng một nút Đóng (dấu X, m3-nut-tron); nút X nổi cũ biến mất`, () => {
      datDuong(duong)
      render(<KhungXemPhieu html="<p>x</p>" ten="Đề em vừa làm" dong={() => {}} />)
      const g = goc_()
      expect(g.classList.contains('lop-xem-phieu') && g.classList.contains('m3')).toBe(true)
      expect(g.getAttribute('role')).toBe('dialog')
      expect(g.getAttribute('aria-modal')).toBe('true')
      expect(g.getAttribute('aria-label')).toBe('Đề em vừa làm')
      expect(g.getAttribute('style')).toBe('left: 0px; z-index: 99999;')
      const thanh = g.firstElementChild as HTMLElement
      expect(thanh.className).toBe('khung-phieu-thanh')
      expect(thanh.querySelector('.m3-thanh-tren-ten')!.textContent).toBe('Đề em vừa làm')
      const nut = g.querySelectorAll('button')
      expect(nut).toHaveLength(1)
      expect(thanh.contains(nut[0])).toBe(true)
      expect(nut[0].getAttribute('aria-label')).toBe('Đóng')
      expect(nut[0].classList.contains('m3-nut-tron')).toBe(true)
      expect(nut[0].querySelector('.lucide-x')).toBeTruthy()
      expect(nut[0].querySelector('.lucide-arrow-left')).toBeNull()
      expect(document.querySelector('.nut-dong-phieu')).toBeNull()
    })
  }

  it('không có `ten` thì tên trên thanh là "Phiếu bài tập" (cùng nhãn aria của hộp thoại)', () => {
    datDuong('/hs')
    render(<KhungXemPhieu html="<p>x</p>" dong={() => {}} />)
    expect(goc_().getAttribute('aria-label')).toBe('Phiếu bài tập')
    expect(goc_().querySelector('.m3-thanh-tren-ten')!.textContent).toBe('Phiếu bài tập')
  })

  it('iframe: nền surface (không còn nền giấy trắng loé lên trước khi phiếu vẽ); srcDoc / src và quyền toàn màn hình vẫn nguyên', () => {
    datDuong('/hs')
    render(<KhungXemPhieu html="<p>x</p>" ten="Đề em vừa làm" dong={() => {}} />)
    expect(khungFrame().getAttribute('style')).toContain('background: var(--m3-surface)')
    expect(khungFrame().getAttribute('style')).not.toContain('--p-giay')
    expect(khungFrame().getAttribute('srcdoc')).toBe('<p>x</p>')
    expect(khungFrame().getAttribute('allow')).toBe('fullscreen')
    cleanup()
    render(<KhungXemPhieu src="https://may.test/bao-cao#m1" ten="Báo cáo phụ huynh sẽ thấy" dong={() => {}} />)
    expect(khungFrame().getAttribute('src')).toBe('https://may.test/bao-cao#m1')
    expect(khungFrame().hasAttribute('srcdoc')).toBe(false)
  })

  it('HÀNH VI y hệt: bấm Đóng / Esc / quay lại đều gọi dong, và gọi hàm MỚI NHẤT sau khi cha vẽ lại', () => {
    datDuong('/hs')
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const cu = vi.fn()
    const moi = vi.fn()
    const r = render(<KhungXemPhieu html="<p>x</p>" ten="Đề" dong={cu} />)
    r.rerender(<KhungXemPhieu html="<p>x</p>" ten="Đề" dong={moi} />)
    fireEvent.click(goc_().querySelector('button[aria-label="Đóng"]') as HTMLElement)
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.popState(window)
    expect(cu).not.toHaveBeenCalled()
    expect(moi).toHaveBeenCalledTimes(3)
    vi.restoreAllMocks()
  })

  it('phiếu M3 (có thanh dính riêng .gd-tren) đi vào iframe nguyên vẹn — khung không sửa gì trong phiếu, và chỉ có MỘT nút Đóng ở ngoài phiếu', () => {
    datDuong('/hs')
    const cau = [{ phan: 'I', id: 'q1', maDe: 'X', chuyenDe: 'Este', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', chot: 'c', lyDo: null, buoc: ['b'], ketQua: '' }] as CauLuyen[]
    const html = dungPhieu({ hoTen: 'Minh', sbd: '12001', ngay: new Date(2026, 8, 19), tenChuyenDe: 'Este', ketQua: '', hienDapAn: true }, cau, { nop: { ma: 'abcd1234ef', sbd: '12001', url: 'https://may.test/exec' } })
    expect(html).toContain('id="gd-tren"')
    render(<KhungXemPhieu html={html} ten="Đề em vừa làm" dong={() => {}} />)
    expect(khungFrame().getAttribute('srcdoc')).toBe(html)
    expect(goc_().querySelectorAll('button[aria-label="Đóng"]')).toHaveLength(1)
  })
})

describe('m3/khung-xem-phieu.css — một thanh, cùng nền surface với thanh dính của phiếu, không viền đôi', () => {
  it('khung: nền surface; chừa đúng bề cao thanh (56 px = nút 48 px + 4 px hai đầu) + tai thỏ; thanh cũng chừa tai thỏ', () => {
    const goc0 = luat('.m3.lop-xem-phieu').noiDung
    expect(goc0).toMatch(/--khung-phieu-cao-thanh:\s*56px/)
    expect(goc0).toMatch(/padding-top:\s*calc\(var\(--khung-phieu-cao-thanh\)\s*\+\s*env\(safe-area-inset-top\)\)/)
    expect(goc0).toMatch(/background:\s*var\(--m3-surface\)/)
    const thanh = luat('.m3 .khung-phieu-thanh').noiDung
    expect(thanh).toMatch(/position:\s*absolute/)
    expect(thanh).toMatch(/padding:\s*env\(safe-area-inset-top\)/)
    expect(thanh).toMatch(/background:\s*var\(--m3-surface\)/)
    expect(luat('.m3 .khung-phieu-thanh .m3-thanh-tren').noiDung).toMatch(/min-height:\s*var\(--khung-phieu-cao-thanh\)/)
  })

  it('thanh KHÔNG có viền, KHÔNG có bóng (phiếu đã có bóng cao độ 1 ở .gd-tren — thêm nữa là viền đôi)', () => {
    for (const r of cacLuat(CSS).filter((l) => l.chon.some((s) => s.includes('khung-phieu-thanh')))) {
      expect(r.noiDung, r.chon.join()).not.toMatch(/border|box-shadow|outline/)
    }
    expect(CSS_PHIEU_M3).toMatch(/\.gd-tren \{[^}]*box-shadow:\s*var\(--gm-cao1\)/)
  })

  it('bề cao thanh ≥ đích chạm: nút Đóng là m3-nut-tron 48 × 48 px và thanh cao hơn 48 px', () => {
    expect(doc('src/components/m3/m3.css')).toMatch(/\.m3-nut-tron \{[^}]*width:\s*48px;[^}]*height:\s*48px/)
    const cao = Number(/--khung-phieu-cao-thanh:\s*(\d+)px/.exec(CSS)![1])
    expect(cao).toBeGreaterThanOrEqual(48 + 2 * 4)
  })

  it('cùng MỘT màu nền với thanh dính của phiếu: bảng surface của m3-theme.css == --gm-surface của phiếu, sáng và tối (không có đường ghép)', () => {
    const hex = (r: string, g: string, b: string) => [r, g, b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
    const theme = new Set([...doc('src/components/bang-nhiem-vu/m3-theme.css').matchAll(/--m3-surface:\s*rgb\((\d+) (\d+) (\d+)\)/g)].map((m) => hex(m[1], m[2], m[3])))
    const phieu = new Set([...CSS_PHIEU_M3.matchAll(/--gm-surface:\s*#([0-9a-fA-F]{6})/g)].map((m) => m[1].toLowerCase()))
    expect(theme.size).toBe(2)
    expect([...phieu].sort()).toEqual([...theme].sort())
    expect(CSS_PHIEU_M3).toMatch(/\.gd-tren \{[^}]*background:\s*var\(--gm-surface\)/)
  })

  it('tên phiếu dài không đẩy tràn ngang: cắt bằng dấu ba chấm', () => {
    const t = luat('.m3 .khung-phieu-thanh .m3-thanh-tren-ten').noiDung
    expect(t).toMatch(/text-overflow:\s*ellipsis/)
    expect(t).toMatch(/white-space:\s*nowrap/)
    expect(t).toMatch(/overflow:\s*hidden/)
  })

  it('kỷ luật thư viện M3: không !important, không mã màu #, không khai lại biến --m3-*, mọi bộ chọn bắt đầu bằng `.m3`', () => {
    expect(CSS.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain('!important')
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(CSS).not.toMatch(/--m3-[a-z-]+\s*:/)
    for (const r of cacLuat(CSS)) for (const s of r.chon) expect(s.startsWith('.m3'), s).toBe(true)
  })
})

describe('index.css và KhungXemPhieu.tsx: nhánh cũ nguyên vẹn, chỉ thêm móc M3', () => {
  it('luật `.lop-xem-phieu` / `.nut-dong-phieu` của index.css không đổi (48 px + tai thỏ; nút 34 px nổi góc)', () => {
    const css = doc('src/index.css')
    expect(css).toMatch(/\.lop-xem-phieu \{[^}]*padding-top:\s*calc\(48px \+ env\(safe-area-inset-top\)\);[^}]*background:\s*var\(--p-giay\)/)
    expect(css).toMatch(/\.nut-dong-phieu \{[^}]*width:\s*34px;[^}]*height:\s*34px/)
  })

  it('M3 chỉ bật khi `!isMayChieu && dungM3()`; nút X cũ chỉ vẽ khi KHÔNG M3; nền iframe rẽ nhánh theo cờ', () => {
    const t = doc('src/components/KhungXemPhieu.tsx')
    expect(t).toContain('const m3 = !isMayChieu && dungM3()')
    expect(t).toContain("className={m3 ? 'lop-xem-phieu m3' : 'lop-xem-phieu'}")
    expect(t).toContain('{!m3 && (')
    expect(t).toContain("background: m3 ? 'var(--m3-surface)' : 'var(--p-giay)'")
    expect(t).toContain("import './m3/khung-xem-phieu.css'")
    // hai chuỗi mà test khác khoá còn nguyên
    expect(t).toContain('className="nut-dong-phieu"')
    expect(t).toContain('title="Đóng (Esc, hoặc vuốt quay lại)"')
  })
})

describe('ThanhTren: thêm `bieuTuong` tuỳ chọn, mặc định vẫn là mũi tên quay lại', () => {
  it('không truyền bieuTuong → ArrowLeft như cũ; truyền → thay đúng biểu tượng, nhãn aria vẫn theo nhanQuayLai', () => {
    const a = render(<ThanhTren tieuDe="Vào phòng thi" onQuayLai={() => {}} />)
    expect(a.container.querySelector('.lucide-arrow-left')).toBeTruthy()
    expect(a.container.querySelector('button')!.getAttribute('aria-label')).toBe('Quay lại')
    a.unmount()
    const b = render(<ThanhTren tieuDe="Phiếu" onQuayLai={() => {}} nhanQuayLai="Đóng" bieuTuong={<span data-x="1" />} />)
    expect(b.container.querySelector('.lucide-arrow-left')).toBeNull()
    expect(b.container.querySelector('button [data-x="1"]')).toBeTruthy()
    expect(b.container.querySelector('button')!.getAttribute('aria-label')).toBe('Đóng')
  })
})
