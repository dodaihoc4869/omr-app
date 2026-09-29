// CHẾ ĐỘ MÁY YẾU (thầy 29/09: "máy cấu hình yếu có vào mượt được không").
//
// Tự bật, em KHÔNG phải chọn:
//   · Chrome/Android (CÓ navigator.deviceMemory): RAM ≤ 3 GB hoặc ≤ 4 luồng CPU;
//   · Safari/iOS (KHÔNG có deviceMemory): iOS/iPadOS < 16 (đọc "OS 15_…" trong userAgent) hoặc ≤ 2 luồng —
//     Boss soát 29/09: không dùng "≤ 4 luồng" ở đây vì iPhone đời mới cũng báo ≤ 4 ⇒ mất kính mờ vô lý;
//   · mọi máy: xin giảm chuyển động (prefers-reduced-motion) hoặc bật tiết kiệm dữ liệu (connection.saveData)
// ⇒ gắn lớp `may-yeu` lên <html>. `src/styles/may-yeu.css` đọc lớp này để tắt kính mờ (backdrop-filter),
// giảm bóng đổ lớn, cho hoạt ảnh trang trí chạy một lượt rồi đứng; các công tắc hiệu ứng nặng sẵn có
// (hạt sáng / thị sai / pháo của Sảnh và Đảo, bản giản lược của chương trận đấu) hỏi `giamHieuUng()`.
// Không đổi chức năng, không đổi chữ — chỉ bớt việc vẽ cho máy.
//
// Chỉ bật cho đường vào của học sinh / phụ huynh (main.tsx quyết); jsdom không chạy main.tsx nên test cũ không đổi.

export const LOP_MAY_YEU = 'may-yeu'

export type DauHieuMay = {
  /** navigator.deviceMemory (GB, trình duyệt làm tròn: 0.25/0.5/1/2/4/8). Safari không có. */
  boNhoGb?: number
  /** navigator.hardwareConcurrency (số luồng CPU). */
  soLoi?: number
  /** navigator.connection.saveData. */
  tietKiemDuLieu?: boolean
  /** matchMedia('(prefers-reduced-motion: reduce)'). */
  giamChuyenDong?: boolean
  /** Số phiên bản chính iOS/iPadOS đọc từ userAgent (không phải máy Apple di động ⇒ để trống). */
  phienBanIos?: number
}

const soHopLe = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Đọc phiên bản chính iOS/iPadOS từ userAgent: "iPhone; CPU iPhone OS 15_4 like Mac OS X" / "iPad; CPU OS 16_1 …" ⇒ 15 / 16.
 *  iPadOS giả "Macintosh" thì không đọc được ⇒ undefined. KHÔNG dùng nhìn lùi (Safari cũ sập). */
export function docPhienBanIos(ua: string | undefined | null): number | undefined {
  const m = /(?:iPhone|iPad|iPod)[^)]*? OS (\d+)_/.exec(ua || '')
  if (!m) return undefined
  const v = Number(m[1])
  return Number.isFinite(v) && v > 0 ? v : undefined
}

/** Máy có dấu hiệu yếu? Số không có / không hợp lệ ⇒ bỏ qua vế đó (không đoán). */
export function laMayYeu(d: DauHieuMay): boolean {
  if (d.giamChuyenDong || d.tietKiemDuLieu) return true
  // Trình duyệt CÓ deviceMemory (Chrome/Android): RAM ≤ 3 GB hoặc ≤ 4 luồng.
  if (soHopLe(d.boNhoGb)) return d.boNhoGb <= 3 || (soHopLe(d.soLoi) && d.soLoi <= 4)
  // KHÔNG có deviceMemory (Safari/iOS, Firefox): iOS < 16 hoặc ≤ 2 luồng.
  if (soHopLe(d.phienBanIos) && d.phienBanIos < 16) return true
  return soHopLe(d.soLoi) && d.soLoi <= 2
}

type NavigatorMay = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

function xinGiamChuyenDong(w: Window): boolean {
  try {
    return typeof w.matchMedia === 'function' && !!w.matchMedia('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}

/** Đọc dấu hiệu từ trình duyệt; thiếu API nào thì để trống vế đó. */
export function docDauHieuMay(w: Window = window): DauHieuMay {
  const n = w.navigator as NavigatorMay | undefined
  const d: DauHieuMay = { giamChuyenDong: xinGiamChuyenDong(w) }
  try {
    if (n && typeof n.deviceMemory === 'number') d.boNhoGb = n.deviceMemory
    if (n && typeof n.hardwareConcurrency === 'number') d.soLoi = n.hardwareConcurrency
    if (n && n.connection && typeof n.connection.saveData === 'boolean') d.tietKiemDuLieu = n.connection.saveData
    const ios = docPhienBanIos(n?.userAgent)
    if (ios !== undefined) d.phienBanIos = ios
  } catch {
    /* trình duyệt chặn đọc — coi như không có dấu hiệu */
  }
  return d
}

/** Gắn lớp `may-yeu` lên <html> nếu máy yếu. Trả về true nếu đã bật. Lỗi bất kỳ ⇒ không bật (app chạy như cũ). */
export function batCheDoMayYeu(w: Window = window): boolean {
  try {
    if (!laMayYeu(docDauHieuMay(w))) return false
    w.document.documentElement.classList.add(LOP_MAY_YEU)
    return true
  } catch {
    return false
  }
}

/** Đang ở chế độ máy yếu (lớp đã gắn)? */
export function dangCheDoMayYeu(): boolean {
  try {
    return typeof document !== 'undefined' && document.documentElement.classList.contains(LOP_MAY_YEU)
  } catch {
    return false
  }
}

/** Công tắc chung cho hiệu ứng JS nặng (hạt, thị sai, pháo): máy xin giảm chuyển động HOẶC đang ở chế độ máy yếu.
 *  Không có window/matchMedia (jsdom, máy chủ) ⇒ false như trước. */
export function giamHieuUng(): boolean {
  if (typeof window === 'undefined') return false
  return xinGiamChuyenDong(window) || dangCheDoMayYeu()
}

/** Trần độ phân giải canvas / WebGL: máy yếu vẽ ≤ 1,5 điểm ảnh thật mỗi điểm CSS (màn 3× vẽ ít hơn 4 lần số điểm — mắt khó thấy
 *  khác), máy thường giữ trần cũ của nơi gọi (`tran`, mặc định 2). */
export function dprToiDa(tran = 2): number {
  const goc = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  const dpr = Number.isFinite(goc) && goc > 0 ? goc : 1
  return Math.min(dpr, dangCheDoMayYeu() ? Math.min(1.5, tran) : tran)
}

/** CSS máy yếu cho TRANG NHÚNG (phiếu HTML trong `<iframe srcDoc>`): trang nhúng là tài liệu riêng, không thấy lớp `may-yeu`
 *  của app ⇒ chèn thẳng quy tắc. Cùng tinh thần src/styles/may-yeu.css: bỏ kính mờ, bỏ bộ lọc mờ/xám của thẻ câu làm mờ (mỗi thẻ
 *  mang `filter` là một lớp vẽ riêng — vẫn giữ độ mờ `opacity`), hoạt ảnh chạy một lượt rồi đứng. Không ẩn gì, không đổi chữ. */
export const CSS_MAY_YEU_TRANG_NHUNG =
  '*,*::before,*::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;animation-iteration-count:1!important}' +
  '.q-card.q-card-dimmed{filter:none!important}'

/** Chèn CSS máy yếu vào trang HTML nhúng — CHỈ khi app đang ở chế độ máy yếu; máy thường trả nguyên văn. */
export function themCssMayYeu(html: string): string {
  if (!html || !dangCheDoMayYeu()) return html
  const the = `<style data-may-yeu>${CSS_MAY_YEU_TRANG_NHUNG}</style>`
  const i = html.search(/<\/head>/i)
  return i >= 0 ? html.slice(0, i) + the + html.slice(i) : the + html
}
