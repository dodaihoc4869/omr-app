// Tiện ích THUẦN của trò «Sinh Tồn · Trang vở» (tách khỏi TroSinhTon.tsx 13/11, chỉ dời mã — không đổi hành vi): chữ ngắn, màu đội, đọc bảng màu,
// nhận máy yếu, xếp hạng hết ván, bảng vàng, dòng báo, bản đồ nhỏ. Chỉ TroSinhTon.tsx / sinh-ton-phu.tsx nhập ⇒ nằm chung mảnh lười TroSinhTon.
import type { CSSProperties } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'
import type { SinhTonAnh } from '../../lib/live-khoi/kieu'
import { ANH_MS, MAU_DAY, coKhien, docDong, laMay, ngoaiVong, type BanDo, type Diem, type NhanVat, type Toi, type Vong } from '../../lib/live-khoi/sinh-ton-loi'
import { taoBangMau, type BangMau, type Rgb } from './sinh-ton-hinh'
import { cauChuoi, veBanDoNho, type NvVe } from './sinh-ton-ve'
import type { Bao, DongVang, KetQua, ThanhLon } from './sinh-ton-phu'

/** Nguồn thanh máu: vòng khung ghi (≤ 2 lần / giây), chỉ hai lớp phủ đọc — không vẽ lại cả màn trò mỗi lần máu đổi. */
export class NguonThanh {
  private v: ThanhLon = { thay: null, boss: null }
  private f = new Set<() => void>()
  lay = (): ThanhLon => this.v
  nghe = (f: () => void): (() => void) => { this.f.add(f); return () => { this.f.delete(f) } }
  dat(v: ThanhLon): void { this.v = v; for (const f of this.f) f() }
}

export const kepDoi = (d: number): number => (d >= 0 && d < 4 ? Math.floor(d) : 0)
/** Hai chữ cuối của tên (tên gọi của người Việt), cắt ở 16 ký tự cho gọn trên sân. */
export const tenNgan = (ten: string): string => { const s = ten.trim().split(/\s+/).slice(-2).join(' '); return s.length > 16 ? `${s.slice(0, 15)}…` : s }
export const chuGio = (ms: number): string => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
export const bienDoi = (d: number): CSSProperties => ({ ['--doi' as string]: `var(${DOI_BPU[kepDoi(d)].mau})` }) as CSSProperties
const hoa = (s: string): string => s.toLocaleUpperCase('vi')

/** Đổi chuỗi màu trình duyệt đã tính (`rgb(…)` hoặc `color(srgb …)`) thành ba số 0..255. */
function tachMau(chuoi: string, macDinh: Rgb): Rgb {
  const so = chuoi.match(/-?\d*\.?\d+(?:e-?\d+)?/g)
  if (!so || so.length < 3) return macDinh
  const he = chuoi.startsWith('color(') ? 255 : 1
  const v = so.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(Number(x) * he))))
  return [v[0], v[1], v[2]]
}
/** Đọc bảng màu từ biến CSS tại đúng chỗ trò đang đứng: nền / chữ từ --st-* (luôn tối), đội + trạng thái từ token. */
export function docBangMau(goc: HTMLElement): BangMau {
  const que = document.createElement('span')
  que.style.display = 'none'
  goc.appendChild(que)
  const doc = (bien: string, macDinh: Rgb): Rgb => {
    que.style.color = ''
    que.style.color = `var(${bien})`
    return que.style.color ? tachMau(getComputedStyle(que).color, macDinh) : macDinh
  }
  const bang = taoBangMau(doc, tachMau(getComputedStyle(goc).color, [128, 128, 128]))
  que.remove()
  return bang
}

/** Máy này vừa vẽ không kịp ⇒ nhớ 1 ngày để lần sau vào là kiểu phẳng ngay (không phải chịu vài giây đầu giật); hết hạn thì thử lại. */
const KHOA_PHANG = 'ddh.sinhton.phang'
export function docPhang(): boolean {
  try { const luc = Number(localStorage.getItem(KHOA_PHANG)); return luc > 0 && Date.now() - luc < 86_400_000 } catch { return false }
}
export function ghiPhang(): void { try { localStorage.setItem(KHOA_PHANG, String(Date.now())) } catch { /* không có kho */ } }

/** Máy YẾU theo phần cứng, nhận NGAY từ đầu (khỏi chịu vài giây đầu giật): ≤ 3 GB RAM (chỉ Chrome Android khai) hoặc ≤ 2 lõi.
 *  KHÔNG coi «4 lõi» là yếu, và KHÔNG tin số lõi trên iPhone / iPad (Safari có thể khai số lõi thấp hơn thật) — nhiều máy 4 lõi vẫn chạy đủ hình; máy nào giật thật
 *  thì bộ tự hạ (hai cửa sổ < 48 khung / giây) bắt sau ~2 giây và nhớ theo máy. Trình duyệt không khai (`undefined`) thì không đoán. */
export function phanCungYeu(): boolean {
  try {
    const n = navigator as Navigator & { deviceMemory?: number }
    const lo = n.hardwareConcurrency, ram = n.deviceMemory, ios = /iPhone|iPad|iPod/.test(n.userAgent)
    return (typeof ram === 'number' && ram > 0 && ram <= 3) || (!ios && typeof lo === 'number' && lo > 0 && lo <= 2)
  } catch { return false }
}

/** Hết ván: xếp hạng bốn đội «Đỗ thủ khoa · Đỗ á khoa · Đỗ vớt · Thi lại ván sau» từ điểm đội (`diemCu` = "a,b,c,d") + người hạ nhiều nhất mỗi đội. */
export function xepHangVan(diemCu: string, soHa: ReadonlyMap<string, number>, tenCua: (id: string) => string, doiCua: (id: string) => number): KetQua['hang'] {
  const d = diemCu ? diemCu.split(',').map(Number) : [0, 0, 0, 0]
  return [0, 1, 2, 3].map((doi) => {
    let nhat = '', nhieu = 0
    // Máy bù không bao giờ được vinh danh (không có thật).
    for (const [id, soLan] of soHa) if (soLan > nhieu && !laMay(id) && doiCua(id) === doi) { nhieu = soLan; nhat = `${tenCua(id)} ${soLan} lượt hạ · nhiều nhất đội` }
    // Hạng = số đội HƠN HẲN (bằng điểm ⇒ cùng hạng, hạng sau nhảy cóc: 5 · 3 · 3 · 1 ⇒ 0 · 1 · 1 · 3); `hoa` = có đội khác cùng điểm (chữ «Cùng …» — `chuXep`).
    return { doi, diem: d[doi] ?? 0, nhat, xep: d.filter((x) => x > (d[doi] ?? 0)).length, hoa: d.filter((x) => x === (d[doi] ?? 0)).length > 1 }
  }).sort((a, b) => b.diem - a.diem)
}

/** Bảng vàng: top 3 EM THẬT từ `bv` của ảnh chụp (máy bù không lên bảng); dòng của em ghi «(em)» và mang đội của em. */
export function docBangVang(bv: readonly unknown[], xem: boolean, sbd: string, tenToi: string, doiEm: number, tk: string, tenCua: (id: string) => string, doiCua: (id: string) => number): DongVang[] {
  const top: DongVang[] = []
  for (const r of bv) {
    if (!Array.isArray(r) || typeof r[0] !== 'string' || laMay(r[0]) || typeof r[1] !== 'number' || top.length >= 3) continue
    const em = !xem && r[0] === sbd
    top.push({ ten: em ? `${tenNgan(tenToi)} (em)` : tenCua(r[0]), ha: r[1], doi: em ? doiEm : doiCua(r[0]), em, tk: r[0] === tk })
  }
  return top
}

/** Dòng báo dưới bảng điểm của máy em (ưu tiên từ trên xuống); `null` = không báo. */
export function chonBao(chet: boolean, nghi: boolean, matMang: boolean, vui: { chu: string } | null, v: Vong, an: boolean, tt: Toi, nay: number, daDung: boolean, tuLucMo: number, lucBcEm: number): Bao | null {
  if (chet || nghi) return null
  if (matMang) return { kieu: 'canh', chu: 'Mất kết nối · đang nối lại · em vẫn chạy được, các bạn tạm đứng yên' }
  if (vui) return { kieu: 'vui', chu: vui.chu }
  if (ngoaiVong(v, tt.x, tt.y) && !coKhien(tt, nay)) return { kieu: 'canh', chu: 'Ra khỏi phòng thi · đang mất máu' }
  if (an) return { kieu: 'an', chu: `Đang ẩn trong bụi · đội khác không thấy em${tt.mau < MAU_DAY ? ' · máu đang hồi' : ''}` }
  if (!daDung && tuLucMo < 9000) return { kieu: 'meo', chu: 'Vuốt để chạy · Chạm để tới · Súng tự bắn đối thủ gần nhất' }
  if (lucBcEm < 0 && tuLucMo >= 9000 && tuLucMo < 16000) return { kieu: 'meo', chu: 'Chạm bé ma của em để gửi biểu cảm · cả lớp thấy 2 giây' }
  return null
}

/** Bản đồ nhỏ góc màn (130 px ngang) = đồng đội trong ảnh + chấm `dd` + sao thủ khoa; cỡ canvas theo dpr (máy yếu dpr 1). */
export function veNho(nho: HTMLCanvasElement, gn: CanvasRenderingContext2D, yeu: boolean, bd: BanDo, bm: BangMau, v: Vong, nvVe: readonly NvVe[], doiEm: number, dd: readonly number[], sao: Diem | null, boss: Diem | null = null): void {
  const r = 130, c = Math.round((r * bd.cao) / bd.rong), d2 = Math.min(yeu ? 1 : 2, window.devicePixelRatio || 1)
  if (nho.width !== Math.round(r * d2) || nho.height !== Math.round(c * d2)) { nho.width = Math.round(r * d2); nho.height = Math.round(c * d2) }
  veBanDoNho(gn, r, c, d2, bd, bm, v, nvVe, doiEm, dd, sao, boss)
}

/** Nhân vật khác đang nội suy giữa hai ảnh chụp; `hl` = lúc bắt đầu hiện ra (0 = không), `hs` = hiện kiểu sống lại.
 *  `giu` = dòng GIỮ LẠI từ ảnh trước vì ảnh vừa nhận là ảnh mỏng (`m: 1`) — chỉ để vẽ, KHÔNG dùng ngắm / tính sát thương (hợp đồng kieu.ts). */
export interface NoiSuy { nv: NhanVat; tx: number; ty: number; luc: number; goc: number; hl: number; hs: boolean; giu: boolean }

/** Đọc các dòng của ẢNH VỪA NHẬN (bỏ dòng của em `boQua`) thành bảng nội suy mới. Ghi vào `dongAnh` các dòng đọc được (chỉ những dòng này được tính
 *  sát thương), vào `matMau` ai vừa mất máu. `mong` = ảnh mỏng cùng sân ⇒ giữ dòng cũ của người vắng mặt (đánh dấu `giu`). */
export function noiSuyAnh(dsAnh: SinhTonAnh['ds'], boQua: string | null, noi: Record<string, NoiSuy>, luc: number, dauVan: boolean, bd: BanDo, soAnh: number, mong: boolean, dongAnh: NhanVat[], matMau: string[]): Record<string, NoiSuy> {
  const moi: Record<string, NoiSuy> = {}
  dongAnh.length = 0
  for (const id in dsAnh) {
    if (id === boQua) continue
    const nv = docDong(id, dsAnh[id])
    if (!nv) continue
    dongAnh.push(nv)
    const cu = noi[id]
    if (cu) {
      const f = Math.min(1, (luc - cu.luc) / ANH_MS)
      // Vừa hồi sinh (nhảy về trại) thì không trượt ngang sân; sống lại / đầu ván ⇒ hiệu ứng hiện ra.
      const nhay = Math.hypot(nv.x - cu.nv.x, nv.y - cu.nv.y) > 260
      const song = cu.nv.mau <= 0 && nv.mau > 0, vaoVan = dauVan && (nhay || song)
      moi[id] = { nv, tx: nhay ? nv.x : cu.tx + (cu.nv.x - cu.tx) * f, ty: nhay ? nv.y : cu.ty + (cu.nv.y - cu.ty) * f, luc, goc: cu.goc, hl: song || vaoVan ? luc : cu.hl, hs: vaoVan ? false : song ? true : cu.hs, giu: false }
      if (nv.mau < cu.nv.mau && cu.nv.mau > 0 && !cu.giu) matMau.push(id)
    } else {
      // Người mới lọt vào ảnh (vào giữa trận, hoặc chỉ vừa tới gần — «chỉ gửi gần») ⇒ hiện ra kiểu sống lại; KHÔNG báo «vào đội» (vào phòng đọc từ `ds`).
      moi[id] = { nv, tx: nv.x, ty: nv.y, luc, goc: nv.x > bd.rong / 2 ? Math.PI : 0, hl: soAnh > 1 ? luc : 0, hs: true, giu: false }
    }
  }
  // ẢNH MỎNG (`m: 1`): người ở vành ngoài vắng mặt ⇒ GIỮ dòng cũ (nguyên đối tượng, để vẽ / nội suy tiếp). Ảnh đủ mà vắng ⇒ đã ra khỏi tập, bỏ.
  if (mong) for (const id in noi) if (!moi[id]) { const o = noi[id]; o.giu = true; moi[id] = o }
  return moi
}

/** TỰ HẠ: đo theo từng cửa sổ 0,6 giây (bỏ 1 giây đầu lúc còn nướng ảnh, app còn bận việc mở phòng); `buoc` = true khi HAI cửa sổ liền nhau dưới 48 khung / giây. */
export class DoTuHa {
  private dau = 0; private tu = 0; private khung = 0; private xau = 0
  /** Tab vừa hiện lại ⇒ đo lại từ đầu (khung đầu sau khi ẩn không phản ánh sức máy). */
  datLai(): void { this.dau = 0; this.tu = 0; this.xau = 0 }
  buoc(luc: number): boolean {
    if (!this.dau) this.dau = luc
    if (luc - this.dau <= 1000) return false
    if (!this.tu) { this.tu = luc; this.khung = 0 }
    this.khung++
    if (luc - this.tu < 600) return false
    this.xau = this.khung / ((luc - this.tu) / 1000) < 48 ? this.xau + 1 : 0
    this.tu = luc; this.khung = 0
    return this.xau >= 2
  }
}

/** Rung nhẹ màn khi em hạ được bạn (≤ 120 ms, transform trên lớp bọc canvas). Bên gọi đã lọc giảm chuyển động / bản êm / máy yếu. */
export function rungNhe(r: HTMLElement | null): void {
  if (!r || typeof r.animate !== 'function') return
  r.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(-3px, 2px)' }, { transform: 'translate(2px, -2px)' }, { transform: 'translate(0, 0)' }], { duration: 110, easing: 'ease-out' })
}

/** Con dấu khi CHÍNH EM hạ được bạn: [chữ, dòng phụ] hoặc null. `sung` = đuôi « · súng lên …» ('' khi không lên cấp). */
export function cauHoHa(laTk: boolean, chBi: number, ch: number, haVan: number, tenBi: string, sung: string): [string, string] | null {
  if (laTk) return ['ĐÃ TIÊU DIỆT THỦ KHOA!', `Em hạ thủ khoa ${tenBi}${sung}`]
  if (chBi >= 3) return ['ĐÁNH TRƯỢT ĐẠI HỌC!', `${tenBi} đang chuỗi ${chBi}${sung}`]
  if (ch >= 2) return [hoa(cauChuoi(ch)), `Hạ ${ch} bạn liên tiếp${sung}`]
  if (haVan === 1) return ['MỞ BÀI!', 'Em hạ được bạn đầu tiên của ván']
  return null
}
