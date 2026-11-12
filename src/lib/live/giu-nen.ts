// Giữ tiếng thầy khi em ẩn app / sang app khác / tắt màn (thầy 12/11 tối: «học sinh thoát app ẩn vẫn phải nghe thấy tiếng của thầy,
// giữ kết nối tới lúc kết thúc live»). Đặc tả cũ 4.7 «rời màn ⇒ tiếng ngừng» BỎ: rời màn chỉ còn tắt mic của em + báo tên cho thầy.
// Trình duyệt chỉ giữ trang nền sống khi trang ĐANG PHÁT TIẾNG ⇒ việc của tệp này: (1) khai với hệ điều hành đây là một buổi đang phát
// (thẻ điều khiển ở màn khoá / tai nghe ghi «Thầy đang live», nút tạm dừng không dừng được tiếng); (2) tiếng bị hệ thống ngắt (cuộc gọi,
// app khác chiếm loa) ⇒ tự phát lại.

/** Khai buổi đang phát với hệ điều hành. `phat` = phát lại tiếng thầy. Trả hàm gỡ (gọi khi hết live). */
export function giuTiengNen(phat: () => void): () => void {
  const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined
  if (!ms) return () => {}
  try {
    if (typeof MediaMetadata === 'function') ms.metadata = new MediaMetadata({ title: 'Thầy đang live', artist: 'Lớp Hoá thầy Đỗ Đại Học' })
    ms.playbackState = 'playing'
    ms.setActionHandler('pause', phat) // có hàm xử lý ⇒ trình duyệt KHÔNG tự dừng thẻ tiếng khi em bấm tạm dừng ở màn khoá / tai nghe
    ms.setActionHandler('play', phat)
  } catch { /* trình duyệt cũ */ }
  return () => { try { ms.metadata = null; ms.playbackState = 'none'; ms.setActionHandler('pause', null); ms.setActionHandler('play', null) } catch { /* trình duyệt cũ */ } }
}

/** Thẻ tiếng bị dừng ngoài ý muốn (hệ thống ngắt) ⇒ sau `ms` gọi `thu` (bên gọi tự kiểm còn live / còn luồng rồi phát lại). */
export function ngheBiDung(the: HTMLAudioElement, hen: (f: () => void, ms: number) => unknown, thu: () => void, ms = 800): void {
  the.addEventListener?.('pause', () => { hen(thu, ms) })
}
