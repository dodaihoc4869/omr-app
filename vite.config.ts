import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name dùng làm base path khi deploy GitHub Pages (project page, không phải user page).
// Đổi giá trị này đúng bằng tên repo GitHub của thầy trước khi deploy.
const REPO_BASE = '/omr-app/'

// DẤU PHIÊN BẢN in ở màn chính: <mã commit> · <ngày giờ build>. Để khi thầy
// sửa lỗi rồi mở app trên máy khác, nhìn dòng này biết ngay máy đã nhận bản
// mới hay còn giữ bản cũ trong bộ nhớ — thay vì đoán.
function dauPhienBan(): string {
  let sha = process.env.GITHUB_SHA || ''
  if (!sha) {
    try {
      sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    } catch {
      sha = ''
    }
  }
  const ngay = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `${sha ? sha.slice(0, 7) : 'dev'} · ${ngay}`
}

const SW_BUILT_AT = Math.floor(Date.now() / 1000)

// Ghi sw-version.json với timestamp mới nhất lúc build (cùng giá trị với __SW_BUILT_AT__)
// để kill switch trong service worker so sánh được.

function ghiSwVersion() {
  try {
    const p = resolve('public/sw-version.json')
    writeFileSync(p, JSON.stringify({ builtAt: SW_BUILT_AT }))
  } catch (e) {
    console.warn('[vite] Không ghi được sw-version.json:', e)
  }
}
ghiSwVersion()

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? REPO_BASE : '/',
  define: {
    __PHIEN_BAN__: JSON.stringify(dauPhienBan()),
    __SW_BUILT_AT__: SW_BUILT_AT,
  },

  plugins: [
    react(),
    VitePWA({
      // SERVICE WORKER VIẾT TAY (`src/sw.ts`), KHÔNG dùng bản tự sinh nữa.
      //
      // Bản tự sinh không cho bọc đường lui quanh `NavigationRoute`, nên một
      // lượt điều hướng rơi vào lúc bản mới vừa chiếm quyền là ra thẳng
      // ERR_FAILED — đúng lỗi "app học sinh / phụ huynh không vào được" thầy
      // báo 14/09. Đọc `src/sw.ts` để biết ba tầng đường lui.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // Tự đăng ký service worker trong main.tsx (registerSW từ
      // 'virtual:pwa-register', immediate:true) để có bản mới TỰ TẢI LẠI
      // ngay, không cần thầy/học sinh xoá cache tay mới thấy sửa lỗi —
      // injectRegister:false để không đăng ký trùng 2 lần.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'icon-hs-192.png', 'icon-hs-512.png', 'icon-ph-192.png', 'icon-ph-512.png', 'manifest.json', 'manifest-hs.json', 'manifest-ph.json', 'cau-hinh.json'],
      // KHÔNG để plugin sinh và CHÈN thẻ manifest. Thẻ nó chèn nằm cuối <head>
      // và luôn trỏ manifest chung, nên Chrome cài ra app "ĐỖ ĐẠI HỌC" chung dù
      // em đang ở app học sinh — mã JS đổi thẻ sau đó là đã muộn. Ba file
      // manifest.json / manifest-hs.json / manifest-ph.json nay nằm thẳng trong
      // public/, và index.html tự chọn đúng file ngay lúc phân tích HTML.
      manifest: false,
      injectManifest: {
        // DẠNG IIFE, KHÔNG PHẢI ES MODULE.
        //
        // Mặc định của plugin là `es`, và service worker dạng ES module thì
        // Safari trên iPhone KHÔNG đăng ký được — nghĩa là mọi máy iPhone của
        // học sinh mất sạch phần chạy offline. Máy thầy dùng Chrome nên lỗi này
        // không bao giờ lộ ra khi thử ở nhà.
        rollupFormat: 'iife',
        // BẢN MỚI PHẢI CHIẾM QUYỀN NGAY. Mặc định, service worker mới chỉ nằm
        // chờ ("waiting") tới khi người dùng đóng HẾT tab/app — mà app đã cài
        // vào màn hình chính thì gần như không bao giờ bị đóng hẳn, nên bản mới
        // nằm chờ vô hạn: thầy sửa lỗi, đẩy lên, mở app vẫn thấy bản cũ. Đã dính
        // đúng lỗi này (bản 0eddc42 nằm chờ trong khi máy chủ đã có bản mới).
        // `skipWaiting` và `clientsClaim` nay gọi thẳng trong `src/sw.ts`.
        // woff2/woff: phông có dấu tiếng Việt và phông công thức của KaTeX.
        // Thiếu hai đuôi này thì mất mạng là dấu tiếng Việt và chỉ số công thức
        // rơi về phông dự phòng — đúng lỗi "bă`ng" đã gặp.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,data,woff,woff2,ttf}'],
        globIgnores: ['**/404.html'],
        // ĐƯỜNG LUI CHO MỌI LƯỢT ĐIỀU HƯỚNG — khai TƯỜNG MINH.
        //
        // App đọc vai và mã ca từ đường dẫn (/hs, /ph, /t/<mã ca>, /d/<mã ca>).
        // Không có dòng này thì service worker không biết trả gì cho những
        // đường ấy: máy đã cài service worker mở /ph ra TRANG LỖI của trình
        // duyệt, không phải 404 — đúng thứ thầy gặp 14/09, và nó không hiện ở
        // máy chưa cài nên rất dễ tưởng là lỗi mạng.
        //
        // `_redirects` lo phía máy chủ cho máy CHƯA cài; dòng này lo phía máy
        // em ĐÃ cài. Phải có cả hai.
        // `navigateFallback` và danh sách trừ nay nằm trong `src/sw.ts` — ở đó
        // mới bọc được đường lui ra mạng.
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        // KHÔNG chặn /t/, /hs/, /ph/ nữa: service worker cứ trả index.html cho
        // mọi đường điều hướng, và app tự đọc vai + mã ca từ ĐƯỜNG DẪN
        // (vai-tro.ts · docVaiTuDuongDan). Trước đây trông cậy vào
        // public/404.html để đổi /hs/<token> thành ?vai=hs&token=… — nhưng
        // 404.html chỉ chạy khi máy CHƯA cài service worker; máy đã cài thì nó
        // không bao giờ chạy, và link riêng rơi thẳng vào màn quản lý của thầy.
        // Đọc từ đường dẫn còn được cái nữa: link vào thi mở được cả khi mất mạng.
      },
    }),
  ],
  worker: {
    format: 'es',
  },
})
