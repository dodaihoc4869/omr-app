// BÌNH PHẢN ỨNG — NGHE PHÍM P «Cả lớp làm» TỪ TỜ CHIẾU (thầy 06/11). Gắn một lần khi app dựng tờ chiếu (`taoHtmlMayChieu`) ⇒ cả 5 nơi chiếu đề cùng có.
// Tờ chiếu (khung trong app / cửa sổ app mở) gửi `{ nguon: 'to-chieu', loai: 'bpu', qid }` ⇒ nạp lười bảng chiếu (src/components/bpu/gan-gv.tsx).

/** Tin từ tờ chiếu có đúng dạng không. */
export function laTinBpu(d: unknown): d is { nguon: 'to-chieu'; loai: 'bpu'; qid: string } {
  const x = d as { nguon?: unknown; loai?: unknown; qid?: unknown } | null
  return !!x && x.nguon === 'to-chieu' && x.loai === 'bpu' && typeof x.qid === 'string' && x.qid.length > 0 && x.qid.length <= 200
}
let daNghe = false
export function ngheBpuToChieu(): void {
  if (daNghe || typeof window === 'undefined') return
  daNghe = true
  window.addEventListener('message', (e: MessageEvent) => {
    if (!laTinBpu(e.data)) return
    const tuKhung = [...document.querySelectorAll('iframe')].some((f) => f.contentWindow === e.source)
    if (!tuKhung && e.origin !== window.location.origin && e.origin !== 'null') return
    const qid = e.data.qid
    void import('../../components/bpu/gan-gv').then((m) => m.moBangTuToChieu(qid)).catch(() => {})
  })
}
