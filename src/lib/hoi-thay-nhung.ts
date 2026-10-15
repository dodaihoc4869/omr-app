// ĐƯỜNG /hoi-thay (15/10/2026): phần THUẦN của màn src/screens/HoiThayScreen.tsx — đọc tham số, token trang mẹ đưa qua `#t=`, phiên cất,
// nhận lời phiên hỏng. Tách riêng để kiểm không cần dựng màn (mảnh màn chạy việc ngay lúc tải: xoá hash, hỏi máy chủ).
import type { ThongTinHs } from './phien-hoc-sinh'

/** Khoá phiên cổng học sinh — TRÙNG `KHOA_PHIEN_HS` (nap-truoc-man-em.ts) và `docTokenHs` (loi-giai-api.ts). Viết thẳng ở đây, KHÔNG nhập
 *  phien-hoc-sinh.ts: nhập là Rollup tách nó khỏi khối AppHocSinh thành một tệp riêng, cả ba app mở chậm thêm (kiem:toc-do, 15/10). */
export const KHOA_PHIEN = 'omr_student_portal_auth'

/** Phiên đã cất (như docPhienHs). Máy chặn lưu / hỏng ⇒ null. */
export function docPhien(): ThongTinHs | null {
  try {
    const luu = localStorage.getItem(KHOA_PHIEN)
    return luu ? (JSON.parse(luu) as ThongTinHs | null) : null
  } catch {
    return null
  }
}

/** Trang mẹ duy nhất được nhận tin (có token). */
export const ME_ORIGIN = 'https://ddh-tai-lieu.pages.dev'
export const NGUON_MAC_DINH = 'trang_html'

/** Tin nhắn cho trang mẹ (postMessage chỉ tới ME_ORIGIN). */
export type TinChoMe = { type: 'ddh-hs-token'; token: string } | { type: 'ddh-hoi-thay-dong' } | { type: 'ddh-hs-dang-xuat' }

export interface ThamSoHoiThay { qid: string; dangLam: boolean; nguon: string; dapAnEm: string }

/** Đọc tham số đường. `nguon` chỉ để thầy xem thống kê (máy chủ cắt 40 kí tự); `em` = đáp án em đã chọn (sau nộp) để Thầy so bài em. */
export function docThamSoHoiThay(search: string): ThamSoHoiThay {
  const q = new URLSearchParams(search)
  const nguon = (q.get('nguon') || '').trim().replace(/[^\w-]/g, '').slice(0, 40) || NGUON_MAC_DINH
  return { qid: (q.get('qid') || '').trim(), dangLam: q.get('dl') === '1', nguon, dapAnEm: (q.get('em') || '').trim().slice(0, 12) }
}

/** Token trong `#t=<token>` (có thể kèm khoá khác: `#a=1&t=…`). Không có ⇒ ''. */
export function tokenCuaHash(hash: string): string {
  const m = /(?:^#|[#&])t=([^&]+)/.exec(hash || '')
  if (!m) return ''
  try { return decodeURIComponent(m[1]).trim() } catch { return '' }
}

/** SBD ghi trong token học sinh (`base64(JSON{sbd,exp,pwd}).chữ ký` — server/src/game-v2-auth.ts). Không đọc được ⇒ ''. */
export function sbdCuaToken(token: string): string {
  try {
    const o = JSON.parse(atob(token.split('.')[0] || '')) as { sbd?: unknown; purpose?: unknown }
    return !o.purpose && typeof o.sbd === 'string' ? o.sbd : ''
  } catch { return '' }
}

/** Phiên cất cho token trang mẹ đưa: cùng em với phiên đang có ⇒ giữ tên, lớp, chỉ thay token; khác em / chưa có ⇒ phiên mới chỉ có SBD + token. */
export function phienTuToken(token: string, cu: ThongTinHs | null): ThongTinHs | null {
  const sbd = sbdCuaToken(token)
  if (!sbd) return null
  if (cu && cu.sbd === sbd) return { ...cu, token }
  return { sbd, hoTen: '', lop: '', namSinh: '', token }
}

/** Lời máy chủ nói phiên hỏng (game-v2-auth.ts) hoặc máy em không còn token ⇒ đăng nhập lại. Lời khác (ca kiểm tra, câu bảo vệ…) giữ nguyên. */
export function laLoiPhien(loi: string): boolean {
  return /Phiên game|đăng nhập lại|nhập lại mật khẩu/i.test(loi)
}
