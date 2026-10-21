// DẢI "CÒN N CÂU CHƯA LÀM" trong trang làm bài (bản vẽ ThiDangLam/ThiCanhBao): các số câu chưa làm bấm là cuộn tới câu, số đầu tô đậm = câu chưa làm KẾ TIẾP,
// nút "+K" mở lưới đủ câu; hàng "Đã đánh dấu xem lại" liệt kê câu em đánh dấu (kể cả câu đã làm). CHỈ trình bày lại `chuaLam`, tập câu đánh dấu và hai hàm
// ĐÃ CÓ của màn (`cuonToiCau`, mở lưới): không state, không gọi gì mới. Chỉ đường học sinh/phụ huynh (dungM3); từ 880 px lưới câu cột trái đã có nên dải ẩn (CSS).
import { Flag } from 'lucide-react'
import { memo, useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { bangPropsBoQuaHam } from '../lib/so-sanh-props'
import './man-thi-m3.css'

export const SO_CAU_TOI_DA_TREN_DAI = 6

function HangSo({ ds, danhDau, onToiCau, onMoLuoi, kieu }: { ds: number[]; danhDau: ReadonlySet<number>; onToiCau: (stt: number) => void; onMoLuoi: () => void; kieu: 'chua-lam' | 'xem-lai' }) {
  const hien = ds.slice(0, SO_CAU_TOI_DA_TREN_DAI)
  const con = ds.length - hien.length
  return (
    <div className="thi-dai-chua-lam-o">
      {hien.map((c, i) => {
        const dd = danhDau.has(c)
        return (
          <button
            key={c}
            type="button"
            data-ke-tiep={kieu === 'chua-lam' && i === 0 ? 'true' : undefined}
            data-danh-dau={dd ? 'true' : undefined}
            aria-label={dd ? `Tới câu ${c} (đã đánh dấu xem lại)` : `Tới câu ${c}`}
            onClick={() => onToiCau(c)}
          >
            {c}
            {dd && <Flag size={11} aria-hidden="true" fill="currentColor" />}
          </button>
        )
      })}
      {con > 0 && (
        <button type="button" data-them="true" aria-label={`Xem thêm ${con} câu ${kieu === 'chua-lam' ? 'chưa làm' : 'đã đánh dấu'}`} onClick={onMoLuoi}>
          +{con}
        </button>
      )}
    </div>
  )
}

export default function DaiCauChuaLamM3({
  chuaLam,
  daDanhDau = [],
  onToiCau,
  onMoLuoi,
}: {
  chuaLam: number[]
  /** Số câu (1..N) em đã đánh dấu "Xem lại sau" — chỉ để hiện dấu, không ảnh hưởng gì khác. */
  daDanhDau?: number[]
  onToiCau: (stt: number) => void
  onMoLuoi: () => void
}) {
  if (chuaLam.length === 0 && daDanhDau.length === 0) return null
  const dd = new Set(daDanhDau)
  return (
    <section className="thi-dai-chua-lam" aria-label={chuaLam.length > 0 ? `Còn ${chuaLam.length} câu chưa làm` : 'Câu đã đánh dấu xem lại'}>
      {chuaLam.length > 0 && (
        <>
          <div className="thi-dai-chua-lam-dau">
            <span className="thi-dai-chua-lam-so">Còn {chuaLam.length} câu chưa làm</span>
          </div>
          <HangSo ds={chuaLam} danhDau={dd} onToiCau={onToiCau} onMoLuoi={onMoLuoi} kieu="chua-lam" />
        </>
      )}
      {daDanhDau.length > 0 && (
        <>
          <div className="thi-dai-chua-lam-dau">
            <span className="thi-dai-chua-lam-so">Đã đánh dấu xem lại: {daDanhDau.length} câu</span>
          </div>
          <HangSo ds={daDanhDau} danhDau={dd} onToiCau={onToiCau} onMoLuoi={onMoLuoi} kieu="xem-lai" />
        </>
      )}
    </section>
  )
}

/**
 * Khung bọc thẻ câu ở đường M3: nhãn "Mới x/4 ý" (Phần II làm dở) + nút "Xem lại sau" ở góc phải trên. Khung có mặt SUỐT — chỉ nhãn (anh em của thẻ)
 * mọc/biến theo `soY` — nên thẻ câu KHÔNG bị dựng lại khi em bấm (dựng lại = mất tiêu điểm, cuộn nhảy). `soY` = số ý ĐÃ có đáp án (Phần I/III truyền 0).
 * Nút chỉ gọi `onDoiDau`; việc nhớ dấu nằm ở màn thi (lib/xem-lai-sau.ts) và KHÔNG dính gì tới đáp án hay gói nộp.
 */
export function KhungCauM3({ soY, daDanhDau, onDoiDau, children }: { soY: number; daDanhDau: boolean; onDoiDau: () => void; children: ReactNode }) {
  // KHÔNG memo khung (đo máy yếu 21/10): `children` là phần tử thẻ câu MỚI mỗi lần màn thi vẽ lại ⇒ memo khung không bao giờ đứng được, khung + cờ
  // của MỌI thẻ vẽ lại sau mỗi lần chọn. Thẻ câu tự memo; phần góc (nhãn + nút) memo riêng ⇒ mỗi lần chọn chỉ thẻ vừa đổi vẽ lại.
  // Góc memo bỏ qua hàm ⇒ nút gọi qua ref tới `onDoiDau` MỚI NHẤT (đánh dấu câu này không được dùng danh sách dấu cũ, xoá mất dấu câu khác).
  const moiNhat = useRef(onDoiDau)
  useLayoutEffect(() => { moiNhat.current = onDoiDau })
  const doi = useCallback(() => moiNhat.current(), [])
  return (
    <div className="thi-cau-boc">
      {children}
      <GocCauM3 soY={soY} daDanhDau={daDanhDau} onDoiDau={doi} />
    </div>
  )
}

const GocCauM3 = memo(function GocCauM3({ soY, daDanhDau, onDoiDau }: { soY: number; daDanhDau: boolean; onDoiDau: () => void }) {
  return (
    <div className="thi-cau-goc">
      {soY > 0 && soY < 4 && <span className="thi-cau-nhan">Mới {soY}/4 ý</span>}
      <button type="button" className="thi-cau-dau" aria-pressed={daDanhDau} onClick={onDoiDau}>
        <Flag size={15} aria-hidden="true" fill={daDanhDau ? 'currentColor' : 'none'} />
        <span>Xem lại sau</span>
      </button>
    </div>
  )
}, bangPropsBoQuaHam)
