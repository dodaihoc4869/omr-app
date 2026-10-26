// RUNG PHẢN HỒI kiểu Duolingo (thầy 26/10: «Các nút chọn phản hồi rung như dolingo nhé») — nhỏ, không phụ thuộc gì. Chỉ ở các màn LUYỆN của app học
// sinh «Trong» (làm chặng, Kiểm tra ôn tập, Tự sửa lỗi, Tu luyện); KHÔNG gắn ở màn thi thật. Nằm trong mảnh nạp lười của các màn ấy (không vào nhóm mở app).
// Android: navigator.vibrate(mẫu). iPhone (không có vibrate): mẹo iOS 18+ — bấm nhãn của một `<input type="checkbox" switch>` ẩn (dựng một lần) cho một
// nhịp rung nhẹ. Mọi lỗi im lặng. Tắt khi không có <html data-trong="hs"> hoặc em tắt trong menu (localStorage 'ddh.rung' = 'tat').
export type KieuPhanHoi = 'chon' | 'dung' | 'sai' | 'xong'
export const MAU_RUNG: Record<KieuPhanHoi, number[]> = { chon: [10], dung: [18], sai: [35, 60, 35], xong: [20, 40, 20, 40, 60] }

/** Được phản hồi (rung / tiếng) không: chỉ app học sinh «Trong», và em chưa tắt công tắc `khoa` trong menu. */
export function duocPhanHoi(khoa: 'ddh.rung' | 'ddh.am'): boolean {
  if (typeof document === 'undefined' || document.documentElement.dataset.trong !== 'hs') return false
  try { return localStorage.getItem(khoa) !== 'tat' } catch { return true }
}

let nhanIos: HTMLLabelElement | null = null
function nhipIos() {
  if (!nhanIos) {
    const o = document.createElement('input')
    o.type = 'checkbox'; o.id = 'ddh-rung-ios'; o.setAttribute('switch', ''); o.tabIndex = -1; o.setAttribute('aria-hidden', 'true')
    const l = document.createElement('label')
    l.htmlFor = o.id; l.setAttribute('aria-hidden', 'true')
    for (const e of [o, l]) e.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
    document.body.append(o, l)
    nhanIos = l
  }
  nhanIos.click()
}

export function rung(kieu: KieuPhanHoi): void {
  if (!duocPhanHoi('ddh.rung')) return
  try {
    const n = navigator as Navigator & { vibrate?: (mau: number | number[]) => boolean }
    if (typeof n.vibrate === 'function') { n.vibrate(MAU_RUNG[kieu]); return }
    nhipIos()
  } catch { /* máy không rung được: bỏ qua */ }
}
