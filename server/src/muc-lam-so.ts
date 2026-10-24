// MỨC LÀM TỪ DÒNG SỔ — cầu nối giữa dòng `su_kien_hoc` và lõi thuần `muc-lam.ts`. MỘT đường duy nhất cho mọi màn đọc sổ
// (Lịch sử làm câu, "Ai đã sai?" trên tờ chiếu, hồ sơ em lên bảng): cùng điều kiện xếp mức, cùng thời gian thường, không màn nào tự tính lại.
//   · CHỈ xếp mức cho lượt có giây ĐO THẬT (cột `giay` / `raw_json.ms`) bằng đồng hồ MỚI (`raw_json.doc.dh = 1`) và có kích thước đề (`doc.t`, phần `doc.p`).
//     Giây ước tính (game cũ), giây của ca thi cũ (`chi_tiet_cau`), giây đồng hồ cũ ⇒ KHÔNG có mức ("Chưa có số đo", không đoán).
//   · Thời gian thường của em = e^(β − τ)/1000 CHỈ khi câu có β thật (`omni_beta_cau`); τ riêng của em (`docTauEm`, 24/10), vắng ⇒ 0. Không β ⇒ không có Mức 4.
// Không đọc D1 ở đây: nơi gọi tự đọc β (`docBetaCau`) trong CÙNG đợt `Promise.all` với các lượt đọc khác của mình (không thêm vòng chờ nối tiếp).
import { msKyVong } from './omni-toc-do'
import { mucLamCuaLuot, type LapLai, type MucLamLuot, type PhanMucLam } from './muc-lam'
import type { KichThuocCau } from './cau-doc-giay'
import type { DoTreo } from './do-giay-luot'

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
  /** Số đo treo máy (22/10); vắng = máy em chưa gửi ⇒ "Chưa đo treo máy". */
  treo?: DoTreo
}

/** `raw_json.doc` → đầu vào Mức làm: CHỈ khi giây đến từ đồng hồ MỚI (`dh = 1`) và có số từ + phần hợp lệ. Còn lại ⇒ null. */
export function docDoMuc(raw: Row | null): DoMucLuot | null {
  const d = raw?.doc
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null
  const o = d as Row
  const t = typeof o.t === 'number' && Number.isFinite(o.t) && o.t >= 0 ? o.t : null
  const phan = o.p === 'I' || o.p === 'II' || o.p === 'III' ? o.p : null
  if (o.dh !== 1 || t === null || phan === null) return null
  const so = (k: string) => (typeof o[k] === 'number' && Number.isFinite(o[k]) && (o[k] as number) >= 0 ? (o[k] as number) : null)
  const v = so('v'), a = so('a'), l = so('l')
  const treo = v !== null && a !== null && l !== null ? { v, a, l, n: so('n') ?? 0, w: o.w === 1 ? (1 as const) : (0 as const) } : null
  return { soTu: t, coHinh: o.h === 1, phan, ...(treo ? { treo } : {}) }
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
  /** ĐO LẠI LƯỢT CŨ (21/10): giây của đồng hồ CŨ ('cu': cột `giay` / `raw_json.ms` của lượt không có `doc.dh`) hoặc ƯỚC TÍNH ('uoc': mốc trả lời trước trong phiên game — `giayUocTinhGame`) — dùng khi lượt KHÔNG có số đo mới. */
  giayCu?: number | null
  loaiCu?: 'cu' | 'uoc'
  /** (24/10) Câu em đã gặp (`lapLaiCacLuot`) ⇒ T_đọc ngắn lại. Vắng ⇒ câu mới. */
  lap?: LapLai | null
  /** (24/10) τ OMNI của em (`docTauEm`) ⇒ thời gian thường RIÊNG cho ranh Mức 4. Vắng ⇒ τ = 0 (số của lớp). */
  tau?: number | null
}

/**
 * LẶP LẠI từng lượt (24/10) — đếm trong CHÍNH danh sách lượt nơi gọi đã đọc (không thêm câu đọc): số lượt TRƯỚC đó của cùng em, cùng mã câu;
 * `songSinh` = lượt là bản khác của câu từng sai (`raw_json.tc`); `ngayCach` = số ngày từ lượt trước gần nhất. Danh sách chỉ là cửa sổ (vd 14 ngày) thì
 * lượt đầu trong cửa sổ được coi là lần đầu (T_đọc dài hơn ⇒ chỉ có thể KHÓ gắn «Bấm vội» hơn, không oan em). Thuần.
 */
export function lapLaiCacLuot(luot: readonly { sbd: string; qid: string; tc?: string | null; luc: string }[]): LapLai[] {
  const thuTu = luot.map((l, i) => ({ i, t: Date.parse(l.luc) })).sort((a, b) => (a.t || 0) - (b.t || 0) || a.i - b.i)
  const truoc = new Map<string, { n: number; t: number }>()
  const ra: LapLai[] = new Array(luot.length)
  for (const { i, t } of thuTu) {
    const l = luot[i]!
    const k = `${l.sbd}|${l.qid}`
    const p = truoc.get(k)
    ra[i] = { lan: p?.n ?? 0, songSinh: !!(l.tc && String(l.tc).trim()), ngayCach: p && Number.isFinite(t) && Number.isFinite(p.t) ? Math.max(0, (t - p.t) / 86_400_000) : null }
    truoc.set(k, { n: (p?.n ?? 0) + 1, t })
  }
  return ra
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
    const kt = !d.doMuc && d.giayCu !== null && d.giayCu !== undefined && d.loaiCu ? kichThuoc?.get(d.goc) : undefined
    if (!kt || d.giayCu === null || d.giayCu === undefined) return null
    return mucLamCuaLuot({ giay: d.giayCu, soTu: kt.soTu, coHinh: kt.coHinh, phan: kt.phan, dung: d.dung, thuongGiay: null, uocTinh: d.loaiCu, lap: d.lap ?? null })
  }
  const b = beta.get(d.goc)
  return mucLamCuaLuot({
    giay: d.giayDo,
    soTu: d.doMuc.soTu,
    coHinh: d.doMuc.coHinh,
    phan: d.doMuc.phan,
    dung: d.dung,
    thuongGiay: b === undefined ? null : msKyVong(b, typeof d.tau === 'number' && Number.isFinite(d.tau) ? d.tau : 0, d.doMuc.phan, d.mucDo || null) / 1000,
    treo: d.doMuc.treo ?? null,
    lap: d.lap ?? null,
  })
}
