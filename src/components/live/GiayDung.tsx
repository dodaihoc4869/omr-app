// LIVE BẢNG — GIẤY ĐỀ DỰNG TẠI MÁY EM, KIỂU TỜ CHIẾU (thầy 11/11, kèm ảnh máy em: «Chuyển câu bấm lên bảng máy hs bị như thế này» — ô giấy đang hiện THẺ LÀM
// BÀI của em với cụm nút «Đúng | Sai» mờ). Từ nay ô giấy của bảng live (và trình phát «Xem lại Live») LUÔN là giấy đề: số câu + phần, thân đề, rồi các
// phương án / ý là CHỮ ĐỀ («A. …», «a. …») — KHÔNG có nút, ô nhập hay điều khiển trả lời nào, kể cả dạng mờ. Dùng cho đường «dựng thường» (câu có ảnh /
// bảng / sơ đồ, giấy lệch giấy thầy, số đo giấy thầy chưa tới); câu chữ thuần khớp giấy thầy thì vẫn là GiayThay.tsx (xuống dòng y hệt giấy thầy).
// AN TOÀN: chỉ dùng câu công khai của lượt (không đáp án); không dựng lời giải.
import type { ReactNode } from 'react'
import type { BoChu, CauGiay } from './GiayThay'

/** Tên phần của câu trên đầu giấy (dùng chung với giấy soi GiayThay.tsx). */
export const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }

/** Dòng đầu giấy: «Câu 3» + «Phần II · Đúng / Sai» (như đầu giấy của tờ chiếu). */
export function DauGiay({ q, so, tuLuan }: { q: CauGiay; so?: number | null; tuLuan: boolean }) {
  return (
    <div className="lv-gd-dau">
      {so ? <b className="lv-gd-so">Câu {so}</b> : null}
      <span className="lv-gd-phan">Phần {q.phan}{tuLuan ? ' · Tự luận' : TEN_PHAN[q.phan] ? ` · ${TEN_PHAN[q.phan]}` : ''}</span>
    </div>
  )
}
/** Phương án (Phần I: A–D) / ý (Phần II: a–d) là chữ đề; Phần III: dòng nhắc trả lời ngắn / tự luận. Không có điều khiển trả lời. */
export function PhuongAnTinh({ q, Chu, tuLuan }: { q: CauGiay; Chu: BoChu; tuLuan: boolean }): ReactNode {
  if (tuLuan || q.phan === 'III') return <p className="lv-gd-ngan">{tuLuan ? 'Tự luận — em trình bày lời giải đầy đủ lên bảng.' : 'Trả lời ngắn — em viết kết quả và trình bày các bước lên bảng.'}</p>
  const ds = (q.phan === 'II' ? q.ideas : q.choices) ?? [], ky = q.phan === 'II' ? 'abcd' : 'ABCD'
  if (!ds.length) return null
  // phương án trắc nghiệm ngắn ⇒ hai cột như tờ chiếu; ý Đúng / Sai luôn một cột
  const haiCot = q.phan === 'I' && ds.every((x) => String(x ?? '').length <= 28)
  return (
    <div className="lv-gd-pa" data-cot={haiCot ? 2 : 1}>
      {ds.map((x, i) => <div key={i}><b className="lv-gd-ky">{ky[i] ?? i + 1}.</b><span><Chu text={String(x ?? '')} /></span></div>)}
    </div>
  )
}
