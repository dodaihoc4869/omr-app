// Nút bật/tắt "Dịu mắt" của màn làm bài — dùng chung cho thanh trên bố cục dọc (M3 lẫn thanh cũ) và cụm A−/A+ của bố cục ngang.
// Chỉ trình bày: trạng thái và hành động do màn thi truyền vào (src/lib/diu-mat.ts).
import { SunDim } from 'lucide-react'
import '../screens/diu-mat.css'

/** `chiBieuTuong` (điện thoại xoay ngang, thầy 29/09): CSS ẩn chữ, chỉ còn biểu tượng ⇒ tên nút đặt bằng aria-label. Bố cục khác không đổi. */
export default function NutDiuMat({ bat, onDoi, className = '', chiBieuTuong = false }: { bat: boolean; onDoi: () => void; className?: string; chiBieuTuong?: boolean }) {
  return (
    <button
      type="button"
      className={`nut-diu-mat ${className}`.trim()}
      aria-pressed={bat}
      onClick={onDoi}
      title={bat ? 'Tắt nền dịu mắt' : 'Bật nền dịu mắt (giấy ngà, đỡ chói)'}
      aria-label={chiBieuTuong ? 'Dịu mắt' : undefined}
      data-nut-diu-mat=""
    >
      <SunDim size={16} aria-hidden="true" />
      <span className="nut-diu-mat-chu">Dịu mắt</span>
    </button>
  )
}
