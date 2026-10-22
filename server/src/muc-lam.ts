// MỨC LÀM BÀI — Mức làm 1–4 của MỘT lượt làm câu (thầy 20–21/10: "từng câu học sinh làm phải hiển thị chi tiết 4 mức"). Đặc tả docs/dac-ta-muc-lam-bai-2010.md mục 3.
// LÕI THUẦN, một nguồn duy nhất cho mọi màn (Hồ sơ làm bài của thầy · học sinh · phụ huynh; sau này điểm danh, "Ai đã sai", bản chiếu). Không đọc D1.
//
//   T_đọc  = `thoiGianDoc` (8 + 0,35 × số từ + 10 nếu có hình) × hệ số đọc của em. Hệ số đọc = 1,0 (đặc tả mục 3: "em chưa có τ ⇒ 1,0"; τ của OMNI CHƯA nối vào đây — xem `heSoDoc`).
//   Mức 1  giây < T_đọc                                   "Chưa đọc hết đề"
//   Mức 2  T_đọc ≤ giây < T_đọc + sàn nghĩ                "Đọc xong, chưa kịp nghĩ"
//   Mức 3  giây ≥ T_đọc + sàn nghĩ, và (chưa có thời gian thường thật, hoặc giây < 0,8 × thường)   "Có nghĩ"
//   Mức 4  giây ≥ 0,8 × thời gian thường của em, CHỈ khi β thật (lớp đủ mẫu, `docBetaCau`)       "Làm kỹ"
// Chỉ xếp cho lượt có giây ĐO THẬT bằng ĐỒNG HỒ MỚI (`raw_json.doc.dh = 1`) và có kích thước đề (`doc.t`): giây cũ (tab ẩn vẫn chạy), giây ước, giây thi cũ KHÔNG xếp mức —
// "Chưa có số đo", không đoán. Mức chỉ để GIẢI THÍCH lượt SAI: lượt ĐÚNG ở Mức 1 chỉ mang ghi chú riêng cho thầy `dung_truoc_doc`, không thành "vội".
import { thoiGianDoc } from '../../src/lib/thoi-gian-len-bang'
import type { DoTreo } from './do-giay-luot'

export type MaMucLam = 1 | 2 | 3 | 4
export type PhanMucLam = 'I' | 'II' | 'III'

/** Sàn nghĩ (giây) theo phần — TẠM (đặc tả mục 3); sau Đợt 2 chỉnh theo phân bố giây thật. */
export const SAN_NGHI_GIAY: Readonly<Record<PhanMucLam, number>> = { I: 6, II: 12, III: 15 }
/** Mức làm 4 khi giây ≥ tỉ lệ này × thời gian thường của em. */
export const TI_LE_LAM_KY = 0.8
/** Câu CHỈ LÀ ẢNH: `noiDungTuCauGoc` tính 40 từ mặc định + có hình ⇒ T_đọc chỉ là "≈"; Mức làm 1 chỉ khi giây < 0,5 × T_đọc (TẠM, đặc tả mục 3). */
export const SO_TU_CAU_ANH = 40
export const TI_LE_MUC_1_CAU_ANH = 0.5

// TREO MÁY (thầy 22/10: thêm "treo máy", "cố tình treo máy"; đặc tả docs/dac-ta-muc-lam-6-muc-2210.md mục 4). Ngưỡng TẠM — chỉnh sau ~1 tuần dữ liệu thật.
// Hai mức mới ĐÈ lên Mức làm 1–4 khi xảy ra (lượt treo thì giây không còn nói em đã nghĩ bao lâu); `ma` 1–4 vẫn tính như cũ để so được dữ liệu cũ.
/** Khoảng lặng (không chạm, màn sáng) từ chừng này giây ⇒ Treo máy. Dài hơn tính nháp Phần III hợp lý: thấp hơn là gọi oan em tính trên giấy. */
export const TREO_LANG_GIAY = 300
/** Rời app (tab ẩn) khi màn ĐƯỢC giữ sáng (`w = 1`) từ chừng này giây ⇒ Treo máy. */
export const TREO_ROI_GIAY_GIU_SANG = 180
/** Tab ẩn khi KHÔNG giữ được màn sáng (màn có thể tự tắt lúc em tính nháp) — ngưỡng rộng hơn. */
export const TREO_ROI_GIAY = 600
/** Một lượt có từng ấy khoảng lặng 120–179 giây (chạm ngay trước ngưỡng cắt 180 giây của đồng hồ) ⇒ Cố tình treo máy. */
export const CO_TINH_SO_LANG = 3
/** Cùng một ngày của em có từng ấy lượt Treo máy ⇒ các lượt treo ấy thành Cố tình treo máy (`nangCoTinhTheoNgay`). */
export const CO_TINH_SO_TREO_NGAY = 3
/** 'treo' = Mức làm 5 · Treo máy; 'co_tinh' = Mức làm 6 · Cố tình treo máy (CHỈ màn thầy). */
export type MucTreo = 'treo' | 'co_tinh'

/** Treo máy của MỘT lượt từ số đo đồng hồ mới; null = không treo. Thuần. */
export function treoCuaLuot(t: DoTreo): MucTreo | null {
  if (t.n >= CO_TINH_SO_LANG) return 'co_tinh'
  if (t.l >= TREO_LANG_GIAY || t.a >= TREO_ROI_GIAY || (t.w === 1 && t.a >= TREO_ROI_GIAY_GIU_SANG)) return 'treo'
  return null
}

export interface MucLamLuot {
  ma: MaMucLam
  /** Giây làm của lượt (đồng hồ mới). */
  giay: number
  /** T_đọc của em cho câu này (giây, làm tròn). */
  giayDoc: number
  /** Sàn nghĩ của phần (giây). */
  sanNghi: number
  /** Thời gian thường của em (giây), CHỈ khi β thật. Vắng ⇒ không có Mức làm 4 (lớp chưa đủ mẫu). */
  thuong?: number
  /** T_đọc chỉ là ước lượng (câu chỉ là ảnh). */
  xapXi?: true
  /** Chỉ cho thầy: lượt ĐÚNG nộp trước T_đọc (có thể đã biết bài, có thể đoán trúng) — ghi chú, KHÔNG tính là vội. */
  ghiChu?: 'dung_truoc_doc'
  /** RANH GIỚI vào Mức làm 2 / 3 / 4 (giây nguyên; giây làm ≥ ranh thì thuộc mức ấy; Mức làm 1 bắt đầu từ 0). Màn hình vẽ thước và ghi khoảng giây từ ĐÂY — không màn nào biết các tỉ lệ
   *  (0,5 của câu ảnh, 0,8 của thời gian thường). `ranh4` vắng ⇒ lớp chưa đủ mẫu, không có Mức làm 4. `ranh4` có thể ≤ `ranh3` (thường nhỏ): Mức làm 3 khi ấy rỗng. */
  ranh2: number
  ranh3: number
  ranh4?: number
  /** ĐO LẠI LƯỢT CŨ (thầy 21/10: "phải tìm cách đo lại hết"): vắng ⇒ giây đo bằng đồng hồ MỚI (chắc). 'cu' = giây của đồng hồ CŨ (máy em cũ đo bằng đồng hồ tường, ca thi cũ) — chỉ có thể DƯ
   *  (kể cả lúc tab ẩn), không bao giờ thiếu; 'uoc' = giây ƯỚC TÍNH từ mốc trả lời trước trong phiên game (gồm cả lúc xem kết quả / nghỉ) — cũng chỉ có thể DƯ. Mức xếp từ hai loại này
   *  hiện kèm dấu "≈" và KHÔNG BAO GIỜ là Mức làm 4 (Mức 4 cần giây đo thật + thời gian thường của lớp). Mức làm 1 từ giây dư vẫn chắc (giây thật chỉ nhỏ hơn). */
  uocTinh?: 'cu' | 'uoc'
  /** Mức làm 5 ('treo') / 6 ('co_tinh') — ĐÈ lên `ma` khi hiện. Vắng = không treo (hoặc chưa đo: xem `chuaDoTreo`). */
  treo?: MucTreo
  /** Giây em không ở với câu = max(khoảng lặng dài nhất, giây rời app) — để màn hiện "treo X phút". Chỉ có khi `treo`. */
  giayTreo?: number
  /** Lượt này không có số đo treo máy (máy em chưa có đồng hồ 22/10, hoặc lượt cũ) ⇒ "Chưa đo treo máy", không đoán. */
  chuaDoTreo?: true
}

export interface DauVaoMucLam {
  /** Giây làm, đồng hồ mới (≥ 1). */
  giay: number
  /** Kích thước đề đã ghi lúc làm (`raw_json.doc`). */
  soTu: number
  coHinh: boolean
  phan: PhanMucLam
  /** true = đúng · false = sai · null = bỏ trống / lướt. */
  dung: boolean | null
  /** Thời gian thường của em (giây) = e^(β − τ)/1000 khi β thật; null/vắng = chưa có. */
  thuongGiay?: number | null
  /** Hệ số đọc của em (e^(−τ) kẹp 0,75–1,5); vắng ⇒ 1,0. */
  heSoDoc?: number
  /** Giây không phải số đo đồng hồ mới (xem `MucLamLuot.uocTinh`). */
  uocTinh?: 'cu' | 'uoc'
  /** Số đo treo máy (`raw_json.doc` v/a/l/n/w); vắng/null ⇒ `chuaDoTreo`. Giây cũ / ước tính không bao giờ có. */
  treo?: DoTreo | null
}

const kep = (x: number, thap: number, cao: number): number => Math.min(cao, Math.max(thap, x))

/** Mức làm của MỘT lượt; không đủ dữ liệu ⇒ null ("Chưa có số đo"). Thuần. */
export function mucLamCuaLuot(d: DauVaoMucLam): MucLamLuot | null {
  if (!Number.isFinite(d.giay) || d.giay < 1) return null
  if (!Number.isFinite(d.soTu) || d.soTu < 0) return null
  const san = SAN_NGHI_GIAY[d.phan]
  if (san === undefined) return null
  const he = typeof d.heSoDoc === 'number' && Number.isFinite(d.heSoDoc) ? kep(d.heSoDoc, 0.75, 1.5) : 1
  const doc = Math.round(thoiGianDoc(d.soTu, d.coHinh) * he)
  const xapXi = d.soTu === SO_TU_CAU_ANH && d.coHinh
  // Giây cũ / ước tính chỉ có thể dư ⇒ không đủ chắc để xếp "làm kỹ": bỏ thời gian thường (không có Mức làm 4).
  const thuong = !d.uocTinh && typeof d.thuongGiay === 'number' && Number.isFinite(d.thuongGiay) && d.thuongGiay > 0 ? Math.round(d.thuongGiay) : null
  const giay = Math.round(d.giay)
  // Câu ảnh: ranh giới Mức 1 | Mức 2 hạ về 0,5 × T_đọc (T_đọc chỉ là ước lượng). Giây nguyên ⇒ "giây < x" ⇔ "giây < ceil(x)", "giây ≥ x" ⇔ "giây ≥ ceil(x)".
  const ranh2 = Math.ceil(xapXi ? doc * TI_LE_MUC_1_CAU_ANH : doc)
  const ranh3 = doc + san
  const ranh4 = thuong !== null ? Math.ceil(TI_LE_LAM_KY * thuong) : undefined
  let ma: MaMucLam
  if (giay < ranh2) ma = 1
  else if (giay < ranh3) ma = 2
  else if (ranh4 !== undefined && giay >= ranh4) ma = 4
  else ma = 3
  const so = !d.uocTinh && d.treo ? d.treo : null
  const treo = so ? treoCuaLuot(so) : null
  return {
    ma,
    giay,
    giayDoc: doc,
    sanNghi: san,
    ranh2,
    ranh3,
    ...(ranh4 !== undefined ? { ranh4 } : {}),
    ...(thuong !== null ? { thuong } : {}),
    ...(xapXi ? { xapXi: true as const } : {}),
    ...(ma === 1 && d.dung === true ? { ghiChu: 'dung_truoc_doc' as const } : {}),
    ...(d.uocTinh ? { uocTinh: d.uocTinh } : {}),
    ...(treo && so ? { treo, giayTreo: Math.max(so.l, so.a) } : {}),
    ...(so ? {} : { chuaDoTreo: true as const }),
  }
}

/** Bản CÔNG KHAI (máy chiếu cả lớp, app học sinh, phụ huynh): Mức 6 "Cố tình treo máy" hạ về Mức 5 "Treo máy" — Mức 6 CHỈ màn thầy (đặc tả 6 mức, mục 5). */
export function mucCongKhai(m: MucLamLuot): MucLamLuot
export function mucCongKhai(m: MucLamLuot | null | undefined): MucLamLuot | null
export function mucCongKhai(m: MucLamLuot | null | undefined): MucLamLuot | null {
  if (!m) return null
  return m.treo === 'co_tinh' ? { ...m, treo: 'treo' } : m
}
/** Tổng CÔNG KHAI: lượt Mức 6 đếm vào Mức 5. */
export function tongCongKhai(t: TongMucLam): TongMucLam {
  return t.soCoTinh ? { ...t, soTreo: t.soTreo + t.soCoTinh, soCoTinh: 0 } : t
}

/**
 * Mức làm 6 theo NGÀY: các lượt CỦA MỘT EM, cùng ngày có ≥ `CO_TINH_SO_TREO_NGAY` lượt treo ⇒ lượt 'treo' của ngày ấy nâng thành 'co_tinh'. Trả mảng MỚI (không sửa đầu vào).
 * Nơi gọi chỉ dùng cho danh sách lượt của một em (hồ sơ, lịch sử làm câu, điểm danh theo em) — danh sách nhiều em một câu ("Ai đã sai?") chỉ có luật một lượt.
 */
export function nangCoTinhTheoNgay<T extends { mucLam?: MucLamLuot | null; ngay?: string | null }>(luot: readonly T[]): T[] {
  const dem = new Map<string, number>()
  for (const l of luot) if (l.mucLam?.treo && l.ngay) dem.set(l.ngay, (dem.get(l.ngay) ?? 0) + 1)
  return luot.map((l) =>
    l.mucLam?.treo === 'treo' && l.ngay && (dem.get(l.ngay) ?? 0) >= CO_TINH_SO_TREO_NGAY ? { ...l, mucLam: { ...l.mucLam, treo: 'co_tinh' as const } } : l,
  )
}

/** Một mức trong bảng "Cách làm bài": số lượt, đúng, sai (bỏ trống / lướt tính là sai — không trả lời đúng). */
export interface DongMucLam {
  ma: MaMucLam
  luot: number
  dung: number
  sai: number
}

/** Tổng hợp mức của một tập lượt (các lượt KHÔNG có mức ⇒ đếm vào `chuaCoSoDo`). */
export interface TongMucLam {
  /** Số lượt có mức. */
  soDo: number
  /** Số lượt chưa có số đo mức (giây cũ / chưa đo / thiếu kích thước đề). */
  chuaCoSoDo: number
  /** Bốn dòng, Mức 1 → 4. */
  theoMuc: [DongMucLam, DongMucLam, DongMucLam, DongMucLam]
  /** Lượt SAI ở Mức 1–2 ("sai khi làm vội"). */
  saiLamVoi: number
  /** Lượt SAI ở Mức 3–4 ("sai dù đã nghĩ"). */
  saiDuNghi: number
  /** Lượt ĐÚNG ở Mức 1 (chỉ ghi chú cho thầy; bản học sinh/phụ huynh luôn 0 vì mức của lượt ấy bị ẩn). */
  dungTruocDoc: number
  /** Có ít nhất một lượt có β thật (⇒ Mức làm 4 xếp được). false ⇒ ghi chú "lớp chưa đủ mẫu" ở giao diện. */
  coBetaThat: boolean
  /** Trong `soDo`: số lượt xếp từ giây CŨ hoặc ƯỚC TÍNH (hiện dấu "≈"; xem `MucLamLuot.uocTinh`). */
  soUocTinh: number
  /** Trong `soDo`: lượt Mức làm 5 · Treo máy (không kể Mức 6). */
  soTreo: number
  /** Trong `soDo`: lượt Mức làm 6 · Cố tình treo máy — CHỈ màn thầy (bản học sinh/phụ huynh tự bỏ). */
  soCoTinh: number
  /** Trong `soDo`: lượt chưa có số đo treo máy (lượt cũ / máy em chưa có đồng hồ 22/10). */
  soChuaDoTreo: number
}

/**
 * `tachTreo` (giao diện 6 mức, Đợt 2): lượt treo KHÔNG đếm vào bốn dòng Mức 1–4 / vội / dù nghĩ (chỉ vào `soTreo`/`soCoTinh`). Mặc định false = bốn dòng như cũ
 * (giao diện 4 mức đang chạy cộng bốn dòng = `soDo`) — màn nào làm xong 6 mức mới bật.
 */
export function tongMucLam(luot: readonly { mucLam?: MucLamLuot | null; dung: boolean | null }[], tuy: { tachTreo?: boolean } = {}): TongMucLam {
  const theoMuc: TongMucLam['theoMuc'] = [1, 2, 3, 4].map((ma) => ({ ma: ma as MaMucLam, luot: 0, dung: 0, sai: 0 })) as TongMucLam['theoMuc']
  let soDo = 0, chuaCoSoDo = 0, saiLamVoi = 0, saiDuNghi = 0, dungTruocDoc = 0, coBetaThat = false, soUocTinh = 0, soTreo = 0, soCoTinh = 0, soChuaDoTreo = 0
  for (const l of luot) {
    const m = l.mucLam
    if (!m) { chuaCoSoDo++; continue }
    soDo++
    if (m.treo === 'co_tinh') soCoTinh++
    else if (m.treo === 'treo') soTreo++
    if (m.chuaDoTreo) soChuaDoTreo++
    if (m.uocTinh) soUocTinh++
    if (m.thuong !== undefined) coBetaThat = true
    if (m.treo && tuy.tachTreo) continue
    const dong = theoMuc[m.ma - 1]!
    dong.luot++
    if (l.dung === true) dong.dung++
    else dong.sai++
    if (l.dung !== true) { if (m.ma <= 2) saiLamVoi++; else saiDuNghi++ }
    if (m.ghiChu === 'dung_truoc_doc') dungTruocDoc++
  }
  return { soDo, chuaCoSoDo, theoMuc, saiLamVoi, saiDuNghi, dungTruocDoc, coBetaThat, soUocTinh, soTreo, soCoTinh, soChuaDoTreo }
}
