// EM QUAY LẠI APP ⇒ NỐI LẠI TỨC THÌ (thầy 12/11: «giữ kết nối cho hs, khi hs thoát app vào phát là phải tức thì ngay»).
// Trước: kết nối rớt lúc em rời app thì nối lại theo nhịp lùi dần (1,5 → 20 giây); kết nối «mở» nhưng đã chết (máy ngủ, đổi mạng) phải chờ 2,5 giây mới bỏ.
// Nay, mỗi lần app hiện lại / lấy lại tiêu điểm / có mạng lại:
//   · chưa có kết nối hoặc đã đóng ⇒ nối NGAY, bỏ nhịp lùi dần;
//   · đang «mở» ⇒ gửi `chao` (phòng trả ngay bản xem mới nhất — em thấy đúng màn thầy đang ở); 900 ms không có gì về ⇒ kết nối đã chết, bỏ và nối mới ngay.
// Tách khỏi ManBinhPhanUng.tsx (tệp đã sát trần cỡ); không trạng thái React.
export function ngheVeLai(o: { ws: () => WebSocket | null; noiNgay: () => void; boNoiChet: () => void }): () => void {
  let hen: ReturnType<typeof setTimeout> | undefined, luc = 0
  const ve = (): void => {
    if (document.hidden) return
    const nay = Date.now()
    if (nay - luc < 400) return // visibilitychange + focus + pageshow thường tới cùng lúc
    luc = nay
    const w = o.ws()
    if (!w || w.readyState > 1) { o.noiNgay(); return }
    if (w.readyState !== 1) return // đang nối dở
    let song = false
    const nghe = (): void => { song = true }
    w.addEventListener('message', nghe, { once: true })
    try { w.send('{"t":"chao"}') } catch { w.removeEventListener('message', nghe); o.boNoiChet(); return }
    clearTimeout(hen)
    hen = setTimeout(() => { w.removeEventListener('message', nghe); if (!song && o.ws() === w) o.boNoiChet() }, 900)
  }
  document.addEventListener('visibilitychange', ve)
  window.addEventListener('pageshow', ve)
  window.addEventListener('focus', ve)
  window.addEventListener('online', ve)
  return () => {
    clearTimeout(hen)
    document.removeEventListener('visibilitychange', ve); window.removeEventListener('pageshow', ve); window.removeEventListener('focus', ve); window.removeEventListener('online', ve)
  }
}
