// CẦU NỐI «lời giải kiểu sơ đồ» cho mọi chỗ vẽ lời giải (thầy 26/10: «thay luôn toàn bộ lời giải tính toán trong app bằng lời giải kiểu sơ đồ này»).
// Dùng: `<KhoiLoiGiaiChuan … thayLoiGiai={thayBangSoDo(ketQuaNop.soDo)} />` — kết quả nộp có `soDo` (làn C) ⇒ phần lời giải chữ / bước / kết quả
// được THAY bằng LoiGiaiSoDo (nạp LƯỜI, mảnh goi-y-cham ngoài precache). Không có `soDo` ⇒ undefined ⇒ lời giải cũ như cũ.
// Bản hỏng / mảnh tải hỏng (mất mạng) ⇒ hiện lại đúng phần lời giải cũ (`cu`). Tệp này nằm ở mảnh của nơi gọi (vài trăm byte), KHÔNG ở khối lời giải
// dùng chung (khối ấy nằm trong lượt mở cả ba app).
import { lazy, Suspense, type ReactNode } from 'react'

const LoiGiaiSoDo = lazy(() => import('./LoiGiaiSoDo').catch(() => ({ default: ({ duPhong }: { ban: unknown; duPhong?: ReactNode }) => <>{duPhong}</> })))

export function thayBangSoDo(soDo: unknown): ((cu: ReactNode) => ReactNode) | undefined {
  if (!soDo || typeof soDo !== 'object') return undefined
  return (cu) => <Suspense fallback={null}><LoiGiaiSoDo ban={soDo} duPhong={cu} /></Suspense>
}
