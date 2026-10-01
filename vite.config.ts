import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { taoMaNapTruoc } from './src/lib/nap-truoc-man-em.ts'

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

// NẠP TRƯỚC MẢNH MÀN EM TỪ HTML (máy yếu 29/09) — xem src/lib/nap-truoc-man-em.ts. Lúc build, tra trong gói ra tên tệp THẬT
// (có mã băm) của mảnh ExamTakeScreen / StudentPortalScreen / ParentPortalScreen + mọi mảnh con tĩnh + CSS của chúng, bỏ những tệp index.html đã
// tự nạp, rồi chèn đoạn mã chọn-theo-đường-dẫn lên TRƯỚC các thẻ Vite chèn. Chỉ thêm gợi ý tải sớm — không đổi mảnh nào, không đổi precache.
function napTruocManEm(): Plugin {
  let goc = '/'
  return {
    name: 'nap-truoc-man-em',
    apply: 'build',
    configResolved(c) {
      goc = c.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const goi = ctx.bundle
        if (!goi) return html
        type Manh = { type: 'chunk'; fileName: string; imports: string[]; facadeModuleId: string | null; isDynamicEntry: boolean; viteMetadata?: { importedCss: Set<string> } }
        const manh = Object.values(goi).filter((x) => x.type === 'chunk') as unknown as Manh[]
        const theoTen = new Map(manh.map((m) => [m.fileName, m]))
        const dsCua = (duoi: string): string[] => {
          const dau = manh.find((m) => m.isDynamicEntry && (m.facadeModuleId || '').split('\\').join('/').endsWith(duoi))
          if (!dau) return []
          const thay = new Set<string>()
          const di = (ten: string) => {
            if (thay.has(ten)) return
            thay.add(ten)
            const m = theoTen.get(ten)
            if (!m) return
            for (const c of m.viteMetadata?.importedCss ?? []) thay.add(c)
            for (const con of m.imports) di(con)
          }
          di(dau.fileName)
          return [...thay].filter((t) => !html.includes(t)).map((t) => goc + t)
        }
        const bang = { thi: dsCua('/src/screens/ExamTakeScreen.tsx'), hs: dsCua('/src/screens/StudentPortalScreen.tsx'), ph: dsCua('/src/screens/ParentPortalScreen.tsx') }
        if (bang.thi.length + bang.hs.length + bang.ph.length === 0) return html
        // Đặt TRƯỚC mọi thẻ Vite chèn: script nội tuyến đứng sau <link rel="stylesheet"> phải chờ tờ CSS tải xong mới chạy
        // (đo: mất ~1,5 s trên 3G) — đặt trước thì chạy ngay khi trình duyệt vừa đọc tới.
        const moc = html.indexOf('<script type="module"')
        if (moc < 0) return html
        return html.slice(0, moc) + `<script>${taoMaNapTruoc(bang)}</script>\n` + html.slice(moc)
      },
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? REPO_BASE : '/',
  define: {
    __PHIEN_BAN__: JSON.stringify(dauPhienBan()),
    __SW_BUILT_AT__: SW_BUILT_AT,
  },

  plugins: [
    react(),
    napTruocManEm(),
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
        // Mini-game phòng chờ chỉ tải lúc vào màn, dùng kho chạy-lúc hiện có.
        '**/ChuyenBay-*.{js,css}',
          '**/404.html',
          '**/than-thu-v2/**',
          // Lời giải từng bước (29/09): khung tĩnh ~280 KB chỉ tải khi em bấm "Xem lời giải từng bước" — không cất sẵn.
          '**/loi-giai/**',
          '**/Spirit3D-*.js',
          // Bảng tin sàn của thầy: bản đồ lớp 3D nạp LƯỜI (import động) — three (≈ 536 KB) chỉ máy thầy tải khi mở màn Hôm nay; máy học sinh / phụ huynh KHÔNG được cất vào bộ nhớ đệm.
          '**/ban-do-3d-three-*.js',
          '**/{CaiDatScreen,TongQuanScreen,ChienDichScreen,DuyetLoiGiaiScreen,gv-hoa2,GiaoDeTheoTuanScreen,CauHoiScreen,ClassListScreen,ExamHubScreen,ExamMonitorScreen,ExamSetupScreen,GoiLenBangScreen,HocSinhScreen,LichSuCaScreen,NganHangDeScreen,PhanCongScreen,ToanCanhEmScreen,ExperimentDemo,DaoThanThu,DoanHoTong,Game,html-may-chieu,Dao2,DoanHinh,chien-dich,ca-chot-chien-dich,CauDaLam}-*.{js,css}',
          // Lịch sử ca + báo cáo chi tiết bản mới của em (28/09): mảnh nạp LƯỜI khi em bấm thẻ "Ca kiểm tra gần nhất" / "Xem báo cáo" (đang có mạng) — kho chạy-lúc.
          '**/{LichSuCaEm,BaoCaoCaCuaEm,BaoCaoChiTiet,CauCanChua,ca-thi,cau-da-lam,cau-chuyen}-*.{js,css}',
          // Game Hóa 2.0 (27/09): hình vẽ 32 phụ kiện thần thú (nạp lười trong game) — chỉ máy mở game mới tải, cất ở kho chạy-lúc.
          '**/pk-{cl,da,hq,vd}-*.js',
          // Gộp ngang + app thầy 2.0 (28/09): các mảnh nạp LƯỜI chỉ của app thầy (giao/chiếu chiến dịch, bố cục tờ chiếu) và của game
          // (cửa hàng phụ kiện, lọc câu theo khối) ra kho chạy-lúc — giữ precache vỏ ≤ 2850 KB (chừa ≥ 150 KB dưới trần 3000 KB).
          '**/{LenBangChienDich,GiaoChienDich,bo-cuc-to-chieu,ManShopThat,khoi-cau}-*.{js,css}',
          // Bảng Dạy học (28/09): tấm Chiếu mã (vào thi + điểm danh) nay là mảnh dùng chung của 4 màn thầy (Mở ca, Theo dõi ca, phòng chờ, Lên bảng — đều ngoài precache) ⇒ kho chạy-lúc.
          '**/TamPhuChieuMa-*.{js,css}',
          // Thẻ "Luyện đề cấu trúc" trong Tu luyện (30/09): mảnh nạp LƯỜI khi em bấm thẻ (luyện đề cần mạng để rút/chấm ở máy chủ) — kho chạy-lúc.
          // Màn Tu luyện (30/09, bố cục ngang + máy tính): cả mảnh ManTuLuyen nạp LƯỜI khi em bấm cửa Tu luyện ở Sảnh — mọi việc của nó đều cần máy chủ
          // (tải nguồn, rút, chấm), mở lần đầu là đang có mạng; tải một lần rồi cất ở kho chạy-lúc. Không ép vào precache vỏ (trần 3000 KB).
          '**/{ManTuLuyen,LuyenDeCauTruc}-*.{js,css}',
          // Màn làm bài NGANG: từ 01/10 VÀO precache (≈ 47 KB) — ngoài precache thì máy còn bản cũ sau một lượt phát hành, hay mạng yếu lúc xoay,
          // nạp mảnh hỏng và em kẹt bố cục dọc (thầy báo "xoay ngang không hoạt động").
          // Bù chỗ cho mảnh ngang (giữ trần 3000 KB): ba mảnh CHỈ màn thầy nhập (Tổng quan/Chiến dịch, Cài đặt/Học sinh, Giao/Sửa chiến dịch —
          // các màn đó đã ngoài precache) ra kho chạy-lúc.
          '**/{DsChienDichDaGiao,NutDongBoDanhSach,nguon-giao}-*.{js,css}',
          // Tải PDF "Câu đã làm" (28/09): jspdf (+ canvg `index.es`, dompurify `purify.es`, html2canvas mà jspdf kéo theo) và html2canvas-pro
          // ≈ 1 MB, chỉ nạp khi em bấm "Tải PDF" (import động, lúc đó đang có mạng) — cất ở kho chạy-lúc, KHÔNG vào precache vỏ.
          '**/{jspdf.es.min,html2canvas,html2canvas-pro.esm,purify.es,index.es,pdf-cau-da-lam}-*.js',
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
          // Phông tiêu đề Game Hóa 2.0 'Baloo 2' (28/09): chỉ mảnh game/Sảnh 2.0 nạp (src/components/hoa2/phong-baloo.ts) — tải lúc mở game rồi cất ở kho chạy-lúc /assets/*.woff2, không vào precache vỏ.
          '**/baloo-2-*.woff2',
          // Bi-a Phản Ứng (28/09): gói lười BiaGame + mảnh dùng chung với Đảo 2.0 (thẻ câu `TrongAi`, `useNgang`) — Rollup tách riêng vì cả hai game
          // cùng nhập; trước đó chúng nằm trong mảnh Dao2 (đã ngoài precache). `chu-het-luot` (1 KB) bị tách theo, chỉ DaoThanThu/DoanHoTong/Game
          // (đều ngoài precache) nhập. Chỉ máy mở game mới tải, cất ở kho chạy-lúc.
          '**/{BiaGame,TrongAi,ngang,chu-het-luot}-*.{js,css}',
          // CHỐNG TRÙNG (28/09): 14 biểu tượng nhỏ dưới đây đã có trong `includeAssets` (precache đích danh) — để globPatterns bắt lại lần nữa
          // thì dist/sw.js ghi mỗi tệp HAI lần (178 mục cho 164 tệp). Bỏ ở phía glob, giữ ở phía includeAssets.
          '{favicon.svg,apple-touch-icon.png,icon-192.png,logo-huy-hieu-96-v3.png}',
          'logo-{hs,ph}-{v3.svg,nho-v3.svg,64-v3.png,180-v3.png,192-v3.png}',
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
    rolldownOptions: {
      output: {
        // GOM MẢNH NHỎ (28/09). Tách màn thi + cổng HS khỏi mảnh chính làm Rolldown cắt ra hàng chục mảnh 100–500 byte (mỗi biểu tượng lucide một tệp),
        // đẩy precache vượt trần 170 tệp của scripts/kiem-sw.mjs. Gom mọi biểu tượng vào MỘT mảnh (≈ 10 KB) — ít tệp, ít vòng mạng, cache một lần.
        codeSplitting: {
          // Máy yếu (29/09): `src/lib/may-yeu.ts` (≈ 1 KB) nay được nhiều mảnh lười cùng nhập ⇒ Rolldown tách thành tệp riêng, đẩy
          // precache lên đúng trần 170. Gom vào CÙNG mảnh biểu tượng (mảnh này index.html luôn tải sẵn) ⇒ không thêm tệp nào.
          // 29/09: gom thêm ba mô-đun nhỏ (~1 KB mỗi cái) mà index.html VỐN nạp sẵn ở mọi đường (vai-tro, dia-chi-may-chu,
          // hieu-chinh-giay-thuc) vào cùng mảnh này ⇒ bớt tệp precache / vòng mạng, chừa chỗ dưới trần 170.
          groups: [{ name: 'bieu-tuong', test: /node_modules[\\/]lucide-react[\\/]|src[\\/]lib[\\/](?:may-yeu|vai-tro|dia-chi-may-chu|hieu-chinh-giay-thuc)\.ts$/ }],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
