// MỘT định nghĩa "câu đã làm hôm nay" ở MÀN HỌC SINH (Boss 21/09, đề bài `prompt-mot-dinh-nghia-cau-da-lam-2109.md`; thầy thấy thẻ Hôm nay "93 câu" cạnh ô Thi đua "78 câu" của cùng một em).
// Máy chủ tính MỘT con số HIỂN THỊ (`tienBo.soCauHienThi` = số câu KHÁC NHAU em ĐÃ TRẢ LỜI, mọi nguồn, từ MAX(mốc hiển thị, 00:00 hôm nay) — đúng định nghĩa của ô Thi đua). Màn CHỈ hiện số ấy.
// `tienBo.daLamCau` (rộng hơn: cả câu bỏ trống, cả ngày) vẫn nuôi LUẬT đạt nhiệm vụ / EXP / khiên ở máy chủ — màn KHÔNG dùng nó để nói "đã làm" khi máy chủ đã có số hiển thị; luật đạt/chưa đạt không đổi.
// THUẦN: không React, không mạng.

export interface TienBoCoSoHienThi {
  daLamCau?: unknown
  soCauHienThi?: unknown
}

/** Số nguyên không âm từ giá trị máy chủ gửi; không hợp lệ (âm, NaN, chữ, vắng) ⇒ null. Chuỗi số ("78") được nhận như số, đúng cách cũ `Number(daLamCau)`. */
function soKhongAm(v: unknown): number | null {
  if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return null // mảng / đối tượng / boolean / vắng ⇒ không dùng (Number([]) = 0 sẽ là số 0 giả)
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
}

/**
 * Số "câu đã làm hôm nay" để HIỂN THỊ: `soCauHienThi` nếu máy chủ gửi và hợp lệ; máy chủ cũ (chưa có trường) hoặc trường hỏng ⇒ rơi về `daLamCau` như trước (không vỡ); cả hai không dùng được ⇒ 0.
 * Bằng 0 khi máy chủ nói 0 là ĐÚNG (em chưa trả lời câu nào), không rơi về `daLamCau`.
 */
export function soCauDaLamHienThi(tienBo: TienBoCoSoHienThi | null | undefined): number {
  return soKhongAm(tienBo?.soCauHienThi) ?? soKhongAm(tienBo?.daLamCau) ?? 0
}
