// OMNI 3 — ÔN BÀI CŨ: PHẦN THUẦN (không IO, không đồng hồ, chỉ import `omni-kieu`) — máy chủ và app thầy dùng chung (như `omni-kieu`, `omni-chu`).
// Thầy 06/10 sau câu hỏi "chọn Bài 6 thì tổng số câu ôn của Bài 1–5 khi hết hạn khoảng bao nhiêu, có giúp học sinh ôn trọn vẹn không": ba việc.
//  (a) Dòng thẻ xác nhận "Ôn bài cũ: tối đa N câu/em · kho X câu · phủ ≈ Y%" — N đúng hàm kế hoạch ngày đang dùng (`tranOnBaiCuToiDa`), X đếm thật kho (`xemOnBaiCu`).
//  (b) Chia ôn bài cũ ĐỀU theo bài/dạng thay vì "bài gần nhất trước" (`capCongBang`, `xepCongBang`) — công tắc `cau_hinh.on_bai_cu_deu` = {"bat":false} ⇒ y hệt cũ.
//  (c) Thầy chỉnh tỉ lệ ôn bài cũ theo lớp (`cau_hinh.on_bai_cu_ti_le`; vắng ⇒ 20 % thường / 40 % ngày 4–5 của bài như cũ).
// Chữ "cuoi" trong khoá cấu hình = các ngày đan xen `DAN_XEN_NGAY` (ngày thứ 4–5 của bài), KHÔNG phải "hai ngày cuối của hạn" — tên khoá do thầy/Boss đặt, giữ nguyên.
import { THAM_SO_OMNI, type ThamSoOmni } from './omni-kieu'

/** Khoá `cau_hinh`: công tắc chia ôn bài cũ đều (vắng / JSON hỏng ⇒ BẬT; chỉ `{"bat":false}` tắt). */
export const KHOA_ON_BAI_CU_DEU = 'on_bai_cu_deu'
/** Khoá `cau_hinh`: tỉ lệ ôn bài cũ — `{ "mac_dinh": {"thuong":0.2,"cuoi":0.4}, "lop": { "<tên lớp>": {"thuong":x,"cuoi":y} } }`. */
export const KHOA_ON_BAI_CU_TI_LE = 'on_bai_cu_ti_le'
/** Tỉ lệ ôn bài cũ hợp lệ nằm trong [0; 0,6] (thầy 06/10; ngoài khoảng ⇒ bỏ qua, dùng mặc định). */
export const TI_LE_ON_BAI_CU_TOI_DA = 0.6
/** Bước của ô chỉnh trên app thầy (5 %). */
export const BUOC_TI_LE_ON_BAI_CU = 0.05

// ---------------------------------------------------------------- công tắc
/** Công tắc chia đều: vắng dòng / không đọc được JSON ⇒ BẬT (mặc định); chỉ `{"bat":false}` ⇒ TẮT (ôn bài cũ y hệt trước 06/10, từng byte). */
export function docOnBaiCuDeu(giaTri: string | null | undefined): boolean {
  if (giaTri == null) return true
  try {
    const o = JSON.parse(giaTri) as unknown
    return !(!!o && typeof o === 'object' && !Array.isArray(o) && (o as Record<string, unknown>).bat === false)
  } catch {
    return true
  }
}

// ---------------------------------------------------------------- tỉ lệ (c)
/** Tỉ lệ ôn bài cũ của MỘT lớp: `thuong` = ngày thường, `cuoi` = ngày đan xen (ngày thứ 4–5 của bài). */
export interface TiLeOnBaiCu { thuong: number; cuoi: number }
/** Một phần cấu hình: trường vắng / không hợp lệ ⇒ để trống (dùng mặc định ở cấp kế). */
export type TiLeMotPhan = Partial<TiLeOnBaiCu>
export interface CauHinhTiLeOnBaiCu { macDinh: TiLeMotPhan; lop: Readonly<Record<string, TiLeMotPhan>> }

/** Tỉ lệ hợp lệ: SỐ hữu hạn trong [0; 0,6]. Chuỗi / boolean / null / ngoài khoảng ⇒ null (bỏ qua). */
export function tiLeHopLe(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= TI_LE_ON_BAI_CU_TOI_DA ? v : null
}
const laDoiTuong = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
function docMotPhan(x: unknown): TiLeMotPhan {
  if (!laDoiTuong(x)) return {}
  const thuong = tiLeHopLe(x.thuong)
  const cuoi = tiLeHopLe(x.cuoi)
  return { ...(thuong !== null ? { thuong } : {}), ...(cuoi !== null ? { cuoi } : {}) }
}
/**
 * Đọc `cau_hinh.on_bai_cu_ti_le` (chuỗi JSON). Từng trường hợp lệ được giữ, trường sai kiểu / ngoài [0; 0,6] bị bỏ (cấp kế dùng mặc định);
 * dòng vắng / JSON hỏng ⇒ không có cấu hình nào. Tên lớp cắt khoảng trắng hai đầu.
 */
export function docCauHinhTiLe(giaTri: string | null | undefined): CauHinhTiLeOnBaiCu {
  const rong: CauHinhTiLeOnBaiCu = { macDinh: {}, lop: {} }
  if (giaTri == null) return rong
  let o: unknown
  try { o = JSON.parse(giaTri) } catch { return rong }
  if (!laDoiTuong(o)) return rong
  const lop: Record<string, TiLeMotPhan> = {}
  if (laDoiTuong(o.lop)) {
    for (const [ten, x] of Object.entries(o.lop)) {
      const k = ten.trim()
      const p = docMotPhan(x)
      if (k && (p.thuong !== undefined || p.cuoi !== undefined)) lop[k] = p
    }
  }
  return { macDinh: docMotPhan(o.mac_dinh), lop }
}
/**
 * Phần tỉ lệ THẦY ĐÃ ĐẶT cho một lớp: trường của lớp, thiếu thì lấy `mac_dinh`. Không có trường nào (lớp không có dòng, không `mac_dinh`) ⇒ null
 * ⇒ nơi gọi dùng đúng hằng cũ (20 % / 40 %) — y hệt hôm nay.
 */
export function tiLeRiengCuaLop(ch: CauHinhTiLeOnBaiCu, lop: string | null | undefined): TiLeMotPhan | null {
  const rieng = lop ? ch.lop[lop.trim()] : undefined
  const thuong = rieng?.thuong ?? ch.macDinh.thuong
  const cuoi = rieng?.cuoi ?? ch.macDinh.cuoi
  return thuong === undefined && cuoi === undefined ? null : { ...(thuong !== undefined ? { thuong } : {}), ...(cuoi !== undefined ? { cuoi } : {}) }
}
/** Tỉ lệ ĐẦY ĐỦ đang áp (trường thiếu ⇒ hằng mặc định của OMNI). */
export function tiLeHieuLuc(rieng: TiLeMotPhan | null | undefined, ts: ThamSoOmni = THAM_SO_OMNI): TiLeOnBaiCu {
  return { thuong: rieng?.thuong ?? ts.ON_BAI_CU_TI_LE, cuoi: rieng?.cuoi ?? ts.DAN_XEN_TI_LE }
}
/**
 * Tỉ lệ trần ôn bài cũ của ngày thứ `ngayThuCuaBai` của bài (1 = ngày giao): ngày đan xen (`DAN_XEN_NGAY`, 4–5) ⇒ `cuoi`, còn lại ⇒ `thuong`.
 * Không truyền `rieng` ⇒ đúng hằng cũ. MỘT chỗ duy nhất định nghĩa (`omni-ke-hoach.ts tiLeOnBaiCu` gọi lại hàm này).
 */
export function tiLeNgayOnBaiCu(ngayThuCuaBai: number | null, rieng?: TiLeMotPhan | null, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const danXen = ngayThuCuaBai != null && (ts.DAN_XEN_NGAY as readonly number[]).includes(ngayThuCuaBai)
  return danXen ? (rieng?.cuoi ?? ts.DAN_XEN_TI_LE) : (rieng?.thuong ?? ts.ON_BAI_CU_TI_LE)
}

// ---------------------------------------------------------------- (a) số liệu dòng xác nhận
/**
 * N — số câu ôn bài cũ TỐI ĐA mỗi em trong cả `soNgay` ngày của bài = Σ_{k=1..D} ⌊thể lực × tỉ lệ(k)⌋. Đúng phép tính của `lapKeHoachNgay` (srs2-loi.ts:
 * `Math.floor(tran × tiLe)`, tiLe kẹp [0, 1]); chưa tính ngày Huyết Chiến (trần gấp đôi nhưng nợ + câu mới thường chiếm hết lượt) và phần lượt dư thực tế (nợ/mới có thể ăn trước).
 */
export function tranOnBaiCuToiDa(soNgay: number, theLuc: number, rieng?: TiLeMotPhan | null, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const D = Math.max(0, Math.floor(Number(soNgay) || 0))
  const tran = Math.max(0, Number(theLuc) || 0)
  let n = 0
  for (let k = 1; k <= D; k++) n += Math.floor(tran * Math.min(1, Math.max(0, tiLeNgayOnBaiCu(k, rieng, ts))))
  return n
}
/** Y = min(100, làm tròn(N / X × 100)); kho 0 (hoặc hỏng) ⇒ null (không chia cho 0, không hiện dòng). */
export function phuPhanTram(toiDa: number, kho: number): number | null {
  if (!(kho > 0) || !Number.isFinite(toiDa) || !Number.isFinite(kho)) return null
  return Math.min(100, Math.round((Math.max(0, toiDa) / kho) * 100))
}
/** Khối số liệu `onBaiCu` của phản hồi `xem-truoc` (máy chủ tính) và của dòng xác nhận (app thầy tính lại khi thầy đổi tỉ lệ). */
export interface OnBaiCuXem {
  /** N: tối đa mỗi em trong cả hạn nộp. */
  toiDaMoiEm: number
  /** X: câu hợp lệ của các bài đứng trước trong phạm vi (không cắt trần ứng viên). */
  khoCau: number
  /** Y: min(100, làm tròn(N / X × 100)). */
  phuPhanTram: number
  /** Số bài đứng trước có câu trong kho. */
  soBai: number
  /** Tỉ lệ đang áp cho lớp. */
  tiLe: TiLeOnBaiCu
}
/** Dựng khối `onBaiCu`; kho 0 ⇒ null (máy chủ bỏ trường, app không hiện dòng). */
export function xemOnBaiCu(p: { soNgay: number; theLuc: number; khoCau: number; soBai: number; tiLe: TiLeOnBaiCu }, ts: ThamSoOmni = THAM_SO_OMNI): OnBaiCuXem | null {
  const khoCau = Math.max(0, Math.floor(Number(p.khoCau) || 0))
  const toiDaMoiEm = tranOnBaiCuToiDa(p.soNgay, p.theLuc, p.tiLe, ts)
  const y = phuPhanTram(toiDaMoiEm, khoCau)
  if (y === null) return null
  return { toiDaMoiEm, khoCau, phuPhanTram: y, soBai: Math.max(0, Math.floor(Number(p.soBai) || 0)), tiLe: { thuong: p.tiLe.thuong, cuoi: p.tiLe.cuoi } }
}

// ---------------------------------------------------------------- (b) chia đều theo bài / dạng
/**
 * Chọn tối đa `tran` phần tử CÔNG BẰNG giữa các nhóm (bài, gần nhất trước): vòng r lấy phần tử thứ r của mỗi nhóm theo thứ tự nhóm; mỗi nhóm giữ thứ tự gốc;
 * nhóm hết phần tử thì rút khỏi vòng (phần còn lại chia cho nhóm còn). Tổng ≤ `tran`. Tổng số phần tử ≤ `tran` ⇒ trả TOÀN BỘ theo thứ tự nhóm (không cắt) —
 * mọi nhóm có mặt khi `tran` ≥ số nhóm có phần tử. Thuần, tất định.
 */
export function capCongBang<T>(nhom: readonly (readonly T[])[], tran: number): T[] {
  const gioiHan = Math.max(0, Math.floor(tran))
  const ra: T[] = []
  const tong = nhom.reduce((s, g) => s + g.length, 0)
  if (tong <= gioiHan) { for (const g of nhom) ra.push(...g); return ra }
  const dai = nhom.reduce((m, g) => Math.max(m, g.length), 0)
  for (let r = 0; r < dai && ra.length < gioiHan; r++) {
    for (const g of nhom) {
      if (r < g.length) { ra.push(g[r]!); if (ra.length >= gioiHan) break }
    }
  }
  return ra
}
/** Xen kẽ vòng tròn các nhóm theo thứ tự cho trước (vòng r lấy phần tử thứ r của mỗi nhóm). Tổng giữ nguyên. */
function xenKe<T>(nhom: readonly (readonly T[])[]): T[] {
  const ra: T[] = []
  const dai = nhom.reduce((m, g) => Math.max(m, g.length), 0)
  for (let r = 0; r < dai; r++) for (const g of nhom) if (r < g.length) ra.push(g[r]!)
  return ra
}
/** Gom theo khoá, nhóm đầu tiên = khoá xuất hiện đầu tiên (giữ thứ tự gốc trong mỗi nhóm). */
function gomTheoKhoa<T>(ds: readonly T[], khoa: (x: T) => string): T[][] {
  const m = new Map<string, T[]>()
  for (const x of ds) { const k = khoa(x); const a = m.get(k); if (a) a.push(x); else m.set(k, [x]) }
  return [...m.values()]
}
/** Số thứ tự ngày (UTC) của `YYYY-MM-DD` — dùng làm độ lệch xoay vòng; ngày hỏng ⇒ 0. */
function soNgayCua(homNay: string): number {
  const ms = Date.parse(`${homNay}T00:00:00Z`)
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : 0
}
/**
 * THỨ TỰ ÔN BÀI CŨ CÔNG BẰNG (thầy 06/10 "chia đều theo bài/dạng"): giữ NGUYÊN thứ tự các NHÓM (đã gặp tới lịch → chưa gặp → đã gặp chưa tới lịch — `nhom` tăng dần);
 * TRONG mỗi nhóm: các bài xen kẽ vòng tròn, trong mỗi bài các dạng xen kẽ vòng tròn (mỗi dạng giữ thứ tự gốc) ⇒ mọi tiền tố độ dài k của một nhóm phủ min(k, số bài có mặt)
 * bài khác nhau. Bài đứng đầu vòng đầu XOAY theo ngày (`soNgay mod số bài`, tất định theo `homNay` — không ngẫu nhiên giữa hai lần đọc cùng ngày) để khi số bài > số câu
 * mỗi ngày thì ngày khác nhau ôn bài khác nhau, không bài nào bị bỏ đói. `ds` đã xếp theo thứ tự gốc (bài gần nhất trước, trong bài theo thứ tự tờ/câu).
 */
export function xepCongBang<T>(ds: readonly T[], khoa: { nhom: (x: T) => number; bai: (x: T) => string; dang: (x: T) => string }, homNay: string): T[] {
  const theoNhom = new Map<number, T[]>()
  for (const x of ds) { const n = khoa.nhom(x); const a = theoNhom.get(n); if (a) a.push(x); else theoNhom.set(n, [x]) }
  const ngay = soNgayCua(homNay)
  const ra: T[] = []
  for (const n of [...theoNhom.keys()].sort((a, b) => a - b)) {
    const bai = gomTheoKhoa(theoNhom.get(n)!, khoa.bai).map((theoBai) => xenKe(gomTheoKhoa(theoBai, khoa.dang)))
    const lech = bai.length ? ngay % bai.length : 0
    ra.push(...xenKe(lech ? [...bai.slice(lech), ...bai.slice(0, lech)] : bai))
  }
  return ra
}

/**
 * Chia danh sách câu phẳng (theo thứ tự các tờ `maDe`, mỗi tờ `theoTo[m]` câu liên tiếp — đúng cách `cauCuaToChiTiet` ghép) về từng BÀI (`khoaBaiCua(tờ)`), bỏ câu trong `loai`.
 * Trả nhóm theo bài (thứ tự xuất hiện đầu tiên = bài gần nhất trước khi `maDe` đã xếp vị trí giảm dần), khoá bài cùng thứ tự, bảng qid → khoá bài và qid → tờ. Thuần.
 */
export function chiaCauTheoBai(maDe: readonly string[], qids: readonly string[], theoTo: Readonly<Record<string, number>>, khoaBaiCua: (maDe: string) => string, loai: ReadonlySet<string>): { nhom: string[][]; khoa: string[]; baiCua: Map<string, string>; toCua: Map<string, string> } {
  const theoBai = new Map<string, string[]>()
  const baiCua = new Map<string, string>()
  const toCua = new Map<string, string>()
  let vt = 0
  for (const m of maDe) {
    const n = Math.max(0, Math.floor(Number(theoTo[m]) || 0))
    const bai = khoaBaiCua(m)
    for (const q of qids.slice(vt, vt + n)) {
      if (loai.has(q)) continue
      let a = theoBai.get(bai)
      if (!a) { a = []; theoBai.set(bai, a) }
      a.push(q)
      baiCua.set(q, bai)
      toCua.set(q, m)
    }
    vt += n
  }
  return { nhom: [...theoBai.values()], khoa: [...theoBai.keys()], baiCua, toCua }
}
