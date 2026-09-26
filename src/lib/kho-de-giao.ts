// KHO ĐỀ GIAO THEO TUẦN — LÕI THUẦN (thầy chốt 26/09/2026).
//
// Giao một KHO ĐỀ (tick nguồn đề trong `de_kho`) cho một nhóm em (khối → lớp → tick từng em) kèm HẠN CHÓT.
// Từ lúc giao tới hạn, mọi em được chọn CHỈ làm câu TRONG kho đề ấy (không rút ngoài kho) và chỉ câu chấm
// tự động được (trắc nghiệm / đúng–sai / trả lời ngắn — lọc tự luận bằng `cau-tu-luan.ts`).
//
// HAI ĐÍCH, KHÔNG CÓ "KHÔNG ĐỦ":
//   · CỌ SÁT 100 % — mọi em gặp đủ 100 % câu kho đề (mỗi câu ít nhất một lượt) trước hạn.
//   · THÀNH THẠO ≥ 90 % — mỗi em "thông thạo" (đúng ≥ 2 lần liên tiếp) trên ≥ 90 % câu kho đề.
//   · Hạn chót TỐI THIỂU 7 NGÀY (trần cứng) — `docKhoDeGiao` từ chối cấu hình ngắn hơn.
//   · Lượt ôn CÁ NHÂN HOÁ theo LỖI RIÊNG: sai +1/+3/+7 ngày, đúng +3/+7/+14 ngày.
//   · DỒN khi trễ vào hạn; chỉ khi cần vượt trần tối đa 40 câu/ngày mới báo "em đã quá lười biếng"
//     (GIỮ NGUYÊN chữ này) và kết thúc việc làm đề của em đó.
//
// THUẦN + TẤT ĐỊNH: không IO, không đồng hồ (`now` truyền vào), không `Math.random` (seed qua
// `hashSeed`/`mulberry32`). Máy chủ, máy thầy, máy học sinh cùng import (như `cau-tu-luan.ts`).
import { hashSeed, mulberry32 } from './exam-shuffle'
import { lyDoTuLuan } from './cau-tu-luan'
import type { Khoi } from './khoi-cau'

/** Hằng số của luật "kho đề giao theo tuần". Cấm rải các con số này ra chỗ khác. */
export const KHO_DE_GIAO = {
  /** Hạn chót tối thiểu (trần cứng): từ lúc giao tới hạn phải ≥ bấy nhiêu ngày. */
  DEADLINE_TOI_THIEU_NGAY: 7,
  /** Đích "thành thạo": đúng ≥ NGUONG_THONG_THAO phần câu kho đề. */
  NGUONG_THONG_THAO: 0.9,
  /** Một câu "thông thạo" khi đúng LIÊN TIẾP bấy nhiêu lần. */
  SO_LAN_DUNG_THONG_THAO: 2,
  /** Trần sức hằng ngày THÍCH ỨNG: nền (xa hạn) → gần hạn. */
  NEN_CAU_NGAY: 12,
  TRAN_CAU_NGAY_GAN_HAN: 20,
  /** Trần tối đa CỨNG mỗi ngày — chỉ dùng để xác định "quá lười biếng". */
  TRAN_CAU_NGAY_CUNG: 40,
  /** Không quá ~bấy nhiêu phút học/ngày (mềm; khi DỒN thì bỏ qua để kịp hạn). */
  PHUT_NGAY_TOI_DA: 30,
  /** Lịch lặp: sai → +1/+3/+7 ngày; đúng → +3/+7/+14 ngày. */
  LICH_LAP_SAI: [1, 3, 7],
  LICH_LAP_DUNG: [3, 7, 14],
} as const

export type TrangThaiCauGiao = 'chua_gap' | 'da_gap' | 'thong_thao'
export type TrangThaiEmGiao = 'dang_hoc' | 'hoan_thanh' | 'ket_thuc_luoi'

/** Cấu hình "giao kho đề theo tuần" (thầy dựng ở màn Giao đề theo tuần; lưu trong `cau_hinh`). */
export interface KhoDeGiao {
  /** Khoá cấu hình (mặc định `kho_de_giao`). */
  ma: string
  /** Bật/tắt việc giao. */
  bat: boolean
  /** Khối (10/11/12); `null` = không ràng buộc khối. */
  khoi: Khoi | null
  /** Tên/mã lớp (tầng chọn thứ hai). */
  lop: string
  /** SBD các em được tick (tầng chọn thứ ba). */
  sbd: string[]
  /** Mã các tờ đề (`de_kho.ma_de`) được tick — nguồn câu DUY NHẤT cho nhóm em này. */
  maDe: string[]
  /** Thời điểm giao (ISO). */
  giaoLuc: string
  /** Hạn chót (ISO) — phải sau `giaoLuc` ít nhất `DEADLINE_TOI_THIEU_NGAY` ngày. */
  deadline: string
}

export type DocKhoDeGiao = { ok: true; cfg: KhoDeGiao } | { ok: false; error: string }

const MS_NGAY = 86_400_000
const LECH_VN = 7 * 3_600_000
/** Ngày VN (YYYY-MM-DD) của một mốc ms. */
const ngayVn = (ms: number): string => new Date(ms + LECH_VN).toISOString().slice(0, 10)
const docMs = (s: unknown): number => {
  const t = typeof s === 'string' ? Date.parse(s) : typeof s === 'number' ? s : Number.NaN
  return Number.isFinite(t) ? t : Number.NaN
}
/** Cộng n ngày vào một ngày VN (YYYY-MM-DD). */
const themNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MS_NGAY).toISOString().slice(0, 10)
/** Số ngày từ a tới b (YYYY-MM-DD); b ≥ a ⇒ ≥ 0. */
const soNgayGiua = (a: string, b: string): number => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_NGAY)
const chuoi = (x: unknown): string => (typeof x === 'string' ? x.normalize('NFC').trim() : '')
const dsChuoi = (x: unknown): string[] => (Array.isArray(x) ? [...new Set(x.map(chuoi).filter((s) => s !== ''))] : [])

/**
 * ĐỌC + KIỂM cấu hình giao kho đề. Nhận `gia_tri` (chuỗi JSON trong `cau_hinh`) hoặc thẳng đối tượng.
 * Trả `{ ok:false, error }` kèm câu tiếng Việt nói RÕ thiếu/sai gì — không im lặng nhận cấu hình hỏng.
 * Luật cứng: chọn ≥ 1 em, ≥ 1 nguồn đề, và `deadline − giaoLuc ≥ 7 ngày`.
 */
export function docKhoDeGiao(raw: unknown): DocKhoDeGiao {
  let v: unknown = raw
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return { ok: false, error: 'Cấu hình giao kho đề để trống' }
    try {
      v = JSON.parse(s)
    } catch {
      return { ok: false, error: 'Cấu hình giao kho đề không phải JSON hợp lệ' }
    }
  }
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return { ok: false, error: 'Cấu hình giao kho đề không phải đối tượng' }
  const o = v as Record<string, unknown>
  const ma = chuoi(o.ma) || 'kho_de_giao'
  const bat = o.bat === true
  const lop = chuoi(o.lop)
  const sbd = dsChuoi(o.sbd)
  const maDe = dsChuoi(o.maDe)
  const giaoLuc = chuoi(o.giaoLuc)
  const deadline = chuoi(o.deadline)
  let khoi: Khoi | null = null
  const k = o.khoi
  if (k === 10 || k === 11 || k === 12) khoi = k
  else if (typeof k === 'string' && /^(10|11|12)$/.test(k.trim())) khoi = Number(k.trim()) as Khoi
  else if (k !== null && k !== undefined && k !== '') return { ok: false, error: `Khối không hợp lệ (chỉ nhận 10, 11, 12): ${String(k)}` }

  if (sbd.length === 0) return { ok: false, error: 'Chưa chọn em nào (cần tick ít nhất một học sinh)' }
  if (maDe.length === 0) return { ok: false, error: 'Chưa chọn nguồn đề nào (cần tick ít nhất một kho đề)' }
  const tg = docMs(giaoLuc)
  const tdl = docMs(deadline)
  if (!Number.isFinite(tg)) return { ok: false, error: 'Thời điểm giao không hợp lệ (cần ISO)' }
  if (!Number.isFinite(tdl)) return { ok: false, error: 'Hạn chót không hợp lệ (cần ISO)' }
  if (tdl <= tg) return { ok: false, error: 'Hạn chót phải sau thời điểm giao' }
  const soNgay = (tdl - tg) / MS_NGAY
  if (soNgay < KHO_DE_GIAO.DEADLINE_TOI_THIEU_NGAY) {
    return { ok: false, error: `Hạn chót tối thiểu ${KHO_DE_GIAO.DEADLINE_TOI_THIEU_NGAY} ngày (đang chỉ ${Math.round(soNgay * 10) / 10} ngày)` }
  }
  return { ok: true, cfg: { ma, bat, khoi, lop, sbd, maDe, giaoLuc, deadline } }
}

/** Đang TRONG HẠN? `now < deadline`. Deadline hỏng ⇒ false (coi như hết hạn, không cho làm). */
export function dangTrongHan(v: { now: number; deadline: string }): boolean {
  const t = docMs(v.deadline)
  return Number.isFinite(t) ? v.now < t : false
}

export interface KetQuaLocTheoKhoDe<T> {
  /** Câu hợp lệ, GIỮ NGUYÊN thứ tự. */
  giu: T[]
  /** Câu bị loại kèm lý do (ngoài kho đề / tự luận). */
  bo: { cau: T; lyDo: string }[]
}
/** Mã tờ đề của một câu: đọc chịu `maDe` / `ma_de` / `de` / `maTo` / `ma_to`. */
const maDeCua = (c: unknown): string => {
  if (c === null || typeof c !== 'object') return ''
  const o = c as Record<string, unknown>
  for (const k of ['maDe', 'ma_de', 'de', 'maTo', 'ma_to']) {
    const x = o[k]
    if (typeof x === 'string' && x.trim() !== '') return x.trim()
  }
  return ''
}
/**
 * CHỈ GIỮ câu THUỘC kho đề đã chọn (`maDe`) VÀ chấm tự động được (không tự luận). Đầu vào không phải mảng ⇒ rỗng.
 * Đây là "không rút ngoài kho" + "lọc tự luận" của luật giao theo tuần.
 */
export function locCauTheoKhoDe<T>(v: { cau: readonly T[]; maDe: readonly string[] }): KetQuaLocTheoKhoDe<T> {
  const hop = new Set(v.maDe)
  const ra: KetQuaLocTheoKhoDe<T> = { giu: [], bo: [] }
  if (!Array.isArray(v.cau)) return ra
  for (const c of v.cau) {
    const md = maDeCua(c)
    if (!md) { ra.bo.push({ cau: c, lyDo: 'Câu không rõ mã đề (không đối chiếu được với kho đề đã chọn)' }); continue }
    if (!hop.has(md)) { ra.bo.push({ cau: c, lyDo: `Câu thuộc đề ${md} — ngoài kho đề đã chọn` }); continue }
    const ly = lyDoTuLuan(c)
    if (ly !== null) { ra.bo.push({ cau: c, lyDo: ly }); continue }
    ra.giu.push(c)
  }
  return ra
}

/**
 * NGÀY ÔN KẾ TIẾP của một câu sau khi em vừa trả lời (ngày VN 'YYYY-MM-DD'). Lịch lặp:
 *   · đúng mà đã đủ `SO_LAN_DUNG_THONG_THAO` lần liên tiếp ⇒ `null` (thông thạo, thôi ôn).
 *   · đúng ⇒ +3/+7/+14 (bậc theo số lần đúng liên tiếp).
 *   · sai  ⇒ +1/+3/+7 (bậc theo số lần sai liên tiếp).
 */
export function ngayOnKe(v: { ngayHomNay: string; dung: boolean; dungLienTiep: number; saiLienTiep: number }): string | null {
  const dlt = Math.max(0, Math.floor(v.dungLienTiep))
  const slt = Math.max(0, Math.floor(v.saiLienTiep))
  if (v.dung && dlt + 1 >= KHO_DE_GIAO.SO_LAN_DUNG_THONG_THAO) return null
  if (v.dung) return themNgay(v.ngayHomNay, KHO_DE_GIAO.LICH_LAP_DUNG[Math.min(dlt, KHO_DE_GIAO.LICH_LAP_DUNG.length - 1)]!)
  return themNgay(v.ngayHomNay, KHO_DE_GIAO.LICH_LAP_SAI[Math.min(slt, KHO_DE_GIAO.LICH_LAP_SAI.length - 1)]!)
}

/** Hồ sơ MỘT CÂU của MỘT EM (rút từ `nam_kt_cau`) — đủ để chấm "thông thạo" và xếp lịch lặp. */
export interface HoSoCauGiao {
  /** Số lần em đã gặp câu (0 = chưa gặp). */
  lanGap: number
  /** Số lần ĐÚNG LIÊN TIẾP tính tới nay (≥ 2 ⇒ thông thạo). */
  dungLienTiep: number
  /** Số lần SAI LIÊN TIẾP tính tới nay (câu chưa sai lần nào ⇒ 0). */
  saiLienTiep?: number
  /** Kết quả lần CUỐI (1 đúng · 0 sai · null chưa chấm). */
  ketQuaCuoi: 0 | 1 | null
  /** Ngày VN lần gặp CUỐI (để tính lịch lặp). */
  ngayGapCuoi?: string | null
}
/** Tỉ lệ câu THÔNG THẠO (đúng ≥ 2 lần liên tiếp) / tổng câu kho đề. Rỗng ⇒ 0. */
export function tyLeThongThao(v: { dsQid: readonly string[]; hoSo: ReadonlyMap<string, HoSoCauGiao> }): number {
  const tong = v.dsQid.length
  if (tong === 0) return 0
  let t = 0
  for (const qid of v.dsQid) if ((v.hoSo.get(qid)?.dungLienTiep ?? 0) >= KHO_DE_GIAO.SO_LAN_DUNG_THONG_THAO) t++
  return t / tong
}

/**
 * TRẠNG THÁI EM: ưu tiên `ket_thuc_luoi` (không thể dồn nữa) → `hoan_thanh` (≥ 90 %) → `dang_hoc`.
 */
export function trangThaiEm(v: { tyLe: number; luoi?: boolean }): TrangThaiEmGiao {
  if (v.luoi) return 'ket_thuc_luoi'
  return v.tyLe >= KHO_DE_GIAO.NGUONG_THONG_THAO ? 'hoan_thanh' : 'dang_hoc'
}

/** Một câu của kho đề đưa vào kế hoạch: qid + giây ước tính (thiếu ⇒ `giayMoiCau`). */
export interface CauCoXat { qid: string; giay?: number }

/** Một ngày của kế hoạch. */
export interface NgayCoXat {
  /** Ngày VN 'YYYY-MM-DD'. */
  ngay: string
  /** qid theo ĐÚNG thứ tự làm trong ngày (đan xen mới/ôn). */
  cau: string[]
  /** Số câu MỚI (chưa gặp) trong ngày. */
  moi: number
  /** Số câu ÔN trong ngày. */
  on: number
  /** Tổng giây ước tính của ngày. */
  giay: number
}

/** Kết quả kế hoạch "cọ sát" của MỘT EM. */
export interface KetQuaCoXat {
  trangThai: TrangThaiEmGiao
  /** Tỉ lệ thông thạo HIỆN TẠI. */
  tyLe: number
  tongCau: number
  daThongThao: number
  /** Số ngày học (gồm hôm nay tới hạn). */
  soNgay: number
  ngay: NgayCoXat[]
  /** Cảnh báo (chứa đúng "em đã quá lười biếng" khi bất khả thi). */
  canhBao: string[]
  /** Em không thể dồn kịp hạn (tốc độ cần vượt trần cứng). */
  luoi: boolean
  /** Tổng lượt cần làm (cọ sát + ôn tối thiểu). */
  tongLuot: number
  /** Số lượt xếp được trong hạn. */
  luotXepDuoc: number
}

export interface DauVaoCoXat {
  /** Thời điểm bắt đầu (ms) — ngày VN đầu tiên của kế hoạch. */
  now: number
  /** Hạn chót (ISO). */
  deadline: string
  /** Câu trong kho đề (đã lọc tự luận/ngoài đề). */
  cau: readonly CauCoXat[]
  /** Hồ sơ hiện tại của em (qid → hồ sơ). */
  hoSo: ReadonlyMap<string, HoSoCauGiao>
  /** Seed đan xen (mặc định 'kho-de-giao-ca-nhan'). */
  seed?: string
  /** Giây mặc định khi câu thiếu `giay` (mặc định 90). */
  giayMoiCau?: number
}

/** Xáo TẤT ĐỊNH bằng seed (Fisher–Yates) — để đan xen ra ĐÚNG một thứ tự mỗi lượt. */
function xaoTatDinh<T>(ds: readonly T[], seed: string): T[] {
  const rng = mulberry32(hashSeed(seed))
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
/** Đan xen LUÂN PHIÊN hai nhóm mới/ôn cho thứ tự trong ngày. */
function danXen<T>(moi: readonly T[], on: readonly T[]): T[] {
  const ra: T[] = []
  for (let i = 0; i < Math.max(moi.length, on.length); i++) {
    if (i < moi.length) ra.push(moi[i]!)
    if (i < on.length) ra.push(on[i]!)
  }
  return ra
}

interface Luot { qid: string; loai: 'moi' | 'on'; somNhat: string }
const somNhatLon = (a: string, b: string): string => (a > b ? a : b)
const giayCuaCau = (c: CauCoXat, macDinh: number): number =>
  typeof c.giay === 'number' && Number.isFinite(c.giay) && c.giay >= 5 && c.giay <= 900 ? c.giay : macDinh

/**
 * KẾ HOẠCH "CỌ SÁT" của MỘT EM. Tất định. Mô phỏng tiến tới hạn; mỗi câu cần tối thiểu:
 *   · chưa gặp → 2 lượt (cọ sát + 1 ôn, đủ để có cơ hội 2 lần đúng liên tiếp);
 *   · đúng 1 lần → 1 lượt ôn (đạt lần đúng thứ hai);
 *   · vừa sai → 2 lượt ôn (+1 rồi +3 ngày);
 *   · đã thông thạo → 0 lượt.
 * Trần ngày thích ứng 12 → 20 câu; không đủ ngày thì DỒN (nâng tới trần cứng 40 câu/ngày, bỏ qua hạn 30 phút);
 * cần vượt 40 câu/ngày ⇒ `luoi = true`, cảnh báo đúng chuỗi "em đã quá lười biếng".
 */
export function keHoachCoXat(v: DauVaoCoXat): KetQuaCoXat {
  const ngayHomNay = ngayVn(v.now)
  const dsCau = (Array.isArray(v.cau) ? v.cau : []).filter((c) => c && typeof c.qid === 'string' && c.qid !== '')
  const dsQid = dsCau.map((c) => c.qid)
  const tongCau = dsQid.length
  const hoSo = v.hoSo ?? new Map<string, HoSoCauGiao>()
  const daThongThao = dsQid.filter((q) => (hoSo.get(q)?.dungLienTiep ?? 0) >= KHO_DE_GIAO.SO_LAN_DUNG_THONG_THAO).length
  const tyLe = tongCau ? daThongThao / tongCau : 0
  const canhBao: string[] = []
  const rong: KetQuaCoXat = { trangThai: trangThaiEm({ tyLe }), tyLe, tongCau, daThongThao, soNgay: 0, ngay: [], canhBao, luoi: false, tongLuot: 0, luotXepDuoc: 0 }

  const tdl = docMs(v.deadline)
  if (!Number.isFinite(tdl)) {
    canhBao.push('Hạn chót không hợp lệ — không xếp được lịch')
    return rong
  }
  const soNgay = Math.max(1, soNgayGiua(ngayHomNay, ngayVn(tdl)) + 1)
  if (soNgay < KHO_DE_GIAO.DEADLINE_TOI_THIEU_NGAY) canhBao.push(`Còn ${soNgay} ngày — dưới hạn tối thiểu ${KHO_DE_GIAO.DEADLINE_TOI_THIEU_NGAY} ngày`)
  if (tongCau === 0) {
    canhBao.push('Kho đề không có câu làm được (đã lọc tự luận / ngoài đề)')
    return { ...rong, trangThai: 'hoan_thanh', tyLe: 1, soNgay }
  }
  const macDinh = typeof v.giayMoiCau === 'number' && Number.isFinite(v.giayMoiCau) && v.giayMoiCau >= 5 && v.giayMoiCau <= 900 ? v.giayMoiCau : 90
  const giayTheoQid = new Map<string, number>(dsCau.map((c) => [c.qid, giayCuaCau(c, macDinh)]))
  const seed = v.seed ?? 'kho-de-giao-ca-nhan'

  // 1 — LƯỢT CẦN LÀM (cọ sát 100 % + tối thiểu để có cơ hội thông thạo).
  const luot: Luot[] = []
  for (const c of dsCau) {
    const h = hoSo.get(c.qid)
    const dlt = h?.dungLienTiep ?? 0
    if (dlt >= KHO_DE_GIAO.SO_LAN_DUNG_THONG_THAO) continue
    const lanGap = h?.lanGap ?? 0
    if (lanGap <= 0) {
      luot.push({ qid: c.qid, loai: 'moi', somNhat: ngayHomNay })
      luot.push({ qid: c.qid, loai: 'on', somNhat: themNgay(ngayHomNay, KHO_DE_GIAO.LICH_LAP_DUNG[0]!) })
    } else {
      const buoc = h?.ketQuaCuoi === 1 ? KHO_DE_GIAO.LICH_LAP_DUNG[0]! : KHO_DE_GIAO.LICH_LAP_SAI[0]!
      const d1 = somNhatLon(h?.ngayGapCuoi ? themNgay(h.ngayGapCuoi, buoc) : ngayHomNay, ngayHomNay)
      luot.push({ qid: c.qid, loai: 'on', somNhat: d1 })
      if (h?.ketQuaCuoi !== 1) luot.push({ qid: c.qid, loai: 'on', somNhat: somNhatLon(themNgay(d1, KHO_DE_GIAO.LICH_LAP_SAI[1]!), ngayHomNay) })
    }
  }
  const tongLuot = luot.length

  // 2 — TRẦN MỖI NGÀY: thích ứng 12 → 20; không đủ sức thì DỒN tới trần cứng 40.
  const tranNen = (i: number): number => {
    const r = soNgay <= 1 ? 1 : i / (soNgay - 1)
    return Math.max(1, Math.round(KHO_DE_GIAO.NEN_CAU_NGAY + (KHO_DE_GIAO.TRAN_CAU_NGAY_GAN_HAN - KHO_DE_GIAO.NEN_CAU_NGAY) * r))
  }
  const cap = Array.from({ length: soNgay }, (_, i) => tranNen(i))
  const sucNen = cap.reduce((s, x) => s + x, 0)
  const giayTongLuot = luot.reduce((s, l) => s + (giayTheoQid.get(l.qid) ?? macDinh), 0)
  const sucGiayNen = soNgay * KHO_DE_GIAO.PHUT_NGAY_TOI_DA * 60
  // DỒN khi trần CÂU không đủ HOẶC trần PHÚT (mềm) không đủ — phút là mềm nên khi thiếu thì VƯỢT, KHÔNG bỏ lượt.
  const cram = tongLuot > sucNen || giayTongLuot > sucGiayNen
  let thieu = tongLuot - sucNen
  for (let i = 0; i < soNgay && thieu > 0; i++) {
    const cu = cap[i] ?? 0
    const them = Math.min(thieu, KHO_DE_GIAO.TRAN_CAU_NGAY_CUNG - cu)
    cap[i] = cu + them
    thieu -= them
  }
  const luoi = thieu > 0
  if (luoi) canhBao.push('em đã quá lười biếng')

  // 3 — XẾP NGÀY (greedy theo `somNhat`; cuối kỳ ưu tiên ôn NHƯNG luôn đủ chỉ tiêu câu mới để cọ sát 100 %).
  const conLuot = [...luot]
  const ngay: NgayCoXat[] = []
  for (let i = 0; i < soNgay; i++) {
    const ng = themNgay(ngayHomNay, i)
    const duDieuKien = cram ? conLuot : conLuot.filter((l) => l.somNhat <= ng)
    const uuTienMoi = soNgay <= 1 ? true : i / (soNgay - 1) < 0.5
    const gioiHanCau = cap[i] ?? 0
    const giayCon = { v: cram ? Infinity : KHO_DE_GIAO.PHUT_NGAY_TOI_DA * 60 }
    const moi2 = xaoTatDinh(duDieuKien.filter((l) => l.loai === 'moi'), `${seed}|moi|${i}`)
    const on2 = xaoTatDinh(duDieuKien.filter((l) => l.loai === 'on'), `${seed}|on|${i}`)
    const chon: Luot[] = []
    const lay = (nhom: readonly Luot[], toiDa: number): void => {
      const lim = Math.min(gioiHanCau, toiDa)
      for (const l of nhom) {
        if (chon.length >= lim) break
        if (chon.includes(l)) continue
        const g = giayTheoQid.get(l.qid) ?? macDinh
        if (g > giayCon.v) continue
        chon.push(l)
        giayCon.v -= g
      }
    }
    const moiConLai = conLuot.filter((l) => l.loai === 'moi').length
    const chiTieuMoi = uuTienMoi ? gioiHanCau : Math.ceil(moiConLai / Math.max(1, soNgay - i))
    if (uuTienMoi) {
      lay(moi2, gioiHanCau)
      lay(on2, gioiHanCau)
    } else {
      lay(moi2, chiTieuMoi)
      lay(on2, gioiHanCau)
      lay(moi2, gioiHanCau) // thiếu câu ôn ⇒ lấp nốt bằng câu mới (không bỏ cọ sát)
    }
    for (const l of chon) {
      const k = conLuot.indexOf(l)
      if (k >= 0) conLuot.splice(k, 1)
    }
    const chonMoi = chon.filter((l) => l.loai === 'moi')
    const chonOn = chon.filter((l) => l.loai === 'on')
    const thuTu = danXen(chonMoi, chonOn)
    ngay.push({ ngay: ng, cau: thuTu.map((l) => l.qid), moi: chonMoi.length, on: chonOn.length, giay: chon.reduce((s, l) => s + (giayTheoQid.get(l.qid) ?? macDinh), 0) })
  }
  const luotXepDuoc = tongLuot - conLuot.length
  if (cram && !luoi) canhBao.push(`Phải DỒN để kịp hạn: trần thường (${KHO_DE_GIAO.NEN_CAU_NGAY}–${KHO_DE_GIAO.TRAN_CAU_NGAY_GAN_HAN} câu · ~${KHO_DE_GIAO.PHUT_NGAY_TOI_DA} phút/ngày) không đủ`)

  return { trangThai: trangThaiEm({ tyLe, luoi }), tyLe, tongCau, daThongThao, soNgay, ngay, canhBao, luoi, tongLuot, luotXepDuoc }
}
