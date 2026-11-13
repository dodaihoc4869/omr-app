// TỦ ĐỒ BÉ MA + THÀNH TÍCH + ĐỘI CẢ HỌC KỲ + THI ĐUA / DANH HIỆU TUẦN của trò «Sinh Tồn · Trang vở» (đợt 4; đặc tả docs/dac-ta-sinh-ton-v2-1311.md mục 8–10 + mục 4,
// bản vẽ thầy duyệt docs/ban-ve-sinh-ton-v2-1311/15-tu-do-390.jpg, 16-sanh-doi-ca-ky-danh-hieu-390.jpg, 17-thi-dua-tuan-may-thay-1366.jpg).
// LÕI THUẦN dùng CHUNG máy chủ (server/src/sinh-ton-du-lieu.ts) và máy em (src/components/phong-cho/TuDoBeMa.tsx): không DOM, không React.
// LUẬT: đồ CHỈ đổi hình bé ma — không có trường nào ảnh hưởng luật trò (sát thương, tốc độ, máu…); test tests/sinh-ton-tu-do-1311.test.ts khoá.
// Đồ mở bằng CHUỖI NGÀY (chuỗi theo chặng nếu bật, không thì chuỗi ngày cũ) và CẤP EXP (cấp thần thú, `game_v2_profile.json.$.cap`) — máy chủ tính, máy em không tự mở.
//
// QUY ƯỚC CỐ ĐỊNH (giờ VN = UTC+7):
//  · TUẦN bắt đầu thứ Hai 00:00 giờ VN; mã tuần = NGÀY THỨ HAI dạng `2026-11-09`.
//  · HỌC KỲ: HK1 = tháng 8 → tháng 1 năm sau, HK2 = tháng 2 → tháng 7; mã theo năm bắt đầu năm học: tháng 8/2026 … 1/2027 = `2026-HK1`, 2 … 7/2027 = `2026-HK2`.
//  · DANH HIỆU TUẦN xét theo KHỐI (10 / 11 / 12 — đúng phạm vi phòng chờ Live theo khối), chỉ em thật (máy bù `~…` và bé ma Thầy không bao giờ được ghi).

export type LoaiDo = 'mu' | 'ao' | 'dan' | 'ha'
export interface DoBeMa {
  /** Mã đồ (lưu ở `st_mac`). */ ma: string
  ten: string
  loai: LoaiDo
  /** Điều kiện mở: `chuoi` = Chuỗi N ngày · `cap` = Cấp N. */ mo: { kieu: 'chuoi' | 'cap'; so: number }
}
/** Ngăn tủ theo thứ tự hiện trên màn. */
export const NGAN_DO: readonly { loai: LoaiDo; ten: string }[] = [
  { loai: 'mu', ten: 'Mũ' },
  { loai: 'ao', ten: 'Áo choàng' },
  { loai: 'dan', ten: 'Vệt đạn' },
  { loai: 'ha', ten: 'Khi em hạ được bạn' },
]
export const DO_BE_MA: readonly DoBeMa[] = [
  { ma: 'mu-tot-nghiep', ten: 'Mũ tốt nghiệp', loai: 'mu', mo: { kieu: 'chuoi', so: 7 } },
  { ma: 'tai-nghe', ten: 'Tai nghe', loai: 'mu', mo: { kieu: 'chuoi', so: 3 } },
  { ma: 'mu-phu-thuy', ten: 'Mũ phù thuỷ', loai: 'mu', mo: { kieu: 'cap', so: 20 } },
  { ma: 'ao-ke-o-li', ten: 'Áo kẻ ô li', loai: 'ao', mo: { kieu: 'cap', so: 10 } },
  { ma: 'ao-sao-dem', ten: 'Áo sao đêm', loai: 'ao', mo: { kieu: 'chuoi', so: 30 } },
  { ma: 'dan-cau-vong', ten: 'Đạn cầu vồng', loai: 'dan', mo: { kieu: 'chuoi', so: 14 } },
  { ma: 'phao-giay', ten: 'Pháo giấy', loai: 'ha', mo: { kieu: 'cap', so: 40 } },
  { ma: 'diem-10-do', ten: 'Điểm 10 đỏ', loai: 'ha', mo: { kieu: 'cap', so: 60 } },
]
const THEO_MA = new Map(DO_BE_MA.map((d) => [d.ma, d]))
export const doTheoMa = (ma: unknown): DoBeMa | undefined => (typeof ma === 'string' ? THEO_MA.get(ma) : undefined)

/** Bộ đồ đang mặc: mỗi ngăn một mã hoặc null (để trống). */
export type BoMac = Record<LoaiDo, string | null>
export const MAC_TRONG: BoMac = { mu: null, ao: null, dan: null, ha: null }
/** Tiến độ của em (máy chủ đọc): cấp EXP + chuỗi ngày hiện tại. */
export interface TienDoEm { cap: number; chuoi: number }

const so0 = (v: unknown): number => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? n : 0 }
export const dieuKienChu = (d: DoBeMa): string => (d.mo.kieu === 'cap' ? `Cấp ${d.mo.so}` : `Chuỗi ${d.mo.so} ngày`)
export const daMoDo = (d: DoBeMa, t: TienDoEm): boolean => (d.mo.kieu === 'cap' ? so0(t.cap) : so0(t.chuoi)) >= d.mo.so
export const dsDaMo = (t: TienDoEm): string[] => DO_BE_MA.filter((d) => daMoDo(d, t)).map((d) => d.ma)
/** Phần đã đi được tới mốc (0..1) — thanh tiến độ của ô đang khoá. */
export const tiLeMo = (d: DoBeMa, t: TienDoEm): number => Math.max(0, Math.min(1, (d.mo.kieu === 'cap' ? so0(t.cap) : so0(t.chuoi)) / d.mo.so))
/** Dòng dưới tên ô: đã mở ⇒ «Đã mở · Chuỗi 3 ngày»; đang khoá ⇒ «Cấp 20 · em đang cấp 14» / «Chuỗi 30 ngày · em đang Chuỗi 12 ngày». */
export function dongDieuKien(d: DoBeMa, t: TienDoEm): string {
  if (daMoDo(d, t)) return `Đã mở · ${dieuKienChu(d)}`
  return d.mo.kieu === 'cap' ? `${dieuKienChu(d)} · em đang cấp ${so0(t.cap)}` : `${dieuKienChu(d)} · em đang Chuỗi ${so0(t.chuoi)} ngày`
}

/** Đọc bộ đồ từ dữ liệu lạ (gói máy em, dòng D1): mã sai / sai ngăn ⇒ null. */
export function chuanMac(x: unknown): BoMac {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>, ra: BoMac = { ...MAC_TRONG }
  for (const { loai } of NGAN_DO) { const d = doTheoMa(o[loai]); ra[loai] = d && d.loai === loai ? d.ma : null }
  return ra
}
/** MÁY CHỦ KIỂM QUYỀN MẶC: mọi món phải có thật, đúng ngăn, và ĐÃ MỞ theo tiến độ em. */
export function kiemMac(x: unknown, t: TienDoEm): { ok: true; mac: BoMac } | { ok: false; loi: string } {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>, mac: BoMac = { ...MAC_TRONG }
  for (const { loai } of NGAN_DO) {
    const v = o[loai]
    if (v == null || v === '') continue
    const d = doTheoMa(v)
    if (!d || d.loai !== loai) return { ok: false, loi: 'Món đồ không có trong tủ.' }
    if (!daMoDo(d, t)) return { ok: false, loi: `«${d.ten}» chưa mở: cần ${dieuKienChu(d)}.` }
    mac[loai] = d.ma
  }
  return { ok: true, mac }
}

// ── Thành tích (chỉ là thành tích, KHÔNG sức mạnh) ──
export interface ThanhTich { ha: number; chuoiMax: number; thuKhoa: number; haThay: number; van: number }
export const THANH_TICH_TRONG: ThanhTich = { ha: 0, chuoiMax: 0, thuKhoa: 0, haThay: 0, van: 0 }
/** «Chuỗi» ở màn có «Chuỗi N ngày» chỉ dành cho chuỗi ngày ⇒ chuỗi hạ trong trận gọi là «hạ liền». */
export const HUY_HIEU: readonly { ma: string; ten: string; chi: keyof ThanhTich; moc: number }[] = [
  { ma: 'ha-10', ten: 'Hạ 10 lượt', chi: 'ha', moc: 10 },
  { ma: 'ha-50', ten: 'Hạ 50 lượt', chi: 'ha', moc: 50 },
  { ma: 'ha-200', ten: 'Hạ 200 lượt', chi: 'ha', moc: 200 },
  { ma: 'lien-3', ten: 'Hạ liền 3 bạn', chi: 'chuoiMax', moc: 3 },
  { ma: 'lien-5', ten: 'Hạ liền 5 bạn', chi: 'chuoiMax', moc: 5 },
  { ma: 'tk-1', ten: 'Thủ khoa 1 lần', chi: 'thuKhoa', moc: 1 },
  { ma: 'tk-10', ten: 'Thủ khoa 10 lần', chi: 'thuKhoa', moc: 10 },
  { ma: 'ha-thay', ten: 'Hạ được Thầy', chi: 'haThay', moc: 1 },
]
export const chuanThanhTich = (x: unknown): ThanhTich => {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>
  return { ha: so0(o.ha), chuoiMax: so0(o.chuoiMax), thuKhoa: so0(o.thuKhoa), haThay: so0(o.haThay), van: so0(o.van) }
}
export const huyHieuDat = (t: ThanhTich): string[] => HUY_HIEU.filter((h) => t[h.chi] >= h.moc).map((h) => h.ma)

// ── Tuần / học kỳ (giờ VN) ──
const GIO_VN = 7 * 3_600_000, NGAY = 86_400_000
const ngayIso = (ms: number): string => new Date(ms).toISOString().slice(0, 10)
/** Mã tuần = ngày thứ Hai (giờ VN) của tuần chứa thời điểm `ms`. */
export function maTuan(ms: number): string {
  const vn = ms + GIO_VN, d = new Date(vn).getUTCDay()
  return ngayIso(vn - ((d + 6) % 7) * NGAY)
}
export const tuanTruoc = (tuan: string): string => ngayIso(Date.parse(`${tuan}T00:00:00Z`) - 7 * NGAY)
/** «09/11 – 15/11». */
export function chuTuan(tuan: string): string {
  const dau = Date.parse(`${tuan}T00:00:00Z`), f = (ms: number) => { const s = ngayIso(ms); return `${s.slice(8, 10)}/${s.slice(5, 7)}` }
  return Number.isFinite(dau) ? `${f(dau)} – ${f(dau + 6 * NGAY)}` : ''
}
/** Mã học kỳ: tháng 8 → 1 = HK1, tháng 2 → 7 = HK2, năm = năm bắt đầu năm học. */
export function maHocKy(ms: number): string {
  const d = new Date(ms + GIO_VN), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1
  if (m >= 8) return `${y}-HK1`
  if (m === 1) return `${y - 1}-HK1`
  return `${y - 1}-HK2`
}

// ── Danh hiệu tuần ──
export type LoaiDanhHieu = 'tho-san' | 'pha-tk' | 'ha-thay'
export const DANH_HIEU: readonly { loai: LoaiDanhHieu; ten: string; cot: 'ha' | 'dietTk' | 'haThay'; donVi: (n: number) => string }[] = [
  { loai: 'tho-san', ten: 'Thợ săn tuần', cot: 'ha', donVi: (n) => `${n} lượt hạ` },
  { loai: 'pha-tk', ten: 'Kẻ phá thủ khoa', cot: 'dietTk', donVi: (n) => `tiêu diệt thủ khoa ${n} lần` },
  { loai: 'ha-thay', ten: 'Hạ gục Thầy', cot: 'haThay', donVi: (n) => `${n} lần` },
]
export const tenDanhHieu = (l: unknown): string => DANH_HIEU.find((d) => d.loai === l)?.ten ?? ''
export interface DongTuan { sbd: string; ha: number; dietTk: number; haThay: number }
/** Người giữ danh hiệu: số cao nhất (> 0) của cột; hoà ⇒ cùng giữ (tối đa 3 em, theo số báo danh). Không có ai > 0 ⇒ không trao. */
export function xetDanhHieu(ds: readonly DongTuan[]): { loai: LoaiDanhHieu; sbd: string[]; so: number }[] {
  const ra: { loai: LoaiDanhHieu; sbd: string[]; so: number }[] = []
  for (const dh of DANH_HIEU) {
    const max = ds.reduce((m, x) => Math.max(m, so0(x[dh.cot])), 0)
    if (max <= 0) continue
    ra.push({ loai: dh.loai, so: max, sbd: ds.filter((x) => so0(x[dh.cot]) === max).map((x) => x.sbd).sort().slice(0, 3) })
  }
  return ra
}
