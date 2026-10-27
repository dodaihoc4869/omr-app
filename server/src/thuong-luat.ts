// LUẬT THƯỞNG PHẠT KIỂU DUOLINGO — HÀM THUẦN (thầy CHỐT 26/10; DAC-TA-THUONG-PHAT-2610.md §4.1–4.4, LUAT-THUONG-PHAT.md).
// Không đọc D1, không đọc đồng hồ, không Math.random (ngẫu nhiên có hạt giống theo em + ngày). Số nguyên tử ở `exp-cau-hinh.ts`; số tinh thể ở ĐÂY.
//
// Luật cứng: KHÔNG có nhãn lười (Bấm vội / treo / Đối phó / bậc / ĐUỔI) trong bất kỳ chữ nào trả về cho học sinh — tầng này chỉ trả `tinh: false`.
import { mucLamCuaLuot, type PhanMucLam } from './muc-lam'
import type { DoTreo } from './do-giay-luot'

// --- Câu không được tính (Mức làm) -----------------------------------------------------------------

export interface DoCauThuong {
  /** Giây làm (≥ 1). */
  giay: number | null | undefined
  soTu: number | null | undefined
  coHinh: boolean
  phan: string | null | undefined
  /** 1 = giây từ đồng hồ MỚI của máy em (đo treo máy được). */
  dh?: 1 | null
  treo?: DoTreo | null
}

/**
 * Câu KHÔNG được tính (nguyên tử 0, đứt chuỗi): Mức làm 1 «Bấm vội» (nhanh hơn thời gian đọc đề MÀ SAI) hoặc Mức làm 5/6 «Treo máy». Lượt ĐÚNG nhanh
 * («Thuộc») vẫn được tính. Thiếu số đo ⇒ được tính (không đoán, không phạt oan). Dùng ĐÚNG hàm `mucLamCuaLuot` của hệ Mức làm (một nguồn).
 */
export function cauKhongDuocTinh(d: DoCauThuong | null | undefined, dung: boolean | null): boolean {
  if (!d) return false
  const giay = Number(d.giay)
  const soTu = Number(d.soTu)
  const phan = d.phan === 'I' || d.phan === 'II' || d.phan === 'III' ? (d.phan as PhanMucLam) : null
  if (!Number.isFinite(giay) || giay < 1 || !Number.isFinite(soTu) || soTu < 0 || !phan) return false
  const m = mucLamCuaLuot({ giay, soTu, coHinh: d.coHinh, phan, dung, treo: d.dh === 1 ? d.treo ?? null : null, ...(d.dh === 1 ? {} : { uocTinh: 'cu' as const }) })
  if (!m) return false
  if (m.treo) return true
  return m.ma === 1 && dung !== true
}

/** Như `cauKhongDuocTinh`, đọc từ `raw_json.doc` của sổ (`{t, h, p, dh, v, a, l, n, w}`) + cột `giay`. */
export function cauKhongDuocTinhTuSo(giay: unknown, doc: unknown, dung: boolean | null): boolean {
  let o: Record<string, unknown> | null = null
  try { o = typeof doc === 'string' ? (JSON.parse(doc) as Record<string, unknown>) : (doc as Record<string, unknown> | null) } catch { o = null }
  if (!o || typeof o !== 'object') return false
  const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
  const dh = o.dh === 1 ? 1 : null
  const v = so(o.v), a = so(o.a), l = so(o.l)
  const treo: DoTreo | null = dh && v !== null && a !== null && l !== null ? { v, a, l, n: so(o.n) ?? 0, w: o.w === 1 ? 1 : 0 } : null
  return cauKhongDuocTinh({ giay: Number(giay), soTu: so(o.t), coHinh: o.h === 1, phan: typeof o.p === 'string' ? o.p : null, dh, treo }, dung)
}

/** Câu khó: nhiều sao hoặc vận dụng cao — cùng luật «kho» của Gói 7 (goi-bai-7.ts). */
export const laCauKho = (q: { sao?: unknown; mucDo?: unknown }): boolean => Number(q.sao) >= 2 || ['VDC', 'van_dung_cao'].includes(String(q.mucDo ?? ''))

// --- Tinh thể (= ví vàng `vang_so`) ------------------------------------------------------------------

/** Số câu tối đa của một bài (chặng) — mục tiêu ngày = ceil(mức câu hôm nay / số này). */
export const CAU_MOI_BAI = 6
export const TT_RUONG = 15
export const TT_MUC_TIEU_NGAY = 5
export const TT_KIM_CUONG = 40
/** Giá 1 bình giữ chuỗi. Luật 27/10 (thầy: «1 tuần kiếm được 1 bình thôi»): 150 (trước 50), mỗi em MUA tối đa BINH_MUA_TOI_DA_TUAN bình / tuần VN (thứ Hai → Chủ nhật). */
export const TT_BINH_GIU_CHUOI = 150
export const BINH_MUA_TOI_DA_TUAN = 1
/** Hậu tố khoá ví của lượt mua bình luật mới: `tt|<ngày VN>|binh-w` (khoá cũ `tt|<ngày>|binh` giá 50 KHÔNG tính vào hạn tuần). */
export const HAU_TO_KHOA_BINH_TUAN = 'binh-w'
/** Thứ Hai (ngày VN) của tuần chứa `ngay`. */
export const thuHaiTt = (ngay: string): string => congNgayTt(ngay, -((new Date(Date.parse(`${ngay}T00:00:00Z`)).getUTCDay() + 6) % 7))
/** Khoảng khoá ví [từ, tới) của tuần chứa `ngay` (so chuỗi theo chỉ mục UNIQUE(sbd, khoa_yeu_cau)) + ngày mua tiếp (thứ Hai tuần sau). */
export function tuanMuaBinh(ngay: string): { tu: string; toi: string; muaTiepTu: string } {
  const t2 = thuHaiTt(ngay)
  const sau = congNgayTt(t2, 7)
  return { tu: `tt|${t2}|`, toi: `tt|${sau}|`, muaTiepTu: sau }
}
export const TT_CUOC_DAT = 50
export const TT_CUOC_THANG = 100
export const CUOC_SO_NGAY = 7
/** Mốc chuỗi cá nhân (ngày → tinh thể) và chuỗi đôi. Mốc chuỗi do Code app 4 phát hiện, gọi `lenhThuongMocChuoi` (thuong-d1.ts). */
export const TT_MOC_CHUOI: Readonly<Record<number, number>> = { 7: 10, 30: 30, 100: 100, 365: 365 }
export const TT_MOC_CHUOI_DOI: Readonly<Record<number, number>> = { 7: 10, 30: 30, 100: 100 }
/** Lên hạng giải (theo hạng MỚI) — tác tử giải tuần gọi `lenhCongTinhThe`. */
export const HANG_GIAI = ['sat', 'dong', 'bac', 'vang', 'bachkim', 'kimcuong'] as const
export type HangGiai = (typeof HANG_GIAI)[number]
export const TT_LEN_HANG: Readonly<Record<HangGiai, number>> = { sat: 0, dong: 20, bac: 30, vang: 40, bachkim: 50, kimcuong: 60 }
/** Thăng hoa: 2 ngày liền không xong bài nào, không bình đỡ ⇒ mất 10 % (tối thiểu 5, tối đa 50, không âm). */
export const THANG_HOA_TI_LE = 0.1
export const THANG_HOA_TOI_THIEU = 5
export const THANG_HOA_TOI_DA = 50
export const THANG_HOA_SO_NGAY = 2

/** Số tinh thể thăng hoa mất với số dư `v` (không bao giờ quá số dư; số dư ≤ 0 ⇒ 0). */
export function soThangHoa(v: number): number {
  const du = Math.floor(Number(v) || 0)
  if (du <= 0) return 0
  return Math.min(du, THANG_HOA_TOI_DA, Math.max(THANG_HOA_TOI_THIEU, Math.round(du * THANG_HOA_TI_LE)))
}

/**
 * Sổ `vang_so` có CHECK(loai IN ('doi','mua','hoan')) — đổi CHECK không phải migration chỉ-thêm ⇒ tinh thể dùng đúng hai loại có sẵn:
 *   kiếm: loai 'doi', exp_tru 0 · tiêu / mất: loai 'mua' (số âm); `ma_mon` = loại tinh thể (bảng dưới), `khoa_yeu_cau` bắt đầu 'tt|' (không đụng khoá đúc 'duc|…').
 */
export const MA_TT = {
  nhiemVu: 'tt-nhiem-vu', ruong: 'tt-ruong', mucTieu: 'tt-muc-tieu', mocChuoi: 'tt-moc-chuoi', mocChuoiDoi: 'tt-moc-chuoi-doi', lenHang: 'tt-len-hang',
  kimCuong: 'tt-kim-cuong', cuocThang: 'tt-cuoc-thang', binh: 'tt-binh', binhHoan: 'tt-binh-hoan', cuoc: 'tt-cuoc', thangHoa: 'tt-thang-hoa',
} as const

// --- Ngày VN + ngẫu nhiên có hạt giống ---------------------------------------------------------------

export const ngayVnTt = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
export const congNgayTt = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
/** ISO UTC của 00:00 giờ VN ngày `ngay`. */
export const dauNgayVnIso = (ngay: string): string => new Date(Date.parse(`${ngay}T00:00:00+07:00`)).toISOString()
/** Giờ VN (0–23) của một mốc ISO. */
export const gioVnCua = (iso: string): number => new Date(Date.parse(iso) + 7 * 3_600_000).getUTCHours()

function bam32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- Nhiệm vụ ngày (3 ô) + rương -----------------------------------------------------------------------

export type MaNhiemVu = 'xong_bai' | 'chuoi_dung_5' | 'dung_kho_2' | 'sua_loi_2' | 'hoan_hao' | 'hoc_truoc_20h'
export interface MauNhiemVu { ma: MaNhiemVu; ten: string; can: number; thuong: number }
/** Bộ mẫu (LUAT mục «Nhiệm vụ ngày»). Mỗi ô 5–10 tinh thể. */
export const MAU_NHIEM_VU: readonly MauNhiemVu[] = [
  { ma: 'xong_bai', ten: 'Xong 2 chặng', can: 2, thuong: 10 },
  { ma: 'chuoi_dung_5', ten: 'Chuỗi đúng 5 câu', can: 5, thuong: 10 },
  { ma: 'dung_kho_2', ten: 'Đúng 2 câu khó', can: 2, thuong: 10 },
  { ma: 'sua_loi_2', ten: 'Sửa 2 lỗi cũ', can: 2, thuong: 5 },
  { ma: 'hoan_hao', ten: 'Chặng hoàn hảo', can: 1, thuong: 10 },
  { ma: 'hoc_truoc_20h', ten: 'Học trước 20:00', can: 1, thuong: 5 },
]
export const SO_NHIEM_VU = 3

/** 3 nhiệm vụ của em ngày `ngay`: luôn có «Xong N bài» + 2 ô rút có hạt giống (em + ngày) từ các mẫu còn lại. Cùng đầu vào ⇒ cùng kết quả. */
export function chonNhiemVu(sbd: string, ngay: string): MauNhiemVu[] {
  const r = mulberry32(bam32(`${sbd}|${ngay}|nhiem-vu`))
  const con = MAU_NHIEM_VU.slice(1)
  for (let i = con.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [con[i], con[j]] = [con[j]!, con[i]!] }
  return [MAU_NHIEM_VU[0]!, ...con.slice(0, SO_NHIEM_VU - 1)]
}

/** Số liệu một ngày của em để đo nhiệm vụ (đều đọc sẵn theo chỉ mục, không quét sổ). */
export interface SoLieuNgay {
  baiXong: number
  chuoiMax: number
  khoDung: number
  suaLoi: number
  hoanHao: number
  /** Số bài xong trước 20:00 giờ VN. */
  baiTruoc20h: number
}
export const SO_LIEU_RONG: SoLieuNgay = { baiXong: 0, chuoiMax: 0, khoDung: 0, suaLoi: 0, hoanHao: 0, baiTruoc20h: 0 }

export function tienNhiemVu(ma: MaNhiemVu, s: SoLieuNgay): number {
  switch (ma) {
    case 'xong_bai': return s.baiXong
    case 'chuoi_dung_5': return s.chuoiMax
    case 'dung_kho_2': return s.khoDung
    case 'sua_loi_2': return s.suaLoi
    case 'hoan_hao': return s.hoanHao
    case 'hoc_truoc_20h': return s.baiTruoc20h
  }
}

export interface NhiemVuEm { ma: MaNhiemVu; ten: string; tien: number; can: number; thuong: number; xong: boolean }

/** Ba ô của ngày (`mau` = dòng đã sinh trong `nhiem_vu_ngay`, vắng ⇒ rút theo hạt giống) với tiến độ. */
export function nhiemVuCuaNgay(sbd: string, ngay: string, s: SoLieuNgay, mau?: readonly MauNhiemVu[]): NhiemVuEm[] {
  const ds = mau && mau.length ? mau : chonNhiemVu(sbd, ngay)
  return ds.map((m) => { const da = Math.max(0, tienNhiemVu(m.ma, s)); return { ma: m.ma, ten: m.ten, tien: Math.min(da, m.can), can: m.can, thuong: m.thuong, xong: da >= m.can } })
}

/** Mục tiêu ngày = số bài trong kế hoạch ngày = ceil(mức câu đã chốt / CAU_MOI_BAI) (mức đã gồm quota câu mới). Chưa chốt mức ⇒ 1 bài. */
export const mucTieuBai = (mucCau: number | null | undefined): number => {
  const m = Math.floor(Number(mucCau) || 0)
  return m > 0 ? Math.max(1, Math.ceil(m / CAU_MOI_BAI)) : 1
}

// --- Kim cương ---------------------------------------------------------------------------------------

export const KC_SO_CAU = 10
export const KC_ONG = 3
export const KC_KHOA_MS = 24 * 3_600_000
/** Trạng thái thử thách từ dãy kết quả (đúng/sai) theo thứ tự trả lời. Sai mỗi câu vỡ 1 ống; vỡ đủ 3 là trượt; đủ 10 câu còn ống là đạt. */
export function trangThaiKimCuong(ketQua: readonly boolean[], soCau: number = KC_SO_CAU): { ongCon: number; xong: boolean; dat: boolean } {
  let sai = 0
  let n = 0
  for (const d of ketQua) { n++; if (!d) sai++; if (sai >= KC_ONG) break }
  const ongCon = Math.max(0, KC_ONG - sai)
  const xong = ongCon === 0 || n >= soCau
  return { ongCon, xong, dat: xong && ongCon > 0 }
}

// --- Huy hiệu ----------------------------------------------------------------------------------------

export interface DinhNghiaHuyHieu { ma: string; ten: string; can?: number }
/** Huy hiệu cố định (Kim cương từng chuyên đề thêm động: `kc|<chuyên đề>`). Hạng giải + chuỗi do tác tử giải / Code app 4 trao (bảng `huy_hieu_em`). */
export const HUY_HIEU: readonly DinhNghiaHuyHieu[] = [
  { ma: 'chuoi_7', ten: 'Chuỗi 7 ngày', can: 7 },
  { ma: 'chuoi_30', ten: 'Chuỗi 30 ngày', can: 30 },
  { ma: 'chuoi_100', ten: 'Chuỗi 100 ngày', can: 100 },
  { ma: 'chuoi_365', ten: 'Câu lạc bộ 365', can: 365 },
  { ma: 'hang_dong', ten: 'Hạng Đồng' },
  { ma: 'hang_bac', ten: 'Hạng Bạc' },
  { ma: 'hang_vang', ten: 'Hạng Vàng' },
  { ma: 'hang_bachkim', ten: 'Hạng Bạch kim' },
  { ma: 'hang_kimcuong', ten: 'Hạng Kim cương' },
  { ma: 'quan_quan', ten: 'Quán quân' },
  { ma: 'hoan_hao_10', ten: '10 chặng hoàn hảo', can: 10 },
  { ma: 'hoan_hao_50', ten: '50 chặng hoàn hảo', can: 50 },
  { ma: 'phan_ung_day_chuyen', ten: 'Phản ứng dây chuyền', can: 10 },
  { ma: 'cu_dem', ten: 'Cú đêm' },
  // Chuỗi đôi «Học cùng bạn» — tác tử B trao (ghi `huy_hieu_em`), tầng này chỉ liệt kê.
  { ma: 'doi_7', ten: 'Học cùng bạn 7 ngày' },
  { ma: 'doi_30', ten: 'Học cùng bạn 30 ngày' },
  { ma: 'doi_100', ten: 'Học cùng bạn 100 ngày' },
]
/** Giờ VN từ đó tính «Cú đêm». */
export const GIO_CU_DEM = 21

export interface TienDoHuyHieu { chuoiNgay: number; hoanHao: number; chuoiDungMax: number; coBaiDem: boolean }
/** Huy hiệu nào ĐẠT theo số liệu (chỉ các huy hiệu tầng này tự trao: hoàn hảo, phản ứng dây chuyền, cú đêm) + tiến độ hiện của mọi huy hiệu có `can`. */
export function datHuyHieu(t: TienDoHuyHieu): { dat: string[]; tien: Record<string, number> } {
  const dat: string[] = []
  if (t.hoanHao >= 10) dat.push('hoan_hao_10')
  if (t.hoanHao >= 50) dat.push('hoan_hao_50')
  if (t.chuoiDungMax >= 10) dat.push('phan_ung_day_chuyen')
  if (t.coBaiDem) dat.push('cu_dem')
  return {
    dat,
    tien: { chuoi_7: t.chuoiNgay, chuoi_30: t.chuoiNgay, chuoi_100: t.chuoiNgay, chuoi_365: t.chuoiNgay, hoan_hao_10: t.hoanHao, hoan_hao_50: t.hoanHao, phan_ung_day_chuyen: t.chuoiDungMax },
  }
}

// --- Công tắc ----------------------------------------------------------------------------------------

export const KHOA_CONG_TAC = ['thuong_giai_tuan', 'thuong_thang_hoa', 'thuong_ban_be', 'thuong_kim_cuong'] as const
export type KhoaCongTac = (typeof KHOA_CONG_TAC)[number]
export type CongTac = Record<KhoaCongTac, 'bat' | 'tat'>
/** Vắng dòng / giá trị lạ ⇒ 'bat' (thầy: đẩy lên sống luôn, tắt được từng phần). */
export function congTacTuDong(rows: readonly { khoa: unknown; gia_tri: unknown }[]): CongTac {
  const m = new Map(rows.map((r) => [String(r.khoa), String(r.gia_tri ?? '').trim().replace(/^"|"$/g, '')]))
  return Object.fromEntries(KHOA_CONG_TAC.map((k) => [k, m.get(k) === 'tat' ? 'tat' : 'bat'])) as CongTac
}

/**
 * TẠM ĐÓNG APP HỌC SINH (thầy 27/10 tối: «Tắt app, để tối ưu xong rồi mở lại cho tôi»). Khoá riêng trong `cau_hinh`, NGƯỢC chiều với 4 công tắc thưởng:
 * 'bat' = ĐANG ĐÓNG; vắng dòng / giá trị lạ = MỞ. Không đổi schema. Máy chủ chỉ báo cờ (`tamDong` trong /hs/thuong); màn phủ ở app học sinh,
 * KHÔNG chặn lệnh kiểm tra cá nhân / ca thi (em đang làm dở vẫn nộp được).
 */
export const KHOA_TAM_DONG_HS = 'hs_tam_dong'
export function tamDongTuDong(rows: readonly { khoa: unknown; gia_tri: unknown }[]): boolean {
  const r = rows.find((x) => String(x.khoa) === KHOA_TAM_DONG_HS)
  return !!r && String(r.gia_tri ?? '').trim().replace(/^"|"$/g, '') === 'bat'
}
