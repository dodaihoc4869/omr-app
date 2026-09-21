// BẢNG TIN KIỂU SÀN GIAO DỊCH · cụm (b): biểu đồ NẾN "Nhịp học trực tiếp" (Boss giao 21/09). Canvas được thay bằng bộ ghi lệnh vẽ để kiểm ĐÚNG những gì được vẽ:
// nhãn giá bám giá trị hiện tại, "còn mm:ss", nhãn giờ, màu nến xanh/đỏ theo tăng/giảm, nội suy giữa hai lần hỏi (không bịa nến), giảm chuyển động, thiếu nến ⇒ ẩn, chú giải rõ "tỉ lệ đúng trong 5 phút".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { kiemTraKhop, phay, conLai, gioPhutMs } from '../src/lib/bang-tin-san/trang-thai'
import { phatSuKienGia, taoDuLieuGia } from '../src/lib/bang-tin-san/mau-gia'
import type { NenSan } from '../src/lib/bang-tin-san/kieu'
import BangTinSan from '../src/components/bang-tin-san/BangTinSan'
import { NEN_MS, NenHoc, veNen } from '../src/components/bang-tin-san/NenHoc'
import type { MauSan } from '../src/components/bang-tin-san/hooks'

const NAY = Date.parse('2026-09-21T08:28:36.000Z') // 15:28:36 giờ VN
const MAU: MauSan = {
  nen: 'rgb(1,1,1)', mat: 'rgb(2,2,2)', 'mat-2': 'rgb(3,3,3)', vien: 'rgb(4,4,4)', chu: 'rgb(5,5,5)', 'chu-phu': 'rgb(6,6,6)', 'chu-mo': 'rgb(7,7,7)', duong: 'rgb(8,8,255)',
  la: 'rgb(10,200,10)', do: 'rgb(220,10,10)', vang: 'rgb(12,12,12)', 'xam-o': 'rgb(13,13,13)', luoi: 'rgb(14,14,14)', 'tren-gia': 'rgb(15,15,15)',
}
const nenMau = (o: number, c: number, tu = 0): NenSan => ({ tu, mo: o, cao: Math.max(o, c) + 1, thap: Math.min(o, c) - 1, dong: c, soCau: 10 })

/** Bộ ghi lệnh vẽ: giữ mọi `fillText` (chữ + toạ độ) và chuỗi `fillStyle` tại mỗi lần `fill`. */
function ghiVe() {
  const chu: { t: string; x: number; y: number; mau: string }[] = []
  const fill: string[] = []
  const stroke: string[] = []
  const ctx: Record<string, unknown> = { fillStyle: '', strokeStyle: '', font: '', textAlign: '', textBaseline: '', lineWidth: 1, lineJoin: '' }
  for (const m of ['setTransform', 'clearRect', 'beginPath', 'moveTo', 'lineTo', 'arcTo', 'closePath', 'stroke', 'arc', 'setLineDash', 'fill']) {
    ctx[m] = m === 'fill' ? () => fill.push(String(ctx.fillStyle)) : m === 'stroke' ? () => stroke.push(String(ctx.strokeStyle)) : () => {}
  }
  ctx.fillText = (t: string, x: number, y: number) => chu.push({ t, x, y, mau: String(ctx.fillStyle) })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, chu, fill, stroke }
}
function canvasGia(w = 700, h = 300) {
  const g = ghiVe()
  const cv = document.createElement('canvas')
  cv.getBoundingClientRect = () => ({ width: w, height: h, left: 0, top: 0, right: w, bottom: h, x: 0, y: 0, toJSON() {} }) as DOMRect
  cv.getContext = (() => g.ctx) as unknown as HTMLCanvasElement['getContext']
  return { cv, ...g }
}
const hienMoi = () => ({ c: 0, h: 0, l: 0, v: 0, yMin: 0, yMax: 0, vMax: 0, soNen: -1, batDau: 0 })
const chuoiNen = (n: number, dong = 86): NenSan[] => Array.from({ length: n }, (_, i) => nenMau(dong - 0.2, dong, 12 * 3_600_000 - 7 * 3_600_000 + i * NEN_MS))

describe('veNen — những gì THẬT SỰ được vẽ', () => {
  it('không có nến hoặc hộp chưa có kích thước ⇒ trả false, không vẽ gì', () => {
    const { cv, chu } = canvasGia()
    expect(veNen(cv, [], NAY, hienMoi(), MAU, 0, true, 0)).toBe(false)
    const rong = canvasGia(1, 1)
    expect(veNen(rong.cv, chuoiNen(5), NAY, hienMoi(), MAU, 0, true, 0)).toBe(false)
    expect(chu).toHaveLength(0)
    expect(rong.chu).toHaveLength(0)
  })

  it('nhãn giá bám ĐÚNG giá trị nến cuối ("84,8 %") và "còn mm:ss" tới hết nến; xanh khi đóng ≥ mở, đỏ khi đóng < mở', () => {
    const tu = Math.floor(NAY / NEN_MS) * NEN_MS
    const tang = [...chuoiNen(8), { tu, mo: 84, cao: 86, thap: 83.5, dong: 84.8, soCau: 12 }]
    const a = canvasGia()
    veNen(a.cv, tang, NAY, hienMoi(), MAU, 0, true, 0)
    const gia = a.chu.find((c) => c.t === `${phay(84.8)} %`)!
    expect(gia).toBeTruthy()
    expect(gia.mau).toBe(MAU['tren-gia'])
    expect(a.fill).toContain(MAU.la) // nhãn giá + nến cuối màu xanh
    expect(a.chu.find((c) => c.t.startsWith('còn '))!.t).toBe(`còn ${conLai(tu + NEN_MS, NAY)}`)
    const giam = [...chuoiNen(8), { tu, mo: 86, cao: 86.5, thap: 83, dong: 84.8, soCau: 12 }]
    const b = canvasGia()
    veNen(b.cv, giam, NAY, hienMoi(), MAU, 0, true, 0)
    expect(b.fill[b.fill.length - 1]).toBe(MAU.do) // lần tô CUỐI CÙNG là nền nhãn giá ⇒ đỏ khi giá đang thấp hơn giá mở
    expect(a.fill[a.fill.length - 1]).toBe(MAU.la) // …và xanh khi giá cao hơn giá mở
  })

  it('màu từng nến theo TĂNG/GIẢM của chính nến ấy (không phải của nến cuối): 1 nến đỏ giữa chuỗi xanh ⇒ đúng 1 lần tô đỏ thân', () => {
    const tu = Math.floor(NAY / NEN_MS) * NEN_MS
    const nen = chuoiNen(9)
    nen[4] = nenMau(88, 85, nen[4]!.tu) // nến giảm
    const { cv, fill } = canvasGia()
    veNen(cv, [...nen, { tu, mo: 84, cao: 86, thap: 83.5, dong: 84.8, soCau: 12 }], NAY, hienMoi(), MAU, 0, true, 0)
    expect(fill.filter((f) => f === MAU.do)).toHaveLength(1)
    expect(fill.filter((f) => f === MAU.la).length).toBeGreaterThanOrEqual(9) // 8 nến tăng + nến cuối + nhãn giá
  })

  it('nhãn giờ trục dưới đúng giờ Việt Nam (nến bắt đầu 12:00 ⇒ có nhãn 12:00, 12:30 hoặc 13:00); nhãn cột "N câu" và nhãn % trục phải', () => {
    const tu0 = Date.parse('2026-09-21T05:00:00.000Z') // 12:00 VN
    const nen = Array.from({ length: 30 }, (_, i) => nenMau(86, 86.2, tu0 + i * NEN_MS))
    const { cv, chu } = canvasGia(900, 300)
    veNen(cv, nen, tu0 + 30 * NEN_MS, hienMoi(), MAU, 0, true, 0)
    const gio = chu.filter((c) => /^\d\d:\d\d$/.test(c.t)).map((c) => c.t)
    expect(gio.length).toBeGreaterThan(2)
    for (const g of gio) expect(['00', '30']).toContain(g.slice(3))
    expect(gio).toContain(gioPhutMs(tu0 + 6 * NEN_MS)) // 12:30
    expect(chu.some((c) => /^\d+ câu$/.test(c.t))).toBe(true)
    expect(chu.some((c) => /^\d+ %$/.test(c.t))).toBe(true)
  })

  it('mỗi nến hiện là một thân + một cột số câu; chỉ hiện đủ nến vừa khung (không tràn), nến CŨ nhất bị cắt trước', () => {
    const it = (n: number, w: number) => {
      const g = canvasGia(w, 300)
      veNen(g.cv, chuoiNen(n), NAY, hienMoi(), MAU, 0, true, 0)
      return g.fill.filter((f) => f === MAU.la || f === MAU.do).length // thân nến + nhãn giá (1)
    }
    expect(it(6, 700)).toBeGreaterThanOrEqual(6)
    expect(it(200, 700)).toBeLessThan(200) // 200 nến không vừa 700 px
    expect(it(200, 700)).toBeGreaterThan(it(200, 300)) // khung hẹp hiện ít nến hơn
  })

  it('khung hẹp: nhãn giờ chỉ thuộc các nến GẦN NHẤT (nến cũ nhất bị cắt trước, không phải nến mới)', () => {
    const tu0 = Date.parse('2026-09-21T05:00:00.000Z')
    const nen = Array.from({ length: 120 }, (_, i) => nenMau(86, 86.2, tu0 + i * NEN_MS)) // 10 giờ nến
    const { cv, chu } = canvasGia(420, 300)
    veNen(cv, nen, tu0 + 120 * NEN_MS, hienMoi(), MAU, 0, true, 0)
    const gio = chu.filter((c) => /^\d\d:\d\d$/.test(c.t)).map((c) => c.t)
    expect(gio.length).toBeGreaterThan(0)
    const cuoiGio = gioPhutMs(tu0 + 119 * NEN_MS) // 21:55
    expect(gio.every((g) => g >= '19:00' && g <= cuoiGio)).toBe(true) // toàn nhãn của những giờ cuối; không có 12:00, 13:00…
  })

  it('NỘI SUY: itDong=false, dt > 0 ⇒ giá hiện đuổi theo giá đích nhưng CHƯA tới; itDong=true ⇒ tới ngay; nến cuối KHÔNG bị bịa thêm', () => {
    const tu = Math.floor(NAY / NEN_MS) * NEN_MS
    const nen = [...chuoiNen(8), { tu, mo: 84, cao: 90, thap: 83, dong: 90, soCau: 12 }]
    const h = hienMoi()
    const g = canvasGia()
    veNen(g.cv, nen.map((n, i) => (i === nen.length - 1 ? { ...n, dong: 84 } : n)), NAY, h, MAU, 0, true, 0) // khởi tạo ở 84
    expect(h.c).toBe(84)
    veNen(g.cv, nen, NAY, h, MAU, 0.05, false, 0)
    expect(h.c).toBeGreaterThan(84)
    expect(h.c).toBeLessThan(90)
    expect(h.v).toBe(12) // số câu đứng yên khi đích không đổi
    const h3 = hienMoi()
    veNen(g.cv, nen, NAY, h3, MAU, 0, true, 0)
    veNen(g.cv, nen.map((n, i) => (i === nen.length - 1 ? { ...n, soCau: 20 } : n)), NAY, h3, MAU, 0.05, false, 0)
    expect(h3.v).toBeGreaterThan(12) // cột số câu cũng trượt về đích 20, chưa tới
    expect(h3.v).toBeLessThan(20)
    const h2 = { ...h }
    veNen(g.cv, nen, NAY, h2, MAU, 0, true, 0)
    expect(h2.c).toBe(90)
    expect(h.soNen).toBe(nen.length)
  })

  it('sang NẾN MỚI ⇒ đặt thẳng giá trị nến mới (không trượt từ nến cũ); bộ nến rút ngắn cũng vậy', () => {
    const tu = Math.floor(NAY / NEN_MS) * NEN_MS
    const nen = [...chuoiNen(8), { tu, mo: 86, cao: 87, thap: 85, dong: 86, soCau: 12 }]
    const h = hienMoi()
    const g = canvasGia()
    veNen(g.cv, nen, NAY, h, MAU, 0, true, 0)
    const sau = [...nen, { tu: tu + NEN_MS, mo: 86, cao: 86, thap: 86, dong: 86, soCau: 0 }]
    veNen(g.cv, sau, NAY + NEN_MS, h, MAU, 0.05, false, 0)
    expect(h.soNen).toBe(sau.length)
    expect(h.v).toBe(0) // số câu của nến mới: 0 chứ không nội suy từ 12
  })

  it('giảm chuyển động ⇒ KHÔNG vẽ vòng nhấp nháy quanh giá (không arc)', () => {
    const tu = Math.floor(NAY / NEN_MS) * NEN_MS
    const nen = [...chuoiNen(8), { tu, mo: 84, cao: 86, thap: 83.5, dong: 84.8, soCau: 12 }]
    let arcs = 0
    const g = canvasGia()
    ;(g.ctx as unknown as { arc: () => void }).arc = () => { arcs++ }
    veNen(g.cv, nen, NAY, hienMoi(), MAU, 0, true, 500)
    expect(arcs).toBe(0)
    veNen(g.cv, nen, NAY, hienMoi(), MAU, 0.016, false, 500)
    expect(arcs).toBe(1)
  })
})

describe('NenHoc — khối', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })
  const nenGia = () => taoDuLieuGia(NAY).nen!

  it('đầu khối: tiêu đề "Nhịp học trực tiếp" + Mở/Cao/Thấp/Hiện/số câu của NẾN CUỐI; nhãn canvas mô tả bằng chữ', () => {
    const nen = nenGia()
    const cuoi = nen[nen.length - 1]!
    const { container } = render(<NenHoc nen={nen} nowMs={NAY} mau={MAU} phienBanMau={1} itDong />)
    expect(container.querySelector('h2')!.textContent).toBe('Nhịp học trực tiếp')
    const o = container.querySelector('[data-khoi="ohlc"]')!.textContent!
    expect(o).toBe(`Mở ${phay(cuoi.mo)} · Cao ${phay(cuoi.cao)} · Thấp ${phay(cuoi.thap)} · Hiện ${phay(cuoi.dong)} % · ${cuoi.soCau} câu`)
    const cv = container.querySelector('canvas')!
    expect(cv.getAttribute('role')).toBe('img')
    expect(cv.getAttribute('aria-label')).toContain('nến')
    expect(cv.getAttribute('aria-describedby')).toBe('bts-ohlc')
  })

  it('đầu khối lấy ĐÚNG từng số của nến cuối: Mở ≠ Hiện khi nến chưa đóng ở giá mở', () => {
    const nen = [nenMau(80, 81), { tu: 1, mo: 82.4, cao: 89.9, thap: 79.2, dong: 85.1, soCau: 33 }]
    const { container } = render(<NenHoc nen={nen} nowMs={NAY} mau={MAU} phienBanMau={1} itDong />)
    expect(container.querySelector('[data-khoi="ohlc"]')!.textContent).toBe('Mở 82,4 · Cao 89,9 · Thấp 79,2 · Hiện 85,1 % · 33 câu')
  })

  it('giảm chuyển động ⇒ KHÔNG chạy vòng requestAnimationFrame; cho phép chuyển động ⇒ có', () => {
    const rAF = vi.spyOn(window, 'requestAnimationFrame')
    const nen = nenGia()
    const a = render(<NenHoc nen={nen} nowMs={NAY} mau={MAU} phienBanMau={1} itDong />)
    expect(rAF).not.toHaveBeenCalled()
    a.unmount()
    render(<NenHoc nen={nen} nowMs={NAY} mau={MAU} phienBanMau={1} itDong={false} />)
    expect(rAF).toHaveBeenCalled()
    rAF.mockRestore()
  })

  it('chú giải nói RÕ "tỉ lệ đúng trong 5 phút" (không lẫn ô "Tỉ lệ đúng" cả ngày) + xanh/đỏ/cột/đường mảnh', () => {
    const { container } = render(<NenHoc nen={nenGia()} nowMs={NAY} mau={MAU} phienBanMau={1} itDong />)
    const cg = container.querySelector('.bts-chu-giai')!.textContent!
    expect(cg).toContain('tỉ lệ đúng trong 5 phút')
    expect(cg).toContain('khác ô')
    expect(cg).toContain('Nến xanh: tăng trong 5 phút')
    expect(cg).toContain('Nến đỏ: giảm')
    expect(cg).toContain('Cột: số câu')
    expect(cg).toContain('Đường mảnh: trung bình 7 nến')
  })
})

describe('BangTinSan — nến trong khung', () => {
  beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }) })
  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it('có nến ⇒ hiện khối nến; thiếu nến (null hoặc rỗng) ⇒ ẨN khối nến (bản đồ lớp vẫn hiện); thiếu cả nến lẫn lớp ⇒ ẨN cả hàng chính; các khối khác vẫn hiện', () => {
    const d = taoDuLieuGia(NAY)
    const { container } = render(<BangTinSan du={d} nayMs={NAY} />)
    expect(container.querySelector('[data-khoi="nen"]')).toBeTruthy()
    cleanup()
    for (const nen of [null, []] as const) {
      const c = render(<BangTinSan du={{ ...d, nen }} nayMs={NAY} />).container
      expect(c.querySelector('[data-khoi="nen"]')).toBeNull()
      expect(c.querySelector('[data-khoi="ban-do-lop"]')).toBeTruthy()
      cleanup()
      const trong = render(<BangTinSan du={{ ...d, nen, theoLop: null }} nayMs={NAY} />).container
      expect(trong.querySelector('[data-khoi="hang-chinh"]')).toBeNull()
      expect(trong.querySelectorAll('.bts-o-so')).toHaveLength(4)
      cleanup()
    }
  })

  it('số câu các nến cộng đúng "Câu đã làm" (một nguồn) — cả sau nhiều sự kiện mô phỏng', () => {
    let d = taoDuLieuGia(NAY)
    for (let i = 0; i < 60; i++) d = phatSuKienGia(d, NAY + i * 700, 100 + i)
    expect(kiemTraKhop(d)).toEqual([])
    expect(d.nen!.reduce((t, n) => t + n.soCau, 0)).toBe(d.soCau)
  })
})

describe('phatSuKienGia — mô phỏng THUẦN và khớp', () => {
  it('không sửa bản cũ; +1 câu ở đúng một em / một lớp / tổng / nến cuối; sang khung 5 phút thì thêm nến mới', () => {
    const d0 = taoDuLieuGia(NAY)
    const snap = JSON.stringify(d0)
    const d1 = phatSuKienGia(d0, NAY + 1000, 5)
    expect(JSON.stringify(d0)).toBe(snap)
    expect(d1.soCau).toBe(d0.soCau + 1)
    expect(d1.nhiet!.reduce((t, e) => t + e.soCau, 0)).toBe(d0.nhiet!.reduce((t, e) => t + e.soCau, 0) + 1)
    expect(d1.nen!).toHaveLength(d0.nen!.length)
    expect(d1.nen![d1.nen!.length - 1]!.soCau).toBe(d0.nen![d0.nen!.length - 1]!.soCau + 1)
    const d2 = phatSuKienGia(d1, NAY + 6 * 60_000, 6)
    expect(d2.nen!).toHaveLength(d1.nen!.length + 1)
    expect(d2.nen![d2.nen!.length - 1]!.soCau).toBe(1)
    expect(d2.nen![d2.nen!.length - 1]!.mo).toBe(d1.nen![d1.nen!.length - 1]!.dong)
    expect(kiemTraKhop(d2)).toEqual([])
  })
})

describe('nguồn (b)', () => {
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')
  it('vòng vẽ dừng khi tab ẩn, giải phóng khi rời màn; không gọi mạng', () => {
    const t = doc('src/components/bang-tin-san/NenHoc.tsx')
    expect(t).toMatch(/document\.hidden/)
    expect(t).toMatch(/cancelAnimationFrame/)
    expect(t).not.toMatch(/fetch\(|goiLenh|Math\.random/)
  })
  it('không mã màu thô trong NenHoc; màu đọc từ `mau` (token)', () => {
    const t = doc('src/components/bang-tin-san/NenHoc.tsx')
    expect(t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(t).toMatch(/mau\.la/)
    expect(t).toMatch(/mau\.do/)
  })
})
