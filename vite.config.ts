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
      // Chỉ biểu tượng NHỎ của app học sinh/phụ huynh (P1 21/09: precache nhỏ). Bản 512 px + logo app thầy do hệ điều hành đọc lúc CÀI qua mạng / đi kho chạy-lúc (src/sw.ts) —
      // `includeAssets` cũng KHÔNG bị `globIgnores` lọc nên phải liệt kê đúng ở đây.
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'logo-hs-v3.svg',
        'logo-hs-nho-v3.svg',
        'logo-ph-v3.svg',
        'logo-ph-nho-v3.svg',
        'logo-hs-64-v3.png',
        'logo-ph-64-v3.png',
        'logo-hs-180-v3.png',
        'logo-ph-180-v3.png',
        'logo-hs-192-v3.png',
        'logo-ph-192-v3.png',
        'logo-huy-hieu-96-v3.png',
        'manifest.json',
        'manifest-hs.json',
        'manifest-ph.json',
        'cau-hinh.json',
      ],
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
        //
        // PRECACHE NHỎ (P1 21/09 — máy học sinh kẹt bản cũ): precache là TẤT-CẢ-HOẶC-KHÔNG, 245 tệp / 5,4 MB thì mạng di động yếu rớt một tệp là cả lượt cài
        // hỏng, máy ở lại bản cũ mãi. Nay chỉ precache VỎ + phần khởi động của 3 cổng (index, m3, chem-format, các mảnh dùng chung nhỏ, ParentPortalScreen,
        // phông woff2, biểu tượng nhỏ). Màn của thầy, game, máy chiếu, tệp phông trùng (ttf/woff — mọi trình duyệt của em đều nạp woff2 trước) KHÔNG precache:
        // vẫn tải được, tải một lần rồi cất ở kho chạy-lúc (`omr-manh-chay-lan`, xem src/sw.ts). `scripts/kiem-sw.mjs` chặn precache phình to lại.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,data,woff2}'],
        globIgnores: [
          '**/404.html',
          '**/than-thu-v2/**',
          '**/Spirit3D-*.js',
          // Bảng tin sàn của thầy: bản đồ lớp 3D nạp LƯỜI (import động) — three (≈ 536 KB) chỉ máy thầy tải khi mở màn Hôm nay; máy học sinh / phụ huynh KHÔNG được cất vào bộ nhớ đệm.
          '**/ban-do-3d-three-*.js',
          '**/{CaiDatScreen,GiaoDeTheoTuanScreen,CauHoiScreen,ClassListScreen,ExamHubScreen,ExamMonitorScreen,ExamSetupScreen,GoiLenBangScreen,HocSinhScreen,LichSuCaScreen,NganHangDeScreen,PhanCongScreen,ToanCanhEmScreen,ExperimentDemo,DaoThanThu,DoanHoTong,Game,html-may-chieu}-*.{js,css}',
          '**/cai-app/**',
          '**/cai-app.html',
          '**/cai-dat.html',
          // Biểu tượng cài app 512 px + logo của app thầy: hệ điều hành đọc lúc CÀI app (qua mạng), máy không cần chúng để chạy.
          '**/*-512*.png',
          '**/logo-gv-*',
          // Phiếu HTML: chỉ mở khi em bấm làm phiếu (đang có mạng), tải một lần rồi cất.
          '**/html-phieu-*.js',
          // Phông Inter (58 KB) chỉ cho app phụ huynh trên máy KHÔNG phải Apple: tải một lần khi phụ huynh mở app rồi cất ở kho chạy-lúc (đường /assets/*.woff2 của src/sw.ts); không ép vào precache vỏ.
          '**/inter-*-wght-normal-*.woff2',
        ],
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
  build: {
    target: ['es2020', 'safari14', 'ios14'],
    cssTarget: ['safari14', 'ios14'],
  },
  worker: {
    format: 'es',
  },
})
