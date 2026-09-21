// "DỒN VỀ ĐÍCH" — hàm THUẦN (Code 1, 21/09/2026; thầy chốt 14:13 "Chốt B và chốt hết build"; `DE-XUAT-DON-VE-DICH-2109.md`, `prompt-don-ve-dich-2109.md`).
//
// Việc BẮT BUỘC ngày nào chưa xong thì hôm sau hiện đủ, tính lại theo GIỜ, xong TRƯỚC hạn nộp. Ba hàm:
//   • `soNo`            — sổ nợ theo NGÀY VN (chặng bài tập về nhà lỡ, câu ôn quá lịch, gói gia đình giao chưa xong).
//   • `keHoachVeDich`   — rải việc còn lại vào các BUỔI học được (mặc định 19:30–22:30, sáng ngày hạn khi hạn rơi trưa), nợ trước → chặng hôm nay → chặng sau; trần buổi 2 chặng / 30 câu / 60 phút.
//   • `raiOnQuaLich`    — rải câu ôn quá lịch trong ≤ 3 ngày (trần ôn 40 % ngân sách, 60 % khi hôm đó không nợ chặng).
// RÀO: hạn nộp KHÔNG BAO GIỜ bị đổi; không việc nào được xếp SAU hạn hay SAU 22:30 hay vào giờ có ca kiểm tra; việc không xếp được thì NÓI RÕ (`kip = false`, `chuaXep`), không bao giờ im lặng bỏ;
// lõi bắt buộc không bị cắt (chỉ phần làm thêm — luật hạn ngắn 1.4 của máy chủ). Không đọc đồng hồ, không ngẫu nhiên, không sửa đầu vào; giờ Việt Nam (UTC+7) bằng số học.
import { LICH_CHANG, phutUocTinhChang } from './btvn-nang-do-lich'

const MS_PHUT = 60_000
const MS_NGAY = 86_400_000
const LECH_VN = 7 * 3_600_000

export const KHUNG_GIO_HOC_MAC_DINH = { tu: '19:30', den: '22:30' } as const
/** Không xếp việc nào sau giờ này (giờ VN), dù khung học của em muộn hơn. */
export const GIO_MUON_NHAT = '22:30'
/** Sáng NGÀY HẠN được dùng khi hạn rơi trưa (trước khung tối): từ giờ này tới hạn. */
export const GIO_SANG_NGAY_HAN = '06:30'
/** Buổi sáng ngày hạn chỉ mở khi còn ít nhất chừng này phút trước hạn. */
export const PHUT_SANG_TOI_THIEU = 30
export const TRAN_BUOI_MAC_DINH = { chang: 2, cau: 30, phut: 60 } as const
export const SO_NGAY_RAI_ON_TOI_DA = 3
export const TRAN_ON_KHI_CO_NO = 0.4
export const TRAN_ON_KHI_KHONG_NO = 0.6

// ══════════════════════════════ GIỜ VN ══════════════════════════════
const dauNgayVn = (ms: number): number => Math.floor((ms + LECH_VN) / MS_NGAY) * MS_NGAY - LECH_VN
const ngayVn = (ms: number): string => new Date(ms + LECH_VN).toISOString().slice(0, 10)
const phutHHMM = (hhmm: string): number => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  return m ? Math.min(24 * 60, Number(m[1]) * 60 + Number(m[2])) : 0
}
const gioHHMM = (ms: number): string => {
  const p = Math.floor((((ms + LECH_VN) % MS_NGAY) + MS_NGAY) % MS_NGAY / MS_PHUT)
  return `${String(Math.floor(p / 60)).padStart(2, '0')}:${String(p % 60).padStart(2, '0')}`
}
const isoVn = (ms: number): string => {
  const t = new Date(ms + LECH_VN).toISOString() // ...Z giả làm giờ VN
  return `${t.slice(0, 19)}+07:00`
}
const docMs = (s: unknown): number => {
  const t = typeof s === 'string' ? Date.parse(s) : typeof s === 'number' ? s : Number.NaN
  return Number.isFinite(t) ? t : Number.NaN
}
const soDuong = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : 0)
const soNguyenDuong = (x: unknown): number => Math.floor(soDuong(x))

// ══════════════════════════════ SỔ NỢ ══════════════════════════════
export type LoaiNo = 'chang_btvn' | 'goi_gia_dinh' | 'on_lai'

export interface BaiDangChay {
  maBtvn: string
  ten: string
  /** Hạn nộp (ISO). */
  hanNop: string
  /** Giờ mở của từng chặng (ISO), theo thứ tự chặng. */
  moLuc: readonly string[]
  /** Số chặng ĐÃ xong (chặng 0…daXong−1 xong; chặng kế là chặng số `daXong`). */
  daXong: number
  cauMoiChang: readonly number[]
  phutMoiChang: readonly number[]
}
export interface OnQuaLich { ngay: string; soCau: number }
export interface GoiGiaDinhChuaXong { ngay: string; soCau: number; ten?: string; phut?: number }
export interface MonNo { ngay: string; loai: LoaiNo; ten: string; soCau: number; phut: number; maBtvn?: string; chiSo?: number }

const THU_TU_LOAI: Record<LoaiNo, number> = { chang_btvn: 0, goi_gia_dinh: 1, on_lai: 2 }

/**
 * SỔ NỢ: việc BẮT BUỘC lẽ ra xong trước 00:00 hôm nay (giờ VN) mà chưa xong, mỗi món gắn NGÀY của nó:
 *   • chặng bài tập về nhà có `moLuc` < 00:00 hôm nay và chỉ số ≥ `daXong` (bài đã QUÁ HẠN vẫn còn nợ — Điều 4 B: em vẫn phải làm nốt, ghi nộp trễ);
 *   • câu ôn lại có mốc < hôm nay; • gói gia đình giao chưa xong của ngày trước.
 * Việc tự chọn (lượt thần thú, thử thách riêng) KHÔNG thành nợ. Trả về sắp theo ngày tăng dần, rồi chặng → gói → ôn. `giayMoiCau` (mặc định như lịch chặng) để đổi câu ôn ra phút.
 */
export function soNo(v: { now: number; baiDangChay: readonly BaiDangChay[]; onQuaLich?: readonly OnQuaLich[]; goiGiaDinh?: readonly GoiGiaDinhChuaXong[]; giayMoiCau?: number }): MonNo[] {
  if (!Number.isFinite(v.now)) return []
  const homNay = dauNgayVn(v.now)
  const homNayChuoi = ngayVn(v.now)
  const ra: MonNo[] = []
  for (const b of v.baiDangChay) {
    const daXong = soNguyenDuong(b.daXong)
    for (let k = daXong; k < b.moLuc.length; k++) {
      const mo = docMs(b.moLuc[k])
      if (!Number.isFinite(mo) || mo >= homNay) continue
      const soCau = soNguyenDuong(b.cauMoiChang[k])
      ra.push({ ngay: ngayVn(mo), loai: 'chang_btvn', ten: `${b.ten} · chặng ${k + 1}`, soCau, phut: soNguyenDuong(b.phutMoiChang[k]) || phutUocTinhChang(soCau, v.giayMoiCau ?? LICH_CHANG.GIAY_MAC_DINH), maBtvn: b.maBtvn, chiSo: k })
    }
  }
  for (const g of v.goiGiaDinh ?? []) {
    if (!(g.ngay < homNayChuoi) || soNguyenDuong(g.soCau) <= 0) continue
    const soCau = soNguyenDuong(g.soCau)
    ra.push({ ngay: g.ngay, loai: 'goi_gia_dinh', ten: g.ten ?? 'Bài gia đình giao', soCau, phut: soNguyenDuong(g.phut) || phutUocTinhChang(soCau, v.giayMoiCau ?? LICH_CHANG.GIAY_MAC_DINH) })
  }
  for (const o of v.onQuaLich ?? []) {
    if (!(o.ngay < homNayChuoi) || soNguyenDuong(o.soCau) <= 0) continue
    const soCau = soNguyenDuong(o.soCau)
    ra.push({ ngay: o.ngay, loai: 'on_lai', ten: 'Ôn lại', soCau, phut: phutUocTinhChang(soCau, v.giayMoiCau ?? LICH_CHANG.GIAY_MAC_DINH) })
  }
  return ra.map((m, i) => ({ m, i })).sort((a, b) => (a.m.ngay < b.m.ngay ? -1 : a.m.ngay > b.m.ngay ? 1 : THU_TU_LOAI[a.m.loai] - THU_TU_LOAI[b.m.loai] || (a.m.chiSo ?? 0) - (b.m.chiSo ?? 0) || a.i - b.i)).map((o) => o.m)
}

// ══════════════════════════════ KẾ HOẠCH VỀ ĐÍCH ══════════════════════════════
export type TrangThaiViec = 'no' | 'hom_nay' | 'sap_toi'
export interface ViecVeDich {
  loai: LoaiNo
  trangThai: TrangThaiViec
  maBtvn?: string
  ten?: string
  chiSo?: number
  /** Ngày gốc của món nợ (chỉ để hiển thị). */
  ngay?: string
  soCau: number
  phut: number
  /** Chặng SẮP TỚI chỉ được làm từ giờ mở này (ISO); nợ / hôm nay đã mở nên không cần. */
  moLuc?: string
  /** Phần LÕI của chặng (câu bắt buộc, không cắt): dùng để trả lời "rút phần làm thêm có kịp không". */
  soCauLoi?: number
  phutLoi?: number
}
export interface KhungGioHoc { tu: string; den: string }
export interface TranBuoi { chang: number; cau: number; phut: number }
export interface KhoangGio { tu: string; den: string }
export interface ViecTrongBuoi { loai: LoaiNo; trangThai: TrangThaiViec; maBtvn?: string; ten?: string; chiSo?: number; ngay?: string; soCau: number; phut: number }
export interface BuoiVeDich {
  ngay: string
  chang: ViecTrongBuoi[]
  soCau: number
  phut: number
  /** Bắt đầu MUỘN NHẤT (ISO, giờ VN) để xong trong khung, không quá 22:30, không quá hạn nộp, không vào ca kiểm tra. */
  batDauMuonNhat: string
  batDauMuonNhatGio: string
  /** Chỉ `true` khi buổi có ĐÚNG MỘT chặng lớn hơn trần buổi (không thể chia nhỏ hơn). */
  vuotTran: boolean
}
export interface KeHoachVeDich {
  /** Số giờ (đồng hồ) còn lại tới hạn nộp, không âm. */
  gioConLai: number
  /** Tổng phút của mọi việc còn lại. */
  phutCanLam: number
  /** Tổng phút học được từ bây giờ tới hạn (các khung hợp lệ). */
  phutHocDuoc: number
  cacBuoi: BuoiVeDich[]
  /** Hạn nộp đã qua (Điều 4 B: em vẫn phải làm nốt, ghi nộp trễ) — kế hoạch KHÔNG xếp việc nào sau hạn nên `kip = false` và mọi việc nằm ở `chuaXep`. */
  quaHan: boolean
  /** Mọi việc đều được xếp trước hạn. */
  kip: boolean
  /** Việc KHÔNG xếp được (khi `kip = false`) — không bao giờ im lặng bỏ. */
  chuaXep: ViecTrongBuoi[]
  /** Không kịp ⇒ cần rút PHẦN LÀM THÊM (máy chủ dùng luật hạn ngắn 1.4; lõi giữ nguyên). Kịp ⇒ `false`. */
  canRutPhanLamThem: boolean
  /** Khi không kịp và có báo phần lõi: chỉ giữ lõi thì có kịp không (`undefined` nếu không có số lõi). */
  kipNeuChiLoi?: boolean
  /** Số chặng tối đa mỗi buổi đã dùng (1 khi không nợ và vẫn kịp; nếu không kịp mới nâng lên trần buổi). */
  changMoiBuoiDung: number
}

const THU_TU_TRANG_THAI: Record<TrangThaiViec, number> = { no: 0, hom_nay: 1, sap_toi: 2 }

interface CuaSo { ngay: string; batDau: number; ketThuc: number }

/** Trừ các khoảng ca kiểm tra khỏi một cửa sổ; trả về đoạn TRỐNG DÀI NHẤT (hoặc null). */
function doanTrongDaiNhat(batDau: number, ketThuc: number, ca: readonly { tu: number; den: number }[]): { batDau: number; ketThuc: number } | null {
  let doan: { batDau: number; ketThuc: number }[] = [{ batDau, ketThuc }]
  for (const c of ca) {
    const moi: typeof doan = []
    for (const d of doan) {
      if (c.den <= d.batDau || c.tu >= d.ketThuc) moi.push(d)
      else {
        if (c.tu > d.batDau) moi.push({ batDau: d.batDau, ketThuc: c.tu })
        if (c.den < d.ketThuc) moi.push({ batDau: c.den, ketThuc: d.ketThuc })
      }
    }
    doan = moi
  }
  let tot: { batDau: number; ketThuc: number } | null = null
  for (const d of doan) if (d.ketThuc - d.batDau > 0 && (!tot || d.ketThuc - d.batDau > tot.ketThuc - tot.batDau)) tot = d
  return tot
}

/** Các CỬA SỔ học được, theo thứ tự thời gian, từ `now` tới hạn: mỗi ngày một khung (khung học của em, không quá 22:30); sáng ngày hạn nếu hạn rơi trưa; trừ ca kiểm tra; không vượt hạn. */
function cuaSoHoc(now: number, han: number, khung: KhungGioHoc, ca: readonly { tu: number; den: number }[]): CuaSo[] {
  const ra: CuaSo[] = []
  const tu = phutHHMM(khung.tu)
  const den = Math.min(phutHHMM(khung.den), phutHHMM(GIO_MUON_NHAT))
  const sang = phutHHMM(GIO_SANG_NGAY_HAN)
  for (let d = dauNgayVn(now); d <= dauNgayVn(han); d += MS_NGAY) {
    const ngay = ngayVn(d)
    const thu: { batDau: number; ketThuc: number }[] = []
    if (den > tu) thu.push({ batDau: d + tu * MS_PHUT, ketThuc: d + den * MS_PHUT })
    // sáng NGÀY HẠN khi hạn rơi trước khung tối (hạn trưa): từ 06:30 tới hạn
    if (d === dauNgayVn(han) && han < d + tu * MS_PHUT && han - (d + sang * MS_PHUT) >= PHUT_SANG_TOI_THIEU * MS_PHUT) thu.unshift({ batDau: d + sang * MS_PHUT, ketThuc: han })
    for (const w of thu) {
      const b = Math.max(w.batDau, now)
      const k = Math.min(w.ketThuc, han)
      if (k - b < MS_PHUT) continue
      const doan = doanTrongDaiNhat(b, k, ca)
      if (doan && doan.ketThuc - doan.batDau >= MS_PHUT) ra.push({ ngay, batDau: doan.batDau, ketThuc: doan.ketThuc })
    }
  }
  return ra
}

function xepViec(viec: readonly ViecVeDich[], cuaSo: readonly CuaSo[], tran: TranBuoi, chanMoiBuoi: number, dungLoi: boolean): { cacBuoi: BuoiVeDich[]; chuaXep: ViecTrongBuoi[] } {
  const ds = viec.map((v, i) => ({ v, i })).sort((a, b) => THU_TU_TRANG_THAI[a.v.trangThai] - THU_TU_TRANG_THAI[b.v.trangThai] || (a.v.chiSo ?? 0) - (b.v.chiSo ?? 0) || a.i - b.i).map((o) => {
    const v = o.v
    const soCau = dungLoi && v.soCauLoi !== undefined ? Math.min(soNguyenDuong(v.soCau), soNguyenDuong(v.soCauLoi)) : soNguyenDuong(v.soCau)
    const phut = dungLoi && v.phutLoi !== undefined ? Math.min(soNguyenDuong(v.phut), soNguyenDuong(v.phutLoi)) : soNguyenDuong(v.phut)
    return { ...v, soCau, phut }
  })
  const buoi: BuoiVeDich[] = []
  let k = 0
  for (const w of cuaSo) {
    if (k >= ds.length) break
    const chon: typeof ds = []
    let cau = 0
    let phut = 0
    const conGio = (w.ketThuc - w.batDau) / MS_PHUT
    while (k < ds.length) {
      const it = ds[k]!
      // chặng SẮP TỚI chỉ vào buổi khi đã mở lúc buổi bắt đầu (nợ / hôm nay đã mở sẵn)
      const mo = it.trangThai === 'sap_toi' && it.moLuc ? docMs(it.moLuc) : Number.NEGATIVE_INFINITY
      if (Number.isFinite(mo) && mo > w.batDau) break
      const dauTien = chon.length === 0
      const duTran = chon.length < chanMoiBuoi && cau + it.soCau <= tran.cau && phut + it.phut <= tran.phut
      if (conGio < phut + it.phut || !(dauTien || duTran)) break
      chon.push(it)
      cau += it.soCau
      phut += it.phut
      k++
    }
    if (chon.length === 0) continue
    const muon = w.ketThuc - phut * MS_PHUT
    buoi.push({
      ngay: w.ngay,
      chang: chon.map((c) => ({ loai: c.loai, trangThai: c.trangThai, maBtvn: c.maBtvn, ten: c.ten, chiSo: c.chiSo, ngay: c.ngay, soCau: c.soCau, phut: c.phut })),
      soCau: cau,
      phut,
      batDauMuonNhat: isoVn(muon),
      batDauMuonNhatGio: gioHHMM(muon),
      vuotTran: chon.length === 1 && (cau > tran.cau || phut > tran.phut),
    })
  }
  const chuaXep: ViecTrongBuoi[] = ds.slice(k).map((c) => ({ loai: c.loai, trangThai: c.trangThai, maBtvn: c.maBtvn, ten: c.ten, chiSo: c.chiSo, ngay: c.ngay, soCau: c.soCau, phut: c.phut }))
  return { cacBuoi: buoi, chuaXep }
}

/**
 * KẾ HOẠCH VỀ ĐÍCH của MỘT bài: rải mọi việc còn lại (nợ → chặng hôm nay → chặng sau, theo chỉ số chặng) vào các buổi học được trước hạn nộp. Mỗi buổi tối đa `tranBuoi` (mặc định 2 chặng / 30 câu / 60 phút);
 * KHÔNG nợ thì mỗi buổi 1 chặng như cũ (chỉ nâng lên trần buổi khi 1 chặng/buổi không kịp). Một chặng lớn hơn trần buổi vẫn được xếp MỘT MÌNH một buổi (`vuotTran`). Không kịp ⇒ `kip = false` + `chuaXep`.
 */
export function keHoachVeDich(v: {
  now: number
  hanNop: string
  viecConLai: readonly ViecVeDich[]
  khungGioHoc?: KhungGioHoc
  tranBuoi?: TranBuoi
  caKiemTraSapToi?: readonly KhoangGio[]
}): KeHoachVeDich {
  const han = docMs(v.hanNop)
  const tran = { ...TRAN_BUOI_MAC_DINH, ...(v.tranBuoi ?? {}) }
  const khung = v.khungGioHoc ?? KHUNG_GIO_HOC_MAC_DINH
  const ca = (v.caKiemTraSapToi ?? []).map((c) => ({ tu: docMs(c.tu), den: docMs(c.den) })).filter((c) => Number.isFinite(c.tu) && Number.isFinite(c.den) && c.den > c.tu)
  const phutCanLam = v.viecConLai.reduce((s, x) => s + soNguyenDuong(x.phut), 0)
  const rong = (): KeHoachVeDich => ({ quaHan: Number.isFinite(han) && Number.isFinite(v.now) && han <= v.now, gioConLai: 0, phutCanLam, phutHocDuoc: 0, cacBuoi: [], kip: v.viecConLai.length === 0, chuaXep: v.viecConLai.map((x) => ({ loai: x.loai, trangThai: x.trangThai, maBtvn: x.maBtvn, ten: x.ten, chiSo: x.chiSo, ngay: x.ngay, soCau: soNguyenDuong(x.soCau), phut: soNguyenDuong(x.phut) })), canRutPhanLamThem: v.viecConLai.length > 0, changMoiBuoiDung: 1 })
  if (!Number.isFinite(han) || !Number.isFinite(v.now) || han <= v.now) return rong()
  const cuaSo = cuaSoHoc(v.now, han, khung, ca)
  const phutHocDuoc = Math.floor(cuaSo.reduce((s, w) => s + (w.ketThuc - w.batDau) / MS_PHUT, 0))
  const coNo = v.viecConLai.some((x) => x.trangThai === 'no')
  const chanTruoc = coNo ? tran.chang : 1
  let dung = chanTruoc
  let kq = xepViec(v.viecConLai, cuaSo, tran, chanTruoc, false)
  if (kq.chuaXep.length > 0 && chanTruoc < tran.chang) {
    const nang = xepViec(v.viecConLai, cuaSo, tran, tran.chang, false)
    if (nang.chuaXep.length < kq.chuaXep.length) { kq = nang; dung = tran.chang }
  }
  const kip = kq.chuaXep.length === 0
  const ra: KeHoachVeDich = { quaHan: false, gioConLai: Math.max(0, (han - v.now) / 3_600_000), phutCanLam, phutHocDuoc, cacBuoi: kq.cacBuoi, kip, chuaXep: kq.chuaXep, canRutPhanLamThem: !kip, changMoiBuoiDung: dung }
  if (!kip && v.viecConLai.some((x) => x.soCauLoi !== undefined || x.phutLoi !== undefined)) ra.kipNeuChiLoi = xepViec(v.viecConLai, cuaSo, tran, tran.chang, true).chuaXep.length === 0
  return ra
}

// ══════════════════════════════ ÔN QUÁ LỊCH ══════════════════════════════
export interface KetQuaRaiOn {
  /** Số câu ôn mỗi ngày (ngày 0 = hôm nay), tối đa `SO_NGAY_RAI_ON_TOI_DA` ngày, chia đều (hơn kém nhau ≤ 1), mỗi ngày ≤ trần của ngày ấy. */
  cacNgay: number[]
  /** Trần ôn của từng ngày trong `cacNgay` (40 % ngân sách; 60 % khi ngày đó không nợ chặng). */
  tran: number[]
  /** Phần chưa rải hết sau 3 ngày (tiếp tục ở các ngày sau). */
  conLai: number
}

/**
 * ÔN QUÁ LỊCH: rải `soCau` câu trong TỐI ĐA 3 ngày. Trần ôn mỗi ngày = 40 % ngân sách câu/ngày, nâng lên 60 % khi ngày đó em KHÔNG nợ chặng. `coNoChang` là một số đúng/sai cho hôm nay
 * (các ngày sau coi là không nợ) HOẶC mảng theo ngày. Số ngày dùng = ít nhất cần để vừa trần (tối thiểu 1, tối đa 3), chia đều; quá 3 ngày × trần thì ngày cuối đầy trần và `conLai` > 0.
 */
export function raiOnQuaLich(soCau: number, nganSach: number, coNoChang: boolean | readonly boolean[]): KetQuaRaiOn {
  const n = soNguyenDuong(soCau)
  const ns = soNguyenDuong(nganSach)
  const coNo = (i: number): boolean => (Array.isArray(coNoChang) ? coNoChang[i] === true : i === 0 ? coNoChang === true : false)
  const tranNgay = Array.from({ length: SO_NGAY_RAI_ON_TOI_DA }, (_, i) => Math.floor(ns * (coNo(i) ? TRAN_ON_KHI_CO_NO : TRAN_ON_KHI_KHONG_NO)))
  if (n === 0) return { cacNgay: [], tran: [], conLai: 0 }
  // số ngày ít nhất để vừa trần
  let soNgay = 0
  let sucChua = 0
  while (soNgay < SO_NGAY_RAI_ON_TOI_DA && sucChua < n) sucChua += tranNgay[soNgay++]!
  if (soNgay === 0) soNgay = 1
  const tran = tranNgay.slice(0, soNgay)
  const daRai = Math.min(n, tran.reduce((s, x) => s + x, 0))
  // chia đều ≤ trần: phần nhỏ hơn dồn về ngày đầu (gấp hơn), phần dư thêm 1 câu cho các ngày đầu
  const co = Math.floor(daRai / soNgay)
  const du = daRai - co * soNgay
  const cacNgay = tran.map((t, i) => Math.min(t, co + (i < du ? 1 : 0)))
  let thieu = daRai - cacNgay.reduce((s, x) => s + x, 0)
  for (let i = 0; thieu > 0 && i < soNgay; i++) {
    const them = Math.min(thieu, tran[i]! - cacNgay[i]!)
    cacNgay[i]! += them
    thieu -= them
  }
  return { cacNgay, tran, conLai: n - cacNgay.reduce((s, x) => s + x, 0) }
}

// ══════════════════════════════ NỘP TRỄ: CHIA CHẶNG CHO EM CHƯA TỪNG MỞ BÀI (Điều 4 B) ══════════════════════════════
export interface CauLoiNopTre { qid: string; giay?: number }
export interface KetQuaChiaNopTre {
  /** Các chặng, mỗi chặng là danh sách qid theo ĐÚNG thứ tự câu lõi đầu vào (không xáo, không thêm, không chặng rỗng). */
  chang: string[][]
  /** Giờ mở từng chặng (ISO UTC): chặng của NGÀY VN đầu tiên mở NGAY (`now`); mỗi ngày VN tiếp theo mở 00:00 giờ VN. Không lùi. */
  moLuc: string[]
}
export const TRAN_NOP_TRE_MAC_DINH = { cau: 30, phut: 60, changMoiNgay: 2 } as const

/**
 * Bài cá nhân hoá em CHƯA TỪNG MỞ mà hạn đã qua (nộp trễ): chia phần LÕI thành chặng ≤ `tranBuoi.cau` câu VÀ ≤ `tranBuoi.phut` phút (mỗi câu tính `giay` của nó, thiếu / không hợp lệ (ngoài 5…900) thì `giayMoiCau`,
 * mặc định 90), MỖI NGÀY VN tối đa `changMoiNgay` chặng: các chặng của ngày đầu (`now`) mở NGAY (chặng sau vẫn phải chờ chặng trước xong nhờ luật tuần tự), chặng ngày kế mở 00:00 giờ VN của ngày ấy, v.v.
 * Thứ tự câu giữ NGUYÊN; mọi câu đúng MỘT chặng; không chặng rỗng; một câu luôn vừa một chặng (≤ 15 phút).
 */
export function chiaChangNopTre(v: { now: number; cauLoi: readonly CauLoiNopTre[]; giayMoiCau?: number; tranBuoi?: Partial<{ cau: number; phut: number; changMoiNgay: number }> }): KetQuaChiaNopTre {
  const tran = { ...TRAN_NOP_TRE_MAC_DINH, ...(v.tranBuoi ?? {}) }
  const tranCau = Math.max(1, soNguyenDuong(tran.cau) || TRAN_NOP_TRE_MAC_DINH.cau)
  const tranPhut = Math.max(1, soDuong(tran.phut) || TRAN_NOP_TRE_MAC_DINH.phut)
  const moiNgay = Math.max(1, soNguyenDuong(tran.changMoiNgay) || TRAN_NOP_TRE_MAC_DINH.changMoiNgay)
  const macDinh = typeof v.giayMoiCau === 'number' && Number.isFinite(v.giayMoiCau) && v.giayMoiCau >= 5 && v.giayMoiCau <= 900 ? v.giayMoiCau : LICH_CHANG.GIAY_MAC_DINH
  const giayCua = (c: CauLoiNopTre): number => (typeof c.giay === 'number' && Number.isFinite(c.giay) && c.giay >= 5 && c.giay <= 900 ? c.giay : macDinh)
  const chang: string[][] = []
  let hienTai: string[] = []
  let giayHienTai = 0
  for (const c of v.cauLoi) {
    const g = giayCua(c)
    if (hienTai.length > 0 && (hienTai.length + 1 > tranCau || Math.ceil((giayHienTai + g) / 60) > tranPhut)) {
      chang.push(hienTai)
      hienTai = []
      giayHienTai = 0
    }
    hienTai.push(c.qid)
    giayHienTai += g
  }
  if (hienTai.length > 0) chang.push(hienTai)
  const moLuc = chang.map((_, i) => {
    const ngayThu = Math.floor(i / moiNgay)
    return new Date(ngayThu === 0 ? v.now : dauNgayVn(v.now) + ngayThu * MS_NGAY).toISOString()
  })
  return { chang, moLuc }
}
