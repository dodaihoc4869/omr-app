// BÌNH PHẢN ỨNG — GIỮ MÀN MÁY EM LUÔN SÁNG (thầy 10/11 «app hs tự giữ màn hình luôn sáng luôn nhé cho mọi điện thoại»). Phạm vi: từ lúc phòng nối (em đã
// điểm danh, máy nhận `viewEm`) tới khi thầy kết thúc buổi — kể cả lúc màn BPU đang ẩn chờ lượt. Ngoài buổi học KHÔNG giữ (tốn pin).
// Nằm trong mảnh BPU nạp lười ⇒ video dự phòng (~0,85 KB) không vào đường mở /hs.
//  1. `navigator.wakeLock` (Chrome Android ≥ 84, Safari iOS ≥ 16.4): trang ẩn thì trình duyệt tự nhả ⇒ trang hiện lại / bị nhả khi đang hiện ⇒ xin lại.
//  2. Không có wakeLock / bị từ chối (iPhone < iOS 16.4) ⇒ DỰ PHÒNG kiểu NoSleep: video câm, lặp, `playsinline`, 16×16, 2 khung hình đen (MP4 H.264 nhúng
//     data URI). Video câm được tự phát trên iOS; tự phát bị chặn (Chế độ nguồn điện thấp) ⇒ chờ lần chạm (`touchend` / `click` — `pointerdown` cảm ứng
//     KHÔNG được tính là thao tác của người dùng) bắt ở `document` (màn BPU có thể đang ẩn).
//  3. App cài ra màn hình chính trên iOS (`navigator.standalone`, iOS < 18.4: wakeLock báo thành công mà không giữ được — lỗi WebKit) ⇒ chạy CẢ video.
// Trả về hàm nhả: nhả wakeLock, dừng + gỡ nguồn video, gỡ mọi sự kiện.
const VIDEO = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMHbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAlZ0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAHObWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAAAgABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABeW1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAATlzdGJsAAAAuXN0c2QAAAAAAAAAAQAAAKlhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAAEABIAAAASAAAAAAAAAABDExhdmMgbGlieDI2NAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAL2F2Y0MBQsAe/+EAFmdCwB7ZHsBEAAADAAQAAAMACDxYuSABAAZoy4BlLIAAAAAQcGFzcAAAAAEAAAABAAAAFGJ0cnQAAAAAAAAAZAAAAGQAAAAYc3R0cwAAAAAAAAABAAAAAgAAQAAAAAAUc3RzcwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAAAgAAAAEAAAAcc3RzegAAAAAAAAAAAAAAAgAAAA8AAAAKAAAAFHN0Y28AAAAAAAAAAQAAAzcAAAA9dWR0YQAAADVtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAAhpbHN0AAAACGZyZWUAAAAhbWRhdAAAAAtliIQFvJigACFPgAAAAAZBmjgK+oA='

type KhoaMan = { release: () => Promise<void>; addEventListener?: (t: 'release', f: () => void) => void }

export function giuSang(): () => void {
  const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<KhoaMan> }; standalone?: boolean }
  let dung = false, khoa: KhoaMan | null = null, dangXin = false, hongWl = !nav.wakeLock, video: HTMLVideoElement | null = null, choCham = false
  const canVideo = () => hongWl || nav.standalone === true

  const boCham = () => { choCham = false; document.removeEventListener('touchend', cham, true); document.removeEventListener('click', cham, true) }
  function cham() { boCham(); phatVideo() }
  const henCham = () => { if (choCham || dung) return; choCham = true; document.addEventListener('touchend', cham, true); document.addEventListener('click', cham, true) }
  function phatVideo() {
    if (dung || document.hidden) return
    if (!video) {
      video = document.createElement('video')
      video.muted = true; video.loop = true; video.playsInline = true
      video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', ''); video.setAttribute('aria-hidden', 'true')
      video.src = VIDEO
    }
    try {
      const p = video.play() as Promise<void> | undefined
      if (p && typeof p.then === 'function') p.then(() => { if (choCham) boCham() }, () => henCham())
    } catch { henCham() }
  }
  const xin = () => {
    if (dung || document.hidden) return
    if (canVideo()) phatVideo()
    if (hongWl || khoa || dangXin || !nav.wakeLock) return
    dangXin = true
    nav.wakeLock.request('screen').then((k) => {
      dangXin = false
      if (dung) { void k.release().catch(() => {}); return }
      khoa = k
      // Hệ thống nhả khi trang vẫn hiện (pin yếu…) ⇒ xin lại; trang ẩn ⇒ đợi visibilitychange.
      k.addEventListener?.('release', () => { if (khoa === k) khoa = null; if (!dung && !document.hidden) xin() })
    }, () => { dangXin = false; hongWl = true; phatVideo() })
  }
  const doi = () => { if (document.hidden) { khoa = null } else xin() }
  xin()
  document.addEventListener('visibilitychange', doi)
  return () => {
    dung = true
    document.removeEventListener('visibilitychange', doi)
    boCham()
    const k = khoa; khoa = null; void k?.release().catch(() => {})
    if (video) { try { video.pause(); video.removeAttribute('src'); video.load() } catch { /* bỏ qua */ } video = null }
  }
}
