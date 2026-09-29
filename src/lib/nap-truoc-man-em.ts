// NẠP TRƯỚC MẢNH MÀN CỦA EM NGAY TỪ HTML (máy yếu + mạng 3G, 29/09).
//
// Đo (scripts/do-may-yeu.mjs, Fast 3G + CPU ×6): mở `/hs`, `/ph` hay `/t/<mã ca>` thì trình duyệt tải xong mảnh chính (index, 130 KB
// gzip) RỒI mới biết cần mảnh màn (StudentPortalScreen / ParentPortalScreen / ExamTakeScreen + các mảnh con) — thêm cả một vòng mạng 3G (~0,6 s)
// cộng thời gian tải nối đuôi. Đoạn mã nhỏ này chạy ngay lúc phân tích HTML, đọc ĐƯỜNG DẪN (cùng luật `vai-tro.ts`) và chèn
// `<link rel="modulepreload">` / `<link rel="preload" as="style">` cho đúng mảnh màn đó ⇒ tải SONG SONG với mảnh chính.
//
// `crossorigin` khớp đúng thẻ Vite tự chèn (mảnh JS và tờ CSS đều mang `crossorigin`) — lệch là trình duyệt tải HAI lần.
// Không đổi mã nào chạy: chỉ là gợi ý tải sớm. Trình duyệt không hiểu `modulepreload` (Safari cũ) thì bỏ qua — y như trước.
// Đường không khớp (app thầy, `/` trần) ⇒ không làm gì. KHÔNG dùng nhìn lùi trong regex (Safari cũ sập).

export interface BangNapTruoc {
  /** Mảnh màn thi (`/t/<mã ca>`, `/d/<mã ca>`, `?examCode=`, `?vai=diem`). */
  thi: string[]
  /** Mảnh cổng học sinh (`/hs`, `/hoc-sinh`, `?vai=hocsinh`). */
  hs: string[]
  /** Mảnh cổng phụ huynh (`/ph`, `/phu-huynh`, `?vai=phuhuynh`). */
  ph: string[]
  /** Mảnh phiếu kết quả (`/p`, `?vai=phieu`). */
  phieu: string[]
}

/** Đường vào nào cần mảnh nào — CÙNG luật `docDuongVao` (vai-tro.ts), viết lại cho đoạn mã nội tuyến. */
export function chonMangNapTruoc(duongDan: string, truyVan: string): 'thi' | 'hs' | 'ph' | 'phieu' | null {
  const q = truyVan || ''
  const p = duongDan || ''
  // Tham số thắng đường dẫn (docDuongVao đọc tham số trước).
  const vai = /[?&]vai=([^&#]*)/.exec(q)
  const v = vai ? decodeURIComponent(vai[1]).trim().toLowerCase() : ''
  if (v === 'gv' || v === 'giaovien') return null
  if (v === 'phieu') return 'phieu'
  if (v === 'phuhuynh') return 'ph'
  if (v === 'diem') return 'thi'
  if (v === 'hocsinh') return 'hs'
  if (/[?&]examCode=\d/.test(q)) return 'thi'
  if (/(?:^|\/)[td]\/\d{4,8}\/?$/.test(p)) return 'thi'
  if (/(?:^|\/)(?:hoc-sinh|hocsinh|hs)\/?$/.test(p)) return 'hs'
  if (/(?:^|\/)(?:phu-huynh|phuhuynh|ph)\/?$/.test(p)) return 'ph'
  if (/(?:^|\/)p\/?$/.test(p)) return 'phieu'
  return null
}

/** Mã JS (ES5, tự gọi) chèn vào <head>: chọn mảng theo đường dẫn rồi thêm thẻ link tải sớm. */
export function taoMaNapTruoc(bang: BangNapTruoc): string {
  return `(function(){try{var c=(${chonMangNapTruoc.toString()})(location.pathname,location.search);var b=${JSON.stringify(bang)};var ds=c&&b[c];if(!ds)return;for(var i=0;i<ds.length;i++){var l=document.createElement('link');if(/\\.css$/.test(ds[i])){l.rel='preload';l.as='style'}else{l.rel='modulepreload'}l.crossOrigin='';l.href=ds[i];document.head.appendChild(l)}}catch(e){}})()`
}
