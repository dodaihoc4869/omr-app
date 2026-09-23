// ƯỚC LƯỢNG THỜI GIAN — CNH-1.0 §5.1 (P05). HÀM THUẦN: không đọc đồng hồ (nơi gọi truyền `nowMs`),
// không `Math.random`. Công thức tính LẠI ĐƯỢC từ dữ liệu, không phải cảm tính.
//
//   baseSeconds(I,d)=[75,105,150][d] · (II,d)=[150,210,300][d] · (III,d)=[120,180,240][d]
//   readingExtra = min(120, max(0, ceil((visibleChars-300)/120)) * 10)
//   mediaExtra   = min(90, 30 * tableOrFigureCount)
//   base         = baseSeconds + readingExtra + mediaExtra
//   factor       = 1 khi <5 mẫu hợp lệ; ngược lại clamp(median(activeSeconds/base), 0,75, 2)
//   solve        = ceil(base × factor) · feedback = max(30, ceil(solve × 0,25)) · task = solve + feedback
//
// Mẫu hợp lệ: 20 lần GẦN NHẤT trong 30 ngày, CÙNG part + difficulty, ĐỘC LẬP (không hỗ trợ), ĐÃ NỘP,
// không gián đoạn, thời gian 10–900 giây. Mẫu sai định dạng/bỏ tab KHÔNG được dùng làm thời gian giải.
import {
  BUOC_KY_TU_DOC, GIAY_BAI_MAU, GIAY_CO_SO, GIAY_MAU_TOI_DA, GIAY_MAU_TOI_THIEU, GIAY_MOI_BUOC_DOC,
  GIAY_MOI_HINH, GIAY_PHAN_HOI_TOI_THIEU, HE_SO_SAN, HE_SO_TRAN, MAU_TOI_DA, MAU_TOI_THIEU,
  NGAY_MAU_TOI_DA, NGUONG_KY_TU_DOC, TRAN_DOC, TRAN_HINH, TY_LE_PHAN_HOI,
} from './ho-so-cau-hinh'

export type PhanCau = 'I' | 'II' | 'III'
export type MucDo = 0 | 1 | 2

/** Câu cần ước lượng: chỉ những trường THẬT SỰ ảnh hưởng thời gian. */
export interface CauUocLuong {
  qid: string
  part: PhanCau
  difficulty: MucDo
  /** Số ký tự nhìn thấy của đề (0/undefined khi không đo được ⇒ không cộng phần đọc). */
  visibleChars?: number | null
  /** Số bảng/hình phải xem. */
  tableOrFigureCount?: number | null
}

/** Một lần làm đã đo được, dùng làm mẫu tốc độ. */
export interface MauThoiGian {
  part: PhanCau
  difficulty: MucDo
  activeSeconds: number
  /** Chỉ mẫu ĐỘC LẬP (không hỗ trợ) mới tính. */
  docLap?: boolean
  /** Chỉ mẫu ĐÃ NỘP mới tính. */
  daNop?: boolean
  /** Bỏ tab/gián đoạn ⇒ KHÔNG dùng làm thời gian giải. */
  gianDoan?: boolean
  /** Thời điểm mẫu (ms) — để lọc cửa sổ 30 ngày. */
  lucMs?: number
}

export interface KetQuaUocLuong {
  qid: string
  /** Giây gốc theo part × difficulty + phần đọc + bảng/hình (trước hệ số cá nhân). */
  baseSeconds: number
  /** Hệ số theo tốc độ thật (1 khi thiếu mẫu). */
  factor: number
  /** Số mẫu hợp lệ đã dùng (nói thẳng ra để không giả vờ đo được). */
  soMau: number
  nguon: 'mac_dinh' | 'do'
  solveSeconds: number
  feedbackSeconds: number
  taskSeconds: number
  ghiChu: string
}

const kep = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))
const trungVi = (ds: number[]): number => {
  const h = [...ds].sort((a, b) => a - b)
  const n = h.length
  return n % 2 ? h[(n - 1) / 2]! : (h[n / 2 - 1]! + h[n / 2]!) / 2
}

/** Phần cộng thêm vì phải ĐỌC đề (02 §5.1). */
export function giayDocThem(visibleChars: number | null | undefined): number {
  const c = Number(visibleChars ?? 0)
  if (!Number.isFinite(c) || c <= NGUONG_KY_TU_DOC) return 0
  return Math.min(TRAN_DOC, Math.max(0, Math.ceil((c - NGUONG_KY_TU_DOC) / BUOC_KY_TU_DOC)) * GIAY_MOI_BUOC_DOC)
}

/** Phần cộng thêm vì phải xem BẢNG/HÌNH (02 §5.1). */
export function giayHinhThem(soBangHinh: number | null | undefined): number {
  const n = Number(soBangHinh ?? 0)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(TRAN_HINH, GIAY_MOI_HINH * Math.floor(n))
}

/** Giây gốc của một câu: bảng part × difficulty + đọc + bảng/hình (KHÔNG gồm hệ số cá nhân). */
export function giayCoSo(cau: Pick<CauUocLuong, 'part' | 'difficulty' | 'visibleChars' | 'tableOrFigureCount'>): number {
  const bang = GIAY_CO_SO[cau.part] ?? GIAY_CO_SO.I
  const d = kep(Math.round(cau.difficulty), 0, 2)
  return (bang[d] ?? bang[0]!) + giayDocThem(cau.visibleChars) + giayHinhThem(cau.tableOrFigureCount)
}


/** Lọc mẫu hợp lệ của ĐÚNG part × difficulty trong cửa sổ `NGAY_MAU_TOI_DA`, mới nhất trước, tối đa `MAU_TOI_DA`. */
export function mauHopLe(cau: Pick<CauUocLuong, 'part' | 'difficulty'>, mau: readonly MauThoiGian[], nowMs: number): number[] {
  const tu = nowMs - NGAY_MAU_TOI_DA * 86_400_000
  return mau
    .filter((m) => m.part === cau.part && m.difficulty === cau.difficulty)
    .filter((m) => m.docLap !== false && m.daNop !== false && !m.gianDoan)
    .filter((m) => m.lucMs === undefined || (Number.isFinite(m.lucMs) && m.lucMs >= tu && m.lucMs <= nowMs))
    .filter((m) => Number.isFinite(m.activeSeconds) && m.activeSeconds >= GIAY_MAU_TOI_THIEU && m.activeSeconds <= GIAY_MAU_TOI_DA)
    .sort((a, b) => (b.lucMs ?? 0) - (a.lucMs ?? 0))
    .slice(0, MAU_TOI_DA)
    .map((m) => m.activeSeconds)
}

/** Hệ số tốc độ cá nhân: 1 khi dưới `MAU_TOI_THIEU` mẫu hợp lệ; ngược lại kẹp trung vị tỉ lệ. */
export function heSoTocDo(baseSeconds: number, active: readonly number[]): { factor: number; soMau: number; nguon: 'mac_dinh' | 'do'; ghiChu: string } {
  if (active.length < MAU_TOI_THIEU || !(baseSeconds > 0)) {
    return { factor: 1, soMau: active.length, nguon: 'mac_dinh', ghiChu: `chưa đủ mẫu đo (${active.length}/${MAU_TOI_THIEU}) nên dùng hệ số 1` }
  }
  return { factor: kep(trungVi(active.map((s) => s / baseSeconds)), HE_SO_SAN, HE_SO_TRAN), soMau: active.length, nguon: 'do', ghiChu: '' }
}

/** Ước lượng ĐẦY ĐỦ cho một câu: solve + feedback = thời gian chiếm ngân sách. */
export function uocLuongMotCau(cau: CauUocLuong, tuy: { mau?: readonly MauThoiGian[]; nowMs: number }): KetQuaUocLuong {
  const baseSeconds = giayCoSo(cau)
  const hs = heSoTocDo(baseSeconds, mauHopLe(cau, tuy.mau ?? [], tuy.nowMs))
  const solveSeconds = Math.ceil(baseSeconds * hs.factor)
  const feedbackSeconds = Math.max(GIAY_PHAN_HOI_TOI_THIEU, Math.ceil(solveSeconds * TY_LE_PHAN_HOI))
  return {
    qid: cau.qid, baseSeconds, factor: hs.factor, soMau: hs.soMau, nguon: hs.nguon,
    solveSeconds, feedbackSeconds, taskSeconds: solveSeconds + feedbackSeconds, ghiChu: hs.ghiChu,
  }
}

/** Chữa lỗi CÓ BÀI MẪU: cộng thêm thời gian bài mẫu; biến thể kiểm tự làm thì cộng RIÊNG taskSeconds của nó. */
export function uocLuongChuaLoi(
  cau: CauUocLuong,
  tuy: { mau?: readonly MauThoiGian[]; nowMs: number; coBaiMau?: boolean; bienThe?: CauUocLuong | null },
): KetQuaUocLuong & { giayBaiMau: number; giayBienThe: number } {
  const goc = uocLuongMotCau(cau, tuy)
  const giayBaiMau = tuy.coBaiMau ? GIAY_BAI_MAU : 0
  const giayBienThe = tuy.bienThe ? uocLuongMotCau(tuy.bienThe, tuy).taskSeconds : 0
  return { ...goc, taskSeconds: goc.taskSeconds + giayBaiMau + giayBienThe, giayBaiMau, giayBienThe }
}

/** Mã lý do khi một nhiệm vụ không vừa ngân sách (02 §5.2/§7.2). */
export type LyDoKhongVua = 'BUDGET_EXHAUSTED'

/**
 * XẾP VỪA NGÂN SÁCH (02 §5.2): tổng `taskSeconds` của nhiệm vụ tự động đã chốt ≤ `budgetSeconds`.
 * Chọn GREEDY theo đúng thứ tự ưu tiên nơi gọi đưa vào; KHÔNG có sàn 4/8 câu; hết chỗ thì trả
 * `BUDGET_EXHAUSTED` — KHÔNG cắt thời gian phản hồi để nhét thêm câu.
 */
export function xepVuaNganSach(
  ds: readonly { qid: string; taskSeconds: number }[],
  budgetSeconds: number,
): { chon: { qid: string; taskSeconds: number }[]; tongGiay: number; conLai: number; boQua: { qid: string; lyDo: LyDoKhongVua }[] } {
  const chon: { qid: string; taskSeconds: number }[] = []
  const boQua: { qid: string; lyDo: LyDoKhongVua }[] = []
  let conLai = Math.max(0, Number(budgetSeconds) || 0)
  for (const x of ds) {
    const can = Math.max(0, Number(x.taskSeconds) || 0)
    if (can <= conLai) { chon.push({ qid: x.qid, taskSeconds: can }); conLai -= can }
    else boQua.push({ qid: x.qid, lyDo: 'BUDGET_EXHAUSTED' })
  }
  return { chon, tongGiay: chon.reduce((s, x) => s + x.taskSeconds, 0), conLai, boQua }
}
