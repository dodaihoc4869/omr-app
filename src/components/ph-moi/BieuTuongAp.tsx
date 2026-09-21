// Biểu tượng nét mảnh (tinh thần SF Symbols) cho màn chính kiểu Apple của app phụ huynh — vẽ tay theo mẫu docs/ban-ve-ph-apple-2109/ph-b-man-chinh.html, KHÔNG thêm tệp biểu tượng. Lớp `phm-ap-i` (ph-apple.css) đặt cỡ/nét.
import type { SVGProps } from 'react'

function Bt({ d, lop, ...p }: { d: string[]; lop?: string } & Omit<SVGProps<SVGSVGElement>, 'd'>) {
  return (
    <svg className={`phm-ap-i${lop ? ` ${lop}` : ''}`} aria-hidden="true" focusable="false" viewBox="0 0 24 24" {...p}>
      {d.map((x) => (
        <path key={x} d={x} />
      ))}
    </svg>
  )
}

/** Máy bay giấy: "Giao thêm bài cho con". */
export const BtGui = () => <Bt d={['M21 3 10.2 13.8', 'm21 3-6.6 18-4.2-7.2L3 9.6z']} />
/** Đổi qua lại: "Đổi số báo danh". */
export const BtDoi = () => <Bt d={['M7.5 4 4 7.5 7.5 11', 'M4 7.5h13', 'M16.5 13 20 16.5 16.5 20', 'M20 16.5H7']} />
/** Mũi tên › cuối hàng bấm được. */
export const BtMui = () => <Bt lop="phm-ap-i--mui" d={['m9 5 7 7-7 7']} />

/** Vòng tròn + dấu tích: "đã đạt" / "đã giao". */
export const BtTich = () => (
  <svg className="phm-ap-i" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.4 2.8 2.8 5.2-6" />
  </svg>
)
/** Vòng tròn + kim đồng hồ: "chưa đạt". */
export const BtDongHo = () => (
  <svg className="phm-ap-i" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)
/** Vòng tròn + chấm than: lời từ chối / lỗi thật của máy chủ. */
export const BtChamThan = () => (
  <svg className="phm-ap-i" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.6v5.4" />
    <path d="M12 16.4h.01" />
  </svg>
)
/** Hình người: ảnh tròn khi chưa có tên con (nút tài khoản luôn có để còn "Đổi số báo danh"). */
export const BtNguoi = () => (
  <svg className="phm-ap-i" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20c.7-3.6 3.6-5.6 7.2-5.6s6.5 2 7.2 5.6" />
  </svg>
)
/** Hai mũi tên xoay: "Thử lại". */
export const BtXoay = () => <Bt lop="phm-ap-i--s" d={['M20 12a8 8 0 1 1-2.6-5.9', 'M20 4v4.5h-4.5']} />
