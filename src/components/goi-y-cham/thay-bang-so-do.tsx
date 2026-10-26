// CẦU NỐI «lời giải kiểu sơ đồ» cho mọi chỗ vẽ lời giải (thầy 26/10: «thay luôn toàn bộ lời giải tính toán trong app bằng lời giải kiểu sơ đồ này»).
// Dùng: thay `<KhoiLoiGiaiChuan … />` bằng `<KhoiLoiGiaiCoSoDo … soDo={ketQuaNop.soDo} />` (cùng props + `soDo`).
//   - Không có `soDo` ⇒ đúng `KhoiLoiGiaiChuan` như cũ.
//   - Có `soDo` (làn C, kết quả sau nộp) ⇒ LỜI GIẢI vẽ bằng LoiGiaiSoDo (nạp LƯỜI, mảnh goi-y-cham ngoài precache): sơ đồ + chuỗi tính + kết quả
//     THAY lời giải chữ / bước / kết quả; lý do từng phương án / ý vẫn giữ. Bản hỏng / mảnh tải hỏng (mất mạng) ⇒ lời giải cũ.
// VÌ SAO KHÔNG SỬA THẲNG KhoiLoiGiaiChuan: khối ấy nằm trong lượt MỞ cả ba app; thêm nhánh nạp lười vào đó làm mọi đường tải nặng thêm ~70 byte nén
// (cổng `kiem:toc-do` đỏ — luật tốc độ thầy 13/10). Tệp này nằm ở mảnh của nơi gọi (màn làm chặng, khung lời giải), vài trăm byte.
import { lazy, Suspense, type ReactNode } from 'react'
import KhoiLoiGiaiChuan, { type KhoiLoiGiaiChuanProps } from '../loi-giai/KhoiLoiGiaiChuan'

const LoiGiaiSoDo = lazy(() => import('./LoiGiaiSoDo').catch(() => ({ default: ({ duPhong }: KhoiLoiGiaiChuanProps & { ban: unknown; duPhong: ReactNode }) => <>{duPhong}</> })))

export function KhoiLoiGiaiCoSoDo({ soDo, ...p }: KhoiLoiGiaiChuanProps & { soDo?: unknown }) {
  const cu = <KhoiLoiGiaiChuan {...p} />
  if (!soDo || typeof soDo !== 'object') return cu
  return <Suspense fallback={null}><LoiGiaiSoDo {...p} ban={soDo} duPhong={cu} /></Suspense>
}
