// ĐO TỐC ĐỘ lõi «Sinh Tồn» bản 2 (13/11) — nhịp máy chủ, tìm đường A*, phép thử vật chặn trên sân lớn nhất. In số đo (p50 / p95 ms) để ghi báo cáo;
// ngưỡng kiểm ở đây rộng (máy CI ồn), chỉ chặn chậm hẳn. Bằng chứng ĐÚNG của chỉ mục theo trang nằm ở tests/sinh-ton-v2-loi-1311.test.ts.
import { describe, expect, it } from 'vitest'
import { MaySinhTon } from '../server/src/sinh-ton-may-chu'
import { BK_NV, VAN_MS, chanDuong, conLai, dangNghi, diChuyen, ngoaiVong, taoBanDo, timDuong, vong } from '../src/lib/live-khoi/sinh-ton-loi'

const hat = (s: number) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const phanVi = (ds: number[], p: number): number => { const s = [...ds].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
const so = (v: number) => Math.round(v * 1000) / 1000

/** Chạy `soNhip` nhịp 250 ms của máy trò với `emDoi[d]` em thật mỗi đội (em đi lang thang, khai bắn một đối thủ gần). Trả thời gian từng nhịp (ms). */
function doNhip(emDoi: number[], soNhip: number): { ms: number[]; co: number } {
  const r = hat(7), may = new MaySinhTon(hat(11))
  const T = 2000 * VAN_MS + 1000
  const em: { id: string; doi: number; x: number; y: number }[] = []
  emDoi.forEach((n, d) => { for (let i = 0; i < n; i++) em.push({ id: `S${d}-${i}`, doi: d, x: 0, y: 0 }) })
  let co = 0
  const ms: number[] = []
  for (let k = 0; k < soNhip; k++) {
    const nay = T + k * 250
    const bd = taoBanDo(co)
    for (const e of em) {
      if (!e.x) { e.x = bd.trai[e.doi].x; e.y = bd.trai[e.doi].y }
      const p = diChuyen(bd, e.x, e.y, (r() - 0.5) * 80, (r() - 0.5) * 80)
      e.x = Math.min(bd.rong - BK_NV, p.x); e.y = Math.min(bd.cao - BK_NV, p.y)
      const dt = em[Math.floor(r() * em.length)]
      may.nhan(e.id, e.doi, { p: [e.x, e.y, 100, 1], t: dt && dt.doi !== e.doi && Math.hypot(dt.x - e.x, dt.y - e.y) < 600 ? dt.id : '' }, nay)
    }
    const t0 = performance.now()
    const anh = may.nhip(nay)
    ms.push(performance.now() - t0)
    if (anh) co = anh.c
  }
  return { ms: ms.slice(20), co }
}

describe('đo tốc độ Sinh Tồn (in số)', () => {
  it('nhịp máy chủ: 1 em + 15 máy bù (sân nhỏ) · 97 em (sân lớn nhất)', () => {
    const a = doNhip([1, 0, 0, 0], 1200), b = doNhip([25, 24, 24, 24], 600)
    console.log(`[đo] nhip 1 em + 15 máy (cỡ ${a.co}): p50 ${so(phanVi(a.ms, 0.5))} ms · p95 ${so(phanVi(a.ms, 0.95))} ms`)
    console.log(`[đo] nhip 97 em (cỡ ${b.co}): p50 ${so(phanVi(b.ms, 0.5))} ms · p95 ${so(phanVi(b.ms, 0.95))} ms`)
    expect(phanVi(a.ms, 0.95)).toBeLessThan(40); expect(phanVi(b.ms, 0.95)).toBeLessThan(40)
  })
  it('«chỉ gửi gần» 78 em, trọn một ván 125 giây: byte / giây + p95 nhịp (gồm dựng chuỗi gửi 78 máy) — trước (ảnh đủ cho mọi máy) / sau (ảnh lọc từng em)', () => {
    // Em mang mã 6 chữ số như số báo danh thật; đi về điểm ngẫu nhiên TRONG vòng an toàn đang co (cuối ván cả lớp dồn vào ~2700 × 1260), khai bắn đối thủ
    // gần nhất trong 600, thỉnh thoảng báo bị hạ. 78 em ⇒ không có máy bù, sân cỡ 3 (6400 × 3000).
    const r = hat(13), may = new MaySinhTon(hat(17))
    const T = 3000 * VAN_MS
    const em = Array.from({ length: 78 }, (_, i) => ({ id: String(250100 + i * 37), doi: i % 4, x: 0, y: 0, dx: 0, dy: 0, dich: 0 }))
    const sNhip: number[] = [], sTruoc: number[] = [], sSau: number[] = []
    let bTruoc = 0, bSau = 0, bTruocCuoi = 0, bSauCuoi = 0, nhipCuoi = 0, soNhip = 0
    for (let k = 0; k * 250 < VAN_MS; k++) {
      const nay = T + k * 250, bd = taoBanDo(3), v = vong(bd, nay)
      for (const e of em) {
        if (!e.x) { e.x = bd.trai[e.doi].x; e.y = bd.trai[e.doi].y }
        if (nay >= e.dich || Math.hypot(e.dx - e.x, e.dy - e.y) < 40 || ngoaiVong(v, e.dx, e.dy)) {
          do { e.dx = v.cx + (r() * 2 - 1) * v.rx * 0.9; e.dy = v.cy + (r() * 2 - 1) * v.ry * 0.9 } while (ngoaiVong(v, e.dx, e.dy))
          e.dich = nay + 2000 + r() * 4000
        }
        const d = Math.hypot(e.dx - e.x, e.dy - e.y) || 1, b = Math.min(d, 47.5)
        const p = diChuyen(bd, e.x, e.y, ((e.dx - e.x) / d) * b, ((e.dy - e.y) / d) * b)
        e.x = p.x; e.y = p.y
      }
      for (const e of em) {
        let gan = 600, t = ''
        for (const f of em) if (f.doi !== e.doi) { const d = Math.hypot(f.x - e.x, f.y - e.y); if (d < gan) { gan = d; t = f.id } }
        const ke = em.find((f) => f.doi !== e.doi && Math.hypot(f.x - e.x, f.y - e.y) < 300)
        may.nhan(e.id, e.doi, { p: [e.x, e.y, 100, 1 + (k % 6)], t, ...(ke && r() < 0.01 ? { a: ke.id } : {}) }, nay)
      }
      const t0 = performance.now()
      const anh = may.nhip(nay)!
      const t1 = performance.now()
      const du = JSON.stringify({ t: 'lop', k: 'tro', s: '', n: '', d: -1, l: nay, x: anh })
      const t2 = performance.now()
      const goi = may.goi(anh, nay)
      let sau = 0
      for (const e of em) sau += goi.cho(e.id).length
      const t3 = performance.now()
      if (k >= 20) { sNhip.push(t1 - t0); sTruoc.push(t1 - t0 + t2 - t1); sSau.push(t1 - t0 + t3 - t2) }
      soNhip++; bTruoc += du.length * em.length; bSau += sau
      if (!dangNghi(nay) && conLai(nay) <= 30_000) { nhipCuoi++; bTruocCuoi += du.length * em.length; bSauCuoi += sau }
    }
    const kbGiay = (b: number, n: number) => Math.round(((b / n) * 4) / 1024)
    console.log(`[đo] gửi gần 78 em · cả ván: trước ${kbGiay(bTruoc, soNhip)} KB/giây → sau ${kbGiay(bSau, soNhip)} KB/giây · 30 giây cuối: trước ${kbGiay(bTruocCuoi, nhipCuoi)} → sau ${kbGiay(bSauCuoi, nhipCuoi)} KB/giây`)
    console.log(`[đo] nhịp 78 em (gồm dựng chuỗi gửi 78 máy): trước p50 ${so(phanVi(sTruoc, 0.5))} · p95 ${so(phanVi(sTruoc, 0.95))} ms → sau p50 ${so(phanVi(sSau, 0.5))} · p95 ${so(phanVi(sSau, 0.95))} ms (riêng nhịp trò p95 ${so(phanVi(sNhip, 0.95))} ms)`)
    expect(bSau).toBeLessThan(bTruoc); expect(phanVi(sSau, 0.95)).toBeLessThan(40)
  })
  it('tìm đường A* trên sân lớn nhất + phép thử chắn đường', () => {
    const bd = taoBanDo(4), r = hat(3), ms: number[] = []
    const diem = () => ({ x: BK_NV + r() * (bd.rong - 2 * BK_NV), y: BK_NV + r() * (bd.cao - 2 * BK_NV) })
    // Như máy bù: đích trong khoảng nửa khung nhìn tới vài trang (tuần quanh giữa sân, đuổi đối thủ, lui về bụi).
    for (let i = 0; i < 400; i++) {
      const a = diem(), d = Math.min(1, r() * 1.2) * 1600, g = r() * Math.PI * 2
      const b = { x: Math.min(bd.rong - BK_NV, Math.max(BK_NV, a.x + Math.cos(g) * d)), y: Math.min(bd.cao - BK_NV, Math.max(BK_NV, a.y + Math.sin(g) * d)) }
      const t0 = performance.now(); timDuong(bd, a.x, a.y, b.x, b.y); ms.push(performance.now() - t0)
    }
    const doan: number[][] = []
    for (let i = 0; i < 100_000; i++) { const a = diem(), g = r() * Math.PI * 2, d = r() * 660; doan.push([a.x, a.y, a.x + Math.cos(g) * d, a.y + Math.sin(g) * d]) }
    const t0 = performance.now()
    let chan = 0
    for (const [x1, y1, x2, y2] of doan) if (chanDuong(bd, x1, y1, x2, y2)) chan++
    const tong = performance.now() - t0
    console.log(`[đo] timDuong cỡ 4 (${bd.rong}×${bd.cao}, ${bd.chan.length} vật chặn): p50 ${so(phanVi(ms, 0.5))} ms · p95 ${so(phanVi(ms, 0.95))} ms`)
    console.log(`[đo] chanDuong cỡ 4: 100 000 đoạn ${so(tong)} ms (${chan} bị chắn)`)
    expect(phanVi(ms, 0.95)).toBeLessThan(30)
  })
})
