// ĐƯỜNG VÀO APP GIÁO VIÊN.
//
// Repo này CHỈ còn app của thầy. App học sinh và app phụ huynh đã tách sang hai
// repo riêng (TACHAPPHSPH.md phần 1), nên ở đây không còn `/hs/<token>`,
// `/ph/<token>`, `?vai=hs`, `?vai=ph`, cũng không còn màn nào của hai vai đó.
//
// Còn đúng hai đường:
//   /gv          → app giáo viên (mọi lệnh vẫn đòi MÃ BÍ MẬT ở Apps Script)
//   /t/<mã ca>   → màn LÀM BÀI, giữ lại để lớp vẫn thi và làm bài tập được
//                  trong lúc app học sinh mới chưa xong. Khi hs-app chạy thật
//                  thì gỡ nốt màn này khỏi đây.
//
// `public/404.html` đổi hai đường trên thành `?vai=gv` / `?examCode=…` khi máy
// chưa cài service worker; `chuanHoaDuongDan()` làm đúng việc đó ở trong app,
// nên máy đã cài app (service worker nuốt mất 404.html) vẫn chạy đúng.
export type VaiTro = 'gv'

export interface DuongVao {
  vai: VaiTro | null
  maCa: string
}

const RE_GV_TREN_DUONG = /(?:^|\/)gv\/?$/
const RE_CA_TREN_DUONG = /(?:^|\/)t\/(\d{4,8})\/?$/
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
    history.replaceState(null, '', goc + `?${q.toString()}`)
  } catch {
    // trình duyệt cũ không có history.replaceState — app vẫn đọc được vai từ
    // đường dẫn qua docDuongVao(search, pathname)
  }
}

/** Đọc vai từ đường link: tham số truy vấn trước, rồi tới đường dẫn. */
export function docDuongVao(search: string, duongDan = ''): DuongVao {
  const q = new URLSearchParams(search)
  const maCa = (q.get('examCode') || '').trim()
  if ((q.get('vai') || '').trim() === 'gv') return { vai: 'gv', maCa }

  const tuDuong = duongDan ? docVaiTuDuongDan(duongDan) : null
  if (tuDuong && (tuDuong.vai || tuDuong.maCa)) {
    return { vai: tuDuong.vai, maCa: maCa || tuDuong.maCa }
  }
  return { vai: null, maCa }
}
