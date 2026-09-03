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

export function docDuongVao(search: string): DuongVao {
  const q = new URLSearchParams(search)
  const vaiRaw = (q.get('vai') || '').trim()
  const token = (q.get('token') || '').trim()
  const maCa = (q.get('examCode') || '').trim()
  const hopLe = /^[A-Za-z0-9]{32}$/.test(token) && token.length === DAI_TOKEN
  if (vaiRaw === 'gv') return { vai: 'gv', token: '', maCa }
  if ((vaiRaw === 'hs' || vaiRaw === 'ph') && hopLe) return { vai: vaiRaw, token, maCa }
  return { vai: null, token: '', maCa }
}

/** Xoá token khỏi thanh địa chỉ sau khi app đã lưu vào máy — link dán nhầm vào
 * nhóm chat thì cũng không còn nằm trong lịch sử trình duyệt của em. */
export function xoaDauVetToken(): void {
  try {
    const q = new URLSearchParams(location.search)
    if (!q.get('token') && !q.get('vai')) return
    q.delete('token')
    q.delete('vai')
    const con = q.toString()
    history.replaceState(null, '', location.pathname + (con ? `?${con}` : ''))
  } catch {
    // trình duyệt cũ không có history.replaceState — bỏ qua, không ảnh hưởng chức năng
  }
}

/** Màn mặc định của từng vai. */
export function manDauCua(vai: VaiTro): 'examhub' | 'studentprofile' | 'parent' {
  if (vai === 'hs') return 'studentprofile'
  if (vai === 'ph') return 'parent'
  return 'examhub'
}
