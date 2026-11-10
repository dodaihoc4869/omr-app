// LIVE BẢNG — VẼ NÉT TRÊN MÁY EM (đặc tả mục 4.4). Cùng bộ dựng nét với máy thầy (`taoLoiBut()` chạy chính chuỗi JS của tờ chiếu) ⇒ cùng dữ liệu, cùng hình.
// Hai lớp canvas: «đã chốt» (vẽ một lần; chỉ vẽ lại khi đổi cỡ / xoá / bảng mới) và «đang viết» (mỗi khung xoá đúng ô vừa vẽ rồi vẽ lại đoạn đuôi nét dở).
// Nét dở dài thì phần đầu đã ổn định in dần xuống lớp đã chốt (`mocDong`) ⇒ mỗi khung chỉ dựng đoạn đuôi, như máy thầy.
// Khung quy chiếu = «cửa sổ thầy ảo» (bo-cuc.ts): canvas chỉ phủ vùng chiếu nên mọi nét dời (−ox, −oy).
import type { KhungBut, LoiBut, NetBut, SuKienBut, XuLyBut } from '../../lib/but-bang-loi'

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
  /** Đặt cả bảng (vào live, nối lại, bảng mới). Nét dở bỏ hết. */
  function datNet(net: readonly NetBut[]): void {
    ds = net.map((n) => n as NetCoNho)
    doDang.clear(); xoaSong()
    veLai()
  }
  /** Một nét đã chốt tới từ sổ nét (chèn ở `vt`; bỏ trống = cuối). */
  function themNet(net: NetBut, vt?: number | null): void {
    const n = net as NetCoNho, cu = ds.findIndex((x) => x.id === n.id)
    if (doDang.delete(n.id)) xoaSong()
    if (cu >= 0) { ds[cu] = n; veLai(); return }
    const cuoi = vt == null || vt >= ds.length
    if (cuoi) ds.push(n); else ds.splice(Math.max(0, vt), 0, n)
    if (!KH) return
    if (cuoi) veNetChot(n); else veLai()
  }
  /** Nét dở đã phát đủ điểm ⇒ chốt tại chỗ: in nốt đoạn đuôi (thon cuối nét) xuống lớp đã chốt, không vẽ lại cả lớp. */
  function chotNet(id: string): void {
    const d = doDang.get(id)
    if (!d) return
    doDang.delete(id); xoaSong()
    ds.push(d.net as NetCoNho)
    if (!KH || !gC) return
    loi.xuLyThem(d.st, d.net.diem, d.net.diem.length)
    if (d.dong > 0) to(gC, loi.vien(d.st, d.dong, -1, null, true), d.net.mau, d.net.cong === 'tay')
    else veNetChot(d.net as NetCoNho)
  }
  function xoaNet(ids: readonly string[]): void {
    let chot = false, doi = false
    for (const id of ids) {
      const d = doDang.get(id)
      if (d) { doDang.delete(id); doi = true; if (d.dong > 0) chot = true }
      const k = ds.findIndex((x) => x.id === id)
      if (k >= 0) { ds.splice(k, 1); chot = true }
    }
    if (doi) xoaSong()
    if (chot) veLai()
  }
  /** Áp MỘT sự kiện của bộ máy bút (thư viện live phát theo đúng thứ tự). `trang` ⇒ nơi gọi đặt lại bố cục trước rồi mới gọi hàm này. */
  function ap(sk: SuKienBut): void {
    if (sk.loai === 'trang') datNet(sk.net)
    else if (sk.loai === 'net-moi') {
      if (sk.xong) { themNet({ ...sk.net, diem: sk.net.diem.slice() }, sk.vt); return }
      if (!KH) return
      const net: NetBut = { id: sk.net.id, cong: sk.net.cong, mau: sk.net.mau, co: sk.net.co, diem: sk.net.diem.slice() }
      doDang.set(net.id, { net, st: loi.moXuLy(net, KH), dong: 0, dau: null })
    }
    else if (sk.loai === 'them-diem') { const d = doDang.get(sk.id); if (d) for (const p of sk.diem) d.net.diem.push(p) }
    else if (sk.loai === 'net-xong') chotNet(sk.id)
    else if (sk.loai === 'xoa') xoaNet(sk.id)
  }
  /** Đầu nét nội suy của khung này (toạ độ 0..1) — vẽ làm đuôi của nét dở. Nét không có trong `dau` ⇒ bỏ đuôi. */
  function datDau(dau: readonly { id: string; x: number; y: number }[]): void {
    for (const d of doDang.values()) d.dau = null
    for (const h of dau) { const d = doDang.get(h.id); if (d) d.dau = [h.x, h.y] }
  }
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
  return { datKhung, ap, datDau, veSong, veLai, toiPx, soNet: (): number => ds.length, soDo: (): number => doDang.size }
}
export type VeBang = ReturnType<typeof taoVeBang>
