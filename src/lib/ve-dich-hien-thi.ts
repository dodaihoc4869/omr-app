// THẺ "ĐƯỜNG VỀ ĐÍCH" (Dồn về đích; thầy chốt mẫu 21/09; DE-XUAT-DON-VE-DICH-2109.md Điều 3): ĐỌC CHẶT hai khối của `/hs/ke-hoach-ngay` (máy chủ Code 3/Code 4 — server/src/ve-dich-d1.ts) và làm các phép CHỮ/GIỜ thuần.
//   no: { theoNgay: MonNo[{ngay, loai, ten, soCau, phut, maBtvn?, chiSo?}], tongCau, tongPhut }
//   veDich: [{ maBtvn, ten, hanNop, gioConLai, quaHan, chang[{chiSo, trangThai:'xong'|'no'|'hom_nay'|'sap_toi', ngay}], toiNay{soChang, soCau, phut, batDauMuonNhat}|null, cacBuoiSau[], kip, canRutPhanLamThem, daRutPhanLamThem }]
// Máy em KHÔNG tính lại luật (số nợ, kế hoạch, giờ muộn nhất là của máy chủ/hàm thuần `ve-dich.ts`): chỉ HIỂN THỊ số máy chủ trả; đồng hồ đếm ngược chạy ở máy từ `hanNop` + giờ máy.
// Khối vắng / sai dạng ⇒ null ⇒ KHÔNG dựng thẻ (Pages đi trước Worker được). Không game; giọng nâng đỡ (không "lười", không đỏ tới 6 giờ cuối).
import { tachVn } from './ph-moi/dinh-dang'

export type TrangThaiChang = 'xong' | 'no' | 'hom_nay' | 'sap_toi'
export type LoaiMonNo = 'chang_btvn' | 'goi_gia_dinh' | 'on_lai'
export interface ChangVeDich { chiSo: number; trangThai: TrangThaiChang; ngay: string }
export interface MonNoVeDich { ngay: string; loai: LoaiMonNo; ten: string; soCau: number; phut: number; maBtvn: string; chiSo: number | null }
export interface BaiVeDich {
  maBtvn: string
  ten: string
  hanNop: string
  gioConLai: number
  quaHan: boolean
  chang: ChangVeDich[]
  toiNay: { soChang: number; soCau: number; phut: number; batDauMuonNhat: string } | null
  kip: boolean
}
export interface VeDichView { bai: BaiVeDich[]; no: { theoNgay: MonNoVeDich[]; tongCau: number; tongPhut: number } }

const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const nguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : null)
const chuoi = (x: unknown, tran = 140): string => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, tran) : '')
const iso = (x: unknown): string => (typeof x === 'string' && Number.isFinite(Date.parse(x)) ? x : '')
const ngayChuoi = (x: unknown): string => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : '')

export function docMonNo(x: unknown): MonNoVeDich | null {
  if (!laDoiTuong(x)) return null
  const ngay = ngayChuoi(x.ngay)
  const soCau = nguyen(x.soCau)
  const phut = nguyen(x.phut)
  const loai = x.loai === 'chang_btvn' || x.loai === 'goi_gia_dinh' || x.loai === 'on_lai' ? x.loai : null
  if (!ngay || soCau === null || phut === null || !loai) return null
  return { ngay, loai, ten: chuoi(x.ten), soCau, phut, maBtvn: chuoi(x.maBtvn, 80), chiSo: nguyen(x.chiSo) }
}

function docBai(x: unknown): BaiVeDich | null {
  if (!laDoiTuong(x)) return null
  const maBtvn = chuoi(x.maBtvn, 80)
  const hanNop = iso(x.hanNop)
  if (!maBtvn || !hanNop) return null
  const chang: ChangVeDich[] = []
  for (const c of Array.isArray(x.chang) ? x.chang : []) {
    if (!laDoiTuong(c)) continue
    const chiSo = nguyen(c.chiSo)
    const tt = c.trangThai === 'xong' || c.trangThai === 'no' || c.trangThai === 'hom_nay' || c.trangThai === 'sap_toi' ? c.trangThai : null
    if (chiSo === null || !tt) continue
    chang.push({ chiSo, trangThai: tt, ngay: ngayChuoi(c.ngay) })
  }
  chang.sort((a, b) => a.chiSo - b.chiSo)
  const tn = laDoiTuong(x.toiNay) ? x.toiNay : null
  const soChang = tn ? nguyen(tn.soChang) : null
  const soCau = tn ? nguyen(tn.soCau) : null
  const phut = tn ? nguyen(tn.phut) : null
  const muon = tn ? iso(tn.batDauMuonNhat) : ''
  return {
    maBtvn,
    ten: chuoi(x.ten) || 'Bài tập về nhà',
    hanNop,
    gioConLai: typeof x.gioConLai === 'number' && Number.isFinite(x.gioConLai) ? Math.max(0, x.gioConLai) : Math.max(0, (Date.parse(hanNop) - Date.now()) / 3_600_000),
    quaHan: x.quaHan === true,
    chang,
    toiNay: soChang !== null && soCau !== null && phut !== null && muon && soChang > 0 ? { soChang, soCau, phut, batDauMuonNhat: muon } : null,
    kip: x.kip !== false,
  }
}

/** Thân kế hoạch ngày ⇒ `VeDichView`; KHÔNG có `veDich` (máy chủ chưa trả) ⇒ null; có nhưng không có gì để nói (không bài, không nợ) ⇒ null. */
export function docVeDich(k: { veDich?: unknown; no?: unknown } | null | undefined): VeDichView | null {
  if (!k || !Array.isArray(k.veDich)) return null
  const bai: BaiVeDich[] = []
  for (const b of k.veDich) {
    const v = docBai(b)
    if (v) bai.push(v)
    if (bai.length >= 20) break
  }
  const n = laDoiTuong(k.no) ? k.no : null
  const theoNgay: MonNoVeDich[] = []
  for (const m of n && Array.isArray(n.theoNgay) ? n.theoNgay : []) {
    const v = docMonNo(m)
    if (v) theoNgay.push(v)
    if (theoNgay.length >= 60) break
  }
  theoNgay.sort((a, b) => (a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : 0))
  if (bai.length === 0 && theoNgay.length === 0) return null
  return { bai, no: { theoNgay, tongCau: theoNgay.reduce((s, m) => s + m.soCau, 0), tongPhut: theoNgay.reduce((s, m) => s + m.phut, 0) } }
}

// ---------------------------------------------------------------- chữ / giờ (thuần) ----------------------------------------------------------------
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const hai = (n: number) => String(n).padStart(2, '0')
/** "Thứ Hai" từ "YYYY-MM-DD". */
export const thuCuaNgay = (ngay: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  return m ? (THU[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()] ?? '') : ''
}
/** "Thứ Hai 21/09" từ "YYYY-MM-DD". */
export const thuNgayNgan = (ngay: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay)
  return m ? `${thuCuaNgay(ngay)} ${m[3]}/${m[2]}` : ''
}
/** Ngày VN (YYYY-MM-DD) của một mốc. */
export const ngayVnCua = (ms: number): string => {
  const t = tachVn(ms)
  return t ? `${t.y}-${hai(t.m)}-${hai(t.d)}` : ''
}
/** Còn bao lâu tới hạn: { gio, phut } (không âm); đã qua hạn ⇒ null. */
export function conLaiToiHan(hanNop: string, nowMs: number): { gio: number; phut: number } | null {
  const ms = Date.parse(hanNop) - nowMs
  if (!Number.isFinite(ms) || ms <= 0) return null
  const tongPhut = Math.floor(ms / 60_000)
  return { gio: Math.floor(tongPhut / 60), phut: tongPhut % 60 }
}
/** "12:00 · Thứ Sáu 25/09/2026" */
export function chuHanNop(hanNop: string): string {
  const t = tachVn(hanNop)
  return t ? `${hai(t.h)}:${hai(t.p)} · ${THU[t.thu]} ${hai(t.d)}/${hai(t.m)}/${t.y}` : ''
}
/** "Thứ Sáu" / "Ngày mai" / "Hôm nay" cho nhãn cờ hạn. */
export function nhanCoHan(hanNop: string, nowMs: number): string {
  const han = ngayVnCua(Date.parse(hanNop))
  const nay = ngayVnCua(nowMs)
  if (!han || !nay) return ''
  if (han === nay) return 'Hôm nay'
  const mai = ngayVnCua(nowMs + 86_400_000)
  return han === mai ? 'Ngày mai' : thuCuaNgay(han)
}
/** Trong 6 giờ cuối mới được dùng màu cảnh báo mạnh (Điều 3: không đỏ/doạ trước đó). */
export const SAU_GIO_CUOI = 6
export function laSauGioCuoi(hanNop: string, nowMs: number): boolean {
  const ms = Date.parse(hanNop) - nowMs
  return Number.isFinite(ms) && ms > 0 && ms <= SAU_GIO_CUOI * 3_600_000
}
/** Nợ theo ngày: [{ngay, mon[], phut}] tăng dần. */
export function nhomNoTheoNgay(no: readonly MonNoVeDich[]): { ngay: string; mon: MonNoVeDich[]; phut: number; soCau: number }[] {
  const m = new Map<string, MonNoVeDich[]>()
  for (const x of no) m.set(x.ngay, [...(m.get(x.ngay) ?? []), x])
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([ngay, mon]) => ({ ngay, mon, phut: mon.reduce((s, x) => s + x.phut, 0), soCau: mon.reduce((s, x) => s + x.soCau, 0) }))
}
/** Tên một món nợ cho dòng: chặng ⇒ "Chặng 2 · 12 câu"; gói ⇒ tên gói; ôn ⇒ "5 câu ôn lại đã quá lịch". */
export function tenMonNo(m: MonNoVeDich): { tren: string; duoi: string } {
  const phut = `khoảng ${Math.max(1, m.phut)} phút`
  if (m.loai === 'chang_btvn') return { tren: `${m.chiSo !== null ? `Chặng ${m.chiSo + 1}` : 'Chặng'} · ${m.soCau} câu`, duoi: [m.ten, phut].filter(Boolean).join(' · ') }
  if (m.loai === 'goi_gia_dinh') return { tren: `${m.ten || 'Gói gia đình giao'} · ${m.soCau} câu`, duoi: phut }
  return { tren: `${m.soCau} câu ôn lại đã quá lịch`, duoi: phut }
}
/** Khoá nhận diện một món nợ (để so hai lần nạp ⇒ "vừa trả xong"). */
export const khoaMonNo = (m: MonNoVeDich): string => `${m.ngay}|${m.loai}|${m.maBtvn}|${m.chiSo ?? ''}|${m.ten}`
/** Ngày nợ ĐÃ HẾT giữa hai lần nạp (ngày nào trước có món mà nay không còn món nào). */
export function ngayVuaTraXong(truoc: VeDichView | null, nay: VeDichView): string | null {
  if (!truoc) return null
  const conNay = new Set(nay.no.theoNgay.map((m) => m.ngay))
  const cu = [...new Set(truoc.no.theoNgay.map((m) => m.ngay))].sort()
  const het = cu.filter((n) => !conNay.has(n))
  return het.length > 0 ? (het[het.length - 1] as string) : null
}
