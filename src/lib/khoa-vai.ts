// KHOÁ VAI — BA APP, BA ĐƯỜNG, KHÔNG BAO GIỜ LẪN.
//
// Thầy chốt 14/09: "Link của 3 app bạn hãy bọc hay làm gì đó để đảm bảo 100%
// không nhảy lẫn lộn."
//
// ─────────────────────────────────────────────────────────────────────────
// VÌ SAO TRƯỚC ĐÂY CÒN LẪN ĐƯỢC
//
// Mọi đường CÓ vai rõ ràng đều đưa đúng app. Chỗ duy nhất còn ĐOÁN là `/` trần:
// `laManThayQuanLy` hỏi `localStorage['ddh.vaiDaDung']`. Ba app chung một gốc
// (`scope: '/'`) nên chung MỘT localStorage — máy nào mở cả ba thì khoá ấy là
// của app mở sau cùng, và `/` trần đi theo app sai.
//
// Rơi vào `/` trần dễ hơn tưởng:
//   · Link `?vai=gv` bị Zalo hoặc trình rút gọn cắt mất phần sau dấu `?`.
//   · Biểu tượng cài từ bản cũ có `start_url` là `./` trần.
//   · Thầy gõ tay tên miền.
//
// ─────────────────────────────────────────────────────────────────────────
// BA LỚP BỌC, ĐỦ CẢ BA MỚI THÀNH 100%
//
//   1. VAI NẰM TRONG ĐƯỜNG DẪN, KHÔNG NẰM TRONG THAM SỐ.
//      Ba link chuẩn là `/gv`, `/hs`, `/ph`. Đường dẫn không bị cắt như tham
//      số truy vấn, hiện rõ trên thanh địa chỉ, chia sẻ đi vẫn đúng app.
//      `chuanHoaUrlTheoVai()` viết lại địa chỉ về đúng dạng ấy ngay lúc mở,
//      nên tải lại trang hay service worker trả trang đều giữ nguyên vai.
//
//   2. `start_url` CỦA CẢ BA MANIFEST CŨNG LÀ ĐƯỜNG DẪN ẤY.
//      Biểu tượng trên màn hình chính mở thẳng `/hs`, `/ph`, `/gv` — không
//      bao giờ mở `/` trần nữa.
//
//   3. `/` TRẦN KHÔNG ĐOÁN NỮA — HỎI.
//      Còn đoán là còn xác suất sai, mà thầy đòi 100%. Nên `/` trần hiện màn
//      CHỌN APP: ba thẻ, một chạm. `vaiDaDung` chỉ còn dùng để XẾP THỨ TỰ
//      cho app quen tay lên đầu, KHÔNG còn quyền quyết định.
import { docDuongVao, laLinkAppCu } from './vai-tro'

export type VaiApp = 'gv' | 'hs' | 'ph'

/** Đường chuẩn của mỗi app. Đây là link thầy gửi đi, và là `start_url` của
 * manifest tương ứng. Đổi ở đây là phải đổi cả ba manifest trong `public/` —
 * `tests/khoa-vai-3-app-1409.test.ts` bắt nếu lệch. */
export const DUONG_APP: Record<VaiApp, string> = {
  gv: '/gv',
  hs: '/hs',
  ph: '/ph',
}

export const TEN_APP: Record<VaiApp, string> = {
  gv: 'Thầy — quản lý',
  hs: 'Học sinh',
  ph: 'Phụ huynh',
}

/** Vai của đường đang mở, quy về ba mã ngắn. `null` khi đường không nói vai
 * (gồm cả `/` trần, `/t/<mã ca>`, `/p#…`). */
export function vaiCuaDuong(search: string, duongDan: string): VaiApp | null {
  const d = docDuongVao(search, duongDan)
  if (d.vai === 'gv') return 'gv'
  if (d.vai === 'hocsinh') return 'hs'
  if (d.vai === 'phuhuynh') return 'ph'
  return null
}

/**
 * ĐƯỜNG NÀY CÓ PHẢI `/` TRẦN KHÔNG — tức chưa nói vai, cũng không phải link
 * thi, link điểm, link phiếu hay link riêng cũ.
 *
 * Đúng chỗ này, và CHỈ chỗ này, mới hiện màn chọn app.
 */
export function canChonApp(search: string, duongDan: string): boolean {
  if (laLinkAppCu(search, duongDan)) return false
  const d = docDuongVao(search, duongDan)
  return !d.vai && !d.maCa
}

/**
 * VIẾT LẠI ĐỊA CHỈ VỀ ĐƯỜNG CHUẨN CỦA VAI.
 *
 * `/?vai=hocsinh` → `/hs` · `/hoc-sinh` → `/hs` · `/hs` → giữ nguyên.
 *
 * Tham số khác và phần sau dấu `#` GIỮ NGUYÊN — phiếu phụ huynh để dữ liệu
 * trong hash, cắt mất là phụ huynh mở ra thấy trang trống.
 *
 * KHÔNG đụng `/t/<mã ca>`, `/d/<mã ca>`, `/p` và link riêng cũ: mấy đường ấy
 * không phải app, và viết lại là hỏng đúng thứ đang chạy tốt.
 *
 * Trả về đường mới, hoặc `''` khi không có gì phải đổi.
 */
export function chuanHoaUrlTheoVai(
  goc: string,
  duongDan: string,
  search: string,
  hash: string,
): string {
  if (laLinkAppCu(search, duongDan)) return ''
  const vai = vaiCuaDuong(search, duongDan)
  if (!vai) return ''

  const q = new URLSearchParams(search)
  // `vai` chuyển vào đường dẫn nên bỏ khỏi tham số — để lại là hai nguồn sự
  // thật cho cùng một việc, sớm muộn lệch nhau.
  q.delete('vai')
  const duoi = q.toString()

  const nen = goc.endsWith('/') ? goc.slice(0, -1) : goc
  const moi = `${nen}${DUONG_APP[vai]}${duoi ? `?${duoi}` : ''}${hash || ''}`
  const dangCo = `${duongDan}${search || ''}${hash || ''}`
  return moi === dangCo ? '' : moi
}

/** Áp `chuanHoaUrlTheoVai` lên thanh địa chỉ. Chạy MỘT LẦN lúc app khởi động,
 * trước khi React dựng. Không tải lại trang — chỉ đổi địa chỉ. */
export function khoaVaiVaoUrl(goc = '/'): void {
  try {
    const moi = chuanHoaUrlTheoVai(goc, location.pathname, location.search, location.hash)
    if (moi) history.replaceState(null, '', moi)
  } catch {
    // Trình duyệt cũ không có history.replaceState — app vẫn đọc đúng vai từ
    // đường dẫn hoặc tham số, chỉ là thanh địa chỉ không gọn.
  }
}
