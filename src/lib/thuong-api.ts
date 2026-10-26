// LỚP NỐI THƯỞNG PHẠT của app học sinh (thầy chốt 26/10, đặc tả DAC-TA-THUONG-PHAT-2610 mục 4 — HỢP ĐỒNG, dùng đúng tên trường).
// Chỉ tệp này biết các lệnh /hs/thuong, /hs/giai, /hs/huy-hieu, /hs/ban…, /hs/kim-cuong/bat-dau. Như mọi lệnh /hs khác của máy chủ: POST JSON có `token`
// trong thân (máy chủ lấy SBD từ token). Không ném lỗi: trả `{ ok, du | chu }`.
// ĐỌC CHẶT: thiếu trường / sai kiểu ⇒ trường đó vắng (undefined) ⇒ khối tương ứng ẩn — KHÔNG bịa số. Không có nhãn lười nào ở đây (máy chủ cũng không gửi).
// BẢN GẦN NHẤT: mỗi lệnh đọc lưu ở localStorage (try/catch) ⇒ thanh trên / màn vẽ ngay từ bản ấy rồi cập nhật khi máy chủ trả (không chờ mạng, không chớp số);
// mất mạng ⇒ giữ bản gần nhất + nút «Thử lại». CHỐNG BẤM LẶP: cùng lệnh + cùng thân đang bay ⇒ dùng lại đúng lời hứa ấy (máy chủ còn khoá theo ngày/tuần).
import { layDiaChiMayChu } from './dia-chi-may-chu'

// ───────────────────────────────────────────── KIỂU (đúng hợp đồng)
export type HangGiai = 'sat' | 'dong' | 'bac' | 'vang' | 'bachkim' | 'kimcuong'
export interface CongTac { giai: boolean; thangHoa: boolean; banBe: boolean; kimCuong: boolean }
export type KieuNgay = 'hoc' | 'binh' | 'phep' | 'tat'
export interface NgayChuoi { ngay: string; kieu: KieuNgay }
export interface ChuoiNgay {
  so: number; giuChuoi: number; sucChua: number; lich7: NgayChuoi[]
  cuu?: { hetHan: number; daLam: number; can: number; so?: number }
  binhVuaDo?: string
}
export interface NhiemVu { ma: string; ten: string; tien: number; can: number; thuong: number; xong: boolean }
export interface GiaiTom { hang: HangGiai; thuHang: number; soNguoi: number; hetHanGiay: number }
export type LoaiThongBao = 'thang_hoa' | 'binh_do' | 'cuoi_tuan' | 'moc_chuoi' | 'cuoc' | 'huy_hieu' | 'moc_doi' | 'go_cua' | 'moi_ban'
export interface ThongBao { ma: string; loai: LoaiThongBao; duLieu: Record<string, unknown> }
/** Lượt cược đang chạy — trường TUỲ CHỌN (hợp đồng chưa ghi; máy chủ gửi thì hiện tiến độ, không gửi thì chỉ hiện lời mời cược). */
export interface CuocDang { dat: number; ngay: number }
export interface TongQuanThuong {
  bat: CongTac
  nguyenTuHomNay?: number; tinhThe?: number
  mucTieu?: { daXong: number; can: number }
  chuoiNgay?: ChuoiNgay
  nhiemVu?: NhiemVu[]
  ruong?: { mo: boolean; thuong: number }
  giai?: GiaiTom
  thongBao: ThongBao[]
  cuoc?: CuocDang | null
}
export interface DongGiai { thuHang: number; ten: string; lop: string; nguyenTu: number; laEm: boolean }
export interface BangGiai { hang: HangGiai; hetHanGiay?: number; nhom: DongGiai[]; len: number; roi: number; /** thầy tắt giải tuần ⇒ màn ẩn */ tat?: true }
export interface HuyHieu { ma: string; ten: string; co: boolean; tienDo?: { da: number; can: number }; ngay?: string }
export type HomNayDoi = 'ca_hai' | 'ban_chua' | 'em_chua' | 'ca_hai_chua'
export interface BanHoc { ma: string; ten: string; lop: string; chuoiDoi: number; homNay: HomNayDoi; daGoCua: boolean; /** «học cùng từ» — tuỳ chọn */ tuNgay?: string }
export interface NguoiMoi { ma: string; ten: string; lop: string }
export interface DanhSachBan { ban: BanHoc[]; loiMoi: NguoiMoi[]; /** lời mời em đã gửi, chờ bạn đồng ý (máy chủ gửi thêm) */ daMoi: NguoiMoi[]; toiDa: number; tat?: true }
/** trangThai: 'ban' đã học cùng · 'da_moi' em đã mời · 'moi_em' bạn đang mời em · null chưa gì. */
export interface KetQuaTim { ma: string; ten: string; lop: string; sbd?: string; trangThai: 'ban' | 'da_moi' | 'moi_em' | null }
/** Phần thưởng của MỘT câu (trường `thuong` trong phản hồi lệnh `answer`). tinh = false ⇒ câu không được tính (tấm trung tính). */
export interface ThuongCau { tinh: boolean; nguyenTu: number; dong: { nhan: string; so: number }[]; chuoiDung: number; cauKho: boolean }
/** Tổng kết bài (trường `ketBai`, có ở câu cuối của bài / chặng). */
export interface KetBai {
  tong: number; dong: { nhan: string; so: number }[]; soDung: number; soCau: number; chinhXac: number; giay: number; hoanHao: boolean
  mucTieu?: { daXong: number; can: number }
  giai?: { thuHang: number; doi: number }
}
export interface CauKimCuong { qid: string; phan: 'I' | 'II' | 'III'; text: string; choices: string[]; ideas: string[]; tenDang?: string }
export interface PhienKimCuong { phien: string; cau: CauKimCuong[]; ong: number }
export interface KimCuongCau { ongCon: number; xong?: boolean; dat?: boolean }

// ───────────────────────────────────────────── ĐỌC CHẶT (thuần — test gọi thẳng)
type O = Record<string, unknown>
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const so = (x: unknown): number | undefined => (typeof x === 'number' && Number.isFinite(x) ? x : undefined)
const soNg = (x: unknown): number | undefined => { const n = so(x); return n === undefined || n < 0 ? undefined : Math.round(n) }
const chu = (x: unknown): string | undefined => (typeof x === 'string' && x.trim() ? x.trim() : undefined)
const mang = <T>(x: unknown, doc: (v: unknown) => T | undefined): T[] | undefined => (Array.isArray(x) ? x.map(doc).filter((v): v is T => v !== undefined) : undefined)
export const HANG_GIAI: readonly HangGiai[] = ['sat', 'dong', 'bac', 'vang', 'bachkim', 'kimcuong']
const laHang = (x: unknown): x is HangGiai => HANG_GIAI.includes(x as HangGiai)
/** Ngày Việt Nam (UTC+7) dạng yyyy-mm-dd. */
export const ngayVn = (ms: number = Date.now()): string => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10)
/** Thời điểm: số (giây hoặc mili giây) hoặc chuỗi ISO ⇒ mili giây. */
export const docMoc = (x: unknown): number | undefined => {
  if (typeof x === 'number' && Number.isFinite(x) && x > 0) return x < 1e12 ? x * 1000 : x
  if (typeof x === 'string') { const t = Date.parse(x); return Number.isFinite(t) ? t : undefined }
  return undefined
}

export function docCongTac(x: unknown): CongTac {
  const o = dt(x) ?? {}
  // công tắc mặc định 'bat' (đặc tả mục 7) — chỉ tắt khi máy chủ gửi rõ false / 'tat'
  const b = (v: unknown) => v !== false && v !== 'tat'
  return { giai: b(o.giai), thangHoa: b(o.thangHoa), banBe: b(o.banBe), kimCuong: b(o.kimCuong) }
}
function docNgay(x: unknown): NgayChuoi | undefined {
  const o = dt(x); const ngay = chu(o?.ngay); const kieu = o?.kieu
  return ngay && (kieu === 'hoc' || kieu === 'binh' || kieu === 'phep' || kieu === 'tat') ? { ngay, kieu } : undefined
}
export function docChuoiNgay(x: unknown): ChuoiNgay | undefined {
  const o = dt(x)
  const s = soNg(o?.so), g = soNg(o?.giuChuoi), c = soNg(o?.sucChua), l = mang(o?.lich7, docNgay)
  if (!o || s === undefined || g === undefined || c === undefined || !l) return undefined
  const kq: ChuoiNgay = { so: s, giuChuoi: Math.min(g, c), sucChua: c, lich7: l.slice(-7) }
  const cu = dt(o.cuu), het = docMoc(cu?.hetHan), da = soNg(cu?.daLam), can = soNg(cu?.can)
  if (cu && het !== undefined && da !== undefined && can) kq.cuu = { hetHan: het, daLam: da, can, ...(soNg(cu.so) ? { so: soNg(cu.so) } : {}) }
  const bv = chu(o.binhVuaDo); if (bv) kq.binhVuaDo = bv
  return kq
}
function docNhiemVu(x: unknown): NhiemVu | undefined {
  const o = dt(x); const ma = chu(o?.ma), ten = chu(o?.ten), tien = soNg(o?.tien), can = soNg(o?.can), thuong = soNg(o?.thuong)
  return ma && ten && tien !== undefined && can && thuong !== undefined ? { ma, ten, tien: Math.min(tien, can), can, thuong, xong: o!.xong === true || tien >= can } : undefined
}
const LOAI_TB: readonly LoaiThongBao[] = ['thang_hoa', 'binh_do', 'cuoi_tuan', 'moc_chuoi', 'cuoc', 'huy_hieu', 'moc_doi', 'go_cua', 'moi_ban']
function docThongBao(x: unknown): ThongBao | undefined {
  const o = dt(x); const ma = chu(o?.ma)
  return ma && LOAI_TB.includes(o!.loai as LoaiThongBao) ? { ma, loai: o!.loai as LoaiThongBao, duLieu: dt(o!.duLieu) ?? {} } : undefined
}
export function docTongQuan(x: unknown): TongQuanThuong | null {
  const o = dt(x)
  if (!o || o.ok === false) return null
  const kq: TongQuanThuong = { bat: docCongTac(o.bat), thongBao: mang(o.thongBao, docThongBao) ?? [] }
  const nt = soNg(o.nguyenTuHomNay); if (nt !== undefined) kq.nguyenTuHomNay = nt
  const tt = soNg(o.tinhThe); if (tt !== undefined) kq.tinhThe = tt
  const mt = dt(o.mucTieu), dx = soNg(mt?.daXong), can = soNg(mt?.can); if (dx !== undefined && can) kq.mucTieu = { daXong: dx, can }
  const cn = docChuoiNgay(o.chuoiNgay); if (cn) kq.chuoiNgay = cn
  const nv = mang(o.nhiemVu, docNhiemVu); if (nv?.length) kq.nhiemVu = nv
  const r = dt(o.ruong), rt = soNg(r?.thuong); if (r && rt !== undefined) kq.ruong = { mo: r.mo === true, thuong: rt }
  const g = dt(o.giai), th = soNg(g?.thuHang), sn = soNg(g?.soNguoi), hh = soNg(g?.hetHanGiay)
  if (g && laHang(g.hang) && th && sn && hh !== undefined) kq.giai = { hang: g.hang, thuHang: th, soNguoi: sn, hetHanGiay: hh }
  if (o.cuoc === null) kq.cuoc = null
  else {
    const c = dt(o.cuoc), d = soNg(c?.dat), tu = chu(c?.tuNgay)
    const n = soNg(c?.ngay) ?? (tu && /^\d{4}-\d{2}-\d{2}$/.test(tu) ? Math.floor((Date.parse(ngayVn() + 'T00:00:00Z') - Date.parse(tu + 'T00:00:00Z')) / 864e5) + 1 : undefined)
    if (d && n && n > 0) kq.cuoc = { dat: d, ngay: Math.min(7, n) }
  }
  return kq
}
function docDongGiai(x: unknown): DongGiai | undefined {
  const o = dt(x); const th = soNg(o?.thuHang), ten = chu(o?.ten), nt = soNg(o?.nguyenTu)
  return th && ten && nt !== undefined ? { thuHang: th, ten, lop: chu(o!.lop) ?? '', nguyenTu: nt, laEm: o!.laEm === true } : undefined
}
export function docBangGiai(x: unknown): BangGiai | null {
  const o = dt(x)
  if (o?.bat === false) return { hang: 'sat', nhom: [], len: 0, roi: 0, tat: true }
  if (!o || !laHang(o.hang)) return null
  const nhom = (mang(o.nhom, docDongGiai) ?? []).sort((a, b) => a.thuHang - b.thuHang)
  const hh = soNg(o.hetHanGiay)
  return { hang: o.hang, ...(hh !== undefined ? { hetHanGiay: hh } : {}), nhom, len: soNg(o.len) ?? 5, roi: soNg(o.roi) ?? 4 }
}
function docHuyHieu(x: unknown): HuyHieu | undefined {
  const o = dt(x); const ma = chu(o?.ma), ten = chu(o?.ten)
  if (!ma || !ten) return undefined
  const td = dt(o!.tienDo), da = soNg(td?.da), can = soNg(td?.can)
  return { ma, ten, co: o!.co === true, ...(da !== undefined && can ? { tienDo: { da: Math.min(da, can), can } } : {}), ...(chu(o!.ngay) ? { ngay: chu(o!.ngay) } : {}) }
}
export function docDsHuyHieu(x: unknown): HuyHieu[] | null {
  const o = dt(x)
  const ds = mang(Array.isArray(x) ? x : o?.huyHieu ?? o?.ds, docHuyHieu)
  return ds ?? null
}
const HOM_NAY: readonly HomNayDoi[] = ['ca_hai', 'ban_chua', 'em_chua', 'ca_hai_chua']
function docBan(x: unknown): BanHoc | undefined {
  const o = dt(x); const ma = chu(o?.ma), ten = chu(o?.ten), cd = soNg(o?.chuoiDoi)
  return ma && ten && cd !== undefined && HOM_NAY.includes(o!.homNay as HomNayDoi)
    ? { ma, ten, lop: chu(o!.lop) ?? '', chuoiDoi: cd, homNay: o!.homNay as HomNayDoi, daGoCua: o!.daGoCua === true, ...(chu(o!.tuNgay) ? { tuNgay: chu(o!.tuNgay) } : {}) } : undefined
}
function docNguoi(x: unknown): NguoiMoi | undefined {
  const o = dt(x); const ma = chu(o?.ma), ten = chu(o?.ten)
  return ma && ten ? { ma, ten, lop: chu(o!.lop) ?? '' } : undefined
}
export function docDsBan(x: unknown): DanhSachBan | null {
  const o = dt(x)
  if (o?.bat === false) return { ban: [], loiMoi: [], daMoi: [], toiDa: 3, tat: true }
  if (!o || !Array.isArray(o.ban)) return null
  const toiDa = Math.max(1, Math.min(3, soNg(o.toiDa) ?? 3))
  return { ban: (mang(o.ban, docBan) ?? []).slice(0, toiDa), loiMoi: mang(o.loiMoi, docNguoi) ?? [], daMoi: mang(o.daMoi, docNguoi) ?? [], toiDa }
}
export function docKetQuaTim(x: unknown): KetQuaTim[] | null {
  const o = dt(x)
  const tt = (v: unknown): KetQuaTim['trangThai'] => (v === 'ban' || v === 'da_moi' || v === 'moi_em' ? v : null)
  const ds = mang(Array.isArray(x) ? x : o?.ketQua ?? o?.ds, (v): KetQuaTim | undefined => {
    const n = docNguoi(v); if (!n) return undefined
    const p = dt(v)!
    return { ...n, ...(chu(p.sbd) ? { sbd: chu(p.sbd) } : {}), trangThai: tt(p.trangThai) ?? (p.daMoi === true ? 'da_moi' : null) }
  })
  return ds ? ds.slice(0, 10) : null
}
export function docThuongCau(x: unknown): ThuongCau | null {
  const o = dt(x)
  if (!o || typeof o.tinh !== 'boolean') return null
  if (!o.tinh) return { tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0, cauKho: false }
  const nt = soNg(o.nguyenTu)
  if (nt === undefined) return null
  const dong = mang(o.dong, (v) => { const d = dt(v); const n = chu(d?.nhan), s = so(d?.so); return n && s !== undefined ? { nhan: n, so: Math.round(s) } : undefined }) ?? []
  return { tinh: true, nguyenTu: nt, dong, chuoiDung: soNg(o.chuoiDung) ?? 0, cauKho: o.cauKho === true }
}
export function docKetBai(x: unknown): KetBai | null {
  const o = dt(x)
  const tong = soNg(o?.tong), sd = soNg(o?.soDung), sc = soNg(o?.soCau), cx = so(o?.chinhXac), gi = soNg(o?.giay)
  if (!o || tong === undefined || sd === undefined || !sc || cx === undefined || gi === undefined) return null
  const dong = mang(o.dong, (v) => { const d = dt(v); const n = chu(d?.nhan), s = so(d?.so); return n && s !== undefined ? { nhan: n, so: Math.round(s) } : undefined }) ?? []
  // chinhXac: tỉ lệ 0–1 hoặc phần trăm
  const kq: KetBai = { tong, dong, soDung: sd, soCau: sc, chinhXac: Math.max(0, Math.min(100, Math.round(cx <= 1 ? cx * 100 : cx))), giay: gi, hoanHao: o.hoanHao === true }
  const mt = dt(o.mucTieu), dx = soNg(mt?.daXong), can = soNg(mt?.can); if (dx !== undefined && can) kq.mucTieu = { daXong: dx, can }
  const g = dt(o.giai), th = soNg(g?.thuHang), doi = so(g?.doi); if (th && doi !== undefined) kq.giai = { thuHang: th, doi: Math.round(doi) }
  return kq
}
function docCauKc(x: unknown): CauKimCuong | undefined {
  const o = dt(x); const qid = chu(o?.qid), text = typeof o?.text === 'string' ? o.text : undefined
  if (!qid || text === undefined || !(o!.phan === 'I' || o!.phan === 'II' || o!.phan === 'III')) return undefined
  const s = (a: unknown) => (Array.isArray(a) ? a.map((v) => (typeof v === 'string' ? v : '')) : [])
  return { qid, phan: o!.phan as CauKimCuong['phan'], text, choices: s(o!.choices), ideas: s(o!.ideas), ...(chu(o!.tenDang) ? { tenDang: chu(o!.tenDang) } : {}) }
}
export function docPhienKimCuong(x: unknown): PhienKimCuong | null {
  const o = dt(x); const phien = chu(o?.phien), cau = mang(o?.cau, docCauKc)
  if (!phien || !cau?.length) return null
  return { phien, cau, ong: soNg(o!.ong) || 3 }
}
export function docKimCuongCau(x: unknown): KimCuongCau | null {
  const o = dt(x); const con = soNg(o?.ongCon)
  return con === undefined ? null : { ongCon: con, ...(o!.xong === true ? { xong: true } : {}), ...(typeof o!.dat === 'boolean' ? { dat: o!.dat } : {}) }
}

// ───────────────────────────────────────────── GỌI LỆNH
export type KetQua<T> = { ok: true; du: T } | { ok: false; chu: string; loai: 'mang' | 'cham' | 'chua_co_lenh' | 'tu_choi' | 'la' }
const HAN_GIAY = 15
const dangBay = new Map<string, Promise<KetQua<O>>>()

async function guiThat(duong: string, than: O): Promise<KetQua<O>> {
  let url: string
  try { url = String((await layDiaChiMayChu('')) || '') } catch { return { ok: false, loai: 'mang', chu: 'Chưa kết nối được máy chủ.' } }
  if (!url) return { ok: false, loai: 'mang', chu: 'Chưa kết nối được máy chủ.' }
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than), signal: dk.signal })
    if (res.status === 404) return { ok: false, loai: 'chua_co_lenh', chu: 'Phần thưởng đang được cập nhật — em quay lại sau nhé.' }
    let j: unknown = null
    try { j = await res.json() } catch { /* thân lạ */ }
    const o = dt(j)
    if (!o) return { ok: false, loai: 'la', chu: 'Máy chủ trả lời chưa đọc được — em thử lại sau ít phút.' }
    if (!res.ok || o.ok === false) return { ok: false, loai: 'tu_choi', chu: chu(o.error) ?? chu(o.loi) ?? 'Chưa làm được lúc này — em thử lại nhé.' }
    return { ok: true, du: o }
  } catch (e) {
    return (e as { name?: string })?.name === 'AbortError' ? { ok: false, loai: 'cham', chu: 'Máy chủ trả lời chậm — em thử lại sau ít phút.' } : { ok: false, loai: 'mang', chu: 'Mất mạng — đang hiện bản gần nhất.' }
  } finally { clearTimeout(hen) }
}
/** Gọi một lệnh /hs (POST, token trong thân). Cùng lệnh + cùng thân đang bay ⇒ dùng lại lời hứa (chống bấm lặp / gọi trùng khi mở app). */
export function goiLenhThuong(duong: string, token: string, them: O = {}): Promise<KetQua<O>> {
  if (!token) return Promise.resolve({ ok: false, loai: 'mang', chu: 'Em cần đăng nhập.' })
  const than = { ...them, token }
  const khoa = duong + '|' + JSON.stringify(than)
  const cu = dangBay.get(khoa)
  if (cu) return cu
  const p = guiThat(duong, than).finally(() => { dangBay.delete(khoa) })
  dangBay.set(khoa, p)
  return p
}

// ───────────────────────────────────────────── BẢN GẦN NHẤT Ở MÁY
const KHO = 'ddh.thuong.v1'
const bam = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }
type Kho = Record<string, { t: number; du: unknown }>
let khoRam: Kho | null = null
function docKho(): Kho {
  if (khoRam) return khoRam
  try { const v = JSON.parse(localStorage.getItem(KHO) || '{}'); khoRam = dt(v) ? (v as Kho) : {} } catch { khoRam = {} }
  return khoRam
}
export const khoaTam = (duong: string, token: string) => `${duong}#${bam(token)}`
export function layTam<T>(khoa: string): T | undefined { return docKho()[khoa]?.du as T | undefined }
export function ghiTam(khoa: string, du: unknown): void {
  const k = docKho()
  k[khoa] = { t: Date.now(), du }
  // giữ gọn: tối đa 12 khoá mới nhất
  const ds = Object.entries(k).sort((a, b) => b[1].t - a[1].t).slice(0, 12)
  khoRam = Object.fromEntries(ds)
  try { localStorage.setItem(KHO, JSON.stringify(khoRam)) } catch { /* đầy / bị chặn: chỉ giữ trong bộ nhớ */ }
}
/** Chỉ test dùng: quên bản tạm trong bộ nhớ. */
export function _quenTam(): void { khoRam = null }

// ───────────────────────────────────────────── LỆNH ĐỌC (có bản gần nhất)
export const DUONG = {
  tongQuan: '/hs/thuong', daXem: '/hs/thuong/da-xem', moRuong: '/hs/thuong/mo-ruong', muaBinh: '/hs/thuong/mua-binh', cuoc: '/hs/thuong/cuoc',
  giai: '/hs/giai', huyHieu: '/hs/huy-hieu', ban: '/hs/ban', timBan: '/hs/ban/tim', moiBan: '/hs/ban/moi', traLoi: '/hs/ban/tra-loi', goCua: '/hs/ban/go-cua', thoi: '/hs/ban/thoi',
  kimCuong: '/hs/kim-cuong/bat-dau',
} as const

async function docCo<T>(duong: string, token: string, doc: (x: unknown) => T | null, them: O = {}): Promise<KetQua<T>> {
  const r = await goiLenhThuong(duong, token, them)
  if (!r.ok) return r
  const d = doc(r.du)
  if (d === null) return { ok: false, loai: 'la', chu: 'Máy chủ trả lời chưa đọc được — em thử lại sau ít phút.' }
  if (!Object.keys(them).length) ghiTam(khoaTam(duong, token), d)
  return { ok: true, du: d }
}
export const layTongQuan = (token: string) => docCo(DUONG.tongQuan, token, docTongQuan)
export const layBangGiai = (token: string) => docCo(DUONG.giai, token, docBangGiai)
export const layHuyHieu = (token: string) => docCo(DUONG.huyHieu, token, docDsHuyHieu)
export const layDsBan = (token: string) => docCo(DUONG.ban, token, docDsBan)
export const timBan = (token: string, q: string) => docCo(DUONG.timBan, token, docKetQuaTim, { q: q.trim().slice(0, 40) })

/** Gọi SONG SONG với lệnh mở app (không nối tiếp). Kết quả vào bản gần nhất ⇒ thanh trên vẽ ngay. */
export function napSanTongQuan(token: string): void { if (token) void layTongQuan(token) }
/** Em mở menu Thành tích ⇒ gọi sẵn bảng giải, bạn bè, huy hiệu (song song). */
export function napSanThanhTich(token: string): void { if (token) { void layBangGiai(token); void layDsBan(token); void layHuyHieu(token) } }

// ───────────────────────────────────────────── LỆNH GHI (máy chủ có khoá chống lặp; ở đây chặn bấm lặp khi đang bay)
const ghi = (duong: string, token: string, them: O = {}) => goiLenhThuong(duong, token, them)
export const daXemThongBao = (token: string, ma: string) => ghi(DUONG.daXem, token, { ma })
export const moRuong = (token: string) => ghi(DUONG.moRuong, token)
export const muaBinh = (token: string) => ghi(DUONG.muaBinh, token)
export const datCuoc = (token: string, dat = 50) => ghi(DUONG.cuoc, token, { dat })
export const moiBan = (token: string, ma: string) => ghi(DUONG.moiBan, token, { ma })
export const traLoiMoi = (token: string, ma: string, dongY: boolean) => ghi(DUONG.traLoi, token, { ma, dongY })
export const goCua = (token: string, ma: string) => ghi(DUONG.goCua, token, { ma })
export const thoiHocCung = (token: string, ma: string) => ghi(DUONG.thoi, token, { ma })
export const batDauKimCuong = (token: string, chuyenDe: string) => docCo(DUONG.kimCuong, token, docPhienKimCuong, { chuyenDe })

// ───────────────────────────────────────────── PHÉP THUẦN dùng chung các màn
export const MOC_CHUOI = [
  { so: 7, thuong: '+10', tt: 10 }, { so: 30, thuong: '+30 · 1 bình', tt: 30 }, { so: 50, thuong: 'rương lớn', tt: 0 },
  { so: 100, thuong: '+100 · khe 3', tt: 100 }, { so: 365, thuong: 'CLB 365', tt: 0 },
] as const
export const MOC_DOI = [{ so: 7, tt: 10 }, { so: 30, tt: 30 }, { so: 100, tt: 100 }] as const
export const THUONG_LEN_HANG: Record<HangGiai, number> = { sat: 0, dong: 20, bac: 30, vang: 40, bachkim: 50, kimcuong: 60 }
export const GIA_BINH = 50
export const DAT_CUOC = 50
/** «còn 2 ngày 5 giờ» từ số giây còn lại. */
export function chuConLai(giay: number): string {
  const g = Math.max(0, Math.floor(giay))
  const ngay = Math.floor(g / 86400), gio = Math.floor((g % 86400) / 3600), phut = Math.floor((g % 3600) / 60)
  if (ngay > 0) return `còn ${ngay} ngày ${gio} giờ`
  if (gio > 0) return `còn ${gio} giờ ${phut} phút`
  return `còn ${Math.max(1, phut)} phút`
}
/** Hạng kế tiếp / trước (Sắt không rơi; Kim cương không lên). */
export const hangSau = (h: HangGiai): HangGiai | null => HANG_GIAI[HANG_GIAI.indexOf(h) + 1] ?? null
export const hangTruoc = (h: HangGiai): HangGiai | null => (h === 'sat' ? null : HANG_GIAI[HANG_GIAI.indexOf(h) - 1] ?? null)
