// MỨC LÀM TỪ DÒNG SỔ — cầu nối giữa dòng `su_kien_hoc` và lõi thuần `muc-lam.ts`. MỘT đường duy nhất cho mọi màn đọc sổ
// (Lịch sử làm câu, "Ai đã sai?" trên tờ chiếu, hồ sơ em lên bảng): cùng điều kiện xếp mức, cùng thời gian thường, không màn nào tự tính lại.
//   · CHỈ xếp mức cho lượt có giây ĐO THẬT (cột `giay` / `raw_json.ms`) bằng đồng hồ MỚI (`raw_json.doc.dh = 1`) và có kích thước đề (`doc.t`, phần `doc.p`).
//     Giây ước tính (game cũ), giây của ca thi cũ (`chi_tiet_cau`), giây đồng hồ cũ ⇒ KHÔNG có mức ("Chưa có số đo", không đoán).
//   · Thời gian thường của em = e^(β)/1000 CHỈ khi câu có β thật (`omni_beta_cau`, τ = 0 — τ của OMNI chưa nối). Không β ⇒ không có Mức 4.
// Không đọc D1 ở đây: nơi gọi tự đọc β (`docBetaCau`) trong CÙNG đợt `Promise.all` với các lượt đọc khác của mình (không thêm vòng chờ nối tiếp).
import { msKyVong } from './omni-toc-do'
import { mucLamCuaLuot, type MucLamLuot, type PhanMucLam } from './muc-lam'
import type { KichThuocCau } from './cau-doc-giay'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()

/** Mức độ theo hợp đồng: 'biet' | 'hieu' | 'VD' | 'VDC' | ''. Nhận cả cách viết có dấu / viết tắt / `van_dung`. */
export function chuanMucDo(v: unknown): string {
  const k = str(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[_\s]+/g, ' ').trim()
  if (!k) return ''
  if (k === 'biet' || k === 'nhan biet' || k === 'nb') return 'biet'
  if (k === 'hieu' || k === 'thong hieu' || k === 'th') return 'hieu'
  if (k === 'vdc' || k === 'van dung cao') return 'VDC'
  if (k === 'vd' || k === 'van dung') return 'VD'
  return ''
}

/** Kích thước đề + đồng hồ mới của một lượt (`raw_json.doc`). */
export interface DoMucLuot {
  soTu: number
  coHinh: boolean
  phan: PhanMucLam
}

/** `raw_json.doc` → đầu vào Mức làm: CHỈ khi giây đến từ đồng hồ MỚI (`dh = 1`) và có số từ + phần hợp lệ. Còn lại ⇒ null. */
export function docDoMuc(raw: Row | null): DoMucLuot | null {
  const d = raw?.doc
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null
  const o = d as Row
  const t = typeof o.t === 'number' && Number.isFinite(o.t) && o.t >= 0 ? o.t : null
  const phan = o.p === 'I' || o.p === 'II' || o.p === 'III' ? o.p : null
  if (o.dh !== 1 || t === null || phan === null) return null
  return { soTu: t, coHinh: o.h === 1, phan }
}

/** Một lượt đã đọc xong các trường cần cho Mức làm. */
export interface DongMucTho {
  doMuc: DoMucLuot | null
  /** Giây ĐO THẬT (`giayDoCuaLuot`: cột sổ ⇒ `raw_json.ms`); null = chưa đo / chỉ có ước tính. */
  giayDo: number | null
  /** Mã câu GỐC (đã bỏ hậu tố song sinh) — khoá β. */
  goc: string
  /** 'biet' | 'hieu' | 'VD' | 'VDC' | '' (xem `chuanMucDo`). */
  mucDo: string
  /** true = đúng · false = sai · null = bỏ trống / chưa chấm. */
  dung: boolean | null
  /** ĐO LẠI LƯỢT CŨ (21/10): giây của đồng hồ CŨ ('cu': cột `giay` / `raw_json.ms` của lượt không có `doc.dh`) hoặc ƯỚC TÍNH ('uoc': khoảng cách giữa hai lần trả lời) — dùng khi lượt KHÔNG có số đo mới. */
  giayCu?: number | null
  loaiCu?: 'cu' | 'uoc'
}

/** Các mã câu gốc cần β: chỉ lượt ĐỦ điều kiện xếp mức ⇒ tập nhỏ (rỗng khi chưa máy nào nạp bản mới). */
export function gocCanBeta(dong: readonly Pick<DongMucTho, 'doMuc' | 'giayDo' | 'goc'>[]): string[] {
  return [...new Set(dong.filter((d) => d.doMuc && d.giayDo !== null && d.goc).map((d) => d.goc))]
}

/**
 * Mức làm của một lượt; thiếu số đo ⇒ null. `beta` = kết quả `docBetaCau` cho `gocCanBeta`. `kichThuoc` = `docKichThuocCau` (bảng tính sẵn) — CHỈ dùng để ĐO LẠI lượt cũ không có `doc`:
 * lượt có giây cũ / ước tính (`giayCu`, `loaiCu`) và câu có kích thước đề ⇒ Mức làm với cờ `uocTinh`, KHÔNG có Mức làm 4 (giây cũ chỉ có thể dư). Lượt có số đo MỚI đi đường cũ, không đổi.
 */
export function mucLamTuDong(d: DongMucTho, beta: ReadonlyMap<string, number>, kichThuoc?: ReadonlyMap<string, KichThuocCau>): MucLamLuot | null {
  if (!d.doMuc || d.giayDo === null) {
    const kt = d.giayCu !== null && d.giayCu !== undefined && d.loaiCu ? kichThuoc?.get(d.goc) : undefined
    if (!kt || d.giayCu === null || d.giayCu === undefined) return null
    return mucLamCuaLuot({ giay: d.giayCu, soTu: kt.soTu, coHinh: kt.coHinh, phan: kt.phan, dung: d.dung, thuongGiay: null, uocTinh: d.loaiCu })
  }
  const b = beta.get(d.goc)
  return mucLamCuaLuot({
    giay: d.giayDo,
    soTu: d.doMuc.soTu,
    coHinh: d.doMuc.coHinh,
    phan: d.doMuc.phan,
    dung: d.dung,
    thuongGiay: b === undefined ? null : msKyVong(b, 0, d.doMuc.phan, d.mucDo || null) / 1000,
  })
}

/** Khoảng cách tối đa (giây) còn coi là "đang làm câu kế tiếp" — quá ngưỡng là em nghỉ giữa chừng, không ước tính. */
export const TRAN_KHOANG_CACH_GIAY = 900

/**
 * GIÂY ƯỚC TÍNH TỪ KHOẢNG CÁCH GIỮA HAI LẦN TRẢ LỜI LIÊN TIẾP (21/10, "đo lại hết"): với mỗi lượt, giây ≈ `luc` của lượt này − `luc` của lượt LIỀN TRƯỚC trong cùng nhóm (nguồn + mã nguồn: một phiên game, một lượt ôn lại,
 * một đợt tự luyện…), nếu nằm trong 1..900 giây. Khoảng cách 0 (nộp cả lô cùng lúc: BTVN phiếu, ca thi, mở bài…) hay lượt đầu nhóm ⇒ null (không ước tính được, KHÔNG đoán). Con số gồm cả lúc em xem kết quả / lời giải ⇒ chỉ có thể DƯ.
 * Trả mảng cùng thứ tự đầu vào. Thuần.
 */
export function giayTuKhoangCach(dong: readonly { nguon: string; maNguon: string; luc: string }[]): (number | null)[] {
  const ra: (number | null)[] = dong.map(() => null)
  const theoNhom = new Map<string, { i: number; t: number }[]>()
  dong.forEach((d, i) => {
    const t = Date.parse(d.luc)
    if (!Number.isFinite(t) || !d.maNguon) return
    const k = `${d.nguon}|${d.maNguon}`
    const ds = theoNhom.get(k)
    if (ds) ds.push({ i, t })
    else theoNhom.set(k, [{ i, t }])
  })
  for (const ds of theoNhom.values()) {
    ds.sort((a, b) => a.t - b.t || a.i - b.i)
    for (let j = 1; j < ds.length; j++) {
      const g = Math.round((ds[j]!.t - ds[j - 1]!.t) / 1000)
      if (g >= 1 && g <= TRAN_KHOANG_CACH_GIAY) ra[ds[j]!.i] = g
    }
  }
  return ra
}
