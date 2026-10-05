// NẠP TRƯỚC MẢNH MÀN CỦA EM NGAY TỪ HTML (máy yếu + mạng 3G, 29/09).
//
// Đo (scripts/do-may-yeu.mjs, Fast 3G + CPU ×6): mở `/hs`, `/ph` hay `/t/<mã ca>` thì trình duyệt tải xong mảnh chính (index, 130 KB
// gzip) RỒI mới biết cần mảnh màn (StudentPortalScreen / ParentPortalScreen / ExamTakeScreen + các mảnh con) — thêm cả một vòng mạng 3G (~0,6 s)
// cộng thời gian tải nối đuôi. Đoạn mã nhỏ này chạy ngay lúc phân tích HTML, đọc ĐƯỜNG DẪN (cùng luật `vai-tro.ts`) và chèn
// `<link rel="modulepreload">` / `<link rel="preload" as="style">` cho đúng mảnh màn đó ⇒ tải SONG SONG với mảnh chính.
//
// `crossorigin` khớp đúng thẻ Vite tự chèn (mảnh JS và tờ CSS đều mang `crossorigin`) — lệch là trình duyệt tải HAI lần.
// Không đổi mã nào chạy: chỉ là gợi ý tải sớm. Trình duyệt không hiểu `modulepreload` (Safari cũ) thì bỏ qua — y như trước.
// Đường không khớp (app thầy, phiếu, `/` trần) ⇒ không làm gì. KHÔNG dùng nhìn lùi trong regex (Safari cũ sập).
//
// 05/10 (tối ưu mở app học sinh, thầy: "app học sinh nhanh gấp 2 lần", giữ nguyên giao diện): main.tsx nạp ĐỘNG gốc React theo đường vào
// (vỏ `AppHocSinh` cho cổng học sinh, App.tsx cho mọi đường khác) ⇒ thêm ba nhóm TUỲ CHỌN (thiếu nhóm ⇒ chạy y như bản 29/09):
//   · `app`   — mảnh App.tsx + mảnh con: nạp trước ở MỌI đường trừ cổng học sinh (trước đây nằm sẵn trong mảnh chính).
//   · `hsVo`  — vỏ cổng học sinh + màn đăng nhập (nhỏ). Có nhóm này thì: máy ĐÃ đăng nhập (màn đầu là Sảnh) nạp mảnh CỔNG (`hs`) như cũ;
//               máy CHƯA đăng nhập nạp mảnh cổng SAU KHI mã khởi động đã về và chạy (DOMContentLoaded), ưu tiên THẤP (`fetchpriority=low`) —
//               không giành đường truyền với tờ CSS + mã của màn đăng nhập; mã cổng chỉ CHẠY sau khi màn đăng nhập đã vẽ (AppHocSinh.tsx),
//               em gõ xong là cổng đã sẵn. Mảnh KaTeX (`katex`) tải trước cùng lúc ⇒ main.tsx nối KaTeX ngay sau mảnh cổng (luật cũ) mà không
//               phải đi mạng lúc em vừa bấm Đăng nhập. Máy đã đăng nhập (service worker phục vụ) không nạp trước KaTeX — tải sau mảnh cổng như cũ.
//   · `phongHs` — phông chữ Sảnh: chỉ nạp trước khi máy đã có service worker (lấy từ bộ nhớ máy, không tốn mạng) ⇒ Sảnh vẽ một lần đúng phông.
// Máy đã đăng nhập còn HỎI SỚM các lệnh Sảnh (`hoiSomSanh`) ngay lúc đọc HTML — xem src/lib/hoi-som.ts.


export interface BangNapTruoc {
  /** Mảnh màn thi (`/t/<mã ca>`, `/d/<mã ca>`, `?examCode=`, `?vai=diem`). */
  thi: string[]
  /** Mảnh cổng học sinh (`/hs`, `/hoc-sinh`, `?vai=hocsinh`). */
  hs: string[]
  /** Mảnh cổng phụ huynh (`/ph`, `/phu-huynh`, `?vai=phuhuynh`). */
  ph: string[]
  /** Mảnh App.tsx (vỏ app thầy / phiếu / màn thi / cổng phụ huynh) — mọi đường trừ cổng học sinh. */
  app?: string[]
  /** Vỏ cổng học sinh + màn đăng nhập. */
  hsVo?: string[]
  /** Phông Sảnh (chỉ nạp khi trang đã do service worker phục vụ). */
  phongHs?: string[]
  /** Mảnh KaTeX (`katex-goi` + CSS): máy CHƯA đăng nhập nạp trước cùng mảnh cổng (ưu tiên thấp) — xem `taoMaNapTruoc`. */
  katex?: string[]
}

/** Khoá localStorage của phiên đăng nhập cổng học sinh (= `KHOA_LUU_AUTH` StudentPortalScreen; phien-hoc-sinh.ts xuất lại). Tệp này không
 *  nhập mô-đun nào (vite.config.ts nạp nó lúc dựng). */
export const KHOA_PHIEN_HS = 'omr_student_portal_auth'

/** Khoá localStorage: địa chỉ máy chủ app học sinh VỪA dùng (hoi-som.ts ghi) — đoạn mã nội tuyến hỏi sớm đúng máy chủ ấy. */
export const KHOA_DIA_CHI_HS = 'ddh.mayChuHs'

/** Lệnh Sảnh hỏi sớm: đường + thân (theo `token` hay `sbd` của phiên) — y hệt lệnh các màn gửi lúc dựng Sảnh
 *  (hoa2/api.ts goiHoa2, bang-nhiem-vu/may-chu.ts goiPost, buoi-hoc-api.ts goiHs, exam-api.ts hsLichSuCaApi). */
export const LENH_HOI_SOM: [string, 'token' | 'sbd'][] = [
  ['/game-v2/hoa2-sanh', 'token'],
  ['/hs/ke-hoach-ngay', 'token'],
  ['/hs/ca-dang-mo', 'token'],
  ['/hs/buoi-hoc', 'token'],
  ['/hs/lich-su', 'sbd'],
]

/** Đường vào nào cần mảnh nào — CÙNG luật `docDuongVao` (vai-tro.ts), viết lại cho đoạn mã nội tuyến. */
export function chonMangNapTruoc(duongDan: string, truyVan: string): 'thi' | 'hs' | 'ph' | null {
  const q = truyVan || ''
  const p = duongDan || ''
  // Tham số thắng đường dẫn (docDuongVao đọc tham số trước).
  const vai = /[?&]vai=([^&#]*)/.exec(q)
  const v = vai ? decodeURIComponent(vai[1]).trim().toLowerCase() : ''
  if (v === 'gv' || v === 'giaovien' || v === 'phieu') return null
  if (v === 'phuhuynh') return 'ph'
  if (v === 'diem') return 'thi'
  if (v === 'hocsinh') return 'hs'
  if (/[?&]examCode=\d/.test(q)) return 'thi'
  if (/(?:^|\/)[td]\/\d{4,8}\/?$/.test(p)) return 'thi'
  if (/(?:^|\/)(?:hoc-sinh|hocsinh|hs)\/?$/.test(p)) return 'hs'
  if (/(?:^|\/)(?:phu-huynh|phuhuynh|ph)\/?$/.test(p)) return 'ph'
  return null
}

/**
 * HỎI SỚM các lệnh Sảnh của một phiên học sinh — TỰ CHỨA (không dùng gì ngoài tham số + fetch/JSON của trình duyệt) để nhúng NGUYÊN VĂN vào
 * index.html (`toString()`), và hoi-som.ts gọi lại đúng hàm này sau khi em đăng nhập. Ghi vào `w.__ddhHoiSom[đường]`:
 * `{ goc, than, hua, xong, tuHtml }` — `hua` luôn thành (lỗi mạng / đọc thân hỏng ⇒ null: chỗ gọi tự gửi lệnh như cũ).
 */
export function hoiSomSanh(w: any, goc: string, phien: any, ds: [string, string][], tuHtml: boolean): void {
  var kho = w.__ddhHoiSom || (w.__ddhHoiSom = {})
  for (var i = 0; i < ds.length; i++) {
    ;(function (duong: string, kieu: string) {
      var o: any = {}
      if (kieu === 'sbd') o.sbd = String(phien.sbd || '').trim()
      else o.token = phien.token
      if (!o[kieu]) return
      var than = JSON.stringify(o)
      var cu = kho[duong]
      if (cu && !cu.daDung && cu.goc === goc && cu.than === than) return
      var muc: any = { goc: goc, than: than, tuHtml: tuHtml, xong: undefined }
      muc.hua = w
        .fetch(goc + duong, { method: 'POST', headers: { 'content-type': 'application/json' }, body: than })
        .then(function (r: any) {
          return r.text().then(function (t: string) {
            return { ok: r.ok, status: r.status, text: t, nhip: r.headers.get('x-nhip-de-nghi') }
          })
        })
        .then(
          function (x: any) {
            muc.xong = x
            return x
          },
          function () {
            muc.xong = null
            return null
          },
        )
      kho[duong] = muc
    })(ds[i][0], ds[i][1])
  }
}

/** Mã JS (ES5, tự gọi) chèn vào <head>: chọn mảng theo đường dẫn rồi thêm thẻ link tải sớm (+ hỏi Sảnh sớm khi máy em đã đăng nhập). */
export function taoMaNapTruoc(bang: BangNapTruoc): string {
  // Link riêng CŨ (`laLinkAppCu` của vai-tro.ts: `?vai=hs|ph`, `/hs/<token>`): app dựng màn "link đã ngừng dùng" của App.tsx ⇒ không coi là cổng
  // (không hỏi sớm, không nạp vỏ học sinh) — cùng kết luận với main.tsx.
  return `(function(){try{var c=(${chonMangNapTruoc.toString()})(location.pathname,location.search);var b=${JSON.stringify(bang)};` +
    `var v='';try{v=(new URLSearchParams(location.search).get('vai')||'').trim()}catch(e){}` +
    `if(v==='hs'||v==='ph'||/(?:^|\\/)(?:hs|ph)\\/[0-9a-zA-Z]{8,}\\/?$/.test(location.pathname))c=null;` +
    `var nap=function(ds,thap){if(!ds)return;for(var i=0;i<ds.length;i++){var l=document.createElement('link');if(/\\.css$/.test(ds[i])){l.rel='preload';l.as='style'}else if(/\\.woff2$/.test(ds[i])){l.rel='preload';l.as='font';l.type='font/woff2'}else{l.rel='modulepreload'}if(thap)l.fetchPriority='low';l.crossOrigin='';l.href=ds[i];document.head.appendChild(l)}};` +
    `if(c==='hs'&&b.hsVo){var p=null;try{p=JSON.parse(localStorage.getItem(${JSON.stringify(KHOA_PHIEN_HS)})||'null')}catch(e){}nap(b.hsVo);` +
    `if(p){nap(b.hs);var g='';try{g=localStorage.getItem(${JSON.stringify(KHOA_DIA_CHI_HS)})||''}catch(e){}` +
    `if(/^https:\\/\\/[^\\/]+$/.test(g)&&typeof fetch==='function'){try{(${hoiSomSanh.toString()})(window,g,p,${JSON.stringify(LENH_HOI_SOM)},true)}catch(e){}}` +
    `if(navigator.serviceWorker&&navigator.serviceWorker.controller)nap(b.phongHs)}else document.addEventListener('DOMContentLoaded',function(){nap(b.hs,1);nap(b.katex,1)});return}` +
    `if(b.app&&c!=='hs')nap(b.app);nap(c&&b[c])}catch(e){}})()`
}
