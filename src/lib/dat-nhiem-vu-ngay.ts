// "ĐẠT NHIỆM VỤ NGÀY" — MỘT định nghĩa dùng chung (hàm THUẦN, Code 1, 21/09/2026; Boss: giữ nguyên hành vi, gom ba nơi đang chép công thức).
//
// Vì sao cần: đạt nhiệm vụ ngày là nguồn mảnh khiên DUY NHẤT (`manh|dat|<ngày>`) và là chuỗi ngày đạt; công thức từng được chép ở ba nơi —
//   • `server/src/exp-d1.ts` (chiTietDat, thời gian thực; nơi TRAO mảnh + EXP +20),
//   • `server/src/ke-hoach-ngay-d1.ts` (`chotNgayCu`, chốt 00:01 ⇒ `ket_qua` dat / mot_phan / khong ⇒ chuỗi),
//   • `server/src/hom-nay-thay.ts` (bảng thầy).
// Hàm này Y HỆT công thức hiện tại (KHÔNG đổi hành vi):
//   đạt = số câu KHÁC NHAU làm trong ngày ≥ mức tối thiểu
//       VÀ không việc bắt buộc nào trễ nhịp
//       VÀ (có ≥ 1 câu LÊN BẬC HOẶC hôm nay không có câu tới hạn ôn).
//   "Lên bậc" = câu đã làm ĐÚNG hôm nay mà TRƯỚC hôm nay từng sai hoặc chưa có kết quả.
//
// ĐIỀU 7 (thầy chốt 21/09/2026, CHỈ từ ngày VN `DAT_CAN_DUNG_TU` = 2026-09-22; ngày 21/09 giữ như đã trao): đạt còn cần số câu ĐÚNG (khác nhau, mọi nguồn) hôm nay ≥ ceil(mức tối thiểu / 2)
// — vì đạt nay quyết định sức hấp thụ 200, khiên và lượt thưởng, 4 câu sai hết không còn đủ. Điều kiện MỚI này là điều thiếu `cau_dung_toi_thieu`; `moTaThieuDat` trả lý do bằng số + chữ cho màn.
//
// Hành vi TRƯỚC Điều 7 / ngày 21/09 (ghi lại bằng test `tests/dat-nhiem-vu-ngay-2109.test.ts`):
//   • đúng/sai không được xét ngoài "lên bậc": 4 câu SAI hết vẫn đạt khi không có câu tới hạn (SAI từ 22/09);
//   • chỉ cần 1 câu ôn lên bậc là đạt dù còn hàng chục câu tới hạn chưa ôn;
//   • làm nhiều câu MỚI đều đúng mà hôm nay có câu tới hạn và không câu ôn nào lên bậc ⇒ KHÔNG đạt;
//   • nơi gọi truyền sổ CHƯA lọc cho "đã làm" (đếm mọi nguồn: thi, lên bảng, game…) và sổ ĐÃ lọc ca chưa công bố cho "lên bậc" — hai đường
//     (thời gian thực và chốt ngày dùng SQL thô) có thể lệch nhau ở đúng chỗ ca thi chưa công bố (xem test "LỆCH ĐÃ BIẾT").
//
// Không phụ thuộc DOM/localStorage/đồng hồ: dùng được ở cả máy chủ lẫn máy em. Chuỗi ngày (`YYYY-MM-DD`) và `luc` (ISO) so sánh bằng so sánh chuỗi
// như mã cũ (`e.ngayVn < homNay`, `e.luc >= tu`).

export type ThieuDat = 'cau_toi_thieu' | 'tre_nhip' | 'chua_len_bac' | 'cau_dung_toi_thieu'

/** Điều 7: từ ngày VN này, đạt nhiệm vụ ngày cần đủ số câu ĐÚNG (`canDungToiThieu`). Ngày trước đó giữ luật cũ. */
export const DAT_CAN_DUNG_TU = '2026-09-22'

/** Số câu ĐÚNG tối thiểu để đạt: ceil(tối thiểu / 2) từ `DAT_CAN_DUNG_TU`; trước đó (hoặc không biết ngày) ⇒ 0 = không đòi. */
export function canDungToiThieu(toiThieu: number, ngayVn?: string): number {
  return ngayVn !== undefined && ngayVn >= DAT_CAN_DUNG_TU ? Math.ceil(Math.max(0, Number.isFinite(toiThieu) ? toiThieu : 0) / 2) : 0
}

export type KetQuaNgay = 'dat' | 'mot_phan' | 'khong'

/** Phần tối thiểu của một dòng sổ học (cùng tên trường với `SuKienDoc` của máy chủ). */
export interface SuKienDat {
  qid: string
  ngayVn: string
  luc: string
  ketQua: 0 | 1 | null
}

/** Số đo đã gom của một ngày — vào của phép quyết định. */
export interface SoDoNgay {
  /** Số câu KHÁC NHAU đã làm trong ngày. */
  daLam: number
  /** Số câu KHÁC NHAU lên bậc trong ngày. */
  lenBac: number
  /** Mức tối thiểu của ngày (kế hoạch đã lưu). */
  toiThieu: number
  /** Có việc bắt buộc nào trễ nhịp không (kế hoạch đã lưu). */
  treNhip: boolean
  /** Số câu ôn TỚI HẠN hôm nay (kế hoạch đã lưu). */
  soCauToiHan: number
  /** Điều 7 (tuỳ chọn): ngày VN của số đo này. Có `ngayVn` ≥ `DAT_CAN_DUNG_TU` ⇒ đòi thêm `soCauDungHomNay ≥ ceil(toiThieu / 2)`. Không truyền ⇒ luật cũ (không đòi). */
  ngayVn?: string
  /** Điều 7: số câu KHÁC NHAU đúng hôm nay, mọi nguồn (máy chủ đếm; thiếu khi đã có `ngayVn` ≥ mốc ⇒ coi là 0). */
  soCauDungHomNay?: number
}

/** Những gì còn THIẾU để đạt, theo thứ tự cố định: câu tối thiểu → trễ nhịp → chưa lên bậc. Rỗng ⇔ đạt. */
export function thieuDat(d: SoDoNgay): ThieuDat[] {
  const ra: ThieuDat[] = []
  if (d.daLam < d.toiThieu) ra.push('cau_toi_thieu')
  if (d.treNhip) ra.push('tre_nhip')
  if (d.lenBac < 1 && d.soCauToiHan > 0) ra.push('chua_len_bac')
  const can = canDungToiThieu(d.toiThieu, d.ngayVn)
  if (can > 0 && (d.soCauDungHomNay ?? 0) < can) ra.push('cau_dung_toi_thieu')
  return ra
}

/** Lý do chưa đạt để đưa vào `tienBo.thieuDat` của kế hoạch ngày (Bảng nhiệm vụ của em): mã, số câu đúng, và câu chữ tiếng thường có số thật (từ chuẩn: "chặng", "ôn lại"). */
export interface MoTaThieuDat {
  thieu: ThieuDat[]
  /** `da` = số câu đúng hôm nay · `can` = số câu đúng cần có (0 = ngày này chưa đòi) · `conThieu` = cần đúng THÊM bao nhiêu câu. */
  soCauDung: { da: number; can: number; conThieu: number }
  /** Mỗi điều thiếu một dòng, cùng thứ tự `thieu`. Rỗng khi đã đạt. */
  chu: string[]
}

export function moTaThieuDat(d: SoDoNgay): MoTaThieuDat {
  const thieu = thieuDat(d)
  const da = Math.max(0, Math.floor(d.soCauDungHomNay ?? 0))
  const can = canDungToiThieu(d.toiThieu, d.ngayVn)
  const conThieu = Math.max(0, can - da)
  const chu = thieu.map((t) => {
    if (t === 'cau_toi_thieu') return `Em làm thêm ${Math.max(0, d.toiThieu - d.daLam)} câu nữa để đủ mức tối thiểu hôm nay (${d.daLam}/${d.toiThieu} câu).`
    if (t === 'tre_nhip') return 'Em còn chặng bài tập về nhà cần làm trước.'
    if (t === 'chua_len_bac') return 'Em ôn lại đúng ít nhất 1 câu đến lịch ôn lại để đạt nhiệm vụ ngày.'
    return `Em cần làm đúng thêm ${conThieu} câu nữa (hôm nay em đúng ${da}/${can} câu cần đúng).`
  })
  return { thieu, soCauDung: { da, can, conThieu }, chu }
}

export function laDatNgay(d: SoDoNgay): boolean {
  return thieuDat(d).length === 0
}

/**
 * Kết quả CHỐT NGÀY từ số đo đã gom (cùng công thức với `chotNgayCu`): đạt ⇒ `dat`; chưa đạt mà có làm ≥ 1 câu ⇒ `mot_phan`; không làm câu nào ⇒ `khong`.
 * (Ngày nghỉ không qua đây: máy chủ không chốt ngày nghỉ.)
 */
export function ketQuaChotNgay(d: SoDoNgay): KetQuaNgay {
  return laDatNgay(d) ? 'dat' : d.daLam >= 1 ? 'mot_phan' : 'khong'
}

export interface DauVaoDatNgay {
  /** Đã có kế hoạch ngày đã lưu chưa (em từng mở nhiệm vụ hôm nay). Chưa có ⇒ chưa xét (`null`). */
  coKeHoach: boolean
  /** Mức tối thiểu của ngày; `undefined` ⇒ chưa xét (`null`). */
  toiThieu: number | undefined
  laNghi: boolean
  /** Ngày cần xét (giờ Việt Nam, `YYYY-MM-DD`). */
  homNay: string
  /** Mốc phát hành (ISO) và NGÀY của mốc: chỉ ở NGÀY PHÁT HÀNH việc TRƯỚC mốc không tính (không tính lại quá khứ). */
  tu: string
  tuNgay: string
  /** Sổ CHƯA lọc — dùng cho "đã làm" (đếm cả bài thi chưa công bố: nó không nói gì về đúng/sai). */
  soTho: readonly SuKienDat[]
  /** Sổ ĐÃ lọc ca thi chưa công bố — dùng cho "lên bậc" và cho lịch sử trước hôm nay (không lộ câu thi làm đúng). */
  so: readonly SuKienDat[]
  treNhip: boolean
  soCauToiHan: number
}

export interface ChiTietDatNgay {
  dat: boolean
  thieu: ThieuDat[]
  daLam: number
  toiThieu: number
  /** `luc` lớn nhất trong các dòng đã tính của ngày ('' nếu không có). */
  luc: string
  laNghi: boolean
}

/** Số câu KHÁC NHAU đúng hôm nay trong sổ ĐÃ lọc (không lộ ca chưa công bố) và sau mốc phát hành — số đếm Điều 7 ở thời gian thực. */
export function soCauDungHomNayTuSo(v: Pick<DauVaoDatNgay, 'homNay' | 'tu' | 'tuNgay' | 'so'>): number {
  return new Set(v.so.filter((e) => e.ngayVn === v.homNay && (v.homNay !== v.tuNgay || e.luc >= v.tu) && e.ketQua === 1).map((e) => e.qid)).size
}

/**
 * Đạt nhiệm vụ ngày ở THỜI GIAN THỰC — Y HỆT khối `chiTietDat` của `exp-d1.ts` (cùng thứ tự `thieu`, cùng `luc`, cùng ngày nghỉ); từ `DAT_CAN_DUNG_TU` thêm điều kiện câu ĐÚNG (Điều 7).
 * Chưa có kế hoạch / chưa có mức tối thiểu ⇒ `null`. Ngày nghỉ ⇒ `{ dat: false, thieu: [], daLam: 0, luc: '', laNghi: true }`.
 */
export function tinhDatNhiemVuNgay(v: DauVaoDatNgay): ChiTietDatNgay | null {
  if (!v.coKeHoach || v.toiThieu === undefined) return null
  const toiThieu = v.toiThieu
  if (v.laNghi) return { dat: false, thieu: [], daLam: 0, toiThieu, luc: '', laNghi: true }
  const sauMoc = (e: SuKienDat): boolean => v.homNay !== v.tuNgay || e.luc >= v.tu
  const dsHomNay = v.soTho.filter((e) => e.ngayVn === v.homNay && sauMoc(e))
  const daLam = new Set(dsHomNay.map((e) => e.qid)).size
  const truocHomNay = new Set<string>()
  for (const e of v.so) if (e.ngayVn < v.homNay && (e.ketQua === 0 || e.ketQua === null)) truocHomNay.add(e.qid)
  const lenBac = new Set(v.so.filter((e) => e.ngayVn === v.homNay && sauMoc(e) && e.ketQua === 1 && truocHomNay.has(e.qid)).map((e) => e.qid)).size
  const soCauDungHomNay = soCauDungHomNayTuSo(v)
  const thieu = thieuDat({ daLam, lenBac, toiThieu, treNhip: v.treNhip, soCauToiHan: v.soCauToiHan, ngayVn: v.homNay, soCauDungHomNay })
  return { dat: thieu.length === 0, thieu, daLam, toiThieu, luc: dsHomNay.reduce((m, e) => (e.luc > m ? e.luc : m), ''), laNghi: false }
}
