// LIVE BẢNG — VẼ NÉT TRÊN MÁY EM (đặc tả mục 4.4). Cùng bộ dựng nét với máy thầy (`taoLoiBut()` chạy chính chuỗi JS của tờ chiếu) ⇒ cùng dữ liệu, cùng hình.
// Hai lớp canvas: «đã chốt» (vẽ một lần; chỉ vẽ lại khi đổi cỡ / xoá / bảng mới) và «đang viết» (mỗi khung xoá đúng ô vừa vẽ rồi vẽ lại đoạn đuôi nét dở).
// Nét dở dài thì phần đầu đã ổn định in dần xuống lớp đã chốt (`mocDong`) ⇒ mỗi khung chỉ dựng đoạn đuôi, như máy thầy.
// Khung quy chiếu = «cửa sổ thầy ảo» (bo-cuc.ts): canvas chỉ phủ vùng chiếu nên mọi nét dời (−ox, −oy).
import type { DiemBut, KhungBut, LoiBut, NetBut, XuLyBut } from '../../lib/but-bang-loi'

type G2 = CanvasRenderingContext2D
interface NetCoNho extends NetBut { _k?: string; _d?: Path2D | number[] }
/** Nét đang viết: `net.diem` lớn dần; `st` = trạng thái xử lý dần; `dong` = mốc đã in xuống lớp chốt. */
interface NetDo { net: NetBut; st: XuLyBut; dong: number; dau: [number, number] | null }

export interface KhungVe {
  /** Cửa sổ thầy ảo (px CSS của máy em, đã nhân tỉ lệ co). */
  Wv: number
  Hv: number
  /** Góc vùng chiếu trong cửa sổ ảo (px CSS). */
  ox: number
  oy: number
  /** Cỡ canvas (px CSS) + mật độ điểm ảnh. */
  w: number
  h: number
  dpr: number
}

export function taoVeBang(loi: LoiBut, cvChot: HTMLCanvasElement, cvSong: HTMLCanvasElement) {
  const nguCanh = (c: HTMLCanvasElement): G2 | null => { try { return c.getContext('2d') } catch { return null } }
  const gC = nguCanh(cvChot), gS = nguCanh(cvSong)
  const coPath = typeof Path2D === 'function'
  let kv: KhungVe | null = null, KH: KhungBut | null = null
  let ds: NetCoNho[] = []
  const doDang = new Map<string, NetDo>()
  /** Ô vừa vẽ trên lớp sống (px thiết bị) — khung sau xoá đúng chỗ này. */
  let ban: [number, number, number, number] | null = null

  function dat(g: G2): number {
    const s = kv!.dpr * KH!.k
    g.setTransform(s, 0, 0, s, -kv!.ox * kv!.dpr, -kv!.oy * kv!.dpr)
    return s
  }
  function to(g: G2, p: number[], mau: string, tay = false): void {
    if (!p.length) return
    dat(g); g.globalCompositeOperation = tay ? 'destination-out' : 'source-over'; g.fillStyle = mau
    g.beginPath(); loi.veDaGiac(g, p); g.fill()
    g.globalCompositeOperation = 'source-over'
  }
  function veNetChot(n: NetCoNho): void {
    if (!gC || !KH) return
    const khoa = `${KH.rw}x${KH.rh}`
    if (n._k !== khoa) {
      const p = loi.dungNet(n, KH)
      n._k = khoa
      if (coPath) { const d = new Path2D(); loi.veDaGiac(d, p); n._d = d } else n._d = p
    }
    dat(gC); gC.globalCompositeOperation = n.cong === 'tay' ? 'destination-out' : 'source-over'; gC.fillStyle = n.mau
    if (coPath) gC.fill(n._d as Path2D)
    else { gC.beginPath(); loi.veDaGiac(gC, n._d as number[]); gC.fill() }
    gC.globalCompositeOperation = 'source-over'
  }
  function xoaSong(): void {
    if (gS && ban) { gS.setTransform(1, 0, 0, 1, 0, 0); gS.clearRect(ban[0], ban[1], ban[2], ban[3]) }
    ban = null
  }
  /** Vẽ lại cả lớp đã chốt từ vectơ (đổi cỡ, xoá, hoàn tác, bảng mới). Phần đã in của nét dở cũng in lại. */
  function veLai(): void {
    if (!gC || !kv || !KH) return
    gC.setTransform(1, 0, 0, 1, 0, 0); gC.clearRect(0, 0, cvChot.width, cvChot.height)
    for (const n of ds) veNetChot(n)
    for (const d of doDang.values()) if (d.dong > 0) to(gC, loi.vien(d.st, 0, d.dong + 2, null, false), d.net.mau)
  }
  /** Đổi cỡ / tỉ lệ: đặt lại hai canvas, dựng lại trạng thái nét dở theo khung mới, vẽ lại. */
  function datKhung(k: KhungVe): void {
    kv = k
    KH = loi.khung(k.Wv, k.Hv)
    for (const c of [cvChot, cvSong]) { c.width = Math.max(1, Math.round(k.w * k.dpr)); c.height = Math.max(1, Math.round(k.h * k.dpr)) }
    ban = null
    for (const d of doDang.values()) { d.st = loi.moXuLy(d.net, KH); loi.xuLyThem(d.st, d.net.diem, d.net.diem.length); d.dong = 0 }
    veLai()
  }
  /** Đặt cả bảng (vào live, nối lại, bảng mới, xoá). Nét dở giữ nguyên trừ khi `boDo`. */
  function datNet(net: readonly NetBut[], boDo = false): void {
    ds = net.map((n) => n as NetCoNho)
    if (boDo) { doDang.clear(); xoaSong() }
    veLai()
  }
  /** Một nét đã chốt tới từ sổ nét. Nét này đang viết dở trên máy em và đã đủ điểm ⇒ chỉ in nốt đoạn đuôi (không vẽ lại cả lớp). */
  function themNet(net: NetBut, vt?: number | null): void {
    const n = net as NetCoNho, cu = ds.findIndex((x) => x.id === n.id)
    const d = doDang.get(n.id)
    doDang.delete(n.id)
    if (cu >= 0) { ds[cu] = n; xoaSong(); veLai(); return }
    const cuoi = vt == null || vt >= ds.length
    if (cuoi) ds.push(n); else ds.splice(Math.max(0, vt), 0, n)
    if (!KH) return
    if (d) xoaSong()
    if (!cuoi || (d && d.dong > 0 && d.st.n !== n.diem.length)) { veLai(); return }
    if (d && d.dong > 0) to(gC!, loi.vien(d.st, d.dong, -1, null, true), n.mau, n.cong === 'tay')
    else veNetChot(n)
  }
  /** Thêm điểm cho nét đang viết (tạo mới nếu chưa có). `tu` = số điểm đã có trước lô này (lô lệch ⇒ bỏ phần trùng). */
  function themDiem(dau: Pick<NetBut, 'id' | 'cong' | 'mau' | 'co'>, diem: readonly DiemBut[], tu: number): void {
    if (!KH || !diem.length) return
    let d = doDang.get(dau.id)
    if (!d) { const net: NetBut = { id: dau.id, cong: dau.cong, mau: dau.mau, co: dau.co, diem: [] }; d = { net, st: loi.moXuLy(net, KH), dong: 0, dau: null }; doDang.set(dau.id, d) }
    const bo = d.net.diem.length - tu
    if (bo < 0) return // thủng (mất lô giữa chừng): chờ bản chốt từ sổ nét
    for (let i = Math.max(0, bo); i < diem.length; i++) d.net.diem.push(diem[i]!)
  }
  /** Đầu nét nội suy của khung này (toạ độ 0..1) — vẽ làm đuôi của nét dở. */
  function datDau(id: string, dau: { x: number; y: number } | null): void {
    const d = doDang.get(id)
    if (d) d.dau = dau ? [dau.x, dau.y] : null
  }
  function boDo(id: string): void { if (doDang.delete(id)) xoaSong() }
  /** MỘT khung vẽ của lớp «đang viết». Trả số nét dở đã vẽ. */
  function veSong(): number {
    if (!gS || !gC || !KH || !kv) return 0
    xoaSong()
    if (!doDang.size) return 0
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, dem = 0
    for (const d of doDang.values()) {
      loi.xuLyThem(d.st, d.net.diem, d.net.diem.length)
      const den = loi.mocDong(d.st, d.dong)
      if (den > 0) { to(gC, loi.vien(d.st, d.dong, den, null, false), d.net.mau, d.net.cong === 'tay'); d.dong = den - 2 }
      const p = loi.vien(d.st, d.dong, -1, d.dau ? [[d.dau[0] * KH.rw, d.dau[1] * KH.rh]] : null, false)
      if (!p.length) continue
      to(gS, p, d.net.mau)
      dem += 1
      for (let i = 0; i < p.length; i += 2) { const x = p[i]!, y = p[i + 1]!; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    }
    if (dem) {
      const s = kv.dpr * KH.k, dx = kv.ox * kv.dpr, dy = kv.oy * kv.dpr
      ban = [Math.floor(x0 * s - dx) - 3, Math.floor(y0 * s - dy) - 3, Math.ceil((x1 - x0) * s) + 6, Math.ceil((y1 - y0) * s) + 6]
    }
    return dem
  }
  /** Toạ độ 0..1 (cửa sổ thầy) ⇒ px CSS trong vùng chiếu của máy em. */
  function toiPx(x: number, y: number): [number, number] {
    return kv ? [x * kv.Wv - kv.ox, y * kv.Hv - kv.oy] : [0, 0]
  }
  return { datKhung, datNet, themNet, themDiem, datDau, boDo, veSong, veLai, toiPx, soNet: (): number => ds.length, soDo: (): number => doDang.size }
}
export type VeBang = ReturnType<typeof taoVeBang>
