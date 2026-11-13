// LIVE BẢNG — MÃ HOÁ NHỊ PHÂN NÉT (đặc tả docs/dac-ta-live-bang-1011.md mục 4.3). Thuần, không DOM.
// NÉT là nét của bộ máy bút (src/lib/but-bang-loi.ts): `{ id, cong: 'but' | 'tay', mau, co, diem: [x, y, apLuc, t][] }` — x, y 0..1 (5 số lẻ), áp lực 0..1 (2 số lẻ),
// t = mili-giây kể từ điểm đầu nét. Mã hoá KHÔNG MẤT: máy em giải ra đúng từng số như máy thầy ⇒ `LoiBut` dựng nét y hệt.
// Hai họ khung, cùng dùng cho DataChannel «net» (qua SFU) và đường dự phòng WebSocket (phòng chuyển nguyên văn, không giải mã):
//   SỔ NÉT (đúng + đủ, phòng đánh số và lưu):   [mã u8][stt u32] + thân             — nét xong · xoá nét · xoá hết · bảng mới · hoàn tác
//   ĐIỂM ĐANG VIẾT (không lưu, mất thì bỏ):     [mã u8][phiên u16][tGui u32] + thân  — điểm · con trỏ lơ lửng · nhấc bút
// Mọi số nhiều byte là little-endian. Một điểm = 9 byte: x u24, y u24 (× 100000), áp lực u8 (× 100), dt u16 (ms so với điểm trước).
import type { DiemBut, NetBut } from '../but-bang-loi'
import { KHUNG_TOI_DA, MA_DIEM, MA_SO } from '../bpu/phong-live'

/** Phần đầu của nét (không kèm điểm). */
export type DauNet = Pick<NetBut, 'id' | 'cong' | 'mau' | 'co'>

export type MucSo = { stt: number } & (
  /** Nét đã xong (hoặc một PHẦN của nét rất dài: `tu` = chỉ số điểm đầu của phần, `het` = phần cuối). `vt` = vị trí chèn trong mảng nét; null = cuối. */
  | { k: 'net'; net: NetBut; vt: number | null; tu: number; het: boolean }
  | { k: 'xoa'; id: string[] }
  | { k: 'xoa-het' }
  /** Bảng mới (thầy chuyển câu / sang trang): `trang` = khoá trang của bộ máy bút, `tiLe` = ngang / dọc vùng viết. */
  | { k: 'bang'; trang: string; tiLe: number }
  | { k: 'hoan-tac' })
export type GoiDiem = { phien: number; tGui: number } & (
  /** `tu` = chỉ số (trong nét) của điểm đầu gói; `diem[i][3]` = ms kể từ đầu nét (như bộ máy bút); `tGoc` = giờ live của thầy lúc nét bắt đầu
   *  ⇒ giờ live của một điểm = `tGoc + diem[i][3]`. */
  | { k: 'diem'; dau: DauNet; tGoc: number; tu: number; diem: DiemBut[] }
  /** (13/11) `lz` = thầy đang bật CHẤM LAZE (phím P): máy em vẽ chấm đỏ thay cây bút. Gói 14 byte (thêm 1 byte cờ cuối); máy em bản cũ đọc x, y và bỏ qua byte thừa. */
  | { k: 'tro'; x: number; y: number; lz?: boolean }
  /** `tong` = tổng số điểm của nét (máy em biết mình đã đủ chưa). */
  | { k: 'nhac'; id: string; tong: number })

/** Gói điểm đang viết qua DataChannel không tin cậy: giữ dưới một MTU để không bị xẻ mảnh. */
export const GOI_DIEM_TOI_DA = 1100
export const BYTE_MOI_DIEM = 9
const CHIA = 1e5
const VT_CUOI = 0xffff
const enc = new TextEncoder(), dec = new TextDecoder()
const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)
const so = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

class Ghi {
  b: Uint8Array<ArrayBuffer>
  v: DataView
  n = 0
  constructor(co: number) { this.b = new Uint8Array(co); this.v = new DataView(this.b.buffer) }
  u8(x: number) { this.v.setUint8(this.n, kep(Math.round(x), 0, 255)); this.n += 1 }
  u16(x: number) { this.v.setUint16(this.n, kep(Math.round(x), 0, 65535), true); this.n += 2 }
  u24(x: number) { const k = kep(Math.round(x), 0, 0xffffff); this.v.setUint16(this.n, k & 65535, true); this.v.setUint8(this.n + 2, k >>> 16); this.n += 3 }
  u32(x: number) { this.v.setUint32(this.n, kep(Math.round(x), 0, 0xffffffff), true); this.n += 4 }
  i32(x: number) { this.v.setInt32(this.n, kep(Math.round(x), -0x7fffffff, 0x7fffffff), true); this.n += 4 }
  f64(x: number) { this.v.setFloat64(this.n, x, true); this.n += 8 }
  /** Chuỗi ngắn: độ dài u8 + UTF-8 (cắt ở `toiDa` byte, không cắt giữa ký tự). */
  chu(s: string, toiDa: number) {
    let m = enc.encode(String(s ?? ''))
    if (m.length > toiDa) { let c = toiDa; while (c > 0 && (m[c]! & 0xc0) === 0x80) c--; m = m.subarray(0, c) }
    this.u8(m.length); this.b.set(m, this.n); this.n += m.length
  }
  xong(): Uint8Array<ArrayBuffer> { return this.b.subarray(0, this.n) }
}
class Doc {
  b: Uint8Array
  v: DataView
  n = 0
  constructor(b: Uint8Array) { this.b = b; this.v = new DataView(b.buffer, b.byteOffset, b.byteLength) }
  con(): number { return this.b.length - this.n }
  u8(): number { const x = this.v.getUint8(this.n); this.n += 1; return x }
  u16(): number { const x = this.v.getUint16(this.n, true); this.n += 2; return x }
  u24(): number { const x = this.v.getUint16(this.n, true) | (this.v.getUint8(this.n + 2) << 16); this.n += 3; return x }
  u32(): number { const x = this.v.getUint32(this.n, true); this.n += 4; return x }
  i32(): number { const x = this.v.getInt32(this.n, true); this.n += 4; return x }
  f64(): number { const x = this.v.getFloat64(this.n, true); this.n += 8; return x }
  chu(): string { const d = this.u8(); if (d > this.con()) throw new RangeError('chuỗi vượt khung'); const s = dec.decode(this.b.subarray(this.n, this.n + d)); this.n += d; return s }
}

const ID_TOI_DA = 40, MAU_TOI_DA = 40, TRANG_TOI_DA = 60
const DAU_TOI_DA = 1 + ID_TOI_DA + 1 + 1 + MAU_TOI_DA + 8
function ghiDau(g: Ghi, d: DauNet): void { g.chu(d.id, ID_TOI_DA); g.u8(d.cong === 'tay' ? 1 : 0); g.chu(d.mau, MAU_TOI_DA); g.f64(so(d.co)) }
function docDau(d: Doc): DauNet { const id = d.chu(), cong = d.u8() === 1 ? 'tay' as const : 'but' as const, mau = d.chu(), co = d.f64(); return { id, cong, mau, co } }
/** Ghi các điểm; giờ điểm đầu do nơi gọi ghi riêng (u32), các điểm sau ghi chênh lệch `dt` (kẹp 0..65535 ms, không lùi). */
function ghiDiem(g: Ghi, ds: readonly DiemBut[]): void {
  let truoc = ds.length ? so(ds[0]![3]) : 0
  for (const p of ds) {
    const t = Math.max(truoc, so(p[3]))
    g.u24(so(p[0]) * CHIA); g.u24(so(p[1]) * CHIA); g.u8(so(p[2]) * 100); g.u16(t - truoc)
    truoc = t
  }
}
function docDiem(d: Doc, n: number, tDau: number): DiemBut[] {
  if (n * BYTE_MOI_DIEM > d.con()) throw new RangeError('thiếu điểm')
  const ra: DiemBut[] = []
  let t = tDau
  for (let i = 0; i < n; i++) { const x = d.u24() / CHIA, y = d.u24() / CHIA, a = d.u8() / 100; t += d.u16(); ra.push([x, y, a, t]) }
  return ra
}

// ── SỔ NÉT ──
const dauSo = (ma: number, co: number): Ghi => { const g = new Ghi(co); g.u8(ma); g.u32(0); return g }
const DAU_NET_XONG = 5 + DAU_TOI_DA + 2 + 2 + 1 + 4 + 2
/** Số điểm nhiều nhất trong MỘT khung nét xong (khung ≤ 16 KB). Nét dài hơn ⇒ nhiều khung nối nhau. */
export const DIEM_TOI_DA_MOT_KHUNG = Math.floor((KHUNG_TOI_DA - DAU_NET_XONG) / BYTE_MOI_DIEM)
/** Nét đã xong ⇒ MỘT hoặc nhiều khung (nét rất dài chia phần, mỗi khung ≤ 16 KB; phần cuối mang cờ `het`). `vt` = vị trí chèn (hoàn tác xoá / làm lại); bỏ trống = cuối. */
export function maNetXong(net: NetBut, vt?: number | null): Uint8Array<ArrayBuffer>[] {
  const ra: Uint8Array<ArrayBuffer>[] = [], tong = net.diem.length
  for (let tu = 0; tu === 0 || tu < tong; tu += DIEM_TOI_DA_MOT_KHUNG) {
    const ds = net.diem.slice(tu, tu + DIEM_TOI_DA_MOT_KHUNG)
    const g = dauSo(MA_SO.netXong, DAU_NET_XONG + ds.length * BYTE_MOI_DIEM)
    ghiDau(g, net); g.u16(vt == null || vt < 0 || vt >= VT_CUOI ? VT_CUOI : vt); g.u16(tu); g.u8(tu + ds.length >= tong ? 1 : 0)
    g.u32(ds.length ? so(ds[0]![3]) : 0); g.u16(ds.length); ghiDiem(g, ds)
    ra.push(g.xong())
  }
  return ra
}
/** Xoá một hay nhiều nét (bộ máy bút tẩy / hoàn tác theo nhóm). Quá nhiều mã ⇒ nhiều khung. */
export function maXoaNet(id: string | readonly string[]): Uint8Array<ArrayBuffer>[] {
  const ds = typeof id === 'string' ? [id] : id, ra: Uint8Array<ArrayBuffer>[] = []
  for (let i = 0; i < ds.length; i += 200) {
    const phan = ds.slice(i, i + 200), g = dauSo(MA_SO.xoaNet, 6 + phan.length * (ID_TOI_DA + 1))
    g.u8(phan.length); for (const s of phan) g.chu(s, ID_TOI_DA)
    ra.push(g.xong())
  }
  return ra
}
export function maXoaHet(): Uint8Array<ArrayBuffer> { return dauSo(MA_SO.xoaHet, 5).xong() }
/** Bảng mới (thầy chuyển câu / sang trang): khoá trang của bộ máy bút + tỉ lệ ngang / dọc vùng viết. Các nét sẵn có của trang gửi tiếp bằng `maNetXong`. */
export function maBangMoi(trang: string, tiLe: number): Uint8Array<ArrayBuffer> { const g = dauSo(MA_SO.bangMoi, 5 + 8 + 1 + TRANG_TOI_DA); g.f64(so(tiLe)); g.chu(trang, TRANG_TOI_DA); return g.xong() }
export function maHoanTac(): Uint8Array<ArrayBuffer> { return dauSo(MA_SO.hoanTac, 5).xong() }

const mang = (k: ArrayBuffer | Uint8Array): Uint8Array => (k instanceof Uint8Array ? k : new Uint8Array(k))
/** Giải một mục sổ nét. Khung lạ / hỏng / quá 16 KB ⇒ null (không ném). */
export function giaiSo(khung: ArrayBuffer | Uint8Array): MucSo | null {
  const b = mang(khung)
  if (b.length < 5 || b.length > KHUNG_TOI_DA) return null
  try {
    const d = new Doc(b), ma = d.u8(), stt = d.u32()
    if (ma === MA_SO.netXong) {
      const dau = docDau(d), vt = d.u16(), tu = d.u16(), het = d.u8() === 1, tDau = d.u32(), n = d.u16()
      return { stt, k: 'net', net: { ...dau, diem: docDiem(d, n, tDau) }, vt: vt === VT_CUOI ? null : vt, tu, het }
    }
    if (ma === MA_SO.xoaNet) { const n = d.u8(), id: string[] = []; for (let i = 0; i < n; i++) id.push(d.chu()); return { stt, k: 'xoa', id } }
    if (ma === MA_SO.xoaHet) return { stt, k: 'xoa-het' }
    if (ma === MA_SO.bangMoi) { const tiLe = d.f64(); return { stt, k: 'bang', trang: d.chu(), tiLe } }
    if (ma === MA_SO.hoanTac) return { stt, k: 'hoan-tac' }
    return null
  } catch { return null }
}

// ── ĐIỂM ĐANG VIẾT ──
const dauGoi = (ma: number, phien: number, tGui: number, co: number): Ghi => { const g = new Ghi(co); g.u8(ma); g.u16(phien & 65535); g.u32(Math.max(0, tGui)); return g }
const DAU_GOI_DIEM = 7 + DAU_TOI_DA + 4 + 2 + 4 + 1
/** Số điểm nhiều nhất trong một gói điểm (≤ 1.100 byte). */
export const DIEM_TOI_DA_MOT_GOI = Math.floor((GOI_DIEM_TOI_DA - DAU_GOI_DIEM) / BYTE_MOI_DIEM)
/** Một gói điểm đang viết. `tu` = chỉ số điểm đầu gói trong nét; `diem[i][3]` = ms kể từ đầu nét; `tGoc` = giờ live (ms, số nguyên) của đầu nét.
 *  Nhiều hơn `DIEM_TOI_DA_MOT_GOI` điểm ⇒ chỉ lấy phần ĐUÔI (mới nhất), `tu` dời theo. */
export function maGoiDiem(o: { phien: number; tGui: number; dau: DauNet; tGoc: number; tu: number; diem: readonly DiemBut[] }): Uint8Array<ArrayBuffer> {
  const bo = Math.max(0, o.diem.length - DIEM_TOI_DA_MOT_GOI), ds = bo ? o.diem.slice(bo) : o.diem
  const g = dauGoi(MA_DIEM.diem, o.phien, o.tGui, DAU_GOI_DIEM + ds.length * BYTE_MOI_DIEM)
  ghiDau(g, o.dau); g.i32(o.tGoc); g.u16(o.tu + bo); g.u32(ds.length ? so(ds[0]![3]) : 0); g.u8(ds.length); ghiDiem(g, ds)
  return g.xong()
}
export function maTro(o: { phien: number; tGui: number; x: number; y: number; lz?: boolean }): Uint8Array<ArrayBuffer> {
  const g = dauGoi(MA_DIEM.tro, o.phien, o.tGui, o.lz ? 14 : 13); g.u24(so(o.x) * CHIA); g.u24(so(o.y) * CHIA); if (o.lz) g.u8(1); return g.xong()
}
export function maNhac(o: { phien: number; tGui: number; id: string; tong: number }): Uint8Array<ArrayBuffer> {
  const g = dauGoi(MA_DIEM.nhac, o.phien, o.tGui, 7 + ID_TOI_DA + 1 + 2); g.chu(o.id, ID_TOI_DA); g.u16(o.tong); return g.xong()
}
/** Giải một gói điểm đang viết. `phien` truyền vào ⇒ gói lạc phiên khác bị bỏ (null). Gói hỏng ⇒ null. */
export function giaiGoi(goi: ArrayBuffer | Uint8Array, phien?: number): GoiDiem | null {
  const b = mang(goi)
  if (b.length < 7 || b.length > KHUNG_TOI_DA) return null
  try {
    const d = new Doc(b), ma = d.u8(), ph = d.u16(), tGui = d.u32()
    if (phien != null && ph !== (phien & 65535)) return null
    if (ma === MA_DIEM.diem) { const dau = docDau(d), tGoc = d.i32(), tu = d.u16(), tDau = d.u32(), n = d.u8(); return { phien: ph, tGui, k: 'diem', dau, tGoc, tu, diem: docDiem(d, n, tDau) } }
    if (ma === MA_DIEM.tro) { const x = d.u24() / CHIA, y = d.u24() / CHIA; return b.length >= 14 && d.u8() === 1 ? { phien: ph, tGui, k: 'tro', x, y, lz: true } : { phien: ph, tGui, k: 'tro', x, y } }
    if (ma === MA_DIEM.nhac) return { phien: ph, tGui, k: 'nhac', id: d.chu(), tong: d.u16() }
    return null
  } catch { return null }
}
