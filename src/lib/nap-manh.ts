// NẠP MẢNH MÃ RỜI, TỰ CỨU KHI MÁY CÒN GIỮ BẢN CŨ.
//
// LỖI ĐÃ DÍNH 04-09: thầy bấm "Xem đề" và nhận
//   Failed to fetch dynamically imported module: .../tai-phieu-pdf-ChU46igK.js
//
// VÌ SAO. App chia nhỏ, phần dựng phiếu nằm ở một tệp rời chỉ tải khi bấm nút.
// Tên tệp có mã băm theo NỘI DUNG, nên mỗi bản build ra một tên khác. Khi đẩy
// bản mới lên GitHub Pages, tệp của bản cũ BỊ XOÁ khỏi máy chủ.
//
// Máy đang mở sẵn app thì trang đó vẫn đang chạy mã CỦA BẢN CŨ trong bộ nhớ —
// service worker chiếm quyền ngay (skipWaiting) cũng không đổi được mã đã chạy.
// Tới lúc bấm nút, trang cũ đi xin đúng cái tên tệp cũ, mà tên đó không còn ở
// đâu cả: không còn trên máy chủ, cũng đã bị dọn khỏi bộ nhớ đệm. Ra đúng lỗi
// trên. Nó KHÔNG phải lỗi mạng và cũng không phải lỗi của phiếu.
//
// CÁCH CHỮA: bắt đúng lỗi đó rồi TẢI LẠI TRANG một lần. Tải lại là nhận trang
// mới, trang mới trỏ đúng tên tệp mới, bấm lại là chạy. An toàn vì bài làm của
// em lưu liên tục vào IndexedDB (xem exam-db.ts), tải lại giữa chừng vẫn khôi
// phục đúng.
//
// CHẶN VÒNG LẶP: nếu tải lại rồi mà vẫn hỏng (máy chủ đang lỗi thật, hoặc mất
// mạng), lần thứ hai KHÔNG tải lại nữa mà báo thẳng — không để app tự nạp
// lại vô hạn trước mặt học sinh.

const KHOA = 'napLaiVìThieuManh'
/** Trong 30 giây mà lỗi lại thì coi như tải lại không cứu được. */
const KHOANG_CHO = 30_000

/** Đúng họ lỗi "không tải được mảnh mã", ở cả ba trình duyệt.
 * Chrome/Edge: "Failed to fetch dynamically imported module"
 * Firefox:     "error loading dynamically imported module"
 * Safari:      "Importing a module script failed" */
export function laLoiThieuManh(e: unknown): boolean {
  const s = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(s)
}

/** Tải lại trang nếu vừa nãy chưa tải lại. Trả về true khi đã ra lệnh tải lại
 * (lúc đó hàm gọi chỉ cần báo một dòng rồi thôi, trang sắp đi). */
export function taiLaiMotLan(nay: number = Date.now(), kho: Storage | null = layKho()): boolean {
  if (!kho) return false
  const truoc = Number(kho.getItem(KHOA) || 0)
  if (truoc && nay - truoc < KHOANG_CHO) return false
  kho.setItem(KHOA, String(nay))
  if (typeof location !== 'undefined') location.reload()
  return true
}

function layKho(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    // Trình duyệt chặn lưu trữ (chế độ riêng tư trên iOS cũ) — vẫn chạy được,
    // chỉ mất cái chặn vòng lặp.
    return null
  }
}

/** Bọc mọi `import()` động. Lỗi thiếu mảnh thì tự tải lại một lần; lỗi khác
 * ném nguyên để chỗ gọi hiện đúng nguyên nhân. */
export async function napDong<T>(nap: () => Promise<T>): Promise<T> {
  try {
    return await nap()
  } catch (e) {
    if (!laLoiThieuManh(e)) throw e
    if (taiLaiMotLan()) throw new Error('Máy đang giữ bản cũ. App tự tải lại bản mới, thầy bấm lại giúp.')
    throw new Error('Chưa tải được phần này. Kiểm tra mạng rồi thử lại.')
  }
}

/** Bắt luôn ở tầng trình duyệt: Vite bắn `vite:preloadError` khi tệp mảnh tải
 * hỏng, kể cả ở chỗ chưa kịp bọc `napDong`. Gọi một lần lúc khởi động. */
export function batLoiThieuManh(cua: Window = window): void {
  cua.addEventListener('vite:preloadError', (e) => {
    // Chặn Vite ném tiếp ra ngoài — mình xử lý bằng cách tải lại.
    e.preventDefault()
    taiLaiMotLan()
  })
}
