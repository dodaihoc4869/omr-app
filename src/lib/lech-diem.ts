// ĐIỂM TRÊN SHEET LỆCH ĐIỂM CHẤM LẠI — PHẢI NÓI RA, KHÔNG ĐƯỢC LẶNG LẼ SỬA.
//
// Thầy báo 08/09: "điểm ở trong ca thi và mục học sinh chưa đồng bộ". Đo trên
// máy chủ thật, 47 lượt đã nộp: 42 lượt khớp, 5 lượt lệch. Cả 5 đều là điểm
// GHI TỪ TRƯỚC, lúc máy chấm chưa nhận đủ hai thứ:
//   · `soCau` của ca (ca 8/2/2 mà chấm theo luật cũ 18/4/6 thì mẫu số sai),
//   · bản đồ đề riêng từng em (chấm nhầm sang bộ câu cắt theo hash).
// Cả hai đã sửa. Nhưng con số CŨ vẫn nằm trên Sheet, mà màn Học sinh, bảng
// điểm, bản xuất Excel và phiếu gửi phụ huynh đều đọc chính ô đó — nên màn Ca
// thi (chấm lại tại chỗ) và màn Học sinh (đọc Sheet) nói hai điểm khác nhau.
//
// Màn Ca thi vốn tự ghi đè điểm mới mỗi lần thầy mở ra. Việc đó ĐÚNG nhưng
// LẶNG LẼ: thầy không biết em nào vừa đổi điểm, mà điểm ấy có thể đã gửi phụ
// huynh rồi. Từ đây, đổi thì phải báo.

/** Một em có điểm Sheet khác điểm chấm lại. */
export interface LechDiemMotEm {
  sbd: string
  hoTen: string
  /** Điểm đang nằm trên Sheet (máy em ghi lúc nộp, hoặc lần ghi trước). */
  cu: number | null
  /** Điểm chấm lại bằng luật hiện tại. */
  moi: number
}

/** Ngưỡng coi là lệch. Điểm lưu 2 chữ số thập phân nên nửa xu là quá đủ để
 * phân biệt "khác thật" với "sai số dấu phẩy động". */
const NGUONG = 0.005

/** So điểm Sheet với điểm chấm lại cho cả ca.
 *
 * `cu = null` (lượt chưa từng chấm) KHÔNG tính là lệch: đó là ghi lần đầu,
 * không phải sửa số cũ. */
export function emLechDiem(
  ds: { sbd: string; hoTen: string; tongSheet: number | null | undefined; tongChamLai: number | null | undefined }[],
): LechDiemMotEm[] {
  const out: LechDiemMotEm[] = []
  for (const e of ds) {
    const moi = e.tongChamLai
    if (typeof moi !== 'number' || !Number.isFinite(moi)) continue
    const cu = e.tongSheet
    if (typeof cu !== 'number' || !Number.isFinite(cu)) continue
    if (Math.abs(cu - moi) <= NGUONG) continue
    out.push({ sbd: e.sbd, hoTen: e.hoTen, cu, moi })
  }
  return out
}

/** Một dòng thầy đọc được: tên em, điểm cũ, điểm mới. */
export function dongLechDiem(e: LechDiemMotEm): string {
  const so = (v: number | null) => (v === null ? '—' : v.toFixed(2).replace('.', ','))
  return `${e.hoTen || e.sbd}: ${so(e.cu)} → ${so(e.moi)}`
}

/** Câu báo cho thầy khi màn Ca thi vừa ghi đè điểm cũ trên Sheet. */
export function loiBaoLechDiem(ds: LechDiemMotEm[]): string {
  if (ds.length === 0) return ''
  const dau = ds.slice(0, 3).map(dongLechDiem).join(' · ')
  const con = ds.length > 3 ? ` · và ${ds.length - 3} em nữa` : ''
  return `Đã đồng bộ điểm ${ds.length} em lên Sheet: ${dau}${con}`
}
