// LỜI GIẢI TRÊN PHIẾU IN, TỜ CHIẾU VÀ PDF — CÙNG CHUẨN HIỂN THỊ VỚI APP (thầy lệnh 06/10).
// Chuẩn: LỜI GIẢI → Kiến thức cốt lõi → từng phương án/ý ✓ ✗ → (Phần III) các bước → Kết quả.
// Nhãn đủ tương phản ≥4,5:1 ở mọi nền; không viền-trái nhấn ở khối lời giải.
import { describe, expect, it } from 'vitest'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import { oGiaiHtml, CSS_PHIEU } from '../src/lib/html-phieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { CSS_LEN_BANG_MOI } from '../src/lib/len-bang-moi-to-chieu'
import { NHAN_COT_LOI, NHAN_KET_QUA, NHAN_LOI_GIAI, NHAN_LOI_GIAI_NGAN } from '../src/lib/nhan-loi-giai'

const C = (o: Partial<CauLuyen>): CauLuyen =>
  ({ phan: 'I', id: 'x', chuyenDe: 'Ester – lipid', mucDo: 'biet', text: 'Đề', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'B', chot: 'Chốt kiến thức.', lyDo: null, buoc: null, ketQua: '', ...o }) as CauLuyen

const CAU_I = C({ lyDo: [{ khoa: 'A', ly: 'sai vì x' }, { khoa: 'B', ly: 'đúng vì y' }, { khoa: 'C', ly: 'sai vì z' }, { khoa: 'D', ly: 'sai vì t' }] as never })
const CAU_II = C({ phan: 'II', dapAn: 'DSDS', lyDo: [{ khoa: 'a', ly: 'ý a' }, { khoa: 'b', ly: 'ý b' }] as never })
const CAU_III = C({ phan: 'III', luaChon: null, dapAn: '306', buoc: ['bước một', 'bước hai'], ketQua: '306' })

const OBANG = (c: CauLuyen): OBang => ({ sbd: '12101', hoTen: 'Em A', soCau: 1, cau: c, viSao: 'v' }) as OBang
const html = (c: CauLuyen) => taoHtmlMayChieu([OBANG(c)])

function thuTu(h: string, ...mau: string[]) {
  let tu = 0
  for (const m of mau) {
    const i = h.indexOf(m, tu)
    expect(i, m).toBeGreaterThanOrEqual(0)
    tu = i + m.length
  }
}

// ── WCAG 2.x ──
type RGB = [number, number, number]
const tuyenTinh = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
const doSang = (c: RGB) => 0.2126 * tuyenTinh(c[0]) + 0.7152 * tuyenTinh(c[1]) + 0.0722 * tuyenTinh(c[2])
const tuongPhan = (a: RGB, b: RGB) => { const [x, y] = [doSang(a), doSang(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const hex = (s: string): RGB => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)) as RGB
function bienRgb(css: string, ten: string, trongKhoi: string): RGB {
  const m = new RegExp(`${ten}:rgb\\((\\d+) (\\d+) (\\d+)\\)`).exec(trongKhoi)
  expect(m, `${ten} trong ${css.slice(0, 20)}`).not.toBeNull()
  return [Number(m![1]), Number(m![2]), Number(m![3])]
}
const pha = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] * t + b[i] * (1 - t))) as RGB

describe('nhãn dùng chung', () => {
  it('đúng chữ chuẩn của app', () => {
    expect(NHAN_LOI_GIAI).toBe('LỜI GIẢI')
    expect(NHAN_COT_LOI).toBe('Kiến thức cốt lõi')
    expect(NHAN_LOI_GIAI_NGAN).toBe('Lời giải ngắn')
    expect(NHAN_KET_QUA).toBe('Kết quả')
  })
})

describe('phiếu in: oGiaiHtml theo chuẩn', () => {
  it('Phần I: LỜI GIẢI → Kiến thức cốt lõi → từng phương án; đáp án KHÔNG đứng đầu khối', () => {
    const h = oGiaiHtml(CAU_I)
    thuTu(h, '>LỜI GIẢI<', 'Kiến thức cốt lõi', 'sai vì x', 'đúng vì y', 'Đáp án:')
    expect(h.indexOf('sol-dap')).toBeGreaterThan(h.indexOf('Kiến thức cốt lõi'))
    expect(h).toContain('sol-dau dung') // ✓ phương án đúng
    expect(h).toContain('sol-dau sai')
  })
  it('Phần II: nhãn rồi từng ý', () => {
    thuTu(oGiaiHtml(CAU_II), '>LỜI GIẢI<', 'Kiến thức cốt lõi', 'ý a', 'ý b')
  })
  it('Phần III: LỜI GIẢI → cốt lõi → các bước → Đáp án → Kết quả cuối', () => {
    const h = oGiaiHtml(CAU_III)
    thuTu(h, '>LỜI GIẢI<', 'Kiến thức cốt lõi', 'Làm từng bước', 'bước hai', 'Kết quả')
    expect(h.lastIndexOf('Kết quả')).toBeGreaterThan(h.lastIndexOf('bước hai'))
    expect(h.indexOf('Đáp án:')).toBeLessThan(h.indexOf('>Kết quả<'))
  })
  it('chỉ có một đoạn chữ không tách được ⇒ nhãn "Lời giải ngắn"', () => {
    const h = oGiaiHtml(C({ chot: '', lyDo: null, buoc: null, loiGiai: 'Chọn B vì tính chất đặc trưng của ester.' } as never))
    expect(h).toContain(NHAN_LOI_GIAI_NGAN)
  })
  it('CSS phiếu: không viền-trái nhấn ở khối lời giải; nhãn tối hơn 4,5:1 trên nền kem', () => {
    const khoi = CSS_PHIEU.slice(CSS_PHIEU.indexOf('.sol-box {'), CSS_PHIEU.indexOf('.sol-ket {'))
    expect(khoi).not.toMatch(/border-left/)
    const nhan = /\.sol-label \{[^}]*color: (#[0-9a-f]{6})/.exec(khoi)![1]
    // Nền: kem 80% trên giấy trắng hoặc trên nền tối của trang.
    const kem = pha(hex('#fffbeb'), [255, 255, 255], 0.8)
    expect(tuongPhan(hex(nhan), kem)).toBeGreaterThanOrEqual(4.5)
    expect(tuongPhan(hex('#78350f'), kem)).toBeGreaterThanOrEqual(4.5) // chữ thân
  })
})

describe('tờ chiếu: lời giải theo chuẩn', () => {
  it('Phần I: LỜI GIẢI → Kiến thức cốt lõi → phương án; Phần III: Kết quả cuối', () => {
    const h = html(CAU_I)
    const giai = h.slice(h.indexOf('class="mc-giai"'))
    thuTu(giai, '>LỜI GIẢI<', 'Kiến thức cốt lõi', 'sai vì x', 'đúng vì y')
    const g3 = html(CAU_III)
    const kh = g3.slice(g3.indexOf('class="mc-giai"'))
    thuTu(kh, '>LỜI GIẢI<', 'Kiến thức cốt lõi', 'bước hai', '>Kết quả<')
  })
  it('không còn viền-trái nhấn ở khối lời giải (box, ý đúng, kiến thức cốt lõi)', () => {
    const h = html(CAU_I)
    const dong = h.split('\n').filter((l) => /\.sol-(box|pa|cot-loi)|\.mc-giai/.test(l) && /border-left/.test(l))
    expect(dong).toEqual([])
    expect(CSS_LEN_BANG_MOI).not.toMatch(/\.sol-[^{]*\{[^}]*border-left/)
  })
  it('nhãn LỜI GIẢI đủ tương phản ≥4,5:1 trên nền khối ở mọi kiểu giấy (sáng và tối)', () => {
    const sang = CSS_LEN_BANG_MOI.slice(CSS_LEN_BANG_MOI.indexOf(':root{--mc-ll-nen'), CSS_LEN_BANG_MOI.indexOf(':root[data-projector="dark"],:root[data-projector="matte-dark"]{--mc-ll-nen'))
    const toi = CSS_LEN_BANG_MOI.slice(CSS_LEN_BANG_MOI.indexOf(':root[data-projector="dark"],:root[data-projector="matte-dark"]{--mc-ll-nen'))
    const toiDong = toi.slice(0, toi.indexOf('}'))
    const sangDong = sang.slice(0, sang.indexOf('}'))
    for (const [css, kieu] of [[sangDong, 'sáng'], [toiDong, 'tối']] as const) {
      const nhan = bienRgb(css, '--mc-ll-nhan', css)
      const nen = bienRgb(css, '--mc-ll-nen', css)
      const chot = bienRgb(css, '--mc-ll-chot', css)
      expect(tuongPhan(nhan, nen), `nhãn/nền ${kieu}`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(nhan, chot), `nhãn/ô cốt lõi ${kieu}`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(bienRgb(css, '--mc-ll-dung', css), nen), `✓ ${kieu}`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(bienRgb(css, '--mc-ll-sai', css), nen), `✗ ${kieu}`).toBeGreaterThanOrEqual(4.5)
    }
    // Nền giấy của tờ (khi khối trong suốt): nhãn sáng trên 3 kiểu giấy sáng, nhãn tối trên 2 kiểu tối.
    for (const giay of ['#f4efe4', '#e6e1d3']) expect(tuongPhan(bienRgb(sangDong, '--mc-ll-nhan', sangDong), hex(giay))).toBeGreaterThanOrEqual(4.5)
    for (const giay of ['#30353a', '#23282d']) expect(tuongPhan(bienRgb(toiDong, '--mc-ll-nhan', toiDong), hex(giay))).toBeGreaterThanOrEqual(4.5)
  })
  it('hành vi cũ giữ nguyên: nút Thầy chữa / Ai sai và lời giải hiện dần', () => {
    const h = html(CAU_I)
    expect(h).toContain('mc-nut-giai')
    expect(h).toContain('sol-label')
  })
})
