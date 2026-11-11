// @vitest-environment jsdom
// BÚT + ĐỒNG BỘ NÉT (thầy 11/11) — LỚP VẼ MÁY EM (src/components/live/ve-bang.ts) + CÂY BÚT (tro-but.ts), canvas GIẢ (ghi lại lệnh vẽ).
// Khoá: nét bảng (mã «b_…») vào canvas trong khung cuộn, nét giấy vào lớp chốt cũ; máy em tự trôi theo bút / soi đúng độ cuộn thầy báo;
// đuôi nét dở = đúng đa giác nét xong (chốt nét không đổi hình); BÀN TAY CẦM BÚT dán lên lớp «đang viết», ngòi đúng đầu nét, lơ lửng thì trượt không nhảy;
// lớp rỗng thì ẩn.
// Điểm ảnh thật + khung hình thật: scripts/thu-live-1011/thu-but-1111.mjs.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoLoiBut, type DiemBut, type NetBut } from '../src/lib/but-bang-loi'
import { maTrang } from '../src/components/live/bo-cuc'
import { O_TAY, RO_TAY, coTay, taoTroBut, tiLeTay, veTay, type DangTay } from '../src/components/live/tro-but'
import { taoVeBang } from '../src/components/live/ve-bang'

type Lenh = { loai: 'fill' | 'net' | 'anh' | 'xoa'; mau: string; mo: number; T: number[]; duong: number[]; ts: number[]; anh?: HTMLCanvasElement }
interface CtxGia { lenh: Lenh[] }
function ctxGia(): CtxGia & Record<string, unknown> {
  const lenh: Lenh[] = []
  let T = [1, 0, 0, 1, 0, 0], duong: number[] = []
  const g: CtxGia & Record<string, unknown> = {
    lenh, globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '', strokeStyle: '', lineWidth: 1,
    setTransform: (...a: number[]) => { T = a }, beginPath: () => { duong = [] }, closePath: () => {}, save: () => {}, restore: () => {}, translate: () => {},
    moveTo: (x: number, y: number) => { duong.push(x, y) }, lineTo: (x: number, y: number) => { duong.push(x, y) },
    quadraticCurveTo: (a: number, b: number, x: number, y: number) => { duong.push(a, b, x, y) },
    bezierCurveTo: (...a: number[]) => { duong.push(...a) },
    // cung / elip: ghi hộp bao (đủ để soát hình có nằm trong ô không)
    arc: (x: number, y: number, r: number) => { duong.push(x - r, y - r, x + r, y + r) },
    ellipse: (x: number, y: number, rx: number, ry: number) => { const r = Math.max(rx, ry); duong.push(x - r, y - r, x + r, y + r) },
    fill: () => { lenh.push({ loai: 'fill', mau: String(g.fillStyle), mo: Number(g.globalAlpha), T: T.slice(), duong: duong.slice(), ts: [] }) },
    stroke: () => { lenh.push({ loai: 'net', mau: String(g.strokeStyle), mo: Number(g.globalAlpha), T: T.slice(), duong: duong.slice(), ts: [Number(g.lineWidth)] }) },
    drawImage: (anh: HTMLCanvasElement, ...a: number[]) => { lenh.push({ loai: 'anh', mau: '', mo: Number(g.globalAlpha), T: T.slice(), duong: [], ts: a, anh }) },
    clearRect: (...a: number[]) => { lenh.push({ loai: 'xoa', mau: '', mo: 1, T: T.slice(), duong: [], ts: a }) },
  }
  return g
}
const ctx = new WeakMap<HTMLCanvasElement, CtxGia>()
beforeEach(() => {
  ;(HTMLCanvasElement.prototype as unknown as { getContext: (this: HTMLCanvasElement) => unknown }).getContext = function () { let g = ctx.get(this); if (!g) { g = ctxGia(); ctx.set(this, g) } return g }
  document.body.innerHTML = ''
})
const L = taoLoiBut(), MAU = 'rgb(244,239,228)'
const BANG = [0.6667, 0.0185, 0.9948, 0.9194], GIAY = [0.0052, 0.0093, 0.6615, 0.9194]
const TRANG = maTrang('1', { giay: GIAY, bang: BANG }, false)
/** Lớp vẽ trên một «máy em» 1600 × 900 soi cả cửa sổ thầy (không lề), mật độ 1. */
function dung() {
  const nen = document.createElement('div'), cvChot = document.createElement('canvas'), cvSong = document.createElement('canvas')
  nen.append(cvChot, cvSong); document.body.append(nen)
  const v = taoVeBang(L, cvChot, cvSong)
  v.datKhung({ Wv: 1600, Hv: 900, ox: 0, oy: 0, w: 1600, h: 900, dpr: 1 })
  v.ap({ loai: 'trang', trang: TRANG, tiLe: 16 / 9, net: [] })
  const khung = nen.querySelector<HTMLDivElement>('.lv-cuon')!, cvBang = khung.querySelector('canvas')!
  const lenh = (c: HTMLCanvasElement) => ctx.get(c)!.lenh
  return { nen, cvChot, cvSong, cvBang, khung, v, lenh }
}
const net = (id: string, y0: number, n = 30, x0 = 0.72): NetBut => ({ id, cong: 'but', mau: MAU, co: 1.7, diem: Array.from({ length: n }, (_, i) => [x0 + i * 0.002, y0 + Math.sin(i / 5) * 0.01, 0.4, i * 5] as DiemBut) })
/** Chạy `n` khung hình 60 Hz kể từ `t`. */
const chay = (v: ReturnType<typeof taoVeBang>, n: number, t = 1000) => { for (let i = 0; i < n; i++) v.veSong(t + i * (1000 / 60)); return t + n * (1000 / 60) }

describe('bảng đen cuộn trên máy em', () => {
  it('khung cuộn nằm đúng ô bảng đen, DƯỚI lớp «đang viết»; nét bảng vào canvas trong khung cuộn, nét giấy vào lớp chốt cũ', () => {
    const m = dung()
    expect([...m.nen.children].map((e) => (e as HTMLElement).className || e.tagName)).toEqual(['CANVAS', 'lv-cuon', 'CANVAS'])
    expect(m.khung.style.overflow).toBe('hidden')
    const o = m.v.cuon().bang
    // ô bảng đi theo khoá trang (làm tròn phần nghìn cửa sổ thầy) rồi tròn theo điểm ảnh ⇒ lệch dưới 2 px
    for (const [co, muon] of [[o.x, BANG[0] * 1600], [o.y, BANG[1] * 900], [o.w, (BANG[2] - BANG[0]) * 1600], [o.h, (BANG[3] - BANG[1]) * 900]]) expect(Math.abs(co - muon)).toBeLessThan(2)
    const truocC = m.lenh(m.cvChot).filter((x) => x.loai === 'fill').length, truocB = m.lenh(m.cvBang).filter((x) => x.loai === 'fill').length
    // LỚP RỖNG THÌ ẨN (trình duyệt khỏi nộp lại canvas rỗng mỗi khung): chưa có nét nào ⇒ lớp giấy và khung bảng đều ẩn
    expect([m.cvChot.style.visibility, m.khung.style.visibility]).toEqual(['hidden', 'hidden'])
    // nét phấn (màu sáng) tô HAI lượt: lượt chính + lượt bù sáng 55 % (LoiBut.buSang) — mép nét đều sáng, nét mảnh không lổn nhổn
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('n1', 0.3, 30, 0.2), xong: true })
    expect(m.lenh(m.cvChot).filter((x) => x.loai === 'fill').map((x) => x.mo).slice(truocC)).toEqual([1, 0.55])
    expect(m.lenh(m.cvBang).filter((x) => x.loai === 'fill').length).toBe(truocB)
    expect([m.cvChot.style.visibility, m.khung.style.visibility]).toEqual(['', 'hidden'])
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_n2', 0.3), xong: true })
    expect([m.cvChot.style.visibility, m.khung.style.visibility]).toEqual(['', ''])
    expect(m.lenh(m.cvChot).filter((x) => x.loai === 'fill').length).toBe(truocC + 2)
    expect(m.lenh(m.cvBang).filter((x) => x.loai === 'fill').map((x) => x.mo).slice(truocB)).toEqual([1, 0.55])
    // mực sẫm (mực xanh trên giấy) không bù
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: { ...net('n3', 0.5, 30, 0.2), mau: 'rgb(36,86,201)' }, xong: true })
    expect(m.lenh(m.cvChot).filter((x) => x.loai === 'fill').length).toBe(truocC + 3)
    // xoá hết nét giấy ⇒ lớp giấy lại ẩn, khung bảng còn nét thì vẫn hiện; bảng mới trống ⇒ ẩn cả hai
    m.v.ap({ loai: 'xoa', trang: TRANG, id: ['n1', 'n3'] })
    expect([m.cvChot.style.visibility, m.khung.style.visibility]).toEqual(['hidden', ''])
    m.v.ap({ loai: 'trang', trang: TRANG, tiLe: 16 / 9, net: [] })
    expect([m.cvChot.style.visibility, m.khung.style.visibility]).toEqual(['hidden', 'hidden'])
  })
  it('nét bảng có y > 1 (thầy đã cuộn): máy em TỰ TRÔI tới — êm dần từng khung (không nhảy một phát), bút về khoảng giữa bảng; `toiPx` đã trừ độ cuộn', () => {
    const m = dung()
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_n1', 1.35), xong: true })
    const dich = m.v.cuon().dich
    expect(dich).toBeGreaterThan(0.6)
    expect(m.v.cuon().y).toBe(0)
    const vet: number[] = []
    for (let i = 0; i < 60; i++) { m.v.veSong(1000 + i * (1000 / 60)); vet.push(m.v.cuon().y) }
    for (let i = 1; i < vet.length; i++) expect(vet[i]).toBeGreaterThanOrEqual(vet[i - 1])
    expect(Math.max(...vet.slice(1).map((y, i) => y - vet[i])) * 900).toBeLessThan(dich * 900 * 0.25) // mỗi khung đi chưa tới 1/4 quãng
    expect(vet[vet.length - 1]).toBe(dich)
    // bút ở y = 1,35 hiện ở khoảng 40–70 % bề cao ô bảng
    const o = m.v.cuon().bang, [, py] = m.v.toiPx(0.8, 1.35, 'b_n1')
    expect((py - o.y) / o.h).toBeGreaterThan(0.4); expect((py - o.y) / o.h).toBeLessThan(0.7)
    expect(m.khung.firstElementChild!.getAttribute('style')).toContain(`translate3d(0,${-Math.round(dich * 900)}px,0)`)
    // điểm trên giấy đề không trừ độ cuộn; điểm trong cột bảng (không biết mã nét) thì trừ
    expect(m.v.toiPx(0.2, 0.5)[1]).toBe(450)
    expect(m.v.toiPx(0.8, 1.35)[1]).toBe(py)
  })
  it('thầy báo độ cuộn (`datBut(…, cuon)`): máy em soi ĐÚNG độ cuộn đó; bảng mới thì quên, lại tự trôi theo bút', () => {
    const m = dung()
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_n1', 1.35), xong: true })
    m.v.datBut({ x: 0.8, y: 0.9, cham: false }, 0.5)
    chay(m.v, 90)
    expect(m.v.cuon()).toMatchObject({ y: 0.5, dich: 0.5 })
    m.v.datBut({ x: 0.8, y: 0.9, cham: false }) // không truyền ⇒ giữ độ cuộn thầy đã báo
    chay(m.v, 5, 3000)
    expect(m.v.cuon().dich).toBe(0.5)
    m.v.datBut(null)
    m.v.ap({ loai: 'trang', trang: TRANG, tiLe: 16 / 9, net: [net('b_n9', 2.2)] })
    expect(m.v.cuon().y).toBeGreaterThan(1.2) // vào bảng có sẵn nét: tới thẳng chỗ nét bảng mới nhất, không trôi từ đầu
    expect(m.v.cuon().y).toBe(m.v.cuon().dich)
  })
})

describe('cỡ canvas theo mật độ (iPhone / iPad có trần bộ nhớ canvas)', () => {
  it('iPhone nằm ngang 932 × 430 ở mật độ 3: giữ đúng điểm ảnh thật (3,6 triệu); màn rất lớn: lớp chốt kẹp dưới 8 triệu điểm ảnh, cỡ hiện vẫn đúng', () => {
    const nen = document.createElement('div'), cvChot = document.createElement('canvas'), cvSong = document.createElement('canvas')
    nen.append(cvChot, cvSong); document.body.append(nen)
    const v = taoVeBang(L, cvChot, cvSong)
    v.datKhung({ Wv: 932, Hv: 524.25, ox: 0, oy: 47, w: 932, h: 430, dpr: 3 })
    expect([cvChot.width, cvChot.height]).toEqual([2796, 1290])
    v.datKhung({ Wv: 3200, Hv: 1800, ox: 0, oy: 0, w: 3200, h: 1800, dpr: 3 })
    expect(cvChot.width * cvChot.height).toBeLessThanOrEqual(8e6)
    expect(cvChot.width).toBeGreaterThanOrEqual(3200) // không hạ dưới mật độ 1
    expect(parseFloat(cvChot.style.width)).toBeCloseTo(3200, 6)
  })
})

describe('nét dở trên máy em = đúng nét xong; cây bút vẽ cùng lượt', () => {
  it('đuôi nét dở (đầu nét đã tới điểm cuối) và nét chốt là CÙNG một đa giác ⇒ chốt nét không đổi hình', () => {
    const m = dung(), n = net('b_n1', 0.4, 40)
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: { ...n, diem: n.diem.slice(0, 10) } })
    m.v.ap({ loai: 'them-diem', trang: TRANG, id: n.id, diem: n.diem.slice(10) })
    const c = n.diem[n.diem.length - 1]
    m.v.datDau([{ id: n.id, x: c[0], y: c[1] }])
    m.v.veSong(1000)
    const uot = m.lenh(m.cvSong).filter((x) => x.loai === 'fill' && x.duong.length > 40).pop()!
    m.v.ap({ loai: 'net-xong', trang: TRANG, id: n.id })
    const kho = m.lenh(m.cvBang).filter((x) => x.loai === 'fill').pop()!
    expect(uot.duong).toEqual(kho.duong)
    expect(uot.mau).toBe(MAU)
    // cùng chỗ trên màn: gốc lớp sống (sx, sy) + phép dời của nó = gốc canvas bảng trong hình
    const sx = /translate3d\(([-0-9.]+)px,([-0-9.]+)px/.exec(m.cvSong.style.transform)!, o = m.v.cuon().bang
    expect(uot.T[4] + Number(sx[1])).toBeCloseTo(kho.T[4] + o.x, 6)
    expect(uot.T[5] + Number(sx[2])).toBeCloseTo(kho.T[5] + o.y, 6)
  })
  it('bàn tay cầm bút dán lên lớp «đang viết»: ngòi ở đúng đầu nét; hình dựng sẵn MỘT lần, nhỏ; đứng im thì không vẽ lại; lơ lửng mờ dần; null thì ẩn', () => {
    const m = dung(), anh = () => m.lenh(m.cvSong).filter((x) => x.loai === 'anh')
    m.v.datBut({ x: 0.8, y: 0.3, cham: true, mau: 'rgb(255,210,122)' })
    m.v.veSong(1000)
    const dan = anh().pop()!
    const sx = /translate3d\(([-0-9.]+)px,([-0-9.]+)px/.exec(m.cvSong.style.transform)!
    const [px, py] = m.v.toiPx(0.8, 0.3)
    // gốc phép biến đổi lúc dán = chỗ ngòi bút; đang viết: rõ nhất, không ngả
    expect(dan.T[4] + Number(sx[1])).toBeCloseTo(px, 6); expect(dan.T[5] + Number(sx[2])).toBeCloseTo(py, 6)
    expect(dan.T.slice(0, 4)).toEqual([1, 0, -0, 1])
    expect(dan.mo).toBe(RO_TAY.viet)
    expect(m.v.viTriBut()).toEqual([px, py])
    // hình dựng sẵn: canvas RỜI (không gắn vào trang, không thêm lớp), ngòi mang màu phấn của nét, cỡ theo bề cao bảng (bàn tay ≈ 5,5 %)
    const hinh = dan.anh!, o = m.v.cuon().bang
    expect(hinh.isConnected).toBe(false)
    expect(ctx.get(hinh)!.lenh.some((x) => x.loai === 'fill' && x.mau === 'rgb(255,210,122)')).toBe(true)
    expect(hinh.height).toBeLessThan(o.h * 0.09); expect(hinh.width).toBeLessThan(o.h * 0.09)
    expect(coTay(400) / 400).toBeCloseTo(0.055, 6)
    const soVe = ctx.get(hinh)!.lenh.length
    // khung sau y hệt (không có đuôi nét, bàn tay không đổi) ⇒ KHÔNG vẽ gì, không dựng lại hình
    const n0 = m.lenh(m.cvSong).length
    m.v.veSong(1016)
    expect(m.lenh(m.cvSong).length).toBe(n0)
    // nhấc bút giữa hai nét (< 0,42 giây): giữ nguyên độ rõ — không nhấp nháy
    m.v.datBut({ x: 0.8, y: 0.3, cham: false })
    let t = chay(m.v, 12, 1032)
    expect(anh().pop()!.mo).toBe(RO_TAY.viet)
    // lơ lửng lâu hơn: mờ dần về mức lơ lửng; đứng yên > 1,6 giây: mờ gần hết
    t = chay(m.v, 50, t)
    expect(anh().pop()!.mo).toBe(RO_TAY.lo)
    t = chay(m.v, 120, t)
    expect(anh().pop()!.mo).toBe(RO_TAY.nghi)
    expect(ctx.get(hinh)!.lenh.length).toBe(soVe) // suốt quãng đó hình không dựng lại
    // thư viện báo null ⇒ xoá, không dán nữa
    m.v.datBut(null)
    const truoc = anh().length
    m.v.veSong(t + 16)
    expect(anh().length).toBe(truoc)
    expect(m.lenh(m.cvSong).pop()!.loai).toBe('xoa')
    expect(m.v.viTriBut()).toBeNull()
  })
  it('đang có đuôi nét: bàn tay dán SAU đuôi nét trong cùng một lượt vẽ, ngòi ở đúng đầu nét', () => {
    const m = dung(), n = net('b_n1', 0.4, 40)
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: n })
    const c = n.diem[n.diem.length - 1]
    m.v.datDau([{ id: n.id, x: c[0], y: c[1] }])
    m.v.datBut({ x: c[0], y: c[1], cham: true, net: n.id, mau: MAU })
    m.v.veSong(1000)
    const ds = m.lenh(m.cvSong), iNet = ds.findIndex((x) => x.loai === 'fill' && x.duong.length > 40), iTay = ds.findIndex((x) => x.loai === 'anh')
    expect(iNet).toBeGreaterThanOrEqual(0); expect(iTay).toBeGreaterThan(iNet)
    const sx = /translate3d\(([-0-9.]+)px,([-0-9.]+)px/.exec(m.cvSong.style.transform)!, [px, py] = m.v.toiPx(c[0], c[1], n.id)
    expect(Math.abs(ds[iTay].T[4] + Number(sx[1]) - px)).toBeLessThanOrEqual(0.5); expect(Math.abs(ds[iTay].T[5] + Number(sx[2]) - py)).toBeLessThanOrEqual(0.5)
  })
})

describe('bàn tay cầm bút (tro-but.ts)', () => {
  it('đang viết: ngòi ở ĐÚNG chỗ mỗi khung, ngả nhẹ ≤ 5°; nhấc bút: nhấc dần, độ rõ giữ; lơ lửng nhảy xa ⇒ TRƯỢT tới; chạm lại: về đúng điểm NGAY', () => {
    const b = taoTroBut()
    let h = b.buoc({ x: 100, y: 100, cham: true }, 0)!
    expect(h).toEqual({ x: 100, y: 100, nang: 0, goc: 0, mo: RO_TAY.viet })
    h = b.buoc({ x: 137, y: 91, cham: true }, 16)!
    expect([h.x, h.y, h.nang]).toEqual([137, 91, 0])
    // đi sang phải ⇒ thân tay ngả về sau một chút, có quán tính, không quá 5°
    expect(h.goc).toBeLessThan(0); expect(Math.abs(h.goc)).toBeLessThanOrEqual((5 * Math.PI) / 180 + 1e-9)
    // nhấc bút: nhấc lên dần, chỗ gần thì theo ngay, độ rõ chưa đổi
    h = b.buoc({ x: 139, y: 90, cham: false }, 32)!
    expect([h.x, h.y]).toEqual([139, 90]); expect(h.nang).toBeGreaterThan(0.1); expect(h.nang).toBeLessThan(0.6); expect(h.mo).toBe(RO_TAY.viet)
    // rời bảng rồi vào lại chỗ khác: trượt
    const vet: number[] = []
    for (let i = 0; i < 30; i++) vet.push(b.buoc({ x: 439, y: 90, cham: false }, 48 + i * 16)!.x)
    expect(vet[0]).toBeLessThan(139 + 150)
    for (let i = 1; i < vet.length; i++) { expect(vet[i]).toBeGreaterThanOrEqual(vet[i - 1]); expect(vet[i] - vet[i - 1]).toBeLessThan(150) }
    expect(vet[vet.length - 1]).toBe(439)
    // đứng yên: hết ngả, nhấc hẳn; độ rõ về mức lơ lửng rồi mức nghỉ, không bao giờ tăng trong lúc đó
    let t = 528, moTruoc = 1
    for (; t < 1400; t += 16) { h = b.buoc({ x: 439, y: 90, cham: false }, t)!; expect(h.mo).toBeLessThanOrEqual(moTruoc); moTruoc = h.mo }
    expect([h.nang, h.goc, h.mo]).toEqual([1, 0, RO_TAY.lo])
    for (; t < 3200; t += 16) { h = b.buoc({ x: 439, y: 90, cham: false }, t)!; expect(h.mo).toBeLessThanOrEqual(moTruoc); moTruoc = h.mo }
    expect(h.mo).toBe(RO_TAY.nghi)
    // chạm lại: ngòi về đúng điểm viết NGAY (mực ở đâu ngòi ở đó), không nhấc; rõ lên nhanh
    h = b.buoc({ x: 200, y: 300, cham: true }, t)!
    expect([h.x, h.y, h.nang]).toEqual([200, 300, 0]); expect(h.mo).toBeGreaterThan(RO_TAY.nghi)
    for (let i = 1; i <= 12; i++) h = b.buoc({ x: 200, y: 300, cham: true }, t + i * 16)!
    expect(h.mo).toBe(RO_TAY.viet)
    expect(b.buoc(null, t + 400)).toBeNull()
    expect(b.viTri()).toBeNull()
  })
  it('máy yếu: giữ bàn tay, bỏ quán tính — không trượt, không ngả, độ rõ đổi ngay', () => {
    const b = taoTroBut({ yeu: true })
    b.buoc({ x: 100, y: 100, cham: true }, 0)
    let h = b.buoc({ x: 160, y: 100, cham: true }, 16)!
    expect(h.goc).toBe(0)
    h = b.buoc({ x: 460, y: 100, cham: false }, 32)!
    expect([h.x, h.nang, h.goc]).toEqual([460, 1, 0])
    h = b.buoc({ x: 460, y: 100, cham: false }, 600)!
    expect(h.mo).toBe(RO_TAY.lo)
  })
  it('ba dáng tay vẽ gọn trong ô bao; cây bút NGẮN (ngắn hơn bề cao bàn tay); cỡ bàn tay kẹp 15–44 px', () => {
    for (const dang of ['nam', 'gon', 'vien'] as DangTay[]) {
      const g = ctxGia()
      veTay(g as unknown as CanvasRenderingContext2D, dang, { than: 'white', dai: 'orange', bong: 'black', muc: 'red' }, true)
      expect(g.lenh.length).toBeGreaterThan(3)
      for (const l of g.lenh) for (let i = 0; i < l.duong.length; i += 2) {
        expect(l.duong[i]).toBeGreaterThanOrEqual(O_TAY.trai); expect(l.duong[i]).toBeLessThanOrEqual(O_TAY.phai - 3)
        expect(l.duong[i + 1]).toBeGreaterThanOrEqual(O_TAY.tren); expect(l.duong[i + 1]).toBeLessThanOrEqual(O_TAY.duoi - 3)
      }
      // ngòi bút (tô màu mực) bắt đầu ở gốc (0, 0) = điểm viết
      const ngoi = g.lenh.find((l) => l.loai === 'fill' && l.mau === 'red')!
      expect(ngoi.duong.slice(0, 2)).toEqual([0, 0])
      // thân bút: đầu xa nhất cách ngòi < 60 đơn vị (bề cao bàn tay)
      const than = g.lenh.find((l) => l.loai === 'fill' && l.mau === 'orange')!
      let xa = 0
      for (let i = 0; i < than.duong.length; i += 2) xa = Math.max(xa, Math.hypot(than.duong[i], than.duong[i + 1]))
      expect(xa).toBeLessThan(50)
    }
    // 11/11 lần 3 (thầy: «Bỏ tay chỉ để lại bút»): dáng mặc định `but` CHỈ vẽ cây bút — thân + ngòi, không khối nào mang màu bàn tay, không bóng, không viền
    const g = ctxGia()
    veTay(g as unknown as CanvasRenderingContext2D, 'but', { than: 'white', dai: 'orange', bong: 'black', muc: 'red' }, true)
    expect(g.lenh.map((l) => `${l.loai}:${l.mau}`)).toEqual(['fill:orange', 'fill:red'])
    expect(g.lenh[1]!.duong.slice(0, 2)).toEqual([0, 0]) // ngòi vẫn đúng điểm viết
    for (const l of g.lenh) for (let i = 0; i < l.duong.length; i += 2) {
      expect(l.duong[i]).toBeGreaterThanOrEqual(O_TAY.trai); expect(l.duong[i]).toBeLessThanOrEqual(O_TAY.phai - 3)
      expect(l.duong[i + 1]).toBeGreaterThanOrEqual(O_TAY.tren + 1); expect(l.duong[i + 1]).toBeLessThanOrEqual(O_TAY.duoi - 3)
    }
    expect([coTay(100), coTay(2000)]).toEqual([15, 44])
    expect(tiLeTay(60)).toBe(1)
  })
})
