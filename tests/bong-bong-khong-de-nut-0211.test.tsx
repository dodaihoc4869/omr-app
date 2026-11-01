// BONG BÓNG MOL KHÔNG BAO GIỜ ĐÈ NÚT + SỐ «VƯỢT MỨC» — thầy 02/11, hai ảnh thật (máy thầy, nền tối, màn Lộ trình):
//  1) bong bóng «Hôm nay có Kiểm tra ôn tập. Em làm xong là mở khoá các chặng nhé.» đè nút tròn KIỂM TRA ÔN TẬP (vòng tiến độ + nhãn) ngay trên Mol:
//     luật né cũ chỉ nâng / thu hẹp, hết cách thì giữ chỗ mặc định (vẫn đè) và không tính vòng tiến độ tràn ngoài nút.
//  2) dải xanh «Đủ 17/12 câu hôm nay!» — làm vượt mức mà viết như phân số ⇒ «Đủ mức hôm nay! Đã làm 17 câu (mức 12)».
// Toạ độ dưới đây chép từ ảnh thật (điện thoại 390 px, ảnh 1248 px ⇒ chia 3,2).
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import { chuCauMuc, vuotMuc } from '../src/components/hoc-tap/lam-bai'
import { chonChoBong, giaoHop, RONG_TOI_THIEU, type Hop, type VaoChoBong } from '../src/lib/bong-bong-mol'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const H = (left: number, top: number, right: number, bottom: number): Hop => ({ left, top, right, bottom })
// câu dài 450 px chữ, đệm + viền 26 px, dòng 21 px, đệm dọc 18 px — bong bóng xuống dòng khi hẹp lại
const kho = (rong: number) => { const dong = Math.ceil(450 / (rong - 26)); return { w: Math.min(rong, Math.ceil(450 / dong) + 26), h: dong * 21 + 18 } }
// đường đi ảnh thật: nút KT ôn tập (vòng 110 px + nhãn) ngay trên Mol; nút chặng ✓ bên trái Mol; rương dưới trái; các nút sau ở dưới
const DUONG = H(16, 300, 374, 900)
const NUT_KT = H(143, 373, 223, 447), VONG_KT = H(128, 355, 238, 465), NHAN_KT = H(119, 327, 247, 357)
const NUT_XONG = H(104, 453, 176, 517), RUONG = H(93, 540, 181, 617), NUT_SAU = [H(147, 668, 219, 732), H(200, 768, 272, 832)]
const MOL = H(216, 445, 320, 533), NEO = { x: 268, y: 485 }
const VAT = [NUT_KT, VONG_KT, NHAN_KT, NUT_XONG, RUONG, ...NUT_SAU]
const anh = (them: Partial<VaoChoBong> = {}): VaoChoBong => ({ duong: DUONG, neo: NEO, mol: MOL, vat: VAT, kho, ...them })
const khongDe = (h: Hop, vat: readonly Hop[]) => vat.every((n) => !giaoHop(h, n, 0))

describe('chọn chỗ bong bóng theo khung thật (src/lib/bong-bong-mol.ts)', () => {
  it('ẢNH THẬT: nút KT ôn tập ngay trên Mol ⇒ không đặt trên đầu (đè vòng / nhãn), sang DƯỚI Mol thu hẹp né rương — không chạm nút nào, trong đường đi', () => {
    const kq = chonChoBong(anh())
    expect(kq.cho).toBe('duoi')
    expect(khongDe(kq.bong.hop, VAT)).toBe(true)
    expect(VAT.some((n) => giaoHop(kq.bong.hop, n))).toBe(false) // cả khe 6 px
    expect(kq.bong.hop.top).toBeGreaterThanOrEqual(MOL.bottom) // nằm dưới Mol
    expect(kq.bong.hop.left).toBeGreaterThanOrEqual(DUONG.left); expect(kq.bong.hop.right).toBeLessThanOrEqual(DUONG.right)
    expect(kq.bong.rong).toBeGreaterThanOrEqual(RONG_TOI_THIEU)
    // luật cũ (giữ chỗ mặc định trên đầu Mol) đè nút KT: đúng lỗi trong ảnh
    const cu = H(115, 422 - kho(280).h, 115 + kho(280).w, 422)
    expect(giaoHop(cu, NUT_KT, 0) && giaoHop(cu, VONG_KT, 0)).toBe(true)
  })
  it('đường trống ⇒ vẫn trên đầu Mol như cũ (không đổi gì khi không vướng)', () => {
    const kq = chonChoBong(anh({ vat: [NUT_XONG, RUONG] }))
    expect(kq.cho).toBe('tren')
    expect(kq.bong.nang).toBe(0)
    expect(kq.bong.hop.bottom).toBe(NEO.y - 54 - 9)
  })
  it('vướng ít ⇒ nâng lên trên nút trước (còn trong đường đi)', () => {
    const kq = chonChoBong(anh({ vat: [H(120, 405, 200, 430)] }))
    expect(kq.cho).toBe('tren'); expect(kq.bong.nang).toBeGreaterThan(0)
    expect(khongDe(kq.bong.hop, [H(120, 405, 200, 430)])).toBe(true)
  })
  it('màn ngang rộng, trên / dưới đều vướng ⇒ đặt CẠNH Mol phía trống', () => {
    const duong = H(0, 300, 800, 900), mol = H(560, 445, 664, 533), neo = { x: 612, y: 485 }
    const vat = [H(380, 300, 760, 440), H(380, 538, 760, 700)]
    const kq = chonChoBong({ duong, neo, mol, vat, kho })
    expect(kq.cho).toBe('canh')
    expect(khongDe(kq.bong.hop, vat)).toBe(true)
  })
  it('không chỗ nào trống ⇒ THU THÀNH NÚT NHỎ cạnh Mol, nút nhỏ cũng không đè nút; chỗ «chạm để đọc» = chỗ ít đè nhất', () => {
    const vat = [...VAT, H(16, 300, 374, 440), H(16, 536, 374, 900), H(16, 440, 214, 536)]
    const kq = chonChoBong(anh({ vat }))
    expect(kq.cho).toBeNull()
    const chip = H(NEO.x + kq.chip!.trai, NEO.y + kq.chip!.tren, NEO.x + kq.chip!.trai + 40, NEO.y + kq.chip!.tren + 40)
    expect(khongDe(chip, vat)).toBe(true)
    expect(chip.left).toBeGreaterThanOrEqual(DUONG.left); expect(chip.right).toBeLessThanOrEqual(DUONG.right)
  })
})

// ───── dựng thật MotTrangHs (jsdom không dàn trang ⇒ giả khung theo ảnh) ─────
const mo = Date.UTC(2026, 10, 2, 1, 0)
const KIEM: TomTatKiemTra = { id: 'k', ngay: '2026-11-02', moLuc: mo, hanLuc: mo + 86400_000, serverNow: mo + 3600_000, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
  tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
const noop = () => {}
const p = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 17, muc: 12, chang: 2, soChang: 2 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Bài 9. Amino acid (P1)', viec: 'Hiểu · Chặng 2/2',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [],
  kiem: KIEM, onKiemTra: noop, ...them,
})
const goc = { rect: Element.prototype.getBoundingClientRect, range: Range.prototype.getClientRects }
function giaKhung(vat: 'anh' | 'kin') {
  const DR = (h: Hop) => ({ ...h, x: h.left, y: h.top, width: h.right - h.left, height: h.bottom - h.top, toJSON: () => h }) as DOMRect
  const dem = 26
  Range.prototype.getClientRects = function () {
    const ben = (this.startContainer as Element).closest?.('.da-lv-loi-o') as HTMLElement | null
    const rong = parseFloat(ben?.style.getPropertyValue('--rong') || '280'), d = kho(rong)
    return Array.from({ length: (d.h - 18) / 21 }, () => ({ left: 0, right: d.w - dem })) as unknown as DOMRectList
  }
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const e = this as HTMLElement
    if (e.matches('.da-duong')) return DR(DUONG)
    if (e.matches('.da-lv-loi-o')) return DR(H(NEO.x, NEO.y, NEO.x, NEO.y))
    if (e.matches('.da-linh-vat[data-lv="bi"]')) return DR(MOL)
    if (e.matches('.bi-loi-bong')) { const w = parseFloat(e.style.width) || 280, d = kho(Math.max(w, 140)); return DR(H(0, 0, w, d.h)) }
    if (e.matches('.da-nut[data-loai="kiem"]')) return DR(NUT_KT)
    if (e.matches('.da-nut[data-loai="kiem"] .da-vong')) return DR(VONG_KT)
    if (e.matches('.da-nut[data-loai="kiem"] .da-bong')) return DR(NHAN_KT)
    if (e.matches('.da-ruong-nut')) return DR(RUONG)
    if (e.matches('.da-nut')) {
      const ds = Array.from(document.querySelectorAll('.da-nut:not([data-loai="kiem"])')), i = ds.indexOf(e)
      return DR(vat === 'kin' ? H(16, 300 + i * 1, 374, 900) : [NUT_XONG, ...NUT_SAU][i] ?? H(147, 868, 219, 899))
    }
    return DR(H(0, 0, 0, 0))
  }
}
afterEach(() => {
  Element.prototype.getBoundingClientRect = goc.rect; Range.prototype.getClientRects = goc.range
  cleanup(); vi.useRealTimers(); localStorage.clear()
})

describe('Lộ trình dựng thật — dữ liệu giống ảnh thầy 02/11', () => {
  it('bong bóng «Hôm nay có Kiểm tra ôn tập…» KHÔNG đè nút KT ôn tập: chọn chỗ dưới Mol, bong bóng không chạm nút / vòng / nhãn / rương', () => {
    vi.useFakeTimers(); vi.setSystemTime(mo + 3600_000)
    giaKhung('anh')
    const { container } = render(<MotTrangHs {...p()} />)
    const neo = container.querySelector<HTMLElement>('.da-lv-loi-o')!
    expect(neo.querySelector('.bi-loi-bong')!.textContent).toContain('Kiểm tra ôn tập')
    expect(neo.dataset.cho).toBe('duoi')
    const so = (k: string) => parseFloat(neo.style.getPropertyValue(k))
    const w = parseFloat(neo.querySelector<HTMLElement>('.bi-loi-bong')!.style.width), h = kho(Math.max(w, 140)).h
    const top = NEO.y + so('--tren') + 9, left = NEO.x + so('--trai')
    expect(khongDe(H(left, top, left + w, top + h), VAT)).toBe(true)
    expect(container.querySelector('.da-lv-chip')).toBeNull() // còn chỗ trống ⇒ không thu thành nút nhỏ
  })
  it('đường kín hết ⇒ nút nhỏ «Mol nhắn» (chạm để đọc, bong bóng ẩn, không tự mờ); chạm ⇒ đọc rồi tự mờ', () => {
    vi.useFakeTimers(); vi.setSystemTime(mo + 3600_000)
    giaKhung('kin')
    const { container } = render(<MotTrangHs {...p()} />)
    const neo = container.querySelector<HTMLElement>('.da-lv-loi-o')!
    expect(neo.dataset.cho).toBe('gon')
    const chip = container.querySelector<HTMLButtonElement>('.da-lv-chip')!
    expect(chip.getAttribute('aria-label')).toMatch(/^Mol nhắn: .*Kiểm tra ôn tập/)
    act(() => { vi.advanceTimersByTime(8000) })
    expect(container.querySelector('.da-lv-chip')).not.toBeNull() // nút nhỏ chờ em chạm, không tự mờ
    fireEvent.click(chip)
    expect(neo.dataset.cho).not.toBe('gon') // đang đọc: bong bóng hiện
    expect(container.querySelector('.da-lv-chip')).toBeNull()
    act(() => { vi.advanceTimersByTime(6500) })
    expect(neo.querySelector('.bi-loi-boc')).toBeNull() // đọc xong tự mờ như thường
  })
  it('né MỌI thứ bấm được / nhãn / vòng trên đường đi, đo lại khi bố cục đổi (ResizeObserver · MutationObserver · xoay · cuộn xong · phông chữ)', () => {
    const tsx = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')
    expect(tsx).toContain(`d.querySelectorAll('button, [role="button"], a[href], .da-vong, .da-bong, .da-dem')`)
    expect(tsx).toContain('new ResizeObserver(() => datCho())'); expect(tsx).toContain('new MutationObserver(')
    expect(tsx).toContain("window.addEventListener('resize', henDat)"); expect(tsx).toContain("window.addEventListener('scrollend', henDat")
    expect(tsx).toContain('document.fonts?.ready.then(henDat)')
    const css = readFileSync('src/styles/trong-hs.css', 'utf8')
    expect(css).toContain("[data-trong='hs'] .da-lv-loi-o[data-cho='gon'] > .bi-loi-boc { visibility: hidden; }")
    expect(css).toMatch(/\.da-lv-loi-o\[data-cho='duoi'\] [^{]+::before \{ top: -9px; bottom: auto; transform: rotate\(135deg\); \}/)
    expect(css).toMatch(/\.da-lv-loi-o \.da-lv-chip \{[^}]*pointer-events: auto;/)
  })
})

describe('số «đã làm / mức» khi VƯỢT mức', () => {
  it('17 câu, mức 12 ⇒ không viết «17/12»', () => {
    expect(vuotMuc({ daLam: 17, muc: 12 })).toBe(true); expect(vuotMuc({ daLam: 12, muc: 12 })).toBe(false)
    expect(chuCauMuc({ daLam: 17, muc: 12 })).toBe('17 câu (mức 12)'); expect(chuCauMuc({ daLam: 12, muc: 30 })).toBe('12/30 câu')
  })
  it('dải xanh Lộ trình: «Đủ mức hôm nay! Đã làm 17 câu (mức 12)»; đúng bằng mức vẫn «Đủ 12/12 câu hôm nay!»', () => {
    vi.useFakeTimers(); vi.setSystemTime(mo + 3600_000)
    const { container, unmount } = render(<MotTrangHs {...p()} />)
    const dai = container.querySelector('.da-bang[data-sac="dung"]')!
    expect(dai.textContent!.replace(/\u00a0/g, ' ')).toContain('Đủ mức hôm nay! Đã làm 17 câu (mức 12)') // cụm «Đã làm 17 câu (mức 12)» không tách dòng
    expect(container.textContent).not.toContain('17/12')
    unmount()
    const { container: c2 } = render(<MotTrangHs {...p({ so: { daLam: 12, muc: 12, chang: 2, soChang: 2 } as PropsMotTrang['so'] })} />)
    expect(c2.querySelector('.da-bang[data-sac="dung"]')!.textContent).toContain('Đủ 12/12 câu hôm nay!')
  })
})
