// VAI TRÒ (BA-APP.md đợt 1) — một mã nguồn, ba giao diện. Vai do ĐƯỜNG LINK
// quyết định, không do người dùng tự chọn:
//   /gv                  → thầy (còn phải có mã bí mật trong máy mới gọi được lệnh)
//   /hs/<token>          → học sinh
//   /ph/<token>          → phụ huynh
//   /t/<mã ca>           → vào thi (giữ nguyên từ trước)
// public/404.html đổi các đường trên thành ?vai=...&token=... rồi mới vào app.
//
// Đây CHỈ là chuyện hiển thị. Chặn thật nằm ở Apps Script: lệnh của thầy đòi
// mã bí mật, lệnh của em/phụ huynh tra token ra SBD ở máy chủ.
export type VaiTro = 'gv' | 'hs' | 'ph'

export interface DuongVao {
  vai: VaiTro | null
  token: string
  maCa: string
}

const DAI_TOKEN = 32

export function tokenHopLe(token: string): boolean {
  return /^[A-Za-z0-9]{32}$/.test(token) && token.length === DAI_TOKEN
}

/**
 * Đọc vai từ đường link.
 *
 * VAI KHÔNG ĐÒI TOKEN TRONG LINK. App đã cài ra màn hình chính mở bằng
 * `start_url` của manifest — `?vai=hs&nguon=pwa`, KHÔNG có token, vì token là
 * của riêng từng em, không nhét vào file manifest chung được. Token đã nằm sẵn
 * trong máy (IndexedDB) từ lần đầu em bấm link riêng thầy gửi.
 *
 * Trước đây hàm này đòi token hợp lệ mới nhận vai, nên mở app đã cài sẽ rơi về
 * `vai: null` và app hiện MÀN QUẢN LÝ CỦA THẦY — sai màn hoàn toàn.
 *
 * Vai chỉ quyết định HIỂN THỊ. Chặn thật vẫn ở Apps Script: mọi lệnh đọc dữ
 * liệu một em đều tra token ra SBD ở máy chủ, nên gõ tay `?vai=hs` không đọc
 * được gì nếu máy không có token.
 */
const RE_TOKEN_TREN_DUONG = /(?:^|\/)(hs|ph)\/([A-Za-z0-9]{32})\/?$/
const RE_GV_TREN_DUONG = /(?:^|\/)gv\/?$/
const RE_CA_TREN_DUONG = /(?:^|\/)t\/(\d{4,8})\/?$/

/**
 * Đọc vai và mã ca TRỰC TIẾP TỪ ĐƯỜNG DẪN (`/omr-app/hs/<token>`).
 *
 * Vì sao cần: `public/404.html` là thứ đổi `/hs/<token>` thành
 * `?vai=hs&token=…`, và nó chỉ chạy khi GitHub Pages trả 404. Nhưng khi máy đã
 * cài service worker, mọi lần điều hướng đều được service worker trả thẳng
 * `index.html` — 404.html KHÔNG BAO GIỜ chạy. App thấy đường trống, không có
 * vai, và mở màn quản lý của thầy. Thầy đã dính đúng lỗi này: bấm link riêng
 * thì vào app giáo viên, và vì không phải vai em/phụ huynh nên dải "Cài đặt"
 * cũng không hiện ra.
 *
 * Đọc thẳng từ đường dẫn thì đúng cả hai đường: 404.html chuyển hướng (máy
 * chưa cài) hay service worker trả index.html (máy đã cài) — và chạy được cả
 * khi mất mạng.
 */
export function docVaiTuDuongDan(duongDan: string): DuongVao {
  const m = duongDan.match(RE_TOKEN_TREN_DUONG)
  if (m) return { vai: m[1] as 'hs' | 'ph', token: m[2], maCa: '' }
  if (RE_GV_TREN_DUONG.test(duongDan)) return { vai: 'gv', token: '', maCa: '' }
  const c = duongDan.match(RE_CA_TREN_DUONG)
  if (c) return { vai: null, token: '', maCa: c[1] }
  return { vai: null, token: '', maCa: '' }
}

/**
 * Đọc vai từ đường link: tham số truy vấn trước, rồi tới đường dẫn.
 *
 * VAI KHÔNG ĐÒI TOKEN TRONG LINK. App đã cài ra màn hình chính mở bằng
 * `start_url` của manifest — `?vai=hs&nguon=pwa`, KHÔNG có token, vì token là
 * của riêng từng em, không nhét vào file manifest chung được. Token đã nằm sẵn
 * trong máy (IndexedDB) từ lần đầu em bấm link riêng thầy gửi.
 *
 * Vai chỉ quyết định HIỂN THỊ. Chặn thật vẫn ở Apps Script: mọi lệnh đọc dữ
 * liệu một em đều tra token ra SBD ở máy chủ, nên gõ tay `?vai=hs` không đọc
 * được gì nếu máy không có token.
 */
export function docDuongVao(search: string, duongDan = ''): DuongVao {
  const q = new URLSearchParams(search)
  const vaiRaw = (q.get('vai') || '').trim()
  const token = (q.get('token') || '').trim()
  const maCa = (q.get('examCode') || '').trim()

  if (vaiRaw === 'gv') return { vai: 'gv', token: '', maCa }
  if (vaiRaw === 'hs' || vaiRaw === 'ph') {
    return { vai: vaiRaw, token: tokenHopLe(token) ? token : '', maCa }
  }

  const tuDuong = duongDan ? docVaiTuDuongDan(duongDan) : null
  if (tuDuong && (tuDuong.vai || tuDuong.maCa)) {
    return { vai: tuDuong.vai, token: tuDuong.token, maCa: maCa || tuDuong.maCa }
  }
  return { vai: null, token: '', maCa }
}

/** Xoá TOKEN khỏi thanh địa chỉ sau khi app đã lưu vào máy — link dán nhầm vào
 * nhóm chat thì cũng không còn nằm trong lịch sử trình duyệt của em.
 *
 * GIỮ LẠI `vai`: nó không phải bí mật, và xoá nó đi thì em kéo tải lại trang
 * trong app đã cài là rơi về màn quản lý của thầy. */
export function xoaDauVetToken(goc = '/'): void {
  try {
    const q = new URLSearchParams(location.search)
    // Token nằm ngay trên ĐƯỜNG DẪN (/omr-app/hs/<token>) khi service worker
    // trả thẳng index.html — cũng phải dọn, nếu không token vẫn nằm trong lịch
    // sử trình duyệt và trên thanh địa chỉ.
    const tuDuong = docVaiTuDuongDan(location.pathname)
    const tokenTrenDuong = !!(tuDuong.vai && tuDuong.token)
    if (!q.get('token') && !tokenTrenDuong) return
    q.delete('token')
    if (tokenTrenDuong && !q.get('vai')) q.set('vai', tuDuong.vai as string)
    const con = q.toString()
    const duong = tokenTrenDuong ? goc : location.pathname
    history.replaceState(null, '', duong + (con ? `?${con}` : ''))
  } catch {
    // trình duyệt cũ không có history.replaceState — bỏ qua, không ảnh hưởng chức năng
  }
}

const KHOA_VAI = 'ddh.vai'

/** Nhớ vai trên MÁY EM / MÁY PHỤ HUYNH, để mở app bằng đường trống (bookmark,
 * trình duyệt khôi phục tab) vẫn vào đúng app chứ không rơi về màn của thầy.
 * KHÔNG nhớ vai `gv` — máy thầy nhận ra bằng mã bí mật, không cần đánh dấu. */
export function nhoVai(vai: VaiTro): void {
  if (vai !== 'hs' && vai !== 'ph') return
  try {
    localStorage.setItem(KHOA_VAI, vai)
  } catch {
    // trình duyệt chặn storage — vẫn chạy được bằng vai trên đường link
  }
}

/** Vai đã nhớ. Máy thầy (có mã bí mật) thì bỏ qua hoàn toàn: thầy có thể đã
 * mở thử link phụ huynh, không được vì thế mà biến máy thầy thành máy phụ huynh. */
export function vaiDaNho(coMaBiMat: boolean): VaiTro | null {
  if (coMaBiMat) return null
  try {
    const v = localStorage.getItem(KHOA_VAI)
    return v === 'hs' || v === 'ph' ? v : null
  } catch {
    return null
  }
}

export function quenVai(): void {
  try {
    localStorage.removeItem(KHOA_VAI)
  } catch {
    // không xoá được thì thôi
  }
}

/** Màn mặc định của từng vai. */
export function manDauCua(vai: VaiTro): 'examhub' | 'studentprofile' | 'parent' {
  if (vai === 'hs') return 'studentprofile'
  if (vai === 'ph') return 'parent'
  return 'examhub'
}
