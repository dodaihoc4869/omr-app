// LÀM MỚI APP (thầy 31/10: «Làm một nút reset app trong hồ sơ hs, bấm nút này nếu app bị đơ như iphone lúc nãy reset đăng xuất và nhập lại đăng nhập»).
// Nút ở tấm «Của em» (hồ sơ học sinh). Xoá phần app nhớ tạm trên máy (bản đệm Sảnh / Lộ trình, gói bài cả ngày, phần tải sẵn Sửa lỗi, ảnh chụp màn chờ, bản app
// đã cất của service worker…) + đăng xuất ⇒ tải lại trang ⇒ màn đăng nhập, app tải bản mới từ máy chủ.
// KHÔNG XOÁ BÀI CHƯA GỬI: hàng chờ nộp bài thi, lần nộp Sửa lỗi chờ gửi (mất mạng), bản nháp Kiểm tra ôn tập, bài gia đình / BTVN đang làm, tự luyện đang dở —
// đăng nhập lại là gửi tiếp. Không đụng IndexedDB (bài thi đang làm, dữ liệu app thầy dùng chung trình duyệt) và khoá của app thầy / phụ huynh.
// Cần có mạng (bản app mới tải từ máy chủ); mất mạng ⇒ không làm gì, nơi gọi báo em.
// Mảnh NẠP LƯỜI (chỉ tải khi em bấm) — kho chạy-lúc, không cất sẵn.

/** Khoá localStorage GIỮ lại: bài / câu trả lời chưa lên máy chủ + cài đặt em chọn + khoá app thầy / phụ huynh dùng chung trình duyệt. */
export const GIU_LAI: readonly RegExp[] = [
  // bài chưa gửi / bản nháp
  /^omr_hang_doi_nop/, /^omr_sua_cho_/, /^ktcn:(nhap|lam|vt):/, /^omr_mom_draft_/, /^ddh\.btvn\.draft\./, /^hoc-tap:nhap:/, /^ddh\.tuluyen\.dang\./,
  // cài đặt em chọn (âm thanh, rung, giao diện)
  /^ddh\.(am|rung|trong)$/,
  // app thầy / phụ huynh (cùng trình duyệt)
  /^mc-projector-/, /^ddh\.thuongGv\./, /^ddh\.giaoDienThay/, /^omr_ph_/, /^omr-phien/, /^omr-che-do-chon-em/, /^ddh\.(caChotChienDich|phieu\.mau|moTheDayHoc|vaiDaDung|mocReset)/, /^mocResetDaDon/,
]
export const giuLai = (khoa: string): boolean => GIU_LAI.some((re) => re.test(khoa))

/** Xoá khoá tạm của app học sinh trong `kho` (giữ `GIU_LAI`). Trả số khoá đã xoá. */
export function xoaKhoaTam(kho: Storage): number {
  const xoa: string[] = []
  for (let i = 0; i < kho.length; i++) { const k = kho.key(i); if (k !== null && !giuLai(k)) xoa.push(k) }
  for (const k of xoa) { try { kho.removeItem(k) } catch { /* bỏ qua */ } }
  return xoa.length
}

/** Làm mới app: xoá khoá tạm (đăng xuất theo), sessionStorage, bộ nhớ đệm + service worker, rồi mở lại `/hs`. Mất mạng ⇒ false (không xoá gì). */
export async function lamMoiApp(diaChi = '/hs'): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  try { xoaKhoaTam(localStorage) } catch { /* máy chặn ⇒ vẫn làm tiếp */ }
  try { sessionStorage.clear() } catch { /* bỏ qua */ }
  try { if (typeof caches !== 'undefined') for (const k of await caches.keys()) await caches.delete(k) } catch { /* bỏ qua */ }
  try { const ds = await navigator.serviceWorker?.getRegistrations?.(); for (const r of ds ?? []) await r.unregister() } catch { /* bỏ qua */ }
  location.replace(diaChi)
  return true
}
