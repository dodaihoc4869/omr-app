// XEM LẠI LIVE — MÁY PHÁT NÉT (đặc tả mục 4.9). Thuần: không DOM, không đồng hồ — nơi gọi truyền giờ trên TRỤC TIẾNG vào.
// Nguồn = các bản ghi `net.bin` (nguyên khung sổ nét của Live, `giaiSo`). Ra = đúng SỰ KIỆN của bộ máy bút (`SuKienBut`) mà lớp vẽ bảng live của máy em
// (`src/components/live/ve-bang.ts`) đang nhận ⇒ cùng dữ liệu, cùng hình như lúc live. Bảng hiện tại giữ bằng sổ nét của Live (`so-net.ts`: `apMuc`).
// · Nét xong có giờ bắt đầu `t`: vẽ DẦN từng điểm theo `t + diem[i][3]`; đầu nét nội suy thẳng giữa hai điểm kẹp mốc phát (cùng công thức `noi-suy.ts`).
//   Live cần đệm phát để khử dao động mạng; phát lại có sẵn đủ điểm + giờ nên không đệm (đặc tả: «không cần đệm phát»).
// · Xoá / xoá hết / bảng mới / hoàn tác: áp tại `t`. Nét còn đang vẽ dở lúc đó được chốt trước (giữ đúng thứ tự sổ).
// · TUA: `dungLai(ds, t)` dựng bảng tại `t` trong IM LẶNG rồi phát MỘT sự kiện `trang` (kèm nét dở) ⇒ lớp vẽ vẽ lại đúng một lần.
import type { DiemBut, NetBut, SuKienBut } from '../../../lib/but-bang-loi'
import { giaiSo, type MucSo } from '../../../lib/live/ma-net'
import { apMuc, taoBang, type BangNet } from '../../../lib/live/so-net'

/** Một mục đã giải của `net.bin` (nét nhiều khung đã ghép thành một). `t` = mili-giây trên trục tiếng. */
export type MucPhat = { t: number } & (
  | { k: 'net'; net: NetBut; vt: number | null }
  | { k: 'xoa'; id: string[] }
  | { k: 'xoa-het' }
  | { k: 'bang'; trang: string; tiLe: number }
  | { k: 'hoan-tac' })
type MucNet = Extract<MucPhat, { k: 'net' }>
export interface KhungMayPhat {
  /** Đầu nét nội suy của các nét đang vẽ dở (toạ độ 0..1) — lớp vẽ dùng làm đuôi nét. */
  dau: { id: string; x: number; y: number }[]
  /** Con trỏ bút: đầu nét đang vẽ; vừa nhấc bút thì nán lại chỗ cuối `NAN_TRO_MS` rồi ẩn. */
  tro: { x: number; y: number } | null
}
export const NAN_TRO_MS = 900

/** Giải các bản ghi `net.bin` (đã theo thứ tự `t`). Khung lạ / hỏng bị bỏ. Nét rất dài (nhiều khung) ghép lại, lấy giờ của phần đầu. */
export function giaiMuc(muc: readonly { t: number; khung: Uint8Array }[]): MucPhat[] {
  const ra: MucPhat[] = []
  let ghep: { t: number; net: NetBut; vt: number | null } | null = null
  for (const r of muc) {
    const m = giaiSo(r.khung)
    if (!m) continue
    if (m.k !== 'net') {
      if (m.k === 'xoa') ra.push({ t: r.t, k: 'xoa', id: m.id })
      else if (m.k === 'bang') ra.push({ t: r.t, k: 'bang', trang: m.trang, tiLe: m.tiLe })
      else ra.push({ t: r.t, k: m.k })
      continue
    }
    if (m.tu === 0) ghep = { t: r.t, net: { ...m.net, diem: m.net.diem.slice() }, vt: m.vt }
    else if (ghep && ghep.net.id === m.net.id && ghep.net.diem.length === m.tu) ghep.net.diem = ghep.net.diem.concat(m.net.diem)
    else { ghep = null; continue }
    if (m.het) { ra.push({ t: ghep.t, k: 'net', net: ghep.net, vt: ghep.vt }); ghep = null }
  }
  return ra
}

export function taoMayPhat(but: (sk: SuKienBut) => void) {
  let bang: BangNet = taoBang(), stt = 0
  let hang: MucPhat[] = [], vt = 0, gio = -1, im = false
  /** Nét đang vẽ dở: `da` = số điểm đã phát ra lớp vẽ. */
  const dangVe = new Map<string, { m: MucNet; da: number }>()
  let troCuoi: { x: number; y: number; luc: number } | null = null
  const phat = (sk: SuKienBut): void => { if (!im) but(sk) }
  const apSo = (m: MucPhat): SuKienBut[] => {
    stt += 1 // số thứ tự riêng của máy phát: sổ nét của Live bỏ mục có `stt` không tăng, còn `net.bin` có thể nối nhiều lần bật / tắt live
    const muc: MucSo = m.k === 'net' ? { stt, k: 'net', net: m.net, vt: m.vt, tu: 0, het: true } : m.k === 'xoa' ? { stt, k: 'xoa', id: m.id } : m.k === 'bang' ? { stt, k: 'bang', trang: m.trang, tiLe: m.tiLe } : { stt, k: m.k }
    return apMuc(bang, muc)
  }
  /** Chốt một nét vào bảng. Lớp vẽ đã nhận ĐỦ điểm và nét nằm cuối bảng ⇒ chỉ báo `net-xong` (in nốt đuôi, không vẽ lại cả lớp). */
  function chot(m: MucNet, da: number): void {
    const truoc = bang.net.length, n = m.net.diem.length, ds = apSo(m)
    const cuoi = n ? m.net.diem[n - 1]! : null
    if (cuoi) troCuoi = { x: cuoi[0], y: cuoi[1], luc: m.t + cuoi[3] }
    if (da > 0 && da === n && ds.length === 1 && ds[0]!.loai === 'net-moi' && ds[0]!.vt === truoc) { phat({ loai: 'net-xong', trang: bang.trang, id: m.net.id }); return }
    if (da > 0) phat({ loai: 'xoa', trang: bang.trang, id: [m.net.id] })
    for (const sk of ds) phat(sk)
  }
  function xaDangVe(): void {
    for (const e of dangVe.values()) chot(e.m, e.da)
    dangVe.clear()
  }
  /** Tiến tới giờ `t` (không lùi — lùi thì gọi `dungLai`). */
  function buoc(t: number): KhungMayPhat {
    if (t > gio) gio = t
    while (vt < hang.length && hang[vt]!.t <= gio) {
      const m = hang[vt++]!
      if (m.k === 'net') {
        const n = m.net.diem.length
        // nét đã viết xong từ trước mốc phát (tua tới, bỏ khoảng lặng, chấm một điểm) ⇒ vào bảng ngay
        if (n < 2 || gio >= m.t + m.net.diem[n - 1]![3]) { if (dangVe.delete(m.net.id)) phat({ loai: 'xoa', trang: bang.trang, id: [m.net.id] }); chot(m, 0) }
        else dangVe.set(m.net.id, { m, da: 0 })
      } else { xaDangVe(); for (const sk of apSo(m)) phat(sk) }
    }
    const dau: KhungMayPhat['dau'] = []
    for (const [id, e] of dangVe) {
      const ds = e.m.net.diem, n = ds.length, tt = gio - e.m.t
      let k = e.da
      while (k < n && ds[k]![3] <= tt) k++
      if (k > e.da) {
        const dn = e.m.net
        if (e.da === 0) phat({ loai: 'net-moi', trang: bang.trang, net: { id: dn.id, cong: dn.cong, mau: dn.mau, co: dn.co, diem: ds.slice(0, k) } })
        else phat({ loai: 'them-diem', trang: bang.trang, id, diem: ds.slice(e.da, k) })
        e.da = k
      }
      if (k >= n) { dangVe.delete(id); chot(e.m, e.da); continue }
      if (k > 0) {
        const a: DiemBut = ds[k - 1]!, b: DiemBut = ds[k]!, f = b[3] > a[3] ? Math.min(1, Math.max(0, (tt - a[3]) / (b[3] - a[3]))) : 1
        dau.push({ id, x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f })
      }
    }
    const d = dau.length ? dau[dau.length - 1]! : null
    return { dau, tro: d ? { x: d.x, y: d.y } : troCuoi && gio >= troCuoi.luc && gio - troCuoi.luc < NAN_TRO_MS ? { x: troCuoi.x, y: troCuoi.y } : null }
  }
  /** TUA: bỏ mọi thứ, nạp `ds` (bắt đầu từ một mốc «bảng mới») rồi dựng bảng tại `t`. Lớp vẽ nhận một sự kiện `trang` + phần đã viết của nét dở. */
  function dungLai(ds: readonly MucPhat[], t: number): KhungMayPhat {
    bang = taoBang(); stt = 0; hang = ds.slice(); vt = 0; gio = -1; dangVe.clear(); troCuoi = null
    im = true
    try { buoc(t) } finally { im = false }
    but({ loai: 'trang', trang: bang.trang, net: bang.net.slice(), tiLe: bang.tiLe })
    for (const [, e] of dangVe) if (e.da > 0) { const dn = e.m.net; but({ loai: 'net-moi', trang: bang.trang, net: { id: dn.id, cong: dn.cong, mau: dn.mau, co: dn.co, diem: dn.diem.slice(0, e.da) } }) }
    return buoc(t)
  }
  return {
    buoc, dungLai,
    /** Nối thêm mục (khúc `net.bin` kế tiếp, giờ không nhỏ hơn mục cuối đã có). */
    nap(ds: readonly MucPhat[]): void { for (const m of ds) hang.push(m) },
    /** Giờ đã phát tới (−1 = chưa dựng). */
    gio: (): number => gio,
    bang: (): BangNet => bang,
    soDangVe: (): number => dangVe.size,
  }
}
export type MayPhat = ReturnType<typeof taoMayPhat>
