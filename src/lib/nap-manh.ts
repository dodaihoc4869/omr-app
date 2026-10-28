// NẠP MẢNH MÃ RỜI, TỰ CỨU KHI MÁY CÒN GIỮ BẢN CŨ.
//
// LỖI ĐÃ DÍNH 04-09: thầy bấm "Xem đề" và nhận
//   Failed to fetch dynamically imported module: .../tai-phieu-pdf-ChU46igK.js
//
// VÌ SAO. App chia nhỏ, phần dựng phiếu nằm ở một tệp rời chỉ tải khi bấm nút.
// Tên tệp có mã băm theo NỘI DUNG, nên mỗi bản build ra một tên khác. Khi đẩy
// bản mới lên GitHub Pages, tệp của bản cũ BỊ XOÁ khỏi máy chủ.
// (28/10: nay deploy.yml chép lại mảnh của các bản gần đây — scripts/giu-manh-cu.mjs — nên ca này
// chỉ còn với máy giữ bản quá cũ; tệp này là lớp cứu sau cùng.)
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
  try {
    const truoc = Number(kho.getItem(KHOA) || 0)
    if (truoc && nay - truoc < KHOANG_CHO) return false
    kho.setItem(KHOA, String(nay))
  } catch { return false } // Không giữ được mốc chống vòng lặp ⇒ để màn báo thử lại.
  if (typeof location !== 'undefined') {
    const u = new URL(location.href)
    u.searchParams.set('_moi', String(nay))
    taiLaiKhiCoBanMoi(u.toString())
  }
  return true
}

/**
 * Thiếu mảnh = máy đang chạy bản cũ. TẢI LẠI NGAY (thầy 28/10 chụp màn «Đang tải bản mới» đứng kèm chữ lỗi tiếng Anh).
 *
 * 28/09 từng phải CHỜ bản SW mới nhận quyền (tối đa 8 giây) vì lượt tải lại đi qua SW cũ và lấy `index.html` cũ từ precache.
 * Nay đường tải lại mang `_moi=` mà `sw.ts` để ngoài (KHONG_DUNG) ⇒ luôn lấy `index.html` mới từ mạng, mảnh mới cũng từ mạng
 * (precache cũ không có tên mới) ⇒ không cần chờ: 8 giây ấy chỉ là 8 giây em nhìn màn báo lỗi.
 * Riêng khi bản SW mới ĐÃ tải xong mà còn nằm chờ: đẩy nó lên (SKIP_WAITING) và chờ nó nhận quyền tối đa `choToiDaMs`
 * — để lượt tải lại này cũng là lượt cuối, không bị `tuTaiLaiKhiDoiBan` tải lại thêm lần nữa ngay sau.
 */
export function taiLaiKhiCoBanMoi(url: string, choToiDaMs = 1_500): void {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined
  let xong = false
  const di = () => {
    if (!xong) {
      xong = true
      location.replace(url)
    }
  }
  if (!sw?.getRegistration) return di()
  sw.addEventListener('controllerchange', di, { once: true })
  sw.getRegistration().then((r) => {
    if (r?.waiting) return r.waiting.postMessage({ type: 'SKIP_WAITING' })
    r?.update().catch(() => {})
    di()
  }, di)
  setTimeout(di, choToiDaMs)
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
    if (e.defaultPrevented) return // Một tấm có đường thử lại riêng đã nhận lỗi này.
    if (taiLaiMotLan()) {
      // Chặn Vite ném tiếp ra ngoài — mình xử lý bằng cách tải lại.
      e.preventDefault()
    }
  })
}
