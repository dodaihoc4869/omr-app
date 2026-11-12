// BÚT TỰ NẮN (thầy 12/11: «bút mà kẻ thì tự nắn thẳng, vẽ hình thì tự căn chỉnh lại hình khi nhấc bút»): đường kẻ dài gần thẳng ⇒ đoạn thẳng (gần ngang /
// dọc thì ngang / dọc hẳn); hình khép kín đủ to ⇒ tròn / elip, tam giác, chữ nhật ngay ngắn. Chữ viết, dấu gạch ngắn, vòng khoanh nhỏ KHÔNG bị đụng.
// Nét đã nắn vào sổ bằng «gỡ nét tay + thêm một nét xong mã mới» ⇒ máy em và bản ghi nhận đúng hình đã nắn.
import { describe, expect, it } from 'vitest'
import { taoLoiBut, type SuKienBut } from '../src/lib/but-bang-loi'

const loi = taoLoiBut()
type Diem = [number, number, number, number]
function ve(diem: [number, number][], tuy: Record<string, unknown> = {}) {
  const so = loi.taoSo(tuy), sk: SuKienBut[] = []
  so.datTiLe(16 / 9)
  so.nghe((e: SuKienBut) => { sk.push(e) })
  so.batDau({ cong: 'but', mau: 'rgb(255,255,255)', co: 3, bang: true, diem: [diem[0]![0], diem[0]![1], 0.5, 0] as Diem })
  so.themDiem(diem.slice(1).map(([x, y], i) => [x, y, 0.5, (i + 1) * 8] as Diem))
  const net = so.ketThuc()
  return { net: net as { id: string; diem: Diem[]; nan?: number }, sk, ds: so.ds() as { id: string; diem: Diem[] }[] }
}
const T = 16 / 9
const rung = (i: number) => Math.sin(i * 1.7) * 0.0025 // tay run ~0,25 % bề dọc

describe('nắn ĐƯỜNG KẺ', () => {
  it('đường dọc dài hơi nghiêng, tay run ⇒ đoạn thẳng DỌC hẳn; phát «gỡ nét tay» rồi «nét xong» mã mới (giữ tiền tố b_ của bảng)', () => {
    const d: [number, number][] = Array.from({ length: 40 }, (_, i) => [0.13 + i * 0.0003 + rung(i) / T, 0.3 + i * 0.008])
    const r = ve(d)
    expect(r.net.nan).toBe(1)
    expect(r.net.diem.length).toBe(3)
    expect(new Set(r.net.diem.map((p) => p[0])).size).toBe(1) // cùng x ⇒ dọc hẳn
    expect(r.net.id.startsWith('b_')).toBe(true)
    const cuoi = r.sk.slice(-2)
    expect(cuoi[0]!.loai).toBe('xoa')
    expect(cuoi[1]).toMatchObject({ loai: 'net-moi', xong: true })
    expect(r.ds.map((n) => n.id)).toEqual([r.net.id])
  })
  it('đường chéo dài ⇒ thẳng, giữ đúng hai đầu (không bẻ về ngang / dọc)', () => {
    const d: [number, number][] = Array.from({ length: 30 }, (_, i) => [0.2 + i * 0.01, 0.2 + i * 0.012 + rung(i)])
    const r = ve(d)
    expect(r.net.nan).toBe(1)
    expect(r.net.diem[0]![0]).toBeCloseTo(0.2, 3); expect(r.net.diem[2]![0]).toBeCloseTo(0.49, 3)
    expect(r.net.diem[2]![1] - r.net.diem[0]![1]).toBeGreaterThan(0.3)
  })
  it('dấu gạch ngắn, nét chữ, đường cong rõ ⇒ GIỮ nét tay (sự kiện net-xong như cũ)', () => {
    const gach = ve(Array.from({ length: 8 }, (_, i) => [0.3 + i * 0.003, 0.4] as [number, number]))
    expect(gach.net.nan).toBeUndefined(); expect(gach.sk[gach.sk.length - 1]!.loai).toBe('net-xong')
    const cong = ve(Array.from({ length: 40 }, (_, i) => [0.2 + i * 0.01, 0.4 + Math.sin(i / 6) * 0.05] as [number, number]))
    expect(cong.net.nan).toBeUndefined()
    const chu = ve(Array.from({ length: 30 }, (_, i) => [0.3 + i * 0.001 + Math.sin(i) * 0.004, 0.4 + Math.cos(i * 1.3) * 0.012] as [number, number]))
    expect(chu.net.nan).toBeUndefined()
  })
  it('tắt được: taoSo({ nan: false }) ⇒ không nắn', () => {
    const d: [number, number][] = Array.from({ length: 40 }, (_, i) => [0.13, 0.3 + i * 0.008])
    expect(ve(d, { nan: false }).net.nan).toBeUndefined()
  })
})

describe('nắn HÌNH khép kín', () => {
  it('vòng tròn vẽ tay (méo nhẹ) ⇒ tròn đều: mọi điểm cách tâm cùng bán kính', () => {
    const d: [number, number][] = Array.from({ length: 60 }, (_, i) => { const g = (i / 58) * 2 * Math.PI, r = 0.1 * (1 + Math.sin(i * 0.9) * 0.05); return [0.5 + (r * Math.cos(g)) / T, 0.5 + r * Math.sin(g)] })
    const r = ve(d)
    expect(r.net.nan).toBe(1)
    const bk = r.net.diem.map((p) => Math.hypot((p[0] - 0.5) * T, p[1] - 0.5))
    expect(Math.max(...bk) - Math.min(...bk)).toBeLessThan(0.006)
    expect(bk[0]).toBeGreaterThan(0.09); expect(bk[0]).toBeLessThan(0.11)
  })
  it('hình chữ nhật vẽ tay (cạnh hơi xiên) ⇒ chữ nhật ngay ngắn: mọi điểm nằm trên bốn cạnh của khung bao', () => {
    const goc: [number, number][] = [[0.3, 0.3], [0.5, 0.31], [0.505, 0.55], [0.295, 0.54], [0.3, 0.3]]
    const d: [number, number][] = []
    for (let c = 0; c < 4; c++) for (let i = 0; i < 14; i++) d.push([goc[c]![0] + ((goc[c + 1]![0] - goc[c]![0]) * i) / 14 + rung(i) / T, goc[c]![1] + ((goc[c + 1]![1] - goc[c]![1]) * i) / 14 + rung(i + 3)])
    d.push([0.301, 0.302])
    const r = ve(d)
    expect(r.net.nan).toBe(1)
    const xs = r.net.diem.map((p) => p[0]), ys = r.net.diem.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    for (const p of r.net.diem) expect(Math.min(Math.abs(p[0] - x0), Math.abs(p[0] - x1), Math.abs(p[1] - y0), Math.abs(p[1] - y1))).toBeLessThan(0.0008)
    expect(x1 - x0).toBeGreaterThan(0.19); expect(y1 - y0).toBeGreaterThan(0.23)
  })
  it('tam giác vẽ tay ⇒ ba cạnh thẳng', () => {
    const goc: [number, number][] = [[0.4, 0.3], [0.55, 0.6], [0.28, 0.58], [0.4, 0.3]]
    const d: [number, number][] = []
    for (let c = 0; c < 3; c++) for (let i = 0; i < 16; i++) d.push([goc[c]![0] + ((goc[c + 1]![0] - goc[c]![0]) * i) / 16 + rung(i) / T, goc[c]![1] + ((goc[c + 1]![1] - goc[c]![1]) * i) / 16 + rung(i + 2)])
    d.push([0.401, 0.301])
    const r = ve(d)
    expect(r.net.nan).toBe(1)
    // mọi điểm nằm sát một trong ba cạnh nối ba đỉnh đã nhận ra
    const P = r.net.diem.map((p) => [p[0] * T, p[1]] as [number, number])
    const dinh = [P[0]!, P[8]!, P[16]!]
    const cach = (p: [number, number], a: [number, number], b: [number, number]) => Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / Math.hypot(b[0] - a[0], b[1] - a[1])
    for (const p of P) expect(Math.min(cach(p, dinh[0]!, dinh[1]!), cach(p, dinh[1]!, dinh[2]!), cach(p, dinh[2]!, dinh[0]!))).toBeLessThan(0.002)
  })
  it('vòng khoanh nhỏ (khoanh số ①) ⇒ GIỮ nét tay', () => {
    const d: [number, number][] = Array.from({ length: 30 }, (_, i) => { const g = (i / 28) * 2 * Math.PI; return [0.5 + (0.02 * Math.cos(g)) / T, 0.5 + 0.02 * Math.sin(g)] })
    expect(ve(d).net.nan).toBeUndefined()
  })
})
