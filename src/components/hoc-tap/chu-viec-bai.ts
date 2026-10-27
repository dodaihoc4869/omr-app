// CHỮ NHỎ TRÊN THẺ BÀI LỘ TRÌNH «Trong» (thầy 27/10, ảnh: «0 câu tự làm · 0 câu học có hỗ trợ» ngay dưới «Đủ 93/92 câu hôm nay!» mà thẻ «16/16 chặng»).
// Dòng `viec` của Gói 7 là số CÒN LẠI của ngày (tự làm + có hỗ trợ = mức − đã làm) — đứng một mình trên thẻ, em đọc thành số đã làm. Nay:
//   đủ mức ⇒ «Đã làm 93 câu hôm nay» (số thật, cùng thẻ «Đủ x/y câu») · chưa đủ ⇒ «Còn 12 câu tự làm · 4 câu học có hỗ trợ».
// Dòng không phải số câu Gói 7 (Hành trình «Nền · Chặng 2/4») giữ nguyên. Ở mảnh «Trong» (nạp lười) ⇒ không thêm byte vào khối nạp sẵn.
import type { SoHomNay } from './lam-bai'

export const chuViecBai = (viec: string | undefined, so: SoHomNay | null | undefined): string | undefined =>
  !viec || !so || !/^\d+ câu tự làm/.test(viec) ? viec : so.daLam >= so.muc ? `Đã làm ${so.daLam} câu hôm nay` : `Còn ${viec}`
