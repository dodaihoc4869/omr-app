// "XEM LẠI SAU" — dấu em tự đặt lên câu muốn quay lại trước khi nộp (bản vẽ ThiDangLam; Boss duyệt 21/09).
// CHỈ là trạng thái GIAO DIỆN TẠI MÁY: tập mã câu (qid) em đánh dấu, cất ở khoá RIÊNG theo ca + SBD.
//   · KHÔNG gửi lên máy chủ, KHÔNG vào gói nộp / chấm / lưu tạm / đẩy trạng thái, KHÔNG nằm trong `attempt`;
//   · mất (xoá dữ liệu trình duyệt, đổi máy) cũng không sao — em chỉ mất dấu nhắc, không mất đáp án;
//   · mọi lỗi đọc/ghi bị nuốt: màn thi không bao giờ hỏng vì cái dấu này.
// Khoá bắt đầu `ddh.xemlai.` — nằm trong danh sách dọn khi máy chủ đặt lại mùa (don-moc-reset.ts).
export const TIEN_TO_KHOA_XEM_LAI = 'ddh.xemlai.'
const TOI_DA = 300

export const khoaXemLai = (maCa: string, sbd: string): string => `${TIEN_TO_KHOA_XEM_LAI}${maCa}.${sbd}`

export function docXemLai(maCa: string, sbd: string): Set<string> {
  try {
    const t = localStorage.getItem(khoaXemLai(maCa, sbd))
    if (!t) return new Set()
    const m = JSON.parse(t)
    if (!Array.isArray(m)) return new Set()
    return new Set(m.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 200).slice(0, TOI_DA))
  } catch {
    return new Set()
  }
}

export function luuXemLai(maCa: string, sbd: string, tap: ReadonlySet<string>): void {
  try {
    const k = khoaXemLai(maCa, sbd)
    if (tap.size === 0) localStorage.removeItem(k)
    else localStorage.setItem(k, JSON.stringify([...tap].slice(0, TOI_DA)))
  } catch {
    /* storage đầy/bị chặn: bỏ qua, dấu vẫn còn trong bộ nhớ của lượt này */
  }
}

/** Trả tập MỚI có/không có `qid` (không sửa tập cũ — dùng được thẳng với setState). */
export function doiDauXemLai(tap: ReadonlySet<string>, qid: string): Set<string> {
  const moi = new Set(tap)
  if (moi.has(qid)) moi.delete(qid)
  else moi.add(qid)
  return moi
}
