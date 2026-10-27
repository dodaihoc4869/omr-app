// ĐO NHỊP KHUNG THẬT cho chế độ máy yếu (27/10, thầy: «Máy yếu bị lag»): thông số máy trông ổn mà khung hình thật chậm ⇒ gắn lớp `may-yeu`
// ngay và NHỚ cho lần mở sau (`ddh.mayYeu` = '1', src/lib/may-yeu.ts đọc lúc mở app). Chạy từ mảnh nạp lười của cổng học sinh
// (components/cong-hs-nap-luoi.ts — nạp lúc rảnh, sau khi Lộ trình đã hiện) ⇒ đo đúng lúc app đứng yên, không cộng byte lượt mở.
import { KHOA_NHO_MAY_YEU, LOP_MAY_YEU } from './may-yeu'

/** Khung hình thật có chậm không? `ds` = khoảng cách (ms) giữa các khung lúc app ĐỨNG YÊN. Chậm ⇒ trung vị > 25 ms (dưới ~40 khung/s)
 *  hoặc ≥ 6 khung > 50 ms (giật thấy rõ). Quá ít khung (tab ẩn, trình duyệt bóp rAF) ⇒ không kết luận. */
export function nhipKhungCham(ds: readonly number[]): boolean {
  if (ds.length < 20) return false
  const s = [...ds].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]! > 25 || ds.filter((x) => x > 50).length >= 6
}

/** Đo nhịp khung ~2 s, 1,5 s sau khi trang tải xong (không đo lúc đang dựng app). Chậm ⇒ gắn lớp + nhớ. Tab ẩn giữa chừng ⇒ bỏ, không kết luận. */
export function henDoNhipKhung(w: Window): void {
  if (w.document.documentElement.classList.contains(LOP_MAY_YEU)) return
  try { if (w.localStorage?.getItem(KHOA_NHO_MAY_YEU) === '0') return } catch { /* đọc lỗi ⇒ vẫn đo */ }
  const raf = w.requestAnimationFrame?.bind(w)
  if (!raf || typeof w.setTimeout !== 'function') return
  const bat = () => w.setTimeout(() => {
    if (w.document.hidden) return
    const ds: number[] = []
    let truoc = 0
    const het = w.performance.now() + 2000
    const b = (t: number) => {
      if (w.document.hidden) return
      if (truoc) ds.push(t - truoc)
      truoc = t
      if (t < het) { raf(b); return }
      if (!nhipKhungCham(ds)) return
      w.document.documentElement.classList.add(LOP_MAY_YEU)
      try { w.localStorage?.setItem(KHOA_NHO_MAY_YEU, '1') } catch { /* chặn lưu: lần sau đo lại */ }
    }
    raf(b)
  }, 1500)
  if (w.document.readyState === 'complete') bat()
  else w.addEventListener('load', bat, { once: true })
}

