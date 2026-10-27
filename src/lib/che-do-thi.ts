// CỜ «ĐANG KIỂM TRA» (thầy 27/10: «Màn làm bài kiểm tra của hs … tự động tắt âm thanh chỉ để rung»). Màn kiểm tra (ca thi ExamTakeScreen, Kiểm tra ôn
// tập ManKiemTraCaNhan) bật cờ khi MỞ, gỡ khi ĐÓNG (useEffect(() => batCheDoThi(), [])). am-thanh.ts / am-thanh-thuong.ts kiểm cờ: đang bật ⇒ KHÔNG
// phát tiếng nào, kể cả khi công tắc «Âm thanh» (localStorage 'ddh.am') đang bật; RUNG (rung.ts) giữ nguyên. Đếm số màn đang mở (hai màn lồng nhau
// vẫn đúng); hàm gỡ chỉ trừ một lần (StrictMode gọi gỡ hai lần vẫn không âm). Mô-đun nhỏ, không phụ thuộc gì — vào được mảnh màn thi mà không kéo âm thanh.
let soMan = 0

/** Bật cờ cho một màn kiểm tra; trả hàm gỡ (gọi lúc màn đóng). */
export function batCheDoThi(): () => void {
  soMan++
  let daGo = false
  return () => {
    if (daGo) return
    daGo = true
    soMan = Math.max(0, soMan - 1)
  }
}

/** Đang có màn kiểm tra mở ⇒ chỉ rung, không tiếng. */
export function dangCheDoThi(): boolean {
  return soMan > 0
}
