// XEM LẠI LIVE — MÁY PHÁT NÉT (đặc tả mục 4.9). Thuần: không DOM, không đồng hồ — nơi gọi truyền giờ trên TRỤC TIẾNG vào.
// Nguồn = các bản ghi `net.bin` (nguyên khung sổ nét của Live, `giaiSo`). Ra = đúng SỰ KIỆN của bộ máy bút (`SuKienBut`) mà lớp vẽ bảng live của máy em
// (`src/components/live/ve-bang.ts`) đang nhận ⇒ cùng dữ liệu, cùng hình như lúc live. Bảng hiện tại giữ bằng sổ nét của Live (`so-net.ts`: `apMuc`).
// · Nét xong có giờ bắt đầu `t`: vẽ DẦN từng điểm theo `t + diem[i][3]`; đầu nét nội suy thẳng giữa hai điểm kẹp mốc phát (cùng công thức `noi-suy.ts`).
//   Live cần đệm phát để khử dao động mạng; phát lại có sẵn đủ điểm + giờ nên không đệm (đặc tả: «không cần đệm phát»).
// · Xoá / xoá hết / bảng mới / hoàn tác: áp tại `t`. Nét còn đang vẽ dở lúc đó được chốt trước (giữ đúng thứ tự sổ).
// · TUA: `dungLai(ds, t)` dựng bảng tại `t` trong IM LẶNG rồi phát MỘT sự kiện `trang` (kèm nét dở) ⇒ lớp vẽ vẽ lại đúng một lần.
// · CÂY BÚT GIỮA HAI NÉT (13/11, thầy: «nét bút xem lại vẫn bị giật, chưa mượt như trong live»): lúc live máy em nhận cả đường bút LƠ LỬNG của thầy nên
//   cây bút lướt từ cuối nét này sang đầu nét sau; bản ghi không lưu đường lơ lửng ⇒ trước đây cây bút ĐỨNG ở cuối nét suốt lúc nhấc bút rồi VỤT sang đầu
//   nét sau (viết chữ: 3–5 lần mỗi giây). Nay máy phát nhìn trước nét kế trong hàng đợi và cho cây bút LƯỚT tới đó đúng lúc nét bắt đầu (`troGiuaNet`).
// · ĐIỂM TRÙNG GIỜ (`raiGio`): máy thầy gom nhiều mẫu vào một giờ ⇒ đầu nét đứng rồi nhảy cả cụm; rải đều cụm ấy trên quãng từ điểm trước nó.
import { giaiTrang } from '../../../components/live/bo-cuc'
import type { DiemBut, NetBut, SuKienBut } from '../../../lib/but-bang-loi'
import { giaiSo, type MucSo } from '../../../lib/live/ma-net'
import { apMuc, taoBang, type BangNet } from '../../../lib/live/so-net'

/** Một mục đã giải của `net.bin` (nét nhiều khung đã ghép thành một). `t` = mili-giây trên trục tiếng. */
export type MucPhat = { t: number } & (
  /** `gio` = giờ phát từng điểm (ms từ đầu nét) sau khi rải các điểm trùng giờ; vắng ⇒ dùng `diem[i][3]`. */
  | { k: 'net'; net: NetBut; vt: number | null; gio?: number[] }
  | { k: 'xoa'; id: string[] }
  | { k: 'xoa-het' }
  | { k: 'bang'; trang: string; tiLe: number }
  | { k: 'hoan-tac' })
type MucNet = Extract<MucPhat, { k: 'net' }>
export interface KhungMayPhat {
  /** Đầu nét nội suy của các nét đang vẽ dở (toạ độ 0..1) — lớp vẽ dùng làm đuôi nét. */
  dau: { id: string; x: number; y: number }[]
  /** Cây bút: `cham` = đang ở đầu nét `net`; không chạm = đang lướt sang nét kế (`sat`: chỗ này đã mượt sẵn, lớp vẽ bám đúng) hoặc nán ở cuối nét
   *  vừa xong (`NAN_TRO_MS` rồi ẩn). */
  tro: { x: number; y: number; cham: boolean; net?: string; sat?: boolean } | null
}
export const NAN_TRO_MS = 900
/** Nhấc bút không quá ngần này ⇒ cây bút lướt suốt quãng nhấc; lâu hơn ⇒ nán ở cuối nét rồi mới lướt (`LUOT_IT_MS` … `LUOT_TRON_MS` tuỳ quãng đường). */
export const LUOT_TRON_MS = 700, LUOT_IT_MS = 220
/** Cây bút đang ẩn (nghỉ lâu, vừa tua) ⇒ hiện sẵn ở đầu nét kế trước ngần này. */
export const HIEN_TRUOC_MS = 300
/** Tay người dời bút: nhanh dần rồi chậm dần. */
const emTay = (f: number): number => (f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f))

/** Giờ phát từng điểm của một nét. Một CỤM điểm cùng một giờ T (máy thầy gom mẫu) đứng sau điểm có giờ T0 < T ⇒ rải đều cụm trên (T0, T] — bút không thể ở
 *  hai chỗ cùng một lúc. Nét không có cụm nào như vậy ⇒ null (dùng giờ gốc). Nét dựng lại tức thì (mọi điểm giờ 0) giữ nguyên. */
export function raiGio(ds: readonly DiemBut[]): number[] | null {
  let ra: number[] | null = null
  for (let i = 1; i < ds.length;) {
    let j = i
    while (j + 1 < ds.length && ds[j + 1]![3] <= ds[i]![3]) j++
    const t0 = ds[i - 1]![3], t = ds[i]![3]
    if (j > i && t - t0 >= 2) { ra ??= ds.map((p) => p[3]); for (let k = i; k <= j; k++) ra[k] = t0 + ((t - t0) * (k - i + 1)) / (j - i + 1) }
    i = j + 1
  }
  return ra
}

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
    if (m.het) { const gio = raiGio(ghep.net.diem); ra.push({ t: ghep.t, k: 'net', net: ghep.net, vt: ghep.vt, ...(gio ? { gio } : null) }); ghep = null }
  }
  return ra
}

export function taoMayPhat(but: (sk: SuKienBut) => void) {
  let bang: BangNet = taoBang(), stt = 0
  let hang: MucPhat[] = [], vt = 0, gio = -1, im = false
  /** Nét đang vẽ dở: `da` = số điểm đã phát ra lớp vẽ. */
  const dangVe = new Map<string, { m: MucNet; da: number }>()
  /** Chỗ cuối của nét vừa xong (`bang` = nét trên bảng đen) · nét cây bút đang bám. */
  let troCuoi: { x: number; y: number; luc: number; bang: boolean } | null = null, theoNet = ''
  let khoaVung = '\0', oBang: readonly number[] = [0, 0, 0, 0]
  /** Giờ phát điểm thứ `i` của nét (ms từ đầu nét). */
  const gd = (m: MucNet, i: number): number => (m.gio ? m.gio[i]! : m.net.diem[i]![3])
  /** Nét nằm trên BẢNG ĐEN (mã «b_…» hoặc bắt đầu trong ô bảng — cùng luật với lớp vẽ)? Giấy và bảng là hai hệ toạ độ ⇒ cây bút không lướt từ vùng này sang vùng kia. */
  const laBang = (n: NetBut): boolean => {
    if (n.id.charCodeAt(0) === 98 && n.id.charCodeAt(1) === 95) return true
    if (bang.trang !== khoaVung) { khoaVung = bang.trang; oBang = giaiTrang(bang.trang).vung.bang }
    const p = n.diem[0]
    return !!p && p[0] >= oBang[0]! && p[0] <= oBang[2]! && p[1] >= oBang[1]! && p[1] <= oBang[3]!
  }
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
    if (cuoi) troCuoi = { x: cuoi[0], y: cuoi[1], luc: m.t + gd(m, n - 1), bang: laBang(m.net) }
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
        if (n < 2 || gio >= m.t + gd(m, n - 1)) { if (dangVe.delete(m.net.id)) phat({ loai: 'xoa', trang: bang.trang, id: [m.net.id] }); chot(m, 0) }
        else dangVe.set(m.net.id, { m, da: 0 })
      } else { xaDangVe(); for (const sk of apSo(m)) phat(sk); if (m.k === 'bang') troCuoi = null }
    }
    const dau: KhungMayPhat['dau'] = []
    for (const [id, e] of dangVe) {
      const ds = e.m.net.diem, n = ds.length, tt = gio - e.m.t
      let k = e.da
      while (k < n && gd(e.m, k) <= tt) k++
      if (k > e.da) {
        const dn = e.m.net
        if (e.da === 0) phat({ loai: 'net-moi', trang: bang.trang, net: { id: dn.id, cong: dn.cong, mau: dn.mau, co: dn.co, diem: ds.slice(0, k) } })
        else phat({ loai: 'them-diem', trang: bang.trang, id, diem: ds.slice(e.da, k) })
        e.da = k
      }
      if (k >= n) { dangVe.delete(id); chot(e.m, e.da); continue }
      if (k > 0) {
        const a: DiemBut = ds[k - 1]!, b: DiemBut = ds[k]!, ta = gd(e.m, k - 1), tb = gd(e.m, k), f = tb > ta ? Math.min(1, Math.max(0, (tt - ta) / (tb - ta))) : 1
        dau.push({ id, x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f })
      }
    }
    // cây bút bám MỘT nét cho tới khi nét ấy xong (nhiều nét chồng giờ: không nhảy qua lại giữa các đầu nét)
    const d = dau.length ? dau.find((x) => x.id === theoNet) ?? dau[dau.length - 1]! : null
    theoNet = d ? d.id : ''
    return { dau, tro: d ? { x: d.x, y: d.y, cham: true, net: d.id } : troGiuaNet() }
  }
  /** Cây bút lúc KHÔNG có nét nào đang vẽ: lướt từ cuối nét vừa xong tới đầu nét thầy sắp viết (đứng đầu hàng đợi), tới nơi đúng lúc nét bắt đầu. */
  function troGiuaNet(): KhungMayPhat['tro'] {
    const c = troCuoi, m = vt < hang.length ? hang[vt]! : null
    const nan = !!c && gio >= c.luc && gio - c.luc < NAN_TRO_MS
    // nét kế là nét thầy VIẾT (không phải nét dựng lại tức thì / chèn lại do hoàn tác)
    if (m && m.k === 'net' && m.vt == null && m.net.diem.length && !(m.net.diem.length > 1 && gd(m, m.net.diem.length - 1) <= 0)) {
      const p = m.net.diem[0]!, con = m.t + gd(m, 0) - gio
      if (c && gio >= c.luc && c.bang === laBang(m.net)) {
        const nghi = m.t + gd(m, 0) - c.luc, xa = Math.hypot((p[0] - c.x) * bang.tiLe, p[1] - c.y)
        // nghỉ ngắn: lướt suốt quãng nghỉ. Nghỉ dài hơn: nán rồi lướt (xa thì lướt lâu hơn); cây bút sắp hết nán mà chưa tới lúc lướt ⇒ lướt sớm cho khỏi ẩn rồi hiện
        const luot = nghi <= LUOT_TRON_MS ? nghi : Math.min(LUOT_TRON_MS, Math.max(LUOT_IT_MS, 160 + 1400 * xa, nghi - NAN_TRO_MS))
        if (nghi > 0 && nghi - luot <= NAN_TRO_MS) {
          if (con >= luot) return { x: c.x, y: c.y, cham: false }
          const f = emTay(1 - con / luot)
          return { x: c.x + (p[0] - c.x) * f, y: c.y + (p[1] - c.y) * f, cham: false, sat: true }
        }
      }
      if (con <= HIEN_TRUOC_MS) return { x: p[0], y: p[1], cham: false }
    }
    return nan ? { x: c!.x, y: c!.y, cham: false } : null
  }
  /** TUA: bỏ mọi thứ, nạp `ds` (bắt đầu từ một mốc «bảng mới») rồi dựng bảng tại `t`. Lớp vẽ nhận một sự kiện `trang` + phần đã viết của nét dở. */
  function dungLai(ds: readonly MucPhat[], t: number): KhungMayPhat {
    bang = taoBang(); stt = 0; hang = ds.slice(); vt = 0; gio = -1; dangVe.clear(); troCuoi = null; theoNet = ''
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
