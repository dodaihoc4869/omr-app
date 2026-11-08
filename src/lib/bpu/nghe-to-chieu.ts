// BÌNH PHẢN ỨNG — NGHE TỜ CHIẾU (thầy 06/11 phím P; 07/11 TỰ ĐỘNG khi chuyển câu). Gắn một lần khi app dựng tờ chiếu (`taoHtmlMayChieu`) ⇒ cả 5 nơi chiếu đề cùng có.
// Tờ chiếu (khung trong app / cửa sổ app mở) gửi `{ nguon: 'to-chieu', loai: 'bpu', qid, giay?, tuDong? }` mỗi lần vào đợt mới (tuDong) hoặc khi thầy bấm P
// ⇒ nạp lười bảng chiếu (src/components/bpu/gan-gv.tsx). Tin tự động chỉ mở bảng khi có buổi điểm danh đang mở (không có ⇒ im lặng, không báo lỗi).

export interface TinBpu { nguon: 'to-chieu'; loai: 'bpu'; qid: string; giay?: number; tuDong?: boolean }
/** Tin từ tờ chiếu có đúng dạng không. */
export function laTinBpu(d: unknown): d is TinBpu {
  const x = d as { nguon?: unknown; loai?: unknown; qid?: unknown } | null
  return !!x && x.nguon === 'to-chieu' && x.loai === 'bpu' && typeof x.qid === 'string' && x.qid.length > 0 && x.qid.length <= 200
}
let daNghe = false
export function ngheBpuToChieu(): void {
  if (daNghe || typeof window === 'undefined') return
  daNghe = true
  window.addEventListener('message', (e: MessageEvent) => {
    const tuKhung = [...document.querySelectorAll('iframe')].some((f) => f.contentWindow === e.source)
    if (!tuKhung && e.origin !== window.location.origin && e.origin !== 'null') return
    const d = e.data as { nguon?: unknown; loai?: unknown; d?: unknown } | null
    if (d && d.nguon === 'to-chieu' && d.loai === 'bpu-het') { void import('../../components/bpu/gan-gv').then((m) => m.baoHetCau(d.d === -1 ? -1 : 1)).catch(() => {}); return }
    // Lời giải thu gọn của đợt đang chiếu (bảng hỏi khi thầy bấm G — hiện ngay trên bảng, không về tờ).
    if (d && d.nguon === 'to-chieu' && d.loai === 'bpu-giai') { const h = (e.data as { html?: unknown }).html; void import('../../components/bpu/gan-gv').then((m) => m.nhanGiai(typeof h === 'string' ? h : '')).catch(() => {}); return }
    // 08/11: thầy chấm em lên bảng trên tờ cũ ⇒ bảng hiện lại, ghi kết quả, mở đáp án.
    if (d && d.nguon === 'to-chieu' && d.loai === 'bpu-cham') { const dat = (e.data as { dat?: unknown }).dat === true; void import('../../components/bpu/gan-gv').then((m) => m.chamTuTo(dat)).catch(() => {}); return }
    if (!laTinBpu(e.data)) return
    const tin = e.data, nguon = e.source as Window | null
    void import('../../components/bpu/gan-gv').then((m) => m.moBangTuToChieu(tin.qid, { giay: Number(tin.giay) || 0, tuDong: tin.tuDong === true, nguon })).catch(() => {})
  })
}
