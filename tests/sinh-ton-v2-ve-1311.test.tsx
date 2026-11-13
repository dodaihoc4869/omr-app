// TRÒ «SINH TỒN · TRANG VỞ» bản 2 · PHẦN VẼ + MÀN (thầy duyệt bản vẽ 13/11: docs/ban-ve-sinh-ton-v2-1311/, đặc tả docs/dac-ta-sinh-ton-v2-1311.md).
// Khoá: nền LUÔN TỐI đọc --st-* (không đọc --tr-nen), ô mẫu nền đúng số nguyên điểm ảnh thiết bị, 6 vạch cấp súng, máy bù mang tên như học sinh (không «Máy»
// ở màn em lẫn màn chiếu), câu hô con dấu (MỞ BÀI!, chuỗi hạ), BẢN ÊM phòng chờ ca không con dấu + không chữ «trượt», phông viết tay chỉ đi theo mảnh lười.
import { readFileSync } from 'node:fs'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TroSinhTon from '../src/components/live-khoi/TroSinhTon'
import { BIEN_ST, taoBangMau, type Rgb } from '../src/components/live-khoi/sinh-ton-hinh'
import { CONG_THUC, O_MAU, lamTronTi } from '../src/components/live-khoi/sinh-ton-san'
import { XEP_DOI, cauChuoi, duoiBiHa } from '../src/components/live-khoi/sinh-ton-ve'
import { KHO_TEN } from '../src/lib/live-khoi/ten-may'
import type { KenhLop, NguoiLop, TinLop } from '../src/lib/live-khoi/kieu'

const doc = (p: string) => readFileSync(p, 'utf8')

describe('nền luôn tối — trò đọc --st-*', () => {
  it('tokens.css khai đúng năm biến nền Duolingo tối', () => {
    const t = doc('src/styles/tokens.css')
    for (const [bien, gt] of [['--st-nen', '#131f24'], ['--st-mat', '#202f36'], ['--st-vien', '#37464f'], ['--st-vien-2', '#1a282e'], ['--st-chu', '#f1f7fb']]) expect(t).toContain(`${bien}: ${gt};`)
  })
  it('bảng màu đọc nền / thẻ / kẻ / chữ từ --st-* và KHÔNG đọc --tr-nen (máy để sáng vẫn tối)', () => {
    const da: string[] = []
    const b = taoBangMau((bien: string, macDinh: Rgb) => { da.push(bien); return bien === '--st-nen' ? [19, 31, 36] : macDinh })
    for (const bien of BIEN_ST) expect(da).toContain(bien)
    expect(da).not.toContain('--tr-nen')
    expect(da).not.toContain('--tr-chu')
    expect(b.giay).toEqual([19, 31, 36])
    for (const bien of ['--p-cam', '--p-tim-2', '--p-xanh', '--p-do']) expect(da).toContain(bien)
  })
  it('khung trò tô nền bằng var(--st-nen), chữ var(--st-chu)', () => {
    const css = doc('src/components/live-khoi/tro-sinh-ton.css')
    expect(css).toMatch(/\.st \{[^}]*background: var\(--st-nen\);[^}]*color: var\(--st-chu\)/)
  })
})

describe('ô mẫu nền theo điểm ảnh thiết bị', () => {
  it('256 · ti · dpr luôn là số nguyên và lệch tỉ lệ ít hơn nửa điểm ảnh của ô', () => {
    for (const dpr of [1, 1.5, 2, 2.625, 3]) for (const ti of [0.21, 0.5, 0.795, 1.07, 1.37, 1.7]) {
      const t = lamTronTi(ti, dpr), n = O_MAU * t * dpr
      expect(Math.abs(n - Math.round(n))).toBeLessThan(1e-6)
      expect(Math.abs(t - ti) * O_MAU * dpr).toBeLessThanOrEqual(0.5 + 1e-9)
    }
  })
  it('năm công thức giữ đúng chỉ số dưới', () => {
    const chu = CONG_THUC.map((c) => c[2])
    expect(chu).toEqual(['2Na + 2H₂O → 2NaOH + H₂↑', '2K + 2H₂O → 2KOH + H₂↑', 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag', 'Ca + 2H₂O → Ca(OH)₂ + H₂↑', 'CaCO₃ → CaO + CO₂↑ (t°)'])
  })
})

describe('câu hô', () => {
  it('chuỗi hạ 2 · 3 · 4 · từ 5 và hạng đội cuối ván', () => {
    expect([1, 2, 3, 4, 5, 9].map(cauChuoi)).toEqual(['', 'Đỗ tốt nghiệp!', 'Đỗ đại học!', 'Á khoa!', 'Không ai cản nổi!', 'Không ai cản nổi!'])
    expect(XEP_DOI).toEqual(['Đỗ thủ khoa', 'Đỗ á khoa', 'Đỗ vớt', 'Thi lại ván sau'])
  })
  it('bản êm không dùng chữ «trượt» ở thẻ bị hạ', () => {
    expect(duoiBiHa(false)).toContain('trượt')
    expect(duoiBiHa(true)).toBe('vừa hạ em')
  })
})

// ── Màn thật trong jsdom: canvas giả (mọi lệnh vẽ là không làm gì), không chạy vòng khung — chỉ kiểm lớp DOM + kênh lớp ──
function ctxGia(): CanvasRenderingContext2D {
  const dich: Record<string | symbol, unknown> = {}
  return new Proxy(dich, {
    get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 10 }) : k === 'createPattern' ? () => ({}) : () => undefined),
    set: (t, k, v) => { t[k] = v; return true },
  }) as unknown as CanvasRenderingContext2D
}
const DS: NguoiLop[] = [{ sbd: 'S0', ten: 'Nguyễn Thị Hà', doi: 0 }, { sbd: 'S2', ten: 'Lê Gia Huy', doi: 1 }]
function moTro(p: { banEm?: boolean; xemThoi?: boolean } = {}) {
  const nghe: ((t: TinLop) => void)[] = []
  const kenh: KenhLop = { gui: () => {}, nghe: (_k, f) => { nghe.push(f); return () => {} } }
  const r = render(<TroSinhTon toi={p.xemThoi ? null : DS[0]} ds={DS} kenh={kenh} soEm={2} xemThoi={p.xemThoi} banEm={p.banEm} />)
  const anh = (x: unknown) => act(() => { for (const f of nghe) f({ t: 'lop', k: 'tro', x, l: Date.now() } as unknown as TinLop) })
  return { ...r, anh }
}
/** Ảnh chụp: máy bù «~3-1» (chỉ số tên 3 trong kho) hạ em S2. */
const ANH_MAY_HA = { ds: { S0: [400, 400, 100, 0, 1, ''], S2: [600, 400, 0, 1, 1, ''], '~3-1': [700, 420, 100, 2, 2, 'S2'] }, an: [['~3-1', 'S2']], d: [0, 0, 1, 0], v: 1, c: 0, h: [-1, ''] }

describe('màn trò (jsdom)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ctxGia()) as never)
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    localStorage.clear()
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it('thanh cấp súng có ĐỦ 6 vạch, cấp 1 tô một vạch', () => {
    const { container } = moTro()
    expect(container.querySelectorAll('.st-sung .st-vach i')).toHaveLength(6)
    expect(container.querySelectorAll('.st-sung .st-vach i[data-co]')).toHaveLength(1)
    expect(container.querySelector('.st-sung')!.getAttribute('aria-label')).toContain('trên 6')
  })

  it('máy bù hiện TÊN như học sinh (tenMay), không có chữ «Máy» — ở máy em và máy thầy', () => {
    for (const xemThoi of [false, true]) {
      const { container, anh, unmount } = moTro({ xemThoi })
      anh(ANH_MAY_HA)
      const tin = container.querySelector('.st-tin')!.textContent!
      expect(tin).toContain(`${KHO_TEN[3]} hạ Gia Huy`)
      expect(container.textContent).not.toMatch(/\bMáy\b/)
      unmount()
    }
  })

  it('lượt hạ đầu ván ⇒ con dấu «MỞ BÀI!»; em hạ 2 bạn liên tiếp ⇒ «ĐỖ TỐT NGHIỆP!» + dòng tin chuỗi', () => {
    const { container, anh } = moTro()
    anh(ANH_MAY_HA)
    expect(container.querySelector('.st-dau b')?.textContent).toBe('MỞ BÀI!')
    anh({ ...ANH_MAY_HA, an: [['S0', 'S2']] })
    anh({ ...ANH_MAY_HA, an: [['S0', '~3-1']] })
    expect(container.querySelector('.st-dau b')?.textContent).toBe('ĐỖ TỐT NGHIỆP!')
    expect(container.querySelector('.st-tin')!.textContent).toContain('Em chuỗi 2 · Đỗ tốt nghiệp!')
  })

  it('BẢN ÊM (phòng chờ ca): không con dấu, không chữ «trượt», dòng trạng thái của ca', () => {
    const { container, anh } = moTro({ banEm: true })
    anh(ANH_MAY_HA)
    anh({ ...ANH_MAY_HA, an: [['S0', 'S2']] })
    anh({ ...ANH_MAY_HA, an: [['S0', '~3-1']] })
    expect(container.querySelector('.st-dau')).toBeNull()
    expect(container.textContent!.toLowerCase()).not.toContain('trượt')
    expect(container.querySelector('.st-cho')!.textContent).toContain('Phòng chờ ca')
    expect(container.querySelector('.st')!.getAttribute('data-em')).toBe('1')
  })
})

describe('nối dây', () => {
  it('sảnh ca truyền banEm (khác imLang); phòng chờ live không', () => {
    expect(doc('src/components/phong-cho/SanhSinhTon.tsx')).toMatch(/<TroSinhTon[^>]*\bimLang banEm\b/)
    expect(doc('src/components/live-khoi/LopNoiEm.tsx')).not.toMatch(/banEm/)
  })
  it('màn chiếu máy thầy: chip «N bạn đang chơi», không còn ô «Máy»', () => {
    const t = doc('src/components/live-khoi/LopNoiThay.tsx')
    expect(t).toContain('bạn đang chơi</small>')
    expect(t).not.toMatch(/>Máy</)
    expect(t).not.toMatch(/soMay} máy/)
  })
  it('phông viết tay chỉ khai trong tờ kiểu của trò + ngoài precache', () => {
    expect(doc('src/components/live-khoi/tro-sinh-ton.css')).toContain("url('../../assets/phong-sinh-ton/patrick-hand-latin-400-normal.woff2')")
    expect(doc('vite.config.ts')).toContain("'**/patrick-hand-*.woff2'")
    expect(doc('src/assets/phong-sinh-ton/OFL.txt')).toMatch(/SIL OPEN FONT LICENSE/i)
  })
})
