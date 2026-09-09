// ĐƯỜNG VÀO APP GIÁO VIÊN.
//
// Repo này CHỈ còn app của thầy. App học sinh và app phụ huynh đã tách sang hai
// repo riêng (TACHAPPHSPH.md phần 1), nên ở đây không còn `/hs/<token>`,
// `/ph/<token>`, `?vai=hs`, `?vai=ph`, cũng không còn màn nào của hai vai đó.
//
// Còn đúng ba đường:
//   /gv          → app giáo viên (mọi lệnh vẫn đòi MÃ BÍ MẬT ở Apps Script)
//   /t/<mã ca>   → màn LÀM BÀI, giữ lại để lớp vẫn thi và làm bài tập được
//                  trong lúc app học sinh mới chưa xong. Khi hs-app chạy thật
//                  thì gỡ nốt màn này khỏi đây.
//   /d/<mã ca>   → XEM ĐIỂM. Em nhập lại số báo danh, họ tên, năm sinh rồi
//                  được đưa thẳng sang phiếu kết quả của chính em. Thêm 07/09
//                  vì link `/t/<mã ca>` sau khi nộp chỉ mở lại được điểm TRÊN
//                  CHÍNH MÁY đã thi; em mở ở máy khác thì cụt đường.
//   /p#<dữ liệu> → PHIẾU KẾT QUẢ gửi phụ huynh. Dữ liệu nằm sau dấu `#` nên
//                  không bao giờ rời máy phụ huynh (xem lib/phieu-link.ts).
//                  Chỉ đọc, không có mã bí mật, không gọi máy chủ.
//
// `public/404.html` đổi hai đường trên thành `?vai=gv` / `?examCode=…` khi máy
// chưa cài service worker; `chuanHoaDuongDan()` làm đúng việc đó ở trong app,
// nên máy đã cài app (service worker nuốt mất 404.html) vẫn chạy đúng.
export type VaiTro = 'gv' | 'phieu' | 'diem'

export interface DuongVao {
  vai: VaiTro | null
  maCa: string
}

const RE_GV_TREN_DUONG = /(?:^|\/)gv\/?$/
const RE_PHIEU_TREN_DUONG = /(?:^|\/)p\/?$/
const RE_CA_TREN_DUONG = /(?:^|\/)t\/(\d{4,8})\/?$/
const RE_DIEM_TREN_DUONG = /(?:^|\/)d\/(\d{4,8})\/?$/
const RE_APP_CU = /(?:^|\/)(?:hs|ph)\/[0-9a-zA-Z]{8,}\/?$/

/** Link riêng CŨ của em hoặc phụ huynh (`/hs/<token>`, `/ph/<token>`), hoặc
 * app cũ đã cài trên máy các em (`?vai=hs`, `?vai=ph`).
 *
 * Những link này đã phát ra Zalo rồi, không thu về được. Trả về đúng app quản
 * lý của thầy là lỗi thầy đã báo — em và phụ huynh rơi thẳng vào màn quản lý.
 * Nhận diện ở đây để App hiện một màn báo tin, không cho đi tiếp. */
export function laLinkAppCu(search: string, duongDan = ''): boolean {
  const v = (new URLSearchParams(search).get('vai') || '').trim()
  if (v === 'hs' || v === 'ph') return true
  return RE_APP_CU.test(duongDan)
}

/** Đọc vai và mã ca TRỰC TIẾP TỪ ĐƯỜNG DẪN.
 *
 * Vì sao cần: `public/404.html` chỉ chạy khi GitHub Pages trả 404. Máy đã cài
 * service worker thì mọi lần điều hướng được trả thẳng `index.html` — 404.html
 * KHÔNG BAO GIỜ chạy. Đọc thẳng từ đường dẫn thì đúng cả hai đường, và chạy
 * được cả khi mất mạng. */
export function docVaiTuDuongDan(duongDan: string): DuongVao {
  if (RE_GV_TREN_DUONG.test(duongDan)) return { vai: 'gv', maCa: '' }
  if (RE_PHIEU_TREN_DUONG.test(duongDan)) return { vai: 'phieu', maCa: '' }
  const d = duongDan.match(RE_DIEM_TREN_DUONG)
  if (d) return { vai: 'diem', maCa: d[1] }
  const c = duongDan.match(RE_CA_TREN_DUONG)
  if (c) return { vai: null, maCa: c[1] }
  return { vai: null, maCa: '' }
}

/**
 * ĐỔI ĐƯỜNG DẪN THÀNH THAM SỐ TRUY VẤN, chạy TRƯỚC khi app khởi động.
 *
 * Làm đúng việc `public/404.html` vẫn làm, nhưng ở trong app. Chuẩn hoá ngay từ
 * đầu để mọi màn chỉ thấy MỘT dạng URL: màn làm bài đọc `?examCode=` để tự điền
 * 6 ô mã ca và `?api=` để biết link Apps Script.
 */
export function chuanHoaDuongDan(goc = '/'): void {
  try {
    const d = docVaiTuDuongDan(location.pathname)
    if (!d.vai && !d.maCa) return
    const q = new URLSearchParams(location.search)
    if (d.vai && !q.get('vai')) q.set('vai', d.vai)
    if (d.maCa && !q.get('examCode')) q.set('examCode', d.maCa)
    // GIỮ NGUYÊN PHẦN SAU DẤU `#`. Cả dữ liệu phiếu nằm ở đó — viết lại URL mà
    // bỏ hash là phụ huynh mở link ra thấy phiếu trống.
    history.replaceState(null, '', goc + `?${q.toString()}` + location.hash)
  } catch {
    // trình duyệt cũ không có history.replaceState — app vẫn đọc được vai từ
    // đường dẫn qua docDuongVao(search, pathname)
  }
}

/** Đọc vai từ đường link: tham số truy vấn trước, rồi tới đường dẫn. */
export function docDuongVao(search: string, duongDan = ''): DuongVao {
  const q = new URLSearchParams(search)
  const maCa = (q.get('examCode') || '').trim()
  const vaiQ = (q.get('vai') || '').trim()
  if (vaiQ === 'gv') return { vai: 'gv', maCa }
  if (vaiQ === 'phieu') return { vai: 'phieu', maCa: '' }
  if (vaiQ === 'diem') return { vai: 'diem', maCa }

  const tuDuong = duongDan ? docVaiTuDuongDan(duongDan) : null
  if (tuDuong && (tuDuong.vai || tuDuong.maCa)) {
    return { vai: tuDuong.vai, maCa: maCa || tuDuong.maCa }
  }
  return { vai: null, maCa }
}

/** ĐƯỜNG NÀY CÓ PHẢI APP QUẢN LÝ CỦA THẦY KHÔNG — MATKHAUMOAPP.md mục 2.3.
 *
 * Chỉ đường này mới hỏi mật khẩu. Sai chỗ này là cả ca thi đứng hình, nên nó
 * viết theo lối LOẠI TRỪ và có phép kiểm cho từng đường của học sinh, phụ huynh:
 *
 *   `/t/<mã ca>` · `?examCode=…`  → vào thi
 *   `/p#<mã>`    · `?vai=phieu`   → báo cáo phụ huynh
 *   `/hs/<token>` · `/ph/<token>` → link riêng cũ
 *
 * Còn lại (`/` trần và `/gv`) là app của thầy. */
export function laManThayQuanLy(search: string, duongDan = ''): boolean {
  if (laLinkAppCu(search, duongDan)) return false
  const d = docDuongVao(search, duongDan)
  if (d.vai === 'phieu' || d.vai === 'diem') return false
  if (d.maCa) return false
  // ĐƯỜNG NÓI RÕ `gv` LUÔN THẮNG CỜ. Bản đầu của bản vá này hỏi cờ trước, nên
  // trên máy thầy từng mở link thi thử thì gõ `?vai=gv` cũng không vào được màn
  // quản lý — phép kiểm bắt ngay.
  if (d.vai === 'gv') return true
  // `/` TRẦN: theo VAI MÁY NÀY ĐÃ DÙNG, không mặc định là màn thầy.
  //
  // Thầy báo 09/09 17:45, giữa ca thi: em làm đúng hướng dẫn "Thêm vào Màn hình
  // chính" rồi mở từ biểu tượng thì ra APP GIÁO VIÊN, không vào thi được.
  // Nguyên nhân: `start_url` của manifest là `./`, nên biểu tượng luôn mở
  // `/omr-app/` TRẦN — mất sạch `/t/<mã ca>` mà em thêm từ đó. Mà `/` trần thì
  // hàm này vẫn trả `true` ⇒ màn quản lý. Hướng dẫn của chính app dẫn em vào
  // ngõ cụt.
  //
  // Nay `/` trần hỏi máy: máy này lần gần nhất vào bằng vai nào. Máy chưa từng
  // dùng thì GIỮ NGUYÊN hành vi cũ (màn thầy) — không đổi gì cho máy mới.
  if (vaiDaDung() === 'hs') return false
  return true
}

const KHOA_VAI_DA_DUNG = 'ddh.vaiDaDung'

/** Máy này lần gần nhất vào bằng vai nào: `'hs'` (vào thi) · `'gv'` (quản lý) ·
 * `null` (chưa từng). Chỉ dùng để quyết `/` trần — mọi đường có vai rõ ràng đều
 * thắng cờ này. */
export function vaiDaDung(): 'hs' | 'gv' | null {
  try {
    const v = localStorage.getItem(KHOA_VAI_DA_DUNG)
    return v === 'hs' || v === 'gv' ? v : null
  } catch {
    return null
  }
}

/** Ghi lại vai vừa dùng. Gọi khi app khởi động với một đường CÓ vai rõ ràng. */
export function nhoVaiDaDung(vai: 'hs' | 'gv'): void {
  try {
    localStorage.setItem(KHOA_VAI_DA_DUNG, vai)
  } catch {
    // máy chặn localStorage — `/` trần giữ hành vi cũ, không vỡ gì
  }
}
