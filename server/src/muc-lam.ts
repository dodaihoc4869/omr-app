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

export type MaMucLam = 1 | 2 | 3 | 4
export type PhanMucLam = 'I' | 'II' | 'III'

/** Sàn nghĩ (giây) theo phần — TẠM (đặc tả mục 3); sau Đợt 2 chỉnh theo phân bố giây thật. */
export const SAN_NGHI_GIAY: Readonly<Record<PhanMucLam, number>> = { I: 6, II: 12, III: 15 }
/** Mức làm 4 khi giây ≥ tỉ lệ này × thời gian thường của em. */
export const TI_LE_LAM_KY = 0.8
/** Câu CHỈ LÀ ẢNH: `noiDungTuCauGoc` tính 40 từ mặc định + có hình ⇒ T_đọc chỉ là "≈"; Mức làm 1 chỉ khi giây < 0,5 × T_đọc (TẠM, đặc tả mục 3). */
export const SO_TU_CAU_ANH = 40
export const TI_LE_MUC_1_CAU_ANH = 0.5

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
   *  (kể cả lúc tab ẩn), không bao giờ thiếu; 'uoc' = giây ƯỚC TÍNH từ khoảng cách giữa hai lần trả lời liên tiếp (gồm cả lúc đọc lời giải / nghỉ) — cũng chỉ có thể DƯ. Mức xếp từ hai loại này
   *  hiện kèm dấu "≈" và KHÔNG BAO GIỜ là Mức làm 4 (Mức 4 cần giây đo thật + thời gian thường của lớp). Mức làm 1 từ giây dư vẫn chắc (giây thật chỉ nhỏ hơn). */
  uocTinh?: 'cu' | 'uoc'
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
  }
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
}

export function tongMucLam(luot: readonly { mucLam?: MucLamLuot | null; dung: boolean | null }[]): TongMucLam {
  const theoMuc: TongMucLam['theoMuc'] = [1, 2, 3, 4].map((ma) => ({ ma: ma as MaMucLam, luot: 0, dung: 0, sai: 0 })) as TongMucLam['theoMuc']
  let soDo = 0, chuaCoSoDo = 0, saiLamVoi = 0, saiDuNghi = 0, dungTruocDoc = 0, coBetaThat = false, soUocTinh = 0
  for (const l of luot) {
    const m = l.mucLam
    if (!m) { chuaCoSoDo++; continue }
    soDo++
    const dong = theoMuc[m.ma - 1]!
    dong.luot++
    if (l.dung === true) dong.dung++
    else dong.sai++
    if (l.dung !== true) { if (m.ma <= 2) saiLamVoi++; else saiDuNghi++ }
    if (m.ghiChu === 'dung_truoc_doc') dungTruocDoc++
    if (m.thuong !== undefined) coBetaThat = true
    if (m.uocTinh) soUocTinh++
  }
  return { soDo, chuaCoSoDo, theoMuc, saiLamVoi, saiDuNghi, dungTruocDoc, coBetaThat, soUocTinh }
}
