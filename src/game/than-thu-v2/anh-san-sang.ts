// Ảnh của câu (đề cắt từ phiếu, hình sau đề / sau phương án, ảnh phương án, ảnh ý) không có kích thước ghi sẵn trong dữ liệu ⇒ hiện câu TRƯỚC khi ảnh về thì ảnh nạp trễ đẩy cả lưới đáp án xuống dưới ngón tay em
// (P0 thầy 19:24 "đáp án bị nhảy"). Cách chữa: chỉ dựng thẻ câu khi ảnh đã tải xong (thành công hoặc lỗi), tối đa `HAN_CHO_ANH_MS` — quá hạn thì hiện luôn (không để em đứng chờ hình hỏng).
// Câu KHÔNG ảnh ⇒ sẵn sàng ngay từ lần vẽ đầu (không chớp "đang tải").
import { useEffect, useState } from 'react'
import type { Question } from './core'

export const HAN_CHO_ANH_MS = 2500

/** Mọi địa chỉ ảnh ngoài của câu, không trùng, bỏ ảnh nhúng `data:`/`blob:` (đã ở trong máy). THUẦN. */
export function cacAnhCuaCau(q: Question | null | undefined): string[] {
  if (!q) return []
  const ra = [q.thanCauImg, q.imageDataUrl, ...(q.choiceImgs ?? []), ...(q.ideaImgs ?? []), ...(q.hinhAnh ?? []).map((h) => h.src)]
  return [...new Set(ra.filter((s): s is string => typeof s === 'string' && s.trim() !== '' && !/^(data|blob):/i.test(s)))]
}

/** `true` khi mọi ảnh của câu đã tải xong (hoặc lỗi, hoặc quá hạn). Đổi câu ⇒ chờ lại từ đầu. */
export function useAnhSanSang(srcs: readonly string[], hanMs: number = HAN_CHO_ANH_MS): boolean {
  const khoa = srcs.join('\n')
  const [xong, setXong] = useState('')
  useEffect(() => {
    if (khoa === '') return
    let dong = false
    let con = srcs.length
    const ketThuc = () => { if (!dong) { dong = true; clearTimeout(han); setXong(khoa) } }
    const han = setTimeout(ketThuc, hanMs)
    for (const src of srcs) {
      const im = new Image()
      im.onload = im.onerror = () => { con -= 1; if (con <= 0) ketThuc() }
      im.src = src
    }
    return () => { dong = true; clearTimeout(han) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa, hanMs])
  return khoa === '' || xong === khoa
}
