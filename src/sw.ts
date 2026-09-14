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
//
// BẢN MỚI TRÊN MÁY CHỦ (viết lại 14/09 lượt 11):
//   Lúc activate, đọc `sw-version.json` (máy chủ trả `no-store`). Máy chủ mới
//   hơn thì gọi `registration.update()` để trình duyệt tải bản SW mới về, rồi
//   nhắn cho các tab đang mở biết. CHỈ CÓ THẾ.
//
//   Bản trước ở đây xoá sạch cache, tự gỡ đăng ký và ép tab điều hướng lại —
//   và đó chính là thứ làm "app học sinh và phụ huynh lại không truy cập
//   được". Đọc khối ở cuối tệp để biết vì sao nó hỏng mỗi lần phát hành.
//   `scripts/kiem-sw.mjs` nay chặn cả ba việc ấy quay lại.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// Danh sách tệp do vite-plugin-pwa chèn vào lúc dựng.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

/** Đường của chính Cloudflare Pages, trang cài đặt app và tệp cấu hình — không đụng vào. */
const KHONG_DUNG: RegExp[] = [/^\/cdn-cgi\//, /[?&]_moi=/, /^\/cai-/, /\.mobileconfig$/]

const TU_PRECACHE = createHandlerBoundToURL('index.html')

/** Thử lần lượt ba tầng, tầng nào ra trang là dùng tầng đó. */
async function traTrangApp(tuyChon: Parameters<typeof TU_PRECACHE>[0]): Promise<Response> {
  try {
    const r = await TU_PRECACHE(tuyChon)
    if (r) return r
  } catch (e) {
    // Ghi ra để còn lần được, KHÔNG nuốt im.
    console.warn('[sw] precache không trả được index.html, đi ra mạng:', e)
    // Precache hỏng là dấu hiệu bản SW này đã lệch với máy chủ. Gọi bản mới
    // về NGAY, không chờ lượt activate sau — nhưng vẫn trả trang cho em bằng
    // hai tầng dưới, không bắt em chờ.
    void self.registration.update().catch(() => undefined)
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

// ─── BẢN MỚI TRÊN MÁY CHỦ: GỌI BẢN MỚI VỀ, TUYỆT ĐỐI KHÔNG TỰ HUỶ ────────
//
// 14/09 thầy báo LẠI: "app học sinh và phụ huynh lại không truy cập được".
// Lần này nguyên nhân gốc nằm ngay trong đoạn từng đặt ở đây — một "kill
// switch" xoá sạch cache rồi tự gỡ đăng ký. Đo được trên bản đang chạy thật
// (`sw.js` trên máy chủ có `registration.unregister()`).
//
// VÌ SAO NÓ HỎNG, VÀ VÌ SAO NÓ HỎNG MỖI LẦN PHÁT HÀNH:
//
//   Điều kiện `serverTs > SW_BUILT_AT` KHÔNG phải ca hiếm. Máy em đang giữ
//   bản SW cũ, máy chủ vừa có bản mới — nghĩa là ĐÚNG mọi em quay lại sau mỗi
//   lần thầy đẩy bản. Nhánh ấy chạy cho TẤT CẢ, mỗi lần, và nó:
//     1. `caches.delete` toàn bộ — xoá luôn kho precache mà workbox vừa nạp
//        xong trong chính lượt activate này, và xoá luôn phần chạy offline.
//     2. `registration.unregister()` — nhưng SW này VẪN đang điều khiển các
//        tab đang mở; gỡ đăng ký chỉ chặn lần sau.
//     3. ép mọi tab điều hướng lại — lượt ấy vẫn đi qua CHÍNH SW này,
//        rơi vào `traTrangApp`, tầng precache vừa bị xoá rỗng, mạng chớp một
//        nhịp là rơi nốt tầng ba (cũng rỗng) ⇒ `Response.error()` ⇒ ERR_FAILED.
//   Đúng cái màn hình lỗi thầy thấy, và đúng lý do nó LẶP LẠI.
//
// CÁCH ĐÚNG: thấy máy chủ có bản mới thì BẢO TRÌNH DUYỆT ĐI LẤY, rồi để
// workbox làm việc của nó (`skipWaiting` + `clientsClaim` + `cleanupOutdated
// Caches` đã thay bản cũ bằng bản mới ở mọi lượt mở trang). Không xoá kho,
// không tự gỡ, không ép điều hướng. Kho cũ thừa đã có `cleanupOutdatedCaches`
// dọn đúng phần của nó.
declare const __SW_BUILT_AT__: number

const SW_BUILT_AT: number = typeof __SW_BUILT_AT__ !== 'undefined' ? __SW_BUILT_AT__ : 0

/** Báo cho mọi tab đang mở biết có bản mới, để app tự chọn lúc nạp lại.
 * CHỈ BÁO — không ép điều hướng, vì ép là dẫm đúng vào lỗi 14/09. */
async function baoCoBanMoi(banMayChu: number): Promise<void> {
  const ds = await self.clients.matchAll({ type: 'window' })
  for (const c of ds) c.postMessage({ kieu: 'ddh:co-ban-moi', banMayChu, banDangChay: SW_BUILT_AT })
}

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/sw-version.json', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { builtAt?: number }
        const banMayChu = Number(data.builtAt || 0)
        if (!(banMayChu > SW_BUILT_AT + 2)) return
        console.info(`[sw] máy chủ có bản ${banMayChu}, bản đang chạy ${SW_BUILT_AT} — gọi bản mới về`)
        // Bảo trình duyệt tải lại `/sw.js`. Máy chủ trả `must-revalidate` nên
        // lượt này lấy được bản mới; workbox cài và chiếm quyền như thường lệ.
        await self.registration.update()
        await baoCoBanMoi(banMayChu)
      } catch {
        // Mất mạng thì giữ nguyên bản đang chạy — app vẫn chạy offline.
      }
    })(),
  )
})

export {}
