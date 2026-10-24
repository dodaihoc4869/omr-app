// XẾP HỌC SINH «HỌC THẬT · ĐỐI PHÓ» — lớp nối app THẦY (thầy 24/10, đặc tả docs/DE-XUAT-HOC-THAT-DOI-PHO-2410.md mục 4b). Chỉ tệp này biết các lệnh
// `/gv/danh-gia/*` (server/src/danh-gia-hoc-that-d1.ts, server/src/bao-cao-tuan.ts). Đọc chặt: trường sai kiểu ⇒ bỏ / null, không bịa số.
// CHỈ app thầy nhập tệp này (có tên bậc «Không dạy nổi», «ĐUỔI»); app học sinh / phụ huynh dùng src/lib/bao-cao-tuan-ph-api.ts.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

const CHU_CHUA_CO = 'Máy chủ chưa có lệnh xếp học sinh — cần đẩy bản máy chủ mới.'
type O = Record<string, unknown>
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const s = (x: unknown) => (typeof x === 'string' ? x : '')
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const mang = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])

export type CheDo = 'tat' | 'ngam' | 'bat'
export type Bac = 1 | 2 | 3 | 4 | 5
export const TEN_BAC_GV: Readonly<Record<Bac, string>> = { 1: 'Học thật', 2: 'Cần theo dõi', 3: 'Đối phó', 4: 'Không dạy nổi', 5: 'ĐUỔI' }
export const TEN_CHE_DO: Readonly<Record<CheDo, string>> = { tat: 'Tắt', ngam: 'Chạy ngầm', bat: 'Bật' }
export const GIAI_CHE_DO: Readonly<Record<CheDo, string>> = {
  tat: 'Không tính, không lưu gì.',
  ngam: 'Máy tính và lưu mỗi thứ Hai, chỉ thầy thấy. Không nhắc em, không báo phụ huynh.',
  bat: 'Em thấy Học thật / Đối phó kèm lý do. Đối phó tuần đầu máy nhắc em, tuần thứ hai liền máy báo phụ huynh.',
}
export const bacHop = (x: unknown): Bac | null => (x === 1 || x === 2 || x === 3 || x === 4 || x === 5 ? x : null)
export const cheDoHop = (x: unknown): CheDo | null => (x === 'tat' || x === 'ngam' || x === 'bat' ? x : null)

export interface PhatGv { ma: string; diem: number; chu: string; xau: boolean; coDo: boolean }
export interface SoLieuGv {
  soLuot: number; soDo: number; soThuoc: number; soBamVoi: number; soTreo: number; soCoTinh: number
  nhanDung: number | null; chamDung: number | null; dungGoc: number | null; dungSongSinh: number | null; boKtcn: number | null
}
export interface TienBoGv { dungBanKhac: number | null; ktcnXuHuong: number | null; nhan: 'dang_tien' | 'dung_yen' | 'di_lui' | 'chua_ro' }
export interface TuanGv {
  sbd: string; tuan: string; diem: number; bac: Bac; bacTuan: number; duDuLieu: boolean; coDo: boolean
  phat: PhatGv[]; soLieu: SoLieuGv | null; tienBo: TienBoGv | null; lyDo: string[]; viec: string | null
  bangChung: { tuan: string; diem: number; bac: Bac }[] | null
}
export interface EmLop extends TuanGv { ten: string; lop: string }

const docPhat = (x: unknown): PhatGv | null => {
  const o = dt(x); if (!o) return null
  const diem = so(o.diem); if (diem === null || !s(o.chu)) return null
  return { ma: s(o.ma), diem, chu: s(o.chu), xau: o.xau === true, coDo: o.coDo === true }
}
const docSoLieu = (x: unknown): SoLieuGv | null => {
  const o = dt(x); if (!o) return null
  const k = ['soLuot', 'soDo', 'soThuoc', 'soBamVoi', 'soTreo', 'soCoTinh'] as const
  if (k.some((t) => so(o[t]) === null)) return null
  const t = (n: string) => so(o[n])
  return { soLuot: t('soLuot')!, soDo: t('soDo')!, soThuoc: t('soThuoc')!, soBamVoi: t('soBamVoi')!, soTreo: t('soTreo')!, soCoTinh: t('soCoTinh')!, nhanDung: t('nhanDung'), chamDung: t('chamDung'), dungGoc: t('dungGoc'), dungSongSinh: t('dungSongSinh'), boKtcn: t('boKtcn') }
}
const docTienBo = (x: unknown): TienBoGv | null => {
  const o = dt(x); if (!o) return null
  const n = s(o.nhan)
  return { dungBanKhac: so(o.dungBanKhac), ktcnXuHuong: so(o.ktcnXuHuong), nhan: n === 'dang_tien' || n === 'dung_yen' || n === 'di_lui' ? n : 'chua_ro' }
}
const docBangChung = (x: unknown) => {
  if (!Array.isArray(x)) return null
  const ra = x.map((y) => { const o = dt(y); const b = bacHop(o?.bac), d = so(o?.diem); return o && b && d !== null && s(o.tuan) ? { tuan: s(o.tuan), diem: d, bac: b } : null })
  return ra.every(Boolean) ? (ra as { tuan: string; diem: number; bac: Bac }[]) : null
}
export function docTuan(x: unknown): TuanGv | null {
  const o = dt(x); if (!o) return null
  const bac = bacHop(o.bac), diem = so(o.diem)
  if (!bac || diem === null) return null
  return {
    sbd: s(o.sbd), tuan: s(o.tuan), diem, bac, bacTuan: so(o.bacTuan) ?? bac, duDuLieu: o.duDuLieu !== false, coDo: o.coDo === true,
    phat: mang(o.phat).map(docPhat).filter((p): p is PhatGv => !!p), soLieu: docSoLieu(o.soLieu), tienBo: docTienBo(o.tienBo),
    lyDo: mang(o.lyDo).map(s).filter(Boolean), viec: s(o.viec) || null, bangChung: docBangChung(o.bangChung),
  }
}

export async function layLopHocThat(): Promise<KetQuaLenh<{ cheDo: CheDo; em: EmLop[] }>> {
  const r = await goiLenh('/gv/danh-gia/lop', {}, CHU_CHUA_CO)
  if (!r.ok) return r
  const em = mang(r.du.em).map((x) => { const t = docTuan(x); const o = dt(x)!; return t ? { ...t, ten: s(o.ten) || t.sbd, lop: s(o.lop) } : null }).filter((x): x is EmLop => !!x)
  return { ok: true, du: { cheDo: cheDoHop(r.du.cheDo) ?? 'ngam', em } }
}

export interface CanThiepGv { id: string; loai: string; noiDung: string; tuan: string; guiLuc: string; emXem: string | null; phXem: string | null; taoBoi: string }
export interface HoSoHocThat { em: { sbd: string; ten: string; lop: string }; hienTai: TuanGv | null; lichSu: TuanGv[]; canThiep: CanThiepGv[] }

export async function layEmHocThat(sbd: string): Promise<KetQuaLenh<HoSoHocThat>> {
  const r = await goiLenh('/gv/danh-gia/em', { sbd }, CHU_CHUA_CO)
  if (!r.ok) return r
  const em = dt(r.du.em)
  const ht = dt(r.du.hienTai)
  return {
    ok: true,
    du: {
      em: { sbd: s(em?.sbd) || sbd, ten: s(em?.ten) || sbd, lop: s(em?.lop) },
      hienTai: ht ? docTuan({ ...ht, sbd }) : null,
      lichSu: mang(r.du.lichSu).map(docTuan).filter((x): x is TuanGv => !!x),
      canThiep: mang(r.du.canThiep).map((x) => {
        const o = dt(x)
        const nd = o?.noiDung
        return o ? { id: s(o.id), loai: s(o.loai), noiDung: typeof nd === 'string' ? nd : nd && typeof nd === 'object' ? s((nd as O).chu) || '' : '', tuan: s(o.tuan), guiLuc: s(o.guiLuc), emXem: s(o.emXem) || null, phXem: s(o.phXem) || null, taoBoi: s(o.taoBoi) } : null
      }).filter((x): x is CanThiepGv => !!x),
    },
  }
}

export const datCheDo = async (cheDo: CheDo) => {
  const r = await goiLenh('/gv/danh-gia/che-do', { cheDo }, CHU_CHUA_CO)
  return r.ok ? ({ ok: true, du: cheDoHop(r.du.cheDo) ?? cheDo } as const) : r
}

/** Thầy bấm: nhắc em / đã gọi phụ huynh / mở cam kết 14 ngày / cho thêm 2 tuần / xác nhận cho nghỉ / xác nhận gian lận. */
export type LoaiCanThiepThay = 'nhac_em' | 'thay_goi_ph' | 'cam_ket' | 'cho_them' | 'xac_nhan_nghi' | 'gian_lan_xac_nhan'
export const TEN_CAN_THIEP: Readonly<Record<string, string>> = {
  nhac_em: 'Nhắc em', bao_ph: 'Báo phụ huynh', thay_goi_ph: 'Thầy đã gọi phụ huynh', cam_ket: 'Mở cam kết 14 ngày', cho_them: 'Cho thêm 2 tuần',
  xac_nhan_nghi: 'Xác nhận cho nghỉ', gian_lan_xac_nhan: 'Xác nhận gian lận',
}
export const ghiCanThiep = (sbd: string, loai: LoaiCanThiepThay, noiDung = '') => goiLenh('/gv/danh-gia/can-thiep', { sbd, loai, noiDung }, CHU_CHUA_CO)

/** Tính lại + lưu cho cả trung tâm, mỗi lượt ≤ 25 em; gọi lặp tới khi xong. `tienDo(soEm)` sau mỗi lô. */
export async function tinhLaiTatCa(tienDo: (soEm: number) => void): Promise<KetQuaLenh<{ soEm: number }>> {
  let sau = '', tong = 0
  for (let i = 0; i < 40; i++) {
    const r = await goiLenh('/gv/danh-gia/tinh-lai', { sau }, CHU_CHUA_CO, 'Máy chủ tính chậm — bấm Tính lại lần nữa, máy làm tiếp từ chỗ dừng.')
    if (!r.ok) return r
    tong += so(r.du.soEm) ?? 0
    tienDo(tong)
    if (r.du.xong === true || !s(r.du.sau)) return { ok: true, du: { soEm: tong } }
    sau = s(r.du.sau)
  }
  return { ok: true, du: { soEm: tong } }
}

export type NhanMu = 'hoc_that' | 'doi_pho' | 'khong_day_noi'
export const TEN_NHAN_MU: Readonly<Record<NhanMu, string>> = { hoc_that: 'Học thật', doi_pho: 'Đối phó', khong_day_noi: 'Không dạy nổi' }
export interface SoSanhNhanMu { coMay: number; khop: number; tiLeKhop: number | null; hocThatBiNang: number; lech: { sbd: string; thay: string; may: string }[] }
export async function nhanMu(body: { sbd?: string; nhan?: NhanMu | ''; soSanh?: boolean }): Promise<KetQuaLenh<{ nhan: Map<string, NhanMu>; soSanh: SoSanhNhanMu | null }>> {
  const r = await goiLenh('/gv/danh-gia/nhan-mu', body, CHU_CHUA_CO)
  if (!r.ok) return r
  const nhan = new Map<string, NhanMu>()
  for (const x of mang(r.du.nhan)) { const o = dt(x); const n = s(o?.nhan); if (o && s(o.sbd) && (n === 'hoc_that' || n === 'doi_pho' || n === 'khong_day_noi')) nhan.set(s(o.sbd), n) }
  const ss = dt(r.du.soSanh)
  return {
    ok: true,
    du: {
      nhan,
      soSanh: ss ? { coMay: so(ss.coMay) ?? 0, khop: so(ss.khop) ?? 0, tiLeKhop: so(ss.tiLeKhop), hocThatBiNang: so(ss.hocThatBiNang) ?? 0, lech: mang(ss.lech).map((x) => { const o = dt(x); return { sbd: s(o?.sbd), thay: s(o?.thay), may: s(o?.may) } }) } : null,
    },
  }
}

/** Phần trăm làm tròn; null ⇒ "—". */
export const ptChu = (x: number | null | undefined) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`)
/** "2026-10-26" ⇒ "26/10". */
export const ngayNgan = (x: string) => (/^\d{4}-\d{2}-\d{2}/.test(x) ? `${x.slice(8, 10)}/${x.slice(5, 7)}` : x)
