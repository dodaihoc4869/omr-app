/// <reference lib="webworker" />
// SERVICE WORKER VIẾT TAY — ĐƯỜNG LUI CHO MỌI LƯỢT ĐIỀU HƯỚNG.
//
// VÌ SAO BỎ BẢN TỰ SINH (`generateSW`)
//
// Thầy báo 14/09: "app học sinh không vào được", rồi "app phụ huynh cũng không
// vào được". Tái hiện được trong Chrome: mở `/hs` xong, mở tiếp `/ph` ra thẳng
// trang lỗi trình duyệt `ERR_FAILED`; mở lại lần nữa thì vào bình thường.
//
// Đúng một lượt điều hướng hỏng, và luôn là lượt NGAY SAU khi service worker
// bản mới chiếm quyền. Cơ chế: `skipWaiting` + `clientsClaim` cho bản mới nắm
// trang đang mở ngay lập tức; lượt điều hướng kế tiếp đi qua nó, rơi vào
// `NavigationRoute(createHandlerBoundToURL('index.html'))`, và nếu kho precache
// chưa sẵn sàng ở đúng khoảnh khắc ấy thì handler TRẢ VỀ LỖI. Không có đường
// lui nào phía sau: trình duyệt không tự đi ra mạng khi service worker đã nhận
// xử lý rồi từ chối. Người dùng thấy ERR_FAILED, tưởng hỏng app.
//
// Bản tự sinh KHÔNG cho chèn `try/catch` quanh handler ấy — nên phải tự viết.
// Đây không phải bọc lỗi cho im: lỗi vẫn được ghi ra console, chỉ khác là sau
// khi ghi thì ĐI TIẾP ra mạng thay vì bỏ mặc người dùng ở trang lỗi.
//
// BA TẦNG ĐƯỜNG LUI, xếp theo thứ tự thử:
//   1. Kho precache (nhanh nhất, chạy được cả khi mất mạng).
//   2. Mạng thật — `_redirects` trên Cloudflare Pages trả `index.html` cho mọi
//      đường dẫn, nên tầng này luôn đúng khi còn mạng.
//   3. Bất kỳ bản `index.html` nào còn trong CacheStorage, kể cả của bản cũ.
// Hết cả ba mới chịu trả lỗi.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// Danh sách tệp do vite-plugin-pwa chèn vào lúc dựng.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

/** Đường của chính Cloudflare Pages và đường ép tải bản mới — không đụng vào. */
const KHONG_DUNG: RegExp[] = [/^\/cdn-cgi\//, /[?&]_moi=/]

const TU_PRECACHE = createHandlerBoundToURL('index.html')

/** Thử lần lượt ba tầng, tầng nào ra trang là dùng tầng đó. */
async function traTrangApp(tuyChon: Parameters<typeof TU_PRECACHE>[0]): Promise<Response> {
  try {
    const r = await TU_PRECACHE(tuyChon)
    if (r) return r
  } catch (e) {
    // Ghi ra để còn lần được, KHÔNG nuốt im.
    console.warn('[sw] precache không trả được index.html, đi ra mạng:', e)
  }
  try {
    const r = await fetch(tuyChon.request)
    if (r && (r.ok || r.type === 'opaqueredirect')) return r
  } catch (e) {
    console.warn('[sw] mạng cũng không trả được trang:', e)
  }
  // Mất mạng VÀ precache hỏng: quét mọi kho xem còn bản index.html nào không.
  for (const khoa of ['index.html', '/index.html', self.registration.scope]) {
    const c = await caches.match(khoa, { ignoreSearch: true })
    if (c) return c
  }
  return Response.error()
}

registerRoute(new NavigationRoute(traTrangApp, { denylist: KHONG_DUNG }))

// BẢN MỚI CHIẾM QUYỀN NGAY. Bản mới nằm chờ tới khi đóng hết app thì app đã cài
// vào màn hình chính gần như không bao giờ nhận được bản sửa.
self.skipWaiting()
clientsClaim()

export {}
