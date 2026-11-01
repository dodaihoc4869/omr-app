// BONG BÓNG TRÊN ĐẦU MOL CO THEO CHỮ — thầy 01/11 23h (ảnh thật «Đủ rồi! Vào học ngay!» rộng gấp đôi chữ): «Viền bong bóng phải gọn vừa với chữ nhé».
// Khoá: bề rộng bong bóng = dòng dài nhất + đệm (không thừa phải); đặt lại vị trí theo bề rộng thật, không tràn mép đường đi; đuôi nằm trong vùng đầu Mol.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { DUOI_BIEN, LECH_DUOI, MEP, RONG_TOI_DA, rongOmChu, viTriBong } from '../src/lib/bong-bong-mol'

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear() })

describe('hình học thuần', () => {
  it('ôm chữ: bề rộng = dòng dài nhất + đệm (nhiều dòng ⇒ theo dòng dài nhất, không theo khung)', () => {
    expect(rongOmChu([{ left: 100, right: 220 }], 28)).toBe(148) // một dòng ngắn: chữ 120 + đệm 2 × 13 + viền 2 × 1
    expect(rongOmChu([{ left: 100, right: 260 }, { left: 100, right: 230 }, { left: 100, right: 190 }], 30)).toBe(190)
    expect(rongOmChu([], 30)).toBeNull()
  })
  it('đặt theo bề rộng thật: câu ngắn căn trên đầu Mol, câu dài kẹp trong đường đi; đuôi luôn trong vùng đầu Mol (tâm − 40 … tâm)', () => {
    const duong = { left: 16, right: 374 }, tam = 299 // điện thoại 390 dọc: Mol đứng phải
    for (const w of [120, 160, 220, RONG_TOI_DA]) {
      const { trai, duoi } = viTriBong(duong, tam, w)
      const x = tam + trai
      expect(x, `w ${w}`).toBeGreaterThanOrEqual(duong.left + MEP)
      expect(x + w, `w ${w}`).toBeLessThanOrEqual(duong.right - MEP)
      expect(duoi).toBeGreaterThanOrEqual(DUOI_BIEN); expect(duoi).toBeLessThanOrEqual(w - DUOI_BIEN)
      const duoiX = x + duoi
      expect(duoiX, `w ${w}`).toBeGreaterThanOrEqual(tam - 40); expect(duoiX, `w ${w}`).toBeLessThanOrEqual(tam)
    }
    // câu ngắn (bong bóng hẹp) ⇒ nằm gọn trên đầu Mol, đuôi đúng tâm − LECH_DUOI
    const { trai, duoi } = viTriBong(duong, 200, 120)
    expect(trai).toBe(-60); expect(200 + trai + duoi).toBe(200 - LECH_DUOI)
    // ngang 844: đường đi rộng ⇒ vẫn ôm chữ, căn trên Mol
    const ng = viTriBong({ left: 16, right: 828 }, 600, 150)
    expect(ng.trai).toBe(-75); expect(600 + ng.trai + ng.duoi).toBe(600 - LECH_DUOI)
  })
})

describe('Lộ trình: bong bóng co theo chữ', () => {
  it('đo dòng dài nhất (Range) ⇒ đặt bề rộng ôm chữ, vị trí + đuôi theo bề rộng thật', () => {
    // jsdom không dàn trang: giả hai dòng chữ dài 80 và 64 px
    const goc = Range.prototype.getClientRects
    Range.prototype.getClientRects = function () { return [{ left: 0, right: 80 }, { left: 0, right: 64 }] as unknown as DOMRectList }
    try {
      vi.useFakeTimers()
      vi.setSystemTime(Date.UTC(2026, 9, 31, 3, 0))
      const noop = () => {}
      const p = {
        so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
        onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [],
      } as PropsMotTrang
      const { container } = render(<MotTrangHs {...p} />)
      const neo = container.querySelector<HTMLElement>('.da-lv-loi-o')!, bb = neo.querySelector<HTMLElement>('.bi-loi-bong')!
      const cs = getComputedStyle(bb), dem = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((t, k) => t + (parseFloat(cs[k as 'paddingLeft']) || 0), 0)
      const w = Math.min(150, 80 + dem + 1) // dòng dài nhất 80 + đệm + viền (+1 px an toàn), tối đa bề rộng cho phép
      expect(bb.style.width).toBe(`${w}px`)
      expect(w).toBeLessThan(150) // ôm chữ, KHÔNG giãn hết bề rộng tối đa
      const trai = parseFloat(neo.style.getPropertyValue('--trai')), duoi = parseFloat(neo.style.getPropertyValue('--duoi'))
      expect(duoi).toBeGreaterThanOrEqual(DUOI_BIEN); expect(duoi).toBeLessThanOrEqual(w - DUOI_BIEN)
      expect(Number.isFinite(trai)).toBe(true)
    } finally { Range.prototype.getClientRects = goc }
  })
  it('CSS: khung bong bóng co theo nội dung (max-content, tối đa --rong), chữ cân dòng; đệm ngang 13 px, dọc 9 px', () => {
    const css = readFileSync('src/styles/trong-hs.css', 'utf8')
    expect(css).toContain('width: max-content; max-width: var(--rong, 200px);')
    expect(css).toContain("[data-trong='hs'] .da-lv-loi-o .bi-loi-bong { flex: none; max-width: 100%; box-sizing: border-box; text-wrap: balance; }")
    expect(css).toContain('padding: 9px 13px; font-size: 15px;')
  })
})
