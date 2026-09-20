// CẢNH BÁO RỜI MÀN + THẺ KHOÁ BÀI của màn thi thật, bản Material 3 (bản vẽ ThiCanhBao / ThiVaoVaKhoa). CHỈ đổi dáng: câu chữ, mức (nhe/dam), role="alert",
// vị trí dính dưới thanh trên và mọi hành động do màn thi giữ nguyên/truyền vào. Chỉ dùng khi dungM3() (đường học sinh/phụ huynh).
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import './man-thi-m3.css'

/** Dải cảnh báo rời màn: nền errorContainer khi `dam` (lần rời nặng), nền cảnh báo khi `nhe`. `loi` là câu NGUYÊN VĂN của màn thi. */
export function DaiCanhBaoRoiM3({ muc, loi }: { muc: 'nhe' | 'dam'; loi: string }) {
  return (
    <div className="thi-canh-bao" data-muc={muc}>
      <TriangleAlert size={22} aria-hidden="true" />
      <div className="thi-canh-bao-loi">{loi}</div>
    </div>
  )
}

/** Khung của thẻ "BÀI THI ĐÃ KHOÁ": errorContainer, chữ onErrorContainer (thay TheNoiDung). Nội dung bên trong do màn thi truyền vào, không đổi. */
export function KhungKhoaM3({ children }: { children: ReactNode }) {
  return <div className="thi-khoa">{children}</div>
}
