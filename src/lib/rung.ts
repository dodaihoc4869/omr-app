// RUNG PHẢN HỒI kiểu Duolingo (thầy 26/10: «Các nút chọn phản hồi rung như dolingo nhé») — nhỏ, không phụ thuộc gì. Chỉ ở các màn LUYỆN của app học
// sinh «Trong» (làm chặng, Kiểm tra ôn tập, Tự sửa lỗi, Tu luyện); KHÔNG gắn ở màn thi thật. Nằm trong mảnh nạp lười của các màn ấy (không vào nhóm mở app).
// Android: navigator.vibrate(mẫu). iPhone (không có vibrate): mẹo iOS 18+ — bấm nhãn của một `<input type="checkbox" switch>` ẩn (dựng một lần) cho một
// nhịp rung nhẹ. Mọi lỗi im lặng. Tắt khi không có <html data-trong="hs"> hoặc em tắt trong menu (localStorage 'ddh.rung' = 'tat').
export type KieuPhanHoi = 'chon' | 'dung' | 'sai' | 'xong' | 'combo' | 'combo3' | 'combo5' | 'combo10'
// 27/10 (thầy: «chưa thấy rung»): nhịp 10–18 ms quá ngắn — mô-tơ nhiều máy Android (Samsung) không kịp quay ⇒ mọi nhịp bật ≥ 35 ms.
// 27/10 (thầy: «rung siêu xịn như dolingo»): mốc chuỗi đúng liền 3 · 5 · 10 (rồi mỗi 5 câu) rung mạnh dần — nhịp ≥ 35 ms, cú cuối dài nhất.
export const MAU_RUNG: Record<KieuPhanHoi, number[]> = { chon: [35], dung: [60], sai: [80, 70, 80], xong: [60, 50, 60, 50, 140], combo: [40, 40, 40],
  // 27/10 (sét đánh): mỗi mốc mở bằng MỘT nhịp mạnh 120 ms đúng lúc sét đánh
  combo3: [120, 60, 40, 40, 90], combo5: [120, 60, 50, 40, 50, 40, 160], combo10: [120, 60, 60, 40, 60, 40, 60, 60, 240] }

let cacheRung: boolean | null = null
let cacheAm: boolean | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === 'ddh.rung') cacheRung = null
    if (!e.key || e.key === 'ddh.am') cacheAm = null
  })
}

/** Được phản hồi (rung / tiếng) không: chỉ app học sinh «Trong», và em chưa tắt công tắc `khoa` trong menu. */
export function duocPhanHoi(khoa: 'ddh.rung' | 'ddh.am'): boolean {
  if (typeof document === 'undefined' || document.documentElement.dataset.trong !== 'hs') return false
  if (khoa === 'ddh.rung' && cacheRung !== null) return cacheRung
  if (khoa === 'ddh.am' && cacheAm !== null) return cacheAm
  try {
    const bat = localStorage.getItem(khoa) !== 'tat'
    if (khoa === 'ddh.rung') cacheRung = bat
    else cacheAm = bat
    return bat
  } catch { return true }
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
