// DẢI "CÒN N CÂU CHƯA LÀM" trong trang làm bài (bản vẽ ThiDangLam/ThiCanhBao): các số câu chưa làm bấm là cuộn tới câu, số đầu tô đậm = câu chưa làm KẾ TIẾP,
// nút "+K" mở lưới đủ câu. CHỈ trình bày lại `chuaLam` và hai hàm ĐÃ CÓ của màn (`cuonToiCau`, mở lưới): không state, không gọi gì mới.
// Chỉ đường học sinh/phụ huynh (dungM3); từ 880 px trở lên lưới câu cột trái đã có nên dải ẩn (CSS).
import type { ReactNode } from 'react'
import './man-thi-m3.css'

export const SO_CAU_TOI_DA_TREN_DAI = 6

export default function DaiCauChuaLamM3({ chuaLam, onToiCau, onMoLuoi }: { chuaLam: number[]; onToiCau: (stt: number) => void; onMoLuoi: () => void }) {
  if (chuaLam.length === 0) return null
  const hien = chuaLam.slice(0, SO_CAU_TOI_DA_TREN_DAI)
  const con = chuaLam.length - hien.length
  return (
    <section className="thi-dai-chua-lam" aria-label={`Còn ${chuaLam.length} câu chưa làm`}>
      <div className="thi-dai-chua-lam-dau">
        <span className="thi-dai-chua-lam-so">Còn {chuaLam.length} câu chưa làm</span>
        <span className="thi-dai-chua-lam-goi-y">chạm số để tới câu</span>
      </div>
      <div className="thi-dai-chua-lam-o">
        {hien.map((c, i) => (
          <button key={c} type="button" data-ke-tiep={i === 0 ? 'true' : undefined} aria-label={`Tới câu ${c}`} onClick={() => onToiCau(c)}>
            {c}
          </button>
        ))}
        {con > 0 && (
          <button type="button" data-them="true" aria-label={`Xem thêm ${con} câu chưa làm`} onClick={onMoLuoi}>
            +{con}
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * Khung bọc thẻ câu Phần II ở đường M3, mang nhãn "Mới x/4 ý" khi câu làm dở (bản vẽ ThiDangLam). Khung có mặt SUỐT — chỉ nhãn (anh em của thẻ)
 * mọc/biến theo `soY` — nên thẻ câu KHÔNG bị dựng lại khi em bấm ý đầu tiên (dựng lại = mất tiêu điểm, cuộn nhảy). `soY` = số ý ĐÃ có đáp án.
 */
export function KhungCauLamDoM3({ soY, children }: { soY: number; children: ReactNode }) {
  return (
    <div className="thi-cau-boc">
      {children}
      {soY > 0 && soY < 4 && <span className="thi-cau-nhan">Mới {soY}/4 ý</span>}
    </div>
  )
}
